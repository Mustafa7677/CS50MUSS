# © 2026 AO17 командасы. All Rights Reserved.
# AO17 CS: мұғалімге сабақ жоспарлары.
#   academy/teach/index.html - жиынтықтың басты беті және күнтізбелік-тақырыптық жоспар (КТЖ: 120 сабақ, аптасына сағат, CSV);
#   academy/teach/m01.html … m12.html - аптаның 10 сабағының әрқайсысына 45 минуттық қысқа мерзімді жоспар (ҚМЖ).
# Жоспардың әр жолы сабақтың өз деректерінен алынады: мақсаттар, тұзақ (жиі қате және дұрысы), теория, мысалдар, эксперимент,
# жаттығулар, жиі қателер, меңгеруді бағалау, рефлексия, тереңдету. Сондықтан мұғалім парағы сайттағы сабақпен сөзбе-сөз сәйкес.
# Шығу билетінің жауап кілті academy_build.answer_key-ден: сайттың тексергіші қабылдайтын кілтпен бірдей (tests/academy/keys.test.js).
# Оқу мақсаттары - AO17 CS бағдарламасының мақсаттары. МЖМБС кодтарымен сәйкестендіру - бөлек жұмыс (docs/BUSINESS-PLAN.md, 9-бөлім).
import hashlib
import html
import re

import cine as CN
import comic_eps as CXE
import course as CRS
import curriculum as C
import lab3d as L3
import plogic as P

E = lambda s: html.escape(str(s), quote=True)  # noqa: E731
PERIOD = 45   # бір академиялық сағат (минут)
# Сабақ барысы: (кілт, кезең, бөлігі, минут). Қосындысы - PERIOD.
FLOW = (("open", "Басы", "Қызығушылықты ояту", 5), ("learn", "Ортасы", "Жаңа ұғым", 12), ("lab", "Ортасы", "Зертхана", 6),
        ("practice", "Ортасы", "Жаттығу", 12), ("exit", "Соңы", "Шығу билеті", 6), ("reflect", "Соңы", "Рефлексия", 4))
IN_CLASS = 2   # сыныпта орындалатын жаттығу; қалғаны - үй тапсырмасы
LETTERS = "ABCDEF"
DIFF = {1: "бастапқы", 2: "негізгі", 3: "орта", 4: "күрделі", 5: "зерттеу"}
TYPE_KK = {
    "mc": "бір жауапты тест", "value": "өрнектің мәні", "truthtable": "ақиқат кестесі", "classify": "формуланы жіктеу",
    "formula": "формула құру", "argument": "аргументті тексеру", "number": "сандық жауап", "order": "ретке келтіру",
    "counterexample": "қарсы мысал", "closedform": "жабық формула", "recurrence": "рекуррентті қатынас", "setexpr": "жиын өрнегі",
    "setid": "жиын тепе-теңдігі", "props": "қатынас қасиеттері", "func": "функция түрі", "trace": "алгоритмді қадағалау",
    "count": "қадам санау", "convert": "санау жүйесіне аудару", "encode": "кодтау", "bitop": "биттік амал",
    "pycode": "Python коды", "pytests": "тест жазу", "coutput": "C бағдарламасының нәтижесі",
}
# Сайттағы тексергіштің атаулары (assets/js/academy.js: PROPN, FUNCN, KIND) - мұғалім кілті оқушы көретін сөзбен бірдей
PROPN = {"reflexive": "рефлексивті", "symmetric": "симметриялы", "antisymmetric": "антисимметриялы", "transitive": "транзитивті"}
FUNCN = {"bijective": "биекция", "injective": "инъекция (бірақ сюръекция емес)", "surjective": "сюръекция (бірақ инъекция емес)",
         "neither": "функция, бірақ инъекция да, сюръекция да емес", "notfunction": "функция емес"}
KIND = {"tautology": "тавтология", "contradiction": "қайшылық", "contingent": "бейтарап (орындалымды)"}
# Сабақ бетінің бөлімдері (academy_build.lesson_html: sec('a'…'n'), кино-түсіндіру)
SEC = {"film": ("s-film", "Кино-түсіндіру"), "theory": ("s-d", "Академиялық теория"), "examples": ("s-g", "Жұмыс мысалдары"),
       "lab": ("s-h", "Интерактивті эксперимент"), "practice": ("s-i", "Жаттығулар"), "exit": ("s-l", "Меңгеруді бағалау"),
       "reflect": ("s-m", "Рефлексия")}


