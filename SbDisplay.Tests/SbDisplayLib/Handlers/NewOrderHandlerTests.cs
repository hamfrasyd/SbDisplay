using Moq;
using SbDisplayLib.Interfaces;

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
        public void Always_Pass()
        {
            Assert.True(true);
        }
    }
}
