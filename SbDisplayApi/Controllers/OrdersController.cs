using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Data.SqlClient;
using SbDisplayApi.DTOs;
using SbDisplayApi.SignalR.Hubs;
using SbDisplayLib.EnumHelpers;
using SbDisplayLib.Enums;
using SbDisplayLib.Handlers;
using SbDisplayLib.Interfaces;
using SbDisplayLib.Models;
using SbDisplayLib.Repositories;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace SbDisplayApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OrdersController : ControllerBase
    {
        private readonly ChangeOrderStatusHandler _changeOrderStatusHandler;
        private readonly GetAllOrdersHandler _getAllOrdersHandler;
        // Giver controlleren adgang til SignalR hub'en uden at være inde i selve Hub-klassen.
        // Bruges til at sende live updates til Angular, når en ordre ændrer status.
        private readonly IHubContext<ShopboxHub> _shopboxHubContext;

        public OrdersController(ChangeOrderStatusHandler changeOrderStatusHandler, IHubContext<ShopboxHub> shopboxHubContext, GetAllOrdersHandler getAllOrdersHandler)
        {
            _shopboxHubContext = shopboxHubContext;
            _getAllOrdersHandler = getAllOrdersHandler;
            _changeOrderStatusHandler = changeOrderStatusHandler;
        }

        // GET: api/<OrdersController>
        [HttpGet(Name = "GetAllOrders")]
        [ProducesResponseType(typeof(List<Order>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public IActionResult Get()
        {
            var result = _getAllOrdersHandler.Execute();

            if (!result.TryGetValue(out var orders))
                return StatusCode(500, result.ErrorMessage);

            if (orders.Count == 0)
                return NoContent();

            return Ok(orders);
        }

        // PUT api/<OrdersController>/5
        [HttpPut]
        [Route("{transactionId}", Name = "UpdateOrderStatus")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> ChangeOrderStatus(int transactionId, [FromBody] UpdateOrderStatusRequest request)
        {
            
            var result = _changeOrderStatusHandler.Execute(transactionId, request.Status);

            if (!result.TryGetValue(out var updatedOrder))
            {
                return result.Error switch
                {
                    ErrorCode.NotFound => NotFound(result.ErrorMessage),
                    ErrorCode.DatabaseFailure => StatusCode(500, result.ErrorMessage),
                    ErrorCode.InvalidInput => BadRequest(result.ErrorMessage),
                    _ => StatusCode(500, result.ErrorMessage)
                };
            }
            
            // Sender den opdaterede ordre ud til alle tilsluttede frontend-klienter.
            // Angular lytter på "ReceiveOrderStatusUpdate" og opdaterer status på den eksisterende ordre i listen.
            await _shopboxHubContext.Clients.All.SendAsync("ReceiveOrderStatusUpdate", updatedOrder);
            
            return Ok(updatedOrder);
            
        }
    }
}
