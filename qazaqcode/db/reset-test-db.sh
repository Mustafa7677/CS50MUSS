#!/bin/bash
# Тест дерекқорын нөлден жасайды (жергілікті Postgres, dev shim-мен)
set -euo pipefail
D=${PGHOST_DIR:-/var/tmp/cs50pg}; PORT=${PGPORT_TEST:-5499}
psql -h "$D" -p "$PORT" -U postgres -q -c "drop database if exists qc_test" -c "create database qc_test" >/dev/null
DATABASE_URL="postgresql://postgres@/qc_test?host=$D&port=$PORT" bash "$(dirname "$0")/migrate.sh" --dev-shim >/dev/null
echo "qc_test дайын"
