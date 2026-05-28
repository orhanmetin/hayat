using System;
using Hayat.Infrastructure.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Hayat.Infrastructure.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260526120000_StravaIntegration")]
    /// <inheritdoc />
    public partial class StravaIntegration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<long>(
                name: "StravaActivityId",
                table: "SportActivities",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "UserStravaConnections",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    UserId = table.Column<int>(type: "INTEGER", nullable: false),
                    AthleteId = table.Column<long>(type: "INTEGER", nullable: false),
                    AccessToken = table.Column<string>(type: "TEXT", maxLength: 512, nullable: false),
                    RefreshToken = table.Column<string>(type: "TEXT", maxLength: 512, nullable: false),
                    ExpiresAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    ConnectedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    LastSyncAtUtc = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserStravaConnections", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserStravaConnections_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SportActivities_UserId_StravaActivityId",
                table: "SportActivities",
                columns: new[] { "UserId", "StravaActivityId" },
                unique: true,
                filter: "StravaActivityId IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_UserStravaConnections_UserId",
                table: "UserStravaConnections",
                column: "UserId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "UserStravaConnections");
            migrationBuilder.DropIndex(name: "IX_SportActivities_UserId_StravaActivityId", table: "SportActivities");
            migrationBuilder.DropColumn(name: "StravaActivityId", table: "SportActivities");
        }
    }
}
