import { TestBed } from '@angular/core/testing';
import { OrderTimeTracker } from './order-time-tracker.service';
import { Order } from '../../../generated/orders';

describe('OrderTimeTracker', () => {
  let orderTimeTracker: OrderTimeTracker;
  const millisecondsPerMinute = 60000;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    orderTimeTracker = TestBed.inject(OrderTimeTracker);
  });

  it('getElapsedMinutesSinceOrderCreation_When_NoCreationTimeProvided_Should_ReturnZero', () => {
    const order: Order = { transactionId: 1 };

    expect(orderTimeTracker.getElapsedMinutesSinceOrderCreation(order)).toBe(0);
  });

  it('getElapsedMinutesSinceOrderCreation_When_CreatedTenMinutesAgo_Should_ReturnTen', () => {
    // orderTimeTrack.currentTimestampMilliseconds() is used to get the same "now" the app uses, so the order is exactly 10 minutes old—not off by a tiny
    // sliver of time that can pass while the test is setting up.
    const referenceNowMilliseconds = orderTimeTracker.currentTimestampMilliseconds();
    const order: Order = {
      transactionId: 1,
      creationTime: new Date(referenceNowMilliseconds - 10 * millisecondsPerMinute).toISOString(),
    };

    expect(orderTimeTracker.getElapsedMinutesSinceOrderCreation(order)).toBe(10);
  });

  it('isOrderConsideredOld_When_CreatedTenMinutesAgo_Should_ReturnTrue', () => {
    const referenceNowMilliseconds = orderTimeTracker.currentTimestampMilliseconds();
    const order: Order = {
      transactionId: 1,
      creationTime: new Date(referenceNowMilliseconds - 10 * millisecondsPerMinute).toISOString(),
    };

    expect(orderTimeTracker.isOrderConsideredOld(order)).toBe(true);
  });

  it('isOrderConsideredOld_When_JustCreated_Should_ReturnFalse', () => {
    const referenceNowMilliseconds = orderTimeTracker.currentTimestampMilliseconds();
    const order: Order = {
      transactionId: 1,
      creationTime: new Date(referenceNowMilliseconds).toISOString(),
    };

    expect(orderTimeTracker.isOrderConsideredOld(order)).toBe(false);
  });
});
