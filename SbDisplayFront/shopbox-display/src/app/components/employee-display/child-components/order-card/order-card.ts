import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Order, OrderItem, OrderStatus } from '../../../../generated/orders';
import { OrderTimeTracker } from '../../helpers/order-time-tracker.service';
import { getNextOrderStatus, getPreviousOrderStatus } from '../../helpers/order-status-flow';
import { OrderCardSwipe } from '../../helpers/order-card-swipe';

/**
 * Presentational card for a single order.
 * @remarks Dumb component: it owns its local expand state and a swipe controller, takes the order as
 * input, and emits a resolved target status, the page performs the actual update. Time/age, the
 * status-transition rules, and the swipe mechanics live in helpers it delegates to.
 */
@Component({
    selector: 'app-order-card',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [DatePipe],
    templateUrl: './order-card.html',
    styleUrl: './order-card.css',
})
export class OrderCard {
    //#region Injected dependencies

    /**
     * Injects the OrderTimeTracker, the shared clock and order-age math.
     * @remarks 'inject(...)' is the recommended way to inject services into components.
     */
    private readonly orderTimeTracker = inject(OrderTimeTracker);
    //#endregion

    //#region Inputs and outputs

    /**
     * The order this card renders.
     * @remarks input.required() is the signals-based required input (it replaces the @Input() decorator);
     * the parent must bind it, and reading it as order() returns the current value.
     */
    public readonly order = input.required<Order>();

    /**
     * A card-level error message to show, or null when there is none.
     * @remarks input() declares an optional input with a default value; the parent binds [errorMessage]
     * and the card reads it as errorMessage().
     */
    public readonly errorMessage = input<string | null>(null);

    /**
     * Emits the status this order should move to.
     * @remarks output() is the signals-era event emitter (it replaces the @Output() decorator); the card
     * calls statusChange.emit(...) and the parent listens with (statusChange)="...".
     * @remarks The card resolves the target status (double-tap advance, swipe-revert, explicit button),
     * the page owns the actual data-access call.
     */
    public readonly statusChange = output<OrderStatus>();
    //#endregion

    //#region Enum aliases for the template

    /**
     * Exposes the OrderStatus enum to the template.
     * @remarks Templates can't read imported symbols directly, so we alias the enum on a field.
     */
    protected readonly orderStatusEnum = OrderStatus;
    //#endregion

    //#region Order preview constants

    /** How many order items to show on a collapsed card before showing "+N more". */
    private readonly maximumPreviewOrderItemCount = 4;
    //#endregion

    //#region Local UI state signals

    /**
     * Whether this card is expanded to show all order items.
     * @remarks signal() holds writable reactive state; writing it (set/update) re-renders only the
     * views that read it.
     */
    protected readonly isCardExpanded = signal<boolean>(false);
    //#endregion

    //#region Swipe gesture controller

    /**
     * Owns the swipe-to-revert gesture mechanics; the card resolves the revert target status.
     * @remarks canSwipe gates the gesture to swipeable orders, onRevertRequested maps a completed
     * swipe to the previous status in the lifecycle and emits it.
     */
    private readonly cardSwipe = new OrderCardSwipe({
        canSwipe: () => this.isOrderSwipeable(),
        onRevertRequested: () => {
            const previousOrderStatus = getPreviousOrderStatus(this.order().status);
            if (previousOrderStatus !== null) {
                this.statusChange.emit(previousOrderStatus);
            }
        }
    });
    //#endregion

    //#region Derived (computed) state

    /** Whether the order has at least one line item to render. */
    protected readonly hasOrderItems = computed(() =>
        (this.order().items?.length ?? 0) > 0
    );

    /** Whether the order is old enough to be visually flagged. */
    protected readonly isOrderConsideredOld = computed(() => {
        this.orderTimeTracker.currentTimestampMilliseconds();
        return this.orderTimeTracker.isOrderConsideredOld(this.order());
    });

    /** Whether the overdue styling should apply to the card shell. */
    protected readonly isOrderCardTooOld = computed(() => {
        if (this.isOrderConsideredOld() === false) {
            return false;
        }

        const orderStatus = this.order().status;

        if (orderStatus === OrderStatus.ReadyForPickup || orderStatus === OrderStatus.Completed) {
            return false;
        }

        return true;
    });

    /** Whether the card uses the ready-for-pickup styling. */
    protected readonly isOrderCardReady = computed(() =>
        this.order().status === OrderStatus.ReadyForPickup
);

