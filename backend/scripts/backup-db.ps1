# Requer: pg_dump no PATH e variável DATABASE_URL (mesma do Prisma).
if (-not $env:DATABASE_URL) {
    Write-Error "Defina DATABASE_URL (ex.: `$env:DATABASE_URL = 'postgresql://...')"
    exit 1
}

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$out = "backup-$stamp.sql"
& pg_dump $env:DATABASE_URL --no-owner --format=p -f $out
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host "Backup escrito: $out"
