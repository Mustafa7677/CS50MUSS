# © 2026 AO17 командасы. All Rights Reserved.
# AO17 CS: «Қалай оқыған дұрыс» - academy/methods.html (жария бет). Оқу ғылымына сүйенген 8 тактика, әрқайсысы AO17-нің
# нақты құралдарымен байланысқан, бесеуінің бетте жаттығатын құралы бар (assets/js/ao17-methods.js): «Шын ба, аңыз ба?»,
# ми төккіш (еске түсіру), ұмыту қисығы (аралық қайталау), жаргон детекторы (Фейнман әдісі), 24 ұқсастық, фокус таймері.
# Мазмұн - AO17 командасының өз мәтіні; ғылыми дереккөздер беттің соңында. Бетте тек сабақ атаулары мен сілтемелері бар
# (олар курс бетінде де ашық), жабық мазмұн жоқ.
import html
import json

import course as CRS

E = lambda s: html.escape(str(s), quote=True)  # noqa: E731

# Оқу туралы тұжырымдар: (id, тұжырым, шын ба, түсіндірме, дереккөз)
MYTHS = [
    ("styles", "Әр адамның өз оқу стилі бар (көзбен, құлақпен, қолмен), сабақты соған сай берсе, жақсы үйренеді.", False,
     "Аңыз. Адамдар қалай оқығанды ұнататынын айта алады, бірақ сабақты «стильге» сай беру нәтижені жақсартатынына сенімді дәлел табылмаған. Әр тақырыптың өзіне лайық түрі бар: картаны көзбен, күйді құлақпен үйренесің.",
     "Pashler және әріптестері, 2008"),
    ("reread", "Конспектіні қайта-қайта оқу - емтиханға дайындалудың ең тиімді жолы.", False,
     "Аңыз. Қайта оқығанда мәтін таныс көрінеді де, «білемін» деген жалған сезім туады. Кітапты жауып, есіңе түсіріп көру әлдеқайда тиімді.",
     "Dunlosky және әріптестері, 2013"),
    ("testing", "Өзіңді тексеру - тек бағалау емес, үйренудің өзі.", True,
     "Шын. Еске түсіру әрекеті білімді бекітеді: тест тапсырған топ бір аптадан кейін мәтінді қайта оқыған топтан көбірек есіне сақтаған.",
     "Roediger және Karpicke, 2006"),
    ("spacing", "Бір күнде бес сағат оқу мен бес күн бойы бір сағаттан оқудың нәтижесі бірдей.", False,
     "Аңыз. Уақыт бірдей болғанымен, күндерге бөліп оқыған білім ұзағырақ сақталады. Бұл - ең көп зерттелген оқу заңдылықтарының бірі.",
     "Cepeda және әріптестері, 2006"),
    ("mixing", "Әр түрлі тақырыптың есептерін араластырып шығару алғашында қиындау, бірақ кейін жақсы нәтиже береді.", True,
     "Шын. Аралас жаттығуда әр есепке қай әдіс керек екенін өзің таңдайсың, ал емтиханда дәл осы дағды керек. Бір зерттеуде аралас жаттыққан оқушылар кейінгі тестте әлдеқайда жоғары нәтиже көрсеткен.",
     "Rohrer және Taylor, 2007"),
    ("errors", "Қате жіберу оқуға кедергі: дұрыс жауапты бірден көрген жақсы.", False,
     "Аңыз. Алдымен өзің жауап іздеп, қателессең де, кейін дұрысын көрсең, оны жақсырақ есте сақтайсың. Маңыздысы - қатеден кейін міндетті түрде дұрыс жауапты көру.",
     "Kornell, Hays және Bjork, 2009"),
]

