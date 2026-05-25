using Hayat.Infrastructure.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Hayat.Infrastructure.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260525120000_SportDistanceStrava")]
    /// <inheritdoc />
    public partial class SportDistanceStrava : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "DistanceKm",
                table: "SportActivities",
                type: "REAL",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "StravaLink",
                table: "SportActivities",
                type: "TEXT",
                maxLength: 500,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "DistanceKm", table: "SportActivities");
            migrationBuilder.DropColumn(name: "StravaLink", table: "SportActivities");
        }
    }
}
