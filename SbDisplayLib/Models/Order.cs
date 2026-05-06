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
        public int Id { get; set; }
        public List<Item> Items { get; set; }
        public OrderStatus Status { get; set; }
    }
}