# 8 тактика: (id, атауы, бір сөйлеммен, неге жұмыс істейді, AO17-де қалай (HTML), құрал)
TACTICS = [
    ("recall", "Еске түсіру", "Кітапты жап та, есіңде не қалғанын жазып шық.",
     "Әр еске түсіру ми үшін «жол салу» сияқты: білімге қайта жеткен сайын жол кеңейеді. Қайта оқу оңай, сондықтан пайдасы аз; еске түсіру қиын, сондықтан пайдасы көп.",
     'Әр аптаның соңындағы <a href="exam.html?w=1">апта сынағы</a> және сабақтардағы тапсырмалар - дайын еске түсіру жаттығулары.', "recall"),
    ("space", "Аралық қайталау", "Бір тақырыпқа бір рет көп емес, бірнеше рет аз-аздан орал.",
     "Ұмыта бастаған кезде қайталасаң, білім берігірек бекиді: ми «бұл қайта керек болады екен» деп түсінеді. Сондықтан бір түнгі жаттаудан гөрі бірнеше күнге бөлінген қайталау тиімді.",
     '<a href="study.html">«Менің оқуым»</a> бетіндегі қайталау жоспары мен <a href="plan.html">оқу кестесі</a> уақытты өзі бөледі.', "curve"),
    ("mix", "Араластыру", "Бір тақырыптың есептерін қатарынан емес, әр тақырыптан аралас шығар.",
     "Бір тақырыпты қатарынан жаттықтырғанда әдісті ойланбай қайталайсың. Араластырғанда әр есепте «бұл қай түрі?» деп ойлайсың, ал емтиханда дәл осы шешім керек.",
     '<a href="exam.html?mix=1">Аралас жаттығу</a> сен бастаған апталардан 10 сұрақты кезектестіріп береді.', "mix"),
    ("explain", "Түсіндіріп көр", "Ұғымды 12 жасар інің түсінетіндей қарапайым тілмен жазып шық.",
     "Түсіндіру кезінде біліміңдегі тесіктер бірден көрінеді: жай сөзбен айта алмаған жерің - әлі түсінбеген жерің. Бұл әдісті физик Ричард Фейнманның атымен атайды.",
     'Төмендегі жаргон детекторы мәтініңдегі түсіндірілмеген терминдерді табады. Сөз мағынасын <a href="../glossary.html">сөздіктен</a> тексер.', "feynman"),
    ("analogy", "Ұқсастық пен мысал", "Жаңа ұғымды өзің білетін нәрсеге ұқсат, сосын ұқсастықтың шегін тап.",
     "Ми жаңа білімді бұрынғы біліміне ілу арқылы сақтайды. Нақты мысал мен ұқсастық абстракт ұғымды ұстауға болатын нәрсеге айналдырады. Ал ұқсастықтың қай жерде бұзылатынын білу - түсінудің келесі сатысы.",
     "Әр апта комикспен басталады: ұғым алдымен күнделікті оқиға ретінде көрінеді.", "analogies"),
    ("dual", "Сөз бен сурет", "Түсіндірмені сызбамен, анимациямен немесе 3D модельмен қатар оқы.",
     "Ми сөз бен бейнені екі түрлі жолмен сақтайды. Екеуі қатар келсе, есте сақтаудың екі жолы пайда болады. Әр ұғымды қағазға өзің сызып көр - бұл да жаттығу.",
     '<a href="3d/index.html">3D зертхана</a> машинаның ішін симуляцияда көрсетеді, <a href="../viz.html">визуализациялар</a> алгоритмді қадамдап жүргізеді. <a href="oyu.html">Ою студиясында</a> Python кодың қазақ оюына айналады.', None),
    ("focus", "Бір іске бір уақыт", "25 минут тек бір іспен айналыс, сосын 5 минут демал.",
     "Телефонға қарап, қайта оралған сайын зейін қайта жиналуы керек, ал бұл уақыт пен күш жейді. Қысқа, бірақ толық зейінмен оқыған уақыт ұзақ, бірақ бөлшектенген уақыттан тиімдірек.",
     "Төмендегі фокус таймері бүгінгі фокус сессияларын санайды.", "focus"),
    ("reflect", "Өзіңді бағала", "Әр оқу кешінен соң: не түсіндім, не түсініксіз қалды, келесі жолы не істеймін?",
     "Не білетініңді және не білмейтініңді анық сезіну (метатану) - тиімді оқудың өзегі. Ол уақытты әлсіз жерге бағыттауға көмектеседі.",
     'Сынақта жауап бермес бұрын сенімділігіңді белгіле: төмендегі таразы өзіңді қаншалықты дәл бағалайтыныңды көрсетеді. Оқу журналы әр кештің қорытындысын сақтайды. Сынақ нәтижесіндегі талдау және <a href="study.html">«Менің оқуым»</a> бетіндегі «Қателер дәптері» де осыған арналған. Бағдарламалауда да солай: <a href="bota.html#bw-p-h">«Болжап көр»</a> бөлімінде кодты іске қоспай тұрып нәтижесін болжайсың, сосын Бота оны тексереді - ойдағы модель шындықпен бірден салыстырылады.', "reflect"),
]

