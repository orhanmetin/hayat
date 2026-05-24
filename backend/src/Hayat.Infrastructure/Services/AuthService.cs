using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Hayat.Application.DTOs;
using Hayat.Application.Interfaces;
using Hayat.Infrastructure.Data;

namespace Hayat.Infrastructure.Services
{
    public class AuthService : IAuthService
    {
        private readonly AppDbContext _context;
        private readonly ITokenService _tokenService;

        public AuthService(AppDbContext context, ITokenService tokenService)
        {
            _context = context;
            _tokenService = tokenService;
        }

        public async Task<LoginResponse?> LoginAsync(LoginRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
            {
                return null;
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username.ToLower() == request.Username.ToLower());
            if (user == null)
            {
                return null;
            }

            // Verify password hash
            bool isPasswordValid = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);
            if (!isPasswordValid)
            {
                return null;
            }

            var token = _tokenService.GenerateToken(user);
            var expiresAt = DateTime.UtcNow.AddDays(7); // Matches token lifetime in TokenService

            return new LoginResponse(token, user.DisplayName, expiresAt);
        }
    }
}
