#!/usr/bin/env python3
# © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама (LICENSE-PROPRIETARY.md, COPYRIGHT.md).
# Harvard CS50 материалдары (олар осы файлда сақталмайды) CC BY-NC-SA 4.0 бойынша; үшінші тарап компоненттері өз лицензияларымен.
"""CS50 қазақша - сайтты құрастыру скрипті.

Іске қосу (репозиторийдің түбірінен):  python3 tools/build.py

Не істейді:
  1. Әр беттің <head> бөліміне favicon, PWA манифесі, Open Graph тегтерін қосады.
  2. Барлық беттегі навигацияны бірдей етеді.
  3. assets/data/lectures.js - лекциялар тізімі (прогресс панелі үшін).
  4. assets/data/search-index.js - бүкіл сайт бойынша іздеу индексі.
  5. glossary.html - лекциялардағы терминдерден қазақша–ағылшынша сөздік.
Скрипт идемпотентті: қайта-қайта іске қоса беруге болады.
"""
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
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
}
ALL_COURSES = {**COURSES, **OWN_COURSES}
OWN_RE = "|".join(OWN_COURSES)

# Курстар витринасы (courses.html мен басты бетте): <!-- build:courses --> ... <!-- /build:courses -->
GLYPHS = {
    "x": '<path d="M14 18 6 32l8 14M50 18l8 14-8 14M38 12 26 52"/>',
    "python": '<path d="M32 8c-9 0-12 4-12 9v6h12v3H15c-5 0-9 4-9 10s4 11 9 11h5v-7c0-5 4-9 9-9h11c4 0 7-3 7-7V17c0-5-5-9-15-9z"/><path d="M32 56c9 0 12-4 12-9v-6H32v-3h17c5 0 9-4 9-10s-4-11-9-11h-5v7c0 5-4 9-9 9H24c-4 0-7 3-7 7v7c0 5 5 9 15 9z"/><circle cx="26" cy="15" r="1.6"/><circle cx="38" cy="49" r="1.6"/>',
    "sql": '<ellipse cx="32" cy="14" rx="20" ry="7"/><path d="M12 14v36c0 4 9 7 20 7s20-3 20-7V14M12 26c0 4 9 7 20 7s20-3 20-7M12 38c0 4 9 7 20 7s20-3 20-7"/>',
    "ai": '<circle cx="12" cy="20" r="4"/><circle cx="12" cy="44" r="4"/><circle cx="32" cy="12" r="4"/><circle cx="32" cy="32" r="4"/><circle cx="32" cy="52" r="4"/><circle cx="52" cy="32" r="4"/><path d="M16 20l12-8M16 20l12 12M16 20l12 32M16 44l12-32M16 44l12-12M16 44l12 8M36 12l12 20M36 32h12M36 52l12-20"/>',
    "cpp": '<path d="M32 5 56 18.500v27L32 59 8 45.500v-27z"/><path d="M27 25a8.500 8.500 0 1 0 0 14"/><path d="M33 32h8M37 28v8M45 32h8M49 28v8"/>',
    "java": '<path d="M13 30h30v12c0 8-6 14-15 14s-15-6-15-14z"/><path d="M43 33h4c5 0 7 3 7 6s-2 6-7 6h-5"/><path d="M22 6c-4 5 4 6 0 12M31 6c-4 5 4 6 0 12M40 8c-3 4 3 5 0 9"/><path d="M8 60h40"/>',
    "web": '<circle cx="32" cy="32" r="24"/><path d="M8 32h48M32 8c-8 8-11 16-11 24s3 16 11 24M32 8c8 8 11 16 11 24s-3 16-11 24M12 20h40M12 44h40"/>',
}
CATALOG = [
    {"id": "x", "code": "CS50x", "href": "index.html", "c": "#087a96", "c2": "#0a4c7a", "title": "Информатикаға кіріспе",
     "desc": "Бағдарламалау әлеміне ең жақсы кіру есігі: алгоритмдерден веб пен жасанды интеллектке дейін.",
     "tags": ["Scratch", "C", "Python", "SQL", "HTML/CSS/JS", "Flask"], "lec": 12, "tasks": "34 тапсырма", "state": "ready", "total": 12},
    {"id": "python", "code": "CS50P", "href": "python/", "c": "#3776ab", "c2": "#1d3f66", "title": "Python бағдарламалау",
     "desc": "Python-ды нөлден тереңге: функциялар, ерекше жағдайлар, кітапханалар, тесттер, тұрақты өрнектер, ООП.",
     "tags": ["функциялар", "циклдер", "pytest", "regex", "ООП"], "lec": 10, "tasks": "41 тапсырма", "state": "wip", "total": 10},
    {"id": "sql", "code": "CS50 SQL", "href": "sql/", "c": "#7c3aed", "c2": "#3b1a78", "title": "Дерекқорлар",
     "desc": "Деректерді сұрау, кестелерді жобалау, индекстер мен масштабтау: SQLite-тан PostgreSQL-ге дейін.",
     "tags": ["SELECT", "JOIN", "жобалау", "индекстер"], "lec": 7, "tasks": "18 тапсырма", "state": "wip", "total": 7},
    {"id": "ai", "code": "CS50 AI", "href": "ai/", "c": "#d0306f", "c2": "#6e1640", "title": "Жасанды интеллект",
     "desc": "Іздеу, логика, ықтималдық, оңтайландыру, машиналық оқыту, нейрон желілер және тіл модельдері.",
     "tags": ["іздеу", "ықтималдық", "ML", "нейрон желі"], "lec": 7, "tasks": "12 жоба", "state": "wip", "total": 7},
    {"id": "web", "code": "CS50 Web", "href": "web/", "c": "#c2410c", "c2": "#7a2a06", "title": "Веб-бағдарламалау",
     "desc": "Толық веб-қосымшалар: HTML, CSS, Git, Django, SQL, JavaScript, React, тестілеу және қауіпсіздік.",
     "tags": ["Django", "JavaScript", "React", "Git"], "lec": 9, "tasks": "5 жоба", "state": "wip", "total": 9},
    {"id": "cpp", "code": "C++", "href": "cpp/", "c": "#4f46e5", "c2": "#2e2a8a", "title": "C++ бағдарламалау", "own": True,
     "desc": "C++ нөлден: жад пен көрсеткіштер, ООП, STL, шаблондар және өз жобаң.",
     "tags": ["көрсеткіштер", "ООП", "STL", "шаблондар"], "lec": 8, "tasks": "1 жоба", "state": "wip", "total": 8},
    {"id": "java", "code": "Java", "href": "java/", "c": "#d97706", "c2": "#8a4a04", "title": "Java бағдарламалау", "own": True,
     "desc": "Java нөлден: нысандар, интерфейстер, Collections, Stream API, көп ағын және өз жобаң.",
     "tags": ["ООП", "Collections", "Stream", "көп ағын"], "lec": 8, "tasks": "1 жоба", "state": "wip", "total": 8},
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
        total = f' data-total="{c["total"]}"' if c.get("total") else ""
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
            <div class="cx-foot"><span>{c["lec"]} лекция · {c["tasks"]}</span>{go}</div>
          </div>
        </{tag}>""")
    return "<!-- build:courses -->\n" + "\n".join(out) + "\n        <!-- /build:courses -->"


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
           "teacher.html", "certificate.html", "404.html", "copyright.html"}


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


def head_block(prefix, title, desc, url, image="assets/img/og.jpg", kind="M"):
    copy, lic = license_meta(kind, prefix)
    return f"""<!-- build:head -->
  <meta name="theme-color" content="#0a4c7a">
  <link rel="icon" href="{prefix}assets/img/icon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="{prefix}assets/img/icon-192.png">
  <link rel="manifest" href="{prefix}manifest.webmanifest">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="CS50 қазақша">
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
  <script type="application/ld+json">{license_ld(kind, title, url)}</script>
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
        "cpp": ("C++", "#4f46e5"), "java": ("Java", "#d97706")}


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
        f'      <div class="ft-brand"><a class="ft-logo" href="{p}index.html"><img src="{p}assets/img/bota.svg" alt="" width="52" height="52">'
        '<span><b>CS50</b> қазақша</span></a>'
        '<p>Harvard CS50 курстарының қазақша аудармалары және дербес интерактивті оқу құралдары: тапсырмалар, автотексеру, ойындар. Тегін және офлайн.</p></div>\n'
        + "      " + col("Оқу", [("index.html#main", "Лекциялар"), ("courses.html", "Барлық курстар"), ("map.html", "Курс картасы"), ("cheatsheet.html", "Шпаргалка"), ("glossary.html", "Сөздік"), ("exam.html", "Қорытынды емтихан")])
        + col("Жаттығу", [("practice.html", "Жаттығулар"), ("playground.html", "Сынақ алаңы"), ("viz.html", "Визуализациялар"), ("flashcards.html", "Флэш-карточкалар"), ("games.html", "Ойындар 🎮"), ("debug.html", "Қатені тап"), ("detective.html", "SQL детектив"), ("flask.html", "Flask зертханасы"), ("projects.html", "Жобалар шеберханасы")])
        + col("Жоба", [("about.html", "Курс туралы"), ("alash.html", "Алаш тұлғалары"), ("certificate.html", "Сертификат"), ("teacher.html", "Мұғалім беті"), ("profile.html", "Менің кабинетім")])
        + '\n      <div class="ft-legal">'
        '<p class="ft-copy"><strong>© 2026 Sagid Mustafa.</strong> Барлық құқықтар қорғалған.</p>'
        '<p>CS50MUSS платформасының тәуелсіз бағдарламалық жасақтамасы, дизайны және авторлық оқу материалдары Sagid Mustafa-ға тиесілі.</p>'
        '<p>Harvard CS50 курстарының бастапқы материалдары мен олардың қазақша бейімдеулері тиісті Creative Commons лицензиясының талаптарына сәйкес таратылады. '
        'Қазақша аудармалардың авторы: Sagid Mustafa.</p>'
        '<p>CS50MUSS — Harvard University-ден тәуелсіз жоба.</p>'
        '<p class="ft-src">Түпнұсқа (Harvard CS50): '
        '<a href="https://cs50.harvard.edu/x/" target="_blank" rel="noopener">CS50x</a> · '
        '<a href="https://cs50.harvard.edu/python/" target="_blank" rel="noopener">CS50P</a> · '
        '<a href="https://cs50.harvard.edu/sql/" target="_blank" rel="noopener">SQL</a> · '
        '<a href="https://cs50.harvard.edu/ai/" target="_blank" rel="noopener">AI</a> · '
        '<a href="https://cs50.harvard.edu/web/" target="_blank" rel="noopener">Web</a></p>'
        f'<p class="ft-own">Авторлық курстар (Sagid Mustafa): <a href="{p}cpp/">C++</a> · <a href="{p}java/">Java</a></p>'
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
}


