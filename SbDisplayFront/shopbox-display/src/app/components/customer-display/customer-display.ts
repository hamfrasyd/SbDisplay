import { Component, computed, signal, OnDestroy, ElementRef, ViewChild, AfterViewInit, NgZone, Inject, PLATFORM_ID, } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { OrderDisplayStateService } from '../../services/order-display-state.service';

const LEFT_COLUMNS = 5;
const RIGHT_COLUMNS = 3;

@Component({
  selector: 'app-customer-display',
  imports: [],
  templateUrl: './customer-display.html',
  styleUrl: './customer-display.css',
})
export class CustomerDisplay implements AfterViewInit, OnDestroy {

  private leftVisibleCount = signal<number>(LEFT_COLUMNS * 3);
  private rightVisibleCount = signal<number>(RIGHT_COLUMNS * 2);

  // ---- Left column (Tilbereder) ----
  public leftVisible = computed(() =>
    this.orderDisplayState.preparingOrders().slice(0, this.leftVisibleCount())
  );
  public leftOverflow = computed(() =>
    this.orderDisplayState.preparingOrders().slice(this.leftVisibleCount())
  );
  public hasLeftOverflow = computed(() => this.leftOverflow().length > 0);

  // ---- Right column (Afhent) ----
  public rightVisible = computed(() =>
    this.orderDisplayState.readyForPickupOrders().slice(0, this.rightVisibleCount())
  );
  public rightOverflow = computed(() =>
    this.orderDisplayState.readyForPickupOrders().slice(this.rightVisibleCount())
  );
  public hasRightOverflow = computed(() => this.rightOverflow().length > 0);

  @ViewChild('leftGrid') leftGridRef!: ElementRef<HTMLDivElement>;
  @ViewChild('rightGrid') rightGridRef!: ElementRef<HTMLDivElement>;

  // Mark as optional (?) so ngOnDestroy is safe even when the observer was
  // never created (i.e. during SSR where we skip the browser block entirely)
  private resizeObserver?: ResizeObserver;

  constructor(
    public orderDisplayState: OrderDisplayStateService,
    private ngZone: NgZone,
    // FIX: Inject PLATFORM_ID so we can check whether we're running in a
    // browser or on the server before touching any browser-only APIs.
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  ngAfterViewInit(): void {
    // FIX: This guard is the direct fix for "ResizeObserver is not defined".
    // Angular Universal (SSR) runs ngAfterViewInit on the server too, but
    // Node.js has no ResizeObserver, no DOM, no clientHeight — nothing.
    // isPlatformBrowser() returns false on the server so we exit immediately.
    // The browser hydration picks up normally after this.
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

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
      this.calcVisibleCount(this.leftGridRef.nativeElement, LEFT_COLUMNS, 24)
    );
    this.rightVisibleCount.set(
      this.calcVisibleCount(this.rightGridRef.nativeElement, RIGHT_COLUMNS, 24)
    );
  }

  private calcVisibleCount(
    gridEl: HTMLElement,
    columnsPerRow: number,
    gap: number
  ): number {
    const gridHeight = gridEl.clientHeight;
    const firstItem = gridEl.querySelector('.queue-item, .current') as HTMLElement | null;

    let itemHeight: number;
    if (firstItem) {
      itemHeight = firstItem.offsetHeight + gap;
    } else {
      itemHeight = Math.floor(gridHeight / 3);
    }

    if (itemHeight <= 0) return columnsPerRow * 2;

    const rowsFit = Math.floor(gridHeight / itemHeight);
    return Math.max(columnsPerRow, rowsFit * columnsPerRow);
  }
}