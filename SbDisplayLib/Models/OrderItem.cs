using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SbDisplayLib.Models
{
    public class OrderItem
    {
        public int Quantity { get; set; }
        public Item Item { get; set; }
    }
}
