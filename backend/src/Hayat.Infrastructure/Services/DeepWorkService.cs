using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Hayat.Application.DTOs;
using Hayat.Application.Interfaces;
using Hayat.Domain.Entities;
using Hayat.Infrastructure.Data;

namespace Hayat.Infrastructure.Services
{
    public class DeepWorkService : IDeepWorkService
    {
        private readonly AppDbContext _db;

        public DeepWorkService(AppDbContext db) => _db = db;

        public async Task<IReadOnlyList<DeepWorkSessionDto>> GetSessionsAsync(int userId, DateOnly? from, DateOnly? to, int? typeId)
        {
            var query = _db.DeepWorkSessions.AsNoTracking()
                .Include(s => s.DeepWorkType)
                .Where(s => s.UserId == userId);

            if (from.HasValue) query = query.Where(s => s.Date >= from.Value);
            if (to.HasValue) query = query.Where(s => s.Date <= to.Value);
            if (typeId.HasValue) query = query.Where(s => s.DeepWorkTypeId == typeId.Value);

            return await query.OrderByDescending(s => s.Date)
                .Select(s => new DeepWorkSessionDto(s.Id, s.DeepWorkTypeId, s.DeepWorkType.Name, s.Date, s.DurationMinutes, s.Description))
                .ToListAsync();
        }

        public async Task<DeepWorkSessionDto?> CreateSessionAsync(int userId, CreateDeepWorkRequest request)
        {
            if (request.DurationMinutes <= 0) return null;
            var typeExists = await _db.DeepWorkTypes.AnyAsync(t => t.Id == request.DeepWorkTypeId && t.IsActive);
            if (!typeExists) return null;

            var session = new DeepWorkSession
            {
                UserId = userId,
                DeepWorkTypeId = request.DeepWorkTypeId,
                Date = request.Date,
                DurationMinutes = request.DurationMinutes,
                Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim()
            };
            _db.DeepWorkSessions.Add(session);
            await _db.SaveChangesAsync();

            var typeName = await _db.DeepWorkTypes.Where(t => t.Id == session.DeepWorkTypeId).Select(t => t.Name).FirstAsync();
            return new DeepWorkSessionDto(session.Id, session.DeepWorkTypeId, typeName, session.Date, session.DurationMinutes, session.Description);
        }

        public async Task<bool> DeleteSessionAsync(int userId, int id)
        {
            var item = await _db.DeepWorkSessions.FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);
            if (item == null) return false;
            _db.DeepWorkSessions.Remove(item);
            await _db.SaveChangesAsync();
            return true;
        }
    }
}
