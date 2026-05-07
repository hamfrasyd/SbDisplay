using SbDisplayLib.Interfaces;
using SbDisplayLib.Models;

namespace SbDisplayLib.Handlers
{
    public class NewOrderHandler
    {
        private readonly IOrderApiClient _orderApiClient;
        private readonly IOrderRepository _orderRepository;

        public NewOrderHandler(IOrderApiClient orderApiClient, IOrderRepository orderRepository) 
        { 
            _orderApiClient = orderApiClient;
            _orderRepository = orderRepository;
        }

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
