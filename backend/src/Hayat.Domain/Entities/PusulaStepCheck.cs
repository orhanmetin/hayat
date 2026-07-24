using System;

namespace Hayat.Domain.Entities
{
    /// <summary>A step checked on a given date (per-date so recurring tasks keep history).</summary>
    public class PusulaStepCheck
    {
        public int Id { get; set; }
        public int StepId { get; set; }
        public PusulaTaskStep Step { get; set; } = null!;
        public DateOnly Date { get; set; }
    }
}
