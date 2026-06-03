namespace SbDisplayLib.Models
{
    /// <summary>
    /// This class represents an item that is part of an order, including the quantity of the item and a reference to the item details.
    /// </summary>
    public class OrderItem
    {
        /// <summary>
        /// Quantity of the item in the order.
        /// </summary>
        public int Quantity { get; set; }

        /// <summary>
        /// Item details associated with this order item.
        /// </summary>
        public Item Item { get; set; }
    }
}