# Фейнман: әр аптаға бір ұғым
EXPLAIN = ["Логикалық ЖӘНЕ мен НЕМЕСЕ", "Мысал мен дәлелдің айырмасы", "Жиын", "Алгоритм", "Екілік сан", "Айнымалы",
           "Функция", "Сөздік (dict)", "Алгоритмнің жылдамдығы (O үлкен)", "Компилятор", "Нұсқағыш", "Операциялық жүйе"]

# Жаргон: түбірлер (кіші әріппен). Қазақ тілі жалғамалы, сондықтан сөз түбірден басталса, термин деп саналады.
JARGON = sorted(set("""алгоритм айнымалы функци параметр аргумент итерац рекурси массив кортеж стек граф хэш хеш компилятор компиляц
интерпретатор синтаксис семантика бит байт екілік алтылық процессор регистр нұсқағыш объект класс инкапсуляц мұрагерлік
полиморфизм абстракц интерфейс протокол маршрутизатор сервер клиент транзакц индекс шифрла нейрон градиент конъюнкц дизъюнкц
импликац предикат квантор индукц инвариант асимптот логарифм детерминир буфер кэш операнд оператор фреймворк модуль идентификатор
дескриптор декларац инициализац конкатенац булев порт сокет домен рендер
типтендір экземпляр конструктор деструктор exception algorithm variable function recursion array pointer
compiler binary boolean loop string integer float hash stack queue graph node server protocol syntax runtime debug malloc struct
int char bool null none api json sql http""".split()))

# Апталық ырғақ: (күн, не істейміз, қай тактика)
RHYTHM = [("Дс", "Жаңа сабақ: комикс, түсіндірме, тапсырмалар", "dual"),
          ("Сс", "Ми төккіш: кешегі сабақты кітапсыз жазып шық", "recall"),
          ("Ср", "Жаңа сабақ және 3D зертхана", "dual"),
          ("Бс", "Аралас жаттығу: өткен апталардың сұрақтары", "mix"),
          ("Жм", "Апта ұғымын қарапайым тілмен түсіндір", "explain"),
          ("Сб", "Апта сынағы, қателерді талда", "reflect"),
          ("Жс", "Демалыс: ми да демалып, білімді бекітеді", "space")]

SOURCES = [
    "Dunlosky, J., Rawson, K. A., Marsh, E. J., Nathan, M. J., Willingham, D. T. (2013). Improving students' learning with effective learning techniques. Psychological Science in the Public Interest, 14(1), 4-58.",
    "Roediger, H. L., Karpicke, J. D. (2006). Test-enhanced learning: Taking memory tests improves long-term retention. Psychological Science, 17(3), 249-255.",
    "Cepeda, N. J., Pashler, H., Vul, E., Wixted, J. T., Rohrer, D. (2006). Distributed practice in verbal recall tasks: A review and quantitative synthesis. Psychological Bulletin, 132(3), 354-380.",
    "Rohrer, D., Taylor, K. (2007). The shuffling of mathematics problems improves learning. Instructional Science, 35(6), 481-498.",
    "Pashler, H., McDaniel, M., Rohrer, D., Bjork, R. (2008). Learning styles: Concepts and evidence. Psychological Science in the Public Interest, 9(3), 105-119.",
    "Kornell, N., Hays, M. J., Bjork, R. A. (2009). Unsuccessful retrieval attempts enhance subsequent learning. Journal of Experimental Psychology: Learning, Memory, and Cognition, 35(4), 989-998.",
    "Chi, M. T. H., de Leeuw, N., Chiu, M.-H., LaVancher, C. (1994). Eliciting self-explanations improves understanding. Cognitive Science, 18(3), 439-477.",
    "Paivio, A. (1986). Mental representations: A dual coding approach. Oxford University Press.",
    "Ebbinghaus, H. (1885). Über das Gedächtnis. Leipzig: Duncker & Humblot.",
    "Weinstein, Y., Madan, C. R., Sumeracki, M. A. (2018). Teaching the science of learning. Cognitive Research: Principles and Implications, 3, 2.",
]


def weeks_data(lessons):
    """Ми төккіш үшін: әр аптаның атауы мен сабақтарының атаулары мен сілтемелері (курс бетінде де ашық)."""
    by_mod = {}
    for L in lessons:
        by_mod.setdefault(L["moduleId"], []).append(L)
    out = []
    for n, (mid, _q, _l) in enumerate(CRS.WEEKS, 1):
        ls = sorted(by_mod.get(mid, []), key=lambda x: x["slug"])
        out.append({"n": n, "name": CRS.WEEK_SHORT.get(mid, mid), "lessons": [[L["title"], f"{mid}/{L['slug']}.html"] for L in ls]})
    return out