    /** Whether the card uses the completed styling. */
    protected readonly isOrderCardCompleted = computed(() =>
        this.order().status === OrderStatus.Completed
);

    /** Whether the order can be swiped back to preparation. */
    protected readonly isOrderSwipeable = computed(() =>
        this.order().status === OrderStatus.ReadyForPickup
);

    /** Label showing how many minutes have passed since the order was created. */
    protected readonly elapsedMinutesSinceOrderCreationLabel = computed(
        () => `${this.orderTimeTracker.getElapsedMinutesSinceOrderCreation(this.order())} min`,
    );

    /** Whether the age label should use the muted text styling. */
    protected readonly isOrderAgeLabelMuted = computed(() =>
        this.isOrderConsideredOld() === false
);

    /** Order items rendered in the card body, respecting the collapsed preview limit. */
    protected readonly visibleOrderItems = computed((): OrderItem[] => {
        const order = this.order();
        if (!order.items?.length) {
            return [];
        }
        if (this.isCardExpanded()) {
            return order.items;
        }
        return order.items.slice(0, this.maximumPreviewOrderItemCount);
    });

    /** How many order items are hidden behind the collapsed preview. */
    protected readonly hiddenOrderItemCount = computed(() => {
        const order = this.order();
        if (!order.items?.length) {
            return 0;
        }
        return Math.max(0, order.items.length - this.maximumPreviewOrderItemCount);
    });

    /** Whether the expand/collapse control should be shown below the item list. */
    protected readonly shouldShowOrderItemsToggle = computed(() =>
        this.hiddenOrderItemCount() > 0 || this.isCardExpanded()
    );
    //#endregion

    //#region Display labels

    /**
     * Returns the Danish label shown for an order status.
     * @param orderStatus The status to translate for display.
     * @returns The Danish label, or 'N/A' when the status is missing or unknown.
     */
    protected getOrderStatusDisplayLabel(orderStatus: OrderStatus | undefined | null): string {
        switch (orderStatus) {
            case OrderStatus.UnderPreparation:
                return 'Under tilberedning';
            case OrderStatus.ReadyForPickup:
                return 'Klar til afhentning';
            case OrderStatus.Completed:
                return 'Færdig';
            default:
                return 'N/A';
        }
    }
    //#endregion

    //#region Status change handlers

    /**
     * Advances the order to its next status on double-click.
     * @remarks UnderPreparation -> ReadyForPickup -> Completed, other statuses do not trigger a status change.
     * @returns void
     */
    protected onOrderCardDoubleClick(): void {
        const nextOrderStatus = getNextOrderStatus(this.order().status);

        if (nextOrderStatus !== null) {
            this.statusChange.emit(nextOrderStatus);
        }
    }

    /**
     * Handles an explicit status change (e.g. from a button).
     * @param newOrderStatus The status to move the order to.
     * @returns void
     */
    protected onChangeOrderStatus(newOrderStatus: OrderStatus): void {
        this.statusChange.emit(newOrderStatus);
    }
    //#endregion

    //#region Card expansion

    /**
     * Toggles whether the card is expanded.
     * @param event The DOM event, its propagation is stopped so the card click doesn't also fire.
     * @remarks update() derives the next value from the current one; '=== false' flips the boolean
     * (we compare against the literal false because this is a genuine boolean, not a nullish check).
     * @returns void
     */
    protected toggleOrderCardExpanded(event: Event): void {
        event.stopPropagation();
        this.isCardExpanded.update(isExpanded => isExpanded === false);
    }
    //#endregion

    //#region Swipe template wrapper methods

    /** Whether the card is currently following an active swipe gesture. */
    protected isOrderCardActivelySwiping(): boolean {
        return this.cardSwipe.isCardActivelySwiping();
    }

    /** The CSS transform applied while the card is being swiped. */
    protected getOrderCardSwipeTransformStyle(): string | null {
        return this.cardSwipe.getSwipeTransformStyle();
    }

    /** Records the start of a potential swipe on pointer-down. */
    protected onOrderCardPointerDown(event: PointerEvent): void {
        this.cardSwipe.onPointerDown(event);
    }

    /** Tracks pointer movement while a swipe is being evaluated or performed. */
    protected onOrderCardPointerMove(event: PointerEvent): void {
        this.cardSwipe.onPointerMove(event);
    }

    /** Finishes a swipe on pointer-up or pointer-cancel. */
    protected onOrderCardPointerEnd(event: PointerEvent): void {
        this.cardSwipe.onPointerEnd(event);
    }
    //#endregion
}
