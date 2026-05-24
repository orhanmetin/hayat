using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Hayat.Application.DTOs;
using Hayat.Application.Interfaces;

namespace Hayat.Api.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    public class HabitsController : BaseApiController
    {
        private readonly IHabitService _service;

        public HabitsController(IHabitService service) => _service = service;

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var userId = GetUserId();
            if (userId == null) return UnauthorizedUser();
            return Ok(await _service.GetHabitsAsync(userId.Value));
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateHabitRequest request)
        {
            var userId = GetUserId();
            if (userId == null) return UnauthorizedUser();
            var result = await _service.CreateHabitAsync(userId.Value, request);
            return result == null ? BadRequest(new { message = "Alışkanlık adı zorunludur." }) : Ok(result);
        }

        [HttpPost("{id:int}/toggle")]
        public async Task<IActionResult> Toggle(int id)
        {
            var userId = GetUserId();
            if (userId == null) return UnauthorizedUser();
            var result = await _service.ToggleTodayAsync(userId.Value, id);
            return result == null ? NotFound() : Ok(result);
        }

        [HttpPut("{id:int}/check-in")]
        public async Task<IActionResult> SetCheckIn(int id, [FromBody] SetHabitCheckInRequest request)
        {
            var userId = GetUserId();
            if (userId == null) return UnauthorizedUser();
            var result = await _service.SetCheckInAsync(userId.Value, id, request);
            return result == null ? NotFound() : Ok(result);
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var userId = GetUserId();
            if (userId == null) return UnauthorizedUser();
            return await _service.DeleteHabitAsync(userId.Value, id) ? NoContent() : NotFound();
        }
    }
}
