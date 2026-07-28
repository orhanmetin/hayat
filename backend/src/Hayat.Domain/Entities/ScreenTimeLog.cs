using System;

namespace Hayat.Domain.Entities
{
    /// <summary>Per-app/website screen time for a day (from Shortcuts Get App & Website Usage).</summary>
    public class ScreenTimeLog
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public User User { get; set; } = null!;
        public DateOnly Date { get; set; }
        /// <summary>App or website display name.</summary>
        public string AppName { get; set; } = string.Empty;
        /// <summary>"app" or "website".</summary>
        public string Kind { get; set; } = "app";
        public int Minutes { get; set; }
        public DateTime SyncedAt { get; set; } = DateTime.UtcNow;
    }
}
