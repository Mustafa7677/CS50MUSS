#!/usr/bin/env python3
# © 2026 Sagid Mustafa. All Rights Reserved.
"""AO17 курс постерлері: әр курсқа кинопостер (1200×1800) және бөлісуге арналған баннер (1200×630).

Әр постердің бір бейнесі бар (алтын гравюра, SVG): курстың ең басты ойы бір суретте.
    CS50x - миллион беттік кітапты екіге бөлу (екілік іздеу: 20 қадам), Python - жылан-спираль, SQL - дерекқор цилиндрлері,
    AI - нейрон желі, Web - глобус пен браузер терезесі, C++ - жад ұяшықтары мен көрсеткіштер, Java - класс ағашы,
    English - кілт тесігінен жарық түскен есік, Математика - шаңырақ.
Мәтін PT Serif-пен браузерде салынады (Playwright), сондықтан әріп сайттағыдай. Сандар build.py --stats-тан алынады.

    python3 tools/make_posters.py      # assets/img/posters/<курс>.jpg және assets/img/og/course-<курс>.jpg
"""
import json
import math
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets/img/posters"
OG = ROOT / "assets/img/og"
G = "#e6c47c"   # алтын сызық
GL = "#8a6634"  # күңгірт алтын

COURSES = [
    # id, белгі, атауы, ұраны, курс түсі, бірлік, негізі (None - авторлық)
    ("x", "CS50x", "Информатикаға кіріспе", "Миллион беттен бір есімді жиырма қадамда табу", "#087a96", "лекция", "Harvard CS50x"),
    ("python", "CS50P", "Python", "Бір жол код - бір ой", "#3776ab", "лекция", "Harvard CS50P"),
    ("sql", "CS50 SQL", "Дерекқор", "Миллион жолдан бір сұрақпен", "#7c3aed", "лекция", "Harvard CS50 SQL"),
    ("ai", "CS50 AI", "Жасанды интеллект", "Іздеуден нейрон желіге дейін", "#d0306f", "лекция", "Harvard CS50 AI"),
    ("web", "CS50 Web", "Веб", "Бір бет - бүкіл әлемге", "#c2410c", "лекция", "Harvard CS50 Web"),
    ("cpp", "C++", "C++", "Жадқа тікелей қол", "#4f46e5", "лекция", None),
    ("java", "Java", "Java", "Нысандар, ағындар, мұрагерлік", "#d97706", "лекция", None),
    ("en", "English", "Ағылшын тілі", "A0-ден C1-ге дейін алты бөлме", "#0f766e", "сабақ", None),
    ("math", "Математика", "Математика", "Шаңырақтан шексіздікке: 25 пән", "#15803d", "сабақ", None),
]


# ---------------------------------------------------------------- бейнелер (viewBox 0 0 600 600)
def hatch(x0, y0, x1, y1, step=7, ang=1):
    """Гравюра штрихы: тіктөртбұрышты көлбеу сызықтармен толтыру."""
    out = []
    w, h = x1 - x0, y1 - y0
    for k in range(-int(h), int(w), step):
        a = (x0 + k, y0) if ang > 0 else (x0 + k, y1)
        b = (x0 + k + h, y1) if ang > 0 else (x0 + k + h, y0)
        out.append(f"M{a[0]} {a[1]}L{b[0]} {b[1]}")
    return f'<clipPath id="hc{x0}{y0}"><rect x="{x0}" y="{y0}" width="{w}" height="{h}"/></clipPath><path d="{"".join(out)}" stroke="{GL}" stroke-width="1" clip-path="url(#hc{x0}{y0})"/>'


