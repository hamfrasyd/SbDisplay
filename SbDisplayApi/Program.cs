
using SbDisplayLib.Interfaces;
using SbDisplayLib.Repositories;
using SbDisplayLib.ApiClients;
using SbDisplayLib.Handlers;

namespace SbDisplayApi
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Add services to the container.
            builder.Services.AddScoped<NewOrderHandler>();
            builder.Services.AddScoped<IOrderRepository, OrderRepository>();

            builder.Services.AddHttpClient<IOrderApiClient, OrderApiClient>(client =>
            {
                client.BaseAddress = new Uri("https://api.shopbox.com/");
            });
            

            builder.Services.AddControllers();
            // Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();

            builder.Services.AddScoped<IOrderRepository, OrderRepository>();

			var app = builder.Build();

            // Configure the HTTP request pipeline.
            app.UseSwagger();
            app.UseSwaggerUI();
            

            app.UseHttpsRedirection();

            app.UseAuthorization();


            app.MapControllers();

            app.Run();
        }
    }
}
