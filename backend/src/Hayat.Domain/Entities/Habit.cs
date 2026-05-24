using System;
using System.Collections.Generic;

namespace Hayat.Domain.Entities
{
    public class Habit
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public User User { get; set; } = null!;
        public string Name { get; set; } = string.Empty;
        public int RecordStreak { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public ICollection<HabitCheckIn> CheckIns { get; set; } = new List<HabitCheckIn>();
    }
}
