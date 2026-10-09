#!/usr/bin/env python3
"""Бір реттік генератор: sql/, ai/, web/ курс беттерінің index.html файлдарын python/index.html үлгісінен жасайды.
Қайта іске қосуға болады (файлдарды қайта жазады). Содан кейін python3 tools/build.py іске қосыңыз."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TPL = (ROOT / "python" / "index.html").read_text(encoding="utf-8")

ICONS = {
    "db": '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
    "link": '<path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/>',
    "plan": '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 17.5h7M17.5 14v7"/>',
    "write": '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    "eye": '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    "bolt": '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    "scale": '<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>',
    "search": '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
    "book": '<path d="M4 5a2 2 0 0 1 2-2h5v16H6a2 2 0 0 0-2 2z"/><path d="M20 5a2 2 0 0 0-2-2h-5v16h5a2 2 0 0 1 2 2z"/>',
    "dice": '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1"/><circle cx="16" cy="16" r="1"/><circle cx="12" cy="12" r="1"/>',
    "peak": '<path d="m3 20 6-11 4 6 3-4 5 9z"/>',
    "brain": '<circle cx="6" cy="6" r="2"/><circle cx="6" cy="18" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="18" cy="18" r="2"/><path d="M8 6l8 0M8 18h8M7.5 7.5l3 3M7.5 16.5l3-3M13.5 10.5l3-3M13.5 13.5l3 3"/>',
    "chat": '<path d="M21 12a8 8 0 0 1-11.5 7.2L3 21l1.8-6.2A8 8 0 1 1 21 12z"/>',
    "code": '<path d="M8 6 3 12l5 6"/><path d="m16 6 5 6-5 6"/><path d="m13.5 4-3 16"/>',
    "branch": '<circle cx="6" cy="5" r="2"/><circle cx="6" cy="19" r="2"/><circle cx="18" cy="9" r="2"/><path d="M6 7v10M18 11c0 4-6 3-12 6"/>',
    "py": '<path d="M12 3c-4 0-5 2-5 4v2h5v1H5c-2 0-3 2-3 4s1 4 3 4h2v-3c0-2 2-4 4-4h4c2 0 3-1 3-3V7c0-2-2-4-6-4z"/>',
    "globe": '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c-3 3-4 6-4 9s1 6 4 9M12 3c3 3 4 6 4 9s-1 6-4 9"/>',
    "db2": '<path d="M4 7c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3z"/><path d="M4 7v10c0 1.7 3.6 3 8 3s8-1.3 8-3V7"/>',
    "js": '<path d="M3 3h18v18H3z"/><path d="M12 11v5a2 2 0 0 1-4 0M17 14c0-1-3-1-3 .6S17 15 17 17s-3 2-3 .8"/>',
    "ui": '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 4v5"/>',
    "check": '<path d="M9 12l2 2 4-4"/><path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6z"/>',
    "cloud": '<path d="M7 18a5 5 0 1 1 1-9.9A6 6 0 0 1 19.5 10 4 4 0 0 1 19 18z"/>',
}

COURSE = {
    "sql": dict(
        short="CS50 SQL", color="#7c3aed", c2="#3b1a78", glow="rgb(167 139 250 / .35)", title="Дерекқорлар", accent="SQL",
        h1='Дерекқорлар және <span>SQL</span>', url="https://cs50.harvard.edu/sql/",
        intro="Деректерді сақтау, іздеу және басқару өнері: бір кестеден бастап миллиондаған жолды масштабтауға дейін. Сұраулардың бәрі осы беттің өзінде нағыз SQLite-та орындалады.",
        meta="Гарвардтың CS50 SQL курсы қазақ тілінде: сұраулар, кестелерді байланыстыру, дерекқорды жобалау, индекстер, масштабтау.",
        stats=[("7", "лекция"), ("18", "тапсырма"), ("0", "орнату")],
        win=("queries.sql",
             '<span class="k">SELECT</span> title, year\n<span class="k">FROM</span> shows\n<span class="k">WHERE</span> genre = <span class="s">\'Comedy\'</span>\n<span class="k">ORDER BY</span> year <span class="k">DESC</span>\n<span class="k">LIMIT</span> 3;',
             '<span class="p">sqlite&gt;</span> .read queries.sql<br>title&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;year<br>----------&nbsp;&nbsp;----<br><b>The Office&nbsp;&nbsp;2005</b><br>Parks&amp;Rec&nbsp;&nbsp;&nbsp;2009<span class="cur"></span>'),
        callout=("CS50x-тің 7-аптасында SQL-ді көрдіңіз бе?", "Онда негізгі сұраулармен таныссыз (CS50x <a href=\"../lectures/week-7.html\">7-апта: SQL</a>). Бұл курста сіз бір қадам алға барасыз: кестелерді байланыстыру, дерекқорды өзіңіз жобалау, индекстер мен масштабтау. Сертификаты бөлек."),
        weeks=[
            ("Сұраулар", "SELECT, WHERE, LIKE, ORDER BY, LIMIT, GROUP BY: деректерден жауап алу.", "db"),
            ("Байланыстар", "Кілттер, ER-диаграммалар, JOIN, бір-біріне, біреуден көпке, көптен көпке.", "link"),
            ("Жобалау", "Схема жасау, типтер, нормалау, шектеулер, SQLite тілі.", "plan"),
            ("Жазу", "INSERT, UPDATE, DELETE, тізбектеп өзгертулер, транзакциялар.", "write"),
            ("Көріністер", "VIEW, CTE, бөлектеу, агрегаттар: күрделі сұрауды жеңілдету.", "eye"),
            ("Оңтайландыру", "Индекстер, B-ағаш, сұрау жоспары, жылдамдықты өлшеу.", "bolt"),
            ("Масштабтау", "MySQL, репликация, шардинг, қауіпсіздік және SQL-инъекция.", "scale"),
        ]),
    "ai": dict(
        short="CS50 AI", color="#c42a68", c2="#5e1239", glow="rgb(251 113 160 / .3)", title="Жасанды интеллект", accent="AI",
        h1='Жасанды <span>интеллект</span>', url="https://cs50.harvard.edu/ai/",
        intro="Компьютер қалай ойланады? Іздеу алгоритмдерінен нейрон желілер мен тіл модельдеріне дейінгі идеялар, түсінікті мысалдармен және Python-мен.",
        meta="Гарвардтың CS50 AI курсы қазақ тілінде: іздеу, білім, ықтималдық, оңтайландыру, машиналық оқыту, нейрон желілер, тіл.",
        stats=[("7", "лекция"), ("12", "жоба"), ("Python", "тілі")],
        win=("minimax.py",
             '<span class="k">def</span> <span class="f">minimax</span>(board):\n    <span class="k">if</span> <span class="f">terminal</span>(board):\n        <span class="k">return</span> <span class="f">utility</span>(board)\n    <span class="k">return</span> <span class="f">max</span>(<span class="f">min_value</span>(<span class="f">result</span>(board, a))\n               <span class="k">for</span> a <span class="k">in</span> <span class="f">actions</span>(board))',
             '<span class="p">$</span> python tictactoe.py<br>Компьютер ойланып жатыр...<br><b>Ең жақсы жүріс: (1, 1)</b><span class="cur"></span>'),
        callout=("Алдын ала не білу керек?", "Python-ды жақсы білу қажет: CS50x-тің 6-аптасы не <a href=\"../python/index.html\">CS50P</a> жеткілікті. Математика мектеп деңгейінде, қалғанын лекциялардың өзінде түсіндіреміз. Сертификаты бөлек."),
        weeks=[
            ("Іздеу", "Тереңдікке және енге іздеу, A*, minimax, альфа-бета кесу.", "search"),
            ("Білім", "Логика, шығару, модельдер, ұсыныстар логикасы.", "book"),
            ("Белгісіздік", "Ықтималдық, Байес ережесі, Байес желілері, Марков модельдері.", "dice"),
            ("Оңтайландыру", "Төбеге өрмелеу, күйдіру, сызықтық бағдарламалау, шектеулер.", "peak"),
            ("Оқыту", "Бақыланатын оқыту, жуық көрші, кластерлеу, күшейтілген оқыту.", "brain"),
            ("Нейрон желілер", "Перцептрон, кері таралу, конволюция, рекуррент желілер.", "brain"),
            ("Тіл", "Грамматика, n-граммалар, сөз векторлары, назар аудару, трансформер.", "chat"),
        ]),
    "web": dict(
        short="CS50 Web", color="#d4580c", c2="#7a2a06", glow="rgb(251 146 60 / .32)", title="Веб-бағдарламалау", accent="Web",
        h1='Веб-<span>бағдарламалау</span>', url="https://cs50.harvard.edu/web/",
        intro="Нағыз веб-қосымшаларды жасау: HTML мен CSS-тен Django, JavaScript, React-ке, тестілеуге, масштабтауға және қауіпсіздікке дейін. HTML, CSS, JS мысалдары осында бірден көрінеді.",
        meta="Гарвардтың CS50 Web курсы қазақ тілінде: HTML, CSS, Git, Python, Django, SQL, JavaScript, UI, тестілеу, масштабтау.",
        stats=[("9", "лекция"), ("5", "жоба"), ("0", "орнату")],
        win=("index.html",
             '<span class="k">&lt;h1&gt;</span>Сәлем, әлем!<span class="k">&lt;/h1&gt;</span>\n<span class="k">&lt;button</span> <span class="f">onclick</span>=<span class="s">"hello()"</span><span class="k">&gt;</span>\n    Басыңыз\n<span class="k">&lt;/button&gt;</span>',
             '<span class="p">▶</span> браузер<br><b>Сәлем, әлем!</b><br>[&nbsp;Басыңыз&nbsp;]<span class="cur"></span>'),
        callout=("Алдын ала не білу керек?", "CS50x не <a href=\"../python/index.html\">CS50P</a> курсын өткен болсаңыз, оңай болады: Python мен SQL негіздері қажет. Жобалар компьютеріңізде орындалады, ал лекциядағы HTML/CSS/JS мысалдарын осы жерде бірден көруге болады. Сертификаты бөлек."),
        weeks=[
            ("HTML, CSS", "Беттің құрылымы мен сыртқы көрінісі, селекторлар, Flexbox, Grid, Bootstrap.", "code"),
            ("Git", "Нұсқаларды басқару, GitHub, тармақтар, бірлескен жұмыс.", "branch"),
            ("Python", "Веб үшін Python: функциялар, кластар, модульдер, ерекше жағдайлар.", "py"),
            ("Django", "HTTP, URL-дер, шаблондар, формалар, сессиялар.", "globe"),
            ("SQL, модельдер", "Django модельдері, миграциялар, байланыстар, Admin.", "db2"),
            ("JavaScript", "DOM, оқиғалар, айнымалылар, функциялар, API.", "js"),
            ("Интерфейстер", "SPA, анимация, React, күй (state) және компоненттер.", "ui"),
            ("Тестілеу, CI/CD", "Модульдік тесттер, Selenium, GitHub Actions, Docker.", "check"),
            ("Масштабтау, қауіпсіздік", "Жүктемені бөлу, кэш, дерекқор, XSS, SQL-инъекция, парольдер.", "cloud"),
        ]),
}

SWITCH = [("x", "CS50x", "../index.html"), ("python", "CS50P", "../python/"), ("sql", "SQL", "../sql/"), ("ai", "AI", "../ai/"), ("web", "Web", "../web/")]


def switch(cur, up="../"):
    items = []
    for k, label, href in SWITCH:
        href = up + href[3:] if up != "../" else href
        on = ' class="on" aria-current="page"' if k == cur else ""
        items.append(f'<a{on} href="{href}">{label}</a>')
    return '<nav class="cx-switch" aria-label="Курсты таңдау">' + "".join(items) + "</nav>"


def card(i, w, c):
    title, desc, ico = w
    return f'''    <div class="week-card soon" data-id="week-{i}" style="--c:{c}">
      <span class="wc-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">{ICONS[ico]}</svg></span>
      <div class="num">{i}-апта</div>
      <h3>{title}</h3>
      <p>{desc}</p>
      <div class="status">Жақында</div>
    </div>'''


for code, c in COURSE.items():
    s = TPL
    s = re.sub(r"<title>.*?</title>", f"<title>{c['short']}: {c['title']} - CS50 қазақша</title>", s, count=1)
    s = re.sub(r'(<meta property="og:title" content=")[^"]*', rf"\g<1>{c['short']}: {c['title']} - CS50 қазақша", s)
    s = re.sub(r'(<meta property="og:description" content=")[^"]*', rf"\g<1>{c['meta']}", s)
    s = s.replace("python/index.html", f"{code}/index.html")
    s = s.replace('<body data-course="python">', f'<body data-course="{code}">')
    s = s.replace('<meta name="author"', f'<meta name="description" content="{c["meta"]}">\n  <meta name="author"', 1) if 'name="description"' not in s else re.sub(r'(<meta name="description" content=")[^"]*', rf"\g<1>{c['meta']}", s)
    fname, code_html, out_html = c["win"]
    hero = f'''<section class="py-hero" data-c="{code}" style="--hc:{c['color']};--hc2:{c['c2']};--hglow:{c['glow']}">
        <div class="py-hero-text">
          {switch(code)}
          <span class="cx-eyebrow">Гарвард университеті · {c['short']}</span>
          <h1>{c['h1']}</h1>
          <p>{c['intro']}</p>
          <div class="hero-actions">
            <a class="btn gold" href="lectures/week-0.html">Бастау: 0-апта <span aria-hidden="true">→</span></a>
            <a class="btn ghost" href="{c['url']}" target="_blank" rel="noopener">Түпнұсқа курс</a>
          </div>
          <div class="cx-stats">
            {"".join(f"<div><b>{a}</b><span>{b}</span></div>" for a, b in c['stats'])}
          </div>
        </div>
        <div class="py-win" aria-hidden="true">
          <div class="py-win-bar"><i></i><i></i><i></i><span>{fname}</span></div>
<pre class="py-win-code">{code_html}</pre>
          <div class="py-win-out">{out_html}</div>
        </div>
      </section>'''
    cards = "\n".join(card(i, w, c["color"]) for i, w in enumerate(c["weeks"]))
    article = f'''<article class="content course-home" id="main">
      {hero}
      <div class="course-progress" aria-live="polite"></div>
      <div class="callout tip">
        <span class="callout-title">{c['callout'][0]}</span>
        <p>{c['callout'][1]}</p>
      </div>
      <h2 id="weeks">Лекциялар</h2>
      <div class="weeks course-weeks">
{cards}
      </div>
      <p class="translator-note">{c['short']} (Гарвард университеті, David J. Malan) курсының қазақша аудармасы. Аударған: Sagid Mustafa. Лицензия: CC BY-NC-SA 4.0.</p>
    </article>'''
    s = re.sub(r'<article class="content course-home" id="main">.*?</article>', lambda _: article, s, count=1, flags=re.S)
    (ROOT / code).mkdir(exist_ok=True)
    (ROOT / code / "index.html").write_text(s, encoding="utf-8")
    print(code, "OK")
