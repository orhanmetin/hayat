using Hayat.Domain.Entities;

namespace Hayat.Application.Interfaces
{
    public interface ITokenService
    {
        string GenerateToken(User user);
    }
}
