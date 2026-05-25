using System;
using Hayat.Infrastructure.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Hayat.Infrastructure.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260524140000_SleepWakeOptional")]
    /// <inheritdoc />
    public partial class SleepWakeOptional : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // SQLite AlterColumn desteklemez; tablo yeniden oluşturulur.
            migrationBuilder.Sql(
                """
                PRAGMA foreign_keys=OFF;

                CREATE TABLE "SleepLogs_new" (
                    "Id" INTEGER NOT NULL CONSTRAINT "PK_SleepLogs" PRIMARY KEY AUTOINCREMENT,
                    "UserId" INTEGER NOT NULL,
                    "BedTime" TEXT NOT NULL,
                    "WakeTime" TEXT NULL,
                    "Quality" INTEGER NOT NULL,
                    "Note" TEXT NULL,
                    "CreatedAt" TEXT NOT NULL,
                    CONSTRAINT "FK_SleepLogs_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE CASCADE
                );

                INSERT INTO "SleepLogs_new" ("Id", "UserId", "BedTime", "WakeTime", "Quality", "Note", "CreatedAt")
                SELECT "Id", "UserId", "BedTime", "WakeTime", "Quality", "Note", "CreatedAt" FROM "SleepLogs";

                DROP TABLE "SleepLogs";
                ALTER TABLE "SleepLogs_new" RENAME TO "SleepLogs";
                CREATE INDEX "IX_SleepLogs_UserId" ON "SleepLogs" ("UserId");

                PRAGMA foreign_keys=ON;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                PRAGMA foreign_keys=OFF;

                CREATE TABLE "SleepLogs_old" (
                    "Id" INTEGER NOT NULL CONSTRAINT "PK_SleepLogs" PRIMARY KEY AUTOINCREMENT,
                    "UserId" INTEGER NOT NULL,
                    "BedTime" TEXT NOT NULL,
                    "WakeTime" TEXT NOT NULL,
                    "Quality" INTEGER NOT NULL,
                    "Note" TEXT NULL,
                    "CreatedAt" TEXT NOT NULL,
                    CONSTRAINT "FK_SleepLogs_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE CASCADE
                );

                INSERT INTO "SleepLogs_old" ("Id", "UserId", "BedTime", "WakeTime", "Quality", "Note", "CreatedAt")
                SELECT "Id", "UserId", "BedTime", COALESCE("WakeTime", "BedTime"), "Quality", "Note", "CreatedAt" FROM "SleepLogs";

                DROP TABLE "SleepLogs";
                ALTER TABLE "SleepLogs_old" RENAME TO "SleepLogs";
                CREATE INDEX "IX_SleepLogs_UserId" ON "SleepLogs" ("UserId");

                PRAGMA foreign_keys=ON;
                """);
        }
    }
}