def process_page(path, prefix, active):
    s = path.read_text(encoding="utf-8")
    title = re.search(r"<title>(.*?)</title>", s, re.S).group(1).strip()
    m = re.search(r'<meta name="description" content="([^"]*)">', s)
    rel = path.relative_to(ROOT).as_posix()
    own = re.match(rf"({OWN_RE})/", rel)
    desc = m.group(1) if m else (f"{OWN_COURSES[own.group(1)]['short']} бағдарламалау: авторлық оқу курсы, тесттер мен жаттығулар." if own
                                 else "Гарвардтың CS50 курсы қазақ тілінде: лекциялар, тесттер, тапсырмалар.")
    url = SITE_URL + ("" if rel == "index.html" else rel)
    og = f"assets/img/og/{path.stem}.jpg" if rel.startswith("lectures/") else "assets/img/og.jpg"
    if rel in ("cpp/index.html", "java/index.html"):
        og = f"assets/img/og/{rel.split('/')[0]}.jpg"
    for code, c in ALL_COURSES.items():  # басқа курс лекцияларының баннер түсі мен нөмірі
        m = re.match(rf"{code}/lectures/week-(\d+)\.html$", rel)
        if m:
            HEAD_STYLE.setdefault(rel, (c["color"], m.group(1)))
    kind = license_kind(rel)
    block = head_block(prefix, title, desc, url, og if (ROOT / og).exists() else "assets/img/og.jpg", kind)
    if "<!-- build:head -->" in s:
        s = re.sub(r"<!-- build:head -->.*?<!-- /build:head -->", block, s, flags=re.S)
    else:
        s = s.replace("</title>", "</title>\n  " + block, 1)
    if "<!-- build:courses" in s:
        skip = ("x",) if rel == "index.html" else ()
        s = re.sub(r"<!-- build:courses -->.*?<!-- /build:courses -->", lambda _: courses_block(prefix, skip), s, flags=re.S)
    s = re.sub(r'<nav class="nav">.*?</nav>', lambda _: nav_block(prefix, active, course_of(rel)), s, count=1, flags=re.S)
    s = re.sub(r'<footer class="footer">.*?</footer>', lambda _: footer_block(prefix), s, count=1, flags=re.S)
    hs = HEAD_STYLE.get(rel)
    if hs:
        attrs = f' style="--lc:{hs[0]}"' + (f' data-n="{hs[1]}"' if hs[1] else "")
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
            "tasks": article.count('class="checklist"')}


