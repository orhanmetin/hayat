using System;

namespace Hayat.Domain.Entities
{
    public class DeepWorkSession
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public User User { get; set; } = null!;
        public int DeepWorkTypeId { get; set; }
        public DeepWorkType DeepWorkType { get; set; } = null!;
        public DateOnly Date { get; set; }
        public int DurationMinutes { get; set; }
        public string? Description { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
