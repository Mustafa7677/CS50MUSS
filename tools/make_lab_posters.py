#!/usr/bin/env python3
# © 2026 AO17 командасы. All Rights Reserved.
"""AO17 CS курсының 2-бөлімі («Технологияның ішінен»): 11 зертхананың мұқабалары - комикс журналының 2-бөлімдік нөмірлері.

1-бөлімнің әр аптасы - журналдың бір нөмірі (tools/make_course_posters.py). 2-бөлімде әр зертхана - өз нөмірі (№ 01 ... № 11):
изометриялық «3D» көрініс (сол зертхананың ішіндегі нәрсе: процессор, сұрыпталған массив, маршрутизаторлар, нейрон желі ...),
бір кейіпкер (Нұрай не Мустафа) және оның бір ауыз сөзі. Мұқабаның қаңқасы, қаріптері мен суреттің қалыңдығы -
make_course_posters.py-дікі, сондықтан екі бөлімнің нөмірлері бір сөреде қатар тұрады. Бұрынғы постерлерге тиіспейді.

    python3 tools/make_lab_posters.py
      assets/img/posters/ao17cs-3d-<зертхана>.jpg        (1000×1500)
      assets/img/posters/thumb/ao17cs-3d-<зертхана>.jpg  (240×360: 3D хабы, курс беті, дәрістің басы)
      assets/img/og/ao17cs-3d-<зертхана>.jpg             (1200×630: зертхананың сабағын бөліскенде)
      posters.html: «<!-- ao17cs-3d:begin -->» ... «<!-- ao17cs-3d:end -->» блогы (афишадағы 2-бөлімнің 11 мұқабасы)
    python3 tools/make_lab_posters.py --html     # тек афишаның блогы (сурет салынбайды)
    python3 tools/make_lab_posters.py net web    # тек осы зертханалардың суреттері
"""
import json
import math
import os
import subprocess
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import make_course_posters as P  # noqa: E402

sys.path.insert(0, str(P.ROOT / "tools/academy"))
import lab3d as L3  # noqa: E402

INK, PAPER, WHITE, GOLD, RED, SW = P.INK, P.PAPER, P.WHITE, P.GOLD, P.RED, P.SW
t, sparkle = P.t, P.sparkle
GLOW, MINT, SKY, PEACH, LILAC, SUN, ROSE = "#57c4e5", "#95d5b2", "#a8dadc", "#f4a261", "#cdb4db", "#ffd166", "#f28482"


def mix(a, b, k):
    """Екі түстің қоспасы: k = 0 - a, k = 1 - b."""
    x = [int(a[i:i + 2], 16) for i in (1, 3, 5)]
    y = [int(b[i:i + 2], 16) for i in (1, 3, 5)]
    return "#" + "".join(f"{round(p + (q - p) * k):02x}" for p, q in zip(x, y))


