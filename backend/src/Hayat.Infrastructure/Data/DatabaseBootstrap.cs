using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Configuration;

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
            optionsBuilder.UseSqlite(
                connectionString,
                sqlite => sqlite.MigrationsAssembly(typeof(DatabaseBootstrap).Assembly.GetName().Name));

            return new AppDbContext(optionsBuilder.Options);
        }

        public static void ApplyMigrations(AppDbContext context)
        {
            try
            {
                context.Database.ExecuteSqlRaw("DELETE FROM \"__EFMigrationsLock\"");
            }
            catch
            {
                // lock tablosu yoksa yoksay
            }

            context.Database.Migrate();
        }
    }
}
