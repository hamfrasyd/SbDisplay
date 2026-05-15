import { Inject, Injectable, NgZone, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, map, Observable, Subscription } from 'rxjs';
import { OrdersService, Order, UpdateOrderStatusRequest, OrderStatus } from '../generated/orders';
import { SignalRService } from './signalr.service';

@Injectable({ providedIn: 'root' })
export class OrderDisplayStateService {
    private ordersSubject = new BehaviorSubject<Order[]>([]);

    // orders$ er den fælles ordre-state, som både medarbejderdisplay og kundedisplay kan lytte på.
    public orders$: Observable<Order[]> = this.ordersSubject.asObservable();

    // Kundedisplayet bruger denne stream til at vise ordrer, der er under tilberedning.
    public preparingOrders$: Observable<Order[]> = this.orders$.pipe(
        map(orders => orders.filter(order => order.status === OrderStatus.UnderPreparation))
    );

    // Kundedisplayet bruger denne stream til at vise ordrer, der er klar til afhentning.
    public readyForPickupOrders$: Observable<Order[]> = this.orders$.pipe(
        map(orders => orders.filter(order => order.status === OrderStatus.ReadyForPickup))
    );

    private signalRSub: Subscription = new Subscription();
    private hasLoadedOrders = false;

    constructor(
        private orderService: OrdersService,
        private signalRService: SignalRService,
        private ngZone: NgZone,
        @Inject(PLATFORM_ID) platformId: object
    ) {
        this.loadOrders();
        if (isPlatformBrowser(platformId)) {
            this.registerSignalRSubscriptions();
            this.signalRService.startConnection();
        }
    }

    private loadOrders(): void {
        // Undgår at både medarbejderdisplay og kundedisplay henter samme ordredata flere gange.
        if (this.hasLoadedOrders) {
            return;
        }

        // Henter det nuværende ordre-overblik fra API'et.
        this.orderService.getAllOrders().subscribe(orders => {
            this.ordersSubject.next(orders ?? []);
        });
        this.hasLoadedOrders = true;
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

    public updateOrderStatus(transactionId: number, newStatus: UpdateOrderStatusRequest): void {
        this.orderService.updateOrderStatus(transactionId, newStatus).subscribe({
            next: updatedOrder => {
                this.ngZone.run(() => {
                    this.updateOrderStatusInList(updatedOrder);
                });

                console.log(`Order ${transactionId} status updated to ${newStatus.status}`);
            },
            error: err => {
                console.error(`Failed to update order ${transactionId} status:`, err);
            }
        });
    }
}
