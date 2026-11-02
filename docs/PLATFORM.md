# AO17 жабық платформа: орнату және басқару

© 2026 Sagid Mustafa. All Rights Reserved.

## Қалай жұмыс істейді

```
Оқушы браузері ──(JWT)──► ao-content функциясы ──► ao_can_view(path)  [Postgres, RLS]
        ▲                         │                      │
        │                         ▼                      ▼
   GitHub Pages:            жабық Storage          класс, мүшелік, рұқсат
   жария беттер +           «ao-content»           (ao_classes, ao_members, ao_grants)
   жабық беттің ҚАБЫҒЫ      (нағыз мазмұн)
```

* Жария: басты бет, курс каталогы, курс туралы беттер, кіру/тіркелу, кабинет.
* Жабық: барлық лекция, курстың ішкі беттері (жаттығу, сөздік, емтихан, УБТ...), жаттығу/ойын/емтихан беттері, мазмұн дерек файлдары (`assets/data/*.js`, `lectures.js`, `quotes.js`, `portraits.js`-тен басқа). Толық ереже: `tools/gate.py` (`page_rule`, `data_rule`).
* GitHub Pages-те жабық беттің орнында тек қабық тұрады (`tools/gate.py build` жасайды). Мазмұнның өзі жабық Storage-та. Оны тек `ao-content` функциясы береді, ол да дерекқордағы `ao_can_view` «иә» десе ғана.
* Рұқсатты шешетін жалғыз жер: дерекқор (`supabase/platform.sql`). Браузердегі JavaScript-ті өзгерту ештеңе ашпайды.

## Бір рет орнату

### 1. Дерекқор
Supabase → SQL Editor → `supabase/platform.sql` мазмұнын қойып, Run. Скрипт идемпотентті: жаңартқан сайын қайта іске қоса беруге болады.

### 2. Storage
Storage → New bucket → атауы `ao-content`, **Public: өшірулі**. Ешқандай policy қоспаңыз: бакетті тек service_role оқиды.

### 3. Edge Function
```
supabase login
supabase link --project-ref fuzkjjfpknnpauykzfip
supabase secrets set AO_ALLOWED_ORIGINS=https://mustafa7677.github.io
supabase functions deploy ao-content
```
`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` функцияға Supabase-тің өзі береді. Функцияның JWT тексеруі (verify_jwt) қосулы қалсын.

### 4. Auth баптауы (Authentication)
* Sign In / Providers → Email: қосулы, **Confirm email: қосулы**.
* URL Configuration → Site URL: `https://mustafa7677.github.io/CS50MUSS/`; Redirect URLs: `https://mustafa7677.github.io/CS50MUSS/login.html*`.
* Passwords: ең аз ұзындық 10, әріп пен сан міндетті; Leaked password protection қосулы.
* Rate limits: әдепкі мәндер жеткілікті.

### 5. Super Admin
Құпиясөз репозиторийге, аргументке не файлға ешқашан жазылмайды:
```
export SUPABASE_URL=https://fuzkjjfpknnpauykzfip.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=...        # Project Settings -> API (құпия!)
python3 tools/create_admin.py mustafa_admin  # құпиясөзді терминал сұрайды (көрінбейді)
```
Кейін `login.html`-де логин `mustafa_admin` және сол құпиясөз. Бірінші кіргенде жаңа құпиясөз сұралады (кемінде 12 таңба). Дерекқор екінші әкімшіні ашпайды.

### 6. Жариялау (GitHub Actions)
1. Settings → Secrets and variables → Actions:
   * Secrets: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`;
   * Variables: `AO_PLATFORM` = `on`.
2. Settings → Pages → Build and deployment → Source: **GitHub Actions**.
3. Actions → «Platform deploy» → Run workflow (кейін әр push сайын өзі іске қосылады).

Workflow: `tools/gate.py build` → `tools/gate.py upload` (жабық файлдар Storage-қа, каталог `ao_pages`-ке) → `dist/`-ті Pages-ке шығарады.

### 7. Репозиторий (маңызды)
Pages-тегі файлдарды жабу жеткіліксіз, егер **бастапқы код репозиторийі жария** болса: кез келген адам мазмұнды GitHub-тан тікелей оқи алады.
* Settings → General → Danger Zone → Change visibility → **Private**. Private репозиторийден Pages жариялау үшін GitHub Pro/Team жоспары керек.
* Жоспар болмаса: бастапқы кодты private репозиторийде ұстаңыз, ал `dist/`-ті (тек қабықтар мен жария беттер) бөлек жария репозиторийге не Cloudflare Pages/Netlify-ға шығарыңыз.
* Бұрын жария болған git тарихындағы мазмұн бұрыннан көшірілген болуы мүмкін: жабу тек бұдан былайғы нұсқаларды қорғайды.

## Күнделікті жұмыс (admin.html)
1. **Класс ашу**: «Кластар» → атауы (мысалы, Python 2026) → Ашу.
2. **Код пен сілтеме**: класс бетінің жоғарғы жағында. Оқушы `student.html`-де кодты енгізеді не сілтемені ашады (аккаунты жоқ болса, алдымен тіркеледі).
3. **Мазмұнды ашу**: «Ашылатын мазмұн» → курсты Ашық етіп, қаласаңыз «Ашылады/Жабылады» мерзімін беріп, Сақтау. Жеке бет: «Курс бойынша / Ашық / Жабық» (бет баптауы курстан басым).
4. **Жабу/қайта ашу**: сол ауыстырғыштармен, кез келген уақытта. Келесі сұрақтан бастап күшіне енеді.
5. **Прогресс**: «Оқушылар» кестесі (оқыған лекция, тапсырма, тест %, емтихан, соңғы белсенділік). Атын бассаңыз, әр тесттің нәтижесі шығады.
6. **Шығару**: «Шығару» батырмасы. Оқушының аккаунты мен прогресі қалады, бұл класқа ашылған мазмұн оған бірден жабылады.
7. **Баптау**: атауын өзгерту, жаңа қосылуды тоқтату, мұрағат, кодты жаңарту (ескі код пен сілтеме бірден жарамсыз), класты жою.

## Шектеулер (білу керек)
* Ашық бетті оқушы көргеннен кейін сақтап, көшіре алады: бұл кез келген веб-платформаға ортақ. Қорғаныс: кім, қашан, не ашылғанын сіз басқарасыз.
* Ортақ дерек файлдары (`quiz.js`, `search-index.js`, `glossary.js` т.б.) кем дегенде бір белсенді рұқсаты бар кез келген оқушыға беріледі (`ao_asset_refs.page = '*'`). Математика мен ағылшын дерек файлдары тек сол курстың бір беті ашық болса беріледі.
* Прогресс оқушы құрылғысында есептеліп, серверге синхрондалады: ол оқу құралы, емтиханның техникалық дәлелі емес.

## Тексеру
```
# дерекқор қауіпсіздігі (таза Postgres 16)
psql -d test -f supabase/platform_test_stub.sql -f supabase/platform.sql -f supabase/platform_test.sql
# функция логикасы
deno test --no-check supabase/functions/ao-content/handler_test.ts
# жария нұсқада жабық мазмұн қалмағаны
python3 tools/gate.py build
```
