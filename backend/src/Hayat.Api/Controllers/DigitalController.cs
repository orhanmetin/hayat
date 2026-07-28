using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Hayat.Application.Common;
using Hayat.Application.DTOs;
using Hayat.Application.Interfaces;

namespace Hayat.Api.Controllers
{
    /// <summary>JWT-authenticated digital wellbeing (steps + screen time) APIs for the web UI.</summary>
    [Authorize]
    [Route("api/digital")]
    public class DigitalController : BaseApiController
    {
        private readonly IDigitalService _service;

        public DigitalController(IDigitalService service) => _service = service;

        [HttpGet("overview")]
        public async Task<IActionResult> GetOverview([FromQuery] DateOnly? from, [FromQuery] DateOnly? to)
        {
            var userId = GetUserId();
            if (userId == null) return UnauthorizedUser();
            var end = to ?? AppTime.Today;
            var start = from ?? end.AddDays(-6);
            return Ok(await _service.GetOverviewAsync(userId.Value, start, end));
        }

        [HttpGet("steps")]
        public async Task<IActionResult> GetSteps([FromQuery] DateOnly? from, [FromQuery] DateOnly? to)
        {
            var userId = GetUserId();
            if (userId == null) return UnauthorizedUser();
            var end = to ?? AppTime.Today;
            var start = from ?? end.AddDays(-6);
            return Ok(await _service.GetStepsAsync(userId.Value, start, end));
        }

        [HttpGet("screen-time")]
        public async Task<IActionResult> GetScreenTime([FromQuery] DateOnly? from, [FromQuery] DateOnly? to)
        {
            var userId = GetUserId();
            if (userId == null) return UnauthorizedUser();
            var end = to ?? AppTime.Today;
            var start = from ?? end.AddDays(-6);
            return Ok(await _service.GetScreenTimeAsync(userId.Value, start, end));
        }

        [HttpGet("shortcuts-token")]
        public async Task<IActionResult> GetTokenStatus()
        {
            var userId = GetUserId();
            if (userId == null) return UnauthorizedUser();
            return Ok(await _service.GetTokenStatusAsync(userId.Value));
        }

        [HttpPost("shortcuts-token")]
        public async Task<IActionResult> CreateOrRotateToken()
        {
            var userId = GetUserId();
            if (userId == null) return UnauthorizedUser();
            return Ok(await _service.CreateOrRotateTokenAsync(userId.Value));
        }

        [HttpDelete("shortcuts-token")]
        public async Task<IActionResult> RevokeToken()
        {
            var userId = GetUserId();
            if (userId == null) return UnauthorizedUser();
            await _service.RevokeTokenAsync(userId.Value);
            return NoContent();
        }
    }
}
