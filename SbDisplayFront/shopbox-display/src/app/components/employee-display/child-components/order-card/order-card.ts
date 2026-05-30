import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Order, OrderItem, OrderStatus } from '../../../../generated/orders';

/**
 * Presentational card for a single order.
 * @remarks Dumb component: it owns only its local swipe/expand UI state, takes the order and the
 * shared clock as inputs, and emits a resolved target status, the page performs the actual update.
 */
@Component({
    selector: 'app-order-card',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [DatePipe],
    templateUrl: './order-card.html',
    styleUrl: './order-card.css',
})
export class OrderCard {
    //#region Inputs and outputs

    /** The order this card renders. */
    public readonly order = input.required<Order>();

    /**
     * The current time in milliseconds, pushed from the page.
     * @remarks Driven by a single interval on the page so every card recomputes its age off one clock.
     */
    public readonly currentTimestampMilliseconds = input.required<number>();

    /** A card-level error message to show, or null when there is none. */
    public readonly errorMessage = input<string | null>(null);

    /**
     * Emits the status this order should move to.
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

    //#region Order preview and age constants

    /** How many order items to show on a collapsed card before showing "+N more". */
    private readonly maximumPreviewOrderItemCount = 4;
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

    //#region Local UI state signals

    /** Whether this card is expanded to show all order items. */
    protected readonly isCardExpanded = signal<boolean>(false);

    /** Whether this card is currently being swiped. */
    protected readonly isCardActivelySwiping = signal<boolean>(false);

    /** How far the card has been dragged horizontally in pixels. */
    protected readonly swipeHorizontalOffsetPixels = signal<number>(0);
    //#endregion

    //#region Swipe gesture tracking (plain fields, intentionally not signals)

    /**
     * Where the finger/mouse first touched down (horizontal screen position),
     * so we can measure how far it has dragged.
     */
    private dragStartHorizontalScreenPositionInPixels = 0;

    /**
     * Whether a potential swipe is being evaluated, set on touch-down before we know
     * it's a real swipe and not a tap.
     * @remarks Kept as a plain field (not a signal) intentionally, updating a signal on every
     * touch-down triggers re-renders mid-double-tap, which breaks browser double-tap detection
     * across mouse, touch and pen input.
     */
    private isEvaluatingPotentialSwipe = false;
    //#endregion

    //#region Order age helpers

    /**
     * Builds the "X min" label for the order's age.
     * @returns A label like "3 min".
     */
    protected getElapsedMinutesSinceOrderCreationLabel(): string {
        return `${this.getElapsedMinutesSinceOrderCreation()} min`;
    }

    /**
     * Whether the order is old enough to be visually flagged.
     * @returns true if the order is at least the "old" threshold in minutes.
     */
    protected isOrderOlderThanFiveMinutes(): boolean {
        return this.getElapsedMinutesSinceOrderCreation() >= this.orderConsideredOldAfterMinutes;
    }
    //#endregion

    //#region Status change handlers

