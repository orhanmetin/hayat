using System;
using System.Collections.Generic;
using System.Linq;

namespace Hayat.Application.Common
{
    public static class StreakCalculator
    {
        public static int GetCurrentStreak(IEnumerable<DateOnly> checkInDates, DateOnly? asOf = null)
        {
            var dates = checkInDates.Distinct().ToHashSet();
            if (dates.Count == 0) return 0;

            var today = asOf ?? AppTime.Today;
            var cursor = dates.Contains(today) ? today : today.AddDays(-1);

            if (!dates.Contains(cursor)) return 0;

            var streak = 0;
            while (dates.Contains(cursor))
            {
                streak++;
                cursor = cursor.AddDays(-1);
            }

            return streak;
        }

        public static int GetBestStreak(IEnumerable<DateOnly> checkInDates)
        {
            var dates = checkInDates.Distinct().OrderBy(d => d).ToList();
            if (dates.Count == 0) return 0;

            var best = 1;
            var current = 1;

            for (var i = 1; i < dates.Count; i++)
            {
                if (dates[i] == dates[i - 1].AddDays(1))
                {
                    current++;
                    best = Math.Max(best, current);
                }
                else
                {
                    current = 1;
                }
            }

            return best;
        }
    }
}
