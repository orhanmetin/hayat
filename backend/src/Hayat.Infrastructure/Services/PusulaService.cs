using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Hayat.Application.Common;
using Hayat.Application.DTOs;
using Hayat.Application.Interfaces;
using Hayat.Domain.Entities;
using Hayat.Infrastructure.Data;

namespace Hayat.Infrastructure.Services
{
    public class PusulaService : IPusulaService
    {
        private readonly AppDbContext _db;

        public PusulaService(AppDbContext db) => _db = db;

        // ---------- Categories ----------

        public async Task<IReadOnlyList<PusulaCategoryDto>> GetCategoriesAsync(int userId)
        {
            await EnsureDefaultCategoriesAsync(userId);
            return await _db.PusulaCategories.AsNoTracking()
                .Where(c => c.UserId == userId)
                .OrderBy(c => c.ParentId == null ? 0 : 1)
                .ThenBy(c => c.SortOrder)
                .ThenBy(c => c.Name)
                .Select(c => new PusulaCategoryDto(c.Id, c.Name, c.ParentId, c.SortOrder, c.IsActive))
                .ToListAsync();
        }

        public async Task<PusulaCategoryDto?> CreateCategoryAsync(int userId, CreatePusulaCategoryRequest request)
        {
            var name = request.Name?.Trim();
            if (string.IsNullOrEmpty(name)) return null;

            if (request.ParentId != null)
            {
                var parent = await _db.PusulaCategories
                    .FirstOrDefaultAsync(c => c.Id == request.ParentId && c.UserId == userId);
                // Two-level hierarchy only.
                if (parent == null || parent.ParentId != null) return null;
            }

            var maxSort = await _db.PusulaCategories
                .Where(c => c.UserId == userId && c.ParentId == request.ParentId)
                .MaxAsync(c => (int?)c.SortOrder) ?? 0;

            var category = new PusulaCategory
            {
                UserId = userId,
                Name = name,
                ParentId = request.ParentId,
                SortOrder = maxSort + 1,
                IsActive = true
            };
            _db.PusulaCategories.Add(category);
            await _db.SaveChangesAsync();
            return new PusulaCategoryDto(category.Id, category.Name, category.ParentId, category.SortOrder, category.IsActive);
        }

        public async Task<PusulaCategoryDto?> UpdateCategoryAsync(int userId, int id, UpdatePusulaCategoryRequest request)
        {
            var name = request.Name?.Trim();
            if (string.IsNullOrEmpty(name)) return null;

            var category = await _db.PusulaCategories.FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);
            if (category == null) return null;

            category.Name = name;
            await _db.SaveChangesAsync();
            return new PusulaCategoryDto(category.Id, category.Name, category.ParentId, category.SortOrder, category.IsActive);
        }

        public async Task<bool> DeleteCategoryAsync(int userId, int id)
        {
            var category = await _db.PusulaCategories
                .Include(c => c.Children)
                .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);
            if (category == null) return false;

            var childIds = category.Children.Select(c => c.Id).ToList();
            var idsToCheck = new List<int>(childIds) { id };
            var inUse = await _db.PusulaTasks.AnyAsync(t => t.CategoryId != null && idsToCheck.Contains(t.CategoryId.Value));

            if (inUse || childIds.Count > 0)
            {
                category.IsActive = false;
                foreach (var child in category.Children) child.IsActive = false;
            }
            else
            {
                _db.PusulaCategories.Remove(category);
            }

