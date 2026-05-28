using SbDisplayLib.Common;
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

        public Result<List<Order>> Execute()
        {
            //Henter alle ordrer fra databasen
            var orderListResult = _orderRepository.GetAll();
            if (!orderListResult.TryGetValue(out var orders))
            {
                return orderListResult;
            }

            //henter items til hver ordre
            foreach (Order order in orders)
            {
                var orderItemResult = _itemRepository.GetByOrderTransactionId(order.TransactionId);
                if(!orderItemResult.IsSuccess)
                {
                    return orderItemResult.PropagateFailure<List<Order>>();
                }

                order.Items = orderItemResult.Value;
            }

            return Result<List<Order>>.Ok(orders);
        }
    }
}
