FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY backend/src/Hayat.Domain/Hayat.Domain.csproj Hayat.Domain/
COPY backend/src/Hayat.Application/Hayat.Application.csproj Hayat.Application/
COPY backend/src/Hayat.Infrastructure/Hayat.Infrastructure.csproj Hayat.Infrastructure/
COPY backend/src/Hayat.Api/Hayat.Api.csproj Hayat.Api/
RUN dotnet restore Hayat.Api/Hayat.Api.csproj

COPY backend/src/ ./
RUN dotnet publish Hayat.Api/Hayat.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
RUN mkdir -p /data
COPY --from=build /app/publish .
COPY deploy/hayat.initial.db /app/seed/hayat.initial.db
COPY backend/docker-entrypoint.sh /entrypoint.sh
ARG APP_VERSION=unknown
RUN chmod +x /entrypoint.sh \
    && echo "$APP_VERSION" > /app/APP_VERSION.txt \
    && echo "v3-ensure-created-no-migrate" > /app/BOOTSTRAP_VERSION.txt
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
VOLUME ["/data"]
USER root
ENTRYPOINT ["/entrypoint.sh"]
