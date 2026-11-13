# © 2026 Sagid Mustafa. All Rights Reserved.
# AO17 IELTS оқулығы · Reading · Абзацқа тақырып таңдау (Matching headings). Авторлық мазмұн.
_HONEY = ("<p>[[Honey has been eaten for thousands of years, and paintings of people collecting it survive from ancient times. Yet the honey sold in most shops today has little in common with what our ancestors knew. It is heated, filtered and often blended from several countries, a process that removes much of its original flavour.]]</p>")
_FARM = ("<p><b>A</b> [[When the first indoor farm opened in the port city of Daleth, critics dismissed it as an expensive toy. Lettuce grown under lamps, they pointed out, cost three times as much as lettuce from a field. Ten years later the gap has almost closed, largely because the lamps now use a fraction of the electricity they once did.]]</p>"
         "<p><b>B</b> [[Price, however, was never the main attraction for the restaurants that buy from the farm. What they value is certainty: the same leaves, of the same quality, delivered every morning regardless of storms or drought. A field cannot promise that.]]</p>")
LESSON = {
    "id": "ielts.reading.matching-headings",
    "title": "Matching headings: абзацтың негізгі ойын табу",
    "section": "Reading",
    "minutes": 35, "level": "орта",
    "goals": [
        "Matching headings тапсырмасының құрылысын түсіну: тақырыптар тізімі, артық нұсқалар, рим цифрлары.",
        "Абзацтың негізгі ойын жеке бөлшектен (мысал, дерек) ажырату.",
        "Бетбұрыс сөздер (but, yet, however) арқылы негізгі ойдың орнын табу.",
        "Алдамшы тақырыптың түрлерін тану: сөзі сәйкес, бір сөйлемге ғана қатысты, мағынасы қарама-қарсы.",
    ],
    "hook": {
        "text": "<p>Абзац:</p>" + _HONEY +
                "<p>Үш тақырып ұсынылған: <b>i</b> [[The long history of honey]] · <b>ii</b> [[How modern processing has changed honey]] · <b>iii</b> [[Honey from several countries]]. "
                "Абзац бал тарихынан басталады, ал соңында [[several countries]] сөздері тура кездеседі.</p>",
        "predict": {"q": "Осы абзацқа қай тақырып сәйкес?", "options": ["i - абзац балдың мыңдаған жылдық тарихынан басталады", "ii - абзацтың негізгі ойы: қазіргі өңдеу балды өзгертті", "iii - «several countries» сөздері абзацта дәл солай тұр"], "answer": 1,
                    "why": "Бірінші сөйлем - тек кіріспе. Екінші сөйлем «Yet» сөзінен басталады: бұл - бетбұрыс, автордың айтпағы содан кейін келеді. Қалған мәтін (қыздыру, сүзу, араластыру, дәмін жоғалту) түгел өңдеу туралы. «Several countries» - бір ғана бөлшек. Тақырып абзацтың бір сөйлеміне емес, бүкіл абзацқа сәйкес келуі керек."},
    },
    "explain": [
        {"h": "Тапсырма қалай құрылған",
         "body": "<p>Мәтіннің абзацтары әріппен белгіленген: A, B, C… Мәтіннің <b>алдында</b> тақырыптар тізімі ([[List of Headings]]) тұрады, олар кіші рим цифрларымен нөмірленген: i, ii, iii, iv, v, vi, vii, viii, ix, x. Міндет - әр абзацқа бір тақырып таңдау.</p>"
                 "<table><tr><th>Ерекшелігі</th><th>Нені білдіреді</th></tr>"
                 "<tr><td>Тақырып саны абзац санынан көп</td><td>2-3 тақырып артық қалады - олар алдамшы</td></tr>"
                 "<tr><td>Әр тақырып бір-ақ рет қолданылады</td><td>таңдалғанын сызып тастауға болады</td></tr>"
                 "<tr><td>Жауап - рим цифры</td><td>жауап парағына «iv» деп жазасыз, тақырыптың мәтінін емес</td></tr>"
                 "<tr><td>Кейде бір абзацтың жауабы мысал ретінде берілген</td><td>ол тақырыпты бірден сызып тастаңыз</td></tr></table>"
                 "<p>Рим цифрларын шатастырмаңыз: <b>iv</b> = 4, <b>vi</b> = 6, <b>ix</b> = 9. Жауапты көшіргенде осы жерде жиі қате кетеді.</p>"
                 "<p>Бұл тапсырманың жасырын пайдасы бар: оны орындағанда мәтіннің толық картасы өзінен-өзі шығады. Сондықтан ол мәтінде болса, көбіне содан бастаған тиімді.</p>"},
        {"h": "Тақырып - абзацтың негізгі ойы, бөлшегі емес",
         "body": "<p>Әр абзацта бір <b>негізгі ой</b> және оны қолдайтын бірнеше <b>бөлшек</b> (мысал, сан, себеп) болады. Тақырып негізгі ойды атайды.</p>"
                 "<table><tr><th>Абзац мазмұны</th><th>Дұрыс тақырып</th><th>Алдамшы (бөлшек)</th></tr>"
                 "<tr><td>Көпір екі жылға кешікті: жаңбырлы қыс, ереуіл, жұмсақ өзен түбі</td><td>[[Reasons for the delay]]</td><td>[[A strike by steelworkers]]</td></tr>"
                 "<tr><td>Бал бұрынғыдай емес: қыздырылады, сүзіледі, араластырылады</td><td>[[How processing has changed honey]]</td><td>[[Honey from several countries]]</td></tr></table>"
                 "<p>Тексерудің қарапайым жолы - <b>«қолшатыр сынағы»</b>: тақырып абзацтың <b>барлық</b> сөйлемдерін жаба ма? Егер ол бір сөйлемге ғана сәйкес келіп, қалғандары сыртта қалса - бұл бөлшек.</p>"
                 "<p>Тақырыптар әдетте жалпылама сөздермен жазылады: [[reasons]], [[a problem]], [[an obstacle]], [[origin]], [[benefits]], [[a new method]]. Ал абзацта нақты нәрселер тұрады: жаңбыр, ереуіл, баға. Сіздің міндетіңіз - нақтыдан жалпыға көтерілу: «жаңбыр, ереуіл, өзен түбі» → «кешігудің себептері».</p>"},
        {"h": "Негізгі ой абзацтың қай жерінде",
         "body": "<p>Көбіне негізгі ой бірінші сөйлемде тұрады, бірақ авторлар жиі «кіріспе + бетбұрыс» құрылымын қолданады. Мұндайда бірінші сөйлемге сенуге болмайды.</p>"
                 "<table><tr><th>Абзацтың құрылымы</th><th>Белгісі</th><th>Негізгі ой</th></tr>"
                 "<tr><td>Тікелей</td><td>бірінші сөйлем - жалпы мәлімдеме, қалғаны - мысалдар</td><td>бірінші сөйлем</td></tr>"
                 "<tr><td>Кіріспе + бетбұрыс</td><td>[[Yet]], [[However]], [[But]], [[In fact]]</td><td>бетбұрыс сөзінен кейін</td></tr>"
                 "<tr><td>Ескі пікір + жаңа дерек</td><td>[[once believed]], [[Many assume…]] → [[now]], [[the evidence suggests]]</td><td>жаңа дерек</td></tr>"
                 "<tr><td>Сұрақ + жауап</td><td>[[Visitors often ask why…]]</td><td>жауап</td></tr>"
                 "<tr><td>Оқиға + қорытынды</td><td>абзац нақты оқиғадан басталады</td><td>соңғы сөйлем</td></tr></table>"
                 "<p>Сондықтан абзацты шолғанда үш жерге қараңыз: <b>бірінші сөйлем</b>, <b>бетбұрыс сөзі бар сөйлем</b>, <b>соңғы сөйлем</b>. Үшеуінің ортақ ойы - негізгі ой.</p>"},
        {"h": "Алдамшы тақырыптардың түрлері",
         "body": "<table><tr><th>Түрі</th><th>Қалай алдайды</th><th>Қалай танимыз</th></tr>"
                 "<tr><td>Сөзі сәйкес</td><td>тақырыптағы сөз абзацта дәл солай тұр</td><td>сөз бар, бірақ абзац ол туралы емес</td></tr>"
                 "<tr><td>Бөлшек</td><td>абзацтың бір сөйлеміне дәл келеді</td><td>қолшатыр сынағынан өтпейді</td></tr>"
                 "<tr><td>Қарама-қарсы</td><td>тақырыбы сол, бірақ бағыты кері</td><td>абзац «арзандады» дейді, тақырып «қымбаттады» дейді</td></tr>"
                 "<tr><td>Тым кең</td><td>бүкіл мәтіннің тақырыбын атайды</td><td>кез келген абзацқа «сәйкес» келеді</td></tr>"
                 "<tr><td>Кіріспеге сәйкес</td><td>бетбұрысқа дейінгі бөлікті сипаттайды</td><td>[[Yet]] / [[However]]-ден кейін абзац басқа жаққа кетеді</td></tr></table>"
                 "<p>Дұрыс тақырып, керісінше, абзацтағы сөздерді сирек қайталайды - ол <b>парафразбен</b> жазылады: абзацта [[certainty… regardless of storms or drought]], тақырыпта [[a reliable supply]].</p>"
                 "<p>Екі тақырып бір-біріне ұқсас болса ([[The cost of…]] және [[A fall in the cost of…]]), оларды қатар қойып, айырмашылығын бір сөзбен атаңыз. Сосын абзацтан дәл сол айырмашылықты іздеңіз.</p>"},
        {"h": "Жұмыс тәртібі",
         "body": "<ol><li><b>Алдымен тақырыптарды оқыңыз</b>, әрқайсысынан бір-екі түйін сөзді сызыңыз. Ұқсас жұптарды белгілеңіз.</li>"
                 "<li><b>Абзацты шолыңыз</b>: бірінші сөйлем, бетбұрыс, соңғы сөйлем. Өз сөзіңізбен екі-үш сөзден тақырып қойыңыз.</li>"
                 "<li><b>Өз тақырыбыңызға ең жақын нұсқаны</b> тізімнен табыңыз. Қолшатыр сынағын жасаңыз.</li>"
                 "<li><b>Оңай абзацтардан бастаңыз.</b> Қиын абзацқа екі үміткерді (мысалы, «ii / v») жазып қойып, кейін оралыңыз: тақырыптар азайған сайын таңдау жеңілдейді.</li></ol>"
                 "<p>Маңызды: алдымен абзацты түсініп, сосын тақырып іздеңіз. Керісінше істесеңіз (тақырыпты алып, оның сөздерін абзацтан іздесеңіз), «сөзі сәйкес» алдамшыға түсесіз.</p>"},
    ],
    "method": {"title": "Емтихандағы әдіс: «өз тақырыбың - тізім - қолшатыр»", "steps": [
        {"name": "Тізімді оқы", "text": "Барлық тақырыпты оқып, түйін сөздерін сызыңыз. Мысал ретінде берілген тақырыпты сызып тастаңыз, ұқсас жұптарды белгілеңіз."},
        {"name": "Абзацқа өзің ат қой", "text": "Бірінші сөйлемді, бетбұрыс сөзінен (but, yet, however) кейінгі сөйлемді және соңғы сөйлемді оқып, абзацтың ойын екі-үш сөзбен айтыңыз."},
        {"name": "Тізімнен жұбын тап", "text": "Өз тақырыбыңызға мағынасы жақын нұсқаны таңдаңыз. Сөздердің сәйкестігіне емес, ойдың сәйкестігіне қараңыз."},
        {"name": "Қолшатыр сынағы", "text": "Таңдалған тақырып абзацтың барлық сөйлемін жаба ма? Бір сөйлемге ғана сәйкес келсе - ол бөлшек; басқасын іздеңіз. Қолданылған тақырыпты сызыңыз."},
    ]},
    "worked": [
        {"task": _HONEY + "<p>[[List of Headings]]<br><b>i</b> [[The long history of honey]]<br><b>ii</b> [[How modern processing has changed honey]]<br><b>iii</b> [[Honey from several countries]]<br><b>iv</b> [[The health benefits of honey]]</p>",
         "steps": ["Бірінші сөйлем: бал мыңдаған жыл бойы желінген. Бұл i тақырыбына ұқсайды. Бірақ асықпаймыз.",
                   "Екінші сөйлем [[Yet]] сөзінен басталады - бетбұрыс: [[the honey sold… today has little in common with what our ancestors knew]]. Автордың айтпағы - қазіргі бал басқаша.",
                   "Соңғы сөйлем неге басқаша екенін түсіндіреді: [[heated, filtered and often blended… removes much of its original flavour]]. Өз тақырыбымыз: «өңдеу балды өзгертті».",
                   "Тізімнен: ii - дәл осы. Қолшатыр сынағы: 2-ші және 3-ші сөйлемдер тікелей осы туралы, 1-ші сөйлем - салыстыруға арналған кіріспе. Өтті.",
                   "Қалғандары: i - тек кіріспе сөйлем; iii - бір бөлшек ([[several countries]]); iv - денсаулық туралы абзацта ештеңе жоқ."],
         "answer": "ii",
         "trap": "i тақырыбын таңдау, себебі абзац тарихтан басталады. Бетбұрыс сөзі (Yet) бар абзацта бірінші сөйлем негізгі ой емес, тек кіріспе."},
        {"task": _FARM + "<p>[[List of Headings]]<br><b>i</b> [[Why the early critics were proved right]]<br><b>ii</b> [[A fall in the cost of indoor growing]]<br><b>iii</b> [[The advantage of a reliable supply]]<br><b>iv</b> [[Restaurants that grow their own food]]<br><b>v</b> [[The effect of weather on field crops]]</p>",
         "steps": ["A абзацы: сыншылар фермаға күмәнмен қарады, себебі өнімі үш есе қымбат болды. Соңғы сөйлем: [[Ten years later the gap has almost closed]] - баға айырмасы жойылуға жақын.",
                   "Өз тақырыбымыз: «бұрын қымбат, қазір арзандады». Тізімнен: ii [[A fall in the cost]]. i - сыншылар аталған, бірақ олар <b>қате</b> болып шықты; тақырыптың мағынасы қарама-қарсы.",
                   "B абзацы [[Price, however, was never the main attraction]] деп басталады - баға емес, басқа нәрсе маңызды. [[What they value is certainty]] - негізгі ой.",
                   "Өз тақырыбымыз: «тұрақты, сенімді жеткізу». Тізімнен: iii [[a reliable supply]] - [[certainty… every morning]] сөздерінің парафразы.",
                   "Алдамшылар: iv - [[restaurants]] сөзі бар, бірақ олар өздері өсірмейді, сатып алады; v - [[storms or drought]] аталған, бірақ бұл бір бөлшек қана және абзац алқап туралы емес."],
         "answer": "A - ii, B - iii",
         "trap": "B абзацына iv не v тақырыбын таңдау: restaurants пен ауа райы сөздері абзацта бар. Бірақ біреуінің мағынасы абзацқа сәйкес емес, екіншісі - бір ғана бөлшек."},
    ],
    "traps": [
        {"wrong": "Тақырыптағы сөз абзацта тұрғандықтан сол тақырыпты таңдау.", "why": "Алдамшы тақырыптар әдейі абзацтағы сөздерден жасалады, ал дұрысы парафразбен жазылады.", "fix": "Алдымен абзацқа өз сөзіңізбен ат қойыңыз, сосын тізімнен мағынасы сәйкесін іздеңіз."},
        {"wrong": "Тек бірінші сөйлемге қарап шешім қабылдау.", "why": "Бірінші сөйлем кіріспе болуы мүмкін; негізгі ой Yet / However сөзінен кейін келеді.", "fix": "Үш жерге қараңыз: бірінші сөйлем, бетбұрыс сөзі бар сөйлем, соңғы сөйлем."},
        {"wrong": "Абзацтың бір сөйлеміне ғана сәйкес тақырыпты таңдау.", "why": "Бұл - бөлшек; тақырып бүкіл абзацты қамтуы керек.", "fix": "Қолшатыр сынағы: тақырып барлық сөйлемді жаба ма?"},
        {"wrong": "Бір қиын абзацқа тұрып қалып, уақытты соған жұмсау.", "why": "Қалған абзацтарды шешкенде тақырыптар азайып, қиыны өзінен-өзі оңайлайды.", "fix": "Екі үміткерді жазып қойып, келесі абзацқа өтіңіз; соңында оралыңыз."},
    ],
    "practice": [
        {"type": "mc", "q": "Тақырып абзацтың тек бір сөйлеміне дәл сәйкес келеді, ал қалған сөйлемдер басқа нәрсе туралы. Бұл нені білдіреді?",
         "options": ["Тақырып дұрыс - сәйкес сөйлем табылды", "Тақырып бөлшекті атайды; ол алдамшы болуы ықтимал", "Абзацқа екі тақырып қою керек"], "answer": 1,
         "why": ["Бір сөйлемнің сәйкестігі жеткіліксіз: тақырып бүкіл абзацты қамтуы керек.", "Дұрыс: бұл - қолшатыр сынағынан өтпеген тақырып. Негізгі ойды атайтын басқасын іздеу керек.", "Әр абзацқа бір-ақ тақырып беріледі."],
         "hints": ["Қолшатыр сынағын еске түсіріңіз.", "Ұқсас мысал: кешігудің үш себебі туралы абзацқа «A strike by steelworkers» - бір ғана себеп.", "Бір сөйлем = бөлшек → алдамшы."]},
        {"type": "mc", "q": "Осы абзацқа қай тақырып сәйкес? (Eskdale)",
         "passage": "<p>[[For most of the twentieth century, the town of Eskdale was known for one thing: its woollen blankets. At its peak the industry employed two out of every three adults. Today only a single small workshop remains, and it sells mainly to tourists.]]</p>",
         "options": ["The decline of a traditional industry", "How woollen blankets are made", "Tourism as the town's main employer"], "answer": 0,
         "why": ["Дұрыс: бұрын үш ересектің екеуі осы салада істеген, қазір бір-ақ шеберхана қалды - бұл құлдырау.", "Көрпенің қалай жасалатыны туралы абзацта ештеңе жоқ.", "tourists сөзі бар, бірақ туризмнің негізгі жұмыс беруші екені айтылмаған - бұл бөлшекті бұрмалау."],
         "hints": ["Бірінші сөйлем мен соңғы сөйлемді салыстырыңыз: не өзгерді?", "Ұқсас мысал: «бұрын 50 дүкен, қазір 2» → сауданың құлдырауы.", "At its peak… → Today only a single workshop → decline."]},
        {"type": "mc", "q": "Осы абзацқа қай тақырып сәйкес? (language learning)",
         "passage": "<p>[[Many parents assume that children learn a second language best in a classroom. Research by the Norland Institute points in another direction. Children in its study who simply played with speakers of the language for an hour a day made faster progress than those who had formal lessons.]]</p>",
         "options": ["The importance of classroom teaching", "Play may be more effective than formal lessons", "How many hours a day children should study"], "answer": 1,
         "why": ["Бұл - ата-аналардың пікірі (кіріспе), оны зерттеу жоққа шығарады.", "Дұрыс: «points in another direction» - бетбұрыс; ойнаған балалар сабақ алғандардан тез алға басқан.", "«an hour a day» - бір ғана бөлшек; абзац уақыт мөлшері туралы емес."],
         "hints": ["«Many parents assume…» - ескі пікір. Автордың өз ойы қай жерде басталады?", "Ұқсас мысал: «People think X. In fact, Y.» → тақырып Y туралы.", "«points in another direction» + «faster progress than… formal lessons» → B."]},
        {"type": "mc", "q": "Осы абзацқа қай тақырып сәйкес? (Carrow bridge)",
         "passage": "<p>[[The bridge at Carrow was finished in 1931, two years late and at double the planned cost. The delays had many causes: an unusually wet winter, a strike by steelworkers, and the discovery that the riverbed was softer than the engineers had believed.]]</p>",
         "options": ["A strike that stopped construction", "The original design of the bridge", "Reasons why the project fell behind schedule"], "answer": 2,
         "why": ["Ереуіл - үш себептің бірі ғана; бұл бөлшек.", "Көпірдің жобасы туралы абзацта айтылмаған.", "Дұрыс: «The delays had many causes» - негізгі ой; әрі қарай үш себеп тізілген. Жаңбыр, ереуіл, өзен түбі → «себептер»."],
         "hints": ["Нақты нәрселерді (қыс, ереуіл, өзен түбі) бір жалпы сөзбен атаңыз.", "Ұқсас мысал: «алма, алмұрт, өрік» → «жемістер».", "«many causes» = reasons; «two years late» = fell behind schedule → C."]},
        {"type": "mc", "q": "Осы абзацқа қай тақырып сәйкес? (napping)",
         "passage": "<p>[[Sleep scientists once believed that a short nap in the afternoon was a sign of laziness or poor health. The evidence now suggests the opposite. In trials, volunteers who slept for twenty minutes after lunch made fewer mistakes in the hours that followed, and reported feeling calmer.]]</p>",
         "options": ["The dangers of sleeping during the day", "Evidence for the benefits of a short daytime sleep", "How much sleep adults need at night"], "answer": 1,
         "why": ["Бұл - бұрынғы көзқарас («once believed»); абзац оны жоққа шығарады.", "Дұрыс: «The evidence now suggests the opposite» - аз қате, тыныштық; бұл - пайдасының дәлелі.", "Түнгі ұйқының мөлшері туралы айтылмаған."],
         "hints": ["once… now - ескі пікір мен жаңа дерек. Тақырып қайсысына сәйкес болуы керек?", "Ұқсас мысал: «Coffee was thought harmful. New studies disagree.» → кофенің пайдасы туралы жаңа дерек.", "«now suggests the opposite» + fewer mistakes, calmer → benefits → B."]},
        {"type": "mc", "q": "Абзац «Many people believe that…» деген сөйлемнен басталады. Негізгі ойды қай жерден іздеген дұрыс?",
         "options": ["Дәл осы бірінші сөйлемнен", "Одан кейінгі but / however / in fact сөзі бар сөйлемнен", "Абзацтағы ең ұзын сөйлемнен"], "answer": 1,
         "why": ["«Many people believe» - әдетте автор келіспейтін кең тараған пікір; ол тек кіріспе.", "Дұрыс: автордың өз ойы бетбұрыс сөзінен кейін айтылады.", "Сөйлемнің ұзындығы оның маңызын білдірмейді."],
         "hints": ["Автор неге басқалардың пікірінен бастайды? Оны не істемек?", "Ұқсас мысал: «Yet the honey sold today…» - негізгі ой Yet-тен кейін.", "Ескі пікір + бетбұрыс → негізгі ой бетбұрыстан кейін."]},
    ],
    "mastery": [
        {"type": "mc", "q": "Осы абзацқа қай тақырып сәйкес? (Soren)",
         "passage": "<p>[[Visitors to the island of Soren often ask why its houses are painted in such bright colours. The custom began with fishermen, who needed to recognise their own homes from the sea in fog. Each family chose a colour, and the choice was passed down through the generations.]]</p>",
         "options": ["The origin of a local tradition", "The dangers of fishing in fog", "Why tourists choose to visit Soren"], "answer": 0,
         "why": ["Дұрыс: абзац сұрақтан басталып, жауабын береді: дәстүр балықшылардан басталған және ұрпақтан ұрпаққа берілген.", "Тұман аталған, бірақ балық аулаудың қаупі туралы айтылмаған - бұл бөлшек.", "Келушілер тек сұрақ қояды; олардың неге келетіні айтылмаған."]},
        {"type": "mc", "q": "Осы абзацқа қай тақырып сәйкес? (electric buses)",
         "passage": "<p>[[Electric buses are quiet, clean and cheap to run. The difficulty lies in buying them. A single vehicle costs nearly twice as much as a diesel one, and small towns with limited budgets often cannot find the money, however much they would save in later years.]]</p>",
         "options": ["The environmental benefits of electric buses", "High purchase price as an obstacle", "The falling cost of public transport"], "answer": 1,
         "why": ["Бұл - тек бірінші, кіріспе сөйлем; абзац әрі қарай басқа нәрсеге көшеді.", "Дұрыс: «The difficulty lies in buying them» - негізгі ой; қалғаны сатып алу бағасының қымбаттығын түсіндіреді.", "Мағынасы қарама-қарсы: абзацта арзандау емес, қымбаттық айтылған."]},
        {"type": "mc", "q": "Осы абзацқа қай тақырып сәйкес? (Varn coast)",
         "passage": "<p>[[The first maps of the Varn coast were drawn by sailors and were accurate enough near harbours but wildly wrong elsewhere. It was only when surveyors began working from balloons in the 1850s that the whole coastline could be seen and measured at once. Within a decade, the old charts had been replaced.]]</p>",
         "options": ["Problems faced by early sailors", "A new method that improved map-making", "The history of balloon flight"], "answer": 1,
         "why": ["Теңізшілердің қиындықтары емес, олар сызған карталардың дәлсіздігі айтылған, әрі бұл - кіріспе ғана.", "Дұрыс: әуе шарынан түсіру (жаңа әдіс) бүкіл жағалауды өлшеуге мүмкіндік беріп, ескі карталарды алмастырды.", "Әуе шары - құрал ғана; оның тарихы туралы айтылмаған."]},
    ],
    "summary": [
        "Тақырып абзацтың негізгі ойын атайды; бір сөйлемге ғана сәйкес нұсқа - бөлшек.",
        "Негізгі ойды үш жерден іздеңіз: бірінші сөйлем, Yet / However сөзінен кейінгі сөйлем, соңғы сөйлем.",
        "Алдымен абзацқа өз сөзіңізбен ат қойып, сосын тізімнен мағынасы жақын нұсқаны табыңыз.",
        "Дұрыс тақырып парафразбен жазылады; абзацтағы сөзді дәл қайталайтын нұсқаға күмәнмен қараңыз.",
        "Оңай абзацтардан бастап, қолданылған тақырыптарды сызыңыз; жауапты рим цифрымен дәл жазыңыз (iv ≠ vi).",
    ],
    "lab": {"href": "reading.html", "title": "Reading зертханасы"},
    "sources": ["Сабақ мәтіні, абзацтар мен жаттығулары AO17 үшін жаңадан жазылған (авторы: Sagid Mustafa); Daleth, Eskdale, Carrow, Soren, Varn, Norland Institute және оларға қатысты барлық дерек ойдан алынған, ғылыми дәлел ретінде қолдануға болмайды. AO17 IELTS иелерімен байланысты емес және ресми балл бермейді."],
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
