#!/bin/bash
# QazaqCode: қосымшаға ЖЕКЕ, құқығы шектеулі дерекқор рөлі (superuser/bypassrls ЕМЕС).
# Қосымша әр сұранысты `set local role authenticated` арқылы орындайды, сондықтан қосылу рөлі тек authenticated/anon мүшесі болуы тиіс.
# Қолданылуы (иесі/superuser атынан, миграциялардан КЕЙІН): 
#   ADMIN_DATABASE_URL=postgres://postgres:...@host/db APP_DB_PASSWORD='<кездейсоқ>' ./scripts/init-db-roles.sh
# Нәтиже: DATABASE_URL=postgres://qc_app:<APP_DB_PASSWORD>@host/db  (Supabase-те pooler: пайдаланушы qc_app.<project-ref>)
# Supabase: бұл рөл міндетті емес (postgres рөлі authenticated-ке мүше), бірақ least-privilege үшін ұсынылады.
set -euo pipefail
: "${ADMIN_DATABASE_URL:?ADMIN_DATABASE_URL (иесі) керек}"
: "${APP_DB_PASSWORD:?APP_DB_PASSWORD керек}"
ROLE=${APP_DB_ROLE:-qc_app}
[[ "$ROLE" =~ ^[a-z_][a-z0-9_]*$ ]] || { echo "рөл аты қате" >&2; exit 2; }
psql "$ADMIN_DATABASE_URL" -v ON_ERROR_STOP=1 -q -v role="$ROLE" -v pw="$APP_DB_PASSWORD" <<'SQL'
select format('create role %I login nosuperuser nocreatedb nocreaterole noreplication nobypassrls noinherit', :'role')
  where not exists (select 1 from pg_roles where rolname = :'role') \gexec
select format('alter role %I with login nosuperuser nobypassrls noinherit password %L connection limit 40', :'role', :'pw') \gexec
select format('grant authenticated, anon to %I', :'role') \gexec
select format('grant usage on schema public to %I', :'role') \gexec
SQL
echo "дайын: рөл $ROLE (superuser емес, RLS айналып өтпейді)"
