using System;
using System.Collections.Generic;

namespace Hayat.Domain.Entities
{
    /// <summary>Pusula planning task. Recurrence/WorkType/Status stored as small ints (see Pusula service maps).</summary>
    public class PusulaTask
    {
        public const int RecurrenceNone = 0;
        public const int RecurrenceDaily = 1;
        public const int RecurrenceWeekly = 2;

        public const int WorkTypeNone = 0;
        public const int WorkTypeDeep = 1;
        public const int WorkTypeShallow = 2;

        public const int StatusPending = 0;
        public const int StatusCompleted = 1;

        public int Id { get; set; }
        public int UserId { get; set; }
        public User User { get; set; } = null!;
        public int? CategoryId { get; set; }
        public PusulaCategory? Category { get; set; }

        public string Title { get; set; } = string.Empty;
        public string? Note { get; set; }

        /// <summary>Planned date (for recurring tasks: the start date).</summary>
        public DateOnly Date { get; set; }
        public TimeOnly? TimeOfDay { get; set; }
        public int? EstimatedMinutes { get; set; }
        public int? ActualMinutes { get; set; }

        /// <summary>1 (highest) - 3 (lowest).</summary>
        public int Priority { get; set; } = 3;

        /// <summary>Overrides the auto-suggested score when set.</summary>
        public int? ManualScore { get; set; }

        public int Recurrence { get; set; } = RecurrenceNone;
        /// <summary>For weekly recurrence: 0=Sunday .. 6=Saturday (matches DayOfWeek).</summary>
        public int? RecurrenceDay { get; set; }

        public int WorkType { get; set; } = WorkTypeNone;

        /// <summary>Stored status for one-time tasks. Recurring tasks track status per date in PusulaOccurrence.</summary>
        public int Status { get; set; } = StatusPending;
        public DateTime? CompletedAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        /// <summary>Manual list order (lower = higher in list).</summary>
        public int SortOrder { get; set; }

        public List<PusulaTaskStep> Steps { get; set; } = new();
        public List<PusulaOccurrence> Occurrences { get; set; } = new();
    }
}
