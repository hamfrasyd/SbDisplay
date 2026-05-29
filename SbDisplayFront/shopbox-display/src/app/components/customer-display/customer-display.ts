import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, ViewChild, computed, inject, signal } from '@angular/core';
import { OrderDisplayStateService } from '../../services/order-display-state.service';

@Component({
  selector: 'app-customer-display',
  imports: [],
  templateUrl: './customer-display.html',
  styleUrl: './customer-display.css',
})
export class CustomerDisplay implements AfterViewInit, OnDestroy {
  private readonly orderDisplayState = inject(OrderDisplayStateService);
  private readonly ngZone = inject(NgZone);

  private readonly leftColumnsPerRow = 5;
  private readonly rightColumnsPerRow = 3;
  private readonly initialLeftVisibleRowCount = 3;
  private readonly initialRightVisibleRowCount = 2;
  private readonly gridGapPixels = 24;
  // When no item is rendered yet, assume this many rows fit to estimate item height.
  private readonly assumedVisibleRowCountForHeightEstimate = 3;
  // Fallback row count used when item height can't be measured.
  private readonly fallbackVisibleRowCount = 2;

  private readonly leftVisibleCount = signal<number>(this.leftColumnsPerRow * this.initialLeftVisibleRowCount);
  private readonly rightVisibleCount = signal<number>(this.rightColumnsPerRow * this.initialRightVisibleRowCount);

  // ---- Left column (Tilbereder) ----
  protected readonly leftVisible = computed(() =>
    this.orderDisplayState.preparingOrders().slice(0, this.leftVisibleCount())
  );
  protected readonly leftOverflow = computed(() =>
    this.orderDisplayState.preparingOrders().slice(this.leftVisibleCount())
  );
  protected readonly hasLeftOverflow = computed(() => this.leftOverflow().length > 0);

  // ---- Right column (Afhent) ----
  protected readonly rightVisible = computed(() =>
    this.orderDisplayState.readyForPickupOrders().slice(0, this.rightVisibleCount())
  );
  protected readonly rightOverflow = computed(() =>
    this.orderDisplayState.readyForPickupOrders().slice(this.rightVisibleCount())
  );
  protected readonly hasRightOverflow = computed(() => this.rightOverflow().length > 0);

  @ViewChild('leftGrid') private leftGridRef!: ElementRef<HTMLDivElement>;
  @ViewChild('rightGrid') private rightGridRef!: ElementRef<HTMLDivElement>;

  private resizeObserver?: ResizeObserver;

  ngAfterViewInit(): void {
    this.recalculateVisibleCounts();

    this.resizeObserver = new ResizeObserver(() => {
      // ResizeObserver fires outside Angular's change detection zone.
      // ngZone.run() brings us back in so signal updates trigger re-renders.
      this.ngZone.run(() => this.recalculateVisibleCounts());
    });

    this.resizeObserver.observe(this.leftGridRef.nativeElement);
    this.resizeObserver.observe(this.rightGridRef.nativeElement);
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  private recalculateVisibleCounts(): void {
    this.leftVisibleCount.set(
      this.calculateVisibleCount(this.leftGridRef.nativeElement, this.leftColumnsPerRow)
    );
    this.rightVisibleCount.set(
      this.calculateVisibleCount(this.rightGridRef.nativeElement, this.rightColumnsPerRow)
    );
  }

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
}
