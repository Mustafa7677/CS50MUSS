# © 2026 Sagid Mustafa. All Rights Reserved.
# AO17 Digital SAT оқулығы · Reading & Writing · Craft and Structure · Words in Context. Авторлық мазмұн.
def _f(x):
    if isinstance(x, str):
        return x.replace("[[", '<span class="gd-en">').replace("]]", "</span>")
    if isinstance(x, list):
        return [_f(i) for i in x]
    if isinstance(x, dict):
        return {k: _f(v) for k, v in x.items()}
    return x


Q = "Which choice completes the text with the most logical and precise word or phrase?"
QM = "As used in the text, what does the underlined word most nearly mean?"

LESSON = _f({
    "id": "sat.rw.words-in-context",
    "title": "Words in Context: сөзді мәтін таңдайды",
    "section": "Reading & Writing · Craft and Structure",
    "minutes": 35, "level": "негіз",
    "goals": [
        "Бос орынға сөзді нұсқалардан емес, мәтіндегі кілт сөздерден (clue) шығарып таңдау.",
        "Бағыт сөздері (but, although, because, indeed) арқылы керек сөздің мағынасы мен «таңбасын» анықтау.",
        "Таныс сөздің мәтіндегі сирек мағынасын және реңкін (connotation) ажырату.",
    ],
    "hook": {
        "text": "<p>Мына сөйлемге қараңыз: [[Although the first reviews of the novel were ______, it later became one of the most admired books of the decade.]] "
                "Сіз бос орындағы сөзді білмейсіз, нұсқаларды да көрмедіңіз. Соған қарамастан сол сөздің қандай болатынын айта аласыз. "
                "Себебі SAT-та сөзді сіз емес, <b>мәтін</b> таңдайды - сіздің жұмысыңыз мәтіннің не талап ететінін оқу ғана.</p>",
        "predict": {"q": "Бос орындағы сөз қандай мағынада болуы керек?", "options": ["Жағымды (мақтау)", "Жағымсыз (сын)", "Анықтау мүмкін емес"], "answer": 1,
                    "why": "«Although» қарама-қарсылықты білдіреді: кейін кітап өте жоғары бағаланды, демек алғашқы пікірлер керісінше - жағымсыз болған (мысалы, harsh, dismissive). Нұсқаларды көрмей-ақ сөздің бағытын таптық."},
    },
    "explain": [
        {"h": "1. Сұрақтың екі түрі",
         "body": "<table><tr><th>Түрі</th><th>Stem</th><th>Не істейсіз</th></tr>"
                 "<tr><td>Бос орын (жиі)</td><td>[[most logical and precise word or phrase]]</td><td>мәтінге ең дәл келетін сөзді таңдайсыз</td></tr>"
                 "<tr><td>Асты сызылған сөз</td><td>[[As used in the text, what does the word ... most nearly mean?]]</td><td>сөздің <b>осы мәтіндегі</b> мағынасын табасыз</td></tr></table>"
                 "<p>Екеуінде де бір қағида: жауап сөздікте емес, мәтінде. Модуль осы сұрақтардан басталады, сондықтан олар жылдам ұпай көзі.</p>"},
        {"h": "2. Clue: мәтін жауапты өзі айтады",
         "body": "<p>Әр мәтінде бос орынның мағынасын қайталайтын не оған қарсы тұратын <b>кілт сөз (clue)</b> бар. Оны тауып, бос орынға өз сөзіңізді қойыңыз.</p>"
                 "<p class=\"gd-fx\">[[The committee's decision was ______: every single member voted in favor.]]</p>"
                 "<p>Қос нүктеден кейінгі бөлік - түсіндірме: «әр мүше жақтап дауыс берді». Демек шешім - «бірауызды». Өз сөзіміз дайын, енді нұсқадан соған сайын іздейміз: [[unanimous]].</p>"
                 "<p>Clue қайда жасырынады: қос нүктеден не сызықшадан кейін, [[because]] бөлігінде, келесі сөйлемдегі мысалда.</p>"},
        {"h": "3. Бағыт сөздері: сол жаққа ма, кері ме",
         "body": "<p>Clue табылған соң бір сұрақ қалады: бос орын clue-мен <b>бірдей</b> ме, әлде <b>қарама-қарсы</b> ма? Оны бағыт сөздері айтады.</p>"
                 "<table><tr><th>Бағыт</th><th>Сигнал сөздер</th><th>Бос орын</th></tr>"
                 "<tr><td>Сол бағыт (=)</td><td>[[and, indeed, in fact, because, so, since, similarly]], қос нүкте</td><td>clue-мен мағыналас</td></tr>"
                 "<tr><td>Кері бағыт (≠)</td><td>[[but, although, however, despite, while, yet, rather than, unlike]]</td><td>clue-ге қарама-қарсы</td></tr></table>"
                 "<p>Мысал: [[Despite its ______ appearance, the device contains thousands of intricate parts.]] [[Despite]] - кері бағыт; clue - [[intricate]] (күрделі). Демек сыртқы түрі - «қарапайым»: [[simple, plain]].</p>"},
        {"h": "4. Дәлдік және реңк",
         "body": "<p>Stem-де [[precise]] (дәл) деген сөз бекер тұрған жоқ. Екі нұсқа бағыты бойынша келуі мүмкін, бірақ біреуі ғана <b>дәл</b>.</p>"
                 "<table><tr><th>Тексеру</th><th>Сұрақ</th><th>Мысал</th></tr>"
                 "<tr><td>Реңк (+ / −)</td><td>Мәтін мақтай ма, сынай ма, бейтарап па?</td><td>[[thrifty]] (+, үнемшіл) / [[stingy]] (−, сараң)</td></tr>"
                 "<tr><td>Дәреже</td><td>Мәтін қаншалықты күшті айтады?</td><td>[[dislike]] &lt; [[detest]]</td></tr>"
                 "<tr><td>Тіркесім</td><td>Сөз осы зат туралы айтыла ма?</td><td>[[a compelling argument]] - иә; [[a compelling temperature]] - жоқ</td></tr></table>"
                 "<p>Ғылыми мәтінде бейтарап сөз дұрыс болады: зерттеушілер бір нәрсені [[suggest, indicate]] етеді, сирек [[prove]] етеді.</p>"},
        {"h": "5. Таныс сөздің бейтаныс мағынасы",
         "body": "<p>Асты сызылған сөз сұрағында SAT оңай сөзді алады да, оның <b>екінші мағынасын</b> қолданады. Бірінші ойға келген аударма - әдетте қақпан.</p>"
                 "<table><tr><th>Сөз</th><th>Үйреншікті мағына</th><th>Мәтіндегі басқа мағына</th></tr>"
                 "<tr><td>[[plain]]</td><td>қарапайым</td><td>анық, айқын ([[plain truth]])</td></tr>"
                 "<tr><td>[[reserved]]</td><td>броньдалған</td><td>ұстамды, көп сөйлемейтін</td></tr>"
                 "<tr><td>[[grave]]</td><td>қабір</td><td>өте байсалды, ауыр ([[grave concern]])</td></tr>"
                 "<tr><td>[[novel]]</td><td>роман</td><td>жаңа, бұрын болмаған ([[a novel approach]])</td></tr>"
                 "<tr><td>[[yield]]</td><td>жол беру</td><td>нәтиже, өнім беру ([[yield results]])</td></tr>"
                 "<tr><td>[[sound]]</td><td>дыбыс</td><td>негізді, сенімді ([[sound reasoning]])</td></tr></table>"
                 "<p>Тәсіл: сөзді қолмен жауып, орнына өз сөзіңізді қойыңыз, сосын нұсқаларды орнына қойып сөйлемді қайта оқыңыз.</p>"},
        {"h": "6. Сөзді білмесеңіз",
         "body": "<ul><li>Алдымен білетін нұсқаларды тексеріңіз. Олар сәйкес келмесе - қалған бейтаныс сөз дұрыс болуы мүмкін.</li>"
                 "<li>Сөздің бөлшектеріне қараңыз: [[un-, in-, dis-]] (жоққа шығару), [[re-]] (қайта), [[-less]] (жоқ), [[bene-]] (жақсы), [[mal-]] (жаман).</li>"
                 "<li>«Күрделі көрінетін сөз - дұрыс» деген ереже жоқ. Қарапайым сөз де жиі дұрыс.</li></ul>"},
    ],
    "method": {"title": "Емтихандағы әдіс: «Жап - Тап - Қой - Салыстыр»", "steps": [
        {"name": "Жап", "text": "Нұсқаларға қарамаңыз (не асты сызылған сөзді ойша жабыңыз). Мәтінді бос орынмен бірге оқыңыз."},
        {"name": "Тап", "text": "Clue-ді және бағыт сөзін табыңыз: бос орын clue-мен бірдей ме (=), кері ме (≠)?"},
        {"name": "Қой", "text": "Бос орынға өз қарапайым сөзіңізді қойыңыз (қазақша да жарайды) және оның реңкін белгілеңіз: +, − не бейтарап."},
        {"name": "Салыстыр", "text": "Өз сөзіңізге мағынасы, реңкі және дәрежесі сай нұсқаны таңдаңыз. Оны орнына қойып, сөйлемді қайта оқыңыз."},
    ]},
    "worked": [
        {"task": "<div class=\"gd-pass\"><p>Marine biologist Dana Okafor (a hypothetical researcher) expected the reef survey to confirm earlier reports of decline. Instead, the results were ______: coral cover had increased in nearly every area her team examined.</p></div>"
                 "<p>" + Q + "</p><p>A) predictable<br>B) encouraging<br>C) ambiguous<br>D) alarming</p>",
         "steps": ["<b>Жап:</b> нұсқаларды қарамаймыз. Бос орын - «нәтижелер қандай болды?»",
                   "<b>Тап:</b> clue - қос нүктеден кейін: «маржан жамылғысы барлық дерлік аймақта өскен» (жақсы жаңалық). [[Instead]] - күткенге (құлдырау) кері.",
                   "<b>Қой:</b> өз сөзіміз - «қуанарлық, үміт беретін», реңкі +.",
                   "<b>Салыстыр:</b> B [[encouraging]] дәл келеді. A [[predictable]] - керісінше, нәтиже күткендей болмады ([[Instead]]). C [[ambiguous]] - нәтиже анық: «барлық дерлік аймақта». D [[alarming]] - реңкі −, ал жаңалық жақсы."],
         "answer": "B) encouraging", "trap": "D нұсқасы тақырыпқа (рифтің жағдайы, decline) «жақын» естіледі. Тақырыпқа емес, clue-ге қараңыз."},
        {"task": "<div class=\"gd-pass\"><p>The architect's proposal was praised less for its beauty than for its <u>economy</u>: the building used half the steel of a conventional design while providing the same floor space.</p></div>"
                 "<p>" + QM + "</p><p>A) wealth<br>B) financial system<br>C) efficient use of resources<br>D) low quality</p>",
         "steps": ["<b>Жап:</b> [[economy]] сөзін жабамыз. Бірінші ойға келетін «экономика» мағынасына сенбейміз.",
                   "<b>Тап:</b> clue - қос нүктеден кейін: «болаттың жартысын ғана жұмсап, сондай аудан берді».",
                   "<b>Қой:</b> өз сөзіміз - «үнемділік, аз жұмсап көп алу», реңкі + ([[praised]]).",
                   "<b>Салыстыр:</b> C дәл. A мен B - сөздің басқа, үйреншікті мағыналары, сөйлемге қойсақ мағына шықпайды. D - реңкі −, ал жоба мақталған."],
         "answer": "C) efficient use of resources", "trap": "Сөздің ең танымал мағынасы (B) әдейі нұсқаға қойылады. Әрқашан нұсқаны сөйлемге қайта қойып оқыңыз."},
        {"task": "<div class=\"gd-pass\"><p>Historians once viewed the trade route as a minor path used by a few merchants. Recent excavations, however, have ______ this view: the remains of large warehouses suggest that goods moved along the route in enormous quantities.</p></div>"
                 "<p>" + Q + "</p><p>A) reinforced<br>B) ignored<br>C) undermined<br>D) invented</p>",
         "steps": ["<b>Тап:</b> [[however]] - кері бағыт. Ескі көзқарас: «шағын жол». Жаңа дерек: «үлкен қоймалар, орасан көлем».",
                   "<b>Қой:</b> қазбалар ескі көзқарасты «әлсіретті, күмән келтірді».",
                   "<b>Салыстыр:</b> C [[undermined]] - «негізін шайқалтты», дәл келеді.",
                   "A [[reinforced]] - кері мағына ([[however]]-ге қайшы). B [[ignored]] - қазба бір нәрсені «елемеуі» мүмкін емес (тіркесім қате). D [[invented]] - көзқарас бұрыннан бар, оны қазба ойлап тапқан жоқ."],
         "answer": "C) undermined", "trap": "A нұсқасы - бағыт сөзін (however) байқамай оқығандарға арналған. Әр мәтінде бағыт сөзін дөңгелектеп белгілеңіз."},
    ],
    "traps": [
        {"wrong": "Алдымен нұсқаларды оқып, әрқайсысын бос орынға қойып көру.", "why": "Төрт сөздің бәрі де «естілуі дұрыс» сияқты көрінеді; мәтінсіз таңдау - лотерея.", "fix": "Алдымен өз сөзіңізді қойыңыз, сосын ғана нұсқаларды оқыңыз."},
        {"wrong": "Бағыт сөзін (but, although, despite) байқамай өткізу.", "why": "Сонда clue-мен мағыналас сөзді таңдайсыз, ал керегі - қарама-қарсысы.", "fix": "Мәтінді оқығанда бағыт сөздерін бірінші іздеңіз және = не ≠ белгісін қойыңыз."},
        {"wrong": "Тақырыпқа жақын сөзді таңдау (теңіз туралы мәтінге «deep» сияқты).", "why": "Нұсқа тақырыпқа емес, бос орынның сөйлемдегі қызметіне сай болуы керек.", "fix": "Нұсқаны орнына қойып, сөйлемді басынан аяғына дейін қайта оқыңыз."},
        {"wrong": "Асты сызылған сөздің сөздіктегі бірінші мағынасын таңдау.", "why": "SAT дәл сол сөздің екінші, сирек мағынасын тексереді.", "fix": "Сөзді жауып, мәтіннен өз синониміңізді шығарыңыз."},
    ],
    "practice": [
        {"type": "mc", "q": Q,
         "passage": "<p>The inventor's first prototype was far from ______: it overheated within minutes and had to be rebuilt three times before it worked.</p>",
         "options": ["flawless", "expensive", "original", "forgotten"], "answer": 0,
         "why": ["Дұрыс: clue - «қызып кетті, үш рет қайта жасалды», яғни кемшілігі көп. «far from flawless» = мінсіз болудан алыс.",
                 "Бағасы туралы мәтінде ештеңе жоқ.",
                 "Clue жаңашылдық туралы емес, ақаулар туралы.",
                 "Прототиптің ұмытылғаны айтылмаған; қос нүктеден кейінгі түсіндірме ақаулар туралы."],
         "hints": ["Қос нүктеден кейінгі бөлік бос орынды түсіндіреді.", "Ұқсас: «The plan was far from simple: it had twelve stages» - far from + clue-ге қарама-қарсы сөз.", "Clue: overheated, rebuilt three times = ақауы көп. «far from ___» = «___ болудан алыс», демек бос орында «мінсіз» - flawless."]},
        {"type": "mc", "q": Q,
         "passage": "<p>Although the two poets are often grouped together, their styles are quite ______: one favors long, flowing sentences, while the other writes in short, abrupt fragments.</p>",
         "options": ["similar", "distinct", "popular", "outdated"], "answer": 1,
         "why": ["«Although» кері бағыт береді: бірге аталғанымен, стильдері ұқсас емес.",
                 "Дұрыс: clue - «біреуі ұзын сөйлем, екіншісі қысқа үзінді», яғни стильдері бөлек, әртүрлі.",
                 "Танымалдығы туралы clue жоқ.",
                 "Ескіргені туралы мәтін айтпайды."],
         "hints": ["«Although» қай бағытты көрсетеді?", "Ұқсас: «Although the twins look alike, their personalities are different.»", "Although (≠) + clue «one ... while the other ...» = айырмашылық. Керек сөз - «әртүрлі»: distinct."]},
        {"type": "mc", "q": QM,
         "passage": "<p>The engineer offered a <u>novel</u> solution to the flooding problem: instead of building higher walls, she proposed letting certain fields flood on purpose.</p>",
         "options": ["fictional", "lengthy", "new and unusual", "traditional"], "answer": 2,
         "why": ["«novel» - роман деген мағынадан шыққан қақпан; шешім ойдан шығарылған емес, нақты ұсыныс.",
                 "Ұзақтығы туралы мәтінде ештеңе жоқ.",
                 "Дұрыс: clue - «биік қабырғаның орнына егістікті әдейі су бастыру», яғни бұрын қолданылмаған тәсіл.",
                 "Кері мағына: дәстүрлі шешім - қабырға салу, ал ол одан бас тартты."],
         "hints": ["Қос нүктеден кейін шешімнің қандай екені сипатталған.", "Ұқсас: «a novel idea» = жаңа идея, роман емес.", "Clue: «instead of building higher walls» - әдеттегіден өзгеше. novel = new and unusual."]},
        {"type": "mc", "q": Q,
         "passage": "<p>In a hypothetical study of office workers, psychologist Lena Marsh found that brief walks did not merely maintain concentration; they actually ______ it, with participants scoring higher on attention tests after walking.</p>",
         "options": ["measured", "enhanced", "preserved", "disrupted"], "answer": 1,
         "why": ["Серуен зейінді «өлшемейді»; өлшеген - тесттер.",
                 "Дұрыс: «did not merely maintain ... actually» - сақтап қана қоймай, одан да артық: clue - «жоғары ұпай жинады». Демек «жақсартты».",
                 "preserved = maintain; ал мәтін «тек сақтаған жоқ» дейді - одан күштірек сөз керек.",
                 "Кері мағына: ұпай өскен, зейін бұзылған жоқ."],
         "hints": ["«not merely X; actually Y» құрылымында Y X-тен күштірек.", "Ұқсас: «She did not merely pass the exam; she actually excelled.»", "maintain (сақтау) → одан күшті сөз керек. Clue: scoring higher. Жауап: enhanced (күшейтті)."]},
        {"type": "mc", "q": Q,
         "passage": "<p>The mayor's speech was notably ______: rather than promising quick results, she warned that the repairs would take years and might exceed the budget.</p>",
         "options": ["candid", "optimistic", "vague", "humorous"], "answer": 0,
         "why": ["Дұрыс: clue - жылдам нәтиже уәде етпей, қиындықты ашық ескертті. candid = ашық, шынын айтатын.",
                 "Кері мағына: «rather than promising quick results» оптимизмді жоққа шығарады.",
                 "Сөзі нақты: «жылдар кетеді, бюджеттен асуы мүмкін» - бұлыңғыр емес.",
                 "Әзіл туралы clue жоқ."],
         "hints": ["«rather than» - кері бағыт: ол не істемеді, ал не істеді?", "Ұқсас: «He was frank: rather than hiding the error, he admitted it.»", "Ол жағымсыз шындықты жасырмай айтты → «ашық, шыншыл» = candid."]},
        {"type": "gap", "q": "Бағыт сөзін жазыңыз (бір сөз, ағылшынша): «___ the trail was steep, the hikers reached the summit before noon.» Екі бөлік бір-біріне қарсы мағынада.",
         "accept": ["Although", "Though", "While"], "explain": "Жол тік болды (кедергі), бірақ олар ерте жетті - қарама-қарсылық. Сөйлем басындағы кері бағыт сөзі: Although (Though, While да келеді).",
         "errors": {"Because": "Because себепті білдіреді: «жол тік болғандықтан ерте жетті» - қисынсыз.", "Despite": "Despite-тан кейін толық сөйлем емес, зат есім келеді: «Despite the steep trail, ...».", "But": "But екі сөйлемнің ортасында тұрады, басында бағыныңқы сөйлемді бастамайды."},
         "hints": ["Екі бөлік мағынасы жағынан бірдей бағытта ма, кері ме?", "Ұқсас: «Although it rained, the match continued.»", "Тік жол ≠ ерте жету → кері бағыт. Толық сөйлемнің алдында тұратын сөз: Although."]},
    ],
    "mastery": [
        {"type": "mc", "q": Q,
         "passage": "<p>Critics who expected the director's new film to be as loud and fast-paced as her earlier work were surprised by its ______ tone: long silences, slow camera movements, and almost no music.</p>",
         "options": ["frantic", "subdued", "familiar", "comic"], "answer": 1,
         "why": ["Кері мағына: frantic = қарбалас; сыншылар дәл соны күткен, бірақ таңғалды.",
                 "Дұрыс: clue - ұзақ үнсіздік, баяу қозғалыс, музыкасыз. subdued = бәсең, сабырлы.",
                 "Сыншылар таңғалды, демек тон таныс емес.",
                 "Күлкілі екені туралы clue жоқ."]},
        {"type": "mc", "q": QM,
         "passage": "<p>The reviewers found no errors in the calculations and concluded that the study's reasoning was <u>sound</u>.</p>",
         "options": ["noisy", "reliable", "brief", "complicated"], "answer": 1,
         "why": ["«sound» - дыбыс мағынасынан шыққан қақпан; пайымдау шулы бола алмайды.",
                 "Дұрыс: қате табылмады, демек пайымдау негізді, сенімді.",
                 "Қысқалығы туралы айтылмаған.",
                 "Күрделілігі туралы clue жоқ; clue - «no errors»."]},
        {"type": "mc", "q": Q,
         "passage": "<p>The fossil is so well preserved that even the delicate veins of the leaf remain ______, allowing botanists to identify the species at a glance.</p>",
         "options": ["hidden", "damaged", "visible", "common"], "answer": 2,
         "why": ["Кері мағына: жасырын болса, бір қарағанда анықтау мүмкін болмас еді.",
                 "«well preserved» пен «damaged» қайшы.",
                 "Дұрыс: жақсы сақталған → жіңішке жүйкелері көрініп тұр → түрді бірден анықтауға болады.",
                 "Жүйкелердің жиі кездесетіні туралы емес, көрінетіні туралы сөз."]},
        {"type": "mc", "q": Q,
         "passage": "<p>Unlike her rivals, who changed their designs every season to follow fashion, the furniture maker remained ______ to the simple forms she had developed early in her career.</p>",
         "options": ["indifferent", "opposed", "committed", "new"], "answer": 2,
         "why": ["indifferent = немқұрайлы; ол өз формаларын сақтап қалды, яғни немқұрайлы емес.",
                 "Кері мағына: ол өз формаларына қарсы болған жоқ.",
                 "Дұрыс: «Unlike» - бәсекелестер өзгерді, ал ол өзгермеді: өз формаларына берік болды.",
                 "Ол формаларды мансабының басында жасаған - оған жаңа емес."]},
    ],
    "summary": [
        "Жауап сөздікте емес, мәтінде: әр бос орынның clue-і бар.",
        "Бағыт сөзі clue-мен қатынасты айтады: and/because/қос нүкте (=), but/although/despite/however (≠).",
        "Алдымен өз сөзіңізді қойыңыз, сосын нұсқадан мағынасы, реңкі, дәрежесі сайын таңдаңыз.",
        "Асты сызылған сөзде бірінші ойға келген мағына - жиі қақпан (novel, sound, economy, grave).",
        "Таңдаған нұсқаны орнына қойып, сөйлемді қайта оқыңыз.",
    ],
    "lab": {"href": "vocab.html", "title": "Words in Context жаттықтырғышы"},
    "sources": ["Барлық мәтіндер мен зерттеушілер ойдан құрастырылған (hypothetical); нақты зерттеулерге сілтеме емес.",
                "Сабақ AO17 үшін жаңадан жазылған (авторы: Sagid Mustafa). College Board материалдары көшірілмеген; AO17 College Board-пен байланысты емес."],
})
