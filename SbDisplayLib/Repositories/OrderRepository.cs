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
                    throw new InvalidOperationException("Insert did not return the created order.");

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
                    OUTPUT INSERTED.OrderTransactionId, INSERTED.ItemId, INSERTED.Quantity
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
                    throw new InvalidOperationException("Insert could not create the relationship between order and item");

                int orderTransactionIdOrdinal = reader.GetOrdinal("OrderTransactionId");
                int itemOrdinal = reader.GetOrdinal("ItemId");
                int quantityOrdinal = reader.GetOrdinal("Quantity");

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

        public Result<List<Order>> GetAll()
        {
            try
            {
                var orderList = new List<Order>();

                const string sql = """
                    SELECT OrderId, TransactionId, StatusId, CreationTimeUnix, CreationTime FROM [dbo].[Orders]
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

                while (reader.Read())
                {
                    var order = new Order
                    {
                        Id = reader.GetInt32(orderIdOrdinal),
                        TransactionId = reader.GetInt32(transactionOrdinal),
                        Status = (OrderStatus)reader.GetInt32(statusOrdinal),
                        CreationTimeUnix = reader.GetInt64(creationUnixOrdinal),
                        CreationTime = reader.GetDateTimeOffset(creationOrdinal)
                    };
                    orderList.Add(order);
                }

                return Result<List<Order>>.Ok(orderList);
            }
            catch (SqlException ex)
            {
                return Result<List<Order>>.Fail(ErrorCode.DatabaseFailure, "Failed to retrieve Orders from the database");
            }
        }

        public Order? UpdateOrderStatus(int transactionId, OrderStatus statusId)
        {
            //Vi skal validerer vores parameter input. (Handler?)
            //Vi skal lave et SQL script.			
            const string updateQuery ="""
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
                return new Order
                {
                    Id = reader.GetInt32(orderIdOrdinal),
                    TransactionId = reader.GetInt32(transactionOrdinal),
                    Status = (OrderStatus)reader.GetInt32(statusOrdinal),
                    CreationTime = reader.GetDateTimeOffset(creationOrdinal)
                };
            }
            return null;
        }
    }
}
