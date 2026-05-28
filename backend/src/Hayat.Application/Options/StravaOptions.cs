namespace Hayat.Application.Options
{
    public class StravaOptions
    {
        public const string SectionName = "Strava";

        public string ClientId { get; set; } = string.Empty;
        public string ClientSecret { get; set; } = string.Empty;
        /// <summary>OAuth callback — Strava geliştirici panelinde kayıtlı olmalı.</summary>
        public string RedirectUri { get; set; } = "http://localhost:5000/api/strava/callback";
        /// <summary>Başarılı bağlantı sonrası yönlendirme (SPA).</summary>
        public string FrontendRedirectUri { get; set; } = "http://localhost:5173/management/activity-types";
        public int SyncLookbackDays { get; set; } = 31;
        public bool BackgroundSyncEnabled { get; set; } = true;
        /// <summary>24 = günde bir; 1 = saatte bir.</summary>
        public int BackgroundSyncIntervalHours { get; set; } = 24;
        /// <summary>UTC saat (yalnızca 24 saatlik aralıkta kullanılır).</summary>
        public int BackgroundSyncHourUtc { get; set; } = 2;
    }
}
