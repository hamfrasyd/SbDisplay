import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderCard } from './order-card';
import { Order, OrderItem, OrderStatus } from '../../../../generated/orders';

describe('OrderCard', () => {
  let component: OrderCard;
  let fixture: ComponentFixture<OrderCard>;

  /** Status values emitted by the card during a test, captured in order. */
  let emittedStatuses: OrderStatus[];

  const millisecondsPerMinute = 60000;

  /**
   * Builds a fake PointerEvent carrying only the fields the swipe controller actually reads
   * (clientX, pointerId, and a currentTarget that can capture the pointer). jsdom has no real
   * PointerEvent / setPointerCapture, so we stand one in instead of dispatching a DOM event.
   */
  function pointerEventAtX(clientX: number): PointerEvent {
    return {
      clientX,
      pointerId: 1,
      currentTarget: { setPointerCapture: () => undefined },
    } as unknown as PointerEvent;
  }

  /** Renders the card for the given order and starts capturing its statusChange output. */
  function renderCardForOrder(order: Order): void {
    fixture.componentRef.setInput('order', order);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderCard],
    }).compileComponents();

    fixture = TestBed.createComponent(OrderCard);
    component = fixture.componentInstance;

    emittedStatuses = [];
    component.statusChange.subscribe(status => emittedStatuses.push(status));
  });

  it('should create', () => {
    renderCardForOrder({ transactionId: 1, status: OrderStatus.UnderPreparation });

    expect(component).toBeTruthy();
  });

  //#region Double-click advances status

  it('onOrderCardDoubleClick_When_OrderIsUnderPreparation_Should_EmitReadyForPickup', () => {
    renderCardForOrder({ transactionId: 1, status: OrderStatus.UnderPreparation });

    const cardHeader = fixture.nativeElement.querySelector('.card-header') as HTMLElement;
    cardHeader.dispatchEvent(new MouseEvent('dblclick'));

    expect(emittedStatuses).toEqual([OrderStatus.ReadyForPickup]);
  });

  it('onOrderCardDoubleClick_When_OrderIsReadyForPickup_Should_EmitCompleted', () => {
    renderCardForOrder({ transactionId: 1, status: OrderStatus.ReadyForPickup });

    const cardHeader = fixture.nativeElement.querySelector('.card-header') as HTMLElement;
    cardHeader.dispatchEvent(new MouseEvent('dblclick'));

    expect(emittedStatuses).toEqual([OrderStatus.Completed]);
  });

  it('onOrderCardDoubleClick_When_OrderIsCompleted_Should_EmitNothing', () => {
    renderCardForOrder({ transactionId: 1, status: OrderStatus.Completed });

    const cardHeader = fixture.nativeElement.querySelector('.card-header') as HTMLElement;
    cardHeader.dispatchEvent(new MouseEvent('dblclick'));

    expect(emittedStatuses).toEqual([]);
  });
  //#endregion

  //#region Swipe-to-revert

  it('swipe_When_ReadyForPickupAndDraggedPastThreshold_Should_EmitUnderPreparation', () => {
    renderCardForOrder({ transactionId: 1, status: OrderStatus.ReadyForPickup });
    const cardSwipe = component['cardSwipe'];

    // Press at x=200, drag left to x=40 (offset -160px, past the 100px revert threshold), release.
    cardSwipe.onPointerDown(pointerEventAtX(200));
    cardSwipe.onPointerMove(pointerEventAtX(40));
    cardSwipe.onPointerEnd(pointerEventAtX(40));

    expect(emittedStatuses).toEqual([OrderStatus.UnderPreparation]);
  });

  it('swipe_When_ReadyForPickupButDraggedBelowThreshold_Should_EmitNothing', () => {
    renderCardForOrder({ transactionId: 1, status: OrderStatus.ReadyForPickup });
    const cardSwipe = component['cardSwipe'];

    // Drag left only 30px — counts as a swipe but never reaches the 100px revert threshold.
    cardSwipe.onPointerDown(pointerEventAtX(200));
    cardSwipe.onPointerMove(pointerEventAtX(170));
    cardSwipe.onPointerEnd(pointerEventAtX(170));

    expect(emittedStatuses).toEqual([]);
  });

  it('swipe_When_OrderIsNotSwipeable_Should_EmitNothing', () => {
    renderCardForOrder({ transactionId: 1, status: OrderStatus.UnderPreparation });
    const cardSwipe = component['cardSwipe'];

    cardSwipe.onPointerDown(pointerEventAtX(200));
    cardSwipe.onPointerMove(pointerEventAtX(40));
    cardSwipe.onPointerEnd(pointerEventAtX(40));

    expect(emittedStatuses).toEqual([]);
  });
  //#endregion

  //#region Card colour classes

  it('orderCardClasses_When_OrderIsReadyForPickup_Should_ApplyReadyClass', () => {
    renderCardForOrder({ transactionId: 1, status: OrderStatus.ReadyForPickup });

    const card = fixture.nativeElement.querySelector('.order-card') as HTMLElement;
    expect(card.classList.contains('order-card-ready')).toBe(true);
  });

  it('orderCardClasses_When_OrderIsCompleted_Should_ApplyCompletedClass', () => {
    renderCardForOrder({ transactionId: 1, status: OrderStatus.Completed });

    const card = fixture.nativeElement.querySelector('.order-card') as HTMLElement;
    expect(card.classList.contains('order-card-completed')).toBe(true);
  });

  it('orderCardClasses_When_UnderPreparationOrderIsOld_Should_ApplyTooOldClass', () => {
    renderCardForOrder({
      transactionId: 1,
      status: OrderStatus.UnderPreparation,
      creationTime: new Date(Date.now() - 10 * millisecondsPerMinute).toISOString(),
    });

    const card = fixture.nativeElement.querySelector('.order-card') as HTMLElement;
    expect(card.classList.contains('order-card-too-old')).toBe(true);
  });

  it('orderCardClasses_When_ReadyForPickupOrderIsOld_Should_NotApplyTooOldClass', () => {
    renderCardForOrder({
      transactionId: 1,
      status: OrderStatus.ReadyForPickup,
      creationTime: new Date(Date.now() - 10 * millisecondsPerMinute).toISOString(),
    });

    const card = fixture.nativeElement.querySelector('.order-card') as HTMLElement;
    expect(card.classList.contains('order-card-too-old')).toBe(false);
  });
  //#endregion

  //#region Explicit status buttons (Completed tab)

  it('statusButtons_When_CompletedOrderPrepButtonClicked_Should_EmitUnderPreparation', () => {
    renderCardForOrder({ transactionId: 1, status: OrderStatus.Completed });

    const prepButton = fixture.nativeElement.querySelector('.order-btn-prep') as HTMLButtonElement;
    prepButton.click();

    expect(emittedStatuses).toEqual([OrderStatus.UnderPreparation]);
  });

  it('statusButtons_When_CompletedOrderReadyButtonClicked_Should_EmitReadyForPickup', () => {
    renderCardForOrder({ transactionId: 1, status: OrderStatus.Completed });

    const readyButton = fixture.nativeElement.querySelector('.order-btn-ready') as HTMLButtonElement;
    readyButton.click();

    expect(emittedStatuses).toEqual([OrderStatus.ReadyForPickup]);
  });
  //#endregion

  //#region Card error message

  it('errorMessage_When_Provided_Should_RenderErrorAlert', () => {
    fixture.componentRef.setInput('order', { transactionId: 1, status: OrderStatus.UnderPreparation });
    fixture.componentRef.setInput('errorMessage', 'Kunne ikke opdatere status. Prøv igen.');
    fixture.detectChanges();

    const alert = fixture.nativeElement.querySelector('.alert.alert-danger') as HTMLElement;
    expect(alert.textContent).toContain('Kunne ikke opdatere status. Prøv igen.');
  });
  //#endregion

  //#region Collapsed item preview

  it('getVisibleOrderItems_When_CollapsedAndMoreThanPreviewLimit_Should_ReturnOnlyPreviewItems', () => {
    renderCardForOrder({ transactionId: 1, status: OrderStatus.UnderPreparation, items: buildOrderItems(6) });

    expect(component['getVisibleOrderItems']().length).toBe(4);
  });

  it('getVisibleOrderItems_When_Expanded_Should_ReturnAllItems', () => {
    renderCardForOrder({ transactionId: 1, status: OrderStatus.UnderPreparation, items: buildOrderItems(6) });

    component['isCardExpanded'].set(true);

    expect(component['getVisibleOrderItems']().length).toBe(6);
  });

  it('getHiddenOrderItemCount_When_MoreItemsThanPreviewLimit_Should_ReturnHiddenCount', () => {
    renderCardForOrder({ transactionId: 1, status: OrderStatus.UnderPreparation, items: buildOrderItems(6) });

    expect(component['getHiddenOrderItemCount']()).toBe(2);
  });
  //#endregion
});

/** Builds the requested number of simple order items for preview/overflow tests. */
function buildOrderItems(count: number): OrderItem[] {
  return Array.from({ length: count }, (_unused, index) => ({
    quantity: 1,
    item: { id: index + 1, name: `Vare ${index + 1}` },
  }));
}