class Iso:
    """Изометриялық көрініс: тақтадағы (x, y, z) нүкте -> суреттегі (X, Y). (ox, oy) - тақтаның (0, 0, 0) бұрышы."""

    def __init__(self, ox, oy, s=0.9):
        self.ox, self.oy, self.s = ox, oy, s

    def p(self, x, y, z=0):
        return self.ox + (x - y) * 0.866 * self.s, self.oy + ((x + y) * 0.5 - z) * self.s

    @staticmethod
    def pts(ps):
        return " ".join(f"{a:.1f},{b:.1f}" for a, b in ps)

    def poly(self, ps, fill, sw=5, extra=""):
        return f'<polygon points="{self.pts(ps)}" fill="{fill}" stroke="{INK}" stroke-width="{sw}" stroke-linejoin="round" {extra}/>'

    def board(self, size, fill, grid=GLOW, step=110, pins=GOLD):
        """Чип-тақта: алдыңғы екі жиегінде аяқшалар, бетінде жарық жолдар."""
        g = []
        if pins:
            for k in range(int(size // 55)):
                for ax, ay, bx, by in ((k * 55 + 27, size, 0, 1), (size, k * 55 + 27, 1, 0)):
                    a, b = self.p(ax, ay), self.p(ax + bx * 34, ay + by * 34)
                    g.append(f'<path d="M{a[0]:.1f} {a[1]:.1f} L{b[0]:.1f} {b[1]:.1f}" stroke="{pins}" stroke-width="9" stroke-linecap="round"/>')
        g.append(self.poly([self.p(0, 0), self.p(size, 0), self.p(size, size), self.p(0, size)], fill, SW, 'filter="url(#sh)"'))
        k = step
        while k < size:
            a, b, c, d = self.p(k, 0), self.p(k, size), self.p(0, k), self.p(size, k)
            g.append(f'<path d="M{a[0]:.1f} {a[1]:.1f} L{b[0]:.1f} {b[1]:.1f} M{c[0]:.1f} {c[1]:.1f} L{d[0]:.1f} {d[1]:.1f}" stroke="{grid}" stroke-width="3" opacity=".5"/>')
            k += step
        return "".join(g)

    def prism(self, x, y, w, d, h, top, label=None, fs=28, z0=0, lab_fill=INK):
        s1, s2 = mix(top, INK, .22), mix(top, INK, .4)
        p = [self.p(x, y, z0 + h), self.p(x + w, y, z0 + h), self.p(x + w, y + d, z0 + h), self.p(x, y + d, z0 + h)]
        f1 = [self.p(x, y + d, z0 + h), self.p(x + w, y + d, z0 + h), self.p(x + w, y + d, z0), self.p(x, y + d, z0)]
        f2 = [self.p(x + w, y, z0 + h), self.p(x + w, y + d, z0 + h), self.p(x + w, y + d, z0), self.p(x + w, y, z0)]
        out = self.poly(f1, s1) + self.poly(f2, s2) + self.poly(p, top)
        if label:
            lx, ly = self.p(x + w / 2, y + d / 2, z0 + h)
            out += t(lx, ly + fs * .36, label, fs, 800, lab_fill, fam="Unbounded")
        return out

    def cyl(self, x, y, r, h, top, label=None, fs=24, z0=0):
        cx, yb = self.p(x, y, z0)
        _, yt = self.p(x, y, z0 + h)
        rx, ry = 1.2247 * r * self.s, 0.7071 * r * self.s
        out = (f'<path d="M{cx - rx:.1f} {yt:.1f} L{cx - rx:.1f} {yb:.1f} A{rx:.1f} {ry:.1f} 0 0 0 {cx + rx:.1f} {yb:.1f} L{cx + rx:.1f} {yt:.1f} Z" '
               f'fill="{mix(top, INK, .3)}" stroke="{INK}" stroke-width="5" stroke-linejoin="round"/>'
               f'<ellipse cx="{cx:.1f}" cy="{yt:.1f}" rx="{rx:.1f}" ry="{ry:.1f}" fill="{top}" stroke="{INK}" stroke-width="5"/>')
        if label:
            out += t(cx, yt + fs * .36, label, fs, 800, INK, fam="Unbounded")
        return out

    def ball(self, x, y, z, r, fill, label=None, fs=22, lab_fill=INK):
        cx, cy = self.p(x, y, z)
        out = (f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{r}" fill="{fill}" stroke="{INK}" stroke-width="5"/>'
               f'<circle cx="{cx - r * .35:.1f}" cy="{cy - r * .35:.1f}" r="{r * .22:.1f}" fill="{WHITE}" opacity=".7"/>')
        if label:
            out += t(cx, cy + fs * .36, label, fs, 800, lab_fill, fam="Unbounded")
        return out

    def line(self, a, b, color, w=6, dash=""):
        p, q = self.p(*a), self.p(*b)
        da = f' stroke-dasharray="{dash}"' if dash else ""
        return f'<path d="M{p[0]:.1f} {p[1]:.1f} L{q[0]:.1f} {q[1]:.1f}" stroke="{color}" stroke-width="{w}" stroke-linecap="round"{da}/>'


def tag(x, y, s, fill=WHITE, color=INK, size=26, w=None):
    """Комикс белгісі: сия жиекті дөңгелек тікбұрыш ішінде сөз (суреттің координатасында)."""
    w = w or len(s) * size * .62 + 34
    return (f'<rect x="{x - w / 2:.1f}" y="{y - size * .95:.1f}" width="{w:.1f}" height="{size * 1.6:.1f}" rx="{size * .8:.1f}" fill="{fill}" stroke="{INK}" stroke-width="5"/>'
            + t(x, y + size * .1, s, size, 800, color, fam="Unbounded"))


def harrow(x1, y1, x2, y2, color=GOLD, w=9):
    """Жарық сызығы бар бағыттауыш (P.arrow-дың түсті нұсқасы, сия жиегімен)."""
    return P.arrow(x1, y1, x2, y2, INK, w + 6) + P.arrow(x1, y1, x2, y2, color, w)


# ================================================================== 11 зертхананың бейнелері (viewBox 0 0 1080 940)
def art_arch(io):
    """Компьютер архитектурасы: чиптің ортасында CPU, артында регистрлер, бүйірінде жад, үстінде такт толқыны."""
    g = [io.board(440, mix("#b3262e", INK, .62))]
    g += [io.prism(20 + k * 75, 18, 58, 58, 46, MINT, f"R{k}", 20) for k in range(4)]
    g.append(io.prism(345, 30, 78, 380, 34, SKY, "ЖАД", 24))
    g.append(io.prism(90, 120, 210, 210, 92, SUN, "CPU", 46))
    for k in range(4):   # CPU-дан жадқа шина
        a, b = io.p(300, 150 + k * 50, 4), io.p(345, 150 + k * 50, 4)
        g.append(f'<path d="M{a[0]:.1f} {a[1]:.1f} L{b[0]:.1f} {b[1]:.1f}" stroke="{GOLD}" stroke-width="6" stroke-linecap="round"/>')
    x0, y0 = 150, 120   # такт: тікбұрышты толқын
    d = f"M{x0} {y0}" + "".join(f" h40 v-50 h40 v50" for _ in range(5))
    g.append(f'<path d="{d}" fill="none" stroke="{INK}" stroke-width="16" stroke-linejoin="round"/><path d="{d}" fill="none" stroke="{GOLD}" stroke-width="8" stroke-linejoin="round"/>')
    g.append(tag(260, 190, "1 такт", SUN))
    g.append(sparkle(560, 110, 24) + sparkle(110, 300, 16))
    return "".join(g)


def art_algo(io):
    """Алгоритмдер: сұрыпталған массив (бағандар), лупа ортаңғы элементте, lo / mid / hi белгілері."""
    g = [io.board(460, mix("#a37a00", INK, .66))]
    vals = [3, 8, 12, 20, 27, 31, 40, 47, 55]
    for k, v in enumerate(vals):
        top = SUN if k == 4 else SKY if k < 4 else MINT
        g.append(io.prism(30 + k * 46, 200, 38, 60, 26 + v * 3.2, top, str(v), 19))
    lx, ly = io.p(30 + 4 * 46 + 19, 230, 26 + 27 * 3.2)
    g.append(f'<circle cx="{lx:.1f}" cy="{ly - 120:.1f}" r="62" fill="{WHITE}" fill-opacity=".25" stroke="{INK}" stroke-width="16"/>'
             f'<circle cx="{lx:.1f}" cy="{ly - 120:.1f}" r="62" fill="none" stroke="{GOLD}" stroke-width="8"/>'
             f'<path d="M{lx + 44:.1f} {ly - 76:.1f} l58 58" stroke="{INK}" stroke-width="26" stroke-linecap="round"/>'
             f'<path d="M{lx + 44:.1f} {ly - 76:.1f} l58 58" stroke="{mix("#a37a00", WHITE, .2)}" stroke-width="14" stroke-linecap="round"/>')
    for k, s in ((0, "lo"), (4, "mid"), (8, "hi")):
        x, y = io.p(30 + k * 46 + 19, 300)
        g.append(tag(x, y + 58, s, SUN if s == "mid" else WHITE, size=24))
    g.append(sparkle(720, 120, 22) + sparkle(380, 210, 16))
    return "".join(g)


def art_math(io):
    """Математика: x, y, z осьтері, екі вектор және олар құратын параллелограмм (анықтауыш - оның ауданы)."""
    g = [io.board(440, mix("#6b4fb3", INK, .6), step=55, pins=None)]
    o = (60, 60, 0)
    u, v = (300, 110, 0), (130, 330, 0)
    s = (u[0] + v[0] - o[0], u[1] + v[1] - o[1], 0)
    g.append(io.poly([io.p(*o), io.p(*u), io.p(*s), io.p(*v)], SUN, 4, 'fill-opacity=".55"'))
    for a, b, c, lab, lp in ((o, (420, 60, 0), "#e63946", "x", (430, 60, 0)), (o, (60, 420, 0), "#4cc9f0", "y", (60, 432, 0)), (o, (60, 60, 290), "#80ed99", "z", (60, 60, 316))):
        g.append(io.line(a, b, INK, 15) + io.line(a, b, c, 8))
        x, y = io.p(*lp)
        g.append(t(x, y + 12, lab, 38, 800, c, fam="Unbounded", extra=f'stroke="{INK}" stroke-width="3" paint-order="stroke"'))
    for a, lab in ((u, "u"), (v, "v")):
        p, q = io.p(*o), io.p(*a)
        g.append(harrow(p[0], p[1], q[0], q[1], WHITE, 9))
        g.append(t(q[0] + (26 if lab == "u" else -26), q[1] - 18, lab, 36, 800, WHITE, fam="Unbounded", extra=f'stroke="{INK}" stroke-width="3" paint-order="stroke"'))
    cx, cy = io.p((u[0] + v[0]) / 2, (u[1] + v[1]) / 2)
    g.append(tag(cx, cy + 10, "det", WHITE, size=26))
    g.append(sparkle(170, 160, 22) + sparkle(520, 120, 16))
    return "".join(g)


def art_net(io):
    """Компьютерлік желілер: компьютерден серверге дейін төрт маршрутизатор, жолдағы пакеттер, таңдалған маршрут алтынмен."""
    g = [io.board(460, mix("#1f8a70", INK, .62))]
    nodes = {"PC": (40, 400), "R1": (150, 300), "R2": (320, 330), "R3": (180, 120), "R4": (360, 150), "S": (420, 40)}
    links = [("PC", "R1"), ("R1", "R2"), ("R1", "R3"), ("R2", "R4"), ("R3", "R4"), ("R4", "S"), ("R3", "S")]
    route = {("PC", "R1"), ("R1", "R3"), ("R3", "S")}
    for a, b in links:
        hot = (a, b) in route
        g.append(io.line((*nodes[a], 14), (*nodes[b], 14), INK, 14) + io.line((*nodes[a], 14), (*nodes[b], 14), GOLD if hot else GLOW, 7))
    for a, b, f in (("R1", "R3", .5), ("R3", "S", .45), ("PC", "R1", .55)):
        (x1, y1), (x2, y2) = nodes[a], nodes[b]
        g.append(io.prism(x1 + (x2 - x1) * f - 14, y1 + (y2 - y1) * f - 14, 28, 28, 28, SUN, z0=8))
    for k, (x, y) in nodes.items():
        if k == "PC":
            g.append(io.prism(x - 40, y - 30, 80, 60, 40, SKY, "PC", 22))
        elif k == "S":
            g.append(io.prism(x - 36, y - 36, 72, 72, 150, LILAC, "S", 26))
        else:
            g.append(io.cyl(x, y, 34, 28, MINT, k, 20))
    g.append(sparkle(700, 120, 20) + sparkle(250, 230, 16))
    return "".join(g)


def art_web(io):
    """Веб-әзірлеу: браузер терезесі, сервер және дерекқор; GET сұранысы барады, 200 OK жауабы қайтады."""
    g = [io.board(440, mix("#1d84a6", INK, .62))]
    g.append(io.cyl(340, 330, 52, 44, SKY, "DB", 22))
    g.append(io.cyl(340, 330, 52, 30, SKY, z0=52))
    g.append(io.prism(250, 70, 130, 130, 210, LILAC, "СЕРВЕР", 22))
    # браузер терезесі (жазық сурет, тақтаның алдында)
    bx, by, bw, bh = 70, 300, 330, 250
    g.append(f'<g transform="rotate(-4 {bx + bw / 2} {by + bh / 2})">{P.box(bx, by, bw, bh, WHITE, 18)}'
             f'<rect x="{bx}" y="{by}" width="{bw}" height="52" rx="18" fill="{mix("#1d84a6", WHITE, .55)}" stroke="{INK}" stroke-width="6"/>'
             + "".join(f'<circle cx="{bx + 28 + k * 26}" cy="{by + 26}" r="8" fill="{c}" stroke="{INK}" stroke-width="3"/>' for k, c in enumerate((ROSE, SUN, MINT)))
             + f'<rect x="{bx + 108}" y="{by + 12}" width="{bw - 128}" height="28" rx="14" fill="{WHITE}" stroke="{INK}" stroke-width="4"/>'
             + P.mono(bx + 122, by + 34, "https://", 18, INK)
             + f'<rect x="{bx + 30}" y="{by + 82}" width="{bw - 60}" height="26" rx="6" fill="{SUN}" stroke="{INK}" stroke-width="4"/>'
             + "".join(f'<rect x="{bx + 30}" y="{by + 128 + k * 30}" width="{bw - 60 - k * 50}" height="12" rx="6" fill="{mix(INK, WHITE, .75)}"/>' for k in range(3))
             + "</g>")
    sx, sy = io.p(250, 130, 150)
    g.append(harrow(bx + bw - 20, by + 40, sx - 30, sy + 30, GOLD, 9) + tag((bx + bw + sx) / 2 - 10, (by + sy) / 2 - 30, "GET /", SUN, size=24))
    g.append(harrow(sx - 10, sy + 110, bx + bw + 8, by + 150, MINT, 9) + tag((bx + bw + sx) / 2 + 20, (by + sy) / 2 + 150, "200 OK", MINT, size=24))
    g.append(sparkle(760, 90, 22) + sparkle(560, 600, 14))
    return "".join(g)


def art_db(io):
    """Дерекқорлар: үш қабатты дерекқор, жанында индекс ағашы (B-ағаш) - іздеу жолы алтынмен."""
    g = [io.board(440, mix("#0a4c7a", INK, .55))]
    for k in range(3):
        g.append(io.cyl(150, 300, 92, 46, SKY if k < 2 else SUN, "SQL" if k == 2 else None, 30, z0=k * 58))
    root, kids = (760, 110), [(650, 220), (880, 220)]
    leaves = [(600, 330), (705, 330), (830, 330), (935, 330)]
    for a, b, hot in [(root, kids[0], False), (root, kids[1], True), (kids[0], leaves[0], False), (kids[0], leaves[1], False),
                      (kids[1], leaves[2], False), (kids[1], leaves[3], True)]:
        g.append(f'<path d="M{a[0]} {a[1]} L{b[0]} {b[1]}" stroke="{INK}" stroke-width="15"/><path d="M{a[0]} {a[1]} L{b[0]} {b[1]}" stroke="{GOLD if hot else GLOW}" stroke-width="8"/>')
    for (x, y), lab, hot in [(root, "50", True), (kids[0], "20", False), (kids[1], "80", True)] + [(lf, lab, lab == "91") for lf, lab in zip(leaves, ("7", "34", "62", "91"))]:
        g.append(tag(x, y + 10, lab, SUN if hot else WHITE, size=30, w=92))
    a, b = io.p(150, 300, 170), (leaves[0][0] - 40, leaves[0][1] + 40)   # дерекқор мен индекс байланысы
    g.append(f'<path d="M{a[0] + 90:.1f} {a[1]:.1f} Q{(a[0] + b[0]) / 2 + 60:.1f} {b[1] + 60:.1f} {b[0]:.1f} {b[1]:.1f}" fill="none" stroke="{WHITE}" stroke-width="5" stroke-dasharray="12 10" opacity=".75"/>')
    g.append(sparkle(170, 140, 22) + sparkle(560, 600, 14))
    return "".join(g)


def art_sec(io):
    """Киберқауіпсіздік: үлкен құлып, кілт және шифрланған мәтін - кілтсіз ол тек шу."""
    g = [io.board(440, mix("#2b3a5c", INK, .45))]
    rows = ["7f 3a 9c e1 b2 04", "d8 5e 11 c7 6a f0", "e9 2d 83 4b 0c 96", "5a f1 27 de 3b 80"]
    for k, r in enumerate(rows):
        g.append(P.mono(60, 110 + k * 46, r, 30, mix(GLOW, WHITE, .35)).replace("<text ", '<text opacity=".8" ', 1))
    cx, cy = io.p(220, 180, 150)
    g.append(f'<path d="M{cx - 70:.1f} {cy - 10:.1f} V{cy - 110:.1f} A70 70 0 0 1 {cx + 70:.1f} {cy - 110:.1f} V{cy - 10:.1f}" fill="none" stroke="{INK}" stroke-width="44" stroke-linecap="round"/>'
             f'<path d="M{cx - 70:.1f} {cy - 10:.1f} V{cy - 110:.1f} A70 70 0 0 1 {cx + 70:.1f} {cy - 110:.1f} V{cy - 10:.1f}" fill="none" stroke="{mix(WHITE, INK, .25)}" stroke-width="28" stroke-linecap="round"/>')
    g.append(io.prism(140, 140, 170, 90, 150, SUN, "AES", 34))
    kx, ky = io.p(140, 230, 70)   # кілт тесігі - алдыңғы бетте
    g.append(f'<circle cx="{kx + 70:.1f}" cy="{ky - 25:.1f}" r="15" fill="{INK}"/><path d="M{kx + 62:.1f} {ky - 18:.1f} l-10 44 h36 l-10 -44 z" fill="{INK}"/>')
    k0x, k0y = 120, 640   # кілт (жазық сурет)
    g.append(f'<g transform="rotate(-24 {k0x} {k0y})"><circle cx="{k0x}" cy="{k0y}" r="46" fill="{GOLD}" stroke="{INK}" stroke-width="7"/>'
             f'<circle cx="{k0x}" cy="{k0y}" r="16" fill="{mix("#2b3a5c", INK, .45)}" stroke="{INK}" stroke-width="5"/>'
             f'<path d="M{k0x + 44} {k0y - 13} h170 v26 h-36 v26 h-24 v-26 h-26 v26 h-24 v-26 h-60 z" fill="{GOLD}" stroke="{INK}" stroke-width="7" stroke-linejoin="round"/></g>')
    g.append(sparkle(700, 110, 22) + sparkle(560, 560, 14))
    return "".join(g)


def art_cloud(io):
    """Бұлт және DevOps: үш сервер сөресі, үстінде контейнерлер, жоғарыда бұлт - CI/CD."""
    g = [io.board(440, mix("#3a72c4", INK, .6))]
    for k in range(3):
        x = 50 + k * 125
        g.append(io.prism(x, 160, 85, 120, 190, SKY, z0=0))
        for j in range(4):   # шамдар - алдыңғы бетте
            p = io.p(x + 18, 280, 160 - j * 40)
            g.append(f'<circle cx="{p[0]:.1f}" cy="{p[1]:.1f}" r="8" fill="{MINT if (j + k) % 3 else ROSE}" stroke="{INK}" stroke-width="3"/>')
        for j, c in enumerate((PEACH, MINT, SUN)[: 3 - (k % 2)]):
            g.append(io.prism(x + 12, 180 + j * 32, 60, 30, 30, c, z0=190))
    cx, cy = 810, 150
    d = (f"M{cx - 210} {cy + 60} q-60 0 -60 -55 q0 -55 62 -55 q14 -70 92 -70 q66 0 92 54 q24 -24 62 -24 q70 0 78 70 q60 8 60 58 q0 52 -64 52 z")
    g.append(f'<path d="{d}" fill="{WHITE}" stroke="{INK}" stroke-width="8" filter="url(#sh)"/>' + t(cx - 20, cy + 30, "CI/CD", 44, 800, "#3a72c4", fam="Unbounded"))
    g.append(sparkle(860, 300, 20) + sparkle(250, 120, 16))
    return "".join(g)


def art_ai(io):
    """Жасанды интеллект: тақтада екі кластың нүктелері (деректер), үстінде қабатты нейрон желі."""
    g = [io.board(440, mix("#7a5cd6", INK, .62), pins=None)]
    pts = [(80, 300), (120, 360), (60, 380), (150, 400), (200, 340), (300, 90), (360, 140), (330, 60), (400, 110), (260, 150)]
    for k, (x, y) in enumerate(pts):
        cx, cy = io.p(x, y, 0)
        g.append(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="13" fill="{GLOW if k < 5 else PEACH}" stroke="{INK}" stroke-width="4"/>')
    a, b = io.p(40, 120), io.p(420, 360)
    g.append(f'<path d="M{a[0]:.1f} {a[1]:.1f} L{b[0]:.1f} {b[1]:.1f}" stroke="{WHITE}" stroke-width="6" stroke-dasharray="16 12" opacity=".8"/>')
    layers = [[(380, 120), (380, 200), (380, 280)], [(560, 80), (560, 160), (560, 240), (560, 320)], [(740, 150), (740, 250)]]
    for L0, L1 in zip(layers, layers[1:]):
        for (x1, y1) in L0:
            for (x2, y2) in L1:
                w = 3 + (x1 + y1 + y2) % 5
                g.append(f'<path d="M{x1} {y1} L{x2} {y2}" stroke="{GOLD if (y1 + y2) % 3 == 0 else WHITE}" stroke-width="{w}" opacity=".85"/>')
    for k, L in enumerate(layers):
        for (x, y) in L:
            g.append(f'<circle cx="{x}" cy="{y}" r="28" fill="{(SKY, LILAC, SUN)[k]}" stroke="{INK}" stroke-width="6"/>')
    g.append(tag(560, 410, "үйрен", WHITE, size=26))
    g.append(sparkle(860, 90, 20) + sparkle(250, 120, 16))
    return "".join(g)


def art_game(io):
    """Ойын әзірлеу: әр биіктіктегі платформалар, секірген кейіпкер (парабола), тиындар, 60 FPS."""
    g = [io.board(460, mix("#b8466a", INK, .62), pins=None)]
    g.append(io.prism(30, 300, 130, 130, 60, MINT))
    g.append(io.prism(250, 220, 120, 120, 140, PEACH))
    g.append(io.prism(360, 40, 90, 90, 220, LILAC))
    for x, y, z in ((205, 300, 190), (300, 170, 250), (395, 100, 300)):
        g.append(io.cyl(x, y, 18, 8, SUN, z0=z))
    p0, p1 = io.p(95, 365, 60), io.p(310, 280, 140)
    mx, my = (p0[0] + p1[0]) / 2, min(p0[1], p1[1]) - 230
    g.append(f'<path d="M{p0[0]:.1f} {p0[1] - 34:.1f} Q{mx:.1f} {my:.1f} {p1[0]:.1f} {p1[1] - 34:.1f}" fill="none" stroke="{WHITE}" stroke-width="6" stroke-dasharray="14 12"/>')
    bx, by = (p0[0] + 2 * mx + p1[0]) / 4, (p0[1] + 2 * my + p1[1]) / 4 - 34
    g.append(f'<circle cx="{bx:.1f}" cy="{by:.1f}" r="40" fill="{SKY}" stroke="{INK}" stroke-width="7"/>'
             f'<circle cx="{bx + 10:.1f}" cy="{by - 8:.1f}" r="7" fill="{INK}"/><circle cx="{bx - 12:.1f}" cy="{by - 8:.1f}" r="7" fill="{INK}"/>'
             f'<path d="M{bx - 14:.1f} {by + 12:.1f} q14 12 28 0" fill="none" stroke="{INK}" stroke-width="5" stroke-linecap="round"/>')
    g.append(tag(880, 110, "60 FPS", SUN, size=30))
    g.append(sparkle(560, 90, 18) + sparkle(160, 160, 16))
    return "".join(g)


def art_iot(io):
    """Робототехника және IoT: роботтың қолы қорапты көтереді, сенсор толқын жібереді."""
    g = [io.board(440, mix("#2e6b4f", INK, .58))]
    g.append(io.prism(280, 100, 100, 100, 80, PEACH, "кг", 26))
    g.append(io.cyl(60, 60, 30, 40, MINT))
    sx, sy = io.p(60, 60, 40)
    for k in range(3):
        r = 40 + k * 30
        g.append(f'<path d="M{sx - r * .7:.1f} {sy - r * .6:.1f} A{r} {r} 0 0 1 {sx + r * .7:.1f} {sy - r * .6:.1f}" fill="none" stroke="{GLOW}" stroke-width="6" stroke-linecap="round" opacity="{.9 - k * .25:.2f}"/>')
    g.append(io.cyl(60, 300, 70, 50, SUN))
    j0 = io.p(60, 300, 50)
    j2 = io.p(330, 150, 270)
    j1 = (j0[0] + 100, j2[1] - 130)
    for a, b in ((j0, j1), (j1, j2)):
        g.append(f'<path d="M{a[0]:.1f} {a[1]:.1f} L{b[0]:.1f} {b[1]:.1f}" stroke="{INK}" stroke-width="44" stroke-linecap="round"/>'
                 f'<path d="M{a[0]:.1f} {a[1]:.1f} L{b[0]:.1f} {b[1]:.1f}" stroke="{mix("#2e6b4f", WHITE, .45)}" stroke-width="30" stroke-linecap="round"/>')
    for x, y in (j0, j1, j2):
        g.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="22" fill="{GOLD}" stroke="{INK}" stroke-width="6"/>')
    gx, gy = j2
    g.append(f'<path d="M{gx - 34:.1f} {gy + 10:.1f} v50 M{gx + 34:.1f} {gy + 10:.1f} v50" stroke="{INK}" stroke-width="14" stroke-linecap="round"/>')
    g.append(sparkle(760, 110, 20) + sparkle(220, 120, 16))
    return "".join(g)


# зертхана: (бейне, тақтаның (0, 0) бұрышы, кейіпкер, көңіл-күйі, қимылы, жағы, сөзі)
LABS = {
    "arch": (art_arch, (430, 330, 1.05), "M", "think", "point", "r", "Бір такт - бір қадам!"),
    "algo": (art_algo, (640, 300, 1.05), "N", "wow", "up", "l", "Ортасынан қара!"),
    "math": (art_math, (420, 330, 1.05), "M", "happy", "point", "r", "Вектор - бағыт пен ұзындық!"),
    "net": (art_net, (640, 280, 1.02), "N", "calm", "point", "l", "Пакет жолын өзі табады!"),
    "web": (art_web, (520, 330, .9), "M", "laugh", "point", "r", "GET сұрады, 200 келді!"),
    "db": (art_db, (520, 400, 1.0), "N", "think", "chin", "l", "Индекс - кітаптың мазмұны!"),
    "sec": (art_sec, (430, 360, 1.05), "M", "wow", "up", "r", "Кілтсіз - тек шу!"),
    "cloud": (art_cloud, (560, 370, 1.0), "N", "happy", None, "l", "Біреуі құласа, екіншісі тұрады!"),
    "ai": (art_ai, (420, 420, .9), "M", "think", "chin", "r", "Желі қатесінен үйренеді!"),
    "game": (art_game, (600, 290, 1.0), "N", "laugh", "up", "l", "Секундына 60 кадр!"),
    "iot": (art_iot, (420, 350, 1.05), "M", "calm", "point", "r", "Сенсор көреді, мотор істейді!"),
}


def lab_bg(color):
    return mix(color, "#0d1220", .62)


def scene(lid, color):
    art, (ox, oy, sc), who, mood, gest, side, say = LABS[lid]
    cast = P.char(who, mood, gest, 200 if side == "l" else 880, 2.6 if who == "N" else 2.75, 1 if side == "l" else -1)
    bub = P.bubble(say, 70, 360, 520, "l") if side == "l" else P.bubble(say, 610, 360, 520, "r")
    return art(Iso(ox, oy, sc)), cast, bub


def lab_cover(no, x):
    art, cast, bub = scene(x["id"], x["color"])
    meta = f"2-бөлім · {len(x['lessons'])} сабақ · {sum(q['quiz'] for q in x['lessons'])} тест сұрағы · 3D симуляция"
    return P.cover(("2-бөлім", f"{no:02d}", "3D зертхана"), lab_bg(x["color"]), art, cast, bub, P.E(x["kk"]), x["tag"] or x["en"], meta, dark=True, fs=92)


def lab_og(x):
    art, cast, _ = scene(x["id"], x["color"])
    if LABS[x["id"]][5] == "l":   # бөлісу суретінде панельдің оң жағы ғана көрінеді: сол жақтағы кейіпкер кесіліп қалмасын
        cast = ""
    body = P.og("", (lab_bg(x["color"]), art, cast), x["kk"], "2-бөлім · 3D зертхана",
                f"{len(x['lessons'])} сабақ · {sum(q['quiz'] for q in x['lessons'])} тест сұрағы · 3D симуляция")
    return body.replace('class="panel"', 'class="panel dark"', 1)


AFISHA = P.ROOT / "posters.html"
BEGIN, END = "<!-- ao17cs-3d:begin (tools/make_lab_posters.py) -->", "<!-- ao17cs-3d:end -->"
SCENE_KK = {"arch": "чиптің ортасында CPU, регистрлер, жад және такт толқыны", "algo": "сұрыпталған массив, ортаңғы элементтің үстінде лупа",
            "math": "x, y, z осьтері, екі вектор және олар құратын параллелограмм", "net": "компьютерден серверге дейінгі маршрутизаторлар мен пакеттер",
            "web": "браузер терезесі, сервер мен дерекқор, GET сұранысы және 200 OK жауабы", "db": "үш қабатты дерекқор және индекс ағашы",
            "sec": "құлып, кілт және шифрланған мәтін", "cloud": "сервер сөрелері, контейнерлер және CI/CD бұлты",
            "ai": "екі кластың нүктелері және қабатты нейрон желі", "game": "платформалар, секірген кейіпкер және тиындар",
            "iot": "роботтың қолы, қорап және сенсор"}


def afisha_block():
    """Афишадағы 2-бөлім: 11 мұқаба (posters.html-дегі 1-бөлімнің блогымен бір құрылымда)."""
    out = [BEGIN, '      <h2 id="ao17cs-3d">AO17 CS, 2-бөлім: зертханалардың мұқабалары</h2>',
           '      <p class="ps-note">2-бөлімнің әр зертханасы - журналдың өз нөмірі. Мұқабада зертхананың ішіндегі нәрсе изометриялық «3D» көріністе: процессор, '
           'маршрутизаторлар, нейрон желі, роботтың қолы. Зертхананың барлық сабағын аяқтасаң, курс бетінде оның мұқабасына «жиналды» мөрі басылады.</p>',
           '      <div class="ps-grid ps-grid-cs">']
    for no, x in enumerate(L3.lab_summary(), 1):
        cid = f"ao17cs-3d-{x['id']}"
        if not (P.OUT / f"{cid}.jpg").exists():
            continue
        name = P.E(x["kk"])
        out.append(f'        <figure class="ps-card ps-cs" id="cs-3d-{x["id"]}" data-cs="{cid}">\n'
                   f'          <a class="ps-img" href="academy/3d/index.html#{x["id"]}"><img src="assets/img/posters/{cid}.jpg" alt="AO17 CS, 2-бөлімнің {no}-нөмірі: «{name}». '
                   f'{P.E(SCENE_KK.get(x["id"], ""))}" width="1000" height="1500" loading="lazy"></a>\n'
                   f'          <figcaption><a href="academy/3d/index.html#{x["id"]}">{name}</a><span>№ {no:02d} · 2-бөлім</span>'
                   f'<a class="ps-dl" href="assets/img/posters/{cid}.jpg" download="AO17-{cid}.jpg">Мұқабаны жүктеу</a></figcaption>\n        </figure>')
    out += ["      </div>", END]
    return "\n".join(out)


def write_afisha():
    s = AFISHA.read_text(encoding="utf-8")
    block = afisha_block()
    if BEGIN in s:
        s = s[:s.index(BEGIN)] + block + s[s.index(END) + len(END):]
    else:
        anchor = "<!-- ao17cs:end -->"
        assert anchor in s, "posters.html: 1-бөлімнің блогы табылмады"
        s = s.replace(anchor, anchor + "\n" + block, 1)
    AFISHA.write_text(s, encoding="utf-8")


def main():
    if "--html" in sys.argv:
        write_afisha()
        print("posters.html: 2-бөлімнің блогы жаңартылды")
        return
    only = set(sys.argv[1:])
    labs = [(no, x) for no, x in enumerate(L3.lab_summary(), 1) if not only or x["id"] in only]
    for d in (P.OUT, P.THUMB, P.OG):
        d.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        jobs = []
        for no, x in labs:
            cid = f"ao17cs-3d-{x['id']}"
            f = Path(tmp) / f"{cid}.html"
            f.write_text(P.html_doc(lab_cover(no, x), 1200, 1800), encoding="utf8")
            jobs.append({"src": f.as_uri(), "out": str(P.OUT / f"{cid}.jpg"), "w": 1200, "h": 1800, "scale": 5 / 6, "q": 84})
            jobs.append({"src": f.as_uri(), "out": str(P.THUMB / f"{cid}.jpg"), "w": 1200, "h": 1800, "scale": 0.2, "q": 82})
            fo = Path(tmp) / f"og-{cid}.html"
            fo.write_text(P.html_doc(lab_og(x), 1200, 630), encoding="utf8")
            jobs.append({"src": fo.as_uri(), "out": str(P.OG / f"{cid}.jpg"), "w": 1200, "h": 630, "scale": 1, "q": 84})
        jf = Path(tmp) / "jobs.json"
        jf.write_text(json.dumps(jobs), encoding="utf8")
        js = Path(tmp) / "render.js"
        js.write_text(P.RENDER, encoding="utf8")
        subprocess.run(["node", str(js), str(jf)], check=True, cwd=P.ROOT / "tests", env={**os.environ})
    write_afisha()
    for _, x in labs:
        cid = f"ao17cs-3d-{x['id']}"
        print(cid, f'{(P.OUT / f"{cid}.jpg").stat().st_size // 1024} КБ, thumb {(P.THUMB / f"{cid}.jpg").stat().st_size // 1024} КБ, og {(P.OG / f"{cid}.jpg").stat().st_size // 1024} КБ')


if __name__ == "__main__":
    _ = math
    main()
