import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, ViewChild, computed, inject, signal } from '@angular/core';
import { OrderDisplayStateService } from '../../services/order-display-state.service';

@Component({
  selector: 'app-customer-display',
  imports: [],
  templateUrl: './customer-display.html',
  styleUrl: './customer-display.css',
})
export class CustomerDisplay implements AfterViewInit, OnDestroy {
  //#region Injected dependencies

  /**
   * Injects the OrderDisplayStateService, which is the service that owns the order state.
   * @remarks 'inject(...)' is the recommended way to inject services into components.
   */
  private readonly orderDisplayState = inject(OrderDisplayStateService);

  /**
   * Injects Angular's NgZone.
   * @remarks Ngzone is a service that allows us to run code that is not part of the Angular framework,
   * such as the ResizeObserver. ResizeObserver fires outside Angular's change detection zone
   */
  private readonly ngZone = inject(NgZone);
  //#endregion

  //#region Grid layout constants

  /** Number of order-number columns in the left grid (Tilbereder). */
  private readonly leftColumnsPerRow = 5;
  /** Number of order-number columns in the right grid (Afhent). */
  private readonly rightColumnsPerRow = 3;
  /** Initial row count used to seed the left grid's visible item count before measurement. */
  private readonly initialLeftVisibleRowCount = 3;
  /** Initial row count used to seed the right grid's visible item count before measurement. */
  private readonly initialRightVisibleRowCount = 2;
  /** Gap between grid items in pixels, included when measuring item height. */
  private readonly gridGapPixels = 24;
  /** When no item is rendered yet, assume this many rows fit to estimate item height. */
  private readonly assumedVisibleRowCountForHeightEstimate = 3;
  /** Fallback row count used when item height can't be measured. */
  private readonly fallbackVisibleRowCount = 2;
  //#endregion

  //#region Visible item count signals

  /**
   * How many preparing orders the left grid can show before overflow.
   * @remarks Writable signal, recalculated when the grid resizes.
   */
  private readonly leftVisibleCount = signal<number>(this.leftColumnsPerRow * this.initialLeftVisibleRowCount);

  /**
   * How many ready-for-pickup orders the right grid can show before overflow.
   * @remarks Writable signal, recalculated when the grid resizes.
   */
  private readonly rightVisibleCount = signal<number>(this.rightColumnsPerRow * this.initialRightVisibleRowCount);
  //#endregion

  //#region Left column (Tilbereder)

  /**
   * Preparing orders that fit in the left grid.
   * @remarks computed signals are derived signals, this recomputes when preparingOrders or leftVisibleCount changes.
   */
  protected readonly leftVisible = computed(() =>
    this.orderDisplayState.preparingOrders().slice(0, this.leftVisibleCount())
  );

  /**
   * Preparing orders that don't fit and are shown in the overflow indicator.
   * @remarks computed signals are derived signals, this recomputes when preparingOrders or leftVisibleCount changes.
   */
  protected readonly leftOverflow = computed(() =>
    this.orderDisplayState.preparingOrders().slice(this.leftVisibleCount())
  );

  /** Whether the left column has orders hidden behind the overflow indicator. */
  protected readonly hasLeftOverflow = computed(() => this.leftOverflow().length > 0);
  //#endregion

  //#region Right column (Afhent)

  /**
   * Ready-for-pickup orders that fit in the right grid.
   * @remarks computed signals are derived signals, this recomputes when readyForPickupOrders or rightVisibleCount changes.
   */
  protected readonly rightVisible = computed(() =>
    this.orderDisplayState.readyForPickupOrders().slice(0, this.rightVisibleCount())
  );

  /**
   * Ready-for-pickup orders that don't fit and are shown in the overflow indicator.
   * @remarks computed signals are derived signals, this recomputes when readyForPickupOrders or rightVisibleCount changes.
   */
  protected readonly rightOverflow = computed(() =>
    this.orderDisplayState.readyForPickupOrders().slice(this.rightVisibleCount())
  );

  /** Whether the right column has orders hidden behind the overflow indicator. */
  protected readonly hasRightOverflow = computed(() => this.rightOverflow().length > 0);
  //#endregion

  //#region View references

  /**
   * Reference to the left grid DOM element.
   * @remarks The '!' tells TypeScript the field is assigned after the view initializes.
   * @remarks @ViewChild queries the template for an element with the matching template reference variable.
   */
  @ViewChild('leftGrid') private leftGridRef!: ElementRef<HTMLDivElement>;

  /**
   * Reference to the right grid DOM element.
   * @remarks The '!' tells TypeScript the field is assigned after the view initializes.
   * @remarks @ViewChild queries the template for an element with the matching template reference variable.
   */
  @ViewChild('rightGrid') private rightGridRef!: ElementRef<HTMLDivElement>;

  /**
   * Watches both grids for size changes and recalculates how many orders fit.
   * @remarks Optional because ngOnDestroy must be safe even when the observer was never created.
   */
  private resizeObserver?: ResizeObserver;
  //#endregion

  //#region Lifecycle hooks

  /**
   * Sets up the initial visible counts and starts watching both grids for resize.
   * @remarks AfterViewInit runs once the template is rendered, so ViewChild refs are available.
   * @returns void
   */
  ngAfterViewInit(): void {
    this.recalculateVisibleCounts();

    this.resizeObserver = new ResizeObserver(() => {
      this.ngZone.run(() => this.recalculateVisibleCounts());
    });

    this.resizeObserver.observe(this.leftGridRef.nativeElement);
    this.resizeObserver.observe(this.rightGridRef.nativeElement);
  }

  /**
   * Disconnects the ResizeObserver when the component is destroyed.
   * @remarks Prevents memory leaks from the observer continuing to fire after the view is gone.
   * @returns void
   */
  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }
  //#endregion

  //#region Resize / visible count calculation

  /**
   * Recalculates how many orders each grid can display based on its current height.
   * @returns void
   */
  private recalculateVisibleCounts(): void {
    this.leftVisibleCount.set(
      this.calculateVisibleCount(this.leftGridRef.nativeElement, this.leftColumnsPerRow)
    );
    this.rightVisibleCount.set(
      this.calculateVisibleCount(this.rightGridRef.nativeElement, this.rightColumnsPerRow)
    );
  }

  /**
   * Calculates how many order slots fit in a grid given its height and column count.
   * @param gridElement The grid DOM element to measure.
   * @param columnsPerRow How many columns the grid renders per row.
   * @returns The number of order slots that fit (always at least one full row).
   */
  private calculateVisibleCount(gridElement: HTMLElement, columnsPerRow: number): number {
    const gridHeight = gridElement.clientHeight;
    const firstItem = gridElement.querySelector('.queue-item, .current') as HTMLElement | null;

    let itemHeight: number;
    if (firstItem) {
      itemHeight = firstItem.offsetHeight + this.gridGapPixels;
    } else {
      itemHeight = Math.floor(gridHeight / this.assumedVisibleRowCountForHeightEstimate);
    }

    if (itemHeight <= 0) {
      return columnsPerRow * this.fallbackVisibleRowCount;
    }

    const rowsThatFit = Math.floor(gridHeight / itemHeight);
    return Math.max(columnsPerRow, rowsThatFit * columnsPerRow);
  }
  //#endregion
}
