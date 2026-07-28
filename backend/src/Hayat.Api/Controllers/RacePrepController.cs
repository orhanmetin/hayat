using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Hayat.Application.Interfaces;

namespace Hayat.Api.Controllers
{
    [Authorize]
    [Route("api/race-prep")]
    public class RacePrepController : BaseApiController
    {
        private readonly IRacePrepService _service;

        public RacePrepController(IRacePrepService service) => _service = service;

        [HttpGet("overview")]
        public async Task<IActionResult> GetOverview()
        {
            var userId = GetUserId();
            if (userId == null) return UnauthorizedUser();
            return Ok(await _service.GetOverviewAsync(userId.Value));
        }

        [HttpGet("goals/{goalKey}/detail")]
        public async Task<IActionResult> GetGoalDetail(string goalKey)
        {
            var userId = GetUserId();
            if (userId == null) return UnauthorizedUser();
            var detail = await _service.GetGoalDetailAsync(userId.Value, goalKey);
            return detail == null ? NotFound() : Ok(detail);
        }

        [HttpPost("visualization/increment")]
        public async Task<IActionResult> IncrementVisualization()
        {
            var userId = GetUserId();
            if (userId == null) return UnauthorizedUser();
            return Ok(await _service.IncrementVisualizationAsync(userId.Value));
        }
    }
}
