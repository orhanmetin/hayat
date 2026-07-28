using System;
using System.Collections.Generic;
using System.Globalization;
using System.Text.Json;
using Hayat.Application.DTOs;

namespace Hayat.Api.Shortcuts
{
    /// <summary>
    /// Parses iOS Shortcuts JSON bodies leniently: wrapped {days:[...]}, raw arrays,
    /// single-day objects, or Health-Sample-like dictionaries (Value / Start Date).
    /// </summary>
    public static class ShortcutsBodyParser
    {
        private static readonly CultureInfo[] DateCultures =
        [
            CultureInfo.InvariantCulture,
            new CultureInfo("tr-TR"),
            new CultureInfo("en-US"),
            new CultureInfo("en-GB"),
        ];

        private static readonly string[] DateKeys =
        [
            "date", "startDate", "start", "Start Date", "Başlangıç Tarihi", "baslangicTarihi"
        ];

        private static readonly string[] StepsKeys =
        [
            "steps", "value", "Value", "count", "Count", "adim", "Adım"
        ];

        public static UpsertDailyStepsRequest? ParseSteps(JsonElement body)
        {
            string? source = null;
            var days = new List<UpsertDailyStepItem>();

            if (body.ValueKind == JsonValueKind.Array)
            {
                foreach (var el in body.EnumerateArray())
                    if (TryParseStepItem(el, out var item))
                        days.Add(item);
            }
            else if (body.ValueKind == JsonValueKind.Object)
            {
                if (TryGetProperty(body, "source", out var sourceEl) && sourceEl.ValueKind == JsonValueKind.String)
                    source = sourceEl.GetString();

                if (TryGetProperty(body, "days", out var daysEl) && daysEl.ValueKind == JsonValueKind.Array)
                {
                    foreach (var el in daysEl.EnumerateArray())
                        if (TryParseStepItem(el, out var item))
                            days.Add(item);
                }
                else if (TryParseStepItem(body, out var single))
                {
                    days.Add(single);
                }
            }

            return days.Count == 0 ? null : new UpsertDailyStepsRequest(days, source);
        }

        public static UpsertScreenTimeRequest? ParseScreenTime(JsonElement body)
        {
            var days = new List<UpsertScreenTimeDay>();

            if (body.ValueKind == JsonValueKind.Array)
            {
                foreach (var el in body.EnumerateArray())
                    if (TryParseScreenDay(el, out var day))
                        days.Add(day);
            }
            else if (body.ValueKind == JsonValueKind.Object)
            {
                if (TryGetProperty(body, "days", out var daysEl) && daysEl.ValueKind == JsonValueKind.Array)
                {
                    foreach (var el in daysEl.EnumerateArray())
                        if (TryParseScreenDay(el, out var day))
                            days.Add(day);
                }
                else if (TryParseScreenDay(body, out var single))
                {
                    days.Add(single);
                }
            }

            return days.Count == 0 ? null : new UpsertScreenTimeRequest(days);
        }

        private static bool TryParseStepItem(JsonElement el, out UpsertDailyStepItem item)
        {
            item = null!;
            if (el.ValueKind != JsonValueKind.Object) return false;
            if (!TryGetPropertyAny(el, DateKeys, out var dateEl) || !TryParseDate(dateEl, out var date))
                return false;
            if (!TryGetPropertyAny(el, StepsKeys, out var stepsEl) || !TryParseInt(stepsEl, out var steps))
                return false;
            item = new UpsertDailyStepItem(date, steps);
            return true;
        }

