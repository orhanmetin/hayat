using System.Threading.Tasks;
using Hayat.Application.DTOs;

namespace Hayat.Application.Interfaces
{
    public interface IAuthService
    {
        Task<LoginResponse?> LoginAsync(LoginRequest request);
    }
}
