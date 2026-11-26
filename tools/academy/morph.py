# © 2026 AO17 командасы. All Rights Reserved.
# AO17 MORPH - academy/morph.html (жария бет). Математиканың пішінге айналуы: формула мен пішін екі жақты байланысқан.
# Формуланы өзгертсең - пішін өзгереді; пішінді (векторды, нүктені, суретті) өзгертсең - формула қайта есептеледі.
# Үш сахна: сызықтық алгебра (матрица кеңістікті түрлендіреді; базис векторын сүйресең - матрица), комплекстік анализ
# (f(z) жазықтықты майыстырады; w нүктесін сүйресең - барлық алғы бейнесі), Фурье (сурет айналатын шеңберлерден құралады;
# суретті өзің салсаң - коэффициенттер). Пішіндер build кезінде есептеледі (ою - Ою студиясының тасбақа модулімен).
import html
import importlib.util
import json
import math
import re
from pathlib import Path

E = lambda s: html.escape(str(s), quote=True)  # noqa: E731
ROOT = Path(__file__).resolve().parents[2]
N = 256   # Фурье пішінінің нүкте саны


def _turtle():
    spec = importlib.util.spec_from_file_location("oyu_turtle_m", ROOT / "assets" / "py" / "oyu_turtle.py")
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


KOSHKAR = ("def мүйіз(жақ):\n    for r in [46, 34, 24, 15, 8]:\n        circle(жақ * r, 90)\n\n"
           "penup(); goto(0, -110); setheading(90); pendown()\nforward(90)\nмүйіз(1)\n"
           "penup(); goto(0, -20); setheading(90); pendown()\nмүйіз(-1)\n")


def _norm(pts, size=1.0):
    """Нүктелерді (0, 0) ортаға және [-size, size] ауқымына келтіру."""
    xs, ys = [p[0] for p in pts], [p[1] for p in pts]
    cx, cy = (max(xs) + min(xs)) / 2, (max(ys) + min(ys)) / 2
    s = size / (max(max(xs) - min(xs), max(ys) - min(ys)) / 2 or 1)
    return [[round((x - cx) * s, 4), round((y - cy) * s, 4)] for x, y in pts]


def _resample(pts, n=N):
    """Тұйық жолды доға ұзындығы бойынша бірдей n нүктеге бөлу (Фурье үшін)."""
    pts = pts + [pts[0]]
    seg = [math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]) for i in range(len(pts) - 1)]
    total = sum(seg) or 1
    out, i, acc = [], 0, 0.0
    for k in range(n):
        target = total * k / n
        while i < len(seg) - 1 and acc + seg[i] < target:
            acc += seg[i]
            i += 1
        t = (target - acc) / seg[i] if seg[i] else 0
        a, b = pts[i], pts[i + 1]
        out.append([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t])
    return out


def ornament():
    """Қошқар мүйіз: Ою студиясының тасбақасымен салынған екі сызық (матрица сахнасы үшін)."""
    r = json.loads(_turtle().run(KOSHKAR))
    strokes = [it["p"] for it in r["items"] if it["t"] == "s"]
    allp = _norm([p for s in strokes for p in s], 1.45)
    out, k = [], 0
    for s in strokes:
        out.append(allp[k:k + len(s)])
        k += len(s)
    return out


