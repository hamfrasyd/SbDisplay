using SbDisplayLib.Enums;

namespace SbDisplayApi.DTOs
{
    /// <summary>
    /// this class represents the data transfer object (DTO) for updating the status of an order.
    /// </summary>
    public class UpdateOrderStatusRequest
    {
        /// <summary>
        /// orders new status.
        /// </summary>
        public OrderStatus Status { get; set; }
    }
}
