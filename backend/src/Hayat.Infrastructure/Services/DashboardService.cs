using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Hayat.Application.DTOs;
using Hayat.Application.Interfaces;
using Hayat.Infrastructure.Data;

namespace Hayat.Infrastructure.Services
{
    public class DashboardService : IDashboardService
    {
        private readonly AppDbContext _db;

        public DashboardService(AppDbContext db) => _db = db;

        public async Task<DashboardSummaryDto> GetSummaryAsync(int userId)
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var yesterday = today.AddDays(-1);

            var habits = await _db.Habits.AsNoTracking()
                .Where(h => h.UserId == userId && h.IsActive)
                .Include(h => h.CheckIns)
                .ToListAsync();

            var completedToday = habits.Count(h => h.CheckIns.Any(c => c.Date == today));
            var bestStreak = habits.Count > 0 ? habits.Max(h => h.RecordStreak) : 0;

            var lastNightSleep = await _db.SleepLogs.AsNoTracking()
                .Where(s => s.UserId == userId && s.WakeTime != null && DateOnly.FromDateTime(s.WakeTime!.Value) == today)
                .OrderByDescending(s => s.WakeTime)
                .FirstOrDefaultAsync();

            if (lastNightSleep == null)
            {
                lastNightSleep = await _db.SleepLogs.AsNoTracking()
                    .Where(s => s.UserId == userId && s.WakeTime != null && DateOnly.FromDateTime(s.WakeTime!.Value) == yesterday)
                    .OrderByDescending(s => s.WakeTime)
                    .FirstOrDefaultAsync();
            }

            var todaySport = await _db.SportActivities.AsNoTracking()
                .Where(s => s.UserId == userId && s.Date == today)
                .SumAsync(s => (int?)s.DurationMinutes) ?? 0;

            var todayDeepWork = await _db.DeepWorkSessions.AsNoTracking()
                .Where(s => s.UserId == userId && s.Date == today)
                .SumAsync(s => (int?)s.DurationMinutes) ?? 0;

            var todayMeditation = await _db.MeditationSessions.AsNoTracking()
                .Where(s => s.UserId == userId && s.Date == today)
                .SumAsync(s => (int?)s.DurationMinutes) ?? 0;

            return new DashboardSummaryDto(
                bestStreak,
                completedToday,
                habits.Count,
                lastNightSleep?.DurationMinutes ?? 0,
                todaySport,
                todayDeepWork,
                todayMeditation
            );
        }

        public async Task<DashboardAnalyticsDto> GetAnalyticsAsync(int userId, string period)
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var days = period?.ToLowerInvariant() switch
            {
                "weekly" => 7,
                "monthly" => 30,
                _ => 7
            };

            var start = today.AddDays(-(days - 1));
            var labels = Enumerable.Range(0, days)
                .Select(i => start.AddDays(i))
                .ToList();

            var sleepByWakeDate = await _db.SleepLogs.AsNoTracking()
                .Where(s => s.UserId == userId && s.WakeTime != null
                    && DateOnly.FromDateTime(s.WakeTime!.Value) >= start
                    && DateOnly.FromDateTime(s.WakeTime!.Value) <= today)
                .GroupBy(s => DateOnly.FromDateTime(s.WakeTime!.Value))
                .Select(g => new { Date = g.Key, Minutes = g.Sum(x => (int)(x.WakeTime!.Value - x.BedTime).TotalMinutes) })
                .ToListAsync();

            var sportByDate = await _db.SportActivities.AsNoTracking()
                .Where(s => s.UserId == userId && s.Date >= start && s.Date <= today)
                .GroupBy(s => s.Date)
                .Select(g => new { Date = g.Key, Minutes = g.Sum(x => x.DurationMinutes) })
                .ToListAsync();

            var meditationByDate = await _db.MeditationSessions.AsNoTracking()
                .Where(s => s.UserId == userId && s.Date >= start && s.Date <= today)
                .GroupBy(s => s.Date)
                .Select(g => new { Date = g.Key, Minutes = g.Sum(x => x.DurationMinutes) })
                .ToListAsync();

            var deepWorkByDate = await _db.DeepWorkSessions.AsNoTracking()
                .Where(s => s.UserId == userId && s.Date >= start && s.Date <= today)
                .GroupBy(s => s.Date)
                .Select(g => new { Date = g.Key, Minutes = g.Sum(x => x.DurationMinutes) })
                .ToListAsync();

            double GetValue<T>(List<T> data, DateOnly date, Func<T, DateOnly> dateSel, Func<T, int> valSel) =>
                data.Where(x => dateSel(x) == date).Select(valSel).DefaultIfEmpty(0).Sum();

            var charts = new List<DashboardChartDto>
            {
                BuildChart("Uyku (dk)", labels, d => GetValue(sleepByWakeDate, d, x => x.Date, x => x.Minutes)),
                BuildChart("Spor (dk)", labels, d => GetValue(sportByDate, d, x => x.Date, x => x.Minutes)),
                BuildChart("Meditasyon (dk)", labels, d => GetValue(meditationByDate, d, x => x.Date, x => x.Minutes)),
                BuildChart("Deep Work (dk)", labels, d => GetValue(deepWorkByDate, d, x => x.Date, x => x.Minutes))
            };

            return new DashboardAnalyticsDto(period ?? "weekly", charts);
        }

        private static DashboardChartDto BuildChart(string title, List<DateOnly> labels, Func<DateOnly, double> getValue)
        {
            var points = labels.Select(d => new ChartDataPointDto(
                $"{d.Day:D2}.{d.Month:D2}.{d.Year}",
                getValue(d)
            )).ToList();

            return new DashboardChartDto(title, points);
        }
    }
}
