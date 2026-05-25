using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Hayat.Application.Common;
using Hayat.Application.DTOs;
using Hayat.Application.Interfaces;
using Hayat.Infrastructure.Data;

namespace Hayat.Infrastructure.Services
{
    public class DashboardService : IDashboardService
    {
        private readonly AppDbContext _db;

        private static readonly string[] TrShortMonths =
            { "Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara" };

        private static readonly string[] TrShortDays =
            { "Pzr", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt" };

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
            var overview = await GetOverviewAsync(userId, period, null);
            var charts = new List<DashboardChartDto>
            {
                new("Uyku (dk)", overview.Series.Sleep.Select(p => new ChartDataPointDto(p.Label, p.Minutes)).ToList()),
                new("Spor (dk)", overview.Series.Sport.Buckets.Select(b => new ChartDataPointDto(b.Label, b.Total)).ToList()),
                new("Meditasyon (dk)", overview.Series.Meditation.Select(p => new ChartDataPointDto(p.Label, p.Minutes)).ToList()),
                new("Deep Work (dk)", overview.Series.DeepWork.Buckets.Select(b => new ChartDataPointDto(b.Label, b.Total)).ToList())
            };
            return new DashboardAnalyticsDto(overview.Period, charts);
        }

        public async Task<DashboardOverviewDto> GetOverviewAsync(int userId, string period, string? bucket)
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);

            var normalizedPeriod = (period ?? string.Empty).ToLowerInvariant() switch
            {
                "monthly" => "monthly",
                "yearly" => "yearly",
                _ => "weekly"
            };

            var rangeStart = normalizedPeriod switch
            {
                "monthly" => new DateOnly(today.Year, today.Month, 1),
                "yearly" => new DateOnly(today.Year, 1, 1),
                _ => StartOfIsoWeek(today)
            };

            var allowedBuckets = normalizedPeriod switch
            {
                "weekly" => new[] { "daily" },
                "monthly" => new[] { "weekly", "daily" },
                "yearly" => new[] { "monthly", "weekly", "daily" },
                _ => new[] { "daily" }
            };
            var requestedBucket = (bucket ?? string.Empty).ToLowerInvariant();
            var normalizedBucket = Array.IndexOf(allowedBuckets, requestedBucket) >= 0
                ? requestedBucket
                : allowedBuckets[0];

            var showTargets = normalizedPeriod == "weekly";
            var daysElapsed = today.DayNumber - rangeStart.DayNumber + 1;

            // ---- Raw queries ----
            var sleepRows = await _db.SleepLogs.AsNoTracking()
                .Where(s => s.UserId == userId && s.WakeTime != null
                    && DateOnly.FromDateTime(s.WakeTime!.Value) >= rangeStart
                    && DateOnly.FromDateTime(s.WakeTime!.Value) <= today)
                .Select(s => new
                {
                    Date = DateOnly.FromDateTime(s.WakeTime!.Value),
                    Minutes = (int)(s.WakeTime!.Value - s.BedTime).TotalMinutes
                })
                .ToListAsync();

            var sportRows = await _db.SportActivities.AsNoTracking()
                .Where(s => s.UserId == userId && s.Date >= rangeStart && s.Date <= today)
                .Include(s => s.SportActivityType)
                .Select(s => new
                {
                    s.Date,
                    s.DurationMinutes,
                    TypeName = s.SportActivityType.Name
                })
                .ToListAsync();

            var deepWorkRows = await _db.DeepWorkSessions.AsNoTracking()
                .Where(s => s.UserId == userId && s.Date >= rangeStart && s.Date <= today)
                .Include(s => s.DeepWorkType)
                .Select(s => new
                {
                    s.Date,
                    s.DurationMinutes,
                    TypeName = s.DeepWorkType.Name
                })
                .ToListAsync();

            var meditationRows = await _db.MeditationSessions.AsNoTracking()
                .Where(s => s.UserId == userId && s.Date >= rangeStart && s.Date <= today)
                .Select(s => new { s.Date, s.DurationMinutes })
                .ToListAsync();

