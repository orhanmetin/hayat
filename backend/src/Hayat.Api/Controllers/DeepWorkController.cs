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
    public class DeepWorkController : BaseApiController
    {
        private readonly IDeepWorkService _service;

        public DeepWorkController(IDeepWorkService service) => _service = service;

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] DateOnly? from, [FromQuery] DateOnly? to, [FromQuery] int? typeId)
        {
            var userId = GetUserId();
            if (userId == null) return UnauthorizedUser();
            return Ok(await _service.GetSessionsAsync(userId.Value, from, to, typeId));
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateDeepWorkRequest request)
        {
            var userId = GetUserId();
            if (userId == null) return UnauthorizedUser();
            var result = await _service.CreateSessionAsync(userId.Value, request);
            return result == null ? BadRequest() : Ok(result);
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateDeepWorkRequest request)
        {
            var userId = GetUserId();
            if (userId == null) return UnauthorizedUser();
            var result = await _service.UpdateSessionAsync(userId.Value, id, request);
            return result == null ? BadRequest() : Ok(result);
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var userId = GetUserId();
            if (userId == null) return UnauthorizedUser();
            return await _service.DeleteSessionAsync(userId.Value, id) ? NoContent() : NotFound();
        }
    }
}
