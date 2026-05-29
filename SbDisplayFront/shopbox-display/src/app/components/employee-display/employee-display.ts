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
    public readonly orderStatusEnum = OrderStatus;
    public readonly employeeTabEnum = EmployeeTab;

    public readonly activeEmployeeTab = signal<EmployeeTab>(EmployeeTab.Received);
    public readonly errorMessageByOrderTransactionId = signal<Map<number, string>>(new Map());
    public readonly pageLevelErrorMessage = signal<string | null>(null);
    public readonly expandedOrderCardTransactionIds = signal<Set<number>>(new Set());

    private readonly maximumPreviewOrderItemCount = 4;

    private readonly responsiveOrderColumnCount = toSignal(
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

    public readonly ordersDistributedIntoResponsiveColumns = computed(() => {
        const ordersToDisplay = this.currentlyDisplayedOrders();
        const responsiveColumnCount = this.responsiveOrderColumnCount() ?? 4;
        const orderColumns: Order[][] = Array.from({ length: responsiveColumnCount }, () => []);
        ordersToDisplay.forEach((order, orderIndex) => orderColumns[orderIndex % responsiveColumnCount].push(order));
        return orderColumns;
    });

    // Swipe state - only one card can be swiped at a time.
    // transactionIdOfOrderBeingEvaluatedForSwipe is a plain field (not a signal) intentionally:
    // updating a signal on every touch-down triggers Angular re-renders mid-double-tap,
    // which breaks browser double-tap detection across mouse, touch and pen input.
    public readonly activelySwipedOrderTransactionId = signal<number | null>(null);
    public readonly swipeHorizontalOffsetPixels = signal<number>(0);

    // Where the finger/mouse first touched down (horizontal screen position), so we can measure how far it has dragged.
    private dragStartHorizontalScreenPositionInPixels: number = 0;
    // The order being checked for a swipe gesture — set on touch-down, before we know it's a real swipe and not a tap.
    private transactionIdOfOrderBeingEvaluatedForSwipe: number | null = null;
    // The user must drag the card left at least this far before releasing for the order to be sent back to preparation.
    private readonly minimumDragDistanceToRevertOrderInPixels: number = 100;
    // The finger/mouse must move at least this far before we treat the gesture as a swipe instead of a tap/double-tap.
    private readonly minimumDragDistanceToCountAsSwipeInPixels: number = 5;

    public readonly receivedOrders = computed(() => {
        return this.orderDisplayState.orders().filter(order => order.status === OrderStatus.UnderPreparation || order.status === OrderStatus.ReadyForPickup);
    });

    public readonly completedOrders = computed(() => {
        return this.orderDisplayState.orders().filter(order => order.status === OrderStatus.Completed);
    });

    public readonly currentlyDisplayedOrders = computed(() => {
        if (this.activeEmployeeTab() === EmployeeTab.Received) {
            return this.receivedOrders();
        }
        return this.completedOrders();
    });

    public readonly currentTimestampMilliseconds = signal(Date.now());

    constructor(public orderDisplayState: OrderDisplayStateService, private changeDetectorRef: ChangeDetectorRef) {
        setInterval(() => {
            this.currentTimestampMilliseconds.set(Date.now());
            this.changeDetectorRef.detectChanges();
        }, 60000);
    }

    public getElapsedMinutesSinceOrderCreationLabel(order: Order): string {
        if (!order.creationTime) {
            return '0 min';
        }

        const orderCreationTimestampMilliseconds = new Date(order.creationTime).getTime();
        const elapsedMinutesSinceOrderCreation = Math.floor((this.currentTimestampMilliseconds() - orderCreationTimestampMilliseconds) / 1000 / 60);

        return `${elapsedMinutesSinceOrderCreation} min`;
    }

    public isOrderOlderThanFiveMinutes(order: Order): boolean {
        if (!order.creationTime) {
            return false;
        }

        const orderCreationTimestampMilliseconds = new Date(order.creationTime).getTime();
        const elapsedMinutesSinceOrderCreation = Math.floor((this.currentTimestampMilliseconds() - orderCreationTimestampMilliseconds) / 1000 / 60);

        return elapsedMinutesSinceOrderCreation >= 5;
    }

    public setActiveEmployeeTab(employeeTab: EmployeeTab): void {
        this.activeEmployeeTab.set(employeeTab);
    }

    public clearPageLevelErrorMessage(): void {
        this.pageLevelErrorMessage.set(null);
    }

    public onOrderCardDoubleClick(order: Order): void {
        if (order.status === OrderStatus.UnderPreparation) {
            this.requestOrderStatusUpdate(order, OrderStatus.ReadyForPickup);
            return;
        }

        if (order.status === OrderStatus.ReadyForPickup) {
            this.requestOrderStatusUpdate(order, OrderStatus.Completed);
            return;
        }
    }

    public onChangeOrderStatus(order: Order, newOrderStatus: OrderStatus): void {
        this.requestOrderStatusUpdate(order, newOrderStatus);
    }

    public isOrderSwipeable(order: Order): boolean {
        return order.status === OrderStatus.ReadyForPickup;
    }

    public isOrderCurrentlySwiping(order: Order): boolean {
        return this.activelySwipedOrderTransactionId() === order.transactionId;
    }

    public isOrderCardExpanded(order: Order): boolean {
        return order.transactionId != null && this.expandedOrderCardTransactionIds().has(order.transactionId);
    }

    public toggleOrderCardExpanded(order: Order, event: Event): void {
        event.stopPropagation();
        const transactionId = order.transactionId;
        if (transactionId == null) return;

        const updatedExpandedOrderCardTransactionIds = new Set(this.expandedOrderCardTransactionIds());
        if (updatedExpandedOrderCardTransactionIds.has(transactionId)) {
            updatedExpandedOrderCardTransactionIds.delete(transactionId);
        } else {
            updatedExpandedOrderCardTransactionIds.add(transactionId);
        }
        this.expandedOrderCardTransactionIds.set(updatedExpandedOrderCardTransactionIds);
    }

    public getVisibleOrderItems(order: Order) {
        if (!order.items?.length) return [];
        if (this.isOrderCardExpanded(order)) return order.items;
        return order.items.slice(0, this.maximumPreviewOrderItemCount);
    }

    public getHiddenOrderItemCount(order: Order): number {
        if (!order.items?.length) return 0;
        return Math.max(0, order.items.length - this.maximumPreviewOrderItemCount);
    }

    public getSwipeTransformStyle(order: Order): string | null {
        if (this.activelySwipedOrderTransactionId() !== order.transactionId) {
            return null;
        }
        return `translateX(${this.swipeHorizontalOffsetPixels()}px)`;
    }

    public onSwipePointerDown(event: PointerEvent, order: Order): void {
        if (this.isOrderSwipeable(order) === false) {
            return;
        }

        if (order.transactionId === undefined || order.transactionId === null) {
            return;
        }

        // Record start position only — no signal updates, no setPointerCapture.
        // Signals and capture are deferred to onSwipePointerMove once horizontal movement is confirmed,
        // so that taps and dblclicks are completely unaffected by the swipe setup.
        this.dragStartHorizontalScreenPositionInPixels = event.clientX;
        this.transactionIdOfOrderBeingEvaluatedForSwipe = order.transactionId;
    }

    public onSwipePointerMove(event: PointerEvent, order: Order): void {
        if (this.transactionIdOfOrderBeingEvaluatedForSwipe === null) {
            return;
        }

        const swipeHorizontalOffsetPixels = event.clientX - this.dragStartHorizontalScreenPositionInPixels;

        // Commit to swipe only once horizontal movement is confirmed.
        // This is the first point where we update signals or capture the pointer.
        if (this.activelySwipedOrderTransactionId() === null && Math.abs(swipeHorizontalOffsetPixels) > this.minimumDragDistanceToCountAsSwipeInPixels) {
            this.activelySwipedOrderTransactionId.set(this.transactionIdOfOrderBeingEvaluatedForSwipe);
            (event.currentTarget as Element).setPointerCapture(event.pointerId);
        }

        if (this.activelySwipedOrderTransactionId() !== null && swipeHorizontalOffsetPixels < 0) {
            this.swipeHorizontalOffsetPixels.set(swipeHorizontalOffsetPixels);
        }
    }

    public onSwipePointerEnd(_event: PointerEvent, order: Order): void {
        const wasOrderActivelySwiped = this.activelySwipedOrderTransactionId() !== null;
        const finalSwipeHorizontalOffsetPixels = this.swipeHorizontalOffsetPixels();

        this.transactionIdOfOrderBeingEvaluatedForSwipe = null;
        this.activelySwipedOrderTransactionId.set(null);
        this.swipeHorizontalOffsetPixels.set(0);

        if (wasOrderActivelySwiped && Math.abs(finalSwipeHorizontalOffsetPixels) >= this.minimumDragDistanceToRevertOrderInPixels) {
            this.requestOrderStatusUpdate(order, OrderStatus.UnderPreparation);
        }
    }

    private requestOrderStatusUpdate(order: Order, newOrderStatus: OrderStatus): void {
        const transactionId = order.transactionId;

        if (transactionId === undefined || transactionId === null) {
            this.pageLevelErrorMessage.set('Kan ikke opdatere ordre uden transactionId.');
            return;
        }

        this.orderDisplayState.updateOrderStatus(transactionId, { status: newOrderStatus }).subscribe({
            next: () => this.clearOrderCardErrorMessage(transactionId),
            error: () => this.setOrderCardErrorMessage(transactionId, 'Kunne ikke opdatere status. Prøv igen.')
        });
    }

    private setOrderCardErrorMessage(transactionId: number, errorMessage: string): void {
        const updatedErrorMessagesByOrderTransactionId = new Map(this.errorMessageByOrderTransactionId());
        updatedErrorMessagesByOrderTransactionId.set(transactionId, errorMessage);
        this.errorMessageByOrderTransactionId.set(updatedErrorMessagesByOrderTransactionId);
    }

    private clearOrderCardErrorMessage(transactionId: number): void {
        const currentErrorMessagesByOrderTransactionId = this.errorMessageByOrderTransactionId();

        if (currentErrorMessagesByOrderTransactionId.has(transactionId)) {
            const updatedErrorMessagesByOrderTransactionId = new Map(currentErrorMessagesByOrderTransactionId);
            updatedErrorMessagesByOrderTransactionId.delete(transactionId);
            this.errorMessageByOrderTransactionId.set(updatedErrorMessagesByOrderTransactionId);
        }
    }
}
