using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Hayat.Application.Interfaces;

namespace Hayat.Api.Controllers
{
    [Authorize]
    [Route("api/active-timer")]
    public class ActiveTimerController : BaseApiController
    {
        private readonly IActiveTimerService _service;

        public ActiveTimerController(IActiveTimerService service) => _service = service;

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var userId = GetUserId();
            if (userId == null) return UnauthorizedUser();
            return Ok(await _service.GetAsync(userId.Value));
        }

        [HttpPost("start")]
        public async Task<IActionResult> Start()
        {
            var userId = GetUserId();
            if (userId == null) return UnauthorizedUser();
            return Ok(await _service.StartAsync(userId.Value));
        }

        [HttpDelete]
        public async Task<IActionResult> Clear()
        {
            var userId = GetUserId();
            if (userId == null) return UnauthorizedUser();
            await _service.ClearAsync(userId.Value);
            return NoContent();
        }
    }
}
