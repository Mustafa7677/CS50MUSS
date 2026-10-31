#!/usr/bin/env python3
# © 2026 Sagid Mustafa. All Rights Reserved.
"""AO17 «Шақыру» фильмін бір файлға жинайды: film/src/film.html -> film/index.html.

Шығыс файл дербес: PT Serif қаріптері (OFL) мен архивтік суреттер (assets/img/film/, Википедия / Wikimedia Commons,
қоғамдық игілік, бір фото автордікі; дерек көздері assets/data/film-media.json ішінде) base64 болып ішіне енеді, сондықтан фильмді интернетсіз де, жеке файл ретінде жіберіп те ашуға болады.
Генерацияланатын бөліктер (қолжазба жолдары, карта, код бағандары) кездейсоқ емес: тұқымы тұрақты, нәтиже әр жинауда бірдей.

    python3 tools/make_film.py

Академия фильмдері (film/code/, film/math/, film/en/) де осы жерде жиналады: film/src/academy-*.html + ортақ base.css,
academy.css және engine.js. Олар сайттың қаріптерін (assets/fonts/fonts.css) қолданады, сондықтан жеңіл.
"""
import base64
import html
import json
import math
import random
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import make_posters  # noqa: E402  (финалдағы үш академияның бейнесі - курс постерлерімен бір)

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "film" / "src" / "film.html"
OUT = ROOT / "film" / "index.html"


def b64(path, mime):
    return f"data:{mime};base64," + base64.b64encode(path.read_bytes()).decode()


def fonts():
    """fonts.css ішіндегі PT Serif блоктары: url(...) -> data URI (cyrillic, cyrillic-ext, latin; 400, 400i, 700)."""
    css = (ROOT / "assets/fonts/fonts.css").read_text(encoding="utf8")
    out = []
    for block in re.findall(r"@font-face\s*{[^}]*}", css):
        if "PT Serif" not in block or "vietnamese" in block or "greek" in block:
            continue
        m = re.search(r"url\((?:'|\")?([^)'\"]+)(?:'|\")?\)", block)
        f = ROOT / "assets/fonts" / Path(m.group(1)).name
        if not f.exists() or "latin-ext" in f.name:
            continue
        out.append(block.replace(m.group(0), f'url("{b64(f, "font/woff2")}")'))
    assert len(out) >= 6, "PT Serif қаріп файлдары табылмады"
    return "\n".join(out)


def logo():
    svg = (ROOT / "assets/img/brand/ao17-logo-light.svg").read_text(encoding="utf8")
    body = svg[svg.index(">", svg.index("<svg")) + 1: svg.rindex("</svg>")]
    return re.sub(r"<title>.*?</title>|<!--.*?-->", "", body, flags=re.S).strip()


def hand(rng):
    """Петиция бетіндегі қолжазба жолдары: әр жол - иректелген бір сызық (pathLength=1, JS сызып шығады)."""
    out = []
    for i in range(9):
        y = 14 + i * 22
        x, end = 10 + (24 if i == 0 else 0), 290 - (rng.random() * 70 if i in (3, 8) else rng.random() * 12)
        d = f"M{x:.0f} {y}"
        while x < end:
            step = 6 + rng.random() * 7
            d += f" q{step / 2:.1f} {-3 - rng.random() * 3:.1f} {step:.1f} {rng.random() * 2 - 1:.1f}"
            x += step
        out.append(f'<path d="{d}"/>')
    return "".join(out)


CITIES = [("Уфа", 170, 70), ("Орал", 55, 175), ("Қостанай", 300, 120), ("Торғай", 330, 250), ("Ақмола", 470, 170),
          ("Қарқаралы", 570, 250), ("Семей", 660, 150), ("Түркістан", 410, 420), ("Верный", 640, 440)]
OB = (150, 190)


def routes():
    out = []
    for name, x, y in CITIES:
        mx, my = (x + OB[0]) / 2, (y + OB[1]) / 2 - 40 - abs(x - OB[0]) * .08
        out.append(f'<path d="M{x} {y} Q{mx:.0f} {my:.0f} {OB[0]} {OB[1]}"/>')
    return "".join(out)


def cities():
    return "".join(f'<circle cx="{x}" cy="{y}" r="3.5" fill="#d9b468"/><text x="{x + 9}" y="{y + 5}">{n}</text>' for n, x, y in CITIES)


