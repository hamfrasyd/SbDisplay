using SbDisplayLib.Dtos;
using SbDisplayLib.Models;

namespace SbDisplayLib.Converters
{
    public static class OrderDtoToOrderConverter
    {
        public static Order Convert(OrderDto data) 
        { 
            Order order = new Order() 
            { 
                Id = data.order_id,
                TransactionId = data.uid,
                CreationTime = data.creation_time,
            };

            return order;
        }
    }
}
