using System;
using System.Collections.Generic;
using System.Linq;
using Hayat.Application.Common;
using Hayat.Domain.Entities;

namespace Hayat.Infrastructure.Data
{
    /// <summary>
    /// Son 90 gün için tüm spor/deep work alt türleri, uyku, meditasyon ve alışkanlık test verisi.
    /// Ortam: HAYAT_SEED_DASHBOARD_TEST=1 (ilk seed) veya refresh (sil + yeniden oluştur)
    /// </summary>
    public static class DashboardTestDataSeeder
    {
        public const string Marker = "[dashboard-test]";
        private const int DaysBack = 90;

        public static void Seed(AppDbContext context)
        {
            var mode = Environment.GetEnvironmentVariable("HAYAT_SEED_DASHBOARD_TEST");
            if (string.IsNullOrWhiteSpace(mode) || mode is "0" or "false")
                return;

            var admin = context.Users.FirstOrDefault(u => u.Username == "admin");
            if (admin == null)
                return;

            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var start = today.AddDays(-(DaysBack - 1));
            var forceRefresh = string.Equals(mode, "refresh", StringComparison.OrdinalIgnoreCase);

            var hasTest = context.SleepLogs.Any(s =>
                s.UserId == admin.Id && s.Note != null && s.Note.Contains(Marker));

            if (hasTest && !forceRefresh)
                return;

            if (hasTest && forceRefresh)
                ClearTestData(context, admin.Id, start, today);

            var rng = new Random(20260524);
            var sportTypes = context.SportActivityTypes.Where(t => t.IsActive).OrderBy(t => t.SortOrder).ToList();
            var deepWorkTypes = context.DeepWorkTypes.Where(t => t.IsActive).OrderBy(t => t.SortOrder).ToList();
            var meditationTypes = context.MeditationTypes.Where(t => t.IsActive).OrderBy(t => t.SortOrder).ToList();
            if (meditationTypes.Count == 0) return;
            var habits = EnsureHabits(context, admin.Id);
            var habitIds = habits.Select(h => h.Id).ToList();
            var existingCheckInKeys = context.HabitCheckIns
                .Where(c => habitIds.Contains(c.HabitId) && c.Date >= start && c.Date <= today)
                .Select(c => new { c.HabitId, c.Date })
                .AsEnumerable()
                .Select(x => (x.HabitId, x.Date))
                .ToHashSet();

            var sleepLogs = new List<SleepLog>();
            var sportActivities = new List<SportActivity>();
            var deepWorkSessions = new List<DeepWorkSession>();
            var meditationSessions = new List<MeditationSession>();
            var habitCheckIns = new List<HabitCheckIn>();

            // Uyku: gecelik ~%82 olasılık, 6–9 saat
            for (var i = 0; i < DaysBack; i++)
            {
                var date = start.AddDays(i);
                if (rng.NextDouble() > 0.82) continue;

                var bedHour = 22 + rng.Next(0, 2);
                var bedMinute = rng.Next(0, 60);
                var bed = date.AddDays(-1).ToDateTime(new TimeOnly(bedHour, bedMinute), DateTimeKind.Utc);
                var wakeMinutes = rng.Next(360, 541);
                var wake = bed.AddMinutes(wakeMinutes);

                sleepLogs.Add(new SleepLog
                {
                    UserId = admin.Id,
                    BedTime = bed,
                    WakeTime = wake,
                    Quality = rng.Next(2, 6),
                    Note = $"{Marker} uyku",
                    CreatedAt = wake
                });
            }

            // Spor: her alt tür için 90 günde düzensiz aralıklarla kayıt
            foreach (var type in sportTypes)
            {
                var typeRng = new Random(20260524 + type.Id * 17);
                var day = start.AddDays(typeRng.Next(0, 4));
                while (day <= today)
                {
                    sportActivities.Add(new SportActivity
                    {
                        UserId = admin.Id,
                        SportActivityTypeId = type.Id,
                        Date = day,
                        DurationMinutes = typeRng.Next(20, 95),
                        Note = $"{Marker} {type.Name}",
                        CreatedAt = day.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc)
                    });
                    day = day.AddDays(typeRng.Next(3, 7));
                }
            }

            // Deep work: her alt tür
            foreach (var type in deepWorkTypes)
            {
                var typeRng = new Random(20260524 + type.Id * 31);
                var day = start.AddDays(typeRng.Next(0, 5));
                while (day <= today)
                {
                    deepWorkSessions.Add(new DeepWorkSession
                    {
                        UserId = admin.Id,
                        DeepWorkTypeId = type.Id,
                        Date = day,
                        DurationMinutes = typeRng.Next(30, 181),
                        Description = $"{Marker} {type.Name}",
                        CreatedAt = day.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc)
                    });
                    day = day.AddDays(typeRng.Next(2, 6));
                }
            }

