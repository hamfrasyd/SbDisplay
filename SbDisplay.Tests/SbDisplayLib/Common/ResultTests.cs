using FluentAssertions;
using SbDisplayLib.Common;
using SbDisplayLib.Enums;

namespace SbDisplay.Tests.SbDisplayLib.Common
{
    public class ResultTests
    {
        [Fact]
        public void PropagateFailure_WhenResultIsFailure_PreservesErrorCodeAndMessage()
        {
            // Arrange
            const ErrorCode originalErrorCode = ErrorCode.DatabaseFailure;
            const string originalErrorMessage = "Original failure message.";
            var failure = Result<int>.Fail(originalErrorCode, originalErrorMessage);

            // Act
            var propagated = failure.PropagateFailure<string>();

            // Assert
            propagated.Should().BeEquivalentTo(new
            {
                Error = originalErrorCode,
                ErrorMessage = originalErrorMessage
            });
        }

        [Fact]
        public void PropagateFailure_WhenResultIsSuccess_ThrowsInvalidOperationException()
        {
            // Arrange
            const int successValue = 1;
            var success = Result<int>.Ok(successValue);

            // Act
            var act = () => success.PropagateFailure<string>();

            // Assert
            act.Should().Throw<InvalidOperationException>();
        }
    }
}