def em_x():
    """Екілік іздеу: ашық кітап ортасынан жыртылады, үстінде 1 000 000 → 500 000 → … → 1."""
    lines = "".join(f'<path d="M{80 + (i % 2) * 6} {250 + i * 22}H{270}M{330} {250 + i * 22}H{520 - (i % 3) * 8}"/>' for i in range(10))
    lab = f'<text x="300" y="140" text-anchor="middle" font-size="28" fill="#efe6d3"><tspan fill="{G}">1 000 000</tspan>  →  500 000  →  250 000  →  …  →  <tspan fill="{G}">1</tspan></text>'
    return f'''<g fill="none" stroke="{G}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">
<path d="M60 220 Q160 196 290 222 L290 500 Q160 476 60 500 Z"/><path d="M310 222 Q440 196 540 220 L540 500 Q440 476 310 500 Z"/>
<path d="M290 222 l-8 30 l14 30 l-10 34 l12 32 l-9 30 l11 34 l-10 30 l10 30 l-10 28" stroke-width="2"/>
<path d="M310 222 l-6 32 l12 28 l-9 36 l11 30 l-8 32 l10 32 l-10 30 l9 28 l-9 30" stroke-width="2"/>
<g stroke-width="1.6" opacity=".55">{lines}</g>
<path d="M60 500 Q160 520 290 512 M310 512 Q440 520 540 500" stroke-width="2"/>
</g>
<g font-family="PT Serif, serif" font-style="italic">{lab}</g>
<text x="300" y="580" text-anchor="middle" font-family="PT Serif, serif" font-size="30" font-style="italic" fill="{G}">log₂ 1 000 000 ≈ 20</text>'''


def em_python():
    pts = []
    for i in range(0, 520):
        t = i / 40
        r = 30 + 15.5 * t
        pts.append((300 + r * math.cos(t), 300 + r * math.sin(t)))
    d = "M" + " L".join(f"{x:.1f} {y:.1f}" for x, y in pts)
    hx, hy = pts[-1]
    t = 519 / 40
    ang = math.degrees(t) + 90
    scales = "".join(f'<path d="M{x - 6:.1f} {y:.1f} q6 -7 12 0" />' for x, y in pts[30::14])
    return f'''<g fill="none" stroke-linecap="round" stroke-linejoin="round">
<path d="{d}" stroke="{G}" stroke-width="34"/><path d="{d}" stroke="#0b0806" stroke-width="27"/>
<g stroke="{GL}" stroke-width="1.6">{scales}</g>
<g transform="translate({hx:.1f} {hy:.1f}) rotate({ang:.1f})"><path d="M-22 0 Q-24 -46 0 -60 Q24 -46 22 0 Z" fill="#0b0806" stroke="{G}" stroke-width="3.5"/>
<circle cx="-9" cy="-36" r="4" fill="{G}"/><circle cx="9" cy="-36" r="4" fill="{G}"/><path d="M0 -60 l0 -16 m0 0 l-7 -8 m7 8 l7 -8" stroke="{G}" stroke-width="2.5"/></g>
<text x="300" y="312" text-anchor="middle" font-family="ui-monospace, Menlo, monospace" font-size="30" fill="{G}" stroke="none">&gt;&gt;&gt;</text></g>'''


def em_sql():
    cyl = ""
    for k in range(3):
        y = 150 + k * 110
        cyl += f'<path d="M150 {y}V{y + 90}A150 34 0 0 0 450 {y + 90}V{y}" fill="#0b0806" stroke="{G}" stroke-width="3"/>'
        cyl += "".join(f'<path d="M{160 + j * 9} {y + 30 + (j % 3) * 2}V{y + 98 - abs(j - 16) * .6}" stroke="{GL}" stroke-width="1"/>' for j in range(0, 33, 2))
        cyl += f'<ellipse cx="300" cy="{y}" rx="150" ry="34" fill="#0b0806" stroke="{G}" stroke-width="3"/>'
    rows = "".join(f'<path d="M330 {470 + i * 26}H560"/>' for i in range(1, 4)) + '<path d="M410 470V574M490 470V574"/>'
    return f'''<g>{"".join(reversed([cyl]))}</g>
<g fill="none" stroke="{G}" stroke-width="2.5"><rect x="330" y="444" width="230" height="130" fill="#0b0806"/><path d="M330 470H560" stroke-width="3"/>{rows}</g>
<g font-family="ui-monospace, Menlo, monospace" font-size="16" fill="{G}"><text x="340" y="463">id</text><text x="420" y="463">esim</text><text x="500" y="463">jyl</text>
<text x="340" y="489" fill="#efe6d3">1</text><text x="420" y="489" fill="#efe6d3">Abai</text><text x="500" y="489" fill="#efe6d3">1845</text></g>
<text x="40" y="560" font-family="ui-monospace, Menlo, monospace" font-size="22" fill="{G}">SELECT * FROM …</text>'''


