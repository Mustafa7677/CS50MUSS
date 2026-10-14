# QazaqCode: орналастыру нұсқаулығы

> **Күй (шынайы):** жергілікті PostgreSQL + `next start` және standalone `node server.js` (Docker-сыз) нұсқасында сыналған.
> **Сыналмаған:** `docker build`/`docker compose` (бұл ортада Docker демоны жоқ), нақты Supabase жобасы, бұлттық хостинг, Caddy/nginx үлгілері.
> Пилоттан бұрын төмендегі «Өндіріске шығар алдындағы чеклист» міндетті. Аудит нәтижесі: [SECURITY-AUDIT.md](SECURITY-AUDIT.md).

GitHub Pages бұл өнімге жарамайды (сервер мен дерекқор керек). CS50 қазақша сайты Pages-те қалады; QazaqCode бөлек орналастырылады.

## Архитектура (қысқаша)

```
браузер ──HTTPS──> reverse proxy (Caddy/nginx) ──HTTP, ішкі желі──> app (Next.js standalone, :3000)
                                                                       │  DATABASE_URL (қосымша рөлі, superuser емес)
                                                                       ▼
                                                 PostgreSQL (RLS)  +  Auth (Supabase GoTrue)
```

Қосымша **рөл бойынша құқықты дерекқорда** тексереді (RLS + SECURITY DEFINER функциялары); `service_role` кілті қолданылмайды.
Әр сұраныс `set local role authenticated` + JWT claims арқылы жүреді, сондықтан қосылу рөлі superuser/BYPASSRLS болмауы тиіс (`scripts/init-db-roles.sh`).

## Орта айнымалылары

Толық тізім: `.env.example`. Өндірісте сервер **іске қосылмайды** (`src/instrumentation.ts` + `src/lib/env.ts`), егер:

| Тексеру | Қате жағдайы |
|---|---|
| JWT құпиясы (`SUPABASE_JWT_SECRET` / `AUTH_JWT_SECRET`) | < 32 символ, үлгі мән (`change-me`, `dev-secret`…), аз әртүрлі символ, қайталанған үлгі |
| `COOKIE_SECURE` | `true` емес |
| `APP_URL` / `SUPABASE_URL` | `https://` емес |
| `AUTH_DRIVER=local` | өндірісте тыйым (құпиясөздер Supabase Auth-та сақталуы тиіс) |

`ALLOW_LOCAL_AUTH_IN_PRODUCTION=yes` және `RATE_LIMIT_DISABLED=yes` **тек e2e/демо** үшін: бұл жалау жоғарыдағы өндіріс тексерістерін өшіреді. Өндіріс `.env`-інде болмауы тиіс.
Құпиялар тек хостингтің secret store-ында не `chmod 600` `.env` файлында; ғитке салынбайды (`.gitignore`: `.env*`, `secrets/`, `backups/`).

## Нұсқа A: Supabase (дерекқор + Auth) + Node хостинг

1. **Жоба жасау.** Supabase-те жаңа жоба; аймақты таңдағанда «Дербес деректер» бөлімін оқыңыз (Қазақстанда сақтау талабы заңгермен нақтыланады; Supabase Cloud шетелде).
2. **Миграцияларды қолдану (ретімен: 0001 → соңғысы).** Тікелей қосылу (direct connection, порт 5432; pooler DDL үшін емес) және иесі рөлі:
   ```bash
   DATABASE_URL='postgresql://postgres:<құпия>@db.<ref>.supabase.co:5432/postgres' bash db/migrate.sh --check   # не күтілуде
   DATABASE_URL='...' bash db/migrate.sh                                                                        # қолдану
   ```
   `db/migrate.sh` әр файлды бір транзакцияда қолданады, advisory lock-пен, checksum сақтайды (қолданылған файл кейін өзгертілсе тоқтайды).
   **`--dev-shim` ешқашан қолданылмайды:** Supabase-те `auth` схемасы дайын; скрипт `--dev-shim` кезінде `NODE_ENV/QC_ENV=production`, `supabase.co` хосты немесе нақты `auth.refresh_tokens` болса бас тартады (код 3).
   Қолмен SQL Editor-да орындасаңыз да тек `db/migrations/*.sql` файлдарын, нөмір ретімен, `dev/auth_shim.sql`-сыз орындаңыз.
