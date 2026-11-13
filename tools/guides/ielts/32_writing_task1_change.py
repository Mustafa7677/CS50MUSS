# © 2026 Sagid Mustafa. All Rights Reserved.
# AO17 IELTS оқулығы · Writing · Task 1: өзгеріс пен салыстыру тілі. Авторлық мазмұн. Барлық деректер ойдан алынған.
import re as _re

LESSON = {
    "id": "ielts.writing.task1-change",
    "title": "Task 1: өзгерісті және салыстыруды дәл сипаттау",
    "section": "Writing",
    "minutes": 40, "level": "орта",
    "goals": [
        "Өсу, кему және тұрақтылықты етістікпен де, зат есіммен де сипаттау.",
        "to, by, from, at, of предлогтарын сандармен дұрыс қолдану.",
        "Пайызды үлес сөздеріне (a quarter, just under half) айналдырып, шамаларды салыстыру.",
    ],
    "hook": {
        "text": "<p>Ойдан алынған дерек: бір кафенің айлық сатылымы 200 кеседен 250 кесеге жетті. Үш оқушы үш түрлі жазды: "
                "[[Sales rose to 50 cups.]] [[Sales rose by 50 cups.]] [[Sales rose by 250 cups.]] "
                "Айырмасы - бір-ақ кішкентай сөз, бірақ оқырман үшін бұл үш түрлі оқиға. Task 1-де дәлдік осындай ұсақ сөздерде жатыр.</p>",
        "predict": {"q": "Болжаңыз: 200-ден 250-ге өсуді қай сөйлем дұрыс береді?", "options": ["Sales rose to 50 cups.", "Sales rose by 50 cups.", "Sales rose by 250 cups."], "answer": 1,
                    "why": "by - айырманы (қаншаға өсті: 250 − 200 = 50), to - жеткен нүктені (қаншаға дейін: 250) білдіреді. Дұрыс екі нұсқа: «rose by 50 cups» не «rose to 250 cups»."},
    },
    "explain": [
        {"h": "Бағыт: үш негізгі қозғалыс",
         "body": "<p>Кез келген сызық үш нәрсенің бірін жасайды: көтеріледі, түседі не орнында тұрады. Әрқайсысына екі-үш сенімді сөз жеткілікті.</p>"
                 "<table><tr><th>Қозғалыс</th><th>Етістік (өткен шақ)</th><th>Зат есім</th></tr>"
                 "<tr><td>↑ өсу</td><td>[[rose, increased, grew, climbed]]</td><td>[[a rise, an increase, growth]]</td></tr>"
                 "<tr><td>↓ кему</td><td>[[fell, decreased, declined, dropped]]</td><td>[[a fall, a decrease, a decline, a drop]]</td></tr>"
                 "<tr><td>→ тұрақты</td><td>[[remained stable, stayed the same, levelled off]]</td><td>[[a period of stability]]</td></tr>"
                 "<tr><td>↕ құбылу</td><td>[[fluctuated]]</td><td>[[a fluctuation]]</td></tr>"
                 "<tr><td>ең жоғарғы нүкте</td><td>[[peaked at, reached a peak of]]</td><td>[[a peak]]</td></tr></table>"
                 "<p>Назар: [[rise - rose - risen]] және [[fall - fell - fallen]] - бұрыс етістіктер. [[rised]], [[falled]] деген форма жоқ.</p>"},
        {"h": "Екі құрылым: етістік + үстеу немесе сын есім + зат есім",
         "body": "<p>Бір ойды екі жолмен айтуға болады. Екеуін кезектестіру грамматикалық әртүрлілік береді.</p>"
                 "<table><tr><th>Етістік + үстеу</th><th>There was + сын есім + зат есім</th></tr>"
                 "<tr><td>[[Prices rose sharply.]]</td><td>[[There was a sharp rise in prices.]]</td></tr>"
                 "<tr><td>[[Sales fell slightly.]]</td><td>[[There was a slight fall in sales.]]</td></tr>"
                 "<tr><td>[[The figure grew steadily.]]</td><td>[[There was steady growth in the figure.]]</td></tr></table>"
                 "<p>Өзгерістің көлемі мен жылдамдығын білдіретін сөздер: үлкен - [[sharp(ly), dramatic(ally), significant(ly)]]; орташа - [[steady/steadily, gradual(ly)]]; кіші - [[slight(ly), marginal(ly)]]. "
                 "Зат есімнен кейін [[in]] келеді: [[a rise in prices]] (ненің өсуі).</p>"},
        {"h": "Сандармен жүретін предлогтар",
         "body": "<table><tr><th>Предлог</th><th>Мағынасы</th><th>Мысал (200 → 250)</th></tr>"
                 "<tr><td>[[from ... to ...]]</td><td>басынан соңына</td><td>[[rose from 200 to 250]]</td></tr>"
                 "<tr><td>[[to]]</td><td>жеткен нүкте</td><td>[[rose to 250]]</td></tr>"
                 "<tr><td>[[by]]</td><td>айырма</td><td>[[rose by 50]] / [[rose by 25%]]</td></tr>"
                 "<tr><td>[[at]]</td><td>тұрған деңгей</td><td>[[stood at 200]], [[remained at 250]], [[peaked at 300]]</td></tr>"
                 "<tr><td>[[of]]</td><td>зат есімнен кейінгі мөлшер</td><td>[[a rise of 50]], [[a peak of 300]]</td></tr></table>"
                 "<p>Тексеру: 200-ден 250-ге өсу - 50 бірлік, пайызбен 50 : 200 = 25%. Уақыт үшін: [[in 2015]], [[between 2010 and 2020]], [[from 2010 to 2020]], [[over the period]], [[by 2020]] (2020-ға қарай).</p>"},
        {"h": "Үлестер мен шамамен айту",
         "body": "<p>Пайызды үнемі цифрмен қайталамай, үлес сөзіне айналдыруға болады.</p>"
                 "<table><tr><th>Пайыз</th><th>Үлес</th></tr>"
                 "<tr><td>25%</td><td>[[a quarter]]</td></tr><tr><td>33%</td><td>[[a third / one in three]]</td></tr><tr><td>50%</td><td>[[half]]</td></tr>"
                 "<tr><td>75%</td><td>[[three quarters]]</td></tr><tr><td>48%</td><td>[[just under half]]</td></tr><tr><td>52%</td><td>[[just over half]]</td></tr><tr><td>90%</td><td>[[the vast majority]]</td></tr></table>"
                 "<p>Дәл емес сандар үшін: [[approximately, around, roughly, nearly, almost]]. Бірақ абай болыңыз: 48% - [[nearly half]], ал 52% - [[nearly half]] емес, [[just over half]]. Шамалау да дәл болуы керек.</p>"
                 "<p>Тағы бір жиі қате: [[percent]] саннан кейін ([[20 percent]]), ал [[percentage]] - зат есім ([[the percentage of students]]).</p>"},
        {"h": "Салыстыру",
         "body": "<table><tr><th>Не айтқыңыз келеді</th><th>Үлгі</th></tr>"
                 "<tr><td>үлкенірек / кішірек</td><td>[[Bus use was higher than tram use.]]</td></tr>"
                 "<tr><td>ең үлкен</td><td>[[The metro had the highest number of passengers.]]</td></tr>"
                 "<tr><td>неше есе</td><td>[[There were twice as many buses as trams.]] / [[The figure doubled.]]</td></tr>"
                 "<tr><td>шамалас</td><td>[[The two figures were roughly equal.]]</td></tr>"
                 "<tr><td>қарама-қарсы</td><td>[[Sales of tea rose, whereas sales of coffee fell.]]</td></tr></table>"
                 "<p>Саналатын нәрсеге [[the number of]] (people, cars), саналмайтынға [[the amount of]] (water, money) қолданылады. Екі есе - [[doubled]], үш есе - [[tripled]], жартысына - [[halved]].</p>"},
        {"h": "Шақ",
         "body": "<p>Жылдар өткен болса - Past Simple: [[rose, fell]]. Жыл көрсетілмесе не ақпарат қазіргі күйді білдірсе - Present Simple: [[accounts for, is]]. Болашақ болжам болса: [[is expected to rise]], [[is predicted to reach]]. Бір мәтін ішінде шақты себепсіз ауыстырмаңыз.</p>"},
    ],
    "method": {"title": "Бір деректі бір сөйлемге айналдыру", "steps": [
        {"name": "Не", "text": "Бастауышты дәл атаңыз: «it» емес, «the number of visitors» не «bus use»."},
        {"name": "Қалай", "text": "Бағыт етістігін және көлемін білдіретін үстеуді таңдаңыз: rose sharply, fell slightly."},
        {"name": "Қанша", "text": "Санды дұрыс предлогпен және өлшем бірлігімен қосыңыз: from 20 to 70 thousand, by 25%."},
        {"name": "Қашан", "text": "Уақытты қосып, шақты тексеріңіз: between 2005 and 2025 - өткен шақ."},
        {"name": "Салыстыр", "text": "Келесі сөйлемде осы деректі екіншісімен байланыстырыңыз: whereas, in contrast, twice as many as."},
    ]},
    "worked": [
        {"task": "<p>Ойдан алынған дерек: [[Visitors to Karasu Museum (thousands): 2010 - 40, 2015 - 80, 2018 - 120 (peak), 2020 - 90.]] Әлсіз нұсқа: [[In 2010 it was 40. Then it go up to 80. Then it was 120. Then it go down.]] Қадамдап жақсартайық.</p>",
         "steps": ["Бастауышты нақтылаймыз: [[it]] → [[the number of visitors]].",
                   "Шақты түзетеміз: [[go up]] → [[rose]] (өткен шақ, бұрыс етістік).",
                   "Есе қатынасын байқаймыз: 40 → 80 - тура екі есе, демек [[doubled]] сөзі дәл келеді.",
                   "Шыңды атаймыз: [[peaked at 120 thousand in 2018]].",
                   "Соңғы кемуді айырмамен береміз: 120 − 90 = 30, яғни [[fell by 30 thousand]].",
                   "Біріктіреміз: [[The number of visitors doubled from 40 thousand in 2010 to 80 thousand in 2015 and continued to rise, peaking at 120 thousand in 2018. It then fell by 30 thousand, to 90 thousand, in 2020.]]"],
         "answer": "Төрт қысқа сөйлем дәл предлогтары бар екі байланысқан сөйлемге айналды.",
         "trap": "«fell by 90 thousand» деп жазу: 90 - жеткен нүкте (to), ал айырма - 30 (by)."},
        {"task": "<p>Ойдан алынған дерек: [[How people in Bestobe read the news, 2024: phone 52%, television 24%, newspaper 12%, radio 12%.]] Салыстыратын екі сөйлем жазайық.</p>",
         "steps": ["Бір ғана жыл - өзгеріс сөздері керек емес, үлестерді салыстырамыз. Шақ - өткен (2024 жылғы сауалнама) не қазіргі; біреуін таңдап, соны ұстанамыз.",
                   "52% - жартыдан сәл көп: [[just over half]]. 24% - шамамен төрттен бір: [[about a quarter]].",
                   "Есе қатынасы: 24 : 12 = 2, демек телевизия газеттен екі есе көп: [[twice as popular as]].",
                   "Тең мәндер: newspaper = radio = 12% → [[the same proportion]].",
                   "Нәтиже: [[Just over half of the people surveyed read the news on their phones, while about a quarter watched it on television. Television was twice as popular as newspapers and radio, which were each chosen by the same proportion of people (12%).]]"],
         "answer": "Төрт пайыздың екеуі үлес сөзімен, екеуі есе және теңдік арқылы берілді - сандар жай тізілмеді.",
         "trap": "52%-ды «nearly half» деу. «Nearly» - сәл жетпейді деген сөз; 52% жартыдан асады."},
    ],
    "traps": [
        {"wrong": "«The number of cars rised».", "why": "rise - бұрыс етістік; өткен шағы - rose.", "fix": "rise - rose - risen; fall - fell - fallen."},
        {"wrong": "«There was a rise of prices».", "why": "Ненің өзгергенін in предлогы көрсетеді; of - мөлшерді.", "fix": "a rise in prices; a rise of 10%."},
        {"wrong": "«The percent of students increased».", "why": "percent саннан кейін ғана тұрады.", "fix": "the percentage of students; 20 percent of students."},
        {"wrong": "Бір мәтінде increase сөзін алты рет қайталау.", "why": "Сөздік қордың тарлығын көрсетеді.", "fix": "rose, grew, climbed сөздерін және «there was a rise in» құрылымын кезектестіріңіз."},
    ],
    "practice": [
        {"type": "gap", "q": "Предлогты қойыңыз: The price of bread rose from 100 to 120 tenge, so it rose ___ 20 tenge.", "accept": ["by"],
         "explain": "Айырма (120 − 100 = 20) by арқылы беріледі: rose by 20 tenge.",
         "errors": {"to": "to жеткен нүктені білдіреді: rose to 120. Ал 20 - айырма.", "on": "Қазақша «20 теңгеге» дегенді on деп аударуға болмайды; айырмаға by қолданылады.", "at": "at тұрған деңгейді білдіреді: stood at 100."},
         "hints": ["20 - жеткен нүкте ме, әлде айырма ма?", "Ұқсас мысал: Sales rose from 200 to 250, so they rose by 50.", "Айырма → by. Жауап: by."]},
        {"type": "mc", "q": "«Sales fell slightly» сөйлемінің мағынасын сақтайтын нұсқа қайсы?",
         "options": ["There was a slight fall in sales.", "There was a slightly fall of sales.", "There was a sharp fall in sales."], "answer": 0,
         "why": ["Дұрыс: үстеу (slightly) сын есімге (slight) айналды, етістік - зат есімге (a fall), одан кейін in.", "Зат есімнің алдында сын есім тұрады (slight), үстеу емес; және «fall in sales».", "sharp - күрт дегенді білдіреді, slight-қа қарама-қарсы: мағына өзгерді."],
         "hints": ["Зат есімнің алдында сын есім бе, үстеу ме?", "Ұқсас мысал: Prices rose sharply → There was a sharp rise in prices.", "slightly → slight, fell → a fall, + in sales. Мағына да сақталуы керек (slight ≠ sharp)."]},
        {"type": "gap", "q": "Үлес сөзін жазыңыз (екі сөз): 75% of students = three ___ of students.", "accept": ["quarters", "fourths"],
         "explain": "75% = 3/4 = three quarters.",
         "errors": {"quarter": "Үшеу болғандықтан көпше түрде: three quarters.", "thirds": "Three thirds - бүтін (100%). 75% - төрттен үш: three quarters."},
         "hints": ["75% жай бөлшекпен қалай жазылады?", "Ұқсас мысал: 25% = a quarter.", "75% = 3/4 → three quarters."]},
        {"type": "mc", "q": "Деректі дәл беретін сөйлемді таңдаңыз.",
         "passage": "<p>Ойдан алынған дерек: [[Bicycles sold in Shalkar: 2019 - 300, 2023 - 900.]]</p>",
         "options": ["Bicycle sales doubled between 2019 and 2023.", "Bicycle sales tripled between 2019 and 2023.", "Bicycle sales rose by 900 between 2019 and 2023."], "answer": 1,
         "why": ["Екі есе өсу 600 болар еді; мұнда 900.", "Дұрыс: 900 : 300 = 3, яғни үш есе - tripled.", "Айырма 900 − 300 = 600. «rose to 900» не «rose by 600» дұрыс болар еді."],
         "hints": ["900-ді 300-ге бөліңіз.", "Ұқсас мысал: 40 → 80 - doubled (екі есе).", "900 : 300 = 3 → tripled. Айырма 600, сондықтан «by 900» қате."]},
        {"type": "gap", "q": "Бір сөз жазыңыз: The ___ of people who cycle to work has increased. (саналатын зат есімге)", "accept": ["number", "proportion", "percentage"],
         "explain": "people - саналатын зат есім, сондықтан the number of people. (Үлес туралы болса: the proportion / the percentage of people.)",
         "errors": {"amount": "amount саналмайтын зат есіммен қолданылады: the amount of water. Адамдар саналады: the number of people.", "percent": "percent саннан кейін ғана тұрады (20 percent). Зат есім ретінде - percentage."},
         "hints": ["People саналады ма?", "Ұқсас мысал: the number of cars, бірақ the amount of traffic.", "Саналатын → the number of people."]},
        {"type": "mc", "q": "48%-ды қай сөзбен дәл жеткізуге болады?",
         "options": ["just over half", "just under half", "a quarter"], "answer": 1,
         "why": ["«Just over half» - жартыдан сәл көп (мысалы, 52%).", "Дұрыс: 48% - жартыдан сәл аз.", "A quarter - 25%."],
         "hints": ["48 саны 50-ден үлкен бе, кіші ме?", "Ұқсас мысал: 52% = just over half.", "48% < 50% → just under half (не nearly half)."]},
    ],
    "mastery": [
        {"type": "gap", "q": "Етістіктің дұрыс формасын жазыңыз: In 2018 the number of visitors ___ (fall) to 90 thousand.", "accept": ["fell"],
         "explain": "2018 - өткен уақыт, fall етістігінің өткен шағы - fell.",
         "errors": {"falled": "fall - бұрыс етістік: fall - fell - fallen.", "fallen": "fallen - үшінші форма, ол have/had-пен келеді. Past Simple - fell.", "falls": "2018 жыл өтіп кетті, өткен шақ керек: fell."}},
        {"type": "mc", "q": "Деректі дұрыс сипаттайтын сөйлем қайсы?",
         "passage": "<p>Ойдан алынған дерек: [[Monthly rainfall in Aksu: March 40 mm, April 60 mm.]]</p>",
         "options": ["Rainfall rose by 50% from March to April.", "Rainfall rose to 20 mm in April.", "Rainfall rose by 60 mm from March to April."], "answer": 0,
         "why": ["Дұрыс: айырма 20 мм, 20 : 40 = 50%.", "20 мм - айырма (by), ал жеткен нүкте - 60 мм (to).", "60 мм - жеткен нүкте; айырма - 20 мм."]},
        {"type": "gap", "q": "Предлогты қойыңыз: There was a sharp increase ___ the number of online shoppers.", "accept": ["in"],
         "explain": "Ненің өскенін in көрсетеді: an increase in the number of shoppers.",
         "errors": {"of": "of мөлшерді білдіреді (an increase of 10%). Ненің өскені - in.", "at": "increase сөзінен кейін at қолданылмайды; дұрысы - in."}},
    ],
    "summary": [
        "Үш қозғалыс: rose / fell / remained stable. rise - rose, fall - fell.",
        "Екі құрылым: «rose sharply» және «there was a sharp rise in».",
        "to - жеткен нүкте, by - айырма, at - деңгей, of - зат есімнен кейінгі мөлшер.",
        "Пайызды үлеске айналдырыңыз, бірақ шамалау да дәл болсын: 48% - just under half.",
        "the number of - саналатынға, the amount of - саналмайтынға; percentage - зат есім.",
        "Сандарды тізбей, салыстырыңыз: twice as many as, whereas, the highest.",
    ],
    "lab": {"href": "task1-visuals.html", "title": "Task 1 визуалдары"},
    "sources": ["Барлық атаулар мен сандар ойдан алынған; есептеулер тексерілген. Мәтін AO17 үшін жаңадан жазылған; ресми IELTS материалдары көшірілмеген."],
}


def _en(s):
    return _re.sub(r"\[\[(.+?)\]\]", r'<span class="gd-en">\1</span>', s)


LESSON["hook"]["text"] = _en(LESSON["hook"]["text"])
for _x in LESSON["explain"]:
    _x["body"] = _en(_x["body"])
for _x in LESSON["worked"]:
    _x["task"], _x["steps"], _x["answer"] = _en(_x["task"]), [_en(s) for s in _x["steps"]], _en(_x["answer"])
for _x in LESSON["practice"] + LESSON["mastery"]:
    if "passage" in _x:
        _x["passage"] = _en(_x["passage"])
