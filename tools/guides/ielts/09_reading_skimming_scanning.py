# © 2026 Sagid Mustafa. All Rights Reserved.
# AO17 IELTS оқулығы · Reading · Skimming және scanning: мәтінді толық оқымай басқару. Авторлық мазмұн.
_MILL = ("<p><b>The Tide Mill at Marlow Creek</b></p>"
         "<p><b>A</b> [[For almost three centuries, the mill at Marlow Creek ground grain using nothing but the movement of the sea. Twice a day the rising tide filled a pond behind the building; when the water flowed out again, it turned a wooden wheel.]]</p>"
         "<p><b>B</b> [[The design is usually credited to a carpenter named Edwin Garrow, who rebuilt the mill in 1764 after a storm. Garrow replaced the single wheel with two smaller ones, which allowed the miller to keep working for about five hours on each tide instead of three.]]</p>"
         "<p><b>C</b> [[However, the mill could never compete with the steam-powered factories that appeared in nearby towns. By 1890 its customers had fallen to a handful of local farmers, and in 1912 the last miller, Ruth Penhale, locked the doors.]]</p>"
         "<p><b>D</b> [[Today the building is cared for by volunteers. Since it reopened to visitors in 2004, around 9,000 people a year have come to watch the wheels turn, and flour ground on site is sold in the small shop.]]</p>")
_VAULT = ("<p><b>The Seed Vault of Hollin Ridge</b></p>"
          "<p><b>A</b> [[High on Hollin Ridge, a concrete door set into the hillside leads to one of the region's least-known collections. Behind it, at a constant temperature of minus 18 degrees, lie seeds from more than 4,000 varieties of food plants.]]</p>"
          "<p><b>B</b> [[The vault was the idea of the botanist Ines Varga, who became alarmed in the 1980s when she found that farmers in her valley had stopped growing all but three kinds of bean. She began storing seeds in her own kitchen freezer; the present building opened in 1996.]]</p>"
          "<p><b>C</b> [[Running the vault is not cheap. Electricity for cooling accounts for almost half of the annual budget, and every ten years each sample must be taken out, planted and harvested again so that fresh seed can be stored.]]</p>"
          "<p><b>D</b> [[Supporters argue that the expense is justified. In 2011, after floods destroyed fields across the valley, the vault supplied seed for 60 farms within a month - something no commercial company could have done.]]</p>")
_VELMONT = ("<p><b>The Couriers of Velmont</b></p>"
            "<p><b>A</b> [[In the hill town of Velmont, parcels do not arrive by van. Since 2015 the narrow centre has been closed to motor vehicles, and deliveries are made by a team of cycle couriers.]]</p>"
            "<p><b>B</b> [[The scheme was started by a former postman, Dario Lenk, with two second-hand cargo bikes. It now employs 34 riders, who between them handle roughly 1,200 parcels a day.]]</p>"
            "<p><b>C</b> [[Not everyone is satisfied. Shop owners complain that heavy goods such as furniture still have to be collected from a depot outside the walls, which adds a day to delivery times.]]</p>"
            "<p><b>D</b> [[Even so, the town council reports that noise complaints in the centre have fallen by two thirds, and three neighbouring towns have asked for advice on copying the model.]]</p>")
