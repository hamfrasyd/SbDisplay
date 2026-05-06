using SbDisplayLib.Dtos;
using SbDisplayLib.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SbDisplayLib.Converters
{
    public static class OrderDtoToOrderConverter
    {
        public static Order Convert(OrderDto data) 
        { 
            Order order = new Order() 
            { 
                OrderId = data.order_id,
                TransactionId = data.uid,
                CreationTime = data.creation_time,
            };

            return order;
        }
    }
}
