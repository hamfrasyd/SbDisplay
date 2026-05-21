using SbDisplayLib.Interfaces;
using SbDisplayLib.Models;

namespace SbDisplayLib.Handlers
{
    public class GetAllOrdersHandler
    {
        private readonly IOrderRepository _orderRepository;
        private readonly IItemRepository _itemRepository;

        public GetAllOrdersHandler(IOrderRepository orderRepository, IItemRepository itemRepository)
        {
            _orderRepository = orderRepository;
            _itemRepository = itemRepository;
        }

        public List<Order> Execute()
        {
            //Henter alle ordrer fra databasen
            List<Order> orders = _orderRepository.GetAll();

            //henter items til hver ordre
            foreach (Order order in orders)
            {
                order.Items = _itemRepository.GetByOrderTransactionId(order.TransactionId);
            }
            return orders;
        }
    }
}
