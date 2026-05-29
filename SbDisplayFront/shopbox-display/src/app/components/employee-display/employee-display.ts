import { ChangeDetectorRef, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { fromEvent, map, startWith } from 'rxjs';
import { OrderDisplayStateService } from '../../services/order-display-state.service';
import { Order, OrderItem, OrderStatus } from '../../generated/orders';
import { DatePipe } from '@angular/common';

/**
 * Local UI enum for the two tabs the employee can switch between.
 * @remarks Local UI enums live in the component file, since they have no business being in the service.
 */
enum EmployeeTab {
    Received = 'Received',
    Completed = 'Completed'
}

@Component({
    selector: 'app-employee-display',
    imports: [DatePipe],
    templateUrl: './employee-display.html',
    styleUrl: './employee-display.css',
})
export class EmployeeDisplay {
    //#region Injected dependencies

    /**
     * Injects the OrderDisplayStateService, which is the service that owns the order state.
     * @remarks 'inject(...)' is the recommended way to inject services into components.
     */
    private readonly orderDisplayState = inject(OrderDisplayStateService);

    /**
     * Injects Angular's ChangeDetectorRef.
     * @remarks Needed because the order-age refresh, runs in a raw setInterval (outside Angular),
     * so we must manually tell Angular to re-check the view.
     */
    private readonly changeDetectorRef = inject(ChangeDetectorRef);
    //#endregion

    //#region Enum aliases for the template

    /**
     * Exposes the OrderStatus enum to the template.
     * @remarks Templates can't read imported symbols directly, so we alias the enum on a field.
     */
    protected readonly orderStatusEnum = OrderStatus;

    /**
     * Exposes the EmployeeTab enum to the template.
     * @remarks Templates can't read imported symbols directly, so we alias the enum on a field.
     */
    protected readonly employeeTabEnum = EmployeeTab;
    //#endregion

    //#region Viewport breakpoints (pixels) and the column count each band renders

    /** Minimum viewport width treated as an extra-large screen. */
    private readonly extraLargeViewportMinimumWidthPixels = 1200;
    /** Minimum viewport width treated as a large screen. */
    private readonly largeViewportMinimumWidthPixels = 992;
    /** Minimum viewport width treated as a medium screen. */
    private readonly mediumViewportMinimumWidthPixels = 768;
    /** Number of columns rendered on an extra-large viewport. */
    private readonly columnCountForExtraLargeViewport = 4;
    /** Number of columns rendered on a large viewport. */
    private readonly columnCountForLargeViewport = 3;
    /** Number of columns rendered on a medium viewport. */
    private readonly columnCountForMediumViewport = 2;
    /** Number of columns rendered on a small viewport. */
    private readonly columnCountForSmallViewport = 1;
    /** Fallback column count used before the first viewport measurement. */
    private readonly defaultResponsiveColumnCount = 4;
    //#endregion

    //#region Order preview and age constants

    /** How many order items to show on a collapsed card before showing "+N more". */
    private readonly maximumPreviewOrderItemCount = 4;
    /** How often the order-age label is refreshed (milliseconds). */
    private readonly orderAgeRefreshIntervalMilliseconds = 60000;
    /** Age (minutes) at which an order is visually flagged as old. */
    private readonly orderConsideredOldAfterMinutes = 5;
    /** Conversion factor used to turn elapsed milliseconds into minutes. */
    private readonly millisecondsPerMinute = 60000;
    //#endregion

    //#region Swipe gesture distance thresholds (pixels)

    /**
     * The user must drag the card left at least this far in pixels before releasing
     * for the order to be sent back to preparation.
     */
    private readonly minimumDragDistanceToRevertOrderInPixels = 100;

    /**
     * The finger/mouse must move at least this far in pixels before we treat the gesture
     * as a swipe instead of a tap/double-tap.
     */
    private readonly minimumDragDistanceToCountAsSwipeInPixels = 5;
    //#endregion

    //#region UI state signals

    /** The tab currently selected by the employee. */
    protected readonly activeEmployeeTab = signal<EmployeeTab>(EmployeeTab.Received);

    /**
     * Per-card error messages, keyed by the order's transactionId.
     * @remarks Map is a collection of key-value pairs, so each card can surface its own error independently.
     */
    protected readonly errorMessageByOrderTransactionId = signal<Map<number, string>>(new Map());

    /** A page-level error message shown above the board, or null when there is none. */
    protected readonly pageLevelErrorMessage = signal<string | null>(null);

    /** The set of order cards that are currently expanded, keyed by transactionId. */
    protected readonly expandedOrderCardTransactionIds = signal<Set<number>>(new Set());
    //#endregion

    //#region Swipe state (only one card can be swiped at a time)

    /** The transactionId of the card currently being swiped, or null when none is. */
    protected readonly activelySwipedOrderTransactionId = signal<number | null>(null);

    /** How far the active card has been dragged horizontally in pixels. */
    protected readonly swipeHorizontalOffsetPixels = signal<number>(0);

    /**
     * The current time, refreshed on an interval.
     * @remarks Stored as a signal so the order-age labels recompute when it changes.
     */
    private readonly currentTimestampMilliseconds = signal(Date.now());
    //#endregion

    //#region State aliased from the OrderDisplayStateService

    /**
     * The initial-load error from the OrderDisplayStateService.
     * @remarks Aliased so the template can read it without exposing the OrderDisplayStateService dependency.
     */
    protected readonly initialLoadErrorMessage = this.orderDisplayState.loadError;
    //#endregion

    //#region Swipe gesture tracking (plain fields, intentionally not signals)

    /**
     * Where the finger/mouse first touched down (horizontal screen position),
     * so we can measure how far it has dragged.
     */
    private dragStartHorizontalScreenPositionInPixels = 0;

    /**
     * The order being checked for a swipe gesture, set on touch-down, before we know
     * it's a real swipe and not a tap.
     * @remarks Kept as a plain field (not a signal) intentionally, updating a signal on every
     * touch-down triggers re-renders mid-double-tap, which breaks browser double-tap detection
     * across mouse, touch and pen input.
     */
    private transactionIdOfOrderBeingEvaluatedForSwipe: number | null = null;
    //#endregion

    //#region Derived (computed) state

    /**
     * The number of columns to render, derived from the current viewport width.
     * @remarks toSignal adapts the resize stream to a signal, startWith(null) makes it emit once
     * immediately so the first render has a value.
     */
    private readonly responsiveOrderColumnCount = toSignal(
        fromEvent(window, 'resize').pipe(
            startWith(null),
            map((): number => {
                const viewportWidthPixels = window.innerWidth;
                if (viewportWidthPixels >= this.extraLargeViewportMinimumWidthPixels) {
                    return this.columnCountForExtraLargeViewport;
                }
                if (viewportWidthPixels >= this.largeViewportMinimumWidthPixels) {
                    return this.columnCountForLargeViewport;
                }
                if (viewportWidthPixels >= this.mediumViewportMinimumWidthPixels) {
                    return this.columnCountForMediumViewport;
                }
                return this.columnCountForSmallViewport;
            })
        ),
        { initialValue: this.defaultResponsiveColumnCount }
    );

    /**
     * Orders shown on the "Received" tab.
     * @remarks computed signals are derived signals, this recomputes whenever the OrderDisplayStateService's orders change.
     */
    protected readonly receivedOrders = computed(() => {
        return this.orderDisplayState.orders().filter(order => order.status === OrderStatus.UnderPreparation || order.status === OrderStatus.ReadyForPickup);
    });

    /**
     * Orders shown on the "Completed" tab.
     * @remarks computed signals are derived signals, this recomputes whenever the OrderDisplayStateService's orders change.
     */
    protected readonly completedOrders = computed(() => {
        return this.orderDisplayState.orders().filter(order => order.status === OrderStatus.Completed);
    });

    /**
     * The orders for whichever tab is currently active.
     * @remarks Lets the template bind to one list instead of branching on the active tab.
     */
    protected readonly currentlyDisplayedOrders = computed(() => {
        if (this.activeEmployeeTab() === EmployeeTab.Received) {
            return this.receivedOrders();
        }
        return this.completedOrders();
    });

    /**
     * The displayed orders split into columns for the responsive grid.
     * @remarks Distributes orders round-robin across the column count so the columns stay balanced.
     */
    protected readonly ordersDistributedIntoResponsiveColumns = computed(() => {
        const ordersToDisplay: Order[] = this.currentlyDisplayedOrders();
        const responsiveColumnCount = this.responsiveOrderColumnCount() ?? this.defaultResponsiveColumnCount;
        const orderColumns: Order[][] = Array.from({ length: responsiveColumnCount }, () => []);
        ordersToDisplay.forEach((order: Order, orderIndex: number) => orderColumns[orderIndex % responsiveColumnCount].push(order));
        return orderColumns;
    });
    //#endregion

    constructor() {
        // Refresh the "current time" signal on an interval so order-age labels stay up to date.
        // detectChanges() is needed because setInterval runs outside Angular's change detection.
        setInterval(() => {
            this.currentTimestampMilliseconds.set(Date.now());
            this.changeDetectorRef.detectChanges();
        }, this.orderAgeRefreshIntervalMilliseconds);
    }

    //#region Order age helpers

    /**
     * Builds the "X min" label for an order's age.
     * @param order The order to build the label for.
     * @returns A label like "3 min".
     */
    protected getElapsedMinutesSinceOrderCreationLabel(order: Order): string {
        return `${this.getElapsedMinutesSinceOrderCreation(order)} min`;
    }

    /**
     * Whether an order is old enough to be visually flagged.
     * @param order The order to check.
     * @returns true if the order is at least the "old" threshold in minutes.
     */
    protected isOrderOlderThanFiveMinutes(order: Order): boolean {
        return this.getElapsedMinutesSinceOrderCreation(order) >= this.orderConsideredOldAfterMinutes;
    }
    //#endregion

    //#region Tab and page-error handling

    /**
     * Switches the active tab.
     * @param employeeTab The tab to activate.
     * @returns void
     */
    protected setActiveEmployeeTab(employeeTab: EmployeeTab): void {
        this.activeEmployeeTab.set(employeeTab);
    }

    /**
     * Clears the page-level error message.
     * @returns void
     */
    protected clearPageLevelErrorMessage(): void {
        this.pageLevelErrorMessage.set(null);
    }
    //#endregion

    //#region Status change handlers

    /**
     * Advances an order to its next status on double-click.
     * @param order The order that was double-clicked.
     * @remarks UnderPreparation -> ReadyForPickup -> Completed, other statuses do not trigger a status change.
     * @returns void
     */
    protected onOrderCardDoubleClick(order: Order): void {
        if (order.status === OrderStatus.UnderPreparation) {
            this.requestOrderStatusUpdate(order, OrderStatus.ReadyForPickup);
            return;
        }

        if (order.status === OrderStatus.ReadyForPickup) {
            this.requestOrderStatusUpdate(order, OrderStatus.Completed);
            return;
        }
    }

    /**
     * Handles an explicit status change (e.g. from a button).
     * @param order The order to update.
     * @param newOrderStatus The status to move the order to.
     * @returns void
     */
    protected onChangeOrderStatus(order: Order, newOrderStatus: OrderStatus): void {
        this.requestOrderStatusUpdate(order, newOrderStatus);
    }
    //#endregion

    //#region Swipe predicates

    /**
     * Whether an order can be swiped back to preparation.
     * @param order The order to check.
     * @returns true only for orders that are ReadyForPickup.
     */
    protected isOrderSwipeable(order: Order): boolean {
        return order.status === OrderStatus.ReadyForPickup;
    }

    /**
     * Whether the given order is the one currently being swiped.
     * @param order The order to check.
     * @returns true if this order is actively being swiped.
     */
    protected isOrderCurrentlySwiping(order: Order): boolean {
        return this.activelySwipedOrderTransactionId() === order.transactionId;
    }
    //#endregion

    //#region Card expansion

    /**
     * Whether the given order's card is expanded.
     * @param order The order to check.
     * @returns true if the card is currently expanded.
     */
    protected isOrderCardExpanded(order: Order): boolean {
        return order.transactionId != null && this.expandedOrderCardTransactionIds().has(order.transactionId);
    }

    /**
     * Toggles whether an order's card is expanded.
     * @param order The order whose card to toggle.
     * @param event The DOM event, its propagation is stopped so the card click doesn't also fire.
     * @remarks Builds a new Set before mutating so the signal sees a new reference and re-renders.
     * @returns void
     */
    protected toggleOrderCardExpanded(order: Order, event: Event): void {
        event.stopPropagation();
        const transactionId = order.transactionId;
        if (transactionId == null) {
            return;
        }

        const updatedExpandedOrderCardTransactionIds = new Set(this.expandedOrderCardTransactionIds());
        if (updatedExpandedOrderCardTransactionIds.has(transactionId)) {
            updatedExpandedOrderCardTransactionIds.delete(transactionId);
        } else {
            updatedExpandedOrderCardTransactionIds.add(transactionId);
        }
        this.expandedOrderCardTransactionIds.set(updatedExpandedOrderCardTransactionIds);
    }

    /**
     * The order items to render for a card, respecting the collapsed preview limit.
     * @param order The order whose items to show.
     * @returns All items when expanded, otherwise the first few as a preview.
     */
    protected getVisibleOrderItems(order: Order): OrderItem[] {
        if (!order.items?.length) {
            return [];
        }
        if (this.isOrderCardExpanded(order)) {
            return order.items;
        }
        return order.items.slice(0, this.maximumPreviewOrderItemCount);
    }

    /**
     * How many items are hidden behind the collapsed preview.
     * @param order The order to count hidden items for.
     * @returns The number of items not shown in the preview (0 when none).
     */
    protected getHiddenOrderItemCount(order: Order): number {
        if (!order.items?.length) {
            return 0;
        }
        return Math.max(0, order.items.length - this.maximumPreviewOrderItemCount);
    }
    //#endregion

    //#region Swipe gesture handling

    /**
     * The CSS transform that visually offsets the card while it is being swiped.
     * @param order The order whose card may be offset.
     * @returns A translateX(...) string for the active card, otherwise null.
     */
    protected getSwipeTransformStyle(order: Order): string | null {
        if (this.activelySwipedOrderTransactionId() !== order.transactionId) {
            return null;
        }
        return `translateX(${this.swipeHorizontalOffsetPixels()}px)`;
    }

    /**
     * Records the start of a potential swipe on pointer-down.
     * @param event The pointer event.
     * @param order The order under the pointer.
     * @remarks Records start position only, no signal updates, no setPointerCapture. Signals and
     * capture are deferred to onSwipePointerMove once horizontal movement is confirmed, so that
     * taps and dblclicks are completely unaffected by the swipe setup.
     * @returns void
     */
    protected onSwipePointerDown(event: PointerEvent, order: Order): void {
        if (this.isOrderSwipeable(order) === false) {
            return;
        }

        if (order.transactionId === undefined || order.transactionId === null) {
            return;
        }

        this.dragStartHorizontalScreenPositionInPixels = event.clientX;
        this.transactionIdOfOrderBeingEvaluatedForSwipe = order.transactionId;
    }

    /**
     * Tracks pointer movement and, once confirmed, drives the swipe offset.
     * @param event The pointer event.
     * @param order The order under the pointer.
     * @remarks Commits to the swipe only once horizontal movement passes the threshold; that is the
     * first point where we update signals or capture the pointer. The offset only follows leftward
     * drags (negative offset).
     * @returns void
     */
    protected onSwipePointerMove(event: PointerEvent, order: Order): void {
        if (this.transactionIdOfOrderBeingEvaluatedForSwipe === null) {
            return;
        }

        const swipeHorizontalOffsetPixels = event.clientX - this.dragStartHorizontalScreenPositionInPixels;

        if (this.activelySwipedOrderTransactionId() === null && Math.abs(swipeHorizontalOffsetPixels) > this.minimumDragDistanceToCountAsSwipeInPixels) {
            this.activelySwipedOrderTransactionId.set(this.transactionIdOfOrderBeingEvaluatedForSwipe);
            (event.currentTarget as Element).setPointerCapture(event.pointerId);
        }

        if (this.activelySwipedOrderTransactionId() !== null && swipeHorizontalOffsetPixels < 0) {
            this.swipeHorizontalOffsetPixels.set(swipeHorizontalOffsetPixels);
        }
    }

    /**
     * Finishes a swipe, resetting state and reverting the order if dragged far enough.
     * @param _event The pointer event (unused).
     * @param order The order that was swiped.
     * @remarks If the card was dragged past the revert threshold, the order is sent back to
     * UnderPreparation.
     * @returns void
     */
    protected onSwipePointerEnd(_event: PointerEvent, order: Order): void {
        const wasOrderActivelySwiped = this.activelySwipedOrderTransactionId() !== null;
        const finalSwipeHorizontalOffsetPixels = this.swipeHorizontalOffsetPixels();

        this.transactionIdOfOrderBeingEvaluatedForSwipe = null;
        this.activelySwipedOrderTransactionId.set(null);
        this.swipeHorizontalOffsetPixels.set(0);

        if (wasOrderActivelySwiped && Math.abs(finalSwipeHorizontalOffsetPixels) >= this.minimumDragDistanceToRevertOrderInPixels) {
            this.requestOrderStatusUpdate(order, OrderStatus.UnderPreparation);
        }
    }
    //#endregion

    //#region Private helpers

    /**
     * Calculates how many whole minutes have passed since an order was created.
     * @param order The order to measure.
     * @returns The elapsed minutes, or 0 when the order has no creation time.
     */
    private getElapsedMinutesSinceOrderCreation(order: Order): number {
        if (!order.creationTime) {
            return 0;
        }

        const orderCreationTimestampMilliseconds = new Date(order.creationTime).getTime();
        return Math.floor((this.currentTimestampMilliseconds() - orderCreationTimestampMilliseconds) / this.millisecondsPerMinute);
    }

    /**
     * Sends a status update to the store and surfaces success/failure on the card.
     * @param order The order to update.
     * @param newOrderStatus The status to move the order to.
     * @remarks Guards against a missing transactionId, then subscribes: clears the card error on
     * success, sets a card error on failure.
     * @returns void
     */
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

    /**
     * Sets the error message for a single order card.
     * @param transactionId The order whose card to flag.
     * @param errorMessage The message to show.
     * @remarks Builds a new Map before mutating so the signal sees a new reference and re-renders.
     * @returns void
     */
    private setOrderCardErrorMessage(transactionId: number, errorMessage: string): void {
        const updatedErrorMessagesByOrderTransactionId = new Map(this.errorMessageByOrderTransactionId());
        updatedErrorMessagesByOrderTransactionId.set(transactionId, errorMessage);
        this.errorMessageByOrderTransactionId.set(updatedErrorMessagesByOrderTransactionId);
    }

    /**
     * Clears the error message for a single order card, if one is set.
     * @param transactionId The order whose card error to clear.
     * @remarks Builds a new Map before mutating so the signal sees a new reference and re-renders.
     * @returns void
     */
    private clearOrderCardErrorMessage(transactionId: number): void {
        const currentErrorMessagesByOrderTransactionId = this.errorMessageByOrderTransactionId();

        if (currentErrorMessagesByOrderTransactionId.has(transactionId)) {
            const updatedErrorMessagesByOrderTransactionId = new Map(currentErrorMessagesByOrderTransactionId);
            updatedErrorMessagesByOrderTransactionId.delete(transactionId);
            this.errorMessageByOrderTransactionId.set(updatedErrorMessagesByOrderTransactionId);
        }
    }
    //#endregion
}