def em_ai():
    layers = [3, 5, 5, 2]
    pos = [[(90 + li * 140, 300 + (j - (n - 1) / 2) * 92) for j in range(n)] for li, n in enumerate(layers)]
    edges, hot = "", {(0, 1, 1), (1, 1, 3), (2, 3, 0)}
    for li in range(3):
        for a, (x1, y1) in enumerate(pos[li]):
            for b, (x2, y2) in enumerate(pos[li + 1]):
                on = (li, a, b) in hot
                edges += f'<path d="M{x1} {y1}L{x2} {y2}" stroke="{G if on else GL}" stroke-width="{3 if on else 1.1}" opacity="{1 if on else .7}"/>'
    nodes = "".join(f'<circle cx="{x}" cy="{y}" r="22" fill="#0b0806" stroke="{G}" stroke-width="3"/><circle cx="{x}" cy="{y}" r="{9 if (li, j) in ((0, 1), (1, 3), (2, 0), (3, 0)) else 0}" fill="{G}"/>'
                    for li, layer in enumerate(pos) for j, (x, y) in enumerate(layer))
    return f'<g fill="none">{edges}</g>{nodes}<text x="300" y="590" text-anchor="middle" font-family="PT Serif, serif" font-style="italic" font-size="28" fill="{G}">y = σ(Wx + b)</text>'


def em_web():
    g = f'<circle cx="300" cy="320" r="210" fill="#0b0806" stroke="{G}" stroke-width="3"/>'
    g += "".join(f'<ellipse cx="300" cy="320" rx="{rx}" ry="210" fill="none" stroke="{GL if rx else G}" stroke-width="{1.4 if rx else 2.4}"/>' for rx in (60, 120, 170))
    g += f'<path d="M300 110V530" stroke="{G}" stroke-width="2.4"/>'
    for lat in (-140, -70, 0, 70, 140):
        r = math.sqrt(210 ** 2 - lat ** 2)
        g += f'<path d="M{300 - r:.0f} {320 + lat}H{300 + r:.0f}" stroke="{GL if lat else G}" stroke-width="{1.4 if lat else 2.4}"/>'
    win = f'''<g transform="translate(150 60) rotate(-6)"><rect width="300" height="190" rx="12" fill="#0b0806" stroke="{G}" stroke-width="3"/>
<path d="M0 38H300" stroke="{G}" stroke-width="2"/><circle cx="22" cy="19" r="6" fill="{G}"/><circle cx="42" cy="19" r="6" fill="{GL}"/><circle cx="62" cy="19" r="6" fill="{GL}"/>
<rect x="88" y="10" width="190" height="18" rx="9" fill="none" stroke="{GL}" stroke-width="1.5"/>
<text x="150" y="112" text-anchor="middle" font-family="ui-monospace, Menlo, monospace" font-size="26" fill="{G}">&lt;html&gt;</text>
<path d="M60 140H240M60 158H200" stroke="{GL}" stroke-width="2"/></g>'''
    return g + win


def em_cpp():
    cells = ""
    for i in range(6):
        x = 30 + i * 92
        cells += f'<rect x="{x}" y="120" width="86" height="86" fill="#0b0806" stroke="{G}" stroke-width="3"/>{hatch(x + 4, 124, x + 82, 202, 9) if i in (1, 4) else ""}'
        cells += f'<text x="{x + 43}" y="104" text-anchor="middle" font-family="ui-monospace, Menlo, monospace" font-size="15" fill="{GL}">0x{16 + i * 4:02X}</text>'
    vals = ["17", "", "42", "0x24", "", "7"]
    cells += "".join(f'<text x="{73 + i * 92}" y="173" text-anchor="middle" font-family="ui-monospace, Menlo, monospace" font-size="24" fill="#efe6d3">{v}</text>' for i, v in enumerate(vals) if v)
    arrow = f'<path d="M352 210 Q300 300 212 214" fill="none" stroke="{G}" stroke-width="3"/><path d="M212 214 l4 18 m-4 -18 l17 6" stroke="{G}" stroke-width="3" fill="none"/>'
    nodes = ""
    for i in range(3):
        x = 50 + i * 190
        nodes += f'<rect x="{x}" y="380" width="130" height="70" rx="6" fill="#0b0806" stroke="{G}" stroke-width="3"/><path d="M{x + 80} 380V450" stroke="{G}" stroke-width="2"/>'
        nodes += f'<text x="{x + 40}" y="424" text-anchor="middle" font-family="ui-monospace, Menlo, monospace" font-size="24" fill="#efe6d3">{(5, 8, 13)[i]}</text><circle cx="{x + 105}" cy="415" r="6" fill="{G}"/>'
        if i < 2:
            nodes += f'<path d="M{x + 105} 415H{x + 186}" stroke="{G}" stroke-width="3"/><path d="M{x + 186} 415 l-12 -8 m12 8 l-12 8" stroke="{G}" stroke-width="3" fill="none"/>'
    nodes += f'<path d="M485 415h40v40" stroke="{G}" stroke-width="3" fill="none"/><path d="M510 455h30M515 465h20M520 475h10" stroke="{G}" stroke-width="3"/>'
    return cells + arrow + nodes + f'<text x="300" y="560" text-anchor="middle" font-family="ui-monospace, Menlo, monospace" font-size="28" fill="{G}">int *p = &amp;x;</text>'


