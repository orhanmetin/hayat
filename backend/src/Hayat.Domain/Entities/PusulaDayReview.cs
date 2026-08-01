using System;

namespace Hayat.Domain.Entities
{
    /// <summary>Day start vision / day end reflection for a given date (one row per user per date).</summary>
    public class PusulaDayReview
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public User User { get; set; } = null!;
        public DateOnly Date { get; set; }
        public string? StartVision { get; set; }
        public string? EndReflection { get; set; }
        /// <summary>1-5 qualitative feeling score for the day.</summary>
        public int? FeelingScore { get; set; }

        /// <summary>Frozen day-end performance captured when the end review is saved.</summary>
        public DateTime? PerformanceCapturedAt { get; set; }
        public int? SnapshotTotalTasks { get; set; }
        public int? SnapshotCompletedTasks { get; set; }
        public double? SnapshotCompletionPercent { get; set; }
        public int? SnapshotPlannedMinutes { get; set; }
        public int? SnapshotActualMinutes { get; set; }
        /// <summary>JSON array of { name, plannedMinutes, actualMinutes } by root category.</summary>
        public string? SnapshotCategoryJson { get; set; }

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
