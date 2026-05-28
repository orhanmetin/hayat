using Hayat.Infrastructure.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Hayat.Infrastructure.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260528200557_AlignModelSnapshot")]
    /// <inheritdoc />
    public partial class AlignModelSnapshot : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_SportActivities_UserId",
                table: "SportActivities");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_SportActivities_UserId",
                table: "SportActivities",
                column: "UserId");
        }
    }
}
