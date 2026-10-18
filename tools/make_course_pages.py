#!/usr/bin/env python3
# © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама (LICENSE-PROPRIETARY.md, COPYRIGHT.md).
# Harvard CS50 материалдары (олар осы файлда сақталмайды) CC BY-NC-SA 4.0 бойынша; үшінші тарап компоненттері өз лицензияларымен.
"""Бір реттік генератор: sql/, ai/, web/ (Harvard аудармасы) және cpp/, java/ (дербес авторлық курстар) курс беттерінің
index.html файлдарын python/index.html үлгісінен жасайды.
Қайта іске қосуға болады (файлдарды қайта жазады). Содан кейін python3 tools/build.py іске қосыңыз.
Қолданылуы:  python3 tools/make_course_pages.py [код ...]   (кодсыз - бәрі: sql ai web cpp java)
Назар: sql/ai/web беттерін қайта жазу олардың қолмен өзгерістерін өшіреді; тек cpp/java үшін:  make_course_pages.py cpp java"""
import re
import sys
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
        stats=[("7", "лекция"), ("18", "тапсырма"), ("0", "орнату керек")],
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
        stats=[("9", "лекция"), ("5", "жоба"), ("0", "орнату керек")],
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

SWITCH = [("x", "CS50x", "../index.html"), ("python", "CS50P", "../python/"), ("sql", "SQL", "../sql/"), ("ai", "AI", "../ai/"), ("web", "Web", "../web/"), ("cpp", "C++", "../cpp/"), ("java", "Java", "../java/")]


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


