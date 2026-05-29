import { ChangeDetectorRef, Component, computed, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { fromEvent, map, startWith } from 'rxjs';
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
    public readonly errorMessageByTransactionId = signal<Map<number, string>>(new Map());
    public readonly pageErrorMessage = signal<string | null>(null);
    public readonly expandedCardTransactionIds = signal<Set<number>>(new Set());

    private readonly maxPreviewItemCount = 4;

    private readonly responsiveColumnCount = toSignal(
        fromEvent(window, 'resize').pipe(
            startWith(null),
            map((): number => {
                const viewportWidthPixels = window.innerWidth;
                if (viewportWidthPixels >= 1200) return 4;
                if (viewportWidthPixels >= 992) return 3;
                if (viewportWidthPixels >= 768) return 2;
                return 1;
            })
        ),
        { initialValue: 4 }
    );

    public readonly ordersDistributedIntoColumns = computed(() => {
        const ordersToDisplay = this.currentlyDisplayedOrders();
        const columnCount = this.responsiveColumnCount() ?? 4;
        const columns: Order[][] = Array.from({ length: columnCount }, () => []);
        ordersToDisplay.forEach((order, orderIndex) => columns[orderIndex % columnCount].push(order));
        return columns;
    });

    // Swipe state - only one card can be swiped at a time.
    // pendingSwipeTransactionId is a plain field (not a signal) intentionally:
    // updating a signal on every pointerdown triggers Angular re-renders mid-dblclick,
    // which breaks browser dblclick detection across all input types.
    public readonly activeSwipeTransactionId = signal<number | null>(null);
    public readonly swipeHorizontalOffsetPixels = signal<number>(0);

    private swipeStartPointerX: number = 0;
    private pendingSwipeTransactionId: number | null = null;
    private readonly swipeRevertThresholdPixels: number = 100;
    private readonly swipeActivationThresholdPixels: number = 5;

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

    public readonly currentTimestampMs = signal(Date.now());

    constructor(public orderDisplayState: OrderDisplayStateService, private cdr: ChangeDetectorRef) { 
        setInterval(() => {
            this.currentTimestampMs.set(Date.now());
            this.cdr.detectChanges();
        }, 60000);
    }

    public getElapsedMinutesSinceCreation(order: Order): string {
    if (!order.creationTime) {
        return '0 min';
    }

    const creationTimestampMs = new Date(order.creationTime).getTime();
    const elapsedMinutes = Math.floor((this.currentTimestampMs() - creationTimestampMs) / 1000 / 60);

    return `${elapsedMinutes} min`;
}

public isOlderThanFiveMinutes(order: Order): boolean {
    if (!order.creationTime) {
        return false;
    }

    const creationTimestampMs = new Date(order.creationTime).getTime();
    const elapsedMinutes = Math.floor((this.currentTimestampMs() - creationTimestampMs) / 1000 / 60);

    return elapsedMinutes >= 5;
}

    public setActiveTab(tab: EmployeeTab): void {
        this.activeTab.set(tab);
    }

    public clearPageErrorMessage(): void {
        this.pageErrorMessage.set(null);
    }

    public onCardDoubleClick(order: Order): void {
        if (order.status === OrderStatus.UnderPreparation) {
            this.requestOrderStatusUpdate(order, OrderStatus.ReadyForPickup);
            return;
        }

        if (order.status === OrderStatus.ReadyForPickup) {
            this.requestOrderStatusUpdate(order, OrderStatus.Completed);
            return;
        }
    }

    public onChangeStatus(order: Order, newStatus: OrderStatus): void {
        this.requestOrderStatusUpdate(order, newStatus);
    }

    public isSwipeable(order: Order): boolean {
        return order.status === OrderStatus.ReadyForPickup;
    }

    public isCurrentlySwiping(order: Order): boolean {
        return this.activeSwipeTransactionId() === order.transactionId;
    }

    public isCardExpanded(order: Order): boolean {
        return order.transactionId != null && this.expandedCardTransactionIds().has(order.transactionId);
    }

    public toggleCardExpanded(order: Order, event: Event): void {
        event.stopPropagation();
        const transactionId = order.transactionId;
        if (transactionId == null) return;

        const updatedExpandedTransactionIds = new Set(this.expandedCardTransactionIds());
        if (updatedExpandedTransactionIds.has(transactionId)) {
            updatedExpandedTransactionIds.delete(transactionId);
        } else {
            updatedExpandedTransactionIds.add(transactionId);
        }
        this.expandedCardTransactionIds.set(updatedExpandedTransactionIds);
    }

    public getVisibleOrderItems(order: Order) {
        if (!order.items?.length) return [];
        if (this.isCardExpanded(order)) return order.items;
        return order.items.slice(0, this.maxPreviewItemCount);
    }

    public getHiddenItemCount(order: Order): number {
        if (!order.items?.length) return 0;
        return Math.max(0, order.items.length - this.maxPreviewItemCount);
    }

    public getSwipeTransform(order: Order): string | null {
        if (this.activeSwipeTransactionId() !== order.transactionId) {
            return null;
        }
        return `translateX(${this.swipeHorizontalOffsetPixels()}px)`;
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
        this.swipeStartPointerX = event.clientX;
        this.pendingSwipeTransactionId = order.transactionId;
    }

    public onPointerMove(event: PointerEvent, order: Order): void {
        if (this.pendingSwipeTransactionId === null) {
            return;
        }

        const horizontalOffsetPixels = event.clientX - this.swipeStartPointerX;

        // Commit to swipe only once horizontal movement is confirmed.
        // This is the first point where we update signals or capture the pointer.
        if (this.activeSwipeTransactionId() === null && Math.abs(horizontalOffsetPixels) > this.swipeActivationThresholdPixels) {
            this.activeSwipeTransactionId.set(this.pendingSwipeTransactionId);
            (event.currentTarget as Element).setPointerCapture(event.pointerId);
        }

        if (this.activeSwipeTransactionId() !== null && horizontalOffsetPixels < 0) {
            this.swipeHorizontalOffsetPixels.set(horizontalOffsetPixels);
        }
    }

    public onPointerEnd(_event: PointerEvent, order: Order): void {
        const hadActiveSwipe = this.activeSwipeTransactionId() !== null;
        const finalHorizontalOffsetPixels = this.swipeHorizontalOffsetPixels();

        this.pendingSwipeTransactionId = null;
        this.activeSwipeTransactionId.set(null);
        this.swipeHorizontalOffsetPixels.set(0);

        if (hadActiveSwipe && Math.abs(finalHorizontalOffsetPixels) >= this.swipeRevertThresholdPixels) {
            this.requestOrderStatusUpdate(order, OrderStatus.UnderPreparation);
        }
    }

    private requestOrderStatusUpdate(order: Order, newStatus: OrderStatus): void {
        const transactionId = order.transactionId;

        if (transactionId === undefined || transactionId === null) {
            this.pageErrorMessage.set('Kan ikke opdatere ordre uden transactionId.');
            return;
        }

        this.orderDisplayState.updateOrderStatus(transactionId, { status: newStatus }).subscribe({
            next: () => this.clearCardErrorMessage(transactionId),
            error: () => this.setCardErrorMessage(transactionId, 'Kunne ikke opdatere status. Prøv igen.')
        });
    }

    private setCardErrorMessage(transactionId: number, message: string): void {
        const updatedErrorMessagesByTransactionId = new Map(this.errorMessageByTransactionId());
        updatedErrorMessagesByTransactionId.set(transactionId, message);
        this.errorMessageByTransactionId.set(updatedErrorMessagesByTransactionId);
    }

    private clearCardErrorMessage(transactionId: number): void {
        const currentErrorMessagesByTransactionId = this.errorMessageByTransactionId();

        if (currentErrorMessagesByTransactionId.has(transactionId)) {
            const updatedErrorMessagesByTransactionId = new Map(currentErrorMessagesByTransactionId);
            updatedErrorMessagesByTransactionId.delete(transactionId);
            this.errorMessageByTransactionId.set(updatedErrorMessagesByTransactionId);
        }
    }
}
