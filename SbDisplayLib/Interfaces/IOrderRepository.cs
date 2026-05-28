using SbDisplayLib.Common;
using SbDisplayLib.Enums;
using SbDisplayLib.Models;

namespace SbDisplayLib.Interfaces
{
    /// <summary>
    /// Defines an interface contract for managing and retrieving order data within a repository.
    /// </summary>
    public interface IOrderRepository
    {
        /// <summary>Updates the status of an order</summary>
        /// <param name="transactionId">The unique id of an order</param>
        /// <param name="status">The new status for the order</param>
        /// <returns>Either the updated order or null if order doesn't exist</returns>
        public Order? UpdateOrderStatus(int transactionId, OrderStatus status);

        /// <summary>Creates a new order and adds it to the system.</summary>
        /// <param name="newOrder">The order to be created.</param>
        /// <returns>The created order</returns>
        public Result<Order> Create(Order newOrder);

        /// <summary>Creates the new relation between the Order and it's item</summary>
        /// <param name="order">The order part of the relationship</param>
        /// <param name="orderItem">The item part of the relationship</param>
        public Result<OrderItem> CreateItemOrderRelation(Order order, OrderItem orderItem);

        /// <summary>Retrieves all orders from the database.</summary>
        /// <returns>A list of retrieved orders</returns>
        public Result<List<Order>> GetAll();
    }
}
