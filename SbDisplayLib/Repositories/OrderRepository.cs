using Microsoft.Data.SqlClient;
using SbDisplayLib.Enums;
using SbDisplayLib.Interfaces;
using SbDisplayLib.Models;
using Microsoft.Extensions.Configuration;
using System.Data;
using SbDisplayLib.Common;
namespace SbDisplayLib.Repositories
{
    public class OrderRepository : IOrderRepository
    {
        private readonly string _connectionString;

        public OrderRepository(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection") ?? throw new InvalidOperationException("Connection string 'DefaultConnection' is not configured.");
        }

        public Result<Order> Create(Order newOrder)
        {
            try
            {
                const string sql = """
                    INSERT INTO [dbo].[Orders] (TransactionId, OrderId, StatusId, CreationTimeUnix, CreationTime)
                    OUTPUT INSERTED.TransactionId, INSERTED.OrderId, INSERTED.StatusId, INSERTED.CreationTimeUnix, INSERTED.CreationTime
                    VALUES (@TransactionId, @OrderId, @StatusId, @CreationTimeUnix ,@CreationTime)
                    """;

                using var connection = new SqlConnection(_connectionString);
                using var command = new SqlCommand(sql, connection);

                command.Parameters.Add("@TransactionId", SqlDbType.Int).Value = newOrder.TransactionId;
                command.Parameters.Add("@OrderId", SqlDbType.Int).Value = newOrder.Id;
                command.Parameters.Add("@StatusId", SqlDbType.Int).Value = (int)newOrder.Status;
                command.Parameters.Add("@CreationTimeUnix", SqlDbType.BigInt).Value = newOrder.CreationTimeUnix;
                command.Parameters.Add("@CreationTime", SqlDbType.DateTimeOffset).Value = newOrder.CreationTime;

                connection.Open();

                using var reader = command.ExecuteReader();

                if (!reader.Read())
                    return Result<Order>.Fail(ErrorCode.DatabaseFailure, "Insert did not return the created order.");

                int orderIdOrdinal = reader.GetOrdinal("OrderId");
                int transactionOrdinal = reader.GetOrdinal("TransactionId");
                int statusOrdinal = reader.GetOrdinal("StatusId");
                int creationUnixOrdinal = reader.GetOrdinal("CreationTimeUnix");
                int creationOrdinal = reader.GetOrdinal("CreationTime");

                Order createdOrder = new Order
                {
                    Id = reader.GetInt32(orderIdOrdinal),
                    TransactionId = reader.GetInt32(transactionOrdinal),
                    Status = (OrderStatus)reader.GetInt32(statusOrdinal),
                    CreationTimeUnix = reader.GetInt64(creationUnixOrdinal),
                    CreationTime = reader.GetDateTimeOffset(creationOrdinal)
                };

                return Result<Order>.Ok(createdOrder);
            }
            catch (SqlException ex) when (ex.Number == 2627) // unique constraint violation
            {
                return Result<Order>.Fail(ErrorCode.DatabaseFailure,
                    $"Order with transactionId {newOrder.TransactionId} already exists.");
            }
            catch (SqlException ex)
            {
                return Result<Order>.Fail(ErrorCode.DatabaseFailure, "An error occured while trying to create a new order");
                //Something something log this in the future ex.Message
            }
        }

        public Result<OrderItem> CreateItemOrderRelation(Order order, OrderItem orderItem)
        {
            try
            {
                const string sql = """
                    INSERT INTO [dbo].[OrdersItems] (OrderTransactionId, ItemId, Quantity)
                    VALUES (@OrderTransactionId, @ItemId, @Quantity)
                    """;

                using var connection = new SqlConnection(_connectionString);
                using var command = new SqlCommand(sql, connection);

                command.Parameters.Add("@OrderTransactionId", SqlDbType.Int).Value = order.TransactionId;
                command.Parameters.Add("@ItemId", SqlDbType.Int).Value = orderItem.Item.Id;
                command.Parameters.Add("@Quantity", SqlDbType.Int).Value = orderItem.Quantity;

                connection.Open();

                using var reader = command.ExecuteReader();

                if (!reader.Read())
                    return Result<OrderItem>.Fail(ErrorCode.DatabaseFailure, "Insert could not create the relationship between order and item");

                OrderItem createdRelation = new OrderItem
                {
                    Item = orderItem.Item,
                    Quantity = orderItem.Quantity
                };

                return Result<OrderItem>.Ok(createdRelation);
            }
            catch (SqlException ex) when (ex.Number == 2627) // unique constraint violation
            {
                return Result<OrderItem>.Fail(ErrorCode.DatabaseFailure,
                    $"Order relation between {order.TransactionId} -> {orderItem.Item.Id} already exists.");
            }
            catch (SqlException ex)
            {
                return Result<OrderItem>.Fail(ErrorCode.DatabaseFailure, ex.Message);
            }
        }

