using System.Text.Json.Serialization;

namespace Hayat.Infrastructure.Strava
{
    public sealed class StravaTokenResponse
    {
        [JsonPropertyName("access_token")]
        public string AccessToken { get; set; } = string.Empty;

        [JsonPropertyName("refresh_token")]
        public string RefreshToken { get; set; } = string.Empty;

        [JsonPropertyName("expires_at")]
        public long ExpiresAt { get; set; }

        [JsonPropertyName("expires_in")]
        public int ExpiresIn { get; set; }

        [JsonPropertyName("athlete")]
        public StravaAthlete? Athlete { get; set; }
    }

    public sealed class StravaAthlete
    {
        [JsonPropertyName("id")]
        public long Id { get; set; }
    }

    public sealed class StravaActivityApiModel
    {
        [JsonPropertyName("id")]
        public long Id { get; set; }

        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("type")]
        public string Type { get; set; } = string.Empty;

        [JsonPropertyName("sport_type")]
        public string? SportType { get; set; }

        [JsonPropertyName("description")]
        public string? Description { get; set; }

        [JsonPropertyName("distance")]
        public double Distance { get; set; }

        [JsonPropertyName("elapsed_time")]
        public int ElapsedTime { get; set; }

        [JsonPropertyName("start_date_local")]
        public DateTime StartDateLocal { get; set; }
    }
}
