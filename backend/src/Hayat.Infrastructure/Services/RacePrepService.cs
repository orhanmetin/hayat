using System;
using System.Collections.Generic;
using System.Globalization;
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

        private static readonly CultureInfo TrCulture = CultureInfo.GetCultureInfo("tr-TR");

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

            var activities = await LoadActivitiesAsync(userId);
            var runs = RunsOf(activities);

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
                .Where(IsSpeedWork)
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

            // --- G9: sleep average from daily SleepLogs (Olaylar) since plan start ---
            var sleepByDay = await LoadSleepByDayAsync(userId, today);
            var avgSleep = sleepByDay.Count > 0 ? (int)sleepByDay.Average(x => x.Minutes) : 0;
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

        public async Task<RacePrepGoalDetailDto?> GetGoalDetailAsync(int userId, string goalKey)
        {
            var key = (goalKey ?? string.Empty).Trim().ToLowerInvariant();
            var today = AppTime.Today;
            var currentWeek = today >= StartDate
                ? Math.Min(TotalWeeks, (today.DayNumber - StartDate.DayNumber) / 7 + 1)
                : 0;
            var weeksToShow = Math.Max(1, currentWeek);

            return key switch
            {
                "totalvolume" or "g1" => await TrendWeeklyRunKmAsync(
                    userId, "totalVolume", "Toplam Hacim", weeksToShow, null),
                "weeklyvolume" or "g2" => await TrendWeeklyRunKmAsync(
                    userId, "weeklyVolume", "Haftalık Hacim", weeksToShow, WeeklyVolumeTargetKm),
                "longruns" or "g3" => await ListRunsAsync(
                    userId, "longRuns", "Uzun Koşu", minKm: 21),
                "longerruns" or "g4" => await ListRunsAsync(
                    userId, "longerRuns", "Çok Uzun Koşu", minKm: 30),
                "marathonruns" or "g5" => await ListRunsAsync(
                    userId, "marathonRuns", "Maraton Mesafesi", minKm: 42),
                "backtoback" or "g6" => await ListBackToBackAsync(userId),
                "speed" or "g7" => await TrendSpeedAsync(userId, weeksToShow),
                "strength" or "g8" => await TrendStrengthAsync(userId, weeksToShow),
                "sleep" or "g9" => await TrendSleepAsync(userId, today),
                "visualization" or "g10" => ListVisualization(),
                _ => null
            };
        }

        private async Task<RacePrepGoalDetailDto> TrendWeeklyRunKmAsync(
            int userId, string goalKey, string title, int weeksToShow, double? target)
        {
            var runs = RunsOf(await LoadActivitiesAsync(userId));
            var kmByWeek = runs
                .GroupBy(r => WeekIndex(r.Date))
                .ToDictionary(g => g.Key, g => g.Sum(r => r.Km));

            var trend = Enumerable.Range(1, weeksToShow)
                .Select(w =>
                {
                    kmByWeek.TryGetValue(w, out var km);
                    return new RacePrepTrendPointDto($"w{w}", $"H{w}", Math.Round(km, 1));
                })
                .ToList();

            return new RacePrepGoalDetailDto(
                goalKey, "trend", title, "km", target, trend, Array.Empty<RacePrepActivityItemDto>());
        }

        private async Task<RacePrepGoalDetailDto> TrendSpeedAsync(int userId, int weeksToShow)
        {
            var activities = await LoadActivitiesAsync(userId);
            var byWeek = activities
                .Where(IsSpeedWork)
                .GroupBy(a => WeekIndex(a.Date))
                .ToDictionary(g => g.Key, g => g.Count());

            var trend = Enumerable.Range(1, weeksToShow)
                .Select(w =>
                {
                    byWeek.TryGetValue(w, out var count);
                    return new RacePrepTrendPointDto($"w{w}", $"H{w}", count);
                })
                .ToList();

            return new RacePrepGoalDetailDto(
                "speed", "trend", "Hız Çalışması", "count", 1, trend, Array.Empty<RacePrepActivityItemDto>());
        }

        private async Task<RacePrepGoalDetailDto> TrendStrengthAsync(int userId, int weeksToShow)
        {
            var activities = await LoadActivitiesAsync(userId);
            var byWeek = activities
                .Where(a => a.TypeName == StrengthTypeName)
                .GroupBy(a => WeekIndex(a.Date))
                .ToDictionary(g => g.Key, g => g.Count());

            var trend = Enumerable.Range(1, weeksToShow)
                .Select(w =>
                {
                    byWeek.TryGetValue(w, out var count);
                    return new RacePrepTrendPointDto($"w{w}", $"H{w}", count);
                })
                .ToList();

            return new RacePrepGoalDetailDto(
                "strength", "trend", "Güç Çalışması", "count", StrengthWeeklyTarget,
                trend, Array.Empty<RacePrepActivityItemDto>());
        }

        private async Task<RacePrepGoalDetailDto> TrendSleepAsync(int userId, DateOnly today)
        {
            var sleepByDay = await LoadSleepByDayAsync(userId, today);
            var trend = sleepByDay
                .OrderBy(x => x.Date)
                .Select(x => new RacePrepTrendPointDto(
                    x.Date.ToString("yyyy-MM-dd"),
                    FormatShortDate(x.Date),
                    x.Minutes))
                .ToList();

            return new RacePrepGoalDetailDto(
                "sleep", "trend", "Uyku", "minutes", SleepTargetMinutes,
                trend, Array.Empty<RacePrepActivityItemDto>());
        }

        private async Task<RacePrepGoalDetailDto> ListRunsAsync(
            int userId, string goalKey, string title, double minKm)
        {
            var activities = await LoadActivitiesAsync(userId);
            var items = activities
                .Where(a => a.TypeName == RunTypeName && a.Km >= minKm)
                .OrderByDescending(a => a.Date)
                .ThenByDescending(a => a.Km)
                .Select(a => new RacePrepActivityItemDto(
                    FormatShortDate(a.Date),
                    string.IsNullOrWhiteSpace(a.Note) ? RunTypeName : a.Note!.Trim(),
                    $"{Math.Round(a.Km, 1)} km · {a.DurationMinutes} dk",
                    Math.Round(a.Km, 1),
                    "km",
                    a.StravaLink))
                .ToList();

            return new RacePrepGoalDetailDto(
                goalKey, "list", title, "km", null,
                Array.Empty<RacePrepTrendPointDto>(), items);
        }

        private async Task<RacePrepGoalDetailDto> ListBackToBackAsync(int userId)
        {
            var runs = RunsOf(await LoadActivitiesAsync(userId));
            var dailyKm = runs
                .GroupBy(r => r.Date)
                .ToDictionary(g => g.Key, g => g.Sum(r => r.Km));

            var items = dailyKm.Keys
                .OrderByDescending(d => d)
                .Where(d => dailyKm[d] >= 30
                    && dailyKm.TryGetValue(d.AddDays(1), out var next) && next >= 30)
                .Select(d =>
                {
                    var day1 = Math.Round(dailyKm[d], 1);
                    var day2 = Math.Round(dailyKm[d.AddDays(1)], 1);
                    return new RacePrepActivityItemDto(
                        $"{FormatShortDate(d)} – {FormatShortDate(d.AddDays(1))}",
                        "Back to Back",
                        $"{day1} km + {day2} km",
                        day1 + day2,
                        "km",
                        null);
                })
                .ToList();

            return new RacePrepGoalDetailDto(
                "backToBack", "list", "Back to Back", "km", null,
                Array.Empty<RacePrepTrendPointDto>(), items);
        }

        private static RacePrepGoalDetailDto ListVisualization() =>
            new(
                "visualization",
                "list",
                "Görselleştirme",
                "count",
                null,
                Array.Empty<RacePrepTrendPointDto>(),
                Array.Empty<RacePrepActivityItemDto>());

        private async Task<List<ActivityRow>> LoadActivitiesAsync(int userId)
        {
            var rangeEnd = RaceDate.AddDays(1);
            return await _db.SportActivities.AsNoTracking()
                .Where(a => a.UserId == userId && a.Date >= StartDate && a.Date <= rangeEnd)
                .Select(a => new ActivityRow(
                    a.Date,
                    (double)(a.DistanceKm ?? 0),
                    a.DurationMinutes,
                    a.Note,
                    a.StravaLink,
                    a.SportActivityType.Name))
                .ToListAsync();
        }

        private async Task<List<(DateOnly Date, int Minutes)>> LoadSleepByDayAsync(int userId, DateOnly today)
        {
            var sleepStartUtc = AppTime.StartOfLocalDayUtc(StartDate);
            var sleepLogsRaw = await _db.SleepLogs.AsNoTracking()
                .Where(s => s.UserId == userId && s.WakeTime != null && s.WakeTime >= sleepStartUtc)
                .Select(s => new { s.BedTime, s.WakeTime })
                .ToListAsync();

            return sleepLogsRaw
                .Select(s => (
                    Date: AppTime.ToLocalDate(s.WakeTime!.Value),
                    Minutes: (int)Math.Max(0, (s.WakeTime!.Value - s.BedTime).TotalMinutes)))
                .Where(s => s.Date >= StartDate && s.Date <= today)
                .GroupBy(s => s.Date)
                .Select(g => (g.Key, g.Sum(x => x.Minutes)))
                .OrderBy(x => x.Key)
                .ToList();
        }

        private static List<RunRow> RunsOf(List<ActivityRow> activities) =>
            activities
                .Where(a => a.TypeName == RunTypeName)
                .Select(a => new RunRow(a.Date, a.Km))
                .ToList();

        private static bool IsSpeedWork(ActivityRow a) =>
            a.Note != null
            && (a.Note.Contains("interval", StringComparison.OrdinalIgnoreCase)
                || a.Note.Contains("tempo", StringComparison.OrdinalIgnoreCase));

        private readonly record struct RunRow(DateOnly Date, double Km);

        private readonly record struct ActivityRow(
            DateOnly Date,
            double Km,
            int DurationMinutes,
            string? Note,
            string? StravaLink,
            string TypeName);

        private static int WeekIndex(DateOnly date) =>
            (date.DayNumber - StartDate.DayNumber) / 7 + 1;

        private static IEnumerable<int> CoreWeekRange() =>
            Enumerable.Range(CoreFirstWeek, CoreLastWeek - CoreFirstWeek + 1);

        private static RacePrepCountGoalDto CountGoal(int count, int target) =>
            new(count, target, Pct(count, target));

        private static double Pct(double current, double target) =>
            target > 0 ? Math.Round(current * 100.0 / target, 1) : 0;

        private static string FormatShortDate(DateOnly date) =>
            date.ToDateTime(TimeOnly.MinValue).ToString("d MMM", TrCulture);
    }
}
