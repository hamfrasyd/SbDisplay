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
            Order order = await _newOrderHandler.ProcessNewOrder(value.id);
            await _shopboxHubContext.Clients.All.SendAsync("ReceiveOrderStatusUpdate", order);

            return Ok();
        }
    }
}
