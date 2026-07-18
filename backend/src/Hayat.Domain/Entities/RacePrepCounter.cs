using System;

namespace Hayat.Domain.Entities
{
    /// <summary>Manually tracked counters for the race preparation module (one row per user).</summary>
    public class RacePrepCounter
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public User User { get; set; } = null!;
        public int VisualizationCount { get; set; }
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
