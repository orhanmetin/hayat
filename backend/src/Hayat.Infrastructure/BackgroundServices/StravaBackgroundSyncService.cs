using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Hayat.Application.Interfaces;
using Hayat.Application.Options;

namespace Hayat.Infrastructure.BackgroundServices
{
    public class StravaBackgroundSyncService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly StravaOptions _options;
        private readonly ILogger<StravaBackgroundSyncService> _logger;
        private DateTime _lastRunUtc = DateTime.MinValue;

        public StravaBackgroundSyncService(
            IServiceScopeFactory scopeFactory,
            IOptions<StravaOptions> options,
            ILogger<StravaBackgroundSyncService> logger)
        {
            _scopeFactory = scopeFactory;
            _options = options.Value;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Strava arka plan senkron servisi başlatıldı.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    if (_options.BackgroundSyncEnabled && ShouldRunNow())
                    {
                        _logger.LogInformation("Strava otomatik senkron başlıyor...");
                        using var scope = _scopeFactory.CreateScope();
                        var sync = scope.ServiceProvider.GetRequiredService<IStravaSyncService>();
                        await sync.SyncAllConnectedUsersAsync(stoppingToken);
                        _lastRunUtc = DateTime.UtcNow;
                        _logger.LogInformation("Strava otomatik senkron tamamlandı.");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Strava arka plan senkron hatası.");
                }

                await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
            }
        }

        private bool ShouldRunNow()
        {
            var now = DateTime.UtcNow;
            var intervalHours = Math.Clamp(_options.BackgroundSyncIntervalHours, 1, 168);

            if (_lastRunUtc == DateTime.MinValue)
            {
                if (intervalHours >= 24)
                    return now.Hour == Math.Clamp(_options.BackgroundSyncHourUtc, 0, 23);
                return true;
            }

            if (intervalHours >= 24)
            {
                if (now.Hour != Math.Clamp(_options.BackgroundSyncHourUtc, 0, 23))
                    return false;
                return (now - _lastRunUtc).TotalHours >= 23;
            }

            return (now - _lastRunUtc).TotalHours >= intervalHours;
        }
    }
}
