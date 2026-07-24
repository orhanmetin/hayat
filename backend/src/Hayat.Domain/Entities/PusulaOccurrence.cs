using System;

namespace Hayat.Domain.Entities
{
    /// <summary>Per-date completion record of a recurring task.</summary>
    public class PusulaOccurrence
    {
        public int Id { get; set; }
        public int TaskId { get; set; }
        public PusulaTask Task { get; set; } = null!;
        public DateOnly Date { get; set; }
        public int Status { get; set; } = PusulaTask.StatusPending;
        public int? ActualMinutes { get; set; }
        public DateTime? CompletedAt { get; set; }
    }
}
