using System;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;
using Hayat.Application.Interfaces;
using Hayat.Application.Options;
using Hayat.Infrastructure.BackgroundServices;
using Hayat.Infrastructure.Data;
using Hayat.Infrastructure.Services;
using Hayat.Infrastructure.Strava;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Configure DbContext with SQLite
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

// Configure JWT Authentication
var secretKey = builder.Configuration["Jwt:SecretKey"] ?? "HayatAppSuperSecretKeyForDevelopment2026!!";
var key = Encoding.UTF8.GetBytes(secretKey);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "HayatApi",
        ValidAudience = builder.Configuration["Jwt:Audience"] ?? "HayatApp",
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

builder.Services.Configure<StravaOptions>(builder.Configuration.GetSection(StravaOptions.SectionName));
builder.Services.AddMemoryCache();
builder.Services.AddHttpClient<StravaApiClient>();
builder.Services.AddScoped<IStravaOAuthService, StravaOAuthService>();
builder.Services.AddScoped<IStravaSyncService, StravaSyncService>();
builder.Services.AddHostedService<StravaBackgroundSyncService>();

// DI services
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IManagementService, ManagementService>();
builder.Services.AddScoped<IHabitService, HabitService>();
builder.Services.AddScoped<IHealthService, HealthService>();
builder.Services.AddScoped<IDeepWorkService, DeepWorkService>();
builder.Services.AddScoped<IWeeklyGoalService, WeeklyGoalService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();

var app = builder.Build();

// Auto-run Migrations and Seed Database
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        if (args.Contains("--seed-dashboard-test"))
            Environment.SetEnvironmentVariable("HAYAT_SEED_DASHBOARD_TEST", "1");

        SeedData.Initialize(services);

        if (args.Contains("--seed-dashboard-test"))
        {
            Console.WriteLine("Dashboard test verisi olusturuldu (son 90 gun).");
            return;
        }
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Database migration/seeding sirasinda bir hata olustu.");
        if (args.Contains("--seed-dashboard-test"))
            throw;
    }
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    // Optionally enable developer exception page or OpenAPI
}

app.UseHttpsRedirection();

// CORS must be applied before routing/auth
app.UseCors("AllowReactApp");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
