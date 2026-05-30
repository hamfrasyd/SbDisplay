import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';

import { EmployeeDisplay } from './employee-display';
import { OrderDisplayStateService } from '../../services/order-display-state.service';
import { Order, OrderStatus } from '../../generated/orders';

/**
 * Stub for OrderDisplayStateService so EmployeeDisplay tests never touch HTTP or SignalR.
 * It exposes the same surface the component reads (orders/loadError signals) plus a spy command,
 * and lets each test drive the state by setting the signals.
 */
class OrderDisplayStateServiceStub {
  readonly orders = signal<Order[]>([]);
  readonly loadError = signal<string | null>(null);
  updateOrderStatus = vi.fn();
}

describe('EmployeeDisplay', () => {
  let component: EmployeeDisplay;
  let fixture: ComponentFixture<EmployeeDisplay>;
  let orderStateStub: OrderDisplayStateServiceStub;

  const underPreparationOrder: Order = { transactionId: 1, id: 11, status: OrderStatus.UnderPreparation };
  const readyForPickupOrder: Order = { transactionId: 2, id: 22, status: OrderStatus.ReadyForPickup };
  const completedOrder: Order = { transactionId: 3, id: 33, status: OrderStatus.Completed };

  beforeEach(async () => {
    orderStateStub = new OrderDisplayStateServiceStub();

    await TestBed.configureTestingModule({
      imports: [EmployeeDisplay],
      providers: [{ provide: OrderDisplayStateService, useValue: orderStateStub }],
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeDisplay);
    component = fixture.componentInstance;
  });

  //#region Tab filtering

  it('receivedOrders_When_OrdersHaveMixedStatuses_Should_ReturnUnderPreparationAndReadyForPickup', () => {
    orderStateStub.orders.set([underPreparationOrder, readyForPickupOrder, completedOrder]);

    expect(component['receivedOrders']()).toEqual([underPreparationOrder, readyForPickupOrder]);
  });

  it('completedOrders_When_OrdersHaveMixedStatuses_Should_ReturnOnlyCompleted', () => {
    orderStateStub.orders.set([underPreparationOrder, readyForPickupOrder, completedOrder]);

    expect(component['completedOrders']()).toEqual([completedOrder]);
  });
  //#endregion

  //#region Tab swapping

  it('setActiveEmployeeTab_When_SwitchedToCompleted_Should_ShowCompletedOrders', () => {
    orderStateStub.orders.set([underPreparationOrder, completedOrder]);

    component['setActiveEmployeeTab'](component['employeeTabEnum'].Completed);

    expect(component['currentlyDisplayedOrders']()).toEqual([completedOrder]);
  });

  it('currentlyDisplayedOrders_When_OrderMovesToCompleted_Should_LeaveReceivedAndAppearInCompleted', () => {
    // The order starts on the Received tab while it is under preparation...
    orderStateStub.orders.set([{ ...underPreparationOrder }]);
    expect(component['receivedOrders']().length).toBe(1);
    expect(component['completedOrders']().length).toBe(0);

    // ...and once its status flips to Completed it swaps tabs (the computed re-filters off the signal).
    orderStateStub.orders.set([{ ...underPreparationOrder, status: OrderStatus.Completed }]);

    expect(component['receivedOrders']().length).toBe(0);
    expect(component['completedOrders']().length).toBe(1);
  });

  it('tabBar_When_CompletedTabClicked_Should_RenderCompletedOrderCards', async () => {
    orderStateStub.orders.set([underPreparationOrder, readyForPickupOrder, completedOrder]);
    fixture.detectChanges();
    await fixture.whenStable();

    // Two received orders are shown on the default tab.
    expect(fixture.nativeElement.querySelectorAll('app-order-card').length).toBe(2);

    // Click the second tab button ("Færdig") to switch to the Completed tab.
    const tabButtons = fixture.nativeElement.querySelectorAll('.nav-link');
    (tabButtons[1] as HTMLButtonElement).click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelectorAll('app-order-card').length).toBe(1);
  });
  //#endregion

  //#region Status-change command + error handling

  it('onOrderStatusChange_When_UpdateFails_Should_SetCardErrorForThatOrder', () => {
    orderStateStub.updateOrderStatus.mockReturnValue(throwError(() => new Error('network down')));

    component['onOrderStatusChange'](readyForPickupOrder, OrderStatus.Completed);

    expect(component['getOrderCardErrorMessage'](readyForPickupOrder)).toBe('Kunne ikke opdatere status. Prøv igen.');
  });

  it('onOrderStatusChange_When_UpdateSucceedsAfterError_Should_ClearCardError', () => {
    // Arrange: first call fails and leaves an error on the card.
    orderStateStub.updateOrderStatus.mockReturnValue(throwError(() => new Error('network down')));
    component['onOrderStatusChange'](readyForPickupOrder, OrderStatus.Completed);

    // Act: a following successful call should clear that card's error.
    orderStateStub.updateOrderStatus.mockReturnValue(of(completedOrder));
    component['onOrderStatusChange'](readyForPickupOrder, OrderStatus.Completed);

    expect(component['getOrderCardErrorMessage'](readyForPickupOrder)).toBeNull();
  });

  it('onOrderStatusChange_When_OrderHasNoTransactionId_Should_SetPageLevelError', () => {
    const orderWithoutTransactionId: Order = { id: 99, status: OrderStatus.UnderPreparation };

    component['onOrderStatusChange'](orderWithoutTransactionId, OrderStatus.ReadyForPickup);

    expect(component['pageLevelErrorMessage']()).toBe('Kan ikke opdatere ordre uden transactionId.');
    expect(orderStateStub.updateOrderStatus).not.toHaveBeenCalled();
  });

  it('clearPageLevelErrorMessage_When_Called_Should_ResetMessageToNull', () => {
    component['onOrderStatusChange']({ id: 99, status: OrderStatus.UnderPreparation }, OrderStatus.ReadyForPickup);
    expect(component['pageLevelErrorMessage']()).not.toBeNull();

    component['clearPageLevelErrorMessage']();

    expect(component['pageLevelErrorMessage']()).toBeNull();
  });
  //#endregion

  //#region Per-card error lookup

  it('getOrderCardErrorMessage_When_NoErrorForOrder_Should_ReturnNull', () => {
    expect(component['getOrderCardErrorMessage'](readyForPickupOrder)).toBeNull();
  });
  //#endregion
});
