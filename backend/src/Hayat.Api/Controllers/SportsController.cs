using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Hayat.Application.Interfaces;

namespace Hayat.Api.Controllers
{
    [Authorize]
    [Route("api/sports")]
    public class SportsController : BaseApiController
    {
        private readonly IStravaSyncService _sync;

        public SportsController(IStravaSyncService sync) => _sync = sync;

        [HttpPost("sync-strava")]
        public async Task<IActionResult> SyncStrava()
        {
            var userId = GetUserId();
            if (userId == null) return UnauthorizedUser();

            try
            {
                var result = await _sync.SyncUserActivitiesAsync(userId.Value);
                return Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