            // ---- Card aggregates ----
            var sportTotal = sportRows.Sum(s => s.DurationMinutes);
            var sportBreakdown = sportRows
                .GroupBy(s => s.TypeName)
                .Select(g => new CategoryBreakdownItemDto(g.Key, g.Sum(x => x.DurationMinutes)))
                .OrderByDescending(b => b.Minutes)
                .ToList();

            var sleepTotal = sleepRows.Sum(s => s.Minutes);
            var sleepAvg = daysElapsed > 0 ? sleepTotal / daysElapsed : 0;

            var deepWorkTotal = deepWorkRows.Sum(s => s.DurationMinutes);
            var deepWorkAvg = daysElapsed > 0 ? deepWorkTotal / daysElapsed : 0;
            var deepWorkBreakdown = deepWorkRows
                .GroupBy(s => s.TypeName)
                .Select(g => new CategoryBreakdownItemDto(g.Key, g.Sum(x => x.DurationMinutes)))
                .OrderByDescending(b => b.Minutes)
                .ToList();

            var meditationTotal = meditationRows.Sum(s => s.DurationMinutes);
            var meditationAvg = daysElapsed > 0 ? meditationTotal / daysElapsed : 0;

            int? sleepTarget = null, sportTarget = null, deepWorkTarget = null, meditationTarget = null;
            if (showTargets)
            {
                var (year, week) = WeekHelper.GetIsoWeek(today);
                var goal = await _db.WeeklyGoals.AsNoTracking()
                    .FirstOrDefaultAsync(g => g.UserId == userId && g.Year == year && g.WeekNumber == week);
                if (goal != null)
                {
                    sleepTarget = goal.TargetAvgSleepMinutesPerDay;
                    sportTarget = goal.TargetTotalSportMinutes;
                    deepWorkTarget = goal.TargetAvgDeepWorkMinutesPerDay;
                    meditationTarget = goal.TargetAvgMeditationMinutesPerDay;
                }
            }

            // ---- Buckets ----
            var bucketDefs = BuildBuckets(rangeStart, today, normalizedPeriod, normalizedBucket);

            var sleepSeries = BuildSimpleSeries(bucketDefs, sleepRows.Select(r => (r.Date, r.Minutes)));
            var meditationSeries = BuildSimpleSeries(bucketDefs, meditationRows.Select(r => (r.Date, r.DurationMinutes)));
            var sportStacked = BuildStackedSeries(bucketDefs, sportRows.Select(r => (r.Date, r.TypeName, r.DurationMinutes)));
            var deepWorkStacked = BuildStackedSeries(bucketDefs, deepWorkRows.Select(r => (r.Date, r.TypeName, r.DurationMinutes)));

            var cards = new DashboardCardsDto(
                new SportCardDto(sportTotal, sportTarget, sportBreakdown),
                new SleepCardDto(sleepTotal, sleepAvg, sleepTarget),
                new DeepWorkCardDto(deepWorkTotal, deepWorkAvg, deepWorkTarget, deepWorkBreakdown),
                new MeditationCardDto(meditationTotal, meditationAvg, meditationTarget)
            );

            var series = new DashboardSeriesDto(sleepSeries, meditationSeries, sportStacked, deepWorkStacked);