def plain(h):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", h))).strip()


def first_sentence(h):
    """Ұғымға кіріспенің бірінші сөйлемі (күнделікті мысал): сабақты осыдан бастау."""
    m = re.search(r"<p>(.*?)</p>", h, re.S)
    t = plain(m.group(1) if m else h)
    m = re.match(r"(.+?[.!?])(\s|$)", t)
    return m.group(1) if m else t


def order_of(ex, uid):
    """Ретке келтіру тапсырмасының қадамдарын тұрақты араластыру (қағаздағы шығу билеті үшін): ешқашан дұрыс ретпен емес."""
    n = len(ex["steps"])
    idx = sorted(range(n), key=lambda i: hashlib.md5(f"{uid}:{i}".encode()).hexdigest())
    if idx == list(range(n)):
        idx = idx[1:] + idx[:1]
    return idx


def ask_html(ex, uid):
    h = f'<p class="tp-q">{E(ex["q"])}</p>'
    if ex.get("code"):
        h += f'<pre class="tp-code"><code>{E(ex["code"])}</code></pre>'
    if ex["type"] == "mc":
        h += '<ul class="tp-opts">' + "".join(f"<li><b>{LETTERS[i]}</b> {E(o)}</li>" for i, o in enumerate(ex["options"])) + "</ul>"
    elif ex["type"] == "order":
        h += '<ul class="tp-opts">' + "".join(f'<li><b>{LETTERS[j]}</b> {E(ex["steps"][i])}</li>' for j, i in enumerate(order_of(ex, uid))) + "</ul>"
    return h


def _val(v):
    s = E(v)
    return f'<pre class="tp-code"><code>{s}</code></pre>' if "\n" in str(v) else f"<p><b><code>{s}</code></b></p>"


def key_html(ex, k, uid):
    """Шығу билетінің жауап кілті: сайттың тексергіші қабылдайтын жауап, оқушы көретін атаулармен."""
    t = ex["type"]
    if t == "mc":
        a = ex["answer"]
        return f'<p><b>{LETTERS[a]}</b> {E(ex["options"][a])}</p><p class="tp-why">{E(ex["why"][a])}</p>'
    if t == "order":
        pos = {i: LETTERS[j] for j, i in enumerate(order_of(ex, uid))}
        return "<p>Дұрыс реті: <b>" + ", ".join(pos[i] for i in range(len(ex["steps"]))) + "</b></p>"
    if t == "number":
        return f'<p><b>{E(ex["answer"])}</b></p>'
    if t == "count":
        return f"<p><b>{E(k)}</b> рет</p>"
    if t == "value":
        return "<p><b>" + ("ақиқат (1)" if k is True else "жалған (0)" if k is False else E(k)) + "</b></p>"
    if t == "truthtable":
        names = sorted(P.variables(P.parse(ex["formula"])))
        head = "".join(f'<th scope="col">{E(n)}</th>' for n in names) + f'<th scope="col">{E(ex["formula"])}</th>'
        rows = "".join("<tr>" + "".join(f"<td>{int(env[n])}</td>" for n in names) + f"<td><b>{int(v)}</b></td></tr>"
                       for env, v in zip(P.envs(names), k))
        return f'<table class="tp-tt"><thead><tr>{head}</tr></thead><tbody>{rows}</tbody></table>'
    if t == "classify":
        return f"<p><b>{E(KIND[k])}</b></p>"
    if t == "argument":
        return ("<p><b>Аргумент дұрыс.</b></p>" if k else
                '<p><b>Аргумент дұрыс емес.</b></p><p class="tp-why">Алғышарттар ақиқат, ал қорытынды жалған болатын бағалау бар.</p>')
    if t in ("formula", "closedform", "recurrence", "setid"):
        return f'<p>Үлгі жауап: <b><code>{E(k)}</code></b></p><p class="tp-why">Тең мәнді басқа жазу да дұрыс: сайт оны өзі тексереді.</p>'
    if t == "counterexample":
        return f'<p>Мысалы: <b>{E(", ".join(str(x) for x in k[:4]))}</b></p><p class="tp-why">Тексерілетін облыста барлығы {len(k)} қарсы мысал бар.</p>'
    if t in ("trace", "convert", "encode", "bitop", "coutput"):
        return _val(k)
    if t in ("pycode", "pytests"):
        what = "Үлгі тесттер" if t == "pytests" else "Үлгі шешім"
        return f'<p>{what} (басқа дұрыс нұсқаны да сайт тесттері қабылдайды):</p><pre class="tp-code"><code>{E(k)}</code></pre>'
    if t == "setexpr":
        return "<p><b>" + (E("{" + ", ".join(str(x) for x in k) + "}") if k else "∅") + "</b></p>"
    if t == "props":
        held = [PROPN[p] for p in ("reflexive", "symmetric", "antisymmetric", "transitive") if k[p]]
        return "<p><b>" + E(", ".join(held) if held else "бірде-бір қасиет жоқ") + "</b></p>"
    if t == "func":
        return f"<p><b>{E(FUNCN[k])}</b></p>"
    raise ValueError(f"мұғалім кілті: белгісіз түр {t!r}")