def credits():
    """Фильм соңындағы «Дерек көздері»: assets/data/film-media.json-дағы әр сурет (не, кімдікі, лицензия, сілтеме)."""
    out = []
    for c in json.loads((ROOT / "assets/data/film-media.json").read_text(encoding="utf8")).values():
        link = f' <a href="{html.escape(c["page"])}" rel="noopener">дерек көзі</a>' if c.get("page") else ""
        out.append(f'<li>{html.escape(c["what"])}, {html.escape(c["date"])}. {html.escape(c["author"])}. {html.escape(c["license"])}. {html.escape(c["source"])}.{link}</li>')
    return "".join(out)


def code_cols(rng):
    """Бағдарламалау әлемінің артқы жоспары: баяу ағатын код бағандары (тек декор, aria-hidden)."""
    lines = ["def oqu(sabaq):", "  for bet in sabaq:", "    oqu(bet)", "SELECT esim FROM alash;", "int main() {", "  return 0;", "}",
             "const jol = 'bilim';", "print('Сәлем, әлем!')", "while (true) oqy();", "class Alash {}", "x = [1917, 2026]"]
    out = []
    for k in range(7):
        txt = "\n".join(rng.choice(lines) for _ in range(18))
        out.append(f'<i style="left:{4 + k * 14}%;animation:codeflow {18 + k * 3}s linear {-k * 2}s infinite">{txt}</i>')
    return "".join(out)


# ---------------------------------------------------------------- академия фильмдері: ортақ бөліктер
def chrome_top(skip_label):
    return f'''<a class="sr" href="#stage" id="skipLink">{skip_label}</a>
<div class="top">
  <a class="brand" href="../../index.html" aria-label="AO17 басты беті"><svg viewBox="0 0 462 136" aria-hidden="true">{logo()}</svg></a>
  <div class="r">
    <button class="btn" id="snd" type="button" aria-pressed="false" aria-label="Дыбыс: өшірулі"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/></svg><span>Дыбыс</span></button>
    <button class="btn" id="skip" type="button">Өткізу</button>
  </div>
</div>'''


CHROME_UI = '''<canvas id="dust" aria-hidden="true"></canvas>
<canvas id="grain" width="160" height="160" aria-hidden="true"></canvas>
<div id="flash" aria-hidden="true"></div>
<div class="letterbox" id="lbT" aria-hidden="true"></div><div class="letterbox" id="lbB" aria-hidden="true"></div>
<p class="hint" id="hint">Фильм өзі жүреді · скролл не сырғыту камераны алға-артқа жүргізеді</p>
<div id="ui">
  <div class="cap" aria-live="polite"><span class="ch" id="capCh"></span><span class="src" id="capSrc"></span></div>
  <div class="bar">
    <button class="btn" id="play" type="button" aria-label="Тоқтату"><svg viewBox="0 0 24 24" aria-hidden="true"><path id="playIco" d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg></button>
    <div class="tl" id="tl" role="slider" tabindex="0" aria-label="Фильмнің уақыты" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div class="track"></div><div class="fill" id="fill"></div></div>
  </div>
</div>'''


# ---- «Әріптен кодқа»
SCHWA = ["..####..", ".#....#.", ".......#", ".......#", "########", "#......#", "#......#", ".#....#.", "..####..", "........"]


def glyph():
    out = []
    for r, row in enumerate(SCHWA):
        for c, ch in enumerate(row):
            out.append(f'<rect x="{c * 10 + .6}" y="{r * 10 + .6}" width="8.8" height="8.8" rx="1"{' class="on"' if ch == "#" else ""}/>')
    return "".join(out)


def bits(byte):
    return "".join(f"<i>{b}</i>" for b in f"{byte:08b}")


