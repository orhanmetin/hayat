using System;
using System.Globalization;

namespace Hayat.Application.Common
{
    public static class WeekHelper
    {
        public static (int Year, int WeekNumber) GetIsoWeek(DateOnly date)
        {
            var dt = date.ToDateTime(TimeOnly.MinValue);
            var week = ISOWeek.GetWeekOfYear(dt);
            var year = ISOWeek.GetYear(dt);
            return (year, week);
        }

        public static (DateOnly Start, DateOnly End) GetWeekRange(int year, int weekNumber)
        {
            var start = DateOnly.FromDateTime(ISOWeek.ToDateTime(year, weekNumber, DayOfWeek.Monday));
            return (start, start.AddDays(6));
        }
    }
}
