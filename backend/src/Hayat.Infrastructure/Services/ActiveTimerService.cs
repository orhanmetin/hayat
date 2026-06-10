using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Hayat.Application.DTOs;
using Hayat.Application.Interfaces;
using Hayat.Domain.Entities;
using Hayat.Infrastructure.Data;

namespace Hayat.Infrastructure.Services
{
    public class ActiveTimerService : IActiveTimerService
    {
        private readonly AppDbContext _db;

        public ActiveTimerService(AppDbContext db) => _db = db;

        public async Task<ActiveTimerDto?> GetAsync(int userId)
        {
            var timer = await _db.ActiveTimers.AsNoTracking()
                .FirstOrDefaultAsync(t => t.UserId == userId);
            return timer == null ? null : new ActiveTimerDto(timer.StartTime);
        }

        public async Task<ActiveTimerDto> StartAsync(int userId)
        {
            var existing = await _db.ActiveTimers.FirstOrDefaultAsync(t => t.UserId == userId);
            var startTime = DateTime.UtcNow;

            if (existing != null)
            {
                existing.StartTime = startTime;
            }
            else
            {
                _db.ActiveTimers.Add(new ActiveTimer
                {
                    UserId = userId,
                    StartTime = startTime
                });
            }

            await _db.SaveChangesAsync();
            return new ActiveTimerDto(startTime);
        }

        public async Task ClearAsync(int userId)
        {
            var existing = await _db.ActiveTimers.FirstOrDefaultAsync(t => t.UserId == userId);
            if (existing == null) return;
            _db.ActiveTimers.Remove(existing);
            await _db.SaveChangesAsync();
        }
    }
}
