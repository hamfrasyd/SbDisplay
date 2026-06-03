using FluentAssertions;
using Moq;
using SbDisplayLib.Common;
using SbDisplayLib.Enums;
using SbDisplayLib.Handlers;
using SbDisplayLib.Interfaces;
using SbDisplayLib.Models;

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

        [Fact]
        public async Task Execute_WhenApiReturnsValidOrder_ReturnsOkResult()
        {
            // Arrange
            const int existingTransactionId = 123;
            const int existingOrderId = 100;
            const int orderedItemId = 50;
            const string orderedItemName = "Kaffe";
            const int orderedItemQuantity = 2;

            var orderedItem = new OrderItem
            {
                Quantity = orderedItemQuantity,
                Item = new Item { Id = orderedItemId, Name = orderedItemName }
            };
            var orderFromApi = new Order
            {
                Id = existingOrderId,
                TransactionId = existingTransactionId,
                Items = new List<OrderItem> { orderedItem }
            };

            _orderApiClientMock.Setup(client => client.GetOrderAsync(existingTransactionId)).ReturnsAsync(Result<Order>.Ok(orderFromApi));
            _orderRepositoryMock.Setup(repository => repository.Create(orderFromApi)).Returns(Result<Order>.Ok(orderFromApi));
            _itemRepositoryMock.Setup(repository => repository.Create(orderedItem.Item)).Returns(Result<Item>.Ok(orderedItem.Item));
            _orderRepositoryMock.Setup(repository => repository.CreateItemOrderRelation(orderFromApi, orderedItem)).Returns(Result<OrderItem>.Ok(orderedItem));

            var handler = new NewOrderHandler(_orderApiClientMock.Object, _orderRepositoryMock.Object, _itemRepositoryMock.Object);

            // Act
            var result = await handler.Execute(existingTransactionId);

            // Assert
            result.IsSuccess.Should().BeTrue();
        }

        [Fact]
        public async Task Execute_WhenApiReturnsFailure_ReturnsFailureWithoutCreatingOrder()
        {
            // Arrange
            const int missingTransactionId = 999;
            const ErrorCode apiErrorCode = ErrorCode.NotFound;
            const string apiErrorMessage = "No order found for transaction 999.";

            _orderApiClientMock.Setup(client => client.GetOrderAsync(missingTransactionId)).ReturnsAsync(Result<Order>.Fail(apiErrorCode, apiErrorMessage));

            var handler = new NewOrderHandler(_orderApiClientMock.Object, _orderRepositoryMock.Object, _itemRepositoryMock.Object);

            // Act
            var result = await handler.Execute(missingTransactionId);

            // Assert
            result.Error.Should().Be(apiErrorCode);
            _orderRepositoryMock.Verify(repository => repository.Create(It.IsAny<Order>()), Times.Never);
        }

        [Fact]
        public async Task Execute_WhenOrderCreateFails_ReturnsFailureWithoutCreatingItems()
        {
            // Arrange
            const int existingTransactionId = 123;
            const int existingOrderId = 100;
            const int orderedItemId = 50;
            const string orderedItemName = "Kaffe";
            const int orderedItemQuantity = 2;
            const ErrorCode createErrorCode = ErrorCode.DatabaseFailure;
            const string createErrorMessage = "Could not create order.";

            var orderedItem = new OrderItem
            {
                Quantity = orderedItemQuantity,
                Item = new Item { Id = orderedItemId, Name = orderedItemName }
            };
            var orderFromApi = new Order
            {
                Id = existingOrderId,
                TransactionId = existingTransactionId,
                Items = new List<OrderItem> { orderedItem }
            };

            _orderApiClientMock.Setup(client => client.GetOrderAsync(existingTransactionId)).ReturnsAsync(Result<Order>.Ok(orderFromApi));
            _orderRepositoryMock.Setup(repository => repository.Create(orderFromApi)).Returns(Result<Order>.Fail(createErrorCode, createErrorMessage));

            var handler = new NewOrderHandler(_orderApiClientMock.Object, _orderRepositoryMock.Object, _itemRepositoryMock.Object);

            // Act
            var result = await handler.Execute(existingTransactionId);

            // Assert
            result.Error.Should().Be(createErrorCode);
            _itemRepositoryMock.Verify(repository => repository.Create(It.IsAny<Item>()), Times.Never);
        }

        [Fact]
        public async Task Execute_WhenItemCreateFails_PropagatesFailureWithoutCreatingRelation()
        {
            // Arrange
            const int existingTransactionId = 123;
            const int existingOrderId = 100;
            const int orderedItemId = 50;
            const string orderedItemName = "Kaffe";
            const int orderedItemQuantity = 2;
            const ErrorCode itemCreateErrorCode = ErrorCode.DatabaseFailure;
            const string itemCreateErrorMessage = "Could not create item.";

            var orderedItem = new OrderItem
            {
                Quantity = orderedItemQuantity,
                Item = new Item { Id = orderedItemId, Name = orderedItemName }
            };
            var orderFromApi = new Order
            {
                Id = existingOrderId,
                TransactionId = existingTransactionId,
                Items = new List<OrderItem> { orderedItem }
            };

            _orderApiClientMock.Setup(client => client.GetOrderAsync(existingTransactionId)).ReturnsAsync(Result<Order>.Ok(orderFromApi));
            _orderRepositoryMock.Setup(repository => repository.Create(orderFromApi)).Returns(Result<Order>.Ok(orderFromApi));
            _itemRepositoryMock.Setup(repository => repository.Create(orderedItem.Item)).Returns(Result<Item>.Fail(itemCreateErrorCode, itemCreateErrorMessage));

            var handler = new NewOrderHandler(_orderApiClientMock.Object, _orderRepositoryMock.Object, _itemRepositoryMock.Object);

            // Act
            var result = await handler.Execute(existingTransactionId);

            // Assert
            result.Error.Should().Be(itemCreateErrorCode);
            _orderRepositoryMock.Verify(repository => repository.CreateItemOrderRelation(It.IsAny<Order>(), It.IsAny<OrderItem>()), Times.Never);
        }

        [Fact]
        public async Task Execute_WhenRelationCreateFails_PropagatesFailure()
        {
            // Arrange
            const int existingTransactionId = 123;
            const int existingOrderId = 100;
            const int orderedItemId = 50;
            const string orderedItemName = "Kaffe";
            const int orderedItemQuantity = 2;
            const ErrorCode relationCreateErrorCode = ErrorCode.DatabaseFailure;
            const string relationCreateErrorMessage = "Could not create order-item relation.";

            var orderedItem = new OrderItem
            {
                Quantity = orderedItemQuantity,
                Item = new Item { Id = orderedItemId, Name = orderedItemName }
            };
            var orderFromApi = new Order
            {
                Id = existingOrderId,
                TransactionId = existingTransactionId,
                Items = new List<OrderItem> { orderedItem }
            };

            _orderApiClientMock.Setup(client => client.GetOrderAsync(existingTransactionId)).ReturnsAsync(Result<Order>.Ok(orderFromApi));
            _orderRepositoryMock.Setup(repository => repository.Create(orderFromApi)).Returns(Result<Order>.Ok(orderFromApi));
            _itemRepositoryMock.Setup(repository => repository.Create(orderedItem.Item)).Returns(Result<Item>.Ok(orderedItem.Item));
            _orderRepositoryMock.Setup(repository => repository.CreateItemOrderRelation(orderFromApi, orderedItem)).Returns(Result<OrderItem>.Fail(relationCreateErrorCode, relationCreateErrorMessage));

            var handler = new NewOrderHandler(_orderApiClientMock.Object, _orderRepositoryMock.Object, _itemRepositoryMock.Object);

            // Act
            var result = await handler.Execute(existingTransactionId);

            // Assert
            result.Error.Should().Be(relationCreateErrorCode);
        }

        [Fact]
        public async Task Execute_WhenOrderHasNoItems_ReturnsOkWithoutCreatingItems()
        {
            // Arrange
            const int existingTransactionId = 123;
            const int existingOrderId = 100;

            var orderWithoutItems = new Order
            {
                Id = existingOrderId,
                TransactionId = existingTransactionId,
                Items = null
            };

            _orderApiClientMock.Setup(client => client.GetOrderAsync(existingTransactionId)).ReturnsAsync(Result<Order>.Ok(orderWithoutItems));
            _orderRepositoryMock.Setup(repository => repository.Create(orderWithoutItems)).Returns(Result<Order>.Ok(orderWithoutItems));

            var handler = new NewOrderHandler(_orderApiClientMock.Object, _orderRepositoryMock.Object, _itemRepositoryMock.Object);

            // Act
            var result = await handler.Execute(existingTransactionId);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _itemRepositoryMock.Verify(repository => repository.Create(It.IsAny<Item>()), Times.Never);
        }
    }
}
