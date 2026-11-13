# © 2026 Sagid Mustafa. All Rights Reserved.
# AO17 Digital SAT оқулығы · Reading & Writing · Information and Ideas · Central Ideas and Details. Авторлық мазмұн.
def _f(x):
    if isinstance(x, str):
        return x.replace("[[", '<span class="gd-en">').replace("]]", "</span>")
    if isinstance(x, list):
        return [_f(i) for i in x]
    if isinstance(x, dict):
        return {k: _f(v) for k, v in x.items()}
    return x


QI = "Which choice best states the main idea of the text?"

LESSON = _f({
    "id": "sat.rw.central-ideas",
    "title": "Central Ideas and Details: негізгі ой және деталь",
    "section": "Reading & Writing · Information and Ideas",
    "minutes": 35, "level": "негіз",
    "goals": [
        "Мәтіннің тақырыбын (topic) негізгі ойдан (main idea) ажырату.",
        "Негізгі ойды «кім/не + ол туралы не айтылды» формуласымен бір сөйлемге сыйғызу.",
        "Деталь сұрағында жауапты мәтіннен тура тауып, қайта айтылған (paraphrase) нұсқаны тану.",
    ],
    "hook": {
        "text": "<p>Досыңыз кино көріп келді. Сіз «Не туралы?» деп сұрадыңыз. Ол: «Ғарыш туралы» десе - бұл <b>тақырып</b>. "
                "Ал «Ғарышкер жалғыз қалып, тірі қалу үшін картоп өсіреді» десе - бұл <b>негізгі ой</b>. "
                "Ал «Онда қызыл шаң дауылы болды» десе - бұл бір ғана <b>деталь</b>. SAT осы үшеуін шатастыратын оқушыны аулайды: "
                "төрт нұсқаның үшеуі не тым кең, не тым тар, не мәтінде жоқ.</p>",
        "predict": {"q": "Мәтін: аралар туралы, нақтырақ - қала бақтарындағы аралардың ауылдағыдан әртүрлі гүлге қонатыны туралы. «Bees are important insects» деген нұсқаның кемшілігі қандай?",
                    "options": ["Тым тар", "Тым кең", "Кемшілігі жоқ"], "answer": 1,
                    "why": "Бұл нұсқа жалпы аралар туралы, ал мәтін нақты бір нәрсені - қаладағы аралардың гүл таңдауын айтады. Тым кең нұсқа жалған емес, бірақ мәтіннің ойы емес."},
    },
    "explain": [
        {"h": "1. Тақырып, негізгі ой, деталь",
         "body": "<table><tr><th>Ұғым</th><th>Сұрақ</th><th>Ұзындығы</th><th>Мысал</th></tr>"
                 "<tr><td>Topic (тақырып)</td><td>Не туралы?</td><td>1-3 сөз</td><td>[[urban bees]]</td></tr>"
                 "<tr><td>Main idea (негізгі ой)</td><td>Ол туралы автор не дейді?</td><td>бір сөйлем</td><td>[[Urban bees visit a wider variety of flowers than rural bees do.]]</td></tr>"
                 "<tr><td>Detail (деталь)</td><td>Оны немен дәлелдейді?</td><td>дерек, мысал</td><td>[[In one garden, bees visited 40 plant species.]]</td></tr></table>"
                 "<p class=\"gd-fx\">Негізгі ой = кім/не + ол туралы ең маңызды тұжырым</p>"
                 "<p>Дұрыс нұсқа мәтіннің <b>бәрін</b> жабатын «шатыр» сияқты: әр сөйлем соның астына сыяды.</p>"},
        {"h": "2. Негізгі ой қайда тұрады",
         "body": "<p>SAT мәтіні қысқа, сондықтан оның құрылысы әдетте осы үшеудің бірі:</p>"
                 "<table><tr><th>Құрылыс</th><th>Негізгі ой қайда</th></tr>"
                 "<tr><td>Тұжырым → мысалдар</td><td>бірінші сөйлемде</td></tr>"
                 "<tr><td>Ескі көзқарас → [[but / however]] → жаңа көзқарас</td><td><b>бұрылыстан кейін</b></td></tr>"
                 "<tr><td>Деректер → қорытынды</td><td>соңғы сөйлемде ([[thus, these findings suggest]])</td></tr></table>"
                 "<p>Ең маңызды ереже: мәтінде [[but, however, yet]] болса, автордың өз ойы содан <b>кейін</b>. Бұрылысқа дейінгі бөлік - тек фон.</p>"},
        {"h": "3. Қате нұсқаның төрт түрі",
         "body": "<table><tr><th>Түрі</th><th>Қалай танимыз</th></tr>"
                 "<tr><td>Тым тар</td><td>мәтінде бар, шын, бірақ бір ғана сөйлемді қамтиды</td></tr>"
                 "<tr><td>Тым кең</td><td>мәтіннен үлкен тақырыпты айтады</td></tr>"
                 "<tr><td>Мәтінде жоқ</td><td>қисынды, бірақ автор оны айтпаған (жиі: салыстыру, себеп, болашақ)</td></tr>"
                 "<tr><td>Бұрмаланған</td><td>мәтіннің сөздері бар, бірақ қатынасы ауысқан не дәрежесі асырылған</td></tr></table>"
                 "<p>«Тым тар» - ең жиі қақпан, өйткені ол <b>шындық</b>. Сұрақ «мәтінде бар ма?» емес, «мәтіннің негізгі ойы ма?».</p>"},
        {"h": "4. Деталь сұрағы: тауып, саусақпен көрсет",
         "body": "<p>Stem-де [[According to the text, ...]] не [[Based on the text, what is true about ...?]] тұрса - бұл деталь сұрағы. Мұнда қорытынды жасаудың қажеті жоқ.</p>"
                 "<ul><li>Stem-дегі кілт сөзді (есім, зат) мәтіннен табыңыз.</li>"
                 "<li>Сол сөйлемді және көршісін оқыңыз.</li>"
                 "<li>Дұрыс нұсқа сол сөйлемді <b>басқа сөзбен</b> айтады (paraphrase).</li></ul>"
                 "<table><tr><th>Мәтінде</th><th>Дұрыс нұсқада</th></tr>"
                 "<tr><td>[[rarely spoke in public]]</td><td>[[seldom gave speeches]]</td></tr>"
                 "<tr><td>[[finished ahead of schedule]]</td><td>[[was completed earlier than planned]]</td></tr></table>"
                 "<p>Мәтінмен сөзбе-сөз бірдей нұсқадан сақ болыңыз: сөздері дәл, ал мағынасы бұрмалануы мүмкін.</p>"
                 "<p>Тексеру тәсілі қарапайым: таңдаған нұсқаңызды дәлелдейтін сөйлемді мәтіннен саусақпен көрсете алуыңыз керек. Көрсете алмасаңыз, ол нұсқа сіздің болжамыңыз, ал мәтіннің айтқаны емес.</p>"},
        {"h": "5. Әдеби мәтін",
         "body": "<p>Әңгіме не роман үзіндісінде «тұжырым» жоқ. Онда негізгі ой - <b>кейіпкер + оның күйі не өзгерісі</b>.</p>"
                 "<ul><li>Кім туралы?</li><li>Ол не сезеді не не қалайды?</li><li>Мәтін соңында бір нәрсе өзгерді ме?</li></ul>"
                 "<p>Мысал: [[Mira practiced the speech all week, yet as she stepped onto the stage her hands would not stop shaking.]] Негізгі ой: «Мира дайындалғанына қарамастан қобалжиды». "
                 "Сезімді бір сөзбен атаңыз (қобалжу, мақтаныш, өкініш), сосын нұсқадан іздеңіз.</p>"},
    ],
    "method": {"title": "Емтихандағы әдіс: «Шатыр» тесті", "steps": [
        {"name": "Stem", "text": "Main idea ма, әлде деталь ма (According to the text)? Деталь болса - кілт сөзді мәтіннен іздейсіз."},
        {"name": "Бұрылыс", "text": "Мәтінді оқып, but/however/yet сөздерін белгілеңіз. Автордың ойы - бұрылыстан кейін."},
        {"name": "Бір сөйлем", "text": "Өз сөзіңізбен айтыңыз: кім/не + ол туралы не. 10 сөзден аспасын."},
        {"name": "Шатыр", "text": "Әр нұсқаға сұрақ: мәтіннің барлық сөйлемі осының астына сыя ма? Тым тар, тым кең, мәтінде жоқ, бұрмаланған нұсқаларды сызыңыз."},
    ]},
    "worked": [
        {"task": "<div class=\"gd-pass\"><p>For years, city planners assumed that widening roads would reduce traffic jams. However, a hypothetical review of thirty cities by transport analyst Omar Reyes found the opposite pattern: within five years of a road being widened, the number of cars using it grew until congestion returned to its earlier level. New lanes, Reyes concluded, invite new trips.</p></div>"
                 "<p>" + QI + "</p><p>A) City planners have studied traffic for many years.<br>B) Widening roads tends to attract more cars rather than permanently reduce congestion.<br>C) Reyes reviewed traffic data from thirty cities.<br>D) Cities should stop building roads and invest only in trains.</p>",
         "steps": ["<b>Бұрылыс:</b> [[However]] бар. Оған дейін - ескі болжам (жолды кеңейту кептелісті азайтады). Кейін - автордың ойы.",
                   "<b>Бір сөйлем:</b> «Жолды кеңейту жаңа көліктерді тартады, кептеліс қайта оралады».",
                   "<b>Шатыр:</b> B осыны айтады және соңғы сөйлемді де ([[New lanes invite new trips]]) жабады.",
                   "A - тым кең және бұрылысқа дейінгі фон. C - шын, бірақ тым тар: бұл әдіс, қорытынды емес. D - мәтінде жоқ: пойыз туралы да, ұсыныс туралы да сөз жоқ."],
         "answer": "B", "trap": "C нұсқасы мәтінде сөзбе-сөз бар - сондықтан тартымды. Бірақ «отыз қаланы зерттеді» - дәлелдің көзі, негізгі ой емес."},
        {"task": "<div class=\"gd-pass\"><p>The following text is from an original short story. Tomas has returned to his grandfather's workshop after many years.</p><p>The tools hung exactly where they always had, each outlined in faded paint on the wall. Tomas lifted the smallest chisel and was startled by how well it fit his hand now; as a boy he had needed both fists to hold it steady. He set it back in its outline carefully, as though the old man might walk in and check.</p></div>"
                 "<p>" + QI + "</p><p>A) Tomas is annoyed that the workshop has not been cleaned.<br>B) Tomas plans to sell his grandfather's tools.<br>C) Returning to the workshop makes Tomas aware of how he has changed while the place has stayed the same.<br>D) Tomas's grandfather was a famous craftsman.</p>",
         "steps": ["Әдеби мәтін: тұжырым жоқ, кейіпкердің күйін іздейміз. Кім? Томас.",
                   "Не байқалады? Құралдар орнында (ештеңе өзгермеген); қашау енді қолына сыяды (ол өскен); абайлап орнына қояды (атасына құрмет).",
                   "<b>Бір сөйлем:</b> «Орын сол қалпында, ал Томас өзгерген - ол соны сезеді».",
                   "C дәл осы. A - ашу жоқ, реңк қате. B - сату туралы сөз жоқ. D - атасының атақтылығы айтылмаған."],
         "answer": "C", "trap": "Әдеби мәтінде сезім тура айтылмайды, іс-әрекетпен көрсетіледі. Мәтінде аталмаған сезімді (ашу, қуаныш) өзіңіз қосып алмаңыз."},
    ],
    "traps": [
        {"wrong": "Мәтінде бар деген себеппен деталь нұсқасын негізгі ой деп таңдау.", "why": "Шын болу жеткіліксіз: негізгі ой бүкіл мәтінді қамтуы керек.", "fix": "«Шатыр» тесті: қалған сөйлемдер осы нұсқаның астына сыя ма?"},
        {"wrong": "Бұрылысқа (however) дейінгі ойды автордың ойы деп қабылдау.", "why": "Бірінші сөйлем жиі басқалардың ескі көзқарасын береді.", "fix": "However/but-тан кейінгі бөлікті негізге алыңыз."},
        {"wrong": "Деталь сұрағына есте қалғаны бойынша жауап беру.", "why": "Қате нұсқалар мәтіннің сөздерін басқа қатынаста қайталайды.", "fix": "Жауапты мәтіннен тауып, нақты сөйлемге саусақпен көрсетіңіз."},
    ],
    "practice": [
        {"type": "mc", "q": QI,
         "passage": "<p>Honeybees are known for their waggle dance, a movement that tells other bees where food can be found. The angle of the dance indicates the direction of the flowers relative to the sun, and its duration signals how far away they are. In this way, a single bee can direct hundreds of others to a patch of flowers it has discovered.</p>",
         "options": ["Honeybees are among the most studied insects.", "The waggle dance allows honeybees to communicate the location of food.", "The duration of the dance signals distance.", "Honeybees dance only when the sun is visible."], "answer": 1,
         "why": ["Тым кең: мәтін аралардың зерттелуі туралы емес, бір ғана би туралы.",
                 "Дұрыс: барлық сөйлем (бағыт, қашықтық, басқаларды бағыттау) осы ойдың астына сыяды.",
                 "Тым тар: бұл шын, бірақ екінші сөйлемнің жартысы ғана.",
                 "Мәтінде жоқ: «only» деген шектеу еш жерде айтылмаған."],
         "hints": ["Қай нұсқа барлық үш сөйлемді қамтиды?", "Ұқсас: «картоп өсіріп тірі қалды» - негізгі ой, «шаң дауылы болды» - деталь.", "Тақырып: waggle dance. Ол туралы не айтылды: тамақтың қай жерде екенін хабарлайды. Осыны айтатын нұсқа - B."]},
        {"type": "mc", "q": QI,
         "passage": "<p>Many people believe that goldfish have a memory of only a few seconds. Experiments tell a different story. In a hypothetical classroom project, students trained goldfish to push a lever for food at a certain time of day, and the fish still remembered the task three months later.</p>",
         "options": ["Goldfish can remember things far longer than is commonly believed.", "Most people think goldfish forget things within seconds.", "Students enjoy doing experiments with fish.", "Goldfish are more intelligent than most other pets."], "answer": 0,
         "why": ["Дұрыс: «tell a different story» - бұрылыс; одан кейінгі дәлел (үш айдан кейін есте сақтады) осы ойды қолдайды.",
                 "Бұл бұрылысқа дейінгі көпшілік пікір - автор оны жоққа шығарады.",
                 "Мәтінде жоқ: оқушылардың ұнатуы айтылмаған.",
                 "Мәтінде жоқ: басқа үй жануарларымен салыстыру жасалмаған."],
         "hints": ["Бұрылыс сөйлемін табыңыз.", "Ұқсас: «Жолды кеңейту кептелісті азайтады деп ойлаған. However...» - ой however-ден кейін.", "«Experiments tell a different story» - бұрылыс. Жаңа ой: алтын балық ұзақ есте сақтайды (үш ай). Жауап A."]},
        {"type": "mc", "q": "According to the text, why did the team move the telescope?",
         "passage": "<p>The observatory's first telescope stood near the harbor, where engineers could easily bring in supplies. Within a decade, however, the growing glow of streetlights made faint stars impossible to see. In 1931 the team moved the instrument to a mountain ridge forty kilometers inland, even though every piece of equipment then had to be carried up by mule. (The observatory described here is fictional.)</p>",
         "options": ["Supplies were difficult to deliver to the harbor.", "Light from the town interfered with observations.", "The mountain site was closer to the engineers' homes.", "The original telescope had been damaged by sea air."], "answer": 1,
         "why": ["Бұрмаланған: айлаққа жеткізу оңай болған, қиындық таудағы орында пайда болды.",
                 "Дұрыс: «the growing glow of streetlights made faint stars impossible to see» - көше шамдарының жарығы кедергі болды (paraphrase).",
                 "Мәтінде жоқ: инженерлердің үйі туралы сөз жоқ.",
                 "Мәтінде жоқ: теңіз ауасының зияны айтылмаған."],
         "hints": ["Бұл деталь сұрағы: себепті мәтіннен тауып көрсетіңіз.", "Ұқсас: «rarely spoke in public» = «seldom gave speeches» - сөз басқа, мағына сол.", "Көшіру алдындағы сөйлем: streetlights' glow → stars impossible to see. Paraphrase: light from the town interfered with observations."]},
        {"type": "mc", "q": QI,
         "passage": "<p>The following text is from an original short story.</p><p>Aigerim had told everyone she did not care about the competition. Still, when the list of finalists was pinned to the board, she read it three times from top to bottom, and then once more from the bottom up, before she let herself believe that her name was really there.</p>",
         "options": ["Aigerim is confused by the way the list is organized.", "Aigerim is disappointed with the results.", "Aigerim cares about the competition more than she has admitted.", "Aigerim believes the judges made an error."], "answer": 2,
         "why": ["Тізімді қайта оқуының себебі - сенбеуі, түсінбеуі емес.",
                 "Кері мағына: оның аты тізімде бар.",
                 "Дұрыс: «did not care» деген, бірақ («Still») тізімді төрт рет оқыды - іс-әрекеті сөзіне қайшы.",
                 "Мәтінде жоқ: қазылар туралы сөз жоқ."],
         "hints": ["Оның сөзі мен іс-әрекетін салыстырыңыз.", "Ұқсас: «қобалжымаймын» деп, қолы дірілдеген адам.", "Сөзі: маған бәрібір. Ісі: тізімді төрт рет оқыды. «Still» - қарама-қарсылық. Демек ол мойындағаннан көбірек мән береді: C."]},
        {"type": "gap", "q": "Мәтінде бар, шын, бірақ бір ғана сөйлемді қамтитын қате нұсқа түрі қалай аталады? «Тым ___» (бір сөз).",
         "accept": ["тар"], "explain": "«Тым тар» нұсқа - деталь. Ол шындық болғандықтан ең жиі қақпан: сұрақ «мәтінде бар ма» емес, «негізгі ой ма».",
         "errors": {"кең": "«Тым кең» нұсқа мәтіннен үлкен тақырыпты айтады, ал мұнда нұсқа мәтіннің кішкене бөлігін ғана қамтиды."},
         "hints": ["Екі қарама-қарсы түр бар: мәтіннен үлкен және мәтіннен кіші.", "Мысал: «Reyes reviewed thirty cities» - шын, бірақ бір ғана сөйлем.", "Бір бөлікті ғана қамтиды = тым тар."]},
    ],
    "mastery": [
        {"type": "mc", "q": QI,
         "passage": "<p>Early maps of the river delta showed a single wide channel. Surveys made a century later revealed dozens of narrow, shifting streams instead. Geographers now think that both sets of maps were accurate for their time: the delta itself had changed as sediment built up and split the main channel.</p>",
         "options": ["Early mapmakers were careless in their work.", "Differences between old and new maps of the delta reflect real changes in the landscape.", "River deltas are found in many parts of the world.", "Sediment built up in the delta."], "answer": 1,
         "why": ["Кері мағына: мәтін екі картаның да өз уақыты үшін дәл болғанын айтады.",
                 "Дұрыс: карталардың айырмасы қатеден емес, атыраудың өзінің өзгеруінен - соңғы сөйлемдегі қорытынды.",
                 "Тым кең: мәтін бір ғана атырау туралы.",
                 "Тым тар: бұл себептің бір бөлшегі ғана."]},
        {"type": "mc", "q": "According to the text, what did the weavers do differently from weavers in neighboring villages?",
         "passage": "<p>In a hypothetical mountain village described by anthropologist Sara Lind, weavers dye their wool only after the cloth is finished, whereas weavers in neighboring villages dye the yarn first. The result is a softer blend of colors, which buyers in the regional market recognize immediately.</p>",
         "options": ["They sold their cloth in a regional market.", "They used softer wool.", "They colored the cloth after weaving it rather than before.", "They wove cloth faster."], "answer": 2,
         "why": ["Базарда сату - айырмашылық ретінде берілмеген.",
                 "Бұрмаланған: жұмсақ болған - түстердің өтуі, жүннің өзі емес.",
                 "Дұрыс: «dye their wool only after the cloth is finished, whereas ... dye the yarn first» - тоқып болған соң бояйды.",
                 "Мәтінде жоқ: жылдамдық айтылмаған."]},
        {"type": "mc", "q": QI,
         "passage": "<p>The following text is from an original short story.</p><p>Every evening the ferry captain announced the same crossing time, and every evening the old engine took nine minutes longer. No passenger complained. They had long ago learned to treat the extra minutes as part of the journey, a pause in which nothing could be asked of them.</p>",
         "options": ["The passengers have come to value the ferry's delays.", "The captain is dishonest about the schedule.", "The ferry's engine needs to be replaced.", "The passengers are afraid to complain to the captain."], "answer": 0,
         "why": ["Дұрыс: ешкім шағымданбайды, артық минуттарды «тыныс алатын үзіліс» деп қабылдайды.",
                 "Мәтін капитанды айыптамайды; назар жолаушылардың көзқарасында.",
                 "Мәтінде жоқ: ауыстыру туралы ұсыныс жасалмаған.",
                 "Мәтінде жоқ: қорқыныш емес, жайбарақат қабылдау сипатталған."]},
    ],
    "summary": [
        "Тақырып - не туралы; негізгі ой - ол туралы не айтылды; деталь - дәлел.",
        "However/but-тан кейінгі бөлік - автордың ойы.",
        "Дұрыс нұсқа - «шатыр»: барлық сөйлем соның астына сыяды.",
        "Қате нұсқалар: тым тар (ең жиі), тым кең, мәтінде жоқ, бұрмаланған.",
        "Деталь сұрағында жауапты мәтіннен тауып көрсетіңіз; дұрыс нұсқа - paraphrase.",
        "Әдеби мәтінде: кейіпкер + оның күйі не өзгерісі.",
    ],
    "lab": {"href": "central-ideas.html", "title": "Central Ideas зертханасы"},
    "sources": ["Барлық мәтіндер, зерттеушілер мен зерттеулер ойдан құрастырылған (hypothetical).",
                "Сабақ AO17 үшін жаңадан жазылған (авторы: Sagid Mustafa). College Board материалдары көшірілмеген; AO17 College Board-пен байланысты емес."],
})
