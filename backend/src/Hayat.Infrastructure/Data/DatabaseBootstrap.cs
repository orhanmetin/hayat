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
                EnsureIncrementalSchema(context, logger);
                logger?.LogInformation("Database schema OK (Users table found).");
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

        private static void EnsureIncrementalSchema(AppDbContext context, ILogger? logger)
        {
            if (!TableExists(context, "Anecdotes"))
            {
                context.Database.ExecuteSqlRaw("""
                    CREATE TABLE IF NOT EXISTS "Anecdotes" (
                        "Id" INTEGER NOT NULL CONSTRAINT "PK_Anecdotes" PRIMARY KEY AUTOINCREMENT,
                        "UserId" INTEGER NOT NULL,
                        "Text" TEXT NOT NULL,
                        "Author" TEXT,
                        "CreatedAt" TEXT NOT NULL,
                        "UpdatedAt" TEXT NOT NULL,
                        CONSTRAINT "FK_Anecdotes_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE CASCADE
                    );
                    CREATE INDEX IF NOT EXISTS "IX_Anecdotes_UserId" ON "Anecdotes" ("UserId");
                    """);
                logger?.LogInformation("Created Anecdotes table (incremental schema).");
            }

            if (TableExists(context, "HabitCheckIns") && IndexIsUnique(context, "IX_HabitCheckIns_HabitId_Date"))
            {
                context.Database.ExecuteSqlRaw("""
                    DROP INDEX IF EXISTS "IX_HabitCheckIns_HabitId_Date";
                    CREATE INDEX IF NOT EXISTS "IX_HabitCheckIns_HabitId_Date" ON "HabitCheckIns" ("HabitId", "Date");
                    """);
                logger?.LogInformation("HabitCheckIns index updated for multiple daily check-ins.");
            }
        }

        private static bool IndexIsUnique(AppDbContext context, string indexName)
        {
            try
            {
                var connection = context.Database.GetDbConnection();
                if (connection.State != ConnectionState.Open)
                    connection.Open();

                using var command = connection.CreateCommand();
                command.CommandText = "SELECT sql FROM sqlite_master WHERE type='index' AND name=$name;";
                var param = command.CreateParameter();
                param.ParameterName = "$name";
                param.Value = indexName;
                command.Parameters.Add(param);
                var sql = command.ExecuteScalar() as string;
                return sql != null && sql.Contains("UNIQUE", StringComparison.OrdinalIgnoreCase);
            }
            catch (SqliteException)
            {
                return false;
            }
        }

        private static bool TableExists(AppDbContext context, string tableName)
        {
            try
            {
                var connection = context.Database.GetDbConnection();
                if (connection.State != ConnectionState.Open)
                    connection.Open();

                using var command = connection.CreateCommand();
                command.CommandText =
                    "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name=$name;";
                var param = command.CreateParameter();
                param.ParameterName = "$name";
                param.Value = tableName;
                command.Parameters.Add(param);
                return Convert.ToInt32(command.ExecuteScalar()) > 0;
            }
            catch (SqliteException)
            {
                return false;
            }
        }

        private static bool UsersTableExists(AppDbContext context) =>
            TableExists(context, "Users");
    }
}
