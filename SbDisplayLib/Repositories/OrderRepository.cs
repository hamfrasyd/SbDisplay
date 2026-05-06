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
			//Vi skal lave et SQL script.			
            const string updateQuery =
				@"
                UPDATE TestOrders
                SET StatusId = @StatusId
				OUTPUT         
					INSERTED.OrderId, 
					INSERTED.StatusId,
                WHERE OrderId = @orderId";


			//Så vi skal åbne vores SQL connection.
			using var connection = new SqlConnection(_connectionString);
			connection.Open();

			using var command = new SqlCommand(updateQuery, connection);
			command.Parameters.Add("@StatusId", SqlDbType.Int).Value = (int)statusId;
			command.Parameters.Add("@OrderId", SqlDbType.Int).Value = orderId;

			using var reader = command.ExecuteReader();
			if (reader.Read())
			{
				return new Order
				{
					Id = (int)reader["OrderId"],
					Status = (OrderStatus)(int)reader["StatusId"]

				};
			}
			return null;

		}


        //Delete 

    }
}
