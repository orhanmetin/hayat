using System;

namespace Hayat.Domain.Entities
{
    public class HatiraPhoto
    {
        public int Id { get; set; }
        public int MemoryId { get; set; }
        public HatiraMemory Memory { get; set; } = null!;

        public string ContentType { get; set; } = "image/jpeg";
        public string FileName { get; set; } = string.Empty;
        public byte[] Content { get; set; } = Array.Empty<byte>();
        public int SortOrder { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
