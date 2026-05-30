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

        public async Task<HabitDto?> SetCheckInAsync(int userId, int habitId, SetHabitCheckInRequest request)
        {
            var habit = await _db.Habits
                .Include(h => h.CheckIns)
                .FirstOrDefaultAsync(h => h.Id == habitId && h.UserId == userId && h.IsActive);

            if (habit == null) return null;

            var existing = habit.CheckIns.FirstOrDefault(c => c.Date == request.Date);
            if (request.Completed)
            {
                if (existing == null)
                {
                    habit.CheckIns.Add(new HabitCheckIn { HabitId = habit.Id, Date = request.Date });
                }
            }
            else if (existing != null)
            {
                _db.HabitCheckIns.Remove(existing);
            }

            await _db.SaveChangesAsync();

            await _db.Entry(habit).Collection(h => h.CheckIns).LoadAsync();
            var dates = habit.CheckIns.Select(c => c.Date).ToList();
            var current = StreakCalculator.GetCurrentStreak(dates);
            var best = Math.Max(habit.RecordStreak, StreakCalculator.GetBestStreak(dates));
            if (best > habit.RecordStreak)
            {
                habit.RecordStreak = best;
                await _db.SaveChangesAsync();
            }

            return MapDto(habit);
        }

        private static HabitDto MapDto(Habit habit)
        {
            var today = AppTime.Today;
            var dates = habit.CheckIns.Select(c => c.Date);
            return new HabitDto(
                habit.Id,
                habit.Name,
                habit.CheckIns.Any(c => c.Date == today),
                StreakCalculator.GetCurrentStreak(dates),
                Math.Max(habit.RecordStreak, StreakCalculator.GetBestStreak(dates)),
                habit.CreatedAt
            );
        }
    }
}