def shapes():
    """Фурье пішіндері: тұйық жол, n нүкте, [-1, 1] ауқымы."""
    st = ornament()
    stem_top = 0
    # ою: сабақпен жоғары, бір мүйіз және кері, екінші мүйіз және кері, сабақпен төмен - бір тұйық жол
    s1, s2 = st[0], st[1]
    for i, p in enumerate(s1):          # сабақтың ұшы - екінші мүйіздің басы
        if abs(p[0] - s2[0][0]) < 1e-3 and abs(p[1] - s2[0][1]) < 1e-3:
            stem_top = i
    oyu = s1 + s1[::-1][: len(s1) - stem_top] + s2 + s2[::-1] + s1[:stem_top + 1][::-1]
    heart = [[16 * math.sin(t) ** 3, 13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)]
             for t in [2 * math.pi * k / 400 for k in range(400)]]
    square = [[-1 + 2 * k / 100, -1] for k in range(100)] + [[1, -1 + 2 * k / 100] for k in range(100)] \
        + [[1 - 2 * k / 100, 1] for k in range(100)] + [[-1, 1 - 2 * k / 100] for k in range(100)]
    star, x, y, h = [], 0.0, 0.0, 0.0
    for _ in range(8):                  # сегіз қырлы жұлдыз (Ою студиясының 2-тапсырмасы)
        for k in range(40):
            star.append([x + math.cos(h) * 150 * k / 40, y + math.sin(h) * 150 * k / 40])
        x, y, h = x + math.cos(h) * 150, y + math.sin(h) * 150, h + math.radians(135)
    return [{"id": "oyu", "title": "Қошқар мүйіз", "pts": _round(_resample(_norm(oyu)))},
            {"id": "heart", "title": "Жүрек", "pts": _round(_resample(_norm(heart)))},
            {"id": "square", "title": "Шаршы", "pts": _round(_resample(_norm(square)))},
            {"id": "star", "title": "Сегіз қырлы жұлдыз", "pts": _round(_resample(_norm(star)))}]


def _round(pts):
    return [[round(x, 4), round(y, 4)] for x, y in pts]


PRESETS = [("I", "Бірлік", [1, 0, 0, 1]), ("rot", "Бұру 45°", [0.7, -0.7, 0.7, 0.7]), ("scale", "Созу", [2, 0, 0, 0.5]),
           ("shear", "Ығысу", [1, 1, 0, 1]), ("flip", "Шағылысу", [1, 0, 0, -1]), ("proj", "Проекция", [1, 0, 0, 0]),
           ("user", "Мысал", [1.1, -1.0, 0.5, -0.9])]
FUNCS = [("sq", "z²"), ("cube", "z³"), ("inv", "1/z"), ("exp", "eᶻ"), ("sin", "sin z"), ("jouk", "z + 1/z")]
LINKS = {
    "matrix": [("../math/lectures/week-10.html", "Матрицалар"), ("../math/lectures/week-12.html", "Анықтауыш"),
               ("../math/lectures/week-13.html", "Сызықтық бейнелеу"), ("../math/lectures/week-14.html", "Меншікті мәндер"),
               ("3d/math/la-6-determinant.html", "3D: анықтауыш"), ("3d/math/la-8-eigen.html", "3D: меншікті векторлар")],
    "complex": [("../math/lectures/week-67.html", "Комплекс сандар"), ("../math/lectures/week-68.html", "Коши-Риман шарттары"),
                ("../math/lectures/week-69.html", "Элементар комплекс функциялар")],
    "fourier": [("../math/lectures/week-73.html", "Фурье қатарлары"), ("../math/lectures/week-74.html", "Фурье қатарының комплекс түрі")],
}


# Математика дәрістерінен MORPH-қа кері сілтеме (tools/math_pedagogy.py дәрістің соңына қояды; дереккөзі - LINKS)
LESSON_NOTE = {
    "matrix": "Матрицаны қолмен түрлендіріп көр: базис векторын сүйресең, матрица мен анықтауыш қайта есептеледі, ал қазақ оюы кеңістікпен бірге өзгереді.",
    "complex": "Комплекс функцияның жазықтықты қалай майыстыратынын көр: w нүктесін сүйресең, оның барлық алғы бейнесі z жазықтығында шығады.",
    "fourier": "Кез келген суретті айналатын шеңберлерден құрастырып көр: шеңбер саны өскенде қате қалай азаятыны көрінеді, өз суретіңді де салуға болады.",
}


def lesson_links():
    """{математика сабағының нөмірі: (сахна, мәтін)} - LINKS-тегі ../math/lectures/week-N.html сілтемелерінен."""
    out = {}
    for scene, ls in LINKS.items():
        for href, _t in ls:
            m = re.fullmatch(r"\.\./math/lectures/week-(\d+)\.html", href)
            if m:
                out[int(m.group(1))] = (scene, LESSON_NOTE[scene])
    return out


