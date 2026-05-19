import { Inject, Injectable, PLATFORM_ID, computed, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { OrdersService, Order, UpdateOrderStatusRequest, OrderStatus } from '../generated/orders';
import { SignalRService } from './signalr.service';

@Injectable({ providedIn: 'root' })
export class OrderDisplayStateService {
  private readonly _orders = signal<Order[]>([]);

  public readonly orders = this._orders.asReadonly();

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
    this.loadOrders();

    if (isPlatformBrowser(platformId)) {
      this.registerSignalRSubscriptions();
      this.signalRService.startConnection();
    }
  }

  private loadOrders(): void {
    this.orderService.getAllOrders().subscribe({
      next: orders => {
        this._orders.set(orders ?? []);
      },
      error: err => {
        console.error('Failed to load orders:', err);
      }
    });
  }

  private registerSignalRSubscriptions(): void {
    this.signalRService.newOrder$.subscribe(newOrder => {
      this.upsertOrder(newOrder);
    });

    this.signalRService.updatedOrder$.subscribe(updatedOrder => {
      this.updateOrderStatusInList(updatedOrder);
    });
  }

  private upsertOrder(incomingOrder: Order): void {
    const currentOrders = this._orders();
    const existingIndex = currentOrders.findIndex(
      order => order.transactionId === incomingOrder.transactionId
    );

    if (existingIndex === -1) {
      // Order is genuinely new — append it
      this._orders.set([...currentOrders, incomingOrder]);
    } else {
      const updatedOrders = currentOrders.map((order, index) =>
        index === existingIndex ? { ...order, ...incomingOrder } : order
      );
      this._orders.set(updatedOrders);
    }
  }

  private updateOrderStatusInList(updatedOrder: Order): void {
    const updatedOrders = this._orders().map(order => {
      if (order.transactionId !== updatedOrder.transactionId) {
        return order;
      }
      return {
        ...order,
        status: updatedOrder.status
      };
    });
    this._orders.set(updatedOrders);
  }

  public updateOrderStatus(transactionId: number, newStatus: UpdateOrderStatusRequest): void {
    this.orderService.updateOrderStatus(transactionId, newStatus).subscribe({
      next: updatedOrder => {
        this.updateOrderStatusInList(updatedOrder);
        console.log(`Order ${transactionId} status updated to ${newStatus.status}`);
      },
      error: err => {
        console.error(`Failed to update order ${transactionId} status:`, err);
      }
    });
  }
}