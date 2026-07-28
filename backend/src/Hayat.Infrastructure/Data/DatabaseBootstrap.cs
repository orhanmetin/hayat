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

            EnsureMeditationTypesSchema(context, logger);

            if (!TableExists(context, "ActiveTimers"))
            {
                context.Database.ExecuteSqlRaw("""
                    CREATE TABLE IF NOT EXISTS "ActiveTimers" (
                        "Id" INTEGER NOT NULL CONSTRAINT "PK_ActiveTimers" PRIMARY KEY AUTOINCREMENT,
                        "UserId" INTEGER NOT NULL,
                        "StartTime" TEXT NOT NULL,
                        CONSTRAINT "FK_ActiveTimers_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE CASCADE
                    );
                    CREATE UNIQUE INDEX IF NOT EXISTS "IX_ActiveTimers_UserId" ON "ActiveTimers" ("UserId");
                    """);
                logger?.LogInformation("Created ActiveTimers table (incremental schema).");
            }

            if (!TableExists(context, "RacePrepCounters"))
            {
                context.Database.ExecuteSqlRaw("""
                    CREATE TABLE IF NOT EXISTS "RacePrepCounters" (
                        "Id" INTEGER NOT NULL CONSTRAINT "PK_RacePrepCounters" PRIMARY KEY AUTOINCREMENT,
                        "UserId" INTEGER NOT NULL,
                        "VisualizationCount" INTEGER NOT NULL DEFAULT 0,
                        "UpdatedAt" TEXT NOT NULL,
                        CONSTRAINT "FK_RacePrepCounters_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE CASCADE
                    );
                    CREATE UNIQUE INDEX IF NOT EXISTS "IX_RacePrepCounters_UserId" ON "RacePrepCounters" ("UserId");
                    """);
                logger?.LogInformation("Created RacePrepCounters table (incremental schema).");
            }

            if (!TableExists(context, "PusulaTasks"))
            {
                context.Database.ExecuteSqlRaw("""
                    CREATE TABLE IF NOT EXISTS "PusulaCategories" (
                        "Id" INTEGER NOT NULL CONSTRAINT "PK_PusulaCategories" PRIMARY KEY AUTOINCREMENT,
                        "UserId" INTEGER NOT NULL,
                        "Name" TEXT NOT NULL,
                        "ParentId" INTEGER NULL,
                        "SortOrder" INTEGER NOT NULL DEFAULT 0,
                        "IsActive" INTEGER NOT NULL DEFAULT 1,
                        CONSTRAINT "FK_PusulaCategories_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE CASCADE,
                        CONSTRAINT "FK_PusulaCategories_PusulaCategories_ParentId" FOREIGN KEY ("ParentId") REFERENCES "PusulaCategories" ("Id") ON DELETE RESTRICT
                    );
                    CREATE INDEX IF NOT EXISTS "IX_PusulaCategories_UserId_ParentId" ON "PusulaCategories" ("UserId", "ParentId");

                    CREATE TABLE IF NOT EXISTS "PusulaTasks" (
                        "Id" INTEGER NOT NULL CONSTRAINT "PK_PusulaTasks" PRIMARY KEY AUTOINCREMENT,
                        "UserId" INTEGER NOT NULL,
                        "CategoryId" INTEGER NULL,
                        "Title" TEXT NOT NULL,
                        "Note" TEXT NULL,
                        "Date" TEXT NOT NULL,
                        "TimeOfDay" TEXT NULL,
                        "EstimatedMinutes" INTEGER NULL,
                        "ActualMinutes" INTEGER NULL,
                        "Priority" INTEGER NOT NULL DEFAULT 3,
                        "Recurrence" INTEGER NOT NULL DEFAULT 0,
                        "RecurrenceDay" INTEGER NULL,
                        "WorkType" INTEGER NOT NULL DEFAULT 0,
                        "Status" INTEGER NOT NULL DEFAULT 0,
                        "CompletedAt" TEXT NULL,
                        "CreatedAt" TEXT NOT NULL,
                        "SortOrder" INTEGER NOT NULL DEFAULT 0,
                        CONSTRAINT "FK_PusulaTasks_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE CASCADE,
                        CONSTRAINT "FK_PusulaTasks_PusulaCategories_CategoryId" FOREIGN KEY ("CategoryId") REFERENCES "PusulaCategories" ("Id") ON DELETE SET NULL
                    );
                    CREATE INDEX IF NOT EXISTS "IX_PusulaTasks_UserId_Date" ON "PusulaTasks" ("UserId", "Date");

                    CREATE TABLE IF NOT EXISTS "PusulaTaskSteps" (
                        "Id" INTEGER NOT NULL CONSTRAINT "PK_PusulaTaskSteps" PRIMARY KEY AUTOINCREMENT,
                        "TaskId" INTEGER NOT NULL,
                        "Title" TEXT NOT NULL,
                        "SortOrder" INTEGER NOT NULL DEFAULT 0,
                        CONSTRAINT "FK_PusulaTaskSteps_PusulaTasks_TaskId" FOREIGN KEY ("TaskId") REFERENCES "PusulaTasks" ("Id") ON DELETE CASCADE
                    );
                    CREATE INDEX IF NOT EXISTS "IX_PusulaTaskSteps_TaskId" ON "PusulaTaskSteps" ("TaskId");

                    CREATE TABLE IF NOT EXISTS "PusulaStepChecks" (
                        "Id" INTEGER NOT NULL CONSTRAINT "PK_PusulaStepChecks" PRIMARY KEY AUTOINCREMENT,
                        "StepId" INTEGER NOT NULL,
                        "Date" TEXT NOT NULL,
                        CONSTRAINT "FK_PusulaStepChecks_PusulaTaskSteps_StepId" FOREIGN KEY ("StepId") REFERENCES "PusulaTaskSteps" ("Id") ON DELETE CASCADE
                    );
                    CREATE UNIQUE INDEX IF NOT EXISTS "IX_PusulaStepChecks_StepId_Date" ON "PusulaStepChecks" ("StepId", "Date");

                    CREATE TABLE IF NOT EXISTS "PusulaOccurrences" (
                        "Id" INTEGER NOT NULL CONSTRAINT "PK_PusulaOccurrences" PRIMARY KEY AUTOINCREMENT,
                        "TaskId" INTEGER NOT NULL,
                        "Date" TEXT NOT NULL,
                        "Status" INTEGER NOT NULL DEFAULT 0,
                        "ActualMinutes" INTEGER NULL,
                        "CompletedAt" TEXT NULL,
                        CONSTRAINT "FK_PusulaOccurrences_PusulaTasks_TaskId" FOREIGN KEY ("TaskId") REFERENCES "PusulaTasks" ("Id") ON DELETE CASCADE
                    );
                    CREATE UNIQUE INDEX IF NOT EXISTS "IX_PusulaOccurrences_TaskId_Date" ON "PusulaOccurrences" ("TaskId", "Date");

                    CREATE TABLE IF NOT EXISTS "PusulaDayReviews" (
                        "Id" INTEGER NOT NULL CONSTRAINT "PK_PusulaDayReviews" PRIMARY KEY AUTOINCREMENT,
                        "UserId" INTEGER NOT NULL,
                        "Date" TEXT NOT NULL,
                        "StartVision" TEXT NULL,
                        "EndReflection" TEXT NULL,
                        "FeelingScore" INTEGER NULL,
                        "UpdatedAt" TEXT NOT NULL,
                        CONSTRAINT "FK_PusulaDayReviews_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE CASCADE
                    );
                    CREATE UNIQUE INDEX IF NOT EXISTS "IX_PusulaDayReviews_UserId_Date" ON "PusulaDayReviews" ("UserId", "Date");
                    """);
                logger?.LogInformation("Created Pusula tables (incremental schema).");
            }

            if (TableExists(context, "PusulaTasks") && !ColumnExists(context, "PusulaTasks", "SortOrder"))
            {
                context.Database.ExecuteSqlRaw("""
                    ALTER TABLE "PusulaTasks" ADD COLUMN "SortOrder" INTEGER NOT NULL DEFAULT 0;
                    """);
                logger?.LogInformation("Added SortOrder to PusulaTasks.");
            }

            // Hard-delete soft-deleted Pusula categories (e.g. duplicate inactive "Kişisel").
            if (TableExists(context, "PusulaCategories"))
            {
                // SQLite: wrap self-referencing subqueries so DELETE/UPDATE can target the same table.
                var cleared = context.Database.ExecuteSqlRaw("""
                    UPDATE "PusulaTasks"
                    SET "CategoryId" = NULL
                    WHERE "CategoryId" IN (
                        SELECT "Id" FROM (
                            SELECT c."Id" FROM "PusulaCategories" c
                            WHERE c."IsActive" = 0
                            UNION
                            SELECT c."Id" FROM "PusulaCategories" c
                            INNER JOIN "PusulaCategories" p ON c."ParentId" = p."Id"
                            WHERE p."IsActive" = 0
                        )
                    );
                    """);

                var deletedChildren = context.Database.ExecuteSqlRaw("""
                    DELETE FROM "PusulaCategories"
                    WHERE "Id" IN (
                        SELECT "Id" FROM (
                            SELECT c."Id" FROM "PusulaCategories" c
                            INNER JOIN "PusulaCategories" p ON c."ParentId" = p."Id"
                            WHERE p."IsActive" = 0
                        )
                    );
                    """);

                var deletedInactive = context.Database.ExecuteSqlRaw("""
                    DELETE FROM "PusulaCategories" WHERE "IsActive" = 0;
                    """);

                if (cleared + deletedChildren + deletedInactive > 0)
                    logger?.LogInformation(
                        "Purged inactive Pusula categories (hard delete): {TasksCleared} task links, {Children} children, {Inactive} inactive.",
                        cleared, deletedChildren, deletedInactive);
            }

            if (TableExists(context, "Users") && !ColumnExists(context, "Users", "ShortcutsApiToken"))
            {
                context.Database.ExecuteSqlRaw("""
                    ALTER TABLE "Users" ADD COLUMN "ShortcutsApiToken" TEXT NULL;
                    """);
                context.Database.ExecuteSqlRaw("""
                    CREATE INDEX IF NOT EXISTS "IX_Users_ShortcutsApiToken" ON "Users" ("ShortcutsApiToken");
                    """);
                logger?.LogInformation("Added ShortcutsApiToken to Users.");
            }

            if (!TableExists(context, "DailyStepLogs"))
            {
                context.Database.ExecuteSqlRaw("""
                    CREATE TABLE IF NOT EXISTS "DailyStepLogs" (
                        "Id" INTEGER NOT NULL CONSTRAINT "PK_DailyStepLogs" PRIMARY KEY AUTOINCREMENT,
                        "UserId" INTEGER NOT NULL,
                        "Date" TEXT NOT NULL,
                        "Steps" INTEGER NOT NULL,
                        "Source" TEXT NOT NULL DEFAULT 'shortcuts',
                        "SyncedAt" TEXT NOT NULL,
                        CONSTRAINT "FK_DailyStepLogs_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE CASCADE
                    );
                    CREATE UNIQUE INDEX IF NOT EXISTS "IX_DailyStepLogs_UserId_Date" ON "DailyStepLogs" ("UserId", "Date");
                    """);
                logger?.LogInformation("Created DailyStepLogs table.");
            }

            if (!TableExists(context, "ScreenTimeLogs"))
            {
                context.Database.ExecuteSqlRaw("""
                    CREATE TABLE IF NOT EXISTS "ScreenTimeLogs" (
                        "Id" INTEGER NOT NULL CONSTRAINT "PK_ScreenTimeLogs" PRIMARY KEY AUTOINCREMENT,
                        "UserId" INTEGER NOT NULL,
                        "Date" TEXT NOT NULL,
                        "AppName" TEXT NOT NULL,
                        "Kind" TEXT NOT NULL DEFAULT 'app',
                        "Minutes" INTEGER NOT NULL,
                        "SyncedAt" TEXT NOT NULL,
                        CONSTRAINT "FK_ScreenTimeLogs_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE CASCADE
                    );
                    CREATE UNIQUE INDEX IF NOT EXISTS "IX_ScreenTimeLogs_UserId_Date_AppName_Kind"
                        ON "ScreenTimeLogs" ("UserId", "Date", "AppName", "Kind");
                    """);
                logger?.LogInformation("Created ScreenTimeLogs table.");
            }
        }

        private static void EnsureMeditationTypesSchema(AppDbContext context, ILogger? logger)
        {
            if (!TableExists(context, "MeditationTypes"))
            {
                context.Database.ExecuteSqlRaw("""
                    CREATE TABLE IF NOT EXISTS "MeditationTypes" (
                        "Id" INTEGER NOT NULL CONSTRAINT "PK_MeditationTypes" PRIMARY KEY AUTOINCREMENT,
                        "Name" TEXT NOT NULL,
                        "IsActive" INTEGER NOT NULL DEFAULT 1,
                        "SortOrder" INTEGER NOT NULL DEFAULT 0
                    );
                    CREATE UNIQUE INDEX IF NOT EXISTS "IX_MeditationTypes_Name" ON "MeditationTypes" ("Name");
                    """);
                logger?.LogInformation("Created MeditationTypes table (incremental schema).");
            }

            var typeCount = 0;
            try
            {
                var connection = context.Database.GetDbConnection();
                if (connection.State != ConnectionState.Open)
                    connection.Open();
                using var command = connection.CreateCommand();
                command.CommandText = "SELECT COUNT(*) FROM MeditationTypes;";
                typeCount = Convert.ToInt32(command.ExecuteScalar());
            }
            catch (SqliteException)
            {
                return;
            }

            if (typeCount == 0)
            {
                context.Database.ExecuteSqlRaw("""
                    INSERT INTO "MeditationTypes" ("Name", "IsActive", "SortOrder") VALUES ('Oturma', 1, 1);
                    INSERT INTO "MeditationTypes" ("Name", "IsActive", "SortOrder") VALUES ('Uzanma', 1, 2);
                    INSERT INTO "MeditationTypes" ("Name", "IsActive", "SortOrder") VALUES ('Yapma', 1, 3);
                    INSERT INTO "MeditationTypes" ("Name", "IsActive", "SortOrder") VALUES ('Yapmama', 1, 4);
                    """);
                logger?.LogInformation("Seeded default meditation types.");
            }

            if (TableExists(context, "MeditationSessions") && !ColumnExists(context, "MeditationSessions", "MeditationTypeId"))
            {
                context.Database.ExecuteSqlRaw("""
                    ALTER TABLE "MeditationSessions" ADD COLUMN "MeditationTypeId" INTEGER NULL;
                    """);
                context.Database.ExecuteSqlRaw("""
                    UPDATE "MeditationSessions"
                    SET "MeditationTypeId" = (SELECT "Id" FROM "MeditationTypes" WHERE "Name" = 'Oturma' LIMIT 1)
                    WHERE "MeditationTypeId" IS NULL;
                    """);
                logger?.LogInformation("Added MeditationTypeId to MeditationSessions and backfilled.");
            }
        }

        private static bool ColumnExists(AppDbContext context, string tableName, string columnName)
        {
            try
            {
                var connection = context.Database.GetDbConnection();
                if (connection.State != ConnectionState.Open)
                    connection.Open();

                using var command = connection.CreateCommand();
                command.CommandText = $"PRAGMA table_info(\"{tableName}\");";
                using var reader = command.ExecuteReader();
                while (reader.Read())
                {
                    var name = reader.GetString(1);
                    if (string.Equals(name, columnName, StringComparison.OrdinalIgnoreCase))
                        return true;
                }
                return false;
            }
            catch (SqliteException)
            {
                return false;
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
