#!/bin/sh
set -e
mkdir -p /data
chmod 777 /data 2>/dev/null || true
echo "Hayat API image version: $(cat /app/APP_VERSION.txt 2>/dev/null || echo unknown)"
exec dotnet /app/Hayat.Api.dll
