#!/usr/bin/env python3
# © 2026 AO17 командасы. All Rights Reserved. Дербес авторлық бағдарлама (LICENSE-PROPRIETARY.md, COPYRIGHT.md).
"""AO17 «Команда»: бес автордың беттері (дерек көзі - licensing/team.json).

Жасайтыны:
  team.html            - фото-фильм (камера жалпы фотодағы әр адамға жақындайды) және бес «уық» карточкасы;
  team/<slug>.html     - жеке бет: есік ашылғандай портрет, «қолтаңба» анимациясы, сайттағы нақты ісі;
  index.html ішіндегі <!-- team:landing --> блогы - басты беттің 8-сахнасы «Бір шаңырақ - бес адам».
Беттің head/nav/footer бөлігін кейін tools/build.py (process_page) толтырады. Барлық сан - нақты есептелген сан.

    python3 tools/team_build.py      # (әдетте tools/build.py өзі шақырады)
"""
import glob
import html
import json
import math
import re
import sys
import textwrap
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
E = html.escape
TEAM = json.loads((ROOT / "licensing" / "team.json").read_text(encoding="utf-8"))
M = TEAM["members"]
KIND = {"design": ("Дизайн", "#c9505f"), "code": ("Бағдарлама", "#d9b468"), "content": ("Мазмұн", "#e8d9b8")}
FRAME_AR = 1.5   # фото-фильм кадрының пропорциясы (3:2)


def photo(slug):
    for e in ("jpg", "webp", "png"):
        if (ROOT / f"assets/img/team/{slug}.{e}").exists():
            return f"assets/img/team/{slug}.{e}"
    return None


def img_ar(rel):
    try:
        from PIL import Image
        with Image.open(ROOT / rel) as im:
            return im.width / im.height
    except Exception:   # noqa: BLE001 - Pillow жоқ болса, жалпы фотолардың пропорциясы
        return 1.5


def in_frame(rel, x, y):
    """Фотодағы нүкте (x%, y%) → кадрдағы нүкте: кадр 3:2, сурет object-fit: cover."""
    ar = img_ar(rel)
    if ar < FRAME_AR:   # сурет кадрдан «биік»: тігінен кесіледі
        k = FRAME_AR / ar
        return x, (y / 100 * k - (k - 1) / 2) * 100
    k = ar / FRAME_AR
    return (x / 100 * k - (k - 1) / 2) * 100, y


def age(m):
    return f"{m['age']} жас"


# ---------- ортақ қабық ----------
def shell(prefix, title, desc, main, scripts=""):
    hdr = (ROOT / "partners.html").read_text(encoding="utf-8")
    header = hdr[hdr.index('<header class="topbar">'):hdr.index("</header>") + len("</header>")]
    header = re.sub(r'href="(?!https?:|#|mailto:)([^"]*)"', lambda m: f'href="{prefix}{m.group(1)}"', header)
    return f"""<!DOCTYPE html>
<html lang="kk">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{E(title)}</title>
  <!-- build:head -->
  <!-- /build:head -->
  <meta name="description" content="{E(desc)}">
  <meta name="author" content="{E(TEAM['name'])}">
  <link rel="stylesheet" href="{prefix}assets/fonts/fonts.css">
  <link rel="stylesheet" href="{prefix}assets/css/style.css">
  <link rel="stylesheet" href="{prefix}assets/css/team.css">
  <script src="{prefix}assets/js/main.js"></script>
  <script src="{prefix}assets/js/team.js" defer></script>{scripts}
</head>
<body data-license="B" class="tm-body">
  <a class="skip-link" href="#main">Мазмұнға өту</a>
  {header}

{main}

  <footer class="footer"></footer>
</body>
</html>
"""


# ---------- team.html ----------
def film_shots(prefix):
    g = "assets/img/team/group-hd.jpg"
    shots = [{"img": g, "x": 50, "y": 50, "s": 1.0, "to": [50, 52, 1.06], "hold": 5200, "k": TEAM["name"], "t": "Бес адам, бір кадр",
              "d": "Камера әрқайсысына кезекпен жақындайды: солдан оңға қарай."}]
    for m in sorted(M, key=lambda m: m["face"][0]):   # кадрдағы орны бойынша - солдан оңға
        fx, fy = in_frame(g, *m["face"])
        shots.append({"img": g, "x": round(fx, 1), "y": round(fy + 9, 1), "s": 2.3, "hold": 3800, "who": m["slug"],
                      "k": f"{age(m)} · {m['role']}", "t": m["name"], "d": m["tag"]})
    shots += [
        {"img": "assets/img/team/work.jpg", "x": 52, "y": 48, "s": 1.18, "to": [48, 52, 1.0], "hold": 5200,
         "k": "Жұмыс үстінде", "t": "Бір экранға бес көз", "d": "Дизайн, код және мазмұн бір жобаға тоғысты."},
        {"img": "assets/img/team/duo.jpg", "x": 46, "y": 46, "s": 1.0, "to": [54, 44, 1.12], "hold": 5200,
         "k": "Дизайн", "t": "Kopenova Merey мен Tutkabayeva Gulzat", "d": "Алаш стилі мен оқу беттерінің интерфейсі осы екеуінің қолынан шықты."},
        {"img": g, "x": 50, "y": 50, "s": 1.12, "to": [50, 50, 1.0], "hold": 6000, "k": "AO17", "t": "Шаңырақты бір уық көтермейді",
         "d": "Әрқайсысының ісі - төменде. Бетті ашып, жақынырақ танысыңыз."},
    ]
    alts = {"group": "AO17 командасының бес мүшесі кітап сөрелерінің алдында, ортада глобус.",
            "work": "Команда ноутбук экранына қарап, бірге жұмыс істеп отыр.",
            "duo": "Дизайнерлер Kopenova Merey мен Tutkabayeva Gulzat орындықта отыр."}
    for s in shots:
        s["alt"] = alts[Path(s["img"]).stem.replace("-hd", "")]
        s["img"] = prefix + s["img"]
    return shots


