using System;
using System.Collections.Generic;

namespace Hayat.Application.Common
{
    public static class ChartBuckets
    {
        private static readonly string[] TrShortMonths =
            { "Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara" };

        private static readonly string[] TrShortDays =
            { "Pzr", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt" };

        public record BucketDef(string Key, string Label, DateOnly Start, DateOnly End);

        public static DateOnly StartOfIsoWeek(DateOnly date)
        {
            int dow = (int)date.DayOfWeek;
            int diff = dow == 0 ? 6 : dow - 1;
            return date.AddDays(-diff);
        }

        public static (DateOnly RangeStart, string Period, string[] AllowedBuckets) ResolvePeriod(string period, DateOnly today)
        {
            var normalized = (period ?? string.Empty).ToLowerInvariant() switch
            {
                "monthly" => "monthly",
                "yearly" => "yearly",
                _ => "weekly"
            };

            var rangeStart = normalized switch
            {
                "monthly" => new DateOnly(today.Year, today.Month, 1),
                "yearly" => new DateOnly(today.Year, 1, 1),
                _ => StartOfIsoWeek(today)
            };

            var allowedBuckets = normalized switch
            {
                "weekly" => new[] { "daily" },
                "monthly" => new[] { "weekly", "daily" },
                "yearly" => new[] { "monthly", "weekly", "daily" },
                _ => new[] { "daily" }
            };

            return (rangeStart, normalized, allowedBuckets);
        }

        public static string NormalizeBucket(string? bucket, string[] allowedBuckets)
        {
            var requested = (bucket ?? string.Empty).ToLowerInvariant();
            return Array.IndexOf(allowedBuckets, requested) >= 0 ? requested : allowedBuckets[0];
        }

        public static List<BucketDef> Build(DateOnly rangeStart, DateOnly rangeEnd, string period, string bucket)
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
    }
}
