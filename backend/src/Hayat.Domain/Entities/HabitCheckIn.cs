using System;

namespace Hayat.Domain.Entities
{
    public class HabitCheckIn
    {
        public int Id { get; set; }
        public int HabitId { get; set; }
        public Habit Habit { get; set; } = null!;
        public DateOnly Date { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
