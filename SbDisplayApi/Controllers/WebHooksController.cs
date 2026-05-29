using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using SbDisplayApi.SignalR.Hubs;
using SbDisplayLib.Dtos;
using SbDisplayLib.Enums;
using SbDisplayLib.Handlers;
using SbDisplayLib.Models;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace SbDisplayApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class WebHooksController : ControllerBase
    {
        private readonly NewOrderHandler _newOrderHandler;

        // Giver controlleren adgang til SignalR, så webhook'et kan give frontend besked,
        // når en ny ordre er blevet oprettet i systemet.
        private readonly IHubContext<ShopboxHub> _shopboxHubContext;

        public WebHooksController(NewOrderHandler newOrderHandler, IHubContext<ShopboxHub> shopboxHubContext)
        {
            _newOrderHandler = newOrderHandler;
            _shopboxHubContext = shopboxHubContext;
        }


        // POST api/<WebHookController>
        [HttpPost]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status502BadGateway)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> Post([FromBody] TransactionDto value)
        {
            var result = await _newOrderHandler.Execute(value.id);

            if (!result.IsSuccess)
                return result.Error switch
                {
                    ErrorCode.NotFound => NotFound(result.ErrorMessage),
                    ErrorCode.ExternalApiFailure => StatusCode(502, result.ErrorMessage),
                    ErrorCode.DatabaseFailure => StatusCode(500, result.ErrorMessage),
                    ErrorCode.InvalidInput => BadRequest(result.ErrorMessage),
                    _ => StatusCode(500, result.ErrorMessage)
                };

            // Sender den nye ordre ud til alle åbne frontend-klienter.
            // Angular lytter på "ReceiveNewOrderNotification" og tilføjer ordren til listen.
            await _shopboxHubContext.Clients.All.SendAsync("ReceiveNewOrderNotification", result.Value);

            return Ok($"{result.Value} created successfully");
        }
    }
}