        public Result<List<Order>> GetAllWithItems()
        {
            try
            {
                const string sql = """
            SELECT
                o.OrderId, o.TransactionId, o.StatusId, o.CreationTimeUnix, o.CreationTime,
                oi.Quantity, i.ItemId, i.Name
            FROM [dbo].[Orders] o
            LEFT JOIN [dbo].[OrdersItems] oi ON o.TransactionId = oi.OrderTransactionId
            LEFT JOIN [dbo].[Items] i ON oi.ItemId = i.ItemId
            """;

                using var connection = new SqlConnection(_connectionString);
                using var command = new SqlCommand(sql, connection);

                connection.Open();
                using var reader = command.ExecuteReader();

                int orderIdOrdinal = reader.GetOrdinal("OrderId");
                int transactionOrdinal = reader.GetOrdinal("TransactionId");
                int statusOrdinal = reader.GetOrdinal("StatusId");
                int creationUnixOrdinal = reader.GetOrdinal("CreationTimeUnix");
                int creationOrdinal = reader.GetOrdinal("CreationTime");
                int quantityOrdinal = reader.GetOrdinal("Quantity");
                int itemIdOrdinal = reader.GetOrdinal("ItemId");
                int nameOrdinal = reader.GetOrdinal("Name");

                var orders = new Dictionary<int, Order>();

                while (reader.Read())
                {
                    int transactionId = reader.GetInt32(transactionOrdinal);

                    if (!orders.TryGetValue(transactionId, out var order))
                    {
                        order = new Order
                        {
                            Id = reader.GetInt32(orderIdOrdinal),
                            TransactionId = transactionId,
                            Status = (OrderStatus)reader.GetInt32(statusOrdinal),
                            CreationTimeUnix = reader.GetInt64(creationUnixOrdinal),
                            CreationTime = reader.GetDateTimeOffset(creationOrdinal),
                            Items = new List<OrderItem>()
                        };
                        orders[transactionId] = order;
                    }

                    if (!reader.IsDBNull(itemIdOrdinal))
                    {
                        order.Items!.Add(new OrderItem
                        {
                            Quantity = reader.GetInt32(quantityOrdinal),
                            Item = new Item
                            {
                                Id = reader.GetInt32(itemIdOrdinal),
                                Name = reader.GetString(nameOrdinal)
                            }
                        });
                    }
                }

                return Result<List<Order>>.Ok(orders.Values.ToList());
            }
            catch (SqlException ex)
            {
                return Result<List<Order>>.Fail(ErrorCode.DatabaseFailure,
                    $"Failed to retrieve orders from the database (SQL {ex.Number}): {ex.Message}");
            }
        }

        public Result<Order> UpdateOrderStatus(int transactionId, OrderStatus statusId)
        {
            try
            {
                //Vi skal validerer vores parameter input. (Handler?)
                //Vi skal lave et SQL script.			
                const string updateQuery = """
                    UPDATE Orders
                    SET StatusId = @StatusId
                    OUTPUT
                        INSERTED.TransactionId,
                        INSERTED.StatusId,
                        INSERTED.OrderId,
                        INSERTED.CreationTime
                    WHERE TransactionId = @TransactionId
                    """;

                //Så vi skal åbne vores SQL connection.
                using var connection = new SqlConnection(_connectionString);
                connection.Open();

                using var command = new SqlCommand(updateQuery, connection);
                command.Parameters.Add("@StatusId", SqlDbType.Int).Value = (int)statusId;
                command.Parameters.Add("@TransactionId", SqlDbType.Int).Value = transactionId;

                using var reader = command.ExecuteReader();

                int orderIdOrdinal = reader.GetOrdinal("OrderId");
                int transactionOrdinal = reader.GetOrdinal("TransactionId");
                int statusOrdinal = reader.GetOrdinal("StatusId");
                int creationOrdinal = reader.GetOrdinal("CreationTime");

                if (reader.Read())
                {
                    var updatedOrder = new Order
                    {
                        Id = reader.GetInt32(orderIdOrdinal),
                        TransactionId = reader.GetInt32(transactionOrdinal),
                        Status = (OrderStatus)reader.GetInt32(statusOrdinal),
                        CreationTime = reader.GetDateTimeOffset(creationOrdinal)
                    };

                    return Result<Order>.Ok(updatedOrder);
                }

                return Result<Order>.Fail(ErrorCode.NotFound, $"No order with Transactionid {transactionId} was found.");
            }
            catch (SqlException ex) when (ex.Number == 1205)
            {
                return Result<Order>.Fail(
                    ErrorCode.DatabaseFailure,
                    $"The update was caught in a deadlock (SQL {ex.Number}). Please retry.");
            }
            catch (SqlException ex) when (ex.Number == 1222)
            {
                return Result<Order>.Fail(
                    ErrorCode.DatabaseFailure,
                    $"The update timed out waiting for a row lock (SQL {ex.Number}). Please retry.");
            }
            catch (SqlException ex) when (ex.Number == 547)
            {
                // FK violation: StatusId value doesn't exist in the Statuses table
                return Result<Order>.Fail(
                    ErrorCode.InvalidInput,
                    $"StatusId {(int)statusId} is not a valid status (SQL {ex.Number}).");
            }
            catch (SqlException ex) when (ex.Number == 515)
            {
                return Result<Order>.Fail(
                    ErrorCode.InvalidInput,
                    $"Update rejected: a required column value was null (SQL {ex.Number}).");
            }
            catch (SqlException ex) when (ex.Number == 8152)
            {
                return Result<Order>.Fail(
                    ErrorCode.InvalidInput,
                    $"Update rejected: a value exceeded the allowed column length (SQL {ex.Number}).");
            }
            catch (SqlException ex)
            {
                return Result<Order>.Fail(
                    ErrorCode.DatabaseFailure,
                    $"An unexpected database error occurred (SQL {ex.Number}): {ex.Message}");
            }
            catch (InvalidOperationException ex)
            {
                // Covers SqlConnection misuse, e.g. trying to open an already-open connection
                return Result<Order>.Fail(
                    ErrorCode.DatabaseFailure,
                    $"A connection error occurred: {ex.Message}");
            }
        }
    }
}
