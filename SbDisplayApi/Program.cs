
using SbDisplayLib.Interfaces;
using SbDisplayLib.Repositories;
using SbDisplayLib.ApiClients;
using SbDisplayLib.Handlers;
using System.Text.Json.Serialization;

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


            builder.Services.AddControllers()
                .AddJsonOptions(options =>
                {
                    options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
                });

            // Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();

            builder.Services.AddCors(options =>
            {
                // Definerer en CORS-politik ved navn "AllowAny".
                // Denne politik er meget åben og bruges ofte under udvikling eller til offentlige API'er, hvor bred adgang er ønsket.
                options.AddPolicy("AllowAny", policy =>
                {
                    policy.AllowAnyOrigin()        // Tillader anmodninger fra enhver oprindelse (ethvert domæne).
                          .AllowAnyHeader()      // Tillader alle HTTP-headere i anmodningen.
                          .AllowAnyMethod();    // Tillader alle HTTP-metoder (GET, POST, PUT, DELETE, etc.).
                });
            });
            var app = builder.Build();

            // Configure the HTTP request pipeline.
            app.UseSwagger();
            app.UseSwaggerUI();
            

            app.UseHttpsRedirection();

            app.UseAuthorization();

            // Siger UseCors("AllowAny") efter UseAuthorization, så CORS-politikken virker efter at brugeren er autentificeret.
            app.UseCors("AllowAny");

            app.MapControllers();

            app.Run();
        }
    }
}
