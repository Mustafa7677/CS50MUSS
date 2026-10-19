# E-mail инфрақұрылымы (шақырулар, еске салғыштар, лид жауаптары)

## Принцип

**Дерекқордан және RPC-ден сыртқы желіге ешқашан шықпаймыз.** Қосымша/RPC `public.email_outbox` кестесіне жол қосады, бөлек worker
(`scripts/send-emails.mjs`) оларды SMTP арқылы жібереді. Сондықтан SMTP істен шықса да шақыру, сұрау қабылдау, лицензия ағыны бұзылмайды.

```
server action / RPC / триггер ──enqueue_email──▶ email_outbox ◀──claim_emails── send-emails.mjs ──SMTP──▶ провайдер
                                                      ▲                              │
                                                      └──────mark_email_result───────┘ (sent / backoff / failed)
```

## Дерекқор (миграция `0015_email_outbox.sql`)

| Нысан | Мақсаты |
|---|---|
| `email_outbox` | `id, created_at, to_email, template, locale, payload jsonb, status (queued/sending/sent/failed/suppressed), attempts, last_error, sent_at` + `next_attempt_at, expires_at, dedupe_key, unsub_token` |
| `email_suppressions(email_hash, reason)` | бас тартқан (`unsubscribed`), қайтарған (`bounce`), шағымданған (`complaint`) мекенжайлар; тек sha256 хэш |
| `email_unsub_tokens` | unsubscribe токенінің хэші -> алушы хэші (хат жіберілген соң да сілтеме жұмыс істесін) |
| `enqueue_email(to, template, locale, payload, dedupe_key, ttl_hours)` | ІШКІ: клиентке берілмейді; басқа definer функциялар/иесі рөлі шақырады. `null` = rate limit. Бас тартқан алушыға `suppressed` жол жазады |
| `claim_emails(n)` | worker: `FOR UPDATE SKIP LOCKED`, `sending`-ке ауыстырады, 10 минуттан артық қатып қалғанды қайта алады, мерзімі өткенді `failed(expired)` етеді |
| `mark_email_result(id, ok, error, permanent, suppress)` | нәтиже: `sent` (payload тазаланады) / backoff 30-60-120-240 с / 5 әрекеттен кейін `failed` |
| `purge_old_emails(days)` | аяқталғандарды `days` күннен (әдепкі 30), кезекте қалғанды 14 күннен кейін өшіреді (`scripts/emails-purge.mjs`, cron) |
| `email_unsubscribe(token)` | жария бет `/unsubscribe/[token]` пен `POST /api/email/unsubscribe/[token]` (RFC 8058 one-click) |
| `queue_invitation_email(token, email)` | мектеп әкімшісі (не SUPER ADMIN): шақыру сілтемесін e-mail-ге жіберу |
| `email_stats()` | SUPER ADMIN: тек күй бойынша санақ (жеке письмо жоқ) |
| триггер `leads_ack_email` | `submit_lead` жаңа жол қосқанда `lead_ack` кезекке қойылады (`submit_lead` өзгертілмеген) |

### Құпиялылық шешімдері
- `email_outbox`, `email_suppressions`, `email_unsub_tokens`: RLS қосулы, **саясат жоқ**, anon/authenticated-ке құқық жоқ. Жеке письмоны клиентпен ешкім (SUPER ADMIN да) оқи алмайды.
- Шақыру токені `payload`-та тек шақыру хаты жіберілгенше (`expires_at` ≤ шақыру мерзімі, ≤72 сағат) тұрады; `sent`/`failed`/`expired`/`suppressed` болғанда `payload = '{}'`, `unsub_token = null`. Дерекқорда шақырудың өзінде әлі тек хэш.
- `lead_ack` payload-ында тек ұйым атауы: байланыс адамының аты, телефон, хабар КІРМЕЙДІ. Дубликат сұрау 24 сағатта жол қоспайды, сондықтан хат та жоқ, ал жауап клиентке бірдей: e-mail бар-жоғы ашылмайды.
- `last_error` құпиясыз, ≤200 символ (`safeError`: SMTP_PASS, URL ішіндегі логин, `password=` жасырылады).
- Rate limit: бір алушыға тәулігіне ≤5, жалпы сағатына ≤1000 (DB деңгейінде); server action-дарда қосымша `rateLimit`.
- Аудит: `invitation.email` (e-mail-сіз), `email.purge` (тек саны).
- Орта «ең аз құқық» рөлі `qc_mailer` (міндетті емес; болмаса worker иесі рөлімен `DATABASE_URL` арқылы жұмыс істейді):
  ```sql
  create role qc_mailer login password '<кездейсоқ>' nosuperuser nobypassrls;
  grant usage on schema public to qc_mailer;
  grant execute on function public.claim_emails(int), public.mark_email_result(uuid, boolean, text, boolean, text), public.purge_old_emails(int) to qc_mailer;
  ```
  Бұл рөл кестені оқи алмайды (`db/tests/email.test.mjs` дәлелдейді). `MAILER_DATABASE_URL` ретінде compose-қа беріңіз.

