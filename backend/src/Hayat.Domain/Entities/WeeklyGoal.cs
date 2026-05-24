using System;

namespace Hayat.Domain.Entities
{
    public class WeeklyGoal
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public User User { get; set; } = null!;
        public int Year { get; set; }
        public int WeekNumber { get; set; }
        public int? TargetAvgSleepMinutesPerDay { get; set; }
        public int? TargetTotalSportMinutes { get; set; }
        public int? TargetAvgDeepWorkMinutesPerDay { get; set; }
        public int? TargetAvgMeditationMinutesPerDay { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
