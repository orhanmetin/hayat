using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Hayat.Application.DTOs;
using Hayat.Application.Interfaces;
using Hayat.Application.Options;
using Hayat.Domain.Entities;
using Hayat.Infrastructure.Data;

namespace Hayat.Infrastructure.Strava
{
    public class StravaSyncService : IStravaSyncService
    {
        private readonly AppDbContext _db;
        private readonly StravaApiClient _api;
        private readonly StravaOptions _options;
        private readonly ILogger<StravaSyncService> _logger;

        public StravaSyncService(
            AppDbContext db,
            StravaApiClient api,
            IOptions<StravaOptions> options,
            ILogger<StravaSyncService> logger)
        {
            _db = db;
            _api = api;
            _options = options.Value;
            _logger = logger;
        }

        public async Task<StravaSyncResultDto> SyncUserActivitiesAsync(int userId, CancellationToken cancellationToken = default)
        {
            var connection = await GetValidConnectionAsync(userId, cancellationToken);
            return await SyncInternalAsync(connection, cancellationToken);
        }

        private async Task<UserStravaConnection> GetValidConnectionAsync(int userId, CancellationToken cancellationToken)
        {
            var connection = await _db.UserStravaConnections
                .FirstOrDefaultAsync(c => c.UserId == userId, cancellationToken)
                ?? throw new InvalidOperationException("Strava hesabı bağlı değil.");

            if (connection.ExpiresAtUtc <= DateTime.UtcNow.AddMinutes(2))
            {
                var refreshed = await _api.RefreshTokenAsync(connection.RefreshToken, cancellationToken);
                connection.AccessToken = refreshed.AccessToken;
                connection.RefreshToken = refreshed.RefreshToken;
                connection.ExpiresAtUtc = refreshed.ExpiresAt > 0
                    ? DateTimeOffset.FromUnixTimeSeconds(refreshed.ExpiresAt).UtcDateTime
                    : DateTime.UtcNow.AddSeconds(refreshed.ExpiresIn > 0 ? refreshed.ExpiresIn : 21600);
                await _db.SaveChangesAsync(cancellationToken);
            }

            return connection;
        }

        public async Task SyncAllConnectedUsersAsync(CancellationToken cancellationToken = default)
        {
            var userIds = await _db.UserStravaConnections.AsNoTracking()
                .Select(c => c.UserId)
                .ToListAsync(cancellationToken);

            foreach (var userId in userIds)
            {
                try
                {
                    await SyncUserActivitiesAsync(userId, cancellationToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Strava otomatik senkron kullanıcı {UserId} için başarısız.", userId);
                }
            }
        }

        private async Task<StravaSyncResultDto> SyncInternalAsync(
            UserStravaConnection connection,
            CancellationToken cancellationToken)
        {
            var lookbackDays = Math.Clamp(_options.SyncLookbackDays, 1, 90);
            var afterUtc = DateTime.UtcNow.AddDays(-lookbackDays);
            var afterUnix = new DateTimeOffset(afterUtc).ToUnixTimeSeconds();
            var beforeUnix = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

            var activities = await _api.GetActivitiesAsync(
                connection.AccessToken,
                afterUnix,
                beforeUnix,
                cancellationToken);

            var existingIds = await _db.SportActivities.AsNoTracking()
                .Where(a => a.UserId == connection.UserId && a.StravaActivityId != null)
                .Select(a => a.StravaActivityId!.Value)
                .ToHashSetAsync(cancellationToken);

            var imported = new List<StravaImportedActivityDto>();
            var skipped = 0;

            foreach (var activity in activities)
            {
                if (existingIds.Contains(activity.Id))
                {
                    skipped++;
                    continue;
                }

                var stravaTypeKey = StravaActivityTypeMapper.ResolveStravaTypeKey(activity);
                var typeId = await StravaActivityTypeMapper.ResolveSportTypeIdAsync(_db, stravaTypeKey, cancellationToken);
                var typeName = await _db.SportActivityTypes.AsNoTracking()
                    .Where(t => t.Id == typeId)
                    .Select(t => t.Name)
                    .FirstAsync(cancellationToken);

                var durationMinutes = activity.ElapsedTime > 0
                    ? Math.Max(1, (int)Math.Round(activity.ElapsedTime / 60.0))
                    : 0;
                if (durationMinutes <= 0)
                {
                    skipped++;
                    continue;
                }

                var distanceKm = activity.Distance > 0
                    ? Math.Round((decimal)(activity.Distance / 1000.0), 1)
                    : (decimal?)null;

                var title = string.IsNullOrWhiteSpace(activity.Name) ? "Strava Aktivitesi" : activity.Name.Trim();
                var note = string.IsNullOrWhiteSpace(activity.Description)
                    ? title
                    : $"{title} - {activity.Description.Trim()}";
                if (note.Length > 500)
                    note = note[..500];

                var entity = new SportActivity
                {
                    UserId = connection.UserId,
                    SportActivityTypeId = typeId,
                    Date = DateOnly.FromDateTime(activity.StartDateLocal),
                    DurationMinutes = durationMinutes,
                    DistanceKm = distanceKm,
                    StravaActivityId = activity.Id,
                    StravaLink = $"https://www.strava.com/activities/{activity.Id}",
                    Note = note,
                    CreatedAt = DateTime.UtcNow
                };

                _db.SportActivities.Add(entity);
                existingIds.Add(activity.Id);
                imported.Add(new StravaImportedActivityDto(activity.Id, title, typeName));
            }

            connection.LastSyncAtUtc = DateTime.UtcNow;
            await _db.SaveChangesAsync(cancellationToken);

            return new StravaSyncResultDto(imported.Count, skipped, imported);
        }
    }
}
