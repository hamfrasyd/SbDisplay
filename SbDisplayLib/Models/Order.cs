using SbDisplayLib.Enums;

namespace SbDisplayLib.Models
{
    public class Order
    {
        /// <summary>The id of an order from ShopBox system.</summary>
        /// <remarks>Usually starts at nr. 100 and resets daily.</remarks>
        public int Id { get; set; }

        /// <summary>The unique transcation id of an order from ShopBox system</summary>
        public int TransactionId { get; set; }

        /// <summary>Creation time of an order</summary>
        public DateTimeOffset CreationTime { get; set; }

        /// <summary>The unix timestamp of the Creation time</summary>
        public long? CreationTimeUnix { get; set; }

        //Nullable for nu skal ændres når items bliver introduceret
        /// <summary>The list of items in an order.</summary>
        public List<OrderItem>? Items { get; set; }

        /// <summary>The status of an order.</summary>
        public OrderStatus Status { get; set; }

        public override string ToString()
        {
            return $"Order #{Id} (Tx: {TransactionId}) | Status: {Status} | " +
                   $"Created: {CreationTime:yyyy-MM-dd HH:mm:ss zzz} | " +
                   $"Items: {Items?.Count ?? 0}";
        }
    }
}
