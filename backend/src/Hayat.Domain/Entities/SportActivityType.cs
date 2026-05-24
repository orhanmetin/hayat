namespace Hayat.Domain.Entities
{
    public class SportActivityType
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
        public int SortOrder { get; set; }
    }
}
