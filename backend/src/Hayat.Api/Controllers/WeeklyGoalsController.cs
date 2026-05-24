using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Hayat.Application.DTOs;
using Hayat.Application.Interfaces;

namespace Hayat.Api.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    public class WeeklyGoalsController : BaseApiController
    {
        private readonly IWeeklyGoalService _service;

        public WeeklyGoalsController(IWeeklyGoalService service) => _service = service;

        [HttpGet("current-week")]
        public async Task<IActionResult> GetCurrentWeek() => Ok(await _service.GetCurrentWeekAsync());

        [HttpGet]
        public async Task<IActionResult> Get([FromQuery] int year, [FromQuery] int weekNumber)
        {
            var userId = GetUserId();
            if (userId == null) return UnauthorizedUser();
            var goal = await _service.GetGoalAsync(userId.Value, year, weekNumber);
            return goal == null ? NotFound() : Ok(goal);
        }

        [HttpPut]
        public async Task<IActionResult> Upsert([FromBody] UpsertWeeklyGoalRequest request)
        {
            var userId = GetUserId();
            if (userId == null) return UnauthorizedUser();
            return Ok(await _service.UpsertGoalAsync(userId.Value, request));
        }
    }
}
