using SbDisplayApi.SignalR.Hubs;
using SbDisplayLib.ApiClients;
using SbDisplayLib.Handlers;
using SbDisplayLib.Interfaces;
using SbDisplayLib.Repositories;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddScoped<NewOrderHandler>();
builder.Services.AddScoped<IOrderRepository, OrderRepository>();
builder.Services.AddScoped<IItemRepository, ItemRepository>();
builder.Services.AddScoped<GetAllOrdersHandler>();
builder.Services.AddScoped<ChangeOrderStatusHandler>();

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

// Registrerer SignalR i dependency injection containeren.
// Det gør det muligt at bruge ShopboxHub og IHubContext<ShopboxHub> i controllers.
builder.Services.AddSignalR()
    .AddJsonProtocol(options =>
    {
        // Sørger for at enum-værdier sendes som tekst i SignalR-beskeder.
        // Uden dette kan Angular modtage fx 1, 2, 3 i stedet for "UnderPreparation", "ReadyForPickup", "Completed".
        options.PayloadSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

builder.Services.AddCors(options =>
{
    // Definerer en CORS-politik ved navn "AllowAny".
    // Denne politik er meget åben og bruges ofte under udvikling eller til offentlige API'er, hvor bred adgang er ønsket.
    options.AddPolicy("ShopboxdisplayPolicy", policy =>
    {
        policy.WithOrigins("https://kind-plant-05eaf2303.7.azurestaticapps.net", "https://localhost:4200", "http://localhost:4200")        // Tillader anmodninger fra disse domæner.
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

app.UseRouting();


// Siger UseCors("ShopboxdisplayPolicy") efter UseAuthorization, så CORS-politikken virker efter at brugeren er autentificeret.
app.UseCors("ShopboxdisplayPolicy");


app.UseAuthorization();

// Mapper SignalR hub'en til en URL, som Angular kan forbinde til.
// Denne route skal matche URL'en i signalr.service.ts.
app.MapHub<ShopboxHub>("/SignalR/Hubs/ShopboxHub");

app.UseExceptionHandler(err => err.Run(async ctx =>
{
    ctx.Response.StatusCode = 500;
    await ctx.Response.WriteAsJsonAsync(new { error = "An unexpected error occurred." });
}));

app.MapControllers();

app.Run();
