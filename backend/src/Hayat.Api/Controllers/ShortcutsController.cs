using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Hayat.Api.Shortcuts;
using Hayat.Application.Interfaces;

namespace Hayat.Api.Controllers
{
    /// <summary>
    /// Endpoints for iOS Shortcuts. Prefer header <c>X-Hayat-Shortcuts-Token</c>
    /// (token generated in Hayat → Yönetim → Shortcuts).
    /// </summary>
    [AllowAnonymous]
    [Route("api/shortcuts")]
    public class ShortcutsController : ControllerBase
    {
        private const string StepsExample =
            "{\"days\":[{\"date\":\"2026-07-27\",\"steps\":8000}]} veya tek gün {\"date\":\"2026-07-27\",\"steps\":8000}";

        private const string ScreenExample =
            "{\"days\":[{\"date\":\"2026-07-27\",\"entries\":[{\"appName\":\"Instagram\",\"minutes\":48}]}]}";

        private readonly IDigitalService _service;

        public ShortcutsController(IDigitalService service) => _service = service;

        [HttpPost("steps")]
        public async Task<IActionResult> UpsertSteps([FromBody] JsonElement body)
        {
            var userId = await ResolveUserIdAsync();
            if (userId == null) return Unauthorized(new { message = "Geçersiz Shortcuts token." });
            if (body.ValueKind is JsonValueKind.Undefined or JsonValueKind.Null)
            {
                return BadRequest(new
                {
                    message = "JSON gövde boş. İstek Gövdesi = JSON olmalı.",
                    example = StepsExample
                });
            }

            var request = ShortcutsBodyParser.ParseSteps(body);
            if (request == null)
            {
                return BadRequest(new
                {
                    message = "days gerekli (veya tek gün: date + steps).",
                    example = StepsExample
                });
            }

            return Ok(await _service.UpsertStepsAsync(userId.Value, request));
        }

        [HttpPost("screen-time")]
        public async Task<IActionResult> UpsertScreenTime([FromBody] JsonElement body)
        {
            var userId = await ResolveUserIdAsync();
            if (userId == null) return Unauthorized(new { message = "Geçersiz Shortcuts token." });
            if (body.ValueKind is JsonValueKind.Undefined or JsonValueKind.Null)
            {
                return BadRequest(new
                {
                    message = "JSON gövde boş. İstek Gövdesi = JSON olmalı.",
                    example = ScreenExample
                });
            }

            var request = ShortcutsBodyParser.ParseScreenTime(body);
            if (request == null)
            {
                return BadRequest(new
                {
                    message = "days gerekli (veya tek gün: date + entries).",
                    example = ScreenExample
                });
            }

            return Ok(await _service.UpsertScreenTimeAsync(userId.Value, request));
        }

        [HttpGet("ping")]
        public async Task<IActionResult> Ping()
        {
            var userId = await ResolveUserIdAsync();
            if (userId == null) return Unauthorized(new { message = "Geçersiz Shortcuts token." });
            return Ok(new { ok = true, userId });
        }

        private async Task<int?> ResolveUserIdAsync()
        {
            // Prefer dedicated header so JWT Bearer middleware is not confused.
            var dedicated = Request.Headers["X-Hayat-Shortcuts-Token"].FirstOrDefault();
            if (!string.IsNullOrWhiteSpace(dedicated))
                return await _service.ResolveUserIdByTokenAsync(dedicated.Trim());

            var header = Request.Headers.Authorization.FirstOrDefault();
            if (string.IsNullOrWhiteSpace(header)) return null;
            const string prefix = "Bearer ";
            var token = header.StartsWith(prefix, System.StringComparison.OrdinalIgnoreCase)
                ? header[prefix.Length..].Trim()
                : header.Trim();
            // JWT tokens contain two '.' characters — ignore those here.
            if (token.Count(c => c == '.') >= 2) return null;
            return await _service.ResolveUserIdByTokenAsync(token);
        }
    }
}
