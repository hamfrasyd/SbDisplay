import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Subject } from 'rxjs';
import { Order } from '../generated/orders';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SignalRService {
    // '!'-tegnet fortæller TypeScript at feltet bliver sat senere (i startConnection), så det ikke kræver init her.
    private hubConnection!: signalR.HubConnection;

    // Subject er en RxJS event-stream. Andre services/komponenter kan .subscribe() og modtage nye værdier i realtime.
    // Konventionen $ i navnet markerer at feltet er en stream/observable.
    public newOrder$ = new Subject<Order>();
    public updatedOrder$ = new Subject<Order>();

    // URL'en kommer fra environment, så dev og prod peger på hver sin backend uden kodeændring.
    private apiSignalRHubUrl = `${environment.apiUrl}/SignalR/Hubs/ShopboxHub`;

    public startConnection(): void {
        // Bygger SignalR-forbindelsen. URL'en skal matche app.MapHub<ShopboxHub>(...) i backendens Program.cs.
        this.hubConnection = new signalR.HubConnectionBuilder()
            .withUrl(this.apiSignalRHubUrl, {
                withCredentials: true // Kræves når backend tillader credentials i CORS-politikken.
            })
            .withAutomaticReconnect() // Genopretter forbindelsen automatisk hvis den kortvarigt ryger.
            .configureLogging(signalR.LogLevel.Information) // Logger SignalR-info i browserens console, nyttigt til fejlfinding.
            .build();

        // on lytter på en event fra backend. Navnet skal matche det navn, som backend bruger i Clients.All.SendAsync("ReceiveNewOrderNotification", order).
        this.hubConnection.on('ReceiveNewOrderNotification', (order: Order) => {
            console.log('SignalR received new order:', order);
            
            // Sender ordren videre til alle subscribers af newOrder$.
            this.newOrder$.next(order);
        });

        this.hubConnection.on('ReceiveOrderStatusUpdate', (order: Order) => {
            console.log('SignalR received order update:', order);
            
            this.updatedOrder$.next(order);
        });

        // Åbner selve forbindelsen. '.then/.catch' håndterer succes/fejl ved oprettelse af forbindelsen.
        this.hubConnection
            .start()
            .then(() => console.log('SignalR connected'))
            .catch(err => console.error('SignalR error:', err));
    }

    public stopConnection(): void {
        // '?.' sikrer at vi kun prøver at stoppe forbindelsen hvis den faktisk er oprettet.
        // Ellers ville det kaste en fejl hvis stopConnection kaldes før startConnection.
        this.hubConnection?.stop();
    }
}