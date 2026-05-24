using System;

namespace Hayat.Domain.Entities
{
    public class SleepLog
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public User User { get; set; } = null!;
        public DateTime BedTime { get; set; }
        public DateTime WakeTime { get; set; }
        public int Quality { get; set; }
        public string? Note { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public int DurationMinutes =>
            (int)Math.Max(0, (WakeTime - BedTime).TotalMinutes);
    }
}
