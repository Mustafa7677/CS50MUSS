#!/usr/bin/env python3
# © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама (LICENSE-PROPRIETARY.md, COPYRIGHT.md).
# Harvard CS50 материалдары (олар осы файлда сақталмайды) CC BY-NC-SA 4.0 бойынша; үшінші тарап компоненттері өз лицензияларымен.
"""AO17 - сайтты құрастыру скрипті.

Іске қосу (репозиторийдің түбірінен):  python3 tools/build.py

Не істейді:
  1. Әр беттің <head> бөліміне favicon, PWA манифесі, Open Graph тегтерін қосады.
  2. Барлық беттегі навигацияны бірдей етеді.
  3. assets/data/lectures.js - лекциялар тізімі (прогресс панелі үшін).
  4. assets/data/search-index.js - бүкіл сайт бойынша іздеу индексі.
  5. glossary.html - лекциялардағы терминдерден қазақша–ағылшынша сөздік.
  6. Сандардың ЖАЛҒЫЗ дерекқөзі: site_stats (compute_stats). Беттерде <!--n:КІЛТ-->мән<!--/n--> белгілері, мета-сипаттамалар
     (DESC_TEMPLATES), README.md және курстар витринасы осыдан толтырылады.
Скрипт идемпотентті: қайта-қайта іске қоса беруге болады.

  python3 tools/build.py --stats   # site_stats-ты JSON ретінде басады (файл жазбайды; тесттер қолданады)
"""
import html
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
import math_plan  # noqa: E402  («Математика» курсының жалғыз жоспары: tools/math_plan.py)
import math_pedagogy  # noqa: E402  (математика: сабақ ұзақтығы, алғышарттар, оқу жолы, емтихан банкі)
SITE_URL = "https://mustafa7677.github.io/CS50MUSS/"
ORDER = [f"week-{i}" for i in range(8)] + ["ai"] + [f"week-{i}" for i in range(8, 11)]

# Қосымша курстар: әрқайсысы өз қалтасында (<код>/index.html, <код>/lectures/week-N.html, <код>/data/lectures.js)
COURSES = {
    "python": {"short": "CS50P", "color": "#3776ab", "order": [f"week-{i}" for i in range(10)]},
    "sql": {"short": "CS50 SQL", "color": "#7c3aed", "order": [f"week-{i}" for i in range(7)]},
    "ai": {"short": "CS50 AI", "color": "#c42a68", "order": [f"week-{i}" for i in range(7)]},
    "web": {"short": "CS50 Web", "color": "#d4580c", "order": [f"week-{i}" for i in range(9)]},
}
# Дербес авторлық курстар (Sagid Mustafa): Harvard аудармасы ЕМЕС, лицензиясы «B» (All Rights Reserved).
# COURSES тізімі (Harvard аудармалары) лицензия мен «45 лекция» сандары үшін өзгермейді; барлық цикл ALL_COURSES арқылы.
OWN_COURSES = {
    "cpp": {"short": "C++", "color": "#4f46e5", "order": [f"week-{i}" for i in range(8)]},
    "java": {"short": "Java", "color": "#d97706", "order": [f"week-{i}" for i in range(8)]},
    # Ағылшын тілі A0-C1: 6 деңгей x 4 сабақ = 24 бет (en/lectures/week-0..23.html). Әлі жазылмаған сабақ беттерінде SOON белгісі бар:
    # олар бет ретінде тұрады (бас, нав, footer, B лицензиясы), бірақ дайын лекция ретінде статистикаға, іздеуге, сайтмапқа кірмейді.
    "en": {"short": "English", "color": "#0f766e", "order": [f"week-{i}" for i in range(24)]},
    # Математика: 25 пән, жалпы math_plan.TOTAL сабақ (math/lectures/week-0..N.html, N - пәндер бойынша ГЛОБАЛДЫ нөмір). Тұғырлар (SOON) en курсындағыдай.
    "math": {"short": "Math", "color": "#15803d", "order": [f"week-{i}" for i in range(math_plan.TOTAL)]},
}
SOON = "<!-- soon -->"   # en/lectures/week-N.html ішіндегі «жақында» белгісі; мазмұн жазылғанда өшіріледі (docs/EN-COURSE-GUIDE.md)
EN_LEVELS = ["A0", "A1", "A2", "B1", "B2", "C1"]


def is_soon(text):
    return SOON in text


def unit_label(code, name):
    """Лекция белгісі: басқа курстарда «3-апта», ағылшын курсында «A1 · 2-сабақ»."""
    n = int(name.split("-")[1])
    if code == "en":
        return f"{EN_LEVELS[n // 4]} · {n % 4 + 1}-сабақ"
    if code == "math":
        return math_plan.unit_label(n)
    return f"{n}-апта"


def is_ready(code, name):
    p = ROOT / code / "lectures" / f"{name}.html"
    return p.exists() and not is_soon(p.read_text(encoding="utf-8"))
ALL_COURSES = {**COURSES, **OWN_COURSES}
# Үш дербес академия: бағдарламалау (жеті курс), ағылшын тілі, математика. Ағылшын мен математика бағдарламалаудың бөлімі емес.
ACADEMIES = {"code": ["x", "python", "sql", "ai", "web", "cpp", "java"], "en": ["en"], "math": ["math"]}
OWN_RE = "|".join(OWN_COURSES)

# Курстар витринасы (courses.html мен басты бетте): <!-- build:courses --> ... <!-- /build:courses -->
GLYPHS = {
    "x": '<path d="M14 18 6 32l8 14M50 18l8 14-8 14M38 12 26 52"/>',
    "python": '<path d="M32 8c-9 0-12 4-12 9v6h12v3H15c-5 0-9 4-9 10s4 11 9 11h5v-7c0-5 4-9 9-9h11c4 0 7-3 7-7V17c0-5-5-9-15-9z"/><path d="M32 56c9 0 12-4 12-9v-6H32v-3h17c5 0 9-4 9-10s-4-11-9-11h-5v7c0 5-4 9-9 9H24c-4 0-7 3-7 7v7c0 5 5 9 15 9z"/><circle cx="26" cy="15" r="1.6"/><circle cx="38" cy="49" r="1.6"/>',
    "sql": '<ellipse cx="32" cy="14" rx="20" ry="7"/><path d="M12 14v36c0 4 9 7 20 7s20-3 20-7V14M12 26c0 4 9 7 20 7s20-3 20-7M12 38c0 4 9 7 20 7s20-3 20-7"/>',
    "ai": '<circle cx="12" cy="20" r="4"/><circle cx="12" cy="44" r="4"/><circle cx="32" cy="12" r="4"/><circle cx="32" cy="32" r="4"/><circle cx="32" cy="52" r="4"/><circle cx="52" cy="32" r="4"/><path d="M16 20l12-8M16 20l12 12M16 20l12 32M16 44l12-32M16 44l12-12M16 44l12 8M36 12l12 20M36 32h12M36 52l12-20"/>',
    "cpp": '<path d="M32 5 56 18.500v27L32 59 8 45.500v-27z"/><path d="M27 25a8.500 8.500 0 1 0 0 14"/><path d="M33 32h8M37 28v8M45 32h8M49 28v8"/>',
    "java": '<path d="M13 30h30v12c0 8-6 14-15 14s-15-6-15-14z"/><path d="M43 33h4c5 0 7 3 7 6s-2 6-7 6h-5"/><path d="M22 6c-4 5 4 6 0 12M31 6c-4 5 4 6 0 12M40 8c-3 4 3 5 0 9"/><path d="M8 60h40"/>',
    "en": '<path d="M8 12h30a4 4 0 0 1 4 4v16a4 4 0 0 1-4 4H24l-8 7v-7h-8a4 4 0 0 1-4-4V16a4 4 0 0 1 4-4z"/><path d="M16 22h18M16 29h11"/><path d="M46 28h6a4 4 0 0 1 4 4v14a4 4 0 0 1-4 4h-3v6l-7-6H34a4 4 0 0 1-4-4v-2"/>',
    "web": '<circle cx="32" cy="32" r="24"/><path d="M8 32h48M32 8c-8 8-11 16-11 24s3 16 11 24M32 8c8 8 11 16 11 24s-3 16-11 24M12 20h40M12 44h40"/>',
    "math": '<path d="M48 10H18l16 22-16 22h30"/><path d="M40 22l8 8M48 22l-8 8" opacity=".55"/>',
}
CATALOG = [
    {"id": "x", "code": "CS50x", "href": "index.html", "c": "#087a96", "c2": "#0a4c7a", "title": "Информатикаға кіріспе",
     "desc": "Бағдарламалау әлеміне ең жақсы кіру есігі: алгоритмдерден веб пен жасанды интеллектке дейін.",
     "tags": ["Scratch", "C", "Python", "SQL", "HTML/CSS/JS", "Flask"], "state": "ready"},
    {"id": "python", "code": "CS50P", "href": "python/", "c": "#3776ab", "c2": "#1d3f66", "title": "Python бағдарламалау",
     "desc": "Python-ды нөлден тереңге: функциялар, ерекше жағдайлар, кітапханалар, тесттер, тұрақты өрнектер, ООП.",
     "tags": ["функциялар", "циклдер", "pytest", "regex", "ООП"], "state": "wip"},
    {"id": "sql", "code": "CS50 SQL", "href": "sql/", "c": "#7c3aed", "c2": "#3b1a78", "title": "Дерекқорлар",
     "desc": "Деректерді сұрау, кестелерді жобалау, индекстер мен масштабтау: SQLite-тан PostgreSQL-ге дейін.",
     "tags": ["SELECT", "JOIN", "жобалау", "индекстер"], "state": "wip"},
    {"id": "ai", "code": "CS50 AI", "href": "ai/", "c": "#d0306f", "c2": "#6e1640", "title": "Жасанды интеллект",
     "desc": "Іздеу, логика, ықтималдық, оңтайландыру, машиналық оқыту, нейрон желілер және тіл модельдері.",
     "tags": ["іздеу", "ықтималдық", "ML", "нейрон желі"], "state": "wip"},
    {"id": "web", "code": "CS50 Web", "href": "web/", "c": "#c2410c", "c2": "#7a2a06", "title": "Веб-бағдарламалау",
     "desc": "Толық веб-қосымшалар: HTML, CSS, Git, Django, SQL, JavaScript, React, тестілеу және қауіпсіздік.",
     "tags": ["Django", "JavaScript", "React", "Git"], "state": "wip"},
    {"id": "cpp", "code": "C++", "href": "cpp/", "c": "#4f46e5", "c2": "#2e2a8a", "title": "C++ бағдарламалау", "own": True,
     "desc": "C++ нөлден: жад пен көрсеткіштер, ООП, STL, шаблондар және өз жобаң.",
     "tags": ["көрсеткіштер", "ООП", "STL", "шаблондар"], "state": "wip"},
    {"id": "java", "code": "Java", "href": "java/", "c": "#d97706", "c2": "#8a4a04", "title": "Java бағдарламалау", "own": True,
     "desc": "Java нөлден: нысандар, интерфейстер, Collections, Stream API, көп ағын және өз жобаң.",
     "tags": ["ООП", "Collections", "Stream", "көп ағын"], "state": "wip"},
    {"id": "en", "code": "English", "href": "en/", "c": "#0f766e", "c2": "#134e4a", "title": "Ағылшын тілі A0-C1", "own": True,
     "desc": "Ағылшын тілін нөлден бастап: грамматика, сөздік, оқу, жазу, тыңдау мен айту. IT және бағдарламалау ағылшыншасына бағытталған.",
     "tags": ["грамматика", "сөздік", "IT-ағылшын", "A0-C1"], "state": "wip"},
    {"id": "math", "code": "Math", "href": "math/", "c": "#15803d", "c2": "#14532d", "title": "Математика", "own": True,
     "desc": "25 пән: алгебра мен анализден ықтималдыққа, дискретті математикаға, сандар теориясы мен топологияға дейін. Қорытып шығарулар, шешілген мысалдар, интерактивті есептер.",
     "tags": ["анализ", "сызықтық алгебра", "ықтималдық", "дәлелдеу"], "state": "wip"},
]