def validate(lessons):
    import analogies as AN
    errs = []
    if len(MYTHS) != 6 or sum(1 for m in MYTHS if m[2]) != 2:
        errs.append("оқу әдістері: 6 тұжырым (екеуі шын) болуы керек")
    if len(TACTICS) != 8 or len({t[0] for t in TACTICS}) != 8:
        errs.append("оқу әдістері: 8 түрлі тактика болуы керек")
    if len(EXPLAIN) != 12:
        errs.append("оқу әдістері: әр аптаға бір түсіндіру ұғымы керек")
    if len(AN.ANALOGIES) != 24 or any(not all(a[:4]) for a in AN.ANALOGIES):
        errs.append("оқу әдістері: 24 толық ұқсастық керек (ұғым, атауы, мәтін, шегі)")
    if any(len(w["lessons"]) < 5 for w in weeks_data(lessons)):
        errs.append("оқу әдістері: апталардың сабақтары табылмады")
    return errs


GLYPH = {  # тактиканың белгісі (түпнұсқа қарапайым геометрия, 24x24)
    "recall": '<path d="M12 3a9 9 0 1 0 9 9" /><path d="M12 7v5l3 2" /><path d="M17 3h4v4" />',
    "space": '<path d="M3 18c3-9 5-9 6-4s3 5 6-2 4-4 6-2" />',
    "mix": '<path d="M4 7h3l10 10h3M4 17h3l3-3M14 10l3-3h3" /><path d="M18 5l2 2-2 2M18 15l2 2-2 2" />',
    "explain": '<path d="M4 5h16v10H9l-5 4z" /><path d="M8 9h8M8 12h5" />',
    "analogy": '<circle cx="8" cy="12" r="5" /><circle cx="16" cy="12" r="5" />',
    "dual": '<rect x="3" y="5" width="8" height="14" rx="1" /><path d="M14 17l3-5 2 3 2-2" /><circle cx="17" cy="8" r="1.5" />',
    "focus": '<circle cx="12" cy="13" r="8" /><path d="M12 9v4h3M10 2h4" />',
    "reflect": '<path d="M12 3v18M5 7l7-4 7 4M5 7l-2 6h4zM19 7l-2 6h4z" />',
}


def glyph(t):
    return f'<svg class="mt-g" viewBox="0 0 24 24" aria-hidden="true">{GLYPH[t]}</svg>'


