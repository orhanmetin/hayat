using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Hayat.Application.Common;
using Hayat.Application.DTOs;
using Hayat.Application.Interfaces;
using Hayat.Domain.Entities;
using Hayat.Infrastructure.Data;

namespace Hayat.Infrastructure.Services
{
    public class HabitService : IHabitService
    {
        private readonly AppDbContext _db;

        public HabitService(AppDbContext db) => _db = db;

        public async Task<IReadOnlyList<HabitDto>> GetHabitsAsync(int userId)
        {
            var habits = await _db.Habits.AsNoTracking()
                .Where(h => h.UserId == userId && h.IsActive)
                .Include(h => h.CheckIns)
                .OrderByDescending(h => h.CreatedAt)
                .ToListAsync();

            return habits.Select(MapDto).ToList();
        }

        public async Task<HabitDto?> CreateHabitAsync(int userId, CreateHabitRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Name)) return null;
            var habit = new Habit
            {
                UserId = userId,
                Name = request.Name.Trim(),
                CreatedAt = DateTime.UtcNow
            };
            _db.Habits.Add(habit);
            await _db.SaveChangesAsync();
            return MapDto(habit);
        }

        public async Task<bool> DeleteHabitAsync(int userId, int habitId)
        {
            var habit = await _db.Habits.FirstOrDefaultAsync(h => h.Id == habitId && h.UserId == userId);
            if (habit == null) return false;
            _db.Habits.Remove(habit);
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<HabitDto?> ToggleTodayAsync(int userId, int habitId)
        {
            var today = AppTime.Today;
            var hasToday = await _db.HabitCheckIns.AnyAsync(c => c.HabitId == habitId && c.Date == today);
            return await SetCheckInAsync(userId, habitId, new SetHabitCheckInRequest(today, !hasToday));
        }

        public async Task<HabitDto?> AddCheckInAsync(int userId, int habitId)
        {
            var habit = await _db.Habits
                .FirstOrDefaultAsync(h => h.Id == habitId && h.UserId == userId && h.IsActive);
            if (habit == null) return null;

            var today = AppTime.Today;
            _db.HabitCheckIns.Add(new HabitCheckIn
            {
                HabitId = habit.Id,
                Date = today,
                CreatedAt = DateTime.UtcNow
            });
            await _db.SaveChangesAsync();

            await _db.Entry(habit).Collection(h => h.CheckIns).LoadAsync();
            await UpdateRecordStreakAsync(habit);
            return MapDto(habit);
        }

        public async Task<HabitDto?> SetCheckInAsync(int userId, int habitId, SetHabitCheckInRequest request)
        {
            var habit = await _db.Habits
                .Include(h => h.CheckIns)
                .FirstOrDefaultAsync(h => h.Id == habitId && h.UserId == userId && h.IsActive);

            if (habit == null) return null;

            if (request.Completed)
            {
                habit.CheckIns.Add(new HabitCheckIn
                {
                    HabitId = habit.Id,
                    Date = request.Date,
                    CreatedAt = DateTime.UtcNow
                });
            }
            else
            {
                var latest = habit.CheckIns
                    .Where(c => c.Date == request.Date)
                    .OrderByDescending(c => c.CreatedAt)
                    .FirstOrDefault();
                if (latest != null)
                    _db.HabitCheckIns.Remove(latest);
            }

            await _db.SaveChangesAsync();
            await _db.Entry(habit).Collection(h => h.CheckIns).LoadAsync();
            await UpdateRecordStreakAsync(habit);
            return MapDto(habit);
        }

        public async Task<HabitAnalyticsDto?> GetAnalyticsAsync(
            int userId,
            int habitId,
            string period,
            string? bucket)
        {
            var habitExists = await _db.Habits.AsNoTracking()
                .AnyAsync(h => h.Id == habitId && h.UserId == userId && h.IsActive);
            if (!habitExists) return null;

            var today = AppTime.Today;
            var (rangeStart, normalizedPeriod, allowedBuckets) = ChartBuckets.ResolvePeriod(period, today);
            var normalizedBucket = ChartBuckets.NormalizeBucket(bucket, allowedBuckets);
            var bucketDefs = ChartBuckets.Build(rangeStart, today, normalizedPeriod, normalizedBucket);

            var checkIns = await _db.HabitCheckIns.AsNoTracking()
                .Where(c => c.HabitId == habitId && c.Date >= rangeStart && c.Date <= today)
                .Select(c => c.Date)
                .ToListAsync();

            var todayCount = checkIns.Count(d => d == today);
            var series = bucketDefs.Select(b => new CountBucketValueDto(
                b.Key,
                b.Label,
                checkIns.Count(d => d >= b.Start && d <= b.End)
            )).ToList();

            return new HabitAnalyticsDto(
                normalizedPeriod,
                normalizedBucket,
                rangeStart,
                today,
                todayCount,
                checkIns.Count,
                series);
        }

        private async Task UpdateRecordStreakAsync(Habit habit)
        {
            var dates = habit.CheckIns.Select(c => c.Date);
            var best = Math.Max(habit.RecordStreak, StreakCalculator.GetBestStreak(dates));
            if (best > habit.RecordStreak)
            {
                habit.RecordStreak = best;
                await _db.SaveChangesAsync();
            }
        }

        private static HabitDto MapDto(Habit habit)
        {
            var today = AppTime.Today;
            var todayCount = habit.CheckIns.Count(c => c.Date == today);
            var dates = habit.CheckIns.Select(c => c.Date);
            return new HabitDto(
                habit.Id,
                habit.Name,
                todayCount > 0,
                todayCount,
                StreakCalculator.GetCurrentStreak(dates),
                Math.Max(habit.RecordStreak, StreakCalculator.GetBestStreak(dates)),
                habit.CreatedAt
            );
        }
    }
}
