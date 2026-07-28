using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Hayat.Application.DTOs;

namespace Hayat.Application.Interfaces
{
    public interface IDigitalService
    {
        Task<ShortcutsTokenStatusDto> GetTokenStatusAsync(int userId);
        Task<ShortcutsTokenCreatedDto> CreateOrRotateTokenAsync(int userId);
        Task<bool> RevokeTokenAsync(int userId);
        Task<int?> ResolveUserIdByTokenAsync(string token);

        Task<UpsertDailyStepsResultDto> UpsertStepsAsync(int userId, UpsertDailyStepsRequest request);
        Task<IReadOnlyList<DailyStepDto>> GetStepsAsync(int userId, DateOnly from, DateOnly to);

        Task<UpsertScreenTimeResultDto> UpsertScreenTimeAsync(int userId, UpsertScreenTimeRequest request);
        Task<IReadOnlyList<ScreenTimeDaySummaryDto>> GetScreenTimeAsync(int userId, DateOnly from, DateOnly to);

        Task<DigitalOverviewDto> GetOverviewAsync(int userId, DateOnly from, DateOnly to);
    }
}