def em_java():
    box = lambda x, y, w, t: f'<rect x="{x}" y="{y}" width="{w}" height="64" rx="4" fill="#0b0806" stroke="{G}" stroke-width="3"/><text x="{x + w / 2}" y="{y + 41}" text-anchor="middle" font-family="ui-monospace, Menlo, monospace" font-size="22" fill="#efe6d3">{t}</text>'
    g = box(210, 60, 180, "Object")
    kids = [(40, "Shape"), (220, "Thread"), (400, "List")]
    for x, t in kids:
        g += f'<path d="M{x + 80} 230V190H300V124" fill="none" stroke="{G}" stroke-width="2.5"/>' + box(x, 230, 160, t)
    g += f'<path d="M300 124 l-10 18 h20 z" fill="#0b0806" stroke="{G}" stroke-width="2.5"/>'
    for x, t in [(10, "Circle"), (130, "Square")]:
        g += f'<path d="M{x + 55} 400V360H120V294" fill="none" stroke="{GL}" stroke-width="2"/>' + box(x, 400, 110, t)
    # ағындар: параллель жолдар
    for k in range(4):
        y = 420 + k * 34
        g += f'<path d="M290 {y} C350 {y - 20} 400 {y + 20} 460 {y} S560 {y - 14} 590 {y}" fill="none" stroke="{G if k == 1 else GL}" stroke-width="{3 if k == 1 else 1.6}"/>'
    return g + f'<text x="440" y="580" text-anchor="middle" font-family="PT Serif, serif" font-style="italic" font-size="24" fill="{G}">көп ағын</text>'


def em_en():
    return f'''<defs><radialGradient id="kh"><stop offset="0" stop-color="#fff4d6"/><stop offset=".45" stop-color="#f6e2b0" stop-opacity=".6"/><stop offset="1" stop-color="#f6e2b0" stop-opacity="0"/></radialGradient></defs>
<path d="M110 590 V250 A190 190 0 0 1 490 250 V590" fill="#0b0806" stroke="{G}" stroke-width="4"/>
<path d="M135 590 V256 A165 165 0 0 1 465 256 V590" fill="none" stroke="{GL}" stroke-width="2"/>
{hatch(140, 330, 290, 590, 8)}{hatch(310, 330, 460, 590, 8, -1)}
<path d="M300 92 V590" stroke="#f6e2b0" stroke-width="2.5"/>
<g fill="none" stroke="{G}" stroke-width="3"><rect x="160" y="300" width="110" height="140" rx="6" fill="#0b0806"/><rect x="330" y="300" width="110" height="140" rx="6" fill="#0b0806"/><rect x="160" y="465" width="110" height="110" rx="6" fill="#0b0806"/><rect x="330" y="465" width="110" height="110" rx="6" fill="#0b0806"/></g>
<circle cx="350" cy="455" r="70" fill="url(#kh)"/><path d="M350 444 a9 9 0 1 1 .1 0 l6 24 h-12 z" fill="#fff4d6"/>
<g font-family="PT Serif, serif" font-weight="700" font-size="30" fill="{G}" text-anchor="middle"><text x="215" y="384">A0</text><text x="385" y="384">C1</text></g>'''


