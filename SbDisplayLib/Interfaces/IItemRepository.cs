using SbDisplayLib.Common;
using SbDisplayLib.Models;

namespace SbDisplayLib.Interfaces
{
    public interface IItemRepository
    {
        public Result<Item> Create(Item item);

        public Result<List<OrderItem>> GetByOrderTransactionId(int transactionId);
    }

}