def widget(kind, lessons):
    if kind == "recall":
        opts = "".join(f'<option value="{w["n"]}">{w["n"]}-апта: {E(w["name"])}</option>' for w in weeks_data(lessons))
        return f"""<div class="mt-w mt-recall" data-mt-recall>
          <div class="mt-row"><label>Апта <select data-rc-week>{opts}</select></label> <button class="btn gold" type="button" data-rc-start>3 минут бастау</button> <span class="mt-clock" data-rc-clock aria-live="off">3:00</span></div>
          <label class="mt-ta"><span>Осы апта туралы есіңде қалғанның бәрін жаз: ұғымдар, мысалдар, формулалар, сұрақтар.</span><textarea rows="6" data-rc-text></textarea></label>
          <p><button class="btn secondary" type="button" data-rc-check>Тексеру</button></p>
          <div data-rc-out aria-live="polite"></div>
        </div>"""
    if kind == "curve":
        return """<div class="mt-w mt-curve" data-mt-curve>
          <div class="mt-row mt-seg" role="group" aria-label="Қайталау тәсілі">
            <button type="button" data-cv="once" aria-pressed="false">Бір рет оқу</button>
            <button type="button" data-cv="cram" aria-pressed="false">Бір түнде 5 рет</button>
            <button type="button" data-cv="spaced" aria-pressed="true">1, 3, 7, 14-күндері</button>
          </div>
          <figure class="mt-cfig"><div data-cv-svg></div><figcaption data-cv-cap aria-live="polite"></figcaption></figure>
          <p class="mt-note">Иллюстрация: Эббингауз моделінің қарапайым нұсқасы. Нақты сандар адамға және тақырыпқа қарай өзгереді, бірақ заңдылық сол: ұмыта бастағанда қайталау білімді ұзағырақ бекітеді.</p>
        </div>"""
    if kind == "mix":
        return """<div class="mt-w mt-mix" aria-hidden="true">
          <p class="mt-mixrow"><span>Қатарынан:</span><i class="a">A</i><i class="a">A</i><i class="a">A</i><i class="b">B</i><i class="b">B</i><i class="b">B</i><i class="c">C</i><i class="c">C</i><i class="c">C</i></p>
          <p class="mt-mixrow"><span>Аралас:</span><i class="a">A</i><i class="b">B</i><i class="c">C</i><i class="b">B</i><i class="a">A</i><i class="c">C</i><i class="a">A</i><i class="c">C</i><i class="b">B</i></p>
        </div>"""
    if kind == "feynman":
        opts = "".join(f'<option value="{i}">{n}-апта: {E(c)}</option>' for i, (n, c) in enumerate(zip(range(1, 13), EXPLAIN)))
        return f"""<div class="mt-w mt-fey" data-mt-feynman>
          <div class="mt-row"><label>Ұғым <select data-fy-topic>{opts}</select></label></div>
          <label class="mt-ta"><span>Ұғымды 12 жасар інің түсінетіндей түсіндір. Терминді қолдансаң, «яғни» не «дегеніміз» деп мағынасын аш.</span><textarea rows="7" data-fy-text></textarea></label>
          <p><button class="btn gold" type="button" data-fy-check>Тексеру</button> <small class="mt-note" data-fy-count></small></p>
          <div data-fy-out aria-live="polite"></div>
        </div>"""
    if kind == "analogies":
        import analogies as AN
        cards = "".join(
            f'<li class="an-c"><button type="button" class="an-b" aria-expanded="false" aria-controls="an-{i}"><span class="an-k">{E(c)}</span><b>{E(t)}</b></button>'
            f'<div class="an-d" id="an-{i}" hidden><p>{E(x)}</p><p class="an-lim"><b>Шегі:</b> {E(lim)}</p></div></li>'
            for i, (c, t, x, lim) in enumerate(AN.ANALOGIES))
        return f'<ul class="mt-w an-list">{cards}</ul>'
    if kind == "reflect":
        return """<div class="mt-w mt-refl" data-mt-reflect>
          <h3 class="mt-wh">Сенің сенімділік таразың</h3>
          <div data-cal-out></div>
          <h3 class="mt-wh">Оқу журналы</h3>
          <form data-jr-form>
            <label class="mt-ta"><span>Бүгін не түсіндім?</span><textarea rows="2" name="a" required></textarea></label>
            <label class="mt-ta"><span>Не түсініксіз қалды?</span><textarea rows="2" name="b"></textarea></label>
            <label class="mt-ta"><span>Келесі жолы не істеймін?</span><textarea rows="2" name="c"></textarea></label>
            <p class="mt-row"><button class="btn gold" type="submit">Журналға жазу</button> <button class="btn secondary" type="button" data-jr-export>Журналды жүктеу (.txt)</button></p>
          </form>
          <p class="mt-note" data-jr-stat aria-live="polite"></p>
          <ol class="jr-list" data-jr-list></ol>
        </div>"""
    if kind == "focus":
        return """<div class="mt-w mt-focus" data-mt-focus>
          <div class="mt-fring"><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="52" class="tr"/><circle cx="60" cy="60" r="52" class="va" data-fc-ring/></svg>
            <p><b data-fc-time role="timer" aria-live="off">25:00</b><span data-fc-phase>Фокус</span></p></div>
          <div class="mt-fside">
            <div class="mt-row mt-seg" role="group" aria-label="Ұзақтығы"><button type="button" data-fc-p="25,5" aria-pressed="true">25 / 5</button><button type="button" data-fc-p="50,10" aria-pressed="false">50 / 10</button><button type="button" data-fc-p="15,3" aria-pressed="false">15 / 3</button></div>
            <p class="mt-row"><button class="btn gold" type="button" data-fc-go>Бастау</button> <button class="btn secondary" type="button" data-fc-reset>Қайта қою</button></p>
            <p class="mt-fstat" data-fc-stat aria-live="polite"></p>
          </div>
        </div>"""
    return ""


