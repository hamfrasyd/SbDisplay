using SbDisplayLib.Dtos;
using SbDisplayLib.Models;

namespace SbDisplayLib.Converters
{
    /// <summary>
    /// Converter for converting OrderDto objects retrieved from the ShopBox API into Order objects used within the application.
    /// </summary>
    public static class OrderDtoToOrderConverter
    {
        /// <summary>
        /// Method for converting an OrderDto object into an Order object.
        /// <br></br>
        /// This involves mapping the properties from the DTO to the corresponding properties in the Order model.
        /// </summary>
        /// <param name="data">OrderDto object containing the data to be converted.</param>
        /// <returns>Order object with properties populated based on the provided OrderDto.</returns>
        public static Order Convert(OrderDto data) 
        { 
            Order order = new Order() 
            { 
                Id = data.order_id,
                TransactionId = data.uid,
                CreationTime = DateTimeOffset.FromUnixTimeSeconds(data.creation_time)
                Items = new List<OrderItem>()
            };

            foreach (BasketItemDto basketItem in data.basket_items)
            {
                order.Items.Add(new OrderItem()
                {
                    Quantity = basketItem.single_item_quantity,
                    Item = new Item()
                    {
                        Id = basketItem.uid,
                        Name = basketItem.product_name
                    }
                });
            }

            return order;
        }
    }
}
