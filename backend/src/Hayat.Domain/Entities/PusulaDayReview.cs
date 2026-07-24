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
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
