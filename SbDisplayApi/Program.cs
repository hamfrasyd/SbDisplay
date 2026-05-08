
using SbDisplayApi.SignalR.Hubs;
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

            builder.Services.AddScoped<IOrderRepository, OrderRepository>();

            builder.Services.AddSignalR();

            builder.Services.AddCors(options =>
            {
                // Definerer en CORS-politik ved navn "AllowAny".
                // Denne politik er meget åben og bruges ofte under udvikling eller til offentlige API'er, hvor bred adgang er ønsket.
                options.AddPolicy("ShopboxdisplayPolicy", policy =>
                {
                    policy.WithOrigins("https://localhost:7038", "http://localhost:5180", "http://localhost:5180", "https://shopboxdisplay.azurewebsites.net/")        // Tillader anmodninger fra disse domæner.
                          .AllowAnyHeader()      // Tillader alle HTTP-headere i anmodningen.
                          .AllowAnyMethod()     // Tillader alle HTTP-metoder (GET, POST, PUT, DELETE, etc.).
                          .AllowCredentials(); // Tillader brug af legitimationsoplysninger (cookies, autorisationstokens, etc.) i anmodninger. Dette er required for SignalR.
                });
            });
            var app = builder.Build();

            // Configure the HTTP request pipeline.
            app.UseSwagger();
            app.UseSwaggerUI();


            app.UseHttpsRedirection();

            app.UseAuthorization();

            // Siger UseCors("ShopboxdisplayPolicy") efter UseAuthorization, så CORS-politikken virker efter at brugeren er autentificeret.
            app.UseCors("ShopboxdisplayPolicy");

            app.MapHub<ShopboxHub>("/SignalR/Hubs/ShopboxHub");

            app.MapControllers();

            app.Run();
        }
    }
}
