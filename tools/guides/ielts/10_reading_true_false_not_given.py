# © 2026 Sagid Mustafa. All Rights Reserved.
# AO17 IELTS оқулығы · Reading · True / False / Not Given. Авторлық мазмұн.
_TEA = ("<p><b>Tea on Mount Aruna</b></p>"
        "<p>[[Tea was first planted on the slopes of Mount Aruna in 1871 by a schoolteacher, Hugo Brandt. The earliest bushes were grown from seed that Brandt had brought back from a journey abroad. For the first twenty years the leaves were sold only in the nearby town. Today the estate produces around 300 tonnes a year, most of which is exported. Picking is still done by hand, because machines damage the youngest leaves.]]</p>")
_BREN = ("<p>[[A survey of 2,000 commuters in the city of Brenmoor found that some cyclists had switched from driving because of rising fuel prices. The majority, however, said they simply enjoyed the exercise. Cycling to work is faster than taking the bus on most routes in the centre. The city plans to open four new cycle lanes next year.]]</p>")
_TRAIN = ("<p><b>The Night Train from Kessel</b></p>"
          "<p>[[The overnight train between Kessel and the coast stopped running in 2009, when cheap flights had taken most of its passengers. It returned in 2021 with new carriages. Tickets for the sleeping compartments now sell out weeks in advance during the summer. A bed costs roughly twice as much as a seat. The journey takes eleven hours, two hours longer than it did in the 1990s, because the train now waits at the border for a daytime service to pass.]]</p>")
_LAKE = ("<p><b>The Flamingos of Lake Tavira</b></p>"
         "<p>[[Every spring, thousands of flamingos arrive at Lake Tavira to breed. The birds build their nests from mud on small islands in the middle of the lake, where foxes cannot reach them. In dry years the water level falls and the islands become joined to the shore; in 2018 not a single chick survived. Rangers have since dug a channel that keeps the islands separate even when rainfall is low.]]</p>")