def arch_card(m, prefix, i):
    k, acc = KIND[m["kind"]]
    ph = photo(m["slug"])
    face = (f'<img src="{prefix}{ph}" alt="" width="640" height="800" loading="lazy" decoding="async">' if ph
            else f'<span class="ta-ini" aria-hidden="true">{E(m["initials"])}</span>')
    return (f'<li class="ta" style="--acc:{acc};--i:{i}"><a href="{prefix}team/{m["slug"]}.html">'
            f'<span class="ta-ph">{face}<span class="ta-k">{E(k)}</span></span>'
            f'<span class="ta-n">{E(m["name"])}</span><span class="ta-r">{E(m["role"])} · {age(m)}</span>'
            f'<span class="ta-t">{E(m["tag"])}</span></a></li>')


FILM_ORDER = ["sagid", "gulzat", "dastan", "magzhan", "merey"]   # 3D фильмдегі реті (assets/js/team3d.js, T.act = 24, T.per = 11)


def film_at(slug):
    return 24 + 11 * FILM_ORDER.index(slug) + 2


DEMO = {
    "palette": '<span class="dm-sw" style="--c:#0e0a07;--i:0"></span><span class="dm-sw" style="--c:#8c2433;--i:1"></span><span class="dm-sw" style="--c:#8a6634;--i:2"></span><span class="dm-sw" style="--c:#d9b468;--i:3"></span><span class="dm-sw" style="--c:#efe6d3;--i:4"></span><b class="dm-aa">Аа</b>',
    "stats": '<span class="dm-q">2x + 5 = 17 · x = ?</span><span class="dm-o">4</span><span class="dm-o dm-ok">6</span><span class="dm-o">11</span>',
    "flow": '<span class="dm-n" style="--i:0">Мазмұн</span><span class="dm-n" style="--i:1">Жинау</span><span class="dm-n" style="--i:2">Тексеру</span><span class="dm-n" style="--i:3">Жариялау</span><span class="dm-n" style="--i:4">Оқушы</span>',
    "code": '<svg viewBox="0 0 160 70" class="dm-bal"><path class="dm-st" d="M80 64V18M64 64h32"/><g class="dm-beam"><path d="M24 18h112"/><rect x="18" y="20" width="22" height="16" rx="2"/><text x="29" y="32">x</text><circle cx="124" cy="28" r="7"/></g><circle class="dm-pv" cx="80" cy="18" r="3.5"/></svg><span class="dm-x">x = 4</span>',
    "bota": '<span class="dm-dev"><i></i><i></i><i></i></span><span class="dm-lbl">компьютер → телефон</span>',
}
DEMO_CAP = {"palette": "Палитра құрылады", "stats": "Есеп шешіледі", "flow": "Платформаның жолы", "code": "Таразы теңеседі", "bota": "Интерфейс телефонға бейімделеді"}


def panel(m, i):
    k, acc = KIND[m["kind"]]
    ph = photo(m["slug"])
    # барлығы eager: көлденең лента transform-мен жылжиды, ал Android Chrome transform ішіндегі lazy суретті кейде жүктемейді (бос арка)
    face = (f'<img src="assets/img/team/orig/{m["slug"]}.jpg" alt="{E(m["name"])}, портрет" width="960" height="1400" loading="eager" decoding="async">' if ph
            else f'<span class="ta-ini" aria-hidden="true">{E(m["initials"])}</span>')
    return (f'<li class="uyq-p" id="m-{m["slug"]}" style="--i:{i};--acc:{acc}"><div class="uyq-ph" style="view-transition-name:tm-{m["slug"]}"><div class="uyq-img" data-tilt>{face}</div></div>'
            f'<div class="uyq-tx"><p class="uyq-no" aria-hidden="true">{i + 1:02d}</p><p class="uyq-k">{E(k)} · {age(m)}</p>'
            f'<h3 class="uyq-n">{E(m["name"])}</h3><p class="uyq-r">{E(m["role"])}</p><p class="uyq-t">{E(m["tag"])}</p>'
            f'<p class="uyq-a">{E(m["areas"])}</p><div class="dm dm-{m["sig"]}" role="img" aria-label="{E(DEMO_CAP[m["sig"]])}"><span class="dm-cap">{E(DEMO_CAP[m["sig"]])}</span>{DEMO[m["sig"]]}</div><a class="btn gold uyq-go" href="team/{m["slug"]}.html">Жеке беті</a><a class="uyq-film" href="team/3d.html#t={film_at(m["slug"])}">Фильмдегі сахнасы</a></div></li>')


