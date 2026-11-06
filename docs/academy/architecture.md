# AO17 CS Universe: архитектура

© 2026 Sagid Mustafa. All Rights Reserved.

## Мақсат және шекара
AO17 CS Universe - қазақ тіліндегі бес деңгейлі информатика академиясы. Ол сайтта бұрыннан бар CS50 аудармаларынан **бөлек** тұрады: файлдары, идентификаторлары және авторлық есебі бөлек.

| | CS50 аудармалары (бұрыннан бар) | CS Universe (жаңа) |
|---|---|---|
| Бумасы | `lectures/`, `python/`, `sql/`, `ai/`, `web/` | `academy/` |
| Дереккөзі | Harvard CS50 материалының аудармасы (A санаты, CC BY-NC-SA) | AO17 үшін жаңадан жазылған (B санаты, All Rights Reserved) |
| ID | `week-N` | `ao17-foundation.mNN.lNN` |
| Мазмұн дерегі | HTML ішінде | `tools/academy/content/*.py` (құрылымдалған дерек) |

## Аудит нәтижесі (1-кезең)
- Сайт статикалық (GitHub Pages). Беттерді `tools/build.py` өңдейді: бас (`build:head`), навигация, футер, лицензия белгісі, sitemap, іздеу индексі.
- Python кодын браузерде орындау: `assets/js/main.js` → Pyodide (`pre[data-lang="python"]`). Академия мысалдары осы механизмді пайдаланады, сондықтан «▶ Іске қосу» батырмасы шын Python-ды іске қосады.
- Прогресс: `localStorage`, `cs50kz:` префиксі. `assets/js/profile.js` оны экспорттайды, ал `assets/js/ao.js` (жабық платформа) кірген оқушының прогресін `ao_progress` кестесіне синхрондайды. Академия кілті `cs50kz:academy` сол жүйеге өзі кіреді.
- Жабық платформа (`docs/PLATFORM.md`): `tools/gate.py` жабық беттерді Storage-қа шығарады, Pages-те тек қабық қалады. Академия сабақтары мен зертхана жабылады (курс `academy`), ал каталог (`academy/index.html`) пен білім картасы (`academy/map.html`) жария.
- Математика курсында (`math/`) KaTeX бар. Логика модулінде формулалар Unicode белгілерімен жазылады, KaTeX қажет емес.
- Дизайн токендері: `assets/css/style.css` (`--bg`, `--surface`, `--text`, `--accent` ...), қаріптер: Inter, PT Serif, JetBrains Mono (`assets/fonts`, лицензиясы тіркелген).