def em_math():
    g = ""
    for i in range(24):
        a = math.radians(i * 15)
        g += f'<path d="M{300 + 130 * math.cos(a):.1f} {300 + 130 * math.sin(a):.1f}L{300 + 290 * math.cos(a):.1f} {300 + 290 * math.sin(a):.1f}" stroke="{G if i % 6 == 0 else GL}" stroke-width="{3 if i % 6 == 0 else 2}"/>'
    g += f'<circle cx="300" cy="300" r="130" fill="#0b0806" stroke="{G}" stroke-width="6"/><circle cx="300" cy="300" r="116" fill="none" stroke="{GL}" stroke-width="2"/>'
    for dy in (-50, 0, 50):
        half = math.sqrt(116 ** 2 - dy ** 2)
        g += f'<path d="M{300 - half:.1f} {300 + dy} Q300 {300 + dy - 22} {300 + half:.1f} {300 + dy}" fill="none" stroke="{G}" stroke-width="5"/>'
        g += f'<path d="M{300 + dy} {300 - half:.1f} Q{300 + dy - 22} 300 {300 + dy} {300 + half:.1f}" fill="none" stroke="{G}" stroke-width="5"/>'
    g += f'<path d="M300 300 L430 300" stroke="#f6e2b0" stroke-width="2.5" stroke-dasharray="6 6"/><path d="M360 300 A60 60 0 0 0 {300 + 60 * math.cos(math.radians(-15)):.1f} {300 + 60 * math.sin(math.radians(-15)):.1f}" fill="none" stroke="#f6e2b0" stroke-width="2"/>'
    return g + f'<text x="372" y="282" font-family="PT Serif, serif" font-style="italic" font-size="24" fill="#f6e2b0">15°</text>'


EMBLEM = {"x": em_x, "python": em_python, "sql": em_sql, "ai": em_ai, "web": em_web, "cpp": em_cpp, "java": em_java, "en": em_en, "math": em_math}


# ---------------------------------------------------------------- беттер
CSS = """
@import url("FONTS");
* { box-sizing: border-box; margin: 0; }
body { width: WPX; height: HPX; overflow: hidden; background: #0b0806; font-family: "PT Serif", Georgia, serif; color: #f3ead6; }
.p { position: relative; width: 100%; height: 100%; overflow: hidden;
  background: radial-gradient(70% 46% at 50% 24%, color-mix(in srgb, var(--c) 34%, transparent), transparent 72%), radial-gradient(120% 80% at 50% 30%, #1d150e, #0b0806 70%); }
.p::before { content: ""; position: absolute; left: 50%; top: -12%; width: 70%; height: 80%; translate: -50% 0; background: radial-gradient(50% 50% at 50% 40%, rgb(243 213 138 / .16), transparent 70%); }
.p::after { content: ""; position: absolute; inset: 0; opacity: .16; mix-blend-mode: overlay; background: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>"); }
.frame { position: absolute; inset: 28px; border: 1px solid rgb(217 180 104 / .35); pointer-events: none; }
.frame::after { content: ""; position: absolute; inset: 8px; border: 1px solid rgb(217 180 104 / .15); }
.pre { font: italic 400 30px/1 "PT Serif"; color: #e6c47c; letter-spacing: .08em; }
.code { display: inline-block; font: 700 24px/1 "PT Serif"; letter-spacing: .18em; color: #0b0806; background: #e6c47c; padding: 9px 16px 8px; border-radius: 2px; }
.em svg { display: block; width: 100%; height: 100%; overflow: visible; }
h1 { font: 700 var(--fs)/1.02 "PT Serif"; letter-spacing: -.005em; text-wrap: balance; }
.tag { font: italic 400 38px/1.3 "PT Serif"; color: #e6c47c; text-wrap: balance; }
.bill { font: 400 22px/1.65 "PT Serif"; color: rgb(232 220 194 / .72); letter-spacing: .04em; }
.bill b { color: #f3ead6; font-weight: 700; }
.logo svg { height: 46px; width: auto; display: block; }
/* постер 1200×1800 */
.v { text-align: center; }
.v .top { position: absolute; left: 0; right: 0; top: 96px; display: grid; justify-items: center; gap: 26px; }
.v .em { position: absolute; left: 190px; top: 250px; width: 820px; height: 820px; }
.v .ttl { position: absolute; left: 90px; right: 90px; top: 1120px; display: grid; justify-items: center; gap: 26px; }
.v .rule { width: 260px; height: 1px; background: linear-gradient(90deg, transparent, #c9a24a, transparent); }
.v .foot { position: absolute; left: 90px; right: 90px; bottom: 92px; display: grid; justify-items: center; gap: 30px; }
/* баннер 1200×630 */
.h .em { position: absolute; left: 50px; top: 55px; width: 520px; height: 520px; }
.h .side { position: absolute; left: 610px; right: 70px; top: 0; bottom: 0; display: grid; align-content: center; gap: 22px; }
.h .tag { font-size: 30px; }
.h .bill { font-size: 19px; }
.h .logo svg { height: 36px; }
.h .pre { font-size: 24px; }
"""