RING = '''
    <section class="rng" data-scrub="pin" aria-labelledby="rng-h" style="--n:{n}">
      <div class="rng-stick">
        <canvas class="shx-dust" aria-hidden="true"></canvas>
        <div class="rng-head"><p class="st-intertitle">Бес уық - бір шаңырақ</p><h2 id="rng-h">Бір шеңберде</h2></div>
        <div class="rng-scene"><div class="rng-stage">{cards}</div>
          <svg class="rng-shan" viewBox="-60 -60 120 120" aria-hidden="true" focusable="false"><circle r="52"/><circle r="46"/><path d="M-46-14H46M-46 14H46M-14-46V46M14-46V46"/><path class="rng-mid" d="M0-7 7 0 0 7-7 0Z"/></svg>
        </div>
        <p class="rng-now" aria-hidden="true" data-i="0">{first}</p>
      </div>
    </section>
'''


def team_page():
    panels = "\n        ".join(panel(m, i) for i, m in enumerate(M))
    hud = "".join(f'<button type="button" class="uyq-hb" data-i="{i}"><i></i><span>{E(m["name"])}</span></button>' for i, m in enumerate(M))
    names = " ".join(f'<a href="team/{m["slug"]}.html">{E(m["name"])}</a>' for m in M)
    main = f"""  <main class="tm shx" id="main">
    <div class="mh" aria-hidden="true"><span>Алаш · 1917</span><span><b>AO17</b> · Команда үндеуі</span><span>Бес автор · 2026</span></div><div class="mh-rule" aria-hidden="true"></div>
    <section class="tmx" aria-label="AO17: уақыт машинасы - скролл фильмді алға және артқа жүргізеді">
     <script type="application/json" id="tmx-data">{tm_data()}</script>
     <div class="tmx-stick">
      <canvas class="tmx-cv" aria-hidden="true"></canvas>
    <div class="lf-hero">
      <div class="lf-copy">
        <p class="lf-k" lang="en">AO17 · The people behind the future</p>
        <h1 id="shx-h"><span class="shx-l1">Бір шаңырақ</span> <span class="shx-l2">бес адам</span></h1>
        <p class="lf-sub">Бес адам. Бір шаңырақ. Бір болашақ.</p>
        <nav class="shx-modes" aria-label="Команда бетінің режимі"><a class="shx-3d" href="team/3d.html"><i aria-hidden="true">▶</i> Cinema: 3D фильм «The Unmade»</a><a class="shx-ex" href="#uyq-h">Explore: бес автор</a></nav>
        {orbit("lf-orb", "", False)}
      </div>
      <figure class="lf-photo">
        <a class="lf-zoom" href="assets/img/team/group-hd.jpg" aria-label="Топ фотосын толық өлшемде ашу"><img src="assets/img/team/group-hd.jpg" alt="AO17 командасының бес мүшесі кітап сөрелерінің алдында, ортада глобус: артта Magzhan Romanov, Tutkabayeva Gulzat, Toktybay Dastan; алдында Sagid Mustafa мен Kopenova Merey." width="2400" height="1681" fetchpriority="high" decoding="async"></a>
        <figcaption>{names}</figcaption>
      </figure>
    </div>
      <div class="tmx-ui">
        <div class="tmx-cap" aria-live="polite"><p class="tmx-k"></p><h2 class="tmx-n"></h2><p class="tmx-r"></p><p class="tmx-t"></p><p class="tmx-a"><a class="tmx-go" href="#">Жеке беті</a><a class="tmx-film" href="#">Фильмдегі сахнасы</a></p></div>
        <div class="tmx-nav"><button type="button" class="tmx-prev" aria-label="Алдыңғы">&#8592;</button><span class="tmx-hint">Скролл - уақыт · сүйреу - кеңістік</span><button type="button" class="tmx-next" aria-label="Келесі">&#8594;</button></div>
        <span class="tmx-bar" aria-hidden="true"><i></i></span>
      </div>
     </div>
    </section>

    <div class="orn" data-scrub="through" aria-hidden="true"><svg viewBox="0 0 1200 80" preserveAspectRatio="xMidYMid meet"><path class="orn-l" pathLength="1" d="M520 40H40M680 40H1160"/><path class="orn-h" pathLength="1" d="M600 58V40C600 22 584 12 570 18C556 24 558 44 572 44C582 44 584 32 576 30M600 40C600 22 616 12 630 18C644 24 642 44 628 44C618 44 616 32 624 30"/><path class="orn-h" pathLength="1" d="M520 40C536 40 540 30 532 26M680 40C664 40 660 30 668 26M40 40l-14-10M40 40l-14 10M1160 40l14-10M1160 40l14 10"/><path class="orn-d" d="M600 62l6 6-6 6-6-6z"/></svg></div>

    <section class="uyq" data-scrub="pin" aria-labelledby="uyq-h" style="--n:{len(M)}">
      <div class="uyq-stick">
        <h2 class="uyq-h" id="uyq-h"><span class="st-intertitle">Бес уық</span>Кім не жасады</h2>
        <ul class="uyq-track" aria-label="Команда мүшелері">
        {panels}
        </ul>
        <div class="uyq-hud" role="group" aria-label="Мүшеге өту">{hud}</div>
      </div>
    </section>

    <div class="orn" data-scrub="through" aria-hidden="true"><svg viewBox="0 0 1200 80" preserveAspectRatio="xMidYMid meet"><path class="orn-l" pathLength="1" d="M520 40H40M680 40H1160"/><path class="orn-h" pathLength="1" d="M600 58V40C600 22 584 12 570 18C556 24 558 44 572 44C582 44 584 32 576 30M600 40C600 22 616 12 630 18C644 24 642 44 628 44C618 44 616 32 624 30"/><path class="orn-h" pathLength="1" d="M520 40C536 40 540 30 532 26M680 40C664 40 660 30 668 26M40 40l-14-10M40 40l-14 10M1160 40l14-10M1160 40l14 10"/><path class="orn-d" d="M600 62l6 6-6 6-6-6z"/></svg></div>

    <section class="tm-sec tm-seal" aria-labelledby="tn-h" data-reveal>
      <img class="tm-seal-img" src="assets/img/seal.svg" alt="" width="132" height="132">
      <div class="tm-seal-tx">
        <p class="st-intertitle">Мөр басылды</p>
        <h2 id="tn-h">Авторлық құқық</h2>
        <p>AO17 платформасының бағдарламасы, дизайны және авторлық оқу материалдары бес автордың ортақ еңбегі. Толық шарттар: <a href="copyright.html">Авторлық құқық және лицензиялар</a>. Harvard CS50 материалдарының қазақша аудармалары өз лицензиясымен (CC BY-NC-SA 4.0) таратылады.</p>
        <ul class="tm-signs" aria-label="Авторлар">{"".join(f'<li style="--i:{i}"><a href="team/{m['slug']}.html">{E(m['name'])}</a><span>{E(m['role'])}</span></li>' for i, m in enumerate(M))}</ul>
      </div>
    </section>
  </main>"""
    return shell("", "Команда - AO17", "AO17 командасы: бес автор - екі дизайнер, үш бағдарлама мен мазмұн авторы. Әрқайсысының сайттағы ісі және 3D фильм «The Unmade».", main, '\n  <script type="module" src="assets/js/team-tm.js"></script>')


