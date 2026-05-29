import { Inject, Injectable, PLATFORM_ID, computed, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, tap } from 'rxjs';
import { OrdersService, Order, UpdateOrderStatusRequest, OrderStatus } from '../generated/orders';
import { SignalRService } from './signalr.service';

// providedIn: 'root' gør servicen til en singleton. Konstruktøren kører kun én gang i appens levetid.
@Injectable({ providedIn: 'root' })
export class OrderDisplayStateService {
    // En 'signal' er Angulars måde at holde reaktiv state. Altså, når værdien ændres, opdaterer templates der læser den sig automatisk.
    // _orders er privat, så kun denne service kan ændre listen.
    private readonly _orders = signal<Order[]>([]);

    // Readonly view udadtil. Komponenter kan læse, men ikke kalde for eksmpel .set() på listen.
    public readonly orders = this._orders.asReadonly();

    // computed() er en afledt værdi baseret på andre signaler. Den opdateres automatisk når _orders ændres.
    // Dvs. preparingOrders og readyForPickupOrders er altid i sync med _orders fordi _orders er en signal, og computed() lytter på den.
    // viser kun de filtrerede lister i UI'et, så komponenterne ikke behøver at gøre det.
    public readonly preparingOrders = computed(() => {
        return this._orders().filter(order => order.status === OrderStatus.UnderPreparation);
    });
    public readonly readyForPickupOrders = computed(() => {
        return this._orders().filter(order => order.status === OrderStatus.ReadyForPickup);
    });

    constructor(
        private orderService: OrdersService,
        private signalRService: SignalRService,
        @Inject(PLATFORM_ID) platformId: object
    ) {
        this.loadAllOrders();

        // PLATFORM_ID fortæller om koden kører i browseren eller på serveren (SSR).
        // SignalR skal kun startes i browseren.. der er ingen rigtig klient at sende live-updates til under SSR.
        if (isPlatformBrowser(platformId)) {
            this.registerSignalRSubscriptions();
            this.signalRService.startConnection();
        }
    }

    private loadAllOrders(): void {
        this.orderService.getAllOrders().subscribe({
            // next er den callback der håndterer det succesfulde svar fra backend. Lidt ligesom promise .then() i JavaScript.
            next: orders => {
                // ?? [] sikrer at vi aldrig sætter null som værdi for _orders,
                // dvs. hvis backend returnerer null, bliver det til en tom liste i UI'et i stedet for fejl.
                this._orders.set(orders ?? []);
            },
            error: err => {
                console.error('Failed to load orders:', err);
            }
        });
    }

    private registerSignalRSubscriptions(): void {
        // Når SignalR pusher en ny ordre, tilføjes den til state-listen (_orders)
        this.signalRService.newOrder$.subscribe(newOrder => {
            this.upsertOrder(newOrder);
        });

        // Når SignalR pusher en statusopdatering, opdateres den tilsvarende ordre i state-listen (_orders).
        this.signalRService.updatedOrder$.subscribe(updatedOrder => {
            this.updateOrderStatusInList(updatedOrder);
        });
    }

    private upsertOrder(incomingOrder: Order): void {
    // Laver currenOrders på grund af mutation. Må hellst ikke ændre det eksisterende array direkte, fordi Angular ikke kan opdage det (referencen ændres ikke).
        const currentOrders = this._orders();

    // TransactionId bruges som unik nøgle, fordi OrderId potentielt kan gentage sig.
    const existingOrderIndex = currentOrders.findIndex(
      order => order.transactionId === incomingOrder.transactionId
    );

    if (existingOrderIndex === -1) {
      // Order is genuinely new — append it
      this._orders.set([...currentOrders, incomingOrder]);
    } else {
      const updatedOrders = currentOrders.map((order, index) =>
        index === existingOrderIndex ? { ...order, ...incomingOrder } : order
      );
      this._orders.set(updatedOrders);
    }
  }

    private updateOrderStatusInList(updatedOrder: Order): void {
        // Opdatere kun status.
        const updatedOrders = this._orders().map(order => {
            if (order.transactionId !== updatedOrder.transactionId) {
                return order;
            }

            return {
                ...order, // '...order' betyder at vi laver en kopi af den eksisterende ordre og sætter den nye status værdi.
                status: updatedOrder.status
            };
        });

        this._orders.set(updatedOrders);
    }

    public updateOrderStatus(transactionId: number, statusUpdateRequest: UpdateOrderStatusRequest): Observable<Order> {
        return this.orderService.updateOrderStatus(transactionId, statusUpdateRequest).pipe(
            tap(updatedOrder => {
                this.updateOrderStatusInList(updatedOrder);
            })
        );
    }
}