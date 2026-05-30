import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { CustomerDisplay } from './customer-display';
import { OrderDisplayStateService } from '../../services/order-display-state.service';
import { Order, OrderStatus } from '../../generated/orders';

/**
 * CustomerDisplay uses ResizeObserver to notice when its order grids change size and reflow.
 * The test environment (jsdom) has no real ResizeObserver, so this stub stands in — it does
 * nothing, but lets the page load in tests without crashing.
 */
class ResizeObserverStub implements ResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

/**
 * Stub for OrderDisplayStateService so CustomerDisplay tests never touch HTTP or SignalR.
 * It exposes the two order selectors the page reads as signals each test can set directly.
 */
class OrderDisplayStateServiceStub {
  readonly preparingOrders = signal<Order[]>([]);
  readonly readyForPickupOrders = signal<Order[]>([]);
}

describe('CustomerDisplay', () => {
  let component: CustomerDisplay;
  let fixture: ComponentFixture<CustomerDisplay>;
  let orderStateStub: OrderDisplayStateServiceStub;

  // Defaults seeded by the component before any measurement: left = 5 cols * 3 rows, right = 3 cols * 2 rows.
  const defaultLeftVisibleCount = 15;
  const defaultRightVisibleCount = 6;

  beforeEach(async () => {
    globalThis.ResizeObserver = ResizeObserverStub;
    orderStateStub = new OrderDisplayStateServiceStub();

    await TestBed.configureTestingModule({
      imports: [CustomerDisplay],
      providers: [{ provide: OrderDisplayStateService, useValue: orderStateStub }],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomerDisplay);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();
  });

  //#region Left column (Tilbereder) overflow

  it('hasLeftOverflow_When_MorePreparingOrdersThanFit_Should_ReturnTrue', () => {
    orderStateStub.preparingOrders.set(buildOrders(defaultLeftVisibleCount + 1, OrderStatus.UnderPreparation));

    expect(component['hasLeftOverflow']()).toBe(true);
  });

  it('hasLeftOverflow_When_FewerPreparingOrdersThanFit_Should_ReturnFalse', () => {
    orderStateStub.preparingOrders.set(buildOrders(3, OrderStatus.UnderPreparation));

    expect(component['hasLeftOverflow']()).toBe(false);
  });

  it('leftVisible_When_MorePreparingOrdersThanFit_Should_CapAtVisibleCount', () => {
    orderStateStub.preparingOrders.set(buildOrders(defaultLeftVisibleCount + 5, OrderStatus.UnderPreparation));

    expect(component['leftVisible']().length).toBe(defaultLeftVisibleCount);
  });
  //#endregion

  //#region Right column (Afhent) overflow

  it('hasRightOverflow_When_MoreReadyOrdersThanFit_Should_ReturnTrue', () => {
    orderStateStub.readyForPickupOrders.set(buildOrders(defaultRightVisibleCount + 1, OrderStatus.ReadyForPickup));

    expect(component['hasRightOverflow']()).toBe(true);
  });

  it('hasRightOverflow_When_FewerReadyOrdersThanFit_Should_ReturnFalse', () => {
    orderStateStub.readyForPickupOrders.set(buildOrders(2, OrderStatus.ReadyForPickup));

    expect(component['hasRightOverflow']()).toBe(false);
  });

  it('rightVisible_When_MoreReadyOrdersThanFit_Should_CapAtVisibleCount', () => {
    orderStateStub.readyForPickupOrders.set(buildOrders(defaultRightVisibleCount + 5, OrderStatus.ReadyForPickup));

    expect(component['rightVisible']().length).toBe(defaultRightVisibleCount);
  });
  //#endregion
});

/** Builds the requested number of orders with unique ids and the given status. */
function buildOrders(count: number, status: OrderStatus): Order[] {
  return Array.from({ length: count }, (_unused, index) => ({
    transactionId: index + 1,
    id: index + 1,
    status,
  }));
}
