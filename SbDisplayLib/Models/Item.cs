namespace SbDisplayLib.Models
{
    /// <summary>
    /// this class represents an item that can be associated with an order.
    /// </summary>
    public class Item
    {
        /// <summary>
        /// Id of the item.
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// Name of the item.
        /// </summary>
        public string Name { get; set; }
    }
}
