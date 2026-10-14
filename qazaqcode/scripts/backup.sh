#!/bin/bash
# QazaqCode: шифрланған логикалық көшірме (pg_dump -Fc + AES-256).
# Қолданылуы:
#   DATABASE_URL=postgres://... BACKUP_PASSPHRASE_FILE=/run/secrets/qc_backup_pass ./scripts/backup.sh [шығыс_қалта]
# Орта айнымалылары:
#   BACKUP_PASSPHRASE_FILE  - құпиясөзі бар файл (ұсынылады; chmod 600). Не BACKUP_PASSPHRASE (env; процесс тізімінде көрінбейді, бірақ журналға жазбаңыз).
#   BACKUP_SCHEMAS          - бос орынмен бөлінген схемалар (әдепкі: "public"). Өз Postgres + auth shim/GoTrue болса: "public auth".
#                             Supabase Cloud: auth схемасын Supabase-тің өз backup/PITR-ы сақтайды (docs/DEPLOY.md).
#   BACKUP_KEEP_DAYS        - осыдан ескі *.dump.enc файлдары өшіріледі (әдепкі: өшірмейді)
# ЕСКЕРТУ: көшірмеде оқушылардың дербес деректері бар. Шифрсыз файл ешқашан дискіге түспейді (құбыр арқылы). Файлды
# Қазақстан аумағындағы сақтауға, қолжетімділігі шектелген орынға көшіріңіз. Қалпына келтіруді айына бір рет тексеріңіз.
set -euo pipefail
umask 077
: "${DATABASE_URL:?DATABASE_URL орнатылмаған}"
OUT=${1:-./backups}
if [ -n "${BACKUP_PASSPHRASE_FILE:-}" ]; then PASS_ARGS=(-pass "file:$BACKUP_PASSPHRASE_FILE")
elif [ -n "${BACKUP_PASSPHRASE:-}" ]; then export BACKUP_PASSPHRASE; PASS_ARGS=(-pass env:BACKUP_PASSPHRASE)
else echo "ҚАТЕ: BACKUP_PASSPHRASE_FILE не BACKUP_PASSPHRASE керек (көшірме шифрланбай жасалмайды)" >&2; exit 2; fi
mkdir -p "$OUT"
TS=$(date -u +%Y%m%dT%H%M%SZ)
FILE="$OUT/qazaqcode-$TS.dump.enc"
SCHEMA_ARGS=(); for s in ${BACKUP_SCHEMAS:-public}; do SCHEMA_ARGS+=(--schema="$s"); done
# pg_dump -> openssl (PBKDF2, 600k итерация) тікелей құбырда: шифрсыз аралық файл жоқ
pg_dump "$DATABASE_URL" -Fc --no-owner --no-privileges "${SCHEMA_ARGS[@]}" \
  | openssl enc -aes-256-cbc -pbkdf2 -iter 600000 -salt "${PASS_ARGS[@]}" -out "$FILE"
[ -s "$FILE" ] || { echo "ҚАТЕ: көшірме бос" >&2; rm -f "$FILE"; exit 1; }
( cd "$OUT" && sha256sum "$(basename "$FILE")" > "$(basename "$FILE").sha256" )
if [ -n "${BACKUP_KEEP_DAYS:-}" ]; then
  find "$OUT" -name 'qazaqcode-*.dump.enc*' -mtime +"$BACKUP_KEEP_DAYS" -delete
fi
echo "дайын: $FILE ($(du -h "$FILE" | cut -f1))"
