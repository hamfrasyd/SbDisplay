import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Subject } from 'rxjs';
import { Order } from '../generated/orders';

@Injectable({ providedIn: 'root' })
export class SignalRService {
    private hubConnection!: signalR.HubConnection;

    // Observable streams components can subscribe to
    public updatedOrder$ = new Subject<Order>();
    public newOrder$ = new Subject<Order>();

    public startConnection(): void {
        this.hubConnection = new signalR.HubConnectionBuilder()
            .withUrl('https://localhost:5180/SignalR/Hubs/ShopboxHub', {
                withCredentials: true
            })
            .withAutomaticReconnect()       // Auto-reconnect on drop
            .configureLogging(signalR.LogLevel.Information)
            .build();

        this.hubConnection
            .start()
            .then(() => console.log('SignalR connected'))
            .catch(err => console.error('SignalR error:', err));

        // Listen for server-pushed events
        this.hubConnection.on('ReceiveNewOrderNotification', (order: Order) => {
            this.newOrder$.next(order);
        });

        this.hubConnection.on('ReceiveOrderStatusUpdate', (order: Order) => {
            this.updatedOrder$.next(order);
        });
    }

    public stopConnection(): void {
        this.hubConnection?.stop();
    }
}