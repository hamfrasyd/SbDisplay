using SbDisplayLib.Common;
using SbDisplayLib.Models;

namespace SbDisplayLib.Interfaces
{
    /// <summary>
    /// Defines repository operations for creating and retrieving item data.
    /// </summary>
    public interface IItemRepository
    {

        /// <summary>
        /// Creates a new item in the data source.
        /// </summary>
        /// <param name="item">The item that should be created.</param>
        /// <returns> A <see cref="Result{T}"/> containing the created <see cref="Item"/> if the operation succeeds,
        /// or an error code and message if the operation fails./returns>
        public Result<Item> Create(Item item);

        /// <summary>
        /// Retrieves all order items associated with a specific order transaction ID.
        /// </summary>
        /// <param name="transactionId">The transaction ID of the order whose items should be retrieved.</param>
        /// <returns>A <see cref="Result{T}"/> containing a list of <see cref="OrderItem"/> objects if the operation succeeds,
        /// or an error code and message if the operation fails.</returns>
        public Result<List<OrderItem>> GetByOrderTransactionId(int transactionId);
    }

}
