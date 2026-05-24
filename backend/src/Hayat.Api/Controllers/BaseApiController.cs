using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

namespace Hayat.Api.Controllers
{
    public abstract class BaseApiController : ControllerBase
    {
        protected int? GetUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(claim, out var userId) ? userId : null;
        }

        protected IActionResult UnauthorizedUser() => Unauthorized(new { message = "Oturum geçersiz." });
    }
}
