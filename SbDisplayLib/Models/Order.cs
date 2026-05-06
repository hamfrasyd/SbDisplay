using SbDisplayLib.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SbDisplayLib.Models
{
    public class Order
    {
        public int OrderId { get; set; }
        public int TransactionId { get; set; }
        public long CreationTime { get; set; }

        //Nullable for nu skal ændres når items bliver introduceret
        public List<Item>? Items { get; set; }
        public OrderStatus Status { get; set; }
        
    }
}
