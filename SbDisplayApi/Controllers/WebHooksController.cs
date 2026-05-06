using Microsoft.AspNetCore.Mvc;
using SbDisplayLib.Dtos;
using SbDisplayLib.Handlers;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace SbDisplayApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class WebHooksController : ControllerBase
    {
        private NewOrderHandler _newOrderHandler;

        public WebHooksController(NewOrderHandler newOrderHandler)
        {
            _newOrderHandler = newOrderHandler;
        }


        // POST api/<WebHookController>
        [HttpPost]
        public async Task<IActionResult> Post([FromBody] TransactionDto value)
        {
            var order = await _newOrderHandler.ProcessNewOrder(value.id);
            return Ok();
        }
    }
}
