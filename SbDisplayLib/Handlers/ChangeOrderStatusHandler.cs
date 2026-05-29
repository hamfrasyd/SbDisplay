using SbDisplayLib.Common;
using SbDisplayLib.Enums;
using SbDisplayLib.Interfaces;
using SbDisplayLib.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SbDisplayLib.Handlers
{
    public class ChangeOrderStatusHandler
    {
        private readonly IOrderRepository _orderRepository;

        public ChangeOrderStatusHandler(IOrderRepository orderRepository)
        {
            _orderRepository = orderRepository;
        }

        public Result<Order> Execute(int transactionId, OrderStatus orderStatus)
        {
            var result = _orderRepository.UpdateOrderStatus(transactionId, orderStatus);

            if (!result.TryGetValue(out var value))
            {
                return result;
            }

            return result;
        }
    }
}
