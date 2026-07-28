using System;

namespace Hayat.Domain.Entities
{
    /// <summary>Daily step count imported from Apple Health via Shortcuts.</summary>
    public class DailyStepLog
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public User User { get; set; } = null!;
        public DateOnly Date { get; set; }
        public int Steps { get; set; }
        public string Source { get; set; } = "shortcuts";
        public DateTime SyncedAt { get; set; } = DateTime.UtcNow;
    }
}
