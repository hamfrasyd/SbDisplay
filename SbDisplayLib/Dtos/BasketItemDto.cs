namespace SbDisplayLib.Dtos
{
    /// <summary>
    /// BasketItemDto is a Data Transfer Object (DTO) that represents an item in a shopping basket as retrieved from the ShopBox API.
    /// </summary>
    /// <param name="uid">The unique identifier of the product or basket item.</param>
    /// <param name="single_item_quantity">The quantity of this product in the shopping basket.</param>
    /// <param name="product_name">The name of the product.</param>
    public record BasketItemDto(int uid, int single_item_quantity, string product_name);
}
