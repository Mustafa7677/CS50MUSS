#!/usr/bin/env python3
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
}

# Курстар витринасы (courses.html мен басты бетте): <!-- build:courses --> ... <!-- /build:courses -->
GLYPHS = {
    "x": '<path d="M14 18 6 32l8 14M50 18l8 14-8 14M38 12 26 52"/>',
    "python": '<path d="M32 8c-9 0-12 4-12 9v6h12v3H15c-5 0-9 4-9 10s4 11 9 11h5v-7c0-5 4-9 9-9h11c4 0 7-3 7-7V17c0-5-5-9-15-9z"/><path d="M32 56c9 0 12-4 12-9v-6H32v-3h17c5 0 9-4 9-10s-4-11-9-11h-5v7c0 5-4 9-9 9H24c-4 0-7 3-7 7v7c0 5 5 9 15 9z"/><circle cx="26" cy="15" r="1.6"/><circle cx="38" cy="49" r="1.6"/>',
    "sql": '<ellipse cx="32" cy="14" rx="20" ry="7"/><path d="M12 14v36c0 4 9 7 20 7s20-3 20-7V14M12 26c0 4 9 7 20 7s20-3 20-7M12 38c0 4 9 7 20 7s20-3 20-7"/>',
    "ai": '<circle cx="12" cy="20" r="4"/><circle cx="12" cy="44" r="4"/><circle cx="32" cy="12" r="4"/><circle cx="32" cy="32" r="4"/><circle cx="32" cy="52" r="4"/><circle cx="52" cy="32" r="4"/><path d="M16 20l12-8M16 20l12 12M16 20l12 32M16 44l12-32M16 44l12-12M16 44l12 8M36 12l12 20M36 32h12M36 52l12-20"/>',
    "web": '<circle cx="32" cy="32" r="24"/><path d="M8 32h48M32 8c-8 8-11 16-11 24s3 16 11 24M32 8c8 8 11 16 11 24s-3 16-11 24M12 20h40M12 44h40"/>',
}
CATALOG = [
    {"id": "x", "code": "CS50x", "href": "index.html", "c": "#087a96", "c2": "#0a4c7a", "title": "Информатикаға кіріспе",
     "desc": "Бағдарламалау әлеміне ең жақсы кіру есігі: алгоритмдерден веб пен жасанды интеллектке дейін.",
     "tags": ["Scratch", "C", "Python", "SQL", "HTML/CSS/JS", "Flask"], "lec": 12, "tasks": "34 тапсырма", "state": "ready", "total": 12},
    {"id": "python", "code": "CS50P", "href": "python/", "c": "#3776ab", "c2": "#1d3f66", "title": "Python бағдарламалау",
     "desc": "Python-ды нөлден тереңге: функциялар, ерекше жағдайлар, кітапханалар, тесттер, тұрақты өрнектер, ООП.",
     "tags": ["функциялар", "циклдер", "pytest", "regex", "ООП"], "lec": 10, "tasks": "41 тапсырма", "state": "wip", "total": 10},
    {"id": "sql", "code": "CS50 SQL", "href": None, "c": "#7c3aed", "c2": "#3b1a78", "title": "Дерекқорлар",
     "desc": "Деректерді сұрау, кестелерді жобалау, индекстер мен масштабтау: SQLite-тан PostgreSQL-ге дейін.",
     "tags": ["SELECT", "JOIN", "жобалау", "индекстер"], "lec": 7, "tasks": "18 тапсырма", "state": "soon"},
    {"id": "ai", "code": "CS50 AI", "href": None, "c": "#d0306f", "c2": "#6e1640", "title": "Жасанды интеллект",
     "desc": "Іздеу, логика, ықтималдық, оңтайландыру, машиналық оқыту, нейрон желілер және тіл модельдері.",
     "tags": ["іздеу", "ықтималдық", "ML", "нейрон желі"], "lec": 7, "tasks": "12 жоба", "state": "soon"},
    {"id": "web", "code": "CS50 Web", "href": None, "c": "#e2620f", "c2": "#8a2f08", "title": "Веб-бағдарламалау",
     "desc": "Толық веб-қосымшалар: HTML, CSS, Git, Django, SQL, JavaScript, React, тестілеу және қауіпсіздік.",
     "tags": ["Django", "JavaScript", "React", "Git"], "lec": 9, "tasks": "5 жоба", "state": "soon"},
]


