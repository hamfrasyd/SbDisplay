import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';

import { EmployeeDisplay } from './employee-display';
import { OrderDisplayStateService } from '../../services/order-display-state.service';
import { Order, OrderStatus } from '../../generated/orders';

/**
 * Stub for OrderDisplayStateService so EmployeeDisplay tests never touch HTTP or SignalR.
 * It exposes the same surface the component reads (orders/loadError/isLoadingOrders signals) plus a spy command,
 * and lets each test drive the state by setting the signals.
 */
class OrderDisplayStateServiceStub {
  readonly orders = signal<Order[]>([]);
  readonly loadError = signal<string | null>(null);
  readonly isLoadingOrders = signal<boolean>(false);
  updateOrderStatus = vi.fn();
}

describe('EmployeeDisplay', () => {
  let employeeDisplayComponent: EmployeeDisplay;
  let employeeDisplayFixture: ComponentFixture<EmployeeDisplay>;
  let orderDisplayStateServiceStub: OrderDisplayStateServiceStub;

  beforeEach(async () => {
    orderDisplayStateServiceStub = new OrderDisplayStateServiceStub();

    await TestBed.configureTestingModule({
      imports: [EmployeeDisplay],
      providers: [{ provide: OrderDisplayStateService, useValue: orderDisplayStateServiceStub }],
    }).compileComponents();

    employeeDisplayFixture = TestBed.createComponent(EmployeeDisplay);
    employeeDisplayComponent = employeeDisplayFixture.componentInstance;
  });

  it('should create', () => {
    // Arrange
    // Component, fixture, and order-state stub are prepared in beforeEach.

    // Act
    employeeDisplayFixture.detectChanges();

    // Assert
    expect(employeeDisplayComponent).toBeTruthy();
  });

  it('ordersBoard_When_InitialOrdersLoadIsInProgress_Should_ShowLoadingIndicator', () => {
    // Arrange
    orderDisplayStateServiceStub.isLoadingOrders.set(true);

    // Act
    employeeDisplayFixture.detectChanges();

    const loadingIndicatorElement = employeeDisplayFixture.nativeElement.querySelector('.employee-orders-loading');

    // Assert
    expect(loadingIndicatorElement).toBeTruthy();
  });

  //#region Tab filtering

  it('receivedOrders_When_OrdersHaveMixedStatuses_Should_ReturnUnderPreparationAndReadyForPickup', () => {
    // Arrange
    const underPreparationOrderTransactionId = 1;
    const underPreparationOrderId = 11;
    const readyForPickupOrderTransactionId = 2;
    const readyForPickupOrderId = 22;
    const completedOrderTransactionId = 3;
    const completedOrderId = 33;

    const orderUnderPreparation = {
      transactionId: underPreparationOrderTransactionId,
      id: underPreparationOrderId,
      status: OrderStatus.UnderPreparation,
    };
    const orderReadyForPickup = {
      transactionId: readyForPickupOrderTransactionId,
      id: readyForPickupOrderId,
      status: OrderStatus.ReadyForPickup,
    };
    const completedOrder = {
      transactionId: completedOrderTransactionId,
      id: completedOrderId,
      status: OrderStatus.Completed,
    };

    const ordersWithMixedStatuses = [orderUnderPreparation, orderReadyForPickup, completedOrder];
    orderDisplayStateServiceStub.orders.set(ordersWithMixedStatuses);

    // Act
    const receivedOrdersOnEmployeeDisplay = employeeDisplayComponent['receivedOrders']();

    // Assert
    expect(receivedOrdersOnEmployeeDisplay).toEqual([orderUnderPreparation, orderReadyForPickup]);
  });

  it('completedOrders_When_OrdersHaveMixedStatuses_Should_ReturnOnlyCompleted', () => {
    // Arrange
    const underPreparationOrderTransactionId = 1;
    const underPreparationOrderId = 11;
    const readyForPickupOrderTransactionId = 2;
    const readyForPickupOrderId = 22;
    const completedOrderTransactionId = 3;
    const completedOrderId = 33;

    const orderUnderPreparation = {
      transactionId: underPreparationOrderTransactionId,
      id: underPreparationOrderId,
      status: OrderStatus.UnderPreparation,
    };
    const orderReadyForPickup = {
      transactionId: readyForPickupOrderTransactionId,
      id: readyForPickupOrderId,
      status: OrderStatus.ReadyForPickup,
    };
    const completedOrder = {
      transactionId: completedOrderTransactionId,
      id: completedOrderId,
      status: OrderStatus.Completed,
    };

    const ordersWithMixedStatuses = [orderUnderPreparation, orderReadyForPickup, completedOrder];
    orderDisplayStateServiceStub.orders.set(ordersWithMixedStatuses);

    // Act
    const completedOrdersOnEmployeeDisplay = employeeDisplayComponent['completedOrders']();

    // Assert
    expect(completedOrdersOnEmployeeDisplay).toEqual([completedOrder]);
  });
  //#endregion

  //#region Tab swapping

  it('setActiveEmployeeTab_When_SwitchedToCompleted_Should_ShowCompletedOrders', () => {
    // Arrange
    const underPreparationOrderTransactionId = 1;
    const underPreparationOrderId = 11;
    const completedOrderTransactionId = 3;
    const completedOrderId = 33;
    
    const orderUnderPreparation = {
      transactionId: underPreparationOrderTransactionId,
      id: underPreparationOrderId,
      status: OrderStatus.UnderPreparation,
    };
    const completedOrder = {
      transactionId: completedOrderTransactionId,
      id: completedOrderId,
      status: OrderStatus.Completed,
    };

    const employeeCompletedTab = employeeDisplayComponent['employeeTabEnum'].Completed;
    orderDisplayStateServiceStub.orders.set([orderUnderPreparation, completedOrder]);

    // Act
    employeeDisplayComponent['setActiveEmployeeTab'](employeeCompletedTab);
    const currentlyDisplayedOrdersAfterTabSwitch = employeeDisplayComponent['currentlyDisplayedOrders']();

    // Assert
    expect(currentlyDisplayedOrdersAfterTabSwitch).toEqual([completedOrder]);
  });

  it('currentlyDisplayedOrders_When_OrderMovesToCompleted_Should_LeaveReceivedAndAppearInCompleted', () => {
    // Arrange
    const underPreparationOrderTransactionId = 1;
    const underPreparationOrderId = 11;

    const orderUnderPreparation = {
      transactionId: underPreparationOrderTransactionId,
      id: underPreparationOrderId,
      status: OrderStatus.UnderPreparation,
    };
    const orderMovedToCompleted = {
      ...orderUnderPreparation,
      status: OrderStatus.Completed,
    };

    orderDisplayStateServiceStub.orders.set([orderUnderPreparation]);

    const receivedOrderCountBeforeStatusChange = employeeDisplayComponent['receivedOrders']().length;
    const completedOrderCountBeforeStatusChange = employeeDisplayComponent['completedOrders']().length;

    // Act
    orderDisplayStateServiceStub.orders.set([orderMovedToCompleted]);

    const receivedOrderCountAfterStatusChange = employeeDisplayComponent['receivedOrders']().length;
    const completedOrderCountAfterStatusChange = employeeDisplayComponent['completedOrders']().length;

    // Assert
    expect(receivedOrderCountBeforeStatusChange).toBe(1);
    expect(completedOrderCountBeforeStatusChange).toBe(0);
    expect(receivedOrderCountAfterStatusChange).toBe(0);
    expect(completedOrderCountAfterStatusChange).toBe(1);
  });

  it('tabBar_When_CompletedTabClicked_Should_RenderCompletedOrderCards', async () => {
    // Arrange
    const underPreparationOrderTransactionId = 1;
    const underPreparationOrderId = 11;
    const readyForPickupOrderTransactionId = 2;
    const readyForPickupOrderId = 22;
    const completedOrderTransactionId = 3;
    const completedOrderId = 33;
    const expectedReceivedTabOrderCardCount = 2;
    const expectedCompletedTabOrderCardCount = 1;
    const completedTabButtonIndex = 1;

    const orderUnderPreparation = {
      transactionId: underPreparationOrderTransactionId,
      id: underPreparationOrderId,
      status: OrderStatus.UnderPreparation,
    };
    const orderReadyForPickup = {
      transactionId: readyForPickupOrderTransactionId,
      id: readyForPickupOrderId,
      status: OrderStatus.ReadyForPickup,
    };
    const completedOrder = {
      transactionId: completedOrderTransactionId,
      id: completedOrderId,
      status: OrderStatus.Completed,
    };

    const ordersWithMixedStatuses = [orderUnderPreparation, orderReadyForPickup, completedOrder];
    orderDisplayStateServiceStub.orders.set(ordersWithMixedStatuses);

    employeeDisplayFixture.detectChanges();
    await employeeDisplayFixture.whenStable();

    const orderCardCountOnDefaultReceivedTab = employeeDisplayFixture.nativeElement.querySelectorAll('app-order-card').length;

    const employeeTabButtons = employeeDisplayFixture.nativeElement.querySelectorAll('.nav-link');
    const completedTabButton = employeeTabButtons[completedTabButtonIndex] as HTMLButtonElement;

    // Act
    completedTabButton.click();

    employeeDisplayFixture.detectChanges();
    await employeeDisplayFixture.whenStable();

    const orderCardCountOnCompletedTab = employeeDisplayFixture.nativeElement.querySelectorAll('app-order-card').length;

    // Assert
    expect(orderCardCountOnDefaultReceivedTab).toBe(expectedReceivedTabOrderCardCount);
    expect(orderCardCountOnCompletedTab).toBe(expectedCompletedTabOrderCardCount);
  });
  //#endregion

  //#region Status-change command + error handling

  it('onOrderStatusChange_When_UpdateFails_Should_SetCardErrorForThatOrder', () => {
    // Arrange
    const readyForPickupOrderTransactionId = 2;
    const readyForPickupOrderId = 22;
    const targetOrderStatusAfterUpdate = OrderStatus.Completed;
    const expectedCardErrorMessage = 'Kunne ikke opdatere status. Prøv igen.';
    const simulatedNetworkFailureError = new Error('network down');

    const orderReadyForPickup = {
      transactionId: readyForPickupOrderTransactionId,
      id: readyForPickupOrderId,
      status: OrderStatus.ReadyForPickup,
    };

    orderDisplayStateServiceStub.updateOrderStatus.mockReturnValue(
      throwError(() => simulatedNetworkFailureError),
    );

    // Act
    employeeDisplayComponent['onOrderStatusChange'](orderReadyForPickup, targetOrderStatusAfterUpdate);
    const cardErrorMessageAfterFailedUpdate = employeeDisplayComponent['errorMessageByOrderTransactionId']().get(readyForPickupOrderTransactionId) ?? null;

    // Assert
    expect(cardErrorMessageAfterFailedUpdate).toBe(expectedCardErrorMessage);
  });

  it('onOrderStatusChange_When_UpdateSucceedsAfterError_Should_ClearCardError', () => {
    // Arrange
    const readyForPickupOrderTransactionId = 2;
    const readyForPickupOrderId = 22;
    const targetOrderStatusAfterUpdate = OrderStatus.Completed;
    const simulatedNetworkFailureError = new Error('network down');

    const orderReadyForPickup = {
      transactionId: readyForPickupOrderTransactionId,
      id: readyForPickupOrderId,
      status: OrderStatus.ReadyForPickup,
    };
    const orderReadyForPickupAfterSuccessfulUpdate = {
      transactionId: readyForPickupOrderTransactionId,
      id: readyForPickupOrderId,
      status: OrderStatus.Completed,
    };

    orderDisplayStateServiceStub.updateOrderStatus.mockReturnValue(
      throwError(() => simulatedNetworkFailureError),
    );
    
    employeeDisplayComponent['onOrderStatusChange'](orderReadyForPickup, targetOrderStatusAfterUpdate);

    orderDisplayStateServiceStub.updateOrderStatus.mockReturnValue(
      of(orderReadyForPickupAfterSuccessfulUpdate),
    );

    // Act
    employeeDisplayComponent['onOrderStatusChange'](orderReadyForPickup, targetOrderStatusAfterUpdate);
    const cardErrorMessageAfterSuccessfulRetry = employeeDisplayComponent['errorMessageByOrderTransactionId']().get(readyForPickupOrderTransactionId) ?? null;

    // Assert
    expect(cardErrorMessageAfterSuccessfulRetry).toBeNull();
  });

  it('onOrderStatusChange_When_OrderHasNoTransactionId_Should_SetPageLevelError', () => {
    // Arrange
    const orderIdWithoutTransactionId = 99;
    const targetOrderStatusAfterUpdate = OrderStatus.ReadyForPickup;

    const expectedPageLevelErrorMessage = 'Kan ikke opdatere ordre uden transactionId.';
    const orderWithoutTransactionId = {
      id: orderIdWithoutTransactionId,
      status: OrderStatus.UnderPreparation,
    };

    // Act
    employeeDisplayComponent['onOrderStatusChange'](orderWithoutTransactionId, targetOrderStatusAfterUpdate);
    const pageLevelErrorMessageAfterMissingTransactionId = employeeDisplayComponent['pageLevelErrorMessage']();

    // Assert
    expect(pageLevelErrorMessageAfterMissingTransactionId).toBe(expectedPageLevelErrorMessage);
    expect(orderDisplayStateServiceStub.updateOrderStatus).not.toHaveBeenCalled();
  });

  it('clearPageLevelErrorMessage_When_Called_Should_ResetMessageToNull', () => {
    // Arrange
    const orderIdWithoutTransactionId = 99;
    const targetOrderStatusAfterUpdate = OrderStatus.ReadyForPickup;

    const orderWithoutTransactionId = {
      id: orderIdWithoutTransactionId,
      status: OrderStatus.UnderPreparation,
    };

    employeeDisplayComponent['onOrderStatusChange'](orderWithoutTransactionId, targetOrderStatusAfterUpdate);
    const pageLevelErrorMessageBeforeClear = employeeDisplayComponent['pageLevelErrorMessage']();

    // Act
    employeeDisplayComponent['clearPageLevelErrorMessage']();
    const pageLevelErrorMessageAfterClear = employeeDisplayComponent['pageLevelErrorMessage']();

    // Assert
    expect(pageLevelErrorMessageBeforeClear).not.toBeNull();
    expect(pageLevelErrorMessageAfterClear).toBeNull();
  });
  //#endregion

  //#region Per-card error lookup

  it('errorMessageByOrderTransactionId_When_NoErrorForOrder_Should_ReturnNull', () => {
    // Arrange
    const readyForPickupOrderTransactionId = 2;
    const readyForPickupOrderId = 22;

    const orderReadyForPickup = {
      transactionId: readyForPickupOrderTransactionId,
      id: readyForPickupOrderId,
      status: OrderStatus.ReadyForPickup,
    };

    // Act
    const cardErrorMessageWhenNoErrorWasSet = employeeDisplayComponent['errorMessageByOrderTransactionId']().get(readyForPickupOrderTransactionId) ?? null;

    // Assert
    expect(cardErrorMessageWhenNoErrorWasSet).toBeNull();
  });
  //#endregion
});
