using SbDisplayLib.Enums;
using SbDisplayLib.Models;
using SbDisplayLib.Enums;
using SbDisplayLib.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SbDisplayLib.Interfaces
{
    public interface IOrderRepository
    {
        public Order? UpdateOrderStatus(int orderId, OrderStatus statusId);
        public Order Create(Order newOrder);
        public List<Order> GetAll();
        public Order GetById(int id);
    }
}
