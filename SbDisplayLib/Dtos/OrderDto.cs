namespace SbDisplayLib.Dtos
{
    public record OrderDto(int order_id, int uid, long creation_time, List<BasketItemDto> basket_items);
}