def sync_week_cards(path, ready, info=None):
    """Курс бетіндегі апта карточкалары: лекция файлы бар болса - сілтеме («Дайын ✓»), жоқ болса - «Жақында»."""
    s = path.read_text(encoding="utf-8")

    def card(m):
        attrs, wid, body = m.group(2), m.group(3), m.group(4).rstrip()
        attrs = re.sub(r'\s*href="[^"]*"', "", attrs).replace("week-card soon", "week-card")
        if info and wid in info:  # дербес курс: карточка атауы мен сипаттамасы лекцияның өзінен алынады
            t, d = info[wid]
            body = re.sub(r"<h3>.*?</h3>", lambda _: f"<h3>{html.escape(t, quote=False)}</h3>", body, count=1, flags=re.S)
            if d:
                body = re.sub(r"<p>.*?</p>", lambda _: f"<p>{html.escape(d, quote=False)}</p>", body, count=1, flags=re.S)
        if wid in ready:
            attrs = attrs.replace(f'data-id="{wid}"', f'data-id="{wid}" href="lectures/{wid}.html"')
            return f'<a{attrs}>{body}\n      <div class="status ready">Дайын ✓</div>\n    </a>'
        attrs = attrs.replace('class="week-card', 'class="week-card soon', 1)
        return f'<div{attrs}>{body}\n      <div class="status">Жақында</div>\n    </div>'
    s = re.sub(r'<(a|div)( class="week-card[^"]*" data-id="([\w-]+)"[^>]*)>(.*?)<div class="status[^"]*">[^<]*</div>\s*</\1>', card, s, flags=re.S)
    path.write_text(s, encoding="utf-8")


def sync_math_index(path):
    """math/index.html: әр пәннің «Дайын: N / жоспар: M» санағы (дайын = сілтеме болған карточкалар)."""
    s = path.read_text(encoding="utf-8")

    def subj(m):
        body = m.group(0)
        ready = len(re.findall(r'<a class="week-card[^"]*" data-id="week-\d+"', body))
        plan = len(re.findall(r'class="week-card[^"]*" data-id="week-\d+"', body))
        body = re.sub(r'(<b class="mx-sready">)\d+(</b>)', lambda k: f"{k.group(1)}{ready}{k.group(2)}", body, count=1)
        return re.sub(r'(<b class="mx-splan">)\d+(</b>)', lambda k: f"{k.group(1)}{plan}{k.group(2)}", body, count=1)
    s2 = re.sub(r'<section class="mx-subj".*?</section>', subj, s, flags=re.S)
    if s2 != s:
        path.write_text(s2, encoding="utf-8")


def tex_free_excerpt(text):
    """Мәтіннің $...$ формуласы жоқ сөйлемдері (бастан, ретімен); бәрінде формула болса - бірінші формулаға дейінгі бөлігі."""
    sents = re.split(r"(?<=[.!?])\s+(?=[A-ZА-ЯӘҒҚҢӨҰҮҺІЁ«])", text)
    lead = []
    for x in sents:
        if "$" in x:
            break
        lead.append(x)
    start = next((i for i, x in enumerate(sents) if x.startswith("Бұл сабақ") and "$" not in x), None)
    if len(" ".join(lead)) < 60:  # басы қысқа не формулалы: «Бұл сабақта ...» сөйлемінен, ол да жоқ болса - бос (жоспардағы сипаттама)
        lead = []
        for x in (sents[start:] if start is not None else []):
            if "$" in x:
                break
            lead.append(x)
    keep = lead
    out = ""
    for x in keep:
        if len(out) > 150:
            break
        out = (out + " " + x).strip()
    return out


def write_math_plan():
    """math/data/plan.js: браузер үшін жоспар (math-course.js: формулалар, сөздік, жаттықтырғыш, «қайдан бастау»)."""
    subs = []
    for i, sb in enumerate(math_plan.SUBJECTS):
        subs.append({"no": sb[0], "slug": sb[1], "kz": sb[2], "en": sb[3], "group": sb[4], "start": math_plan.STARTS[i], "count": len(sb[7]),
                     "color": math_plan.STYLE[sb[1]][0], "glyph": math_plan.STYLE[sb[1]][1], "lessons": [t for t, _ in sb[7]]})
    out = ("window.CS50KZ_MATH_PLAN = " + json.dumps({"total": math_plan.TOTAL, "subjects": subs}, ensure_ascii=False, separators=(",", ":")) + ";\n")
    (ROOT / "math" / "data").mkdir(parents=True, exist_ok=True)
    fp = ROOT / "math" / "data" / "plan.js"
    if not fp.exists() or fp.read_text(encoding="utf-8") != out:
        fp.write_text(out, encoding="utf-8")


# courses.html: курстар үш академия бойынша топталады (тақырып - академия беті)
ACAD_HEAD = {"x": ("Бағдарламалау академиясы", "programming.html", "жеті курс, әр тілдің өз маршруты"),
             "en": ("English Academy", "en/", "ағылшын тілі A0-C1, төрт дағды"),
             "math": ("Математика академиясы", "math/", "25 пән, арифметикадан топологияға")}


def courses_block(prefix, skip=()):
    STATE = {"ready": "Толық дайын", "wip": "Аударылуда", "soon": "Жоспарда"}
    OWN_STATE = {"ready": "Толық дайын", "wip": "Жазылуда", "soon": "Жоспарда"}
    out = []
    for c in CATALOG:
        if c["id"] in skip:
            continue
        tag = "a" if c["href"] else "div"
        href = f' href="{prefix}{c["href"]}"' if c["href"] else ""
        tags = "".join(f"<li>{t}</li>" for t in c["tags"])
        go = '<span class="cx-go">Бастау <span aria-hidden="true">→</span></span>' if c["href"] else '<span class="cx-go soon">Жақында</span>'
        state = c["state"]
        if c["id"] in ALL_COURSES and ALL_COURSES[c["id"]].get("ready") == len(ALL_COURSES[c["id"]]["order"]):
            state = "ready"
        n_lec = STATS["by_course"][c["id"]]["lect"]
        total = f' data-total="{n_lec}"' if n_lec else ""
        head = ACAD_HEAD.get(c["id"])
        if head:
            out.append(f'        <h3 class="cx-acad" id="acad-{c["id"]}"><a href="{prefix}{head[1]}">{head[0]}</a><span>{head[2]}</span></h3>')
        out.append(f"""        <{tag} class="cx-card {state}{" own" if c.get("own") else ""}"{href} data-course="{c["id"]}"{total} style="--c:{c["c"]};--c2:{c["c2"]}">
          <div class="cx-band">
            <span class="cx-code">{c["code"]}</span>
            <span class="cx-state">{(OWN_STATE if c.get("own") else STATE)[state]}</span>
            <svg class="cx-glyph" viewBox="0 0 64 64" aria-hidden="true">{GLYPHS[c["id"]]}</svg>
          </div>
          <div class="cx-body">
            <h3>{c["title"]}</h3>
            <p>{c["desc"]}</p>
            <ul class="cx-tags">{tags}</ul>
            <div class="cx-bar" hidden><i></i></div>
            <div class="cx-foot"><span>{n_lec} лекция · {course_tasks_label(c["id"])}</span>{go}</div>
          </div>
        </{tag}>""")
    return "<!-- build:courses -->\n" + "\n".join(out) + "\n        <!-- /build:courses -->"


# Басты бет: «Бір шаңырақ астында» - барлық курс бірден көрінеді. <!-- build:home-courses --> ... <!-- /build:home-courses -->
SHORT = {"x": "Алгоритмдерден веб пен жасанды интеллектке дейін: бағдарламалауға ең жақсы кіру есігі.",
         "python": "Python нөлден тереңге", "sql": "Деректер мен кестелер", "ai": "Іздеуден нейрон желіге дейін",
         "web": "Django, JavaScript, React", "cpp": "Жад, ООП, STL", "java": "Нысандар, Stream, көп ағын",
         "en": "A0-ден C1-ге дейін", "math": "Арифметикадан топологияға дейін"}


NAME = {"x": "Информатикаға кіріспе", "python": "Python", "sql": "Дерекқор", "ai": "Жасанды интеллект", "web": "Веб",
        "cpp": "C++", "java": "Java", "en": "Ағылшын тілі", "math": "Математика"}


