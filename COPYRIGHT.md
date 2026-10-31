# COPYRIGHT.md: авторлық құқықтар тізілімі

Бұл файл `tools/licence_audit.py` арқылы `licensing/components.json` реестрінен автоматты құрылады. Қолмен өңдемеңіз: реестрді өзгертіп, құралды қайта іске қосыңыз.

**Бұл құжат заңды кеңес емес.** Статусы «иесі мәлімдеген» компоненттер бойынша авторлық құқық иесі өзі жауап береді, «тексеру керек» компоненттерге жаңа лицензия тағайындалмаған. Тәртіп: [LICENSE.md](LICENSE.md).

Негізгі қағида: Harvard CS50 материалдары мен олардың аудармалары/бейімдеулері - **CC BY-NC-SA 4.0** ([LICENSE-HARVARD.md](LICENSE-HARVARD.md)); Sagid Mustafa-ның дербес әзірлемелері - **All Rights Reserved** ([LICENSE-PROPRIETARY.md](LICENSE-PROPRIETARY.md)); үшінші тарап компоненттері - өз лицензиясымен ([THIRD-PARTY-LICENSES.md](THIRD-PARTY-LICENSES.md)). Бұрын CC BY-NC-SA 4.0 бойынша жарияланған нұсқаларға берілген құқықтар жойылмайды.

## 1. Қысқаша

| Санат | Файл саны |
|---|---|
| A1 · Harvard CS50 түпнұсқасы | 141 |
| A2 · Harvard материалының аудармасы/бейімдеуі | 52 |
| B · Sagid Mustafa-ның дербес әзірлемесі | 1188 |
| C · Үшінші тарап | 85 |
| R · Тексеруді қажет етеді (лицензия тағайындалмаған) | 56 |

## 2. Компоненттер кестесі