# ---------- жеке бет: «қолтаңба» ----------
def stats():
    sys.path.insert(0, str(ROOT / "tools"))
    import guide_build   # noqa: E402
    G = guide_build.load()
    math = [f for f in glob.glob(str(ROOT / "math/lectures/*.html")) if "<!-- soon -->" not in Path(f).read_text(encoding="utf-8")]
    return [(len(G), "оқулық сабағы", "SAT және IELTS: нөлден дайындық курсы"),
            (sum(len(L["practice"]) + len(L["mastery"]) for L in G), "тексерілетін жаттығу", "оқулықтағы әр жаттығудың жауабы мен түсіндірмесі"),
            (len(math), "математика сабағы", "25 пәннің дайын сабақтары"),
            (len(glob.glob(str(ROOT / "tests/e2e/*.spec.js"))), "браузерлік тест файлы", "әр жариялау алдында іске қосылады")]


def code_snippet():
    s = (ROOT / "assets/js/rl-mathexpr.js").read_text(encoding="utf-8")
    m = re.search(r"\n(  function solve\(eq\) \{.*?\n  \})", s, re.S)
    return m.group(1) if m else "function solve(eq) { ... }"


def signature(m, prefix):
    sig = m["sig"]
    if sig == "palette":
        sw = [("#120d0a", "Сия"), ("#7a1f2b", "Бордо"), ("#8a6634", "Қола"), ("#d9b468", "Алтын"), ("#efe6d3", "Киіз")]
        cols = "".join(f'<li style="--c:{c};--i:{i}"><i></i><b>{n}</b><code>{c}</code></li>' for i, (c, n) in enumerate(sw))
        return ("Сайттың бес негізгі түсі және Алаш мөрі: барлық бет осы палитрадан құралады.",
                f'<div class="sg sg-pal"><ul class="sg-sw" aria-label="Палитра">{cols}</ul>'
                f'<img class="sg-seal" src="{prefix}assets/img/seal.svg" alt="AO17 мөрі" width="160" height="160"></div>')
    if sig == "bota":
        st = [("bota-think", "Ойланады", "сұрақ қойылғанда"), ("bota-happy", "Қуанады", "дұрыс жауапта"), ("bota-wow", "Таң қалады", "жаңалық ашылғанда")]
        it = "".join(f'<li style="--i:{i}"><img src="{prefix}assets/img/{f}.svg" alt="Бота: {n.lower()}" width="120" height="120"><b>{n}</b><span>{d}</span></li>' for i, (f, n, d) in enumerate(st))
        return ("Бота - сабақтағы фильмдердің кейіпкері. Үш күйі оқушының сабақтағы үш сәтіне сәйкес келеді.",
                f'<ul class="sg sg-bota">{it}</ul>')
    if sig == "code":
        lines = textwrap.dedent(code_snippet()).split("\n")
        code = "".join(f'<span class="sg-ln" style="--i:{i};--w:{len(ln)}ch">{E(ln)}</span>\n' for i, ln in enumerate(lines))
        return ("«Теңдеу таразысы» сабағының өзегінен үзінді (assets/js/rl-mathexpr.js): теңдеудің шешімі осы функциямен есептеледі.",
                f'<pre class="sg sg-code" aria-label="Код үзіндісі"><code>{code}</code></pre>')
    if sig == "stats":
        it = "".join(f'<li style="--i:{i}"><b data-to="{n}">{n}</b><span>{E(t)}</span><small>{E(d)}</small></li>' for i, (n, t, d) in enumerate(stats()))
        return ("Сандар сайтты жинаған сәтте файлдардан есептеледі: қолмен жазылған сан жоқ.", f'<ul class="sg sg-stats">{it}</ul>')
    nodes = [("Мазмұн", "Python файлдары"), ("Жинау", "tools/build.py"), ("Тексеру", "аудит, тесттер"), ("Жариялау", "GitHub Pages"), ("Оқушы", "браузер, офлайн")]
    g = []
    for i, (a, b) in enumerate(nodes):
        x = 80 + i * 160
        g.append(f'<g class="sg-node" style="--i:{i}" transform="translate({x} 80)"><circle r="50"/><text y="6" class="sg-a">{a}</text><text y="82" class="sg-b">{b}</text></g>')
    return ("Сайттың жолы: мазмұн файлдардан жиналып, тексеріліп, жарияланып, оқушыға жетеді. Әр жариялау осы бес қадамнан өтеді.",
            '<svg class="sg sg-flow" viewBox="0 0 800 180" role="img" aria-label="Мазмұн, жинау, тексеру, жариялау, оқушы">'
            '<path class="sg-wire" d="M80 80H720"/><path class="sg-pulse" d="M80 80H720" pathLength="1"/>' + "".join(g) + "</svg>")


