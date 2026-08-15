using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Hayat.Application.Common;
using Hayat.Application.DTOs;
using Hayat.Application.Interfaces;
using Hayat.Domain.Entities;
using Hayat.Infrastructure.Data;

namespace Hayat.Infrastructure.Services
{
    public class HatiraService : IHatiraService
    {
        public static readonly string[] ExperienceTypes = ["Günce", "Yemek", "Konaklama"];

        private const int MaxTextLength = 8000;
        private const int MaxLocationLength = 200;
        private const int MaxMapsUrlLength = 1000;
        private const int MaxCompanionsLength = 500;
        private const int MaxPhotosPerMemory = 12;
        private const int MaxPhotoBytes = 4 * 1024 * 1024; // 4 MB each
        private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
        {
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp",
            "image/gif",
            "image/heic",
            "image/heif"
        };

        private readonly AppDbContext _db;

        public HatiraService(AppDbContext db) => _db = db;

        public async Task<IReadOnlyList<HatiraMemoryDto>> ListAsync(
            int userId,
            DateOnly? from,
            DateOnly? to,
            string? companion,
            string? location)
        {
            var query = _db.HatiraMemories.AsNoTracking()
                .Include(m => m.Photos)
                .Where(m => m.UserId == userId);

            if (from.HasValue)
            {
                var fromUtc = AppTime.StartOfLocalDayUtc(from.Value);
                query = query.Where(m => m.OccurredAt >= fromUtc);
            }

            if (to.HasValue)
            {
                var toUtc = AppTime.EndOfLocalDayUtc(to.Value);
                query = query.Where(m => m.OccurredAt <= toUtc);
            }

            if (!string.IsNullOrWhiteSpace(location))
            {
                var loc = location.Trim().ToLowerInvariant();
                query = query.Where(m =>
                    m.LocationName != null && m.LocationName.ToLower().Contains(loc));
            }

            var items = await query
                .OrderByDescending(m => m.OccurredAt)
                .ThenByDescending(m => m.Id)
                .ToListAsync();

            if (!string.IsNullOrWhiteSpace(companion))
            {
                var needle = companion.Trim();
                items = items
                    .Where(m => CompanionList(m.Companions)
                        .Any(c => string.Equals(c, needle, StringComparison.OrdinalIgnoreCase)))
                    .ToList();
            }

            return items.Select(Map).ToList();
        }

        public async Task<HatiraFilterOptionsDto> GetFilterOptionsAsync(int userId)
        {
            var rows = await _db.HatiraMemories.AsNoTracking()
                .Where(m => m.UserId == userId)
                .Select(m => new { m.Companions, m.LocationName })
                .ToListAsync();

            var companions = rows
                .SelectMany(r => CompanionList(r.Companions))
                .GroupBy(c => c, StringComparer.OrdinalIgnoreCase)
                .Select(g => g.First())
                .OrderBy(c => c, StringComparer.CurrentCultureIgnoreCase)
                .ToList();

            var locations = rows
                .Select(r => r.LocationName?.Trim())
                .Where(l => !string.IsNullOrEmpty(l))
                .Cast<string>()
                .GroupBy(l => l, StringComparer.OrdinalIgnoreCase)
                .Select(g => g.First())
                .OrderBy(l => l, StringComparer.CurrentCultureIgnoreCase)
                .ToList();

            return new HatiraFilterOptionsDto(companions, locations);
        }

        public async Task<HatiraMemoryDto?> GetByIdAsync(int userId, int id)
        {
            var memory = await _db.HatiraMemories.AsNoTracking()
                .Include(m => m.Photos)
                .FirstOrDefaultAsync(m => m.UserId == userId && m.Id == id);
            return memory == null ? null : Map(memory);
        }

