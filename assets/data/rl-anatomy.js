/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md.
   «Сұрақ анатомиясы» (sat.reality.anatomy) сабағының мазмұны. Логика: assets/js/rl-anatomy.js.
   Барлық сұрақ AO17 үшін жазылған түпнұсқа жаттығу (College Board мәтіні емес). Математикалық жауаптар
   tests/e2e/reality-anatomy.spec.js ішінде тәуелсіз есептеумен тексеріледі.
   Сұрақ схемасы: { id, kind: "rw" | "math", segs: [{ t, role: "given" | "task" | "asked" | "", why }],
     cap: { given }, ask: { task, asked, real }, choices: [{ t, ok: true, why } | { t, trap, alt?, why }] }.
   trap - traps[kind] кілті; alt - екінші қабылданатын атау (бір қате жауапқа кейде екі себеп те келеді). */
window.RL_ANATOMY = {
  roles: {
    given: { name: "Берілген дерек", short: "Берілген дерек", def: "Берілген дерек - есептің шарты немесе мәтін: жауап содан алынады, бірақ ол ештеңе сұрамайды." },
    task: { name: "Тапсырма сөзі", short: "Тапсырма сөзі", def: "Тапсырма сөзі не істеу керегін айтады: мәнін табу, негізгі ойды атау, мәтіннен дәл оқу, қорытынды жасау." },
    asked: { name: "Сұралатын нәрсе", short: "Сұралатын нәрсе", def: "Сұралатын нәрсе - жауапта тұруы тиіс нақты шама немесе ой; әдетте сұрақ белгісінің дәл алдында тұрады." },
  },
  traps: {
    rw: {
      narrow: { name: "Тым тар", short: "тым тар", def: "Мәтінде бар шын дерек, бірақ сұрақтың бір бөлігін ғана жабады.", test: "«Тым тар» нұсқа мәтінде шынымен бар деректі айтады, тек бүкіл сұрақты жаппайды. Осы нұсқадағы ой мәтінде сол күйінде бар ма?" },
      broad: { name: "Тым кең", short: "тым кең", def: "Мәтін айтқаннан әлдеқайда кең жалпылама: «барлық», «әрқашан», «кез келген».", test: "«Тым кең» нұсқа мәтіндегі бір жағдайды бәріне жаяды. Осы нұсқада «all», «every», «always» сияқты жалпылау бар ма?" },
      notin: { name: "Мәтінде жоқ", short: "мәтінде жоқ", def: "Қисынды көрінеді, бірақ мәтінде бұл туралы бір де сөз жоқ.", test: "«Мәтінде жоқ» нұсқаның тақырыбы мәтінде мүлде қозғалмайды. Ал осы нұсқадағы оқиға не дерек мәтінде аталған ба?" },
      distort: { name: "Бұрмаланған", short: "бұрмаланған", def: "Мәтіндегі сөздерді алады, бірақ мағынасын өзгертеді немесе керісінше айтады.", test: "«Бұрмаланған» нұсқа мәтіндегі нақты бір сөйлемді теріс береді. Осы нұсқа мәтіннің қай сөйлемін өзгертіп тұр - ондай сөйлем бар ма?" },
    },
    math: {
      wrongq: { name: "Басқа шама табылған", short: "басқа шама", def: "Есептеу дұрыс, бірақ сұралмаған шама жазылған (мысалы, 3x + 1 орнына x).", test: "«Басқа шама» - шартта аты бар, дұрыс есептелген, бірақ сұралмаған шама. Осы сан шарттағы қандай да бір шаманың дұрыс мәні ме?" },
      sign: { name: "Таңба қатесі", short: "таңба", def: "Мүшені көшіргенде не жақша ашқанда плюс пен минус ауысып кеткен.", test: "Таңба қатесінде бір жерде «+» орнына «−» (не керісінше) жазылады. Бір таңбаны әдейі ауыстырып есептесеңіз, осы сан шыға ма?" },
      unit: { name: "Өлшем бірлік қатесі", short: "бірлік", def: "Сағат пен минут, метр мен сантиметр сияқты бірліктер бір-біріне келтірілмеген.", test: "Бірлік қатесінде сандар бірліктері келтірілмей көбейтіледі не бөлінеді. Осы есепте екі түрлі бірлік бар ма және сан солай шыға ма?" },
      partial: { name: "Жартылай жауап", short: "жартылай", def: "Шешім жолда тоқтаған: соңғы қадам жасалмаған не шарттың бір бөлігі қолданылмаған.", test: "Жартылай жауап - аралық нәтиже: одан кейін тағы бір қадам қалған. Осы сан дұрыс шешімнің ортасында кездесе ме?" },
    },
  },

  questions: {
    m1: {
      id: "m1", kind: "math",
      segs: [
        { t: "If 2x − 6 = 10,", role: "given", why: "Бұл - теңдеу, яғни шарт. Одан x табылады, бірақ сұрақ x туралы емес." },
        { t: "what is the value of", role: "task", why: "«What is the value of» - мәнін есептеп шығару керегін айтады." },
        { t: "3x + 1?", role: "asked", why: "Сұрақ белгісі осы өрнектен кейін тұр: жауапта дәл осының мәні болуы керек." },
      ],
      cap: { given: "теңдеу 2x − 6 = 10. Одан тек x шығады: x = 8." },
      ask: { task: "«what is the value of» - бір санды есептеп шығару.", asked: "x емес, 3x + 1 өрнегі.", real: "x-ті тауып тоқтама: 3x + 1-дің мәнін жаз." },
      choices: [
        { t: "7", trap: "sign", why: "−6 оң жаққа «−6» күйінде көшірілген: 2x = 10 − 6 = 4, x = 2, 3·2 + 1 = 7. Дұрысы: 2x = 10 + 6." },
        { t: "8", trap: "wrongq", why: "Бұл - x-тің дұрыс мәні. Бірақ сұралғаны 3x + 1." },
        { t: "16", trap: "partial", alt: "wrongq", why: "Бұл - 2x: шешімнің бірінші жолы (2x = 16). x те, 3x + 1 де әлі табылмаған." },
        { t: "25", ok: true, why: "2x = 16, x = 8, сонда 3x + 1 = 3·8 + 1 = 25." },
      ],
    },
    r1: {
      id: "r1", kind: "rw",
      segs: [
        { t: "For decades, the town of Marlow drew its water from a single reservoir. In 2019, engineers added a network of small rooftop tanks that collect rain. During the dry summer of 2022, the tanks supplied nearly a third of the town's water, and the reservoir never fell below its safe level. Town officials now plan to double the number of tanks.", role: "given", why: "Бұл - мәтін: дерек береді, ештеңе сұрамайды." },
        { t: "Which choice best states", role: "", why: "" },
        { t: "the main idea", role: "task", why: "«Main idea» - барлық сөйлемді біріктіретін ойды атау керегін айтады." },
        { t: "of the text?", role: "asked", why: "Негізгі ой бір сөйлемнің емес, бүкіл мәтіннің ойы болуы тиіс." },
      ],
      cap: { given: "төрт сөйлем: бұрын бір су қоймасы, 2019 жылы бактар, 2022 жылғы нәтиже, болашақ жоспар." },
      ask: { task: "«main idea» - жеке дерек емес, барлық сөйлемді біріктіретін ой.", asked: "бүкіл мәтін (оның бір сөйлемі емес).", real: "Төрт сөйлемнің бәріне ортақ бір ойды тап; жеке дерек жеткіліксіз." },
      choices: [
        { t: "In the summer of 2022, the tanks supplied nearly a third of the town's water.", trap: "narrow", why: "Мәтінде сөзбе-сөз бар, бірақ бұл - төрт сөйлемнің біреуі ғана." },
        { t: "Adding rooftop rain tanks has made the town's water supply more dependable.", ok: true, why: "Бактардың қосылуы, құрғақ жаздағы нәтиже және жаңа жоспар - бәрі осы ойға қызмет етеді." },
        { t: "Rainwater from rooftop tanks is cleaner than water from the reservoir.", trap: "notin", why: "Судың тазалығы туралы мәтінде бір де сөз жоқ." },
        { t: "Rooftop tanks are the best answer to water shortages in every town.", trap: "broad", why: "Мәтін бір ғана қала туралы; «every town» және «the best» - мәтіннен тыс жалпылау." },
      ],
    },
    g_r: {
      id: "g_r", kind: "rw",
      segs: [
        { t: "Ecologist Dana Whitlow tracked bees in twelve city gardens. Gardens with many native flowers attracted about twice as many bee species as gardens planted mostly with imported ornamentals. Whitlow notes, however, that her study lasted only one summer.", role: "given", why: "Бұл - мәтін: зерттеу нәтижесін баяндайды, ештеңе сұрамайды." },
        { t: "According to the text,", role: "task", why: "«According to the text» - қорытынды жасамай, мәтінде тура жазылғанды табу керегін айтады." },
        { t: "what did Whitlow observe in gardens with many native flowers?", role: "asked", why: "Сұрақ белгісі осы бөлікте: жауап жергілікті гүлі көп бақтардағы бақылау болуы тиіс." },
      ],
      cap: { given: "үш сөйлем: зерттеу, нәтиже, шектеу." },
      ask: { task: "«according to the text» - мәтінде тура жазылғанды табу, өз қорытындыңды қоспау.", asked: "жергілікті гүлі көп бақтарда Уитлоу не байқады.", real: "Мәтіннен жергілікті гүлі көп бақтар туралы тура жазылған бір деректі тап." },
      choices: [
        { t: "About twice as many bee species as in gardens with mostly imported plants.", ok: true, why: "Екінші сөйлемде дәл осылай жазылған: «about twice as many bee species»." },
        { t: "About twice as many individual bees as in gardens with mostly imported plants.", trap: "distort", why: "Мәтінде ара түрлерінің (species) саны айтылған, ал нұсқа оны жеке аралардың санына ауыстырған." },
        { t: "Native flowers need far less water than imported ornamentals.", trap: "notin", why: "Суару туралы мәтінде ештеңе айтылмаған." },
        { t: "All city gardens are valuable habitats for wildlife.", trap: "broad", why: "Мәтін он екі бақтағы аралар туралы; «all gardens» мен «wildlife» - әлдеқайда кең." },
      ],
    },
    g_m: {
      id: "g_m", kind: "math",
      segs: [
        { t: "A rectangle's length is 4 cm more than its width.", role: "given", why: "Бұл - екі қабырғаның байланысы: шарт, сұрақ емес." },
        { t: "Its perimeter is 32 cm.", role: "given", why: "Бұл - периметрдің берілген мәні: шарт, сұрақ емес." },
        { t: "What is", role: "task", why: "«What is» - бір шаманың мәнін табу керегін айтады." },
        { t: "the length of the rectangle, in centimeters?", role: "asked", why: "Сұрақ белгісі осында: ені емес, ұзындығы сұралған." },
      ],
      cap: { given: "ұзындық = ен + 4 және периметр = 32 см." },
      ask: { task: "«what is» - бір шаманың мәнін табу.", asked: "ені емес, ұзындығы (сантиметрмен).", real: "Енін (w) тапқан соң тоқтама: ұзындығы w + 4 сұралған." },
      choices: [
        { t: "6", trap: "wrongq", why: "Бұл - ені: 2(w + w + 4) = 32 теңдеуінен w = 6. Сұралғаны ұзындық." },
        { t: "10", ok: true, why: "2(w + w + 4) = 32 → 4w + 8 = 32 → w = 6, ұзындығы 6 + 4 = 10 см." },
        { t: "14", trap: "sign", why: "4w + 8 = 32 теңдеуінде 8 оң жаққа «+8» болып көшірілген: 4w = 40, w = 10, ұзындық 14. Дұрысы: 4w = 32 − 8." },
        { t: "16", trap: "partial", why: "Бұл - периметрдің жартысы (ен + ұзындық = 16). Қабырғалар әлі бөлек табылмаған." },
      ],
    },
    ms_r: {
      id: "ms_r", kind: "rw",
      segs: [
        { t: "In the 1950s, chemist Ines Varga tested a cheap method for cleaning lake water with crushed mussel shells. Her filters removed most of the metal particles in laboratory trials, but they clogged within days when used in a real lake. Varga published the results anyway, writing that a failed field test could still guide later designs.", role: "given", why: "Бұл - мәтін: дерек береді." },
        { t: "Which choice best states", role: "", why: "" },
        { t: "the main idea", role: "task", why: "«Main idea» барлық сөйлемді біріктіретін ойды сұрайды." },
        { t: "of the text?", role: "asked", why: "Нысан - бүкіл мәтін." },
      ],
      cap: { given: "үш сөйлем: әдіс, зертханадағы және көлдегі нәтиже, жариялау." },
      ask: { task: "«main idea» - барлық сөйлемді біріктіретін ой.", asked: "бүкіл мәтін.", real: "Зертханадағы сәттілік, көлдегі сәтсіздік және жариялау - үшеуін бірге қамтитын ойды тап." },
      choices: [
        { t: "Varga's shell filters removed most metal particles in laboratory trials.", trap: "narrow", why: "Мәтінде бар дерек, бірақ көлдегі сәтсіздік пен жариялау туралы бөлігін қамтымайды." },
        { t: "Varga's filters later became the standard way of cleaning lakes.", trap: "notin", why: "Әдістің кейін стандартқа айналғаны туралы мәтінде ештеңе жоқ." },
        { t: "Varga reported a method that worked in the laboratory but failed in a lake, believing the failure was still useful.", ok: true, why: "Үш сөйлемнің бәрін қамтиды: зертхана, көл және нәтижені пайдалы деп жариялау." },
        { t: "Varga kept her field results secret because the filters had clogged.", trap: "distort", why: "Мәтінде керісінше: ол нәтижені жариялады («published the results anyway»)." },
      ],
    },
    ms_m: {
      id: "ms_m", kind: "math",
      segs: [
        { t: "A tank holds 300 liters of water.", role: "given", why: "Бұл - бастапқы көлем: шарт." },
        { t: "A pump drains it at a constant rate of 8 liters per minute.", role: "given", why: "Бұл - жылдамдық: шарт." },
        { t: "After the pump has run for a quarter of an hour,", role: "given", why: "Бұл - уақыт (сағатпен берілген): шарт." },
        { t: "how many liters", role: "task", why: "«How many liters» - литрмен бір санды табу керегін айтады." },
        { t: "remain in the tank?", role: "asked", why: "Ағып кеткен емес, қалған су сұралған." },
      ],
      cap: { given: "300 л, минутына 8 л, ширек сағат." },
      ask: { task: "«how many liters» - литрмен бір сан табу.", asked: "ағып кеткен емес, бакта қалған су.", real: "Ширек сағатты минутқа айналдыр, ағып кеткенді тап, сосын оны 300-ден азайт." },
      choices: [
        { t: "120", trap: "partial", alt: "wrongq", why: "Бұл - ағып кеткен су: 8 · 15 = 120 л. Соңғы қадам (300 − 120) жасалмаған." },
        { t: "180", ok: true, why: "Ширек сағат = 15 мин; 8 · 15 = 120 л ағып кетті; 300 − 120 = 180 л қалды." },
        { t: "298", trap: "unit", why: "Минутына 8 л жылдамдық 0,25 сағатқа көбейтілген: 8 · 0,25 = 2, 300 − 2 = 298. Сағат минутқа айналдырылмаған." },
        { t: "420", trap: "sign", why: "Ағып кеткен су азайтудың орнына қосылған: 300 + 120 = 420." },
      ],
    },
  },

  intro: {
    q: "m1",
    lead: "Алдымен ойланбай-ақ жауап бер: 10 секундта қайсысын таңдар едің?",
    turn: "Байқа: 8 саны да кездейсоқ емес - бұл x-тің дұрыс мәні. 8 бен 25-ті сұрақтың бір ғана бөлігі ажыратады. Сол бөлікті бас.",
    done: "Дәл солай. Дұрыс есептеп тұрып, сұралмаған шаманы жазуға болады. Сондықтан сұрақты шешпес бұрын оны бөлшектеп оқимыз.",
  },
  concept: ["r1", "m1"],
  conceptCaps: {
    whole: "Бүтін сұрақ. Көбі оны бір деммен оқып, жауапқа секіреді. Енді бөлшектейміз.",
    stem: "Сұрақ сөйлемі (stem): не істеу керегі тек осы сөйлемде жазылған. Дерек қанша көп болса да, тапсырма осында.",
  },
  guided: ["g_r", "g_m"],

  explore: {
    math: {
      eq: { a: 2, b: -6, c: 10 },
      given: "If 2x − 6 = 10,", pre: "what is the value of ", post: "?",
      variants: [
        { id: "x", t: "x", p: 1, q: 0 },
        { id: "2x", t: "2x", p: 2, q: 0 },
        { id: "3x+1", t: "3x + 1", p: 3, q: 1 },
        { id: "x-1", t: "x − 1", p: 1, q: -1 },
      ],
      choices: [7, 8, 16, 25],
      moral: "Төрт нұсқаның әрқайсысы - басқа бір сұрақтың дұрыс жауабы. Қате нұсқалар осылай жасалады.",
    },
    rw: {
      passage: "For decades, the town of Marlow drew its water from a single reservoir. In 2019, engineers added a network of small rooftop tanks that collect rain. During the dry summer of 2022, the tanks supplied nearly a third of the town's water, and the reservoir never fell below its safe level. Town officials now plan to double the number of tanks.",
      choices: [
        "In the summer of 2022, the tanks supplied nearly a third of the town's water.",
        "Adding rooftop rain tanks has made the town's water supply more dependable.",
        "The town will probably draw a smaller share of its water from the reservoir in the future.",
        "Rooftop tanks are the best answer to water shortages in every town.",
      ],
      variants: [
        { id: "main", pre: "Which choice best states ", key: "the main idea", post: " of the text?", ok: 1,
          why: "«Main idea» барлық сөйлемді біріктіретін ойды сұрайды.",
          notes: ["Шын дерек, бірақ бір ғана сөйлем: тым тар.", "Бактар, 2022 жылғы жаз және жаңа жоспар - бәрін біріктіреді.", "Мәтін болашақты тура айтпайды: бұл қорытынды, негізгі ой емес.", "«Every town» - мәтінде бір ғана қала: тым кең."] },
        { id: "detail", pre: "", key: "According to the text,", post: " what happened during the summer of 2022?", ok: 0,
          why: "«According to the text» мәтінде тура жазылған бір деректі сұрайды.",
          notes: ["2022 жылғы жаз туралы сөйлемде сөзбе-сөз тұр.", "Жалпы қорытынды; сұрақ нақты бір жазды сұрайды.", "Болашақ туралы болжам; 2022 жылы болған оқиға емес.", "Мәтінде жоқ жалпылама."] },
        { id: "infer", pre: "Based on the text, what ", key: "can most reasonably be inferred", post: " about the town's future water supply?", ok: 2,
          why: "«Can be inferred» мәтінде тура жазылмаған, бірақ деректен шығатын қорытындыны сұрайды.",
          notes: ["Өткен дерек; болашақ туралы қорытынды емес.", "Бүгінге дейінгі нәтиже; сұрақ болашақты сұрайды.", "Бактар судың үштен біріне жуығын берді, саны екі есе артады → су қоймасының үлесі азаяды.", "Бір қаладан барлық қалаға секіру: мәтін оны қолдамайды."] },
      ],
      moral: "Мәтін де, нұсқалар да өзгерген жоқ. Сұрақ сөйлеміндегі бір тіркес өзгергенде дұрыс жауап басқа нұсқаға көшті.",
    },
  },

  checkpoint: [
    { type: "mc", q: "«If 5x + 2 = 37, what is the value of x − 3?» Осы сұрақта сұралатын нәрсе қайсы?",
      options: ["5x + 2 = 37", "x", "x − 3", "37"], answer: 2,
      why: ["Бұл - берілген теңдеу (шарт): одан x табылады, бірақ ол сұралмайды.", "x - аралық нәтиже. Сұрақ белгісінің алдында x емес, x − 3 тұр.", "Иә: «what is the value of» сөзінен кейін және сұрақ белгісінің алдында x − 3 тұр.", "37 - теңдеудің оң жағы, берілген сан."],
      hints: ["Сұрақ белгісінің дәл алдындағы өрнекке қара.", "«If 2x − 6 = 10, what is the value of 3x + 1?» сұрағында сұралатыны - 3x + 1, x емес.", "«If 5x + 2 = 37» - шарт; «what is the value of» - тапсырма сөзі; одан кейінгі «x − 3» - сұралатын нәрсе."] },
    { type: "mc", passage: "<p lang=\"en\">The first public library in Brenton opened in 1894 with 600 books donated by a single family. Today it lends more than 90,000 items a year, including tools and musical instruments.</p><p lang=\"en\"><b>Which choice best states the main idea of the text?</b></p>",
      q: "Нұсқа: «Brenton's library opened with 600 donated books.» Бұл нұсқа қай тұзаққа жатады?",
      options: ["Тым тар", "Тым кең", "Мәтінде жоқ", "Бұрмаланған"], answer: 0,
      why: ["Иә: дерек мәтінде бар, бірақ тек бірінші сөйлемді қамтиды; бүгінгі кітапхана туралы бөлігі жоқ.", "Тым кең нұсқа мәтіннен асып кетер еді (мысалы, «all libraries»). Бұл нұсқа, керісінше, мәтіннің бір бөлігінде ғана қалады.", "600 кітап туралы бірінші сөйлемде тура жазылған, яғни мәтінде бар.", "Нұсқа бірінші сөйлемнің мағынасын өзгертпейді: 600 сыйға тартылған кітап - мәтіндегідей."],
      hints: ["Алдымен тексер: нұсқадағы дерек мәтінде бар ма? Бар болса, ол нешінші сөйлемді қамтиды?", "Marlow мәтінінде «2022 жылы бактар судың үштен бірін берді» нұсқасы шын, бірақ төрт сөйлемнің біреуі ғана еді - тым тар.", "Дерек бірінші сөйлемде бар → «мәтінде жоқ» та, «бұрмаланған» да емес. Жалпылау жоқ → «тым кең» емес. Екінші сөйлемді қамтымайды → тым тар."] },
    { type: "mc", q: "«A printer prints 12 pages per minute. How many pages does it print in 2 hours?» Оқушы 24 деп жауап берді. Бұл қай тұзақ?",
      options: ["Басқа шама табылған", "Таңба қатесі", "Өлшем бірлік қатесі", "Жартылай жауап"], answer: 2,
      why: ["24 шарттағы ешбір шаманың дұрыс мәні емес: ол 12 · 2 көбейтіндісінен шыққан.", "Есепте азайту да, теріс сан да жоқ: таңба ауысатын жер жоқ.", "Иә: жылдамдық минутпен, уақыт сағатпен берілген. 12 · 2 = 24 деп көбейтуге болмайды; 2 сағат = 120 минут, 12 · 120 = 1440.", "24 дұрыс шешімнің (12 · 120 = 1440) ешбір аралық қадамында кездеспейді."],
      hints: ["Шарттағы екі санның бірліктеріне қара: «per minute» және «hours».", "«Минутына 8 л, ширек сағатта қанша?» есебінде 8 · 0,25 = 2 деу - бірлік қатесі; дұрысы 8 · 15.", "24 = 12 · 2: минуттық жылдамдық сағат санына көбейтілген. 2 сағат = 120 минут, дұрыс жауап 12 · 120 = 1440. Бұл - өлшем бірлік қатесі."] },
    { type: "num", q: "Енді өзің шеш: «If 5x + 2 = 37, what is the value of x − 3?»", value: 4,
      explain: "5x = 35, x = 7, сонда x − 3 = 4.",
      errors: {
        "7": "7 - x-тің дұрыс мәні, бірақ сұралғаны x − 3. Бұл - «басқа шама табылған» тұзағы.",
        "35": "35 - 5x: шешімнің бірінші жолы ғана. Бұл - жартылай жауап: x-ті тауып, одан 3-ті азайту қалды.",
        "4.8": "2 оң жаққа «+2» болып көшірілген: 5x = 39, x = 7,8, x − 3 = 4,8. Бұл - таңба қатесі; дұрысы 5x = 37 − 2.",
        "10": "x = 7 дұрыс табылған, бірақ 3 азайтылудың орнына қосылған: 7 + 3 = 10. Сұралғаны x − 3.",
      },
      hints: ["Алдымен сұралатын нәрсенің астын сыз: x емес, x − 3.", "«If 2x − 6 = 10, what is the value of 3x + 1?»: 2x = 16, x = 8, 3 · 8 + 1 = 25.", "5x + 2 = 37 → 5x = 37 − 2 = 35 → x = 7 → x − 3 = 7 − 3 = 4."] },
    { type: "mc", q: "Бір мәтінге қойылған сұрақтағы «the main idea» тіркесі «according to the text» болып өзгерді. Дұрыс жауап қалай өзгереді?",
      options: ["Өзгермейді: мәтін сол күйі қалды ғой.", "Енді барлық сөйлемді біріктіретін ой емес, мәтінде тура жазылған бір дерек дұрыс болады.", "Енді мәтінде жазылмаған, бірақ қисынды қорытынды дұрыс болады.", "Енді ең ұзын нұсқа дұрыс болады."], answer: 1,
      why: ["Мәтін өзгермеді, бірақ тапсырма сөзі өзгерді: жауапты мәтін емес, сұрақ сөйлемі таңдайды.", "Иә: «according to the text» мәтінде тура айтылған деректі сұрайды. Бұрын «тым тар» болған нұсқа енді дұрыс болуы мүмкін.", "Бұл - «can be inferred» тапсырмасы. «According to the text» қорытынды емес, тура жазылғанды сұрайды.", "Нұсқаның ұзындығы ештеңені білдірмейді; жауапты тапсырма сөзі анықтайды."],
      hints: ["«Өзің зертте» кезеңіндегі Marlow мәтінін еске түсір: тіркес ауысқанда не болды?", "Marlow мәтінінде «main idea» → B (жалпы ой), «according to the text» → A (2022 жылғы жаз туралы дерек).", "«Main idea» = бәрін біріктіретін ой; «according to the text» = тура жазылған бір дерек; «inferred» = деректен шығатын қорытынды. Демек дұрысы - екінші нұсқа."] },
  ],

  mistakes: [
    { id: "mk1", kind: "math", q: "The sum of two numbers is 20 and their difference is 6. What is the smaller number?",
      steps: [
        { t: "x + y = 20 және x − y = 6. Екі теңдеуді қосамын: 2x = 26.", ok: "Бұл қадам дұрыс: қосқанда y қысқарады, 20 + 6 = 26." },
        { t: "x = 13.", ok: "Бұл қадам дұрыс: 26 ÷ 2 = 13. Бірақ x - үлкен сан." },
        { t: "Жауап: 13.", bad: true },
      ],
      trap: "wrongq", fix: "x = 13 - үлкен сан. Сұралғаны - кіші сан: y = 20 − 13 = 7. Есептеу дұрыс, жауапқа басқа шама жазылған." },
    { id: "mk2", kind: "math", q: "If −2(x − 4) = 10, what is the value of x?",
      steps: [
        { t: "Жақшаны ашамын: −2x − 8 = 10.", bad: true },
        { t: "−2x = 18.", ok: "Алдыңғы жолдан бұл дұрыс шығады (10 + 8 = 18). Қате осы жолда емес, одан бұрын жіберілген." },
        { t: "x = −9.", ok: "18 ÷ (−2) = −9 - бөлу дұрыс. Қате бұдан бұрынғы қадамда." },
      ],
      trap: "sign", fix: "(−2) · (−4) = +8, сондықтан −2x + 8 = 10, −2x = 2, x = −1. Жақша ашқанда таңба ауыспай қалған." },
    { id: "mk3", kind: "math", q: "A car travels 90 km in 1.5 hours. At this rate, how many kilometers does it travel in 40 minutes?",
      steps: [
        { t: "Жылдамдық: 90 ÷ 1,5 = 60 км/сағ.", ok: "Бұл қадам дұрыс: 90 ÷ 1,5 = 60, бірлігі - км/сағ." },
        { t: "Қашықтық: 60 · 40 = 2400.", bad: true },
        { t: "Жауап: 2400 км.", ok: "Бұл жол алдыңғы қадамның нәтижесін көшіріп тұр. Қате сан алдыңғы қадамда пайда болған." },
      ],
      trap: "unit", fix: "Жылдамдық сағатпен, уақыт минутпен берілген. 40 мин = 40/60 сағ, сонда 60 · 40/60 = 40 км. 40 минутта 2400 км жүру мүмкін емес - жауаптың мағынасын тексеру де көмектеседі." },
    { id: "mk4", kind: "math", q: "A shirt costs $40. Its price is reduced by 25%, and then a $5 coupon is applied. What is the final price, in dollars?",
      steps: [
        { t: "40-тың 25%-ы: 0,25 · 40 = 10.", ok: "Бұл қадам дұрыс: 0,25 · 40 = 10." },
        { t: "Жеңілдіктен кейін: 40 − 10 = 30.", ok: "Бұл қадам дұрыс: 40 − 10 = 30. Бірақ бұл әлі соңғы баға емес." },
        { t: "Жауап: 30.", bad: true },
      ],
      trap: "partial", fix: "Шартта тағы бір әрекет бар: 5 долларлық купон. 30 − 5 = 25. Шешім соңғы қадамға жетпей тоқтаған." },
    { id: "mk5", kind: "rw",
      passage: "Coral reefs cover less than one percent of the ocean floor, yet they shelter roughly a quarter of all marine species. Reefs also protect coastlines by absorbing wave energy, and they support fishing that feeds millions of people.",
      q: "Which choice best states the main idea of the text?",
      picked: "Coral reefs cover less than one percent of the ocean floor.",
      steps: [
        { t: "Сұрақ мәтіннің негізгі ойын сұрайды.", ok: "Бұл қадам дұрыс: тапсырма сөзі - «the main idea»." },
        { t: "«Reefs cover less than one percent of the ocean floor» - мәтінде сөзбе-сөз бар, демек бұл шын.", ok: "Бұл қадам дұрыс: бірінші сөйлемде дәл осылай жазылған." },
        { t: "Мәтінде бар шын сөйлем - негізгі ой. Осы нұсқаны таңдаймын.", bad: true },
      ],
      trap: "narrow", fix: "Шын дерек пен негізгі ой - бір нәрсе емес. Мәтін рифтердің ауданы кіші бола тұра теңіз тіршілігіне де, адамға да маңызды екенін айтады; таңдалған нұсқа соның бір бөлшегі ғана." },
  ],

  mastery: ["ms_r", "ms_m"],
};
