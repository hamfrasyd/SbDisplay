
DELETE FROM dbo.OrdersItems;
DELETE FROM dbo.Orders;
DELETE FROM dbo.OrderStatus;
DELETE FROM dbo.Items;


-- OrderStatus (skal indsættes før Orders pga. FK)
INSERT INTO dbo.OrderStatus (StatusId, Name) VALUES
    (1, 'Under Preparation'),
    (2, 'Ready For Pickup'),
    (3, 'Completed');


-- Items
INSERT INTO dbo.Items (ItemId, Name) VALUES
    (1, 'TestItem1'),
    (2, 'TestItem2'),
    (3, 'TestItem3');


-- Orders
INSERT INTO dbo.Orders (TransactionId, OrderId, StatusId, CreationTimeUnix, CreationTime) VALUES
    (1, 101, 1, 1700000000, '2025-01-01 10:00:00 +00:00'),
    (2, 102, 2, 1700003600, '2025-01-01 11:00:00 +00:00'),
    (3, 103, 3, 1700007200, '2025-01-01 12:00:00 +00:00');


-- OrdersItems
INSERT INTO dbo.OrdersItems (OrderTransactionId, ItemId, Quantity) VALUES
    (1, 1, 2),
    (1, 2, 1),
    (2, 3, 4),
    (3, 1, 1);
