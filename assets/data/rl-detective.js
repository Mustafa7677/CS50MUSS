/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md.
   «Мәтін тергеушісі» (IELTS Reading Detective, сабақ id: ielts.reality.detective) - сабақтың бүкіл мазмұны.
   Көрсету коды: assets/js/rl-detective.js. Мазмұнды осы файлда ғана өзгертуге болады, кодқа тимей.
   МАҢЫЗДЫ: екі мәтін де осы сабақ үшін ойдан жазылған. Зерттеулер, ғалымдар, мекемелер мен жер атаулары шынайы емес;
   мәтіндер ешбір ресми IELTS материалынан алынбаған.
   Схема:
     passage: { title, sentences: [{ t: ағылшынша сөйлем, p: абзац нөмірі, topic: «Бұл сөйлем ... туралы» үшін қазақша тақырып }] }
     мәлімдеме: { id, text, verdict: "T" | "F" | "NG", ev: [дәлел сөйлемнің индексі] (NG үшін бос),
                  links: [{ q: мәлімдемедегі сөз тіркесі, p: дәлел сөйлемдегі парафраз }] - екеуі де мәтіннің дәл үзіндісі болуы керек,
                  about: «Мәлімдеме ... туралы» үшін, why: дұрыс үкімнің себебі, whyNot: { T, F, NG } - қате үкімнің себебі,
                  traps: { сөйлем индексі: неге бұл сөйлем дәлел емес }, hints: [бағыт, ұқсас мысал, қадамдық шешім],
                  cands: [checkpoint-та ұсынылатын сөйлемдер] }
     Тұжырым күйі (st): "ok" - мәтін растайды, "no" - мәтін қарсы айтады, "absent" - мәтінде жоқ.
     Үкім ережесі (кодта): бір "no" болса False; әйтпесе бір "absent" болса Not Given; бәрі "ok" болса True. */
