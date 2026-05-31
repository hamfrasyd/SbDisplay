import { TestBed } from '@angular/core/testing';
import { ResponsiveOrderColumns } from './responsive-order-columns.service';
import { Order } from '../../../generated/orders';

describe('ResponsiveOrderColumns', () => {
  let responsiveOrderColumnsService: ResponsiveOrderColumns;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ResponsiveOrderColumns] });
    responsiveOrderColumnsService = TestBed.inject(ResponsiveOrderColumns);
  });

  it('should create', () => {
    // Arrange
    // ResponsiveOrderColumns is injected in beforeEach.

    // Act
    // (none)

    // Assert
    expect(responsiveOrderColumnsService).toBeTruthy();
  });

  //#region distributeIntoColumns

  it('distributeIntoColumns_When_GivenListOfOrders_Should_KeepEveryOrder', () => {
    // Arrange
    const inputOrderCount = 5;
    const expectedTotalDistributedOrderCount = inputOrderCount;
    const ordersToDistribute = buildTestOrdersWithCount(inputOrderCount);

    // Act
    const distributedOrderColumns = responsiveOrderColumnsService.distributeIntoColumns(ordersToDistribute);
    const totalDistributedOrderCount = countTotalOrdersAcrossDistributedColumns(distributedOrderColumns);

    // Assert
    expect(totalDistributedOrderCount).toBe(expectedTotalDistributedOrderCount);
  });

  it('distributeIntoColumns_When_GivenNoOrders_Should_ReturnEmptyColumns', () => {
    // Arrange
    const ordersToDistribute: Order[] = [];
    const expectedTotalDistributedOrderCount = 0;

    // Act
    const distributedOrderColumns = responsiveOrderColumnsService.distributeIntoColumns(ordersToDistribute);
    const totalDistributedOrderCount = countTotalOrdersAcrossDistributedColumns(distributedOrderColumns);

    // Assert
    expect(totalDistributedOrderCount).toBe(expectedTotalDistributedOrderCount);
  });
  //#endregion
});

function buildTestOrdersWithCount(orderCount: number): Order[] {
  const testOrders: Order[] = [];
  const firstIndex = 1;

  for (let currentIndex = firstIndex; currentIndex <= orderCount; currentIndex++) {
    testOrders.push({ transactionId: currentIndex });
  }

  return testOrders;
}

function countTotalOrdersAcrossDistributedColumns(distributedOrderColumns: Order[][]): number {
  let totalDistributedOrderCount = 0;

  for (const ordersInColumn of distributedOrderColumns) {
    totalDistributedOrderCount += ordersInColumn.length;
  }

  return totalDistributedOrderCount;
}
