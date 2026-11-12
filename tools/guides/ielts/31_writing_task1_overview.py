# © 2026 Sagid Mustafa. All Rights Reserved.
# AO17 IELTS оқулығы · Writing · Task 1: шолу және негізгі үрдіс. Авторлық мазмұн. Барлық деректер ойдан алынған.
import re as _re

LESSON = {
    "id": "ielts.writing.task1-overview",
    "title": "Task 1: негізгі үрдісті табу және шолу жазу",
    "section": "Writing",
    "minutes": 35, "level": "негіз",
    "goals": [
        "Academic Task 1 жауабының төрт бөлігін (кіріспе, шолу, екі негізгі абзац) атау.",
        "Графиктен не кестеден 2 басты ерекшелікті сандарға кірмей тұрып табу.",
        "Нақты сансыз, жалпылайтын шолу (overview) сөйлемін жазу.",
    ],
    "hook": {
        "text": "<p>Ойдан алынған Саябақ қаласында үш көлік түрінің жолаушылар саны (мың адам, күніне) былай өзгерген:</p>"
                "<table><tr><th></th><th>2005</th><th>2015</th><th>2025</th></tr>"
                "<tr><td>Bus</td><td>60</td><td>48</td><td>35</td></tr>"
                "<tr><td>Metro</td><td>20</td><td>45</td><td>70</td></tr>"
                "<tr><td>Tram</td><td>15</td><td>14</td><td>15</td></tr></table>"
                "<p>Кестеде тоғыз сан бар. Бастаушы оқушы тоғызын да ретімен жазып шығады. Ал тәжірибелі оқушы алдымен бір сұрақ қояды: «Досыма бір сөйлеммен айтсам, мұнда не болды?»</p>",
        "predict": {"q": "Болжаңыз: қай сөйлем кестенің басты мағынасын ең жақсы береді?",
                    "options": ["In 2005 the bus had 60 thousand passengers.", "Metro use rose sharply while bus use fell, and tram use hardly changed.", "The table has three types of transport and three years."], "answer": 1,
                    "why": "Екінші сөйлем үш жолдың үшеуінің де бағытын бір көзқараспен жинақтайды және бірде-бір нақты сан келтірмейді. Бұл - шолу (overview). Бірінші - жеке дерек, үшінші - кестенің сыртқы сипаты ғана."},
    },
    "explain": [
        {"h": "Task 1 жауабының қаңқасы",
         "body": "<p>Academic Task 1-де сіз көргеніңізді <b>сипаттайсыз</b>: себебін болжамайсыз, пікір айтпайсыз. Жауап әдетте төрт бөліктен тұрады.</p>"
                 "<table><tr><th>Бөлік</th><th>Міндеті</th><th>Көлемі</th></tr>"
                 "<tr><td>Кіріспе</td><td>График нені көрсететінін өз сөзіңізбен айту</td><td>1 сөйлем</td></tr>"
                 "<tr><td>Шолу (overview)</td><td>Ең басты 2 ерекшелікті сансыз жалпылау</td><td>1-2 сөйлем</td></tr>"
                 "<tr><td>1-негізгі абзац</td><td>Бірінші топтың деректері, сандармен</td><td>3-4 сөйлем</td></tr>"
                 "<tr><td>2-негізгі абзац</td><td>Екінші топтың деректері, салыстырумен</td><td>3-4 сөйлем</td></tr></table>"
                 "<p>Шолу - ең маңызды бөлік. Ол жоқ болса, оқырман «жалпы не болды?» деген сұраққа жауап ала алмайды.</p>"},
        {"h": "Шолу деген не және не емес",
         "body": "<p>Шолу - суретке алыстан қарағанда көрінетін нәрсе. Онда <b>бағыт</b> пен <b>ең үлкен/ең кіші</b> айтылады, ал нақты сандар негізгі абзацтарға қалдырылады.</p>"
                 "<table><tr><th>Шолу емес</th><th>Шолу</th></tr>"
                 "<tr><td>[[Bus passengers were 60 thousand in 2005 and 35 thousand in 2025.]]</td><td>[[Overall, bus use declined steadily over the period.]]</td></tr>"
                 "<tr><td>[[The table shows three types of transport.]]</td><td>[[Overall, the metro replaced the bus as the most popular form of transport.]]</td></tr></table>"
                 "<p>Шолуды көбіне [[Overall,]] сөзінен бастайды - сонда оқырман оны бірден табады. Оны кіріспеден кейін де, мәтіннің соңында да қоюға болады; бастаушыға кіріспеден кейін жазған қауіпсіз: уақыт жетпей қалса да, шолу жазылған болады.</p>"},
        {"h": "Екі басты ерекшелікті қалай табуға болады",
         "body": "<p>Сандарды оқымай тұрып, төрт сұрақ қойыңыз.</p>"
                 "<table><tr><th>Сұрақ</th><th>Біздің кестедегі жауап</th></tr>"
                 "<tr><td>Не өсті?</td><td>Metro (20 → 70)</td></tr>"
                 "<tr><td>Не кеміді?</td><td>Bus (60 → 35)</td></tr>"
                 "<tr><td>Не өзгермеді?</td><td>Tram (≈ 15)</td></tr>"
                 "<tr><td>Басында және соңында кім бірінші?</td><td>Басында Bus, соңында Metro</td></tr></table>"
                 "<p>Осы жауаптардан ең көзге түсетін екеуін таңдаймыз: 1) метро өсіп, автобус кеміді; 2) көшбасшы ауысты. Уақыт көрсетілмеген диаграммада (мысалы, бір жылғы дөңгелек диаграмма) «өсті-кеміді» орнына «ең үлкен, ең кіші, шамалас» деп сұраймыз.</p>"},
        {"h": "Кіріспе: сұрақты көшірмей айту",
         "body": "<p>Кіріспе - тапсырмадағы сөйлемнің өз сөзіңізбен айтылған түрі. Сөзбе-сөз көшірілген сөйлем сіздің тіліңізді көрсетпейді.</p>"
                 "<table><tr><th>Тапсырмада</th><th>Сіздің кіріспеңіз</th></tr>"
                 "<tr><td>[[The table shows the number of passengers using three types of transport in Sayabak in 2005, 2015 and 2025.]]</td><td>[[The table compares how many people travelled by bus, metro and tram each day in Sayabak in three different years.]]</td></tr></table>"
                 "<p>Өзгертудің үш тәсілі: синоним ([[shows → compares]]), сөз табын ауыстыру ([[the number of passengers → how many people travelled]]), жалпылау ([[2005, 2015 and 2025 → three different years]]). Атауларды (bus, metro) өзгертудің қажеті жоқ.</p>"},
        {"h": "Деректерді топтау",
         "body": "<p>Негізгі абзацтарда сандарды кестедегі ретпен емес, <b>мағынасы бойынша топтап</b> береміз. Бізде қисынды екі топ бар: өзгергендер (bus пен metro - қарама-қарсы бағытта) және өзгермеген (tram).</p>"
                 "<p>Барлық санды жазу міндетті емес. Басы, соңы және бетбұрыс нүктесі жеткілікті: [[Metro use more than tripled, from 20 thousand to 70 thousand passengers a day.]] Әр санның жанында өлшем бірлігі тұруы керек.</p>"},
    ],
    "method": {"title": "Алғашқы 4 минут: жазбай тұрып қарау", "steps": [
        {"name": "Не өлшенген", "text": "Тақырыпты, осьтерді, өлшем бірлігін (%, мың, тонна) және уақытты оқыңыз: өткен шақ па, болжам ба?"},
        {"name": "Алыстан қара", "text": "Не өсті, не кеміді, не өзгермеді, кім бірінші - төрт сұраққа жауап беріңіз."},
        {"name": "Екеуін таңда", "text": "Ең көзге түсетін екі ерекшелікті таңдап, сансыз бір-екі сөйлеммен шолу жазыңыз."},
        {"name": "Топта", "text": "Деректерді екі топқа бөліңіз: әр топ - бір негізгі абзац. Содан кейін ғана сандарды қосыңыз."},
    ]},
    "worked": [
        {"task": "<p>Ойдан алынған дерек. [[The chart shows the percentage of households in Tasbulak with a home computer and with a smartphone.]]</p>"
                 "<table><tr><th></th><th>2008</th><th>2014</th><th>2020</th></tr><tr><td>Computer</td><td>40%</td><td>55%</td><td>58%</td></tr><tr><td>Smartphone</td><td>5%</td><td>50%</td><td>90%</td></tr></table><p>Кіріспе мен шолу жазайық.</p>",
         "steps": ["Не өлшенген: үй шаруашылықтарының <b>пайызы</b>, үш жыл, өткен шақ.",
                   "Алыстан қараймыз: екеуі де өсті; смартфон әлдеқайда тез өсті; басында компьютер алда, соңында смартфон алда.",
                   "Екі басты ерекшелік: 1) екеуі де өсті, бірақ смартфон күрт; 2) смартфон компьютерден озып кетті.",
                   "Кіріспе: [[The chart compares the proportion of homes in Tasbulak that had a computer and a smartphone in 2008, 2014 and 2020.]]",
                   "Шолу: [[Overall, ownership of both devices increased, but smartphones grew far more rapidly and overtook computers by the end of the period.]] Мұнда бірде-бір пайыз жоқ."],
         "answer": "Кіріспе - нені салыстырады; шолу - екеуі де өсті + смартфон озып кетті.",
         "trap": "Шолуға «from 5% to 90%» деп сан қосу. Сандардың орны - негізгі абзац."},
        {"task": "<p>Уақытсыз дерек (ойдан алынған). [[The pie chart shows how students at Zhuldyz College travel to class.]] Bus 45%, Walking 30%, Bicycle 15%, Car 10%. Шолу жазайық.</p>",
         "steps": ["Уақыт жоқ, демек «өсті-кеміді» сөздері қолданылмайды. Сұрақтар: ең үлкен қайсы, ең кіші қайсы, қайсылары шамалас?",
                   "Ең үлкен - bus (жартыға жуық). Ең кіші - car.",
                   "Жалпылау: қоғамдық көлік пен жаяу жүру бірге төрттен үш бөлікті құрайды - бірақ шолуда оны санмен емес, сөзбен айтамыз.",
                   "Шолу: [[Overall, the bus is by far the most common way of getting to college, while travelling by car is the least popular option.]]"],
         "answer": "[[Overall, the bus is by far the most common way of getting to college, while travelling by car is the least popular option.]]",
         "trap": "Бір сәттік диаграммаға «increased», «fell» деп жазу: өзгеріс көрсетілмеген, тек үлестер бар."},
    ],
    "traps": [
        {"wrong": "Шолу жазбай, бірден сандарды тізу.", "why": "Оқырман басты мағынаны өзі іздеуге мәжбүр болады; тапсырманың негізгі талабы орындалмайды.", "fix": "Кіріспеден кейін бірден «Overall, ...» сөйлемін жазыңыз."},
        {"wrong": "Өсудің себебін түсіндіру («because people became richer»).", "why": "Графикте себеп көрсетілмеген; бұл - болжам, сипаттама емес.", "fix": "Тек көрініп тұрған нәрсені жазыңыз: не, қашан, қанша."},
        {"wrong": "Тапсырма сөйлемін сөзбе-сөз көшіру.", "why": "Көшірілген сөздер сіздің тіліңіз болып есептелмейді.", "fix": "Синоним, сөз табын ауыстыру не жалпылау арқылы қайта айтыңыз."},
    ],
    "practice": [
        {"type": "mc", "q": "Қай сөйлем шолу (overview) бола алады?",
         "passage": "<p>Ойдан алынған дерек: [[Cinema tickets sold in Akzhar (thousands): 2010 - 120, 2015 - 95, 2020 - 60. Online film subscriptions (thousands): 2010 - 10, 2015 - 70, 2020 - 150.]]</p>",
         "options": ["In 2010, 120 thousand cinema tickets were sold.", "Overall, cinema ticket sales fell while online subscriptions grew strongly.", "Overall, online subscriptions went from 10 thousand to 150 thousand."], "answer": 1,
         "why": ["Бұл - бір ғана дерек, жалпы көрініс емес.", "Дұрыс: екі қатардың да бағыты сансыз жалпыланған.", "«Overall» сөзі бар, бірақ мазмұны - нақты сандар және тек бір қатар. Шолу сандарға сүйенбейді."],
         "hints": ["Шолуда нақты сан болмайды және ол барлық негізгі қатарды қамтиды.", "Ұқсас мысал: «Overall, bus use declined while metro use rose.»", "Бірінші нұсқа - жеке дерек, үшіншісі - бір қатардың сандары. Тек екіншісі екі бағытты да сансыз береді."]},
        {"type": "gap", "q": "Шолуды бастайтын сөзді жазыңыз: ___, sales of paper books fell while e-book sales rose.", "accept": ["Overall", "In general", "Generally"],
         "explain": "Шолу әдетте Overall сөзінен басталады: оқырман басты ойды бірден табады.",
         "errors": {"Firstly": "Firstly тізімнің бірінші тармағын бастайды, ал бұл - жалпы көрініс.", "In conclusion": "In conclusion эссенің қорытындысына тән. Task 1-де қорытынды емес, шолу жазылады."},
         "hints": ["Бұл сөз «жалпы алғанда» дегенді білдіреді.", "Ұқсас мысал: Overall, the metro became the most popular form of transport.", "Жауап: Overall."]},
        {"type": "mc", "q": "Бір жылғы дөңгелек диаграмма үшін қай шолу дұрыс?",
         "passage": "<p>Ойдан алынған дерек: [[Energy sources in Kokterek, 2024: coal 50%, gas 30%, solar 12%, wind 8%.]]</p>",
         "options": ["Overall, coal increased to 50%.", "Overall, coal is the main source of energy, while wind and solar account for the smallest shares.", "Overall, energy is very important for Kokterek."], "answer": 1,
         "why": ["Диаграммада бір ғана жыл бар, өзгеріс көрсетілмеген: «increased» деуге негіз жоқ.", "Дұрыс: ең үлкен және ең кіші үлестер сансыз аталған.", "Бұл - пікір, диаграммадағы дерек емес."],
         "hints": ["Уақыт бойынша өзгеріс бар ма, әлде тек үлестер ме?", "Ұқсас мысал: «the bus is by far the most common way, while the car is the least popular».", "Бір жыл → өсу/кему жоқ. Ең үлкенін (coal) және ең кішілерін (wind, solar) атаған нұсқа дұрыс."]},
        {"type": "mc", "q": "Тапсырмада: «The graph shows the number of visitors to a museum between 2000 and 2020.» Қай кіріспе ең жақсы?",
         "options": ["The graph shows the number of visitors to a museum between 2000 and 2020.", "The graph illustrates how many people visited a museum over a twenty-year period from 2000.", "I will describe a graph about a museum, which is very interesting."], "answer": 1,
         "why": ["Бұл - тапсырманың сөзбе-сөз көшірмесі.", "Дұрыс: мағына сақталған, сөздер өзгертілген (shows → illustrates, the number of visitors → how many people visited, between 2000 and 2020 → a twenty-year period).", "Жеке пікір («interesting») және «I will describe» Task 1-ге тән емес; не өлшенгені де толық айтылмаған."],
         "hints": ["Мағына өзгермеуі, ал сөздер өзгеруі керек.", "Ұқсас мысал: «the number of passengers» → «how many people travelled».", "Бірінші - көшірме, үшінші - пікір. Екінші нұсқа мағынаны сақтап, қайта айтады."]},
        {"type": "mc", "q": "Мына деректі екі негізгі абзацқа қалай топтаған дұрыс?",
         "passage": "<p>Ойдан алынған дерек: [[Fruit exports (tonnes), 2015 → 2025: apples 300 → 520, pears 120 → 260, plums 200 → 90, cherries 150 → 60.]]</p>",
         "options": ["1-абзац: apples пен pears (өскендер); 2-абзац: plums пен cherries (кемігендер)", "1-абзац: 2015 жылғы төрт сан; 2-абзац: 2025 жылғы төрт сан", "Әр жемісқе бөлек абзац - төрт абзац"], "answer": 0,
         "why": ["Дұрыс: бағыты бірдей қатарларды бірге сипаттау салыстыруды жеңілдетеді.", "Жыл бойынша бөлсе, оқырман әр жемістің өзгерісін өзі есептеуі керек болады.", "Төрт шағын абзац тізімге айналады; ұқсастар мен айырмашылықтар көрінбей қалады."],
         "hints": ["Қай жемістердің бағыты бірдей?", "Ұқсас мысал: көлік кестесінде «өзгергендер» және «өзгермеген» деп топтадық.", "Apples пен pears өсті, plums пен cherries кеміді - екі топ, екі абзац."]},
    ],
    "mastery": [
        {"type": "mc", "q": "Мына дерекке қай шолу сәйкес келеді?",
         "passage": "<p>Ойдан алынған дерек: [[Average hours of sleep per night in Zhanaturmys: teenagers 2000 - 8.5, 2020 - 7.0; adults 2000 - 7.2, 2020 - 7.1.]]</p>",
         "options": ["Overall, both groups slept much less in 2020 than in 2000.", "Overall, teenagers slept noticeably less by 2020, whereas adults' sleep remained almost unchanged.", "Overall, teenagers slept 8.5 hours in 2000."], "answer": 1,
         "why": ["Ересектердің ұйқысы 7.2-ден 7.1-ге ғана өзгерді - «much less» деу дерекке сай емес.", "Дұрыс: бір топ айтарлықтай кеміді, екіншісі тұрақты қалды.", "Бұл - жеке сан, шолу емес."]},
        {"type": "mc", "q": "Task 1 жауабында қай сөйлем артық?",
         "options": ["Overall, rice production rose throughout the period.", "Production reached 40 million tonnes in 2020.", "This happened because farmers started to use better technology."], "answer": 2,
         "why": ["Бұл - шолу, ол қажет.", "Бұл - өлшем бірлігі бар нақты дерек, негізгі абзацқа сай.", "Дұрыс: графикте себеп көрсетілмеген, бұл - болжам. Task 1-де тек сипаттаймыз."]},
        {"type": "gap", "q": "Кіріспеде «shows» сөзін қайталамау үшін синоним жазыңыз: The table ___ the number of students in three cities.", "accept": ["compares", "illustrates", "presents", "gives", "provides", "displays"],
         "explain": "shows орнына compares, illustrates не presents қолдануға болады; үш қала салыстырылғандықтан compares әсіресе дәл.",
         "errors": {"show": "Бастауыш «the table» - жекеше, етістікке -s керек. Сонымен бірге shows-тан басқа сөз табыңыз.", "shows": "Бұл - тапсырмадағы сөздің өзі. Синонимін жазыңыз: compares, illustrates."}},
    ],
    "summary": [
        "Task 1 қаңқасы: кіріспе → шолу → екі негізгі абзац. Пікір мен себеп жазылмайды.",
        "Шолу - екі басты ерекшелік, сансыз, көбіне Overall сөзінен басталады.",
        "Төрт сұрақ: не өсті, не кеміді, не өзгермеді, кім бірінші.",
        "Уақытсыз диаграммада өзгеріс емес, үлестер салыстырылады.",
        "Деректерді ретімен емес, мағынасы бойынша екі топқа бөліңіз.",
    ],
    "lab": {"href": "task1-visuals.html", "title": "Task 1 визуалдары"},
    "sources": ["Барлық қала атаулары мен сандар ойдан алынған, тек жаттығуға арналған. Мәтін AO17 үшін жаңадан жазылған; ресми IELTS материалдары көшірілмеген."],
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
