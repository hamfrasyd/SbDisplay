using SbDisplayLib.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading.Tasks;

namespace SbDisplayLib.Interfaces
{
    public interface IItemRepository
    {
        public Item Create(Item item);

        public List<OrderItem> GetByOrderTransactionId(int transactionId);
    }

}
