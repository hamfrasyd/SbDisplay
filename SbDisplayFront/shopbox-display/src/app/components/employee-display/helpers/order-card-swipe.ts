import { Signal, signal } from '@angular/core';

/**
 * Configuration the order-card supplies when it creates its swipe controller.
 */
export interface OrderCardSwipeConfig {
    /** Whether the card is currently allowed to be swiped (e.g. only ReadyForPickup orders). */
    canSwipe: () => boolean;
    /** Called once a completed leftward swipe passes the 'revert' threshold. */
    onRevertRequested: () => void;
}

/**
 * Owns the swipe-to-revert gesture mechanics for a single order card.
 * @remarks Pure gesture concern: it tracks pointer movement, drives the drag offset, and decides when
 * a drag counts as a revert. It does NOT know the target status, it just calls onRevertRequested so
 * the card resolves the actual status.
 * @remarks Plain class (not an @Injectable service): the card creates one per instance with 'new', so
 * each card owns its own independent swipe state.
 */
export class OrderCardSwipe {
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

    /**
     * Whether this card is currently being swiped.
     * @remarks signal() holds writable reactive state; the template re-renders when it changes.
     */
    private readonly isActivelySwiping = signal<boolean>(false);

    /** How far the card has been dragged horizontally in pixels. */
    private readonly swipeHorizontalOffsetPixels = signal<number>(0);

    /**
     * Whether this card is currently being swiped (read-only for the template).
     * @remarks asReadonly() exposes the signal without its set/update, so the template can read it but
     * only this controller can change it.
     */
    public readonly isCardActivelySwiping: Signal<boolean> = this.isActivelySwiping.asReadonly();
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

    /**
     * @param config The card-supplied hooks: canSwipe gates the gesture, onRevertRequested fires when
     * a completed swipe passes the revert threshold.
     * @remarks A constructor parameter here, not inject(): this is a plain class created with 'new',
     * not resolved by Angular's DI, so there is no injection context to inject() from.
     */
    constructor(private readonly config: OrderCardSwipeConfig) {
    }

    //#region Swipe gesture handling

    /**
     * The CSS transform that visually offsets the card while it is being swiped.
     * @returns A translateX(...) string while swiping, otherwise null.
     */
    public getSwipeTransformStyle(): string | null {
        if (this.isActivelySwiping() === false) {
            return null;
        }
        return `translateX(${this.swipeHorizontalOffsetPixels()}px)`;
    }

    /**
     * Records the start of a potential swipe on pointer-down.
     * @param event The pointer event.
     * @remarks Records start position only, no signal updates, no setPointerCapture. Signals and
     * capture are deferred to onPointerMove once horizontal movement is confirmed, so that taps and
     * dblclicks are completely unaffected by the swipe setup.
     * @returns void
     */
    public onPointerDown(event: PointerEvent): void {
        if (this.config.canSwipe() === false) {
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
    public onPointerMove(event: PointerEvent): void {
        if (this.isEvaluatingPotentialSwipe === false) {
            return;
        }

        const swipeHorizontalOffsetPixels = event.clientX - this.dragStartHorizontalScreenPositionInPixels;

        if (this.isActivelySwiping() === false && Math.abs(swipeHorizontalOffsetPixels) > this.minimumDragDistanceToCountAsSwipeInPixels) {
            this.isActivelySwiping.set(true);
            (event.currentTarget as Element).setPointerCapture(event.pointerId);
        }

        if (this.isActivelySwiping() && swipeHorizontalOffsetPixels < 0) {
            this.swipeHorizontalOffsetPixels.set(swipeHorizontalOffsetPixels);
        }
    }

    /**
     * Finishes a swipe, resetting state and requesting a revert if dragged far enough.
     * @param _event The pointer event (unused).
     * @remarks If the card was dragged past the revert threshold, onRevertRequested is called so the
     * card can resolve and emit the previous status.
     * @returns void
     */
    public onPointerEnd(_event: PointerEvent): void {
        const wasCardActivelySwiped = this.isActivelySwiping();
        const finalSwipeHorizontalOffsetPixels = this.swipeHorizontalOffsetPixels();

        this.isEvaluatingPotentialSwipe = false;
        this.isActivelySwiping.set(false);
        this.swipeHorizontalOffsetPixels.set(0);

        if (wasCardActivelySwiped && Math.abs(finalSwipeHorizontalOffsetPixels) >= this.minimumDragDistanceToRevertOrderInPixels) {
            this.config.onRevertRequested();
        }
    }
    //#endregion
}
