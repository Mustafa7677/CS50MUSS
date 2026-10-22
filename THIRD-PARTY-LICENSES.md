# THIRD-PARTY-LICENSES: үшінші тарап компоненттері

Бұл тізім **C санатына** қатысты. Аталған компоненттердің авторлық құқығы өз иелеріне тиесілі және олар өз лицензияларымен қолданылады; [LICENSE-PROPRIETARY.md](LICENSE-PROPRIETARY.md) оларға **таралмайды**. Тізім `COPYRIGHT.md` тізілімімен үйлестірілген. Бұл құжат заңды кеңес емес.

## 1. Репозиторийде сақталған кітапханалар

| Компонент | Орны | Лицензия | Құқық иесі | Ескерту |
|---|---|---|---|---|
| sql.js (SQLite WebAssembly/asm.js) | `assets/vendor/sqljs/` | MIT | sql.js authors (2017) | Лицензия: `assets/vendor/sqljs/LICENSE`. SQLite - public domain |
| QR Code Generator for JavaScript | `assets/vendor/qrcode/qrcode.js` | MIT | Kazuhiko Arase (2009) | Лицензия файл тақырыбында. «QR Code» - DENSO WAVE INCORPORATED тіркелген тауар белгісі |
| KaTeX 0.16.11 (katex.min.js, auto-render.min.js, katex.min.css, fonts/*.woff2) | `assets/vendor/katex/` | MIT | Khan Academy және авторлар (2013-2020) | Лицензия: `assets/vendor/katex/LICENSE`. Математика курсындағы формулаларды көрсетеді; жергілікті көшірме, CDN жоқ, офлайн жұмыс істейді. Қаріптер KaTeX пакетімен бірге таратылады (олардың өз лицензиялары бар: SIL OFL 1.1 негізінде) |
| Flask 3.1.3 | `assets/vendor/flask/flask-bundle.zip` | BSD-3-Clause | Pallets | Лицензия мәтіні архив ішінде `licenses/flask-LICENSE.txt` |
| Werkzeug 3.1.9 | сол архив | BSD-3-Clause | Pallets | `licenses/werkzeug-LICENSE.txt` |
| Jinja2 3.1.6 | сол архив | BSD-3-Clause | Pallets | `licenses/jinja2-LICENSE.txt` |
| Click 8.5.0 | сол архив | BSD-3-Clause | Pallets | `licenses/click-LICENSE.txt` |
| ItsDangerous 2.2.0 | сол архив | BSD-3-Clause | Pallets | `licenses/itsdangerous-LICENSE.txt` |
| MarkupSafe 3.0.2 | сол архив | BSD-3-Clause | Pallets | `licenses/markupsafe-LICENSE.txt` |
| Blinker 1.9.0 | сол архив | MIT | Jason Kirtland және авторлар | `licenses/blinker-LICENSE.txt` |

Flask пакеті `tools/make_flask_bundle.py` арқылы PyPI-дегі ресми пакеттерден жиналған; бағдарламаның өзі өзгертілмеген.

## 2. Орындау уақытында сыртқы CDN-нен жүктелетін компоненттер

Олар репозиторийде **сақталмайды**, браузер ашқанда жүктеледі. Лицензия мәліметтері - құрастырушылардың жарияланған ақпараты бойынша; жаңарту алдында тексеріңіз.

| Компонент | Қайдан | Лицензия | Қолданылуы |
|---|---|---|---|
| Pyodide 0.26.4 (CPython WebAssembly-де) | cdn.jsdelivr.net, unpkg.com | MPL-2.0 (Pyodide); ішіндегі CPython - PSF License және басқа кітапханалар өз лицензияларымен | Браузерде Python орындау |
| highlight.js 11.9.0 және github-dark стилі | cdnjs.cloudflare.com | BSD-3-Clause | Код түстері |
| Қаріптер: Unbounded, Inter, JetBrains Mono | fonts.googleapis.com / fonts.gstatic.com | SIL Open Font License 1.1 | Интерфейс қаріптері. Google Fonts сұрау кезінде қаріп серверіне IP жібереді: құпиялылық тұрғысынан қарау керек |

## 3. Қызметтер

- **Supabase** (`*.supabase.co`): кері байланыс пен сынып «пульсі» үшін сыртқы бэкенд. Бұл қызмет көрсету, кітапхана емес; олардың қызмет көрсету шарттары мен құпиялылық саясаты қолданылады.
- **GitHub Pages / GitHub Actions**: хостинг пен CI; GitHub шарттары.

## 4. Лекция мәтіндеріндегі сілтемелер (қосымша жүктелмейді)

Harvard лекцияларының код мысалдарында React 17.0.2, ReactDOM, Babel Standalone 6.26.0 және Bootstrap 5.3.3 CDN-ге сілтемелер бар. Олар лекция мәтініндегі мысал ретінде ғана көрсетіледі; бұл кітапханалар сайт функциялары үшін қолданылмайды. Лицензиялары: MIT (React, Babel, Bootstrap).

C тілінің `cs50.h` кітапханасы лекция мысалдарында аталады және осы репозиторийге **қосылмаған**; оның лицензиясы расталмаған (қараңыз COPYRIGHT.md, R-bugs-trace).

## 5. Суреттер: Алаш тұлғаларының портреттері (`assets/img/alash/`)

Реестр: `assets/data/portraits.js` (сайтта «Суреттердің дереккөзі» бөлімінде көрсетіледі). Суреттер 320×400 форматына кесілген (өзгертілген көшірме).

| Тұлға | Файл | Автор | Лицензия | Дереккөз |
|---|---|---|---|---|
| Мұхтар Шаханов | `assets/img/alash/shakhanov.jpg` | фотопортрет | сайт авторы ұсынған | - |
| Әлихан Бөкейхан | `assets/img/alash/bokeikhan.jpg` | Unknown photographer | Public domain | https://commons.wikimedia.org/wiki/File:Bukeykhanov.jpg |
| Ахмет Байтұрсынұлы | `assets/img/alash/baitursynuly.jpg` | Unknown photographer | Public domain | https://commons.wikimedia.org/wiki/File:%D0%90%D1%85%D0%BC%D0%B5%D1%82_%D0%91%D0%B0%D0%B9%D1%82%D2%B1%D1%80%D1%81%D1%8B%D0%BD%D2%B1%D0%BB%D1%8B_(1913-02-02).jpg |
| Міржақып Дулатұлы | `assets/img/alash/dulatuly.jpg` | Unknown photographer | Public domain | https://commons.wikimedia.org/wiki/File:Dulatov_Mirjakip.jpg |
| Мағжан Жұмабаев | `assets/img/alash/zhumabayev.jpg` | кескіндеме портрет, суретшісі белгісіз | сайт авторы ұсынған | - |
| Жүсіпбек Аймауытұлы | `assets/img/alash/aimauytuly.jpg` | кескіндеме портрет, суретшісі белгісіз | сайт авторы ұсынған | - |
| Сұлтанмахмұт Торайғыров | `assets/img/alash/toraighyrov.jpg` | Geliktop | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:%D0%A2%D0%BE%D1%80%D0%B0%D0%B9%D0%B3%D1%8B%D1%80%D0%BE%D0%B2.jpg |
| Ыбырай Алтынсарин | `assets/img/alash/altynsarin.jpg` | Unknown author | Public domain | https://commons.wikimedia.org/wiki/File:Altynsarin.jpg |
| Абай Құнанбайұлы | `assets/img/alash/abai.jpg` | белгісіз | Public domain | https://commons.wikimedia.org/wiki/File:Abai_Kunanbaev.jpg |
| Мұхтар Әуезов | `assets/img/alash/auezov.jpg` | фотопортрет | сайт авторы ұсынған | - |
| Қадыр Мырза Әли | `assets/img/alash/myrzaali.jpg` | фотопортрет | сайт авторы ұсынған | - |
| Жұбан Молдағалиев | `assets/img/alash/moldagaliev.jpg` | Қазақстан пошта маркасы (2020) | сайт авторы ұсынған | - |
| Әбу Насыр әл-Фараби | `assets/img/alash/farabi.jpg` | кескіндеме портрет (шартты бейне) | сайт авторы ұсынған | - |

**Назар аударыңыз (тексеру керек):**

- «сайт авторы ұсынған» деп белгіленген 7 портреттің (Шаханов, Жұмабаев, Аймауытұлы, Әуезов, Мырза Әли, Молдағалиев, әл-Фараби) авторлық құқық мәртебесі, суретшісі/фотографы және рұқсаты **расталмаған**. Молдағалиев суреті - Қазақстан поштасының маркасынан (2020); марка дизайны авторлық құқықпен қорғалуы мүмкін. Шаханов фотосы - жеке тұлғаның бейнесі: фотограф пен бейне құқығы тексерілуі керек. Заңгер тексеруі керек; расталғанша бұл суреттерге жаңа лицензия **тағайындалмайды**.
- Торайғыров портреті - CC BY-SA 4.0 (Geliktop): атрибуция міндетті және кесілген көшірмеге ShareAlike қолданылады.
- Public domain суреттер үшін мерзімдер мен елдің құқықтық режимін тексеру ұсынылады.

## 6. QazaqCode Platform (`qazaqcode/`)

- DejaVu Sans / Sans Bold қаріптері (`qazaqcode/assets/fonts/`): Bitstream Vera/DejaVu лицензиясы, мәтіні `qazaqcode/assets/fonts/LICENSE-DejaVu.txt`.
- npm тәуелсіздіктері (`qazaqcode/package.json`, `package-lock.json`): көбі MIT/Apache-2.0/ISC лицензиялы; толық тізімін `npm ls --all` не `npx license-checker` арқылы алуға болады. Нақты лицензия есебі коммерциялық пилоттың алдында міндетті.
- `qazaqcode/NOTICE.md` - сол өнімнің лицензиялық шекарасы.

## 7. Сынақ құралдары (тек әзірлеу)

`tests/package.json`: Playwright (Apache-2.0), axe-core (MPL-2.0), pyodide (MPL-2.0), highlight.js cdn-assets (BSD-3-Clause). Сайтпен бірге таратылмайды.
