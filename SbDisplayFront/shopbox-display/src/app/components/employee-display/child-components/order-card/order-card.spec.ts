import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrderCard } from './order-card';
import { OrderItem, OrderStatus } from '../../../../generated/orders';

describe('OrderCard', () => {
  let orderCardComponent: OrderCard;
  let orderCardFixture: ComponentFixture<OrderCard>;
  let statusesEmittedByOrderCard: OrderStatus[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderCard],
    }).compileComponents();

    orderCardFixture = TestBed.createComponent(OrderCard);
    orderCardComponent = orderCardFixture.componentInstance;

    statusesEmittedByOrderCard = [];
    orderCardComponent.statusChange.subscribe((status) => statusesEmittedByOrderCard.push(status));
  });

  it('should create', () => {
    // Arrange
    const testOrderTransactionId = 1;
    const orderUnderPreparation = {
      transactionId: testOrderTransactionId,
      status: OrderStatus.UnderPreparation,
    };

    orderCardFixture.componentRef.setInput('order', orderUnderPreparation);

    // Act
    orderCardFixture.detectChanges();

    // Assert
    expect(orderCardComponent).toBeTruthy();
  });

  //#region Double-click advances status

  it('onOrderCardDoubleClick_When_OrderIsUnderPreparation_Should_EmitReadyForPickup', () => {
    // Arrange
    const testOrderTransactionId = 1;
    const orderUnderPreparation = {
      transactionId: testOrderTransactionId,
      status: OrderStatus.UnderPreparation,
    };

    orderCardFixture.componentRef.setInput('order', orderUnderPreparation);
    orderCardFixture.detectChanges();

    const orderCardHeaderElement = orderCardFixture.nativeElement.querySelector('.card-header') as HTMLElement;

    // Act
    orderCardHeaderElement.dispatchEvent(new MouseEvent('dblclick'));

    // Assert
    expect(statusesEmittedByOrderCard).toEqual([OrderStatus.ReadyForPickup]);
  });

  it('onOrderCardDoubleClick_When_OrderIsReadyForPickup_Should_EmitCompleted', () => {
    // Arrange
    const testOrderTransactionId = 1;
    const orderReadyForPickup = {
      transactionId: testOrderTransactionId,
      status: OrderStatus.ReadyForPickup,
    };

    orderCardFixture.componentRef.setInput('order', orderReadyForPickup);
    orderCardFixture.detectChanges();

    const orderCardHeaderElement = orderCardFixture.nativeElement.querySelector('.card-header') as HTMLElement;

    // Act
    orderCardHeaderElement.dispatchEvent(new MouseEvent('dblclick'));

    // Assert
    expect(statusesEmittedByOrderCard).toEqual([OrderStatus.Completed]);
  });

  it('onOrderCardDoubleClick_When_OrderIsCompleted_Should_EmitNothing', () => {
    // Arrange
    const testOrderTransactionId = 1;
    const completedOrder = {
      transactionId: testOrderTransactionId,
      status: OrderStatus.Completed,
    };

    orderCardFixture.componentRef.setInput('order', completedOrder);
    orderCardFixture.detectChanges();

    const orderCardHeaderElement = orderCardFixture.nativeElement.querySelector('.card-header') as HTMLElement;

    // Act
    orderCardHeaderElement.dispatchEvent(new MouseEvent('dblclick'));

    // Assert
    expect(statusesEmittedByOrderCard).toEqual([]);
  });
  //#endregion

  //#region Swipe-to-revert

  it('swipe_When_ReadyForPickupAndDraggedPastThreshold_Should_EmitUnderPreparation', () => {
    // Arrange
    // jsdom has no real PointerEvent / setPointerCapture, so we build stub events.
    const testOrderTransactionId = 1;
    const orderReadyForPickup = {
      transactionId: testOrderTransactionId,
      status: OrderStatus.ReadyForPickup,
    };
    const pointerStartHorizontalScreenPositionInPixels = 200;
    const pointerEndHorizontalScreenPositionPastRevertThresholdInPixels = 40;
    const stubPointerId = 1;

    orderCardFixture.componentRef.setInput('order', orderReadyForPickup);
    orderCardFixture.detectChanges();

    const orderCardSwipeController = orderCardComponent['cardSwipe'];
    const pointerDownEvent = buildStubPointerEventAtHorizontalScreenPositionInPixels(
      pointerStartHorizontalScreenPositionInPixels,
      stubPointerId,
    );
    const pointerEndEvent = buildStubPointerEventAtHorizontalScreenPositionInPixels(
      pointerEndHorizontalScreenPositionPastRevertThresholdInPixels,
      stubPointerId,
    );

    // Act
    orderCardSwipeController.onPointerDown(pointerDownEvent);
    orderCardSwipeController.onPointerMove(pointerEndEvent);
    orderCardSwipeController.onPointerEnd(pointerEndEvent);

    // Assert
    expect(statusesEmittedByOrderCard).toEqual([OrderStatus.UnderPreparation]);
  });

  it('swipe_When_ReadyForPickupButDraggedBelowThreshold_Should_EmitNothing', () => {
    // Arrange
    // jsdom has no real PointerEvent / setPointerCapture, so we build stub events.
    const testOrderTransactionId = 1;
    const orderReadyForPickup = {
      transactionId: testOrderTransactionId,
      status: OrderStatus.ReadyForPickup,
    };
    const pointerStartHorizontalScreenPositionInPixels = 200;
    const pointerEndHorizontalScreenPositionBelowRevertThresholdInPixels = 170;
    const stubPointerId = 1;

    orderCardFixture.componentRef.setInput('order', orderReadyForPickup);
    orderCardFixture.detectChanges();

    const orderCardSwipeController = orderCardComponent['cardSwipe'];
    const pointerDownEvent = buildStubPointerEventAtHorizontalScreenPositionInPixels(
      pointerStartHorizontalScreenPositionInPixels,
      stubPointerId,
    );
    const pointerReleaseEvent = buildStubPointerEventAtHorizontalScreenPositionInPixels(
      pointerEndHorizontalScreenPositionBelowRevertThresholdInPixels,
      stubPointerId,
    );

    // Act
    orderCardSwipeController.onPointerDown(pointerDownEvent);
    orderCardSwipeController.onPointerMove(pointerReleaseEvent);
    orderCardSwipeController.onPointerEnd(pointerReleaseEvent);

    // Assert
    expect(statusesEmittedByOrderCard).toEqual([]);
  });

  it('swipe_When_OrderIsNotSwipeable_Should_EmitNothing', () => {
    // Arrange
    // jsdom has no real PointerEvent / setPointerCapture, so we stand stub events in.
    const testOrderTransactionId = 1;
    const orderUnderPreparation = {
      transactionId: testOrderTransactionId,
      status: OrderStatus.UnderPreparation,
    };
    const pointerStartHorizontalScreenPositionInPixels = 200;
    const pointerEndHorizontalScreenPositionPastRevertThresholdInPixels = 40;
    const stubPointerId = 1;

    orderCardFixture.componentRef.setInput('order', orderUnderPreparation);
    orderCardFixture.detectChanges();

    const orderCardSwipeController = orderCardComponent['cardSwipe'];
    const pointerDownEvent = buildStubPointerEventAtHorizontalScreenPositionInPixels(
      pointerStartHorizontalScreenPositionInPixels,
      stubPointerId,
    );
    const pointerEndEvent = buildStubPointerEventAtHorizontalScreenPositionInPixels(
      pointerEndHorizontalScreenPositionPastRevertThresholdInPixels,
      stubPointerId,
    );

    // Act
    orderCardSwipeController.onPointerDown(pointerDownEvent);
    orderCardSwipeController.onPointerMove(pointerEndEvent);
    orderCardSwipeController.onPointerEnd(pointerEndEvent);

    // Assert
    expect(statusesEmittedByOrderCard).toEqual([]);
  });
  //#endregion

  //#region Card colour classes

  it('orderCardClasses_When_OrderIsReadyForPickup_Should_ApplyReadyClass', () => {
    // Arrange
    const testOrderTransactionId = 1;
    const orderReadyForPickup = {
      transactionId: testOrderTransactionId,
      status: OrderStatus.ReadyForPickup,
    };

    orderCardFixture.componentRef.setInput('order', orderReadyForPickup);

    // Act
    orderCardFixture.detectChanges();

    const orderCardElement = orderCardFixture.nativeElement.querySelector('.order-card') as HTMLElement;

    // Assert
    expect(orderCardElement.classList.contains('order-card-ready')).toBe(true);
  });

  it('orderCardClasses_When_OrderIsCompleted_Should_ApplyCompletedClass', () => {
    // Arrange
    const testOrderTransactionId = 1;
    const completedOrder = {
      transactionId: testOrderTransactionId,
      status: OrderStatus.Completed,
    };

    orderCardFixture.componentRef.setInput('order', completedOrder);

    // Act
    orderCardFixture.detectChanges();

    const orderCardElement = orderCardFixture.nativeElement.querySelector('.order-card') as HTMLElement;

    // Assert
    expect(orderCardElement.classList.contains('order-card-completed')).toBe(true);
  });

  it('orderCardClasses_When_UnderPreparationOrderIsOld_Should_ApplyTooOldClass', () => {
    // Arrange
    const testOrderTransactionId = 1;
    const millisecondsPerMinute = 60000;
    const orderAgeInMinutesForOldOrder = 10;
    const orderUnderPreparationCreatedTenMinutesAgo = {
      transactionId: testOrderTransactionId,
      status: OrderStatus.UnderPreparation,
      creationTime: new Date(Date.now() - orderAgeInMinutesForOldOrder * millisecondsPerMinute).toISOString(),
    };

    orderCardFixture.componentRef.setInput('order', orderUnderPreparationCreatedTenMinutesAgo);

    // Act
    orderCardFixture.detectChanges();

    const orderCardElement = orderCardFixture.nativeElement.querySelector('.order-card') as HTMLElement;

    // Assert
    expect(orderCardElement.classList.contains('order-card-too-old')).toBe(true);
  });

  it('orderCardClasses_When_ReadyForPickupOrderIsOld_Should_NotApplyTooOldClass', () => {
    // Arrange
    const testOrderTransactionId = 1;
    const millisecondsPerMinute = 60000;
    const orderAgeInMinutesForOldOrder = 10;
    const orderReadyForPickupCreatedTenMinutesAgo = {
      transactionId: testOrderTransactionId,
      status: OrderStatus.ReadyForPickup,
      creationTime: new Date(Date.now() - orderAgeInMinutesForOldOrder * millisecondsPerMinute).toISOString(),
    };

    orderCardFixture.componentRef.setInput('order', orderReadyForPickupCreatedTenMinutesAgo);

    // Act
    orderCardFixture.detectChanges();

    const orderCardElement = orderCardFixture.nativeElement.querySelector('.order-card') as HTMLElement;

    // Assert
    expect(orderCardElement.classList.contains('order-card-too-old')).toBe(false);
  });
  //#endregion

  //#region Explicit status buttons (Completed tab)

  it('statusButtons_When_CompletedOrderPrepButtonClicked_Should_EmitUnderPreparation', () => {
    // Arrange
    const testOrderTransactionId = 1;
    const completedOrder = {
      transactionId: testOrderTransactionId,
      status: OrderStatus.Completed,
    };

    orderCardFixture.componentRef.setInput('order', completedOrder);
    orderCardFixture.detectChanges();

    const preparationStatusButton = orderCardFixture.nativeElement.querySelector('.order-btn-prep') as HTMLButtonElement;

    // Act
    preparationStatusButton.click();

    // Assert
    expect(statusesEmittedByOrderCard).toEqual([OrderStatus.UnderPreparation]);
  });

  it('statusButtons_When_CompletedOrderReadyButtonClicked_Should_EmitReadyForPickup', () => {
    // Arrange
    const testOrderTransactionId = 1;
    const completedOrder = {
      transactionId: testOrderTransactionId,
      status: OrderStatus.Completed,
    };

    orderCardFixture.componentRef.setInput('order', completedOrder);
    orderCardFixture.detectChanges();

    const readyForPickupStatusButton = orderCardFixture.nativeElement.querySelector(
      '.order-btn-ready',
    ) as HTMLButtonElement;

    // Act
    readyForPickupStatusButton.click();

    // Assert
    expect(statusesEmittedByOrderCard).toEqual([OrderStatus.ReadyForPickup]);
  });
  //#endregion

  //#region Card error message

  it('errorMessage_When_Provided_Should_RenderErrorAlert', () => {
    // Arrange
    const testOrderTransactionId = 1;
    const orderUnderPreparation = {
      transactionId: testOrderTransactionId,
      status: OrderStatus.UnderPreparation,
    };
    const expectedCardErrorMessage = 'Kunne ikke opdatere status. Prøv igen.';

    orderCardFixture.componentRef.setInput('order', orderUnderPreparation);
    orderCardFixture.componentRef.setInput('errorMessage', expectedCardErrorMessage);

    // Act
    orderCardFixture.detectChanges();

    const errorAlertElement = orderCardFixture.nativeElement.querySelector('.alert.alert-danger') as HTMLElement;

    // Assert
    expect(errorAlertElement.textContent).toContain(expectedCardErrorMessage);
  });
  //#endregion

  //#region Collapsed item preview

  it('getVisibleOrderItems_When_CollapsedAndMoreThanPreviewLimit_Should_ReturnOnlyPreviewItems', () => {
    // Arrange
    const testOrderTransactionId = 1;
    const maximumPreviewOrderItemCount = 4;
    const totalOrderItemCountAbovePreviewLimit = 6;
    const orderItemsAbovePreviewLimit = buildTestOrderItemsWithCount(totalOrderItemCountAbovePreviewLimit);
    const orderUnderPreparationWithManyItems = {
      transactionId: testOrderTransactionId,
      status: OrderStatus.UnderPreparation,
      items: orderItemsAbovePreviewLimit,
    };

    orderCardFixture.componentRef.setInput('order', orderUnderPreparationWithManyItems);
    orderCardFixture.detectChanges();

    // Act
    const visibleOrderItemsInCollapsedCard = orderCardComponent['getVisibleOrderItems']();

    // Assert
    expect(visibleOrderItemsInCollapsedCard.length).toBe(maximumPreviewOrderItemCount);
  });

  it('getVisibleOrderItems_When_Expanded_Should_ReturnAllItems', () => {
    // Arrange
    const testOrderTransactionId = 1;
    const totalOrderItemCountAbovePreviewLimit = 6;
    const orderItemsAbovePreviewLimit = buildTestOrderItemsWithCount(totalOrderItemCountAbovePreviewLimit);
    const orderUnderPreparationWithManyItems = {
      transactionId: testOrderTransactionId,
      status: OrderStatus.UnderPreparation,
      items: orderItemsAbovePreviewLimit,
    };

    orderCardFixture.componentRef.setInput('order', orderUnderPreparationWithManyItems);
    orderCardFixture.detectChanges();

    // Act
    orderCardComponent['isCardExpanded'].set(true);
    const visibleOrderItemsInExpandedCard = orderCardComponent['getVisibleOrderItems']();

    // Assert
    expect(visibleOrderItemsInExpandedCard.length).toBe(totalOrderItemCountAbovePreviewLimit);
  });

  it('getHiddenOrderItemCount_When_MoreItemsThanPreviewLimit_Should_ReturnHiddenCount', () => {
    // Arrange
    const testOrderTransactionId = 1;
    const maximumPreviewOrderItemCount = 4;
    const totalOrderItemCountAbovePreviewLimit = 6;
    const expectedHiddenOrderItemCount = totalOrderItemCountAbovePreviewLimit - maximumPreviewOrderItemCount;
    const orderItemsAbovePreviewLimit = buildTestOrderItemsWithCount(totalOrderItemCountAbovePreviewLimit);
    const orderUnderPreparationWithManyItems = {
      transactionId: testOrderTransactionId,
      status: OrderStatus.UnderPreparation,
      items: orderItemsAbovePreviewLimit,
    };

    orderCardFixture.componentRef.setInput('order', orderUnderPreparationWithManyItems);
    orderCardFixture.detectChanges();

    // Act
    const hiddenOrderItemCountInCollapsedCard = orderCardComponent['getHiddenOrderItemCount']();

    // Assert
    expect(hiddenOrderItemCountInCollapsedCard).toBe(expectedHiddenOrderItemCount);
  });
  //#endregion
});

function buildStubPointerEventAtHorizontalScreenPositionInPixels(
  horizontalScreenPositionInPixels: number,
  pointerId: number,
): PointerEvent {
  return {
    clientX: horizontalScreenPositionInPixels,
    pointerId,
    currentTarget: { setPointerCapture: () => undefined },
  } as unknown as PointerEvent;
}

function buildTestOrderItemsWithCount(orderItemCount: number): OrderItem[] {
  const testOrderItems: OrderItem[] = [];
  const firstIndex = 1;

  for (let currentIndex = firstIndex; currentIndex <= orderItemCount; currentIndex++) {
    testOrderItems.push({
      quantity: 1,
      item: { id: currentIndex, name: `Vare ${currentIndex}` },
    });
  }

  return testOrderItems;
}