## Драйверлер (`src/lib/email/`)

| Файл | Мазмұны |
|---|---|
| `transport.ts` | `EMAIL_DRIVER=console\|smtp\|off`; `readEmailConfig` (валидация), `createTransport`, `safeError`, `classifyError` |
| `templates.ts` | `render(template, payload, {appUrl, unsubscribeUrl})` -> `{subject, text, html}` (қазақша) |

Орта айнымалылары:

| Айнымалы | Мәні |
|---|---|
| `EMAIL_DRIVER` | `console` (әзірлеу әдепкісі: хат консольге), `smtp`, `off` (өндіріс әдепкісі: жібермейді). Өндірісте `console` тыйым (шақыру сілтемесі логқа түседі) |
| `SMTP_HOST`, `SMTP_PORT` (587), `SMTP_SECURE` (465 болса `true`), `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` (`QazaqCode <noreply@домен>`) | өндірісте `smtp` үшін HOST/PORT/FROM/USER/PASS міндетті, worker бастапқыда тексереді |
| `APP_URL` | хаттағы сілтемелер осыдан (https) |
| `EMAIL_POLL_SECONDS` (15), `EMAIL_BATCH` (10), `EMAIL_SEND_DELAY_MS` (0) | worker ырғағы |

Қосымша контейнері тек `EMAIL_DRIVER` алады (UI «E-mail-ге жіберу» батырмасы қосулы ма). SMTP құпиясы тек `mailer` контейнерінде.

### Шаблондар және payload интерфейсі

Басқа модульдер `enqueue_email(to, template, 'kk', payload)` шақырады (definer функцияда не `scripts/*.mjs` иесі рөлімен). Payload құпиясыз!

| template | payload |
|---|---|
| `teacher_invite` | `{org_name, token, expires_at}` (токен бір реттік, жіберілген соң өшеді) |
| `student_join_info` | `{org_name, class_name, join_code}` |
| `licence_expiry` | `{org_name, days (30/14/7/1), valid_until 'YYYY-MM-DD'}`, `dedupe_key` ұсыныс: `licence:<org>:<valid_until>:<days>` |
| `lead_ack` | `{org_name}` |
| `order_status` | `{order_ref, status (created/pending_payment/paid/activated/cancelled/failed), note?, link_path?}` |
| `pilot_report_ready` | `{org_name?, report_title?, link_path?}` |
| `generic` | `{subject, body, link_path?, link_label?}` |

`link_path` тек `/...` қолданба ішіндегі жол болуы тиіс (ашық бағыттау өткізілмейді). Барлық пайдаланушы мәтіні HTML-де escape, тақырыпта жол үзілімі жойылады, сыртқы сурет/трекинг жоқ.
Жаңа шаблон қосу: `templates.ts` (`PayloadMap`, `render`) + миграцияда `template` check пен `enqueue_email` тізімі. `locale` қазір тек `kk` мәтіндері бар (`ru`/`en` кейін, қазақшаға түседі).

## Worker

