#!/bin/sh
set -e
mkdir -p /data
chown -R app:app /data 2>/dev/null || true
exec su -s /bin/sh app -c 'cd /app && exec dotnet Hayat.Api.dll'
