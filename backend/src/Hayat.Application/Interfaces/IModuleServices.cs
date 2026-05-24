using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Hayat.Application.DTOs;

namespace Hayat.Application.Interfaces
{
    public interface IManagementService
    {
        Task<IReadOnlyList<LookupTypeDto>> GetSportTypesAsync();
        Task<IReadOnlyList<LookupTypeDto>> GetDeepWorkTypesAsync();
        Task<LookupTypeDto?> CreateSportTypeAsync(CreateLookupTypeRequest request);
        Task<LookupTypeDto?> CreateDeepWorkTypeAsync(CreateLookupTypeRequest request);
        Task<LookupTypeDto?> UpdateSportTypeAsync(int id, UpdateLookupTypeRequest request);
        Task<LookupTypeDto?> UpdateDeepWorkTypeAsync(int id, UpdateLookupTypeRequest request);
        Task<bool> DeleteSportTypeAsync(int id);
        Task<bool> DeleteDeepWorkTypeAsync(int id);
    }

    public interface IHabitService
    {
        Task<IReadOnlyList<HabitDto>> GetHabitsAsync(int userId);
        Task<HabitDto?> CreateHabitAsync(int userId, CreateHabitRequest request);
        Task<bool> DeleteHabitAsync(int userId, int habitId);
        Task<HabitDto?> SetCheckInAsync(int userId, int habitId, SetHabitCheckInRequest request);
        Task<HabitDto?> ToggleTodayAsync(int userId, int habitId);
    }

    public interface IHealthService
    {
        Task<IReadOnlyList<SleepLogDto>> GetSleepLogsAsync(int userId, DateOnly? from, DateOnly? to);
        Task<SleepLogDto?> CreateSleepLogAsync(int userId, CreateSleepLogRequest request);
        Task<bool> DeleteSleepLogAsync(int userId, int id);
        Task<IReadOnlyList<SportActivityDto>> GetSportActivitiesAsync(int userId, DateOnly? from, DateOnly? to, int? typeId);
        Task<SportActivityDto?> CreateSportActivityAsync(int userId, CreateSportActivityRequest request);
        Task<bool> DeleteSportActivityAsync(int userId, int id);
        Task<IReadOnlyList<MeditationSessionDto>> GetMeditationsAsync(int userId, DateOnly? from, DateOnly? to);
        Task<MeditationSessionDto?> CreateMeditationAsync(int userId, CreateMeditationRequest request);
        Task<bool> DeleteMeditationAsync(int userId, int id);
    }

    public interface IDeepWorkService
    {
        Task<IReadOnlyList<DeepWorkSessionDto>> GetSessionsAsync(int userId, DateOnly? from, DateOnly? to, int? typeId);
        Task<DeepWorkSessionDto?> CreateSessionAsync(int userId, CreateDeepWorkRequest request);
        Task<bool> DeleteSessionAsync(int userId, int id);
    }

    public interface IWeeklyGoalService
    {
        Task<WeekInfoDto> GetCurrentWeekAsync();
        Task<WeeklyGoalDto?> GetGoalAsync(int userId, int year, int weekNumber);
        Task<WeeklyGoalDto> UpsertGoalAsync(int userId, UpsertWeeklyGoalRequest request);
    }

    public interface IDashboardService
    {
        Task<DashboardSummaryDto> GetSummaryAsync(int userId);
        Task<DashboardAnalyticsDto> GetAnalyticsAsync(int userId, string period);
    }
}
