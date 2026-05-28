using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Hayat.Application.Interfaces;
using Hayat.Application.Options;

namespace Hayat.Api.Controllers
{
    [Authorize]
    [Route("api/strava")]
    public class StravaController : BaseApiController
    {
        private readonly IStravaOAuthService _oauth;
        private readonly StravaOptions _options;

        public StravaController(IStravaOAuthService oauth, IOptions<StravaOptions> options)
        {
            _oauth = oauth;
            _options = options.Value;
        }

        [HttpGet("connect-url")]
        public async Task<IActionResult> GetConnectUrl()
        {
            var userId = GetUserId();
            if (userId == null) return UnauthorizedUser();
            var result = await _oauth.GetAuthorizeUrlAsync(userId.Value);
            return Ok(result);
        }

        [AllowAnonymous]
        [HttpGet("callback")]
        public async Task<IActionResult> Callback(
            [FromQuery] string? code,
            [FromQuery] string? state,
            [FromQuery] string? error)
        {
            if (!string.IsNullOrWhiteSpace(error))
                return Redirect($"{_options.FrontendRedirectUri}?strava=error");

            if (string.IsNullOrWhiteSpace(code) || string.IsNullOrWhiteSpace(state))
                return Redirect($"{_options.FrontendRedirectUri}?strava=error");

            var ok = await _oauth.HandleCallbackAsync(code, state);
            return Redirect(ok
                ? $"{_options.FrontendRedirectUri}?strava=connected"
                : $"{_options.FrontendRedirectUri}?strava=error");
        }

        [HttpGet("status")]
        public async Task<IActionResult> GetStatus()
        {
            var userId = GetUserId();
            if (userId == null) return UnauthorizedUser();
            return Ok(await _oauth.GetConnectionStatusAsync(userId.Value));
        }

        [HttpDelete("disconnect")]
        public async Task<IActionResult> Disconnect()
        {
            var userId = GetUserId();
            if (userId == null) return UnauthorizedUser();
            await _oauth.DisconnectAsync(userId.Value);
            return NoContent();
        }
    }
}
