import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Subject } from 'rxjs';
import { Order } from '../generated/orders';

@Injectable({ providedIn: 'root' })
export class SignalRService {
    private hubConnection!: signalR.HubConnection;

    // Subject fungerer som en event emitter
    // hvor komponenter kan subscribe for at modtage nye ordrer eller opdateringer på eksisterende ordrer i realtime.
    // $ i navnet bruges i Angular/RxJS for at vise, at feltet er en stream/observable.
    public newOrder$ = new Subject<Order>();
    public updatedOrder$ = new Subject<Order>();

    // URL til SignalR Hub'en i ASP.NET API'et
    private apiUrl = 'https://shopboxdisplay.azurewebsites.net/SignalR/Hubs/ShopboxHub';

    public startConnection(): void {
        // Opretter forbindelsen til SignalR Hub'en i ASP.NET API'et.
        // URL'en skal pege på samme route som app.MapHub<ShopboxHub>(...) i Program.cs i API'et.
        this.hubConnection = new signalR.HubConnectionBuilder()
            .withUrl(this.apiUrl, {
                // Kræves når backend tillader credentials i CORS-politikken.
                withCredentials: true
            })
            // SignalR prøver selv at forbinde igen, hvis forbindelsen kortvarigt ryger.
            .withAutomaticReconnect()
            // Giver mere information i browserens console om hvad der sker med SignalR forbindelsen, hvilket er nyttigt til fejlfinding.
            .configureLogging(signalR.LogLevel.Information)
            .build();

        // Lytter efter nye ordrer fra backend.
        // Backend sender denne event når webhook'en har oprettet en ny ordre.
        this.hubConnection.on('ReceiveNewOrderNotification', (order: Order) => {
            console.log('SignalR received new order:', order);
            // Sender ordren videre til de komponenter, der subscriber på newOrder$.
            this.newOrder$.next(order);
        });

        // Lytter efter statusændringer på eksisterende ordrer.
        // Backend sender denne event når en ordrestatus er blevet opdateret.
        this.hubConnection.on('ReceiveOrderStatusUpdate', (order: Order) => {
            console.log('SignalR received order update:', order);

            // Sender den opdaterede ordre videre til de komponenter, der subscriber på updatedOrder$.
            this.updatedOrder$.next(order);
        });

        // Starter selve SignalR-forbindelsen.
        this.hubConnection
            .start()
            .then(() => console.log('SignalR connected'))
            .catch(err => console.error('SignalR error:', err));
    }

    public stopConnection(): void {
        // Stopper forbindelsen når komponenten ikke længere skal bruge live updates.
        this.hubConnection?.stop();
    }
}
