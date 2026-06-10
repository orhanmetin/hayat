using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Hayat.Application.DTOs;
using Hayat.Application.Interfaces;

namespace Hayat.Api.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    public class ManagementController : BaseApiController
    {
        private readonly IManagementService _service;

        public ManagementController(IManagementService service) => _service = service;

        [HttpGet("sport-types")]
        public async Task<IActionResult> GetSportTypes() => Ok(await _service.GetSportTypesAsync());

        [HttpPost("sport-types")]
        public async Task<IActionResult> CreateSportType([FromBody] CreateLookupTypeRequest request)
        {
            var result = await _service.CreateSportTypeAsync(request);
            return result == null ? BadRequest() : Ok(result);
        }

        [HttpPut("sport-types/{id:int}")]
        public async Task<IActionResult> UpdateSportType(int id, [FromBody] UpdateLookupTypeRequest request)
        {
            var result = await _service.UpdateSportTypeAsync(id, request);
            return result == null ? NotFound() : Ok(result);
        }

        [HttpDelete("sport-types/{id:int}")]
        public async Task<IActionResult> DeleteSportType(int id) =>
            await _service.DeleteSportTypeAsync(id) ? NoContent() : NotFound();

        [HttpGet("deep-work-types")]
        public async Task<IActionResult> GetDeepWorkTypes() => Ok(await _service.GetDeepWorkTypesAsync());

        [HttpPost("deep-work-types")]
        public async Task<IActionResult> CreateDeepWorkType([FromBody] CreateLookupTypeRequest request)
        {
            var result = await _service.CreateDeepWorkTypeAsync(request);
            return result == null ? BadRequest() : Ok(result);
        }

        [HttpPut("deep-work-types/{id:int}")]
        public async Task<IActionResult> UpdateDeepWorkType(int id, [FromBody] UpdateLookupTypeRequest request)
        {
            var result = await _service.UpdateDeepWorkTypeAsync(id, request);
            return result == null ? NotFound() : Ok(result);
        }

        [HttpDelete("deep-work-types/{id:int}")]
        public async Task<IActionResult> DeleteDeepWorkType(int id) =>
            await _service.DeleteDeepWorkTypeAsync(id) ? NoContent() : NotFound();

        [HttpGet("meditation-types")]
        public async Task<IActionResult> GetMeditationTypes() => Ok(await _service.GetMeditationTypesAsync());

        [HttpPost("meditation-types")]
        public async Task<IActionResult> CreateMeditationType([FromBody] CreateLookupTypeRequest request)
        {
            var result = await _service.CreateMeditationTypeAsync(request);
            return result == null ? BadRequest() : Ok(result);
        }

        [HttpPut("meditation-types/{id:int}")]
        public async Task<IActionResult> UpdateMeditationType(int id, [FromBody] UpdateLookupTypeRequest request)
        {
            var result = await _service.UpdateMeditationTypeAsync(id, request);
            return result == null ? NotFound() : Ok(result);
        }

        [HttpDelete("meditation-types/{id:int}")]
        public async Task<IActionResult> DeleteMeditationType(int id) =>
            await _service.DeleteMeditationTypeAsync(id) ? NoContent() : NotFound();
    }
}
