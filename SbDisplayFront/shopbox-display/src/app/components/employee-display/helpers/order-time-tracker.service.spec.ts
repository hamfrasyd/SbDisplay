import { TestBed } from '@angular/core/testing';
import { OrderTimeTracker } from './order-time-tracker.service';
import { Order } from '../../../generated/orders';

describe('OrderTimeTracker', () => {
  let orderTimeTracker: OrderTimeTracker;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    orderTimeTracker = TestBed.inject(OrderTimeTracker);
  });

  it('should create', () => {
    // Arrange
    // OrderTimeTracker is injected in beforeEach.

    // Act
    // (none)

    // Assert
    expect(orderTimeTracker).toBeTruthy();
  });

  //#region getElapsedMinutesSinceOrderCreation

  it('getElapsedMinutesSinceOrderCreation_When_NoCreationTimeProvided_Should_ReturnZero', () => {
    // Arrange
    const testOrderTransactionId = 1;
    const expectedElapsedMinutesSinceOrderCreation = 0;

    const orderWithoutCreationTime: Order = {
      transactionId: testOrderTransactionId,
    };

    // Act
    const elapsedMinutesSinceOrderCreation = orderTimeTracker.getElapsedMinutesSinceOrderCreation(orderWithoutCreationTime);

    // Assert
    expect(elapsedMinutesSinceOrderCreation).toBe(expectedElapsedMinutesSinceOrderCreation);
  });

  it('getElapsedMinutesSinceOrderCreation_When_CreatedTenMinutesAgo_Should_ReturnTen', () => {
    // Arrange
    // currentTimestampMilliseconds() is the same "now" the service uses, so the order is exactly
    // ten minutes old—not off by a sliver of time that can pass while the test is setting up.
    const testOrderTransactionId = 1;
    const millisecondsPerMinute = 60000;
    const orderAgeInMinutesForTest = 10;
    const expectedElapsedMinutesSinceOrderCreation = 10;
    const referenceNowMilliseconds = orderTimeTracker.currentTimestampMilliseconds();
    const orderCreationTimestampMilliseconds = referenceNowMilliseconds - orderAgeInMinutesForTest * millisecondsPerMinute;
    
    const orderCreatedTenMinutesAgo: Order = {
      transactionId: testOrderTransactionId,
      creationTime: new Date(orderCreationTimestampMilliseconds).toISOString(),
    };

    // Act
    const elapsedMinutesSinceOrderCreation =
      orderTimeTracker.getElapsedMinutesSinceOrderCreation(orderCreatedTenMinutesAgo);

    // Assert
    expect(elapsedMinutesSinceOrderCreation).toBe(expectedElapsedMinutesSinceOrderCreation);
  });
  //#endregion

  //#region isOrderConsideredOld

  it('isOrderConsideredOld_When_CreatedTenMinutesAgo_Should_ReturnTrue', () => {
    // Arrange
    const testOrderTransactionId = 1;
    const millisecondsPerMinute = 60000;
    const orderAgeInMinutesAboveOldThreshold = 10;
    const referenceNowMilliseconds = orderTimeTracker.currentTimestampMilliseconds();
    const orderCreationTimestampMilliseconds = referenceNowMilliseconds - orderAgeInMinutesAboveOldThreshold * millisecondsPerMinute;

    const orderCreatedTenMinutesAgo: Order = {
      transactionId: testOrderTransactionId,
      creationTime: new Date(orderCreationTimestampMilliseconds).toISOString(),
    };

    // Act
    const isOrderConsideredOld = orderTimeTracker.isOrderConsideredOld(orderCreatedTenMinutesAgo);

    // Assert
    expect(isOrderConsideredOld).toBe(true);
  });

  it('isOrderConsideredOld_When_JustCreated_Should_ReturnFalse', () => {
    // Arrange
    const testOrderTransactionId = 1;
    const referenceNowMilliseconds = orderTimeTracker.currentTimestampMilliseconds();
    
    const orderCreatedAtCurrentTimestamp: Order = {
      transactionId: testOrderTransactionId,
      creationTime: new Date(referenceNowMilliseconds).toISOString(),
    };

    // Act
    const isOrderConsideredOld = orderTimeTracker.isOrderConsideredOld(orderCreatedAtCurrentTimestamp);

    // Assert
    expect(isOrderConsideredOld).toBe(false);
  });
  //#endregion
});