        private static bool TryParseScreenDay(JsonElement el, out UpsertScreenTimeDay day)
        {
            day = null!;
            if (el.ValueKind != JsonValueKind.Object) return false;
            if (!TryGetPropertyAny(el, DateKeys, out var dateEl) || !TryParseDate(dateEl, out var date))
                return false;

            var entries = new List<UpsertScreenTimeItem>();
            if (TryGetProperty(el, "entries", out var entriesEl) && entriesEl.ValueKind == JsonValueKind.Array)
            {
                foreach (var entryEl in entriesEl.EnumerateArray())
                {
                    if (entryEl.ValueKind != JsonValueKind.Object) continue;
                    if (!TryGetProperty(entryEl, "appName", out var nameEl) &&
                        !TryGetProperty(entryEl, "app", out nameEl) &&
                        !TryGetProperty(entryEl, "name", out nameEl))
                        continue;
                    var name = nameEl.ValueKind == JsonValueKind.String ? nameEl.GetString() : null;
                    if (string.IsNullOrWhiteSpace(name)) continue;
                    if (!TryGetProperty(entryEl, "minutes", out var minEl) || !TryParseInt(minEl, out var minutes))
                        continue;
                    string? kind = null;
                    if (TryGetProperty(entryEl, "kind", out var kindEl) && kindEl.ValueKind == JsonValueKind.String)
                        kind = kindEl.GetString();
                    entries.Add(new UpsertScreenTimeItem(name.Trim(), minutes, kind));
                }
            }

            day = new UpsertScreenTimeDay(date, entries);
            return true;
        }

        private static bool TryParseDate(JsonElement el, out DateOnly date)
        {
            date = default;
            if (el.ValueKind == JsonValueKind.String)
            {
                var s = el.GetString();
                if (string.IsNullOrWhiteSpace(s)) return false;
                s = s.Trim();

                // "23541 count" is not a date — reject early if it looks like a count line.
                if (s.Contains("count", StringComparison.OrdinalIgnoreCase) && !s.Contains(','))
                    return false;

                if (DateOnly.TryParseExact(s, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out date))
                    return true;

                // Shortcuts TR preview: "21.07.2026, 00:30"
                if (DateTime.TryParseExact(
                        s,
                        ["dd.MM.yyyy, HH:mm", "dd.MM.yyyy HH:mm", "dd.MM.yyyy"],
                        new CultureInfo("tr-TR"),
                        DateTimeStyles.None,
                        out var trDt))
                {
                    date = DateOnly.FromDateTime(trDt);
                    return true;
                }

                foreach (var culture in DateCultures)
                {
                    if (DateOnly.TryParse(s, culture, DateTimeStyles.None, out date))
                        return true;
                    if (DateTime.TryParse(s, culture, DateTimeStyles.AssumeLocal, out var dt))
                    {
                        date = DateOnly.FromDateTime(dt);
                        return true;
                    }
                }

                return false;
            }

            if (el.ValueKind == JsonValueKind.Number && el.TryGetInt64(out var unix))
            {
                // Shortcuts sometimes sends unix seconds or milliseconds.
                var seconds = unix > 10_000_000_000L ? unix / 1000L : unix;
                date = DateOnly.FromDateTime(DateTimeOffset.FromUnixTimeSeconds(seconds).LocalDateTime);
                return true;
            }

            return false;
        }

        private static bool TryParseInt(JsonElement el, out int value)
        {
            value = 0;
            if (el.ValueKind == JsonValueKind.Number && el.TryGetInt32(out value))
                return true;
            if (el.ValueKind == JsonValueKind.Number && el.TryGetDouble(out var d))
            {
                value = (int)Math.Round(d);
                return true;
            }
            if (el.ValueKind == JsonValueKind.String)
            {
                var s = el.GetString()?.Trim();
                if (string.IsNullOrEmpty(s)) return false;
                // "23541 count" → 23541
                var first = s.Split(' ', StringSplitOptions.RemoveEmptyEntries)[0];
                if (int.TryParse(first, NumberStyles.Integer, CultureInfo.InvariantCulture, out value))
                    return true;
            }
            return false;
        }

        private static bool TryGetPropertyAny(JsonElement obj, IEnumerable<string> names, out JsonElement value)
        {
            foreach (var name in names)
            {
                if (TryGetProperty(obj, name, out value))
                    return true;
            }

            value = default;
            return false;
        }

        private static bool TryGetProperty(JsonElement obj, string name, out JsonElement value)
        {
            if (obj.TryGetProperty(name, out value)) return true;
            foreach (var prop in obj.EnumerateObject())
            {
                if (string.Equals(prop.Name, name, StringComparison.OrdinalIgnoreCase))
                {
                    value = prop.Value;
                    return true;
                }
            }
            value = default;
            return false;
        }
    }
}
