using SbDisplayLib.Common;
using SbDisplayLib.Interfaces;
using SbDisplayLib.Models;

namespace SbDisplayLib.Handlers
{
    public class GetAllOrdersHandler
    {
        private readonly IOrderRepository _orderRepository;

        public GetAllOrdersHandler(IOrderRepository orderRepository)
        {
            _orderRepository = orderRepository;
        }

        public Result<List<Order>> Execute()
        {
            return _orderRepository.GetAllWithItems();
        }
    }
}
