using System;

namespace Hayat.Domain.Entities
{
    public class SportActivity
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public User User { get; set; } = null!;
        public int SportActivityTypeId { get; set; }
        public SportActivityType SportActivityType { get; set; } = null!;
        public DateOnly Date { get; set; }
        public int DurationMinutes { get; set; }
        public decimal? DistanceKm { get; set; }
        public long? StravaActivityId { get; set; }
        public string? StravaLink { get; set; }
        public string? Note { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