def person_page(m, i):
    p = "../"
    k, acc = KIND[m["kind"]]
    ph = photo(m["slug"])
    face = (f'<img src="{p}{ph}" alt="{E(m["name"])}, портрет" width="640" height="800" fetchpriority="high">' if ph
            else f'<span class="ta-ini" aria-hidden="true">{E(m["initials"])}</span>')
    cap, sig = signature(m, p)
    works = "".join(f'<li style="--i:{j}"><a href="{p}{h}"><b>{E(t)}</b><span>{E(d)}</span></a></li>' for j, (h, t, d) in enumerate(m["works"]))
    prv, nxt = M[(i - 1) % len(M)], M[(i + 1) % len(M)]
    mini = lambda o, lab: (f'<a class="tp-mini" href="{o["slug"]}.html"><img src="{p}{photo(o["slug"])}" alt="" width="64" height="80" loading="lazy">'  # noqa: E731
                           f'<span><small>{lab}</small>{E(o["name"])}</span></a>')
    main = f"""  <main class="tm tp" id="main" style="--acc:{acc}">
    <section class="tp-hero" aria-labelledby="tp-h" data-scrub="through">
      <p class="tp-bg" aria-hidden="true">{E(m["name"])}</p>
      <canvas class="shx-dust tp-dust" aria-hidden="true"></canvas>
      <div class="tp-door" style="view-transition-name:tm-{m["slug"]}"><div class="tp-ph" data-tilt>{face}</div><span class="tp-leaf tp-l" aria-hidden="true"></span><span class="tp-leaf tp-r" aria-hidden="true"></span></div>
      <div class="tp-copy">
        <p class="tp-crumb"><a href="{p}team.html">Команда</a> · {i + 1} / {len(M)}</p>
        <h1 id="tp-h">{E(m["name"])}</h1>
        <p class="tp-meta"><span>{E(m["role"])}</span><span>{age(m)}</span><span>{E(k)}</span></p>
        <p class="tp-tag">{E(m["tag"])}</p>
        <p class="tp-areas">{E(m["areas"])}</p>
      </div>
    </section>

    <section class="mf mf-p" data-scrub="pin" aria-label="Сайттағы ісі">
      <div class="mf-stick"><p class="mf-k">{E(m["role"])}</p><p class="mf-t" data-words>{E(m["areas"])}</p></div>
    </section>

    <section class="tm-sec tp-sig" aria-labelledby="sg-h" data-reveal>
      <p class="st-intertitle">Қолтаңба</p>
      <h2 id="sg-h">Сайттағы ізі</h2>
      {sig}
      <p class="sg-cap">{E(cap)}</p>
    </section>

    <section class="tm-sec" aria-labelledby="tw-h" data-reveal>
      <h2 id="tw-h">Сайттың қай бөлігі</h2>
      <ul class="tp-works">{works}</ul>
    </section>

    <nav class="tp-nav" aria-label="Команда мүшелері">{mini(prv, "Алдыңғы")}<a class="tp-all" href="{p}team.html">Бүкіл команда</a><a class="tp-all" href="3d.html#t={film_at(m["slug"])}">Фильмдегі сахнасы</a>{mini(nxt, "Келесі")}</nav>
  </main>"""
    return shell(p, f"{m['name']} - AO17 командасы", f"{m['name']}, {m['age']} жас: {m['role']}. {m['areas']}", main)


# ---------- басты бет: 8-сахна ----------
def landing():
    names = "".join(f'<li style="--i:{i};--acc:{KIND[m["kind"]][1]}"><a href="team/{m["slug"]}.html"><b>{E(m["name"])}</b><span>{E(KIND[m["kind"]][0].lower())}</span></a></li>' for i, m in enumerate(M))
    dots = "".join(f'<circle class="at-dot" style="--i:{i}" cx="{200 + 168 * math.sin(i * 1.2566 + .3):.1f}" cy="{200 - 168 * math.cos(i * 1.2566 + .3):.1f}" r="7"/>' for i in range(len(M)))
    return f"""<section class="st-scene ax ax-team" id="scene-team" aria-labelledby="axt-t" data-scene="8" data-scrub="through">
    <canvas class="shx-dust" aria-hidden="true"></canvas>
    <div class="ax-in">
      <div class="ax-copy">
        <p class="ax-kick">Сайтты кім жасады</p>
        <h2 id="axt-t">Бір шаңырақ - бес адам</h2>
        <p>Шаңырақты бір уық көтермейді. AO17-ні бес адам бөлісіп жасады: екеуі - дизайн, үшеуі - бағдарлама мен мазмұн.</p>
        <ol class="at-names" aria-label="Команда">{names}</ol>
        <a class="btn gold" href="team.html">Командамен таныс</a>
      </div>
      <figure class="at-shan">
        <div class="at-win"><img src="assets/img/team/group.jpg" alt="AO17 командасының бес мүшесі кітап сөрелерінің алдында." width="1600" height="1121" loading="lazy" decoding="async"></div>
        <svg class="at-over" viewBox="0 0 400 400" aria-hidden="true" focusable="false">
          <circle class="at-ring" cx="200" cy="200" r="168"/><circle class="at-ring2" cx="200" cy="200" r="182"/>
          <path class="at-kuld" pathLength="1" d="M40 160H360M40 240H360M160 40V360M240 40V360"/>{dots}
        </svg>
      </figure>
    </div>
  </section>"""


