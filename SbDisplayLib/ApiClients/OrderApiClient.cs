using Microsoft.Extensions.Configuration;
using SbDisplayLib.Common;
using SbDisplayLib.Converters;
using SbDisplayLib.Dtos;
using SbDisplayLib.Enums;
using SbDisplayLib.Interfaces;
using SbDisplayLib.Models;
using System.Net;
using System.Net.Http.Json;

namespace SbDisplayLib.ApiClients
{
    /// <summary>
    /// this is an API client that communicates with Shopbox's external Order API to retrieve order data based on a given transactionId.
    /// </summary>
    public class OrderApiClient : IOrderApiClient
    {
        /// <summary>
        /// httpClient is used to send HTTP requests to Shopbox's Order API.
        /// </summary>
        private readonly HttpClient _httpClient;
        /// <summary>
        /// _apiKey is a string that holds the API token required for authenticating requests to Shopbox's Order API. This token is retrieved from the configuration during the client's initialization.
        /// </summary>
        private readonly string _apiKey;


        /// <summary>
        /// the constructor for OrderApiClient initializes the HttpClient and retrieves the API token from the configuration.
        /// </summary>
        public OrderApiClient(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _apiKey = configuration["OrderApi:ApiToken"]
                ?? throw new InvalidOperationException("OrderApi:ApiToken is not configured.");
        }

        /// <summary>
        /// Is asynchronous method that takes a transactionId as a parameter and attempts to retrieve the corresponding order from Shopbox's Order API.
        /// </summary>
        /// <returns>the methos returns a Result<Order> object, which encapsulates either the successfully retrieved order or an error message and code if the request fails.
        public async Task<Result<Order>> GetOrderAsync(int transactionId)
        {
            var url = $"api/v3/baskets/{transactionId}?api-token={_apiKey}";

            try
            {
                var response = await _httpClient.GetAsync(url);

                if (response.StatusCode == HttpStatusCode.NotFound)
                    return Result<Order>.Fail(ErrorCode.NotFound,
                        $"No order found for transaction {transactionId}.");

                response.EnsureSuccessStatusCode();

                var result = await response.Content.ReadFromJsonAsync<OrderDto>();

                if (result is null)
                {
                    return Result<Order>.Fail(ErrorCode.ExternalApiFailure, "Order response was empty.");
                }

                var order = OrderDtoToOrderConverter.Convert(result);
                order.Status = OrderStatus.UnderPreparation;

                return Result<Order>.Ok(order);
            }
            catch (HttpRequestException ex)
            {
                return Result<Order>.Fail(ErrorCode.ExternalApiFailure, ex.Message);
            }
        }
    }
}
