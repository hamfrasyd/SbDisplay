using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using SbDisplayLib.Common;
using SbDisplayLib.Enums;
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

        public Result<Item> Create(Item item)
        {
            try
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

                Item createdItem = new Item
                {
                    Id = reader.GetInt32(itemIdOrdinal),
                    Name = reader.GetString(nameOrdinal)
                };

                return Result<Item>.Ok(createdItem);
            }
            catch (SqlException ex) when (ex.Number == 2627) // unique constraint violation
            {
                return Result<Item>.Fail(ErrorCode.DatabaseFailure,
                    $"Item {item.Id} already exists.");
            }
            catch (SqlException ex)
            {
                return Result<Item>.Fail(ErrorCode.DatabaseFailure, ex.Message);
            }
        }

        public Result<List<OrderItem>> GetByOrderTransactionId(int transactionId)
        {
            try
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

                return Result<List<OrderItem>>.Ok(orderItems);
            }
            catch (SqlException ex)
            {
                return Result<List<OrderItem>>.Fail(ErrorCode.DatabaseFailure, $"Failed to retrieve items for transaction {transactionId}: {ex.Message}");
            }
        }
    }
}