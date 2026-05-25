using System;
using System.Collections.Generic;

namespace Hayat.Application.DTOs
{
    // --- Lookup types ---
    public record LookupTypeDto(int Id, string Name, bool IsActive, int SortOrder);
    public record CreateLookupTypeRequest(string Name);
    public record UpdateLookupTypeRequest(string Name, bool? IsActive);

    // --- Habits ---
    public record HabitDto(
        int Id,
        string Name,
        bool CompletedToday,
        int CurrentStreak,
        int RecordStreak,
        DateTime CreatedAt
    );
    public record CreateHabitRequest(string Name);
    public record SetHabitCheckInRequest(DateOnly Date, bool Completed);

    // --- Sleep ---
    public record SleepLogDto(
        int Id,
        DateTime BedTime,
        DateTime? WakeTime,
        int DurationMinutes,
        int Quality,
        string? Note,
        DateOnly ListDate,
        bool IsComplete
    );
    public record CreateSleepLogRequest(
        DateTime BedTime,
        DateTime? WakeTime,
        int? Quality,
        string? Note
    );
    public record CompleteSleepLogRequest(
        DateTime WakeTime,
        int Quality,
        string? Note
    );
    public record UpdateSleepLogRequest(
        DateTime BedTime,
        DateTime? WakeTime,
        int? Quality,
        string? Note
    );

    // --- Sport ---
    public record SportActivityDto(
        int Id,
        int SportActivityTypeId,
        string ActivityTypeName,
        DateOnly Date,
        int DurationMinutes,
        decimal? DistanceKm,
        string? StravaLink,
        string? Note
    );
    public record CreateSportActivityRequest(
        int SportActivityTypeId,
        DateOnly Date,
        int DurationMinutes,
        decimal? DistanceKm,
        string? StravaLink,
        string? Note
    );
    public record UpdateSportActivityRequest(
        int SportActivityTypeId,
        DateOnly Date,
        int DurationMinutes,
        decimal? DistanceKm,
        string? StravaLink,
        string? Note
    );

    // --- Meditation ---
    public record MeditationSessionDto(int Id, DateOnly Date, int DurationMinutes);
    public record CreateMeditationRequest(DateOnly Date, int DurationMinutes);
    public record UpdateMeditationRequest(DateOnly Date, int DurationMinutes);

    // --- Deep Work ---
    public record DeepWorkSessionDto(
        int Id,
        int DeepWorkTypeId,
        string TypeName,
        DateOnly Date,
        int DurationMinutes,
        string? Description
    );
    public record CreateDeepWorkRequest(
        int DeepWorkTypeId,
        DateOnly Date,
        int DurationMinutes,
        string? Description
    );
    public record UpdateDeepWorkRequest(
        int DeepWorkTypeId,
        DateOnly Date,
        int DurationMinutes,
        string? Description
    );

    // --- Weekly Goals ---
    public record WeeklyGoalDto(
        int Id,
        int Year,
        int WeekNumber,
        int? TargetAvgSleepMinutesPerDay,
        int? TargetTotalSportMinutes,
        int? TargetAvgDeepWorkMinutesPerDay,
        int? TargetAvgMeditationMinutesPerDay,
        WeeklyGoalProgressDto Progress
    );
    public record WeeklyGoalProgressDto(
        double SleepProgress,
        double SportProgress,
        double DeepWorkProgress,
        double MeditationProgress,
        int CurrentAvgSleepMinutes,
        int CurrentTotalSportMinutes,
        int CurrentAvgDeepWorkMinutes,
        int CurrentAvgMeditationMinutes
    );
    public record UpsertWeeklyGoalRequest(
        int Year,
        int WeekNumber,
        int? TargetAvgSleepMinutesPerDay,
        int? TargetTotalSportMinutes,
        int? TargetAvgDeepWorkMinutesPerDay,
        int? TargetAvgMeditationMinutesPerDay
    );
    public record WeekInfoDto(int Year, int WeekNumber, DateOnly WeekStart, DateOnly WeekEnd);

    // --- Dashboard ---
    public record DashboardSummaryDto(
        int HabitStreakBest,
        int HabitsCompletedToday,
        int TotalHabits,
        int LastNightSleepMinutes,
        int TodaySportMinutes,
        int TodayDeepWorkMinutes,
        int TodayMeditationMinutes
    );
    public record ChartDataPointDto(string Label, double Value);
    public record DashboardChartDto(
        string Title,
        IReadOnlyList<ChartDataPointDto> Points
    );
    public record DashboardAnalyticsDto(
        string Period,
        IReadOnlyList<DashboardChartDto> Charts
    );

    // --- Dashboard v2 (period / bucket / subtype) ---
    public record CategoryBreakdownItemDto(string Name, int Minutes);

    public record SportCardDto(
        int TotalMinutes,
        int? TargetMinutes,
        IReadOnlyList<CategoryBreakdownItemDto> Breakdown
    );

    public record SleepCardDto(
        int TotalMinutes,
        int AverageMinutesPerDay,
        int? TargetAverageMinutesPerDay
    );

    public record DeepWorkCardDto(
        int TotalMinutes,
        int AverageMinutesPerDay,
        int? TargetAverageMinutesPerDay,
        IReadOnlyList<CategoryBreakdownItemDto> Breakdown
    );

    public record MeditationCardDto(
        int TotalMinutes,
        int AverageMinutesPerDay,
        int? TargetAverageMinutesPerDay
    );

    public record DashboardCardsDto(
        SportCardDto Sport,
        SleepCardDto Sleep,
        DeepWorkCardDto DeepWork,
        MeditationCardDto Meditation
    );

    public record TimeBucketValueDto(string Key, string Label, int Minutes);

    public record StackedBucketDto(
        string Key,
        string Label,
        int Total,
        Dictionary<string, int> Segments
    );

    public record StackedSeriesDto(
        IReadOnlyList<string> Categories,
        IReadOnlyList<StackedBucketDto> Buckets
    );

    public record DashboardSeriesDto(
        IReadOnlyList<TimeBucketValueDto> Sleep,
        IReadOnlyList<TimeBucketValueDto> Meditation,
        StackedSeriesDto Sport,
        StackedSeriesDto DeepWork
    );

    public record DashboardOverviewDto(
        string Period,
        string Bucket,
        IReadOnlyList<string> AvailableBuckets,
        DateOnly RangeStart,
        DateOnly RangeEnd,
        int DaysElapsed,
        bool ShowTargets,
        DashboardCardsDto Cards,
        DashboardSeriesDto Series
    );
}
