using System.Collections.Generic;

namespace Hayat.Domain.Entities
{
    /// <summary>Task category (two-level: root categories with optional children).</summary>
    public class PusulaCategory
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public User User { get; set; } = null!;
        public string Name { get; set; } = string.Empty;
        public int? ParentId { get; set; }
        public PusulaCategory? Parent { get; set; }
        public List<PusulaCategory> Children { get; set; } = new();
        public int SortOrder { get; set; }
        public bool IsActive { get; set; } = true;
    }
}
