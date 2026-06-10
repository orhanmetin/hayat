using System.Threading.Tasks;
using Hayat.Application.DTOs;

namespace Hayat.Application.Interfaces
{
    public interface IActiveTimerService
    {
        Task<ActiveTimerDto?> GetAsync(int userId);
        Task<ActiveTimerDto> StartAsync(int userId);
        Task ClearAsync(int userId);
    }
}
