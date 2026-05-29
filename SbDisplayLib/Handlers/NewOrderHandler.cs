using SbDisplayLib.Common;
using SbDisplayLib.Interfaces;
using SbDisplayLib.Models;

namespace SbDisplayLib.Handlers
{
    /// <summary>
    /// Handles the creation- and processing of new orders by retrieving order data from an external API and persisting
    /// it to the local repository.
    /// </summary>
    public class NewOrderHandler
    {
        private readonly IOrderApiClient _orderApiClient;
        private readonly IOrderRepository _orderRepository;
        private readonly IItemRepository _itemRepository;

        public NewOrderHandler(IOrderApiClient orderApiClient, IOrderRepository orderRepository, IItemRepository itemRepository) 
        { 
            _orderApiClient = orderApiClient;
            _orderRepository = orderRepository;
            _itemRepository = itemRepository;
        }

        /// <summary>
        /// Method to process a new order by fetching order details from the ShopBox API using the provided transaction ID and then
        /// <br></br>
        /// creating a new Order entry in the database with the retrieved data.
        /// </summary>
        /// <param name="transactionId">The unique identifier for the transaction associated with the new order, used to fetch order details from the ShopBox API.</param>
        /// <returns>An Order object representing the newly created order in the database, populated with data retrieved from the ShopBox API.</returns>
        public async Task<Result<Order>>Execute(int transactionId) 
        {
            // Henter ordredata fra ShopBox Api via transactionId
            var orderResult = await _orderApiClient.GetOrderAsync(transactionId);
            if (!orderResult.TryGetValue(out var order))
            {
                return orderResult;
            }

            // Opretter ny Order i vores database ud fra det hentede data
            var createResult = _orderRepository.Create(order);
            if (!createResult.IsSuccess)
            {  
                return createResult; 
            }

            // Opretter nye Items i databasen
            if (order.Items != null)
            {
                foreach (var orderItem in order.Items)
                {
                    var itemResult = _itemRepository.Create(orderItem.Item);
                    if (!itemResult.IsSuccess)
                        return itemResult.PropagateFailure<Order>();

                    var relationResult = _orderRepository.CreateItemOrderRelation(order, orderItem);
                    if (!relationResult.IsSuccess)
                        return relationResult.PropagateFailure<Order>();
                }
            }

            return Result<Order>.Ok(order);
        }
    }
}
