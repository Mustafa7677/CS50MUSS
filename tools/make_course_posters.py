#!/usr/bin/env python3
# © 2026 AO17 командасы. All Rights Reserved.
"""AO17 CS курсының постерлері: комикс журналының мұқабалары.

AO17 CS - комикс-курс, сондықтан әр апта - журналдың бір нөмірі (№ 01 ... № 12). Мұқабада апта комиксінің бейнесі
(ауылдағы шамдар, әженің бауырсағы, дастарқанның басы ...), кейіпкер (Нұрай не Мустафа - tools/academy/comic.py-дің өз суреттері),
оның бір ауыз сөзі және апта сұрағы. Екі арнайы шығарылым: курстың негізгі постері (шаңырақ-схема астында Нұрай, Мустафа, Бота)
және 2-бөлімнің постері «Технологияның ішінен» (3D чип-қала). Мәтін Unbounded/PT Serif/Inter-мен браузерде салынады.

    python3 tools/make_course_posters.py
      assets/img/posters/ao17cs.jpg, ao17cs-3d.jpg, ao17cs-w01..w12.jpg   (1000×1500)
      assets/img/posters/thumb/ao17cs-w01..w12.jpg                       (240×360, курс бетіндегі апта карточкалары)
      assets/img/og/course-ao17cs.jpg, ao17cs-3d.jpg                      (1200×630, бөлісу суреті)
Chromium басқа жерде болса: PW_CHROMIUM=/path/to/chrome python3 tools/make_course_posters.py
"""
import html
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools/academy"))
import comic as CX  # noqa: E402
import comic_eps as CXE  # noqa: E402
import course as CRS  # noqa: E402

OUT = ROOT / "assets/img/posters"
THUMB = OUT / "thumb"
OG = ROOT / "assets/img/og"
E = lambda s: html.escape(str(s), quote=True)  # noqa: E731
INK, PAPER, WHITE = "#1b1510", "#f7f1e3", "#fffdf7"
GOLD, RED, NAVY, BLUE, GREEN, CLAY = "#f2b705", "#b3262e", "#14213d", "#0a4c7a", "#2e6b4f", "#c8742c"
SW = 7   # сия сызығының қалыңдығы


def t(x, y, s, size=34, w=700, fill=INK, anchor="middle", fam="Inter", extra=""):
    return (f'<text x="{x}" y="{y}" font-family="{fam}, Inter, sans-serif" font-weight="{w}" font-size="{size}" fill="{fill}" '
            f'text-anchor="{anchor}" {extra}>{E(s)}</text>')


def mono(x, y, s, size=30, fill=INK, anchor="start", w=700):
    return t(x, y, s, size, w, fill, anchor, "JetBrains Mono")


def box(x, y, w, h, fill=WHITE, r=14, sw=SW, shadow=True, extra=""):
    return (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}" stroke="{INK}" stroke-width="{sw}" '
            f'{"filter=" + chr(34) + "url(#sh)" + chr(34) if shadow else ""} {extra}/>')


def arrow(x1, y1, x2, y2, color=INK, w=8):
    """Комикс бағыттауышы: сызық және толық ұш."""
    import math
    a = math.atan2(y2 - y1, x2 - x1)
    hx, hy = x2 - 30 * math.cos(a), y2 - 30 * math.sin(a)
    l = (hx + 16 * math.sin(a), hy - 16 * math.cos(a))
    r = (hx - 16 * math.sin(a), hy + 16 * math.cos(a))
    return (f'<path d="M{x1} {y1} L{hx:.1f} {hy:.1f}" stroke="{color}" stroke-width="{w}" stroke-linecap="round"/>'
            f'<path d="M{x2} {y2} L{l[0]:.1f} {l[1]:.1f} L{r[0]:.1f} {r[1]:.1f} Z" fill="{color}" stroke="{color}" stroke-width="3" stroke-linejoin="round"/>')


def tick(x, y, s=1.0, color=GREEN):
    return f'<path d="M{x - 14 * s} {y} l{10 * s} {11 * s} l{20 * s} {-24 * s}" fill="none" stroke="{color}" stroke-width="{7 * s}" stroke-linecap="round" stroke-linejoin="round"/>'


def cross(x, y, s=1.0, color=RED):
    d = 16 * s
    return f'<path d="M{x - d} {y - d} L{x + d} {y + d} M{x + d} {y - d} L{x - d} {y + d}" stroke="{color}" stroke-width="{8 * s}" stroke-linecap="round"/>'


def char(who, mood, gesture, x, k, face):
    """Кейіпкер кеуде суреті: (x, 940) - төменгі ортасы, k - масштаб, face 1 - оңға, -1 - солға қарайды."""
    if who == "N":
        body = CX.nurai(mood, gesture)
    elif who == "M":
        body = CX.mustafa(mood, gesture, mirror=face < 0)
    else:
        body, k = CX.bota(mood), k * CX.BK
    return f'<g transform="translate({x} 940) scale({k * face:.3f} {k:.3f})">{body}</g>'


def sparkle(x, y, r=26, color=GOLD):
    return (f'<path d="M{x} {y - r} Q{x + r * .18} {y - r * .18} {x + r} {y} Q{x + r * .18} {y + r * .18} {x} {y + r} '
            f'Q{x - r * .18} {y + r * .18} {x - r} {y} Q{x - r * .18} {y - r * .18} {x} {y - r} Z" fill="{color}" stroke="{INK}" stroke-width="4"/>')


# ================================================================== апталардың бейнелері (viewBox 0 0 1080 940)
def art_w01():
    """Иә не жоқ: шам, ажыратқыш және пікір карточкасы (1 - ақиқат, 0 - жалған)."""
    g = [f'<path d="M900 52 v-34 M808 92 l-26 -24 M992 92 l26 -24 M770 176 h-36 M1030 176 h36" stroke="{INK}" stroke-width="8" stroke-linecap="round"/>',
         f'<g filter="url(#sh)"><circle cx="900" cy="176" r="96" fill="#ffe680" stroke="{INK}" stroke-width="{SW}"/>'
         f'<path d="M870 260 h60 v56 h-60 z" fill="#b9b2a6" stroke="{INK}" stroke-width="{SW}"/></g>',
         f'<path d="M868 202 q16 -38 32 0 q16 -38 32 0" fill="none" stroke="{INK}" stroke-width="6" stroke-linecap="round"/>'
         f'<path d="M870 280 h60 M870 298 h60" stroke="{INK}" stroke-width="5"/>']
    g.append(f'<g filter="url(#sh)">{box(560, 330, 250, 390, WHITE, 26, shadow=False)}</g>')
    g.append(f'<rect x="635" y="410" width="100" height="230" rx="18" fill="#3b3128" stroke="{INK}" stroke-width="6"/>'
             f'<rect x="645" y="420" width="80" height="106" rx="14" fill="{GOLD}" stroke="{INK}" stroke-width="6"/>')
    g.append(t(685, 390, "1 · ИӘ", 32, 800, GREEN, fam="Unbounded") + t(685, 690, "0 · ЖОҚ", 32, 800, RED, fam="Unbounded"))
    g.append(arrow(820, 300, 760, 410, INK, 8))
    g.append(f'<g transform="rotate(5 940 700)">{box(840, 600, 210, 170, WHITE, 16)}' + t(945, 670, "7 - жұп", 32, 800) + t(945, 710, "сан", 32, 800)
             + f'<circle cx="1018" cy="612" r="36" fill="{RED}" stroke="{INK}" stroke-width="6"/>' + t(1018, 625, "0", 34, 800, WHITE, fam="Unbounded") + "</g>")
    g.append(f'<g transform="rotate(-4 940 840)">{box(830, 790, 220, 110, WHITE, 16)}' + t(940, 842, "2 + 2 = 4", 30, 800) + t(940, 880, "ақиқат", 24, 700, GREEN)
             + f'<circle cx="1030" cy="798" r="32" fill="{GREEN}" stroke="{INK}" stroke-width="6"/>' + t(1030, 810, "1", 32, 800, WHITE, fam="Unbounded") + "</g>")
    return "".join(g)


