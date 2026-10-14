# QazaqCode: қауіпсіздік моделі және күйі

Толық аудит нәтижесі, табылған мәселелер және тексерілмеген аймақтар: [SECURITY-AUDIT.md](SECURITY-AUDIT.md). Орналастыру: [DEPLOY.md](DEPLOY.md).

## Қабаттар

1. **Дерекқор - шешуші қабат.** RLS барлық `public` кестесінде; клиент рөлдері (`authenticated`) тек `SELECT` алады (+`profiles.full_name/locale`); барлық жазу `SECURITY DEFINER` RPC арқылы, `search_path` бекітілген; `PUBLIC`/`anon`-ға функция құқығы жоқ (тек 3 алдын ала қарау). Әдепкі құқықтар жабық (0010).
2. **Қосымша:** беттер `requireStaff/Student/SchoolAdmin` арқылы рөлді тексереді, бірақ бұл ыңғайлылық; құқықты дерекқор шешеді. Әр сұраныс `set local role authenticated` + JWT claims. Қосылу рөлі superuser/BYPASSRLS емес.
3. **Периметр:** nonce-CSP (`src/middleware.ts`), қауіпсіздік тақырыптары (`next.config.mjs`), rate limit, reverse proxy (TLS, `X-Forwarded-For` қайта жазу).

## Қазір орындалған (сыналған)

| Талап | Қалай | Тест |
|---|---|---|
| Серверде құқық тексеру | барлық жазу SECURITY DEFINER функцияларында; клиент рөлі кестеге жаза алмайды | `db/tests/security.test.mjs`, `security2.test.mjs` |
| Row Level Security | барлық кестеде (автоматты каталог тесті, `schema_migrations` қоса) | `security2` |
| Ұйымдар оқшаулауы (A -> B) | RLS + функция тексерістері; URL/API/action деңгейінде IDOR тесттері | `security.test.mjs`, `e2e/security.spec.ts` (a, b) |
| SUPER ADMIN жеке деректі көрмейді | RLS-те платформа әкімшісіне оқушы деректері жоқ; тек `platform_usage()` | тест, e2e (A.root) |
| Жасырын жауап/тест жағдайлары | бөлек кесте + RLS; оқушы HTML/RSC-інде жоқ | `security.test.mjs`, e2e (i) |
| Шақыру токені | 24 байт, SHA-256 хэші, мерзім, бір реттік, e-mail байлау | тест |
| Сынып коды | 8 таңба, 32⁸ ≈ 2⁴⁰, ығысусыз; әрекет лимитті | e2e (e) |
| Auth cookie | `HttpOnly`, `SameSite=Lax`, `Secure` (өндірісте міндетті), JWT: HS256 ғана, `sub` UUID, `exp` міндетті, Supabase-те `aud` | e2e (d), unit |
| CSRF | Next server action Origin тексеруі + `SameSite=Lax` | e2e (d) |
| Rate limiting | кіру (IP+e-mail, e-mail, IP), тіркелу, сыныпқа қосылу, шақыру, есептер; IP оңнан (`TRUSTED_PROXY_HOPS`); қолданушы кілті IP-сіз | e2e (e), unit |
| XSS | React экрандауы; `dangerouslySetInnerHTML` тек HEX-сүзілген бренд стилі мен theme-init; CSP-nonce; сурет/видео URL тек `https` (zod + DB) | e2e (c) нақты браузерде |
| CSV/Excel инъекциясы | `=`,`+`,`-`,`@`,tab,CR алдына `'` | e2e (c) |
| SQL инъекция | барлық SQL параметрленген; ILIKE `%_\` экрандалған | grep + e2e (c) |
| Тақырыптар | CSP, HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy, COOP, CORP | e2e (g) |
| Қателер | клиентке тек қазақша жалпы мәтін; `?err=` тек белгілі хабарлама | e2e (g, c) |
| Құпиялар | `.env*` ғитке жарияланбайды; өндірісте әлсіз JWT құпиясы/Secure емес cookie/HTTP URL/`local` драйвер → сервер іске қосылмайды; бумада құпия жоқ | unit, e2e (g, h) |
| Аудит | лицензия/мүшелік/баға/ұйым/тапсырма/сынып/код жаңарту/шығару/шақыру/экспорт; журнал өзгермейді (UPDATE/DELETE тыйым) | `security2`, e2e |
| Health | `/api/health` (DB ping, құпиясыз) + Docker HEALTHCHECK | e2e (g) |

## Әлі орындалмаған / тәуекелдер

- **Supabase Auth драйвері нақты жобаға қарсы сыналмаған** (тек моктелген `fetch`); refresh-токен жоқ; тек HS256 (DEPLOY.md тексеру қадамдары).
- Stateless JWT: logout токенді серверде жарамсыз етпейді (мүшелікті `removed` ету қолжетімділікті дереу жабады).
- Rate limiting жадта: көп дана/қайта іске қосуда жұмсарады (Redis/WAF - DEPLOY.md). Анонимді `/join`, `/invite` алдын ала қарауында жеке лимит жоқ.
- Файл жүктеу жоқ (мәтін/код ғана). Жүктеу қосылса: тип/өлшем/вирус тексеруі, жеке bucket, қайта аудит.
- Курс сурет/видео - сыртқы `https` хосттары (оқушы IP-ы үшінші тарапқа көрінеді).
- Sandbox (`docs/SANDBOX.md`) пен AI көмекші аудитке кірмеген.
- Docker образы мен compose сыналмаған (демон жоқ); қолмен баламасы дәлелденген.
- **Тәуелсіз пентест өткізілмеген.** Дербес деректер заңы бойынша заңгер растауы қажет (SECURITY-AUDIT.md §6).
