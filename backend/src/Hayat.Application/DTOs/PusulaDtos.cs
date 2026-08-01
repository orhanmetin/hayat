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
        DateOnly? Date,
        string? TimeOfDay,
        int? EstimatedMinutes,
        int? ActualMinutes,
        int Priority,
        string WorkType,
        string Recurrence,
        int? RecurrenceDay,
        string Status,
        int SortOrder,
        IReadOnlyList<PusulaStepDto> Steps);

    public record PusulaDayDto(
        DateOnly Date,
        int TotalTasks,
        int CompletedTasks,
        double CompletionPercent,
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
        List<string>? Steps);

    public record UpdatePusulaTaskRequest(
        string Title,
        string? Note,
        int? CategoryId,
        DateOnly? Date,
        string? TimeOfDay,
        int? EstimatedMinutes,
        int? ActualMinutes,
        int Priority,
        string? WorkType,
        string? Recurrence,
        int? RecurrenceDay);

    public record PusulaTaskStatusRequest(DateOnly? Date, string? Status, int? ActualMinutes);
    public record PusulaScheduleRequest(DateOnly? Date, string? TimeOfDay);
    public record PusulaReorderRequest(DateOnly Date, List<int> TaskIds);
    public record CreatePusulaStepRequest(string Title);
    public record PusulaStepToggleRequest(DateOnly? Date);

    // --- Day review ---
    public record PusulaDayReviewCategorySnapshotDto(
        string Name,
        int PlannedMinutes,
        int ActualMinutes);

    public record PusulaDayReviewPerformanceDto(
        DateTime CapturedAt,
        int TotalTasks,
        int CompletedTasks,
        double CompletionPercent,
        int PlannedMinutes,
        int ActualMinutes,
        IReadOnlyList<PusulaDayReviewCategorySnapshotDto> Categories);

    public record PusulaDayReviewDto(
        DateOnly Date,
        string? StartVision,
        string? EndReflection,
        int? FeelingScore,
        DateTime? UpdatedAt,
        PusulaDayReviewPerformanceDto? Performance);

    /// <summary>Mode "start" updates StartVision; "end" updates EndReflection + FeelingScore + performance snapshot.</summary>
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
        int TotalTasks,
        int CompletedTasks,
        double CompletionPercent);

    public record PusulaTrendDto(
        string Period,
        string Bucket,
        string[] AvailableBuckets,
        IReadOnlyList<PusulaTrendBucketDto> Buckets);

    /// <summary>Category share by completed task count (not points).</summary>
    public record PusulaCategorySliceDto(string Name, int TaskCount, double Percent);
}