            return new DashboardOverviewDto(
                normalizedPeriod,
                normalizedBucket,
                allowedBuckets,
                rangeStart,
                today,
                daysElapsed,
                showTargets,
                cards,
                series
            );
        }

        // ---- Bucket helpers ----

        private record struct BucketDef(string Key, string Label, DateOnly Start, DateOnly End);

        private static List<BucketDef> BuildBuckets(DateOnly rangeStart, DateOnly rangeEnd, string period, string bucket)
        {
            var result = new List<BucketDef>();

            switch (bucket)
            {
                case "daily":
                    var bigDailyRange = (rangeEnd.DayNumber - rangeStart.DayNumber) > 9;
                    for (var d = rangeStart; d <= rangeEnd; d = d.AddDays(1))
                    {
                        var key = d.ToString("yyyy-MM-dd");
                        var label = bigDailyRange
                            ? $"{d.Day:D2}.{d.Month:D2}"
                            : TrShortDays[(int)d.DayOfWeek];
                        result.Add(new BucketDef(key, label, d, d));
                    }
                    break;

                case "weekly":
                    var cursor = rangeStart;
                    var weekIndex = 1;
                    while (cursor <= rangeEnd)
                    {
                        var weekStart = StartOfIsoWeek(cursor);
                        var weekEnd = weekStart.AddDays(6);
                        var (year, week) = WeekHelper.GetIsoWeek(weekStart);
                        var clampedStart = weekStart < rangeStart ? rangeStart : weekStart;
                        var clampedEnd = weekEnd > rangeEnd ? rangeEnd : weekEnd;
                        var key = $"{year:D4}-W{week:D2}";
                        var label = period == "monthly"
                            ? $"{weekIndex}. Hafta"
                            : $"H{week}";
                        result.Add(new BucketDef(key, label, clampedStart, clampedEnd));
                        cursor = weekEnd.AddDays(1);
                        weekIndex++;
                    }
                    break;

                case "monthly":
                    var monthCursor = new DateOnly(rangeStart.Year, rangeStart.Month, 1);
                    while (monthCursor <= rangeEnd)
                    {
                        var monthStart = monthCursor;
                        var monthEnd = new DateOnly(
                            monthCursor.Year,
                            monthCursor.Month,
                            DateTime.DaysInMonth(monthCursor.Year, monthCursor.Month));
                        var clampedStart = monthStart < rangeStart ? rangeStart : monthStart;
                        var clampedEnd = monthEnd > rangeEnd ? rangeEnd : monthEnd;
                        var key = $"{monthCursor.Year:D4}-{monthCursor.Month:D2}";
                        var label = TrShortMonths[monthCursor.Month - 1];
                        result.Add(new BucketDef(key, label, clampedStart, clampedEnd));
                        monthCursor = monthStart.AddMonths(1);
                    }
                    break;
            }

            return result;
        }

        private static List<TimeBucketValueDto> BuildSimpleSeries(
            List<BucketDef> buckets,
            IEnumerable<(DateOnly Date, int Minutes)> data)
        {
            var dataList = data.ToList();
            return buckets.Select(b =>
                new TimeBucketValueDto(
                    b.Key,
                    b.Label,
                    dataList.Where(d => d.Date >= b.Start && d.Date <= b.End).Sum(d => d.Minutes)
                )
            ).ToList();
        }

        private static StackedSeriesDto BuildStackedSeries(
            List<BucketDef> buckets,
            IEnumerable<(DateOnly Date, string TypeName, int Minutes)> data)
        {
            var dataList = data.ToList();

            var categories = dataList
                .GroupBy(d => d.TypeName)
                .Select(g => new { Name = g.Key, Total = g.Sum(x => x.Minutes) })
                .OrderByDescending(g => g.Total)
                .Select(g => g.Name)
                .ToList();

            var stackedBuckets = buckets.Select(b =>
            {
                var inRange = dataList.Where(d => d.Date >= b.Start && d.Date <= b.End).ToList();
                var segments = new Dictionary<string, int>();
                foreach (var cat in categories)
                {
                    segments[cat] = inRange.Where(d => d.TypeName == cat).Sum(d => d.Minutes);
                }
                return new StackedBucketDto(b.Key, b.Label, inRange.Sum(d => d.Minutes), segments);
            }).ToList();

            return new StackedSeriesDto(categories, stackedBuckets);
        }

        private static DateOnly StartOfIsoWeek(DateOnly date)
        {
            int dow = (int)date.DayOfWeek;
            int diff = dow == 0 ? 6 : dow - 1;
            return date.AddDays(-diff);
        }
    }
}
