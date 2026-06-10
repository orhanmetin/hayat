using System;

namespace Hayat.Domain.Entities
{
    public class ActiveTimer
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public User User { get; set; } = null!;
        public DateTime StartTime { get; set; }
    }
}
