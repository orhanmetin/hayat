using Hayat.Domain.Entities;
using Hayat.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Hayat.Infrastructure.Strava
{
    public static class StravaActivityTypeMapper
    {
        private static readonly Dictionary<string, string> KnownMappings = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Run"] = "Koşu",
            ["Walk"] = "Yürüyüş",
            ["Ride"] = "Bisiklet",
            ["VirtualRide"] = "Bisiklet",
            ["Workout"] = "Güç Çalışması",
            ["Swim"] = "Yüzme",
        };

        public static string ResolveStravaTypeKey(StravaActivityApiModel activity)
        {
            if (!string.IsNullOrWhiteSpace(activity.SportType))
                return activity.SportType.Trim();
            return activity.Type.Trim();
        }

        public static async Task<int> ResolveSportTypeIdAsync(
            AppDbContext db,
            string stravaTypeKey,
            CancellationToken cancellationToken)
        {
            var preferredName = KnownMappings.TryGetValue(stravaTypeKey, out var mapped)
                ? mapped
                : FormatUnknownTypeName(stravaTypeKey);

            var existing = await db.SportActivityTypes
                .FirstOrDefaultAsync(t => t.Name == preferredName, cancellationToken);
            if (existing != null)
                return existing.Id;

            var byStravaKey = await db.SportActivityTypes
                .FirstOrDefaultAsync(t => t.Name == stravaTypeKey, cancellationToken);
            if (byStravaKey != null)
                return byStravaKey.Id;

            var maxOrder = await db.SportActivityTypes.MaxAsync(t => (int?)t.SortOrder, cancellationToken) ?? 0;
            var entity = new SportActivityType
            {
                Name = preferredName,
                SortOrder = maxOrder + 1,
                IsActive = true
            };
            db.SportActivityTypes.Add(entity);
            await db.SaveChangesAsync(cancellationToken);
            return entity.Id;
        }

        private static string FormatUnknownTypeName(string stravaTypeKey) =>
            stravaTypeKey switch
            {
                "Hike" => "Yürüyüş",
                "TrailRun" => "Koşu",
                "EBikeRide" => "Bisiklet",
                "VirtualRun" => "Koşu",
                _ => $"Strava {stravaTypeKey}"
            };
    }
}
