using Microsoft.AspNetCore.SignalR;
using SbDisplayLib.Models;

namespace SbDisplayApi.SignalR.Hubs
{
    /// <summary>
    /// SignalR hub used for sending real-time order updates from the API to connected frontend clients.
    /// </summary>
    /// <remarks>
    /// The hub acts as the communication channel between the ASP.NET API and the Angular frontend.
    /// Controllers can send messages through <see cref="IHubContext{THub}"/>, and the frontend listens
    /// for the event names defined here.
    /// </remarks>
    public class ShopboxHub : Hub
    {
        /// <summary>
        /// Sends a real-time notification to all connected clients when a new order has been created.
        /// </summary>
        /// <param name="newOrder">The newly created order that should be shown in the frontend.</param>
        /// <returns>A task representing the asynchronous SignalR send operation.</returns>
        public async Task SendNewOrderNotification(Order newOrder)
        {
            // Eventnavnet skal matche det navn Angular lytter på i signalr.service.ts.
            await Clients.All.SendAsync("ReceiveNewOrderNotification", newOrder);
        }

        /// <summary>
        /// Sends a real-time notification to all connected clients when an existing order has changed status.
        /// </summary>
        /// <param name="updatedOrder">The order containing the updated status information.</param>
        /// <returns>A task representing the asynchronous SignalR send operation.</returns>
        public async Task SendOrderStatusUpdate(Order updatedOrder)
        {
            // Eventnavnet skal matche det navn Angular lytter på i signalr.service.ts.
            await Clients.All.SendAsync("ReceiveOrderStatusUpdate", updatedOrder);
        }
    }
}