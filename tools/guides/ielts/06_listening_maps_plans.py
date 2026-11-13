# © 2026 Sagid Mustafa. All Rights Reserved.
# AO17 IELTS оқулығы · Listening · Карта мен жоспар: бағыт сілтеу тілі. Авторлық мазмұн.
_PARK = ("<table><tr><td>A</td><td>Lake</td><td>B</td></tr>"
         "<tr><td>C</td><td>Fountain</td><td>D</td></tr>"
         "<tr><td>Café</td><td>Main entrance ↑</td><td>E</td></tr></table>")
_STREET = ("<table><tr><td>A</td><td>Bridge</td><td>B</td></tr>"
           "<tr><td>C</td><td>Mill Lane</td><td>D</td></tr>"
           "<tr><td>Bank</td><td>Mill Lane</td><td>E</td></tr>"
           "<tr><td colspan=\"3\">Station Road · You are here ↑</td></tr></table>")
_SPORT = ("<table><tr><td>A</td><td>B</td><td>C</td></tr>"
          "<tr><td colspan=\"3\">Corridor</td></tr>"
          "<tr><td>D</td><td>Reception</td><td>E</td></tr>"
          "<tr><td colspan=\"3\">Entrance ↑ (north is at the top)</td></tr></table>")
_CAMPUS = ("<table><tr><td>A</td><td>Library</td><td>B</td></tr>"
           "<tr><td>C</td><td>Square</td><td>D</td></tr>"
           "<tr><td>E</td><td>Main gate ↑</td><td>F</td></tr></table>")
