import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { OrderDisplayStateService } from '../../services/order-display-state.service';
import { Order, OrderStatus } from '../../generated/orders';
import { OrderCard } from './child-components/order-card/order-card';
import { ResponsiveOrderColumns } from './helpers/responsive-order-columns.service';

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
    providers: [ResponsiveOrderColumns],
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
     * Injects the ResponsiveOrderColumns service, which owns the viewport-driven column layout.
     * @remarks Provided at the component level, so its resize listener only lives while this page is mounted.
     */
    private readonly responsiveOrderColumns = inject(ResponsiveOrderColumns);
    //#endregion

    //#region Enum aliases for the template

    /**
     * Exposes the EmployeeTab enum to the template.
     * @remarks Templates can't read imported symbols directly, so we alias the enum on a field.
     */
    protected readonly employeeTabEnum = EmployeeTab;
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
    //#endregion

    //#region State aliased from the OrderDisplayStateService

    /**
     * The initial-load error from the OrderDisplayStateService.
     * @remarks Aliased so the template can read it without exposing the OrderDisplayStateService dependency.
     */
    protected readonly initialLoadErrorMessage = this.orderDisplayState.loadError;

    /**
     * Whether the initial orders fetch from the API is still in progress.
     * @remarks Aliased so the template can show a loading state without reaching into the service.
     */
    protected readonly isLoadingOrders = this.orderDisplayState.isLoadingOrders;
    //#endregion

    //#region Derived (computed) state

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
     * @remarks Delegates the layout to the ResponsiveOrderColumns service; this recomputes on resize
     * (it reads the service's column-count signal) and whenever the displayed orders change.
     */
    protected readonly ordersDistributedIntoResponsiveColumns = computed(() => {
        return this.responsiveOrderColumns.distributeIntoColumns(this.currentlyDisplayedOrders());
    });

    /** Whether the active tab has at least one order to render. */
    protected readonly hasCurrentlyDisplayedOrders = computed(() => this.currentlyDisplayedOrders().length > 0);

    /** Whether the Received tab is the active employee tab. */
    protected readonly isReceivedEmployeeTabActive = computed(() =>
        this.activeEmployeeTab() === EmployeeTab.Received,
    );

    /** Whether the Completed tab is the active employee tab. */
    protected readonly isCompletedEmployeeTabActive = computed(() =>
        this.activeEmployeeTab() === EmployeeTab.Completed,
    );

    /**
     * Responsive columns with each order paired to its card error message.
     * @remarks Keeps per-order error lookup out of the template so the grid binds to plain values.
     */
    protected readonly orderColumnsWithCardErrorMessages = computed(() => {
        const errorMessagesByOrderTransactionId = this.errorMessageByOrderTransactionId();

        return this.ordersDistributedIntoResponsiveColumns().map(columnOrders =>
            columnOrders.map(order => ({
                order,
                errorMessage: this.lookupOrderCardErrorMessage(order, errorMessagesByOrderTransactionId),
            })),
        );
    });
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

    //#region Order card handling

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
     * Reads the card error message for an order from the current error map.
     * @param order The order whose card error to read.
     * @param errorMessagesByOrderTransactionId The current per-order error messages.
     * @returns The card error message, or null when there is none.
     */
    private lookupOrderCardErrorMessage(order: Order, errorMessagesByOrderTransactionId: Map<number, string>): string | null {
        const transactionId = order.transactionId;

        if (transactionId == null) {
            return null;
        }

        return errorMessagesByOrderTransactionId.get(transactionId) ?? null;
    }

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
