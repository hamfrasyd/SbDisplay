import { DestroyRef, Injectable, Signal, inject, signal } from '@angular/core';
import { Order } from '../../../generated/orders';

/**
 * Tracks time for orders: owns the single shared clock (one interval) and the order-age math.
 * @remarks A single interval drives every card's age, so cards recompute off one clock instead of
 * each running its own timer. Provided in root so all consumers share the same clock.
 */
@Injectable({ providedIn: 'root' })
export class OrderTimeTracker {
    //#region Order age constants

    /** How often the order-age label is refreshed (milliseconds). */
    private readonly orderAgeRefreshIntervalMilliseconds = 60000;
    /** Age (minutes) at which an order is visually flagged as old. */
    private readonly orderConsideredOldAfterMinutes = 5;
    /** Conversion factor used to turn elapsed milliseconds into minutes. */
    private readonly millisecondsPerMinute = 60000;
    //#endregion

    //#region Clock state

    /**
     * The current time, refreshed on an interval.
     * @remarks Stored as a signal so the order-age labels recompute when it changes; a single interval
     * drives every card's age.
     */
    private readonly currentTimestamp = signal(Date.now());

    /**
     * The current time in milliseconds, refreshed on the shared interval (read-only for consumers).
     * @remarks asReadonly() exposes the signal without its set/update, so consumers can read the clock
     * but only this service can advance it.
     */
    public readonly currentTimestampMilliseconds: Signal<number> = this.currentTimestamp.asReadonly();
    //#endregion

    constructor() {
        // Refresh the "current time" signal on an interval so order-age labels stay up to date.
        // The signal write marks any OnPush reader dirty, no manual change detection needed.
        const refreshIntervalId = setInterval(() => {
            this.currentTimestamp.set(Date.now());
        }, this.orderAgeRefreshIntervalMilliseconds);

        // DestroyRef is Angular's teardown hook; onDestroy runs when this service is destroyed.
        // Clear the interval there so the timer never outlives the service.
        inject(DestroyRef).onDestroy(() => clearInterval(refreshIntervalId));
    }

    //#region Order age helpers

    /**
     * Calculates how many whole minutes have passed since the order was created.
     * @param order The order to measure.
     * @returns The elapsed minutes, or 0 when the order has no creation time.
     */
    public getElapsedMinutesSinceOrderCreation(order: Order): number {
        if (!order.creationTime) {
            return 0;
        }

        const orderCreationTimestampMilliseconds = new Date(order.creationTime).getTime();
        return Math.floor((this.currentTimestamp() - orderCreationTimestampMilliseconds) / this.millisecondsPerMinute);
    }

    /**
     * Whether the order is old enough to be visually flagged.
     * @param order The order to check.
     * @returns true if the order is at least the "old" threshold in minutes.
     */
    public isOrderConsideredOld(order: Order): boolean {
        return this.getElapsedMinutesSinceOrderCreation(order) >= this.orderConsideredOldAfterMinutes;
    }
    //#endregion
}