def board(rng):
    """Процессор мен сымдар: орталықтағы чиптен төрт жаққа тік бұрышты (45° бүгілген) жолдар."""
    out, cx, cy = [], 500, 300
    paths = []
    for side in range(4):
        for k in range(7):
            o = -90 + k * 30
            if side == 0: x0, y0, d = cx + o, cy - 110, (0, -1)
            elif side == 1: x0, y0, d = cx + 110, cy + o, (1, 0)
            elif side == 2: x0, y0, d = cx + o, cy + 110, (0, 1)
            else: x0, y0, d = cx - 110, cy + o, (-1, 0)
            a = 30 + rng.random() * 60
            b = rng.choice([-1, 1]) * (20 + rng.random() * 50)
            x1, y1 = x0 + d[0] * a, y0 + d[1] * a
            x2, y2 = x1 + (b if d[1] else 0) + d[0] * abs(b), y1 + (b if d[0] else 0) + d[1] * abs(b)
            x3, y3 = x2 + d[0] * 600, y2 + d[1] * 600
            paths.append(f"M{x0:.0f} {y0:.0f}L{x1:.0f} {y1:.0f}L{x2:.0f} {y2:.0f}L{x3:.0f} {y3:.0f}")
    out += [f'<path class="tr" d="{d}" data-draw/>' for d in paths]
    out += [f'<path class="pulse" d="{d}" pathLength="1" style="opacity:0"/>' for i, d in enumerate(paths) if i % 3 == 0]
    out.append(f'<g class="chip"><rect x="{cx - 110}" y="{cy - 110}" width="220" height="220" rx="10" fill="#0b1416" stroke="rgb(140 200 210 / .55)" stroke-width="2"/>')
    for r in range(4):
        for c in range(4):
            focus = " data-focus" if (r, c) == (1, 1) else ""
            out.append(f'<rect class="core" x="{cx - 88 + c * 45}" y="{cy - 88 + r * 45}" width="38" height="38" rx="3"{focus}/>')
    out.append(f'<text x="{cx}" y="{cy + 100}" text-anchor="middle" font-family="ui-monospace, Menlo, monospace" font-size="11" fill="rgb(140 200 210 / .5)">CPU</text></g>')
    return "".join(out)


# ---- «Шаңырақтан шексіздікке» (центр 500,500; шаңырақ радиусы 150)
def roof(sfx):
    out = [f'''<defs><radialGradient id="sky{sfx}" cx=".5" cy=".45" r=".6"><stop offset="0" stop-color="#fbf0d2"/><stop offset=".7" stop-color="#e3c993"/><stop offset="1" stop-color="#b58f52"/></radialGradient>
<linearGradient id="uyk{sfx}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8a6036"/><stop offset="1" stop-color="#4a3018"/></linearGradient></defs>''',
           '<rect x="-500" y="-500" width="2000" height="2000" fill="#1c130c"/>']
    for i in range(24):
        a = i * 15
        out.append(f'<g transform="rotate({a} 500 500)"><path class="uyk" d="M655 492 L1150 484 L1150 516 L655 508 Z" fill="url(#uyk{sfx})"/></g>')
    out.append(f'<circle class="sky" cx="500" cy="500" r="139" fill="url(#sky{sfx})"/>')
    for dy in (-62, 0, 62):
        half = math.sqrt(139 ** 2 - dy ** 2)
        out.append(f'<path d="M{500 - half:.1f} {500 + dy} Q500 {500 + dy - 26} {500 + half:.1f} {500 + dy}" fill="none" stroke="#6b4a2c" stroke-width="9"/>')
        out.append(f'<path d="M{500 + dy} {500 - half:.1f} Q{500 + dy - 26} 500 {500 + dy} {500 + half:.1f}" fill="none" stroke="#5b3d24" stroke-width="9"/>')
    out.append('<circle cx="500" cy="500" r="150" fill="none" stroke="#7a5434" stroke-width="22"/><circle cx="500" cy="500" r="137" fill="none" stroke="#3e2a18" stroke-width="4"/>')
    return "".join(out)


def roof_lines():
    out = [f'<line x1="{500 + 160 * math.cos(math.radians(a)):.1f}" y1="{500 + 160 * math.sin(math.radians(a)):.1f}" x2="{500 + 480 * math.cos(math.radians(a)):.1f}" y2="{500 + 480 * math.sin(math.radians(a)):.1f}" stroke="#d9b468" stroke-width="2"/>' for a in range(0, 360, 15)]
    out.append('<circle cx="500" cy="500" r="150" fill="none" stroke="#d9b468" stroke-width="3"/><circle cx="500" cy="500" r="480" fill="none" stroke="#d9b468" stroke-width="1"/>')
    return "".join(out)


