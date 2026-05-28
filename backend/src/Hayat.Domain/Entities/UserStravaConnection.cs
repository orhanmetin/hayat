using System;

namespace Hayat.Domain.Entities
{
    public class UserStravaConnection
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public User User { get; set; } = null!;
        public long AthleteId { get; set; }
        public string AccessToken { get; set; } = string.Empty;
        public string RefreshToken { get; set; } = string.Empty;
        public DateTime ExpiresAtUtc { get; set; }
        public DateTime ConnectedAtUtc { get; set; } = DateTime.UtcNow;
        public DateTime? LastSyncAtUtc { get; set; }
    }
}
