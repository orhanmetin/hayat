using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using Hayat.Application.DTOs;
using Hayat.Application.Interfaces;
using Hayat.Application.Options;
using Hayat.Domain.Entities;
using Hayat.Infrastructure.Data;

namespace Hayat.Infrastructure.Strava
{
    public class StravaOAuthService : IStravaOAuthService
    {
        private const string StateCachePrefix = "strava-oauth-state:";
        private readonly AppDbContext _db;
        private readonly StravaApiClient _api;
        private readonly IMemoryCache _cache;
        private readonly StravaOptions _options;

        public StravaOAuthService(
            AppDbContext db,
            StravaApiClient api,
            IMemoryCache cache,
            IOptions<StravaOptions> options)
        {
            _db = db;
            _api = api;
            _cache = cache;
            _options = options.Value;
        }

        public Task<StravaAuthorizeUrlDto> GetAuthorizeUrlAsync(int userId, CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(_options.ClientId) || string.IsNullOrWhiteSpace(_options.ClientSecret))
                throw new InvalidOperationException("Strava ClientId/ClientSecret yapılandırılmamış.");

            var state = Guid.NewGuid().ToString("N");
            _cache.Set(StateCachePrefix + state, userId, TimeSpan.FromMinutes(15));
            var url = _api.BuildAuthorizeUrl(state);
            return Task.FromResult(new StravaAuthorizeUrlDto(url));
        }

        public async Task<bool> HandleCallbackAsync(string code, string state, CancellationToken cancellationToken = default)
        {
            if (!_cache.TryGetValue(StateCachePrefix + state, out int userId))
                return false;

            _cache.Remove(StateCachePrefix + state);

            var token = await _api.ExchangeCodeAsync(code, cancellationToken);
            var athleteId = token.Athlete?.Id ?? 0;
            if (athleteId == 0)
                throw new InvalidOperationException("Strava athlete bilgisi alınamadı.");

            var expiresAt = token.ExpiresAt > 0
                ? DateTimeOffset.FromUnixTimeSeconds(token.ExpiresAt).UtcDateTime
                : DateTime.UtcNow.AddSeconds(token.ExpiresIn > 0 ? token.ExpiresIn : 21600);

            var connection = await _db.UserStravaConnections.FirstOrDefaultAsync(c => c.UserId == userId, cancellationToken);
            if (connection == null)
            {
                connection = new UserStravaConnection { UserId = userId };
                _db.UserStravaConnections.Add(connection);
            }

            connection.AthleteId = athleteId;
            connection.AccessToken = token.AccessToken;
            connection.RefreshToken = token.RefreshToken;
            connection.ExpiresAtUtc = expiresAt;
            connection.ConnectedAtUtc = DateTime.UtcNow;

            await _db.SaveChangesAsync(cancellationToken);
            return true;
        }

        public async Task<StravaConnectionStatusDto> GetConnectionStatusAsync(int userId, CancellationToken cancellationToken = default)
        {
            var connection = await _db.UserStravaConnections.AsNoTracking()
                .FirstOrDefaultAsync(c => c.UserId == userId, cancellationToken);

            if (connection == null)
                return new StravaConnectionStatusDto(false, null, null, null);

            return new StravaConnectionStatusDto(
                true,
                connection.AthleteId,
                connection.ExpiresAtUtc,
                connection.LastSyncAtUtc);
        }

        public async Task DisconnectAsync(int userId, CancellationToken cancellationToken = default)
        {
            var connection = await _db.UserStravaConnections.FirstOrDefaultAsync(c => c.UserId == userId, cancellationToken);
            if (connection == null) return;
            _db.UserStravaConnections.Remove(connection);
            await _db.SaveChangesAsync(cancellationToken);
        }

    }
}
