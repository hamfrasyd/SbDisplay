import { TestBed } from '@angular/core/testing';
import { ResponsiveOrderColumns } from './responsive-order-columns.service';
import { Order } from '../../../generated/orders';

describe('ResponsiveOrderColumns', () => {
  let responsiveOrderColumns: ResponsiveOrderColumns;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ResponsiveOrderColumns] });
    responsiveOrderColumns = TestBed.inject(ResponsiveOrderColumns);
  });

  it('distributeIntoColumns_When_GivenListOfOrders_Should_KeepEveryOrder', () => {
    const orders: Order[] = [
      { transactionId: 1 },
      { transactionId: 2 },
      { transactionId: 3 },
      { transactionId: 4 },
      { transactionId: 5 },
    ];

    const orderColumns = responsiveOrderColumns.distributeIntoColumns(orders);

    const totalDistributedOrders = orderColumns.reduce((runningTotal, column) => runningTotal + column.length, 0);
    expect(totalDistributedOrders).toBe(orders.length);
  });

  it('distributeIntoColumns_When_GivenNoOrders_Should_ReturnEmptyColumns', () => {
    const orderColumns = responsiveOrderColumns.distributeIntoColumns([]);

    const totalDistributedOrders = orderColumns.reduce((runningTotal, column) => runningTotal + column.length, 0);
    expect(totalDistributedOrders).toBe(0);
  });
});
