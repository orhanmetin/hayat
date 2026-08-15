using System;
using System.Collections.Generic;

namespace Hayat.Application.DTOs
{
    public record HatiraPhotoDto(int Id, string ContentType, string FileName, int SortOrder);

    public record HatiraMemoryDto(
        int Id,
        string Text,
        DateTime OccurredAt,
        string ExperienceType,
        string? LocationName,
        string? GoogleMapsUrl,
        string? Companions,
        int? Rating,
        IReadOnlyList<HatiraPhotoDto> Photos,
        DateTime CreatedAt,
        DateTime UpdatedAt
    );

    public record HatiraFilterOptionsDto(
        IReadOnlyList<string> Companions,
        IReadOnlyList<string> Locations
    );

    public record CreateHatiraRequest(
        string Text,
        DateTime? OccurredAt,
        string? ExperienceType,
        string? LocationName,
        string? GoogleMapsUrl,
        string? Companions,
        int? Rating
    );

    public record UpdateHatiraRequest(
        string Text,
        DateTime? OccurredAt,
        string? ExperienceType,
        string? LocationName,
        string? GoogleMapsUrl,
        string? Companions,
        int? Rating,
        /// <summary>Photo IDs to keep; omitted photos are deleted. Null = leave photos unchanged.</summary>
        IReadOnlyList<int>? KeepPhotoIds
    );

    public record HatiraPhotoUpload(string FileName, string ContentType, byte[] Content);
}
