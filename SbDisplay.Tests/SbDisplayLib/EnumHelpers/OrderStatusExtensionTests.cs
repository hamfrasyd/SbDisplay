using FluentAssertions;
using SbDisplayLib.EnumHelpers;
using SbDisplayLib.Enums;

namespace SbDisplay.Tests.SbDisplayLib.EnumHelpers
{
    public class OrderStatusExtensionTests
    {
        [Theory]
        [InlineData(OrderStatus.UnderPreparation, "Under Preparation")]
        [InlineData(OrderStatus.ReadyForPickup, "Ready For Pickup")]
        [InlineData(OrderStatus.Completed, "Completed")]
        public void GetDisplayName_WhenEnumHasDisplayAttribute_ReturnsDisplayName(OrderStatus status, string expectedDisplayName)
        {
            // Arrange
            // InlineData arranges the data for the test
            
            // Act
            var displayName = status.GetDisplayName();

            // Assert
            displayName.Should().Be(expectedDisplayName);
        }

        [Theory]
        [InlineData(ErrorCode.NotFound, "NotFound")]
        [InlineData(ErrorCode.DatabaseFailure, "DatabaseFailure")]
        public void GetDisplayName_WhenEnumHasNoDisplayAttribute_ReturnsEnumName(ErrorCode errorCode, string expectedEnumName)
        {
            // Arrange
            // InlineData arranges the data for the test

            // Act
            var displayName = errorCode.GetDisplayName();

            // Assert
            displayName.Should().Be(expectedEnumName);
        }
    }
}
