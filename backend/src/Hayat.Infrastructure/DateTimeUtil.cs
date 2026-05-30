using System;

namespace Hayat.Infrastructure
{
    public static class DateTimeUtil
    {
        /// <summary>Values from SQLite have Unspecified kind but represent UTC instants from the API.</summary>
        public static DateTime AsUtc(DateTime value) =>
            value.Kind == DateTimeKind.Utc
                ? value
                : DateTime.SpecifyKind(value, DateTimeKind.Utc);

        public static DateTime? AsUtc(DateTime? value) =>
            value.HasValue ? AsUtc(value.Value) : null;
    }
}
