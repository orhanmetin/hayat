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
        /// <summary>Daily average step count target for the ISO week.</summary>
        public int? TargetAvgStepsPerDay { get; set; }
        /// <summary>Daily average total screen-time minutes target for the ISO week.</summary>
        public int? TargetAvgScreenMinutesPerDay { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
