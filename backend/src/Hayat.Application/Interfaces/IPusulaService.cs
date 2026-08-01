using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Hayat.Application.DTOs;

namespace Hayat.Application.Interfaces
{
    public interface IPusulaService
    {
        // Categories
        Task<IReadOnlyList<PusulaCategoryDto>> GetCategoriesAsync(int userId);
        Task<PusulaCategoryDto?> CreateCategoryAsync(int userId, CreatePusulaCategoryRequest request);
        Task<PusulaCategoryDto?> UpdateCategoryAsync(int userId, int id, UpdatePusulaCategoryRequest request);
        Task<bool> DeleteCategoryAsync(int userId, int id);

        // Tasks
        Task<IReadOnlyList<PusulaDayDto>> GetDaysAsync(int userId, DateOnly from, DateOnly to);
        Task<IReadOnlyList<PusulaTaskDto>> GetUndatedTasksAsync(int userId);
        Task<PusulaTaskDto?> CreateTaskAsync(int userId, CreatePusulaTaskRequest request);
        Task<PusulaTaskDto?> UpdateTaskAsync(int userId, int id, UpdatePusulaTaskRequest request);
        Task<bool> DeleteTaskAsync(int userId, int id);
        Task<PusulaTaskDto?> SetTaskStatusAsync(int userId, int id, PusulaTaskStatusRequest request);
        Task<PusulaTaskDto?> ScheduleTaskAsync(int userId, int id, PusulaScheduleRequest request);
        Task<bool> ReorderTasksAsync(int userId, PusulaReorderRequest request);

        // Steps
        Task<PusulaTaskDto?> AddStepAsync(int userId, int taskId, CreatePusulaStepRequest request, DateOnly? date);
        Task<PusulaTaskDto?> DeleteStepAsync(int userId, int stepId, DateOnly? date);
        Task<PusulaTaskDto?> ToggleStepAsync(int userId, int stepId, PusulaStepToggleRequest request);

        // Day review
        Task<PusulaDayReviewDto> GetDayReviewAsync(int userId, DateOnly date);
        Task<PusulaDayReviewDto> UpsertDayReviewAsync(int userId, UpsertPusulaDayReviewRequest request);

        // Reports
        Task<PusulaTrendDto> GetTrendAsync(int userId, string period, string? bucket);
        Task<IReadOnlyList<PusulaCategorySliceDto>> GetCategoryDistributionAsync(int userId, DateOnly from, DateOnly to);
    }
}