def methods_html(lessons, page):
    myths = "".join(
        f'<li class="my-c" data-my="{i}" data-truth="{1 if t else 0}"><p class="my-q">{E(q)}</p>'
        f'<p class="my-acts"><button type="button" class="my-b" data-ans="1">Шын</button><button type="button" class="my-b" data-ans="0">Аңыз</button></p>'
        f'<div class="my-x" hidden><p>{E(x)}</p><p class="my-src">{E(src)}</p></div></li>'
        for i, (_id, q, t, x, src) in enumerate(MYTHS))
    index = "".join(f'<li><a href="#t-{tid}">{glyph(tid)}<span>{E(name)}</span></a></li>' for tid, name, *_ in TACTICS)
    secs = []
    for tid, name, one, why, how, kind in TACTICS:
        secs.append(f"""      <section class="mt-t mt-t-{tid}" id="t-{tid}" aria-labelledby="t-{tid}-h">
        <div class="mt-tx">
          <h2 id="t-{tid}-h">{glyph(tid)}{E(name)}</h2>
          <p class="mt-one">{E(one)}</p>
          <h3>Неге жұмыс істейді</h3><p>{E(why)}</p>
          <h3>AO17-де қалай</h3><p>{how}</p>
        </div>
        {widget(kind, lessons) if kind else ""}
      </section>""")
    rhythm = "".join(f'<li class="rh-{t}"><b>{d}</b><span>{E(x)}</span><a href="#t-{t}">{E(next(n for i, n, *_ in TACTICS if i == t))}</a></li>' for d, x, t in RHYTHM)
    srcs = "".join(f"<li>{E(s)}</li>" for s in SOURCES)
    data = json.dumps({"weeks": weeks_data(lessons), "jargon": JARGON, "topics": EXPLAIN}, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
    body = f"""  <div class="layout single">
    <article class="content mt" id="main" data-methods data-ao-progress>
      <p class="ac-crumb"><a href="course.html">AO17 CS курсы</a> / Қалай оқыған дұрыс</p>
      <header class="mt-head">
        <h1>Қалай оқыған дұрыс</h1>
        <p class="mt-lede">Көп оқу мен дұрыс оқу - екі бөлек нәрсе. Мұнда оқу ғылымы тексерген сегіз тактика бар. Әрқайсысының неге жұмыс істейтіні және AO17-де қалай қолданылатыны жазылған. Бесеуін осы бетте бірден жаттықтыруға болады.</p>
      </header>
      <section class="mt-myths" aria-labelledby="my-h">
        <h2 id="my-h">Шын ба, аңыз ба?</h2>
        <p class="mt-note">Оқу туралы алты тұжырым. Әрқайсысына жауап бер, сосын ғылым не дейтінін көр.</p>
        <ol class="my-list">{myths}</ol>
        <p class="my-score" data-my-score aria-live="polite"></p>
        <p class="my-more">Тағы жеті сенім комикс түрінде: <a href="learn.html">Қалай оқу керек?</a> Нұрай, Мустафа және Бота әрқайсысын тексереді, ал сен алдымен болжайсың.</p>
      </section>
      <nav class="mt-index" aria-label="Тактикалар" data-ao-spy><ul>{index}</ul></nav>
{chr(10).join(secs)}
      <section class="mt-rhythm" aria-labelledby="rh-h">
        <h2 id="rh-h">Бір апта қалай өтеді</h2>
        <p class="mt-note">Тактикалар бірге жұмыс істейді. Мысалы, аптасына бес сағат оқитын болсаң, апта былай өтуі мүмкін. Күндерді <a href="plan.html">оқу кестесінде</a> өзіңе бейімде.</p>
        <ol class="rh-list">{rhythm}</ol>
      </section>
      <section class="mt-src" aria-labelledby="src-h">
        <h2 id="src-h">Дереккөздер</h2>
        <ol>{srcs}</ol>
      </section>
      <noscript><p>Жаттығу құралдары JavaScript-пен жұмыс істейді; тактикалардың мәтіні онсыз да оқылады.</p></noscript>
    </article>
  </div>
  <script type="application/json" id="mt-data">{data}</script>"""
    return "academy/methods.html", page("academy/methods.html", "Қалай оқыған дұрыс: 8 оқу тактикасы",
                                        "Оқу ғылымына сүйенген сегіз тактика: еске түсіру, аралық қайталау, араластыру, түсіндіру, ұқсастық, сөз бен сурет, фокус және өзін бағалау. Бетте бірден жаттығатын құралдармен.",
                                        body, scripts=("assets/js/ao17-motion.js", "assets/js/ao17-methods.js"), styles=("assets/css/ao17-methods.css", "assets/css/ao17-motion.css"))