def courses_block(prefix, skip=()):
    STATE = {"ready": "Толық дайын", "wip": "Аударылуда", "soon": "Жоспарда"}
    out = []
    for c in CATALOG:
        if c["id"] in skip:
            continue
        tag = "a" if c["href"] else "div"
        href = f' href="{prefix}{c["href"]}"' if c["href"] else ""
        tags = "".join(f"<li>{t}</li>" for t in c["tags"])
        go = '<span class="cx-go">Бастау <span aria-hidden="true">→</span></span>' if c["href"] else '<span class="cx-go soon">Жақында</span>'
        total = f' data-total="{c["total"]}"' if c.get("total") else ""
        out.append(f"""        <{tag} class="cx-card {c["state"]}"{href} data-course="{c["id"]}"{total} style="--c:{c["c"]};--c2:{c["c2"]}">
          <div class="cx-band">
            <span class="cx-code">{c["code"]}</span>
            <span class="cx-state">{STATE[c["state"]]}</span>
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


def head_block(prefix, title, desc, url, image="assets/img/og.jpg"):
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
  <!-- /build:head -->"""


def nav_block(prefix, active):
    def item(href, label, key, extra=""):
        cls = ' class="active' + (" " + extra if extra else "") + '"' if key == active else (f' class="{extra}"' if extra else "")
        return f'<a href="{prefix}{href}"{cls}>{label}</a>'
    return f"""<nav class="nav">
        {item("index.html", "Лекциялар", "index")}
        {item("courses.html", "Курстар", "courses", "hide-sm")}
        {item("practice.html", "Жаттығу", "practice")}
        {item("playground.html", "Сынақ алаңы", "playground", "hide-sm")}
        {item("glossary.html", "Сөздік", "glossary", "hide-sm")}
        <button class="search-open" type="button" aria-label="Іздеу"><span class="ico">⌕</span><span class="label">Іздеу</span><kbd>Ctrl K</kbd></button>
        <button class="prefs-open" type="button" aria-label="Аа - оқу баптаулары" title="Оқу баптаулары">Аа</button>
        <button class="theme-toggle" type="button" aria-label="Түсті ауыстыру">☾</button>
        <a class="profile-open{' active' if active == 'profile' else ''}" href="{prefix}profile.html" aria-label="Менің профилім" title="Менің профилім"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg></a>
      </nav>"""


def footer_block(p):
    def col(title, items):
        lis = "".join(f'<li><a href="{p}{h}">{t}</a></li>' for h, t in items)
        return f'<div class="ft-col"><h4>{title}</h4><ul>{lis}</ul></div>'
    return (
        '<footer class="footer">\n    <div class="footer-inner">\n'
        f'      <div class="ft-brand"><a class="ft-logo" href="{p}index.html"><img src="{p}assets/img/bota.svg" alt="" width="52" height="52">'
        '<span><b>CS50</b> қазақша</span></a>'
        '<p>Гарвардтың әйгілі информатика курсы ана тілімізде: толық аударма, интерактивті тапсырмалар мен автотексеру. Тегін және офлайн.</p></div>\n'
        + "      " + col("Оқу", [("index.html#main", "Лекциялар"), ("courses.html", "Барлық курстар"), ("map.html", "Курс картасы"), ("cheatsheet.html", "Шпаргалка"), ("glossary.html", "Сөздік"), ("exam.html", "Қорытынды емтихан")])
        + col("Жаттығу", [("practice.html", "Жаттығулар"), ("playground.html", "Сынақ алаңы"), ("viz.html", "Визуализациялар"), ("flashcards.html", "Флэш-карточкалар"), ("debug.html", "Қатені тап"), ("detective.html", "SQL детектив"), ("flask.html", "Flask зертханасы")])
        + col("Жоба", [("about.html", "Курс туралы"), ("alash.html", "Алаш тұлғалары"), ("certificate.html", "Сертификат"), ("teacher.html", "Мұғалім беті"), ("profile.html", "Менің профилім")])
        + '\n      <div class="ft-bottom"><p>Түпнұсқа: <a href="https://cs50.harvard.edu/x/" target="_blank" rel="noopener">CS50x</a>, Гарвард университеті, David J. Malan. '
        'Қазақшаға аударған: <strong>Sagid Mustafa</strong>.</p>'
        '<p>Лицензия: <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/deed.kk" target="_blank" rel="noopener">CC BY-NC-SA 4.0</a> · '
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
    "practice.html": ("#2fa36b", ""), "playground.html": ("#2b7bd6", ""), "flask.html": ("#8b5cf6", ""),
    "exam.html": ("#c99500", ""), "detective.html": ("#b5651d", ""), "viz.html": ("#e0457b", ""),
    "flashcards.html": ("#f08a24", ""), "debug.html": ("#e04545", ""), "glossary.html": ("#2b7bd6", ""),
    "cheatsheet.html": ("#2fa36b", ""), "map.html": ("#8b5cf6", ""), "teacher.html": ("#f08a24", ""), "profile.html": ("#0f9fb5", ""), "alash.html": ("#c99500", ""),
}


def process_page(path, prefix, active):
    s = path.read_text(encoding="utf-8")
    title = re.search(r"<title>(.*?)</title>", s, re.S).group(1).strip()
    m = re.search(r'<meta name="description" content="([^"]*)">', s)
    desc = m.group(1) if m else "Гарвардтың CS50 курсы қазақ тілінде: лекциялар, тесттер, тапсырмалар."
    rel = path.relative_to(ROOT).as_posix()
    url = SITE_URL + ("" if rel == "index.html" else rel)
    og = f"assets/img/og/{path.stem}.jpg" if rel.startswith("lectures/") else "assets/img/og.jpg"
    for code, c in COURSES.items():  # басқа курс лекцияларының баннер түсі мен нөмірі
        m = re.match(rf"{code}/lectures/week-(\d+)\.html$", rel)
        if m:
            HEAD_STYLE.setdefault(rel, (c["color"], m.group(1)))
    block = head_block(prefix, title, desc, url, og if (ROOT / og).exists() else "assets/img/og.jpg")
    if "<!-- build:head -->" in s:
        s = re.sub(r"<!-- build:head -->.*?<!-- /build:head -->", block, s, flags=re.S)
    else:
        s = s.replace("</title>", "</title>\n  " + block, 1)
    if "<!-- build:courses" in s:
        skip = ("x",) if rel == "index.html" else ()
        s = re.sub(r"<!-- build:courses -->.*?<!-- /build:courses -->", lambda _: courses_block(prefix, skip), s, flags=re.S)
    s = re.sub(r'<nav class="nav">.*?</nav>', nav_block(prefix, active), s, count=1, flags=re.S)
    s = re.sub(r'<footer class="footer">.*?</footer>', lambda _: footer_block(prefix), s, count=1, flags=re.S)
    hs = HEAD_STYLE.get(rel)
    if hs:
        attrs = f' style="--lc:{hs[0]}"' + (f' data-n="{hs[1]}"' if hs[1] else "")
        s = re.sub(r'<div class="lecture-head"[^>]*>', f'<div class="lecture-head"{attrs}>', s, count=1)
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


def glossary_terms(name, s, meta):
    article = article_of(s)
    terms = []
    last_id = "intro"
    for m in re.finditer(r'<h[23] id="([^"]+)"|<strong>([^<]{2,60})</strong> \(<span class="term-en">([^<]{2,60})</span>\)', article):
        if m.group(1):
            last_id = m.group(1)
            continue
        kz, en = html.unescape(m.group(2)).strip(), html.unescape(m.group(3)).strip()
        terms.append({"kz": kz, "en": en, "url": f"{meta['url']}#{last_id}", "src": meta["num"]})
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


def build_cheatsheet(entries):
    """Әр лекцияның «Қорытынды» бөлімінен бір беттік шпаргалка."""
    tpl = (ROOT / "about.html").read_text(encoding="utf-8")
    top = tpl[:tpl.index('<div class="layout')]
    top = re.sub(r"<!-- build:head -->.*?<!-- /build:head -->", "", top, flags=re.S)
    top = re.sub(r"<title>.*?</title>", "<title>Шпаргалка - CS50 қазақша</title>", top)
    top = top.replace('<meta name="author"', '<meta name="description" content="CS50 қазақша: барлық 12 лекцияның қысқаша конспектісі бір бетте, басып шығаруға ыңғайлы.">\n  <meta name="author"', 1)
    foot = tpl[tpl.index("  <footer"):]
    cards = "\n".join(
        f'''      <section class="cs-card" id="{m["id"]}">
        <h2><span>{html.escape(m["num"])}</span> {html.escape(m["title"])}</h2>
        {ul}
        <a class="cs-more" href="{m["url"]}">Толық лекция →</a>
      </section>''' for m, ul in entries)
    page = top + f"""<div class="layout single wide">
    <article class="content cheatsheet">
      <div class="lecture-head">
        <div class="num">Шпаргалка</div>
        <h1>Бүкіл курс бір бетте</h1>
        <p>Әр лекцияның ең маңызды ұғымдары мен синтаксисі. Емтиханға не тапсырмаға дайындалғанда қолданыңыз. Басып шығаруға ыңғайлы.</p>
        <button type="button" class="btn gold cs-print" onclick="print()">🖨 Басып шығару / PDF</button>
      </div>
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
            seen[key] = t
    items = sorted(seen.values(), key=lambda t: kz_key(t["kz"]))
    (ROOT / "assets/data/glossary.js").write_text(
        "window.CS50KZ_GLOSSARY = " + json.dumps(items, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    letters = []
    rows = []
    for t in items:
        letter = kz_letter(t["kz"])
        if letter not in letters:
            letters.append(letter)
            rows.append(f'      <h2 class="g-letter" id="l-{len(letters)}">{html.escape(letter)}</h2>')
        rows.append(
            f'      <div class="g-row" data-q="{html.escape((t["kz"] + " " + t["en"]).lower())}">'
            f'<span class="g-kz">{html.escape(t["kz"])}</span>'
            f'<span class="g-en">{html.escape(t["en"])}</span>'
            f'<a class="g-src" href="{t["url"]}">{html.escape(t["src"])} →</a></div>')
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
        <p>Лекциялардағы {len(items)} информатика термині: қазақшасы, ағылшыншасы және алғаш түсіндірілген жері.</p>
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
        sm = re.search(r'<h2 id="summary">.*?</h2>\s*(<ul>.*?</ul>|<table>.*?</table>)', s, re.S)
        if sm:
            sheets.append((meta, sm.group(1)))
    build_cheatsheet(sheets)
    # Қосымша курстар: лекциялар (../../), курс беті (../), іздеу мен сөздікке қосу
    course_pages = []
    for code, c in COURSES.items():
        clist = []
        for name in c["order"]:
            p = ROOT / code / "lectures" / f"{name}.html"
            if not p.exists():
                continue
            s = process_page(p, "../../", "courses")
            meta = lecture_meta(name, s, f"{code}/lectures/{name}.html")
            clist.append(meta)
            labeled = dict(meta, num=f'{c["short"]} · {meta["num"]}')
            index += sections(name, s, labeled)
            terms += glossary_terms(name, s, labeled)
            course_pages.append(meta["url"])
        if (ROOT / code / "index.html").exists():
            process_page(ROOT / code / "index.html", "../", "courses")
            course_pages.append(f"{code}/")
        (ROOT / code / "data").mkdir(exist_ok=True)
        (ROOT / code / "data" / "lectures.js").write_text(
            f"window.CS50KZ_COURSE_LECTURES = window.CS50KZ_COURSE_LECTURES || {{}};\nwindow.CS50KZ_COURSE_LECTURES[{json.dumps(code)}] = "
            + json.dumps(clist, ensure_ascii=False, indent=1) + ";\n", encoding="utf-8")
    n = build_glossary(terms)
    for page, active in [("index.html", "index"), ("about.html", "about"),
                         ("glossary.html", "glossary"), ("certificate.html", ""),
                         ("playground.html", "playground"), ("practice.html", "practice"),
                         ("flashcards.html", "practice"), ("viz.html", "practice"),
                         ("teacher.html", ""), ("404.html", ""), ("cheatsheet.html", "practice"),
                         ("debug.html", "practice"), ("map.html", "practice"),
                         ("detective.html", "practice"), ("flask.html", "practice"), ("exam.html", "practice"), ("profile.html", "profile"), ("alash.html", "about"), ("courses.html", "courses")]:
        if (ROOT / page).exists():
            process_page(ROOT / page, "", active)
    (ROOT / "assets/data/lectures.js").write_text(
        "window.CS50KZ_LECTURES = " + json.dumps(lectures, ensure_ascii=False, indent=1) + ";\n", encoding="utf-8")
    (ROOT / "assets/data/search-index.js").write_text(
        "window.CS50KZ_INDEX = " + json.dumps(index, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    (ROOT / "assets/data/quiz.js").write_text(
        "window.CS50KZ_QUIZ = " + json.dumps(quiz, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    pages = ["", "practice.html", "playground.html", "viz.html", "flashcards.html", "glossary.html",
             "certificate.html", "teacher.html", "about.html", "cheatsheet.html", "debug.html", "map.html", "detective.html", "flask.html", "exam.html", "profile.html", "alash.html", "courses.html"] + [l["url"] for l in lectures] + course_pages
    (ROOT / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
        "".join(f"  <url><loc>{SITE_URL}{u}</loc></url>\n" for u in pages) + "</urlset>\n", encoding="utf-8")
    (ROOT / "robots.txt").write_text(f"User-agent: *\nAllow: /\nSitemap: {SITE_URL}sitemap.xml\n", encoding="utf-8")
    print(f"{len(lectures)} лекция, {len(index)} бөлім, {n} термин, {len(quiz)} сұрақ")


if __name__ == "__main__":
    main()