def types_of(exs):
    out = []
    for x in exs:
        if TYPE_KK[x["type"]] not in out:
            out.append(TYPE_KK[x["type"]])
    return ", ".join(out)


def weeks(lessons):
    """[(n, mid, атауы, [сабақтар])] - AO17 CS 1-бөлімінің 12 аптасы, курс ретімен."""
    by_mod = {}
    for L in lessons:
        by_mod.setdefault(L["moduleId"], []).append(L)
    titles = {m[0]: m[2] for m in C.MODULES}
    return [(n, mid, titles[mid], sorted(by_mod.get(mid, []), key=lambda x: x["slug"])) for n, (mid, _q, _labs) in enumerate(CRS.WEEKS, 1)]


def plans(lessons, key):
    """Әр сабақтың жоспары (дерек). key - academy_build.answer_key."""
    goals = {(mid, slug): goal for mid, _en, _kk, ls in C.MODULES for slug, _t, goal in ls}
    out, where = [], {}
    for n, mid, _title, ls in weeks(lessons):
        for k, L in enumerate(ls, 1):
            where[L["id"]] = (n, k, mid, L["slug"], L["title"])
    for n, mid, mtitle, ls in weeks(lessons):
        for k, L in enumerate(ls, 1):
            uid = L["id"]
            trap = CN.for_lesson(L)["trap"]
            defs = [t["title"] for t in L["theory"] if t["kind"] == "definition"]
            thms = [t["title"] for t in L["theory"] if t["kind"] == "theorem"]
            exit_ = [{"type": ex["type"], "ask": ask_html(ex, f"{uid}.a{i}"), "key": key_html(ex, key(ex), f"{uid}.a{i}"),
                      "answer": ex.get("answer")} for i, ex in enumerate(L["assessment"])]
            out.append({
                "id": uid, "n": n, "k": k, "mid": mid, "slug": L["slug"], "mtitle": mtitle, "title": L["title"],
                "goal": goals[(mid, L["slug"])], "minutes": int(L["minutes"]), "level": DIFF[L["difficulty"]],
                "objectives": L["objectives"], "terms": defs or thms, "defs": defs, "thms": thms,
                "prereq": [where[p] for p in L["prerequisites"] if p in where],
                "hook": first_sentence(L["concept"]), "trap": trap, "examples": [x["title"] for x in L["examples"]],
                "experiment": L["experiment"]["task"], "class_ex": types_of(L["exercises"][:IN_CLASS]),
                "home_ex": types_of(L["exercises"][IN_CLASS:]), "n_ex": len(L["exercises"]),
                "mistakes": L["mistakes"], "exit": exit_, "reflection": L["reflection"],
                "honors": L["further"]["honors"], "research": L["further"]["research"],
            })
    return out