# ---------- team/3d.html: «Жасалмаған сайт» - сайттың өзі бөлшектеніп, оны жасаған адамдар ашылады ----------
LAW = {
    "sagid": "Алдымен қаңқа: әр элементтің орны мен байланысы. Платформаның ішкі жүйесі осылай басталды.",
    "gulzat": "Қаңқа жарыққа, түске және әріпке ие болады: Алаштың көркем тілі.",
    "dastan": "Бос құрылым білімге толады: сабақтар, есептер, тесттер және тексерілген жауаптар.",
    "magzhan": "Интерфейс тіріледі: код орындалады, батырма мен карточка әрекетке жауап береді.",
    "merey": "Бәрі оқушының қолындағы телефонға бейімделеді: ыңғайлы әрі түсінікті.",
}
EN = {"sagid": "The Architect", "gulzat": "The Art Director", "dastan": "The Curator", "magzhan": "The Engineer", "merey": "The Designer"}
GIVEN = {"sagid": "Mustafa", "gulzat": "Gulzat", "dastan": "Dastan", "magzhan": "Magzhan", "merey": "Merey"}
ACTS = [   # (басы, соңы, белгі, тақырып, сипаттама) - секунд «ENTER»-ден кейін, assets/js/team3d.js уақыт сызығымен сәйкес
    (12.1, 17.5, "I · Беті", "Сайттың астындағы әлем", "Әр сайттың астында қабаттар жатыр: әріп, интерфейс, логика, мазмұн."),
    (17.5, 22.8, "I · Беті", "Адамдарсыз - бос шыны", "Оны жасаған адамдарды алып тастасақ, сайттан тек бос құрылым қалады."),
    (79.6, 83.8, "IV · Оралу", "Бесеуі қайта құрды", "Сайт қабат-қабатымен орнына оралады."),
    (83.8, 87.5, "IV · Құлау", "Құрылымды өз қолыңмен бұз", "Енді сайт - мыңдаған бөлшек. Тартып көріңіз: олар қайта жиналады."),
    (88.0, 95.2, "V · Шаңырақ", "Бес бағыт - бір шаңырақ", "Интерфейстің бөлшектері шаңыраққа бірігеді. Бірақ оның соңғы бөлігі әлі орнында емес."),
]
CHAPTERS3D = [(0, "Кіру"), (10, "Ыдырау"), (26, "Бес автор"), (79, "Тоғысу"), (87.5, "Шаңырақ"), (95.5, "Адамдар"), (113, "Алтыншы қол")]   # team3d.js CHAPTERS
FILM_STEPS = [
    ("0", "Постер", "Кеңістіктегі алып әріптер: THE PEOPLE BEHIND THE FUTURE. Камера әріптердің, сосын қараңғыдағы бес адамның арасынан өтеді."),
    ("I", "Беті", "Ауада AO17 сайты тұр. Ол қабаттарға ажырап, код жолдары жіңішке жіп болып тартылады; адамдарсыз сайт бос шыныға айналады."),
    ("II-III", "Кейіпкерлер", "Бес адам қараңғыдан жарыққа шығады. Әр адамның алып есімінің іші оның сайттағы еңбегімен толады: қаңқа, түс пен әріп, мазмұн, қозғалыс, телефон; сосын әріптер құрылымға ажырайды."),
    ("IV", "Құлау", "Сайт мыңдаған бөлшекке айналады; оларды тартуға болады, олар қайта жиналады."),
    ("V", "Шаңырақ", "Камера көтеріледі: бөлшектер алып шаңыраққа бірігеді."),
    ("VI", "AO17-сіз әлем", "Бәрі жоғалады: «Бір идея ешқашан өздігінен шындыққа айналмайды». Бес адамның шынайы фотосы мен есімі, сосын топ фотосы: Not built by magic. Built by people."),
    ("VII", "Алтыншы қол", "Шаңырақтың соңғы бөлігін көрермен өзі орнатады. Шаңырақ қайта сайтқа айналады: біз іргетасын қаладық, әрі қарай сен саласың."),
]


