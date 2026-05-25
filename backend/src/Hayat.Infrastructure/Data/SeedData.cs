using System;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Hayat.Domain.Entities;

namespace Hayat.Infrastructure.Data
{
    public static class SeedData
    {
        public static void Initialize(IServiceProvider serviceProvider)
        {
            using var context = new AppDbContext(
                serviceProvider.GetRequiredService<DbContextOptions<AppDbContext>>());

            try
            {
                context.Database.ExecuteSqlRaw("DELETE FROM \"__EFMigrationsLock\"");
            }
            catch
            {
                // lock tablosu henüz yoksa yoksay
            }

            context.Database.Migrate();

            if (!context.Users.Any())
            {
                context.Users.Add(new User
                {
                    Username = "admin",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"),
                    DisplayName = "Orhan",
                    CreatedAt = DateTime.UtcNow
                });
                context.SaveChanges();
            }
            else
            {
                var admin = context.Users.FirstOrDefault(u => u.Username == "admin");
                if (admin != null && admin.DisplayName != "Orhan")
                {
                    admin.DisplayName = "Orhan";
                    context.SaveChanges();
                }
            }

            SeedLookupTypes(context);
            SeedSampleHabits(context);
            DashboardTestDataSeeder.Seed(context);
        }

        private static void SeedLookupTypes(AppDbContext context)
        {
            if (!context.SportActivityTypes.Any())
            {
                var sportTypes = new[] { "Koşu", "Yürüyüş", "Bisiklet", "Güç Çalışması", "Yüzme", "Yoga" };
                for (var i = 0; i < sportTypes.Length; i++)
                {
                    context.SportActivityTypes.Add(new SportActivityType
                    {
                        Name = sportTypes[i],
                        SortOrder = i + 1
                    });
                }
            }

            if (!context.DeepWorkTypes.Any())
            {
                var deepWorkTypes = new[] { "Okuma", "İş", "Yazı", "Araştırma", "Geliştirme" };
                for (var i = 0; i < deepWorkTypes.Length; i++)
                {
                    context.DeepWorkTypes.Add(new DeepWorkType
                    {
                        Name = deepWorkTypes[i],
                        SortOrder = i + 1
                    });
                }
            }

            context.SaveChanges();
        }

        private static void SeedSampleHabits(AppDbContext context)
        {
            if (context.Habits.Any()) return;

            var admin = context.Users.FirstOrDefault(u => u.Username == "admin");
            if (admin == null) return;

            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var yesterday = today.AddDays(-1);

            var habits = new[]
            {
                new Habit { UserId = admin.Id, Name = "Kitap Okuma", CreatedAt = DateTime.UtcNow },
                new Habit { UserId = admin.Id, Name = "Su İçme", CreatedAt = DateTime.UtcNow },
                new Habit { UserId = admin.Id, Name = "Meditasyon", CreatedAt = DateTime.UtcNow }
            };

            context.Habits.AddRange(habits);
            context.SaveChanges();

            context.HabitCheckIns.AddRange(
                new HabitCheckIn { HabitId = habits[0].Id, Date = yesterday },
                new HabitCheckIn { HabitId = habits[0].Id, Date = today },
                new HabitCheckIn { HabitId = habits[1].Id, Date = today }
            );
            context.SaveChanges();
        }
    }
}
