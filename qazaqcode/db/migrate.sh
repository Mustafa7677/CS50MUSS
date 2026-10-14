#!/bin/bash
# Қолданылуы: DATABASE_URL=postgres://... ./db/migrate.sh [--dev-shim]
# --dev-shim: Supabase емес жергілікті Postgres үшін auth схемасының шимін қосады (ӨНДІРІСТЕ ҚОСПАҢЫЗ).
set -euo pipefail
cd "$(dirname "$0")"
: "${DATABASE_URL:?DATABASE_URL орнатылмаған}"
[ "${1:-}" = "--dev-shim" ] && psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -f dev/auth_shim.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -c "create table if not exists public.schema_migrations (name text primary key, applied_at timestamptz not null default now())"
for f in migrations/*.sql; do
  n=$(basename "$f")
  if [ "$(psql "$DATABASE_URL" -tA -c "select 1 from public.schema_migrations where name='$n'")" = "1" ]; then echo "бар: $n"; continue; fi
  echo "іске қосылуда: $n"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -1 -f "$f"
  psql "$DATABASE_URL" -q -c "insert into public.schema_migrations(name) values ('$n')"
done
echo "миграциялар дайын"
