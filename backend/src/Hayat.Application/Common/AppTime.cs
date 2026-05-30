using System;

namespace Hayat.Application.Common
{
    /// <summary>Calendar dates for the app (default: Europe/Istanbul).</summary>
    public static class AppTime
    {
        private static readonly TimeZoneInfo AppZone = ResolveTimeZone();

        public static string TimeZoneId => AppZone.Id;

        public static DateOnly Today => DateOnly.FromDateTime(LocalNow);

        public static DateTime LocalNow =>
            TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, AppZone);

        public static DateOnly ToLocalDate(DateTime utcOrUnspecified)
        {
            var utc = utcOrUnspecified.Kind switch
            {
                DateTimeKind.Utc => utcOrUnspecified,
                DateTimeKind.Local => utcOrUnspecified.ToUniversalTime(),
                _ => DateTime.SpecifyKind(utcOrUnspecified, DateTimeKind.Utc)
            };
            return DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(utc, AppZone));
        }

        public static DateTime StartOfLocalDayUtc(DateOnly date)
        {
            var local = date.ToDateTime(TimeOnly.MinValue, DateTimeKind.Unspecified);
            return TimeZoneInfo.ConvertTimeToUtc(local, AppZone);
        }

        public static DateTime EndOfLocalDayUtc(DateOnly date)
        {
            var local = date.ToDateTime(new TimeOnly(23, 59, 59, 999), DateTimeKind.Unspecified);
            return TimeZoneInfo.ConvertTimeToUtc(local, AppZone);
        }

        private static TimeZoneInfo ResolveTimeZone()
        {
            foreach (var id in new[] { "Europe/Istanbul", "Turkey Standard Time" })
            {
                if (TimeZoneInfo.TryFindSystemTimeZoneById(id, out var tz))
                    return tz;
            }

            return TimeZoneInfo.Utc;
        }
    }
}