    /**
     * Advances the order to its next status on double-click.
     * @remarks UnderPreparation -> ReadyForPickup -> Completed, other statuses do not trigger a status change.
     * @returns void
     */
    protected onOrderCardDoubleClick(): void {
        const order = this.order();

        if (order.status === OrderStatus.UnderPreparation) {
            this.statusChange.emit(OrderStatus.ReadyForPickup);
            return;
        }

        if (order.status === OrderStatus.ReadyForPickup) {
            this.statusChange.emit(OrderStatus.Completed);
            return;
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

    //#region Swipe predicates

    /**
     * Whether the order can be swiped back to preparation.
     * @returns true only for orders that are ReadyForPickup.
     */
    protected isOrderSwipeable(): boolean {
        return this.order().status === OrderStatus.ReadyForPickup;
    }
    //#endregion

    //#region Card expansion

    /**
     * Toggles whether the card is expanded.
     * @param event The DOM event, its propagation is stopped so the card click doesn't also fire.
     * @returns void
     */
    protected toggleOrderCardExpanded(event: Event): void {
        event.stopPropagation();
        this.isCardExpanded.update(isExpanded => isExpanded === false);
    }

    /**
     * The order items to render, respecting the collapsed preview limit.
     * @returns All items when expanded, otherwise the first few as a preview.
     */
    protected getVisibleOrderItems(): OrderItem[] {
        const order = this.order();
        if (!order.items?.length) {
            return [];
        }
        if (this.isCardExpanded()) {
            return order.items;
        }
        return order.items.slice(0, this.maximumPreviewOrderItemCount);
    }

    /**
     * How many items are hidden behind the collapsed preview.
     * @returns The number of items not shown in the preview (0 when none).
     */
    protected getHiddenOrderItemCount(): number {
        const order = this.order();
        if (!order.items?.length) {
            return 0;
        }
        return Math.max(0, order.items.length - this.maximumPreviewOrderItemCount);
    }
    //#endregion

    //#region Swipe gesture handling

    /**
     * The CSS transform that visually offsets the card while it is being swiped.
     * @returns A translateX(...) string while swiping, otherwise null.
     */
    protected getSwipeTransformStyle(): string | null {
        if (this.isCardActivelySwiping() === false) {
            return null;
        }
        return `translateX(${this.swipeHorizontalOffsetPixels()}px)`;
    }

    /**
     * Records the start of a potential swipe on pointer-down.
     * @param event The pointer event.
     * @remarks Records start position only, no signal updates, no setPointerCapture. Signals and
     * capture are deferred to onSwipePointerMove once horizontal movement is confirmed, so that
     * taps and dblclicks are completely unaffected by the swipe setup.
     * @returns void
     */
    protected onSwipePointerDown(event: PointerEvent): void {
        if (this.isOrderSwipeable() === false) {
            return;
        }

        this.dragStartHorizontalScreenPositionInPixels = event.clientX;
        this.isEvaluatingPotentialSwipe = true;
    }

    /**
     * Tracks pointer movement and, once confirmed, drives the swipe offset.
     * @param event The pointer event.
     * @remarks Commits to the swipe only once horizontal movement passes the threshold; that is the
     * first point where we update signals or capture the pointer. The offset only follows leftward
     * drags (negative offset).
     * @returns void
     */
    protected onSwipePointerMove(event: PointerEvent): void {
        if (this.isEvaluatingPotentialSwipe === false) {
            return;
        }

        const swipeHorizontalOffsetPixels = event.clientX - this.dragStartHorizontalScreenPositionInPixels;

        if (this.isCardActivelySwiping() === false && Math.abs(swipeHorizontalOffsetPixels) > this.minimumDragDistanceToCountAsSwipeInPixels) {
            this.isCardActivelySwiping.set(true);
            (event.currentTarget as Element).setPointerCapture(event.pointerId);
        }

        if (this.isCardActivelySwiping() && swipeHorizontalOffsetPixels < 0) {
            this.swipeHorizontalOffsetPixels.set(swipeHorizontalOffsetPixels);
        }
    }

    /**
     * Finishes a swipe, resetting state and reverting the order if dragged far enough.
     * @param _event The pointer event (unused).
     * @remarks If the card was dragged past the revert threshold, the order is sent back to
     * UnderPreparation.
     * @returns void
     */
    protected onSwipePointerEnd(_event: PointerEvent): void {
        const wasCardActivelySwiped = this.isCardActivelySwiping();
        const finalSwipeHorizontalOffsetPixels = this.swipeHorizontalOffsetPixels();

        this.isEvaluatingPotentialSwipe = false;
        this.isCardActivelySwiping.set(false);
        this.swipeHorizontalOffsetPixels.set(0);

        if (wasCardActivelySwiped && Math.abs(finalSwipeHorizontalOffsetPixels) >= this.minimumDragDistanceToRevertOrderInPixels) {
            this.statusChange.emit(OrderStatus.UnderPreparation);
        }
    }
    //#endregion

    //#region Private helpers

    /**
     * Calculates how many whole minutes have passed since the order was created.
     * @returns The elapsed minutes, or 0 when the order has no creation time.
     */
    private getElapsedMinutesSinceOrderCreation(): number {
        const order = this.order();
        if (!order.creationTime) {
            return 0;
        }

        const orderCreationTimestampMilliseconds = new Date(order.creationTime).getTime();
        return Math.floor((this.currentTimestampMilliseconds() - orderCreationTimestampMilliseconds) / this.millisecondsPerMinute);
    }
    //#endregion
}
