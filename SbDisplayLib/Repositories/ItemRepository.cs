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
    }
}