| Файл / жол | Компонент | Құқық иесі | Лицензия | Статус |
|---|---|---|---|---|
| `cpp/**` | **B-course-cpp** C++ бағдарламалау: дербес авторлық курс (cpp/ лекциялары, курс беті) (10 файл) | Sagid Mustafa | © 2026 Sagid Mustafa. All Rights Reserved (LICENSE-PROPRIETARY.md) | иесі мәлімдеген |
| `java/**` | **B-course-java** Java бағдарламалау: дербес авторлық курс (java/ лекциялары, курс беті) (10 файл) | Sagid Mustafa | © 2026 Sagid Mustafa. All Rights Reserved (LICENSE-PROPRIETARY.md) | иесі мәлімдеген |
| `en/**` | **B-course-en** Ағылшын тілі A0-C1: дербес авторлық курс (en/ сабақтары, курс беті, ортақ беттер) (31 файл) | Sagid Mustafa | © 2026 Sagid Mustafa. All Rights Reserved (LICENSE-PROPRIETARY.md) | иесі мәлімдеген |
| `assets/js/en-course.js`<br>`assets/js/en-tools.js`<br>`assets/css/en-course.css`<br>`assets/data/en-*.js`<br>`docs/EN-COURSE-GUIDE.md`<br>`tools/make_en_pages.py` | **B-course-en-engine** Ағылшын курсының жаттығу қозғалтқышы, стильдері, деректері (assets/data/en-*.js) және құжаты (20 файл) | Sagid Mustafa | © 2026 Sagid Mustafa. All Rights Reserved (LICENSE-PROPRIETARY.md) | иесі мәлімдеген |
| `assets/js/en-trainer.js`<br>`assets/js/en-home.js`<br>`assets/js/en-skills.js`<br>`assets/js/games-en.js`<br>`assets/css/en-games.css` | **B-course-en-trainer-games** Ағылшын курсы: сөздік жаттықтырғышы, курс беті (en-home), ағылшын ойындары (games-en) және олардың стильдері (5 файл) | Sagid Mustafa | © 2026 Sagid Mustafa. All Rights Reserved (LICENSE-PROPRIETARY.md) | иесі мәлімдеген |
| `math/**` | **B-course-math** Математика (24 пән): дербес авторлық курс (math/ сабақтары, курс беті, формулалар, сөздік және жаттықтырғыш беттері) (171 файл) | Sagid Mustafa | © 2026 Sagid Mustafa. All Rights Reserved (LICENSE-PROPRIETARY.md) | иесі мәлімдеген |
| `assets/js/math-course.js`<br>`assets/js/math-viz.js`<br>`assets/css/math-course.css`<br>`assets/data/math-*.js`<br>`docs/MATH-COURSE-GUIDE.md`<br>`tools/make_math_pages.py`<br>`tools/math_plan.py`<br>`tools/math_verify.py`<br>`tools/math_lesson_gen.py`<br>`tools/math_src/**`<br>`tools/math_easy/**`<br>`tools/math_easy_inject.py`<br>`tools/math_explain.py`<br>`tools/math_explain/**`<br>`tools/math_fig.py`<br>`tools/math_pedagogy.py`<br>`tools/math_prereq.py` | **B-course-math-engine** Математика курсының қозғалтқышы (есептер, қауіпсіз өрнек парсері, визуализация), стильдері, деректері (assets/data/math-*.js), құжаты және құралдары (413 файл) | Sagid Mustafa | © 2026 Sagid Mustafa. All Rights Reserved (LICENSE-PROPRIETARY.md) | иесі мәлімдеген |
| `assets/vendor/katex/**` | **C-katex** KaTeX 0.16.11 (формулаларды көрсету; жергілікті көшірме, CDN жоқ) (24 файл) | Khan Academy and other contributors | MIT | расталған |
| `assets/fonts/**` | **C-fonts** Интерфейс қаріптері: Unbounded, Inter, JetBrains Mono, PT Serif (woff2, cyrillic/cyrillic-ext/latin/latin-ext; жергілікті көшірме) (29 файл) | The Inter / Unbounded / JetBrains Mono Project Authors; ParaType (PT Serif) | OFL-1.1 | расталған |
| `sources/**` | **A1-sources** Оригинальные тексты Harvard CS50 (конспекты и problem sets), сохранённые для перевода (141 файл) | David J. Malan, Carter Zenke, Brian Yu, Harvard University / CS50 (по заголовкам sources/*/README.md) | CC BY-NC-SA 4.0 | расталған |
| `lectures/*.html` | **A2-lectures-x** CS50x: 12 лекций (перевод и адаптация) (12 файл) | Оригинал: David J. Malan, Harvard / CS50. Перевод и адаптация: Sagid Mustafa | CC BY-NC-SA 4.0 | расталған |
| `python/lectures/*.html` | **A2-lectures-python** CS50P (Python): 10 лекций (10 файл) | Оригинал: David J. Malan, Harvard / CS50. Перевод и адаптация: Sagid Mustafa | CC BY-NC-SA 4.0 | расталған |
| `sql/lectures/*.html` | **A2-lectures-sql** CS50 SQL: 7 лекций (7 файл) | Оригинал: Carter Zenke, David J. Malan, Harvard / CS50. Перевод и адаптация: Sagid Mustafa | CC BY-NC-SA 4.0 | расталған |
| `ai/lectures/*.html` | **A2-lectures-ai** CS50 AI: 7 лекций (7 файл) | Оригинал: Brian Yu, David J. Malan, Harvard / CS50. Перевод и адаптация: Sagid Mustafa | CC BY-NC-SA 4.0 | расталған |
| `web/lectures/*.html` | **A2-lectures-web** CS50 Web: 9 лекций (9 файл) | Оригинал: Brian Yu, David J. Malan, Harvard / CS50. Перевод и адаптация: Sagid Mustafa | CC BY-NC-SA 4.0 | расталған |
| `assets/data/lectures.js`<br>`assets/data/search-index.js`<br>`python/data/lectures.js`<br>`sql/data/lectures.js`<br>`ai/data/lectures.js`<br>`web/data/lectures.js`<br>`cheatsheet.html` | **A2-derived-lecture-data** Данные, полученные из текстов лекций: список лекций, поисковый индекс, шпаргалка (7 файл) | Оригинал: Harvard / CS50. Перевод и адаптация: Sagid Mustafa | CC BY-NC-SA 4.0 | расталған |
| `glossary.html`<br>`assets/data/glossary.js`<br>`flashcards.html` | **R-glossary** Глоссарий (kz-en термины) и флэш-карточки на его основе (3 файл) | Sagid Mustafa (подбор, объяснения); термины и контекст взяты из лекций Harvard | Лицензия не назначена: требует проверки. Ранее опубликованные версии остаются на условиях CC BY-NC-SA 4.0 | тексеру керек |
| `assets/data/quiz.js` | **R-quiz** Банк тестовых вопросов (356 вопросов лекционных тестов) (1 файл) | Sagid Mustafa (составление вопросов); вопросы проверяют материал лекций Harvard и местами используют их примеры | Лицензия не назначена: требует проверки. Ранее опубликованные версии остаются на условиях CC BY-NC-SA 4.0 | тексеру керек |
| `python/checks/*.js`<br>`ai/checks/*.js`<br>`web/checks/*.js`<br>`assets/data/checks.js`<br>`assets/data/sqlchecks.js`<br>`sql/data/week-*.js`<br>`web/data/week-*.js`<br>`assets/data/db.js`<br>`tests/support/solutions.json` | **R-checks** Автоматические проверки и демо-базы к упражнениям лекций (тесты в стиле check50) (37 файл) | Sagid Mustafa (код проверок, вымышленные данные); условия задач соответствуют problem sets Harvard | Лицензия не назначена: требует проверки. Ранее опубликованные версии остаются на условиях CC BY-NC-SA 4.0 | тексеру керек |
| `debug.html`<br>`assets/data/bugs.js`<br>`assets/data/trace.js` | **R-bugs-trace** Тренажёры 'Қатені тап' и 'Не шығарады?' (данные упражнений) (3 файл) | Sagid Mustafa; фрагменты кода используют стиль и библиотеку cs50.h из курса Harvard | Лицензия не назначена: требует проверки. Ранее опубликованные версии остаются на условиях CC BY-NC-SA 4.0 | тексеру керек |
| `index.html`<br>`courses.html`<br>`programming.html`<br>`map.html`<br>`practice.html`<br>`python/index.html`<br>`sql/index.html`<br>`ai/index.html`<br>`web/index.html`<br>`tools/make_course_pages.py`<br>`about.html` | **R-course-pages** Страницы курсов и навигации: главная, курсы, карта курса, практика, мои курсы (11 файл) | Sagid Mustafa (интерфейс и тексты); описания курсов основаны на сведениях о курсах Harvard | Лицензия не назначена: требует проверки. Ранее опубликованные версии остаются на условиях CC BY-NC-SA 4.0 | тексеру керек |
| `assets/js/own-viz.js`<br>`assets/css/own-viz.css` | **B-own-viz** C++ және Java лекцияларының интерактивті визуализаторлары (own-viz) (2 файл) | Sagid Mustafa | © 2026 Sagid Mustafa. All Rights Reserved (LICENSE-PROPRIETARY.md) | иесі мәлімдеген |
| `detective.html`<br>`assets/data/mystery.js`<br>`assets/data/mystery2.js`<br>`tools/make_mystery.py`<br>`tools/make_mystery2.py`<br>`tools/make_demo_db.py` | **B-sql-detective** SQL детектив: «Алтын домбыра» и «Байқоңыр құпиясы» (6 файл) | Sagid Mustafa | © 2026 Sagid Mustafa. All Rights Reserved (LICENSE-PROPRIETARY.md) | иесі мәлімдеген |
| `projects.html`<br>`assets/js/projects.js`<br>`projects/**` | **B-projects** Жобалар шеберханасы: Python веб-қосымша, сайт генераторы, мәтін жіктегіші (AI), AI-интеграция (7 файл) | Sagid Mustafa | © 2026 Sagid Mustafa. All Rights Reserved (LICENSE-PROPRIETARY.md) | иесі мәлімдеген |
| `alash.html`<br>`tools/fetch_portraits.py`<br>`tools/fetch_film_media.py`<br>`film/media/**` | **B-alash** Алаш тұлғалары: образовательные тексты, исторические примеры, задания (4 файл) | Sagid Mustafa | © 2026 Sagid Mustafa. All Rights Reserved (LICENSE-PROPRIETARY.md) | иесі мәлімдеген |
| `assets/data/quotes.js` | **R-quotes** Цитаты и афоризмы исторических и современных деятелей (Алаш тұлғалары) (1 файл) | Авторы цитат (разные) | Лицензия не назначена: требует проверки. Ранее опубликованные версии остаются на условиях CC BY-NC-SA 4.0 | тексеру керек |
| `flask.html`<br>`assets/js/flask.js`<br>`tools/make_flask_bundle.py` | **B-flask** Flask зертханасы (3 файл) | Sagid Mustafa | © 2026 Sagid Mustafa. All Rights Reserved (LICENSE-PROPRIETARY.md) | иесі мәлімдеген |
| `playground.html`<br>`viz.html`<br>`assets/js/labs.js` | **B-code-trainer** Код тренажері (редактор, запуск Python, автопроверка), алгоритмдерді көзбен көру (3 файл) | Sagid Mustafa | © 2026 Sagid Mustafa. All Rights Reserved (LICENSE-PROPRIETARY.md) | иесі мәлімдеген |
| `games.html`<br>`assets/js/games-*.js`<br>`assets/css/games-ui*.css`<br>`assets/js/cabinet.js` | **B-games** Образовательные игры, система XP, кабинет (7 файл) | Sagid Mustafa | © 2026 Sagid Mustafa. All Rights Reserved (LICENSE-PROPRIETARY.md) | иесі мәлімдеген |
| `assets/js/main.js`<br>`assets/js/exam.js`<br>`exam.html`<br>`assets/js/profile.js`<br>`profile.html`<br>`assets/js/cloud.js`<br>`teacher.html`<br>`assets/js/feedback.js`<br>`supabase/**`<br>`certificate.html`<br>`partners.html`<br>`posters.html`<br>`metrics.html`<br>`assets/js/metrics.js`<br>`sw.js`<br>`manifest.webmanifest` | **B-platform** Платформа: движок сайта, прогресс, достижения, редактор, тест-система, профиль, кабинеты ученика и преподавателя, синхронизация (17 файл) | Sagid Mustafa | © 2026 Sagid Mustafa. All Rights Reserved (LICENSE-PROPRIETARY.md) | иесі мәлімдеген |
| `assets/css/style.css`<br>`docs/MOTION-SYSTEM.md`<br>`docs/INVESTOR-BRIEF.md`<br>`docs/DUE-DILIGENCE.md`<br>`docs/DATA-ROOM.md`<br>`docs/INVENTORY.md`<br>`assets/img/bota*.svg`<br>`assets/img/seal.svg`<br>`assets/img/brand/**`<br>`assets/img/posters/**`<br>`film/**`<br>`tools/make_film.py`<br>`tools/make_posters.py`<br>`docs/FILM.md`<br>`assets/img/icon*`<br>`assets/img/og.jpg`<br>`assets/img/og/**`<br>`tools/make_og.mjs`<br>`tools/make_og_main.mjs`<br>`tools/og-main.html` | **B-design** Дизайн, стили, фирменная графика (маскот Бота, иконки, превью) (80 файл) | Sagid Mustafa | © 2026 Sagid Mustafa. All Rights Reserved (LICENSE-PROPRIETARY.md) | иесі мәлімдеген |
| `tools/build.py`<br>`tools/fetch_cs50.py`<br>`tools/__pycache__/**`<br>`tests/**`<br>`.github/**`<br>`licensing/**`<br>`robots.txt`<br>`sitemap.xml`<br>`.nojekyll`<br>`.gitignore`<br>`**/.gitkeep`<br>`tools/licence_audit.py` | **B-tools-tests** Скрипты сборки, тесты, CI (69 файл) | Sagid Mustafa | © 2026 Sagid Mustafa. All Rights Reserved (LICENSE-PROPRIETARY.md) | иесі мәлімдеген |
| `qazaqcode/**` | **B-qazaqcode** QazaqCode Platform (отдельный коммерческий продукт) (319 файл) | Sagid Mustafa | © 2026 Sagid Mustafa. All Rights Reserved (LICENSE-PROPRIETARY.md) | иесі мәлімдеген |
| `README.md`<br>`LICENSE.md`<br>`LICENSE-HARVARD.md`<br>`LICENSE-PROPRIETARY.md`<br>`COPYRIGHT.md`<br>`THIRD-PARTY-LICENSES.md`<br>`TAKEDOWN.md`<br>`copyright.html`<br>`404.html`<br>`test-results/**`<br>`MOBILE-TESTING.md` | **B-docs** Документы проекта: README, лицензии, правила обращения (10 файл) | Sagid Mustafa | © 2026 Sagid Mustafa. All Rights Reserved (LICENSE-PROPRIETARY.md) | иесі мәлімдеген |
| `assets/vendor/sqljs/**` | **C-sqljs** sql.js (SQLite в WebAssembly) (4 файл) | sql.js authors; SQLite - общественное достояние | MIT | расталған |
| `assets/vendor/qrcode/**` | **C-qrcode** QR Code Generator for JavaScript (1 файл) | Kazuhiko Arase | MIT | расталған |
| `assets/vendor/flask/**` | **C-flask-bundle** Пакет Flask для Pyodide: Flask, Werkzeug, Jinja2, Click, ItsDangerous, Blinker, MarkupSafe (1 файл) | Pallets Projects и авторы пакетов | BSD-3-Clause (Flask, Werkzeug, Jinja2, Click, ItsDangerous, MarkupSafe), MIT (Blinker) | расталған |
| `assets/img/alash/**` | **C-portraits** Портреты деятелей Алаш (13 фотографий) (13 файл) | Разные авторы; для каждого портрета сведения в assets/data/portraits.js | Public domain / CC (по каждому изображению, см. portraits.js); портрет Мұхтар Шаханов - 'сайт авторы ұсынған' | тексеру керек |
| `assets/img/film/**`<br>`assets/data/film-media.json` | **C-film-media** «Шақыру» фильмінің архивтік суреттері (Wikimedia Commons) (13 файл) | Әртүрлі авторлар; әр сурет үшін автор, лицензия мен дерек көзі assets/data/film-media.json ішінде | Public domain / CC0 / CC BY / CC BY-SA / © Сағид Мұстафа (әр суретке бөлек, film-media.json) | тексеру керек |
| `assets/data/portraits.js` | **C-portraits-data** Реестр происхождения портретов (1 файл) | Sagid Mustafa (реестр); сведения об авторах изображений - сторонние | © 2026 Sagid Mustafa. All Rights Reserved (LICENSE-PROPRIETARY.md) | иесі мәлімдеген |

### Ескертулер

- **B-course-cpp**: Дербес авторлық курс; Harvard CS50 мәтіні/есептері көшірілмеген (жазу кезінде ескертілген талап)
- **B-course-java**: Дербес авторлық курс; Harvard CS50 мәтіні/есептері көшірілмеген (жазу кезінде ескертілген талап)
- **B-course-en**: Дербес авторлық курс; Harvard CS50 материалы емес. Мазмұн жасанды интеллект көмегімен дайындалған, мұғаліммен тексеру ұсынылады. Oxford/Cambridge/British Council т.б. сөздік тізімдері мен мәтіндері көшірілмеген (жазу кезінде ескертілген талап).
- **B-course-en-engine**: Дербес авторлық код пен деректер; сөздік пен грамматика жазбалары өз сөзімізбен жазылған, сыртқы тізімдер көшірілмеген
- **B-course-en-trainer-games**: Дербес авторлық код; орнатылған сөз, сөйлем және мәтін қоры өз сөзімізбен жазылған, сыртқы тізімдерден көшірілмеген
- **B-course-math**: Дербес авторлық курс; Harvard CS50 материалы емес. Мазмұн жасанды интеллект көмегімен дайындалған, математик-оқытушымен тексеру ұсынылады. Математиканың өзі (анықтамалар, теоремалар, формулалар) жалпыға ортақ білім; баяндау, мысалдар мен есептер өз сөзімізбен жазылған, оқулықтар мен есептер жинақтарынан көшірілмеген (жазу кезінде ескертілген талап). Ресми емтихан, куәлік не диплом баламасы емес, сертификат берілмейді.
- **B-course-math-engine**: Дербес авторлық код пен деректер; формулалар, терминдер және параметрлік есептер өз сөзімізбен жазылған, оқулықтардан көшірілмеген. Формулалар KaTeX арқылы көрсетіледі (C-katex).
- **C-katex**: assets/vendor/katex/LICENSE (MIT, Copyright (c) 2013-2020 Khan Academy and other contributors). Қаріптер (KaTeX_*.woff2) KaTeX пакетімен бірге таратылады: SIL OFL 1.1 / MIT (құрастырушылар мәлімдемесі бойынша).
- **C-fonts**: Лицензия мәтіндері: assets/fonts/OFL-*.txt. Google Fonts-тан жүктеліп, өзгеріссіз таратылады; сайт енді fonts.googleapis.com-ға сұраныс жібермейді.
- **A1-sources**: Скачаны tools/fetch_cs50.py с cs50.harvard.edu; указан источник и лицензия в README каждого курса.
- **A2-lectures-x**: Основной текст, структура и примеры кода следуют лекциям Harvard. Встроенные упражнения, тесты, визуализации и тексты проверок: отдельные записи R-* и B-*. В нескольких лекциях упомянуты фрагменты третьих лиц (Elon University, Stanford), они только описаны, не воспроизведены.
- **A2-lectures-python**: См. примечание к A2-lectures-x.
- **A2-lectures-sql**: См. примечание к A2-lectures-x.
- **A2-lectures-ai**: См. примечание к A2-lectures-x. Python-демо в лекции 'ауруханалар/AC-3' помечены в тексте как собственные примеры сайта: см. R-embedded.
- **A2-lectures-web**: См. примечание к A2-lectures-x. Фрагменты React/Babel/Bootstrap в тексте лекций - примеры кода Harvard, сторонние библиотеки подключаются в них по ссылкам CDN.
- **A2-derived-lecture-data**: Генерируются tools/build.py из текстов лекций; содержат их фрагменты. Индекс также включает тексты страниц B-категории (заголовки).
- **R-glossary**: Термины извлечены из переведённых лекций. Отдельные термины не охраняются, но подборка/формулировки могут быть производными. Интерфейс и код страниц: B-ui.
- **R-quiz**: Не доказана независимость от лекций Harvard. Часть вопросов использует примеры из лекций (например, ./greet David Malan). До проверки новая лицензия не назначается.
- **R-checks**: Код проверок написан самостоятельно, но привязан к формулировкам и названиям задач Harvard (check50-подобные тесты). Требуется проверить, какие проверки независимы.
- **R-bugs-trace**: Упражнения привязаны к неделям курса и используют API cs50.h. Лицензия самой библиотеки cs50.h и степень зависимости от материалов Harvard не установлены.
- **R-course-pages**: Смешанные страницы: интерфейс/вёрстка - B-ui, описания и названия курсов Harvard - A. Требуется постраничная проверка текстов.
- **B-own-viz**: Дербес авторлық код; Harvard CS50 визуализацияларынан көшірілмеген
- **B-sql-detective**: Заявлено правообладателем как самостоятельное произведение. В файлах нет заимствованных материалов Harvard (проверено поиском).
- **B-projects**: Заявлено правообладателем. В файлах нет заимствованных материалов Harvard.
- **B-alash**: Собственный текст страницы и код. Цитаты и портреты - отдельные записи C-portraits и R-quotes.
- **R-quotes**: Цитаты третьих лиц. Для произведений авторов, чьи права ещё действуют (например, современные поэты), нужна проверка допустимости цитирования и точности текста.
- **B-flask**: Заявлено правообладателем. Библиотеки Flask и зависимости: C-flask-bundle.
- **B-code-trainer**: Код интерактивных инструментов. Тексты внутри учебных заданий лекций - отдельно (R-*).
- **B-games**: Тексты вопросов игр написаны для сайта; независимость от Harvard проверена поиском заимствований (не найдено).
- **B-platform**: Программный код и интерфейс. Вопросы экзамена берутся из банка R-quiz; формулировки сертификата содержат оговорку, что сертификат не выдан Harvard.
- **B-design**: Оригинальный UI/UX. Превью лекций содержат только названия лекций.
- **B-tools-tests**: Служебный код. fetch_cs50.py скачивает материалы Harvard, но сам не содержит их.
- **B-qazaqcode**: Отдельная лицензия qazaqcode/LICENSE. Не содержит материалов Harvard (проверяется scripts/check-licence.mjs). Шрифты DejaVu и npm-зависимости - сторонние, см. qazaqcode/NOTICE.md.
- **B-docs**: Служебные документы и страницы. Тексты лицензий сторонних лицензиаров (CC и др.) принадлежат им.
- **C-sqljs**: assets/vendor/sqljs/LICENSE.
- **C-qrcode**: Заголовок файла. «QR Code» - зарегистрированный товарный знак DENSO WAVE.
- **C-flask-bundle**: Сборка tools/make_flask_bundle.py из официальных пакетов PyPI: Flask 3.1.3, Werkzeug 3.1.9, Jinja2 3.1.6, Click 8.5.0, ItsDangerous 2.2.0, MarkupSafe 3.0.2, Blinker 1.9.0. Тексты лицензий лежат внутри архива в папке licenses/ (проверено).
- **C-portraits**: Для портрета Шаханова права, согласие и источник не подтверждены.
- **C-film-media**: 12 сурет: til-qural.jpg - Сағид Мұстафаның өз фотосы; қалған 11-і қоғамдық игілік (1925 жылға дейінгі фото, ашықхат, газет, кітап, карта); Википедия мен Wikimedia Commons-тан таңдалды. tools/fetch_film_media.py тек еркін лицензиялыларды алады; CC BY/BY-SA қосылса, автор фильмде көрсетіледі.
- **C-portraits-data**: Служебный реестр; сохранять без изменений при публикации портретов.

## 3. 45 лекция

Әр лекцияның негізгі мәтіні мен код мысалдары - Harvard материалының аудармасы/бейімдеуі (**CC BY-NC-SA 4.0**; түпнұсқа авторлары: Harvard University / CS50, аудармашы: Sagid Mustafa). Бетке енгізілген жаттығулар мен тесттер (R-quiz, R-checks), интерактивті кодтың бағдарламасы (B-code-trainer, B-platform) жеке жазбаларда көрсетілген. Толық есептік кесте: [licensing/LECTURE-AUDIT.md](licensing/LECTURE-AUDIT.md).

| Файл | Курс | Түпнұсқа | Лицензия (негізгі мәтін) |
|---|---|---|---|
| `ai/lectures/week-0.html` | CS50 AI | https://cs50.harvard.edu/ai/notes/0/ | CC BY-NC-SA 4.0 |
| `ai/lectures/week-1.html` | CS50 AI | https://cs50.harvard.edu/ai/notes/1/ | CC BY-NC-SA 4.0 |
| `ai/lectures/week-2.html` | CS50 AI | https://cs50.harvard.edu/ai/notes/2/ | CC BY-NC-SA 4.0 |
| `ai/lectures/week-3.html` | CS50 AI | https://cs50.harvard.edu/ai/notes/3/ | CC BY-NC-SA 4.0 |
| `ai/lectures/week-4.html` | CS50 AI | https://cs50.harvard.edu/ai/notes/4/ | CC BY-NC-SA 4.0 |
| `ai/lectures/week-5.html` | CS50 AI | https://cs50.harvard.edu/ai/notes/5/ | CC BY-NC-SA 4.0 |
| `ai/lectures/week-6.html` | CS50 AI | https://cs50.harvard.edu/ai/notes/6/ | CC BY-NC-SA 4.0 |
| `lectures/ai.html` | CS50x | https://cs50.harvard.edu/x/weeks/ai/ | CC BY-NC-SA 4.0 |
| `lectures/week-0.html` | CS50x | https://cs50.harvard.edu/x/weeks/0/ | CC BY-NC-SA 4.0 |
| `lectures/week-1.html` | CS50x | https://cs50.harvard.edu/x/weeks/1/ | CC BY-NC-SA 4.0 |
| `lectures/week-10.html` | CS50x | https://cs50.harvard.edu/x/weeks/10/ | CC BY-NC-SA 4.0 |
| `lectures/week-2.html` | CS50x | https://cs50.harvard.edu/x/weeks/2/ | CC BY-NC-SA 4.0 |
| `lectures/week-3.html` | CS50x | https://cs50.harvard.edu/x/weeks/3/ | CC BY-NC-SA 4.0 |
| `lectures/week-4.html` | CS50x | https://cs50.harvard.edu/x/weeks/4/ | CC BY-NC-SA 4.0 |
| `lectures/week-5.html` | CS50x | https://cs50.harvard.edu/x/weeks/5/ | CC BY-NC-SA 4.0 |
| `lectures/week-6.html` | CS50x | https://cs50.harvard.edu/x/weeks/6/ | CC BY-NC-SA 4.0 |
| `lectures/week-7.html` | CS50x | https://cs50.harvard.edu/x/weeks/7/ | CC BY-NC-SA 4.0 |
| `lectures/week-8.html` | CS50x | https://cs50.harvard.edu/x/weeks/8/ | CC BY-NC-SA 4.0 |
| `lectures/week-9.html` | CS50x | https://cs50.harvard.edu/x/weeks/9/ | CC BY-NC-SA 4.0 |
| `python/lectures/week-0.html` | CS50P | https://cs50.harvard.edu/python/weeks/0/ | CC BY-NC-SA 4.0 |
| `python/lectures/week-1.html` | CS50P | https://cs50.harvard.edu/python/weeks/1/ | CC BY-NC-SA 4.0 |
| `python/lectures/week-2.html` | CS50P | https://cs50.harvard.edu/python/weeks/2/ | CC BY-NC-SA 4.0 |
| `python/lectures/week-3.html` | CS50P | https://cs50.harvard.edu/python/weeks/3/ | CC BY-NC-SA 4.0 |
| `python/lectures/week-4.html` | CS50P | https://cs50.harvard.edu/python/weeks/4/ | CC BY-NC-SA 4.0 |
| `python/lectures/week-5.html` | CS50P | https://cs50.harvard.edu/python/weeks/5/ | CC BY-NC-SA 4.0 |
| `python/lectures/week-6.html` | CS50P | https://cs50.harvard.edu/python/weeks/6/ | CC BY-NC-SA 4.0 |
| `python/lectures/week-7.html` | CS50P | https://cs50.harvard.edu/python/weeks/7/ | CC BY-NC-SA 4.0 |
| `python/lectures/week-8.html` | CS50P | https://cs50.harvard.edu/python/weeks/8/ | CC BY-NC-SA 4.0 |
| `python/lectures/week-9.html` | CS50P | https://cs50.harvard.edu/python/weeks/9/ | CC BY-NC-SA 4.0 |
| `sql/lectures/week-0.html` | CS50 SQL | https://cs50.harvard.edu/sql/notes/0/ | CC BY-NC-SA 4.0 |
| `sql/lectures/week-1.html` | CS50 SQL | https://cs50.harvard.edu/sql/notes/1/ | CC BY-NC-SA 4.0 |
| `sql/lectures/week-2.html` | CS50 SQL | https://cs50.harvard.edu/sql/notes/2/ | CC BY-NC-SA 4.0 |
| `sql/lectures/week-3.html` | CS50 SQL | https://cs50.harvard.edu/sql/notes/3/ | CC BY-NC-SA 4.0 |
| `sql/lectures/week-4.html` | CS50 SQL | https://cs50.harvard.edu/sql/notes/4/ | CC BY-NC-SA 4.0 |
| `sql/lectures/week-5.html` | CS50 SQL | https://cs50.harvard.edu/sql/notes/5/ | CC BY-NC-SA 4.0 |
| `sql/lectures/week-6.html` | CS50 SQL | https://cs50.harvard.edu/sql/notes/6/ | CC BY-NC-SA 4.0 |
| `web/lectures/week-0.html` | CS50 Web | https://cs50.harvard.edu/web/notes/0/ | CC BY-NC-SA 4.0 |
| `web/lectures/week-1.html` | CS50 Web | https://cs50.harvard.edu/web/notes/1/ | CC BY-NC-SA 4.0 |
| `web/lectures/week-2.html` | CS50 Web | https://cs50.harvard.edu/web/notes/2/ | CC BY-NC-SA 4.0 |
| `web/lectures/week-3.html` | CS50 Web | https://cs50.harvard.edu/web/notes/3/ | CC BY-NC-SA 4.0 |
| `web/lectures/week-4.html` | CS50 Web | https://cs50.harvard.edu/web/notes/4/ | CC BY-NC-SA 4.0 |
| `web/lectures/week-5.html` | CS50 Web | https://cs50.harvard.edu/web/notes/5/ | CC BY-NC-SA 4.0 |
| `web/lectures/week-6.html` | CS50 Web | https://cs50.harvard.edu/web/notes/6/ | CC BY-NC-SA 4.0 |
| `web/lectures/week-7.html` | CS50 Web | https://cs50.harvard.edu/web/notes/7/ | CC BY-NC-SA 4.0 |
| `web/lectures/week-8.html` | CS50 Web | https://cs50.harvard.edu/web/notes/8/ | CC BY-NC-SA 4.0 |

Барлығы: **45** лекция.

