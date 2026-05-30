import { OrderStatus } from '../../../generated/orders';
import { getNextOrderStatus, getPreviousOrderStatus } from './order-status-flow';

describe('order-status-flow', () => {
  it('getNextOrderStatus_When_UnderPreparation_Should_ReturnReadyForPickup', () => {
    expect(getNextOrderStatus(OrderStatus.UnderPreparation)).toBe(OrderStatus.ReadyForPickup);
  });

  it('getNextOrderStatus_When_ReadyForPickup_Should_ReturnCompleted', () => {
    expect(getNextOrderStatus(OrderStatus.ReadyForPickup)).toBe(OrderStatus.Completed);
  });

  it('getNextOrderStatus_When_Completed_Should_ReturnNull', () => {
    expect(getNextOrderStatus(OrderStatus.Completed)).toBeNull();
  });

  it('getNextOrderStatus_When_Undefined_Should_ReturnNull', () => {
    expect(getNextOrderStatus(undefined)).toBeNull();
  });

  it('getPreviousOrderStatus_When_Completed_Should_ReturnReadyForPickup', () => {
    expect(getPreviousOrderStatus(OrderStatus.Completed)).toBe(OrderStatus.ReadyForPickup);
  });

  it('getPreviousOrderStatus_When_ReadyForPickup_Should_ReturnUnderPreparation', () => {
    expect(getPreviousOrderStatus(OrderStatus.ReadyForPickup)).toBe(OrderStatus.UnderPreparation);
  });

  it('getPreviousOrderStatus_When_UnderPreparation_Should_ReturnNull', () => {
    expect(getPreviousOrderStatus(OrderStatus.UnderPreparation)).toBeNull();
  });
});