def data():
    return {"ornament": ornament(), "shapes": shapes(), "presets": [{"id": i, "title": t, "m": m} for i, t, m in PRESETS],
            "funcs": [{"id": i, "title": t} for i, t in FUNCS]}


def validate():
    errs = []
    d = data()
    if len(d["ornament"]) != 2 or any(len(s) < 20 for s in d["ornament"]):
        errs.append("morph: ою сызықтары салынбады")
    for s in d["shapes"]:
        if len(s["pts"]) != N or max(max(abs(x), abs(y)) for x, y in s["pts"]) > 1.0001:
            errs.append(f"morph: «{s['id']}» пішіні {N} нүкте емес не [-1, 1] ауқымынан шығады")
    for ls in LINKS.values():
        for href, _t in ls:
            p = (ROOT / "academy" / href).resolve()
            if not p.exists():
                errs.append(f"morph: сілтеме жоқ бетке апарады ({href})")
    return errs


def links(key):
    return " ".join(f'<a href="{E(h)}">{E(t)}</a>' for h, t in LINKS[key])


def morph_html(page):
    d = data()
    payload = json.dumps(d, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
    presets = "".join(f'<button type="button" class="mo-chip" data-preset="{p["id"]}">{E(p["title"])}</button>' for p in d["presets"])
    funcs = "".join(f'<button type="button" class="mo-chip" data-fn="{f["id"]}" aria-pressed="false">{E(f["title"])}</button>' for f in d["funcs"])
    shapes_ = "".join(f'<button type="button" class="mo-chip" data-shape="{s["id"]}" aria-pressed="false">{E(s["title"])}</button>' for s in d["shapes"])
    sl = lambda key, lab, mn, mx, val: (f'<label class="mo-sl"><span>{lab}</span><input type="range" min="{mn}" max="{mx}" step="0.1" value="{val}" data-m="{key}">'   # noqa: E731
                                        f'<input type="number" min="{mn}" max="{mx}" step="0.1" value="{val}" data-mn="{key}" aria-label="{lab} мәні"></label>')
    body = f"""  <div class="layout single wide">
    <article class="content mo" id="main" data-morph>
      <p class="ac-crumb"><a href="index.html">CS Universe</a> / AO17 MORPH</p>
      <header class="mo-head">
        <h1><span class="mo-brand">AO17 MORPH</span> Математиканың пішінге айналуы</h1>
        <p class="mo-lede">Формуланы өзгертсең - пішін өзгереді. Пішінді сүйресең - формула қайта есептеледі. Үш сахна: матрица кеңістікті түрлендіреді, комплекс функция жазықтықты майыстырады, ал Фурье кез келген суретті айналатын шеңберлерден құрастырады.</p>
      </header>

      <section class="mo-scene" id="matrix" aria-labelledby="mo-h-m" data-scene="matrix">
        <h2 id="mo-h-m"><span class="mo-k">Сызықтық алгебра</span> Матрица кеңістікті қалай өзгертеді</h2>
        <div class="mo-grid">
          <figure class="mo-fig"><canvas data-mo-mcv width="560" height="560" role="img" aria-label="Түрленген жазықтық"></canvas>
            <figcaption>Қызыл және көк нұсқарларды сүйре: олар - матрицаның бағандары. Алтын - қазақ оюы, кеңістікпен бірге өзгереді.</figcaption></figure>
          <div class="mo-side">
            <div class="mo-chips" role="group" aria-label="Дайын матрицалар">{presets}</div>
            <div class="mo-sls">{sl("a", "a", -3, 3, 1)}{sl("b", "b", -3, 3, 0)}{sl("c", "c", -3, 3, 0)}{sl("d", "d", -3, 3, 1)}</div>
            <p class="mo-formula" data-mo-mat aria-live="polite"></p>
            <dl class="mo-read" data-mo-mread></dl>
            <p class="mo-row"><label class="mo-sl mo-t"><span>Бірліктен A-ға</span><input type="range" min="0" max="1" step="0.01" value="1" data-mo-t></label>
              <button class="btn secondary" type="button" data-mo-tplay>Ойнату</button> <button class="btn secondary" type="button" data-mo-reset>Бастапқы күйге қайтару</button></p>
            <p class="mo-links">Сабақтар: {links("matrix")}</p>
          </div>
        </div>
      </section>

      <section class="mo-scene" id="complex" aria-labelledby="mo-h-c" data-scene="complex">
        <h2 id="mo-h-c"><span class="mo-k">Комплекстік анализ</span> Функция жазықтықты қалай майыстырады</h2>
        <div class="mo-chips" role="group" aria-label="Функциялар">{funcs}</div>
        <div class="mo-grid2">
          <figure class="mo-fig"><canvas data-mo-zcv width="440" height="440" role="img" tabindex="0" aria-label="z жазықтығы"></canvas><figcaption>z жазықтығы: алтын нүктені сүйре не нұсқар пернелерімен жылжыт.</figcaption></figure>
          <figure class="mo-fig"><canvas data-mo-wcv width="440" height="440" role="img" tabindex="0" aria-label="w = f(z) жазықтығы"></canvas><figcaption>w = f(z) жазықтығы: нүктені сүйресең (не нұсқар пернелерімен жылжытсаң), оның барлық алғы бейнесі z жазықтығында шығады.</figcaption></figure>
        </div>
        <p class="mo-formula" data-mo-cread aria-live="polite"></p>
        <p class="mo-links">Сабақтар: {links("complex")}</p>
      </section>

      <section class="mo-scene" id="fourier" aria-labelledby="mo-h-f" data-scene="fourier">
        <h2 id="mo-h-f"><span class="mo-k">Фурье анализі</span> Сурет айналатын шеңберлерден</h2>
        <div class="mo-grid">
          <figure class="mo-fig"><canvas data-mo-fcv width="560" height="560" role="img" aria-label="Фурье эпициклдері"></canvas>
            <figcaption>Әр шеңбер - формуланың бір мүшесі: өз жылдамдығымен айналады. Өз суретіңді салу үшін «Өзің сал» батырмасын бас та, тордың үстінде жүргіз.</figcaption></figure>
          <div class="mo-side">
            <div class="mo-chips" role="group" aria-label="Пішіндер">{shapes_}<button type="button" class="mo-chip" data-shape="draw" aria-pressed="false">Өзің сал</button></div>
            <label class="mo-sl mo-k2"><span>Шеңбер саны</span><input type="range" min="1" max="128" step="1" value="24" data-mo-k><output data-mo-kout>24</output></label>
            <p class="mo-row"><button class="btn secondary" type="button" data-mo-fplay>Тоқтату</button></p>
            <p class="mo-formula" data-mo-fread aria-live="polite"></p>
            <p class="mo-note">Аз шеңбермен тек жалпы пішін шығады, көп шеңбермен бұрыштар да айқындалады. Шаршының бұрыштарына қара: Фурье қатары секірісті ешқашан дәл бермейді.</p>
            <p class="mo-links">Сабақтар: {links("fourier")}</p>
          </div>
        </div>
      </section>
      <noscript><p>MORPH JavaScript арқылы жұмыс істейді.</p></noscript>
    </article>
  </div>
  <script type="application/json" id="mo-data">{payload}</script>"""
    return "academy/morph.html", page("academy/morph.html", "AO17 MORPH: математиканың пішінге айналуы",
                                      "Матрица кеңістікті түрлендіреді, комплекс функция жазықтықты майыстырады, Фурье суретті шеңберлерден құрастырады. Формуланы өзгертсең - пішін өзгереді, пішінді сүйресең - формула қайта есептеледі.",
                                      body, scripts=("assets/js/ao17-motion.js", "assets/js/ao17-morph.js"), styles=("assets/css/ao17-morph.css", "assets/css/ao17-motion.css"))
