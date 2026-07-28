using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Hayat.Application.DTOs;
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
        private readonly IDigitalService _service;

        public ShortcutsController(IDigitalService service) => _service = service;

        [HttpPost("steps")]
        public async Task<IActionResult> UpsertSteps([FromBody] UpsertDailyStepsRequest request)
        {
            var userId = await ResolveUserIdAsync();
            if (userId == null) return Unauthorized(new { message = "Geçersiz Shortcuts token." });
            if (request?.Days == null) return BadRequest(new { message = "days gerekli." });
            return Ok(await _service.UpsertStepsAsync(userId.Value, request));
        }

        [HttpPost("screen-time")]
        public async Task<IActionResult> UpsertScreenTime([FromBody] UpsertScreenTimeRequest request)
        {
            var userId = await ResolveUserIdAsync();
            if (userId == null) return Unauthorized(new { message = "Geçersiz Shortcuts token." });
            if (request?.Days == null) return BadRequest(new { message = "days gerekli." });
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