LESSON = {
    "id": "ielts.reading.skimming-scanning",
    "title": "Skimming және scanning: мәтінді толық оқымай басқару",
    "section": "Reading",
    "minutes": 35, "level": "негіз",
    "goals": [
        "Үш оқу тәсілін ажырату: skimming (жалпы шолу), scanning (нақты мәліметті іздеу), мұқият оқу.",
        "2-3 минутта мәтіннің «картасын» жасау: әр абзацқа екі-үш сөзден белгі қою.",
        "Сұрақтағы түйін сөз бойынша мәтіннен керек жерді тез табу (сан, атау, синоним).",
        "Табылған жерді мұқият оқып, жауапты содан кейін ғана жазу.",
    ],
    "hook": {
        "text": "<p>Reading бөлімінде 60 минутта үш мәтін оқып, 40 сұраққа жауап бересіз. Әр мәтін шамамен 700-900 сөзден тұрады, яғни бір мәтінге сұрақтарымен бірге 20 минуттай ғана тиеді. "
                "Жаңадан бастаған оқушы мәтінді бірінші сөзінен соңғы сөзіне дейін мұқият оқып шығады, таныс емес сөзге тоқтайды, сосын ғана сұрақтарға қарайды - сол кезде уақыттың жартысы өтіп кеткен болады.</p>",
        "predict": {"q": "Жаңа мәтінді алғанда алғашқы 2-3 минутта не істеген дұрыс?", "options": ["Әр сөзін түсініп, мұқият оқып шығу", "Тақырыбын және әр абзацтың бірінші сөйлемін оқып, абзацтың не туралы екенін белгілеу", "Мәтінге мүлде қарамай, бірден бірінші сұрақтың жауабын іздеу"], "answer": 1,
                    "why": "Сұрақтарға жауап беру үшін мәтіннің бәрін түсінудің қажеті жоқ - жауаптың қай абзацта екенін білу қажет. Абзацтардың тақырыбын білсеңіз, әр сұраққа бүкіл мәтінді қайта ақтармай, бірден керек жерге барасыз. Ал мәтінге мүлде қарамай бастасаңыз, әр сұрақ үшін бәрін басынан іздейсіз. Бұл шолу тәсілі skimming деп аталады."},
    },
    "explain": [
        {"h": "Үш оқу тәсілі",
         "body": "<p>Күнделікті өмірде де біз әртүрлі оқимыз: жаңалық тақырыптарын көзбен шолып шығамыз, кестеден өз пойызымызды іздейміз, ал шартты әр сөзіне дейін оқимыз. IELTS-те осы үш тәсілдің үшеуі де керек - әрқайсысы өз кезегінде.</p>"
                 "<table><tr><th>Тәсіл</th><th>Мақсаты</th><th>Қалай</th><th>Қашан</th></tr>"
                 "<tr><td><b>Skimming</b></td><td>мәтін не туралы, қай абзацта не бар</td><td>тақырып, абзацтардың бірінші сөйлемдері</td><td>ең басында, 2-3 минут</td></tr>"
                 "<tr><td><b>Scanning</b></td><td>бір нақты сөзді, санды, атауды табу</td><td>көз мәтін бойымен «сырғиды», оқымайды</td><td>әр сұрақ үшін</td></tr>"
                 "<tr><td><b>Мұқият оқу</b></td><td>жауапты дәл анықтау</td><td>табылған 2-3 сөйлемді баяу, толық оқу</td><td>керек жер табылған соң</td></tr></table>"
                 "<p>Жиі қате - тек бір тәсілді қолдану: бәрін мұқият оқу (уақыт жетпейді) не бәрін үстірт қарау (жауап дәл болмайды). Дұрыс рет: <b>шолу → іздеу → мұқият оқу</b>.</p>"},
        {"h": "Skimming: мәтіннің картасын жасау",
         "body": "<p>Skimming кезінде мына жерлерді ғана оқисыз:</p>"
                 "<ol><li><b>Тақырып пен тақырыпша</b> - мәтіннің жалпы мазмұны.</li>"
                 "<li><b>Әр абзацтың бірінші сөйлемі</b> - көбіне абзацтың негізгі ойы сонда (topic sentence).</li>"
                 "<li><b>Абзацтың соңғы сөйлемі</b> - егер бірінші сөйлем түсініксіз болса.</li>"
                 "<li><b>Көзге түсетін сөздер</b>: жылдар, атаулар, қайталанатын сөздер.</li></ol>"
                 "<p>Әр абзацтың қасына <b>екі-үш сөзден</b> белгі жазыңыз (қазақша да болады). Мысалы, диірмен туралы мәтін үшін:</p>"
                 "<table><tr><th>Абзац</th><th>Бірінші сөйлемнен түйін</th><th>Белгі</th></tr>"
                 "<tr><td>A</td><td>[[the mill… ground grain using… the movement of the sea]]</td><td>қалай жұмыс істеген</td></tr>"
                 "<tr><td>B</td><td>[[The design is usually credited to… Edwin Garrow]]</td><td>жобасы, Гарроу</td></tr>"
                 "<tr><td>C</td><td>[[However, the mill could never compete…]]</td><td>құлдырауы</td></tr>"
                 "<tr><td>D</td><td>[[Today the building is cared for by volunteers.]]</td><td>қазіргі күйі</td></tr></table>"
                 "<p>Бұл - мәтіннің картасы. Енді «диірмен неге жабылды?» деген сұрақ келсе, бірден C абзацына барасыз.</p>"
                 "<p>Skimming кезінде таныс емес сөзге <b>тоқтамаңыз</b>. Мақсат - түсіну емес, бағдарлану.</p>"},
        {"h": "Абзацтың негізгі ойы қайда тұрады",
         "body": "<p>Ағылшын академиялық мәтінінде абзац әдетте былай құрылады: <b>негізгі ой</b> → түсіндірме → мысал не дерек. Сондықтан бірінші сөйлем жиі жеткілікті. Бірақ әрқашан емес.</p>"
                 "<table><tr><th>Абзацтың басталуы</th><th>Негізгі ой қайда</th></tr>"
                 "<tr><td>Тікелей мәлімдеме: [[Running the vault is not cheap.]]</td><td>бірінші сөйлемде</td></tr>"
                 "<tr><td>Сұрақ: [[So why did the mill close?]]</td><td>сұрақтан кейінгі жауапта</td></tr>"
                 "<tr><td>Кең тараған пікір: [[Many people assume that…]]</td><td>[[but]] / [[however]] сөзінен кейін</td></tr>"
                 "<tr><td>Оқиға не мысал: [[One morning in 1996…]]</td><td>абзацтың соңғы сөйлемінде</td></tr></table>"
                 "<p>Абзацтың басындағы байланыстырушы сөз де көп нәрсе айтады: [[However]], [[Not everyone…]] - қарсы көзқарас не мәселе; [[Today]], [[Since then]] - қазіргі жағдай; [[Supporters argue]] - біреудің пікірі.</p>"},
        {"h": "Scanning: көз нені оңай табады",
         "body": "<p>Scanning кезінде сіз оқымайсыз - <b>пішін іздейсіз</b>. Кейбір нәрселер мәтінде өзінен-өзі көзге түседі:</p>"
                 "<table><tr><th>Оңай табылады</th><th>Мысал</th></tr>"
                 "<tr><td>Сандар мен жылдар</td><td>[[1764]], [[9,000]], [[60]]</td></tr>"
                 "<tr><td>Бас әріппен жазылатын атаулар</td><td>[[Edwin Garrow]], [[Hollin Ridge]]</td></tr>"
                 "<tr><td>Белгілер мен қысқартулар</td><td>[[%]], [[£]], [[km]]</td></tr>"
                 "<tr><td>Курсив не тырнақшадағы сөздер</td><td>терминдер, шығарма атаулары</td></tr></table>"
                 "<p>Сұрақта осындай «зәкір» сөз болса, алдымен соны іздеңіз. Мысалы, [[How long could the miller work after 1764?]] - жылды іздейсіз, ал [[how long]] сұрағына жауапты сол маңайдан табасыз.</p>"
                 "<p>Ал сұрақтағы сөз жай сөз болса ([[cost]], [[problem]]), мәтінде ол <b>синониммен</b> тұруы мүмкін: [[cost]] → [[expense]], [[budget]], [[not cheap]]. Мұндайда алдымен картаңызға қарап, керек абзацты таңдаңыз, сосын сол абзацтың ішінен ғана іздеңіз.</p>"
                 "<p>Көзді солдан оңға қарай жолма-жол жүргізудің қажеті жоқ. Мәтін бойымен жоғарыдан төмен ирек жолмен сырғытыңыз: сан мен бас әріп өзі «секіріп шығады».</p>"},
        {"h": "Тапқан жерді мұқият оқу",
         "body": "<p>Scanning жауапты бермейді - ол <b>жауаптың мекенжайын</b> береді. Сөзді тапқан соң тоқтап, сол сөйлемді, оның алдындағы және артындағы сөйлемді баяу оқыңыз.</p>"
                 "<p>Неге бұл маңызды? Себебі керек санның қасында жиі басқа сан тұрады. B абзацында: [[for about five hours on each tide instead of three]]. Асыққан оқушы [[three]] деп жазады, ал мұқият оқыған [[instead of]] сөзін көріп, [[five]] деп жазады.</p>"
                 "<p>Тағы бір ереже: бір сөз мәтінде <b>бірнеше рет</b> кездесуі мүмкін. Бірінші тапқан жер сұраққа сәйкес келмесе, іздеуді жалғастырыңыз.</p>"},
        {"h": "Сұрақтардың реті көмектеседі",
         "body": "<p>Көп сұрақ түрінде жауаптар мәтіннің ретімен орналасады: 1-сұрақтың жауабы 2-сұрақтікінен бұрын тұрады.</p>"
                 "<table><tr><th>Мәтін ретімен жүреді</th><th>Ретсіз</th></tr>"
                 "<tr><td>True / False / Not Given, сөйлем аяқтау, қысқа жауапты сұрақтар, multiple choice</td><td>абзацқа тақырып таңдау, мәліметті абзацпен сәйкестендіру</td></tr></table>"
                 "<p>Демек, 3-сұрақтың жауабын C абзацынан тапсаңыз, 4-сұрақты A абзацынан іздемейсіз - төменірек қарайсыз. Бұл іздеу аумағын екі есе тарылтады.</p>"},
    ],
    "method": {"title": "Емтихандағы әдіс: «шолу - іздеу - оқу»", "steps": [
        {"name": "Шолу (2-3 минут)", "text": "Тақырыпты және әр абзацтың бірінші сөйлемін оқыңыз. Әр абзацтың қасына екі-үш сөзден белгі жазыңыз. Таныс емес сөзге тоқтамаңыз."},
        {"name": "Сұрақтан зәкір сөз таңда", "text": "Сұрақтан іздеуге ыңғайлы сөзді табыңыз: сан, жыл, бас әріпті атау. Ондай сөз болмаса, түйін сөзге синоним ойлап, картадан керек абзацты таңдаңыз."},
        {"name": "Іздеу", "text": "Көзді таңдалған абзац бойымен сырғытып, зәкір сөзді не оның синонимін табыңыз. Бұл кезде сөйлемдерді оқымаңыз."},
        {"name": "Мұқият оқу", "text": "Табылған сөйлемді және оның екі көршісін баяу оқыңыз. Жауапты содан кейін ғана жазыңыз; қасындағы ұқсас сан не атауға алданбаңыз."},
    ]},
    "worked": [
        {"task": _MILL + "<p>Тапсырма: мәтінді 1 минутта шолып, картасын жасаңыз. Сосын айтыңыз: [[why the mill stopped operating]] деген мәліметті қай абзацтан іздейсіз?</p>",
         "steps": ["Тақырып: [[The Tide Mill at Marlow Creek]] - теңіз толқынымен жұмыс істейтін диірмен туралы.",
                   "A-ның бірінші сөйлемі: [[ground grain using… the movement of the sea]] → белгі: «қалай жұмыс істеген». B: [[The design is usually credited to… Edwin Garrow]] → «жобасы, Гарроу».",
                   "C [[However]] сөзінен басталады - бетбұрыс. [[could never compete with the steam-powered factories]] → «бәсеке, құлдырау». D: [[Today… volunteers]] → «қазіргі күйі».",
                   "Сұрақтағы [[stopped operating]] - «жұмысын тоқтатты». Картада бұған «құлдырау» белгісі сәйкес → C абзацы.",
                   "Тексеру (мұқият оқу): [[in 1912 the last miller… locked the doors]] - иә, жабылуы осы абзацта, себебі - бу фабрикаларымен бәсеке."],
         "answer": "C абзацы",
         "trap": "Мәтінде «stopped operating» деген сөздерді іздеу. Ондай сөздер жоқ: мәтінде «locked the doors» деп жазылған. Жай сөздерді емес, абзацтың тақырыбын іздеген жөн."},
        {"task": _MILL + "<p>[[1 After 1764, for how many hours could the miller work on each tide?]]<br>[[2 Who was the last person to run the mill?]]</p>",
         "steps": ["(1) Зәкір сөз - жыл: 1764. Көзді мәтін бойымен сырғытамыз: 1764 B абзацында тұр.",
                   "Сол сөйлемді және келесісін мұқият оқимыз: [[for about five hours on each tide instead of three]]. Екі сан бар.",
                   "[[instead of three]] - бұрынғы көрсеткіш. Сұрақ [[After 1764]] дейді, яғни қайта құрудан кейін → [[five]].",
                   "(2) [[Who]] - адам аты керек, ол бас әріппен жазылады. Мәтінде екі есім: [[Edwin Garrow]] (B), [[Ruth Penhale]] (C).",
                   "Әр есімнің қасын оқимыз: Гарроу - [[a carpenter]], ал [[the last miller, Ruth Penhale]] - [[last person to run the mill]] дегеннің парафразы → [[Ruth Penhale]]."],
         "answer": "1 five (5), 2 Ruth Penhale",
         "trap": "(1)-де 1764-ті тауып, сол сөйлемдегі соңғы санды (three) оқымай жаза салу; (2)-де мәтінде бірінші кездескен есімді (Edwin Garrow) жазу. Scanning орынды табады, ал жауапты мұқият оқу береді."},
    ],
    "traps": [
        {"wrong": "Мәтінді басынан аяғына дейін мұқият оқып, сосын ғана сұрақтарға көшу.", "why": "Бір мәтінге 20 минуттай ғана беріледі; толық оқу оның жартысын алады, ал оқылғанның көбі сұраққа керек болмайды.", "fix": "2-3 минут шолып, карта жасаңыз; мұқият оқуды тек жауап тұрған сөйлемдерге қалдырыңыз."},
        {"wrong": "Таныс емес сөзге тоқтап, оның мағынасын шешуге тырысу.", "why": "Ол сөз ешбір сұраққа қатысты болмауы мүмкін, ал уақыт кетеді.", "fix": "Шолу кезінде өткізіп жіберіңіз. Сұрақ сол сөйлемге тірелсе ғана, мағынасын мәнмәтіннен болжаңыз."},
        {"wrong": "Зәкір сөзді тапқан бойда қасындағы бірінші санды не атауды жауап деп жазу.", "why": "Керек мәліметтің қасына жиі ұқсас, бірақ басқа нәрсеге қатысты мәлімет қойылады.", "fix": "Табылған сөйлемді және оның көршілерін толық оқыңыз: instead of, before, however сөздеріне қараңыз."},
        {"wrong": "Сұрақтағы сөзді мәтіннен дәл сол күйінде іздеу.", "why": "Мәтін сұрақтағы сөзді синониммен береді: cost орнына expense.", "fix": "Сан мен атауды дәл іздеңіз, ал жай сөз үшін алдымен синоним ойлаңыз не картадан абзацты таңдаңыз."},
    ],
    "practice": [
        {"type": "mc", "q": "Skimming-ті қай сипаттама дұрыс береді?",
         "options": ["Мәтіннен бір нақты санды не атауды іздеу", "Мәтіннің жалпы мазмұны мен абзацтардың тақырыбын тез анықтау", "Әр сөйлемді баяу оқып, толық түсіну"], "answer": 1,
         "why": ["Бұл - scanning: нақты мәліметті іздеу.", "Дұрыс: skimming - жалпы шолу; тақырып пен абзацтардың бірінші сөйлемдері оқылады.", "Бұл - мұқият оқу; ол тек жауап тұрған жерге қолданылады."],
         "hints": ["Үш тәсілдің кестесін еске түсіріңіз: әрқайсысының мақсаты басқа.", "Ұқсас мысал: газеттің тақырыптарын қарап шығу - skimming; пойыз кестесінен өз рейсіңізді табу - scanning.", "Skimming = жалпы шолу → B."]},
        {"type": "mc", "q": "Мәтінді шолып шығыңыз. Қойманы ұстап тұрудың шығыны туралы қай абзацта айтылады?",
         "passage": _VAULT,
         "options": ["A", "B", "C", "D"], "answer": 2,
         "why": ["A қойманың орнын және ішінде не сақталатынын сипаттайды.", "B қойманың қалай пайда болғанын, Инес Варганың идеясын айтады.", "Дұрыс: бірінші сөйлемі - «Running the vault is not cheap»; әрі қарай электр қуаты мен бюджет туралы.", "D шығынның ақталатынын дәлелдейді, бірақ шығынның өзін сипаттамайды."],
         "hints": ["Әр абзацтың тек бірінші сөйлемін оқыңыз.", "Ұқсас мысал: «However, the mill could never compete» → бұл абзац құлдырау туралы.", "cost сөзінің синонимі - not cheap. Ол C-ның бірінші сөйлемінде."]},
        {"type": "mc", "q": "Мәтін бойынша D абзацының негізгі ойы қайсы?",
         "passage": _VAULT,
         "options": ["Қойма 2011 жылы су тасқынынан зардап шекті.", "Қоймаға жұмсалған қаражат өзін ақтайды.", "Коммерциялық компаниялар тұқымды арзанырақ сақтайды."], "answer": 1,
         "why": ["Тасқын қойманы емес, алқаптарды бүлдірді; қойма керісінше көмектесті.", "Дұрыс: бірінші сөйлем - «Supporters argue that the expense is justified»; тасқын оқиғасы - осы ойға мысал.", "Мәтінде керісінше: мұндай көмекті ешбір компания бере алмас еді."],
         "hints": ["Негізгі ой әдетте бірінші сөйлемде; қалғаны - мысал.", "Ұқсас мысал: «Running the vault is not cheap. Electricity…» → негізгі ой: қымбат.", "«the expense is justified» = шығын ақталады → B."]},
        {"type": "gap", "q": "Мәтіннен тауып жазыңыз (A NUMBER): The present building opened in ___.",
         "passage": _VAULT,
         "accept": ["1996"],
         "explain": "Зәкір сөз - opened; жауап - жыл. Мәтінде үш уақыт белгісі бар: 1980s (Варга алаңдай бастаған кез), 1996 (ғимараттың ашылуы), 2011 (тасқын). «the present building opened in 1996» - B абзацының соңы.",
         "errors": {"1980": "1980-жылдары Варга мәселені байқады, ал ғимарат кейін ашылды.", "1980s": "1980-жылдары Варга мәселені байқады, ал ғимарат кейін ашылды.", "2011": "2011 - су тасқыны болған жыл (D абзацы)."},
         "hints": ["Жыл - төрт таңбалы сан; мәтінде олар көзге бірден түседі.", "Ұқсас мысал: «rebuilt the mill in 1764» → rebuilt сөзінің қасындағы жыл.", "B абзацы: «the present building opened in 1996» → 1996."]},
        {"type": "mc", "q": "Сұрақ: «How many farms received seed after the floods?» Жауапты ең тез табу үшін мәтіннен нені іздеген дұрыс?",
         "passage": _VAULT,
         "options": ["seed сөзін - ол сұрақта бар", "floods сөзін және оның қасындағы санды", "Мәтінді басынан бастап қайта оқу керек"], "answer": 1,
         "why": ["seed сөзі мәтінде бірнеше рет кездеседі - ол іздеуді тарылтпайды.", "Дұрыс: floods - мәтінде бір-ақ рет кездесетін сөз, ал «how many» - сан керек дегені. Екеуі D абзацында қатар тұр.", "Қайта оқу - уақытты босқа кетіру; зәкір сөз жеткілікті."],
         "hints": ["Жақсы зәкір сөз - сирек кездесетін сөз не сан.", "Ұқсас мысал: «after 1764» - жылды іздейсіз, себебі ол мәтінде біреу-ақ.", "floods + сан → D: «after floods… seed for 60 farms»."]},
        {"type": "gap", "q": "Мәтіннен тауып жазыңыз (A NUMBER): The seeds are kept at a temperature of minus ___ degrees.",
         "passage": _VAULT,
         "accept": ["18", "eighteen"],
         "explain": "Зәкір сөздер - temperature, minus, degrees. A абзацында: «at a constant temperature of minus 18 degrees». Қасындағы 4,000 - өсімдік сорттарының саны.",
         "errors": {"4000": "4,000 - сақталған сорттар саны, температура емес.", "4,000": "4,000 - сақталған сорттар саны, температура емес.", "-18": "minus сөзі сөйлемде бар; тек санды жазыңыз: 18."},
         "hints": ["temperature сөзін не degrees сөзін іздеңіз.", "Ұқсас мысал: «around 9,000 people a year» → people сөзінің қасындағы сан.", "A абзацы: «minus 18 degrees» → 18."]},
    ],
    "mastery": [
        {"type": "mc", "q": "Мәтінді шолып шығыңыз. Жүйенің кемшілігі туралы қай абзацта айтылады?",
         "passage": _VELMONT,
         "options": ["A", "B", "C", "D"], "answer": 2,
         "why": ["A жүйенің не екенін таныстырады: орталық көлікке жабық, жеткізуді велокурьерлер атқарады.", "B жүйенің қалай басталғанын және қазіргі көлемін айтады.", "Дұрыс: «Not everyone is satisfied» - наразылық; ауыр жүк пен кешігу туралы.", "D «Even so» деп басталып, жақсы нәтижелерді атайды."]},
        {"type": "gap", "q": "Мәтіннен тауып жазыңыз (A NUMBER): The scheme now employs ___ riders.",
         "passage": _VELMONT,
         "accept": ["34", "thirty-four"],
         "explain": "Зәкір сөздер - employs, riders. B абзацында: «It now employs 34 riders». 1,200 - күніне жеткізілетін сәлемдеме саны, 2015 - жыл, two - алғашқы велосипедтер саны.",
         "errors": {"1200": "1,200 - күніне жеткізілетін сәлемдемелер саны.", "1,200": "1,200 - күніне жеткізілетін сәлемдемелер саны.", "2": "Екі - бастапқыдағы жүк велосипедтерінің саны.", "2015": "2015 - орталық көлікке жабылған жыл."}},
        {"type": "gap", "q": "Мәтіннен тауып жазыңыз (ONE WORD ONLY): The scheme was set up by a former postman called Dario ___.",
         "passage": _VELMONT,
         "accept": ["Lenk"],
         "explain": "Адам аты бас әріппен жазылады, сондықтан оңай табылады. B абзацында: «started by a former postman, Dario Lenk». set up = started.",
         "errors": {"velmont": "Velmont - қаланың атауы, адамның тегі емес."}},
    ],
    "summary": [
        "Рет: шолу (skimming) → іздеу (scanning) → табылған жерді мұқият оқу.",
        "Шолу кезінде тақырып пен абзацтардың бірінші сөйлемдерін оқып, әр абзацқа екі-үш сөзден белгі қойыңыз.",
        "Сан, жыл, бас әріпті атау - ең жақсы зәкір сөздер; жай сөз мәтінде синониммен тұруы мүмкін.",
        "Scanning жауаптың орнын ғана береді: сөйлемді көршілерімен бірге оқымай жауап жазбаңыз.",
        "Көп сұрақ түрінде жауаптар мәтін ретімен жүреді - іздеу аумағын содан тарылтыңыз.",
    ],
    "lab": {"href": "reading.html", "title": "Reading зертханасы"},
    "sources": ["Сабақ мәтіні, оқу мәтіндері мен жаттығулары AO17 үшін жаңадан жазылған (авторы: Sagid Mustafa); Marlow Creek диірмені, Hollin Ridge қоймасы, Velmont қаласы және барлық есімдер ойдан алынған, нақты дерек емес. AO17 IELTS иелерімен байланысты емес және ресми балл бермейді."],
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
