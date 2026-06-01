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
    /// <summary>
    /// is responsible for handling the logic of changing the status of an order.
    /// </summary>
    public class ChangeOrderStatusHandler
    {

        private readonly IOrderRepository _orderRepository;

        /// <summary>
        /// Initializes a new instance of the <see cref="ChangeOrderStatusHandler"/> class.
        /// </summary>
        /// <param name="orderRepository">The repository used to update order data.</param>
        public ChangeOrderStatusHandler(IOrderRepository orderRepository)
        {
            _orderRepository = orderRepository;
        }


        /// <summary>
        /// Updates the status of an order based on its transaction ID.
        /// </summary>
        /// <param name="transactionId">The transaction ID of the order that should be updated.</param>
        /// <param name="orderStatus">The new status that should be assigned to the order.</param>
        /// <returns>A <see cref="Result{T}"/> containing the updated <see cref="Order"/> if the operation succeeds,or an error code and message if the operation fails.</returns>
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