def validate(lessons, key):
    errs = []
    if sum(m for *_x, m in FLOW) != PERIOD:
        errs.append(f"мұғалім жоспары: сабақ барысының қосындысы {PERIOD} минут емес")
    lessons = [L for L in lessons if L["reviewStatus"] != "draft"]   # жоспар тек жарияланған сабаққа жасалады
    ws = weeks(lessons)
    if len(ws) != 12 or any(not ls for *_x, ls in ws):
        errs.append("мұғалім жоспары: курстың 12 аптасының әрқайсысында кемінде бір жарияланған сабақ болуы керек")
    try:
        ps = plans(lessons, key)
    except Exception as e:   # жауап кілті есептелмесе - build тоқтайды
        return errs + [f"мұғалім жоспары: {type(e).__name__}: {e}"]
    for p in ps:
        w = f"мұғалім жоспары {p['id']}"
        if len(p["objectives"]) < 2:
            errs.append(f"{w}: кемінде екі оқу мақсаты керек (саралау: барлығы / көпшілігі)")
        if len(p["exit"]) != 2:
            errs.append(f"{w}: шығу билетінде екі сұрақ болуы керек")
        if p["n_ex"] <= IN_CLASS:
            errs.append(f"{w}: үй тапсырмасына жаттығу қалмайды")
        if not (p["trap"].get("wrong") and p["trap"].get("right")):
            errs.append(f"{w}: тұзақ (жиі қате және дұрысы) жоқ")
        if not (p["reflection"] and p["honors"] and p["research"] and len(p["mistakes"]) >= 2 and p["terms"]):
            errs.append(f"{w}: рефлексия, тереңдету, зерттеу, жиі қате не термин жетпейді")
    return errs


# ------------------------------------------------------------------ HTML
def ribbon(big=False):
    bar = "".join(f'<i class="st-{k}"></i>' for k, *_x in FLOW)
    chips = "".join(f'<li class="st-{k}"><span>{E(part)}</span> <b>{m} мин</b></li>' for k, _stage, part, m in FLOW)
    label = "45 минут: " + ", ".join(f"{part.lower()} {m}" for _k, _s, part, m in FLOW)
    return (f'<div class="tp-ribbon{" is-big" if big else ""}"><div class="tp-bar" role="img" aria-label="{E(label)} минут">{bar}</div>'
            f'<ul class="tp-stages">{chips}</ul></div>')


def flow_rows(p):
    lp = f"../{p['mid']}/{p['slug']}.html"
    res = lambda *ks: "<br>".join(f'<a href="{lp}#{SEC[k][0]}">{SEC[k][1]}</a>' for k in ks)  # noqa: E731
    learn = f"Ұғымға кіріспеден бастайды: «{E(p['hook'])}»"
    if p["defs"]:
        learn += f" Тақтаға анықтамаларды жазады: {E(', '.join(p['defs']))}."
    if p["thms"]:
        learn += f" Теорема: {E(', '.join(p['thms']))}."
    if p["examples"]:
        learn += f" Бірге талдайды: «{E(p['examples'][0])}»."
    rows = {
        "open": (f"Кино-түсіндіруді көрсетеді (2-3 минут). Тақтаға жиі кездесетін қатені жазады: «{E(p['trap']['wrong'])}» "
                 "Сұрайды: мұнда не дұрыс емес?",
                 "Жұпта бір минут ойланып, болжамын айтады.", "Бастапқы түсінік: болжамдарды тақтаның шетіне жазып қояды.", res("film")),
        "learn": (learn, "Анықтамаларды дәптерге жазып, мысалды қадаммен қайталайды.",
                  "Ауызша тексеру: екі-үш оқушы анықтаманы өз сөзімен айтады.", res("theory", "examples")),
        "lab": (f"Тапсырма береді: {E(p['experiment'])}", "Зертханада параметрді өзгертіп, байқағанын бір сөйлеммен жазады.",
                "Екі-үш жұптың қорытындысын тыңдайды.", res("lab")),
        "practice": (f"1-{IN_CLASS} жаттығуды береді ({E(p['class_ex'])}). Жұптарды аралап, төмендегі жиі қателерді бақылайды.",
                     "Жұпта орындайды. Сайт әр жауапты бірден тексеріп, түсіндірме береді.", "Өзін-өзі тексеру: сайттың автотексеруі.", res("practice")),
        "exit": (f"Екі сұрақ береді (жауап кілті төменде). Басындағы қатеге қайтады. Дұрысы: «{E(p['trap']['right'])}»",
                 "Екі сұраққа жеке жауап береді: сайтта не қағазда.",
                 "2 дұрыс - меңгерді; 1 - келесі сабақтың басында қайталайды; 0 - жеке қолдау керек.", res("exit")),
        "reflect": (f"Сұрайды: «{E(p['reflection'][0])}»", "Бір-екі сөйлеммен жазбаша жауап береді.",
                    "Жауаптар келесі сабақтың басын жоспарлауға көмектеседі.", res("reflect")),
    }
    out = []
    for k, stage, part, m in FLOW:
        t, s, a, r = rows[k]
        out.append(f'<tr class="st-{k}" data-min="{m}"><th scope="row"><span>{stage}</span> {part}<b>{m} мин</b></th>'
                   f'<td data-th="Педагог">{t}</td><td data-th="Оқушы">{s}</td><td data-th="Бағалау">{a}</td><td data-th="Ресурс">{r}</td></tr>')
    return "".join(out)