## Қозғалтқыштар
| Жүйе | Файл | Күйі |
|---|---|---|
| Curriculum Engine | `tools/academy/curriculum.py` | бар: 5 деңгей, Level I 12×10 жоспары, модуль алғышарттары |
| Lesson Rendering Engine | `tools/academy_build.py` → `academy/**.html` | бар: 14 бөлімді (A-N) сабақ беті |
| Schema validation | `tools/academy_build.py --check` | бар: міндетті өрістер, түрлер, ID, алғышарттар, бірегейлік |
| Mathematics Engine (логика) | `assets/js/academy-logic.js` | бар: парсер, кесте, эквиваленттік, жіктеу, ДҚФ/КҚФ, аргумент |
| Тәуелсіз тексеруші | `tools/academy/plogic.py` | бар: кілттерді JS-тен бөлек есептейді |
| AO17 Judge (Python) | `assets/py/ao_judge.py` (бір файл: браузерде Pyodide, build-те CPython) + `academy.js` (`pyJudge`) | бар: функция және енгізу/шығару тесттері (АШЫҚ), қадам шегі (settrace, 200 000 жол), Traceback-ті қазақша диагностика, жол нөмірі; эталон шешімдер build кезінде дәл осы файлмен тексеріледі; `trace_calls` - рекурсия ағашы (Code X-Ray), `suffix` - оқушы кодынан кейінгі драйвер (екі рет шақыру, жанама әсерді тексеру), `files` - тест алдында уақытша бумадағы файлдар, `judge_tests` - мутациялық тестілеу, `trace_sort` - Algorithm Arena (нақты орындау: салыстырулар мен жазулар) |
| Екілік жүйе қозғалтқышы | `assets/js/academy-bits.js` + `tools/academy/pbits.py` | бар: 2-36 негіздер (BigInt), қосымша код және асып кету, IEEE 754 float32, UTF-8, жұптық бит, биттік өрнектер (C басымдығы), RLE, Python іске қосу (Pyodide), рекурсия ағашы (нақты шақырулар) |
| Псевдокод интерпретаторы (Code X-Ray 1-қадамы) | `assets/js/academy-pseudo.js` + `tools/academy/ppseudo.py` | бар: AO17 оқу псевдокоды, қадамдық трасса, жол санағыштары; екі іске асыру нәтиже, шығыс, санағыш және қадам саны бойынша салыстырылады |
| Дискретті құрылымдар қозғалтқышы | `assets/js/academy-disc.js` + `tools/academy/pdisc.py` | бар: жиын өрнектері, тепе-теңдік (логикаға аудару арқылы дәл), қатынас қасиеттері мен кластары, функция түрі, граф (дәреже, компонент, ағаш) |
| Арифметика қозғалтқышы | `assets/js/academy-arith.js` + `tools/academy/parith.py` | бар: n, a айнымалылы өрнектер, дәл рационал сандар (BigInt/Fraction), қарсы мысал, жабық формула, рекуррент |
| Interactive Visualization | `assets/js/academy.js` (`lab()`) | бар: кесте, эквиваленттік, аргумент, ағаш, ДҚФ/КҚФ, кванторлар, қарсы мысал іздеу, индукция кестесі, рекуррент, Венн (2-3 жиын), қатынас матрицасы, функция сызбасы, граф, псевдокод трассасы (қадамдап), өсу жылдамдығы графигі, санау жүйесі, бит панелі, UTF-8 байттары, IEEE 754 биттері, RLE, Algorithm Arena (сұрыптаудың нақты қадамдары) |
| Assessment Engine | `assets/js/academy.js` (`renderExercise`) | бар: mc, value, truthtable, classify, formula, argument, number |
| Smart Hint Engine | әр тапсырмада `hints` (1-3 деңгей) | бар (ережеге негізделген, AI емес) |
| Rule-based feedback | `checkFormula`, қарсы мысал | бар: қай шектеу бұзылды, қай бағалауда айырмашылық |
| Progress / Mastery | `cs50kz:academy` v1 | бар: тапсырма күйі, меңгеру, рефлексия, экспорт/импорт |
| Spaced Repetition | `INTERVALS = [2, 7, 21, 60]` күн | бар (қарапайым) |
| Recommendation | басты беттегі «Келесі ұсыныс» | бар: ретімен бірінші меңгерілмеген сабақ |
| Knowledge Graph | `academy/map.html` | бар: модульдер, алғышарт байланысы, жеке күй |
| C (build кезінде gcc: мысалдар, `cshow`, `coutput`) | `tools/academy_build.py` (`run_c`, `c_check`) | бар: -std=c11 -Wall -Wextra -Werror, stdin, аргументтер, шығу коды, UBSan/ASan/LSan хабарлары |
| Жергілікті Python мысалдары (`python-local`) | `tools/academy_build.py` | бар: subprocess/gcc/git қолданатын мысалдар build кезінде CPython-да орындалады; браузерде іске қосу батырмасы жоқ |
| AO17 Viz (оқушы басқаратын модельдер) | `assets/js/ao-viz.js`, `assets/css/ao-viz.css`, `tools/academy/viz_map.py` | бар (1-кезең): ортақ ойнатқыш (ойнату/тоқтату, қадам алға/артқа, басынан, жылдамдық 0.25-4×, жылжытқыш, параметрлер, қазақша түсіндірме, пернетақта, қозғалыс азайту) + 7 модель: граф (BFS/DFS/Дейкстра), Code X-Ray (нағыз Python, `ao_judge.trace_lines`), оқу процессоры (Virtual Computer), C жады (стек/үйме/көрсеткіш - модель), функция түрлендірулері, градиенттік түсу, нейрон желі (нағыз backprop). Галерея: `academy/models.html` (жария). **2-кезең** (`assets/js/ao-viz2.js`): сұрыптау (5 алгоритм), BST, үйме, хэш-кесте, матрица түрлендіруі, үлкен сандар заңы, логикалық схема (қосқыштар, мультиплексор), шешім ағашы (Gini), k-means, сызықтық регрессия, процесс жоспарлау (FCFS/SJF/RR), TCP (қол алысу, қайта жіберу), компилятор (лексер → шунт алгоритмі → стек машинасы) - барлығы 20 модель. `tools/viz_links.py` (build-тің ЕҢ БАСЫНДА, іздеу индексінен бұрын) 28 курс лекциясының ішіне (CS50x, CS50P, C++, Java, AI, Математика) 40 модельді тікелей кірістіреді: әрқайсысы сол лекцияның тақырыбына баптаған кіріс пен үш сұрақпен («Неге? Қалай? Егер өзгертсек?»). Атрибут - `data-aov` (математика курсының өз `data-viz` жүйесімен қақтығыспау үшін) |
| Браузердегі C, C Playground, серверлік Judge, Certification | - | **әлі жоқ** (docs/academy/next-steps.md) |

