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
    /// Dette er en API-klient, der kommunikerer med Shopbox's eksterne Order API for at hente ordredata baseret på en given transactionId.
    /// </summary>
    public class OrderApiClient : IOrderApiClient
    {
        /// <summary>
        /// HttpClient bruges til at sende HTTP-anmodninger til Shopbox's Order API.
        /// </summary>
        private readonly HttpClient _httpClient;
        /// <summary>
        /// _apiKey indeholder den nødvendige API-token for at autentificere anmodninger til Shopbox's Order API. Denne token hentes fra konfigurationen ved oprettelsen af klienten.
        /// </summary>
        private readonly string _apiKey;


        /// <summary>
        /// constructoren for OrderApiClient, der tager en HttpClient og IConfiguration som parametre.
        /// </summary>
        public OrderApiClient(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _apiKey = configuration["OrderApi:ApiToken"]
                ?? throw new InvalidOperationException("OrderApi:ApiToken is not configured.");
        }

        /// <summary>
        /// GetOrderAsync er en asynkron metode, der tager en transactionId som parameter og forsøger at hente den tilsvarende ordre fra Shopbox's Order API.
        /// Metoden håndterer forskellige scenarier, herunder ikke fundet (404) og andre HTTP-fejl, og konverterer det modtagne OrderDto til en Order-model ved hjælp af OrderDtoToOrderConverter.
        /// </summary>
        /// <returns>Metoden returnere et Result<Order> objekt, der enten indeholder den hentede ordre eller en fejlbesked og en fejlkode, hvis anmodningen mislykkedes. 
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
