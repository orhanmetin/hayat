using System;

namespace Hayat.Application.DTOs
{
    public record AnecdoteDto(
        int Id,
        string Text,
        string? Author,
        DateTime CreatedAt,
        DateTime UpdatedAt
    );

    public record CreateAnecdoteRequest(string Text, string? Author);

    public record UpdateAnecdoteRequest(string Text, string? Author);
}
