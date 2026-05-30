import { Injectable, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { fromEvent, map, startWith } from 'rxjs';
import { Order } from '../../../generated/orders';

/**
 * Owns the responsive "orders into columns" layout: tracks the viewport width and splits orders across
 * the right number of columns.
 * @remarks Each order goes to the next column in turn (first order → column 1, second → column 2, and
 * so on; when the last column is used, the next order starts again at column 1). That keeps the columns
 * roughly the same height instead of stacking every order in the first column.
 * @remarks Provided by the employee-display component (not in root) so its resize listener only lives
 * while that page is mounted.
 */
@Injectable()
export class ResponsiveOrderColumns {
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

    //#region Derived (computed) state

    /**
     * The number of columns to render, derived from the current viewport width.
     * @remarks fromEvent(window, 'resize') turns the browser resize event into an RxJS stream; the pipe
     * is kept multi-line (one operator per line) and maps each resize to a column count.
     * @remarks toSignal adapts that stream to a signal, startWith(null) makes it emit once immediately
     * so the first read has a value.
     */
    private readonly responsiveColumnCount: Signal<number> = toSignal(
        fromEvent(window, 'resize').pipe(
            startWith(null),
            map((): number => this.getColumnCountForViewportWidth(window.innerWidth))
        ),
        { initialValue: this.defaultResponsiveColumnCount }
    );
    //#endregion

    /**
     * Distributes the given orders across the current number of columns, one order at a time in turn.
     * @param ordersToDisplay The orders to lay out.
     * @returns One array per column; each column holds every nth order so heights stay balanced.
     * @remarks Reads the responsiveColumnCount signal, so a caller's computed re-runs on resize.
     */
    public distributeIntoColumns(ordersToDisplay: Order[]): Order[][] {
        const responsiveColumnCount = this.responsiveColumnCount();

        // Start with one empty array per column.
        const orderColumns: Order[][] = Array.from({ length: responsiveColumnCount }, () => []);

        // Place each order in the next column: index 0 → column 0, 1 → column 1, … then wrap back to
        // column 0. 'orderIndex % responsiveColumnCount' is the wrap-around (e.g. with 3 columns,
        // order 3 lands in column 0 again). We do not fill column 0 completely before using column 1.
        ordersToDisplay.forEach((order: Order, orderIndex: number) => orderColumns[orderIndex % responsiveColumnCount].push(order));

        return orderColumns;
    }

    //#region Private helpers

    /**
     * Maps a viewport width to the number of columns to render.
     * @param viewportWidthPixels The current viewport width in pixels.
     * @returns The column count for that width band.
     */
    private getColumnCountForViewportWidth(viewportWidthPixels: number): number {
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
    }
    //#endregion
}