WANT = sys.argv[1:]
for code, c in COURSE.items():
    if WANT and code not in WANT:
        continue
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
            <a class="btn ghost" href="../exam.html?course={code}">📝 Қорытынды емтихан</a>
            <a class="btn ghost" href="../map.html?course={code}">🗺 Курс картасы</a>
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
      <p class="translator-note">{c['short']} (Гарвард университеті, David J. Malan) курсының қазақша аудармасы. Аударған: Sagid Mustafa. Аударма мен бейімдеу: CC BY-NC-SA 4.0 (түпнұсқа: Harvard CS50). Сайт кодының дизайны мен бағдарламасы - © 2026 Sagid Mustafa, барлық құқықтар қорғалған. <a href="../copyright.html">Авторлық құқық және лицензиялар</a>.</p>
    </article>'''
    s = re.sub(r'<article class="content course-home" id="main">.*?</article>', lambda _: article, s, count=1, flags=re.S)
    (ROOT / code).mkdir(exist_ok=True)
    (ROOT / code / "index.html").write_text(s, encoding="utf-8")
    print(code, "OK")


# ======================================================================================================
# Дербес авторлық курстар (Sagid Mustafa): cpp/, java/ - Harvard аудармасы ЕМЕС, лицензиясы «B».
# Апта карточкаларының атаулары мен сипаттамасы - бастапқы жоспар: build.py лекция файлы пайда болғанда
# оларды лекцияның өз h1 және кіріспе сөйлемімен автоматты түрде ауыстырады (sync_own_cards).
# ======================================================================================================
OWN = {
    "cpp": dict(
        short="C++", color="#4f46e5", c2="#2e2a8a", glow="rgb(129 140 248 / .38)", title="C++ бағдарламалау", accent="C++",
        h1='C++ <span>бағдарламалау</span>',
        intro="Жылдамдығы мен күші үшін ойындарда, операциялық жүйелерде, робототехникада қолданылатын тілді нөлден үйреніңіз: жад пен көрсеткіштерден ООП, STL және шаблондарға дейін, соңында өз жобаңызбен.",
        meta="C++ бағдарламалау: авторлық қазақша курс. Жад пен көрсеткіштер, ООП, STL, шаблондар және өз жобаң. 8 лекция, тесттер, жаттығулар.",
        stats=[("8", "лекция"), ("64", "тест сұрағы"), ("1", "жоба")],
        win=("main.cpp",
             '<span class="k">#include</span> &lt;iostream&gt;\n<span class="k">#include</span> &lt;string&gt;\n<span class="k">#include</span> &lt;vector&gt;\n\n<span class="k">int</span> <span class="f">main</span>() {\n    std::vector&lt;std::string&gt; qalalar = {<span class="s">"Астана"</span>, <span class="s">"Алматы"</span>, <span class="s">"Шымкент"</span>};\n    <span class="k">for</span> (<span class="k">const auto</span>&amp; q : qalalar) {\n        std::cout &lt;&lt; <span class="s">"Сәлем, "</span> &lt;&lt; q &lt;&lt; <span class="s">"!\\n"</span>;\n    }\n}',
             '<span class="p">$</span> g++ -std=c++17 main.cpp -o main &amp;&amp; ./main<br><b>Сәлем, Астана!</b><br>Сәлем, Алматы!<br>Сәлем, Шымкент!<span class="cur"></span>'),
        callout=("Алдын ала не білу керек?", "Ештеңе керек емес: курс нөлден басталады. Компьютерде мәтіндік файл ашып, терминалды іске қосуды білсеңіз жеткілікті. Басқа тілде (Python, Scratch) жазған болсаңыз, бастапқы апталар жылдамырақ өтеді. Сертификаты бөлек."),
        weeks=[
            ("Алғашқы бағдарлама", "Компиляция, cout және cin, айнымалылар, негізгі типтер, арифметика.", "code"),
            ("Шарттар мен циклдер", "if, switch, while, for: бағдарламаға шешім қабылдатуды және қайталауды үйрету.", "branch"),
            ("Функциялар", "Функция жариялау, параметрлер, мәнін қайтару, аса жүктеу, рекурсия.", "plan"),
            ("Жад пен көрсеткіштер", "Массив, адрес, көрсеткіш, сілтеме, new және delete, стек пен үйме.", "peak"),
            ("Кластар мен нысандар", "Класс, конструктор, деструктор, инкапсуляция, мүше функциялар.", "dice"),
            ("Мұрагерлік, полиморфизм", "Базалық және туынды класс, виртуал функциялар, абстрактілі класс.", "link"),
            ("STL", "vector, map, set, алгоритмдер, итераторлар, lambda өрнектері.", "book"),
            ("Шаблондар және жоба", "Шаблон функциялар мен кластар, ерекше жағдайлар, файлдар, қорытынды жоба.", "check"),
        ],
        outcomes=[
            ("Компиляторды қолдану", "Кодты g++ арқылы жинап, ескертулер мен қателерді оқып, түзетуді үйренесіз."),
            ("Жадты түсіну", "Стек пен үймені, адрес пен көрсеткішті, сілтемені және жадты дұрыс босатуды нақты көресіз."),
            ("ООП-ты қолдану", "Класстар, инкапсуляция, мұрагерлік және полиморфизммен нысандық модель құрасыз."),
            ("STL-мен жұмыс", "vector, map, set және стандартты алгоритмдерді қолданып, қысқа әрі жылдам код жазасыз."),
            ("Шаблондарды жазу", "Бір рет жазып, кез келген типке жұмыс істейтін функциялар мен кластар жасайсыз."),
            ("Өз жобаңды аяқтау", "Командалық жолмен жұмыс істейтін, файлға сақтайтын толық бағдарлама жазасыз."),
        ],
        audience=[
            ("Мектеп оқушысы", "Информатика олимпиадасына, ҰБТ-дан тыс бағдарламалауға дайындалғысы келетін 8-11 сынып оқушысы."),
            ("Студент", "ЖОО-да алгоритмдер мен деректер құрылымдары курсына дейін берік негіз қалағысы келетін бірінші курс студенті."),
            ("Қайта бастаушы", "Python не JavaScript білетін, компьютер жадының қалай жұмыс істейтінін ішінен көргісі келетін адам."),
        ],
        install=[
            ("Windows", ["<a href=\"https://www.msys2.org/\" target=\"_blank\" rel=\"noopener\">MSYS2</a> орнатқышын жүктеп, орнатыңыз.", "MSYS2 UCRT64 терминалында: <code>pacman -S mingw-w64-ucrt-x86_64-gcc</code>", "<code>C:\\msys64\\ucrt64\\bin</code> жолын PATH айнымалысына қосыңыз.", "Жаңа терминал ашып тексеріңіз: <code>g++ --version</code>"]),
            ("macOS", ["Терминалда: <code>xcode-select --install</code> (Apple компиляторлар жинағы).", "Тексеру: <code>g++ --version</code> (ол іс жүзінде clang, бізге жеткілікті)."]),
            ("Linux", ["Ubuntu/Debian: <code>sudo apt install g++</code>", "Fedora: <code>sudo dnf install gcc-c++</code>", "Тексеру: <code>g++ --version</code>"]),
            ("VS Code", ["<a href=\"https://code.visualstudio.com/\" target=\"_blank\" rel=\"noopener\">VS Code</a> орнатып, «C/C++» (Microsoft) кеңейтімін қосыңыз.", "Жаңа қалта ашып, <code>main.cpp</code> жасаңыз, кодты жазыңыз.", "Ішкі терминалда (<kbd>Ctrl</kbd>+<kbd>`</kbd>) іске қосыңыз."]),
        ],
        run="g++ -std=c++17 -Wall -Wextra main.cpp -o main &amp;&amp; ./main",
        run_note="Windows PowerShell-де соңғы бөлігі <code>.\\main.exe</code> болады.",
        project=("Жоба: «Шаңырақ дүкені» қойма есебі",
                 "Соңғы аптада аяқтайтын өз жобаңыз: консольде жұмыс істейтін қойма мен сатылым бағдарламасы. Тауарлар класстармен сипатталады, тізім vector пен map-та сақталады, мәліметтер файлға жазылып, келесі іске қосуда қайта оқылады.",
                 ["Тауар, Қойма және Сатылым кластары (инкапсуляция мен мұрагерлік)", "STL контейнерлері мен сұрыптау алгоритмдері", "Файлға сақтау және оқу, дұрыс емес енгізуді ұстау", "Шаблон функциямен жалпы есеп беру", "Өзіңіз қалаған қосымша мүмкіндік (мысалы, тенгемен баға жеңілдігі)"],
                 "Жобаны өз компьютеріңізде жазып, лекциядағы өзін-өзі тексеру тізімі бойынша тексересіз. Автотексеретін жүйе жоқ: өзіңіз бағалап, алған біліміңізді мақтанышпен көрсетесіз."),
    ),
    "java": dict(
        short="Java", color="#d97706", c2="#8a4a04", glow="rgb(251 191 36 / .34)", title="Java бағдарламалау", accent="Java",
        h1='Java <span>бағдарламалау</span>',
        intro="Банктерде, Android-қосымшаларда, ірі серверлерде жұмыс істейтін тілді нөлден үйреніңіз: нысандар мен интерфейстерден Collections, Stream API және көп ағынға дейін, соңында өз жобаңызбен.",
        meta="Java бағдарламалау: авторлық қазақша курс. Нысандар, интерфейстер, Collections, Stream API, көп ағын және өз жобаң. 8 лекция, тесттер, жаттығулар.",
        stats=[("8", "лекция"), ("64", "тест сұрағы"), ("1", "жоба")],
        win=("Main.java",
             '<span class="k">import</span> java.util.List;\n\n<span class="k">public class</span> <span class="f">Main</span> {\n    <span class="k">public static void</span> <span class="f">main</span>(String[] args) {\n        List&lt;String&gt; qalalar = List.<span class="f">of</span>(<span class="s">"Астана"</span>, <span class="s">"Алматы"</span>, <span class="s">"Шымкент"</span>);\n        qalalar.<span class="f">stream</span>()\n               .<span class="f">map</span>(q -&gt; <span class="s">"Сәлем, "</span> + q + <span class="s">"!"</span>)\n               .<span class="f">forEach</span>(System.out::println);\n    }\n}',
             '<span class="p">$</span> javac Main.java &amp;&amp; java Main<br><b>Сәлем, Астана!</b><br>Сәлем, Алматы!<br>Сәлем, Шымкент!<span class="cur"></span>'),
        callout=("Алдын ала не білу керек?", "Ештеңе керек емес: курс нөлден басталады. Мәтіндік файл жасап, терминалды ашуды білсеңіз жеткілікті. Бұрын Python не C++ жазған болсаңыз, алғашқы апталар жылдамырақ өтеді. Сертификаты бөлек."),
        weeks=[
            ("Алғашқы бағдарлама", "JDK, javac және java, System.out, Scanner, айнымалылар, негізгі типтер.", "code"),
            ("Шарттар мен циклдер", "if, switch, while, for: бағдарламаға шешім қабылдатуды және қайталауды үйрету.", "branch"),
            ("Әдістер мен массивтер", "Әдіс жариялау, параметрлер, массивтер, жолдар, String әдістері.", "plan"),
            ("Кластар мен нысандар", "Класс, нысан, конструктор, инкапсуляция, static, this.", "dice"),
            ("Мұрагерлік, интерфейстер", "extends, override, абстрактілі класс, interface, полиморфизм.", "link"),
            ("Collections", "ArrayList, HashMap, HashSet, Comparator, жалпылама типтер (generics).", "book"),
            ("Lambda және Stream API", "Lambda өрнектері, filter, map, reduce, жинақтау, Optional.", "bolt"),
            ("Көп ағын және жоба", "Ерекше жағдайлар, Thread, ExecutorService, синхрондау, қорытынды жоба.", "check"),
        ],
        outcomes=[
            ("JDK-мен жұмыс", "javac пен java арқылы кодты жинап іске қосып, қателер туралы хабарларды оқуды үйренесіз."),
            ("Нысандық ойлау", "Класс, нысан, инкапсуляция, мұрагерлік және интерфейстер арқылы бағдарламаны жобалайсыз."),
            ("Collections-ты қолдану", "List, Map, Set типтерін таңдап, деректерді сұрыптап, іздеп, топтайсыз."),
            ("Stream API жазу", "Lambda мен Stream арқылы деректерді қысқа, оқылатын тізбекпен өңдейсіз."),
            ("Ерекше жағдайларды ұстау", "try, catch, finally және өз ерекше жағдайларыңызды қолданып, бағдарламаны сенімді етесіз."),
            ("Өз жобаңды аяқтау", "Көп ағынды, файлмен жұмыс істейтін толық бағдарлама жазып шығасыз."),
        ],
        audience=[
            ("Мектеп оқушысы", "Информатика олимпиадасына не алғашқы кәсіби тілді таңдауға дайындалып жүрген 8-11 сынып оқушысы."),
            ("Студент", "ЖОО-да нысанға бағытталған бағдарламалау пәніне дейін берік негіз қалағысы келетін студент."),
            ("Қайта бастаушы", "Python не JavaScript білетін, қатаң типті тілде жұмыс істеуді және Android/сервер бағытын қарастыратын адам."),
        ],
        install=[
            ("Windows", ["<a href=\"https://adoptium.net/\" target=\"_blank\" rel=\"noopener\">Adoptium Temurin</a> сайтынан JDK 17 (не жаңасы) .msi орнатқышын жүктеңіз.", "Орнату кезінде «Set JAVA_HOME» және «Add to PATH» опцияларын қосыңыз.", "Жаңа терминалда тексеріңіз: <code>javac -version</code>"]),
            ("macOS", ["Homebrew бар болса: <code>brew install openjdk</code> (кейін экранда шыққан нұсқаулық бойынша PATH-қа қосыңыз).", "Не Adoptium Temurin .pkg орнатқышын жүктеңіз.", "Тексеру: <code>javac -version</code>"]),
            ("Linux", ["Ubuntu/Debian: <code>sudo apt install default-jdk</code>", "Fedora: <code>sudo dnf install java-latest-openjdk-devel</code>", "Тексеру: <code>javac -version</code>"]),
            ("VS Code", ["<a href=\"https://code.visualstudio.com/\" target=\"_blank\" rel=\"noopener\">VS Code</a> орнатып, «Extension Pack for Java» кеңейтімін қосыңыз.", "Жаңа қалта ашып, <code>Main.java</code> жасаңыз, кодты жазыңыз.", "Ішкі терминалда (<kbd>Ctrl</kbd>+<kbd>`</kbd>) іске қосыңыз."]),
        ],
        run="javac Main.java &amp;&amp; java Main",
        run_note="Файл атауы мен public класс атауы бірдей болуы керек: Main.java ішінде <code>public class Main</code>.",
        project=("Жоба: «Домбыра үйірмесі» оқушылар тізімі",
                 "Соңғы аптада аяқтайтын өз жобаңыз: үйірме мүшелерінің тізімін жүргізетін консольдік бағдарлама. Оқушылар нысан ретінде сипатталады, Collections-та сақталады, Stream арқылы есеп шығады, ал ауыр жұмыс бөлек ағында орындалады.",
                 ["Оқушы, Үйірме және Есеп кластары мен интерфейстері", "ArrayList пен HashMap, Comparator арқылы сұрыптау", "Stream API арқылы орташа жас, топтау, сүзу есептері", "Файлға сақтау, дұрыс емес енгізуді ерекше жағдаймен ұстау", "ExecutorService арқылы бөлек ағында жасалатын есеп"],
                 "Жобаны өз компьютеріңізде жазып, лекциядағы өзін-өзі тексеру тізімі бойынша тексересіз. Автотексеретін жүйе жоқ: өзіңіз бағалап, алған біліміңізді мақтанышпен көрсетесіз."),
    ),
}

OWN_NOTE = ('Бұл курс - Sagid Mustafa-ның авторлық оқу материалы: Harvard CS50 курсының аудармасы емес, онан мәтін алынбаған. '
            'Оқыту тәсілі (түсіндірме, тапсырма, тест, ойын) CS50 стилінен шабыттанған. © 2026 Sagid Mustafa, барлық құқықтар қорғалған. '
            '<a href="../copyright.html">Авторлық құқық және лицензиялар</a>.')


def own_card(i, w, c):
    title, desc, ico = w
    return f'''    <div class="week-card soon" data-id="week-{i}" style="--c:{c}">
      <span class="wc-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">{ICONS[ico]}</svg></span>
      <div class="num">{i}-апта</div>
      <h3>{title}</h3>
      <p>{desc}</p>
      <div class="status">Жақында</div>
    </div>'''


def own_article(code, c):
    hero = f'''<section class="py-hero oc-hero" data-c="{code}" style="--hc:{c['color']};--hc2:{c['c2']};--hglow:{c['glow']}">
        <div class="py-hero-text">
          {switch(code)}
          <span class="cx-eyebrow">Авторлық курс · Sagid Mustafa</span>
          <h1>{c['h1']}</h1>
          <p>{c['intro']}</p>
          <div class="hero-actions">
            <a class="btn gold" href="lectures/week-0.html">Бастау: 0-апта <span aria-hidden="true">→</span></a>
            <a class="btn ghost" href="#project">Қорытынды жоба</a>
            <a class="btn ghost" href="../exam.html?course={code}">📝 Қорытынды емтихан</a>
            <a class="btn ghost" href="../map.html?course={code}">🗺 Курс картасы</a>
          </div>
          <div class="cx-stats">
            {"".join(f"<div><b>{a}</b><span>{b}</span></div>" for a, b in c['stats'])}
          </div>
        </div>
        <div class="py-win" aria-hidden="true">
          <div class="py-win-bar"><i></i><i></i><i></i><span>{c['win'][0]}</span></div>
