#!/usr/bin/env python3
"""CS50 қазақша — сайтты құрастыру скрипті.

Іске қосу (репозиторийдің түбірінен):  python3 tools/build.py

Не істейді:
  1. Әр беттің <head> бөліміне favicon, PWA манифесі, Open Graph тегтерін қосады.
  2. Барлық беттегі навигацияны бірдей етеді.
  3. assets/data/lectures.js — лекциялар тізімі (прогресс панелі үшін).
  4. assets/data/search-index.js — бүкіл сайт бойынша іздеу индексі.
  5. glossary.html — лекциялардағы терминдерден қазақша–ағылшынша сөздік.
Скрипт идемпотентті: қайта-қайта іске қоса беруге болады.
"""
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE_URL = "https://mustafa7677.github.io/CS50MUSS/"
ORDER = [f"week-{i}" for i in range(8)] + ["ai"] + [f"week-{i}" for i in range(8, 11)]


def strip_tags(s):
    s = re.sub(r"<(script|style)\b.*?</\1>", " ", s, flags=re.S)
    s = re.sub(r"<[^>]+>", " ", s)
    return re.sub(r"\s+", " ", html.unescape(s)).strip()


def head_block(prefix, title, desc, url):
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
  <meta property="og:image" content="{SITE_URL}assets/img/og.png">
  <meta name="twitter:card" content="summary_large_image">
  <!-- /build:head -->"""


def nav_block(prefix, active):
    def item(href, label, key, extra=""):
        cls = ' class="active' + (" " + extra if extra else "") + '"' if key == active else (f' class="{extra}"' if extra else "")
        return f'<a href="{prefix}{href}"{cls}>{label}</a>'
    return f"""<nav class="nav">
        {item("index.html", "Лекциялар", "index")}
        {item("glossary.html", "Сөздік", "glossary", "hide-sm")}
        {item("about.html", "Курс туралы", "about", "hide-sm")}
        <button class="search-open" type="button" aria-label="Іздеу"><span class="ico">⌕</span><span class="label">Іздеу</span><kbd>Ctrl K</kbd></button>
        <button class="theme-toggle" type="button" aria-label="Түсті ауыстыру">☾</button>
      </nav>"""


def process_page(path, prefix, active):
    s = path.read_text(encoding="utf-8")
    title = re.search(r"<title>(.*?)</title>", s, re.S).group(1).strip()
    m = re.search(r'<meta name="description" content="([^"]*)">', s)
    desc = m.group(1) if m else "Гарвардтың CS50 курсы қазақ тілінде: лекциялар, тесттер, тапсырмалар."
    rel = path.relative_to(ROOT).as_posix()
    url = SITE_URL + ("" if rel == "index.html" else rel)
    block = head_block(prefix, title, desc, url)
    if "<!-- build:head -->" in s:
        s = re.sub(r"<!-- build:head -->.*?<!-- /build:head -->", block, s, flags=re.S)
    else:
        s = s.replace("</title>", "</title>\n  " + block, 1)
    s = re.sub(r'<nav class="nav">.*?</nav>', nav_block(prefix, active), s, count=1, flags=re.S)
    links = (f'<!-- build:footer --><p class="footer-links"><a href="{prefix}index.html">Лекциялар</a> · '
             f'<a href="{prefix}glossary.html">Сөздік</a> · <a href="{prefix}certificate.html">Сертификат</a> · '
             f'<a href="{prefix}about.html">Курс туралы</a> · '
             f'<a href="https://github.com/Mustafa7677/CS50MUSS" target="_blank" rel="noopener">GitHub</a></p><!-- /build:footer -->')
    if "<!-- build:footer -->" in s:
        s = re.sub(r"<!-- build:footer -->.*?<!-- /build:footer -->", links, s, flags=re.S)
    else:
        s = s.replace('<div class="footer-inner">', '<div class="footer-inner">\n      ' + links, 1)
    path.write_text(s, encoding="utf-8")
    return s


def lecture_meta(name, s):
    num = strip_tags(re.search(r'<div class="lecture-head">\s*<div class="num">(.*?)</div>', s, re.S).group(1))
    title = strip_tags(re.search(r"<h1>(.*?)</h1>", s, re.S).group(1))
    article = s[s.index('<article class="content">'):s.index("</article>")]
    words = len(strip_tags(article).split())
    return {"id": name, "num": num, "title": title, "url": f"lectures/{name}.html",
            "minutes": max(5, round(words / 160)),
            "quiz": article.count('class="question"'),
            "tasks": article.count('class="checklist"')}


def sections(name, s, meta):
    """Мақаланы h2/h3 бойынша бөліктерге бөлу (іздеу үшін)."""
    article = s[s.index('<article class="content">'):s.index("</article>")]
    parts = re.split(r'(<h[23] id="[^"]+">.*?</h[23]>)', article, flags=re.S)
    out = []
    for i in range(1, len(parts) - 1, 2):
        hid = re.search(r'id="([^"]+)"', parts[i]).group(1)
        heading = strip_tags(parts[i])
        body = strip_tags(re.sub(r"<pre\b.*?</pre>", " ", parts[i + 1], flags=re.S))
        out.append({"l": meta["num"] + ": " + meta["title"], "h": heading,
                    "u": f"{meta['url']}#{hid}", "t": body[:1500]})
    return out


def glossary_terms(name, s, meta):
    article = s[s.index('<article class="content">'):s.index("</article>")]
    terms = []
    last_id = "intro"
    for m in re.finditer(r'<h[23] id="([^"]+)"|<strong>([^<]{2,60})</strong> \(<span class="term-en">([^<]{2,60})</span>\)', article):
        if m.group(1):
            last_id = m.group(1)
            continue
        kz, en = html.unescape(m.group(2)).strip(), html.unescape(m.group(3)).strip()
        terms.append({"kz": kz, "en": en, "url": f"{meta['url']}#{last_id}", "src": meta["num"]})
    return terms


def build_glossary(terms):
    seen = {}
    for t in terms:
        key = t["en"].lower()
        if key not in seen:
            seen[key] = t
    items = sorted(seen.values(), key=lambda t: t["kz"].lower())
    letters = []
    rows = []
    for t in items:
        letter = t["kz"][0].upper()
        if letter not in letters:
            letters.append(letter)
            rows.append(f'      <h2 class="g-letter" id="l-{len(letters)}">{html.escape(letter)}</h2>')
        rows.append(
            f'      <div class="g-row" data-q="{html.escape((t["kz"] + " " + t["en"]).lower())}">'
            f'<span class="g-kz">{html.escape(t["kz"])}</span>'
            f'<span class="g-en">{html.escape(t["en"])}</span>'
            f'<a class="g-src" href="{t["url"]}">{html.escape(t["src"])} →</a></div>')
    tpl = (ROOT / "about.html").read_text(encoding="utf-8")
    top = tpl[:tpl.index('<div class="layout"')]
    top = re.sub(r"<title>.*?</title>", "<title>Терминдер сөздігі — CS50 қазақша</title>", top)
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
    lectures, index, terms = [], [], []
    for name in ORDER:
        p = ROOT / "lectures" / f"{name}.html"
        if not p.exists():
            continue
        s = process_page(p, "../", "index")
        meta = lecture_meta(name, s)
        lectures.append(meta)
        index += sections(name, s, meta)
        terms += glossary_terms(name, s, meta)
    n = build_glossary(terms)
    for page, active in [("index.html", "index"), ("about.html", "about"),
                         ("glossary.html", "glossary"), ("certificate.html", "")]:
        if (ROOT / page).exists():
            process_page(ROOT / page, "", active)
    (ROOT / "assets/data/lectures.js").write_text(
        "window.CS50KZ_LECTURES = " + json.dumps(lectures, ensure_ascii=False, indent=1) + ";\n", encoding="utf-8")
    (ROOT / "assets/data/search-index.js").write_text(
        "window.CS50KZ_INDEX = " + json.dumps(index, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    print(f"{len(lectures)} лекция, {len(index)} бөлім, {n} термин")


if __name__ == "__main__":
    main()
