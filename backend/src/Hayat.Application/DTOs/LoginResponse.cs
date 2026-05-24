using System;

namespace Hayat.Application.DTOs
{
    public record LoginResponse(string Token, string DisplayName, DateTime ExpiresAt);
}