3. **Қосымша рөлі (ұсынылады).** `ADMIN_DATABASE_URL=... APP_DB_PASSWORD=<кездейсоқ> scripts/init-db-roles.sh` → `qc_app` (superuser емес, `authenticated/anon` мүшесі). Қосымшаның `DATABASE_URL`-ы осы рөлмен (pooler, transaction mode: пайдаланушы `qc_app.<ref>`). Миграция/backup үшін иесі рөлі бөлек (`MIGRATE_DATABASE_URL`).
4. **Auth баптау** (Authentication):
   - Providers → Email қосулы; **Confirm email = ON** (қосымша растау сілтемесі келмей кіргізбейді).
   - Password: ең аз ұзындық ≥ 8 (қосымша да 8 талап етеді), «leaked password protection» қосыңыз (Pro жоспар).
   - Site URL = `APP_URL`; Redirect URLs: `APP_URL/**`.
   - **JWT expiry**: әдепкі 3600 с. Қосымша refresh-токенді қолданбайды, сондықтан сессия JWT мерзімі біткенде аяқталады (қолданушы қайта кіреді). Оқу күні үшін 28800 (8 сағ) не одан артық қойыңыз, бірақ ұзақ мерзім ұрланған токеннің уақытын арттырады.
   - **JWT құпиясы:** қосымша HS256-ны тексереді → Project Settings → API → *JWT Secret* (legacy HS256). Асимметриялық (ES256/RS256) signing keys қосулы болса, қазіргі код токенді қабылдамайды (сыналмаған; `src/lib/auth/session.ts` JWKS қолдауын қосу керек).
   - Ашық тіркелу (signups) сөнбейді: қосымша GoTrue `/signup`-ты anon кілтімен өзі шақырады. Қосымша ағынынан тыс жасалған аккаунт `profiles` алады, бірақ ешбір ұйымға мүше емес → деректерге қолжетімділік жоқ (`/no-access`). Спам аккаунттарын Supabase rate limits және CAPTCHA (Auth → Bot protection) шектейді.
5. **SUPER ADMIN:** Auth-та өз аккаунтыңызды жасаңыз, сосын: `DATABASE_URL=<иесі> node scripts/create-super-admin.mjs email@x.kz`.
6. **RLS тексеру** (SQL Editor, нәтиже бос болуы тиіс):
   ```sql
   select relname from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind in ('r','p') and not c.relrowsecurity;
   select p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and has_function_privilege('anon', p.oid, 'execute')
     and p.proname not in ('org_branding','invitation_preview','classroom_preview');
   select c.relname from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r'
     and (has_table_privilege('anon', c.oid, 'select,insert,update,delete') or has_table_privilege('authenticated', c.oid, 'insert,delete,truncate'));
   ```
   Қосымша: `TEST_DATABASE_URL=<бөлек staging дерекқор> node --test db/tests/security.test.mjs db/tests/security2.test.mjs` (**өндіріс дерекқорында жүргізбеңіз**: тесттер кестелерді тазалайды).
   Supabase әдепкі privileges-і `anon/authenticated`-ке жаңа объектілерге құқық береді; `0010_hardening.sql` бұл әдепкіні жабады (`alter default privileges`), бірақ нақты Supabase-те сыналмаған - жоғарыдағы сұрауларды жүргізіп растаңыз.
7. **Env** (`.env.example`): `DATABASE_URL`, `AUTH_DRIVER=supabase`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_JWT_SECRET`, `APP_URL=https://...`, `COOKIE_SECURE=true`, `TRUSTED_PROXY_HOPS`. `service_role` кілті қосымшаға берілмейді.
8. **Іске қосу:** Docker (төменде) не `npm ci && npm run build && npm start` (Node 22) процесс менеджерімен (systemd) proxy артында.

### Supabase Auth драйверін тексеру (ӘЛІ СЫНАЛМАҒАН - міндетті қадамдар)

Драйвер (`src/lib/auth/drivers.ts`) тек моктелген `fetch`-пен сыналған (`tests/unit/security.test.mjs`). Нақты жобада staging-те мынаны орындаңыз:

