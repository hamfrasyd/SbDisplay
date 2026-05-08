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

        public NewOrderHandler(IOrderApiClient orderApiClient, IOrderRepository orderRepository) 
        { 
            _orderApiClient = orderApiClient;
            _orderRepository = orderRepository;
        }

        /// <summary>
        /// Method to process a new order by fetching order details from the ShopBox API using the provided transaction ID and then
        /// <br></br>
        /// creating a new Order entry in the database with the retrieved data.
        /// </summary>
        /// <param name="transactionId">The unique identifier for the transaction associated with the new order, used to fetch order details from the ShopBox API.</param>
        /// <returns>An Order object representing the newly created order in the database, populated with data retrieved from the ShopBox API.</returns>
        public async Task<Order> ProcessNewOrder(int transactionId) 
        {
            // Henter ordredata fra ShopBox Api via transactionId
            var order = await _orderApiClient.GetOrderAsync(transactionId);

            // Oprettet ny Order i vores database ud fra det hentede data
            _orderRepository.Create(order);

            return order;
        }
    }
}