        public async Task<HatiraMemoryDto?> CreateAsync(
            int userId,
            CreateHatiraRequest request,
            IReadOnlyList<HatiraPhotoUpload>? photos)
        {
            if (!TryNormalize(
                    request.Text,
                    request.OccurredAt,
                    request.ExperienceType,
                    request.LocationName,
                    request.GoogleMapsUrl,
                    request.Companions,
                    request.Rating,
                    out var text,
                    out var occurredAt,
                    out var experienceType,
                    out var locationName,
                    out var mapsUrl,
                    out var companions,
                    out var rating))
                return null;

            if (photos != null && photos.Count > MaxPhotosPerMemory)
                return null;

            var now = DateTime.UtcNow;
            var memory = new HatiraMemory
            {
                UserId = userId,
                Text = text,
                OccurredAt = occurredAt,
                ExperienceType = experienceType,
                LocationName = locationName,
                GoogleMapsUrl = mapsUrl,
                Companions = companions,
                Rating = rating,
                CreatedAt = now,
                UpdatedAt = now
            };

            if (photos != null)
            {
                var order = 0;
                foreach (var photo in photos)
                {
                    if (!TryBuildPhoto(photo, order++, out var entity))
                        return null;
                    memory.Photos.Add(entity);
                }
            }

            _db.HatiraMemories.Add(memory);
            await _db.SaveChangesAsync();
            return Map(memory);
        }

        public async Task<HatiraMemoryDto?> UpdateAsync(
            int userId,
            int id,
            UpdateHatiraRequest request,
            IReadOnlyList<HatiraPhotoUpload>? newPhotos)
        {
            if (!TryNormalize(
                    request.Text,
                    request.OccurredAt,
                    request.ExperienceType,
                    request.LocationName,
                    request.GoogleMapsUrl,
                    request.Companions,
                    request.Rating,
                    out var text,
                    out var occurredAt,
                    out var experienceType,
                    out var locationName,
                    out var mapsUrl,
                    out var companions,
                    out var rating))
                return null;

            var memory = await _db.HatiraMemories
                .Include(m => m.Photos)
                .FirstOrDefaultAsync(m => m.Id == id && m.UserId == userId);
            if (memory == null) return null;

            memory.Text = text;
            memory.OccurredAt = occurredAt;
            memory.ExperienceType = experienceType;
            memory.LocationName = locationName;
            memory.GoogleMapsUrl = mapsUrl;
            memory.Companions = companions;
            memory.Rating = rating;
            memory.UpdatedAt = DateTime.UtcNow;

            if (request.KeepPhotoIds != null)
            {
                var keep = request.KeepPhotoIds.ToHashSet();
                var toRemove = memory.Photos.Where(p => !keep.Contains(p.Id)).ToList();
                _db.HatiraPhotos.RemoveRange(toRemove);
            }

            if (newPhotos != null && newPhotos.Count > 0)
            {
                var remaining = memory.Photos.Count(p =>
                    request.KeepPhotoIds == null || request.KeepPhotoIds.Contains(p.Id));
                if (remaining + newPhotos.Count > MaxPhotosPerMemory)
                    return null;

                var order = memory.Photos.Count == 0
                    ? 0
                    : memory.Photos.Max(p => p.SortOrder) + 1;
                foreach (var photo in newPhotos)
                {
                    if (!TryBuildPhoto(photo, order++, out var entity))
                        return null;
                    memory.Photos.Add(entity);
                }
            }

            await _db.SaveChangesAsync();
            return Map(memory);
        }

