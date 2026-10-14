#!/bin/bash
# Қолданылуы: db/create-db.sh <дерекқор_аты>  - жергілікті Postgres-те жаңа дерекқор + миграциялар (dev shim-мен)
set -euo pipefail
NAME=${1:?дерекқор аты}; D=${PGHOST_DIR:-/var/tmp/cs50pg}; PORT=${PGPORT_TEST:-5499}
psql -h "$D" -p "$PORT" -U postgres -q -c "drop database if exists \"$NAME\"" -c "create database \"$NAME\"" >/dev/null
DATABASE_URL="postgresql://postgres@/$NAME?host=$D&port=$PORT" bash "$(dirname "$0")/migrate.sh" --dev-shim >/dev/null 2>&1
echo "postgresql://postgres@/$NAME?host=$D&port=$PORT"
