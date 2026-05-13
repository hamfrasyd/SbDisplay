using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Data.SqlClient;
using SbDisplayApi.DTOs;
using SbDisplayApi.SignalR.Hubs;
using SbDisplayLib.EnumHelpers;
using SbDisplayLib.Interfaces;
using SbDisplayLib.Models;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace SbDisplayApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OrdersController : ControllerBase
    {
        private IOrderRepository _orderRepo;

        // Giver controlleren adgang til SignalR hub'en uden at være inde i selve Hub-klassen.
        // Bruges til at sende live updates til Angular, når en ordre ændrer status.
        private IHubContext<ShopboxHub> _shopboxHubContext;

        public OrdersController(IOrderRepository orderRepository, IHubContext<ShopboxHub> shopboxHubContext)
        {
            _orderRepo = orderRepository;
            _shopboxHubContext = shopboxHubContext;
        }

        // GET: api/<OrdersController>
        [HttpGet(Name = "GetAllOrders")]
        [ProducesResponseType(typeof(List<Order>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        public IActionResult Get()
        {
            var orders = _orderRepo.GetAll();

            if (orders == null || orders.Count == 0)
            {
                return NoContent();
            }

            return Ok(orders);
        }

        // GET api/<OrdersController>/5
        [HttpGet("{id}", Name = "GetOrderById")]
        public string Get(int id)
        {
            return "value";
        }

        // POST api/<OrdersController>
        [HttpPost(Name = "CreateOrder")]
        public async Task<IActionResult> Post([FromBody] string value)
        {
            return Ok();
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

        // DELETE api/<OrdersController>/5
        [HttpDelete("{id}", Name = "DeleteOrder")]
        public void Delete(int id)
        {
        }
    }
}
