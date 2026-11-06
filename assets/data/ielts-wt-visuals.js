/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
/* IELTS Writing Task 1 Visuals - авторлық тапсырмалар. Процесс, қала, қалалар мен үй шаруашылығы ОЙДАН ШЫҒАРЫЛҒАН;
   кесте мен дөңгелек диаграмма сандары іштей үйлесімді (пайыздар қосындысы 100), салыстыру тұжырымдарының ақиқаты
   осы сандардан ielts-wt-visuals.js ішінде бағдарлама арқылы есептеледі. */
window.IELTS_WTV = {
  process: {
    title: "Process diagram",
    prompt: "The diagram below shows how packaging made from seaweed is produced at a factory and what happens to it after use. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.",
    note: "Зауыт пен процесс ойдан шығарылған; кезеңдер жаттығу үшін құрастырылған.",
    // Кезеңдер дұрыс ретпен. clue - неге осы орында екенін түсіндіреді (ретті тексергенде қолданылады)
    stages: [
      { id: "harvest", label: "harvesting|at coastal farms", t: "Seaweed is harvested from coastal farms.", key: ["harvest"], phase: "prep", clue: "Шикізатсыз ештеңе басталмайды: бірінші - балдырды жинау." },
      { id: "wash", label: "washing|fresh water: salt, sand off", t: "It is washed in fresh water to remove salt and sand.", key: ["wash"], phase: "prep", clue: "Жуу - жиналған балдырды өңдеуге дайындау; ол кесуден бұрын." },
      { id: "boil", label: "chopping + boiling|→ natural gel", t: "It is chopped and boiled to extract a natural gel.", key: ["chop", "boil"], phase: "prep", clue: "Гель қайнатқанда пайда болады - сүзу үшін алдымен гель болуы керек." },
      { id: "filter", label: "filtering the gel", t: "The gel is filtered.", key: ["filter"], phase: "make", clue: "Сүзу гельден кейін, бірақ араластырудан бұрын: таза гель ғана талшықпен араласады." },
      { id: "mix", label: "mixing|gel + plant fibres", t: "The gel is mixed with plant fibres.", key: ["mix"], phase: "make", clue: "Қоспа қалыпқа басылмас бұрын дайын болуы керек." },
      { id: "press", label: "pressing into moulds", t: "The mixture is pressed into moulds.", key: ["press", "mould"], phase: "make", clue: "Пішін беру - кептіруден бұрын: ылғал қоспаға ғана пішін беруге болады." },
      { id: "dry", label: "drying|warm tunnels, 12 hours", t: "The shapes are dried in warm tunnels for 12 hours.", key: ["dried", "dry", "tunnel"], phase: "make", clue: "Кептіру - пішіннен кейін, тексеруден бұрын." },
      { id: "check", label: "quality check|faulty items crushed", t: "Each item is checked; faulty items are crushed and returned to the mixing stage.", key: ["check", "crush", "faulty"], phase: "make", clue: "Сапа тексерісі - дайын бұйымға; ақаулылар араластыру кезеңіне қайтады (цикл)." },
      { id: "deliver", label: "packing + delivery|to food companies", t: "Finished packaging is packed and delivered to food companies.", key: ["deliver", "packed"], phase: "after", clue: "Тексерілген бұйым ғана жеткізіледі." },
      { id: "compost", label: "after use:|home composting", t: "After use, the packaging can be composted at home.", key: ["compost"], phase: "after", clue: "«After use» - пайдаланылғаннан кейін: ең соңғы кезең." },
    ],
    groups: [
      { id: "prep", t: "Шикізатты дайындау (1-3)" },
      { id: "make", t: "Өндіру және тексеру (4-8)" },
      { id: "after", t: "Жеткізу және пайдаланудан кейін (9-10)" },
    ],
    overview: [
      { t: "Overall, the process consists of ten stages, beginning with the harvesting of seaweed and ending with the packaging being composted after use.", kind: "overview", why: "Процестің ұзындығы, басы мен соңы - нақты бөлшексіз үлкен сурет. Бұл - шолу." },
      { t: "It is a largely linear process, although faulty items are recycled back into the production line.", kind: "overview", why: "Процестің негізгі ерекшелігі: түзу сызықты, бірақ бір цикл бар. Шолуға жарайды." },
      { t: "The shapes are dried in warm tunnels for 12 hours.", kind: "detail", why: "Дұрыс, бірақ бір кезеңнің бөлшегі (12 сағат) - негізгі абзацқа барады." },
      { t: "Overall, seaweed packaging is much better for the environment than plastic.", kind: "false", why: "Диаграммада пластикпен салыстыру жоқ - бұл жеке пікір. Task 1-де тек көрсетілгенді сипаттаңыз." },
      { t: "Overall, every item produced is delivered to food companies.", kind: "false", why: "Қате: ақаулы бұйымдар ұнтақталып, араластыру кезеңіне қайтарылады." },
    ],
    lang: {
      title: "Ырықсыз етіс (passive) және рет сөздері",
      intro: "Процесте кім істейтіні маңызды емес - не болатыны маңызды. Сондықтан осы шақтағы ырықсыз етіс (is/are + V3) және рет сөздері (first, then, after this, once, finally) қолданылады.",
      items: [
        { s: "First, the seaweed {} from coastal farms.", opts: [["is harvested", 1, "Дұрыс: осы шақ + ырықсыз етіс (is + V3). Балдырды біреу жинайды - балдыр өзі жинамайды."], ["harvests", 0, "Белсенді етіс: «балдыр жинайды» болып шығады. Бастауыш - балдыр, ол әрекетті қабылдайды: is harvested."], ["is harvesting", 0, "Осы шақтың созылыңқы түрі (is + -ing) - белсенді етіс; процесс диаграммасында жай осы шақ қолданылады."], ["harvested", 0, "is көмекші етістігі жоқ: «the seaweed harvested» - толық емес сөйлем не өткен шақ."]] },
        { s: "{} it has been washed, the seaweed is chopped and boiled.", opts: [["Once", 1, "Дұрыс: Once = «...болған соң». Бір кезеңнің аяқталғанын көрсетеді."], ["Before", 0, "Мағына қатесі: жуудан БҰРЫН емес, кейін кеседі."], ["Finally", 0, "Finally - соңғы кезеңге ғана, және бағыныңқы сөйлем бастамайды."], ["While", 0, "While - екі әрекет қатар жүргенде; мұнда әрекеттер кезекпен жүреді."]] },
        { s: "The gel is filtered and {} mixed with plant fibres.", opts: [["then", 1, "Дұрыс: then - келесі кезеңге жеңіл көшу."], ["firstly", 0, "Firstly - тізімнің басы, процестің ортасында келмейді."], ["after", 0, "after - предлог не жалғаулық: «after it is filtered» деп толық айту керек."], ["next to", 0, "next to - орын (жанында), уақыт емес."]] },
        { s: "Faulty items {} crushed and returned to the mixing stage.", opts: [["are", 1, "Дұрыс: көпше бастауыш (items) → are + V3."], ["is", 0, "Бастауыш көпше (items): is емес, are."], ["were", 0, "Өткен шақ: процесс - үнемі қайталанатын әрекет, осы шақ қажет."], ["have", 0, "have + crushed - белсенді етістің perfect түрі: бұйымдар өздері ұнтақтамайды."]] },
        { s: "The shapes are dried in warm tunnels {} twelve hours.", opts: [["for", 1, "Дұрыс: for + уақыт ұзақтығы."], ["during", 0, "during + оқиға/кезең (during the night), сан-ұзақтықпен емес."], ["since", 0, "since + басталған сәт (since 9 am), ұзақтық емес."], ["in", 0, "in twelve hours - «12 сағаттан кейін» деген мағына береді."]] },
        { s: "{}, the packaging can be composted at home after use.", opts: [["Finally", 1, "Дұрыс: соңғы кезеңге арналған рет сөзі."], ["Firstly", 0, "Firstly - бірінші кезеңге."], ["Meanwhile", 0, "Meanwhile - «сол уақытта»: компост өндіріспен қатар емес, пайдаланудан кейін."], ["Previously", 0, "Previously - «бұрын»: мағынасы кері."]] },
      ],
      // Жаңа есеп (меңгеру): белсенді сөйлемді ырықсыз етіске айналдыру. accept - қалыпқа келтірілген дұрыс нұсқалар
      transform: [
        { a: "Workers wash the seaweed.", accept: ["the seaweed is washed", "the seaweed is washed by workers"] },
        { a: "The factory filters the gel.", accept: ["the gel is filtered", "the gel is filtered by the factory"] },
        { a: "Machines press the mixture into moulds.", accept: ["the mixture is pressed into moulds", "the mixture is pressed into moulds by machines"] },
        { a: "Staff check each item.", accept: ["each item is checked", "each item is checked by staff"] },
        { a: "Lorries deliver the packaging to food companies.", accept: ["the packaging is delivered to food companies", "the packaging is delivered to food companies by lorries"] },
        { a: "Workers crush faulty items.", accept: ["faulty items are crushed", "faulty items are crushed by workers"] },
        { a: "People compost the packaging at home.", accept: ["the packaging is composted at home", "the packaging is composted at home by people"] },
      ],
    },
  },

  map: {
    title: "Maps (before / after)",
    prompt: "The maps below show the town of Kestrel Bay in 2000 and in 2025. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.",
    note: "Kestrel Bay - ойдан шығарылған қала.",
    years: [2000, 2025],
    // Картадағы нысандар: [x, y] - 0..100 тор (солтүстік - жоғары). y кіші - солтүстікте.
    places: {
      market: { t: "market square", at: [42, 54] },
      school: { t: "school", at: [60, 54] },
      station: { t: "railway station", at: [12, 50] },
      marina: { t: "marina", at: [42, 88] },
      housing: { t: "housing estate", at: [42, 14] },
      carpark: { t: "car park", at: [72, 52] },
      forest: { t: "forest", at: [88, 58] },
      bridge: { t: "bridge", at: [42, 32] },
    },
    changes: [
      { id: "housing", t: "The farmland north of the river was replaced by a housing estate.", type: "replaced", key: ["housing", "houses", "homes"] },
      { id: "marina", t: "The fishing harbour was converted into a marina with a café.", type: "replaced", key: ["marina"] },
      { id: "bridge", t: "A bridge was built across the river.", type: "new", key: ["bridge"] },
      { id: "station", t: "A railway line and a station were added in the west.", type: "new", key: ["station", "railway"] },
      { id: "forest", t: "Part of the forest in the east was cleared for a car park.", type: "size", key: ["forest", "car park", "trees"] },
      { id: "school", t: "The school was extended.", type: "size", key: ["school"] },
      { id: "market", t: "The market square remained the same.", type: "same", key: ["market"] },
    ],
    groups: [
      { id: "new", t: "Жаңадан салынды" },
      { id: "replaced", t: "Басқа нысанға айналды / ауыстырылды" },
      { id: "size", t: "Көлемі өзгерді (кеңейді не азайды)" },
      { id: "same", t: "Өзгеріссіз қалды" },
    ],
    // Карта бойынша тұжырымдар: ok = картаға сай ма
    facts: [
      { t: "The forest was completely removed.", ok: false, why: "Орманның тек БІР БӨЛІГІ кесілді (шығыстағы кішкене бөлігі көлік тұрағына айналды), қалғаны сақталды." },
      { t: "A bridge now links the northern and southern parts of the town.", ok: true, why: "2025 жылғы картада өзеннің үстінде көпір бар; 2000 жылы болмаған." },
      { t: "The school was demolished to make room for shops.", ok: false, why: "Мектеп бұзылмады - ол кеңейтілді (extended). Дүкендер картада жоқ." },
      { t: "The market square did not change.", ok: true, why: "Базар алаңы екі картада да бір орында, бір өлшемде." },
      { t: "A new hospital was built next to the station.", ok: false, why: "Аурухана картада мүлде жоқ. Task 1-де картада жоқ нысанды қоспаңыз." },
      { t: "The area to the north of the river became residential.", ok: true, why: "Өзеннің солтүстігіндегі егістік тұрғын үй ауданына (housing estate) айналды." },
    ],
    overview: [
      { t: "Overall, Kestrel Bay became more residential and better connected, while its fishing harbour turned into a leisure area.", kind: "overview", why: "Үш басты өзгеріс бағыты: тұрғын үй, көлік байланысы, демалыс. Бұл - шолу." },
      { t: "Overall, the town changed considerably, although its centre, the market square, stayed the same.", kind: "overview", why: "Жалпы сурет + маңызды тұрақтылық. Шолуға жарайды." },
      { t: "In 2025 there was a café in the marina.", kind: "detail", why: "Дұрыс, бірақ бөлшек - негізгі абзацқа." },
      { t: "Overall, the changes made Kestrel Bay a nicer place to live.", kind: "false", why: "«nicer» - пікір. Карта бағалау бермейді: тек өзгерістерді сипаттаңыз." },
      { t: "Overall, all of the natural areas in the town disappeared.", kind: "false", why: "Қате: орманның көп бөлігі сақталды, өзен де бар." },
    ],
    lang: {
      title: "Орын және өзгеріс тілі",
      intro: "Карта сипаттамасында екі құрал керек: орын (to the north of, next to, opposite) және өзгеріс етістіктері өткен шақта, көбіне ырықсыз етісте (was replaced by, was converted into, was extended).",
      items: [
        { s: "The housing estate is located {} the north of the river.", opts: [["to", 1, "Дұрыс: to the north of X - X-тен солтүстікке қарай (X-тің сыртында)."], ["in", 0, "in the north of X - X-тің ІШІНДЕ солтүстік бөлігінде. Үйлер өзеннің ішінде емес."], ["at", 0, "at the north - тіркес ретінде қолданылмайды."], ["on", 0, "on the north - орын тіркесі емес."]] },
        { s: "The fishing harbour {} into a marina.", opts: [["was converted", 1, "Дұрыс: өткен шақ, ырықсыз етіс: was + V3 + into."], ["converted", 0, "Белсенді етіс: айлақ өзін өзі өзгертпейді; ырықсыз етіс керек (was converted)."], ["has converted", 0, "Present perfect белсенді етіс - мағынасы қате; және карта нақты өткен жылдармен (2000→2025) салыстырылады."], ["was convert", 0, "V3 керек: converted."]] },
        { s: "Part of the forest {} to make way for a car park.", opts: [["was cleared", 1, "Дұрыс: was + V3. to make way for - «...үшін орын босату»."], ["cleared", 0, "Белсенді етіс: «орман тазалады» болып шығады."], ["was clear", 0, "clear - сын есім не етістіктің негізгі түрі; V3 керек: cleared."], ["is cleared", 0, "Осы шақ: өзгеріс 2000-2025 жылдары болған, өткен шақ керек."]] },
        { s: "A new bridge now {} the two halves of the town.", opts: [["connects", 1, "Дұрыс: now - қазіргі жағдай, осы шақ, белсенді етіс (көпір қосады)."], ["connect", 0, "Бастауыш жекеше (a bridge): -s жалғауы керек."], ["is connected", 0, "Ырықсыз етіс: көпірдің өзі қосылмайды, ол қалаларды қосады."], ["connecting", 0, "Етістіктің -ing түрі жалғыз баяндауыш бола алмайды."]] },
        { s: "The school, {} is next to the market square, was extended.", opts: [["which", 1, "Дұрыс: which - нысанға (school) сілтейтін қатыстық есімдік."], ["where", 0, "where - орынға: «the area where…». Мұнда сөйлемге бастауыш керек (which is…)."], ["who", 0, "who - адамға ғана."], ["what", 0, "what қатыстық есімдік ретінде зат есімнен кейін келмейді."]] },
        { s: "{} the 25-year period, the town became more residential.", opts: [["Over", 1, "Дұрыс: over the period - кезең бойы."], ["Since", 0, "Since + басталған сәт (since 2000), кезең емес."], ["At", 0, "at + нақты сәт; кезеңмен қолданылмайды."], ["By", 0, "By - «...уақытқа қарай» (by 2025); кезең бойы емес."]] },
      ],
    },
  },

  table: {
    title: "Table",
    prompt: "The table below shows the average amount of water used per person each day in four cities in 2005, 2015 and 2025. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.",
    note: "Қалалар мен сандар ойдан шығарылған; бірлік - литр/адам/тәулік.",
    unit: "litres",
    years: [2005, 2015, 2025],
    rows: [
      { id: "arden", name: "Arden", v: [165, 150, 128] },
      { id: "belmor", name: "Belmor", v: [210, 190, 170] },
      { id: "corvel", name: "Corvel", v: [140, 145, 150] },
      { id: "dunmore", name: "Dunmore", v: [120, 118, 115] },
    ],
    groups: [
      { id: "fell", t: "Айтарлықтай азайды" },
      { id: "rose", t: "Өсті" },
      { id: "stable", t: "Шамалы өзгерді (±5-ке дейін)" },
    ],
    overview: [
      { t: "Overall, water use per person fell in three of the four cities, with Corvel being the only exception.", kind: "overview", why: "Басты тенденция + ерекшелік - шолудың классикалық құрылымы." },
      { t: "Belmor had the highest consumption throughout the period, while Dunmore consistently had the lowest.", kind: "overview", why: "Бүкіл кезеңге қатысты салыстыру (ең көп / ең аз), нақты сансыз. Шолуға жарайды." },
      { t: "In 2015, people in Arden used 150 litres a day.", kind: "detail", why: "Дұрыс, бірақ бір ұяшық - негізгі абзацқа." },
      { t: "Overall, all four cities reduced their water use.", kind: "false", why: "Қате: Корвелде тұтыну 140-тан 150-ге өсті." },
      { t: "Overall, the cities saved water because of new laws.", kind: "false", why: "Кестеде себеп көрсетілмеген - ойдан себеп қоспаңыз." },
    ],
    lang: {
      title: "Салыстыру және өзгеріс тілі",
      intro: "Кестеде көп сан бар - бәрін тізбеңіз. Ұқсас өзгерістерді топтап, салыстыру құрылымдарын қолданыңыз.",
      items: [
        { s: "Belmor had the {} consumption throughout the period.", opts: [["highest", 1, "Дұрыс: үш және одан көп нысан ішінен ең көбі - the + -est."], ["higher", 0, "Салыстырмалы шырай (higher) екі нысанға және than-мен қолданылады."], ["most high", 0, "Бір буынды сын есім: most емес, -est жалғауы."], ["high", 0, "the high consumption - салыстыру жоқ, мағына әлсірейді."]] },
        { s: "Water use in Arden fell {} 165 to 128 litres.", opts: [["from", 1, "Дұрыс: fell from X to Y."], ["by", 0, "by + айырма: fell by 37 litres. «by 165 to 128» - мағынасыз."], ["at", 0, "at - бір нүктеге (stood at 128)."], ["since", 0, "since + уақыт, сан емес."]] },
        { s: "Corvel was the only city {} consumption increased.", opts: [["where", 1, "Дұрыс: where - орынға (қалаға) сілтейді: the only city where…"], ["which", 0, "which-тен кейін бастауыш керек емес: «which increased» болар еді, бірақ мұнда consumption бастауышы бар."], ["what", 0, "what зат есімнен кейін қатыстық есімдік бола алмайды."], ["when", 0, "when - уақытқа."]] },
        { s: "Dunmore's figure remained {} stable.", opts: [["relatively", 1, "Дұрыс: үстеу (relatively) сын есімді (stable) анықтайды."], ["relative", 0, "Сын есімді анықтау үшін үстеу керек: relatively."], ["relation", 0, "Зат есім - сөйлемге сай емес."], ["relating", 0, "Етістік формасы - мағынасыз."]] },
        { s: "In 2025, Belmor used roughly one and a half times {} much water as Dunmore.", opts: [["as", 1, "Дұрыс: X times as much as. 170 ÷ 115 ≈ 1,5."], ["so", 0, "so much as - бұл құрылымда қолданылмайды."], ["more", 0, "«times more much» - грамматикалық қате."], ["than", 0, "than салыстырмалы шыраймен ғана: more than."]] },
      ],
    },
  },

  pie: {
    title: "Pie charts",
    prompt: "The pie charts below show how energy was used in a typical household in the town of Northfield in 1995 and 2025. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.",
    note: "Northfield пен деректер ойдан шығарылған; әр диаграммада пайыздар қосындысы 100.",
    years: [1995, 2025],
    cats: [
      { id: "heating", name: "Heating", v: [52, 38] },
      { id: "water", name: "Hot water", v: [20, 18] },
      { id: "lighting", name: "Lighting", v: [12, 5] },
      { id: "appliances", name: "Appliances", v: [10, 24] },
      { id: "cooking", name: "Cooking", v: [6, 15] },
    ],
    // Түнгі тақтаға тексерілген категориялық палитра (dataviz validate_palette.js, dark, #11243a фонында: барлық тексеріс өтті)
    colors: ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181"],
    groups: [
      { id: "up", t: "Үлесі өсті" },
      { id: "down", t: "Үлесі азайды" },
      { id: "flat", t: "Шамалы өзгерді (±2-ге дейін)" },
    ],
    overview: [
      { t: "Overall, heating remained the largest use of energy, although its share fell, while appliances and cooking accounted for a much bigger proportion in 2025.", kind: "overview", why: "Ең үлкен категория + екі негізгі бағыт. Бұл - шолу." },
      { t: "The most striking change was the rise of appliances, whose share more than doubled.", kind: "overview", why: "Ең маңызды өзгерісті атайды (10% → 24%). Шолуға жарайды (нақты санды міндетті түрде қоспай-ақ)." },
      { t: "Hot water made up 18% of energy use in 2025.", kind: "detail", why: "Дұрыс, бірақ бөлшек - негізгі абзацқа." },
      { t: "Overall, the household used less energy in 2025 than in 1995.", kind: "false", why: "Диаграммалар тек ҮЛЕСТІ (%) көрсетеді, жалпы мөлшерді емес. Пайыздан жалпы тұтыну туралы қорытынды шықпайды." },
      { t: "Overall, lighting became the smallest category in both years.", kind: "false", why: "Қате: 1995 жылы ең кіші - cooking (6%), lighting емес (12%)." },
    ],
    lang: {
      title: "Үлес (пропорция) тілі",
      intro: "Дөңгелек диаграмма - бүтіннің бөліктері. Тіркестер: accounted for, made up, a quarter, just over half, the share of X doubled.",
      items: [
        { s: "Heating accounted {} just over half of the energy used in 1995.", opts: [["for", 1, "Дұрыс: account for X% - X% құрау."], ["to", 0, "account to - мұндай тіркес жоқ (amount to бар)."], ["of", 0, "account of - «есеп, баяндама» мағынасы."], ["with", 0, "account with - мағынасыз."]] },
        { s: "The share of energy used by appliances more than {}.", opts: [["doubled", 1, "Дұрыс: 10% → 24%, яғни екі еседен көп өсті: more than doubled."], ["double", 0, "Өткен шақ керек: doubled."], ["twice", 0, "twice - үстеу, баяндауыш бола алмайды (more than twice as large болар еді)."], ["doubling", 0, "-ing түрі жалғыз баяндауыш бола алмайды."]] },
        { s: "By 2025, lighting made up only {} of the total.", opts: [["a twentieth", 1, "Дұрыс: 5% = 1/20."], ["a fifth", 0, "A fifth = 20%. 5% емес."], ["a quarter", 0, "A quarter = 25%."], ["a half", 0, "A half = 50%."]] },
        { s: "The proportion of energy used for hot water changed only {}.", opts: [["slightly", 1, "Дұрыс: етістікті (changed) үстеу анықтайды; 20% → 18%."], ["slight", 0, "Сын есім етістікті анықтамайды: slightly."], ["slighter", 0, "Салыстырмалы шырай - мұнда салыстыру жоқ."], ["sharply", 0, "Грамматикасы дұрыс, бірақ 2 пайыздық өзгеріс - «күрт» емес."]] },
        { s: "In 1995, heating used more energy than {} the other categories combined.", opts: [["all", 1, "Дұрыс: 52% > 20 + 12 + 10 + 6 = 48%."], ["each", 0, "each - әрқайсысы жеке; combined (бірге алғанда) мағынасымен сай емес."], ["every", 0, "every зат есімнен бұрын the-сыз келеді: every category."], ["any", 0, "any of the other categories combined - мағынасы бұлыңғыр; combined көпше жиынды қажет етеді."]] },
      ],
    },
  },

  checklist: [
    { c: "Task Achievement", q: ["Кіріспеде тапсырманы өз сөзіммен бердім (көшірмедім).", "Жеке шолу (overview) бар: басты ерекшеліктер, бөлшексіз.", "Маңызды ерекшеліктерді таңдап, деректермен дәлелдедім; бәрін тізбедім.", "Суретте жоқ ақпаратты, себепті не жеке пікірді қоспадым."] },
    { c: "Coherence and Cohesion", q: ["Абзацтарым топтарға сай (кезеңдер / өзгеріс түрлері / ұқсас тенденциялар).", "Рет не салыстыру сөздері орынды (then, once, whereas, by contrast).", "it / this / the former сілтемелері анық."] },
    { c: "Lexical Resource", q: ["Процесс/карта/үлес тіліне сай сөздер қолдандым (be converted into, account for...).", "Бір сөзді қайталай бермедім.", "Емлені тексердім."] },
    { c: "Grammatical Range and Accuracy", q: ["Шақ дұрыс: процесте - осы шақ, өткен жылдарда - өткен шақ.", "Ырықсыз етіс (is/was + V3) орынды қолданылды.", "Қарапайым және күрделі сөйлемдер аралас."] },
  ],
};
