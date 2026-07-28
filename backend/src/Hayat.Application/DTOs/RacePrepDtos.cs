using System;
using System.Collections.Generic;

namespace Hayat.Application.DTOs
{
    // --- Road to Barcelona 24h ---

    public record RacePrepCountGoalDto(int Count, int Target, double Percent);

    public record RacePrepTotalVolumeDto(
        double TotalKm,
        int TargetKm,
        double Percent,
        double AvgDailyKm,
        double ProjectedKm,
        bool OnTrack);

    public record RacePrepWeeklyVolumeDto(
        double CurrentWeekKm,
        int WeekTargetKm,
        double CurrentWeekPercent,
        int AchievedWeeks,
        int CoreWeeks,
        int TargetWeeks,
        double AchievedPercent);

    public record RacePrepBackToBackDto(bool Achieved, int Occurrences, int Target);

    public record RacePrepSpeedDto(
        int CurrentWeekCount,
        int AchievedWeeks,
        int CoreWeeks,
        int TargetWeeks,
        double Percent);

    public record RacePrepStrengthDto(
        int CurrentWeekCount,
        int WeekTarget,
        double CurrentWeekPercent,
        int AchievedWeeks,
        int TotalWeeks,
        int TargetWeeks,
        double Percent);

    public record RacePrepSleepDto(
        int AvgMinutes,
        int TargetMinutes,
        double Percent,
        int DaysWithData);

    public record RacePrepOverviewDto(
        DateOnly StartDate,
        DateOnly RaceDate,
        int TotalWeeks,
        int CurrentWeek,
        double WeekPercent,
        int DaysToRace,
        bool Started,
        RacePrepTotalVolumeDto TotalVolume,
        RacePrepWeeklyVolumeDto WeeklyVolume,
        RacePrepCountGoalDto LongRuns,
        RacePrepCountGoalDto LongerRuns,
        RacePrepCountGoalDto MarathonRuns,
        RacePrepBackToBackDto BackToBack,
        RacePrepSpeedDto Speed,
        RacePrepStrengthDto Strength,
        RacePrepSleepDto Sleep,
        RacePrepCountGoalDto Visualization);

    /// <summary>Mode is "trend" or "list".</summary>
    public record RacePrepGoalDetailDto(
        string GoalKey,
        string Mode,
        string Title,
        string Unit,
        double? TargetValue,
        IReadOnlyList<RacePrepTrendPointDto> Trend,
        IReadOnlyList<RacePrepActivityItemDto> Items);

    public record RacePrepTrendPointDto(string Key, string Label, double Value);

    public record RacePrepActivityItemDto(
        string DateLabel,
        string Title,
        string? Subtitle,
        double? Value,
        string? Unit,
        string? Link);
}