_O = ["TRUE", "FALSE", "NOT GIVEN"]
LESSON = {
    "id": "ielts.reading.true-false-not-given",
    "title": "True / False / Not Given: мәтін айтты ма, айтпады ма",
    "section": "Reading",
    "minutes": 40, "level": "негіз",
    "goals": [
        "Үш жауаптың дәл анықтамасын білу: TRUE - мәтін растайды, FALSE - мәтін қайшы келеді, NOT GIVEN - мәтінде мәлімет жоқ.",
        "FALSE пен NOT GIVEN-ді «түзету сынағы» арқылы ажырату.",
        "Жауапты өз біліміне не қисынға емес, тек мәтінге сүйеніп беру.",
        "all, most, some, only, always сияқты шектеуші сөздердің тұжырымды қалай өзгертетінін байқау.",
    ],
    "hook": {
        "text": "<p>Мәтінде бір сөйлем бар: [[Picking is still done by hand, because machines damage the youngest leaves.]] "
                "Тұжырым: [[Hand-picked tea tastes better than tea picked by machine.]] "
                "Тапсырма - тұжырымның мәтінге сәйкестігін анықтау: TRUE, FALSE әлде NOT GIVEN. Тұжырым өте қисынды естіледі: машина жапырақты зақымдайды, демек қолмен терілген шай дәмдірек болуы керек сияқты.</p>",
        "predict": {"q": "Дұрыс жауап қайсы?", "options": ["TRUE - қисынды, машина жапырақты зақымдайды ғой", "FALSE - мәтінде дәм туралы басқаша айтылған", "NOT GIVEN - мәтінде дәм туралы бір ауыз сөз жоқ"], "answer": 2,
                    "why": "Мәтін бір-ақ нәрсені айтады: шай қолмен теріледі, себебі машина жас жапырақты зақымдайды. Дәм (taste) туралы ештеңе жоқ - жақсы да, жаман да. «Зақымдалған жапырақтың дәмі нашар» деген ойды мәтін емес, біз өзіміз қостық. IELTS дәл осыны тексереді: мәтінде жазылғанды өз ойыңыздан ажырата аласыз ба. Қисынды естілетін, бірақ мәтінде жоқ тұжырым - NOT GIVEN."},
    },
    "explain": [
        {"h": "Тапсырма және үш жауап",
         "body": "<p>Сізге бірнеше тұжырым (statement) беріледі. Нұсқау: [[Do the following statements agree with the information given in the passage?]] Әр тұжырымға үш жауаптың бірін жазасыз.</p>"
                 "<table><tr><th>Жауап</th><th>Анықтамасы</th><th>Мәтінде не бар</th></tr>"
                 "<tr><td><b>TRUE</b></td><td>тұжырым мәтіндегі мәліметке сәйкес</td><td>сол ой, көбіне басқа сөзбен</td></tr>"
                 "<tr><td><b>FALSE</b></td><td>тұжырым мәтіндегі мәліметке қайшы</td><td>сол нәрсе туралы басқа, сыйыспайтын мәлімет</td></tr>"
                 "<tr><td><b>NOT GIVEN</b></td><td>мәтінде бұл туралы мәлімет жоқ</td><td>тақырып аталуы мүмкін, бірақ тұжырымның дәл осы бөлігі айтылмаған</td></tr></table>"
                 "<p>Назар аударыңыз: NOT GIVEN «тақырып мәтінде мүлде жоқ» дегенді білдірмейді. Тұжырымдағы сөздер мәтінде кездесуі мүмкін (шай, теру, машина), бірақ <b>дәл сол пікір</b> (дәмі жақсырақ) айтылмаған.</p>"
                 "<p>Тұжырымдар мәтіннің ретімен орналасады: 2-тұжырымның жауабы 1-тұжырымдікінен кейін тұрады.</p>"},
        {"h": "FALSE пен NOT GIVEN: түзету сынағы",
         "body": "<p>Оқушылардың көбі TRUE-ды оңай табады, ал FALSE пен NOT GIVEN-ді шатастырады. Оларды ажырататын бір сұрақ бар:</p>"
                 "<p><b>«Мәтінге сүйеніп, осы тұжырымды түзете аламын ба?»</b></p>"
                 "<table><tr><th>Тұжырым</th><th>Мәтін</th><th>Түзете аламын ба?</th><th>Жауап</th></tr>"
                 "<tr><td>[[Brandt bought his first tea seeds from a local farmer.]]</td><td>[[seed that Brandt had brought back from a journey abroad]]</td><td>иә: «жоқ, ол тұқымды шетелден алып келген»</td><td>FALSE</td></tr>"
                 "<tr><td>[[Brandt had studied agriculture before he planted tea.]]</td><td>[[a schoolteacher, Hugo Brandt]]</td><td>жоқ: оқыды ма, оқымады ма - мәтін айтпайды</td><td>NOT GIVEN</td></tr></table>"
                 "<p>FALSE болу үшін мәтінде «not» сөзі тұруы шарт емес. Мәтін жай ғана <b>басқа нәрсені</b> айтады, ал екеуі бір мезгілде шын бола алмайды: тұқым не жергілікті фермерден сатып алынған, не шетелден әкелінген.</p>"
                 "<p>Ал NOT GIVEN кезінде мәтін үндемейді: тұжырым шын да, жалған да болуы мүмкін, мәтін бұған кедергі жасамайды.</p>"},
        {"h": "Тек мәтін: өз біліміңіз бен қисыныңыз есепке алынбайды",
         "body": "<p>Нұсқауда анық жазылған: [[the information given in the passage]] - мәтінде <b>берілген</b> мәлімет. Сондықтан екі нәрсені өшіріп қойыңыз.</p>"
                 "<table><tr><th>Нені қоспаймыз</th><th>Мысал</th><th>Неге қате</th></tr>"
                 "<tr><td>Өмірден білетініміз</td><td>«Шай Азияда пайда болған, демек Брандт тұқымды Азиядан әкелген» → TRUE</td><td>мәтінде тек [[abroad]] делінген; қай ел екені айтылмаған</td></tr>"
                 "<tr><td>Қисынды болжам</td><td>«Мұғалім болса, ауыл шаруашылығын оқымаған» → FALSE</td><td>бұл - біздің қорытындымыз, мәтіндікі емес</td></tr></table>"
                 "<p>Шын өмірде сіз білетін дерек мәтінге қайшы келсе де, мәтін жеңеді. Мәтін ойдан шығарылған тақырып туралы болса да, ережелер сол қалпында.</p>"
                 "<p>Бірақ <b>парафраз</b> - қосымша ой емес. [[most of which is exported]] пен [[is mostly sold in other countries]] - бір мағына, бұл TRUE. Айырмашылықты сезініңіз: парафраз - сол ой басқа сөзбен; болжам - жаңа ой.</p>"},
        {"h": "Шектеуші сөздер тұжырымды өзгертеді",
         "body": "<p>Тест авторлары тұжырымға бір кішкентай сөз қосып, оны TRUE-дан FALSE-қа айналдырады. Тұжырымды оқығанда мына сөздердің астын сызыңыз:</p>"
                 "<table><tr><th>Түрі</th><th>Сөздер</th><th>Мысал</th></tr>"
                 "<tr><td>Мөлшер</td><td>[[all]], [[most]], [[many]], [[some]], [[few]], [[none]]</td><td>мәтін: [[some cyclists]] ↔ тұжырым: [[all the cyclists]] → FALSE</td></tr>"
                 "<tr><td>Жиілік</td><td>[[always]], [[usually]], [[sometimes]], [[never]]</td><td>мәтін: [[on most routes]] ↔ тұжырым: [[usually]] → TRUE</td></tr>"
                 "<tr><td>Шектеу</td><td>[[only]], [[mainly]], [[the first]], [[the main]]</td><td>мәтін: [[one of the reasons]] ↔ тұжырым: [[the only reason]] → FALSE</td></tr>"
                 "<tr><td>Сенімділік</td><td>[[will]], [[may]], [[is likely to]], [[plans to]]</td><td>мәтін: [[plans to open]] ↔ тұжырым: [[has opened]] → FALSE</td></tr>"
                 "<tr><td>Салыстыру</td><td>[[more]], [[less]], [[faster]], [[the largest]]</td><td>мәтін: [[two hours longer]] ↔ тұжырым: [[faster]] → FALSE</td></tr></table>"
                 "<p>Тұжырымда салыстыру болса, мәтінде де сол екі нәрсе <b>салыстырылуы</b> керек. Мәтін тек біреуін сипаттаса, ал екіншісі туралы үндемесе - бұл NOT GIVEN.</p>"},
        {"h": "Уақыт және жазу тәртібі",
         "body": "<p>NOT GIVEN-нің қаупі - жоқ нәрсені іздеп уақыт жоғалту. Мұның шешімі - рет ережесі: тұжырымның жауабы алдыңғы және келесі тұжырымдардың жауаптарының <b>арасында</b> тұруы керек. Сол аралықты мұқият оқып шығып, ештеңе таппасаңыз - NOT GIVEN деп жазып, алға жылжыңыз.</p>"
                 "<p>Жауап парағына толық сөзді жазыңыз: TRUE, FALSE, NOT GIVEN. Тағы бір ұқсас тапсырма бар - YES / NO / NOT GIVEN (автордың пікірі туралы). Нұсқауда TRUE/FALSE тұрса, YES деп жазбаңыз: сұралған сөзбен жауап беріңіз.</p>"
                 "<p>Бір топтағы жауаптардың бәрі бірдей болуы екіталай. Егер бес тұжырымның бесеуіне де TRUE қойсаңыз не NOT GIVEN мүлде шықпаса - қайта тексеріңіз.</p>"},
    ],
    "method": {"title": "Емтихандағы әдіс: «тап - салыстыр - түзет»", "steps": [
        {"name": "Тұжырымды бөлшекте", "text": "Тұжырымнан зәкір сөзді (атау, сан) және шектеуші сөзді (all, only, first, more) тауып, астын сызыңыз. Тұжырым дәл нені бекітіп тұрғанын түсініңіз."},
        {"name": "Мәтіннен орнын тап", "text": "Зәкір сөз бойынша мәтіннен сәйкес сөйлемді табыңыз. Рет ережесін қолданыңыз: жауап алдыңғы тұжырымның жауабынан төмен тұрады."},
        {"name": "Сөзбе-сөз салыстыр", "text": "Тұжырымның әр бөлігін мәтінмен салыстырыңыз. Бәрі сәйкес келсе (парафразбен болса да) - TRUE."},
        {"name": "Түзету сынағын жаса", "text": "Сәйкес келмесе, сұраңыз: мәтінге сүйеніп түзете аламын ба? Иә - FALSE. Мәтін бұл жайында үндемесе - NOT GIVEN."},
    ]},
    "worked": [
        {"task": _TEA + "<p>[[1 Tea growing on Mount Aruna was begun by a teacher.]]<br>[[2 Brandt bought his first tea seeds from a local farmer.]]<br>[[3 Brandt had studied agriculture before he planted tea.]]</p>",
         "steps": ["(1) Зәкір сөздер: [[begun]], [[teacher]]. Мәтін: [[first planted… by a schoolteacher, Hugo Brandt]]. [[begun]] = [[first planted]], [[teacher]] = [[schoolteacher]]. Барлық бөлігі сәйкес → TRUE.",
                   "(2) Зәкір: [[seeds]]. Мәтін: [[grown from seed that Brandt had brought back from a journey abroad]].",
                   "Түзету сынағы: түзете аламын ба? Иә - «жергілікті фермерден емес, шетелге сапардан алып келген». Екеуі бір мезгілде шын бола алмайды → FALSE.",
                   "(3) Зәкір: [[studied agriculture]]. Мәтінде Брандттың білімі туралы бір-ақ сөз бар: [[schoolteacher]]. Ауыл шаруашылығын оқығаны да, оқымағаны да айтылмаған.",
                   "Түзету сынағы: түзете алмаймын - мәтін үндемейді → NOT GIVEN. «Мұғалім болса, оқымаған шығар» деген - біздің болжамымыз."],
         "answer": "1 TRUE, 2 FALSE, 3 NOT GIVEN",
         "trap": "(3)-ке FALSE қою: «мұғалім - агроном емес» деген қисын мәтінде жоқ. Мұғалім де ауыл шаруашылығын оқыған болуы мүмкін; мәтін бұл туралы ештеңе айтпайды."},
        {"task": _BREN + "<p>[[1 All the cyclists in the survey gave up driving because of fuel costs.]]<br>[[2 In central Brenmoor, cycling is usually quicker than going by bus.]]<br>[[3 The new cycle lanes will be paid for by the national government.]]</p>",
         "steps": ["(1) Шектеуші сөз: [[All]]. Мәтін: [[some cyclists had switched from driving because of rising fuel prices]]. Себебі сәйкес, бірақ мөлшері - [[some]].",
                   "Келесі сөйлем мұны нақтылайды: [[The majority, however, said they simply enjoyed the exercise]]. Көпшілігінің себебі басқа. Түзете аламын: «бәрі емес, кейбірі ғана» → FALSE.",
                   "(2) Салыстыру: велосипед пен автобус. Мәтін: [[faster than taking the bus on most routes in the centre]]. [[on most routes]] = [[usually]], [[faster]] = [[quicker]] → TRUE.",
                   "(3) Зәкір: [[new cycle lanes]]. Мәтін: [[The city plans to open four new cycle lanes next year]]. Жолдар аталған, бірақ кім төлейтіні айтылмаған.",
                   "Түзету сынағы: «жоқ, оны … төлейді» деп толтыра алмаймын → NOT GIVEN. «Қала ашады, демек қала төлейді» деу - болжам."],
         "answer": "1 FALSE, 2 TRUE, 3 NOT GIVEN",
         "trap": "(1)-де «fuel prices» сөздерін көріп, TRUE қою: себеп дұрыс, бірақ All сөзі тұжырымды жалғанға айналдырады. (3)-те «new cycle lanes» мәтінде бар деп TRUE не FALSE қою: тақырыптың аталуы жеткіліксіз."},
    ],
    "traps": [
        {"wrong": "Тұжырымдағы сөздер мәтінде кездескендіктен TRUE қою.", "why": "Сөздердің сәйкестігі мағынаның сәйкестігін білдірмейді: бір шектеуші сөз (all, only) бәрін өзгертеді.", "fix": "Тұжырымның әр бөлігін жеке салыстырыңыз: кім, не істеді, қанша, қашан."},
        {"wrong": "Мәтінде жоқ мәліметке FALSE қою.", "why": "«Мәтінде жоқ» пен «мәтінге қайшы» - екі бөлек нәрсе.", "fix": "Түзету сынағы: мәтіннен дұрыс нұсқасын көрсете алмасаңыз - NOT GIVEN."},
        {"wrong": "Өз біліміне не «қисынды ғой» деген ойға сүйеніп жауап беру.", "why": "Тапсырма мәтінде берілген мәліметті ғана тексереді.", "fix": "Жауаптың дәлелі ретінде мәтіндегі нақты сөйлемді саусағыңызбен көрсете алуыңыз керек."},
        {"wrong": "NOT GIVEN жауабын іздеп, бүкіл мәтінді қайта-қайта оқу.", "why": "Жоқ нәрсе табылмайды; уақыт өзге сұрақтардан алынады.", "fix": "Алдыңғы және келесі тұжырымдардың жауаптары арасындағы бөлікті ғана тексеріп, жоқ болса NOT GIVEN жазыңыз."},
    ],
    "practice": [
        {"type": "mc", "q": "Мәтін: «The museum opened in 1950.» Тұжырым: «The museum opened in the nineteenth century.» Жауабы қайсы және неге?",
         "options": ["TRUE - екеуінде де музейдің ашылуы айтылған", "FALSE - мәтінге сүйеніп түзетуге болады: ол 1950 жылы, яғни жиырмасыншы ғасырда ашылған", "NOT GIVEN - мәтінде «nineteenth century» деген сөздер жоқ"], "answer": 1,
         "why": ["Тақырыбы бір, бірақ уақыты сәйкес емес.", "Дұрыс: 1950 - жиырмасыншы ғасыр. Мәтін тұжырымға қайшы келеді, түзету мүмкін.", "Сөздің мәтінде болмауы NOT GIVEN дегенді білдірмейді: мәтін ашылған уақытты нақты атап тұр."],
         "hints": ["Түзету сынағын жасаңыз: мәтінге сүйеніп тұжырымды түзете аласыз ба?", "Ұқсас мысал: мәтін «He was born in Lisbon», тұжырым «He was born in Madrid» → FALSE.", "1950 ≠ он тоғызыншы ғасыр (1801-1900). Түзетуге болады → FALSE."]},
        {"type": "mc", "q": "Мәтін бойынша: The night train service was cancelled because of competition from airlines.",
         "passage": _TRAIN, "options": _O, "answer": 0,
         "why": ["Дұрыс: «stopped running in 2009, when cheap flights had taken most of its passengers» - арзан рейстер жолаушыларын тартып алды = әуе компанияларының бәсекесі.", "Мәтін себепті дәл осылай атайды, қайшылық жоқ.", "Себеп мәтінде айтылған: «cheap flights»."],
         "hints": ["Зәкір: cancelled. Мәтінде оның синонимін табыңыз.", "Ұқсас мысал: «the shop closed when a supermarket opened nearby» = бәсекеден жабылды.", "stopped running = cancelled; cheap flights = airlines → TRUE."]},
        {"type": "mc", "q": "Мәтін бойынша: The new carriages were built in Kessel.",
         "passage": _TRAIN, "options": _O, "answer": 2,
         "why": ["Мәтінде вагондардың қай жерде жасалғаны айтылмаған.", "Түзету мүмкін емес: мәтін басқа жерді атамайды.", "Дұрыс: «It returned in 2021 with new carriages» - жаңа вагондар аталған, бірақ қайда жасалғаны туралы мәлімет жоқ."],
         "hints": ["new carriages сөзін тауып, сол сөйлемде «қайда жасалған» деген мәлімет бар-жоғын қараңыз.", "Ұқсас мысал: мәтін «She bought a car», тұжырым «The car was red» → NOT GIVEN.", "Мәтін: тек «with new carriages». Жасалған орны жоқ → NOT GIVEN."]},
        {"type": "mc", "q": "Мәтін бойынша: In summer it is easy to buy a sleeping-compartment ticket on the day of travel.",
         "passage": _TRAIN, "options": _O, "answer": 1,
         "why": ["Мәтін керісінше айтады: билеттер апталар бұрын таусылады.", "Дұрыс: «sell out weeks in advance during the summer» - жазда билет бірнеше апта бұрын бітеді, демек жол жүретін күні алу оңай емес.", "Мәтінде билеттің қолжетімділігі туралы нақты мәлімет бар."],
         "hints": ["sell out тіркесінің мағынасы - түгел сатылып кету.", "Ұқсас мысал: мәтін «tables must be booked a month ahead», тұжырым «you can just walk in» → FALSE.", "weeks in advance ↔ on the day of travel: қайшы → FALSE."]},
        {"type": "mc", "q": "Мәтін бойынша: A seat costs less than a bed on the night train.",
         "passage": _TRAIN, "options": _O, "answer": 0,
         "why": ["Дұрыс: «A bed costs roughly twice as much as a seat» - төсек екі есе қымбат, демек орындық арзанырақ. Сол салыстыру кері жағынан айтылған.", "Қайшылық жоқ: екеуі бір қатынасты білдіреді.", "Бағалар мәтінде салыстырылған."],
         "hints": ["Салыстыруды кері аударып көріңіз: A B-дан қымбат болса, B A-дан…", "Ұқсас мысал: «The red bag is heavier than the blue one» = «The blue bag is lighter».", "bed = 2 × seat → seat арзан → TRUE."]},
        {"type": "mc", "q": "Мәтін бойынша: The journey is faster today than it was in the 1990s.",
         "passage": _TRAIN, "options": _O, "answer": 1,
         "why": ["Мәтін керісінше: қазір екі сағатқа ұзағырақ.", "Дұрыс: «eleven hours, two hours longer than it did in the 1990s» - сапар баяулаған. Түзетуге болады.", "Екі кезең мәтінде тікелей салыстырылған."],
         "hints": ["Зәкір: 1990s. Сол сөйлемдегі салыстыру сөзін табыңыз.", "Ұқсас мысал: мәтін «prices are higher than last year», тұжырым «prices have fallen» → FALSE.", "two hours longer ↔ faster: қайшы → FALSE."]},
        {"type": "mc", "q": "Мәтін бойынша: Most passengers on the night train are tourists.",
         "passage": _TRAIN, "options": _O, "answer": 2,
         "why": ["Мәтінде жолаушылардың кім екені айтылмаған.", "Түзету мүмкін емес: мәтін жолаушылардың құрамы туралы үндемейді.", "Дұрыс: жазда билеттің тез таусылатыны айтылған, бірақ жолаушылардың туристер екені - біздің болжамымыз ғана."],
         "hints": ["«Жазда билет таусылады» дегеннен «туристер» деген қорытынды шығады ма? Оны мәтін айтты ма, әлде сіз бе?", "Ұқсас мысал: мәтін «the café is busy at noon», тұжырым «most customers are office workers» → NOT GIVEN.", "Мәтінде tourists сөзі де, жолаушылардың сипаттамасы да жоқ → NOT GIVEN."]},
    ],
    "mastery": [
        {"type": "mc", "q": "Мәтін бойынша: Flamingos come to Lake Tavira in the autumn.",
         "passage": _LAKE, "options": _O, "answer": 1,
         "why": ["Мәтінде басқа мезгіл аталған.", "Дұрыс: «Every spring… flamingos arrive» - көктемде келеді. Түзетуге болады: күзде емес, көктемде.", "Келу мезгілі мәтінде нақты айтылған."]},
        {"type": "mc", "q": "Мәтін бойынша: The flamingos use mud to make their nests.",
         "passage": _LAKE, "options": _O, "answer": 0,
         "why": ["Дұрыс: «The birds build their nests from mud» - сол ой басқа сөзбен.", "Қайшылық жоқ.", "Ұяның неден жасалатыны мәтінде айтылған."]},
        {"type": "mc", "q": "Мәтін бойынша: The channel was paid for by a local bird charity.",
         "passage": _LAKE, "options": _O, "answer": 2,
         "why": ["Мәтінде арнаны кім қаржыландырғаны жазылмаған.", "Түзету мүмкін емес: мәтін төлеушіні атамайды.", "Дұрыс: «Rangers have since dug a channel» - кім қазғаны айтылған, бірақ кім төлегені туралы мәлімет жоқ."]},
    ],
    "summary": [
        "TRUE - мәтін соны айтады (көбіне басқа сөзбен); FALSE - мәтін қайшы мәлімет береді; NOT GIVEN - мәтін үндемейді.",
        "Түзету сынағы: мәтінге сүйеніп тұжырымды түзете алсаңыз - FALSE, алмасаңыз - NOT GIVEN.",
        "Өз біліміңіз бен «қисынды ғой» деген ой есепке алынбайды: дәлел - мәтіндегі нақты сөйлем.",
        "all, some, only, always, more сияқты шектеуші сөздер TRUE-ды FALSE-қа айналдырады.",
        "Тұжырымдар мәтін ретімен жүреді: жауапты көрші тұжырымдардың арасынан ғана іздеңіз.",
    ],
    "lab": {"href": "reading.html", "title": "Reading зертханасы"},
    "sources": ["Сабақ мәтіні, оқу мәтіндері мен жаттығулары AO17 үшін жаңадан жазылған (авторы: Sagid Mustafa); Mount Aruna, Brenmoor, Kessel, Lake Tavira және барлық есімдер мен деректер ойдан алынған. AO17 IELTS иелерімен байланысты емес және ресми балл бермейді."],
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