LESSON = {
    "id": "ielts.listening.maps-plans",
    "title": "Карта мен жоспар: бағыт сілтеу тілі",
    "section": "Listening",
    "minutes": 35, "level": "негіз",
    "goals": [
        "Карта/жоспар тапсырмасының құрылысын түсіну: бастапқы нүкте, дайын жазулар, әріптер.",
        "Орын (opposite, next to, behind) және қозғалыс (go past, turn left at, straight ahead) сөздерін тану.",
        "Компас бағыттарын (north, south-west corner) картаға дұрыс түсіру.",
        "Сөйлеуші қай жаққа қарап тұрғанына байланысты «сол» мен «оңды» шатастырмау.",
    ],
    "hook": {
        "text": "<p>Қағаздағы жоспарда ғимараттың кіреберісі <b>жоғарыда</b> салынған, яғни келуші картаның жоғарғы жағынан төмен қарай кіреді. "
                "Гид былай дейді: [[As you come in through the entrance, the ticket office is on your right.]] "
                "Сіз қағазға өз орындығыңыздан қарап отырсыз, ал келуші ғимаратқа кіріп, төмен қарай жүріп барады.</p>",
        "predict": {"q": "Ticket office қағаздағы жоспардың қай жағында орналасқан?", "options": ["Оң жағында - гид «on your right» деді", "Сол жағында - келуші төмен қарай жүріп барады, оның оң қолы картаның сол жағына сәйкес", "Анықтау мүмкін емес"], "answer": 1,
                    "why": "«Сол» мен «оң» - картаның емес, жүріп бара жатқан адамның жақтары. Адам картада төмен қарай жүрсе, оның оң қолы қағаздың сол жағын көрсетеді. Мұны тексерудің оңай жолы: қағазды ойша (не шынымен) бұрып, өзіңізді сол адамның орнына қойыңыз. Карта тапсырмасындағы қателердің көбі осы бір айналудан шығады."},
    },
    "explain": [
        {"h": "Тапсырма қандай болады",
         "body": "<p>Сізге карта (көше, саябақ, кампус) не ғимарат жоспары беріледі. Онда бірнеше жер <b>дайын жазылған</b> (мысалы, [[Main entrance]], [[Lake]]), ал қалғандары әріппен белгіленген: A, B, C… Астында жерлер тізімі тұрады: [[boat hire]], [[gift shop]]. Міндет - әр жердің әрпін табу.</p>"
                 "<p>Әдетте бұл Listening-тің екінші бөлігінде кездеседі: бір адам (гид, қызметкер) келушілерге орынды таныстырады.</p>"
                 "<table><tr><th>Картадағы элемент</th><th>Не үшін керек</th></tr>"
                 "<tr><td>Бастапқы нүкте ([[You are here]], [[Entrance]])</td><td>сипаттама осы жерден басталады</td></tr>"
                 "<tr><td>Дайын жазулар</td><td>бағдар: диктор «көлдің қасында», «фонтаннан өткен соң» дейді</td></tr>"
                 "<tr><td>Компас белгісі (N ↑)</td><td>диктор north, east сөздерін қолданатынын білдіреді</td></tr>"
                 "<tr><td>Әріптер</td><td>жауап нұсқалары; әріп саны сұрақ санынан көп болуы мүмкін</td></tr></table>"
                 "<p>Сұрақтар жазбаның ретімен жүреді: тізімдегі бірінші жер бірінші сипатталады. Ал әріптер картада кез келген ретпен орналасады.</p>"},
        {"h": "Орын сөздері: зат қайда тұр",
         "body": "<table><tr><th>Сөз</th><th>Мағынасы</th><th>Мысал</th></tr>"
                 "<tr><td>[[next to]], [[beside]], [[adjacent to]]</td><td>қасында, жанында</td><td>[[The shop is next to the café.]]</td></tr>"
                 "<tr><td>[[opposite]], [[facing]], [[across the road from]]</td><td>қарсысында</td><td>[[The bank is opposite the hotel.]]</td></tr>"
                 "<tr><td>[[between A and B]]</td><td>екеуінің ортасында</td><td>[[between the lake and the wood]]</td></tr>"
                 "<tr><td>[[behind]]</td><td>артында</td><td>[[The car park is behind the hall.]]</td></tr>"
                 "<tr><td>[[in front of]]</td><td>алдында</td><td>[[a bench in front of the library]]</td></tr>"
                 "<tr><td>[[at the end of]]</td><td>соңында, түбінде</td><td>[[at the end of the corridor]]</td></tr>"
                 "<tr><td>[[in the corner]]</td><td>бұрышта</td><td>[[in the far corner of the park]]</td></tr>"
                 "<tr><td>[[just before]] / [[just after]], [[beyond]]</td><td>жетпей / өткен соң</td><td>[[just before the bridge]]</td></tr></table>"
                 "<p>Екі сөзге назар аударыңыз. [[Opposite]] - қасында емес, <b>қарсы бетте</b>: арасында жол не дәліз бар. [[In front of]] - қарсысында емес, сол жақтың <b>дәл алдында</b>. Бұл екеуін шатастыру - ең жиі қате.</p>"},
        {"h": "Қозғалыс сөздері: қалай жетеміз",
         "body": "<p>Гид көбіне жолды «жүріп өтеді». Қарындашыңыздың ұшын картаға қойып, онымен бірге жүріңіз.</p>"
                 "<table><tr><th>Тіркес</th><th>Мағынасы</th></tr>"
                 "<tr><td>[[go straight ahead / straight on]]</td><td>тура жүру, бұрылмау</td></tr>"
                 "<tr><td>[[go past the bank]]</td><td>банктің <b>жанынан өту</b> (банк жауап емес!)</td></tr>"
                 "<tr><td>[[turn left at the fountain]]</td><td>фонтанға жеткенде солға бұрылу</td></tr>"
                 "<tr><td>[[take the second turning on the right]]</td><td>оң жақтағы екінші бұрылысқа түсу</td></tr>"
                 "<tr><td>[[follow the path round]]</td><td>жолмен айналып жүру</td></tr>"
                 "<tr><td>[[go through the gate / across the square]]</td><td>қақпа арқылы / алаңды кесіп өту</td></tr>"
                 "<tr><td>[[you'll come to…]], [[you'll see… on your left]]</td><td>жеттіңіз: жауап осы жерде</td></tr></table>"
                 "<p>[[Go past]] тіркесі - әдейі қойылған қақпан. Диктор бір ғимаратты атайды, бірақ ол тек <b>бағдар</b>: керегі - одан кейінгісі. [[The first building you come to]] және [[the next building after…]] сөздеріне де мән беріңіз.</p>"},
        {"h": "Компас бағыттары",
         "body": "<p>Картада N ↑ белгісі тұрса, диктор [[north]] (солтүстік), [[south]] (оңтүстік), [[east]] (шығыс), [[west]] (батыс) сөздерін қолданады. Белгі болмаса да, әдетте картаның <b>жоғарғы жағы - солтүстік</b>.</p>"
                 "<table><tr><th></th><th>сол</th><th>ортасы</th><th>оң</th></tr>"
                 "<tr><th>жоғары</th><td>north-west</td><td>north</td><td>north-east</td></tr>"
                 "<tr><th>ортасы</th><td>west</td><td>centre</td><td>east</td></tr>"
                 "<tr><th>төмен</th><td>south-west</td><td>south</td><td>south-east</td></tr></table>"
                 "<p>Жиі кездесетін түрлері: [[in the north-east corner]] (солтүстік-шығыс бұрышта), [[to the south of the lake]] (көлдің оңтүстігінде), [[on the western side]] (батыс жағында). Есте сақтау үшін: <b>W</b>est - сол жақта, <b>E</b>ast - оң жақта; бірге оқысаңыз «WE» шығады.</p>"
                 "<p>Компас сөздері ыңғайлы: олар адамның қай жаққа қарап тұрғанына <b>тәуелді емес</b>. Ал [[left]] пен [[right]] - тәуелді.</p>"},
        {"h": "«Сол» мен «оң» қашан ауысады",
         "body": "<p>[[On your left]] - жүріп бара жатқан адамның сол қолы. Адам картада жоғары қарай жүрсе, оның сол жағы қағаздың сол жағымен бірдей. Ал төмен қарай жүрсе - бәрі керісінше.</p>"
                 "<table><tr><th>Адам картада қайда қарап жүр</th><th>[[on your left]] - қағаздың…</th><th>[[on your right]] - қағаздың…</th></tr>"
                 "<tr><td>жоғары (↑)</td><td>сол жағы</td><td>оң жағы</td></tr>"
                 "<tr><td>төмен (↓)</td><td>оң жағы</td><td>сол жағы</td></tr>"
                 "<tr><td>оңға (→)</td><td>жоғарғы жағы</td><td>төменгі жағы</td></tr>"
                 "<tr><td>солға (←)</td><td>төменгі жағы</td><td>жоғарғы жағы</td></tr></table>"
                 "<p>Кестені жаттаудың қажеті жоқ. Қағазды бұрып, жүру бағыты сізден әрі қарай көрсететіндей етіңіз - сонда сол сол болады, оң оң болады. Компьютердегі емтиханда экранды бұра алмайсыз, сондықтан ойша бұруды осы жаттығуларда үйреніңіз.</p>"
                 "<p>[[With your back to the library]] (кітапханаға арқаңызды беріп) деген тіркес те кездеседі: демек сіз кітапханадан <b>кері</b> қарап тұрсыз.</p>"},
        {"h": "Жазбаға дейінгі дайындық",
         "body": "<ol><li><b>Бастапқы нүктені табыңыз</b> да, оған қарындаш ұшын қойыңыз.</li>"
                 "<li><b>Дайын жазуларды оқыңыз</b>: диктор соларды бағдар етеді. Оларды ішіңізден айтып көріңіз - естігенде бірден танисыз.</li>"
                 "<li><b>Компас бар ма</b>, қараңыз. Бар болса, north/east сөздерін күтіңіз.</li>"
                 "<li><b>Тізімдегі жерлерді оқыңыз</b>: қайсысы бірінші сипатталатынын білесіз.</li></ol>"
                 "<p>Бір жерді жіберіп алсаңыз, тізімдегі келесі атауды күтіңіз. Диктор жаңа жерді атаған сайын жаңа сұрақ басталады.</p>"},
    ],
    "method": {"title": "Емтихандағы әдіс: «қарындашпен бірге жүр»", "steps": [
        {"name": "Бастауды тап", "text": "Кіреберісті не «You are here» белгісін тауып, қай жаққа қарап тұрғаныңызды анықтаңыз. Компас белгісін тексеріңіз."},
        {"name": "Бағдарларды оқы", "text": "Картадағы дайын жазуларды (lake, fountain, bank) оқып шығыңыз: диктор жаңа жерді солармен байланыстырып сипаттайды."},
        {"name": "Қарындашпен жүр", "text": "Әр қозғалыс сөзін естігенде қарындаш ұшын жылжытыңыз. Бұрылған сайын «сол» мен «оңды» жаңа бағыт бойынша анықтаңыз."},
        {"name": "Аялдаған жерде жаз", "text": "«you'll see», «you'll come to», «that's where… is» дегенді естігенде қарындаш тұрған жердегі әріпті жазыңыз. «go past» дегенде тоқтамаңыз."},
    ]},
    "worked": [
        {"task": "<p>Саябақ жоспары (жоғарғы жақ - солтүстік; кіреберіс төменде, келуші жоғары қарай жүреді):</p>" + _PARK +
                 "<p>Табу керек: [[1 boat hire]] · [[2 gift shop]] · [[3 picnic area]]</p>"
                 "<p><b>Транскрипт үзіндісі.</b> [[Guide: As you come in through the main entrance, the café is immediately on your left. Walk straight ahead until you reach the fountain. If you turn right there, the first building you come to is the boat hire office. The gift shop is back near the gate - it's opposite the café, on the other side of the entrance. And for those of you who've brought lunch, the picnic area is in the north-west corner, right beside the lake.]]</p>",
         "steps": ["Бастау: [[Main entrance]], жоғары қарай кіреміз. Тексеру: [[the café is… on your left]] - картада Café шынымен сол жақта. Демек сол - сол, оң - оң.",
                   "(1) [[straight ahead until… the fountain]] - қарындаш Fountain-ға жетті. [[turn right]] - оңға, яғни D-ға қарай. [[the first building you come to]] → D.",
                   "(2) [[opposite the café, on the other side of the entrance]] - Café кіреберістің сол жағында, қарсы беті - оң жағы → E.",
                   "(3) [[in the north-west corner]] - жоғарғы сол бұрыш. [[right beside the lake]] - Lake-тің қасы → A."],
         "answer": "1 - D, 2 - E, 3 - A",
         "trap": "(2)-де opposite сөзін «қасында» деп түсініп, C-ны таңдау. C - кафенің артында (солтүстігінде), ал opposite - кіреберістің арғы бетінде."},
        {"task": "<p>Көше картасы (жоғарғы жақ - солтүстік). Сіз Station Road бойында, Mill Lane басында, солтүстікке қарап тұрсыз:</p>" + _STREET +
                 "<p>Табу керек: [[1 post office]] · [[2 pharmacy]] · [[3 museum]] · [[4 bakery]]</p>"
                 "<p><b>Транскрипт үзіндісі.</b> [[Assistant: You're on Station Road, at the bottom of Mill Lane, facing north. The bank is on the corner on your left. Go up Mill Lane, past the bank, and the next building on the same side is the post office. The pharmacy is directly opposite the post office. Carry on to the end of the lane and, just before the bridge, on the north-east side, you'll see the museum. Oh, and if you want fresh bread, the bakery is across the road from the bank.]]</p>",
         "steps": ["Бастау: төменгі жақ, солтүстікке қараймыз. [[The bank is… on your left]] - картада Bank сол жақта, сәйкес келеді.",
                   "(1) [[past the bank]] - банк жауап емес, тек бағдар. [[the next building on the same side]] - сол жақтағы келесі ғимарат → C.",
                   "(2) [[directly opposite the post office]] - Mill Lane-нің арғы бетінде, C-ның қарсысында → D.",
                   "(3) [[just before the bridge, on the north-east side]] - көпірге жетпей, жоғарғы оң жақ → B.",
                   "(4) [[across the road from the bank]] - банктің қарсысы → E. A әрпі пайдаланылмады: артық әріп болуы қалыпты."],
         "answer": "1 - C, 2 - D, 3 - B, 4 - E",
         "trap": "(1)-де «past the bank» дегенді естіп, Bank тұрған жерді белгілеу не (3)-те north-east пен north-west-ті шатастырып, A-ны жазу."},
    ],
    "traps": [
        {"wrong": "left/right сөздерін әрқашан қағаздың сол/оң жағы деп түсіну.", "why": "Бұл сөздер жүріп бара жатқан адамға қатысты; адам картада төмен қарай жүрсе, жақтар ауысады.", "fix": "Қағазды (не ойша өзіңізді) жүру бағытына қарай бұрыңыз, содан кейін ғана сол мен оңды анықтаңыз."},
        {"wrong": "go past сөзінен кейін аталған ғимаратты жауап деп жазу.", "why": "go past - сол жердің жанынан өтіп кету; ол тек бағдар.", "fix": "«you'll see», «you'll come to», «the next building is» сөздерін күтіңіз - жауап сонда."},
        {"wrong": "opposite пен next to сөздерін шатастыру.", "why": "Екеуі де «жақын» дегенді білдіреді, бірақ opposite - арғы бетте, next to - бір қатарда.", "fix": "opposite естілсе, жолдың не дәліздің қарсы жағына қараңыз."},
        {"wrong": "east пен west-ті шатастыру.", "why": "Солтүстік пен оңтүстік оңай есте қалады, ал шығыс пен батыс жиі ауысып кетеді.", "fix": "Картаның үстіне «W ← → E» деп жазып қойыңыз: бірге оқығанда WE шығады."},
    ],
    "practice": [
        {"type": "mc", "q": "«The bank is opposite the hotel» деген сөйлем нені білдіреді?",
         "options": ["Банк қонақүйдің қасында, бір қатарда тұр", "Банк қонақүйдің қарсысында, жолдың арғы бетінде тұр", "Банк қонақүйдің артында тұр"], "answer": 1,
         "why": ["Бір қатарда қасында тұру - next to не beside.", "Дұрыс: opposite - қарсы бетте, бетпе-бет.", "Артында тұру - behind."],
         "hints": ["Үш орын сөзін ажыратыңыз: next to, opposite, behind.", "Ұқсас мысал: «My seat is opposite yours» - біз бір-бірімізге қарап отырмыз.", "opposite = қарсысында. Арасында жол не дәліз бар."]},
        {"type": "mc", "q": "Спорт орталығының жоспары бойынша: changing rooms қай әріп?",
         "passage": "<p>Жоспар (кіреберіс төменде, келуші жоғары қарай жүреді):</p>" + _SPORT +
                    "<p><b>Транскрипт үзіндісі.</b> [[Receptionist: From reception, just walk straight across the corridor - the changing rooms are right in front of you.]]</p>",
         "options": ["A", "B", "C", "D"], "answer": 1,
         "why": ["A - дәліздің арғы бетінде, бірақ сол жақта; тура алдыңызда емес.", "Дұрыс: Reception-нан дәлізді тура кесіп өтсеңіз, дәл қарсысында B тұр.", "C - арғы бетте, бірақ оң жақта.", "D - дәлізден бергі бетте, Reception-ның қасында."],
         "hints": ["Қарындашты Reception-ға қойып, straight across дегенді орындаңыз.", "Ұқсас мысал: «cross the road - the shop is right in front of you» → дәл қарсыдағы ғимарат.", "Reception ортада → тура жоғары → B."]},
        {"type": "mc", "q": "Спорт орталығының жоспары бойынша: café қай әріп?",
         "passage": "<p>Жоспар (кіреберіс төменде, келуші жоғары қарай жүреді):</p>" + _SPORT +
                    "<p><b>Транскрипт үзіндісі.</b> [[Receptionist: The café is on the ground floor too. It's next to reception, on your right as you come in.]]</p>",
         "options": ["A", "C", "D", "E"], "answer": 3,
         "why": ["A дәліздің арғы бетінде; ол Reception-ның қасында емес.", "C де дәліздің арғы бетінде.", "D - Reception-ның қасында, бірақ кіргенде сол жақта.", "Дұрыс: келуші жоғары қарай кіреді, оның оң жағы - қағаздың оң жағы. Reception-ның оң жағындағы көрші - E."],
         "hints": ["Екі шарт бар: next to reception және on your right. Екеуін бірдей тексеріңіз.", "Ұқсас мысал: жоғары қарай жүрген адамның оң қолы қағаздың оң жағына сәйкес.", "Reception-ның қасында D мен E. Кіргенде оң жақта → E."]},
        {"type": "gap", "q": "Спорт орталығының жоспары бойынша әріпті жазыңыз: The gym is letter ___.",
         "passage": "<p>Жоспар (жоғарғы жақ - солтүстік):</p>" + _SPORT +
                    "<p><b>Транскрипт үзіндісі.</b> [[Receptionist: The gym is in the north-west corner of the building, so it gets the evening sun.]]</p>",
         "accept": ["A"],
         "explain": "north - жоғарғы жақ, west - сол жақ. Жоғарғы сол бұрышта A тұр. Компас сөздері адамның қай жаққа қарап тұрғанына тәуелді емес.",
         "errors": {"c": "C - жоғарғы оң бұрыш, яғни north-east. West - сол жақ.", "d": "D - төменгі сол жақ, яғни south-west. North - жоғары."},
         "hints": ["north пен west картаның қай жақтары?", "Ұқсас мысал: «south-east corner» - төменгі оң бұрыш.", "north = жоғары, west = сол → жоғарғы сол бұрыш → A."]},
        {"type": "mc", "q": "Адам B бөлмесінен дәлізге шығып, оңтүстікке (картада төмен) қарап тұр. Оған «turn left» десе, ол қағаздың қай жағына қарай жүреді?",
         "passage": "<p>Жоспар (жоғарғы жақ - солтүстік):</p>" + _SPORT,
         "options": ["Қағаздың сол жағына (батысқа)", "Қағаздың оң жағына (шығысқа)", "Қағаздың жоғарғы жағына (солтүстікке)"], "answer": 1,
         "why": ["Бұл жоғары қарай жүрген адам үшін дұрыс болар еді; ал мұнда адам төмен қарап тұр.", "Дұрыс: оңтүстікке қарап тұрған адамның сол қолы шығысты, яғни қағаздың оң жағын көрсетеді.", "Солтүстік - оның арт жағы."],
         "hints": ["Өзіңізді сол адамның орнына қойыңыз: бетіңіз картаның төменгі жағына қарап тұр.", "Ұқсас мысал: сізге қарсы қарап тұрған адамның оң қолы сіздің сол жағыңызда болады.", "Төмен қарап тұрғанда: left = қағаздың оң жағы (шығыс)."]},
        {"type": "mc", "q": "Транскрипт бойынша: кітапхана қай жерде?",
         "passage": "<p><b>Транскрипт үзіндісі.</b> [[Officer: Walk along Green Street and go past the cinema. The library is the next building after it, just before the traffic lights.]]</p>",
         "options": ["Кинотеатрдың орнында", "Кинотеатрдан кейін, бағдаршамға жетпей", "Бағдаршамнан өткен соң"], "answer": 1,
         "why": ["go past the cinema - кинотеатрдың жанынан өту; ол тек бағдар.", "Дұрыс: «the next building after it» + «just before the traffic lights» - екеуінің арасында.", "just before - жетпей; өткен соң болса, just after делінер еді."],
         "hints": ["go past пен just before тіркестерінің мағынасын еске түсіріңіз.", "Ұқсас мысал: «go past the school; the shop is next» → дүкен мектептен кейін.", "Реті: cinema → library → traffic lights."]},
    ],
    "mastery": [
        {"type": "mc", "q": "Кампус жоспары бойынша: lecture hall қай әріп?",
         "passage": "<p>Жоспар (жоғарғы жақ - солтүстік; қақпа төменде):</p>" + _CAMPUS +
                    "<p><b>Транскрипт үзіндісі.</b> [[Student guide: Come through the main gate and cross the square. The library is straight ahead of you. The lecture hall is the building immediately to the left of the library.]]</p>",
         "options": ["A", "B", "C", "E"], "answer": 0,
         "why": ["Дұрыс: жоғары қарай жүріп келеміз, Library алдымызда; оның сол жағындағы көрші - A.", "B - кітапхананың оң жағында.", "C - алаңның сол жағында, кітапхананың қасында емес.", "E - қақпаның қасында, төменгі қатарда."]},
        {"type": "gap", "q": "Кампус жоспары бойынша әріпті жазыңыз: The bookshop is letter ___.",
         "passage": "<p>Жоспар (жоғарғы жақ - солтүстік):</p>" + _CAMPUS +
                    "<p><b>Транскрипт үзіндісі.</b> [[Student guide: The bookshop is easy to miss. It's in the south-east corner of the campus, right next to the main gate.]]</p>",
         "accept": ["F"],
         "explain": "south - төменгі жақ, east - оң жақ: төменгі оң бұрыш - F. Ол Main gate-тің қасында тұр, екінші белгі де сәйкес.",
         "errors": {"e": "E - төменгі сол бұрыш, яғни south-west. East - оң жақ.", "b": "B - жоғарғы оң бұрыш, яғни north-east. South - төмен."}},
        {"type": "mc", "q": "Кампус жоспары бойынша: canteen қай әріп?",
         "passage": "<p>Жоспар (жоғарғы жақ - солтүстік):</p>" + _CAMPUS +
                    "<p><b>Транскрипт үзіндісі.</b> [[Student guide: Now stand in the middle of the square with your back to the library, so you're looking towards the gate. The canteen is on your right.]]</p>",
         "options": ["B", "C", "D", "F"], "answer": 1,
         "why": ["B - жоғарғы қатарда, алаңның жанында емес.", "Дұрыс: кітапханаға арқа беріп тұрсыз, яғни төмен (оңтүстікке) қарайсыз. Сонда оң қолыңыз қағаздың сол жағын көрсетеді: алаңның сол жағында C тұр.", "D - қағаздың оң жағында; бұл жоғары қарап тұрған адам үшін дұрыс болар еді.", "F - қақпаның қасында, алдыңғы жақта."]},
    ],
    "summary": [
        "Бастапқы нүктені тауып, қарындашпен диктормен бірге «жүріңіз».",
        "Орын сөздері: next to - қасында, opposite - қарсысында, behind - артында, between - ортасында.",
        "go past - жанынан өту (бағдар), ал жауап «you'll see / you'll come to» дегеннен кейін келеді.",
        "Компас: жоғары - north, төмен - south, сол - west, оң - east (W ← → E).",
        "left/right жүріп бара жатқан адамға қатысты: төмен қарай жүргенде жақтар ауысады.",
    ],
    "lab": {"href": "listening.html", "title": "Listening зертханасы"},
    "sources": ["Сабақ мәтіні, жоспарлар, транскрипт үзінділері мен жаттығулары AO17 үшін жаңадан жазылған (авторы: Sagid Mustafa); орындар мен кейіпкерлер ойдан алынған. AO17 IELTS иелерімен байланысты емес және ресми балл бермейді."],
}


def _en(x):
    if isinstance(x, str):
        return x.replace("[[", '<span class="gd-en">').replace("]]", "</span>")
    if isinstance(x, list):
        return [_en(i) for i in x]
    if isinstance(x, dict):
        return {k: _en(v) for k, v in x.items()}
    return x


LESSON = _en(LESSON)
