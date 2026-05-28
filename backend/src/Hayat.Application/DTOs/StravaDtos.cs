namespace Hayat.Application.DTOs
{
    public record StravaConnectionStatusDto(
        bool IsConnected,
        long? AthleteId,
        DateTime? ExpiresAtUtc,
        DateTime? LastSyncAtUtc
    );

    public record StravaAuthorizeUrlDto(string Url);

    public record StravaImportedActivityDto(
        long StravaActivityId,
        string Title,
        string ActivityTypeName
    );

    public record StravaSyncResultDto(
        int ImportedCount,
        int SkippedCount,
        IReadOnlyList<StravaImportedActivityDto> Imported
    );
}