<pre class="py-win-code">{c['win'][1]}</pre>
          <div class="py-win-out">{c['win'][2]}</div>
        </div>
      </section>'''
    cards = "\n".join(own_card(i, w, c["color"]) for i, w in enumerate(c["weeks"]))
    outcomes = "\n".join(f'          <li><span class="oc-n" aria-hidden="true">{i + 1}</span><div><b>{t}</b><p>{d}</p></div></li>' for i, (t, d) in enumerate(c["outcomes"]))
    audience = "\n".join(f'        <div class="oc-card"><h3>{t}</h3><p>{d}</p></div>' for t, d in c["audience"])
    inst = "\n".join(
        f'''        <details class="oc-os"{" open" if k == 0 else ""}>
          <summary>{name}</summary>
          <ol>{"".join(f"<li>{x}</li>" for x in steps)}</ol>
        </details>''' for k, (name, steps) in enumerate(c["install"]))
    ptitle, pintro, pfeat, pnote = c["project"]
    feats = "".join(f"<li>{x}</li>" for x in pfeat)
    return f'''<article class="content course-home own-course" id="main">
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
      <section class="oc-block" aria-labelledby="outcomes">
        <h2 id="outcomes">Бұл курстан не үйренесің</h2>
        <ul class="oc-outcomes">
{outcomes}
        </ul>
      </section>
      <section class="oc-block" aria-labelledby="audience">
        <h2 id="audience">Кімге арналған</h2>
        <div class="oc-cards">
{audience}
        </div>
      </section>
      <section class="oc-block" aria-labelledby="how">
        <h2 id="how">Қалай оқу керек</h2>
        <p>Бұл курста код браузерде емес, <b>өз компьютеріңізде</b> орындалады: бұл нағыз бағдарламашының жұмыс орнына ұқсас. Әр лекциямен былай жұмыс істеңіз:</p>
        <ol class="oc-steps">
          <li><b>Оқыңыз.</b> Лекцияны асықпай оқып, әр код мысалын өз файлыңызға көшірмей, қолмен теріңіз.</li>
          <li><b>Іске қосыңыз.</b> Нәтижені лекциядағы терминал блогымен салыстырыңыз. Қате шықса, оны оқыңыз: ол көмектеседі.</li>
          <li><b>Жаттығыңыз.</b> Тапсырмаларды алдымен өзіңіз шешіңіз, кеңесті кейін ашыңыз, шешімді соңғы кезекте қараңыз.</li>
          <li><b>Тексеріңіз.</b> 8 сұрақтық тестті тапсырып, «Оқыдым ✓» батырмасын басыңыз: прогресіңіз сақталады.</li>
        </ol>
        <h3 id="install">Компьютеріңе орнату (қысқаша)</h3>
        <div class="oc-installs">
{inst}
        </div>
        <p class="oc-run"><span>Іске қосу командасы:</span> <code>{c['run']}</code></p>
        <p class="oc-note">{c['run_note']}</p>
      </section>
      <section class="oc-block oc-project" id="project" aria-labelledby="project-h">
        <h2 id="project-h">{ptitle}</h2>
        <p>{pintro}</p>
        <ul class="oc-feats">{feats}</ul>
        <p class="oc-note">{pnote}</p>
      </section>
      <p class="translator-note">{OWN_NOTE}</p>
    </article>'''


for code, c in OWN.items():
    if WANT and code not in WANT:
        continue
    s = TPL
    s = re.sub(r"<title>.*?</title>", f"<title>{c['short']}: {c['title']} - CS50 қазақша</title>", s, count=1)
    s = re.sub(r'(<meta property="og:title" content=")[^"]*', rf"\g<1>{c['short']}: {c['title']} - CS50 қазақша", s)
    s = re.sub(r'(<meta property="og:description" content=")[^"]*', rf"\g<1>{c['meta']}", s)
    s = s.replace("python/index.html", f"{code}/index.html")
    s = s.replace('<body data-course="python">', f'<body data-course="{code}">')
    s = re.sub(r'<body data-license="[A-Z]" data-course="python">', f'<body data-license="B" data-course="{code}">', s)
    s = s.replace('<meta name="author"', f'<meta name="description" content="{c["meta"]}">\n  <meta name="author"', 1) if 'name="description"' not in s else re.sub(r'(<meta name="description" content=")[^"]*', rf"\g<1>{c['meta']}", s)
    article = own_article(code, c)
    s = re.sub(r'<article class="content course-home" id="main">.*?</article>', lambda _: article, s, count=1, flags=re.S)
    (ROOT / code).mkdir(exist_ok=True)
    (ROOT / code / "index.html").write_text(s, encoding="utf-8")
    print(code, "OK (own)")
