using SbDisplayLib.Interfaces;
using SbDisplayLib.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

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
