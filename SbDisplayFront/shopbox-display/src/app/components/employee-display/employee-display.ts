import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { fromEvent, map, startWith } from 'rxjs';
import { OrderDisplayStateService } from '../../services/order-display-state.service';
import { Order, OrderStatus } from '../../generated/orders';
import { OrderCard } from './child-components/order-card/order-card';

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
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [OrderCard],
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
    //#endregion

    //#region Enum aliases for the template

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

    //#region Order age constants

    /** How often the order-age label is refreshed (milliseconds). */
    private readonly orderAgeRefreshIntervalMilliseconds = 60000;
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

    /**
     * The current time, refreshed on an interval.
     * @remarks Stored as a signal so the order-age labels recompute when it changes; passed down to
     * each card so a single interval drives every card's age.
     */
    protected readonly currentTimestampMilliseconds = signal(Date.now());
    //#endregion

    //#region State aliased from the OrderDisplayStateService

    /**
     * The initial-load error from the OrderDisplayStateService.
     * @remarks Aliased so the template can read it without exposing the OrderDisplayStateService dependency.
     */
    protected readonly initialLoadErrorMessage = this.orderDisplayState.loadError;
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
        // The signal write marks this OnPush component dirty, no manual change detection needed.
        setInterval(() => {
            this.currentTimestampMilliseconds.set(Date.now());
        }, this.orderAgeRefreshIntervalMilliseconds);
    }

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

    //#region Order card handling

    /**
     * The error message to show on a given order's card, if any.
     * @param order The order whose card error to read.
     * @returns The card error message, or null when there is none.
     */
    protected getOrderCardErrorMessage(order: Order): string | null {
        if (order.transactionId == null) {
            return null;
        }
        return this.errorMessageByOrderTransactionId().get(order.transactionId) ?? null;
    }

    /**
     * Handles a status change requested by an order card.
     * @param order The order to update.
     * @param newOrderStatus The status the card resolved to move the order to.
     * @returns void
     */
    protected onOrderStatusChange(order: Order, newOrderStatus: OrderStatus): void {
        this.requestOrderStatusUpdate(order, newOrderStatus);
    }
    //#endregion

    //#region Private helpers

    /**
     * Sends a status update to the OrderDisplayStateService and surfaces success/failure on the card.
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
