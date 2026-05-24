using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Hayat.Application.DTOs;
using Hayat.Application.Interfaces;
using Hayat.Domain.Entities;
using Hayat.Infrastructure.Data;

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
                query = query.Where(s => DateOnly.FromDateTime(s.WakeTime) >= from.Value);
            if (to.HasValue)
                query = query.Where(s => DateOnly.FromDateTime(s.WakeTime) <= to.Value);

            var logs = await query.OrderByDescending(s => s.WakeTime).ToListAsync();
            return logs.Select(MapSleep).ToList();
        }

        public async Task<SleepLogDto?> CreateSleepLogAsync(int userId, CreateSleepLogRequest request)
        {
            if (request.WakeTime <= request.BedTime) return null;
            if (request.Quality < 1 || request.Quality > 5) return null;

            var log = new SleepLog
            {
                UserId = userId,
                BedTime = request.BedTime,
                WakeTime = request.WakeTime,
                Quality = request.Quality,
                Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim()
            };
            _db.SleepLogs.Add(log);
            await _db.SaveChangesAsync();
            return MapSleep(log);
        }

        public async Task<SleepLogDto?> UpdateSleepLogAsync(int userId, int id, UpdateSleepLogRequest request)
        {
            if (request.WakeTime <= request.BedTime) return null;
            if (request.Quality < 1 || request.Quality > 5) return null;

            var log = await _db.SleepLogs.FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);
            if (log == null) return null;

            log.BedTime = request.BedTime;
            log.WakeTime = request.WakeTime;
            log.Quality = request.Quality;
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

            return await query.OrderByDescending(a => a.Date)
                .Select(a => new SportActivityDto(a.Id, a.SportActivityTypeId, a.SportActivityType.Name, a.Date, a.DurationMinutes, a.Note))
                .ToListAsync();
        }

        public async Task<SportActivityDto?> CreateSportActivityAsync(int userId, CreateSportActivityRequest request)
        {
            if (request.DurationMinutes <= 0) return null;
            var typeExists = await _db.SportActivityTypes.AnyAsync(t => t.Id == request.SportActivityTypeId && t.IsActive);
            if (!typeExists) return null;

            var activity = new SportActivity
            {
                UserId = userId,
                SportActivityTypeId = request.SportActivityTypeId,
                Date = request.Date,
                DurationMinutes = request.DurationMinutes,
                Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim()
            };
            _db.SportActivities.Add(activity);
            await _db.SaveChangesAsync();

            var typeName = await _db.SportActivityTypes.Where(t => t.Id == activity.SportActivityTypeId).Select(t => t.Name).FirstAsync();
            return new SportActivityDto(activity.Id, activity.SportActivityTypeId, typeName, activity.Date, activity.DurationMinutes, activity.Note);
        }

        public async Task<SportActivityDto?> UpdateSportActivityAsync(int userId, int id, UpdateSportActivityRequest request)
        {
            if (request.DurationMinutes <= 0) return null;
            var typeExists = await _db.SportActivityTypes.AnyAsync(t => t.Id == request.SportActivityTypeId && t.IsActive);
            if (!typeExists) return null;

            var activity = await _db.SportActivities
                .Include(a => a.SportActivityType)
                .FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);
            if (activity == null) return null;

            activity.SportActivityTypeId = request.SportActivityTypeId;
            activity.Date = request.Date;
            activity.DurationMinutes = request.DurationMinutes;
            activity.Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim();
            await _db.SaveChangesAsync();

            return new SportActivityDto(
                activity.Id,
                activity.SportActivityTypeId,
                activity.SportActivityType.Name,
                activity.Date,
                activity.DurationMinutes,
                activity.Note);
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

        private static SleepLogDto MapSleep(SleepLog log) => new(
            log.Id, log.BedTime, log.WakeTime, log.DurationMinutes, log.Quality, log.Note,
            DateOnly.FromDateTime(log.WakeTime));
    }
}
