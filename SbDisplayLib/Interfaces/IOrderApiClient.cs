using SbDisplayLib.Models;

namespace SbDisplayLib.Interfaces
{
    /// <summary>
    /// Defines methods for retrieving order information from a remote order service API.
    /// </summary>
    public interface IOrderApiClient
    {
        /// <summary>
        /// Asynchronously retrieves the order associated with the specified transaction identifier.
        /// </summary>
        /// <param name="transactionId">The unique identifier of the transaction for which to retrieve the order. Must be a positive integer.</param>
        /// <returns>The order associated with the specified transaction identifier.</returns>
        Task<Order> GetOrderAsync(int transactionId);
    }
}
