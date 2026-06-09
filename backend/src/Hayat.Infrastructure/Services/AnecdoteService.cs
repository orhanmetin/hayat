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
    public class AnecdoteService : IAnecdoteService
    {
        private const int MaxTextLength = 2000;
        private const int MaxAuthorLength = 120;

        private readonly AppDbContext _db;

        public AnecdoteService(AppDbContext db) => _db = db;

        public async Task<IReadOnlyList<AnecdoteDto>> GetAllAsync(int userId) =>
            await _db.Anecdotes.AsNoTracking()
                .Where(a => a.UserId == userId)
                .OrderByDescending(a => a.UpdatedAt)
                .Select(a => new AnecdoteDto(a.Id, a.Text, a.Author, a.CreatedAt, a.UpdatedAt))
                .ToListAsync();

        public async Task<AnecdoteDto?> GetByIdAsync(int userId, int id) =>
            await _db.Anecdotes.AsNoTracking()
                .Where(a => a.UserId == userId && a.Id == id)
                .Select(a => new AnecdoteDto(a.Id, a.Text, a.Author, a.CreatedAt, a.UpdatedAt))
                .FirstOrDefaultAsync();

        public async Task<AnecdoteDto?> CreateAsync(int userId, CreateAnecdoteRequest request)
        {
            if (!TryNormalize(request.Text, request.Author, out var text, out var author))
                return null;

            var now = DateTime.UtcNow;
            var anecdote = new Anecdote
            {
                UserId = userId,
                Text = text,
                Author = author,
                CreatedAt = now,
                UpdatedAt = now
            };
            _db.Anecdotes.Add(anecdote);
            await _db.SaveChangesAsync();
            return Map(anecdote);
        }

        public async Task<AnecdoteDto?> UpdateAsync(int userId, int id, UpdateAnecdoteRequest request)
        {
            if (!TryNormalize(request.Text, request.Author, out var text, out var author))
                return null;

            var anecdote = await _db.Anecdotes
                .FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);
            if (anecdote == null) return null;

            anecdote.Text = text;
            anecdote.Author = author;
            anecdote.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return Map(anecdote);
        }

        public async Task<bool> DeleteAsync(int userId, int id)
        {
            var anecdote = await _db.Anecdotes
                .FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);
            if (anecdote == null) return false;

            _db.Anecdotes.Remove(anecdote);
            await _db.SaveChangesAsync();
            return true;
        }

        private static bool TryNormalize(
            string text,
            string? author,
            out string normalizedText,
            out string? normalizedAuthor)
        {
            normalizedText = text?.Trim() ?? string.Empty;
            normalizedAuthor = string.IsNullOrWhiteSpace(author) ? null : author.Trim();

            if (normalizedText.Length == 0 || normalizedText.Length > MaxTextLength)
            {
                normalizedAuthor = null;
                return false;
            }

            if (normalizedAuthor != null && normalizedAuthor.Length > MaxAuthorLength)
                return false;

            return true;
        }

        private static AnecdoteDto Map(Anecdote a) =>
            new(a.Id, a.Text, a.Author, a.CreatedAt, a.UpdatedAt);
    }
}
