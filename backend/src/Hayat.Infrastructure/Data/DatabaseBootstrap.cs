using System;
using System.Data;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Hayat.Infrastructure.Data
{
    public static class DatabaseBootstrap
    {
        public static AppDbContext CreateContext(IConfiguration configuration)
        {
            var connectionString = configuration.GetConnectionString("DefaultConnection")
                ?? "Data Source=/data/hayat.db";

            var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();
            optionsBuilder.ConfigureWarnings(w =>
                w.Ignore(RelationalEventId.PendingModelChangesWarning));
            optionsBuilder.UseSqlite(connectionString);

            return new AppDbContext(optionsBuilder.Options);
        }

        /// <summary>
        /// Docker/production: creates schema from the current EF model (no migration history required).
        /// </summary>
        public static void EnsureSchema(
            AppDbContext context,
            IConfiguration configuration,
            ILogger? logger = null)
        {
            if (UsersTableExists(context))
            {
                logger?.LogInformation("Database schema OK (Users table found).");
                TryApplyMigrationsIfEnabled(context, configuration, logger);
                return;
            }

            logger?.LogWarning("Users table missing — creating database schema.");

            context.Database.EnsureCreated();
            if (UsersTableExists(context))
            {
                logger?.LogInformation("Schema created with EnsureCreated.");
                return;
            }

            // Empty/broken hayat.db file can block EnsureCreated — reset and retry once.
            logger?.LogWarning("Schema still missing — recreating database file.");
            context.Database.EnsureDeleted();
            context.Database.EnsureCreated();

            if (!UsersTableExists(context))
                throw new InvalidOperationException("Database schema could not be created.");

            logger?.LogInformation("Schema recreated successfully.");
        }

        private static void TryApplyMigrationsIfEnabled(
            AppDbContext context,
            IConfiguration configuration,
            ILogger? logger)
        {
            if (!configuration.GetValue("Database:UseMigrations", false))
                return;

            try
            {
                context.Database.Migrate();
                logger?.LogInformation("EF migrations applied.");
            }
            catch (Exception ex)
            {
                logger?.LogWarning(ex, "EF migrations failed; using existing schema.");
            }
        }

        private static bool UsersTableExists(AppDbContext context)
        {
            try
            {
                var connection = context.Database.GetDbConnection();
                if (connection.State != ConnectionState.Open)
                    connection.Open();

                using var command = connection.CreateCommand();
                command.CommandText =
                    "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='Users';";
                var count = Convert.ToInt32(command.ExecuteScalar());
                return count > 0;
            }
            catch (SqliteException)
            {
                return false;
            }
        }
    }
}