def tm_data():
    """«Уақыт машинасы» (assets/js/team-tm.js): топ фотосы, шаңырақ айналасындағы жеті рамка - бес түпнұсқа портрет, бірлескен жұмыс, дуэт."""
    stops = []
    for slug in FILM_ORDER:
        m = next(x for x in M if x["slug"] == slug)
        if slug == "magzhan":
            stops.append({"kind": "photo", "img": "assets/img/team/work.jpg", "ar": round(img_ar("assets/img/team/work.jpg"), 4), "k": "Бірге", "n": "Бір экранға бес көз",
                          "r": "Бірлескен жұмыс", "t": "Дизайн, код және мазмұн бір жобаға осылай тоғысты."})
        stops.append({"kind": "member", "slug": slug, "img": f"assets/img/team/orig/{slug}.jpg", "ar": round(img_ar(f"assets/img/team/orig/{slug}.jpg"), 4),
                      "k": f"{FILM_ORDER.index(slug) + 1:02d} / 05 · {EN[slug]}", "n": m["name"], "r": m["role"], "t": m["tag"],
                      "href": f"team/{slug}.html", "film": f"team/3d.html#t={film_at(slug)}"})
    stops.append({"kind": "photo", "img": "assets/img/team/duo.jpg", "ar": round(img_ar("assets/img/team/duo.jpg"), 4), "k": "Дизайн", "n": "Kopenova Merey мен Tutkabayeva Gulzat",
                  "r": "Екі дизайнер", "t": "Алаш стилі мен оқу беттерінің интерфейсі осы екеуінің қолынан шықты."})
    return json.dumps({"group": "assets/img/team/group-hd.jpg", "gar": round(img_ar("assets/img/team/group-hd.jpg"), 4), "stops": stops}, ensure_ascii=False).replace("</", "<\\/")


def orbit(cls, p, film):
    """Шаңырақ - бес автордың навигациясы: бес түйін (фильмде - сахнасына #t=, команда бетінде - галереядағы кадрына). Фотоның үстіне түспейді."""
    nodes = []
    for k, slug in enumerate(FILM_ORDER):
        m = next(x for x in M if x["slug"] == slug)
        a = -math.pi / 2 + k * 2 * math.pi / 5
        x, y = 50 + 38 * math.cos(a), 50 + 38 * math.sin(a)
        href = f"#t={film_at(slug)}" if film else f"#m-{slug}"
        nodes.append(f'<a class="orb-n" data-slug="{slug}" href="{href}" style="left:{x:.1f}%;top:{y:.1f}%" aria-label="{E(m["name"])}"><i aria-hidden="true"></i><span>{E(GIVEN[slug])}</span></a>')
    return (f'<nav class="orb {cls}" aria-label="Бес автор - шаңырақ навигациясы"><svg viewBox="0 0 100 100" aria-hidden="true" focusable="false"><circle cx="50" cy="50" r="38"/><circle cx="50" cy="50" r="33"/>'
            f'<path d="M17 37H83M17 63H83M37 17V83M63 17V83"/></svg>{"".join(nodes)}</nav>')


