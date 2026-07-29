using System;
using System.Globalization;
using System.Text.RegularExpressions;

namespace Hayat.Api.Shortcuts
{
    /// <summary>
    /// Parses Shortcuts screen-time lines like <c>Chrome (33m)</c> or <c>Shortcuts (2h 5m)</c>.
    /// </summary>
    public static partial class ScreenTimeAppLineParser
    {
        [GeneratedRegex(
            @"^(?<name>.+?)\s*\((?<dur>[^)]+)\)\s*$",
            RegexOptions.CultureInvariant)]
        private static partial Regex LineRegex();

        [GeneratedRegex(
            @"(\d+)\s*(h|hr|hrs|hour|hours|m|min|mins|minute|minutes)\b",
            RegexOptions.CultureInvariant | RegexOptions.IgnoreCase)]
        private static partial Regex DurationPartRegex();

        public static bool TryParse(string? line, out string appName, out int minutes)
        {
            appName = "";
            minutes = 0;
            if (string.IsNullOrWhiteSpace(line)) return false;

            var match = LineRegex().Match(line.Trim());
            if (!match.Success) return false;

            var name = match.Groups["name"].Value.Trim();
            if (string.IsNullOrEmpty(name)) return false;

            if (!TryParseDuration(match.Groups["dur"].Value, out minutes) || minutes <= 0)
                return false;

            if (name.Length > 120) name = name[..120];
            appName = name;
            return true;
        }

        public static bool TryParseDuration(string? duration, out int minutes)
        {
            minutes = 0;
            if (string.IsNullOrWhiteSpace(duration)) return false;

            // "2h5m" → insert spaces so part regex matches.
            var s = duration.Trim();
            s = Regex.Replace(s, @"(?<=\d)([hH])(?=\d)", "$1 ");
            s = Regex.Replace(s, @"\s+", " ");

            var hours = 0;
            var mins = 0;
            var matched = false;

            foreach (Match part in DurationPartRegex().Matches(s))
            {
                matched = true;
                var n = int.Parse(part.Groups[1].Value, CultureInfo.InvariantCulture);
                var unit = part.Groups[2].Value;
                if (unit.StartsWith("h", StringComparison.OrdinalIgnoreCase))
                    hours += n;
                else
                    mins += n;
            }

            if (!matched)
            {
                if (int.TryParse(s, NumberStyles.Integer, CultureInfo.InvariantCulture, out var bare) && bare > 0)
                {
                    minutes = bare;
                    return true;
                }
                return false;
            }

            minutes = hours * 60 + mins;
            return minutes > 0;
        }
    }
}