1. Жаңа staging жоба + миграциялар + `AUTH_DRIVER=supabase` қосымшасы.
2. Тіркелу (сынып кодымен): растау хаты келеді ме; растамай кіру мүмкін емес пе; растаған соң кіру → `/student`.
3. Дұрыс емес құпиясөз → «E-mail немесе құпиясөз дұрыс емес» (және Supabase лимиті 429 берсе де қолданушыға ішкі мәтін көрінбейді).
4. `on_auth_user_created` триггері `profiles` жолын жасады ма (`select * from profiles`); триггерді иесі рөлі `auth.users`-қа қоя алды ма.
5. Шақыру арқылы мұғалім/әкімші тіркелуі, оқушы `join` коды.
6. Cookie `qc_session` мәні — Supabase `access_token`; DevTools-та `HttpOnly; Secure; SameSite=Lax`. JWT-да `aud=authenticated`, `sub=<uuid>` болуы тиіс (код `aud`-ты тексереді).
7. Токен мерзімі біткенде (JWT expiry) `/login`-ге бағыттау; шығып-кіру (logout) cookie-ді өшіреді.
8. Бір аккаунтты Supabase Dashboard-та өшіру/бұғаттау → жаңа кіру мүмкін емес; бұрын берілген токен мерзіміне дейін жарамды қалады (қараңыз SECURITY-AUDIT.md «жабық емес тәуекелдер»); ұйым мүшелігін `status='removed'` ету қолжетімділікті дереу жабады.
9. `SUPABASE_JWT_SECRET` қате болса барлық кіру жарамсыз болуы тиіс (қауіпсіз сәтсіздік).

Мұның бәрі расталмайынша «Supabase Auth жұмыс істейді» деп айтпаңыз.

## Нұсқа B: өз серверіңізде (Docker)

`Dockerfile` (көп сатылы, non-root, standalone, HEALTHCHECK) және `docker-compose.yml` бар. **Docker build/compose сыналмаған** (демон жоқ); орнына **бірдей қадамдар қолмен орындалды**: `NEXT_OUTPUT=standalone next build`, құрастырылған қалтаны таза каталогқа көшіру (`standalone` + `static`), `node server.js`, PDF/XLSX жүктеу, шрифт жоқ кездегі мінез, DB жоқ кезде `/api/health` 503, least-privilege рөлімен жұмыс (SECURITY-AUDIT.md §Deployment).

```bash
cp .env.example .env && chmod 600 .env       # мәндерді толтырыңыз (өндіріс: AUTH_DRIVER=supabase, COOKIE_SECURE=true, https APP_URL)
docker compose config                         # синтаксисті тексеру
docker compose build
docker compose --profile tools run --rm migrate db/migrate.sh --check
docker compose --profile tools run --rm migrate         # миграция
docker compose up -d app
docker compose ps                             # app: healthy
```

- Профиль `localdb` (`docker compose --profile localdb up -d`): жергілікті Postgres + **dev auth shim** (`AUTH_DRIVER=local` + `ALLOW_LOCAL_AUTH_IN_PRODUCTION=yes`). Бұл **пилот/стейджинг**, өндіріс емес: shim құпиясөзді pgcrypto-мен өзі сақтайды, e-mail растау, құпиясөзді қалпына келтіру жоқ. Миграция: `docker compose --profile tools run --rm migrate db/migrate.sh --dev-shim` (**тек осы профильде**).
- Өндіріс: DB+Auth сыртта (Supabase Cloud/self-hosted Supabase/GoTrue+Postgres). Қазақстанда сақтау талабы болса, self-hosted Supabase (Қазақстандағы VPS) қарастырыңыз.
- `db` контейнері тек `data` (internal) желісінде, порты жарияланбайды; `app` `127.0.0.1:3000`-де ғана тыңдайды.
- Контейнер қатаңдатуы: non-root (uid 10001), `cap_drop: ALL`, `no-new-privileges`, `pids_limit`, `mem_limit`, JSON log ротациясы. `read_only: true` + `tmpfs` (`/tmp`, `/app/.next/cache`) қосуды ұсынамыз, бірақ сыналмағандықтан әдепкіге қоспадық.
- Образ: базалық `node:22-alpine` digest-пен бекітіңіз (`--build-arg NODE_IMAGE=node:22-alpine@sha256:...`); `docker scout`/`trivy image` сканері CI-да.

