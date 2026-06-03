import { OrderStatus } from '../../../generated/orders';
import { getNextOrderStatus, getPreviousOrderStatus } from './order-status-flow';

describe('order-status-flow', () => {
  //#region getNextOrderStatus

  it('getNextOrderStatus_When_UnderPreparation_Should_ReturnReadyForPickup', () => {
    // Arrange
    const currentOrderStatus = OrderStatus.UnderPreparation;
    const expectedNextOrderStatus = OrderStatus.ReadyForPickup;

    // Act
    const nextOrderStatusReturnedByFlow = getNextOrderStatus(currentOrderStatus);

    // Assert
    expect(nextOrderStatusReturnedByFlow).toBe(expectedNextOrderStatus);
  });

  it('getNextOrderStatus_When_ReadyForPickup_Should_ReturnCompleted', () => {
    // Arrange
    const currentOrderStatus = OrderStatus.ReadyForPickup;
    const expectedNextOrderStatus = OrderStatus.Completed;

    // Act
    const nextOrderStatusReturnedByFlow = getNextOrderStatus(currentOrderStatus);

    // Assert
    expect(nextOrderStatusReturnedByFlow).toBe(expectedNextOrderStatus);
  });

  it('getNextOrderStatus_When_Completed_Should_ReturnNull', () => {
    // Arrange
    const currentOrderStatus = OrderStatus.Completed;

    // Act
    const nextOrderStatusReturnedByFlow = getNextOrderStatus(currentOrderStatus);

    // Assert
    expect(nextOrderStatusReturnedByFlow).toBeNull();
  });

  it('getNextOrderStatus_When_Undefined_Should_ReturnNull', () => {
    // Arrange
    const currentOrderStatusIsUndefined = undefined;

    // Act
    const nextOrderStatusReturnedByFlow = getNextOrderStatus(currentOrderStatusIsUndefined);

    // Assert
    expect(nextOrderStatusReturnedByFlow).toBeNull();
  });
  //#endregion

  //#region getPreviousOrderStatus

  it('getPreviousOrderStatus_When_Completed_Should_ReturnReadyForPickup', () => {
    // Arrange
    const currentOrderStatus = OrderStatus.Completed;
    const expectedPreviousOrderStatus = OrderStatus.ReadyForPickup;

    // Act
    const previousOrderStatusReturnedByFlow = getPreviousOrderStatus(currentOrderStatus);

    // Assert
    expect(previousOrderStatusReturnedByFlow).toBe(expectedPreviousOrderStatus);
  });

  it('getPreviousOrderStatus_When_ReadyForPickup_Should_ReturnUnderPreparation', () => {
    // Arrange
    const currentOrderStatus = OrderStatus.ReadyForPickup;
    const expectedPreviousOrderStatus = OrderStatus.UnderPreparation;

    // Act
    const previousOrderStatusReturnedByFlow = getPreviousOrderStatus(currentOrderStatus);

    // Assert
    expect(previousOrderStatusReturnedByFlow).toBe(expectedPreviousOrderStatus);
  });

  it('getPreviousOrderStatus_When_UnderPreparation_Should_ReturnNull', () => {
    // Arrange
    const currentOrderStatus = OrderStatus.UnderPreparation;

    // Act
    const previousOrderStatusReturnedByFlow = getPreviousOrderStatus(currentOrderStatus);

    // Assert
    expect(previousOrderStatusReturnedByFlow).toBeNull();
  });
  //#endregion
});
