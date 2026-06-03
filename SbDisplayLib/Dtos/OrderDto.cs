namespace SbDisplayLib.Dtos
{
    /// <summary>
    /// OrderDto is a Data Transfer Object (DTO) that represents an order as retrieved from the ShopBox API.
    /// </summary>
    /// <param name="order_id">The unique identifier of the order.</param>
    /// <param name="uid">The unique identifier associated with the order.</param>
    /// <param name="creation_time">The time when the order was created, represented as a Unix timestamp.</param>
    /// <param name="basket_items">The list of basket items included in the order.</param>
    public record OrderDto(int order_id, int uid, long creation_time, List<BasketItemDto> basket_items);
}
