#!/bin/sh
set -e
mkdir -p /data
chmod 777 /data 2>/dev/null || true
echo "Hayat API image version: $(cat /app/APP_VERSION.txt 2>/dev/null || echo unknown)"
echo "Hayat bootstrap: $(cat /app/BOOTSTRAP_VERSION.txt 2>/dev/null || echo unknown)"
if [ ! -s /data/hayat.db ] && [ -f /app/seed/hayat.initial.db ]; then
  echo "Seeding /data/hayat.db from image bundle."
  cp /app/seed/hayat.initial.db /data/hayat.db
fi
exec dotnet /app/Hayat.Api.dll
