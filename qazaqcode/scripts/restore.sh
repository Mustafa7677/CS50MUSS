#!/bin/bash
# QazaqCode: backup.sh жасаған шифрланған көшірмені қалпына келтіру.
# Қолданылуы:
#   DATABASE_URL=<БОС нысана дерекқор> BACKUP_PASSPHRASE_FILE=... ./scripts/restore.sh backups/qazaqcode-XXXX.dump.enc --yes [--clean]
# Қауіпсіздік: --yes жалауынсыз ештеңе істемейді; нысана дерекқор аты көрсетіледі. Әдепкі бойынша БОС дерекқорға қалпына келтіреді
# (pgcrypto сияқты кеңейтулер алдын ала болуы тиіс: Supabase-те бар). --clean: бар нысаларды алдымен өшіреді (ДЕРЕКТЕР ЖОЙЫЛАДЫ;
# кеңейтулері public схемасында тұрған дерекқорда схеманы өшіру сәтсіз болады). Бәрі бір транзакцияда: қате болса өзгеріс қалмайды.
# Өндіріске қалпына келтірмес бұрын алдымен БӨЛЕК дерекқорға жасап тексеріңіз (docs/DEPLOY.md «Қалпына келтіру тексерісі»).
set -euo pipefail
FILE=${1:?көшірме файлы (.dump.enc)}; shift || true
: "${DATABASE_URL:?DATABASE_URL орнатылмаған}"
CLEAN=(); for a in "$@"; do [ "$a" = "--clean" ] && CLEAN=(--clean --if-exists); done
[ "${1:-}" = "--yes" ] || { echo "Нысана: $(psql "$DATABASE_URL" -tAc "select current_database() || ' @ ' || coalesce(inet_server_addr()::text, 'socket')"). Растау үшін --yes қосыңыз." >&2; exit 2; }
if [ -n "${BACKUP_PASSPHRASE_FILE:-}" ]; then PASS_ARGS=(-pass "file:$BACKUP_PASSPHRASE_FILE")
elif [ -n "${BACKUP_PASSPHRASE:-}" ]; then export BACKUP_PASSPHRASE; PASS_ARGS=(-pass env:BACKUP_PASSPHRASE)
else echo "ҚАТЕ: BACKUP_PASSPHRASE_FILE не BACKUP_PASSPHRASE керек" >&2; exit 2; fi
if [ -f "$FILE.sha256" ]; then ( cd "$(dirname "$FILE")" && sha256sum -c "$(basename "$FILE").sha256" ) || { echo "ҚАТЕ: бақылау сомасы сәйкес емес" >&2; exit 1; }
else echo "ЕСКЕРТУ: $FILE.sha256 жоқ - тұтастық тексерілмеді" >&2; fi
# Шифрсыз аралық файл тек жедел жадтағы (tmpfs) уақытша қалтада және шығарда өшіріледі
TMP=$(mktemp -d -p "$( [ -d /dev/shm ] && echo /dev/shm || echo "${TMPDIR:-/tmp}" )"); trap 'rm -rf "$TMP"' EXIT
openssl enc -d -aes-256-cbc -pbkdf2 -iter 600000 "${PASS_ARGS[@]}" -in "$FILE" -out "$TMP/db.dump"
# `CREATE SCHEMA public` нысанада бар схемамен қақтығыспауы үшін тізімнен алынады
pg_restore -l "$TMP/db.dump" | grep -v -E ' SCHEMA - public( |$)' > "$TMP/list"
pg_restore "${CLEAN[@]}" --no-owner --no-privileges --single-transaction -L "$TMP/list" -d "$DATABASE_URL" "$TMP/db.dump"
echo "қалпына келтірілді. Енді: db/migrate.sh --check (миграциялар сәйкестігі) және /api/health"