def home_courses_block(prefix=""):
    """Басты беттегі «Бағдарламалау академиясы: тілдер» тақтайшалары (ағылшын мен математика - өз академиясының карточкасында)."""
    out = []
    for c in CATALOG:
        if c["id"] not in ACADEMIES["code"]:
            continue
        n_lec = STATS["by_course"][c["id"]]["lect"]
        unit = "сабақ" if c["id"] in ("math", "en") else "лекция"
        feat = " kh-feat" if c["id"] == "x" else ""
        href = "lectures/week-0.html" if c["id"] == "x" else c["href"]
        lead = ' <span class="kh-start">Бастау осыдан</span>' if c["id"] == "x" else ""
        out.append(f"""        <a class="kh-tile{feat}{" own" if c.get("own") else ""}" href="{prefix}{href}" data-course="{c["id"]}" data-total="{n_lec}" style="--c:{c["c"]};--c2:{c["c2"]}">
          <span class="kh-band" aria-hidden="true"></span>
          <svg class="kh-glyph" viewBox="0 0 64 64" aria-hidden="true">{GLYPHS[c["id"]]}</svg>
          <span class="kh-code">{"Авторлық курс" if c.get("own") else ("Гарвард " + c["code"] if c["id"] == "x" else "Гарвард CS50")}{lead}</span>
          <span class="kh-title">{NAME[c["id"]]}</span>
          <span class="kh-sub">{SHORT[c["id"]]}</span>
          <span class="kh-meta">{n_lec} {unit}</span>
        </a>""")
    return "<!-- build:home-courses -->\n" + "\n".join(out) + "\n        <!-- /build:home-courses -->"


COURSE_LISTS = {}  # main() толтырады: курс коды -> дайын лекциялар (id, title, url) - академия маршруттары үшін


def academy_code_block():
    """programming.html: Бағдарламалау академиясының жеті маршруты. Әр бекет - курстың дайын лекциясы, оқу ретімен.
    main.js initAcademyCode() оқылғандарын белгілейді (li[data-id] - прогресс кілті: CS50x-те week-0, басқаларында python:week-0)."""
    out = []
    for cid in ACADEMIES["code"]:
        c = next(x for x in CATALOG if x["id"] == cid)
        lst = COURSE_LISTS.get(cid, [])
        steps = []
        for m in lst:
            key = m["id"] if cid == "x" else f'{cid}:{m["id"]}'
            n = "AI" if m["id"] == "ai" else m["id"].split("-")[1]
            steps.append(f'<li data-id="{key}"><a href="{m["url"]}"><span class="pa-n">{n}</span><span class="pa-t">{html.escape(m["title"], quote=False)}</span></a></li>')
        first = lst[0]["url"] if lst else c["href"]
        home = "index.html#main" if cid == "x" else c["href"]
        kind = "авторлық курс" if c.get("own") else "Гарвард CS50"
        out.append(f"""        <section class="pa-track" id="t-{cid}" data-course="{cid}" style="--c:{c["c"]};--c2:{c["c2"]}" aria-labelledby="t-{cid}-h">
          <div class="pa-th">
            <svg class="pa-glyph" viewBox="0 0 64 64" aria-hidden="true">{GLYPHS[cid]}</svg>
            <div class="pa-tt"><h3 id="t-{cid}-h">{html.escape(c["title"], quote=False)}</h3><p>{c["code"]}, {kind}, {len(lst)} лекция</p></div>
            <a class="pa-home" href="{home}">Курс беті</a>
          </div>
          <p class="pa-desc">{html.escape(c["desc"], quote=False)}</p>
          <ol class="pa-line">{"".join(steps)}</ol>
          <div class="pa-foot"><span class="pa-bar" aria-hidden="true"><i></i></span><span class="pa-stat">{len(lst)} лекция</span><a class="btn gold pa-next" href="{first}">Бастау</a></div>
        </section>""")
    return "<!-- build:academy-code -->\n" + "\n".join(out) + "\n        <!-- /build:academy-code -->"


# «Бір негізгі маршрут»: CS50x → 0-лекция → бірінші тапсырма → нәтиже → келесі лекция. Статикалық нұсқа (JS-сыз да жұмыс істейді);
# main.js initBeginnerPath() оны оқушының прогресіне қарай жаңартады (data-route, data-step, aria-current="step").
def route_block(prefix, code, local=False):
    folder = "lectures/" if code == "x" else f"{code}/lectures/"
    order = ORDER if code == "x" else ALL_COURSES[code]["order"]
    names = [n for n in order if (ROOT / folder / f"{n}.html").exists() and (code == "x" or is_ready(code, n))]
    if not names:
        return ""
    first, second = names[0], (names[1] if len(names) > 1 else None)
    ids = re.findall(r'<h2 id="([^"]+)"', (ROOT / folder / f"{first}.html").read_text(encoding="utf-8"))
    task_id = next((i for i in ("practice", "exercises", "problem-set") if i in ids), None)
    quiz_id = "quiz" if "quiz" in ids else None
    short = "CS50x" if code == "x" else ALL_COURSES[code]["short"]
    base = "lectures/" if local else prefix + folder  # курс бетінің ішінде қысқа сілтеме
    lec = lambda n: f"{base}{n}.html"
    num = lambda n: unit_label(code, n) if code != "x" else n.replace("week-", "") + "-апта"
    course_href = "#weeks" if local else (f"{prefix}index.html#main" if code == "x" else f"{prefix}{code}/index.html#weeks")
    steps = [
        (course_href, short, "Курсты таңда"),
        (lec(first), f"{num(first)} " + ("сабағы" if code in ("en", "math") else "лекциясы"), ("Оқы, " + (lambda m: f"≈ {math_pedagogy.fmt_min(m)}" if m else "45-75 минут")(math_pedagogy.week0_minutes()) if code == "math" else "Оқы, 15-20 минут")),
        (lec(first) + (f"#{task_id}" if task_id else ""), "Бірінші тапсырма", "Өзің орында"),
        (lec(first) + (f"#{quiz_id}" if quiz_id else ""), "Нәтиже", "Тест және тексеру"),
        (lec(second) if second else lec(first), "Келесі сабақ" if code in ("en", "math") else "Келесі лекция", num(second) if second else "Жалғастыр"),
    ]
    items = "\n".join(
        f'      <li class="route-step" data-step="{i}"><a href="{h}"><span class="route-dot" aria-hidden="true">{i}</span>'
        f'<span class="route-txt"><b>{t}</b><small>{d}</small></span></a></li>'
        for i, (h, t, d) in enumerate(steps, 1))
    return f"""<!-- build:route -->
    <section class="route" data-route="{code}" aria-labelledby="route-title-{code}">
      <div class="route-head"><h2 id="route-title-{code}">Бір негізгі маршрут</h2><p>{short}: бес қадам, артық ештеңе жоқ. Қалғанын кейін қарайсың.</p></div>
      <ol class="route-line">
{items}
      </ol>
      <div class="route-cta"><a class="btn gold route-go" href="{lec(first)}">Бастау: {num(first)} <span aria-hidden="true">→</span></a><p class="route-note" aria-live="polite">Жаңа келдіңіз бе? {num(first)}{"" if code in ("en", "math") else "дан"} бастаңыз: ол ең қысқа жол.</p></div>
    </section>
    <!-- /build:route -->"""


def strip_tags(s):
    s = re.sub(r"<(script|style)\b.*?</\1>", " ", s, flags=re.S)
    s = re.sub(r"<[^>]+>", " ", s)
    return re.sub(r"\s+", " ", html.unescape(s)).strip()


CC_URL = "https://creativecommons.org/licenses/by-nc-sa/4.0/"
HARVARD_URL = "https://cs50.harvard.edu/"

# Беттің лицензиялық түрі (licensing/components.json және copyright.html-мен келісілген):
#   A - Harvard CS50 материалының аудармасы/бейімдеуі (мәтін: CC BY-NC-SA 4.0; бағдарлама коды мен дизайн: All Rights Reserved)
#   B - Sagid Mustafa-ның дербес әзірлемесі (All Rights Reserved)
#   M - аралас бет (интерфейс - B, Harvard бейімдеулері мен тексерілетін материал - A/R)
B_PAGES = {"detective.html", "projects.html", "flask.html", "alash.html", "viz.html", "playground.html", "games.html", "profile.html",
           "teacher.html", "certificate.html", "404.html", "copyright.html", "partners.html", "metrics.html"}


def license_kind(rel):
    if re.match(rf"({OWN_RE})/", rel):
        return "B"
    if rel.startswith("lectures/") or re.match(r"(python|sql|ai|web)/lectures/", rel) or rel == "cheatsheet.html":
        return "A"
    return "B" if rel in B_PAGES else "M"


def license_meta(kind, prefix):
    if kind == "A":
        copy = ("Harvard CS50 материалының қазақша аудармасы/бейімдеуі: CC BY-NC-SA 4.0 (түпнұсқа: Harvard CS50, cs50.harvard.edu; аудармашы: Sagid Mustafa). "
                "Бағдарламалық компоненттер мен дизайн: © 2026 Sagid Mustafa, All Rights Reserved.")
        lic = CC_URL
    elif kind == "B":
        copy, lic = "© 2026 Sagid Mustafa. All Rights Reserved.", f"{prefix}copyright.html"
    else:
        copy = ("© 2026 Sagid Mustafa (бағдарлама, дизайн, авторлық материалдар): All Rights Reserved. "
                "Harvard CS50 материалдарының қазақша бейімдеулері: CC BY-NC-SA 4.0. Қараңыз: Авторлық құқық және лицензиялар.")
        lic = f"{prefix}copyright.html"
    return copy, lic


