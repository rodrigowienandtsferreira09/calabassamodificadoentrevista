#!/usr/bin/env bash
# Requer: PostgreSQL client (pg_dump) e DATABASE_URL no ambiente.
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "Defina DATABASE_URL (ex.: export DATABASE_URL=postgresql://...)" >&2
  exit 1
fi

stamp=$(date +%Y%m%d-%H%M%S)
out="backup-${stamp}.sql"
pg_dump "$DATABASE_URL" --no-owner --format=p -f "$out"
echo "Backup escrito: $out"
