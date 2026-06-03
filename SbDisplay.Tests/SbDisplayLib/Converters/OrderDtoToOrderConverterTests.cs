using FluentAssertions;
using SbDisplayLib.Converters;
using SbDisplayLib.Dtos;

namespace SbDisplay.Tests.SbDisplayLib.Converters
{
    public class OrderDtoToOrderConverterTests
    {
        [Fact]
        public void Convert_WhenGivenValidDto_MapsIdTransactionIdAndCreationTime()
        {
            // Arrange
            const int orderId = 100;
            const int transactionUid = 555;
            const long creationTimeUnixSeconds = 1_000_000_000L;
            var expectedCreationTime = new DateTimeOffset(2001, 9, 9, 1, 46, 40, TimeSpan.Zero);

            var dto = new OrderDto(orderId, transactionUid, creationTimeUnixSeconds, new List<BasketItemDto>());

            // Act
            var order = OrderDtoToOrderConverter.Convert(dto);

            // Assert
            order.Should().BeEquivalentTo(new
            {
                Id = orderId,
                TransactionId = transactionUid,
                CreationTimeUnix = creationTimeUnixSeconds,
                CreationTime = expectedCreationTime
            });
        }

        [Fact]
        public void Convert_WhenDtoHasBasketItem_MapsQuantityItemIdAndName()
        {
            // Arrange
            const int orderId = 100;
            const int transactionUid = 555;
            const long creationTimeUnixSeconds = 1_000_000_000L;
            const int basketItemUid = 50;
            const int basketItemQuantity = 2;
            const string basketItemProductName = "Kaffe";

            var basketItem = new BasketItemDto(basketItemUid, basketItemQuantity, basketItemProductName);
            var dto = new OrderDto(orderId, transactionUid, creationTimeUnixSeconds, new List<BasketItemDto> { basketItem });

            // Act
            var order = OrderDtoToOrderConverter.Convert(dto);

            // Assert
            order.Items.Should().ContainSingle().Which.Should().BeEquivalentTo(new
            {
                Quantity = basketItemQuantity,
                Item = new { Id = basketItemUid, Name = basketItemProductName }
            });
        }

        [Fact]
        public void Convert_WhenBasketItemsIsNull_ReturnsEmptyItemsList()
        {
            // Arrange
            const int orderId = 100;
            const int transactionUid = 555;
            const long creationTimeUnixSeconds = 1_000_000_000L;

            var dto = new OrderDto(orderId, transactionUid, creationTimeUnixSeconds, null!);

            // Act
            var order = OrderDtoToOrderConverter.Convert(dto);

            // Assert
            order.Items.Should().BeEmpty();
        }
    }
}