def license_ld(kind, title, url):
    base = {"@context": "https://schema.org", "@type": "LearningResource", "name": title, "url": url, "inLanguage": "kk",
            "author": {"@type": "Person", "name": "Sagid Mustafa"}, "isAccessibleForFree": True}
    if kind == "A":
        base.update({"license": CC_URL, "isBasedOn": HARVARD_URL, "translator": {"@type": "Person", "name": "Sagid Mustafa"},
                     "copyrightNotice": "Түпнұсқа: Harvard CS50 (David J. Malan және CS50 командасы), CC BY-NC-SA 4.0. Қазақша аударма: Sagid Mustafa. "
                                        "Бағдарламалық компоненттер мен дизайн: © 2026 Sagid Mustafa, All Rights Reserved."})
    elif kind == "B":
        base.update({"license": SITE_URL + "copyright.html", "copyrightHolder": {"@type": "Person", "name": "Sagid Mustafa"}, "copyrightYear": 2026,
                     "copyrightNotice": "© 2026 Sagid Mustafa. All Rights Reserved."})
    else:
        base.update({"license": SITE_URL + "copyright.html", "isBasedOn": HARVARD_URL, "copyrightHolder": {"@type": "Person", "name": "Sagid Mustafa"},
                     "copyrightYear": 2026, "copyrightNotice": "© 2026 Sagid Mustafa (бағдарлама, дизайн, авторлық материалдар). Harvard CS50 бейімдеулері: CC BY-NC-SA 4.0."})
    return json.dumps(base, ensure_ascii=False, separators=(",", ":"))


ORG_LD = {"@type": "Organization", "name": "AO17", "url": SITE_URL, "logo": SITE_URL + "assets/img/icon-192.png",
          "founder": {"@type": "Person", "name": "Sagid Mustafa"}, "sameAs": ["https://github.com/Mustafa7677/CS50MUSS"]}


def extra_ld(rel, title, desc, url):
    """Іздеу жүйелеріне арналған қосымша schema.org: басты бетте WebSite + Organization, курс беттерінде Course."""
    if rel == "index.html":
        site = {"@context": "https://schema.org", "@type": "WebSite", "name": "AO17", "alternateName": "AO17", "url": SITE_URL,
                "inLanguage": "kk", "publisher": ORG_LD}
        return json.dumps(site, ensure_ascii=False, separators=(",", ":"))
    m = re.match(rf"({'|'.join(ALL_COURSES)})/index\.html$", rel)
    if not m:
        return ""
    course = {"@context": "https://schema.org", "@type": "Course", "name": re.sub(r" - AO17$", "", title), "description": desc, "url": url,
              "inLanguage": "kk", "isAccessibleForFree": True, "provider": ORG_LD,
              "offers": {"@type": "Offer", "price": 0, "priceCurrency": "KZT", "category": "Free"},
              "hasCourseInstance": {"@type": "CourseInstance", "courseMode": "online", "inLanguage": "kk"}}
    if m.group(1) in COURSES:
        course["isBasedOn"] = HARVARD_URL
    return json.dumps(course, ensure_ascii=False, separators=(",", ":"))


def head_block(prefix, title, desc, url, image="assets/img/og.jpg", kind="M", extra=""):
    copy, lic = license_meta(kind, prefix)
    more = f'\n  <script type="application/ld+json">{extra}</script>' if extra else ""
    return f"""<!-- build:head -->
  <meta name="theme-color" content="#120d0a">
  <meta name="color-scheme" content="light dark only">
  <link rel="icon" href="{prefix}assets/img/icon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="{prefix}assets/img/icon-192.png">
  <link rel="manifest" href="{prefix}manifest.webmanifest">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="AO17">
  <meta property="og:title" content="{html.escape(title)}">
  <meta property="og:description" content="{html.escape(desc)}">
  <meta property="og:url" content="{url}">
  <meta property="og:image" content="{SITE_URL}{image}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="{SITE_URL}{image}">
  <link rel="canonical" href="{url}">
  <meta name="copyright" content="{html.escape(copy)}">
  <link rel="license" href="{lic}">
  <script type="application/ld+json">{license_ld(kind, title, url)}</script>{more}
  <!-- /build:head -->"""


def course_of(rel):
    """Бет қай курсқа тиесілі: 'x' (CS50x), курс коды, не None (жалпы бет)."""
    for code in ALL_COURSES:
        if rel.startswith(code + "/"):
            return code
    if rel == "index.html" or rel.startswith("lectures/"):
        return "x"
    return None


PILL = {"x": ("CS50x", "#087a96"), "python": ("CS50P", "#3776ab"), "sql": ("SQL", "#7c3aed"), "ai": ("AI", "#c42a68"), "web": ("Web", "#c2410c"),
        "cpp": ("C++", "#4f46e5"), "java": ("Java", "#d97706"), "en": ("English", "#0f766e"), "math": ("Математика", "#15803d")}


SWITCH = [("x", "CS50x", "index.html"), ("python", "CS50P", "python/"), ("sql", "SQL", "sql/"), ("ai", "AI", "ai/"), ("web", "Web", "web/"),
          ("cpp", "C++", "cpp/"), ("java", "Java", "java/"), ("en", "English", "en/"), ("math", "Математика", "math/")]


def switch_block(prefix, course):
    """Курстар ауыстырғышы (.cx-switch) - барлық беттерде бірдей тізім (Математика да)."""
    items = []
    for code, label, href in SWITCH:
        on = ' class="on" aria-current="page"' if code == course else ""
        k = ' data-k="math"' if code == "math" else ""
        items.append(f'<a{on}{k} href="{prefix}{href}">{label}</a>')
    return '<nav class="cx-switch" aria-label="Курсты таңдау">' + "".join(items) + "</nav>"


def nav_block(prefix, active, course=None):
    home = prefix + ("index.html#main" if course in (None, "x") else f"{course}/index.html")

    def item(href, label, key, extra=""):
        cls = ' class="active' + (" " + extra if extra else "") + '"' if key == active else (f' class="{extra}"' if extra else "")
        return f'<a href="{prefix}{href}"{cls}>{label}</a>'
    label, color = PILL.get(course, ("Курстар", "#087a96"))
    pill = (f'<button class="course-pill" type="button" aria-haspopup="true" aria-expanded="false" aria-label="Курсты таңдау" data-course="{course or ""}" style="--c:{color}">'
            f'<span class="cp-dot" aria-hidden="true"></span><span class="cp-label">{label}</span><span class="cp-chev" aria-hidden="true">▾</span></button>')
    return f"""<nav class="nav">
        {pill}
        <a href="{home}"{' class="active"' if active == "index" else ''}>Лекциялар</a>
        {item("practice.html", "Жаттығу", "practice")}
        {item("games.html", "Ойындар", "games")}
        {item("playground.html", "Сынақ алаңы", "playground", "hide-sm")}
        {item("glossary.html", "Сөздік", "glossary", "hide-sm")}
        <button class="search-open" type="button" aria-label="Іздеу"><span class="ico">⌕</span><span class="label">Іздеу</span><kbd>Ctrl K</kbd></button>
        <button class="prefs-open" type="button" aria-label="Аа - оқу баптаулары" title="Оқу баптаулары">Аа</button>
        <button class="theme-toggle" type="button" aria-label="Түсті ауыстыру">☾</button>
        <a class="profile-open{' active' if active == 'profile' else ''}" href="{prefix}profile.html" aria-label="Менің кабинетім" title="Менің кабинетім"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg></a>
      </nav>"""


def footer_block(p):
    def col(title, items):
        lis = "".join(f'<li><a href="{p}{h}">{t}</a></li>' for h, t in items)
        return f'<div class="ft-col"><h4>{title}</h4><ul>{lis}</ul></div>'
    return (
        '<footer class="footer">\n    <div class="footer-inner">\n'
        f'      <div class="ft-brand"><a class="ft-logo" href="{p}index.html"><img src="{p}assets/img/seal.svg" alt="" width="52" height="52">'
        '<span><b>AO</b>17</span></a>'
        '<p>Бағдарламалау, математика және ағылшын тілі бір қазақша платформада. Атауы: Алаш Орда, 1917 - ұлтты біліммен көтерген ағартушыларға құрмет. Тегін және офлайн.</p></div>\n'
        + "      " + col("Академиялар", [("programming.html", "Бағдарламалау"), ("en/", "English Academy"), ("en/skills.html", "Ағылшын: дағдылар"), ("math/", "Математика")])
        + col("Оқу", [("index.html#main", "Лекциялар"), ("courses.html", "Барлық курстар"), ("map.html", "Курс картасы"), ("cheatsheet.html", "Шпаргалка"), ("glossary.html", "Сөздік"), ("exam.html", "Қорытынды емтихан")])
        + col("Жаттығу", [("practice.html", "Жаттығулар"), ("playground.html", "Сынақ алаңы"), ("viz.html", "Визуализациялар"), ("flashcards.html", "Флэш-карточкалар"), ("games.html", "Ойындар"), ("debug.html", "Қатені тап"), ("detective.html", "SQL детектив"), ("flask.html", "Flask зертханасы"), ("projects.html", "Жобалар шеберханасы")])
        + col("Жоба", [("about.html", "Курс туралы"), ("alash.html", "Алаш тұлғалары"), ("certificate.html", "Сертификат"), ("teacher.html", "Мұғалім беті"), ("profile.html", "Менің кабинетім"), ("partners.html", "Серіктестерге"), ("metrics.html", "Ашық метрикалар")])
        + '\n      <div class="ft-legal">'
        '<p class="ft-copy"><strong>© 2026 Sagid Mustafa.</strong> Барлық құқықтар қорғалған.</p>'
        '<p>AO17 платформасының тәуелсіз бағдарламалық жасақтамасы, дизайны және авторлық оқу материалдары Sagid Mustafa-ға тиесілі.</p>'
        '<p>Harvard CS50 курстарының бастапқы материалдары мен олардың қазақша бейімдеулері тиісті Creative Commons лицензиясының талаптарына сәйкес таратылады. '
        'Қазақша аудармалардың авторы: Sagid Mustafa.</p>'
        '<p>AO17 — Harvard University-ден тәуелсіз жоба.</p>'
        '<p class="ft-src">Түпнұсқа (Harvard CS50): '
        '<a href="https://cs50.harvard.edu/x/" target="_blank" rel="noopener">CS50x</a> · '
        '<a href="https://cs50.harvard.edu/python/" target="_blank" rel="noopener">CS50P</a> · '
        '<a href="https://cs50.harvard.edu/sql/" target="_blank" rel="noopener">SQL</a> · '
        '<a href="https://cs50.harvard.edu/ai/" target="_blank" rel="noopener">AI</a> · '
        '<a href="https://cs50.harvard.edu/web/" target="_blank" rel="noopener">Web</a></p>'
        f'<p class="ft-own">Авторлық курстар (Sagid Mustafa): <a href="{p}cpp/">C++</a> · <a href="{p}java/">Java</a> · <a href="{p}en/">Ағылшын тілі</a> · <a href="{p}math/">Математика</a></p>'
        f'<p class="ft-links"><a href="{p}copyright.html">Авторлық құқық және лицензиялар</a> · '
        '<a href="https://github.com/Mustafa7677/CS50MUSS" target="_blank" rel="noopener">GitHub</a> · '
        '<a href="#" class="fb-open">💬 Пікір қалдыру</a></p></div>\n'
        '    </div>\n  </footer>')