            // Meditasyon: yaklaşık haftada 4–5 gün
            for (var i = 0; i < DaysBack; i++)
            {
                if (rng.NextDouble() > 0.58) continue;
                var date = start.AddDays(i);
                meditationSessions.Add(new MeditationSession
                {
                    UserId = admin.Id,
                    MeditationTypeId = meditationTypes[rng.Next(meditationTypes.Count)].Id,
                    Date = date,
                    DurationMinutes = 5 + rng.Next(0, 6) * 5,
                    CreatedAt = date.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc)
                });
            }

            // Alışkanlık check-in: her alışkanlık için günlerin ~%72'si
            foreach (var habit in habits)
            {
                var habitRng = new Random(20260524 + habit.Id * 13);
                for (var i = 0; i < DaysBack; i++)
                {
                    if (habitRng.NextDouble() > 0.72) continue;
                    var date = start.AddDays(i);
                    if (existingCheckInKeys.Contains((habit.Id, date))
                        || habitCheckIns.Any(c => c.HabitId == habit.Id && c.Date == date))
                        continue;
                    habitCheckIns.Add(new HabitCheckIn { HabitId = habit.Id, Date = date });
                    existingCheckInKeys.Add((habit.Id, date));
                }
            }

            context.SleepLogs.AddRange(sleepLogs);
            context.SportActivities.AddRange(sportActivities);
            context.DeepWorkSessions.AddRange(deepWorkSessions);
            context.MeditationSessions.AddRange(meditationSessions);
            context.HabitCheckIns.AddRange(habitCheckIns);

            SeedWeeklyGoals(context, admin.Id, start, today, rng);
            context.SaveChanges();

            RecalculateHabitStreaks(context, habits);
            context.SaveChanges();
        }

        private static List<Habit> EnsureHabits(AppDbContext context, int userId)
        {
            var habits = context.Habits.Where(h => h.UserId == userId && h.IsActive).ToList();
            if (habits.Count >= 3) return habits;

            var names = new[] { "Kitap Okuma", "Su İçme", "Meditasyon", "Esneme", "Günlük" };
            foreach (var name in names)
            {
                if (habits.Any(h => h.Name == name)) continue;
                var h = new Habit
                {
                    UserId = userId,
                    Name = name,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };
                context.Habits.Add(h);
                habits.Add(h);
            }

            context.SaveChanges();
            return habits;
        }

        private static void SeedWeeklyGoals(AppDbContext context, int userId, DateOnly start, DateOnly end, Random rng)
        {
            var seen = new HashSet<(int Year, int Week)>();
            for (var d = start; d <= end; d = d.AddDays(1))
            {
                var (year, week) = WeekHelper.GetIsoWeek(d);
                if (!seen.Add((year, week))) continue;
                if (context.WeeklyGoals.Any(g => g.UserId == userId && g.Year == year && g.WeekNumber == week))
                    continue;

                context.WeeklyGoals.Add(new WeeklyGoal
                {
                    UserId = userId,
                    Year = year,
                    WeekNumber = week,
                    TargetAvgSleepMinutesPerDay = 420 + rng.Next(0, 61),
                    TargetTotalSportMinutes = 120 + rng.Next(0, 91),
                    TargetAvgDeepWorkMinutesPerDay = 90 + rng.Next(0, 61),
                    TargetAvgMeditationMinutesPerDay = 15 + rng.Next(0, 21),
                    CreatedAt = DateTime.UtcNow
                });
            }
        }

        private static void RecalculateHabitStreaks(AppDbContext context, List<Habit> habits)
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            foreach (var habit in habits)
            {
                var dates = context.HabitCheckIns
                    .Where(c => c.HabitId == habit.Id)
                    .Select(c => c.Date)
                    .ToList();
                var best = StreakCalculator.GetBestStreak(dates);
                if (best > habit.RecordStreak)
                    habit.RecordStreak = best;
            }
        }

        private static void ClearTestData(AppDbContext context, int userId, DateOnly start, DateOnly end)
        {
            context.SleepLogs.RemoveRange(
                context.SleepLogs.Where(s => s.UserId == userId && s.Note != null && s.Note.Contains(Marker)));

            context.SportActivities.RemoveRange(
                context.SportActivities.Where(s => s.UserId == userId && s.Note != null && s.Note.Contains(Marker)));

            context.DeepWorkSessions.RemoveRange(
                context.DeepWorkSessions.Where(s =>
                    s.UserId == userId && s.Description != null && s.Description.Contains(Marker)));

            context.MeditationSessions.RemoveRange(
                context.MeditationSessions.Where(m => m.UserId == userId && m.Date >= start && m.Date <= end));

            var habitIds = context.Habits.Where(h => h.UserId == userId).Select(h => h.Id);
            context.HabitCheckIns.RemoveRange(
                context.HabitCheckIns.Where(c => habitIds.Contains(c.HabitId) && c.Date >= start && c.Date <= end));

            context.SaveChanges();
        }
    }
}
