using System;
using System.Collections.Generic;

namespace Hayat.Application.DTOs
{
    // --- Categories ---
    public record PusulaCategoryDto(int Id, string Name, int? ParentId, int SortOrder, bool IsActive);
    public record CreatePusulaCategoryRequest(string Name, int? ParentId);
    public record UpdatePusulaCategoryRequest(string Name);

    // --- Tasks ---
    public record PusulaStepDto(int Id, string Title, int SortOrder, bool IsChecked);

    public record PusulaTaskDto(
        int Id,
        string Title,
        string? Note,
        int? CategoryId,
        string? CategoryName,
        string? RootCategoryName,
        DateOnly Date,
        string? TimeOfDay,
        int? EstimatedMinutes,
        int? ActualMinutes,
        int Priority,
        string WorkType,
        string Recurrence,
        int? RecurrenceDay,
        int AutoScore,
        int? ManualScore,
        int Score,
        string Status,
        double EarnedPoints,
        IReadOnlyList<PusulaStepDto> Steps);

    public record PusulaDayDto(
        DateOnly Date,
        int TotalTasks,
        int CompletedTasks,
        int PlannedPoints,
        double EarnedPoints,
        double ScorePercent,
        IReadOnlyList<PusulaTaskDto> Tasks);

    public record CreatePusulaTaskRequest(
        string Title,
        string? Note,
        int? CategoryId,
        DateOnly? Date,
        string? TimeOfDay,
        int? EstimatedMinutes,
        int? ActualMinutes,
        int? Priority,
        string? WorkType,
        string? Recurrence,
        int? RecurrenceDay,
        int? ManualScore,
        List<string>? Steps);

    public record UpdatePusulaTaskRequest(
        string Title,
        string? Note,
        int? CategoryId,
        DateOnly Date,
        string? TimeOfDay,
        int? EstimatedMinutes,
        int? ActualMinutes,
        int Priority,
        string? WorkType,
        string? Recurrence,
        int? RecurrenceDay,
        int? ManualScore);

    public record PusulaTaskStatusRequest(DateOnly Date, string? Status, int? ActualMinutes);
    public record PusulaScheduleRequest(DateOnly? Date, string? TimeOfDay);
    public record CreatePusulaStepRequest(string Title);
    public record PusulaStepToggleRequest(DateOnly Date);

    // --- Day review ---
    public record PusulaDayReviewDto(
        DateOnly Date,
        string? StartVision,
        string? EndReflection,
        int? FeelingScore,
        DateTime? UpdatedAt);

    /// <summary>Mode "start" updates StartVision; "end" updates EndReflection + FeelingScore.</summary>
    public record UpsertPusulaDayReviewRequest(
        DateOnly Date,
        string Mode,
        string? StartVision,
        string? EndReflection,
        int? FeelingScore);

    // --- Reports ---
    public record PusulaTrendBucketDto(
        string Key,
        string Label,
        int PlannedPoints,
        double EarnedPoints,
        double ScorePercent,
        int TotalTasks,
        int CompletedTasks,
        double CompletionPercent);

    public record PusulaTrendDto(
        string Period,
        string Bucket,
        string[] AvailableBuckets,
        IReadOnlyList<PusulaTrendBucketDto> Buckets);

    public record PusulaCategorySliceDto(string Name, double Points, double Percent);
}
