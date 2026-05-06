using SbDisplayLib.Models;

namespace SbDisplayLib.Interfaces
{
    public interface IOrderApiClient
    {
        Task<Order> GetOrderAsync(int transactionId);
    }
}