# Әр беттің баннер түсі (басты беттегі карталармен бірдей) және лекция нөмірі
HEAD_STYLE = {
    "lectures/week-0.html": ("#f2b705", "0"), "lectures/week-1.html": ("#2b7bd6", "1"),
    "lectures/week-2.html": ("#2b7bd6", "2"), "lectures/week-3.html": ("#2b7bd6", "3"),
    "lectures/week-4.html": ("#2b7bd6", "4"), "lectures/week-5.html": ("#2b7bd6", "5"),
    "lectures/week-6.html": ("#2fa36b", "6"), "lectures/week-7.html": ("#8b5cf6", "7"),
    "lectures/ai.html": ("#e0457b", "AI"), "lectures/week-8.html": ("#f08a24", "8"),
    "lectures/week-9.html": ("#f08a24", "9"), "lectures/week-10.html": ("#c99500", "10"),
    "practice.html": ("#2fa36b", ""), "playground.html": ("#2b7bd6", ""), "flask.html": ("#8b5cf6", ""), "projects.html": ("#0e7490", ""),
    "exam.html": ("#c99500", ""), "detective.html": ("#b5651d", ""), "viz.html": ("#e0457b", ""),
    "flashcards.html": ("#f08a24", ""), "debug.html": ("#e04545", ""), "glossary.html": ("#2b7bd6", ""),
    "cheatsheet.html": ("#2fa36b", ""), "map.html": ("#8b5cf6", ""), "teacher.html": ("#f08a24", ""), "profile.html": ("#0f9fb5", ""), "games.html": ("#7c3aed", ""), "copyright.html": ("#475569", ""), "alash.html": ("#c99500", ""),
    "partners.html": ("#0a4c7a", ""), "metrics.html": ("#0086b3", ""),
}


def process_page(path, prefix, active):
    s = path.read_text(encoding="utf-8")
    title = re.search(r"<title>(.*?)</title>", s, re.S).group(1).strip()
    m = re.search(r'<meta name="description" content="([^"]*)">', s)
    rel = path.relative_to(ROOT).as_posix()
    own = re.match(rf"({OWN_RE})/", rel)
    desc = m.group(1) if m else (("Ағылшын тілі A0-C1: авторлық оқу курсы, жаттығулар мен сөздік." if own.group(1) == "en" else "Математика: авторлық оқу курсы, қорытып шығарулар, есептер мен формулалар." if own.group(1) == "math" else f"{OWN_COURSES[own.group(1)]['short']} бағдарламалау: авторлық оқу курсы, тесттер мен жаттығулар.") if own
                                 else "Гарвардтың CS50 курсы қазақ тілінде: лекциялар, тесттер, тапсырмалар.")
    url = SITE_URL + ("" if rel == "index.html" else rel)
    og = f"assets/img/og/{path.stem}.jpg" if rel.startswith("lectures/") else "assets/img/og.jpg"
    if rel in ("cpp/index.html", "java/index.html"):
        og = f"assets/img/og/{rel.split('/')[0]}.jpg"
    for code, c in ALL_COURSES.items():  # басқа курс лекцияларының баннер түсі мен нөмірі
        m = re.match(rf"{code}/lectures/week-(\d+)\.html$", rel)
        if m:
            if code == "math":  # математика: әр пәннің өз түсі мен белгісі (math_plan.STYLE)
                slug, col, glyph = math_plan.subject_style(int(m.group(1)))
                HEAD_STYLE.setdefault(rel, (col, m.group(1), f' data-msubj="{slug}" data-glyph="{html.escape(glyph)}"'))
            else:
                HEAD_STYLE.setdefault(rel, (c["color"], m.group(1)))
    kind = license_kind(rel)
    block = head_block(prefix, title, desc, url, og if (ROOT / og).exists() else "assets/img/og.jpg", kind, extra_ld(rel, title, desc, url))
    if "<!-- build:head -->" in s:
        s = re.sub(r"<!-- build:head -->.*?<!-- /build:head -->", block, s, flags=re.S)
    else:
        s = s.replace("</title>", "</title>\n  " + block, 1)
    if "<!-- build:home-courses" in s:
        s = re.sub(r"<!-- build:home-courses -->.*?<!-- /build:home-courses -->", lambda _: home_courses_block(prefix), s, flags=re.S)
    if "<!-- build:academy-code" in s:
        s = re.sub(r"<!-- build:academy-code -->.*?<!-- /build:academy-code -->", lambda _: academy_code_block(), s, flags=re.S)
    if "<!-- build:courses" in s:
        skip = ("x",) if rel == "index.html" else ()
        s = re.sub(r"<!-- build:courses -->.*?<!-- /build:courses -->", lambda _: courses_block(prefix, skip), s, flags=re.S)
    if "<!-- build:route -->" in s:
        rc = "x" if rel in ("index.html", "courses.html") else rel.split("/")[0]
        s = re.sub(r"<!-- build:route -->.*?<!-- /build:route -->", lambda _: route_block("" if rc != "x" else prefix, rc, rc != "x"), s, flags=re.S)
    s = re.sub(r'<nav class="nav">.*?</nav>', lambda _: nav_block(prefix, active, course_of(rel)), s, count=1, flags=re.S)
    s = re.sub(r'<nav class="cx-switch"[^>]*>.*?</nav>', lambda _: switch_block(prefix, course_of(rel)), s, count=1, flags=re.S)
    s = re.sub(r'<footer class="footer">.*?</footer>', lambda _: footer_block(prefix), s, count=1, flags=re.S)
    hs = HEAD_STYLE.get(rel)
    if hs:
        attrs = f' style="--lc:{hs[0]}"' + (f' data-n="{hs[1]}"' if hs[1] else "") + (hs[2] if len(hs) > 2 else "")
        s = re.sub(r'<div class="lecture-head"[^>]*>', f'<div class="lecture-head"{attrs}>', s, count=1)
    s = re.sub(r'<body(?: data-license="[A-Z]")?' if own else r'<body(?![^>]*data-license)', f'<body data-license="{kind}"', s, count=1)
    if 'class="skip-link"' not in s:
        s = s.replace("<body>", '<body>\n  <a class="skip-link" href="#main">Мазмұнға өту</a>', 1)
    if 'id="main"' not in s:
        s = re.sub(r'<(article class="content[^"]*"|main class="weeks")', lambda m: "<" + m.group(1) + ' id="main"', s, count=1)
    s = s.replace('<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>',
                  '<script defer src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>')
    path.write_text(s, encoding="utf-8")
    return s


def article_of(s):
    m = re.search(r'<article class="content[^"]*"[^>]*>', s)
    return s[m.start():s.index("</article>")]


def lecture_meta(name, s, url=None):
    num = strip_tags(re.search(r'<div class="lecture-head"[^>]*>\s*<div class="num">(.*?)</div>', s, re.S).group(1))
    title = strip_tags(re.search(r"<h1>(.*?)</h1>", s, re.S).group(1))
    article = article_of(s)
    words = len(strip_tags(article).split())
    skip = {"intro", "summary", "quiz", "practice", "problem-set"}
    topics = [{"t": strip_tags(t), "id": i} for i, t in re.findall(r'<h2 id="([^"]+)">(.*?)</h2>', article, re.S) if i not in skip]
    return {"id": name, "num": num, "title": title, "url": url or f"lectures/{name}.html", "topics": topics,
            "minutes": max(5, round(words / 160)),
            "quiz": article.count('class="question"'),
            "tasks": article.count('class="checklist"'),
            "task": next((i for i in ("practice", "exercises", "problem-set") if re.search(rf'<h2 id="{i}"', article)), "")}


def plain_tex(text):
    """Іздеу үзіндісінде $...$ формулаларын оқылатын мәтінге айналдыру: \\frac{a}{b} -> a b."""
    def f(m):
        t = re.sub(r"\\[A-Za-z]+", " ", m.group(1))
        return " " + re.sub(r"[{}^_\\]", " ", t) + " "
    return re.sub(r"\s+", " ", re.sub(r"\$\$?([^$]+)\$\$?", f, text)).strip()


def sections(name, s, meta):
    """Мақаланы h2/h3 бойынша бөліктерге бөлу (іздеу үшін)."""
    article = article_of(s)
    parts = re.split(r'(<h[23] id="[^"]+">.*?</h[23]>)', article, flags=re.S)
    out = []
    for i in range(1, len(parts) - 1, 2):
        hid = re.search(r'id="([^"]+)"', parts[i]).group(1)
        heading = strip_tags(parts[i])
        body = strip_tags(re.sub(r"<pre\b.*?</pre>", " ", parts[i + 1], flags=re.S))
        if "$" in body:
            body = plain_tex(body)
        out.append({"l": meta["num"] + ": " + meta["title"], "h": heading,
                    "u": f"{meta['url']}#{hid}", "t": body[:900]})
    return out


def glossary_terms(name, s, meta, course="x"):
    article = article_of(s)
    terms = []
    last_id = "intro" if re.search(r'\bid="intro"', article) else "main"  # бастапқы бөлімде id="intro" жоқ болса, мақаланың өзіне сілтейміз
    for m in re.finditer(r'<h[23] id="([^"]+)"|<strong>([^<]{2,60})</strong> \(<span class="term-en">([^<]{2,60})</span>\)', article):
        if m.group(1):
            last_id = m.group(1)
            continue
        kz, en = html.unescape(m.group(2)).strip(), html.unescape(m.group(3)).strip()
        terms.append({"kz": kz, "en": en, "url": f"{meta['url']}#{last_id}", "src": meta["num"], "c": course})
    return terms


