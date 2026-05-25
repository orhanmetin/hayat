using System;
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
    public class WeeklyGoalService : IWeeklyGoalService
    {
        private readonly AppDbContext _db;

        public WeeklyGoalService(AppDbContext db) => _db = db;

        public Task<WeekInfoDto> GetCurrentWeekAsync()
        {
            var (year, week) = WeekHelper.GetIsoWeek(DateOnly.FromDateTime(DateTime.UtcNow));
            var (start, end) = WeekHelper.GetWeekRange(year, week);
            return Task.FromResult(new WeekInfoDto(year, week, start, end));
        }

        public async Task<WeeklyGoalDto?> GetGoalAsync(int userId, int year, int weekNumber)
        {
            var goal = await _db.WeeklyGoals.AsNoTracking()
                .FirstOrDefaultAsync(g => g.UserId == userId && g.Year == year && g.WeekNumber == weekNumber);

            if (goal == null) return null;

            var progress = await CalculateProgressAsync(userId, year, weekNumber);
            return MapGoal(goal, progress);
        }

        public async Task<WeeklyGoalDto> UpsertGoalAsync(int userId, UpsertWeeklyGoalRequest request)
        {
            var goal = await _db.WeeklyGoals
                .FirstOrDefaultAsync(g => g.UserId == userId && g.Year == request.Year && g.WeekNumber == request.WeekNumber);

            if (goal == null)
            {
                goal = new WeeklyGoal
                {
                    UserId = userId,
                    Year = request.Year,
                    WeekNumber = request.WeekNumber,
                    CreatedAt = DateTime.UtcNow
                };
                _db.WeeklyGoals.Add(goal);
            }

            goal.TargetAvgSleepMinutesPerDay = request.TargetAvgSleepMinutesPerDay;
            goal.TargetTotalSportMinutes = request.TargetTotalSportMinutes;
            goal.TargetAvgDeepWorkMinutesPerDay = request.TargetAvgDeepWorkMinutesPerDay;
            goal.TargetAvgMeditationMinutesPerDay = request.TargetAvgMeditationMinutesPerDay;

            await _db.SaveChangesAsync();
            var progress = await CalculateProgressAsync(userId, request.Year, request.WeekNumber);
            return MapGoal(goal, progress);
        }

        private async Task<WeeklyGoalProgressDto> CalculateProgressAsync(int userId, int year, int weekNumber)
        {
            var (start, end) = WeekHelper.GetWeekRange(year, weekNumber);

            var sleepLogs = await _db.SleepLogs.AsNoTracking()
                .Where(s => s.UserId == userId && s.WakeTime != null
                    && DateOnly.FromDateTime(s.WakeTime!.Value) >= start
                    && DateOnly.FromDateTime(s.WakeTime!.Value) <= end)
                .ToListAsync();

            var sportTotal = await _db.SportActivities.AsNoTracking()
                .Where(s => s.UserId == userId && s.Date >= start && s.Date <= end)
                .SumAsync(s => (int?)s.DurationMinutes) ?? 0;

            var deepWorkByDay = await _db.DeepWorkSessions.AsNoTracking()
                .Where(s => s.UserId == userId && s.Date >= start && s.Date <= end)
                .GroupBy(s => s.Date)
                .Select(g => g.Sum(x => x.DurationMinutes))
                .ToListAsync();

            var meditationByDay = await _db.MeditationSessions.AsNoTracking()
                .Where(s => s.UserId == userId && s.Date >= start && s.Date <= end)
                .GroupBy(s => s.Date)
                .Select(g => g.Sum(x => x.DurationMinutes))
                .ToListAsync();

            var avgSleep = sleepLogs.Count > 0
                ? (int)sleepLogs.Average(s => s.DurationMinutes)
                : 0;

            var avgDeepWork = deepWorkByDay.Count > 0 ? (int)deepWorkByDay.Average() : 0;
            var avgMeditation = meditationByDay.Count > 0 ? (int)meditationByDay.Average() : 0;

            return new WeeklyGoalProgressDto(0, 0, 0, 0, avgSleep, sportTotal, avgDeepWork, avgMeditation);
        }

        private static WeeklyGoalDto MapGoal(WeeklyGoal goal, WeeklyGoalProgressDto progress)
        {
            double Pct(int current, int? target) =>
                target is > 0 ? Math.Min(100, Math.Round(current * 100.0 / target.Value, 1)) : 0;

            var enriched = progress with
            {
                SleepProgress = Pct(progress.CurrentAvgSleepMinutes, goal.TargetAvgSleepMinutesPerDay),
                SportProgress = Pct(progress.CurrentTotalSportMinutes, goal.TargetTotalSportMinutes),
                DeepWorkProgress = Pct(progress.CurrentAvgDeepWorkMinutes, goal.TargetAvgDeepWorkMinutesPerDay),
                MeditationProgress = Pct(progress.CurrentAvgMeditationMinutes, goal.TargetAvgMeditationMinutesPerDay)
            };

            return new WeeklyGoalDto(
                goal.Id, goal.Year, goal.WeekNumber,
                goal.TargetAvgSleepMinutesPerDay,
                goal.TargetTotalSportMinutes,
                goal.TargetAvgDeepWorkMinutesPerDay,
                goal.TargetAvgMeditationMinutesPerDay,
                enriched);
        }
    }
}