def plan_html(p):
    sid = p["slug"]
    li = lambda xs: "".join(f"<li>{E(x)}</li>" for x in xs)  # noqa: E731
    prereq = ", ".join(f'<a href="{mid}.html#{slug}">{n}.{k}. {E(title)}</a>' for n, k, mid, slug, title in p["prereq"]) \
        or "Курстың алғашқы сабағы: алдыңғы білім талап етілмейді."
    most = p["objectives"][1:]
    mistakes = "".join(f'<li><b>{E(m["mistake"])}</b> {E(m["why"])} <span>Түзету: {E(m["fix"])}</span></li>' for m in p["mistakes"])
    exit_ = "".join(f'<li data-type="{x["type"]}">{x["ask"]}<div class="tp-key"><p class="tp-key-h">Жауап кілті</p>{x["key"]}</div></li>' for x in p["exit"])
    home = f'Сабақ бетіндегі {IN_CLASS + 1}-{p["n_ex"]} жаттығу ({E(p["home_ex"])}).' if p["n_ex"] > IN_CLASS + 1 \
        else f'Сабақ бетіндегі {p["n_ex"]}-жаттығу ({E(p["home_ex"])}).'
    return f"""      <section class="tp-plan" id="{sid}" aria-labelledby="{sid}-h" data-tp-plan>
        <header class="tp-plan-head">
          <p class="tp-no">{p['n']}.{p['k']}-сабақ</p>
          <h2 id="{sid}-h">{E(p['title'])}</h2>
          <p class="tp-meta">45 минут · сайттағы өзіндік оқу ≈ {p['minutes']} мин · деңгейі: {p['level']}</p>
          <p class="tp-plan-acts"><a href="../{p['mid']}/{sid}.html">Сабақты ашу</a> <button type="button" class="tp-print" data-tp-print="{sid}">Осы жоспарды басып шығару</button></p>
        </header>
        <table class="tp-fill"><tbody><tr><th scope="row">Педагог</th><td></td><th scope="row">Күні</th><td></td></tr>
          <tr><th scope="row">Сынып</th><td></td><th scope="row">Қатысқандар / қатыспағандар</th><td></td></tr></tbody></table>
        {ribbon()}
        <div class="tp-two">
          <section><h3>Оқу мақсаттары</h3><ol class="tp-obj">{li(p['objectives'])}</ol></section>
          <section><h3>Бағалау критерийі</h3><p>{E(p['goal'])}</p><h3>Негізгі терминдер</h3><p>{E(', '.join(p['terms']))}</p>
            <h3>Алдыңғы білім</h3><p>{prereq}</p></section>
        </div>
        <h3>Сабақтың мақсаты</h3>
        <dl class="tp-goals"><dt>Барлық оқушылар</dt><dd>{E(p['objectives'][0])}</dd>
          <dt>Көпшілігі</dt><dd>{'<br>'.join(E(x) for x in most)}</dd>
          <dt>Кейбірі (тереңдету)</dt><dd>{E(p['honors'][0])}</dd></dl>
        <h3>Сабақ барысы</h3>
        <div class="tp-flow-wrap"><table class="tp-flow">
          <thead><tr><th scope="col">Кезең</th><th scope="col">Педагогтің әрекеті</th><th scope="col">Оқушының әрекеті</th><th scope="col">Бағалау</th><th scope="col">Ресурс</th></tr></thead>
          <tbody>{flow_rows(p)}</tbody>
        </table></div>
        <h3>Жиі қателер және қолдау</h3>
        <ul class="tp-mist">{mistakes}</ul>
        <h3>Шығу билеті және жауап кілті</h3>
        <ol class="tp-exit">{exit_}</ol>
        <h3>Үй тапсырмасы</h3>
        <p>{home} Қалауынша зерттеу: {E(p['research'][0])}</p>
      </section>"""