```bash
DATABASE_URL=... APP_URL=https://... EMAIL_DRIVER=smtp SMTP_HOST=... SMTP_PORT=587 SMTP_USER=... SMTP_PASS=... SMTP_FROM='QazaqCode <noreply@домен>' \
  node scripts/send-emails.mjs            # цикл (SIGTERM-де таза тоқтайды)
node scripts/send-emails.mjs --once       # бір реттік (cron/тест), --batch 10, --interval 15
docker compose --profile mail up -d mailer    # compose (СЫНАЛМАҒАН: Docker демоны жоқ ортада жазылған)
```
Node 22.18+ керек (`.ts` файлдары тікелей жүктеледі). Қате болса backoff 30/60/120/240 с, 5 әрекеттен кейін `failed`; RCPT 550/551/553 бірден `failed` + `bounce` бас тартқандар тізіміне. Логта алушы мекенжайы жоқ (тек id және шаблон), `console` драйвері ғана хатты көрсетеді.

Cron: `0 3 * * * DATABASE_URL=... node scripts/emails-purge.mjs` (+ `scripts/leads-purge.mjs`).

## Нақты провайдерді қосу

Барлығы стандартты SMTP: `EMAIL_DRIVER=smtp`, төмендегі мәндер.

| Провайдер | SMTP_HOST / PORT | SMTP_USER / PASS |
|---|---|---|
| Postmark | `smtp.postmarkapp.com` / 587 | Server API Token (екеуіне де) |
| Amazon SES | `email-smtp.<аймақ>.amazonaws.com` / 587 | SES SMTP credentials (IAM-ден, API кілті емес) |
| Mailgun | `smtp.mailgun.org` / 587 (EU: `smtp.eu.mailgun.org`) | `postmaster@<домен>` / SMTP құпиясөзі |
| Өз SMTP / корпоративтік | хост / 587 (STARTTLS) не 465 (`SMTP_SECURE=true`) | аккаунт |

Қадамдар: 1) провайдерде жіберуші доменді растау; 2) SPF/DKIM/DMARC (төменде); 3) `.env`/secret-ке `SMTP_*`; 4) `docker compose --profile mail up -d mailer`; 5) мектеп әкімшісімен сынақ шақыру жіберу (`/school/teachers` > «E-mail-ге жіберу»), `docker compose logs mailer`; 6) провайдердің bounce/complaint webhook-тарын (ұсыныс) `email_suppressions`-ке жазу: қазір автоматты тек SMTP-RCPT тұрақты қатесі мен unsubscribe; webhook қосылмаған.

### SPF / DKIM / DMARC чеклисті
- [ ] SPF: `v=spf1 include:<провайдер SPF> -all` (бір ғана SPF жазбасы, ≤10 DNS іздеу).
- [ ] DKIM: провайдер берген 1-2 CNAME/TXT жазбасы қойылды, провайдер панелінде «Verified».
- [ ] DMARC: `_dmarc.<домен>` TXT `v=DMARC1; p=none; rua=mailto:dmarc@<домен>` деп бастап, 2-4 аптадан соң `quarantine`, кейін `reject`.
- [ ] `From` домені DKIM-мен тураланған (alignment), `SMTP_FROM` нақты жауап қабылдайтын не `noreply@` мекенжай.
- [ ] Кері PTR/rDNS (өз SMTP болса), TLS (587 STARTTLS не 465).
- [ ] Бөлек поддомен транзакциялық хаттарға (`mail.<домен>`): репутация негізгі доменге әсер етпейді.
- [ ] mail-tester/Google Postmaster арқылы тексеру; бірінші аптада көлемді баяу арттыру.

## Заң және құқық ескертулері (заңгерден растаңыз)

