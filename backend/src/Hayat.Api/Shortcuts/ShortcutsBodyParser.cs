using System;
using System.Collections.Generic;
using System.Globalization;
using System.Text.Json;
using Hayat.Application.Common;
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

        /// <summary>
        /// Simplified screen-time body (apps only, no websites):
        /// <code>{ "date": "2026-07-29", "apps": ["Chrome (33m)", "Shortcuts (2h 5m)"] }</code>
        /// or a raw string array (uses today), or <c>days: [{ date, apps }]</c>.
        /// </summary>
        public static UpsertScreenTimeRequest? ParseScreenTime(JsonElement body, DateOnly? today = null)
        {
            var fallbackDate = today ?? AppTime.Today;
            var days = new List<UpsertScreenTimeDay>();

            if (body.ValueKind == JsonValueKind.Array)
            {
                // ["Chrome (33m)", ...] → today
                if (TryParseAppsArray(body, out var apps) && apps.Count > 0)
                    days.Add(new UpsertScreenTimeDay(fallbackDate, apps));
            }
            else if (body.ValueKind == JsonValueKind.Object)
            {
                if (TryGetProperty(body, "days", out var daysEl) && daysEl.ValueKind == JsonValueKind.Array)
                {
                    foreach (var el in daysEl.EnumerateArray())
                    {
                        if (TryParseScreenDay(el, fallbackDate, out var day) && day.Entries.Count > 0)
                            days.Add(day);
                    }
                }
                else if (TryParseScreenDay(body, fallbackDate, out var single) && single.Entries.Count > 0)
                {
                    days.Add(single);
                }
            }

            return days.Count == 0 ? null : new UpsertScreenTimeRequest(days);
        }

        /// <summary>
        /// Quick Hatıra (memory) body for iPhone Shortcuts / Home Screen widget:
        /// <code>{ "text": "Kahvede güzel sohbet" }</code>,
        /// plain string <c>"Kahvede güzel sohbet"</c>,
        /// or Turkish aliases: <c>metin</c>, <c>anı</c>, <c>hatira</c>.
        /// Optional: experienceType/type, location/locationName, companions,
        /// rating, googleMapsUrl/mapsUrl, occurredAt/date.
        /// </summary>
        public static CreateHatiraRequest? ParseHatira(JsonElement body)
        {
            if (body.ValueKind == JsonValueKind.String)
            {
                var plain = body.GetString()?.Trim();
                if (string.IsNullOrEmpty(plain)) return null;
                return new CreateHatiraRequest(plain, null, null, null, null, null, null);
            }

            if (body.ValueKind != JsonValueKind.Object)
                return null;

            if (!TryGetPropertyAny(body, TextKeys, out var textEl))
                return null;

            string? text = textEl.ValueKind switch
            {
                JsonValueKind.String => textEl.GetString(),
                JsonValueKind.Number => textEl.ToString(),
                _ => null
            };
            if (string.IsNullOrWhiteSpace(text))
                return null;

            string? experienceType = null;
            if (TryGetPropertyAny(body, ExperienceTypeKeys, out var typeEl) &&
                typeEl.ValueKind == JsonValueKind.String)
                experienceType = typeEl.GetString();

            string? locationName = null;
            if (TryGetPropertyAny(body, LocationKeys, out var locEl) &&
                locEl.ValueKind == JsonValueKind.String)
                locationName = locEl.GetString();

            string? mapsUrl = null;
            if (TryGetPropertyAny(body, MapsUrlKeys, out var mapsEl) &&
                mapsEl.ValueKind == JsonValueKind.String)
                mapsUrl = mapsEl.GetString();

            string? companions = null;
            if (TryGetPropertyAny(body, CompanionsKeys, out var compEl))
            {
                if (compEl.ValueKind == JsonValueKind.String)
                    companions = compEl.GetString();
                else if (compEl.ValueKind == JsonValueKind.Array)
                {
                    var parts = new List<string>();
                    foreach (var item in compEl.EnumerateArray())
                    {
                        if (item.ValueKind == JsonValueKind.String)
                        {
                            var s = item.GetString()?.Trim();
                            if (!string.IsNullOrEmpty(s)) parts.Add(s);
                        }
                    }
                    if (parts.Count > 0)
                        companions = string.Join(", ", parts);
                }
            }

            int? rating = null;
            if (TryGetPropertyAny(body, RatingKeys, out var ratingEl) &&
                TryParseInt(ratingEl, out var ratingValue))
                rating = ratingValue;

            DateTime? occurredAt = null;
            if (TryGetPropertyAny(body, OccurredAtKeys, out var whenEl) &&
                TryParseDateTime(whenEl, out var when))
                occurredAt = when;

            return new CreateHatiraRequest(
                text.Trim(),
                occurredAt,
                experienceType,
                locationName,
                mapsUrl,
                companions,
                rating);
        }

        private static readonly string[] TextKeys =
        [
            "text", "metin", "anı", "ani", "hatira", "hatıra", "memory", "note", "body", "content"
        ];

        private static readonly string[] ExperienceTypeKeys =
        [
            "experienceType", "type", "tip", "experience", "deneyim"
        ];

        private static readonly string[] LocationKeys =
        [
            "locationName", "location", "yer", "mekan", "place"
        ];

        private static readonly string[] MapsUrlKeys =
        [
            "googleMapsUrl", "mapsUrl", "maps", "mapUrl"
        ];

        private static readonly string[] CompanionsKeys =
        [
            "companions", "companion", "kimlerle", "kisi", "people", "with"
        ];

        private static readonly string[] RatingKeys =
        [
            "rating", "puan", "stars", "star"
        ];

        private static readonly string[] OccurredAtKeys =
        [
            "occurredAt", "occurred_at", "datetime", "dateTime", "when",
            "date", "tarih", "Start Date", "Başlangıç Tarihi"
        ];

        private static bool TryParseDateTime(JsonElement el, out DateTime value)
        {
            value = default;
            if (el.ValueKind == JsonValueKind.String)
            {
                var s = el.GetString();
                if (string.IsNullOrWhiteSpace(s)) return false;
                s = s.Trim();

                if (DateTime.TryParse(
                        s,
                        CultureInfo.InvariantCulture,
                        DateTimeStyles.RoundtripKind,
                        out value))
                    return true;

                foreach (var culture in DateCultures)
                {
                    if (DateTime.TryParse(s, culture, DateTimeStyles.AssumeLocal, out value))
                        return true;
                }

                // Date-only → start of that local day as Unspecified (service normalizes).
                if (TryParseDate(el, out var dateOnly))
                {
                    value = dateOnly.ToDateTime(TimeOnly.MinValue, DateTimeKind.Unspecified);
                    return true;
                }

                return false;
            }

            if (el.ValueKind == JsonValueKind.Number && el.TryGetInt64(out var unix))
            {
                var seconds = unix > 10_000_000_000L ? unix / 1000L : unix;
                value = DateTimeOffset.FromUnixTimeSeconds(seconds).UtcDateTime;
                return true;
            }

            return false;
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

        private static bool TryParseScreenDay(JsonElement el, DateOnly fallbackDate, out UpsertScreenTimeDay day)
        {
            day = null!;
            if (el.ValueKind != JsonValueKind.Object) return false;

            var date = fallbackDate;
            if (TryGetPropertyAny(el, DateKeys, out var dateEl))
            {
                if (!TryParseDate(dateEl, out date))
                    return false;
            }

            List<UpsertScreenTimeItem> entries;
            if (TryGetProperty(el, "apps", out var appsEl))
            {
                if (!TryParseAppsElement(appsEl, out entries))
                    return false;
            }
            else if (TryGetProperty(el, "entries", out var entriesEl) && entriesEl.ValueKind == JsonValueKind.Array)
            {
                // Backward-compatible: still accept string lines inside entries.
                if (!TryParseAppsArray(entriesEl, out entries))
                    return false;
            }
            else
            {
                return false;
            }

            day = new UpsertScreenTimeDay(date, entries);
            return true;
        }

        private static bool TryParseAppsElement(JsonElement el, out List<UpsertScreenTimeItem> entries)
        {
            if (el.ValueKind == JsonValueKind.Array)
                return TryParseAppsArray(el, out entries);

            // Single text blob with newlines / commas.
            if (el.ValueKind == JsonValueKind.String)
            {
                entries = [];
                var text = el.GetString();
                if (string.IsNullOrWhiteSpace(text)) return false;
                foreach (var part in text.Split(['\n', '\r', ',', ';'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
                {
                    if (ScreenTimeAppLineParser.TryParse(part, out var name, out var minutes))
                        entries.Add(new UpsertScreenTimeItem(name, minutes));
                }
                return entries.Count > 0;
            }

            entries = [];
            return false;
        }

        private static bool TryParseAppsArray(JsonElement arrayEl, out List<UpsertScreenTimeItem> entries)
        {
            entries = [];
            if (arrayEl.ValueKind != JsonValueKind.Array) return false;

            foreach (var item in arrayEl.EnumerateArray())
            {
                if (item.ValueKind == JsonValueKind.String)
                {
                    if (ScreenTimeAppLineParser.TryParse(item.GetString(), out var name, out var minutes))
                        entries.Add(new UpsertScreenTimeItem(name, minutes));
                    continue;
                }

                // Rare: object still using old shape { appName, minutes }
                if (item.ValueKind == JsonValueKind.Object)
                {
                    if (!TryGetProperty(item, "appName", out var nameEl) &&
                        !TryGetProperty(item, "app", out nameEl) &&
                        !TryGetProperty(item, "name", out nameEl))
                        continue;
                    var name = nameEl.ValueKind == JsonValueKind.String ? nameEl.GetString() : null;
                    if (string.IsNullOrWhiteSpace(name)) continue;
                    if (!TryGetProperty(item, "minutes", out var minEl) || !TryParseInt(minEl, out var minutes))
                        continue;
                    entries.Add(new UpsertScreenTimeItem(name.Trim(), minutes));
                }
            }

            return entries.Count > 0;
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
