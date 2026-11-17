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
KIND = {"design": ("Дизайн", "#d48f98"), "code": ("Бағдарлама", "#86cdb6"), "content": ("Мазмұн", "#e6c47c")}
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
    shots = [{"img": g, "x": 50, "y": 50, "s": 1.0, "to": [50, 52, 1.06], "hold": 5200, "k": TEAM["name"], "t": "Бір шаңырақ - бес адам",
              "d": "Екеуі - дизайн, үшеуі - бағдарлама мен мазмұн. Камера әрқайсысына кезекпен жақындайды."}]
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


def panel(m, i):
    k, acc = KIND[m["kind"]]
    ph = photo(m["slug"])
    face = (f'<img src="{ph}" alt="{E(m["name"])}, портрет" width="640" height="800" loading="{"eager" if i < 2 else "lazy"}" decoding="async">' if ph
            else f'<span class="ta-ini" aria-hidden="true">{E(m["initials"])}</span>')
    return (f'<li class="uyq-p" style="--i:{i};--acc:{acc}"><div class="uyq-ph"><div class="uyq-img">{face}</div></div>'
            f'<div class="uyq-tx"><p class="uyq-no" aria-hidden="true">{i + 1:02d}</p><p class="uyq-k">{E(k)} · {age(m)}</p>'
            f'<h3 class="uyq-n">{E(m["name"])}</h3><p class="uyq-r">{E(m["role"])}</p><p class="uyq-t">{E(m["tag"])}</p>'
            f'<p class="uyq-a">{E(m["areas"])}</p><a class="btn gold uyq-go" href="team/{m["slug"]}.html">Жеке беті</a></div></li>')


