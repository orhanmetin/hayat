using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Hayat.Application.DTOs;
using Hayat.Application.Interfaces;

namespace Hayat.Api.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    public class HealthController : BaseApiController
    {
        private readonly IHealthService _service;

        public HealthController(IHealthService service) => _service = service;

        [HttpGet("sleep")]
        public async Task<IActionResult> GetSleep([FromQuery] DateOnly? from, [FromQuery] DateOnly? to)
        {
            var userId = GetUserId();
            if (userId == null) return UnauthorizedUser();
            return Ok(await _service.GetSleepLogsAsync(userId.Value, from, to));
        }

        [HttpPost("sleep")]
        public async Task<IActionResult> CreateSleep([FromBody] CreateSleepLogRequest request)
        {
            var userId = GetUserId();
            if (userId == null) return UnauthorizedUser();
            var result = await _service.CreateSleepLogAsync(userId.Value, request);
            return result == null ? BadRequest(new { message = "Geçersiz uyku kaydı." }) : Ok(result);
        }

        [HttpDelete("sleep/{id:int}")]
        public async Task<IActionResult> DeleteSleep(int id)
        {
            var userId = GetUserId();
            if (userId == null) return UnauthorizedUser();
            return await _service.DeleteSleepLogAsync(userId.Value, id) ? NoContent() : NotFound();
        }

        [HttpGet("sport")]
        public async Task<IActionResult> GetSport([FromQuery] DateOnly? from, [FromQuery] DateOnly? to, [FromQuery] int? typeId)
        {
            var userId = GetUserId();
            if (userId == null) return UnauthorizedUser();
            return Ok(await _service.GetSportActivitiesAsync(userId.Value, from, to, typeId));
        }

        [HttpPost("sport")]
        public async Task<IActionResult> CreateSport([FromBody] CreateSportActivityRequest request)
        {
            var userId = GetUserId();
            if (userId == null) return UnauthorizedUser();
            var result = await _service.CreateSportActivityAsync(userId.Value, request);
            return result == null ? BadRequest() : Ok(result);
        }

        [HttpDelete("sport/{id:int}")]
        public async Task<IActionResult> DeleteSport(int id)
        {
            var userId = GetUserId();
            if (userId == null) return UnauthorizedUser();
            return await _service.DeleteSportActivityAsync(userId.Value, id) ? NoContent() : NotFound();
        }

        [HttpGet("meditation")]
        public async Task<IActionResult> GetMeditation([FromQuery] DateOnly? from, [FromQuery] DateOnly? to)
        {
            var userId = GetUserId();
            if (userId == null) return UnauthorizedUser();
            return Ok(await _service.GetMeditationsAsync(userId.Value, from, to));
        }

        [HttpPost("meditation")]
        public async Task<IActionResult> CreateMeditation([FromBody] CreateMeditationRequest request)
        {
            var userId = GetUserId();
            if (userId == null) return UnauthorizedUser();
            var result = await _service.CreateMeditationAsync(userId.Value, request);
            return result == null ? BadRequest() : Ok(result);
        }

        [HttpDelete("meditation/{id:int}")]
        public async Task<IActionResult> DeleteMeditation(int id)
        {
            var userId = GetUserId();
            if (userId == null) return UnauthorizedUser();
            return await _service.DeleteMeditationAsync(userId.Value, id) ? NoContent() : NotFound();
        }
    }
}
