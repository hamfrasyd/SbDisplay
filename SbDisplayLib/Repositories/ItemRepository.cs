using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using SbDisplayLib.Common;
using SbDisplayLib.Enums;
using SbDisplayLib.Interfaces;
using SbDisplayLib.Models;
using System.Data;
namespace SbDisplayLib.Repositories
{
    /// <summary>
    /// Repository responsible for handling database operations related to items.
    /// </summary>
    public class ItemRepository : IItemRepository
    {
        private readonly string _connectionString;

        /// <summary>
        /// Initializes a new instance of the <see cref="ItemRepository"/> class.
        /// </summary>
        /// <param name="configuration">The application configuration used to retrieve the database connection string.</param>
        /// <exception cref="InvalidOperationException">Thrown if the connection string named <c>DefaultConnection</c> is not configured.</exception>
        public ItemRepository(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection") ?? throw new InvalidOperationException("Connection string 'DefaultConnection' is not configured.");
        }


        /// <summary>
        /// Creates a new item in the database.
        /// </summary>
        /// <param name="item">The item that should be created.</param>
        /// <returns>A <see cref="Result{T}"/> containing the created <see cref="Item"/> if the operation succeeds,
        /// or an error code and message if the operation fails.</returns>
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
                    return Result<Item>.Fail(ErrorCode.DatabaseFailure,
                        "Insert did not return the created item.");

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


        /// <summary>
        /// Retrieves all items associated with a specific order transaction ID.
        /// </summary>
        /// <param name="transactionId">The transaction ID of the order whose items should be retrieved.</param>
        /// <returns>A <see cref="Result{T}"/> containing a list of <see cref="OrderItem"/> objects if the operation succeeds,
        /// or an error code and message if the operation fails.</returns>
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