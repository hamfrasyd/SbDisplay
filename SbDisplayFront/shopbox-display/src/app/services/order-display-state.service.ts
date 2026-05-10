import { Inject, Injectable, NgZone, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, map, Observable, Subscription } from 'rxjs';
import { OrdersService, Order } from '../generated/orders';
import { SignalRService } from './signalr.service';

@Injectable({ providedIn: 'root' })
export class OrderDisplayStateService {
    private ordersSubject = new BehaviorSubject<Order[]>([]);

    // orders$ er den fælles ordre-state, som både medarbejderdisplay og kundedisplay kan lytte på.
    public orders$: Observable<Order[]> = this.ordersSubject.asObservable();

    // Kundedisplayet bruger denne stream til at vise ordrer, der er under tilberedning.
    public preparingOrders$: Observable<Order[]> = this.orders$.pipe(
        map(orders => orders.filter(order => this.hasStatus(order, 'UnderPreparation')))
    );

    // Kundedisplayet bruger denne stream til at vise ordrer, der er klar til afhentning.
    public readyForPickupOrders$: Observable<Order[]> = this.orders$.pipe(
        map(orders => orders.filter(order => this.hasStatus(order, 'ReadyForPickup')))
    );

    private signalRSub: Subscription = new Subscription();
    private isBrowser: boolean;
    private hasLoadedOrders = false;
    private hasStartedLiveUpdates = false;

    constructor(
        private orderService: OrdersService,
        private signalRService: SignalRService,
        private ngZone: NgZone,
        @Inject(PLATFORM_ID) platformId: object
    ) {
        // PLATFORM_ID fortæller om Angular-koden kører i browseren eller på serveren.
        // Det er relevant fordi projektet bruger SSR/hydration.
        this.isBrowser = isPlatformBrowser(platformId);
    }

    public initialize(): void {
        this.loadOrders();

        // SignalR skal kun startes i browseren.
        // Under SSR findes der ikke en rigtig browserklient, som skal modtage live updates.
        if (!this.isBrowser) {
            return;
        }

        this.startLiveUpdates();
    }

    private loadOrders(): void {
        // Undgår at både medarbejderdisplay og kundedisplay henter samme ordredata flere gange.
        if (this.hasLoadedOrders) {
            return;
        }

        this.hasLoadedOrders = true;

        // Henter det nuværende ordre-overblik fra API'et.
        this.orderService.getAllOrders().subscribe(orders => {
            this.ordersSubject.next(orders ?? []);
        });
    }

    private startLiveUpdates(): void {
        // Undgår at flere komponenter opretter flere SignalR subscriptions og forbindelser.
        if (this.hasStartedLiveUpdates) {
            return;
        }

        this.hasStartedLiveUpdates = true;
        this.registerSignalRSubscriptions();
        this.signalRService.startConnection();
    }

    private registerSignalRSubscriptions(): void {
        // Lytter efter nye ordrer fra SignalRService.
        this.signalRSub.add(
            this.signalRService.newOrder$.subscribe(newOrder => {
                console.log('OrderDisplayStateService received new order:', newOrder);

                // SignalR-callbacks kan komme udenfor Angulars change detection.
                // NgZone.run flytter state-opdateringen ind i Angular igen, så UI'et kan opdatere uden detectChanges().
                this.ngZone.run(() => {
                    this.addOrderToList(newOrder);
                });
            })
        );

        // Lytter efter statusopdateringer fra SignalRService.
        this.signalRSub.add(
            this.signalRService.updatedOrder$.subscribe(updatedOrder => {
                console.log('OrderDisplayStateService received updated order:', updatedOrder);

                // NgZone bruges her af samme grund som ved nye ordrer.
                // Når state ændres inde i Angulars zone, kan async pipe opdatere template automatisk.
                this.ngZone.run(() => {
                    this.updateOrderStatusInList(updatedOrder);
                });
            })
        );
    }

    private addOrderToList(newOrder: Order): void {
        const currentOrders = this.ordersSubject.value;

        // TransactionId bruges som unik nøgle, fordi OrderId'et potentielt kan gentage sig.
        const orderAlreadyExists = currentOrders.some(order =>
            order.transactionId === newOrder.transactionId
        );

        if (orderAlreadyExists) {
            return;
        }

        // Opretter et nyt array, så Angular tydeligt kan se, at listen er ændret.
        this.ordersSubject.next([...currentOrders, newOrder]);
    }

    private updateOrderStatusInList(updatedOrder: Order): void {
        const currentOrders = this.ordersSubject.value;

        // SignalR-opdateringen indeholder kun delvis ordredata.
        // Derfor opdateres kun status, så vi ikke overskriver fx items eller creationTime.
        const updatedOrders = currentOrders.map(order => {
            if (order.transactionId !== updatedOrder.transactionId) {
                return order;
            }

            return {
                ...order,
                status: updatedOrder.status
            };
        });

        this.ordersSubject.next(updatedOrders);
    }

    private hasStatus(order: Order, status: string): boolean {
        // Forventer at backend sender enum-værdier som tekst, fx "UnderPreparation".
        return String(order.status) === status;
    }
}
