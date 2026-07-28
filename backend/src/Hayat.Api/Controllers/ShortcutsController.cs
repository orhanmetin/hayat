using System;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
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

        private const string EmptyBodyHint =
            "Sağlık Örneklerini Bul çıktısı HTTP gövdesine otomatik gitmez. " +
            "URL İçeriğini Al → İstek Gövdesi → JSON → days alanına {date,steps} listesini bağla. " +
            "Önceki adımı gövdeye sürüklemezsen gövde boş kalır.";

        private readonly IDigitalService _service;

        public ShortcutsController(IDigitalService service) => _service = service;

        [HttpPost("steps")]
        public async Task<IActionResult> UpsertSteps()
        {
            var userId = await ResolveUserIdAsync();
            if (userId == null) return Unauthorized(new { message = "Geçersiz Shortcuts token." });

            var (body, raw, parseError) = await ReadJsonBodyAsync();
            if (parseError != null)
            {
                return BadRequest(new
                {
                    message = parseError,
                    hint = EmptyBodyHint,
                    example = StepsExample,
                    receivedPreview = Truncate(raw)
                });
            }

            if (body == null)
            {
                return BadRequest(new
                {
                    message = "JSON gövde boş.",
                    hint = EmptyBodyHint,
                    example = StepsExample
                });
            }

            var request = ShortcutsBodyParser.ParseSteps(body.Value);
            if (request == null)
            {
                return BadRequest(new
                {
                    message = "days gerekli (veya tek gün: date + steps). Health Sample alanları: date/Start Date + steps/Value.",
                    hint = EmptyBodyHint,
                    example = StepsExample,
                    receivedPreview = Truncate(raw)
                });
            }

            return Ok(await _service.UpsertStepsAsync(userId.Value, request));
        }

        [HttpPost("screen-time")]
        public async Task<IActionResult> UpsertScreenTime()
        {
            var userId = await ResolveUserIdAsync();
            if (userId == null) return Unauthorized(new { message = "Geçersiz Shortcuts token." });

            var (body, raw, parseError) = await ReadJsonBodyAsync();
            if (parseError != null)
            {
                return BadRequest(new
                {
                    message = parseError,
                    hint = "İstek Gövdesi = JSON veya Metin (JSON içeriği). Form/Dosya ile Health objesi gönderme.",
                    example = ScreenExample,
                    receivedPreview = Truncate(raw)
                });
            }

            if (body == null)
            {
                return BadRequest(new
                {
                    message = "JSON gövde boş.",
                    hint = "URL İçeriğini Al → İstek Gövdesi → JSON → days listesini bağla.",
                    example = ScreenExample
                });
            }

            var request = ShortcutsBodyParser.ParseScreenTime(body.Value);
            if (request == null)
            {
                return BadRequest(new
                {
                    message = "days gerekli (veya tek gün: date + entries).",
                    example = ScreenExample,
                    receivedPreview = Truncate(raw)
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

        /// <summary>
        /// Reads the raw body regardless of Content-Type (Shortcuts often omits or mis-sets it).
        /// </summary>
        private async Task<(JsonElement? Body, string? Raw, string? ParseError)> ReadJsonBodyAsync()
        {
            Request.EnableBuffering();
            if (Request.Body.CanSeek)
                Request.Body.Position = 0;

            using var reader = new StreamReader(Request.Body, Encoding.UTF8, detectEncodingFromByteOrderMarks: true, leaveOpen: true);
            var raw = (await reader.ReadToEndAsync()).Trim().TrimStart('\uFEFF');
            if (Request.Body.CanSeek)
                Request.Body.Position = 0;

            if (string.IsNullOrWhiteSpace(raw))
                return (null, raw, null);

            // Multipart / form leftovers — not JSON.
            if (raw.StartsWith("--", StringComparison.Ordinal) ||
                raw.Contains("Content-Disposition:", StringComparison.OrdinalIgnoreCase))
            {
                return (null, raw, "Gövde Form/Dosya gibi görünüyor; JSON olmalı. İstek Gövdesi = JSON seç.");
            }

            try
            {
                using var doc = JsonDocument.Parse(raw);
                return (doc.RootElement.Clone(), raw, null);
            }
            catch (JsonException)
            {
                return (null, raw, "Gövde geçerli JSON değil. İstek Gövdesi = JSON ve days listesini bağla.");
            }
        }

        private static string? Truncate(string? raw, int max = 240)
        {
            if (string.IsNullOrEmpty(raw)) return raw;
            return raw.Length <= max ? raw : raw[..max] + "…";
        }

        private async Task<int?> ResolveUserIdAsync()
        {
            var dedicated = Request.Headers["X-Hayat-Shortcuts-Token"].FirstOrDefault();
            if (!string.IsNullOrWhiteSpace(dedicated))
                return await _service.ResolveUserIdByTokenAsync(dedicated.Trim());

            var header = Request.Headers.Authorization.FirstOrDefault();
            if (string.IsNullOrWhiteSpace(header)) return null;
            const string prefix = "Bearer ";
            var token = header.StartsWith(prefix, StringComparison.OrdinalIgnoreCase)
                ? header[prefix.Length..].Trim()
                : header.Trim();
            if (token.Count(c => c == '.') >= 2) return null;
            return await _service.ResolveUserIdByTokenAsync(token);
        }
    }
}
