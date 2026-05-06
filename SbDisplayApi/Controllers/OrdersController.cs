using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using SbDisplayApi.DTOs;
using SbDisplayLib.Enums;
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
        public OrdersController(IOrderRepository orderRepository)
        {
            _orderRepo = orderRepository;
        }
        // GET: api/<OrdersController>
        [HttpGet]
        public IEnumerable<string> Get()
        {
            return new string[] { "value1", "value2" };
        }

        // GET api/<OrdersController>/5
        [HttpGet("{id}")]
        public string Get(int id)
        {
            return "value";
        }

        // POST api/<OrdersController>
        [HttpPost]
        public void Post([FromBody] string value)
        {
        }

        // PUT api/<OrdersController>/5
        [HttpPut]
        [Route("{orderId}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public IActionResult ChangeOrderStatus(int orderId, [FromBody] UpdateOrderStatusRequest request)
        {
            // TODO ens-artet fejl håndtering
            try
            {
                Order? updatedOrder = _orderRepo.UpdateOrderStatus(orderId, request.Status);
                if (updatedOrder is null)
                {
                    return NotFound($"Order with id {orderId} was not found.");
                }

                return Ok(updatedOrder);
            }
            catch (ArgumentException ex) // 'ArgumentNullException' and 'ArgumentOutOfRangeException' inhreits from  'ArgumentException'
            {
                return BadRequest(ex.Message);
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
        [HttpDelete("{id}")]
        public void Delete(int id)
        {
        }
    }
}