def film3d_page():
    p = "../"
    data = {"acts": [{"from": a, "to": b, "k": k, "t": t, "d": d} for a, b, k, t, d in ACTS],
            "members": [{"slug": m["slug"], "name": m["name"], "role": m["role"], "law": LAW[m["slug"]], "en": EN[m["slug"]], "given": GIVEN[m["slug"]],
                         "photo": f"{p}assets/img/team/orig/{m['slug']}.jpg", "works": [[p + h, t] for h, t, d in m["works"]]} for m in M],
            "group": {"photo": f"{p}assets/img/team/group-hd.jpg"}}
    js = json.dumps(data, ensure_ascii=False).replace("</", "<\\/")
    credits = "".join(f'<div><dt>{E(m["role"])}</dt><dd><a href="{m["slug"]}.html">{E(m["name"])}</a></dd></div>' for m in sorted(M, key=lambda m: ["sagid", "gulzat", "dastan", "magzhan", "merey"].index(m["slug"])))
    faces = "".join(f'<li style="--i:{k}"><img src="{p}assets/img/team/orig/{m["slug"]}.jpg" alt="{E(m["name"])}, портрет" width="960" height="1400" loading="lazy" decoding="async"><b>{E(m["name"])}</b><span>{E(m["role"])}</span></li>' for k, m in enumerate(M))
    chapters = "".join(f'<a href="#t={a}">{i + 1:02d} <span>{E(n)}</span></a>' for i, (a, n) in enumerate(CHAPTERS3D))
    steps = "".join(f'<li><b>{n}</b> <span>{E(t)}</span><p>{E(d)}</p></li>' for n, t, d in FILM_STEPS)
    main = f"""<main id="main" class="um">
  <script type="application/json" id="um-data">{js}</script>
  <section class="um-film" aria-label="3D фильм: The Unmade, Жасалмаған сайт">
    <div class="um-stage">
      <canvas class="um-cv" aria-hidden="true"></canvas>
      <div class="um-site" aria-label="AO17 сайтының беті">
        <a class="um-a um-a1" href="{p}index.html#academies">Академияны таңдау</a>
        <a class="um-a um-a2" href="{p}lectures/week-0.html">CS50x-тен бастау</a>
        <a class="um-a um-a0" href="{p}index.html">AO17 басты беті</a>
      </div>
      <div class="um-poster">
        <p class="um-mark"><svg viewBox="-12 -12 24 24" aria-hidden="true" focusable="false"><circle r="9.5"/><path d="M-9.5-3H9.5M-9.5 3H9.5M-3-9.5V9.5M3-9.5V9.5"/></svg>AO17</p>
        <p class="um-film-k" lang="en">An interactive film<br>2026</p>
        <h1 class="um-ph" lang="en">The people behind the future.</h1>
        <p class="um-sub">Бес адам. Бір болашақ.</p>
        <div class="um-entry"><button type="button" class="um-enter" lang="en">Enter experience</button><a class="um-alt" href="{p}team.html#uyq-h" lang="en">Explore team</a><a class="um-alt" href="#um-cr" lang="en">Skip film</a></div>
      </div>
      <p class="um-story" lang="en">Every system has a story.</p>
      <p class="um-q">Ал егер осының бәрін жасаған адамдарды алып тастасақ ше?</p>
      <div class="um-pp" aria-live="polite"><p class="um-pp-i"></p><p class="um-pp-e" lang="en"></p><h2 class="um-pp-n"></h2><p class="um-pp-r"></p><p class="um-pp-l"></p><div class="um-pp-row"><a class="um-pp-a" href="#">Жұмысын көру</a><button type="button" class="um-xr" aria-expanded="false" aria-controls="um-xr-l">X-Ray: нақты беттері</button></div><ul class="um-xr-l" id="um-xr-l" hidden></ul><p class="um-pp-note">Кадрдағы интерфейс - сайттың көрнекі көшірмесі; нақты беттері - сілтемеде.</p></div>
      <div class="um-cap" aria-live="polite"><p class="um-k"></p><p class="um-t"></p><p class="um-d"></p></div>
      <p class="um-hint" aria-hidden="true">Тінтуірмен не саусақпен тартыңыз</p>
      <p class="um-void">Бір идея ешқашан өздігінен шындыққа айналмайды.</p>
      <ul class="um-faces" aria-label="Команда">{faces}</ul>
      <div class="um-group"><img src="{p}assets/img/team/group-hd.jpg" alt="AO17 командасының бес мүшесі кітап сөрелерінің алдында, ортада глобус." width="2400" height="1681" loading="lazy" decoding="async"><p class="um-g1" lang="en">Not built by magic.<br>Built by people.</p><p class="um-g2">Болашақты адамдар жасайды.</p></div>
      <div class="um-hand"><p class="um-hand-k">Соңғы бөлігі - сенде</p><p class="um-hand-t">Бесеуі платформаны жасады. Алтыншысы - сен, оны қолданатын оқушы. Шаңырақтың соңғы бөлігін ортаға сүйреп апар.</p><button type="button" class="um-place">Орнату</button></div>
      <div class="um-fin">
        <p class="um-f1" lang="en">We built the foundation.<br>You build what's next.</p>
        <p class="um-f2">Біз іргетасын қаладық. Әрі қарай сен саласың.</p>
        <p class="um-f3">Сайт тірі: төмендегі батырмадан оқуды бастаңыз.</p>
        <div class="um-row"><a class="btn gold" href="{p}index.html">Оқуды бастау</a><a class="btn ghost" href="#um-cr">Титрлер</a><button type="button" class="btn ghost um-replay">Қайта көру</button></div>
      </div>
      <div class="um-ctl"><button type="button" class="um-pause" aria-pressed="false">Кідірту</button><nav class="um-chs" aria-label="Фильм тараулары">{chapters}</nav>{orbit("um-orb", "", True)}</div>
      <button type="button" class="um-skip">Өткізу</button>
      <span class="um-bar" aria-hidden="true"><i></i></span>
    </div>
  </section>
  <section class="um-cr" id="um-cr" aria-labelledby="um-cr-h">
    <figure class="um-cr-ph"><img src="{p}assets/img/team/group-hd.jpg" alt="AO17 командасының бес мүшесі кітап сөрелерінің алдында, ортада глобус." width="2400" height="1681" loading="lazy" decoding="async"></figure>
    <p class="um-cr-k" lang="en">The people behind the future</p>
    <h2 id="um-cr-h">Сайтты жасағандар</h2>
    <dl class="um-cr-l">{credits}</dl>
    <ol class="um-cr-steps" aria-label="Фильмнің көріністері">{steps}</ol>
    <p class="um-cr-note">Фильм өзі ойнайды (шамамен 2 минут), дыбыссыз; соңында шаңырақтың соңғы бөлігін өзіңіз орнатасыз. Барлық пішін кодпен құрылған, фотолар шынайы. Қозғалыс азайтылған режимде осы титрлер ғана көрсетіледі.</p>
    <p class="um-cr-end">Болашақ өздігінен жасалмайды. Оны адамдар жасайды.</p>
    <p class="um-row"><a class="btn gold" href="{p}team.html">Команда беті</a></p>
  </section>
</main>"""
    return shell(p, f"The Unmade - 3D фильм | {TEAM['name']}",
                 "AO17 туралы 3D фильм: сайттың өзі қабаттарға бөлшектеніп, оны жасаған бес адам ашылады.",
                 main, f'\n  <script type="module" src="{p}assets/js/team3d.js"></script>')


def build():
    (ROOT / "team.html").write_text(team_page(), encoding="utf-8")
    (ROOT / "team").mkdir(exist_ok=True)
    for i, m in enumerate(M):
        (ROOT / "team" / f"{m['slug']}.html").write_text(person_page(m, i), encoding="utf-8")
    (ROOT / "team" / "3d.html").write_text(film3d_page(), encoding="utf-8")
    idx = ROOT / "index.html"
    s = idx.read_text(encoding="utf-8")
    if "<!-- team:landing -->" in s:
        s = re.sub(r"(<!-- team:landing -->).*?(<!-- /team:landing -->)", lambda x: x.group(1) + "\n  " + landing() + "\n  " + x.group(2), s, flags=re.S)
        idx.write_text(s, encoding="utf-8")
    return [f"team/{m['slug']}.html" for m in M] + ["team/3d.html"]


if __name__ == "__main__":
    print("team:", ", ".join(build()))
