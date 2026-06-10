using System;

namespace Hayat.Domain.Entities
{
    public class MeditationSession
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public User User { get; set; } = null!;
        public int MeditationTypeId { get; set; }
        public MeditationType MeditationType { get; set; } = null!;
        public DateOnly Date { get; set; }
        public int DurationMinutes { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
