using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Hayat.Application.DTOs;
using Hayat.Application.Interfaces;
using Hayat.Domain.Entities;
using Hayat.Application.Common;
using Hayat.Infrastructure.Data;
using Hayat.Infrastructure;

namespace Hayat.Infrastructure.Services
{
    public class HealthService : IHealthService
    {
        private readonly AppDbContext _db;

        public HealthService(AppDbContext db) => _db = db;

        public async Task<IReadOnlyList<SleepLogDto>> GetSleepLogsAsync(int userId, DateOnly? from, DateOnly? to)
        {
            var query = _db.SleepLogs.AsNoTracking().Where(s => s.UserId == userId);
            if (from.HasValue)
            {
                var fromUtc = AppTime.StartOfLocalDayUtc(from.Value);
                query = query.Where(s => (s.WakeTime ?? s.BedTime) >= fromUtc);
            }

            if (to.HasValue)
            {
                var toUtc = AppTime.EndOfLocalDayUtc(to.Value);
                query = query.Where(s => (s.WakeTime ?? s.BedTime) <= toUtc);
            }

            var logs = await query
                .OrderByDescending(s => s.WakeTime ?? s.BedTime)
                .ToListAsync();
            return logs.Select(MapSleep).ToList();
        }

        public async Task<SleepLogDto?> GetOpenSleepLogAsync(int userId)
        {
            var log = await _db.SleepLogs.AsNoTracking()
                .Where(s => s.UserId == userId && s.WakeTime == null)
                .OrderByDescending(s => s.BedTime)
                .FirstOrDefaultAsync();
            return log == null ? null : MapSleep(log);
        }

        public async Task<SleepLogDto?> CreateSleepLogAsync(int userId, CreateSleepLogRequest request)
        {
            var hasWake = request.WakeTime.HasValue;
            if (hasWake)
            {
                if (request.WakeTime!.Value <= request.BedTime) return null;
                if (request.Quality is < 1 or > 5) return null;
            }
            else
            {
                var hasOpen = await _db.SleepLogs.AnyAsync(s => s.UserId == userId && s.WakeTime == null);
                if (hasOpen) return null;
            }

            var log = new SleepLog
            {
                UserId = userId,
                BedTime = DateTimeUtil.AsUtc(request.BedTime),
                WakeTime = DateTimeUtil.AsUtc(request.WakeTime),
                Quality = hasWake ? request.Quality!.Value : 0,
                Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim()
            };
            _db.SleepLogs.Add(log);
            await _db.SaveChangesAsync();
            return MapSleep(log);
        }

        public async Task<SleepLogDto?> CompleteSleepLogAsync(int userId, int id, CompleteSleepLogRequest request)
        {
            if (request.Quality < 1 || request.Quality > 5) return null;

            var log = await _db.SleepLogs.FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);
            if (log == null || log.WakeTime != null) return null;
            if (request.WakeTime <= log.BedTime) return null;

            log.WakeTime = DateTimeUtil.AsUtc(request.WakeTime);
            log.Quality = request.Quality;
            if (!string.IsNullOrWhiteSpace(request.Note))
            {
                log.Note = string.IsNullOrWhiteSpace(log.Note)
                    ? request.Note.Trim()
                    : $"{log.Note} | {request.Note.Trim()}";
            }

            await _db.SaveChangesAsync();
            return MapSleep(log);
        }

        public async Task<SleepLogDto?> UpdateSleepLogAsync(int userId, int id, UpdateSleepLogRequest request)
        {
            var log = await _db.SleepLogs.FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);
            if (log == null) return null;

            log.BedTime = DateTimeUtil.AsUtc(request.BedTime);
            log.WakeTime = DateTimeUtil.AsUtc(request.WakeTime);
            if (request.WakeTime.HasValue)
            {
                if (request.WakeTime.Value <= request.BedTime) return null;
                if (request.Quality is < 1 or > 5) return null;
                log.Quality = request.Quality!.Value;
            }
            else
            {
                log.Quality = 0;
            }