def week_resources(n, mid, ls):
    labs = dict((w[0], w[2]) for w in CRS.WEEKS)[mid]
    ep = next((e for e in CXE.EPISODES if e["lesson"].split(".")[1] == mid), None)
    pj = next((x for x in ls if x.get("project")), None)
    items = []
    if ep:
        items.append(f'<li><span>Комикс</span><a href="../{mid}/l01.html#s-comic">{E(ep["title"])}</a></li>')
    items.append("<li><span>3D зертхана</span><p>" + ", ".join(f'<a href="{L3.href(h, "../")}">{E(t)}</a>' for h, t in labs) + "</p></li>")
    if pj:
        items.append(f'<li><span>Модуль жобасы</span><a href="../{mid}/{pj["slug"]}.html#project">'
                     f'{E(CRS.PROJECT_KK.get(pj["project"]["id"], pj["project"]["title"]))}</a></li>')
    items.append(f'<li><span>Апта сынағы</span><a href="../exam.html?w={n}">{n}-апта сынағы: 8 сұрақ, сайт өзі бағалайды</a></li>')
    return "".join(items)


def module_html(n, mid, mtitle, ls, ps, page, total):
    rel = f"academy/teach/{mid}.html"
    toc = "".join(f'<li><a href="#{p["slug"]}"><b>{p["n"]}.{p["k"]}</b> {E(p["title"])}</a></li>' for p in ps)
    prev_ = f'<a href="m{n - 1:02d}.html">Алдыңғы апта: {n - 1}-апта</a>' if n > 1 else '<a href="index.html">Барлық апталар</a>'
    next_ = f'<a href="m{n + 1:02d}.html">Келесі апта: {n + 1}-апта</a>' if n < total else '<a href="index.html">Барлық апталар</a>'
    body = f"""  <div class="layout single">
    <article class="content tp" id="main" data-teach>
      <p class="ac-crumb"><a href="../course.html">AO17 CS курсы</a> / <a href="index.html">Мұғалімге</a> / {n}-апта</p>
      <header class="tp-head">
        <p class="tp-kicker">Мұғалімге · {n}-апта · {len(ps)} сабақ жоспары</p>
        <h1>{E(mtitle)}</h1>
        <p class="tp-lede">Аптаның әр сабағына 45 минуттық жоспар. Әр жоспарды бөлек басып шығаруға болады: парақтың басында педагог, күн және сынып жолдары бар.</p>
        <p class="tp-acts"><button type="button" class="btn gold" data-tp-print="all">Барлық {len(ps)} жоспарды басып шығару</button> <a class="btn secondary" href="../{mid}/l01.html">Сабақтарды ашу</a> <a class="btn secondary" href="../exam.html?w={n}">{n}-апта сынағы</a></p>
      </header>
      <section class="tp-week" aria-labelledby="tp-week-h">
        <h2 id="tp-week-h">Аптаның ресурстары</h2>
        <ul class="tp-res">{week_resources(n, mid, ls)}</ul>
      </section>
      <nav class="tp-toc" aria-label="Аптаның сабақтары"><ol>{toc}</ol></nav>
{chr(10).join(plan_html(p) for p in ps)}
      <nav class="tp-pager" aria-label="Апталар">{prev_}{next_}</nav>
    </article>
  </div>"""
    return rel, page(rel, f"Мұғалімге: {n}-апта, {mtitle}", f"AO17 CS, {n}-апта «{mtitle}»: 10 сабақтың 45 минуттық жоспары, шығу билеті және жауап кілті.",
                     body, scripts=("assets/js/ao17-teach.js",), styles=("assets/css/ao17-teach.css",))


