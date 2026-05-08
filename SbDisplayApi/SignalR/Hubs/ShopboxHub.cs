using Microsoft.AspNetCore.SignalR;
using SbDisplayLib.Models;
namespace SbDisplayApi.SignalR.Hubs
{
    public class ShopboxHub : Hub
    {
        public async Task SendNewOrderNotification(Order newOrder)
        {
            // Sender en besked til alle tilsluttede klienter om en ny ordre.
            await Clients.All.SendAsync("ReceiveNewOrderNotification", newOrder);
        }

        public async Task SendOrderStatusUpdate(Order updatedOrder)
        {
            // Sender en besked til alle tilsluttede klienter om en opdatering i ordrestatus.
            await Clients.All.SendAsync("ReceiveOrderStatusUpdate", updatedOrder);
        }
    }
}