## Сабақ деректерінің моделі
Әр сабақ - Python сөздігі (`tools/academy/content/mNN_*.py`). Міндетті өрістер (`REQUIRED`, `tools/academy_build.py`):
`id, courseId, moduleId, slug, title, language, academicLevel, difficulty, minutes, objectives, prerequisites, concept, theory, visual, derivation, examples, experiment, exercises, reasoning, mistakes, assessment, reflection, further{honors, research}, references, license, authorship, reviewStatus, version`.

Қосымша: `project` (модуль жобасы). `theory[].kind` ∈ {definition, theorem, proof, note}, кемінде бір `proof` міндетті.

### Тапсырма түрлері
| Түр | Кілт қайдан | Тексеру |
|---|---|---|
| `mc` | `answer` индексі, әр нұсқаға `why` | таңдау |
| `value` | формуладан **есептеледі** | 0/1 |
| `truthtable` | формуладан есептеледі | әр жол бөлек, қате жолдар белгіленеді |
| `classify` | формуладан есептеледі | тавтология / қайшылық / бейтарап |
| `argument` | алғышарт пен қорытындыдан есептеледі | дұрыс/дұрыс емес + қарсы мысал |
| `formula` | `target`-ке эквиваленттік + шектеулер (`allowed`, `noNegatedGroups`, `maxLength`, `form`, `nandOnly`, `requireVars`) | кез келген эквивалент жауап қабылданады |
| `number` | `answer` (+ `check` - тексерушіде есептелетін өрнек) | сан |
| `order` | `steps` (дұрыс рет) | дәлелдеу қадамдарын ретке қою; араластыру детерминистік және ешқашан дұрыс ретпен сәйкес келмейді |
| `counterexample` | өрнек + қасиет + облыстан **есептеледі** | оқушы енгізген n тұжырымды бұза ма |
| `closedform` | Σ f(i)-мен n = start..start+29 салыстыру | кез келген тең формула қабылданады |
| `pycode` | AO17 Judge, ашық тесттер | оқушы Python коды; әр тест: аргументтер/күтілгені/алынғаны не қате түрі + кеңес |
| `pytests` | AO17 Judge `judge_tests`: дұрыс іске асыру + мутанттар | оқушы тест жазады; тесттер дұрыс кодта өтіп, әр мутантты ұстауы керек |
| `coutput` | build кезінде gcc шығысы | оқушы C бағдарламасының шығысын болжайды; бірінші айырмашылық жолы айтылады |
| `convert` | санау жүйесін аудару - есептеледі | бастағы нөлдер, регистр еленбейді |
| `encode` | twos / utf8 / parity / float32 / rle - есептеледі | ұзындық қатесі бөлек айтылады |
| `bitop` | биттік өрнек (ені берілген) - есептеледі | ондық, 0b, 0x жауап қабылданады |
| `trace` | бағдарламаны орындаудан есептеледі | return/print/айнымалы мәні |
| `count` | жол санағышынан есептеледі | жол неше рет орындалады (цикл тақырыбы: итерация + 1) |
| `setexpr` | жиындар мен өрнектен есептеледі | оқушы жазған жиын; артық/жетіспейтін элементтер айтылады |
| `setid` | мүшелік формулаларының эквиваленттігі (AOLogic) | кез келген тепе-тең өрнек; тең болмаса қарсы мысал аймағы |
| `props` | қатынастан есептеледі | 4 қасиетті белгілеу |
| `func` | жұптардан есептеледі | функция емес / инъекция / сюръекция / биекция |
| `recurrence` | a(start), ереже → тізбек, n = start..start+29 | сол сияқты |

