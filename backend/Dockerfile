FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY src/Hayat.Domain/Hayat.Domain.csproj Hayat.Domain/
COPY src/Hayat.Application/Hayat.Application.csproj Hayat.Application/
COPY src/Hayat.Infrastructure/Hayat.Infrastructure.csproj Hayat.Infrastructure/
COPY src/Hayat.Api/Hayat.Api.csproj Hayat.Api/
RUN dotnet restore Hayat.Api/Hayat.Api.csproj

COPY src/ ./
RUN dotnet publish Hayat.Api/Hayat.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
RUN mkdir -p /data
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
VOLUME ["/data"]
ENTRYPOINT ["dotnet", "Hayat.Api.dll"]
