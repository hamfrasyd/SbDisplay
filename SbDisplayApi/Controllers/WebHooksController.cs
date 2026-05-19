using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using SbDisplayApi.SignalR.Hubs;
using SbDisplayLib.Dtos;
using SbDisplayLib.Handlers;
using SbDisplayLib.Models;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace SbDisplayApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class WebHooksController : ControllerBase
    {
        private NewOrderHandler _newOrderHandler;

        // Giver controlleren adgang til SignalR, så webhook'et kan give frontend besked,
        // når en ny ordre er blevet oprettet i systemet.
        private IHubContext<ShopboxHub> _shopboxHubContext;

        public WebHooksController(NewOrderHandler newOrderHandler, IHubContext<ShopboxHub> shopboxHubContext)
        {
            _newOrderHandler = newOrderHandler;
            _shopboxHubContext = shopboxHubContext;
        }


        // POST api/<WebHookController>
        [HttpPost]
        public async Task<IActionResult> Post([FromBody] TransactionDto value)
        {
            Order order = await _newOrderHandler.Execute(value.id);

            // Sender den nye ordre ud til alle åbne frontend-klienter.
            // Angular lytter på "ReceiveNewOrderNotification" og tilføjer ordren til listen.
            await _shopboxHubContext.Clients.All.SendAsync("ReceiveNewOrderNotification", order);

            return Ok();
        }
    }
}
