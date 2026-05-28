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
        private IOrderRepository _orderRepo;
        private GetAllOrdersHandler _getAllOrdersHandler;
        // Giver controlleren adgang til SignalR hub'en uden at være inde i selve Hub-klassen.
        // Bruges til at sende live updates til Angular, når en ordre ændrer status.
        private IHubContext<ShopboxHub> _shopboxHubContext;

        public OrdersController(IOrderRepository orderRepository, IHubContext<ShopboxHub> shopboxHubContext, GetAllOrdersHandler getAllOrdersHandler)
        {
            _orderRepo = orderRepository;
            _shopboxHubContext = shopboxHubContext;
            _getAllOrdersHandler = getAllOrdersHandler;
        }

        // GET: api/<OrdersController>
        [HttpGet(Name = "GetAllOrders")]
        [ProducesResponseType(typeof(List<Order>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public IActionResult Get()
        {
            var result = _getAllOrdersHandler.Execute();

            if (!result.IsSuccess)
                return result.Error switch
                {
                    ErrorCode.DatabaseFailure => StatusCode(500, result.ErrorMessage),
                    _ => StatusCode(500, result.ErrorMessage)
                };

            if (result.Value == null || result.Value.Count == 0)
            {
                return NoContent();
            }

            return Ok(result.Value);
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
            // TODO ens-artet fejl håndtering
            try
            {
                Order? updatedOrder = _orderRepo.UpdateOrderStatus(transactionId, request.Status);

                if (updatedOrder is null)
                {
                    return NotFound($"Order with transaction-Id {transactionId} was not found.");
                }

                // Sender den opdaterede ordre ud til alle tilsluttede frontend-klienter.
                // Angular lytter på "ReceiveOrderStatusUpdate" og opdaterer status på den eksisterende ordre i listen.
                await _shopboxHubContext.Clients.All.SendAsync("ReceiveOrderStatusUpdate", updatedOrder);

                return Ok(updatedOrder);
            }
            catch (Exception ex)
            {
                if (ex is SqlException)
                {
                    Console.WriteLine(ex);
                    return StatusCode(StatusCodes.Status500InternalServerError, "A database error occurred while updating the order.");
                }
                else
                {
                    Console.WriteLine(ex);
                    return StatusCode(StatusCodes.Status500InternalServerError, "An unexpected error occurred while updating the order.");
                }
            }
        }
    }
}
