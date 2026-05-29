import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Subject } from 'rxjs';
import { Order } from '../generated/orders';
import { environment } from '../../environments/environment';

/**
 * Thin realtime layer over SignalR.
 * - Opens the connection to the backend hub
 * - and forwards incoming hub events onto typed RxJS streams.
 *
 * @remarks It holds no state and does no filtering. The store (OrderDisplayStateService)
 * subscribes to these streams and folds the orders into its own signal state.
 * @remarks providedIn: 'root' means this service is a singleton and can be injected anywhere.
 */
@Injectable({ providedIn: 'root' })
export class SignalRService {
    /**
     * The active hub connection.
     * @remarks The '!' tells TypeScript the field is assigned later (in startConnection),
     * so it doesn't require an initializer here.
     */
    private hubConnection!: signalR.HubConnection;

    /**
     * Stream that emits whenever the backend pushes a new order.
     * @remarks Subject is an RxJS event-stream. Other services/components can .subscribe()
     * to receive new values in realtime.
     * @remarks The $ suffix is the convention that marks a field as a stream/observable.
     */
    public newOrder$ = new Subject<Order>();

    /**
     * Stream that emits whenever the backend pushes an updated order status.
     * @remarks Subject is an RxJS event-stream. Other services/components can .subscribe()
     * to receive new values in realtime.
     * @remarks The $ suffix is the convention that marks a field as a stream/observable.
     */
    public updatedOrder$ = new Subject<Order>();

    /**
     * The URL of the backend SignalR hub.
     * @remarks The hub URL comes from environment, so dev and prod point at their own apiUrl.
     * @remarks This URL must match app.MapHub<ShopboxHub>(...) in the backend's Program.cs.
     */
    private readonly apiSignalRHubUrl = `${environment.apiUrl}/SignalR/Hubs/ShopboxHub`;

    /**
     * Builds the connection, wires up the event handlers, and opens it.
     * @returns void
     */
    public startConnection(): void {
        // Builds the SignalR connection.
        this.hubConnection = new signalR.HubConnectionBuilder()
            .withUrl(this.apiSignalRHubUrl, {
                withCredentials: true // Required when the backend allows credentials in its CORS policy.
            })
            .withAutomaticReconnect() // Re-establishes the connection automatically if it briefly drops.
            .configureLogging(signalR.LogLevel.Information) // Logs SignalR info to the browser console, useful for debugging.
            .build();

        // 'on' listens for an event from the backend hub.
        // The name must match the one the backend hub uses in Clients.All.SendAsync("ReceiveNewOrderNotification", order).
        this.hubConnection.on('ReceiveNewOrderNotification', (order: Order) => {
            console.log('SignalR received new order:', order);

            // Forward the order to every subscriber of newOrder$.
            this.newOrder$.next(order);
        });

        this.hubConnection.on('ReceiveOrderStatusUpdate', (order: Order) => {
            console.log('SignalR received order update:', order);

            this.updatedOrder$.next(order);
        });

        // Opens the connection itself.
        // '.then/.catch' handles success/failure of establishing the connection.
        this.hubConnection
            .start()
            .then(() => console.log('SignalR connected'))
            .catch((err: Error) => console.error('SignalR error:', err));
    }

    /**
     * Closes the connection if one is open.
     * @returns void
     */
    public stopConnection(): void {
        // '?.' ensures we only try to stop the connection if it was actually created.
        // Otherwise it would throw if stopConnection is called before startConnection.
        this.hubConnection?.stop();
    }
}
