import { Component, computed, signal } from '@angular/core';
import { OrderDisplayStateService } from '../../services/order-display-state.service';
import { Order, OrderStatus } from '../../generated/orders';
import { DatePipe } from '@angular/common';

enum EmployeeTab {
  Received = 'Received',
  Completed = 'completed'
}

@Component({
    selector: 'app-employee-display',
    imports: [DatePipe],
    templateUrl: './employee-display.html',
    styleUrl: './employee-display.css',
})
export class EmployeeDisplay {
    public readonly orderStatus = OrderStatus;
    public readonly employeeTab = EmployeeTab;

    public readonly activeTab = signal<EmployeeTab>(EmployeeTab.Received);
    public readonly cardErrors = signal<Map<number, string>>(new Map());
    public readonly pageError = signal<string | null>(null);

    // Swipe state - only one card can be swiped at a time.
    // pendingSwipeTransactionId is a plain field (not a signal) intentionally:
    // updating a signal on every pointerdown triggers Angular re-renders mid-dblclick,
    // which breaks browser dblclick detection across all input types.
    public readonly swipingTransactionId = signal<number | null>(null);
    public readonly swipeDeltaX = signal<number>(0);

    private swipeStartX: number = 0;
    private pendingSwipeTransactionId: number | null = null;
    private readonly swipeThresholdPixels: number = 100;
    private readonly movementThresholdPixels: number = 5;

    public readonly receivedOrders = computed(() => {
        return this.orderDisplayState.orders().filter(order => order.status === OrderStatus.UnderPreparation || order.status === OrderStatus.ReadyForPickup);
    });

    public readonly completedOrders = computed(() => {
        return this.orderDisplayState.orders().filter(order => order.status === OrderStatus.Completed);
    });

    public readonly currentlyDisplayedOrders = computed(() => {
        if (this.activeTab() === EmployeeTab.Received) {
            return this.receivedOrders();
        }
        return this.completedOrders();
    });

    constructor(public orderDisplayState: OrderDisplayStateService) { }

    public setActiveTab(tab: EmployeeTab): void {
        this.activeTab.set(tab);
    }

    public clearPageError(): void {
        this.pageError.set(null);
    }

    public onCardDoubleClick(order: Order): void {
        if (order.status === OrderStatus.UnderPreparation) {
            this.setStatus(order, OrderStatus.ReadyForPickup);
            return;
        }

        if (order.status === OrderStatus.ReadyForPickup) {
            this.setStatus(order, OrderStatus.Completed);
            return;
        }
    }

    public onChangeStatus(order: Order, newStatus: OrderStatus): void {
        this.setStatus(order, newStatus);
    }

    public isSwipeable(order: Order): boolean {
        return order.status === OrderStatus.ReadyForPickup;
    }

    public isCurrentlySwiping(order: Order): boolean {
        return this.swipingTransactionId() === order.transactionId;
    }

    public getSwipeTransform(order: Order): string | null {
        if (this.swipingTransactionId() !== order.transactionId) {
            return null;
        }
        return `translateX(${this.swipeDeltaX()}px)`;
    }

    public onPointerDown(event: PointerEvent, order: Order): void {
        if (this.isSwipeable(order) === false) {
            return;
        }

        if (order.transactionId === undefined || order.transactionId === null) {
            return;
        }

        // Record start position only — no signal updates, no setPointerCapture.
        // Signals and capture are deferred to onPointerMove once horizontal movement is confirmed,
        // so that taps and dblclicks are completely unaffected by the swipe setup.
        this.swipeStartX = event.clientX;
        this.pendingSwipeTransactionId = order.transactionId;
    }

    public onPointerMove(event: PointerEvent, order: Order): void {
        if (this.pendingSwipeTransactionId === null) {
            return;
        }

        const deltaX = event.clientX - this.swipeStartX;

        // Commit to swipe only once horizontal movement is confirmed.
        // This is the first point where we update signals or capture the pointer.
        if (this.swipingTransactionId() === null && Math.abs(deltaX) > this.movementThresholdPixels) {
            this.swipingTransactionId.set(this.pendingSwipeTransactionId);
            (event.currentTarget as Element).setPointerCapture(event.pointerId);
        }

        if (this.swipingTransactionId() !== null && deltaX < 0) {
            this.swipeDeltaX.set(deltaX);
        }
    }

    public onPointerEnd(_event: PointerEvent, order: Order): void {
        const wasActiveSwipe = this.swipingTransactionId() !== null;
        const finalDeltaX = this.swipeDeltaX();

        this.pendingSwipeTransactionId = null;
        this.swipingTransactionId.set(null);
        this.swipeDeltaX.set(0);

        if (wasActiveSwipe && Math.abs(finalDeltaX) >= this.swipeThresholdPixels) {
            this.setStatus(order, OrderStatus.UnderPreparation);
        }
    }

    private setStatus(order: Order, newStatus: OrderStatus): void {
        const transactionId = order.transactionId;

        if (transactionId === undefined || transactionId === null) {
            this.pageError.set('Kan ikke opdatere ordre uden transactionId.');
            return;
        }

        this.orderDisplayState.updateOrderStatus(transactionId, { status: newStatus }).subscribe({
            next: () => this.clearCardError(transactionId),
            error: () => this.setCardError(transactionId, 'Kunne ikke opdatere status. Prøv igen.')
        });
    }

    private setCardError(transactionId: number, message: string): void {
        const next = new Map(this.cardErrors());
        next.set(transactionId, message);
        this.cardErrors.set(next);
    }

    private clearCardError(transactionId: number): void {
        const current = this.cardErrors();

        if (current.has(transactionId)) {
            const next = new Map(current);
            next.delete(transactionId);
            this.cardErrors.set(next);
        }
    }
}