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
    public class ManagementService : IManagementService
    {
        private readonly AppDbContext _db;

        public ManagementService(AppDbContext db) => _db = db;

        public async Task<IReadOnlyList<LookupTypeDto>> GetSportTypesAsync() =>
            await _db.SportActivityTypes.AsNoTracking()
                .OrderBy(t => t.SortOrder).ThenBy(t => t.Name)
                .Select(t => new LookupTypeDto(t.Id, t.Name, t.IsActive, t.SortOrder))
                .ToListAsync();

        public async Task<IReadOnlyList<LookupTypeDto>> GetDeepWorkTypesAsync() =>
            await _db.DeepWorkTypes.AsNoTracking()
                .OrderBy(t => t.SortOrder).ThenBy(t => t.Name)
                .Select(t => new LookupTypeDto(t.Id, t.Name, t.IsActive, t.SortOrder))
                .ToListAsync();

        public async Task<IReadOnlyList<LookupTypeDto>> GetMeditationTypesAsync() =>
            await _db.MeditationTypes.AsNoTracking()
                .OrderBy(t => t.SortOrder).ThenBy(t => t.Name)
                .Select(t => new LookupTypeDto(t.Id, t.Name, t.IsActive, t.SortOrder))
                .ToListAsync();

        public async Task<LookupTypeDto?> CreateSportTypeAsync(CreateLookupTypeRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Name)) return null;
            var maxOrder = await _db.SportActivityTypes.MaxAsync(t => (int?)t.SortOrder) ?? 0;
            var entity = new SportActivityType { Name = request.Name.Trim(), SortOrder = maxOrder + 1 };
            _db.SportActivityTypes.Add(entity);
            await _db.SaveChangesAsync();
            return new LookupTypeDto(entity.Id, entity.Name, entity.IsActive, entity.SortOrder);
        }

        public async Task<LookupTypeDto?> CreateDeepWorkTypeAsync(CreateLookupTypeRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Name)) return null;
            var maxOrder = await _db.DeepWorkTypes.MaxAsync(t => (int?)t.SortOrder) ?? 0;
            var entity = new DeepWorkType { Name = request.Name.Trim(), SortOrder = maxOrder + 1 };
            _db.DeepWorkTypes.Add(entity);
            await _db.SaveChangesAsync();
            return new LookupTypeDto(entity.Id, entity.Name, entity.IsActive, entity.SortOrder);
        }

        public async Task<LookupTypeDto?> CreateMeditationTypeAsync(CreateLookupTypeRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Name)) return null;
            var maxOrder = await _db.MeditationTypes.MaxAsync(t => (int?)t.SortOrder) ?? 0;
            var entity = new MeditationType { Name = request.Name.Trim(), SortOrder = maxOrder + 1 };
            _db.MeditationTypes.Add(entity);
            await _db.SaveChangesAsync();
            return new LookupTypeDto(entity.Id, entity.Name, entity.IsActive, entity.SortOrder);
        }

        public async Task<LookupTypeDto?> UpdateSportTypeAsync(int id, UpdateLookupTypeRequest request)
        {
            var entity = await _db.SportActivityTypes.FindAsync(id);
            if (entity == null) return null;
            if (!string.IsNullOrWhiteSpace(request.Name)) entity.Name = request.Name.Trim();
            if (request.IsActive.HasValue) entity.IsActive = request.IsActive.Value;
            await _db.SaveChangesAsync();
            return new LookupTypeDto(entity.Id, entity.Name, entity.IsActive, entity.SortOrder);
        }

        public async Task<LookupTypeDto?> UpdateDeepWorkTypeAsync(int id, UpdateLookupTypeRequest request)
        {
            var entity = await _db.DeepWorkTypes.FindAsync(id);
            if (entity == null) return null;
            if (!string.IsNullOrWhiteSpace(request.Name)) entity.Name = request.Name.Trim();
            if (request.IsActive.HasValue) entity.IsActive = request.IsActive.Value;
            await _db.SaveChangesAsync();
            return new LookupTypeDto(entity.Id, entity.Name, entity.IsActive, entity.SortOrder);
        }

        public async Task<LookupTypeDto?> UpdateMeditationTypeAsync(int id, UpdateLookupTypeRequest request)
        {
            var entity = await _db.MeditationTypes.FindAsync(id);
            if (entity == null) return null;
            if (!string.IsNullOrWhiteSpace(request.Name)) entity.Name = request.Name.Trim();
            if (request.IsActive.HasValue) entity.IsActive = request.IsActive.Value;
            await _db.SaveChangesAsync();
            return new LookupTypeDto(entity.Id, entity.Name, entity.IsActive, entity.SortOrder);
        }

        public async Task<bool> DeleteSportTypeAsync(int id)
        {
            var entity = await _db.SportActivityTypes.FindAsync(id);
            if (entity == null) return false;
            var inUse = await _db.SportActivities.AnyAsync(a => a.SportActivityTypeId == id);
            if (inUse) { entity.IsActive = false; }
            else { _db.SportActivityTypes.Remove(entity); }
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteDeepWorkTypeAsync(int id)
        {
            var entity = await _db.DeepWorkTypes.FindAsync(id);
            if (entity == null) return false;
            var inUse = await _db.DeepWorkSessions.AnyAsync(a => a.DeepWorkTypeId == id);
            if (inUse) { entity.IsActive = false; }
            else { _db.DeepWorkTypes.Remove(entity); }
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteMeditationTypeAsync(int id)
        {
            var entity = await _db.MeditationTypes.FindAsync(id);
            if (entity == null) return false;
            var inUse = await _db.MeditationSessions.AnyAsync(a => a.MeditationTypeId == id);
            if (inUse) { entity.IsActive = false; }
            else { _db.MeditationTypes.Remove(entity); }
            await _db.SaveChangesAsync();
            return true;
        }
    }
}
