using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Hayat.Application.Common;
using Hayat.Application.DTOs;
using Hayat.Application.Interfaces;
using Hayat.Domain.Entities;
using Hayat.Infrastructure.Data;

namespace Hayat.Infrastructure.Services
{
    public class DigitalService : IDigitalService
    {
        private readonly AppDbContext _db;

        public DigitalService(AppDbContext db) => _db = db;

        public async Task<ShortcutsTokenStatusDto> GetTokenStatusAsync(int userId)
        {
            var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null) return new ShortcutsTokenStatusDto(false, null, null);
            var token = user.ShortcutsApiToken;
            if (string.IsNullOrEmpty(token)) return new ShortcutsTokenStatusDto(false, null, null);
            return new ShortcutsTokenStatusDto(true, Preview(token), null);
        }

        public async Task<ShortcutsTokenCreatedDto> CreateOrRotateTokenAsync(int userId)
        {
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId)
                ?? throw new InvalidOperationException("User not found");
            var token = GenerateToken();
            user.ShortcutsApiToken = token;
            await _db.SaveChangesAsync();
            return new ShortcutsTokenCreatedDto(token, Preview(token));
        }

        public async Task<bool> RevokeTokenAsync(int userId)
        {
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null) return false;
            user.ShortcutsApiToken = null;
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<int?> ResolveUserIdByTokenAsync(string token)
        {
            if (string.IsNullOrWhiteSpace(token)) return null;
            var trimmed = token.Trim();
            var user = await _db.Users.AsNoTracking()
                .FirstOrDefaultAsync(u => u.ShortcutsApiToken == trimmed);
            return user?.Id;
        }

        public async Task<UpsertDailyStepsResultDto> UpsertStepsAsync(int userId, UpsertDailyStepsRequest request)
        {
            if (request.Days == null || request.Days.Count == 0)
                return new UpsertDailyStepsResultDto(0, 0);

            var source = string.IsNullOrWhiteSpace(request.Source) ? "shortcuts" : request.Source.Trim();
            var today = AppTime.Today;
            var minDate = today.AddDays(-30);
            var upserted = 0;
            var skipped = 0;
            var now = DateTime.UtcNow;

            foreach (var item in request.Days)
            {
                if (item.Steps < 0 || item.Date < minDate || item.Date > today.AddDays(1))
                {
                    skipped++;
                    continue;
                }

                var existing = await _db.DailyStepLogs
                    .FirstOrDefaultAsync(s => s.UserId == userId && s.Date == item.Date);
                if (existing == null)
                {
                    _db.DailyStepLogs.Add(new DailyStepLog
                    {
                        UserId = userId,
                        Date = item.Date,
                        Steps = item.Steps,
                        Source = source,
                        SyncedAt = now
                    });
                }
                else
                {
                    existing.Steps = item.Steps;
                    existing.Source = source;
                    existing.SyncedAt = now;
                }
                upserted++;
            }

            await _db.SaveChangesAsync();
            return new UpsertDailyStepsResultDto(upserted, skipped);
        }

        public async Task<IReadOnlyList<DailyStepDto>> GetStepsAsync(int userId, DateOnly from, DateOnly to)
        {
            if (to < from) (from, to) = (to, from);
            return await _db.DailyStepLogs.AsNoTracking()
                .Where(s => s.UserId == userId && s.Date >= from && s.Date <= to)
                .OrderBy(s => s.Date)
                .Select(s => new DailyStepDto(s.Date, s.Steps, s.Source, s.SyncedAt))
                .ToListAsync();
        }

        public async Task<UpsertScreenTimeResultDto> UpsertScreenTimeAsync(int userId, UpsertScreenTimeRequest request)
        {
            if (request.Days == null || request.Days.Count == 0)
                return new UpsertScreenTimeResultDto(0, 0);

            var today = AppTime.Today;
            var minDate = today.AddDays(-30);
            var upserted = 0;
            var dayCount = 0;
            var now = DateTime.UtcNow;

            foreach (var day in request.Days)
            {
                if (day.Date < minDate || day.Date > today.AddDays(1)) continue;
                if (day.Entries == null || day.Entries.Count == 0) continue;
                dayCount++;

                // Replace-day strategy: clear existing rows for that date, then insert.
                var existing = await _db.ScreenTimeLogs
                    .Where(s => s.UserId == userId && s.Date == day.Date)
                    .ToListAsync();
                if (existing.Count > 0)
                    _db.ScreenTimeLogs.RemoveRange(existing);

                foreach (var entry in day.Entries)
                {
                    var name = entry.AppName?.Trim();
                    if (string.IsNullOrEmpty(name) || entry.Minutes <= 0) continue;
                    if (name.Length > 120) name = name[..120];

                    _db.ScreenTimeLogs.Add(new ScreenTimeLog
                    {
                        UserId = userId,
                        Date = day.Date,
                        AppName = name,
                        Kind = "app",
                        Minutes = Math.Min(entry.Minutes, 24 * 60),
                        SyncedAt = now
                    });
                    upserted++;
                }
            }

            await _db.SaveChangesAsync();
            return new UpsertScreenTimeResultDto(upserted, dayCount);
        }

        public async Task<IReadOnlyList<ScreenTimeDaySummaryDto>> GetScreenTimeAsync(
            int userId, DateOnly from, DateOnly to)
        {
            if (to < from) (from, to) = (to, from);
            var rows = await _db.ScreenTimeLogs.AsNoTracking()
                .Where(s => s.UserId == userId && s.Date >= from && s.Date <= to)
                .OrderByDescending(s => s.Minutes)
                .ToListAsync();

            return rows
                .GroupBy(s => s.Date)
                .OrderBy(g => g.Key)
                .Select(g =>
                {
                    var entries = g
                        .OrderByDescending(x => x.Minutes)
                        .Select(x => new ScreenTimeEntryDto(x.Date, x.AppName, x.Kind, x.Minutes, x.SyncedAt))
                        .ToList();
                    return new ScreenTimeDaySummaryDto(
                        g.Key,
                        entries.Sum(e => e.Minutes),
                        entries.Take(12).ToList());
                })
                .ToList();
        }

        public async Task<DigitalOverviewDto> GetOverviewAsync(int userId, DateOnly from, DateOnly to)
        {
            var steps = await GetStepsAsync(userId, from, to);
            var screen = await GetScreenTimeAsync(userId, from, to);
            return new DigitalOverviewDto(steps, screen, from, to);
        }

        private static string GenerateToken()
        {
            var bytes = RandomNumberGenerator.GetBytes(32);
            return Convert.ToHexString(bytes).ToLowerInvariant();
        }

        private static string Preview(string token) =>
            token.Length <= 10 ? token : $"{token[..6]}…{token[^4..]}";
    }
}
