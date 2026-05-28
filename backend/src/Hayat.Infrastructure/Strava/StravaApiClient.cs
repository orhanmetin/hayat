using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Options;
using Hayat.Application.Options;

namespace Hayat.Infrastructure.Strava
{
    public class StravaApiClient
    {
        private static readonly Uri BaseUri = new("https://www.strava.com/");
        private readonly HttpClient _http;
        private readonly StravaOptions _options;

        public StravaApiClient(HttpClient http, IOptions<StravaOptions> options)
        {
            _http = http;
            _http.BaseAddress = BaseUri;
            _options = options.Value;
        }

        public string BuildAuthorizeUrl(string state)
        {
            var query = new Dictionary<string, string>
            {
                ["client_id"] = _options.ClientId,
                ["redirect_uri"] = _options.RedirectUri,
                ["response_type"] = "code",
                ["approval_prompt"] = "auto",
                ["scope"] = "activity:read_all",
                ["state"] = state
            };
            var qs = string.Join("&", query.Select(kv =>
                $"{Uri.EscapeDataString(kv.Key)}={Uri.EscapeDataString(kv.Value)}"));
            return $"https://www.strava.com/oauth/authorize?{qs}";
        }

        public async Task<StravaTokenResponse> ExchangeCodeAsync(string code, CancellationToken cancellationToken)
        {
            var response = await PostTokenAsync(new Dictionary<string, string>
            {
                ["client_id"] = _options.ClientId,
                ["client_secret"] = _options.ClientSecret,
                ["code"] = code,
                ["grant_type"] = "authorization_code"
            }, cancellationToken);
            return response;
        }

        public async Task<StravaTokenResponse> RefreshTokenAsync(string refreshToken, CancellationToken cancellationToken)
        {
            return await PostTokenAsync(new Dictionary<string, string>
            {
                ["client_id"] = _options.ClientId,
                ["client_secret"] = _options.ClientSecret,
                ["refresh_token"] = refreshToken,
                ["grant_type"] = "refresh_token"
            }, cancellationToken);
        }

        public async Task<IReadOnlyList<StravaActivityApiModel>> GetActivitiesAsync(
            string accessToken,
            long afterUnix,
            long beforeUnix,
            CancellationToken cancellationToken)
        {
            var all = new List<StravaActivityApiModel>();
            var page = 1;
            const int perPage = 100;

            while (true)
            {
                var url =
                    $"api/v3/athlete/activities?after={afterUnix}&before={beforeUnix}&per_page={perPage}&page={page}";
                using var request = new HttpRequestMessage(HttpMethod.Get, url);
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

                using var response = await _http.SendAsync(request, cancellationToken);
                response.EnsureSuccessStatusCode();

                var pageData = await response.Content.ReadFromJsonAsync<List<StravaActivityApiModel>>(
                    cancellationToken: cancellationToken);
                if (pageData == null || pageData.Count == 0)
                    break;

                all.AddRange(pageData);
                if (pageData.Count < perPage)
                    break;
                page++;
            }

            return all;
        }

        private async Task<StravaTokenResponse> PostTokenAsync(
            Dictionary<string, string> form,
            CancellationToken cancellationToken)
        {
            using var content = new FormUrlEncodedContent(form);
            using var response = await _http.PostAsync("oauth/token", content, cancellationToken);
            var body = await response.Content.ReadAsStringAsync(cancellationToken);
            if (!response.IsSuccessStatusCode)
                throw new InvalidOperationException($"Strava token isteği başarısız: {response.StatusCode} {body}");

            var token = JsonSerializer.Deserialize<StravaTokenResponse>(body);
            if (token == null || string.IsNullOrWhiteSpace(token.AccessToken))
                throw new InvalidOperationException("Strava token yanıtı geçersiz.");

            return token;
        }
    }
}
