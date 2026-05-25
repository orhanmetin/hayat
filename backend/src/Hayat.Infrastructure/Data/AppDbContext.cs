using Microsoft.EntityFrameworkCore;
using Hayat.Domain.Entities;

namespace Hayat.Infrastructure.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users => Set<User>();
        public DbSet<SportActivityType> SportActivityTypes => Set<SportActivityType>();
        public DbSet<DeepWorkType> DeepWorkTypes => Set<DeepWorkType>();
        public DbSet<Habit> Habits => Set<Habit>();
        public DbSet<HabitCheckIn> HabitCheckIns => Set<HabitCheckIn>();
        public DbSet<SleepLog> SleepLogs => Set<SleepLog>();
        public DbSet<SportActivity> SportActivities => Set<SportActivity>();
        public DbSet<MeditationSession> MeditationSessions => Set<MeditationSession>();
        public DbSet<DeepWorkSession> DeepWorkSessions => Set<DeepWorkSession>();
        public DbSet<WeeklyGoal> WeeklyGoals => Set<WeeklyGoal>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<User>(e =>
            {
                e.HasKey(x => x.Id);
                e.HasIndex(x => x.Username).IsUnique();
                e.Property(x => x.Username).HasMaxLength(50).IsRequired();
                e.Property(x => x.PasswordHash).HasMaxLength(255).IsRequired();
                e.Property(x => x.DisplayName).HasMaxLength(100).IsRequired();
            });

            modelBuilder.Entity<SportActivityType>(e =>
            {
                e.HasKey(x => x.Id);
                e.Property(x => x.Name).HasMaxLength(80).IsRequired();
                e.HasIndex(x => x.Name).IsUnique();
            });

            modelBuilder.Entity<DeepWorkType>(e =>
            {
                e.HasKey(x => x.Id);
                e.Property(x => x.Name).HasMaxLength(80).IsRequired();
                e.HasIndex(x => x.Name).IsUnique();
            });

            modelBuilder.Entity<Habit>(e =>
            {
                e.HasKey(x => x.Id);
                e.Property(x => x.Name).HasMaxLength(100).IsRequired();
                e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<HabitCheckIn>(e =>
            {
                e.HasKey(x => x.Id);
                e.HasIndex(x => new { x.HabitId, x.Date }).IsUnique();
                e.HasOne(x => x.Habit).WithMany(h => h.CheckIns).HasForeignKey(x => x.HabitId).OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<SleepLog>(e =>
            {
                e.HasKey(x => x.Id);
                e.Property(x => x.Note).HasMaxLength(500);
                e.Ignore(x => x.DurationMinutes);
                e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<SportActivity>(e =>
            {
                e.HasKey(x => x.Id);
                e.Property(x => x.DistanceKm).HasColumnType("REAL");
                e.Property(x => x.StravaLink).HasMaxLength(500);
                e.Property(x => x.Note).HasMaxLength(500);
                e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
                e.HasOne(x => x.SportActivityType).WithMany().HasForeignKey(x => x.SportActivityTypeId).OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<MeditationSession>(e =>
            {
                e.HasKey(x => x.Id);
                e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<DeepWorkSession>(e =>
            {
                e.HasKey(x => x.Id);
                e.Property(x => x.Description).HasMaxLength(500);
                e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
                e.HasOne(x => x.DeepWorkType).WithMany().HasForeignKey(x => x.DeepWorkTypeId).OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<WeeklyGoal>(e =>
            {
                e.HasKey(x => x.Id);
                e.HasIndex(x => new { x.UserId, x.Year, x.WeekNumber }).IsUnique();
                e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            });
        }
    }
}
