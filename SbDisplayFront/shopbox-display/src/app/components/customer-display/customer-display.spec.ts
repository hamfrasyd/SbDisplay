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
  observe(): void { }
  unobserve(): void { }
  disconnect(): void { }
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
  let customerDisplayComponent: CustomerDisplay;
  let customerDisplayFixture: ComponentFixture<CustomerDisplay>;
  let orderDisplayStateServiceStub: OrderDisplayStateServiceStub;

  beforeEach(async () => {
    globalThis.ResizeObserver = ResizeObserverStub;
    orderDisplayStateServiceStub = new OrderDisplayStateServiceStub();

    await TestBed.configureTestingModule({
      imports: [CustomerDisplay],
      providers: [{ provide: OrderDisplayStateService, useValue: orderDisplayStateServiceStub }],
    }).compileComponents();

    customerDisplayFixture = TestBed.createComponent(CustomerDisplay);
    customerDisplayComponent = customerDisplayFixture.componentInstance;
  });

  it('should create', () => {
    // Arrange
    // Component, fixture, and order-state stub are prepared in beforeEach.

    // Act
    customerDisplayFixture.detectChanges();

    // Assert
    expect(customerDisplayComponent).toBeTruthy();
  });

  //#region Left column (Tilbereder) overflow

  it('hasLeftOverflow_When_MorePreparingOrdersThanFit_Should_ReturnTrue', () => {
    // Arrange
    const leftGridColumnsPerRow = 5;
    const initialLeftGridVisibleRowCount = 3;
    const initialLeftGridVisibleOrderCount = leftGridColumnsPerRow * initialLeftGridVisibleRowCount;
    const singleOrderBeyondVisibleCapacity = 1;
    const preparingOrderCountExceedingLeftGridCapacity = initialLeftGridVisibleOrderCount + singleOrderBeyondVisibleCapacity;
    const preparingOrdersExceedingLeftGridCapacity = buildTestOrdersWithCountAndStatus(
      preparingOrderCountExceedingLeftGridCapacity,
      OrderStatus.UnderPreparation,
    );
    orderDisplayStateServiceStub.preparingOrders.set(preparingOrdersExceedingLeftGridCapacity);

    // Act
    const leftColumnHasHiddenPreparingOrders = customerDisplayComponent['hasLeftOverflow']();

    // Assert
    expect(leftColumnHasHiddenPreparingOrders).toBe(true);
  });

  it('hasLeftOverflow_When_FewerPreparingOrdersThanFit_Should_ReturnFalse', () => {
    // Arrange
    const preparingOrderCountBelowLeftGridCapacity = 3;
    const preparingOrdersBelowLeftGridCapacity = buildTestOrdersWithCountAndStatus(
      preparingOrderCountBelowLeftGridCapacity,
      OrderStatus.UnderPreparation,
    );

    orderDisplayStateServiceStub.preparingOrders.set(preparingOrdersBelowLeftGridCapacity);

    // Act
    const leftColumnHasHiddenPreparingOrders = customerDisplayComponent['hasLeftOverflow']();

    // Assert
    expect(leftColumnHasHiddenPreparingOrders).toBe(false);
  });

  it('leftVisible_When_MorePreparingOrdersThanFit_Should_CapAtVisibleCount', () => {
    // Arrange
    const leftGridColumnsPerRow = 5;
    const initialLeftGridVisibleRowCount = 3;
    const initialLeftGridVisibleOrderCount = leftGridColumnsPerRow * initialLeftGridVisibleRowCount;
    const fiveOrdersBeyondVisibleCapacity = 5;
    const preparingOrderCountWellAboveLeftGridCapacity = initialLeftGridVisibleOrderCount + fiveOrdersBeyondVisibleCapacity;
    const preparingOrdersWellAboveLeftGridCapacity = buildTestOrdersWithCountAndStatus(
      preparingOrderCountWellAboveLeftGridCapacity,
      OrderStatus.UnderPreparation,
    );

    orderDisplayStateServiceStub.preparingOrders.set(preparingOrdersWellAboveLeftGridCapacity);

    // Act
    const visiblePreparingOrdersInLeftColumn = customerDisplayComponent['leftVisible']();

    // Assert
    expect(visiblePreparingOrdersInLeftColumn.length).toBe(initialLeftGridVisibleOrderCount);
  });
  //#endregion

  //#region Right column (Afhent) overflow

  it('hasRightOverflow_When_MoreReadyOrdersThanFit_Should_ReturnTrue', () => {
    // Arrange
    const rightGridColumnsPerRow = 3;
    const initialRightGridVisibleRowCount = 2;
    const initialRightGridVisibleOrderCount = rightGridColumnsPerRow * initialRightGridVisibleRowCount;
    const singleOrderBeyondVisibleCapacity = 1;
    const readyForPickupOrderCountExceedingRightGridCapacity = initialRightGridVisibleOrderCount + singleOrderBeyondVisibleCapacity;
    const readyForPickupOrdersExceedingRightGridCapacity = buildTestOrdersWithCountAndStatus(
      readyForPickupOrderCountExceedingRightGridCapacity,
      OrderStatus.ReadyForPickup,
    );

    orderDisplayStateServiceStub.readyForPickupOrders.set(readyForPickupOrdersExceedingRightGridCapacity);

    // Act
    const rightColumnHasHiddenReadyForPickupOrders = customerDisplayComponent['hasRightOverflow']();

    // Assert
    expect(rightColumnHasHiddenReadyForPickupOrders).toBe(true);
  });

  it('hasRightOverflow_When_FewerReadyOrdersThanFit_Should_ReturnFalse', () => {
    // Arrange
    const readyForPickupOrderCountBelowRightGridCapacity = 2;
    const readyForPickupOrdersBelowRightGridCapacity = buildTestOrdersWithCountAndStatus(
      readyForPickupOrderCountBelowRightGridCapacity,
      OrderStatus.ReadyForPickup,
    );

    orderDisplayStateServiceStub.readyForPickupOrders.set(readyForPickupOrdersBelowRightGridCapacity);

    // Act
    const rightColumnHasHiddenReadyForPickupOrders = customerDisplayComponent['hasRightOverflow']();

    // Assert
    expect(rightColumnHasHiddenReadyForPickupOrders).toBe(false);
  });

  it('rightVisible_When_MoreReadyOrdersThanFit_Should_CapAtVisibleCount', () => {
    // Arrange
    const rightGridColumnsPerRow = 3;
    const initialRightGridVisibleRowCount = 2;
    const initialRightGridVisibleOrderCount = rightGridColumnsPerRow * initialRightGridVisibleRowCount;
    const fiveOrdersBeyondVisibleCapacity = 5;
    const readyForPickupOrderCountWellAboveRightGridCapacity = initialRightGridVisibleOrderCount + fiveOrdersBeyondVisibleCapacity;
    const readyForPickupOrdersWellAboveRightGridCapacity = buildTestOrdersWithCountAndStatus(
      readyForPickupOrderCountWellAboveRightGridCapacity,
      OrderStatus.ReadyForPickup,
    );

    orderDisplayStateServiceStub.readyForPickupOrders.set(readyForPickupOrdersWellAboveRightGridCapacity);

    // Act
    const visibleReadyForPickupOrdersInRightColumn = customerDisplayComponent['rightVisible']();

    // Assert
    expect(visibleReadyForPickupOrdersInRightColumn.length).toBe(initialRightGridVisibleOrderCount);
  });
  //#endregion
});

function buildTestOrdersWithCountAndStatus(orderCount: number, orderStatus: OrderStatus): Order[] {
  const testOrders: Order[] = [];
  const firstIndex = 1;

  for (
    let currentIndex = firstIndex; currentIndex <= orderCount; currentIndex++
  ) {
    testOrders.push({
      transactionId: currentIndex,
      id: currentIndex,
      status: orderStatus,
    });
  }

  return testOrders;
}