def sections(name, s, meta):
    """Мақаланы h2/h3 бойынша бөліктерге бөлу (іздеу үшін)."""
    article = article_of(s)
    parts = re.split(r'(<h[23] id="[^"]+">.*?</h[23]>)', article, flags=re.S)
    out = []
    for i in range(1, len(parts) - 1, 2):
        hid = re.search(r'id="([^"]+)"', parts[i]).group(1)
        heading = strip_tags(parts[i])
        body = strip_tags(re.sub(r"<pre\b.*?</pre>", " ", parts[i + 1], flags=re.S))
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
    top = re.sub(r"<title>.*?</title>", "<title>Шпаргалка - CS50 қазақша</title>", top)
    top = top.replace('<meta name="author"', '<meta name="description" content="CS50 қазақша: жеті курстың қысқаша конспектісі бір бетте, басып шығаруға ыңғайлы.">\n  <meta name="author"', 1)
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
        <p>Жеті курстың әр лекциясының ең маңызды ұғымдары мен синтаксисі. Емтиханға не тапсырмаға дайындалғанда қолданыңыз. Курсты таңдап, тек сол курсты басып шығаруға болады.</p>
        <button type="button" class="btn gold cs-print" onclick="print()">🖨 Басып шығару / PDF</button>
      </div>
      <div class="seg cs-courses" role="group" aria-label="Курс"><button type="button" data-c="x" class="on">CS50x</button><button type="button" data-c="python">CS50P</button><button type="button" data-c="sql">SQL</button><button type="button" data-c="ai">AI</button><button type="button" data-c="web">Web</button><button type="button" data-c="cpp">C++</button><button type="button" data-c="java">Java</button><button type="button" data-c="all">Барлығы</button></div>
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
    top = re.sub(r"<title>.*?</title>", "<title>Терминдер сөздігі - CS50 қазақша</title>", top)
    top = top.replace('<meta name="author"', '<meta name="description" content="Информатика терминдерінің қазақша–ағылшынша сөздігі: CS50 лекцияларынан жиналған.">\n  <meta name="author"', 1) if 'name="description"' not in top else top
    foot = tpl[tpl.index("  <footer"):]
    page = top + f"""<div class="layout single">
    <article class="content glossary">
      <div class="lecture-head">
        <div class="num">Сөздік</div>
        <h1>Терминдер сөздігі</h1>
        <p>Жеті курстағы {len(items)} термин: қазақшасы, ағылшыншасы және алғаш түсіндірілген жері. Курс бойынша сүзуге болады.</p>
      </div>
      <div class="g-search"><input type="search" placeholder="Терминді іздеңіз: массив, pointer, хэш..." autocomplete="off" aria-label="Терминді іздеу"><span class="g-count"></span></div>
      <nav class="g-letters">{"".join(f'<a href="#l-{i + 1}">{html.escape(l)}</a>' for i, l in enumerate(letters))}</nav>
{chr(10).join(rows)}
    </article>
  </div>

""" + foot
    (ROOT / "glossary.html").write_text(page, encoding="utf-8")
    return len(items)


