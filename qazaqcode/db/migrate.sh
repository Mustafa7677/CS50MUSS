#!/bin/bash
# Қолданылуы: DATABASE_URL=postgres://... ./db/migrate.sh [--dev-shim] [--check]
#   (жалаусыз)  : өндіріс режимі - тек db/migrations/*.sql, бір транзакцияда әрқайсысы, advisory lock, checksum тексерісі.
#   --dev-shim  : ТЕК жергілікті әзірлеу/тест. Supabase емес Postgres үшін auth схемасының шимін (db/dev/auth_shim.sql) қосады.
#                 Өндірісте/Supabase-те ҚАТАҢ ТЫЙЫМ: NODE_ENV/QC_ENV=production, supabase хосты не `auth.refresh_tokens` болса бас тартады.
#   --check     : ештеңе өзгертпейді; күтіп тұрған миграция болса 1 кодымен шығады (CI/деплойдан бұрын).
set -euo pipefail
cd "$(dirname "$0")"
: "${DATABASE_URL:?DATABASE_URL орнатылмаған}"
SHIM=0; CHECK=0
for a in "$@"; do
  case "$a" in
    --dev-shim) SHIM=1 ;;
    --check) CHECK=1 ;;
    *) echo "белгісіз аргумент: $a" >&2; exit 2 ;;
  esac
done
P() { psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q "$@"; }

if [ "$SHIM" = 1 ]; then
  if [ "${NODE_ENV:-}" = production ] || [ "${QC_ENV:-}" = production ]; then
    echo "ҚАТЕ: --dev-shim өндірісте (NODE_ENV/QC_ENV=production) рұқсат етілмейді" >&2; exit 3
  fi
  if [[ "$DATABASE_URL" == *supabase.co* || "$DATABASE_URL" == *pooler.supabase* ]]; then
    echo "ҚАТЕ: --dev-shim Supabase дерекқорына қолданылмайды (ол өз auth схемасын қолданады)" >&2; exit 3
  fi
  if [ "$(psql "$DATABASE_URL" -tA -c "select 1 from information_schema.tables where table_schema='auth' and table_name in ('refresh_tokens','identities') limit 1" 2>/dev/null || true)" = "1" ]; then
    echo "ҚАТЕ: дерекқорда нақты Supabase/GoTrue auth схемасы бар - dev shim оны бұзады. --dev-shim алынсын." >&2; exit 3
  fi
  [ "$CHECK" = 1 ] || P -f dev/auth_shim.sql
fi

if [ "$CHECK" = 0 ]; then
  P -c "create table if not exists public.schema_migrations (name text primary key, applied_at timestamptz not null default now())"
  P -c "alter table public.schema_migrations add column if not exists checksum text"
fi

pending=0
for f in migrations/*.sql; do
  n=$(basename "$f"); sum=$(sha256sum "$f" | cut -d' ' -f1)
  row=$(psql "$DATABASE_URL" -tA -c "select coalesce(checksum,'-') from public.schema_migrations where name='$n'" 2>/dev/null \
        || psql "$DATABASE_URL" -tA -c "select '-' from public.schema_migrations where name='$n'" 2>/dev/null || true)
  if [ -n "$row" ]; then
    if [ "$row" != "-" ] && [ "$row" != "$sum" ]; then
      echo "ҚАТЕ: қолданылған миграция өзгертілген: $n (жаңа өзгеріс үшін жаңа файл жасаңыз)" >&2; exit 4
    fi
    [ "$CHECK" = 1 ] || echo "бар: $n"; continue
  fi
  pending=$((pending+1))
  if [ "$CHECK" = 1 ]; then echo "күтілуде: $n"; continue; fi
  echo "іске қосылуда: $n"
  # әр миграция бір транзакцияда (-1); сәтті болса ғана жазба. Параллель іске қосудан advisory lock қорғайды.
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -1 \
    -c "select pg_advisory_xact_lock(727003)" -f "$f" \
    -c "insert into public.schema_migrations(name, checksum) values ('$n', '$sum')"
done
if [ "$CHECK" = 1 ]; then [ "$pending" = 0 ] && echo "күтіп тұрған миграция жоқ" || exit 1; else echo "миграциялар дайын"; fi
