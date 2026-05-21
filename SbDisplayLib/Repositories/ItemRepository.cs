using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using SbDisplayLib.Interfaces;
using SbDisplayLib.Models;
using System.Data;
namespace SbDisplayLib.Repositories
{
    public class ItemRepository : IItemRepository
    {
        private readonly string _connectionString;
        public ItemRepository(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection") ?? throw new InvalidOperationException("Connection string 'DefaultConnection' is not configured.");
        }
        public Item Create(Item item)
        {
            const string sql = """
            INSERT INTO [dbo].[Items] (ItemId, Name)
            OUTPUT INSERTED.ItemId, INSERTED.Name
            VALUES (@ItemId, @Name)
            """;

            using var connection = new SqlConnection(_connectionString);
            using var command = new SqlCommand(sql, connection);

            command.Parameters.Add("@ItemId", SqlDbType.Int).Value = item.Id;
            command.Parameters.Add("@Name", SqlDbType.NVarChar).Value = item.Name;

            connection.Open();

            using var reader = command.ExecuteReader();

            if (!reader.Read())
                throw new InvalidOperationException("Insert did not return the created item.");

            int itemIdOrdinal = reader.GetOrdinal("ItemId");
            int nameOrdinal = reader.GetOrdinal("Name");

            return new Item
            {
                Id = reader.GetInt32(itemIdOrdinal),
                Name = reader.GetString(nameOrdinal)
            };
        }

        public List<OrderItem> GetByOrderTransactionId(int transactionId)
        {
            var orderItems = new List<OrderItem>();

            const string sql = """
                SELECT oi.Quantity, i.ItemId, i.Name
                FROM [dbo].[OrdersItems] oi
                INNER JOIN [dbo].[Items] i
                    ON oi.ItemId = i.ItemId
                WHERE oi.OrderTransactionId = @OrderTransactionId
                """;

            using var connection = new SqlConnection(_connectionString);
            using var command = new SqlCommand(sql, connection);

            command.Parameters.Add("@OrderTransactionId", SqlDbType.Int).Value = transactionId;

            connection.Open();

            using var reader = command.ExecuteReader();

            int quantityOrdinal = reader.GetOrdinal("Quantity");
            int itemIdOrdinal = reader.GetOrdinal("ItemId");
            int nameOrdinal = reader.GetOrdinal("Name");

            while (reader.Read())
            {
                orderItems.Add(new OrderItem
                {
                    Quantity = reader.GetInt32(quantityOrdinal),
                    Item = new Item
                    {
                        Id = reader.GetInt32(itemIdOrdinal),
                        Name = reader.GetString(nameOrdinal)
                    }
                });
            }

            return orderItems;
        }
    }
}