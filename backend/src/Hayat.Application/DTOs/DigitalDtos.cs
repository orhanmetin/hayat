using System;
using System.Collections.Generic;

namespace Hayat.Application.DTOs
{
    // --- Shortcuts token ---
    public record ShortcutsTokenStatusDto(bool HasToken, string? TokenPreview, DateTime? UpdatedAt);
    public record ShortcutsTokenCreatedDto(string Token, string TokenPreview);

    // --- Steps ---
    public record DailyStepDto(DateOnly Date, int Steps, string Source, DateTime SyncedAt);
    public record UpsertDailyStepItem(DateOnly Date, int Steps);
    public record UpsertDailyStepsRequest(List<UpsertDailyStepItem> Days, string? Source);
    public record UpsertDailyStepsResultDto(int Upserted, int Skipped);

    // --- Screen time ---
    public record ScreenTimeEntryDto(
        DateOnly Date,
        string AppName,
        string Kind,
        int Minutes,
        DateTime SyncedAt);

    public record UpsertScreenTimeItem(string AppName, int Minutes, string? Kind);
    public record UpsertScreenTimeDay(DateOnly Date, List<UpsertScreenTimeItem> Entries);
    public record UpsertScreenTimeRequest(List<UpsertScreenTimeDay> Days);
    public record UpsertScreenTimeResultDto(int Upserted, int Days);

    public record ScreenTimeDaySummaryDto(
        DateOnly Date,
        int TotalMinutes,
        IReadOnlyList<ScreenTimeEntryDto> TopApps);

    public record DigitalOverviewDto(
        IReadOnlyList<DailyStepDto> Steps,
        IReadOnlyList<ScreenTimeDaySummaryDto> ScreenTime,
        DateOnly From,
        DateOnly To);
}
