
using Microsoft.OpenApi.Models;
using SbDisplayLib.ApiClients;
using SbDisplayLib.Handlers;
using SbDisplayLib.Interfaces;
using SbDisplayLib.Repositories;

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


            var app = builder.Build();

            // Configure the HTTP request pipeline.
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            app.UseHttpsRedirection();

            app.UseAuthorization();


            app.MapControllers();

            app.Run();
        }
    }
}