Кілттердің көбі сақталмайды, қозғалтқышпен есептеледі. `formula` тапсырмасында эталон `solution` бар: тексеруші оны мақсатпен салыстырып, шектеулерге сай екенін дәлелдейді.

## Тексеру тізбегі
1. `python3 tools/academy_build.py --check`: схема, ID, оқу картасымен сәйкестік, тапсырмалардың шешімділігі, Python мысалдарын **шын іске қосып** шығысын салыстыру, сұрақ пен мәтіннің қайталанбауы.
2. `node tests/academy/logic.test.js`: қозғалтқыштың бекітілген мысалдары мен қасиетке негізделген тесттері (кездейсоқ 300 формула × 8 заң).
3. `node tests/academy/keys.test.js`: Python мен JS кілттері бірдей ме; эталон шешімді JS тексерушісі қабылдай ма; мақсаттың өзі шектеуден өтпей ме.
4. `python3 tools/build.py`: беттер мен `docs/academy/curriculum.md`, `docs/academy/status.json`.
5. `python3 tools/gate.py build`: академия сабақтары жария нұсқада тек қабық болып тұр ма.

## Шектеулер (адал сипаттама)
- Тексеру браузерде өтеді. GitHub Pages-те клиентке жеткен кілтті толық жасыру мүмкін емес. Жабық платформа беттің өзін рұқсатсыз адамнан жасырады, бірақ рұқсаты бар оқушы бет кодын оқи алады. Сондықтан бұл - **оқу тексерісі**, емтихан емес. Құпия тесттер серверлік тексеруді талап етеді (жоспарда).
- Еркін мәтінді дәлелдеу (Proof Construction) автоматты бағаланбайды. Модуль жобасы мұғалім рубрикасымен бағаланады.
- Логика қозғалтқышы 12 айнымалыға дейін толық кесте құрады. Бұл - нақты есептеу, әмбебап теорема дәлелдеуші емес.
- `closedform`/`recurrence` формуланы 30 мәнде тексереді. Бұл - сандық тексеріс, дәлелдеу емес. Интерфейс мұны оқушыға айтады және индукциямен дәлелдеуді ұсынады.

## Үш академия: ортақ архитектура (2026-11, 1-пакет)

### Алаш дизайнын қорғау
- Эталон: commit `6933393` (git тег `alash-design-baseline-2026-11` жергілікті; прокси тегті жібермейді, сондықтан хэш негізгі сілтеме).
- Визуал регрессия: `tests/e2e/visual-alash.spec.js` - 8 бет × (ашық, қараңғы) × (1280, 390) = 32 сурет, `tests/e2e/visual-alash.spec.js-snapshots/`. Іске қосу: `cd tests && VISUAL=1 npx playwright test visual-alash`. Шрифт пен ОЖ-ге тәуелді болғандықтан CI-де әдепкі бойынша өткізіледі; эталон тек келісілген дизайн өзгерісінде `--update-snapshots` арқылы жаңартылады.
- Жаңа академиялар жаңа стиль ойлап таппайды: `academy.css` токендері (орман жасылы, бургунди, көне алтын, піл сүйегі, PT Serif) және `assets/css/ao-labs.css` ортақ компоненттері (зертхана жақтауы, «түнгі тақта» сахнасы, формула, слайдерлер, таңдау батырмалары, мәтін белгілеу, таймер, редактор, Tutor).

