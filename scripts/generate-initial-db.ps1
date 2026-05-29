# Generates deploy/hayat.initial.db (admin + seed). Stops Hayat.Api/dotnet locks first.
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$dbPath = Join-Path $root "deploy\hayat.initial.db"
$apiDir = Join-Path $root "backend\src\Hayat.Api"

Get-CimInstance Win32_Process -Filter "Name='dotnet.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -match 'Hayat\.Api' } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }

New-Item -ItemType Directory -Force -Path (Split-Path $dbPath) | Out-Null
foreach ($f in @($dbPath, "$dbPath-shm", "$dbPath-wal")) {
    if (Test-Path $f) { Remove-Item $f -Force }
}

$env:ConnectionStrings__DefaultConnection = "Data Source=$dbPath"
Push-Location $apiDir
try {
    dotnet run -- --init-db-only
    if (-not (Test-Path $dbPath)) { throw "DB file was not created: $dbPath" }
    Write-Host "OK: $dbPath ($((Get-Item $dbPath).Length) bytes)"
}
finally {
    Pop-Location
    Remove-Item Env:ConnectionStrings__DefaultConnection -ErrorAction SilentlyContinue
}
