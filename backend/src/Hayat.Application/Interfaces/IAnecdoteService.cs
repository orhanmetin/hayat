using System.Collections.Generic;
using System.Threading.Tasks;
using Hayat.Application.DTOs;

namespace Hayat.Application.Interfaces
{
    public interface IAnecdoteService
    {
        Task<IReadOnlyList<AnecdoteDto>> GetAllAsync(int userId);
        Task<AnecdoteDto?> GetByIdAsync(int userId, int id);
        Task<AnecdoteDto?> CreateAsync(int userId, CreateAnecdoteRequest request);
        Task<AnecdoteDto?> UpdateAsync(int userId, int id, UpdateAnecdoteRequest request);
        Task<bool> DeleteAsync(int userId, int id);
    }
}