## Домен + HTTPS (reverse proxy)

Қосымша HTTP тыңдайды; TLS-ті proxy тоқтатады. **Proxy міндетті түрде `X-Forwarded-For` пен `Host`/`X-Forwarded-Host` тақырыптарын қайта жазуы тиіс** (клиенттен келгенін өткізбей): rate limit IP-ді осыдан алады, Next.js server action Origin-ін осы Host-пен салыстырады. Қосымша порты интернетке тікелей ашылмауы тиіс.

**Caddy** (`/etc/caddy/Caddyfile`; автоматты HTTPS, Let's Encrypt) - сыналмаған үлгі:
```
qazaqcode.example.kz {
    encode zstd gzip
    request_body { max_size 2MB }
    reverse_proxy 127.0.0.1:3000 {
        header_up X-Forwarded-For {remote_host}      # қайта жазады (қосылмайды)
        header_up X-Forwarded-Host {host}
        health_uri /api/health
        health_interval 30s
    }
    log { output file /var/log/caddy/qazaqcode.log }
}
```
`TRUSTED_PROXY_HOPS=1`. Cloudflare алдында тұрса: Cloudflare → Caddy → app үшін `TRUSTED_PROXY_HOPS=2` және Caddy-де `trusted_proxies` Cloudflare диапазондарымен.

**nginx** - сыналмаған үлгі:
```
limit_req_zone $binary_remote_addr zone=qc_login:10m rate=30r/m;
server {
    listen 443 ssl http2; server_name qazaqcode.example.kz;
    ssl_certificate     /etc/letsencrypt/live/qazaqcode.example.kz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/qazaqcode.example.kz/privkey.pem;
    server_tokens off; client_max_body_size 2m;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-For $remote_addr;      # $proxy_add_x_forwarded_for ЕМЕС: клиенттің тақырыбын өткізбеу үшін
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }
    location = /login { limit_req zone=qc_login burst=10 nodelay; proxy_pass http://127.0.0.1:3000; proxy_set_header Host $host; proxy_set_header X-Forwarded-Host $host; proxy_set_header X-Forwarded-For $remote_addr; }
}
server { listen 80; server_name qazaqcode.example.kz; return 301 https://$host$request_uri; }
```
HSTS, CSP, X-Frame-Options т.б. тақырыптарды қосымшаның өзі қояды (`next.config.mjs`, `src/middleware.ts`), proxy-де қайталамаңыз. Тексеру: `curl -sI https://домен/login`, SSL Labs, securityheaders.com.

## Rate limit және көп дана (Redis/WAF)

Қосымшаның шектеуіші **процесс жадында** (`src/lib/rate-limit.ts`): бір дана үшін жеткілікті. N дана болса лимит ≈ N есе жұмсарады, және қайта іске қосқанда нөлденеді.
- Бірнеше дана не жоғары жүктеме: ортақ есептегіш (Redis, `INCR`+`EXPIRE`) қосыңыз - `consume()` интерфейсін ауыстыру жеткілікті (`rate-limit-core.ts`).
- Периметрде: Caddy `rate_limit` плагині / nginx `limit_req` / Cloudflare WAF rate rules - `/login`, server action POST-тары, `/api/reports/*` үшін.
- Лимиттер (қазір): кіру 10/10 мин (IP+e-mail), 30/10 мин (тек e-mail), 40/10 мин (тек IP); тіркелу 8/15 мин (IP); сынып коды/шақыру 15 және 10 /15 мин (қолданушы); есеп 20/мин (қолданушы).
- Бір e-mail-ге бұғат қолданушыны уақытша құлыптауы мүмкін (DoS); қабылданған ымыра (SECURITY-AUDIT.md).

## Лог және мониторинг

- Қосымша `console.error` арқылы күтпеген қателерді stdout-қа жазады (құпиясыз; клиентке жалпы мәтін ғана барады). `docker compose logs -f app`; ротация compose-та (10 МБ × 5). Орталық лог (Loki/ELK) не хостинг агрегаторы.
- Uptime: `GET /api/health` → `200 {"status":"ok","db":"ok"}` / `503 {"status":"degraded","db":"down"}` (3 с DB ping; құпиясыз). UptimeRobot/Healthchecks.io + алерт.
- Docker `HEALTHCHECK` осыны пайдаланады (`docker ps` → healthy).
- Қате мониторингі (Sentry) интеграцияланбаған; қосқыңыз келсе DSN-ді env арқылы, PII (оқушы аты, e-mail) жібермейтін `beforeSend` сүзгісімен.
- Қауіпсіздік алерттері: `audit_logs` (Мектеп/платформа әкімшісі `/admin/audit`) - `export.*`, `classroom.join_code_regenerated`, `invitation.*`, `licenses.*`, `organization_members.*`. Журнал append-only (UPDATE/DELETE тыйым), бірақ иесі рөлі триггерді өшіре алады: иесі рөлін жеке сақтаңыз.
- Postgres: `pg_stat_activity` қосылыс саны (pool max 10/дана), баяу сұраулар (`log_min_duration_statement`), диск, репликация/PITR.

## Резервтік көшірме және қалпына келтіру

- Supabase: күнделікті backup + PITR (жоспарға байланысты) қосыңыз; логикалық көшірме қосымша.
- Өз Postgres: `scripts/backup.sh` (pg_dump -Fc → AES-256-CBC PBKDF2, шифрсыз аралық файлсыз, sha256, ротация) cron/systemd timer-мен күн сайын:
  ```bash
  DATABASE_URL=<иесі> BACKUP_PASSPHRASE_FILE=/etc/qazaqcode/backup.pass BACKUP_SCHEMAS="public auth" BACKUP_KEEP_DAYS=14 scripts/backup.sh /srv/backups
  ```
  Көшірмені басқа физикалық орынға (Қазақстан аумағы, шектелген қолжетімділік) көшіріңіз; құпиясөзді көшірмеден бөлек сақтаңыз.
- **Қалпына келтіру тексерісі (айына бір рет, міндетті):**
  ```bash
  createdb qc_restore_check && psql qc_restore_check -c 'create extension if not exists pgcrypto'
  DATABASE_URL=postgres:///qc_restore_check BACKUP_PASSPHRASE_FILE=... scripts/restore.sh /srv/backups/qazaqcode-<ts>.dump.enc --yes
  DATABASE_URL=postgres:///qc_restore_check bash db/migrate.sh --check      # «күтіп тұрған миграция жоқ»
  ```
  Жергілікті сыналды: `qc_f` (34 пайдаланушы, 527 аудит жазбасы, 42 жұмыс) → шифрлау → бос дерекқорға қалпына келтіру → барлық кесте қатарлары сәйкес; қате құпиясөз/бұзылған файл қалпына келтіруді тоқтатады.
- Supabase Cloud-та `auth` схемасын Supabase backup-ы сақтайды; `public`-ты ғана қалпына келтірсеңіз, `profiles.id → auth.users` FK үшін пайдаланушылар бар болуы тиіс.
- Көшірме дербес деректі қамтиды: шифрлау құпиясын жоғалтпаңыз, көшірмелерді сақтау мерзімін саясатпен бекітіңіз (SECURITY-AUDIT.md чеклист).

## Жаңарту және кері қайтару

1. Алдымен staging-те: `git pull`, `docker compose build`, `migrate --check`, e2e (`npx playwright test`), `node --test db/tests/*.test.mjs` (**тек тест DB-да**).
2. Өндірісте: backup (`scripts/backup.sh`) → `migrate --check` → `migrate` → `docker compose up -d app` (жаңа образ; healthcheck healthy болғанша күтіңіз) → smoke: `/api/health`, кіру, оқушы беті.
3. Миграциялар **алға ғана** (қолданылған файлды өзгертуге болмайды: checksum тоқтатады). Қауіпсіз тәртіп: жаңа баған/функцияны алдымен қосыңыз (backward-compatible), кодты шығарыңыз, ескіні кейін алыңыз.
4. **Кері қайту:** қосымша - алдыңғы образ тегіне қайту (`image: qazaqcode/app:<тег>`; әр шығарылымды тегтеңіз), егер жаңа миграция ескі кодты бұзбаса. Миграция бұзса - backup-тан қалпына келтіру (деректер жоғалады: backup-тан кейінгі өзгерістер) не түзетуші миграция жазу. Сондықтан миграцияны үлкен деректі өзгертумен араластырмаңыз.
5. Құпияны ауыстыру (JWT құпиясы): жаңасын қойып қайта іске қосу барлық сессияны жарамсыз етеді (бәрі қайта кіреді) - ұрлану күдігінде қолдану.

## Дербес деректер (Қазақстан)

Платформа оқушылардың аты-жөнін, e-mail-ын және оқу нәтижесін сақтайды. **Нақты оқушылар деректерін жинамас бұрын** заңгермен растаңыз (SECURITY-AUDIT.md «ҚР дербес деректер чеклисті»): деректерді ҚР аумағында сақтау/өңдеу, кәмелетке толмағандар келісімі, өшіру/экспорт, сақтау мерзімі, оқиғаны хабарлау. Бұл заңды кеңес емес.

## Өндіріске шығар алдындағы чеклист

Инфрақұрылым
- [ ] HTTPS жұмыс істейді, HTTP → HTTPS; сертификат автожаңару; `curl -sI` тақырыптары: `Content-Security-Policy` (nonce), `Strict-Transport-Security`, `X-Frame-Options: DENY`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.
- [ ] App порты тек proxy-ге ашық; Postgres порты интернетке жабық; firewall (22/80/443 ғана).
- [ ] Proxy `X-Forwarded-For`/`Host` қайта жазады; `TRUSTED_PROXY_HOPS` дұрыс (проверка: жалған `X-Forwarded-For` rate limit айналып өтпейді).
- [ ] `/api/health` 200; монитор + алерт орнатылған; Docker `healthy`.

Құпиялар және орта
- [ ] `NODE_ENV=production`, `AUTH_DRIVER=supabase`, `COOKIE_SECURE=true`, `APP_URL=https://...`; `ALLOW_LOCAL_AUTH_IN_PRODUCTION`, `RATE_LIMIT_DISABLED` ЖОҚ.
- [ ] JWT құпиясы кездейсоқ ≥ 32 символ (сервер әлсізін қабылдамайды); `service_role` кілті қосымшада жоқ; құпиялар git-те жоқ (`git log -p | grep` не gitleaks); `.env` құқығы 600.
- [ ] Қосымша DB рөлі superuser/BYPASSRLS емес (`select rolsuper, rolbypassrls from pg_roles where rolname = current_user`).

Дерекқор
- [ ] Барлық миграция қолданылды (`migrate --check` таза), `--dev-shim` қолданылмады; демо ұйым (`is_demo`) жоқ/белгіленген.
- [ ] RLS/грант сұраулары (жоғарыдағы §6) бос нәтиже береді; `0010_hardening.sql` қолданылған.
- [ ] Backup автоматты, шифрланған, басқа орында; қалпына келтіру тексерілді (күні: ____).

Auth (Supabase)
- [ ] «Supabase Auth драйверін тексеру» 1-9 қадамдары staging-те орындалды; Confirm email = ON; JWT expiry таңдалған; CAPTCHA/rate limits.
- [ ] SUPER ADMIN бір-екі адам, күшті құпиясөз + MFA (Supabase аккаунты).

Қосымша
- [ ] `npx playwright test e2e/security.spec.ts` және `db/tests/security2.test.mjs` staging-те жасыл.
- [ ] Лицензия, аудит журналы (`/admin/audit`) тексерілді.
- [ ] Дербес деректер: заңгер растауы, ата-ана келісімі тәртібі, сақтау/өшіру саясаты, оқиғаны хабарлау жоспары.
- [ ] Тәуелсіз пентест жоспарланған (SECURITY-AUDIT.md «Тексерілмеген аймақтар»).
- [ ] Кері қайту жоспары жазылған: алдыңғы образ тегі, backup, жауапты адам.
