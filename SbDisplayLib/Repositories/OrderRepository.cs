using Microsoft.Data.SqlClient;
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

		public OrderRepository(string connectionString)
		{
			_connectionString = connectionString;
		}

		//Create

		//Read - dvs. Get & GetAll
		public Order? UpdateOrderStatus(int orderId, OrderStatus statusId)
        {
			
			//Vi skal validerer vores parameter input. (Handler?)

			//Vi skal parse vores enum input til en int?

			//Vi skal lave et SQL script.			
            const string query = 
                @"
                UPDATE 
                    TestOrders
                SET 
                    StatusId = @StatusId
                WHERE
                    OrderId = @orderId";


			//Så vi skal åbne vores SQL connection.
			using var connection = new SqlConnection(_connectionString);
			connection.Open();

			using var command = new SqlCommand(query, connection);
			command.Parameters.Add("@OrderId", SqlDbType.Int).Value = orderId;
			command.Parameters.Add("@StatusId", SqlDbType.Int).Value = statusId;

			//Vi skal bruge vores SQL script i databasen.
			//using var reader = command.ExecuteNonQuery();
			command.ExecuteNonQuery();

			//Vi skal returnere resultatet.
			return null;
        }




        //Delete 

    }
}