def dia():
    c, r, a15 = 500, 150, math.radians(15)
    ex, ey = c + r * math.cos(a15), c - r * math.sin(a15)
    ax, ay = c + 64 * math.cos(a15), c - 64 * math.sin(a15)
    return "".join([
        f'<path class="g" d="M{c + r} {c} A{r} {r} 0 1 0 {c - r} {c} A{r} {r} 0 1 0 {c + r} {c}" data-draw/>',
        f'<path class="g" d="M{c} {c} L{c + r} {c}" data-draw/>',
        f'<path class="g" d="M{c} {c} L{ex:.1f} {ey:.1f}" data-draw/>',
        f'<path class="g" d="M{c + 64} {c} A64 64 0 0 0 {ax:.1f} {ay:.1f}" data-draw/>',
        f'<path class="g" d="M{c - 420} {c} L{c + 420} {c} M{c} {c - 420} L{c} {c + 420}" style="stroke-width:1;opacity:.5" data-draw/>',
        f'<circle cx="{c}" cy="{c}" r="6" fill="#e6c47c"/>',
        f'<text class="lbl" x="{c - 30}" y="{c + 30}">O</text>',
        f'<text class="lbl" x="{c + 70}" y="{c + 28}">r</text>',
        f'<text class="lbl" x="{c + 76}" y="{c - 14}">15°</text>',
        f'<circle cx="{ex:.1f}" cy="{ey:.1f}" r="5" fill="#e6c47c" data-focus/>',
    ])


def kerege():
    """Тор: x ± y = 38 + 76k түзулері, [-380,380]×[-190,190] қорабында. Орталық ромб (0,0) айналасында ерекшеленеді."""
    X, Y, out = 380, 190, []
    for sign, cls in ((1, ""), (-1, " b")):
        for k in range(-12, 12):
            cval = 38 + 76 * k
            pts = []
            for x in (-X, X):          # y = sign*(cval - x)... түзу: x + sign*y = cval
                y = (cval - x) * sign
                if -Y <= y <= Y: pts.append((x, y))
            for y in (-Y, Y):
                x = cval - sign * y
                if -X <= x <= X: pts.append((x, y))
            pts = sorted(set(pts))
            if len(pts) >= 2:
                (x1, y1), (x2, y2) = pts[0], pts[-1]
                out.append(f'<line class="slat{cls}" x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}"/>')
    out.append('<g class="hl" style="opacity:0"><polygon class="rh" points="-38,0 0,-38 38,0 0,38"/><line class="dg" x1="-38" y1="0" x2="38" y2="0"/><line class="dg" x1="0" y1="-38" x2="0" y2="38"/></g>')
    out.append('<circle cx="0" cy="0" r="3" fill="none" data-focus/>')
    return "".join(out)


def wave():
    cx, cy, r, x0, L = 170, 200, 110, 340, 600
    d = f"M{x0} {cy}" + "".join(f" L{x0 + L * i / 120:.1f} {cy - r * math.sin(2 * math.pi * i / 120):.1f}" for i in range(1, 121))
    return "".join([
        f'<path class="ax" d="M30 {cy}H{x0 + L + 30} M{cx} {cy - r - 40}V{cy + r + 40} M{x0} {cy - r - 30}V{cy + r + 30}"/>',
        f'<circle class="cir" cx="{cx}" cy="{cy}" r="{r}"/>',
        f'<path class="sin" d="{d}" pathLength="1" style="stroke-dasharray:1;stroke-dashoffset:1"/>',
        f'<line class="rad" x1="{cx}" y1="{cy}" x2="{cx + r}" y2="{cy}"/>',
        f'<line class="proj" x1="{cx + r}" y1="{cy}" x2="{x0}" y2="{cy}"/>',
        f'<circle class="dot" cx="{cx + r}" cy="{cy}" r="8" fill="#f6e2b0"/>',
        f'<circle class="wdot" cx="{x0}" cy="{cy}" r="7" fill="#f6e2b0" data-focus/>',
        f'<text x="{x0 + L - 60}" y="{cy - r - 40}">y = sin x</text>',
        f'<text x="{x0 + L / 2 - 10}" y="{cy + 34}">π</text><text x="{x0 + L - 18}" y="{cy + 34}">2π</text>',
    ])


