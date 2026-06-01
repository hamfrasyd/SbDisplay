using FluentAssertions;
using Microsoft.Extensions.Configuration;
using SbDisplay.Tests.SbDisplayLib.ApiClients;
using SbDisplayLib.ApiClients;
using SbDisplayLib.Dtos;
using SbDisplayLib.Enums;
using System.Net;
using System.Net.Http.Json;
using System.Text;

namespace SbDisplay.Tests;

public class OrderApiClientTests
{
    private static IConfiguration BuildConfig()
    {
        return new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>{{ "OrderApi:ApiToken", "test-token" }}).Build();
    }

    private static OrderApiClient BuildClient(HttpResponseMessage mockResponse)
    {
        var handler = new MockHttpMessageHandler(mockResponse);
        var httpClient = new HttpClient(handler) { BaseAddress = new Uri("https://fake.api/") };
        return new OrderApiClient(httpClient, BuildConfig());
    }

    [Fact]
    public async Task GetOrderAsync_ValidResponse_ReturnsSuccessResult()
    {
        // Arrange
        var dto = new OrderDto(1, 1, 1, new());
        var mockResponse = new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = JsonContent.Create(dto)
        };
        var client = BuildClient(mockResponse);

        // Act
        var result = await client.GetOrderAsync(123);

        // Assert
        result.IsSuccess.Should().BeTrue();
    }

    [Fact]
    public async Task GetOrderAsync_ValidResponse_ReturnsOrderWithUnderPreparationStatus()
    {
        // Arrange
        var dto = new OrderDto(1, 1, 1, new());
        var mockResponse = new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = JsonContent.Create(dto)
        };
        var client = BuildClient(mockResponse);

        // Act
        var result = await client.GetOrderAsync(123);

        // Assert
        result.Value!.Status.Should().Be(OrderStatus.UnderPreparation);
    }

    [Fact]
    public async Task GetOrderAsync_NotFound_ReturnsFailureResult()
    {
        // Arrange
        var mockResponse = new HttpResponseMessage(HttpStatusCode.NotFound);
        var client = BuildClient(mockResponse);

        // Act
        var result = await client.GetOrderAsync(999);

        // Assert
        result.IsSuccess.Should().BeFalse();
    }

    [Fact]
    public async Task GetOrderAsync_NotFound_ReturnsNotFoundErrorCode()
    {
        // Arrange
        var mockResponse = new HttpResponseMessage(HttpStatusCode.NotFound);
        var client = BuildClient(mockResponse);

        // Act
        var result = await client.GetOrderAsync(999);

        // Assert
        result.Error.Should().Be(ErrorCode.NotFound);
    }

    [Fact]
    public async Task GetOrderAsync_ServerError_ReturnsFailureResult()
    {
        // Arrange
        var mockResponse = new HttpResponseMessage(HttpStatusCode.InternalServerError);
        var client = BuildClient(mockResponse);

        // Act
        var result = await client.GetOrderAsync(123);

        // Assert
        result.IsSuccess.Should().BeFalse();
    }

    [Fact]
    public async Task GetOrderAsync_ServerError_ReturnsExternalApiFailureErrorCode()
    {
        // Arrange
        var mockResponse = new HttpResponseMessage(HttpStatusCode.InternalServerError);
        var client = BuildClient(mockResponse);

        // Act
        var result = await client.GetOrderAsync(123);

        // Assert
        result.Error.Should().Be(ErrorCode.ExternalApiFailure);
    }

    [Fact]
    public async Task GetOrderAsync_NullResponseBody_ReturnsFailureResult()
    {
        // Arrange
        var mockResponse = new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent("null", Encoding.UTF8, "application/json")
        };
        var client = BuildClient(mockResponse);

        // Act
        var result = await client.GetOrderAsync(123);

        // Assert
        result.IsSuccess.Should().BeFalse();
    }

    [Fact]
    public async Task GetOrderAsync_NullResponseBody_ReturnsExternalApiFailureErrorCode()
    {
        // Arrange
        var mockResponse = new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent("null", Encoding.UTF8, "application/json")
        };
        var client = BuildClient(mockResponse);

        // Act
        var result = await client.GetOrderAsync(123);

        // Assert
        result.Error.Should().Be(ErrorCode.ExternalApiFailure);
    }

    [Fact]
    public async Task GetOrderAsync_NetworkFailure_ReturnsFailureResult()
    {
        // Arrange
        var handler = new ThrowingHttpMessageHandler(new HttpRequestException("Connection refused"));
        var httpClient = new HttpClient(handler) { BaseAddress = new Uri("https://fake.api/") };
        var client = new OrderApiClient(httpClient, BuildConfig());

        // Act
        var result = await client.GetOrderAsync(123);

        // Assert
        result.IsSuccess.Should().BeFalse();
    }

    [Fact]
    public async Task GetOrderAsync_NetworkFailure_ReturnsExternalApiFailureErrorCode()
    {
        // Arrange
        var handler = new ThrowingHttpMessageHandler(new HttpRequestException("Connection refused"));
        var httpClient = new HttpClient(handler) { BaseAddress = new Uri("https://fake.api/") };
        var client = new OrderApiClient(httpClient, BuildConfig());

        // Act
        var result = await client.GetOrderAsync(123);

        // Assert
        result.Error.Should().Be(ErrorCode.ExternalApiFailure);
    }
}

public class ThrowingHttpMessageHandler : HttpMessageHandler
{
    private readonly Exception _ex;
    public ThrowingHttpMessageHandler(Exception ex) => _ex = ex;
    protected override Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request, CancellationToken cancellationToken)
        => throw _ex;
}