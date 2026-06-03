import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { OrdersService, Order, UpdateOrderStatusRequest, OrderStatus } from '../generated/orders';
import { SignalRService } from './signalr.service';

/**
 * Holds the order list as reactive state: seeded once from the API, then kept live by SignalR.
 * 
 * @remarks Exposes read-only selectors and the status-update command.
 * @remarks 'providedIn: 'root'' means this service is a singleton and can be injected anywhere.
 */
@Injectable({ providedIn: 'root' })
export class OrderDisplayStateService {
    /**
     * Injects the OrdersService, which is the data-access layer.
     * @remarks 'inject(...)' is a dependency injection.
     * @remarks 'inject(...)' is the recommended way to inject services into components and services.
     */
    private readonly orderService = inject(OrdersService);
    /**
     * Injects the SignalRService, which is the realtime layer.
     * @remarks 'inject(...)' is a dependency injection.
     * @remarks 'inject(...)' is the recommended way to inject services into components and services.
     */
    private readonly signalRService = inject(SignalRService);

    /**
     * Private signal that holds an array of orders.
     * @remarks 'signal<Order[]>([])' is a signal that holds an array of orders.
     */
    private readonly _orders = signal<Order[]>([]);

    /**
     * Readonly signal that holds an array of orders.
     * @remarks 'this._orders.asReadonly()' is a readonly signal that holds an array of orders.
     */
    public readonly orders = this._orders.asReadonly();

    /**
     * Private signal that holds a string or null.
     * @remarks 'signal<string | null>(null)' is a signal that holds a string or null.
     * */
    private readonly _loadError = signal<string | null>(null);

    /**
     * Readonly signal that holds a string or null.
     * @remarks 'this._loadError.asReadonly()' is a readonly signal that holds a string or null.
     */
    public readonly loadError = this._loadError.asReadonly();

    /**
     * Private signal that tracks whether the initial orders fetch is still in flight.
     * @remarks Starts true because the constructor kicks off loadAllOrders immediately.
     */
    private readonly _isLoadingOrders = signal<boolean>(true);

    /**
     * Readonly signal that is true while orders are being fetched from the API.
     * @remarks Cleared on both success and failure so the UI can leave the loading state.
     */
    public readonly isLoadingOrders = this._isLoadingOrders.asReadonly();


    /**
     * Readonly signal that holds an array of orders that are preparing.
     * @remarks computed signals are derived signals, this signal is updated whenever the _orders signal is updated.
     * meaning only showing the filtered lists in the UI, so the components dont need to know about the filtering logic.
     */
    public readonly preparingOrders = computed(() => {
        return this._orders().filter(order => order.status === OrderStatus.UnderPreparation);
    });

    /**
     * Readonly signal that holds an array of orders that are ready for pickup.
     * @remakrs computed signals are derived signals, this signal is updated whenever the _orders signal is updated.
     * meaning only showing the filtered lists in the UI, so the components dont need to know about the filtering logic.
     */
    public readonly readyForPickupOrders = computed(() => {
        return this._orders().filter(order => order.status === OrderStatus.ReadyForPickup);
    });

    constructor() {
        this.loadAllOrders();
        this.registerSignalRSubscriptions();
        this.signalRService.startConnection();
    }

    /**
     * Loads all orders from the API and sets the _orders signal.
     */
    private loadAllOrders(): void {
        this._isLoadingOrders.set(true);

        this.orderService.getAllOrders().subscribe({
            // next is called when the API call is successful. Resembles promise.then(orders => { ... }) in javascript.
            next: orders => {
                this._loadError.set(null);
                this._orders.set(orders ?? []); // if orders is null, set it to an empty array.
                this._isLoadingOrders.set(false);
            },
            // error is called when the API call fails. Resembles promise.catch(error => { ... }) in javascript.
            error: error => {
                console.error('Failed to load orders:', error);
                this._loadError.set('Kunne ikke hente ordrer. Prøv at genindlæse siden.');
                this._isLoadingOrders.set(false);
            }
        });
    }

    /**
     * Registers the SignalR subscriptions for new orders and updated order statuses.
     */
    private registerSignalRSubscriptions(): void {
        // When SignalR receives a new order, it calls the upsertOrder method.
        this.signalRService.newOrder$.subscribe(newOrder => {
            this.upsertOrder(newOrder);
        });

        // When SignalR receives an updated order status, it calls the updateOrderStatusInList method.
        this.signalRService.updatedOrder$.subscribe(updatedOrder => {
            this.updateOrderStatusInList(updatedOrder);
        });
    }

    /**
     * Upserts an order into the list.
     * @remarks Upsert is a combination of update and insert.
     * If the order already exists, it is updated. If it doesn't exist, it is inserted.
     * @param incomingOrder The order to upsert.
     * @returns void
     */
    private upsertOrder(incomingOrder: Order): void {
        // Mutate the current orders signal. (References the same array as the one in the signal.)
        // This is fine because if we don't mutate it, Angular will NOT detect the change and the UI will not update.
        const currentOrders = this._orders();

        // transactionId is the unique key, because orderId can possibly repeat.
        const existingOrderIndex = currentOrders.findIndex(
            order => order.transactionId === incomingOrder.transactionId
        );

        // If the order doesn't exist, insert it.
        if (existingOrderIndex === -1) {
            this._orders.set([...currentOrders, incomingOrder]);
            return;
        }

        // Otherwise the order exists, update it.
        // map is used to create a new array with the updated order.
        // TODO new array because..?
        const updatedOrders = currentOrders.map((order, index) =>
            // If the order is the one we want to update, update it.
            // Otherwise keep the original order.
            // what '...' means
            // - create a new object with the properties of the original object and the properties of the incoming object.
            // - and overwrite the original properties with the incoming properties.
            index === existingOrderIndex ? { ...order, ...incomingOrder } : order
        );

        // Set the new array to the signal.
        this._orders.set(updatedOrders);
    }

    /**
     * Updates the status of an order in the list.
     * @param updatedOrder The order with the updated status.
     * @returns void
     */
    private updateOrderStatusInList(updatedOrder: Order): void {
        // Mutate the current orders signal.
        const updatedOrders = this._orders().map(order => {
            if (order.transactionId !== updatedOrder.transactionId) {
                return order;
            }

            // Create a new object with the properties of the original object
            // and only change the status property.
            return {
                ...order,
                status: updatedOrder.status
            };
        });

        // Set the new array to the signal.
        this._orders.set(updatedOrders);
    }

    /**
     * Updates the status of an order in the list.
     * @param transactionId The transactionId of the order to update the status of.
     * @param statusUpdateRequest The status to update the order to.
     * @returns An observable of the updated order.
     * @remarks Observable is a way to handle asynchronous operations in Angular.
     */
    public updateOrderStatus(transactionId: number, statusUpdateRequest: UpdateOrderStatusRequest): Observable<Order> {
        // 1. Call the orderService to update the status of the order in the API.
        // 2. Pipe the result to the updateOrderStatusInList method.
        //      - 'pipe' is used to chain the operations.
        //      - 'tap' is used to perform side effects. (in this case, update the order in _orders signal.)
        // 3. Return the observable.
        return this.orderService.updateOrderStatus(transactionId, statusUpdateRequest).pipe(
            tap(updatedOrder => {
                this.updateOrderStatusInList(updatedOrder);
            })
        );
    }
}
