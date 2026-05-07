using Microsoft.Extensions.Configuration;
using SbDisplayLib.Converters;
using SbDisplayLib.Dtos;
using SbDisplayLib.Enums;
using SbDisplayLib.Interfaces;
using SbDisplayLib.Models;
using System.Net.Http.Json;

namespace SbDisplayLib.ApiClients
{
    public class OrderApiClient : IOrderApiClient
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;

        public OrderApiClient(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _apiKey = configuration["OrderApi:ApiToken"]
                ?? throw new InvalidOperationException("OrderApi:ApiToken is not configured.");
        }

        public async Task<Order> GetOrderAsync(int transactionId)
        {
            var url = $"api/v3/baskets/{transactionId}?api-token={_apiKey}";

            var response = await _httpClient.GetAsync(url);
            response.EnsureSuccessStatusCode();

            var result = await response.Content.ReadFromJsonAsync<OrderDto>();

            if(result is null) 
            {
                throw new InvalidOperationException("Order response was empty");
            }

            var order = OrderDtoToOrderConverter.Convert(result);
            order.Status = OrderStatus.Receieved;

            return order;
        }
    }
}
