using System.Collections.Generic;

namespace Hayat.Domain.Entities
{
    /// <summary>Check-only sub step of a task (no time constraints).</summary>
    public class PusulaTaskStep
    {
        public int Id { get; set; }
        public int TaskId { get; set; }
        public PusulaTask Task { get; set; } = null!;
        public string Title { get; set; } = string.Empty;
        public int SortOrder { get; set; }
        public List<PusulaStepCheck> Checks { get; set; } = new();
    }
}