def quiz_questions(name, s, meta):
    """Лекциядағы тест сұрақтары → күннің сұрағы мен аралас тест үшін."""
    out = []
    for m in re.finditer(r'<div class="question" data-answer="([a-d])">(.*?)</div>', s, re.S):
        block = m.group(2)
        q = re.search(r'<p class="q-text">(.*?)</p>', block, re.S)
        opts = re.findall(r'<label><input type="radio" value="([a-d])">(.*?)</label>', block, re.S)
        ex = re.search(r'<p class="explain">(.*?)</p>', block, re.S)
        if not q or len(opts) < 2:
            continue
        text = re.sub(r"^\s*\d+\.\s*", "", q.group(1).strip())
        out.append({"q": text, "o": [o[1].strip() for o in opts], "a": "abcd".index(m.group(1)),
                    "e": ex.group(1).strip() if ex else "", "l": meta["num"] + ": " + meta["title"],
                    "u": meta["url"] + "#quiz"})
    return out


def build_cheatsheet(entries):  # entries: (meta, ul, course)
    """Әр лекцияның «Қорытынды» бөлімінен бір беттік шпаргалка."""
    tpl = (ROOT / "about.html").read_text(encoding="utf-8")
    top = tpl[:tpl.index('<div class="layout')]
    top = re.sub(r"<!-- build:head -->.*?<!-- /build:head -->", "", top, flags=re.S)
    top = re.sub(r"<title>.*?</title>", "<title>Шпаргалка - AO17</title>", top)
    top = top.replace('<meta name="author"', '<meta name="description" content="AO17: ' + FLAT["courses_word"] + ' курстың қысқаша конспектісі бір бетте, басып шығаруға ыңғайлы.">\n  <meta name="author"', 1)
    foot = tpl[tpl.index("  <footer"):]
    cards = "\n".join(
        f'''      <section class="cs-card" id="{(c + "-" if c != "x" else "") + m["id"]}" data-c="{c}">
        <h2><span>{html.escape((ALL_COURSES[c]["short"] + " · " if c != "x" else "") + m["num"])}</span> {html.escape(m["title"])}</h2>
        {ul}
        <a class="cs-more" href="{m["url"]}">Толық лекция →</a>
      </section>''' for m, ul, c in entries)
    page = top + f"""<div class="layout single wide">
    <article class="content cheatsheet">
      <div class="lecture-head">
        <div class="num">Шпаргалка</div>
        <h1>Барлық курс бір бетте</h1>
        <p>{FLAT['Courses_word']} курстың әр лекциясының ең маңызды ұғымдары мен синтаксисі. Емтиханға не тапсырмаға дайындалғанда қолданыңыз. Курсты таңдап, тек сол курсты басып шығаруға болады.</p>
        <button type="button" class="btn gold cs-print" onclick="print()">🖨 Басып шығару / PDF</button>
      </div>
      <div class="seg cs-courses" role="group" aria-label="Курс"><button type="button" data-c="x" class="on">CS50x</button><button type="button" data-c="python">CS50P</button><button type="button" data-c="sql">SQL</button><button type="button" data-c="ai">AI</button><button type="button" data-c="web">Web</button><button type="button" data-c="cpp">C++</button><button type="button" data-c="java">Java</button><button type="button" data-c="en">English</button><button type="button" data-c="all">Барлығы</button></div>
      <div class="cs-grid">
{cards}
      </div>
    </article>
  </div>

""" + foot
    (ROOT / "cheatsheet.html").write_text(page, encoding="utf-8")


KZ_ALPHABET = "аәбвгғдеёжзийкқлмнңоөпрстуұүфхһцчшщъыіьэюя"


def kz_strip(word):
    return word.lstrip("«»\"'“”„(").strip()


def kz_key(word):
    """Қазақ әліпбиі бойынша сұрыптау: кириллица → латын → сандар."""
    w = kz_strip(word).lower()
    out = []
    for ch in w:
        if ch in KZ_ALPHABET:
            out.append((0, KZ_ALPHABET.index(ch)))
        elif "a" <= ch <= "z":
            out.append((1, ord(ch)))
        elif ch.isdigit():
            out.append((2, ord(ch)))
        else:
            out.append((3, ord(ch)))
    first = out[0][0] if out else 3
    return (first, out)


def kz_letter(word):
    ch = kz_strip(word)[:1].upper()
    return "#" if ch.isdigit() or not ch else ch