def art_w02():
    """Қырық «иә» - дәлел ме: 40 құсбелгі (n = 0 ... 39), 41-і қате; тақтада 1681 = 41 · 41."""
    g = [f'<g filter="url(#sh)">{box(50, 190, 560, 360, WHITE, 18, shadow=False)}</g>']
    for i in range(40):
        cx, cy = 92 + (i % 8) * 68, 232 + (i // 8) * 64
        g.append(f'<rect x="{cx - 27}" y="{cy - 27}" width="54" height="54" rx="9" fill="#e3f1e7" stroke="{INK}" stroke-width="3.5"/>' + tick(cx, cy + 4, .85))
    g.append(f'<g transform="rotate(-10 590 196)"><circle cx="590" cy="196" r="50" fill="{RED}" stroke="{INK}" stroke-width="{SW}" filter="url(#sh)"/>' + cross(590, 196, 1.2, WHITE) + "</g>")
    g.append(t(470, 166, "41-і?", 30, 800, RED, fam="Unbounded"))
    g.append(t(330, 590, "n = 0 … 39: бәрі жай сан", 30, 800))
    g.append(f'<g filter="url(#sh)"><rect x="50" y="630" width="560" height="250" rx="14" fill="#8a5a14" stroke="{INK}" stroke-width="{SW}"/>'
             f'<rect x="72" y="652" width="516" height="206" rx="6" fill="#2f4f46" stroke="{INK}" stroke-width="4"/></g>')
    g.append(t(330, 712, "n² + n + 41", 44, 700, "#f3ead6", fam="PT Serif"))
    g.append(t(330, 772, "n = 40:  1681", 38, 700, "#f3ead6", fam="PT Serif"))
    g.append(t(330, 830, "= 41 · 41", 44, 700, "#ffd166", fam="PT Serif"))
    return "".join(g)


def art_w03():
    """Қонақтар тізімі: жиын - қайталанбайтын қонақтар; қайталанған «Асқар» сыртта қалады."""
    g = [t(100, 600, "{", 600, 400, INK, "middle", "PT Serif"), t(620, 600, "}", 600, 400, INK, "middle", "PT Serif")]
    for k, (name, rot) in enumerate((("Асқар", -4), ("Дана", 3), ("Ерлан", -2))):
        y = 190 + k * 140
        g.append(f'<g transform="rotate({rot} 360 {y + 50})">{box(180, y, 360, 104, WHITE, 18)}'
                 f'<path d="M210 {y + 22} h22 v60 h-22 z" fill="{GOLD}" stroke="{INK}" stroke-width="4"/>'
                 + t(380, y + 68, name, 46, 800) + "</g>")
    g.append(f'<g transform="rotate(7 300 760)">{box(150, 712, 300, 96, "#f3e2df", 18)}' + t(300, 776, "Асқар", 42, 800, "#7a1e1e")
             + f'<path d="M168 762 H432" stroke="{RED}" stroke-width="9" stroke-linecap="round"/></g>')
    g.append(t(60, 890, "қайталанды: жиынға кірмейді", 30, 800, "#7a1e1e", "start"))
    g.append(sparkle(600, 200, 24) + sparkle(560, 660, 16))
    return "".join(g)


def baursak(x, y, s=1.0, rot=0):
    return (f'<g transform="translate({x} {y}) rotate({rot}) scale({s})"><path d="M-52 -30 Q-58 -54 -30 -52 L30 -54 Q56 -56 52 -28 L54 30 Q56 54 30 52 L-30 54 Q-56 56 -52 30 Z" '
            f'fill="#d9952b" stroke="{INK}" stroke-width="6" stroke-linejoin="round"/>'
            f'<path d="M-34 -30 Q0 -44 30 -32" fill="none" stroke="#f6c46a" stroke-width="9" stroke-linecap="round"/>'
            f'<path d="M-20 18 q20 10 40 0" fill="none" stroke="#a8641a" stroke-width="5" stroke-linecap="round"/></g>')


def art_w04():
    """Әженің бауырсағы: рецепт - алгоритм, бірақ үшінші қадам анық емес; табақтағы бауырсақтар."""
    g = [f'<g transform="rotate(4 800 200)">{box(560, 60, 490, 300, WHITE, 14)}'
         f'<circle cx="805" cy="74" r="14" fill="{RED}" stroke="{INK}" stroke-width="4"/>'
         + t(590, 140, "1. Ұн, сүт, ашытқы ал", 31, 700, anchor="start")
         + t(590, 210, "2. Қамыр илеп, 1 сағат күт", 31, 700, anchor="start")
         + t(590, 280, "3. Тұзды «дәмінше» сал", 31, 700, RED, anchor="start")
         + f'<path d="M590 296 q160 14 320 0" fill="none" stroke="{RED}" stroke-width="5" stroke-dasharray="10 8"/>'
         + t(1000, 290, "?", 64, 800, RED, fam="Unbounded") + "</g>"]
    g.append("".join(f'<path d="M{x} 520 q-22 -34 0 -68 q22 -34 0 -68" fill="none" stroke="{WHITE}" stroke-width="9" stroke-linecap="round" opacity=".95"/>' for x in (680, 790, 900)))
    for k, (x, y) in enumerate(((650, 610), (760, 592), (870, 616), (600, 690), (710, 684), (820, 688), (930, 696), (680, 750), (800, 760), (910, 760))):
        g.append(baursak(x, y, .92, (-8, 6, -3, 9, -6, 4, -9, 7, -4, 5)[k]))
    g.append(f'<g filter="url(#sh)"><path d="M520 730 Q520 900 775 900 Q1030 900 1030 730 Z" fill="{BLUE}" stroke="{INK}" stroke-width="{SW}"/>'
             f'<ellipse cx="775" cy="730" rx="255" ry="38" fill="#0d5d96" stroke="{INK}" stroke-width="{SW}"/></g>')
    g.append(f'<path d="M560 800 Q775 852 990 800" fill="none" stroke="{GOLD}" stroke-width="10"/>'
             + "".join(f'<path d="M{x} 818 l14 -14 l14 14 l-14 14 z" fill="{GOLD}" stroke="{INK}" stroke-width="3"/>' for x in (630, 710, 790, 870, 940)))
    return "".join(g)


def art_w05():
    """Ауылдағы шамдар: түнгі ауыл, терезелер жанып тұр (1) не сөнген (0) - бес бит."""
    g = [f'<circle cx="930" cy="120" r="62" fill="#ffe7a0" stroke="{INK}" stroke-width="{SW}"/><circle cx="958" cy="100" r="58" fill="#1d3557"/>']
    for x, y, r in ((520, 90, 6), (640, 160, 4), (760, 70, 5), (860, 250, 4), (470, 240, 4), (700, 260, 6), (1010, 260, 5)):
        g.append(f'<circle cx="{x}" cy="{y}" r="{r}" fill="#ffe7a0"/>')
    g.append(f'<path d="M0 700 Q300 650 540 690 T1080 680 V940 H0 Z" fill="#2b4a3a" stroke="{INK}" stroke-width="{SW}"/>')
    bits = "10110"
    for k, b in enumerate(bits):
        x = 540 + k * 118
        on = b == "1"
        g.append(f'<g filter="url(#sh)"><path d="M{x - 52} 690 V560 L{x} 512 L{x + 52} 560 V690 Z" fill="#e9dcc0" stroke="{INK}" stroke-width="6" stroke-linejoin="round"/>'
                 f'<rect x="{x - 24}" y="584" width="48" height="56" rx="6" fill="{"#ffd34d" if on else "#2a3245"}" stroke="{INK}" stroke-width="5"/></g>')
        if on:
            g.append(f'<circle cx="{x}" cy="612" r="58" fill="#ffd34d" opacity=".28"/>')
        g.append(t(x, 790, b, 92, 800, "#ffd34d" if on else "#7d8aa3", fam="Unbounded"))
    g.append(t(776, 880, "10110₂ = 22", 44, 700, "#f3ead6", fam="PT Serif"))
    return "".join(g)


def art_w06():
    """Python жолма-жол оқиды: үшінші жолда NameError, төртінші жол орындалмай қалады."""
    g = [f'<g filter="url(#sh)"><rect x="80" y="210" width="560" height="480" fill="{WHITE}" stroke="{INK}" stroke-width="{SW}"/>'
         f'<rect x="60" y="176" width="600" height="56" rx="28" fill="#e9dcc0" stroke="{INK}" stroke-width="{SW}"/>'
         f'<rect x="60" y="668" width="600" height="56" rx="28" fill="#e9dcc0" stroke="{INK}" stroke-width="{SW}"/></g>']
    rows = [("print('Сәлем, әлем!')", "ok"), ("print('Алаш', 1917)", "ok"), ("print(екі)", "err"), ("print('үш')", "skip")]
    for k, (code, st) in enumerate(rows):
        y = 310 + k * 100
        col = {"ok": INK, "err": RED, "skip": "#b3aa99"}[st]
        g.append(t(118, y, str(k + 1), 28, 700, "#9a8f7c", "start", "JetBrains Mono"))
        g.append(mono(160, y, code, 31, col))
        if st == "ok":
            g.append(tick(600, y - 12, 1.0))
        if st == "err":
            g.append(f'<path d="M160 {y + 14} q11 10 22 0 t22 0 t22 0 t22 0 t22 0 t22 0 t22 0 t22 0 t22 0" fill="none" stroke="{RED}" stroke-width="5"/>')
    g.append(arrow(14, 512, 96, 512, RED, 10))
    g.append(f'<g transform="rotate(-4 330 820)">{box(110, 770, 440, 96, "#fde2dc", 16)}' + mono(330, 832, "NameError: екі", 36, RED, "middle") + "</g>")
    return "".join(g)


def art_w07():
    """print сөйлейді, return береді: рупор экранға айтады, қол қорапты шақырушыға ұсынады."""
    g = [f'<g filter="url(#sh)"><path d="M560 300 L740 220 V460 L560 380 Z" fill="{RED}" stroke="{INK}" stroke-width="{SW}" stroke-linejoin="round"/>'
         f'<rect x="510" y="306" width="60" height="68" rx="10" fill="{GOLD}" stroke="{INK}" stroke-width="{SW}"/>'
         f'<path d="M540 374 l-10 56 h34 l6 -56" fill="#3b3128" stroke="{INK}" stroke-width="6" stroke-linejoin="round"/></g>']
    g.append("".join(f'<path d="M{780 + k * 32} {280 - k * 16} Q{826 + k * 38} 340 {780 + k * 32} {400 + k * 16}" fill="none" stroke="{INK}" stroke-width="7" stroke-linecap="round"/>' for k in range(3)))
    g.append(f'<g transform="rotate(-5 700 200)">{box(560, 168, 280, 66, WHITE, 12)}' + mono(700, 214, "print(...)", 32, INK, "middle") + "</g>")
    g.append(t(1050, 470, "→ экранға", 32, 800, INK, "end"))
    g.append(f'<g filter="url(#sh)"><rect x="600" y="560" width="210" height="170" rx="10" fill="{GOLD}" stroke="{INK}" stroke-width="{SW}"/>'
             f'<path d="M705 560 V730 M600 632 H810" stroke="{RED}" stroke-width="14"/>'
             f'<path d="M705 560 q-40 -56 -78 -18 q30 18 78 18 q40 -56 78 -18 q-30 18 -78 18" fill="{RED}" stroke="{INK}" stroke-width="5" stroke-linejoin="round"/></g>')
    g.append(f'<path d="M540 776 Q630 742 720 750 L880 750 Q918 755 914 778 Q910 798 878 798 L720 808 Q630 818 540 836 Z" fill="{CX.SKIN}" stroke="{INK}" stroke-width="{SW}" stroke-linejoin="round"/>'
             f'<path d="M470 784 H540 V846 H470 Z" fill="{CX.HOOD}" stroke="{INK}" stroke-width="{SW}"/>')
    g.append(f'<g transform="rotate(4 950 600)">{box(860, 566, 190, 66, WHITE, 12)}' + mono(955, 611, "return", 32, GREEN, "middle") + "</g>")
    g.append(arrow(880, 690, 1040, 690, GREEN, 9))
    g.append(t(1050, 890, "→ шақырушыға", 32, 800, INK, "end"))
    return "".join(g)


def art_w08():
    """Дастарқанның басына орын: тізімнің басына жаңа элемент кіргенде бәрі бір орынға жылжиды."""
    g = [f'<g filter="url(#sh)"><rect x="460" y="340" width="590" height="370" rx="26" fill="{RED}" stroke="{INK}" stroke-width="{SW}"/></g>',
         f'<rect x="486" y="366" width="538" height="318" rx="16" fill="none" stroke="{GOLD}" stroke-width="8"/>']
    g.append("".join(f'<path d="M{x} 366 l14 -14 l14 14 l-14 14 z" fill="{GOLD}" stroke="{INK}" stroke-width="3"/>' for x in range(520, 1010, 90)))
    vals = ["3", "1", "4", "1", "5"]
    for k, v in enumerate(vals):
        x, y = 580 + (k % 3) * 160, 470 + (k // 3) * 150
        g.append(f'<ellipse cx="{x}" cy="{y}" rx="62" ry="54" fill="{WHITE}" stroke="{INK}" stroke-width="6"/><ellipse cx="{x}" cy="{y}" rx="38" ry="32" fill="#eadfca"/>'
                 + t(x, y + 14, v, 42, 800, INK, fam="Unbounded") + t(x, y - 64, f"[{k + 1}]", 26, 700, GOLD, fam="JetBrains Mono"))
    g.append(f'<g transform="rotate(-8 780 220)"><ellipse cx="780" cy="220" rx="70" ry="60" fill="{GOLD}" stroke="{INK}" stroke-width="{SW}" filter="url(#sh)"/>'
             + t(780, 238, "7", 52, 800, INK, fam="Unbounded") + "</g>")
    g.append(t(900, 214, "[0]", 34, 800, INK, fam="JetBrains Mono"))
    g.append(arrow(712, 252, 530, 420, INK, 9))
    g.append(f'<g transform="rotate(-3 760 810)">{box(540, 762, 440, 86, WHITE, 14)}' + mono(760, 820, "a.insert(0, 7)", 38, INK, "middle") + "</g>")
    return "".join(g)


def art_w09():
    """Ерте айтылған «жоқ»: іздеу бірінші ұяшықтан кейін-ақ «жоқ» деп тоқтайды, ал 9 үшінші индексте күтіп тұр."""
    g = []
    vals = ["5", "8", "2", "9", "4"]
    for k, v in enumerate(vals):
        x = 40 + k * 128
        hit = k == 3
        g.append(f'<g filter="url(#sh)"><rect x="{x}" y="380" width="116" height="140" rx="14" fill="{"#ffe680" if hit else WHITE}" stroke="{INK}" stroke-width="{SW}"/></g>'
                 + t(x + 58, 476, v, 70, 800, INK, fam="Unbounded") + t(x + 58, 570, str(k), 30, 700, "#6b5f4c", fam="JetBrains Mono"))
    g.append(sparkle(500, 350, 26) + sparkle(548, 326, 14))
    # үлкейткіш әйнек 0-ұяшықта
    g.append(f'<g filter="url(#sh)"><circle cx="98" cy="300" r="82" fill="#cfe9f3" fill-opacity=".55" stroke="{INK}" stroke-width="10"/>'
             f'<path d="M158 238 L218 172" stroke="{INK}" stroke-width="22" stroke-linecap="round"/><path d="M158 238 L218 172" stroke="#8a5a14" stroke-width="12" stroke-linecap="round"/></g>')
    g.append(f'<g transform="rotate(-8 300 140)">{box(200, 70, 250, 110, "#fde2dc", 18)}' + t(325, 145, "«жоқ!»", 50, 800, RED) + "</g>")
    g.append(f'<g transform="rotate(3 300 720)">{box(50, 650, 510, 130, WHITE, 16)}' + mono(80, 702, "else:", 32, INK) + mono(110, 752, "return -1  # ерте", 32, RED) + "</g>")
    g.append(mono(50, 870, "find(a, 9) → -1 ?", 34, INK))
    return "".join(g)


def art_w10():
    """Тілмаш пен аудармашы: hello.c → компилятор (тісті доңғалақ) → машина коды → бағдарлама."""
    import math
    g = [f'<g filter="url(#sh)"><path d="M60 90 h280 l56 56 v334 h-336 z" fill="{WHITE}" stroke="{INK}" stroke-width="{SW}" stroke-linejoin="round"/>'
         f'<path d="M340 90 v56 h56" fill="#e9dcc0" stroke="{INK}" stroke-width="{SW}" stroke-linejoin="round"/></g>']
    g.append(mono(88, 140, "hello.c", 30, BLUE))
    for k, line in enumerate(("#include <stdio.h>", "int main(void)", "{", '  printf("Сәлем");', "}")):
        g.append(mono(88, 210 + k * 52, line, 25, INK, w=400 if k else 700))
    teeth = "".join(f'<rect x="-20" y="-150" width="40" height="44" rx="6" transform="rotate({k * 30})" fill="{GOLD}" stroke="{INK}" stroke-width="6"/>' for k in range(12))
    g.append(f'<g transform="translate(230 650)" filter="url(#sh)">{teeth}<circle r="120" fill="{GOLD}" stroke="{INK}" stroke-width="{SW}"/>'
             f'<circle r="40" fill="{PAPER}" stroke="{INK}" stroke-width="6"/></g>')
    g.append(t(230, 872, "gcc", 46, 800, INK, fam="JetBrains Mono"))
    g.append(arrow(230, 500, 230, 548, INK, 9) + arrow(372, 590, 418, 556, INK, 9))
    g.append(f'<g filter="url(#sh)"><rect x="426" y="420" width="250" height="170" rx="12" fill="{NAVY}" stroke="{INK}" stroke-width="{SW}"/></g>')
    for k, row in enumerate(("01001000", "01101001", "00100001")):
        g.append(mono(551, 476 + k * 46, row, 31, "#9be7c4", "middle"))
    g.append(arrow(551, 410, 551, 352, INK, 9))
    g.append(f'<g filter="url(#sh)"><rect x="426" y="170" width="270" height="170" rx="14" fill="#11151c" stroke="{INK}" stroke-width="{SW}"/></g>'
             + mono(450, 232, "$ ./hello", 30, "#cfd8e3") + mono(450, 292, "Сәлем", 38, "#ffd166"))
    _ = math
    return "".join(g)


def art_w11():
    """Ауыл көшесі: жад - нөмірленген үйлер көшесі, &x - белгілі бір үйге апаратын көрсеткіш."""
    g = [f'<rect x="0" y="720" width="1080" height="220" fill="#b9a88a" stroke="{INK}" stroke-width="{SW}"/>',
         f'<path d="M0 820 H1080" stroke="{WHITE}" stroke-width="10" stroke-dasharray="60 40"/>']
    vals = [("1000", "17"), ("1001", "4F"), ("1002", "A0"), ("1003", "03")]
    for k, (addr, v) in enumerate(vals):
        x = 470 + k * 150
        hit = k == 1
        g.append(f'<g filter="url(#sh)"><path d="M{x - 62} 720 V520 L{x} 450 L{x + 62} 520 V720 Z" fill="{"#ffe1a8" if hit else "#efe3c8"}" stroke="{INK}" stroke-width="6" stroke-linejoin="round"/></g>'
                 f'<rect x="{x - 40}" y="560" width="80" height="70" rx="8" fill="{WHITE}" stroke="{INK}" stroke-width="5"/>'
                 + mono(x, 608, v, 34, INK, "middle")
                 + f'<rect x="{x - 52}" y="650" width="104" height="44" rx="6" fill="{BLUE}" stroke="{INK}" stroke-width="4"/>' + mono(x, 682, addr, 28, WHITE, "middle"))
    # бағыттауыш тақта
    g.append(f'<g filter="url(#sh)"><rect x="560" y="210" width="20" height="260" fill="#8a5a14" stroke="{INK}" stroke-width="6"/>'
             f'<path d="M420 160 H640 L690 205 L640 250 H420 Z" fill="{GOLD}" stroke="{INK}" stroke-width="{SW}" stroke-linejoin="round"/></g>')
    g.append(mono(530, 222, "&x", 46, INK, "middle"))
    g.append(arrow(640, 300, 640, 430, RED, 9))
    g.append(f'<g transform="rotate(-4 820 110)">{box(700, 60, 330, 100, WHITE, 16)}' + mono(865, 124, "int *p = &x;", 32, INK, "middle") + "</g>")
    return "".join(g)


def yurt(cx, base, w, h, labels=None):
    """Киіз үй: кереге (тор), уық, шаңырақ."""
    x0, x1, top = cx - w / 2, cx + w / 2, base - h * .45
    g = [f'<g filter="url(#sh)"><path d="M{x0} {base} V{top} Q{cx} {base - h * 1.05} {x1} {top} V{base} Z" fill="{WHITE}" stroke="{INK}" stroke-width="{SW}" stroke-linejoin="round"/></g>']
    lat = "".join(f'<path d="M{x0 + i * 40} {base} L{x0 + i * 40 + 70} {top}" stroke="#b89c6e" stroke-width="4"/><path d="M{x0 + i * 40 + 70} {base} L{x0 + i * 40} {top}" stroke="#b89c6e" stroke-width="4"/>'
                  for i in range(int(w / 40)))
    g.append(f'<clipPath id="yw"><rect x="{x0 + 4}" y="{top}" width="{w - 8}" height="{base - top - 4}"/></clipPath><g clip-path="url(#yw)">{lat}</g>')
    g.append(f'<path d="M{x0} {top} H{x1}" stroke="{RED}" stroke-width="14"/><path d="M{x0} {top} H{x1}" stroke="{INK}" stroke-width="3" transform="translate(0 8)"/>')
    for k in range(9):
        fx = x0 + 20 + k * (w - 40) / 8
        g.append(f'<path d="M{fx} {top - 4} Q{(fx + cx) / 2} {top - h * .3} {cx} {base - h * .98}" fill="none" stroke="#8a5a14" stroke-width="5"/>')
    g.append(f'<circle cx="{cx}" cy="{base - h * .98}" r="46" fill="{GOLD}" stroke="{INK}" stroke-width="{SW}"/>'
             f'<path d="M{cx - 46} {base - h * .98} H{cx + 46} M{cx} {base - h * .98 - 46} V{base - h * .98 + 46}" stroke="{INK}" stroke-width="5"/>'
             f'<path d="M{cx - 32} {base - h * .98 - 32} Q{cx} {base - h * .98} {cx + 32} {base - h * .98 - 32} M{cx - 32} {base - h * .98 + 32} Q{cx} {base - h * .98} {cx + 32} {base - h * .98 + 32}" fill="none" stroke="{INK}" stroke-width="4"/>')
    g.append(f'<path d="M{cx - 50} {base} V{base - 150} Q{cx} {base - 190} {cx + 50} {base - 150} V{base} Z" fill="{RED}" stroke="{INK}" stroke-width="6"/>'
             f'<path d="M{cx - 30} {base - 120} l30 -24 l30 24 l-30 24 z" fill="{GOLD}" stroke="{INK}" stroke-width="4"/>')
    return "".join(g)


def art_w12():
    """Бір отау - бір жүйе: киіз үй және оның төрт бөлігі ретімен - оқу, тексеру, есептеу, шығару."""
    g = [yurt(790, 800, 500, 560)]
    tags = [("1 · оқу", 600, 300, -6), ("2 · тексеру", 960, 250, 5), ("3 · есептеу", 950, 560, -4), ("4 · шығару", 620, 600, 4)]
    for k, (s_, x, y, rr) in enumerate(tags):
        g.append(f'<g transform="rotate({rr} {x} {y})">{box(x - 124, y - 44, 248, 82, (GOLD, WHITE, GOLD, WHITE)[k], 40)}' + t(x, y + 11, s_, 32, 800) + "</g>")
    return "".join(g)


# ================================================================== апталар: түс, кейіпкер, сөз
#  mid: (мұқаба фоны, кейіпкер, көңіл-күйі, қимылы, жағы, сөзі, бейне)
WEEK_ART = {
    "m01": ("#8ecae6", "N", "think", "chin", "l", "Кез келген сөйлем пікір ме?", art_w01),
    "m02": ("#f4a261", "M", "wow", "up", "r", "Қырық рет «иә» - әлі дәлел емес!", art_w02),
    "m03": ("#95d5b2", "N", "happy", None, "r", "Жиында әр қонақ бір-ақ рет!", art_w03),
    "m04": ("#ffd166", "M", "laugh", "point", "l", "«Дәмінше» - алгоритм емес!", art_w04),
    "m05": ("#1d3557", "N", "wow", "up", "l", "Бес шам - отыз екі хабар!", art_w05),
    "m06": ("#a8dadc", "M", "think", "chin", "r", "Python жолма-жол оқиды.", art_w06),
    "m07": ("#f6bd60", "N", "calm", "point", "l", "print айтады, return береді.", art_w07),
    "m08": ("#cdb4db", "M", "happy", "point", "l", "Жаңа қонақ - бәрі бір орын жылжиды.", art_w08),
    "m09": ("#f28482", "N", "worried", None, "r", "Тым ерте «жоқ» деп қойдық!", art_w09),
    "m10": ("#b5e48c", "M", "calm", "point", "r", "Компилятор бүкіл кітапты аударады.", art_w10),
    "m11": ("#f7a072", "N", "calm", "point", "l", "Әр байттың өз мекенжайы бар.", art_w11),
    "m12": ("#90e0ef", "M", "happy", "up", "l", "Бөлшектерден бір жүйе!", art_w12),
}


# ================================================================== беттер
CSS = """
@import url("FONTS");
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: WPX; height: HPX; overflow: hidden; background: #f7f1e3; }
body { color: #1b1510; font-family: Inter, sans-serif; }
.cv { position: relative; width: WPX; height: HPX; overflow: hidden; background: #f7f1e3; }
.cv::after { content: ""; position: absolute; inset: 0; pointer-events: none; opacity: .5; mix-blend-mode: multiply;
  background: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .45  0 0 0 0 .38  0 0 0 0 .28  0 0 0 .28 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>"); }
.mast { position: absolute; display: block; }
.strap { position: absolute; display: flex; justify-content: space-between; align-items: center; border-top: 4px solid #1b1510; border-bottom: 4px solid #1b1510;
  font: 600 27px/1 Inter, sans-serif; letter-spacing: .01em; }
.strap b { font-weight: 800; }
.panel { position: absolute; overflow: hidden; border: 9px solid #1b1510; background: var(--bg); }
.panel::before { content: ""; position: absolute; inset: 0; background: radial-gradient(circle, rgb(27 21 16 / .13) 0 2.6px, transparent 3.1px) 0 0 / 19px 19px;
  -webkit-mask-image: linear-gradient(150deg, transparent 20%, #000 85%); mask-image: linear-gradient(150deg, transparent 20%, #000 85%); }
.panel.dark::before { background: radial-gradient(circle, rgb(255 255 255 / .07) 0 2.6px, transparent 3.1px) 0 0 / 19px 19px; }
.panel svg { position: absolute; inset: 0; width: 100%; height: 100%; }
.bub { position: absolute; padding: 22px 30px 24px; border: 6px solid #1b1510; border-radius: 46px; background: #fffdf7; font: 800 37px/1.18 Inter, sans-serif;
  text-align: center; text-wrap: balance; box-shadow: 9px 9px 0 #1b1510; z-index: 2; }
.bub svg { position: absolute; width: 74px; height: 66px; overflow: visible; }
.lower { position: absolute; display: flex; flex-direction: column; }
.lower .orn { position: static; margin-top: auto; flex: none; }
.lower .foot { position: static; margin-top: 12px; flex: none; }
.ttl h1 { font: 700 var(--fs, 96px)/1.02 "PT Serif", Georgia, serif; letter-spacing: -.01em; text-wrap: balance; }
.ttl .q { margin-top: 18px; font: italic 400 44px/1.25 "PT Serif", Georgia, serif; color: #4a3f33; text-wrap: balance; }
.ttl .m { margin-top: 22px; font: 600 27px/1.45 Inter, sans-serif; color: #3d342a; }
.orn { position: absolute; display: block; }
.foot { position: absolute; display: flex; justify-content: space-between; align-items: center; height: 64px; }
.foot .logo svg { height: 60px; width: auto; display: block; }
.foot .free { font: 800 27px/1.2 Inter, sans-serif; text-align: right; }
.foot .free span { display: block; font-weight: 600; font-size: 22px; color: #5a4e40; }
.stamp { position: absolute; width: 190px; height: 190px; display: grid; place-content: center; text-align: center; border-radius: 50%; background: #b3262e;
  color: #fffdf7; border: 7px solid #1b1510; box-shadow: 8px 8px 0 #1b1510; transform: rotate(-12deg); font: 800 34px/1.05 Unbounded, sans-serif; z-index: 3; }
.stamp small { display: block; margin-top: 6px; font: 700 19px/1.1 Inter, sans-serif; }
"""

DEFS = (f'<defs><filter id="sh" x="-20%" y="-20%" width="150%" height="150%"><feDropShadow dx="10" dy="10" stdDeviation="0" flood-color="{INK}" flood-opacity="1"/></filter></defs>')


def masthead(top, big, sub, w=1080):
    """Журнал атауы «AO17 CS» (сия көлеңкесімен) және оң жақта нөмір қорабы: top (кіші), big (үлкен), sub (кіші)."""
    fs = 96 if len(big) <= 2 else 70 if len(big) <= 3 else 58
    return (f'<svg class="mast" style="left:60px;top:44px" width="{w}" height="232" viewBox="0 0 {w} 232">'
            f'<text x="4" y="182" font-family="Unbounded, sans-serif" font-weight="800" font-size="160" letter-spacing="-5" fill="{INK}" stroke="{INK}" stroke-width="13" stroke-linejoin="round" transform="translate(10 10)">AO17 CS</text>'
            f'<text x="4" y="182" font-family="Unbounded, sans-serif" font-weight="800" font-size="160" letter-spacing="-5" fill="{RED}" stroke="{INK}" stroke-width="13" stroke-linejoin="round" paint-order="stroke">AO17 CS</text>'
            f'<g transform="translate({w - 216} 16)"><rect width="210" height="204" rx="10" fill="{INK}"/>'
            f'<text x="105" y="48" text-anchor="middle" font-family="Inter, sans-serif" font-weight="800" font-size="27" fill="{GOLD}">{E(top)}</text>'
            f'<text x="105" y="{86 + fs * .62:.0f}" text-anchor="middle" font-family="Unbounded, sans-serif" font-weight="800" font-size="{fs}" fill="{PAPER}">{E(big)}</text>'
            f'<text x="105" y="186" text-anchor="middle" font-family="Inter, sans-serif" font-weight="800" font-size="26" fill="{GOLD}">{E(sub)}</text></g></svg>')


def ornament(x, y, w, color=INK, accent=RED):
    """Қошқар мүйіз өрнегінің жолағы (AO17 логотипіндегі мүйіз)."""
    one = ('<path d="M24 44 V26 M24 26 C24 14 12 8 7 14 C3 19 9 25 13 21 C15.5 18.5 13 15.5 11 17 M24 26 C24 14 36 8 41 14 C45 19 39 25 35 21 C32.5 18.5 35 15.5 37 17" '
           f'fill="none" stroke="{color}" stroke-width="3.2" stroke-linecap="round"/>')
    n = int(w // 60)
    body = "".join(f'<g transform="translate({k * 60 + (w - n * 60) / 2 + 6} 0)">{one}</g>' for k in range(n))
    return (f'<svg class="orn" style="left:{x}px;top:{y}px" width="{w}" height="56" viewBox="0 0 {w} 56"><path d="M0 50 H{w}" stroke="{accent}" stroke-width="5"/>{body}</svg>')


def bubble(text, x, y, w, tail):
    """Сөз көпіршігі: tail - «l» (құйрығы төменгі сол жақта) не «r»."""
    tl = (f'<svg viewBox="0 0 74 66" style="{"left:70px" if tail == "l" else "right:70px"};bottom:-60px">'
          f'<path d="{"M0 0 L18 64 L60 0" if tail == "l" else "M14 0 L56 64 L74 0"}" fill="#fffdf7" stroke="#1b1510" stroke-width="6" stroke-linejoin="round"/>'
          f'<path d="{"M4 -8 L56 -8" if tail == "l" else "M18 -8 L70 -8"}" stroke="#fffdf7" stroke-width="14"/></svg>')
    return f'<div class="bub" style="left:{x}px;top:{y}px;width:{w}px">{E(text)}{tl}</div>'


def logo():
    svg = (ROOT / "assets/img/brand/ao17-logo.svg").read_text(encoding="utf8")
    return svg[svg.index("<svg"):]


def cover(box3, bg, art, cast, bub, title, q, meta, dark=False, fs=96):
    """Мұқаба 1200×1800: атау, нөмір, сурет панелі (бейне + кейіпкерлер + сөз), тақырып, сұрақ, өрнек, логотип."""
    panel = (f'<div class="panel{" dark" if dark else ""}" style="left:60px;top:330px;width:1080px;height:940px;--bg:{bg}">'
             f'<svg viewBox="0 0 1080 940" aria-hidden="true">{DEFS}{art}{cast}</svg></div>')
    return f'''<div class="cv">{masthead(*box3)}
<div class="strap" style="left:60px;right:60px;top:280px;height:44px"><span>Компьютерлік ғылымға кіріспе</span><b>комикс-курс · қазақша</b></div>
{panel}{bub}
<div class="lower" style="left:60px;right:60px;top:1298px;bottom:26px"><div class="ttl" style="--fs:{fs}px"><h1>{title}</h1><p class="q">{E(q)}</p><p class="m">{E(meta)}</p></div>
{ornament(0, 0, 1080)}
<div class="foot"><div class="logo">{logo()}</div><p class="free">Тегін · браузерде<span>mustafa7677.github.io/CS50MUSS</span></p></div></div>
</div>'''


def week_cover(n, mid, question, labs, lessons):
    bg, who, mood, gest, side, say, art = WEEK_ART[mid]
    ep = next(e for e in CXE.EPISODES if e["lesson"].split(".")[1] == mid)
    k = 3.1 if who == "N" else 3.3
    x = 250 if side == "l" else 830
    cast = char(who, mood, gest, x, k, 1 if side == "l" else -1)
    bx, tail = (70, "l") if side == "l" else (1130 - 560, "r")
    bub = bubble(say, bx + (0 if side == "l" else 0), 360, 520, tail) if side == "l" else bubble(say, 610, 360, 520, "r")
    _ = bx
    ls = lessons.get(mid, (10, 60))
    meta = f"{n}-апта · {ls[0]} сабақ · {ls[1]} тапсырма · комикс · 3D зертхана"
    return cover(("№", f"{n:02d}", f"{n}-апта"), bg, art(), cast, bub, f"«{E(ep['title'])}»", question, meta, dark=mid == "m05")


def art_main():
    """Негізгі постер: шаңырақ - схема; уықтары жарық жолдарына айналады, астында үш кейіпкер."""
    import math
    g = []
    cx, cy = 540, 230
    for k in range(20):
        a = math.radians(180 + k * 180 / 19)
        x1, y1 = cx + 120 * math.cos(a), cy - 120 * math.sin(a)      # a ∈ [180°, 360°]: шеңбердің төменгі жартысы
        x2 = cx + 520 * math.cos(a)
        mx, my = cx + 380 * math.cos(a), cy - 380 * math.sin(a)
        g.append(f'<path d="M{x1:.0f} {y1:.0f} L{mx:.0f} {my:.0f} L{x2:.0f} {my:.0f}" fill="none" stroke="{GOLD}" stroke-width="6" stroke-linejoin="round" opacity=".9"/>'
                 f'<circle cx="{x2:.0f}" cy="{my:.0f}" r="11" fill="{GOLD}" stroke="{INK}" stroke-width="4"/>')
    for k in range(24):
        a = math.radians(k * 15)
        g.append(f'<path d="M{cx + 70 * math.cos(a):.1f} {cy + 70 * math.sin(a):.1f} L{cx + 120 * math.cos(a):.1f} {cy + 120 * math.sin(a):.1f}" stroke="{INK}" stroke-width="5"/>')
    g.append(f'<g filter="url(#sh)"><circle cx="{cx}" cy="{cy}" r="122" fill="none" stroke="{GOLD}" stroke-width="22"/></g>'
             f'<circle cx="{cx}" cy="{cy}" r="122" fill="none" stroke="{INK}" stroke-width="5"/><circle cx="{cx}" cy="{cy}" r="68" fill="{NAVY}" stroke="{GOLD}" stroke-width="12"/>')
    for dy in (-34, 0, 34):
        half = math.sqrt(68 ** 2 - dy ** 2)
        g.append(f'<path d="M{cx - half:.1f} {cy + dy} Q{cx} {cy + dy - 18} {cx + half:.1f} {cy + dy}" fill="none" stroke="{GOLD}" stroke-width="7"/>'
                 f'<path d="M{cx + dy} {cy - half:.1f} Q{cx + dy - 18} {cy} {cx + dy} {cy + half:.1f}" fill="none" stroke="{GOLD}" stroke-width="7"/>')
    for x, y, s in ((120, 120, "1"), (960, 110, "0"), (90, 420, "0"), (1000, 400, "1"), (220, 60, "1"), (860, 40, "0")):
        g.append(t(x, y, s, 52, 800, "#ffd166", fam="Unbounded", extra='opacity=".85"'))
    g.append(sparkle(300, 200, 22) + sparkle(800, 190, 30) + sparkle(700, 470, 16) + sparkle(360, 480, 14))
    return "".join(g)


def art_3d():
    """2-бөлім: изометриялық чип-қала - ішінде ALU, кэш, жад, желі; жолдар жанып тұр."""
    def iso(x, y, z):
        return 600 + ((x - y) * 0.866) * .9, 250 + ((x + y) * 0.5 - z) * .9

    def prism(x, y, w, d, h, top, side1, side2, label=None):
        p = [iso(x, y, h), iso(x + w, y, h), iso(x + w, y + d, h), iso(x, y + d, h)]
        s1 = [iso(x, y + d, h), iso(x + w, y + d, h), iso(x + w, y + d, 0), iso(x, y + d, 0)]
        s2 = [iso(x + w, y, h), iso(x + w, y + d, h), iso(x + w, y + d, 0), iso(x + w, y, 0)]
        P = lambda pts: " ".join(f"{a:.1f},{b:.1f}" for a, b in pts)  # noqa: E731
        out = (f'<polygon points="{P(s1)}" fill="{side1}" stroke="{INK}" stroke-width="5" stroke-linejoin="round"/>'
               f'<polygon points="{P(s2)}" fill="{side2}" stroke="{INK}" stroke-width="5" stroke-linejoin="round"/>'
               f'<polygon points="{P(p)}" fill="{top}" stroke="{INK}" stroke-width="5" stroke-linejoin="round"/>')
        if label:
            lx, ly = iso(x + w / 2, y + d / 2, h)
            out += t(lx, ly + 12, label, 30, 800, INK, fam="Unbounded")
        return out
    g = []
    base = [iso(-40, -40, 0), iso(560, -40, 0), iso(560, 560, 0), iso(-40, 560, 0)]
    for k in range(10):   # аяқшалар
        for (ax, ay, bx, by) in ((-40 + k * 60 + 20, -40, 0, -1), (560, -40 + k * 60 + 20, 1, 0)):
            p1, p2 = iso(ax, ay, 0), iso(ax + bx * 36, ay + by * 36, 0)
            g.append(f'<path d="M{p1[0]:.1f} {p1[1]:.1f} L{p2[0]:.1f} {p2[1]:.1f}" stroke="{GOLD}" stroke-width="9" stroke-linecap="round"/>')
    g.append(f'<polygon points="{" ".join(f"{a:.1f},{b:.1f}" for a, b in base)}" fill="#22355e" stroke="{INK}" stroke-width="{SW}" filter="url(#sh)"/>')
    for k in range(1, 6):   # жолдар
        a, b = iso(-40 + k * 100, -40, 0), iso(-40 + k * 100, 560, 0)
        c, d = iso(-40, -40 + k * 100, 0), iso(560, -40 + k * 100, 0)
        g.append(f'<path d="M{a[0]:.1f} {a[1]:.1f} L{b[0]:.1f} {b[1]:.1f} M{c[0]:.1f} {c[1]:.1f} L{d[0]:.1f} {d[1]:.1f}" stroke="#57c4e5" stroke-width="3" opacity=".55"/>')
    g.append(prism(20, 20, 200, 200, 120, "#ffd166", "#d9a52b", "#b8861a", "ALU"))
    g.append(prism(300, 20, 200, 120, 70, "#95d5b2", "#5fae84", "#3f8a63", "КЭШ"))
    g.append(prism(300, 200, 200, 260, 40, "#a8dadc", "#6fb3b6", "#4f9497", "ЖАД"))
    g.append(prism(20, 300, 200, 160, 90, "#f4a261", "#d97f3b", "#b8622a", "ЖЕЛІ"))
    for x, y in (iso(120, 120, 140), iso(400, 80, 90)):
        g.append(sparkle(x + 90, y - 60, 22))
    g.append(sparkle(170, 160, 20) + sparkle(1000, 110, 16))
    return "".join(g)


def course_counts():
    """build.py --stats-сыз: апта сабақтары мен тапсырмалары academy деректерінен (academy_build.load_lessons)."""
    sys.path.insert(0, str(ROOT / "tools"))
    import academy_build as AB  # noqa: E402
    import lab3d as L3  # noqa: E402
    ls = AB.load_lessons()
    by = {}
    for L in ls:
        by.setdefault(L["moduleId"], []).append(L)
    weeks = {m: (len(v), sum(len(x["exercises"]) + len(x["assessment"]) for x in v)) for m, v in by.items()}
    labs = L3.lab_summary()
    return weeks, {"labs": len(labs), "lessons": sum(len(x["lessons"]) for x in labs), "quiz": sum(q["quiz"] for x in labs for q in x["lessons"])}


def pages():
    weeks, p2 = course_counts()
    p1 = (sum(weeks.get(m, (0, 0))[0] for m, _, _ in CRS.WEEKS), sum(weeks.get(m, (0, 0))[1] for m, _, _ in CRS.WEEKS))
    total = p1[0] + p2["lessons"]
    out = []
    main_cast = (char("N", "wow", "up", 210, 2.7, 1) + char("B", "happy", None, 540, 1.9, 1) + char("M", "happy", "up", 870, 2.85, -1))
    out.append(("ao17cs", cover(("№", "00", "арнайы"), NAVY, art_main(), main_cast, "",
                                "Компьютерлік ғылымға кіріспе", "Логикадан жүйеге, биттен 3D-ге",
                                f"{total} сабақ · {p1[1] + p2['quiz']} тапсырма мен тест · {len(CXE.EPISODES)} комикс · 3D симуляциялар", dark=True, fs=88)))
    cast3 = char("N", "wow", None, 190, 2.5, 1) + char("M", "think", "point", 890, 2.6, -1)
    out.append(("ao17cs-3d", cover(("2-бөлім", "3D", "зертхана"), "#1d3557", art_3d(), cast3, bubble("Процессордың ішіне кірейік!", 560, 372, 500, "r"),
                                   "Технологияның ішінен", "Процессор, жад, желі, AI: бәрінің ішін 3D-де көр",
                                   f"{p2['labs']} зертхана · {p2['lessons']} сабақ · {p2['quiz']} тест сұрағы · 3D симуляция", dark=True, fs=96)))
    for n, (mid, question, labs) in enumerate(CRS.WEEKS, 1):
        out.append((f"ao17cs-w{n:02d}", week_cover(n, mid, question, labs, weeks)))
    return out


def og(cid, inner_cover_art, title, line, sub):
    """Бөлісу суреті 1200×630: сол жақта атау, оң жақта мұқабаның сурет панелі."""
    bg, art, cast = inner_cover_art
    return f'''<div class="cv">
<svg class="mast" style="left:50px;top:40px" width="640" height="140" viewBox="0 0 640 140">
<text x="4" y="112" font-family="Unbounded, sans-serif" font-weight="800" font-size="112" letter-spacing="-4" fill="{INK}" stroke="{INK}" stroke-width="10" stroke-linejoin="round" transform="translate(7 7)">AO17 CS</text>
<text x="4" y="112" font-family="Unbounded, sans-serif" font-weight="800" font-size="112" letter-spacing="-4" fill="{RED}" stroke="{INK}" stroke-width="10" stroke-linejoin="round" paint-order="stroke">AO17 CS</text></svg>
<div class="ttl" style="position:absolute;left:54px;width:600px;top:200px;--fs:62px"><h1>{E(title)}</h1><p class="q" style="font-size:32px">{E(line)}</p><p class="m" style="font-size:22px">{E(sub)}</p></div>
<div class="foot" style="left:54px;width:600px;top:540px;height:56px"><div class="logo">{logo()}</div></div>
<div class="panel{" dark" if bg in (NAVY, "#1d3557") else ""}" style="left:700px;top:30px;width:470px;height:570px;--bg:{bg}"><svg viewBox="300 0 780 940" preserveAspectRatio="xMidYMid slice" aria-hidden="true">{DEFS}{art}{cast}</svg></div>
</div>'''


def html_doc(body, w, h):
    css = CSS.replace("FONTS", (ROOT / "assets/fonts/fonts.css").as_uri()).replace("WPX", f"{w}px").replace("HPX", f"{h}px")
    fit = ('<script>(async()=>{await document.fonts.ready;document.querySelectorAll(".lower").forEach((L)=>{const h=L.querySelector("h1");'
           'let fs=parseFloat(getComputedStyle(h).fontSize);while(L.scrollHeight>L.clientHeight+1&&fs>54){fs-=4;h.style.fontSize=fs+"px";}});'
           'document.body.setAttribute("data-ready","1");})();</script>')
    return f'<!doctype html><html lang="kk"><head><meta charset="utf-8"><style>{css}</style></head><body>{body}{fit}</body></html>'


RENDER = """
const { chromium } = require("playwright");
(async () => {
  const jobs = JSON.parse(require("fs").readFileSync(process.argv[2], "utf8"));
  const b = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
  for (const j of jobs) {
    const p = await b.newPage({ viewport: { width: j.w, height: j.h }, deviceScaleFactor: j.scale });
    await p.goto(j.src);
    await p.waitForSelector("body[data-ready]");
    await p.waitForTimeout(120);
    await p.screenshot({ path: j.out, type: "jpeg", quality: j.q });
    await p.close();
  }
  await b.close();
})();
"""


def main():
    for d in (OUT, THUMB, OG):
        d.mkdir(parents=True, exist_ok=True)
    covers = pages()
    with tempfile.TemporaryDirectory() as tmp:
        jobs = []
        for cid, body in covers:
            f = Path(tmp) / f"{cid}.html"
            f.write_text(html_doc(body, 1200, 1800), encoding="utf8")
            jobs.append({"src": f.as_uri(), "out": str(OUT / f"{cid}.jpg"), "w": 1200, "h": 1800, "scale": 5 / 6, "q": 84})
            if "-w" in cid:
                jobs.append({"src": f.as_uri(), "out": str(THUMB / f"{cid}.jpg"), "w": 1200, "h": 1800, "scale": 0.2, "q": 82})
        weeks, p2 = course_counts()
        total = sum(weeks.get(m, (0, 0))[0] for m, _, _ in CRS.WEEKS) + p2["lessons"]
        ogs = [("course-ao17cs", (NAVY, art_main(), char("N", "wow", "up", 380, 2.7, 1) + char("M", "happy", "up", 880, 2.85, -1)),
                "Компьютерлік ғылымға кіріспе", "Логикадан жүйеге, биттен 3D-ге", f"12 апта · {p2['labs']} 3D зертхана · {total} сабақ · тегін, қазақша"),
               ("ao17cs-3d", ("#1d3557", art_3d(), char("M", "think", "point", 960, 2.6, -1)),
                "Технологияның ішінен", "AO17 CS курсының 2-бөлімі", f"{p2['labs']} зертхана · {p2['lessons']} сабақ · {p2['quiz']} тест сұрағы")]
        for cid, art, title, line, sub in ogs:
            f = Path(tmp) / f"og-{cid}.html"
            f.write_text(html_doc(og(cid, art, title, line, sub), 1200, 630), encoding="utf8")
            jobs.append({"src": f.as_uri(), "out": str(OG / f"{cid}.jpg"), "w": 1200, "h": 630, "scale": 1, "q": 84})
        jf = Path(tmp) / "jobs.json"
        jf.write_text(json.dumps(jobs), encoding="utf8")
        js = Path(tmp) / "render.js"
        js.write_text(RENDER, encoding="utf8")
        subprocess.run(["node", str(js), str(jf)], check=True, cwd=ROOT / "tests", env={**os.environ})
    for cid, _ in covers:
        print(cid, f'{(OUT / f"{cid}.jpg").stat().st_size // 1024} КБ')


if __name__ == "__main__":
    main()
