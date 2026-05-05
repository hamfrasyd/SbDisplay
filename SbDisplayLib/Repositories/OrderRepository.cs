using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using SbDisplayLib.Enums;
using SbDisplayLib.Interfaces;
using SbDisplayLib.Models;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SbDisplayLib.Repositories
{
    public class OrderRepository : IOrderRepository
    {
        private readonly string _connectionString;

        public OrderRepository(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("Connection string 'DefaultConnection' is not configured.");
        }

        public Order Create(Order newOrder)
        {
            const string sql = """
            INSERT INTO [dbo].[TestOrders] (OrderId, StatusId, TransactionId)
            OUTPUT INSERTED.OrderId, INSERTED.StatusId, INSERTED.TransactionId
            VALUES (@OrderId, @StatusId, @TransactionId)
            """;

            using var connection = new SqlConnection(_connectionString);
            using var command = new SqlCommand(sql, connection);

            command.Parameters.Add("@OrderId", SqlDbType.Int).Value = newOrder.OrderId;
            command.Parameters.Add("@StatusId", SqlDbType.Int).Value = (int)newOrder.Status;
            command.Parameters.Add("@TransactionId", SqlDbType.Int).Value = newOrder.TransactionId;

            connection.Open();

            using var reader = command.ExecuteReader();

            if (!reader.Read())
                throw new InvalidOperationException("Insert did not return the created order.");

            return new Order
            {
                OrderId = reader.GetInt32(reader.GetOrdinal("OrderId")),
                TransactionId = reader.GetInt32(reader.GetOrdinal("TransactionId")),
                Status = (OrderStatus)reader.GetInt32(reader.GetOrdinal("StatusId"))
            };
        }

        public List<Order> GetAll()
        {
            throw new NotImplementedException();
        }

        public Order GetById(int id)
        {
            throw new NotImplementedException();
        }

        public Order UpdateStatus(int orderId, OrderStatus status)
        {
            throw new NotImplementedException();
        }
    }
}
