using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Hayat.Application.DTOs;
using Hayat.Application.Interfaces;

namespace Hayat.Api.Controllers
{
    [Authorize]
    [Route("api/hatira")]
    public class HatiraController : BaseApiController
    {
        private readonly IHatiraService _service;

        public HatiraController(IHatiraService service) => _service = service;

        [HttpGet]
        public async Task<IActionResult> List(
            [FromQuery] string? from,
            [FromQuery] string? to,
            [FromQuery] string? companion,
            [FromQuery] string? location)
        {
            var userId = GetUserId();
            if (userId == null) return UnauthorizedUser();

            DateOnly? fromDate = null;
            DateOnly? toDate = null;
            if (!string.IsNullOrWhiteSpace(from) && DateOnly.TryParse(from, out var f))
                fromDate = f;
            if (!string.IsNullOrWhiteSpace(to) && DateOnly.TryParse(to, out var t))
                toDate = t;

            return Ok(await _service.ListAsync(userId.Value, fromDate, toDate, companion, location));
        }

        [HttpGet("filter-options")]
        public async Task<IActionResult> FilterOptions()
        {
            var userId = GetUserId();
            if (userId == null) return UnauthorizedUser();
            return Ok(await _service.GetFilterOptionsAsync(userId.Value));
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var userId = GetUserId();
            if (userId == null) return UnauthorizedUser();
            var result = await _service.GetByIdAsync(userId.Value, id);
            return result == null ? NotFound() : Ok(result);
        }

        [HttpPost]
        [RequestSizeLimit(32 * 1024 * 1024)]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> Create([FromForm] HatiraForm form)
        {
            var userId = GetUserId();
            if (userId == null) return UnauthorizedUser();

            var request = ToCreateRequest(form);
            var photos = await ReadPhotosAsync(form.Photos);
            if (photos == null)
                return BadRequest(new { message = "Fotoğraf yüklenemedi." });

            var result = await _service.CreateAsync(userId.Value, request, photos);
            return result == null
                ? BadRequest(new { message = "Anı kaydedilemedi. Metin zorunlu; alanları kontrol edin." })
                : Ok(result);
        }

        [HttpPost("json")]
        public async Task<IActionResult> CreateJson([FromBody] CreateHatiraRequest request)
        {
            var userId = GetUserId();
            if (userId == null) return UnauthorizedUser();
            var result = await _service.CreateAsync(userId.Value, request, null);
            return result == null
                ? BadRequest(new { message = "Anı kaydedilemedi. Metin zorunlu; alanları kontrol edin." })
                : Ok(result);
        }

        [HttpPut("{id:int}")]
        [RequestSizeLimit(32 * 1024 * 1024)]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> Update(int id, [FromForm] HatiraForm form)
        {
            var userId = GetUserId();
            if (userId == null) return UnauthorizedUser();

            var keepIds = ParseKeepPhotoIds(form.KeepPhotoIds);
            var request = new UpdateHatiraRequest(
                form.Text ?? string.Empty,
                ParseOccurredAt(form.OccurredAt),
                form.ExperienceType,
                form.LocationName,
                form.GoogleMapsUrl,
                form.Companions,
                form.Rating,
                keepIds
            );

            var photos = await ReadPhotosAsync(form.Photos);
            if (photos == null)
                return BadRequest(new { message = "Fotoğraf yüklenemedi." });

            var result = await _service.UpdateAsync(userId.Value, id, request, photos);
            return result == null
                ? BadRequest(new { message = "Anı güncellenemedi." })
                : Ok(result);
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var userId = GetUserId();
            if (userId == null) return UnauthorizedUser();
            return await _service.DeleteAsync(userId.Value, id) ? NoContent() : NotFound();
        }

        [HttpGet("photos/{photoId:int}")]
        public async Task<IActionResult> GetPhoto(int photoId)
        {
            var userId = GetUserId();
            if (userId == null) return UnauthorizedUser();

            var photo = await _service.GetPhotoAsync(userId.Value, photoId);
            if (photo == null) return NotFound();

            return File(photo.Value.Content, photo.Value.ContentType, photo.Value.FileName);
        }

        private static CreateHatiraRequest ToCreateRequest(HatiraForm form) =>
            new(
                form.Text ?? string.Empty,
                ParseOccurredAt(form.OccurredAt),
                form.ExperienceType,
                form.LocationName,
                form.GoogleMapsUrl,
                form.Companions,
                form.Rating
            );

        private static DateTime? ParseOccurredAt(string? value)
        {
            if (string.IsNullOrWhiteSpace(value)) return null;
            return DateTime.TryParse(
                value,
                null,
                System.Globalization.DateTimeStyles.RoundtripKind,
                out var dt)
                ? dt
                : null;
        }

        private static IReadOnlyList<int>? ParseKeepPhotoIds(string? raw)
        {
            if (raw == null) return null;
            if (string.IsNullOrWhiteSpace(raw)) return Array.Empty<int>();

            return raw
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(s => int.TryParse(s, out var id) ? id : (int?)null)
                .Where(id => id.HasValue)
                .Select(id => id!.Value)
                .ToList();
        }

        private static async Task<IReadOnlyList<HatiraPhotoUpload>?> ReadPhotosAsync(List<IFormFile>? files)
        {
            if (files == null || files.Count == 0)
                return Array.Empty<HatiraPhotoUpload>();

            var list = new List<HatiraPhotoUpload>();
            foreach (var file in files)
            {
                if (file.Length <= 0) continue;
                await using var stream = file.OpenReadStream();
                using var ms = new MemoryStream();
                await stream.CopyToAsync(ms);
                list.Add(new HatiraPhotoUpload(
                    file.FileName,
                    file.ContentType ?? "image/jpeg",
                    ms.ToArray()));
            }

            return list;
        }
    }

    public class HatiraForm
    {
        public string? Text { get; set; }
        public string? OccurredAt { get; set; }
        public string? ExperienceType { get; set; }
        public string? LocationName { get; set; }
        public string? GoogleMapsUrl { get; set; }
        public string? Companions { get; set; }
        public int? Rating { get; set; }
        /// <summary>Comma-separated existing photo IDs to keep on update.</summary>
        public string? KeepPhotoIds { get; set; }
        public List<IFormFile>? Photos { get; set; }
    }
}
