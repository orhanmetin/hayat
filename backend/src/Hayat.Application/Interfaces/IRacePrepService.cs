using System.Threading.Tasks;
using Hayat.Application.DTOs;

namespace Hayat.Application.Interfaces
{
    public interface IRacePrepService
    {
        Task<RacePrepOverviewDto> GetOverviewAsync(int userId);
        Task<RacePrepCountGoalDto> IncrementVisualizationAsync(int userId);
        Task<RacePrepGoalDetailDto?> GetGoalDetailAsync(int userId, string goalKey);
    }
}
