using SbDisplayLib.Enums;
using SbDisplayLib.Models;

namespace SbDisplayLib.Interfaces
{
    public interface IOrderRepository
    {
        public Order? UpdateOrderStatus(int orderId, OrderStatus satus);
    }
}
