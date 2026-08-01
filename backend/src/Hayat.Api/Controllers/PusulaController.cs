using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Hayat.Application.Common;
using Hayat.Application.DTOs;
using Hayat.Application.Interfaces;

namespace Hayat.Api.Controllers
{
    [Authorize]
    [Route("api/pusula")]
    public class PusulaController : BaseApiController
    {
        private readonly IPusulaService _service;

        public PusulaController(IPusulaService service) => _service = service;

        // ---- Categories ----

        [HttpGet("categories")]
        public async Task<IActionResult> GetCategories()
        {
            var userId = GetUserId();
            if (userId == null) return UnauthorizedUser();
            return Ok(await _service.GetCategoriesAsync(userId.Value));
        }

        [HttpPost("categories")]
        public async Task<IActionResult> CreateCategory([FromBody] CreatePusulaCategoryRequest request)
        {
            var userId = GetUserId();
            if (userId == null) return UnauthorizedUser();
            var result = await _service.CreateCategoryAsync(userId.Value, request);
            return result == null ? BadRequest(new { message = "Geçersiz kategori." }) : Ok(result);
        }

        [HttpPut("categories/{id:int}")]
        public async Task<IActionResult> UpdateCategory(int id, [FromBody] UpdatePusulaCategoryRequest request)
        {
            var userId = GetUserId();
            if (userId == null) return UnauthorizedUser();
            var result = await _service.UpdateCategoryAsync(userId.Value, id, request);
            return result == null ? NotFound() : Ok(result);
        }

        [HttpDelete("categories/{id:int}")]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            var userId = GetUserId();
            if (userId == null) return UnauthorizedUser();
            return await _service.DeleteCategoryAsync(userId.Value, id) ? NoContent() : NotFound();
        }

        // ---- Days & tasks ----

        [HttpGet("days")]
        public async Task<IActionResult> GetDays([FromQuery] DateOnly? from, [FromQuery] DateOnly? to)
        {
            var userId = GetUserId();
            if (userId == null) return UnauthorizedUser();
            var start = from ?? AppTime.Today;
            var end = to ?? start;
            return Ok(await _service.GetDaysAsync(userId.Value, start, end));
        }

        [HttpGet("tasks/undated")]
        public async Task<IActionResult> GetUndatedTasks()
        {
            var userId = GetUserId();
            if (userId == null) return UnauthorizedUser();
            return Ok(await _service.GetUndatedTasksAsync(userId.Value));
        }

        [HttpPost("tasks")]
        public async Task<IActionResult> CreateTask([FromBody] CreatePusulaTaskRequest request)
        {
            var userId = GetUserId();
            if (userId == null) return UnauthorizedUser();
            var result = await _service.CreateTaskAsync(userId.Value, request);
            return result == null ? BadRequest(new { message = "Geçersiz görev." }) : Ok(result);
        }

        [HttpPut("tasks/{id:int}")]
        public async Task<IActionResult> UpdateTask(int id, [FromBody] UpdatePusulaTaskRequest request)
        {
            var userId = GetUserId();
            if (userId == null) return UnauthorizedUser();
            var result = await _service.UpdateTaskAsync(userId.Value, id, request);
            return result == null ? NotFound() : Ok(result);
        }

        [HttpDelete("tasks/{id:int}")]
        public async Task<IActionResult> DeleteTask(int id)
        {
            var userId = GetUserId();
            if (userId == null) return UnauthorizedUser();
            return await _service.DeleteTaskAsync(userId.Value, id) ? NoContent() : NotFound();
        }

        [HttpPost("tasks/{id:int}/status")]
        public async Task<IActionResult> SetStatus(int id, [FromBody] PusulaTaskStatusRequest request)
        {
            var userId = GetUserId();
            if (userId == null) return UnauthorizedUser();
            var result = await _service.SetTaskStatusAsync(userId.Value, id, request);
            return result == null ? NotFound() : Ok(result);
        }

        [HttpPut("tasks/{id:int}/schedule")]
        public async Task<IActionResult> Schedule(int id, [FromBody] PusulaScheduleRequest request)
        {
            var userId = GetUserId();
            if (userId == null) return UnauthorizedUser();
            var result = await _service.ScheduleTaskAsync(userId.Value, id, request);
            return result == null ? NotFound() : Ok(result);
        }

        [HttpPost("tasks/reorder")]
        public async Task<IActionResult> Reorder([FromBody] PusulaReorderRequest request)
        {
            var userId = GetUserId();
            if (userId == null) return UnauthorizedUser();
            return await _service.ReorderTasksAsync(userId.Value, request)
                ? NoContent()
                : BadRequest(new { message = "Sıralama güncellenemedi." });
        }

        // ---- Steps ----

        [HttpPost("tasks/{id:int}/steps")]
        public async Task<IActionResult> AddStep(int id, [FromBody] CreatePusulaStepRequest request, [FromQuery] DateOnly? date)
        {
            var userId = GetUserId();
            if (userId == null) return UnauthorizedUser();
            var result = await _service.AddStepAsync(userId.Value, id, request, date);
            return result == null ? NotFound() : Ok(result);
        }

        [HttpDelete("steps/{id:int}")]
        public async Task<IActionResult> DeleteStep(int id, [FromQuery] DateOnly? date)
        {
            var userId = GetUserId();
            if (userId == null) return UnauthorizedUser();
            var result = await _service.DeleteStepAsync(userId.Value, id, date);
            return result == null ? NotFound() : Ok(result);
        }

        [HttpPost("steps/{id:int}/toggle")]
        public async Task<IActionResult> ToggleStep(int id, [FromBody] PusulaStepToggleRequest request)
        {
            var userId = GetUserId();
            if (userId == null) return UnauthorizedUser();
            var result = await _service.ToggleStepAsync(userId.Value, id, request);
            return result == null ? NotFound() : Ok(result);
        }

        // ---- Day review ----

        [HttpGet("day-review")]
        public async Task<IActionResult> GetDayReview([FromQuery] DateOnly? date)
        {
            var userId = GetUserId();
            if (userId == null) return UnauthorizedUser();
            return Ok(await _service.GetDayReviewAsync(userId.Value, date ?? AppTime.Today));
        }

        [HttpPut("day-review")]
        public async Task<IActionResult> UpsertDayReview([FromBody] UpsertPusulaDayReviewRequest request)
        {
            var userId = GetUserId();
            if (userId == null) return UnauthorizedUser();
            return Ok(await _service.UpsertDayReviewAsync(userId.Value, request));
        }

        // ---- Reports ----

        [HttpGet("reports/trend")]
        public async Task<IActionResult> GetTrend([FromQuery] string period = "weekly", [FromQuery] string? bucket = null)
        {
            var userId = GetUserId();
            if (userId == null) return UnauthorizedUser();
            return Ok(await _service.GetTrendAsync(userId.Value, period, bucket));
        }

        [HttpGet("reports/categories")]
        public async Task<IActionResult> GetCategoryDistribution([FromQuery] DateOnly from, [FromQuery] DateOnly to)
        {
            var userId = GetUserId();
            if (userId == null) return UnauthorizedUser();
            return Ok(await _service.GetCategoryDistributionAsync(userId.Value, from, to));
        }
    }
}