def team_page():
    shots = film_shots("")
    first = shots[0]
    panels = "\n        ".join(panel(m, i) for i, m in enumerate(M))
    hud = "".join(f'<button type="button" class="uyq-hb" data-i="{i}"><i></i><span>{E(m["name"])}</span></button>' for i, m in enumerate(M))
    names = " ".join(f'<span>{E(m["name"])}</span>' for m in M)
    main = f"""  <main class="tm shx" id="main">
    <section class="shx-open" data-scrub="pin" aria-labelledby="shx-h">
      <div class="shx-stick">
        <i class="shx-bar shx-bt" aria-hidden="true"></i><i class="shx-bar shx-bb" aria-hidden="true"></i>
        <div class="shx-photo"><img src="assets/img/team/group-hd.jpg" alt="AO17 командасының бес мүшесі кітап сөрелерінің алдында, ортада глобус." width="2400" height="1681" fetchpriority="high"></div>
        <canvas class="shx-dust" aria-hidden="true"></canvas>
        <svg class="shx-shan" viewBox="-220 -220 440 440" aria-hidden="true" focusable="false">
          <circle class="shx-r1" r="190" pathLength="1"/><circle class="shx-r2" r="174" pathLength="1"/>
          <path class="shx-kd" pathLength="1" d="M-174-56H174M-174 56H174M-56-174V174M56-174V174"/>
          <path class="shx-uy" pathLength="1" d="M0-190V-214M134-134 151-151M190 0H214M134 134 151 151M0 190V214M-134 134-151 151M-190 0H-214M-134-134-151-151"/>
          <path class="shx-mid" d="M0-20 20 0 0 20-20 0Z"/>
        </svg>
        <div class="shx-copy">
          <p class="shx-kick">AO17 командасы</p>
          <h1 id="shx-h"><span class="shx-l1">Бір шаңырақ</span><span class="shx-l2">бес адам</span></h1>
          <p class="shx-names">{names}</p>
        </div>
        <p class="shx-hint" aria-hidden="true"><span>Төмен айналдырыңыз</span><i></i></p>
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

    <section class="tf" aria-labelledby="tf-h" data-film>
      <p class="st-intertitle">Фото-фильм</p>
      <h2 id="tf-h">Бір күннің кадрлары</h2>
      <div class="tf-stage">
      <div class="tf-frame">
        <div class="tf-l is-cur"><img src="{first['img']}" alt="{E(first['alt'])}" width="2400" height="1681" loading="lazy"></div>
        <svg class="tf-shan" viewBox="0 0 600 400" aria-hidden="true" focusable="false"><g transform="translate(300 200)">
          <circle r="150" class="tf-ring"/><circle r="138" class="tf-ring2"/>
          <path class="tf-kuld" d="M-138-40H138M-138 40H138M-40-138V138M40-138V138"/>
          <g class="tf-uyk"><path d="M0-150V-196M130-75 170-98M130 75 170 98M0 150V196M-130 75-170 98M-130-75-170-98"/></g></g></svg>
      </div>
        <div class="tf-cap" aria-live="off"><p class="tf-k">{E(first['k'])}</p><p class="tf-t">{E(first['t'])}</p><p class="tf-d">{E(first['d'])}</p></div>
      </div>
      <div class="tf-bar" hidden></div>
      <script type="application/json" id="tf-data">{json.dumps(shots, ensure_ascii=False)}</script>
    </section>

    <section class="tm-sec tm-note" aria-labelledby="tn-h">
      <h2 id="tn-h">Авторлық құқық</h2>
      <p>AO17 платформасының бағдарламасы, дизайны және авторлық оқу материалдары бес автордың ортақ еңбегі: {E(", ".join(m["name"] for m in M))}. Толық шарттар: <a href="copyright.html">Авторлық құқық және лицензиялар</a>. Harvard CS50 материалдарының қазақша аудармалары өз лицензиясымен (CC BY-NC-SA 4.0) таратылады.</p>
    </section>
  </main>"""
    return shell("", "Команда - AO17", "AO17 командасы: бес автор - екі дизайнер, үш бағдарлама мен мазмұн авторы. Скроллмен ашылатын фильм, әрқайсысының сайттағы ісі.", main)


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
      <div class="tp-door"><div class="tp-ph">{face}</div><span class="tp-leaf tp-l" aria-hidden="true"></span><span class="tp-leaf tp-r" aria-hidden="true"></span></div>
      <div class="tp-copy">
        <p class="tp-crumb"><a href="{p}team.html">Команда</a> · {i + 1} / {len(M)}</p>
        <h1 id="tp-h">{E(m["name"])}</h1>
        <p class="tp-meta"><span>{E(m["role"])}</span><span>{age(m)}</span><span>{E(k)}</span></p>
        <p class="tp-tag">{E(m["tag"])}</p>
        <p class="tp-areas">{E(m["areas"])}</p>
      </div>
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

    <nav class="tp-nav" aria-label="Команда мүшелері">{mini(prv, "Алдыңғы")}<a class="tp-all" href="{p}team.html">Бүкіл команда</a>{mini(nxt, "Келесі")}</nav>
  </main>"""
    return shell(p, f"{m['name']} - AO17 командасы", f"{m['name']}, {m['age']} жас: {m['role']}. {m['areas']}", main)


# ---------- басты бет: 8-сахна ----------
def landing():
    names = "".join(f'<li style="--i:{i};--acc:{KIND[m["kind"]][1]}"><b>{E(m["name"])}</b><span>{E(KIND[m["kind"]][0].lower())}</span></li>' for i, m in enumerate(M))
    dots = "".join(f'<circle class="at-dot" style="--i:{i}" cx="{200 + 168 * math.sin(i * 1.2566 + .3):.1f}" cy="{200 - 168 * math.cos(i * 1.2566 + .3):.1f}" r="7"/>' for i in range(len(M)))
    return f"""<section class="st-scene ax ax-team" id="scene-team" aria-labelledby="axt-t" data-scene="8" data-scrub="through">
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


def build():
    (ROOT / "team.html").write_text(team_page(), encoding="utf-8")
    (ROOT / "team").mkdir(exist_ok=True)
    for i, m in enumerate(M):
        (ROOT / "team" / f"{m['slug']}.html").write_text(person_page(m, i), encoding="utf-8")
    idx = ROOT / "index.html"
    s = idx.read_text(encoding="utf-8")
    if "<!-- team:landing -->" in s:
        s = re.sub(r"(<!-- team:landing -->).*?(<!-- /team:landing -->)", lambda x: x.group(1) + "\n  " + landing() + "\n  " + x.group(2), s, flags=re.S)
        idx.write_text(s, encoding="utf-8")
    return [f"team/{m['slug']}.html" for m in M]


if __name__ == "__main__":
    print("team:", ", ".join(build()))
