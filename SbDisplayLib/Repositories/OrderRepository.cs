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


        //Create

        //Read - dvs. Get & GetAll
        public Order? UpdateOrderStatus(int orderId, OrderStatus status)
        {
			//Så vi skal åbne vores SQL connection.
			//Vi skal validerer vores parameter input.
			//Vi skal parse vores enum input til en int?
			//Vi skal søge i databasen på det rigtige - dvs. lave et SQL script.
			
            const string query = 
                @"
                UPDATE 
                    TestOrders
                SET 
                    Status = @StatusId
                WHERE
                    OrderId = @OrderId";



			using var connection = new SqlConnection
            ("Server=tcp:sb-consultantdb.database.windows.net,1433;" +
            "Initial Catalog=sb-display-db;Persist Security Info=False;" +
            "User ID=sbconsultant-sa;Password=xZ-MmSw%GWdGxTh9ddhf;" +
            "MultipleActiveResultSets=False;Encrypt=True;" +
            "TrustServerCertificate=False;" +
            "Connection Timeout=30;");
			connection.Open();

			using var command = new SqlCommand(query, connection);
			command.Parameters.Add("@OrderId", SqlDbType.Int).Value = orderId;
			command.Parameters.Add("@Status", SqlDbType.Int).Value = (int)status;

			using var reader = command.ExecuteReader();



			//vi skal returnere resultatet.
			return null;
        }




        //Delete 

    }
}