def index_html(ws, ps, page):
    rel = "academy/teach/index.html"
    n_exit = sum(len(p["exit"]) for p in ps)
    n_mist = sum(len(p["mistakes"]) for p in ps)
    cards = "".join(f'<li><a href="{mid}.html"><span>{n}-апта</span><b>{E(t)}</b><small>{len(ls)} сабақ · өзіндік оқу ≈ {sum(x["minutes"] for x in ls)} мин</small></a></li>'
                    for n, mid, t, ls in ws)
    rows, cur = [], None
    for i, p in enumerate(ps, 1):
        if p["mid"] != cur:
            cur = p["mid"]
            rows.append(f'<tr class="tp-ktp-mod"><th colspan="6" scope="colgroup">{p["n"]}-апта · {E(p["mtitle"])}</th></tr>')
        rows.append(f'<tr data-i="{i}" data-mod="{p["n"]}-апта. {E(p["mtitle"])}" data-title="{E(p["title"])}" data-goal="{E(p["goal"])}" data-href="{p["mid"]}.html#{p["slug"]}">'
                    f'<td>{i}</td><td data-week>{(i + 1) // 2}</td><td>{E(p["title"])}</td><td>{E(p["goal"])}</td><td>1</td>'
                    f'<td><a href="{p["mid"]}.html#{p["slug"]}" aria-label="ҚМЖ: {i}-сабақтың жоспары">ҚМЖ</a></td></tr>')
    stages = "".join(f'<li class="st-{k}"><b>{E(part)} · {m} мин</b><span>{E(x)}</span></li>' for (k, _s, part, m), x in zip(FLOW, (
        "Кино-түсіндіру және жиі кездесетін қате: оқушылар оның неге қате екенін болжайды.",
        "Анықтамалар мен теоремалар тақтада, бір жұмыс мысалы бірге талданады.",
        "Интерактивті эксперимент: параметрді өзгертіп, нәтижені байқау.",
        f"{IN_CLASS} жаттығу жұпта; сайт әр жауапты бірден тексереді. Қалғаны үйге.",
        "Екі сұрақ, жауап кілті жоспарда. Басындағы қатеге қайту.",
        "Бір сұраққа жазбаша жауап.")))
    body = f"""  <div class="layout single">
    <article class="content tp tp-index" id="main" data-teach>
      <p class="ac-crumb"><a href="../course.html">AO17 CS курсы</a> / Мұғалімге</p>
      <header class="tp-head">
        <p class="tp-kicker">Мұғалімге</p>
        <h1>AO17 CS сабақ жоспарлары</h1>
        <p class="tp-lede">Курстың {len(ps)} сабағының әрқайсысына 45 минуттық дайын жоспар бар: мақсат, сабақ барысы, жиі қателер, шығу билеті және оның жауап кілті. Жоспар сабақтың өз деректерінен құрастырылады, сондықтан сыныпта ашатын сабақпен сөзбе-сөз сәйкес келеді.</p>
        <p class="tp-acts"><a class="btn gold" href="m01.html">1-аптаның жоспарлары</a> <a class="btn secondary" href="#ktp">Күнтізбелік-тақырыптық жоспар</a> <a class="btn secondary" href="../../teacher.html">Сынып прогресі</a></p>
      </header>
      <ul class="tp-stats">
        <li><b>{len(ws)}</b><span>апта</span></li>
        <li><b>{len(ps)}</b><span>сабақ жоспары</span></li>
        <li><b>{n_exit}</b><span>шығу билетінің сұрағы, жауап кілтімен</span></li>
        <li><b>{n_mist}</b><span>жиі қате және түзету жолы</span></li>
      </ul>
      <section class="tp-model" aria-labelledby="tp-model-h">
        <h2 id="tp-model-h">Бір сабақ: 45 минут</h2>
        <p>Әр жоспар бір үлгімен жүреді. Сабақтың басы, ортасы және соңы ҚМЖ үлгісіне сәйкес, ал әр кезеңнің мазмұны сол сабақтың өзінен алынады.</p>
        {ribbon(big=True)}
        <ol class="tp-model-list">{stages}</ol>
      </section>
      <section aria-labelledby="tp-weeks-h">
        <h2 id="tp-weeks-h">Апталар</h2>
        <p class="tp-note">Толық жоспар, шығу билеті мен жауап кілті сабақтардың өзі сияқты жабық платформада ашылады: мұғалім аккаунтымен <a href="../../login.html">кіріңіз</a>. Мектепке қосылу: <a href="../../schools.html#apply">пилотқа өтінім</a>.</p>
        <ul class="tp-cards">{cards}</ul>
      </section>
      <section class="tp-ktp" id="ktp" aria-labelledby="tp-ktp-h" data-ktp>
        <h2 id="tp-ktp-h">Күнтізбелік-тақырыптық жоспар (КТЖ)</h2>
        <p>Бір сабақ - бір академиялық сағат. Сайттағы өзіндік оқу 45 минуттан ұзақ болса, жоспар жаттығудың бір бөлігін үйге береді. Күндерін өз кестеңізге қарай толтырасыз: CSV файлында «Күні» бағаны бос.</p>
        <fieldset class="tp-pace"><legend>Аптасына неше сағат?</legend>
          <label><input type="radio" name="tp-pace" value="1"> 1 сағат</label>
          <label><input type="radio" name="tp-pace" value="2" checked> 2 сағат</label>
          <label><input type="radio" name="tp-pace" value="3"> 3 сағат</label>
        </fieldset>
        <p class="tp-ktp-sum" data-ktp-sum aria-live="polite">{len(ps)} сабақ, аптасына 2 сағат: {(len(ps) + 1) // 2} апта.</p>
        <p><button type="button" class="btn gold" data-ktp-csv>КТЖ-ны жүктеу (CSV, Excel)</button></p>
        <noscript><p class="tp-note">CSV жүктеу үшін JavaScript керек. Кестені осы беттен көшіріп алуға болады.</p></noscript>
        <div class="tp-ktp-wrap"><table class="tp-ktp-table">
          <thead><tr><th scope="col">№</th><th scope="col">Апта</th><th scope="col">Сабақтың тақырыбы</th><th scope="col">Оқу мақсаты</th><th scope="col">Сағат</th><th scope="col">Жоспар</th></tr></thead>
          <tbody>{"".join(rows)}</tbody>
        </table></div>
      </section>
      <section class="tp-how" aria-labelledby="tp-how-h">
        <h2 id="tp-how-h">Жиынтықпен қалай жұмыс істеу керек</h2>
        <ol>
          <li>Сынып ашыңыз: оқушылар сынып кодымен қосылады (<a href="../../teacher.html">мұғалім беті</a>).</li>
          <li>Аптаның жоспарларын басып шығарыңыз не экраннан ашыңыз. Әр жоспарды бөлек басуға болады.</li>
          <li>Апта соңында апта сынағын беріңіз: 8 сұрақ, сайт өзі бағалайды (<a href="../exam.html?w=1">1-апта сынағы</a>).</li>
          <li>Сынып прогресін мұғалім бетінен қараңыз: кім артта қалғаны бір кестеде көрінеді.</li>
        </ol>
        <p class="tp-note">Оқу мақсаттары AO17 CS бағдарламасынан алынған. Мемлекеттік стандарттың (МЖМБС) оқу мақсаттары кодтарымен сәйкестендіру кестесі әзірленуде. Мектепке ұсыныс пен пилот: <a href="../../schools.html">Мектептерге</a>.</p>
      </section>
    </article>
  </div>"""
    return rel, page(rel, "Мұғалімге: AO17 CS сабақ жоспарлары", f"AO17 CS курсының {len(ps)} сабағына 45 минуттық дайын жоспар (ҚМЖ), шығу билеті мен жауап кілті және күнтізбелік-тақырыптық жоспар (КТЖ).",
                     body, scripts=("assets/js/ao17-teach.js",), styles=("assets/css/ao17-teach.css",))


def pages(lessons, page, key):
    ws = weeks(lessons)
    ps = plans(lessons, key)
    out = [index_html(ws, ps, page)]
    for n, mid, mtitle, ls in ws:
        out.append(module_html(n, mid, mtitle, ls, [p for p in ps if p["mid"] == mid], page, len(ws)))
    return out
