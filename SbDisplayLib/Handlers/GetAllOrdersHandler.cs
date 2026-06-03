using SbDisplayLib.Common;
using SbDisplayLib.Interfaces;
using SbDisplayLib.Models;

namespace SbDisplayLib.Handlers
{
    /// <summary>
    /// Handles the business logic for retrieving all orders, including their associated items.
    /// </summary>
    public class GetAllOrdersHandler
    {
        private readonly IOrderRepository _orderRepository;

        /// <summary>
        /// initializes a new instance of the <see cref="GetAllOrdersHandler"/> class.
        /// </summary>
        /// <param name="orderRepository">The repository used to retrieve order data.</param>
        public GetAllOrdersHandler(IOrderRepository orderRepository)
        {
            _orderRepository = orderRepository;
        }


        /// <summary>
        /// Retrieves all orders from the repository, including their associated items.
        /// </summary>
        /// <returns>A <see cref="Result{T}"/> containing a list of <see cref="Order"/> objects if the operation succeeds,
        /// or an error code and message if the operation fails.</returns>
        public Result<List<Order>> Execute()
        {
            return _orderRepository.GetAllWithItems();
        }
    }
}