### Ортақ қозғалтқыштар (бар / жаңа / жоспар)
| Компонент | Күйі | Қайда |
|---|---|---|
| Lesson Engine (сабақ схемасы, 14 бөлім, build-тексеру) | бар | `tools/academy_build.py`, `tools/academy/content/*` |
| Exercise Engine (mc, number, formula, pycode, C ...) | бар | `assets/js/academy.js`, `assets/py/ao_judge.py` |
| Animation Engine (кино-түсіндіру; AO17 Viz модельдері) | бар | `assets/js/academy-cine.js`, `ao-viz*.js` |
| Smart Tutor: Mastery, 3 деңгейлі көмек, қателер дәптері, Лейтнер қайталауы, экспорт/импорт | **жаңа** | `assets/js/ao-tutor.js`, тест `tests/academy/tutor.test.js` |
| Student Dashboard «Менің оқуым» | **жаңа** | `academy/study.html` (`study_html`), `assets/js/ao-study.js` |
| Lab UI компоненттері | **жаңа** | `assets/css/ao-labs.css` |
| Exam Engine (SAT симуляторы) | **жаңа** | `academy/sat/exam.html` |
| Knowledge Graph | бар (CS Universe алғышарттары, `academy/map.html`); IELTS/SAT үшін жоспар | |
| Teacher Dashboard | бар (Supabase, `teacher.html`); IELTS эссесі мен Speaking жазбасын серверде тексеру - backend керек | |
| Content Registry / Validation | бар (CS Universe: build тексеруі); IELTS/SAT банктері үшін жоспар | |

Tutor келісімі: әр зертхана тексерілген жауаптан кейін `AO17Tutor.record(skillId, {item, ok, hints, error, note, title, url})` шақырады; skill id префиксі академияны білдіреді (`cs.`, `ielts.`, `sat.`). Меңгеру ережесі: соңғы 3 әрекет көмексіз дұрыс және дәлдік ≥ 80%. 3-көмек (толық шешім) ашылса - зертхана жаңа есеп береді.

### Командалар және жұмыс пакеттері (1-пакет)
Әр пакет тек өз файлдарында жұмыс істейді; ортақ файлдарды (build, nav, sw, лицензия) интегратор өзгертеді.
- **Core Architecture + Alash Design System + Learning Science** (интегратор): визуал эталон, `ao-tutor.js`, `ao-labs.css`, «Менің оқуым», build/gate/лицензия интеграциясы, жариялау ережесі.
- **SAT Curriculum & Practice**: `academy/sat/*`, `assets/js/sat-*.js`, `assets/data/sat-*.js`, `tests/e2e/sat.spec.js`.
- **IELTS Curriculum & Practice**: `academy/ielts/*`, `assets/js/ielts-*.js`, `assets/data/ielts-*.js`, `tests/e2e/ielts.spec.js`.
- **CS Universe Labs & Animation**: `academy/labs/*`, `assets/js/cslab-*.js`, `tests/e2e/cslabs.spec.js`.
Қабылдау талаптары (барлығына): Алаш токендері, 360px жылжусыз, axe (wcag2a/aa) serious/critical = 0 екі режимде, пернетақта, reduced motion, түпнұсқа мазмұн, әр қатеге себеп, көмексіз жаңа есеппен меңгеру, e2e тест.

### Мазмұн фабрикасы: күйлер
Curriculum → Lesson Specification → Content Draft → Academic Review → Animation Storyboard → Implementation → Exercises → Tests → Publishing.
- **Draft** = `reviewStatus: "draft"`: build тексереді, бірақ **жарияламайды** (`academy_build.build`).
- **Reviewed** = `author-checked` (автор тексерді) не `peer-reviewed` (екінші адам тексерді).
- **Published** = Reviewed + build тексеруінен (схема, кілттер, код мысалдары, сценарий) өткен сабақ.

### Backend қажет ететін функциялар (GitHub Pages-те жоқ)
Мұғалімнің IELTS эссесі мен Speaking жазбасын қашықтан тексеруі (файлды серверде сақтау), сыныптар арасында прогресті синхрондау (қазір Supabase арқылы тек CS Universe сабақ прогресі), құпия тесттері бар Judge, сертификат беру. Ақылы қызмет міндетті тәуелділік ретінде қосылмайды; Supabase-тің тегін деңгейі - қосымша.
