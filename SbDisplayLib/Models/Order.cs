using SbDisplayLib.Enums;

namespace SbDisplayLib.Models
{
    public class Order
    {
        public int Id { get; set; }
        public int TransactionId { get; set; }
        public long CreationTime { get; set; }

        //Nullable for nu skal ændres når items bliver introduceret
        public List<Item>? Items { get; set; }
        public OrderStatus Status { get; set; }
        
    }
}
