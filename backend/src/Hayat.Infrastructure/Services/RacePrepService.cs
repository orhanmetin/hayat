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
    /// <summary>
    /// "Road to Barcelona 24h" race preparation goals (G1-G10),
    /// computed from Strava-synced sport activities and sleep logs.
    /// </summary>
    public class RacePrepService : IRacePrepService
    {
        // Plan: Mon 20 Jul 2026 -> race on Sat 12 Dec 2026 (week 21 = race week).
        private static readonly DateOnly StartDate = new(2026, 7, 20);
        private static readonly DateOnly RaceDate = new(2026, 12, 12);
        private const int TotalWeeks = 21;
        // Projection horizon: 20 Jul - 13 Dec inclusive = 147 days (per plan definition).
        private const int ProjectionDays = 147;

        // Core weeks for weekly goals: weeks 3-20 (3 Aug - 6 Dec) = 18 weeks.
        private const int CoreFirstWeek = 3;
        private const int CoreLastWeek = 20;
        private static readonly DateOnly SleepGoalStart = new(2026, 8, 3);

        private const string RunTypeName = "Koşu";
        private const string StrengthTypeName = "Güç Çalışması";

        private const int TotalVolumeTargetKm = 1500;
        private const int WeeklyVolumeTargetKm = 70;
        private const int WeeklyVolumeTargetWeeks = 16;
        private const int LongRunTargetCount = 20;      // >= 21 km
        private const int LongerRunTargetCount = 8;     // >= 30 km
        private const int MarathonTargetCount = 2;      // >= 42 km
        private const int SpeedTargetWeeks = 16;
        private const int StrengthWeeklyTarget = 2;
        private const int StrengthTotalWeeks = 20;      // weeks 1-20
        private const int StrengthTargetWeeks = 16;
        private const int SleepTargetMinutes = 450;     // 7h30m
        private const int VisualizationTarget = 20;

        private readonly AppDbContext _db;

        public RacePrepService(AppDbContext db) => _db = db;

        public async Task<RacePrepOverviewDto> GetOverviewAsync(int userId)
        {
            var today = AppTime.Today;
            var started = today >= StartDate;

            var rangeEnd = RaceDate.AddDays(1); // include 13 Dec (projection horizon)
            var currentWeek = started
                ? Math.Min(TotalWeeks, (today.DayNumber - StartDate.DayNumber) / 7 + 1)
                : 0;
            var weekPercent = Pct(currentWeek, TotalWeeks);
            var daysToRace = Math.Max(0, RaceDate.DayNumber - today.DayNumber);
            var daysElapsed = started
                ? Math.Min(ProjectionDays, today.DayNumber - StartDate.DayNumber + 1)
                : 0;

            var activities = await _db.SportActivities.AsNoTracking()
                .Where(a => a.UserId == userId && a.Date >= StartDate && a.Date <= rangeEnd)
                .Select(a => new
                {
                    a.Date,
                    a.DistanceKm,
                    a.Note,
                    TypeName = a.SportActivityType.Name
                })
                .ToListAsync();

            var runs = activities
                .Where(a => a.TypeName == RunTypeName)
                .Select(a => new RunRow(a.Date, (double)(a.DistanceKm ?? 0)))
                .ToList();

            // --- G1: total volume + projection ---
            var totalKm = runs.Sum(r => r.Km);
            var avgDailyKm = daysElapsed > 0 ? totalKm / daysElapsed : 0;
            var projectedKm = Math.Round(avgDailyKm * ProjectionDays, 1);
            var totalVolume = new RacePrepTotalVolumeDto(
                Math.Round(totalKm, 1),
                TotalVolumeTargetKm,
                Pct(totalKm, TotalVolumeTargetKm),
                Math.Round(avgDailyKm, 2),
                projectedKm,
                projectedKm >= TotalVolumeTargetKm);

            // --- G2: weekly volume ---
            var kmByWeek = runs
                .GroupBy(r => WeekIndex(r.Date))
                .ToDictionary(g => g.Key, g => g.Sum(r => r.Km));
            var currentWeekKm = currentWeek >= 1 && kmByWeek.TryGetValue(currentWeek, out var wkm) ? wkm : 0;
            var volumeAchievedWeeks = CoreWeekRange()
                .Count(w => kmByWeek.TryGetValue(w, out var km) && km >= WeeklyVolumeTargetKm);
            var weeklyVolume = new RacePrepWeeklyVolumeDto(
                Math.Round(currentWeekKm, 1),
                WeeklyVolumeTargetKm,
                Pct(currentWeekKm, WeeklyVolumeTargetKm),
                volumeAchievedWeeks,
                CoreLastWeek - CoreFirstWeek + 1,
                WeeklyVolumeTargetWeeks,
                Pct(volumeAchievedWeeks, WeeklyVolumeTargetWeeks));

            // --- G3 / G4 / G5: long runs ---
            var longRuns = CountGoal(runs.Count(r => r.Km >= 21), LongRunTargetCount);
            var longerRuns = CountGoal(runs.Count(r => r.Km >= 30), LongerRunTargetCount);
            var marathonRuns = CountGoal(runs.Count(r => r.Km >= 42), MarathonTargetCount);

            // --- G6: back-to-back (>=30 km run on consecutive days) ---
            var dailyKm = runs
                .GroupBy(r => r.Date)
                .ToDictionary(g => g.Key, g => g.Sum(r => r.Km));
            var backToBackCount = dailyKm.Keys
                .Count(d => dailyKm[d] >= 30
                    && dailyKm.TryGetValue(d.AddDays(1), out var next) && next >= 30);
            var backToBack = new RacePrepBackToBackDto(backToBackCount >= 1, backToBackCount, 1);

            // --- G7: speed work (title contains Interval/Tempo) ---
            var speedByWeek = activities
                .Where(a => a.Note != null
                    && (a.Note.Contains("interval", StringComparison.OrdinalIgnoreCase)
                        || a.Note.Contains("tempo", StringComparison.OrdinalIgnoreCase)))
                .GroupBy(a => WeekIndex(a.Date))
                .ToDictionary(g => g.Key, g => g.Count());
            var speedCurrentWeek = currentWeek >= 1 && speedByWeek.TryGetValue(currentWeek, out var sc) ? sc : 0;
            var speedAchievedWeeks = CoreWeekRange()
                .Count(w => speedByWeek.TryGetValue(w, out var c) && c >= 1);
            var speed = new RacePrepSpeedDto(
                speedCurrentWeek,
                speedAchievedWeeks,
                CoreLastWeek - CoreFirstWeek + 1,
                SpeedTargetWeeks,
                Pct(speedAchievedWeeks, SpeedTargetWeeks));

            // --- G8: strength (Workout-type activities) ---
            var strengthByWeek = activities
                .Where(a => a.TypeName == StrengthTypeName)
                .GroupBy(a => WeekIndex(a.Date))
                .ToDictionary(g => g.Key, g => g.Count());
            var strengthCurrentWeek = currentWeek >= 1 && strengthByWeek.TryGetValue(currentWeek, out var stc) ? stc : 0;
            var strengthAchievedWeeks = Enumerable.Range(1, StrengthTotalWeeks)
                .Count(w => strengthByWeek.TryGetValue(w, out var c) && c >= StrengthWeeklyTarget);
            var strength = new RacePrepStrengthDto(
                strengthCurrentWeek,
                StrengthWeeklyTarget,
                Pct(strengthCurrentWeek, StrengthWeeklyTarget),
                strengthAchievedWeeks,
                StrengthTotalWeeks,
                StrengthTargetWeeks,
                Pct(strengthAchievedWeeks, StrengthTargetWeeks));

            // --- G9: sleep average since 3 Aug ---
            var sleepStartUtc = AppTime.StartOfLocalDayUtc(SleepGoalStart);
            var sleepLogsRaw = await _db.SleepLogs.AsNoTracking()
                .Where(s => s.UserId == userId && s.WakeTime != null && s.WakeTime >= sleepStartUtc)
                .Select(s => new { s.BedTime, s.WakeTime })
                .ToListAsync();
            var sleepByDay = sleepLogsRaw
                .Select(s => new
                {
                    Date = AppTime.ToLocalDate(s.WakeTime!.Value),
                    Minutes = (int)Math.Max(0, (s.WakeTime!.Value - s.BedTime).TotalMinutes)
                })
                .Where(s => s.Date >= SleepGoalStart && s.Date <= today)
                .GroupBy(s => s.Date)
                .Select(g => g.Sum(x => x.Minutes))
                .ToList();
            var avgSleep = sleepByDay.Count > 0 ? (int)sleepByDay.Average() : 0;
            var sleep = new RacePrepSleepDto(
                avgSleep,
                SleepTargetMinutes,
                Pct(avgSleep, SleepTargetMinutes),
                sleepByDay.Count);

            // --- G10: visualization counter ---
            var counter = await _db.RacePrepCounters.AsNoTracking()
                .FirstOrDefaultAsync(c => c.UserId == userId);
            var visualization = CountGoal(counter?.VisualizationCount ?? 0, VisualizationTarget);

            return new RacePrepOverviewDto(
                StartDate,
                RaceDate,
                TotalWeeks,
                currentWeek,
                weekPercent,
                daysToRace,
                started,
                totalVolume,
                weeklyVolume,
                longRuns,
                longerRuns,
                marathonRuns,
                backToBack,
                speed,
                strength,
                sleep,
                visualization);
        }

        public async Task<RacePrepCountGoalDto> IncrementVisualizationAsync(int userId)
        {
            var counter = await _db.RacePrepCounters.FirstOrDefaultAsync(c => c.UserId == userId);
            if (counter == null)
            {
                counter = new RacePrepCounter { UserId = userId, VisualizationCount = 0 };
                _db.RacePrepCounters.Add(counter);
            }

            counter.VisualizationCount++;
            counter.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return CountGoal(counter.VisualizationCount, VisualizationTarget);
        }

        private readonly record struct RunRow(DateOnly Date, double Km);

        private static int WeekIndex(DateOnly date) =>
            (date.DayNumber - StartDate.DayNumber) / 7 + 1;

        private static IEnumerable<int> CoreWeekRange() =>
            Enumerable.Range(CoreFirstWeek, CoreLastWeek - CoreFirstWeek + 1);

        private static RacePrepCountGoalDto CountGoal(int count, int target) =>
            new(count, target, Pct(count, target));

        private static double Pct(double current, double target) =>
            target > 0 ? Math.Round(current * 100.0 / target, 1) : 0;
    }
}