# ---- «Кітапхана бөлмелері»
def door():
    return '''<defs><linearGradient id="oak" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3b2415"/><stop offset=".5" stop-color="#5a3820"/><stop offset="1" stop-color="#2e1c10"/></linearGradient>
<radialGradient id="kh"><stop offset="0" stop-color="#fff4d6"/><stop offset=".5" stop-color="#f6e2b0" stop-opacity=".7"/><stop offset="1" stop-color="#f6e2b0" stop-opacity="0"/></radialGradient></defs>
<path d="M20 620 V200 A180 180 0 0 1 380 200 V620 Z" fill="#160d07"/>
<path d="M40 620 V205 A160 160 0 0 1 360 205 V620 Z" fill="url(#oak)"/>
<path d="M200 48 V620" stroke="#1d120a" stroke-width="5"/>
<path class="gap" d="M200 52 V620" stroke="#f6e2b0" stroke-width="2" style="filter:drop-shadow(0 0 6px #f6e2b0)"/>
<g fill="none" stroke="#2a190e" stroke-width="5"><rect x="70" y="260" width="100" height="150" rx="6"/><rect x="230" y="260" width="100" height="150" rx="6"/><rect x="70" y="440" width="100" height="140" rx="6"/><rect x="230" y="440" width="100" height="140" rx="6"/><path d="M70 230 A130 130 0 0 1 170 110 M330 230 A130 130 0 0 0 230 110"/></g>
<circle cx="246" cy="420" r="11" fill="#b98d4a"/>
<circle class="glow" cx="246" cy="452" r="60" fill="url(#kh)" style="mix-blend-mode:screen"/>
<path d="M246 440 a8 8 0 1 1 0.1 0 l5 22 h-10 z" fill="#fff4d6" data-focus/>'''


LEVELS = [("A0", "Нөлден"), ("A1", "Алғашқы сөйлем"), ("A2", "Күнделікті тіл"), ("B1", "Еркін әңгіме"), ("B2", "Жұмыс тілі"), ("C1", "Терең тіл")]


def stairs():
    out = ['<defs><linearGradient id="stepGlow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6e2b0" stop-opacity=".55"/><stop offset="1" stop-color="#c9a24a" stop-opacity=".08"/></linearGradient></defs>']
    for i, (lv, ds) in enumerate(LEVELS):
        x, y, w, h = 20 + i * 145, 440 - i * 70, 140, 80 + i * 70
        focus = ' data-focus' if i == 5 else ""
        out.append(f'<g class="st"><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="3"/><rect class="lit" x="{x}" y="{y}" width="{w}" height="{h}" rx="3" style="opacity:0"/>'
                   f'<text class="lv" x="{x + 14}" y="{y + 42}"{focus}>{lv}</text><text class="ds" x="{x + 14}" y="{y + 66}">{ds}</text></g>')
    return "".join(out)


SKILLS = {
    "SK_LISTEN": '<path d="M60 90 C40 90 40 60 60 50 C70 20 120 20 120 55 C120 80 95 80 95 100 C95 115 75 115 70 105" data-draw/><path d="M140 40 Q155 60 140 80 M155 28 Q178 60 155 92" data-draw/>',
    "SK_SPEAK": '<path d="M30 25 H150 Q165 25 165 40 V75 Q165 90 150 90 H75 L50 110 V90 H45 Q30 90 30 75 V40 Q30 25 45 25" data-draw/><path d="M55 58 h8 l6 -14 l8 28 l8 -22 l6 8 h8 l6 -12 l8 20 l6 -8 h14" data-draw/>',
    "SK_READ": '<path d="M100 30 C80 20 50 20 25 28 V100 C50 92 80 92 100 102 C120 92 150 92 175 100 V28 C150 20 120 20 100 30 V102" data-draw/><path d="M40 45 H85 M40 60 H85 M40 75 H80 M115 45 H160 M115 60 H160 M115 75 H150" data-draw/>',
    "SK_WRITE": '<path d="M20 98 H180" data-draw/><path d="M150 20 L170 40 L120 90 L95 98 L102 72 Z" data-draw/><text class="hello" x="18" y="60" style="opacity:0">Hello,</text>',
}


