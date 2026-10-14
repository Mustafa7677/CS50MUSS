# QazaqCode Platform

Мектептерге, колледждерге және IT академияларына арналған көп ұйымды (multi-tenant) бағдарламалауды оқыту платформасы:
мектеп -> мұғалім -> сынып -> оқушы -> тапсырма -> жұмыс -> баға -> аналитика. Интерфейс қазақ тілінде.

> Сату форматындағы пакет: [docs/COMMERCIAL.md](docs/COMMERCIAL.md). Мектептерге арналған ұсыныс беті: `/schools`; басты бет (`/`) - оқушы мен мұғалімге арналған оқу платформасы.
>
> **Бөлек коммерциялық өнім.** «CS50 қазақша» ашық жобасынан (CC BY-NC-SA 4.0) контент қамтылмайды. Қараңыз [NOTICE.md](NOTICE.md), [LICENSE](LICENSE).
> Коммерциялық кодты сатуға дейін жеке (private) репозиторийге көшіру ұсынылады (`git subtree split -P qazaqcode`).

## Күй (1-2 кезең: негізгі платформа + LMS)

| Мүмкіндік | Күйі |
|---|---|
| Ұйымдар, рөлдер (SUPER ADMIN / SCHOOL ADMIN / TEACHER / STUDENT), серверде құқық тексеру, RLS | ✅ дайын, тесттелген |
| Ұйымдар арасындағы деректер оқшаулауы | ✅ 29 дерекқор тесті (қауіпсіздік, курстар, аналитика) |
| Лицензия (STARTER/PRO/ENTERPRISE, лимит, мерзім, тоқтату), мерзімі өткендегі режим | ✅ |
| Шақыру (мұғалім/әкімші), сыныпқа қосылу коды, лимиттер | ✅ |
| Сынып басқару, тапсырма тағайындау, мерзім, әрекет лимиті | ✅ (мұғалім аймағы) |
| Тест (quiz): сервер автоматты бағалайды, жауап кілті жасырын | ✅ |
| Код тапсырмалары: оқушы жазады/автосақтайды/жібереді, мұғалім қолмен бағалайды | ✅ |
| Нақты аналитика (мектеп, сынып, оқушы), CSV экспорт | ✅ |
| White-label (логотип, түс, мәтін, `?org=slug`) | ✅ негізгі |
| Аудит журналы | ✅ |
| Демо режим (белгіленген сынақ деректері) | ✅ |
| Курс конструкторы: модуль/сабақ, мәтін/код/сурет/видео/ескерту блоктары, drag-and-drop + ↑↓ батырмалар, жоба/жариялау/архив/көшірме, сыныпқа бекіту, тапсырма/тест байланыстыру, алдын ала қарау, прогресс | ✅ (2-кезең) |
| Оқушы кеңістігі: курстар мен сабақ прогресі, жобалар, хабарландырулар (қоңырау), оқушы карточкасы, қиын сұрақтар, белсенділік графигі | ✅ (2-кезең) |
| Excel (.xlsx) және PDF есептер (мектеп/сынып, күн аралығы, қазақша шрифт), формула инъекциясынан қорғау | ✅ (2-кезең) |
| Серверде код автоматты іске қосу (sandbox) | ⏳ 3-кезең, өшірулі: [docs/SANDBOX.md](docs/SANDBOX.md) |
| AI мұғалім, custom domain, төлем | ⏳ 4-кезең / жоспар |
| Supabase Auth драйвері нақты Supabase-те | ⚠️ жазылған, сыналмаған |

Толық тізім мен тәуекелдер: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/SECURITY.md](docs/SECURITY.md), [docs/DEPLOY.md](docs/DEPLOY.md).

## Жылдам бастау (жергілікті)

```bash
cd qazaqcode
npm ci
export DATABASE_URL=$(db/create-db.sh qc_dev)          # PostgreSQL 15+ жергілікті (миграциялар + dev auth shim)
node scripts/seed-demo.mjs                              # демо дерек (құпиясөз DemoPass123)
cp .env.example .env.local                              # DATABASE_URL, AUTH_JWT_SECRET толтырыңыз
npm run dev                                             # http://localhost:3000
```

Демо аккаунттар: `root@demo.qazaqcode.kz` (SUPER ADMIN), `admin@demo...`, `teacher1@demo...`, `student1@demo...` (құпиясөз `DemoPass123`).
Өз SUPER ADMIN-іңіз: `node scripts/create-super-admin.mjs email@x.kz "Аты Жөні" "құпиясөз"`.

## Тесттер

```bash
npm run check:licence     # CS50 контенті қалта ішінде жоқ екенін тексереді
npm run db:test           # RLS, рөлдер, лицензия, оқшаулау (нақты PostgreSQL)
npm run typecheck
npm run build && npm run e2e   # Playwright E2E (45 тест: сценарий, рөл аймақтары, курстар, есептер)
```

## Құрылым

```
db/migrations/   0001 кестелер · 0002 RPC · 0003 RLS · 0004 аналитика · 0005 демо белгісі
db/tests/        қауіпсіздік тесттері (node:test + pg)
src/lib/         env, db (withUser), auth, context, errors, brand, format
src/components/  Shell, ui, ActionForm, ConfirmButton, Toaster ...
src/app/         admin/ school/ teacher/ student/ + login, join, invite
scripts/         seed-demo, create-super-admin, check-licence
e2e/             Playwright
docs/            ARCHITECTURE, DEPLOY, SECURITY, SANDBOX, DEV-GUIDE
```

- **Көмекші** (`/student/ai`): жасанды интеллект емес, ережелі кеңесші (алдын ала жазылған кеңестер базасы); сыртқы API жоқ, әңгіме сақталмайды, дайын шешім бермейді. Қараңыз: `docs/AI-TUTOR.md`.