def build_glossary(terms):
    seen = {}
    for t in terms:
        key = t["en"].lower()
        if key not in seen:
            seen[key] = dict(t, cs=[t["c"]], more=[])
        else:  # бір термин бірнеше курста: бірінші жері негізгі, қалғандары - қосымша сілтеме
            e = seen[key]
            if t["c"] not in e["cs"]:
                e["cs"].append(t["c"])
                e["more"].append({"u": t["url"], "s": t["src"]})
    items = sorted(seen.values(), key=lambda t: kz_key(t["kz"]))
    out = [{k: v for k, v in t.items() if k not in ("c", "more") or (k == "more" and v)} for t in items]
    (ROOT / "assets/data/glossary.js").write_text(
        "window.CS50KZ_GLOSSARY = " + json.dumps(out, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    letters = []
    rows = []
    for t in items:
        letter = kz_letter(t["kz"])
        if letter not in letters:
            letters.append(letter)
            rows.append(f'      <h2 class="g-letter" id="l-{len(letters)}">{html.escape(letter)}</h2>')
        rows.append(
            f'      <div class="g-row" data-c="{" ".join(t["cs"])}" data-q="{html.escape((t["kz"] + " " + t["en"]).lower())}">'
            f'<span class="g-kz">{html.escape(t["kz"])}</span>'
            f'<span class="g-en">{html.escape(t["en"])}</span>'
            f'<a class="g-src" href="{t["url"]}">{html.escape(t["src"])} →</a>'
            + "".join(f'<a class="g-src g-more" href="{m["u"]}">{html.escape(m["s"])} →</a>' for m in t["more"][:3]) + '</div>')
    tpl = (ROOT / "about.html").read_text(encoding="utf-8")
    top = tpl[:tpl.index('<div class="layout')]
    top = re.sub(r"<title>.*?</title>", "<title>Терминдер сөздігі - AO17</title>", top)
    top = top.replace('<meta name="author"', '<meta name="description" content="Информатика терминдерінің қазақша–ағылшынша сөздігі: CS50 лекцияларынан жиналған.">\n  <meta name="author"', 1) if 'name="description"' not in top else top
    foot = tpl[tpl.index("  <footer"):]
    page = top + f"""<div class="layout single">
    <article class="content glossary">
      <div class="lecture-head">
        <div class="num">Сөздік</div>
        <h1>Терминдер сөздігі</h1>
        <p>{FLAT['Courses_word']} курстағы <!--n:terms-->{len(items)}<!--/n--> термин: қазақшасы, ағылшыншасы және алғаш түсіндірілген жері. Курс бойынша сүзуге болады.</p>
      </div>
      <div class="g-search"><input type="search" placeholder="Терминді іздеңіз: массив, pointer, хэш..." autocomplete="off" aria-label="Терминді іздеу"><span class="g-count"></span></div>
      <nav class="g-letters">{"".join(f'<a href="#l-{i + 1}">{html.escape(l)}</a>' for i, l in enumerate(letters))}</nav>
{chr(10).join(rows)}
    </article>
  </div>

""" + foot
    (ROOT / "glossary.html").write_text(page, encoding="utf-8")
    return len(items)


# ---------------------------------------------------------------------------------------------------------------------
# site_stats: сайттағы БАРЛЫҚ сандардың жалғыз дерекқөзі. Файлдарды тек оқиды (ештеңе жазбайды), сондықтан `--stats` қауіпсіз.
#   courses      - курс саны (CS50x + ALL_COURSES)
#   lect         - барлық лекция беті; lect_harvard (Harvard аудармасы, COURSES) және lect_own (авторлық, OWN_COURSES) бөлек
#   quiz, terms  - лекциялардағы тест сұрақтары / бірегей терминдер (сөздік дедупликациясымен бірдей)
#   tasks        - автотексерілетін тапсырма: autograder / js-grader / sql-grader / answer-check / en-ex / math-ex
#   ex           - сабақтағы барлық тапсырма (.task, en-ex, math-ex): курс карточкасындағы «N тапсырма»
#   games        - assets/js/games-*.js ішіндегі G.register(...) саны (games-core META-мен салыстырылады)
#   bugs         - assets/data/bugs.js «қатені тап» жаттығулары
#   exam_q/min   - exam.js (PER_LECTURE * CS50x лекция саны, MINUTES)
#   by_course    - әр курс бойынша lect/quiz/terms/tasks/projects
# Жетістік санын әдейі ЕСЕПТЕМЕЙМІЗ: ол main.js achievementList() ішінде өзгеріп тұрады, мәтінде «жетістіктер» деп жазылады.
# ---------------------------------------------------------------------------------------------------------------------
NUM_WORDS = {1: "бір", 2: "екі", 3: "үш", 4: "төрт", 5: "бес", 6: "алты", 7: "жеті", 8: "сегіз", 9: "тоғыз", 10: "он"}


def compute_stats():
    quiz, terms, by = [], [], {}
    sources = [("x", ROOT / "lectures", ORDER, None)] + [(code, ROOT / code / "lectures", c["order"], code) for code, c in ALL_COURSES.items()]
    for code, folder, order, prefix in sources:
        n_lect = n_tasks = n_ex = 0
        q_code, t_code = [], []
        for name in order:
            p = folder / f"{name}.html"
            if not p.exists():
                continue
            s = p.read_text(encoding="utf-8")
            if is_soon(s):  # жазылмаған сабақ-тұғыр: дайын лекцияға есептелмейді
                continue
            meta = lecture_meta(name, s, f"{prefix}/lectures/{name}.html" if prefix else None)
            n_lect += 1
            n_tasks += len(re.findall(r'class="(?:(?:autograder|js-grader|sql-grader|answer-check)\b|en-ex[ "]|math-ex[ "])', s))
            n_ex += len(re.findall(r'class="(?:task|en-ex|math-ex)[ "]', s))  # сабақтағы барлық тапсырма (автотексерілетіні де, өзі орындайтыны да)
            q_code += quiz_questions(name, s, meta)
            t_code += glossary_terms(name, s, dict(meta, num=meta["num"]), code)
        quiz += q_code
        terms += t_code
        proj = 0
        idx = ROOT / code / "index.html" if prefix else None
        if idx and idx.exists():
            proj = len(re.findall(r'\bid="project"', idx.read_text(encoding="utf-8")))
        by[code] = {"lect": n_lect, "plan": len(order), "quiz": len(q_code), "terms": len({t["en"].lower() for t in t_code}), "tasks": n_tasks, "ex": n_ex, "projects": proj}
    n_terms = len({t["en"].lower() for t in terms})  # build_glossary дедупликациясы: ағылшынша атау бойынша
    games = set()
    for f in sorted((ROOT / "assets/js").glob("games-*.js")):
        games |= set(re.findall(r'\bG\.register\(\{\s*id:\s*"(\w+)"', f.read_text(encoding="utf-8")))
    core = (ROOT / "assets/js/games-core.js").read_text(encoding="utf-8")
    meta_ids = set(re.findall(r"^\s{4}(\w+): \{ cats:", core, re.M))
    if meta_ids and meta_ids != games:
        print(f"ЕСКЕРТУ: ойындар тізімі мен games-core META сәйкес емес: {sorted(games ^ meta_ids)}", file=sys.stderr)
    bugs = len(re.findall(r"^\s*bug: \d+", (ROOT / "assets/data/bugs.js").read_text(encoding="utf-8"), re.M))
    ex = (ROOT / "assets/js/exam.js").read_text(encoding="utf-8")
    per = int(re.search(r"PER_LECTURE = (\d+)", ex).group(1))
    minutes = int(re.search(r"MINUTES = (\d+)", ex).group(1))
    n_harvard = sum(by[c]["lect"] for c in ["x", *COURSES])
    n_own = sum(by[c]["lect"] for c in OWN_COURSES)
    return {"courses": len(ALL_COURSES) + 1, "lect": n_harvard + n_own, "lect_harvard": n_harvard, "lect_own": n_own,
            "quiz": len(quiz), "terms": n_terms, "tasks": sum(v["tasks"] for v in by.values()), "games": len(games), "bugs": bugs,
            "exam_q": per * by["x"]["lect"], "exam_min": minutes, "by_course": by}


def flat_stats(st):
    """Белгілер (<!--n:КІЛТ-->) мен мета-үлгілер үшін жазық сөздік."""
    f = {k: str(v) for k, v in st.items() if k != "by_course"}
    for code, d in st["by_course"].items():
        for k, v in d.items():
            f[f"{k}_{code}"] = str(v)
    w = NUM_WORDS.get(st["courses"], str(st["courses"]))
    f["courses_word"], f["Courses_word"] = w, w[:1].upper() + w[1:]
    for a, ids in ACADEMIES.items():  # академия бойынша жиынтық: <!--n:lect_acode--> т.б.
        for k in ("lect", "quiz", "tasks"):
            f[f"{k}_a{a}"] = str(sum(st["by_course"][i][k] for i in ids))
    f["site"] = f'{st["courses"]} курс · {st["lect"]} лекция · {st["quiz"]} тест сұрағы · {st["terms"]} термин'
    return f


STATS = {}   # main() толтырады: compute_stats()
FLAT = {}


def fill_numbers(text):
    """<!--n:КІЛТ-->…<!--/n--> ішін және <b data-count="N"><!--n:КІЛТ--> атрибутын site_stats бойынша жаңарту."""
    def rep(m):
        if m.group(1) not in FLAT:
            raise SystemExit(f"Белгісіз сан белгісі: <!--n:{m.group(1)}-->")
        return f"<!--n:{m.group(1)}-->{FLAT[m.group(1)]}<!--/n-->"
    text = re.sub(r"<!--n:(\w+)-->.*?<!--/n-->", rep, text)
    return re.sub(r'(data-count=")\d+("[^>]*><!--n:(\w+)-->)', lambda m: m.group(1) + FLAT[m.group(3)] + m.group(2), text)


# Мета-сипаттамаларда HTML-түсініктеме жұмыс істемейді, сондықтан үлгі осында; {кілт} - flat_stats кілті.
SITE_DESC = ("{courses} курс, {lect} лекция, {quiz} тест сұрағы: Гарвардтың CS50 курстары қазақ тілінде (CS50x, Python, SQL, AI, Web) және авторлық C++, Java және ағылшын тілі курстары. "
             "Браузерде орындалатын тапсырмалар. Тегін. Harvard CS50 аудармалары (Sagid Mustafa) CC BY-NC-SA 4.0; дербес құралдар мен C++/Java/ағылшын тілі курстары авторлық құқықпен қорғалған.")
DESC_TEMPLATES = {
    "index.html": SITE_DESC,
    "exam.html": "AO17 курсының қорытынды емтиханы: {exam_q} сұрақ, {exam_min} минут, барлық {lect_x} лекция. Нәтиже апталар бойынша талданып, сертификатқа жазылады.",
    "map.html": "AO17 курсының картасы: {lect_x} лекция, тақырыптар және сіздің прогресіңіз.",
    "cpp/index.html": "C++ бағдарламалау: авторлық қазақша курс. Жад пен көрсеткіштер, ООП, STL, шаблондар және өз жобаң. {lect_cpp} лекция, тесттер, жаттығулар.",
    "java/index.html": "Java бағдарламалау: авторлық қазақша курс. Нысандар, интерфейстер, Collections, Stream API, көп ағын және өз жобаң. {lect_java} лекция, тесттер, жаттығулар.",
    "en/index.html": "Ағылшын тілі A0-C1: авторлық қазақша курс. Грамматика, сөздік, оқу, жазу, тыңдау мен айту жаттығулары, IT-ағылшын. 24 сабақ, деңгей анықтау тесті.",
    "math/index.html": "Математика: авторлық қазақша курс. 25 пән: Linear Algebra, Calculus, Probability Theory, Discrete Mathematics, Number Theory, Topology және т.б. Қорытып шығарулар, шешілген мысалдар, интерактивті есептер.",
}
INDEX_LD = "Гарвард университетінің CS50x курсы қазақ тілінде: {lect_x} лекция, тесттер, тапсырмалар, интерактив визуализациялар."


def apply_descriptions(rel, s):
    tpl = DESC_TEMPLATES.get(rel)
    if not tpl:
        return s
    desc = html.escape(tpl.format(**FLAT), quote=True)
    s = re.sub(r'(<meta (?:property="og:description"|name="description"|name="twitter:description") content=")[^"]*(")',
               lambda m: m.group(1) + desc + m.group(2), s)
    if rel == "index.html":
        s = re.sub(r'("description": ")Гарвард университетінің CS50x курсы[^"]*(")', lambda m: m.group(1) + INDEX_LD.format(**FLAT) + m.group(2), s)
    return s


def course_tasks_label(code):
    d = STATS["by_course"][code]
    if d["ex"]:
        return f'{d["ex"]} тапсырма'
    return f'{d["projects"]} жоба' if d["projects"] else ""


INV_NAMES = {"x": "CS50x", "python": "CS50P (Python)", "sql": "CS50 SQL", "ai": "CS50 AI", "web": "CS50 Web",
             "cpp": "C++", "java": "Java", "en": "Ағылшын тілі A0-C1", "math": "Математика (25 пән)"}


def write_inventory():
    """docs/INVENTORY.md: сатып алушы не инвестор тексеретін мазмұн тізімдемесі (әр build сайын қайта жазылады)."""
    acad = {c: a for a, ids in ACADEMIES.items() for c in ids}
    acad_name = {"code": "Бағдарламалау", "en": "Ағылшын тілі", "math": "Математика"}
    rows, tot = [], {"own": [0] * 5, "cc": [0] * 5}
    for code in ["x", *COURSES, *OWN_COURSES]:
        d = STATS["by_course"][code]
        own = code in OWN_COURSES
        vals = [d["lect"], d["ex"], d["tasks"], d["quiz"], d["terms"]]
        for i, v in enumerate(vals):
            tot["own" if own else "cc"][i] += v
        kind = "Авторлық, © Sagid Mustafa, All Rights Reserved" if own else "Harvard CS50 аудармасы, CC BY-NC-SA 4.0"
        rows.append(f"| {INV_NAMES[code]} | {acad_name[acad[code]]} | {kind} | " + " | ".join(str(v) for v in vals) + " |")
    t = lambda k: " | ".join(f"**{v}**" for v in tot[k])
    md = f"""# AO17: мазмұн тізімдемесі

Бұл файлды `tools/build.py` әр құрастыру сайын сайттың өз беттерінен қайта есептейді: қолмен түзетпеңіз.
Сатып алушы не инвестор сандарды `python3 tools/build.py --stats` арқылы өзі тексере алады.

| Курс | Академия | Құқық | Сабақ | Тапсырма | Автотексерілетін | Тест сұрағы | Термин |
|---|---|---|---|---|---|---|---|
{chr(10).join(rows)}
| **Авторлық (сатуға не лицензиялауға болады)** | | | {t("own")} |
| **Harvard аудармасы (тегін қалады)** | | | {t("cc")} |

- **Тапсырма:** сабақтағы барлық тапсырма. **Автотексерілетін:** автотексеруші, жауап тексеру, ағылшын мен математика жаттығулары.
- Терминдер курс бойынша бірегей; сайттың жалпы сөздігінде қайталанбайтын термин саны: {STATS["terms"]}.
- Қосымша: {STATS["games"]} оқу ойыны, {STATS["bugs"]} «қатені тап» жаттығуы, қорытынды емтихан ({STATS["exam_q"]} сұрақ, {STATS["exam_min"]} мин).
"""
    (ROOT / "docs/INVENTORY.md").write_text(md, encoding="utf-8")


def main():
    global STATS, FLAT
    STATS = compute_stats()
    FLAT = flat_stats(STATS)
    if "--stats" in sys.argv:
        print(json.dumps({"site_stats": STATS, "flat": FLAT}, ensure_ascii=False, indent=1))
        return
    write_inventory()
    # Мета-сипаттамалар process_page-ден БҰРЫН жаңарады (ол сипаттаманы файлдан оқиды)
    for rel in DESC_TEMPLATES:
        fp = ROOT / rel
        if fp.exists():
            t = fp.read_text(encoding="utf-8")
            t2 = apply_descriptions(rel, t)
            if t2 != t:
                fp.write_text(t2, encoding="utf-8")
    lectures, index, terms, quiz, sheets = [], [], [], [], []
    for name in ORDER:
        p = ROOT / "lectures" / f"{name}.html"
        if not p.exists():
            continue
        s = process_page(p, "../", "index")
        meta = lecture_meta(name, s)
        lectures.append(meta)
        index += sections(name, s, meta)
        terms += glossary_terms(name, s, meta)
        quiz += quiz_questions(name, s, meta)
        sm = re.search(r'<h2 id="summary">.*?</h2>\s*(?:<p>(?:(?!</p>).)*</p>\s*)?(<ul>.*?</ul>|<table>.*?</table>)', s, re.S)
        if sm:
            sheets.append((meta, sm.group(1), "x"))
    if math_pedagogy.main():  # математика: алғышарттар оқу жолына қайшы болса, жинақ тоқтайды
        sys.exit(1)
    # Қосымша курстар: лекциялар (../../), курс беті (../), іздеу мен сөздікке қосу
    course_pages = []
    for code, c in ALL_COURSES.items():
        clist = []
        for name in c["order"]:
            p = ROOT / code / "lectures" / f"{name}.html"
            if not p.exists():
                continue
            s = process_page(p, "../../", "index")
            if is_soon(s):  # тұғыр бет: бас/нав/footer жаңарады, бірақ дайын лекция емес
                continue
            meta = lecture_meta(name, s, f"{code}/lectures/{name}.html")
            clist.append(meta)
            labeled = dict(meta, num=f'{c["short"]} · {meta["num"]}')
            index += sections(name, s, labeled)
            terms += glossary_terms(name, s, labeled, code)
            quiz += [dict(q, c=code) for q in quiz_questions(name, s, meta)]
            sm = re.search(r'<h2 id="summary">.*?</h2>\s*(?:<p>(?:(?!</p>).)*</p>\s*)?(<ul>.*?</ul>|<table>.*?</table>)', s, re.S)
            if sm and code != "math":  # math: формулалар TeX; шпаргалка беті KaTeX жүктемейді
                sheets.append((meta, sm.group(1), code))
            course_pages.append(meta["url"])
        if (ROOT / code / "index.html").exists():
            info = {}
            if code in OWN_COURSES:
                for m_ in clist:
                    lp = ROOT / code / "lectures" / f"{m_['id']}.html"
                    dm = re.search(r'<div class="lecture-head"[^>]*>.*?<p>(.*?)</p>', lp.read_text(encoding="utf-8"), re.S)
                    d = strip_tags(dm.group(1)) if dm else ""
                    if code == "math":  # курс беті KaTeX жүктемейді: үзіндіде TeX формуласы бар сөйлемдер алынбайды
                        si, sk = math_plan.locate(int(m_["id"].split("-")[1]))
                        d = tex_free_excerpt(d) or math_plan.SUBJECTS[si][7][sk][1]  # бәрінде формула болса - жоспардағы сипаттама
                    if len(d) > 150:
                        d = d[:147].rsplit(" ", 1)[0].rstrip(",;:") + "..."
                    info[m_["id"]] = (m_["title"], d)
            if code == "math":
                write_math_plan()
            sync_week_cards(ROOT / code / "index.html", {m["id"] for m in clist}, info)
            if code == "math":
                sync_math_index(ROOT / code / "index.html")
            process_page(ROOT / code / "index.html", "../", "index")
            for extra in sorted((ROOT / code).glob("*.html")):  # курстың ортақ беттері (en/vocab.html т.б.)
                if extra.name != "index.html":
                    process_page(extra, "../", "")
                    course_pages.append(f"{code}/{extra.name}")
            c["ready"] = len(clist)
            COURSE_LISTS[code] = clist
            course_pages.append(f"{code}/")
        (ROOT / code / "data").mkdir(exist_ok=True)
        (ROOT / code / "data" / "lectures.js").write_text(
            f"window.CS50KZ_COURSE_LECTURES = window.CS50KZ_COURSE_LECTURES || {{}};\nwindow.CS50KZ_COURSE_LECTURES[{json.dumps(code)}] = "
            + json.dumps(clist, ensure_ascii=False, indent=1) + ";\n", encoding="utf-8")
    COURSE_LISTS["x"] = lectures
    build_cheatsheet(sheets)
    n = build_glossary(terms)
    for page, active in [("index.html", "index"), ("about.html", "about"),
                         ("glossary.html", "glossary"), ("certificate.html", ""),
                         ("playground.html", "playground"), ("practice.html", "practice"),
                         ("flashcards.html", "practice"), ("viz.html", "practice"),
                         ("teacher.html", ""), ("404.html", ""), ("cheatsheet.html", "practice"),
                         ("debug.html", "practice"), ("map.html", "practice"),
                         ("detective.html", "practice"), ("flask.html", "practice"), ("projects.html", "practice"), ("exam.html", "practice"), ("profile.html", "profile"), ("games.html", "games"), ("copyright.html", "about"), ("alash.html", "about"), ("courses.html", "courses"), ("programming.html", "courses"), ("partners.html", "about"), ("metrics.html", "about")]:
        if (ROOT / page).exists():
            process_page(ROOT / page, "", active)
    # Сандар: бір дерекқөз (STATS). Циклдағы нақты есеппен сәйкестігін тексереміз (айырмашылық - build қатесі).
    assert (len(quiz), n, len(lectures) + sum(1 for c, cc in ALL_COURSES.items() for n_ in cc["order"] if is_ready(c, n_))) == \
        (STATS["quiz"], STATS["terms"], STATS["lect"]), "compute_stats() цикл нәтижесімен сәйкес емес"
    # Барлық бет пен README: <!--n:КІЛТ-->…<!--/n-->
    targets = [p for p in ROOT.glob("*.html")] + [ROOT / c / "index.html" for c in ALL_COURSES] + [ROOT / "README.md"]
    for fp in targets:
        if fp.exists():
            t = fp.read_text(encoding="utf-8")
            t2 = fill_numbers(t)
            if t2 != t:
                fp.write_text(t2, encoding="utf-8")
    (ROOT / "assets/data/lectures.js").write_text(
        "window.CS50KZ_LECTURES = " + json.dumps(lectures, ensure_ascii=False, indent=1) + ";\n", encoding="utf-8")
    (ROOT / "assets/data/search-index.js").write_text(
        "window.CS50KZ_INDEX = " + json.dumps(index, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    (ROOT / "assets/data/quiz.js").write_text(
        "window.CS50KZ_QUIZ = " + json.dumps(quiz, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    pages = ["", "practice.html", "playground.html", "viz.html", "flashcards.html", "glossary.html",
             "certificate.html", "teacher.html", "about.html", "cheatsheet.html", "debug.html", "map.html", "detective.html", "flask.html", "projects.html", "exam.html", "profile.html", "games.html", "copyright.html", "alash.html", "courses.html", "programming.html", "partners.html", "metrics.html"] + [l["url"] for l in lectures] + course_pages
    (ROOT / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
        "".join(f"  <url><loc>{SITE_URL}{u}</loc></url>\n" for u in pages) + "</urlset>\n", encoding="utf-8")
    # sw.js: дербес курстардың бар беттерін офлайн кэшке қосу
    swp = ROOT / "sw.js"
    if swp.exists():
        own_files = []
        for code in OWN_COURSES:
            own_files += [f"{code}/index.html", f"{code}/data/lectures.js"] + sorted(
                f.relative_to(ROOT).as_posix() for f in (ROOT / code / "lectures").glob("week-*.html")
                if code != "math" or not is_soon(f.read_text(encoding="utf-8")))  # math: тек дайын сабақтар (162 тұғыр кэшке салынбайды)
            own_files += sorted(f.relative_to(ROOT).as_posix() for f in (ROOT / code).glob("*.html") if f.name != "index.html")  # курстың ортақ беттері
        own_files += ["assets/js/own-viz.js", "assets/css/own-viz.css"]  # дербес курстардың интерактивті визуализаторлары
        own_files += ["assets/js/en-course.js", "assets/js/en-tools.js", "assets/css/en-course.css"]  # ағылшын курсының жаттығу қозғалтқышы мен құралдары
        own_files += ["assets/js/games-en.js", "assets/css/en-games.css", "assets/js/en-trainer.js", "assets/js/en-home.js", "assets/js/en-skills.js"]  # ағылшын ойындары, сөздік жаттықтырғышы, курс беті
        own_files += sorted(f.relative_to(ROOT).as_posix() for f in (ROOT / "assets/data").glob("en-*.js"))
        # Математика: қозғалтқыш, визуализация, стиль, жергілікті KaTeX (MIT), жоспар және дерек файлдары
        own_files += ["assets/js/math-course.js", "assets/js/math-viz.js", "assets/css/math-course.css", "math/data/plan.js",
                      "assets/vendor/katex/katex.min.js", "assets/vendor/katex/auto-render.min.js", "assets/vendor/katex/katex.min.css"]
        own_files += sorted(f.relative_to(ROOT).as_posix() for f in (ROOT / "assets/vendor/katex/fonts").glob("*.woff2"))
        own_files += sorted(f.relative_to(ROOT).as_posix() for f in (ROOT / "assets/data").glob("math-*.js"))
        own_files = [f for f in own_files if (ROOT / f).exists()]
        sw = swp.read_text(encoding="utf-8")
        sw2 = re.sub(r"/\*own-courses:begin\*/.*?/\*own-courses:end\*/",
                     lambda _: "/*own-courses:begin*/" + json.dumps(own_files, ensure_ascii=False) + "/*own-courses:end*/", sw, flags=re.S)
        if sw2 != sw:
            swp.write_text(sw2, encoding="utf-8")
    (ROOT / "robots.txt").write_text(f"User-agent: *\nAllow: /\nSitemap: {SITE_URL}sitemap.xml\n", encoding="utf-8")
    print(f"CS50x {len(lectures)} + барлығы {STATS['lect']} лекция, {len(index)} бөлім, {n} термин, {len(quiz)} сұрақ")


if __name__ == "__main__":
    main()