            log.Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim();
            await _db.SaveChangesAsync();
            return MapSleep(log);
        }

        public async Task<bool> DeleteSleepLogAsync(int userId, int id)
        {
            var log = await _db.SleepLogs.FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);
            if (log == null) return false;
            _db.SleepLogs.Remove(log);
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<IReadOnlyList<SportActivityDto>> GetSportActivitiesAsync(int userId, DateOnly? from, DateOnly? to, int? typeId)
        {
            var query = _db.SportActivities.AsNoTracking()
                .Include(a => a.SportActivityType)
                .Where(a => a.UserId == userId);

            if (from.HasValue) query = query.Where(a => a.Date >= from.Value);
            if (to.HasValue) query = query.Where(a => a.Date <= to.Value);
            if (typeId.HasValue) query = query.Where(a => a.SportActivityTypeId == typeId.Value);

            var list = await query.OrderByDescending(a => a.Date).ToListAsync();
            return list.Select(MapSport).ToList();
        }

        public async Task<SportActivityDto?> CreateSportActivityAsync(int userId, CreateSportActivityRequest request)
        {
            if (request.DurationMinutes <= 0) return null;
            if (!TryNormalizeDistance(request.DistanceKm, out var distanceKm)) return null;
            if (!TryNormalizeStravaLink(request.StravaLink, out var stravaLink)) return null;

            var typeExists = await _db.SportActivityTypes.AnyAsync(t => t.Id == request.SportActivityTypeId && t.IsActive);
            if (!typeExists) return null;

            var activity = new SportActivity
            {
                UserId = userId,
                SportActivityTypeId = request.SportActivityTypeId,
                Date = request.Date,
                DurationMinutes = request.DurationMinutes,
                DistanceKm = distanceKm,
                StravaLink = stravaLink,
                Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim()
            };
            _db.SportActivities.Add(activity);
            await _db.SaveChangesAsync();

            await _db.Entry(activity).Reference(a => a.SportActivityType).LoadAsync();
            return MapSport(activity);
        }

        public async Task<SportActivityDto?> UpdateSportActivityAsync(int userId, int id, UpdateSportActivityRequest request)
        {
            if (request.DurationMinutes <= 0) return null;
            if (!TryNormalizeDistance(request.DistanceKm, out var distanceKm)) return null;
            if (!TryNormalizeStravaLink(request.StravaLink, out var stravaLink)) return null;

            var typeExists = await _db.SportActivityTypes.AnyAsync(t => t.Id == request.SportActivityTypeId && t.IsActive);
            if (!typeExists) return null;

            var activity = await _db.SportActivities
                .Include(a => a.SportActivityType)
                .FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);
            if (activity == null) return null;

            activity.SportActivityTypeId = request.SportActivityTypeId;
            activity.Date = request.Date;
            activity.DurationMinutes = request.DurationMinutes;
            activity.DistanceKm = distanceKm;
            activity.StravaLink = stravaLink;
            activity.Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim();
            await _db.SaveChangesAsync();

            return MapSport(activity);
        }

        public async Task<bool> DeleteSportActivityAsync(int userId, int id)
        {
            var item = await _db.SportActivities.FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);
            if (item == null) return false;
            _db.SportActivities.Remove(item);
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<IReadOnlyList<MeditationSessionDto>> GetMeditationsAsync(int userId, DateOnly? from, DateOnly? to)
        {
            var query = _db.MeditationSessions.AsNoTracking().Where(m => m.UserId == userId);
            if (from.HasValue) query = query.Where(m => m.Date >= from.Value);
            if (to.HasValue) query = query.Where(m => m.Date <= to.Value);

            return await query.OrderByDescending(m => m.Date)
                .Select(m => new MeditationSessionDto(m.Id, m.Date, m.DurationMinutes))
                .ToListAsync();
        }

        public async Task<MeditationSessionDto?> CreateMeditationAsync(int userId, CreateMeditationRequest request)
        {
            if (request.DurationMinutes <= 0) return null;
            var session = new MeditationSession { UserId = userId, Date = request.Date, DurationMinutes = request.DurationMinutes };
            _db.MeditationSessions.Add(session);
            await _db.SaveChangesAsync();
            return new MeditationSessionDto(session.Id, session.Date, session.DurationMinutes);
        }

        public async Task<MeditationSessionDto?> UpdateMeditationAsync(int userId, int id, UpdateMeditationRequest request)
        {
            if (request.DurationMinutes <= 0) return null;
            var session = await _db.MeditationSessions.FirstOrDefaultAsync(m => m.Id == id && m.UserId == userId);
            if (session == null) return null;

            session.Date = request.Date;
            session.DurationMinutes = request.DurationMinutes;
            await _db.SaveChangesAsync();
            return new MeditationSessionDto(session.Id, session.Date, session.DurationMinutes);
        }

        public async Task<bool> DeleteMeditationAsync(int userId, int id)
        {
            var item = await _db.MeditationSessions.FirstOrDefaultAsync(m => m.Id == id && m.UserId == userId);
            if (item == null) return false;
            _db.MeditationSessions.Remove(item);
            await _db.SaveChangesAsync();
            return true;
        }

        private static SportActivityDto MapSport(SportActivity a) => new(
            a.Id,
            a.SportActivityTypeId,
            a.SportActivityType.Name,
            a.Date,
            a.DurationMinutes,
            a.DistanceKm,
            a.StravaLink,
            a.Note);

        private static bool TryNormalizeDistance(decimal? km, out decimal? normalized)
        {
            normalized = null;
            if (!km.HasValue) return true;
            if (km.Value < 0 || km.Value > 9999.9m) return false;
            normalized = Math.Round(km.Value, 1, MidpointRounding.AwayFromZero);
            return true;
        }

        private static bool TryNormalizeStravaLink(string? link, out string? normalized)
        {
            normalized = null;
            if (string.IsNullOrWhiteSpace(link)) return true;
            var trimmed = link.Trim();
            if (trimmed.Length > 500) return false;
            normalized = trimmed.StartsWith("http://", StringComparison.OrdinalIgnoreCase)
                || trimmed.StartsWith("https://", StringComparison.OrdinalIgnoreCase)
                ? trimmed
                : $"https://{trimmed}";
            return true;
        }

        private static SleepLogDto MapSleep(SleepLog log)
        {
            var bed = DateTimeUtil.AsUtc(log.BedTime);
            var wake = DateTimeUtil.AsUtc(log.WakeTime);
            var listDate = AppTime.ToLocalDate(wake ?? bed);
            return new(
                log.Id,
                bed,
                wake,
                log.DurationMinutes,
                log.Quality,
                log.Note,
                listDate,
                log.IsComplete);
        }
    }
}