window.RL_DETECTIVE = {
  passageA: {
    title: "Paper or Screen? The Tarnbrook Reading Study",
    sentences: [
      { p: 0, t: "In 2019, Dr Ilse Varga and her team at the Northmere Institute began a two-year study of how teenagers read long texts.", topic: "зерттеуді кім және қашан бастағаны" },
      { p: 0, t: "They recruited 412 pupils aged thirteen to fifteen from nine secondary schools in the Tarnbrook valley.", topic: "қатысушылардың саны, жасы және мектептері" },
      { p: 0, t: "Each pupil read the same six articles, half of them on paper and half on a tablet.", topic: "мақалалардың жартысы қағазда, жартысы планшетте оқылғаны" },
      { p: 0, t: "After every article, the pupils answered questions about its main ideas and about small details.", topic: "оқушыларға қойылған сұрақтардың түрлері" },
      { p: 1, t: "The results surprised the researchers.", topic: "зерттеушілердің нәтижеге таңғалғаны" },
      { p: 1, t: "Scores on main-idea questions were almost identical for both formats.", topic: "негізгі ой сұрақтарының нәтижесі" },
      { p: 1, t: "However, pupils who read on paper recalled details more accurately than those who read on screens.", topic: "ұсақ деректерді есте сақтаудың нәтижесі" },
      { p: 1, t: "The gap was widest for the longest articles, which ran to more than 2,000 words.", topic: "айырмашылықтың ең ұзын мақалаларда ең үлкен болғаны" },
      { p: 2, t: "Varga's team also recorded how the pupils moved through each text.", topic: "оқушылардың мәтін бойымен қозғалысының жазылып алынғаны" },
      { p: 2, t: "On tablets, most pupils scrolled quickly and rarely returned to earlier paragraphs.", topic: "планшетте оқушылардың мәтінді қалай айналдырғаны" },
      { p: 2, t: "On paper, by contrast, many of them turned back at least once to check a point.", topic: "қағазда оқушылардың артқа қайтып тексергені" },
      { p: 2, t: "Varga believes that this habit of rereading, rather than the paper itself, explains the difference.", topic: "Варганың айырмашылықты немен түсіндіретіні" },
      { p: 3, t: "To test the idea, the team ran a second experiment in 2021, before publishing any results.", topic: "екінші тәжірибенің қашан өткізілгені" },
      { p: 3, t: "A new group of pupils was taught to pause and look back while reading on a tablet.", topic: "жаңа топқа үйретілген тәсіл" },
      { p: 3, t: "After four weeks of training, some of these pupils matched the detail scores of the paper group, although others showed little change.", topic: "төрт апталық жаттығудың нәтижесі" },
      { p: 4, t: "The study has limits.", topic: "зерттеудің шектеулері бар екені" },
      { p: 4, t: "All of the schools were in one rural region, and every text was a factual article rather than fiction.", topic: "мектептердің орналасуы мен мәтіндердің түрі" },
      { p: 4, t: "Varga therefore warns against concluding that screens harm reading in general.", topic: "Варганың жалпы қорытынды жасаудан сақтандыруы" },
      { p: 4, t: "Her team plans to repeat the work with university students.", topic: "топтың келесі жоспары" },
    ],
  },

  /* 1. Кіріспе: мәлімдеменің барлық сөзі сөйлемде бар, бірақ үкім - False. */
  intro: {
    statement: "On tablets, most pupils returned to earlier paragraphs.",
    sent: 9, answer: "F", flip: "rarely", anchor: "returned",
    why: {
      T: "Тұзақ осы: сөздердің бәрі сәйкес келеді, бірақ сөйлемде тағы бір сөз бар. Сол сөз мағынаны кері аударады. Дұрыс үкім - False.",
      F: "Дәл солай. Сөздер бірдей, ал мағына қарама-қарсы: мәтінде оқушылар алдыңғы абзацтарға сирек оралған.",
      NG: "Мәтін бұл туралы айтады: дәл осы сөйлемде оқушылардың алдыңғы абзацтарға оралуы сипатталған. Айтылған нәрсе Not Given бола алмайды. Дұрыс үкім - False.",
    },
    flipOk: "«rarely» = «сирек». Бір сөз бүкіл сөйлемнің мағынасын төңкерді: «most pupils ... rarely returned» мәлімдемеге қайшы.",
    flipNo: "«{w}» сөзі «returned to earlier paragraphs» бөлігінің мағынасын өзгертпейді. Оқушылардың қаншалық жиі оралғанын айтатын сөзді ізде.",
  },

  /* 2. Көр: мәлімдеме тұжырымдарға бөлініп, әрқайсысы мәтінмен тексеріледі. */
  concept: {
    statement: "All of the pupils trained on tablets matched the paper group's detail scores after four weeks.",
    sents: [13, 14],
    claims: [
      { t: "pupils were trained on tablets", st: "ok", sent: 13, p: "taught to pause and look back while reading on a tablet" },
      { t: "the training lasted four weeks", st: "ok", sent: 14, p: "After four weeks of training" },
      { t: "ALL of them matched the paper group", st: "no", sent: 14, p: "some of these pupils" },
    ],
    caps: [
      "Мәлімдеме бір сөйлем сияқты көрінеді. Бірақ оның ішінде бірнеше бөлек тұжырым жасырынған.",
      "Тергеуші мәлімдемені үш тұжырымға бөледі. Әрқайсысы мәтінмен жеке тексеріледі.",
      "1-тұжырым: оқушылар планшетте оқуға үйретілді. Мәтін растайды: «taught to pause and look back while reading on a tablet».",
      "2-тұжырым: жаттығу төрт аптаға созылды. Мәтін растайды: «After four weeks of training».",
      "3-тұжырым: БӘРІ қағаз тобына жетті. Мәтін қарсы айтады: «some of these pupils ... although others showed little change».",
      "Үкім: екі тұжырым рас, біреуі мәтінге қайшы. Бір ғана қайшы тұжырым бүкіл мәлімдемені False етеді.",
    ],
    ask: "Қай тұжырым бүкіл мәлімдеменің үкімін шешті?",
    askOk: "Иә. «All» сөзі мәтіндегі «some ... although others showed little change» бөлігіне қайшы. Қалған екі тұжырым рас болса да, үкім - False.",
    askNo: "Бұл тұжырымды мәтін растайды, сондықтан ол үкімді бұзбайды. Мәтінге қайшы келген тұжырымды ізде.",
  },

  /* 3. Бірге жаса: алдымен дәлел сөйлем, сосын үкім. */
  guided: [
    {
      id: "g1", text: "Pupils remembered small facts better when they read printed texts.", verdict: "T", ev: [6],
      links: [{ q: "remembered small facts better", p: "recalled details more accurately" }, { q: "printed texts", p: "on paper" }],
      about: "қай форматта ұсақ деректердің жақсы есте қалғаны",
      why: "Сөздер басқа, мағына бір: «recalled details more accurately» = «remembered small facts better», «on paper» = «printed texts». Мәтін мәлімдемені растайды.",
      whyNot: { F: "Дәлел сөйлем мәлімдемемен бір нәрсені айтады: қағазда оқығандар деректерді дәлірек есіне түсірген. Қайшылық жоқ, сондықтан False емес." },
      traps: { 5: "Бұл сөйлем негізгі ой сұрақтары (main-idea questions) туралы. Ал мәлімдеме ұсақ деректер (small facts) туралы." },
      hints: [
        "Мәлімдемедегі «small facts» пен «printed texts» сөздерінің синонимдерін ізде: мәтінде дәл осы сөздер жоқ.",
        "Ұқсас мысал: «children slept longer» пен «young people got more hours of rest» бір мағынаны береді, сөздері әртүрлі.",
        "2-абзацтағы «However, pupils who read on paper recalled details more accurately...» сөйлемін таңда: recalled details = remembered small facts. Үкім - True.",
      ],
    },
    {
      id: "g2", text: "The pupils who took part were all taught at the same school.", verdict: "F", ev: [1],
      links: [{ q: "the same school", p: "nine secondary schools" }],
      about: "қатысушылардың қанша мектептен алынғаны",
      why: "Мәтінде «nine secondary schools» делінген. Тоғыз мектеп пен «the same school» бір-біріне қайшы: мәтін мәлімдемені жоққа шығарады.",
      whyNot: { T: "Мәлімдеме «бір мектеп» дейді, мәтін «тоғыз мектеп» дейді. Бұл растау емес, қайшылық." },
      traps: { 16: "Бұл сөйлем мектептердің бір аймақта орналасқанын айтады. Бір аймақ - бір мектеп деген сөз емес. Мектеп саны жазылған сөйлемді ізде." },
      hints: [
        "Мәтіннен мектептердің саны жазылған жерді тап.",
        "Ұқсас мысал: мәтінде «three factories» болса, «a single factory» деген мәлімдеме False болады: сан қайшы келеді.",
        "1-абзацтағы «They recruited 412 pupils ... from nine secondary schools» сөйлемін таңда. nine ≠ the same, сондықтан үкім - False.",
      ],
    },
    {
      id: "g3", text: "Most pupils said they preferred reading on a tablet.", verdict: "NG", ev: [],
      links: [],
      about: "оқушылардың қай форматты ұнататыны",
      why: "Мәтінде оқушылардың не ұнататыны туралы бірде-бір сөйлем жоқ: тек олардың қалай оқығаны мен қандай нәтиже көрсеткені айтылған. Растау да, қайшылық та жоқ.",
      whyNot: {
        T: "Мәтінде оқушылардың планшетті ұнатқаны еш жерде айтылмаған. Дәлел жоқ болса, True деуге болмайды.",
        F: "False деу үшін мәтін «оқушылар планшетті ұнатпады» немесе «қағазды таңдады» деуі керек еді. Ондай сөйлем жоқ: мәтін бұл жөнінде үндемейді.",
      },
      traps: {
        9: "Мұнда «tablets» пен «most pupils» сөздері бар, бірақ сөйлем оқушылардың мәтінді қалай айналдырғанын сипаттайды. Олардың не ұнататыны айтылмаған.",
        2: "Бұл сөйлем мақалалардың қай форматта оқылғанын айтады. Оқушылардың қайсысын ұнатқаны туралы сөз жоқ.",
      },
      hints: [
        "«preferred» (ұнатты, таңдады) мағынасын беретін сөзді мәтіннен ізде: like, favour, choose, enjoy. Табылмаса, бұл да жауап.",
        "Ұқсас мысал: мәтін «most visitors arrived by bus» десе, «most visitors enjoyed the bus journey» мәлімдемесі Not Given: келу тәсілі айтылған, пікір айтылмаған.",
        "Ешбір сөйлем оқушылардың пікірін сипаттамайды. «Ешбір сөйлем бұл туралы айтпайды» батырмасын бас, үкім - Not Given.",
      ],
    },
    {
      id: "g4", text: "Varga thinks that paper as a material is the reason for the better recall.", verdict: "F", ev: [11],
      links: [{ q: "thinks", p: "believes" }, { q: "paper as a material", p: "rather than the paper itself" }],
      about: "Варганың айырмашылық себебі туралы пікірі",
      why: "Варга себепті қайта оқу әдетінен көреді: «this habit of rereading, rather than the paper itself». «rather than» қағаздың өзін себеп ретінде жоққа шығарады.",
      whyNot: { T: "«rather than the paper itself» = «қағаздың өзі емес». Варга себеп деп қағазды емес, қайта оқу әдетін атайды." },
      traps: { 6: "Бұл сөйлем нәтижені айтады: қағазда деректер жақсы есте қалған. Ал мәлімдеме Варганың осы нәтиженің СЕБЕБІ туралы пікірін сұрайды." },
      hints: [
        "Варганың пікірін білдіретін етістікті ізде: believes, argues, suggests.",
        "Ұқсас мысал: «the price, rather than the quality, explains the sales» сөйлемінде себеп - баға, сапа емес.",
        "3-абзацтағы «Varga believes that this habit of rereading, rather than the paper itself, explains the difference» сөйлемін таңда. Себеп - қағаз емес, сондықтан үкім - False.",
      ],
    },
  ],

  /* 4. Өзің зертте: бір сөзді ауыстыр, үкімнің өзгергенін көр. */
  explore: [
    {
      id: "e1", pre: "After the training,", post: "of the pupils matched the paper group's detail scores.", sents: [14],
      opts: [
        { w: "all", st: "no", sent: 14, p: "some of these pupils", why: "Мәтін «some ... although others showed little change» дейді: бәрі емес. «all» мәтінге қайшы." },
        { w: "most", st: "absent", why: "Мәтін «some» дейді, бірақ олардың көпшілік пе, азшылық па екенін айтпайды. «most» расталмайды да, жоққа шығарылмайды." },
        { w: "some", st: "ok", sent: 14, p: "some of these pupils", why: "Мәтіндегі сөзбен дәл келеді: «some of these pupils matched the detail scores of the paper group»." },
        { w: "none", st: "no", sent: 14, p: "some of these pupils", why: "Кейбір оқушылар жетті («some ... matched»), сондықтан «none» мәтінге қайшы." },
      ],
    },
    {
      id: "e2", pre: "The second experiment was carried out", post: "any results were published.", sents: [12],
      opts: [
        { w: "before", st: "ok", sent: 12, p: "before publishing any results", why: "Мәтін дәл осыны айтады: «ran a second experiment in 2021, before publishing any results»." },
        { w: "after", st: "no", sent: 12, p: "before publishing any results", why: "Мәтінде реті керісінше: тәжірибе нәтижелер жарияланғанға дейін өткізілді. «after» мәтінге қайшы." },
      ],
    },
    {
      id: "e3", pre: "Paper readers did better than screen readers on", post: "questions.", sents: [5, 6],
      opts: [
        { w: "detail", st: "ok", sent: 6, p: "recalled details more accurately", why: "Мәтін растайды: қағазда оқығандар деректерді дәлірек есіне түсірген." },
        { w: "main-idea", st: "no", sent: 5, p: "almost identical for both formats", why: "Негізгі ой сұрақтарында нәтиже «almost identical», яғни айырмашылық жоқтың қасы. «did better» мәтінге қайшы." },
        { w: "vocabulary", st: "absent", why: "Мәтінде сөздік қорға арналған сұрақтар мүлде аталмайды: тек main ideas пен small details. Салыстыратын дерек жоқ." },
      ],
    },
  ],

  /* 5. Тексер, 1-бөлім: парафразды сәйкестендіру. right тізімінде бір артық нұсқа бар (pair: null). */
  pairs: {
    left: [
      { id: "a", t: "recalled details more accurately", kk: "деректерді дәлірек есіне түсірді" },
      { id: "b", t: "almost identical", kk: "бірдей дерлік" },
      { id: "c", t: "rarely returned to earlier paragraphs", kk: "алдыңғы абзацтарға сирек оралды" },
      { id: "d", t: "warns against concluding", kk: "қорытынды жасаудан сақтандырады" },
    ],
    right: [
      { t: "seldom went back in the text", kk: "мәтінде артқа сирек қайтты", pair: "c" },
      { t: "advises people not to assume", kk: "олай деп ойламауға кеңес береді", pair: "d" },
      { t: "scored far higher", kk: "әлдеқайда жоғары балл алды", pair: null },
      { t: "remembered small facts better", kk: "ұсақ деректерді жақсырақ есте сақтады", pair: "a" },
      { t: "hardly differed", kk: "айырмашылығы жоқтың қасы", pair: "b" },
    ],
    hints: [
      "Әр тіркестің негізгі сөзін синониммен ауыстырып көр: rarely, identical, recalled, warns.",
      "Ұқсас мысал: «rose sharply» пен «increased quickly» - парафраз; «rose sharply» пен «rose slightly» - парафраз емес, күші басқа.",
      "recalled details more accurately = remembered small facts better; almost identical = hardly differed; rarely returned = seldom went back; warns against concluding = advises people not to assume. «scored far higher» ешқайсысына сәйкес келмейді.",
    ],
  },

  /* 5. Тексер, 2-бөлім: үкім → дәлел. cands - ұсынылатын сөйлемдер (NG үшін: ең жақын «күдікті» сөйлемдер). */
  checkpoint: [
    {
      id: "c1", text: "Each pupil read all six articles on a tablet.", verdict: "F", ev: [2], cands: [1, 2, 13],
      about: "мақалалардың қандай форматта оқылғаны",
      why: "Мәтін: «half of them on paper and half on a tablet». Алтаудың үшеуі ғана планшетте оқылды, сондықтан «all six ... on a tablet» мәтінге қайшы.",
      whyNot: {
        T: "«the same six articles» сөздері сәйкес келеді, бірақ сөйлемнің соңын оқы: жартысы қағазда, жартысы планшетте.",
        NG: "Мәтін форматты нақты айтады: жартысы қағазда, жартысы планшетте. Айтылған нәрсе Not Given бола алмайды.",
      },
      hints: [
        "Мақалалар саны («six») жазылған сөйлемді тауып, оны соңына дейін оқы.",
        "Ұқсас мысал: мәтін «half of the trees were oaks» десе, «all of the trees were oaks» - False.",
        "«Each pupil read the same six articles, half of them on paper and half on a tablet»: half ≠ all. Үкім - False, дәлел - осы сөйлем.",
      ],
    },
    {
      id: "c2", text: "The difference between the two formats was greatest for the longest texts.", verdict: "T", ev: [7], cands: [5, 7, 16],
      about: "айырмашылықтың қай мақалаларда ең үлкен болғаны",
      why: "«The gap was widest for the longest articles»: gap = difference, widest = greatest, articles = texts. Мағына толық сәйкес.",
      whyNot: {
        F: "Мәтін де дәл осыны айтады: айырмашылық ең ұзын мақалаларда ең үлкен болған. Қайшылық жоқ.",
        NG: "Мәтінде бұл туралы сөйлем бар, тек сөздері басқа: gap, widest, articles. Парафразды ізде.",
      },
      hints: [
        "«difference» сөзінің синонимін ізде: мәтінде ол басқа сөзбен берілген.",
        "Ұқсас мысал: «the gap between rich and poor regions» = «the difference between rich and poor regions».",
        "«The gap was widest for the longest articles» сөйлемі: gap = difference, widest = greatest. Үкім - True.",
      ],
    },
    {
      id: "c3", text: "Girls recalled more details than boys.", verdict: "NG", ev: [], cands: [6, 1],
      about: "қыздар мен ұлдардың нәтижесін салыстыру",
      why: "Мәтін қағаз бен экранды салыстырады, ал қыздар мен ұлдарды еш жерде бөліп қарастырмайды. Бұл мәлімдемені растайтын да, жоққа шығаратын да сөйлем жоқ.",
      whyNot: {
        T: "«recalled details» сөздері мәтінде бар, бірақ ол жерде қағаз бен экран салыстырылған. Қыздар мен ұлдар туралы дерек жоқ.",
        F: "False болуы үшін мәтін «ұлдар көбірек есте сақтады» немесе «айырмашылық болмады» деуі керек еді. Мәтін жыныс бойынша ештеңе айтпайды.",
      },
      traps: {
        6: "Бұл сөйлем қағазда және экранда оқығандарды салыстырады. Қыздар мен ұлдар туралы сөз жоқ.",
        1: "Бұл сөйлем оқушылардың саны, жасы және мектептері туралы. Олардың жынысы да, нәтижесі де айтылмаған.",
      },
      hints: [
        "Мәтінде girls, boys, male, female сияқты сөздер бар ма? Тексеріп шық.",
        "Ұқсас мысал: мәтін «city buses were faster than trains» десе, «red buses were faster than blue ones» - Not Given: салыстыру басқа белгі бойынша.",
        "Мәтінде жыныс бойынша салыстыру жоқ. Үкім - Not Given; ең жақын екі сөйлемнің екеуі де басқа нәрсе туралы екенін раста.",
      ],
    },
    {
      id: "c4", text: "The research included schools from several large cities.", verdict: "F", ev: [16], cands: [0, 1, 16],
      about: "мектептердің қай жерде орналасқаны",
      why: "«All of the schools were in one rural region»: бәрі бір ауылдық аймақта. «several large cities» бұған қайшы.",
      whyNot: {
        T: "Мәтінде қалалар аталмайды; керісінше, мектептердің бәрі бір ауылдық аймақта делінген.",
        NG: "Not Given сияқты көрінеді, өйткені «cities» сөзі мәтінде жоқ. Бірақ мәтін мектептердің БӘРІ бір ауылдық аймақта екенін айтады: бұл қалалық мектептерді жоққа шығарады. Қарсы дерек бар болса, үкім - False.",
      },
      hints: [
        "Соңғы абзацтан мектептердің орналасуы туралы сөйлемді тап.",
        "Ұқсас мысал: мәтін «all of the shops were in one village» десе, «shops in several towns took part» - False, Not Given емес.",
        "«All of the schools were in one rural region»: all + one rural region «several large cities» дегенді жоққа шығарады. Үкім - False.",
      ],
    },
    {
      id: "c5", text: "Varga's team intends to study older learners next.", verdict: "T", ev: [18], cands: [0, 13, 18],
      about: "топтың келесі зерттеу жоспары",
      why: "«plans to repeat the work with university students»: plans = intends; университет студенттері 13-15 жастағы оқушылардан үлкен, яғни older learners.",
      whyNot: {
        F: "Мәтін жоспарды растайды: келесі қатысушылар - университет студенттері, олар мектеп оқушыларынан үлкен.",
        NG: "Соңғы сөйлемге қара: «plans to repeat the work with university students». Жоспар айтылған, тек басқа сөзбен.",
      },
      hints: [
        "«intends» сөзінің синонимін және келесі қатысушылар кім екенін ізде.",
        "Ұқсас мысал: «the firm plans to open a shop» = «the firm intends to start a store».",
        "Соңғы сөйлем: plans = intends; university students 13-15 жастағылардан үлкен. Үкім - True.",
      ],
    },
  ],

  /* 6. Қатені талда: тергеушінің қате пайымы берілген, тұзақты ата. */
  traps: [
    { name: "Сөз аңшылығы: сөздер сәйкес келген соң, мағынасын тексермеді", sign: "Сөз аңшылығында тергеуші бірдей сөздерді ғана дәлел қылады." },
    { name: "Сырттан білім қосты: мәтінде жоқ дерекке сүйенді", sign: "Сырттан білім қосқанда тергеуші мәтіннен емес, өз білгенінен дәлел келтіреді." },
    { name: "Мәтінде қарсы дерек бар, бірақ Not Given деді", sign: "Бұл тұзақта мәтін мәлімдемеге қайшы сөйлем береді, ал тергеуші оны байқамай «айтылмаған» дейді." },
    { name: "Мәтін үндемейді, бірақ False деді", sign: "Бұл тұзақта мәтін ештеңе айтпайды, ал тергеуші үнсіздікті қайшылық деп санайды." },
    { name: "Шектеуші сөзді (all, some, only) елемеді", sign: "Бұл тұзақта тергеуші all, some, only сияқты сөзге мән бермейді." },
  ],
  mistakes: [
    {
      id: "m1", sent: 9, text: "On tablets, most pupils returned to earlier paragraphs.", said: "T", right: "F", trap: 0,
      reasoning: "«On tablets», «most pupils», «returned to earlier paragraphs» - бәрі мәтінде сөзбе-сөз тұр. Демек True.",
      clue: "ол тек сөздердің сәйкестігін дәлел қылды, «rarely» сөзін оқымады",
      ok: "Сөздер сәйкес келді, бірақ «rarely» мағынаны кері аударады. Дұрыс үкім - False.",
    },
    {
      id: "m2", sent: null, text: "Reading on screens is bad for teenagers' eyesight.", said: "T", right: "NG", trap: 1,
      reasoning: "Экранның көзге зиян екенін бәрі біледі. Демек True.",
      clue: "ол мәтіннен бірде-бір сөйлем келтірмеді, «бәрі біледі» деп сырттан дерек қосты",
      ok: "Мәтінде көру қабілеті (eyesight) туралы бір сөз де жоқ. Өмірде рас болса да, мәтінде жоқ нәрсе - Not Given.",
    },
    {
      id: "m3", sent: 16, text: "The study included fiction texts.", said: "NG", right: "F", trap: 2,
      reasoning: "Мәтінде көркем шығармалар сипатталмаған, олар туралы дерек жоқ. Демек Not Given.",
      clue: "мәтінде «every text was a factual article rather than fiction» деген қарсы дерек тұр",
      ok: "«every text was a factual article rather than fiction»: барлық мәтін деректі болды, яғни көркем мәтін болған жоқ. Қарсы дерек бар, сондықтан дұрыс үкім - False.",
    },
    {
      id: "m4", sent: 18, text: "University students read better on paper than on screens.", said: "F", right: "NG", trap: 3,
      reasoning: "Мәтінде студенттердің қағазда жақсы оқитыны айтылмаған. Айтылмаса, жалған деген сөз. Демек False.",
      clue: "мәтін студенттер туралы тек жоспарды айтады, нәтиже жоқ; ол осы үнсіздікті қайшылық деп санады",
      ok: "Студенттермен зерттеу әлі жоспарда ғана («plans to repeat»), нәтижесі белгісіз. False деу үшін қарсы дерек керек; ол жоқ, сондықтан дұрыс үкім - Not Given.",
    },
    {
      id: "m5", sent: 14, text: "After the training, all of the tablet readers matched the paper group.", said: "T", right: "F", trap: 4,
      reasoning: "Сөйлемде оқушылардың қағаз тобының нәтижесіне жеткені жазылған. Демек True.",
      clue: "ол мәтіндегі «some» мен мәлімдемедегі «all» сөздерінің айырмасына мән бермеді",
      ok: "Мәтін «some of these pupils» дейді, мәлімдеме «all» дейді. Бір шектеуші сөз үкімді өзгертеді: дұрыс үкім - False.",
    },
  ],

  /* 7. Меңгеру: жаңа мәтін, жаңа мәлімдемелер, көмексіз. pass - бірінші әрекеттен дұрыс болуы керек іс саны. */
  passageB: {
    title: "Night Transport in Velmora",
    sentences: [
      { p: 0, t: "In 2022, the transport researcher Tomas Rehn surveyed 640 night-shift workers in the port city of Velmora.", topic: "зерттеуді кім, қашан және кімдер арасында жүргізгені" },
      { p: 0, t: "Before the survey, the city had replaced three of its five night bus routes with an on-demand minibus service.", topic: "қаланың түнгі автобус бағыттарын ауыстырғаны" },
      { p: 0, t: "Rehn found that average waiting times fell from 24 minutes to 11 minutes.", topic: "күту уақытының өзгеруі" },
      { p: 0, t: "Even so, fewer than half of the workers said they were satisfied with the new service.", topic: "жұмысшылардың жаңа қызметке көңілі толғаны" },
      { p: 1, t: "Many complained that the booking app often failed after midnight.", topic: "қолданбаның түн ортасынан кейін істен шығуы" },
      { p: 1, t: "Workers over fifty were the least likely to use the app at all.", topic: "елуден асқан жұмысшылардың қолданбаны пайдалануы" },
      { p: 1, t: "Rehn recommends keeping a telephone booking line rather than relying on the app alone.", topic: "Реннің ұсынысы" },
      { p: 1, t: "The city council has not yet responded to his report.", topic: "қала кеңесінің есепке жауабы" },
    ],
  },
  masteryPass: 5,
  mastery: [
    {
      id: "x1", text: "After the change, people waited less than half as long as before.", verdict: "T", ev: [2],
      links: [{ q: "less than half as long", p: "from 24 minutes to 11 minutes" }],
      about: "күту уақытының қаншалық қысқарғаны",
      why: "24 минуттың жартысы - 12 минут, ал жаңа күту уақыты 11 минут: 11 < 12. Демек адамдар бұрынғының жартысынан аз күтті.",
      whyNot: { F: "Есептеп көр: 24 ÷ 2 = 12, ал 11 < 12. Мәтін мәлімдемені растайды." },
    },
    {
      id: "x2", text: "The majority of the workers were pleased with the on-demand service.", verdict: "F", ev: [3],
      links: [{ q: "The majority", p: "fewer than half" }, { q: "pleased", p: "satisfied" }],
      about: "жұмысшылардың қаншасының қызметке риза болғаны",
      why: "«fewer than half ... were satisfied»: жартысына жетпейді. «The majority» (көпшілік) бұған қайшы.",
      whyNot: { T: "pleased = satisfied, бірақ санға қара: «fewer than half» көпшілік емес." },
    },
    {
      id: "x3", text: "A journey on the minibus costs more than a journey on the old buses.", verdict: "NG", ev: [],
      links: [],
      about: "жол ақысының бағасы",
      why: "Мәтінде баға, билет немесе ақы туралы бір сөйлем де жоқ: тек күту уақыты, қанағаттану және қолданба айтылған.",
      whyNot: {
        T: "Мәтінде баға туралы дерек жоқ, сондықтан оны растай алмаймыз.",
        F: "False деу үшін мәтін бағаның арзан немесе бірдей екенін айтуы керек еді. Баға мүлде аталмайды.",
      },
      traps: { 1: "Мұнда автобус бағыттары мен минибус қызметі аталады, бірақ жол ақысы туралы сөз жоқ." },
    },
    {
      id: "x4", text: "All of the city's night bus routes were replaced.", verdict: "F", ev: [1],
      links: [{ q: "All", p: "three of its five" }],
      about: "қанша автобус бағытының ауыстырылғаны",
      why: "«three of its five night bus routes»: бес бағыттың үшеуі ғана ауыстырылды, екеуі қалды. «All» мәтінге қайшы.",
      whyNot: { T: "«replaced» сөзі сәйкес келеді, бірақ санға қара: бесеудің үшеуі - бәрі емес." },
    },
    {
      id: "x5", text: "Rehn advises the city to let people book by phone.", verdict: "T", ev: [6],
      links: [{ q: "advises", p: "recommends" }, { q: "book by phone", p: "telephone booking line" }],
      about: "Реннің телефон арқылы тапсырыс туралы кеңесі",
      why: "recommends = advises; «keeping a telephone booking line» = телефон арқылы тапсырыс беру мүмкіндігін сақтау. Мағына сәйкес.",
      whyNot: { F: "Рен қолданбаға ғана сүйенбеуді, телефон желісін сақтауды ұсынады. Бұл мәлімдемемен бірдей." },
    },
    {
      id: "x6", text: "Rehn himself used to work night shifts in Velmora.", verdict: "NG", ev: [],
      links: [],
      about: "Реннің өзінің түнгі ауысымда жұмыс істегені",
      why: "Мәтін Реннің түнгі ауысым жұмысшыларын зерттегенін айтады. Оның өзі сондай жұмыс істеген-істемегені еш жерде айтылмаған.",
      whyNot: {
        T: "«night-shift workers» сөздері бар, бірақ олар - зерттелген адамдар. Реннің өз тәжірибесі айтылмаған.",
        F: "False деу үшін мәтін Реннің ешқашан түнде жұмыс істемегенін айтуы керек еді. Мәтін бұл жөнінде үндемейді.",
      },
      traps: { 0: "Мұнда «Rehn», «night-shift workers» және «Velmora» бар, бірақ Рен оларды зерттеді. Өзінің түнгі ауысымда істегені айтылмаған." },
    },
  ],
};