def logo():
    svg = (ROOT / "assets/img/brand/ao17-logo-light.svg").read_text(encoding="utf8")
    return svg[svg.index("<svg"):]


def page(c, stats, kind):
    cid, code, name, tag, color, unit, base = c
    st = stats[cid]
    ex = f'{st["ex"]} тапсырма' if cid != "math" else f'{st["ex"]} жаттығу'
    lines = [f'<b>{st["lect"]} {unit}</b> · {ex} · {st["quiz"]} тест сұрағы',
             "Ана тілінде · Тегін · Браузерде",
             (f"Негізі: {base} (CC BY-NC-SA 4.0) · Қазақша нұсқа: Sagid Mustafa" if base else "Авторлық курс: Sagid Mustafa")]
    fs = 150 if len(name) <= 8 else 118 if len(name) <= 14 else 104
    em = f'<div class="em"><svg viewBox="0 0 600 600" aria-hidden="true">{EMBLEM[cid]()}</svg></div>'
    if kind == "v":
        body = f'''<div class="p v" style="--c:{color}"><div class="frame"></div>
<div class="top"><span class="pre">AO17 ұсынады</span><span class="code">{code}</span></div>{em}
<div class="ttl"><h1 style="--fs:{fs}px">{name}</h1><div class="rule"></div><p class="tag">{tag}</p></div>
<div class="foot"><p class="bill">{"<br>".join(lines)}</p><div class="logo">{logo()}</div></div></div>'''
        w, h = 1200, 1800
    else:
        body = f'''<div class="p h" style="--c:{color}"><div class="frame"></div>{em}
<div class="side"><span class="pre">AO17 ұсынады · {code}</span><h1 style="--fs:{76 if len(name) <= 10 else 62 if len(name) <= 17 else 56}px">{name}</h1><p class="tag">{tag}</p><p class="bill">{"<br>".join(lines[:2])}</p><div class="logo">{logo()}</div></div></div>'''
        w, h = 1200, 630
    css = CSS.replace("FONTS", (ROOT / "assets/fonts/fonts.css").as_uri()).replace("WPX", f"{w}px").replace("HPX", f"{h}px")
    return f'<!doctype html><html lang="kk"><head><meta charset="utf-8"><style>{css}</style></head><body>{body}</body></html>', w, h


RENDER = """
const { chromium } = require("playwright");
(async () => {
  const jobs = JSON.parse(require("fs").readFileSync(process.argv[2], "utf8"));
  const b = await chromium.launch();
  for (const j of jobs) {
    const p = await b.newPage({ viewport: { width: j.w, height: j.h } });
    await p.goto(j.src);
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(150);
    await p.screenshot({ path: j.out, type: "jpeg", quality: 86 });
    await p.close();
  }
  await b.close();
})();
"""


def main():
    stats = json.loads(subprocess.check_output(["python3", str(ROOT / "tools/build.py"), "--stats"]))["site_stats"]["by_course"]
    OUT.mkdir(parents=True, exist_ok=True)
    OG.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        jobs = []
        for c in COURSES:
            for kind, out in (("v", OUT / f"{c[0]}.jpg"), ("h", OG / f"course-{c[0]}.jpg")):
                html, w, h = page(c, stats, kind)
                f = Path(tmp) / f"{c[0]}-{kind}.html"
                f.write_text(html, encoding="utf8")
                jobs.append({"src": f.as_uri(), "out": str(out), "w": w, "h": h})
        jf = Path(tmp) / "jobs.json"
        jf.write_text(json.dumps(jobs), encoding="utf8")
        js = Path(tmp) / "render.js"
        js.write_text(RENDER, encoding="utf8")
        subprocess.run(["node", str(js), str(jf)], check=True, cwd=ROOT / "tests")
    for c in COURSES:
        print(c[0], f'{(OUT / f"{c[0]}.jpg").stat().st_size // 1024} КБ', f'{(OG / f"course-{c[0]}.jpg").stat().st_size // 1024} КБ')


if __name__ == "__main__":
    main()