            await _db.SaveChangesAsync();
            return true;
        }

        private async Task EnsureDefaultCategoriesAsync(int userId)
        {
            if (await _db.PusulaCategories.AnyAsync(c => c.UserId == userId)) return;

            var work = new PusulaCategory { UserId = userId, Name = "İş", SortOrder = 1 };
            var personal = new PusulaCategory { UserId = userId, Name = "Kişisel", SortOrder = 2 };
            _db.PusulaCategories.AddRange(work, personal);
            await _db.SaveChangesAsync();

            _db.PusulaCategories.AddRange(
                new PusulaCategory { UserId = userId, Name = "Fiziksel Sağlık", ParentId = personal.Id, SortOrder = 1 },
                new PusulaCategory { UserId = userId, Name = "Zihinsel Sağlık", ParentId = personal.Id, SortOrder = 2 },
                new PusulaCategory { UserId = userId, Name = "Eğlence", ParentId = personal.Id, SortOrder = 3 });
            await _db.SaveChangesAsync();
        }

        // ---------- Tasks ----------

        public async Task<IReadOnlyList<PusulaDayDto>> GetDaysAsync(int userId, DateOnly from, DateOnly to)
        {
            await EnsureDefaultCategoriesAsync(userId);
            if (to < from) (from, to) = (to, from);

            var tasks = await LoadTasksForRangeAsync(userId, from, to);

            var days = new List<PusulaDayDto>();
            for (var d = from; d <= to; d = d.AddDays(1))
                days.Add(BuildDay(d, tasks));
            return days;
        }

        public async Task<PusulaTaskDto?> CreateTaskAsync(int userId, CreatePusulaTaskRequest request)
        {
            var title = request.Title?.Trim();
            if (string.IsNullOrEmpty(title)) return null;

            if (request.CategoryId != null &&
                !await _db.PusulaCategories.AnyAsync(c => c.Id == request.CategoryId && c.UserId == userId))
                return null;

            var date = request.Date ?? AppTime.Today;
            var recurrence = RecurrenceFromString(request.Recurrence);
            var maxSort = await _db.PusulaTasks
                .Where(t => t.UserId == userId)
                .MaxAsync(t => (int?)t.SortOrder) ?? 0;
            var task = new PusulaTask
            {
                UserId = userId,
                CategoryId = request.CategoryId,
                Title = title,
                Note = NullIfEmpty(request.Note),
                Date = date,
                // Recurring tasks are unscheduled list items (no time block).
                TimeOfDay = recurrence == PusulaTask.RecurrenceNone ? ParseTime(request.TimeOfDay) : null,
                EstimatedMinutes = Positive(request.EstimatedMinutes),
                ActualMinutes = Positive(request.ActualMinutes),
                Priority = ClampPriority(request.Priority),
                ManualScore = Positive(request.ManualScore),
                Recurrence = recurrence,
                RecurrenceDay = recurrence == PusulaTask.RecurrenceWeekly
                    ? (request.RecurrenceDay is >= 0 and <= 6 ? request.RecurrenceDay : (int)date.DayOfWeek)
                    : null,
                WorkType = WorkTypeFromString(request.WorkType),
                Status = PusulaTask.StatusPending,
                CreatedAt = DateTime.UtcNow,
                SortOrder = maxSort + 1
            };

            var stepTitles = (request.Steps ?? new List<string>())
                .Select(s => s?.Trim())
                .Where(s => !string.IsNullOrEmpty(s))
                .ToList();
            for (var i = 0; i < stepTitles.Count; i++)
                task.Steps.Add(new PusulaTaskStep { Title = stepTitles[i]!, SortOrder = i + 1 });

            _db.PusulaTasks.Add(task);
            await _db.SaveChangesAsync();
            return await GetTaskDtoAsync(userId, task.Id, task.Date);
        }

        public async Task<PusulaTaskDto?> UpdateTaskAsync(int userId, int id, UpdatePusulaTaskRequest request)
        {
            var title = request.Title?.Trim();
            if (string.IsNullOrEmpty(title)) return null;

            var task = await _db.PusulaTasks.FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);
            if (task == null) return null;

            if (request.CategoryId != null &&
                !await _db.PusulaCategories.AnyAsync(c => c.Id == request.CategoryId && c.UserId == userId))
                return null;

            var recurrence = RecurrenceFromString(request.Recurrence);
            task.Title = title;
            task.Note = NullIfEmpty(request.Note);
            task.CategoryId = request.CategoryId;
            task.Date = request.Date;
            task.TimeOfDay = recurrence == PusulaTask.RecurrenceNone ? ParseTime(request.TimeOfDay) : null;
            task.EstimatedMinutes = Positive(request.EstimatedMinutes);
            task.ActualMinutes = Positive(request.ActualMinutes);
            task.Priority = ClampPriority(request.Priority);
            task.ManualScore = Positive(request.ManualScore);
            task.Recurrence = recurrence;
            task.RecurrenceDay = recurrence == PusulaTask.RecurrenceWeekly
                ? (request.RecurrenceDay is >= 0 and <= 6 ? request.RecurrenceDay : (int)request.Date.DayOfWeek)
                : null;
            task.WorkType = WorkTypeFromString(request.WorkType);

            await _db.SaveChangesAsync();
            return await GetTaskDtoAsync(userId, task.Id, task.Date);
        }

        public async Task<bool> DeleteTaskAsync(int userId, int id)
        {
            var task = await _db.PusulaTasks.FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);
            if (task == null) return false;
            _db.PusulaTasks.Remove(task);
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<PusulaTaskDto?> SetTaskStatusAsync(int userId, int id, PusulaTaskStatusRequest request)
        {
            var task = await _db.PusulaTasks.FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);
            if (task == null) return null;

            var completed = string.Equals(request.Status, "completed", StringComparison.OrdinalIgnoreCase);
            var changeStatus = !string.IsNullOrEmpty(request.Status);

            if (task.Recurrence == PusulaTask.RecurrenceNone)
            {
                if (changeStatus)
                {
                    task.Status = completed ? PusulaTask.StatusCompleted : PusulaTask.StatusPending;
                    task.CompletedAt = completed ? DateTime.UtcNow : null;
                }
                if (request.ActualMinutes is > 0)
                    task.ActualMinutes = request.ActualMinutes;
            }
            else
            {
                var occurrence = await _db.PusulaOccurrences
                    .FirstOrDefaultAsync(o => o.TaskId == task.Id && o.Date == request.Date);
                if (occurrence == null)
                {
                    occurrence = new PusulaOccurrence { TaskId = task.Id, Date = request.Date };
                    _db.PusulaOccurrences.Add(occurrence);
                }
                if (changeStatus)
                {
                    occurrence.Status = completed ? PusulaTask.StatusCompleted : PusulaTask.StatusPending;
                    occurrence.CompletedAt = completed ? DateTime.UtcNow : null;
                }
                if (request.ActualMinutes is > 0)
                    occurrence.ActualMinutes = request.ActualMinutes;
            }

            await _db.SaveChangesAsync();
            return await GetTaskDtoAsync(userId, task.Id, request.Date);
        }

        public async Task<PusulaTaskDto?> ScheduleTaskAsync(int userId, int id, PusulaScheduleRequest request)
        {
            var task = await _db.PusulaTasks.FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);
            if (task == null || task.Recurrence != PusulaTask.RecurrenceNone) return null;

            if (request.Date != null) task.Date = request.Date.Value;
            task.TimeOfDay = ParseTime(request.TimeOfDay);

            await _db.SaveChangesAsync();
            return await GetTaskDtoAsync(userId, task.Id, task.Date);
        }

        public async Task<bool> ReorderTasksAsync(int userId, PusulaReorderRequest request)
        {
            if (request.TaskIds == null || request.TaskIds.Count == 0) return false;

            var tasks = await _db.PusulaTasks
                .Where(t => t.UserId == userId && request.TaskIds.Contains(t.Id))
                .ToListAsync();
            if (tasks.Count == 0) return false;

            var order = 1;
            foreach (var id in request.TaskIds)
            {
                var task = tasks.FirstOrDefault(t => t.Id == id);
                if (task == null) continue;
                task.SortOrder = order++;
            }

            await _db.SaveChangesAsync();
            return true;
        }

        // ---------- Steps ----------

        public async Task<PusulaTaskDto?> AddStepAsync(int userId, int taskId, CreatePusulaStepRequest request, DateOnly date)
        {
            var title = request.Title?.Trim();
            if (string.IsNullOrEmpty(title)) return null;

            var task = await _db.PusulaTasks.Include(t => t.Steps)
                .FirstOrDefaultAsync(t => t.Id == taskId && t.UserId == userId);
            if (task == null) return null;

            var maxSort = task.Steps.Count > 0 ? task.Steps.Max(s => s.SortOrder) : 0;
            task.Steps.Add(new PusulaTaskStep { Title = title, SortOrder = maxSort + 1 });
            await _db.SaveChangesAsync();
            return await GetTaskDtoAsync(userId, taskId, date);
        }

        public async Task<PusulaTaskDto?> DeleteStepAsync(int userId, int stepId, DateOnly date)
        {
            var step = await _db.PusulaTaskSteps
                .Include(s => s.Task)
                .FirstOrDefaultAsync(s => s.Id == stepId && s.Task.UserId == userId);
            if (step == null) return null;

            var taskId = step.TaskId;
            _db.PusulaTaskSteps.Remove(step);
            await _db.SaveChangesAsync();
            return await GetTaskDtoAsync(userId, taskId, date);
        }

        public async Task<PusulaTaskDto?> ToggleStepAsync(int userId, int stepId, PusulaStepToggleRequest request)
        {
            var step = await _db.PusulaTaskSteps
                .Include(s => s.Task)
                .FirstOrDefaultAsync(s => s.Id == stepId && s.Task.UserId == userId);
            if (step == null) return null;

            var check = await _db.PusulaStepChecks
                .FirstOrDefaultAsync(c => c.StepId == stepId && c.Date == request.Date);
            if (check == null)
                _db.PusulaStepChecks.Add(new PusulaStepCheck { StepId = stepId, Date = request.Date });
            else
                _db.PusulaStepChecks.Remove(check);

            await _db.SaveChangesAsync();
            return await GetTaskDtoAsync(userId, step.TaskId, request.Date);
        }

        // ---------- Day review ----------

        public async Task<PusulaDayReviewDto> GetDayReviewAsync(int userId, DateOnly date)
        {
            var review = await _db.PusulaDayReviews.AsNoTracking()
                .FirstOrDefaultAsync(r => r.UserId == userId && r.Date == date);
            return review == null
                ? new PusulaDayReviewDto(date, null, null, null, null)
                : new PusulaDayReviewDto(review.Date, review.StartVision, review.EndReflection, review.FeelingScore, review.UpdatedAt);
        }

        public async Task<PusulaDayReviewDto> UpsertDayReviewAsync(int userId, UpsertPusulaDayReviewRequest request)
        {
            var review = await _db.PusulaDayReviews
                .FirstOrDefaultAsync(r => r.UserId == userId && r.Date == request.Date);
            if (review == null)
            {
                review = new PusulaDayReview { UserId = userId, Date = request.Date };
                _db.PusulaDayReviews.Add(review);
            }

            if (string.Equals(request.Mode, "end", StringComparison.OrdinalIgnoreCase))
            {
                review.EndReflection = NullIfEmpty(request.EndReflection);
                review.FeelingScore = request.FeelingScore is >= 1 and <= 5 ? request.FeelingScore : null;
            }
            else
            {
                review.StartVision = NullIfEmpty(request.StartVision);
            }

            review.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return new PusulaDayReviewDto(review.Date, review.StartVision, review.EndReflection, review.FeelingScore, review.UpdatedAt);
        }

        // ---------- Reports ----------

        public async Task<PusulaTrendDto> GetTrendAsync(int userId, string period, string? bucket)
        {
            var today = AppTime.Today;
            var (rangeStart, normalizedPeriod, allowedBuckets) = ChartBuckets.ResolvePeriod(period, today);
            var normalizedBucket = ChartBuckets.NormalizeBucket(bucket, allowedBuckets);
            var bucketDefs = ChartBuckets.Build(rangeStart, today, normalizedPeriod, normalizedBucket);

            var tasks = await LoadTasksForRangeAsync(userId, rangeStart, today);
            var dayByDate = new Dictionary<DateOnly, PusulaDayDto>();
            for (var d = rangeStart; d <= today; d = d.AddDays(1))
                dayByDate[d] = BuildDay(d, tasks);

            var buckets = bucketDefs.Select(b =>
            {
                var days = dayByDate
                    .Where(kv => kv.Key >= b.Start && kv.Key <= b.End)
                    .Select(kv => kv.Value)
                    .ToList();
                var planned = days.Sum(x => x.PlannedPoints);
                var earned = days.Sum(x => x.EarnedPoints);
                var total = days.Sum(x => x.TotalTasks);
                var completed = days.Sum(x => x.CompletedTasks);
                return new PusulaTrendBucketDto(
                    b.Key,
                    b.Label,
                    planned,
                    Math.Round(earned, 1),
                    planned > 0 ? Math.Round(earned * 100.0 / planned, 1) : 0,
                    total,
                    completed,
                    total > 0 ? Math.Round(completed * 100.0 / total, 1) : 0);
            }).ToList();

            return new PusulaTrendDto(normalizedPeriod, normalizedBucket, allowedBuckets, buckets);
        }

        public async Task<IReadOnlyList<PusulaCategorySliceDto>> GetCategoryDistributionAsync(int userId, DateOnly from, DateOnly to)
        {
            if (to < from) (from, to) = (to, from);
            var tasks = await LoadTasksForRangeAsync(userId, from, to);

            var pointsByCategory = new Dictionary<string, double>();
            for (var d = from; d <= to; d = d.AddDays(1))
            {
                foreach (var task in tasks.Where(t => OccursOn(t, d)))
                {
                    var earned = EarnedPoints(task, d);
                    if (earned <= 0) continue;
                    var name = task.Category?.Name ?? "Diğer";
                    pointsByCategory[name] = pointsByCategory.GetValueOrDefault(name) + earned;
                }
            }

            var totalPoints = pointsByCategory.Values.Sum();
            return pointsByCategory
                .OrderByDescending(kv => kv.Value)
                .Select(kv => new PusulaCategorySliceDto(
                    kv.Key,
                    Math.Round(kv.Value, 1),
                    totalPoints > 0 ? Math.Round(kv.Value * 100.0 / totalPoints, 1) : 0))
                .ToList();
        }

        // ---------- Internal computation ----------

        private async Task<List<PusulaTask>> LoadTasksForRangeAsync(int userId, DateOnly from, DateOnly to)
        {
            return await _db.PusulaTasks.AsNoTracking()
                .Where(t => t.UserId == userId
                    && t.Date <= to
                    && (t.Recurrence != PusulaTask.RecurrenceNone || t.Date >= from))
                .Include(t => t.Category).ThenInclude(c => c!.Parent)
                .Include(t => t.Steps.OrderBy(s => s.SortOrder))
                    .ThenInclude(s => s.Checks.Where(c => c.Date >= from && c.Date <= to))
                .Include(t => t.Occurrences.Where(o => o.Date >= from && o.Date <= to))
                .ToListAsync();
        }

        private static PusulaDayDto BuildDay(DateOnly date, List<PusulaTask> tasks)
        {
            var dayTasks = tasks
                .Where(t => OccursOn(t, date))
                .Select(t => MapTask(t, date))
                .OrderBy(t => t.Status == "completed" ? 1 : 0)
                .ThenBy(t => t.SortOrder)
                .ThenBy(t => t.TimeOfDay == null ? 1 : 0)
                .ThenBy(t => t.TimeOfDay)
                .ThenBy(t => t.Priority)
                .ToList();

            var planned = dayTasks.Sum(t => t.Score);
            var earned = dayTasks.Sum(t => t.EarnedPoints);
            return new PusulaDayDto(
                date,
                dayTasks.Count,
                dayTasks.Count(t => t.Status == "completed"),
                planned,
                Math.Round(earned, 1),
                planned > 0 ? Math.Round(earned * 100.0 / planned, 1) : 0,
                dayTasks);
        }

        private static bool OccursOn(PusulaTask task, DateOnly date) => task.Recurrence switch
        {
            PusulaTask.RecurrenceDaily => task.Date <= date,
            PusulaTask.RecurrenceWeekly => task.Date <= date && task.RecurrenceDay == (int)date.DayOfWeek,
            _ => task.Date == date
        };

        private static PusulaTaskDto MapTask(PusulaTask task, DateOnly date)
        {
            var today = AppTime.Today;
            var occurrence = task.Recurrence != PusulaTask.RecurrenceNone
                ? task.Occurrences.FirstOrDefault(o => o.Date == date)
                : null;

            var storedStatus = task.Recurrence == PusulaTask.RecurrenceNone
                ? task.Status
                : occurrence?.Status ?? PusulaTask.StatusPending;
            var status = storedStatus == PusulaTask.StatusCompleted
                ? "completed"
                : date < today ? "notdone" : "pending";

            var actualMinutes = task.Recurrence == PusulaTask.RecurrenceNone
                ? task.ActualMinutes
                : occurrence?.ActualMinutes;

            var autoScore = AutoScore(task.Priority, task.EstimatedMinutes);
            var score = task.ManualScore ?? autoScore;

            var steps = task.Steps
                .OrderBy(s => s.SortOrder)
                .Select(s => new PusulaStepDto(s.Id, s.Title, s.SortOrder, s.Checks.Any(c => c.Date == date)))
                .ToList();

            double earned = 0;
            if (status == "completed")
                earned = score;
            else if (steps.Count > 0)
                earned = score * (double)steps.Count(s => s.IsChecked) / steps.Count;

            return new PusulaTaskDto(
                task.Id,
                task.Title,
                task.Note,
                task.CategoryId,
                task.Category?.Name,
                task.Category?.Parent?.Name ?? task.Category?.Name,
                date,
                task.TimeOfDay?.ToString("HH:mm"),
                task.EstimatedMinutes,
                actualMinutes,
                task.Priority,
                WorkTypeToString(task.WorkType),
                RecurrenceToString(task.Recurrence),
                task.RecurrenceDay,
                autoScore,
                task.ManualScore,
                score,
                status,
                Math.Round(earned, 1),
                task.SortOrder,
                steps);
        }

        private static double EarnedPoints(PusulaTask task, DateOnly date) => MapTask(task, date).EarnedPoints;

        private async Task<PusulaTaskDto?> GetTaskDtoAsync(int userId, int taskId, DateOnly date)
        {
            var task = await _db.PusulaTasks.AsNoTracking()
                .Where(t => t.Id == taskId && t.UserId == userId)
                .Include(t => t.Category).ThenInclude(c => c!.Parent)
                .Include(t => t.Steps.OrderBy(s => s.SortOrder))
                    .ThenInclude(s => s.Checks.Where(c => c.Date == date))
                .Include(t => t.Occurrences.Where(o => o.Date == date))
                .FirstOrDefaultAsync();
            return task == null ? null : MapTask(task, date);
        }

        /// <summary>Priority coefficient (P1=3, P2=2, P3=1) x estimated 15-minute units (min 1).</summary>
        public static int AutoScore(int priority, int? estimatedMinutes)
        {
            var coeff = priority switch { 1 => 3, 2 => 2, _ => 1 };
            var units = estimatedMinutes is > 0
                ? Math.Max(1, (int)Math.Round(estimatedMinutes.Value / 15.0))
                : 1;
            return coeff * units;
        }

        // ---------- Small helpers ----------

        private static string? NullIfEmpty(string? value) =>
            string.IsNullOrWhiteSpace(value) ? null : value.Trim();

        private static int? Positive(int? value) => value is > 0 ? value : null;

        private static int ClampPriority(int? priority) =>
            priority is >= 1 and <= 3 ? priority.Value : 3;

        private static TimeOnly? ParseTime(string? value) =>
            TimeOnly.TryParseExact(value, "HH:mm", CultureInfo.InvariantCulture, DateTimeStyles.None, out var t)
                ? t
                : null;

        private static string WorkTypeToString(int value) => value switch
        {
            PusulaTask.WorkTypeDeep => "deep",
            PusulaTask.WorkTypeShallow => "shallow",
            _ => "none"
        };

        private static int WorkTypeFromString(string? value) => value?.ToLowerInvariant() switch
        {
            "deep" => PusulaTask.WorkTypeDeep,
            "shallow" => PusulaTask.WorkTypeShallow,
            _ => PusulaTask.WorkTypeNone
        };

        private static string RecurrenceToString(int value) => value switch
        {
            PusulaTask.RecurrenceDaily => "daily",
            PusulaTask.RecurrenceWeekly => "weekly",
            _ => "none"
        };

        private static int RecurrenceFromString(string? value) => value?.ToLowerInvariant() switch
        {
            "daily" => PusulaTask.RecurrenceDaily,
            "weekly" => PusulaTask.RecurrenceWeekly,
            _ => PusulaTask.RecurrenceNone
        };
    }
}
