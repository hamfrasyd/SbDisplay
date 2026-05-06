using SbDisplayLib.Enums;
using SbDisplayLib.Models;

namespace SbDisplayLib.Interfaces
{
    public interface IOrderRepository
    {
        public Order? UpdateOrderStatus(int transactionId, OrderStatus statusId);
        public Order Create(Order newOrder);
        public List<Order> GetAll();
        public Order GetById(int id);
    }
}
