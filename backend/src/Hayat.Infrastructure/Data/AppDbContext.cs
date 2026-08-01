using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Hayat.Domain.Entities;

namespace Hayat.Infrastructure.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            optionsBuilder.ConfigureWarnings(w =>
                w.Ignore(RelationalEventId.PendingModelChangesWarning));
        }

        public DbSet<User> Users => Set<User>();
        public DbSet<SportActivityType> SportActivityTypes => Set<SportActivityType>();
        public DbSet<DeepWorkType> DeepWorkTypes => Set<DeepWorkType>();
        public DbSet<MeditationType> MeditationTypes => Set<MeditationType>();
        public DbSet<Habit> Habits => Set<Habit>();
        public DbSet<HabitCheckIn> HabitCheckIns => Set<HabitCheckIn>();
        public DbSet<SleepLog> SleepLogs => Set<SleepLog>();
        public DbSet<SportActivity> SportActivities => Set<SportActivity>();
        public DbSet<MeditationSession> MeditationSessions => Set<MeditationSession>();
        public DbSet<DeepWorkSession> DeepWorkSessions => Set<DeepWorkSession>();
        public DbSet<WeeklyGoal> WeeklyGoals => Set<WeeklyGoal>();
        public DbSet<UserStravaConnection> UserStravaConnections => Set<UserStravaConnection>();
        public DbSet<Anecdote> Anecdotes => Set<Anecdote>();
        public DbSet<ActiveTimer> ActiveTimers => Set<ActiveTimer>();
        public DbSet<RacePrepCounter> RacePrepCounters => Set<RacePrepCounter>();
        public DbSet<PusulaCategory> PusulaCategories => Set<PusulaCategory>();
        public DbSet<PusulaTask> PusulaTasks => Set<PusulaTask>();
        public DbSet<PusulaTaskStep> PusulaTaskSteps => Set<PusulaTaskStep>();
        public DbSet<PusulaStepCheck> PusulaStepChecks => Set<PusulaStepCheck>();
        public DbSet<PusulaOccurrence> PusulaOccurrences => Set<PusulaOccurrence>();
        public DbSet<PusulaDayReview> PusulaDayReviews => Set<PusulaDayReview>();
        public DbSet<DailyStepLog> DailyStepLogs => Set<DailyStepLog>();
        public DbSet<ScreenTimeLog> ScreenTimeLogs => Set<ScreenTimeLog>();

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
                e.Property(x => x.ShortcutsApiToken).HasMaxLength(128);
                e.HasIndex(x => x.ShortcutsApiToken);
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

            modelBuilder.Entity<MeditationType>(e =>
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
                e.HasIndex(x => new { x.HabitId, x.Date });
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
                e.HasIndex(x => new { x.UserId, x.StravaActivityId })
                    .IsUnique()
                    .HasFilter("StravaActivityId IS NOT NULL");
                e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
                e.HasOne(x => x.SportActivityType).WithMany().HasForeignKey(x => x.SportActivityTypeId).OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<UserStravaConnection>(e =>
            {
                e.HasKey(x => x.Id);
                e.HasIndex(x => x.UserId).IsUnique();
                e.Property(x => x.AccessToken).HasMaxLength(512).IsRequired();
                e.Property(x => x.RefreshToken).HasMaxLength(512).IsRequired();
                e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<MeditationSession>(e =>
            {
                e.HasKey(x => x.Id);
                e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
                e.HasOne(x => x.MeditationType).WithMany().HasForeignKey(x => x.MeditationTypeId).OnDelete(DeleteBehavior.Restrict);
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

            modelBuilder.Entity<Anecdote>(e =>
            {
                e.HasKey(x => x.Id);
                e.Property(x => x.Text).HasMaxLength(2000).IsRequired();
                e.Property(x => x.Author).HasMaxLength(120);
                e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<ActiveTimer>(e =>
            {
                e.HasKey(x => x.Id);
                e.HasIndex(x => x.UserId).IsUnique();
                e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<RacePrepCounter>(e =>
            {
                e.HasKey(x => x.Id);
                e.HasIndex(x => x.UserId).IsUnique();
                e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<PusulaCategory>(e =>
            {
                e.HasKey(x => x.Id);
                e.Property(x => x.Name).HasMaxLength(80).IsRequired();
                e.HasIndex(x => new { x.UserId, x.ParentId });
                e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
                e.HasOne(x => x.Parent).WithMany(c => c.Children).HasForeignKey(x => x.ParentId).OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<PusulaTask>(e =>
            {
                e.HasKey(x => x.Id);
                e.Property(x => x.Title).HasMaxLength(300).IsRequired();
                e.Property(x => x.Note).HasMaxLength(2000);
                e.HasIndex(x => new { x.UserId, x.Date });
                e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
                e.HasOne(x => x.Category).WithMany().HasForeignKey(x => x.CategoryId).OnDelete(DeleteBehavior.SetNull);
            });

            modelBuilder.Entity<PusulaTaskStep>(e =>
            {
                e.HasKey(x => x.Id);
                e.Property(x => x.Title).HasMaxLength(300).IsRequired();
                e.HasOne(x => x.Task).WithMany(t => t.Steps).HasForeignKey(x => x.TaskId).OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<PusulaStepCheck>(e =>
            {
                e.HasKey(x => x.Id);
                e.HasIndex(x => new { x.StepId, x.Date }).IsUnique();
                e.HasOne(x => x.Step).WithMany(s => s.Checks).HasForeignKey(x => x.StepId).OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<PusulaOccurrence>(e =>
            {
                e.HasKey(x => x.Id);
                e.HasIndex(x => new { x.TaskId, x.Date }).IsUnique();
                e.HasOne(x => x.Task).WithMany(t => t.Occurrences).HasForeignKey(x => x.TaskId).OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<PusulaDayReview>(e =>
            {
                e.HasKey(x => x.Id);
                e.HasIndex(x => new { x.UserId, x.Date }).IsUnique();
                e.Property(x => x.StartVision).HasMaxLength(4000);
                e.Property(x => x.EndReflection).HasMaxLength(4000);
                e.Property(x => x.SnapshotCategoryJson).HasMaxLength(8000);
                e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<DailyStepLog>(e =>
            {
                e.HasKey(x => x.Id);
                e.HasIndex(x => new { x.UserId, x.Date }).IsUnique();
                e.Property(x => x.Source).HasMaxLength(40).IsRequired();
                e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<ScreenTimeLog>(e =>
            {
                e.HasKey(x => x.Id);
                e.HasIndex(x => new { x.UserId, x.Date, x.AppName, x.Kind }).IsUnique();
                e.Property(x => x.AppName).HasMaxLength(120).IsRequired();
                e.Property(x => x.Kind).HasMaxLength(20).IsRequired();
                e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            });
        }
    }
}