- **Рұқсат (келісім).** Транзакциялық хаттар (шақыру, тапсырыс күйі, лицензия мерзімі) қызметті көрсету үшін қажет. Пилот сұрауының автожауабы формада келісім (`consent`) белгілеген адамға ғана жіберіледі. Маркетингтік тарату үшін бөлек айқын келісім қажет: қазір ондай тарату ЖОҚ.
- **Бас тарту.** Әр хатта `/unsubscribe/<токен>` сілтемесі мен `List-Unsubscribe` (+ one-click) бар; бас тартқанға ешқандай хат жіберілмейді (кезектегілер де тоқтайды). Мекенжай тек хэшпен сақталады.
- **ҚР «Дербес деректер және оларды қорғау туралы» заңы.** E-mail - дербес дерек. Сақтау мерзімі қысқа: outbox аяқталған жолдары 30 күн, кезектегі 14 күн (`purge_old_emails`), сұраулар 365 күн (`purge_old_leads`). Деректі шет елдегі провайдер (Postmark/SES/Mailgun) арқылы жіберу трансшекаралық беру болуы мүмкін: провайдер таңдағанда сервер орны, өңдеу шарты (DPA), субъект келісімі мен ҚР заңындағы талаптарды (деректі ҚР аумағында сақтау/уәкілетті органға хабарлау міндеттері) заңгермен растаңыз. Сенімсіз болса - ҚР-дағы SMTP-провайдер не өз SMTP.
- Хатта құпиясөз ешқашан жіберілмейді. Шақыру сілтемесі - бір реттік және мерзімді; шақырылған адам сілтемені басқа адамға бермеуі тиіс (мұны мәтінде ескертеміз: «бір рет қолданылады»).
- Хаттың төменгі жағы: «QazaqCode: мектептерге арналған оқыту платформасы». Жіберуші заңды тұлғаның деректерін (атауы, мекенжайы) заңгердің талабы бойынша төменгі жолға қосыңыз (қазір жоқ: ескерту).

## Тестілеу

| Қабат | Файл | Нені тексереді |
|---|---|---|
| DB | `db/tests/email.test.mjs` (20) | RLS (ешкім оқымайды), функциялар клиентке жабық, rate limit, claim тек бір worker-ге (параллель + SKIP LOCKED), backoff/5 әрекет, bounce, suppression, unsubscribe, шақыру хаты құқықтары мен токен тазалау, lead_ack триггері, purge, `qc_mailer` |
| Интеграция | `db/tests/email-smtp.test.mjs` (9) | `send-emails.mjs --once` + `smtp-server`: толық ағын, MIME (multipart/alternative, UTF-8, RFC 2047 тақырып), List-Unsubscribe, 2 worker параллель, RCPT 550, SMTP auth, құпия логқа шықпайды, `off`/`console`, SIGTERM |
| Unit | `tests/unit/email.test.mjs` (13) | шаблондар XSS-қауіпсіз, қазақ әріптері, сілтеме қауіпсіздігі, header injection, env валидациясы, console транспорты |
| E2E | `e2e/email.spec.ts` (6) | әкімші шақыруды e-mail-ге жібереді -> outbox, дұрыс емес e-mail, құқықтар, lead_ack + дубликат, unsubscribe (GET әсерсіз, растау, one-click), `EMAIL_DRIVER=off` |

Іске қосу: `TEST_DATABASE_URL=... node --test --test-concurrency=1 db/tests/email*.test.mjs`; `npm run test:unit`; e2e үшін `E2E_EMAIL_OFF_URL` (EMAIL_DRIVER=off екінші сервер) ерікті.

## Сыналмағаны (шынайы)
- **Нақты провайдермен жіберу** (Postmark/SES/Mailgun, STARTTLS/TLS сертификаты, DKIM/SPF тұрақтылығы, жеткізілім/спам) - СЫНАЛМАҒАН. Тек жергілікті `smtp-server` (TLS-сіз, 127.0.0.1) және console драйвері тексерілген.
- `docker compose --profile mail` және Dockerfile `mailer` сатысы - Docker демоны жоқ ортада жазылған, іске қосылмаған.
- Провайдер webhook-тары (bounce/complaint) қосылмаған; тек SMTP-RCPT тұрақты қатесі мен unsubscribe suppression-ға түседі.
- Поштаның көрінісі нақты клиенттерде (Gmail, Outlook, Mail.ru, Яндекс) қолмен қаралмаған; тек мәтін/MIME құрылымы автоматты тексерілген. Қараңғы режим хатта жоқ (инлайн ашық түстер).
- `ru`/`en` локаль мәтіндері жоқ: `locale` өрісі бар, бірақ шаблондар қазақша.
