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
            .withUrl('http://localhost:5180/SignalR/Hubs/ShopboxHub', {
                withCredentials: true
            })
            .withAutomaticReconnect()
            .configureLogging(signalR.LogLevel.Information)
            .build();

        this.hubConnection.on('ReceiveNewOrderNotification', (order: Order) => {
            console.log('SignalR received new order:', order);
            this.newOrder$.next(order);
        });

        this.hubConnection.on('ReceiveOrderStatusUpdate', (order: Order) => {
            console.log('SignalR received order update:', order);
            this.updatedOrder$.next(order);
        });

        this.hubConnection
            .start()
            .then(() => console.log('SignalR connected'))
            .catch(err => console.error('SignalR error:', err));
    }
    public stopConnection(): void {
        this.hubConnection?.stop();
    }
}