def build_academy(name, out_dir, extra, rng):
    s = (ROOT / "film/src" / f"academy-{name}.html").read_text(encoding="utf8")
    base = (ROOT / "film/src/base.css").read_text(encoding="utf8") + (ROOT / "film/src/academy.css").read_text(encoding="utf8")
    rep = {"/*{{BASE}}*/": base, "<!--{{CHROME_TOP}}-->": chrome_top("Фильмді өткізіп, академияға өту"), "<!--{{CHROME_UI}}-->": CHROME_UI,
           "/*{{ENGINE}}*/": (ROOT / "film/src/engine.js").read_text(encoding="utf8")}
    rep.update(extra)
    for k, v in rep.items():
        assert k in s, f"{name}: үлгіде {k} жоқ"
        while k in s:   # бірнеше рет кездессе, әрқайсысы өз нұсқасын алады (тізім берілсе)
            s = s.replace(k, v.pop(0) if isinstance(v, list) else v, 1)
    assert "{{" not in s, f"{name}: толтырылмаған орын қалды"
    out = ROOT / "film" / out_dir / "index.html"
    out.parent.mkdir(exist_ok=True)
    out.write_text(s, encoding="utf8")
    print(f"film/{out_dir}/index.html: {len(s.encode()) / 1024:.0f} КБ")


def academies():
    rng = random.Random(2026)
    build_academy("code", "code", {"<!--{{GLYPH}}-->": glyph(), "<!--{{BITS1}}-->": bits(0xD3), "<!--{{BITS2}}-->": bits(0x98),
                                   "<!--{{BOARD}}-->": board(rng), "<!--{{CODE}}-->": code_cols(rng)}, rng)
    build_academy("math", "math", {"<!--{{ROOF}}-->": [roof("a"), roof("b")], "<!--{{DIA}}-->": dia(), "<!--{{KEREGE}}-->": kerege(),
                                   "<!--{{WAVE}}-->": wave(), "<!--{{ROOF_LINES}}-->": roof_lines()}, rng)
    build_academy("en", "en", {"<!--{{DOOR}}-->": door(), "<!--{{STAIRS}}-->": stairs(), **{f"<!--{{{{{k}}}}}-->": v for k, v in SKILLS.items()}}, rng)


def main():
    rng = random.Random(1917)
    s = SRC.read_text(encoding="utf8")
    img = lambda n: b64(ROOT / "assets/img/film" / (n + ".jpg"), "image/jpeg")
    rep = {
        "/*{{FONTS}}*/": fonts() + "\n@keyframes codeflow { from { transform: translateY(0); } to { transform: translateY(-50%); } }",
        "<!--{{LOGO}}-->": logo(),
        "<!--{{HAND}}-->": hand(rng),
        "<!--{{ROUTES}}-->": routes(),
        "<!--{{CITIES}}-->": cities(),
        "<!--{{EM_CODE}}-->": make_posters.em_python(),
        "<!--{{EM_MATH}}-->": make_posters.em_math(),
        "<!--{{EM_EN}}-->": make_posters.em_en(),
        "<!--{{CREDITS}}-->": credits(),
        "{{IMG_BOKEIKHAN}}": img("bokeikhan"),
        "{{IMG_BAITURSYNULY}}": img("baitursynuly"),
        "{{IMG_DULATULY}}": img("dulatuly"),
        "{{IMG_TRIO}}": img("trio-1913"),
        "{{IMG_ALASH1918}}": img("alash-1918"),
        "{{IMG_OYAN}}": img("oyan-qazaq"),
        "{{IMG_QAZAQ}}": img("qazaq-1913"),
        "{{IMG_ORB_VOKZAL}}": img("orenburg-vokzal"),
        "{{IMG_ORB_SOBRANIE}}": img("orenburg-sobranie"),
        "{{IMG_ESEP}}": img("esep-quraly"),
        "{{IMG_TILQURAL}}": img("til-qural"),
        "{{IMG_MAP_SEMIPALATINSK}}": img("map-semipalatinsk"),
    }
    for k, v in rep.items():
        assert k in s, f"үлгіде {k} жоқ"
        s = s.replace(k, v)
    assert "{{" not in s, "толтырылмаған орын қалды"
    OUT.write_text(s, encoding="utf8")
    print(f"film/index.html: {len(s.encode()) / 1024:.0f} КБ")
    academies()


if __name__ == "__main__":
    main()
