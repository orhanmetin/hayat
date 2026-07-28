using System;

namespace Hayat.Domain.Entities
{
    public class User
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        /// <summary>Opaque token for iOS Shortcuts API calls (Bearer). Null until generated.</summary>
        public string? ShortcutsApiToken { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
