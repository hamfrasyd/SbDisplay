using FluentAssertions;
using Moq;
using SbDisplayLib.Enums;
using SbDisplayLib.Handlers;
using SbDisplayLib.Interfaces;
using SbDisplayLib.Models;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace SbDisplay.Tests.SbDisplayLib.Handlers
{
    public class NewOrderHandlerTests
    {
        private readonly Mock<IOrderApiClient> _orderApiClientMock;
        private readonly Mock<IOrderRepository> _orderRepositoryMock;
        private readonly Mock<IItemRepository> _itemRepositoryMock;

        public NewOrderHandlerTests()
        {
            _orderApiClientMock = new Mock<IOrderApiClient>();
            _orderRepositoryMock = new Mock<IOrderRepository>();
            _itemRepositoryMock = new Mock<IItemRepository>();
        }

        //[Fact]
        //public async Task Handler_Should_Process_New_Order_Successfully_Async()
        //{
        //    // Arrange
        //    int transactionId = 123;
        //
        //    Order apiOrder = new Order
        //    {
        //        Id = 100,
        //        TransactionId = transactionId,
        //        CreationTime = DateTimeOffset.FromUnixTimeSeconds(9999),
        //        Items = null,
        //        Status = OrderStatus.UnderPreparation
        //    };
        //
        //    _orderApiClientMock.Setup(client => client.GetOrderAsync(transactionId)).ReturnsAsync(apiOrder);
        //    _orderRepositoryMock.Setup(repo => repo.Create(apiOrder)).Returns(apiOrder);
        //
        //    NewOrderHandler handler = new(_orderApiClientMock.Object, _orderRepositoryMock.Object, _itemRepositoryMock.Object);
        //
        //    // Act
        //    Order result = await handler.Execute(transactionId);
        //
        //    // Assert
        //    result.TransactionId.Should().Be(transactionId);
        //    result.Status.Should().Be(OrderStatus.UnderPreparation);
        //}
    }
}
