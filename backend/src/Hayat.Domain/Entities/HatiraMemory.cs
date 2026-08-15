using System;
using System.Collections.Generic;

namespace Hayat.Domain.Entities
{
    public class HatiraMemory
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public User User { get; set; } = null!;

        /// <summary>Required free-text note / feeling.</summary>
        public string Text { get; set; } = string.Empty;

        /// <summary>When the experience happened (local wall-clock stored as UTC instant).</summary>
        public DateTime OccurredAt { get; set; }

        /// <summary>Yemek | Konaklama | Günce</summary>
        public string ExperienceType { get; set; } = "Günce";

        public string? LocationName { get; set; }
        public string? GoogleMapsUrl { get; set; }

        /// <summary>Comma-separated companion names, e.g. "Ayşe, Defne, Anne".</summary>
        public string? Companions { get; set; }

        /// <summary>Optional 1–5 star rating.</summary>
        public int? Rating { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<HatiraPhoto> Photos { get; set; } = new List<HatiraPhoto>();
    }
}
