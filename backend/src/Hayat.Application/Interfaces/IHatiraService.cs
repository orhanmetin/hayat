using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Hayat.Application.DTOs;

namespace Hayat.Application.Interfaces
{
    public interface IHatiraService
    {
        Task<IReadOnlyList<HatiraMemoryDto>> ListAsync(
            int userId,
            DateOnly? from,
            DateOnly? to,
            string? companion,
            string? location);

        Task<HatiraFilterOptionsDto> GetFilterOptionsAsync(int userId);

        Task<HatiraMemoryDto?> GetByIdAsync(int userId, int id);

        Task<HatiraMemoryDto?> CreateAsync(
            int userId,
            CreateHatiraRequest request,
            IReadOnlyList<HatiraPhotoUpload>? photos);

        Task<HatiraMemoryDto?> UpdateAsync(
            int userId,
            int id,
            UpdateHatiraRequest request,
            IReadOnlyList<HatiraPhotoUpload>? newPhotos);

        Task<bool> DeleteAsync(int userId, int id);

        Task<(byte[] Content, string ContentType, string FileName)?> GetPhotoAsync(int userId, int photoId);
    }
}
