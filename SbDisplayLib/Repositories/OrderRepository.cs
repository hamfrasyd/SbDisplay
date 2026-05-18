using Microsoft.Data.SqlClient;
using SbDisplayLib.Enums;
using SbDisplayLib.Interfaces;
using SbDisplayLib.Models;
using Microsoft.Extensions.Configuration;
using System.Data;

namespace SbDisplayLib.Repositories
{
    public class OrderRepository : IOrderRepository
    {
        private readonly string _connectionString;

        public OrderRepository(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection") ?? throw new InvalidOperationException("Connection string 'DefaultConnection' is not configured.");
        }

        public Order Create(Order newOrder)
        {
            const string sql = """
            INSERT INTO [dbo].[TestOrders] (OrderId, StatusId, TransactionId, CreationTime)
            OUTPUT INSERTED.OrderId, INSERTED.StatusId, INSERTED.TransactionId, INSERTED.CreationTime
            VALUES (@OrderId, @StatusId, @TransactionId, @CreationTime)
            """;

            using var connection = new SqlConnection(_connectionString);
            using var command = new SqlCommand(sql, connection);

            command.Parameters.Add("@OrderId", SqlDbType.Int).Value = newOrder.Id;
            command.Parameters.Add("@StatusId", SqlDbType.Int).Value = (int)newOrder.Status;
            command.Parameters.Add("@TransactionId", SqlDbType.Int).Value = newOrder.TransactionId;
            command.Parameters.Add("@CreationTime", SqlDbType.DateTimeOffset).Value = newOrder.CreationTime;

            connection.Open();

            using var reader = command.ExecuteReader();

            if (!reader.Read())
                throw new InvalidOperationException("Insert did not return the created order.");

            return new Order
            {
                Id = reader.GetInt32(reader.GetOrdinal("OrderId")),
                TransactionId = reader.GetInt32(reader.GetOrdinal("TransactionId")),
                Status = (OrderStatus)reader.GetInt32(reader.GetOrdinal("StatusId")),
                //CreationTime = reader.GetInt64(reader.GetOrdinal("CreationTime"))
                CreationTime = reader.GetDateTimeOffset(reader.GetOrdinal("CreationTime"))
            };
        }

        public List<Order> GetAll()
        {
            var orderList = new List<Order>();

            const string sql = """
                SELECT OrderId, TransactionId, StatusId, CreationTime FROM [dbo].[TestOrders]
                """;

            using var connection = new SqlConnection(_connectionString);
            using var command = new SqlCommand(sql, connection);

            connection.Open();
            using var reader = command.ExecuteReader();
            
            while (reader.Read())
            {
                var order = new Order
                {
                    Id = reader.GetInt32(0),
                    TransactionId = reader.GetInt32(1),
                    Status = (OrderStatus)reader.GetInt32(2),
                    //CreationTime = reader.GetInt64(3)
                    CreationTime = reader.GetDateTimeOffset(3)

                };
                orderList.Add(order);
            }
            return orderList;
        }

        public Order GetById(int transcationId)
        {
            throw new NotImplementedException();
        }

        public Order? UpdateOrderStatus(int transactionId, OrderStatus statusId)
        {
            //Vi skal validerer vores parameter input. (Handler?)
            //Vi skal lave et SQL script.			
            const string updateQuery =
                @"
                UPDATE TestOrders
                SET StatusId = @StatusId
				OUTPUT         
					INSERTED.TransactionId, 
					INSERTED.StatusId,
                    INSERTED.OrderId
                WHERE TransactionId = @TransactionId";


            //Så vi skal åbne vores SQL connection.
            using var connection = new SqlConnection(_connectionString);
            connection.Open();

            using var command = new SqlCommand(updateQuery, connection);
            command.Parameters.Add("@StatusId", SqlDbType.Int).Value = (int)statusId;
            command.Parameters.Add("@TransactionId", SqlDbType.Int).Value = transactionId;

            using var reader = command.ExecuteReader();
            if (reader.Read())
            {
                return new Order
                {
                    TransactionId = (int)reader["TransactionId"],
                    Id = (int)reader["OrderId"],
                    Status = (OrderStatus)(int)reader["StatusId"]

                };
            }
            return null;

        }
    }
}
