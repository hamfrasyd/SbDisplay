using SbDisplayLib.Interfaces;
using SbDisplayLib.Models;

namespace SbDisplayLib.Handlers
{
    public class CreateOrderHandler
    {
        private IOrderRepository _orderRepository;

        public CreateOrderHandler(IOrderRepository orderRepository)
        {
            _orderRepository = orderRepository;
        }

        public Order Execute(Order newOrder)
        {
            return _orderRepository.Create(newOrder);
        }
    }
}