        public async Task<bool> DeleteAsync(int userId, int id)
        {
            var memory = await _db.HatiraMemories
                .Include(m => m.Photos)
                .FirstOrDefaultAsync(m => m.Id == id && m.UserId == userId);
            if (memory == null) return false;

            _db.HatiraMemories.Remove(memory);
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<(byte[] Content, string ContentType, string FileName)?> GetPhotoAsync(
            int userId,
            int photoId)
        {
            var photo = await _db.HatiraPhotos.AsNoTracking()
                .Where(p => p.Id == photoId && p.Memory.UserId == userId)
                .Select(p => new { p.Content, p.ContentType, p.FileName })
                .FirstOrDefaultAsync();

            if (photo == null) return null;
            return (photo.Content, photo.ContentType, photo.FileName);
        }

        private static bool TryBuildPhoto(HatiraPhotoUpload upload, int sortOrder, out HatiraPhoto entity)
        {
            entity = null!;
            if (upload.Content == null || upload.Content.Length == 0 || upload.Content.Length > MaxPhotoBytes)
                return false;

            var contentType = string.IsNullOrWhiteSpace(upload.ContentType)
                ? "image/jpeg"
                : upload.ContentType.Trim();
            if (!AllowedContentTypes.Contains(contentType))
                return false;

            var fileName = string.IsNullOrWhiteSpace(upload.FileName)
                ? "photo.jpg"
                : upload.FileName.Trim();
            if (fileName.Length > 200)
                fileName = fileName[..200];

            entity = new HatiraPhoto
            {
                ContentType = contentType,
                FileName = fileName,
                Content = upload.Content,
                SortOrder = sortOrder,
                CreatedAt = DateTime.UtcNow
            };
            return true;
        }

        private static bool TryNormalize(
            string text,
            DateTime? occurredAt,
            string? experienceType,
            string? locationName,
            string? googleMapsUrl,
            string? companions,
            int? rating,
            out string normalizedText,
            out DateTime normalizedOccurredAt,
            out string normalizedExperienceType,
            out string? normalizedLocation,
            out string? normalizedMapsUrl,
            out string? normalizedCompanions,
            out int? normalizedRating)
        {
            normalizedText = text?.Trim() ?? string.Empty;
            normalizedOccurredAt = NormalizeOccurredAt(occurredAt);
            normalizedExperienceType = "Günce";
            normalizedLocation = null;
            normalizedMapsUrl = null;
            normalizedCompanions = null;
            normalizedRating = null;

            if (normalizedText.Length == 0 || normalizedText.Length > MaxTextLength)
                return false;

            var type = string.IsNullOrWhiteSpace(experienceType) ? "Günce" : experienceType.Trim();
            if (!ExperienceTypes.Contains(type, StringComparer.OrdinalIgnoreCase))
                return false;
            normalizedExperienceType = ExperienceTypes.First(t =>
                string.Equals(t, type, StringComparison.OrdinalIgnoreCase));

            if (!string.IsNullOrWhiteSpace(locationName))
            {
                var loc = locationName.Trim();
                if (loc.Length > MaxLocationLength) return false;
                normalizedLocation = loc;
            }

            if (!string.IsNullOrWhiteSpace(googleMapsUrl))
            {
                var url = googleMapsUrl.Trim();
                if (url.Length > MaxMapsUrlLength) return false;
                if (!Uri.TryCreate(url, UriKind.Absolute, out var uri)
                    || (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
                    return false;
                normalizedMapsUrl = url;
            }

            if (!string.IsNullOrWhiteSpace(companions))
            {
                var list = CompanionList(companions);
                if (list.Count == 0) return false;
                var joined = string.Join(", ", list);
                if (joined.Length > MaxCompanionsLength) return false;
                normalizedCompanions = joined;
            }

            if (rating.HasValue)
            {
                if (rating.Value < 1 || rating.Value > 5) return false;
                normalizedRating = rating.Value;
            }

            return true;
        }

        private static DateTime NormalizeOccurredAt(DateTime? occurredAt)
        {
            if (!occurredAt.HasValue)
                return DateTime.UtcNow;

            var dt = occurredAt.Value;
            return dt.Kind switch
            {
                DateTimeKind.Utc => dt,
                DateTimeKind.Local => dt.ToUniversalTime(),
                _ => DateTime.SpecifyKind(dt, DateTimeKind.Utc)
            };
        }

        private static IReadOnlyList<string> CompanionList(string? raw)
        {
            if (string.IsNullOrWhiteSpace(raw))
                return Array.Empty<string>();

            return raw
                .Split([',', ';', '\n'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Where(s => s.Length > 0)
                .ToList();
        }

        private static HatiraMemoryDto Map(HatiraMemory m) =>
            new(
                m.Id,
                m.Text,
                m.OccurredAt,
                m.ExperienceType,
                m.LocationName,
                m.GoogleMapsUrl,
                m.Companions,
                m.Rating,
                m.Photos
                    .OrderBy(p => p.SortOrder)
                    .ThenBy(p => p.Id)
                    .Select(p => new HatiraPhotoDto(p.Id, p.ContentType, p.FileName, p.SortOrder))
                    .ToList(),
                m.CreatedAt,
                m.UpdatedAt
            );
    }
}