def main():
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
    # Қосымша курстар: лекциялар (../../), курс беті (../), іздеу мен сөздікке қосу
    course_pages = []
    for code, c in ALL_COURSES.items():
        clist = []
        for name in c["order"]:
            p = ROOT / code / "lectures" / f"{name}.html"
            if not p.exists():
                continue
            s = process_page(p, "../../", "index")
            meta = lecture_meta(name, s, f"{code}/lectures/{name}.html")
            clist.append(meta)
            labeled = dict(meta, num=f'{c["short"]} · {meta["num"]}')
            index += sections(name, s, labeled)
            terms += glossary_terms(name, s, labeled, code)
            quiz += [dict(q, c=code) for q in quiz_questions(name, s, meta)]
            sm = re.search(r'<h2 id="summary">.*?</h2>\s*(?:<p>(?:(?!</p>).)*</p>\s*)?(<ul>.*?</ul>|<table>.*?</table>)', s, re.S)
            if sm:
                sheets.append((meta, sm.group(1), code))
            course_pages.append(meta["url"])
        if (ROOT / code / "index.html").exists():
            info = {}
            if code in OWN_COURSES:
                for m_ in clist:
                    lp = ROOT / code / "lectures" / f"{m_['id']}.html"
                    dm = re.search(r'<div class="lecture-head"[^>]*>.*?<p>(.*?)</p>', lp.read_text(encoding="utf-8"), re.S)
                    d = strip_tags(dm.group(1)) if dm else ""
                    if len(d) > 150:
                        d = d[:147].rsplit(" ", 1)[0].rstrip(",;:") + "..."
                    info[m_["id"]] = (m_["title"], d)
            sync_week_cards(ROOT / code / "index.html", {m["id"] for m in clist}, info)
            process_page(ROOT / code / "index.html", "../", "index")
            c["ready"] = len(clist)
            course_pages.append(f"{code}/")
        (ROOT / code / "data").mkdir(exist_ok=True)
        (ROOT / code / "data" / "lectures.js").write_text(
            f"window.CS50KZ_COURSE_LECTURES = window.CS50KZ_COURSE_LECTURES || {{}};\nwindow.CS50KZ_COURSE_LECTURES[{json.dumps(code)}] = "
            + json.dumps(clist, ensure_ascii=False, indent=1) + ";\n", encoding="utf-8")
    build_cheatsheet(sheets)
    n = build_glossary(terms)
    for page, active in [("index.html", "index"), ("about.html", "about"),
                         ("glossary.html", "glossary"), ("certificate.html", ""),
                         ("playground.html", "playground"), ("practice.html", "practice"),
                         ("flashcards.html", "practice"), ("viz.html", "practice"),
                         ("teacher.html", ""), ("404.html", ""), ("cheatsheet.html", "practice"),
                         ("debug.html", "practice"), ("map.html", "practice"),
                         ("detective.html", "practice"), ("flask.html", "practice"), ("projects.html", "practice"), ("exam.html", "practice"), ("profile.html", "profile"), ("games.html", "games"), ("copyright.html", "about"), ("alash.html", "about"), ("courses.html", "courses")]:
        if (ROOT / page).exists():
            process_page(ROOT / page, "", active)
    # Беттердегі есептелетін сандар: <!--n:terms-->…<!--/n--> және <!--n:quiz-->…<!--/n-->
    n_tasks = sum(len(re.findall(r'class="(?:autograder|js-grader|sql-grader)\b', f.read_text(encoding="utf-8")))
                  for f in list((ROOT / "lectures").glob("*.html")) + [g for c in ALL_COURSES for g in (ROOT / c / "lectures").glob("week-*.html")])
    stats = {"terms": str(n), "quiz": str(len(quiz)), "courses": str(len(ALL_COURSES) + 1), "lect": str(0), "tasks": str(n_tasks)}
    # Бүкіл сайт бойынша сандар: басты беттегі пилюля және мета-сипаттамалар
    n_lect = len(list((ROOT / "lectures").glob("*.html"))) + sum(len(list((ROOT / c / "lectures").glob("week-*.html"))) for c in ALL_COURSES)
    stats["lect"] = str(n_lect)
    site = f"{len(ALL_COURSES) + 1} курс · {n_lect} лекция · {len(quiz)} тест сұрағы · {n} термин"
    desc = (f"{len(ALL_COURSES) + 1} курс, {n_lect} лекция, {len(quiz)} тест сұрағы: Гарвардтың CS50 курстары қазақ тілінде (CS50x, Python, SQL, AI, Web) және авторлық C++ мен Java курстары. "
            "Браузерде орындалатын тапсырмалар. Тегін. Harvard CS50 аудармалары (Sagid Mustafa) CC BY-NC-SA 4.0; дербес құралдар мен C++/Java курстары авторлық құқықпен қорғалған.")
    ip = ROOT / "index.html"
    if ip.exists():
        it = ip.read_text(encoding="utf-8")
        it2 = re.sub(r"<!--site-->.*?<!--/site-->", f"<!--site-->{site}<!--/site-->", it)
        it2 = re.sub(r'(<meta (?:property="og:description"|name="description"|name="twitter:description") content=")[^"]*(")', lambda m: m.group(1) + desc + m.group(2), it2)
        if it2 != it:
            ip.write_text(it2, encoding="utf-8")
    for page in ["practice.html", "flashcards.html", "about.html", "index.html", "courses.html"]:
        fp = ROOT / page
        if fp.exists():
            t = fp.read_text(encoding="utf-8")
            t2 = re.sub(r"<!--n:(\w+)-->.*?<!--/n-->", lambda m: f"<!--n:{m.group(1)}-->{stats.get(m.group(1), '')}<!--/n-->", t)
            if t2 != t:
                fp.write_text(t2, encoding="utf-8")
    (ROOT / "assets/data/lectures.js").write_text(
        "window.CS50KZ_LECTURES = " + json.dumps(lectures, ensure_ascii=False, indent=1) + ";\n", encoding="utf-8")
    (ROOT / "assets/data/search-index.js").write_text(
        "window.CS50KZ_INDEX = " + json.dumps(index, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    (ROOT / "assets/data/quiz.js").write_text(
        "window.CS50KZ_QUIZ = " + json.dumps(quiz, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    pages = ["", "practice.html", "playground.html", "viz.html", "flashcards.html", "glossary.html",
             "certificate.html", "teacher.html", "about.html", "cheatsheet.html", "debug.html", "map.html", "detective.html", "flask.html", "projects.html", "exam.html", "profile.html", "games.html", "copyright.html", "alash.html", "courses.html"] + [l["url"] for l in lectures] + course_pages
    (ROOT / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
        "".join(f"  <url><loc>{SITE_URL}{u}</loc></url>\n" for u in pages) + "</urlset>\n", encoding="utf-8")
    # sw.js: дербес курстардың бар беттерін офлайн кэшке қосу
    swp = ROOT / "sw.js"
    if swp.exists():
        own_files = []
        for code in OWN_COURSES:
            own_files += [f"{code}/index.html", f"{code}/data/lectures.js"] + sorted(
                f.relative_to(ROOT).as_posix() for f in (ROOT / code / "lectures").glob("week-*.html"))
        own_files = [f for f in own_files if (ROOT / f).exists()]
        sw = swp.read_text(encoding="utf-8")
        sw2 = re.sub(r"/\*own-courses:begin\*/.*?/\*own-courses:end\*/",
                     lambda _: "/*own-courses:begin*/" + json.dumps(own_files, ensure_ascii=False) + "/*own-courses:end*/", sw, flags=re.S)
        if sw2 != sw:
            swp.write_text(sw2, encoding="utf-8")
    (ROOT / "robots.txt").write_text(f"User-agent: *\nAllow: /\nSitemap: {SITE_URL}sitemap.xml\n", encoding="utf-8")
    print(f"{len(lectures)} лекция, {len(index)} бөлім, {n} термин, {len(quiz)} сұрақ")


if __name__ == "__main__":
    main()
