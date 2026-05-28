using Hayat.Application.DTOs;

namespace Hayat.Application.Interfaces
{
    public interface IStravaOAuthService
    {
        Task<StravaAuthorizeUrlDto> GetAuthorizeUrlAsync(int userId, CancellationToken cancellationToken = default);
        Task<bool> HandleCallbackAsync(string code, string state, CancellationToken cancellationToken = default);
        Task<StravaConnectionStatusDto> GetConnectionStatusAsync(int userId, CancellationToken cancellationToken = default);
        Task DisconnectAsync(int userId, CancellationToken cancellationToken = default);
    }

    public interface IStravaSyncService
    {
        Task<StravaSyncResultDto> SyncUserActivitiesAsync(int userId, CancellationToken cancellationToken = default);
        Task SyncAllConnectedUsersAsync(CancellationToken cancellationToken = default);
    }
}
