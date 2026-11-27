# © 2026 AO17 командасы. All Rights Reserved.
# AO17 Комикс: «Нұрай, Мустафа және Бота» - сабақтың өзегін түсіндіретін комикс-кадрлар (build кезінде дайын HTML + SVG).
# Кейіпкерлер (AO17 және INSIDE TECH әлемінің ортақ кейіпкерлері):
#   Нұрай - үкілі тақиялы оқушы қыз: мұқият, сұрақ қояды;
#   Мустафа - көк кепкалы оқушы ұл: батыл, асығыс кодтайды, сондықтан жиі тұзаққа түседі;
#   Бота - AO17 маскоты, ботақан: түсіндіреді.
# Кадр: жоғарыда сөз бұлттары (HTML - оқуға, аударуға, экран оқу құралына қолжетімді), төменде сурет (SVG).
# Сөз бұлты мен сурет бір-бірін жаппайды: мәтін ұзарса, кадр биіктейді.
# Екі түрі бар:
#   1) авторлық эпизодтар (comic_eps.py) - Level I-дің әр модулінің бірінші сабағы, 6 кадр;
#   2) «Тұзақ» - әр сабақтың mistakes[0] деректерінен құралатын 4 кадр (қате -> тоқта -> себеп -> ереже);
#      қатені кезекпен Нұрай не Мустафа жасайды (сабақ id-інен анықталады).
import hashlib
import html
import math
import re

E = lambda s: html.escape(str(s), quote=True)  # noqa: E731

INK = "#1b1510"
PAPER = "#f7f1e3"
SKIN, SKIN_SH = "#f2c9a0", "#e0a982"
MSKIN, MSKIN_SH = "#d9a77c", "#c08b62"      # Мустафа (INSIDE TECH-тегі түс)
JACKET, JACKET_HI, CAP = "#2e6b4f", "#3f8a67", "#2f5bea"
HAIR, HAIR_HI = "#2a1a13", "#4b3022"
HOOD, HOOD_HI, HOOD_SH = "#0a4c7a", "#1d6ea6", "#083a5e"
GOLD, RED, FEATHER = "#f2b705", "#b3262e", "#f6f2ea"
BOTA, BOTA_SH, BOTA_MUZ = "#e3a865", "#c98a4a", "#f0c48f"
MOODS = {"calm", "happy", "think", "wow", "worried", "laugh"}
WHO = {"N": "Нұрай", "M": "Мустафа", "B": "Бота"}
GEN = {"N": "Нұрайдың", "M": "Мустафаның", "B": "Ботаның"}   # ілік септік: «...-ның жазбасы»
MOOD_KK = {"calm": "сабырлы", "happy": "қуанышты", "think": "ойланып тұр", "wow": "таңғалды", "worried": "абыржыды", "laugh": "күліп тұр"}
BGS = {"yurt", "class", "steppe", "night", "desk", "flash", "screen", "aul"}
H = 230


def _n(v):
    s = f"{v:.1f}"
    return s[:-2] if s.endswith(".0") else s


# ======================================================================== кейіпкерлер
def _arm(pts, color, w=12.5):
    d = "M" + " L".join(f"{_n(x)} {_n(y)}" for x, y in pts)
    return (f'<path d="{d}" fill="none" stroke="{INK}" stroke-width="{w + 4.5}" stroke-linecap="round" stroke-linejoin="round"/>'
            f'<path d="{d}" fill="none" stroke="{color}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"/>')


def _hand(x, y, r=8, skin=SKIN):
    return f'<circle cx="{_n(x)}" cy="{_n(y)}" r="{r}" fill="{skin}" stroke="{INK}" stroke-width="2.4"/>'


def _eyes(mood, xs, ey, iris="#2a1a12", sc=1.0):
    out = []
    for i, ex in enumerate(xs):
        if mood in ("happy", "laugh"):
            out.append(f'<path d="M{_n(ex - 5 * sc)} {_n(ey + 1)} Q{_n(ex)} {_n(ey - 5.5 * sc)} {_n(ex + 5 * sc)} {_n(ey + 1)}" fill="none" stroke="{INK}" stroke-width="2.5" stroke-linecap="round"/>')
            continue
        rx, ry = (6.2, 8.2) if mood == "wow" else (5, 6.6)
        ix, iy = (1.4, -2.2) if mood == "think" else (1.2, 0.8)
        ir = 2.8 if mood == "wow" else 3.4
        out.append(f'<ellipse cx="{_n(ex)}" cy="{_n(ey)}" rx="{_n(rx * sc)}" ry="{_n(ry * sc)}" fill="#fff" stroke="{INK}" stroke-width="1.8"/>'
                   f'<circle cx="{_n(ex + ix * sc)}" cy="{_n(ey + iy * sc)}" r="{_n(ir * sc)}" fill="{iris}"/>'
                   f'<circle cx="{_n(ex + (ix + 1.1) * sc)}" cy="{_n(ey + (iy - 1.3) * sc)}" r="{_n(1.1 * sc)}" fill="#fff"/>')
        if i == len(xs) - 1:   # сыртқы кірпік
            out.append(f'<path d="M{_n(ex + 4.6 * sc)} {_n(ey - 4 * sc)} l{_n(3 * sc)} {_n(-2.6 * sc)}" stroke="{INK}" stroke-width="1.8" stroke-linecap="round"/>')
    return "".join(out)


def _brows(mood, xs, ey, sc=1.0):
    out = []
    for i, ex in enumerate(xs):
        if mood == "wow":
            d = f"M{_n(ex - 5 * sc)} {_n(ey - 14 * sc)} Q{_n(ex)} {_n(ey - 18 * sc)} {_n(ex + 5 * sc)} {_n(ey - 14 * sc)}"
        elif mood == "worried":
            d = (f"M{_n(ex - 5 * sc)} {_n(ey - 10 * sc)} L{_n(ex + 5 * sc)} {_n(ey - 13.5 * sc)}" if i == 0
                 else f"M{_n(ex - 5 * sc)} {_n(ey - 13.5 * sc)} L{_n(ex + 5 * sc)} {_n(ey - 10 * sc)}")
        elif mood == "think" and i == len(xs) - 1:
            d = f"M{_n(ex - 5 * sc)} {_n(ey - 14 * sc)} Q{_n(ex)} {_n(ey - 17 * sc)} {_n(ex + 5 * sc)} {_n(ey - 13 * sc)}"
        else:
            d = f"M{_n(ex - 5 * sc)} {_n(ey - 11 * sc)} Q{_n(ex)} {_n(ey - 14 * sc)} {_n(ex + 5 * sc)} {_n(ey - 11 * sc)}"
        out.append(f'<path d="{d}" fill="none" stroke="{INK}" stroke-width="2.4" stroke-linecap="round"/>')
    return "".join(out)


def _mouth(mood, mx, my, sc=1.0):
    k = sc
    if mood == "happy":
        return (f'<path d="M{_n(mx - 7 * k)} {_n(my - 1)} Q{_n(mx)} {_n(my + 9 * k)} {_n(mx + 7 * k)} {_n(my - 1)} Z" fill="#8f2e25" stroke="{INK}" stroke-width="2" stroke-linejoin="round"/>'
                f'<path d="M{_n(mx - 3 * k)} {_n(my + 3 * k)} Q{_n(mx)} {_n(my + 6.5 * k)} {_n(mx + 3.4 * k)} {_n(my + 3 * k)}" fill="#e0786b"/>')
    if mood == "laugh":
        return (f'<path d="M{_n(mx - 8.5 * k)} {_n(my - 2)} Q{_n(mx)} {_n(my + 12 * k)} {_n(mx + 8.5 * k)} {_n(my - 2)} Z" fill="#8f2e25" stroke="{INK}" stroke-width="2" stroke-linejoin="round"/>'
                f'<path d="M{_n(mx - 6.5 * k)} {_n(my - .5)} L{_n(mx + 6.5 * k)} {_n(my - .5)}" stroke="#fff" stroke-width="2.2"/>')
    if mood == "wow":
        return f'<ellipse cx="{_n(mx)}" cy="{_n(my + 2 * k)}" rx="{_n(4 * k)}" ry="{_n(5.6 * k)}" fill="#8f2e25" stroke="{INK}" stroke-width="2"/>'
    if mood == "think":
        return f'<path d="M{_n(mx - 5 * k)} {_n(my + 1.5)} L{_n(mx + 5 * k)} {_n(my - 1)}" stroke="{INK}" stroke-width="2.2" stroke-linecap="round"/>'
    if mood == "worried":
        return (f'<path d="M{_n(mx - 6 * k)} {_n(my + 2)} Q{_n(mx - 3 * k)} {_n(my - 2.5)} {_n(mx)} {_n(my + 1)} Q{_n(mx + 3 * k)} {_n(my + 4.5)} {_n(mx + 6 * k)} {_n(my)}" '
                f'fill="none" stroke="{INK}" stroke-width="2.2" stroke-linecap="round"/>')
    return f'<path d="M{_n(mx - 6 * k)} {_n(my)} Q{_n(mx)} {_n(my + 4.5 * k)} {_n(mx + 6 * k)} {_n(my - 1)}" fill="none" stroke="{INK}" stroke-width="2.2" stroke-linecap="round"/>'


def nurai(mood="calm", gesture=None):
    """Нұрай, оңға қарап тұр; координат басы - кеуде суретінің төменгі ортасы (y жоғары қарай теріс)."""
    p = []
    # артқы шаш: желкеге түседі
    p.append(f'<path d="M-38 -128 C-44 -170 22 -184 34 -146 C34 -120 26 -104 16 -98 L-20 -94 C-34 -96 -40 -104 -38 -128 Z" fill="{HAIR}" stroke="{INK}" stroke-width="3"/>')
    # кеуде: худи
    p.append(f'<path d="M-68 0 C-66 -40 -56 -62 -30 -70 L-12 -77 L14 -77 L32 -70 C58 -62 66 -40 68 0 Z" fill="{HOOD}" stroke="{INK}" stroke-width="3" stroke-linejoin="round"/>')
    p.append(f'<path d="M-62 0 C-60 -34 -52 -52 -38 -60" fill="none" stroke="{HOOD_SH}" stroke-width="7" stroke-linecap="round" opacity=".8"/>')
    p.append(f'<path d="M-31 -70 C-26 -55 -12 -49 1 -49 C14 -49 28 -55 33 -70 C22 -79 -20 -79 -31 -70 Z" fill="{HOOD_HI}" stroke="{INK}" stroke-width="2.4"/>')
    p.append(f'<path d="M-8 -51 L-9 -30 M10 -51 L11 -30" stroke="{FEATHER}" stroke-width="2.2" stroke-linecap="round"/>')
    p.append("".join(f'<path d="M{x} -20 l5 -5 l5 5 l-5 5 z" fill="{GOLD}" stroke="{INK}" stroke-width="1.2"/>' for x in (-25, -5, 15)))
    # мойын мен бас
    p.append(f'<path d="M-10 -96 L-10 -72 Q1 -64 12 -72 L12 -96 Z" fill="{SKIN}" stroke="{INK}" stroke-width="2.6"/>')
    p.append(f'<path d="M-9 -88 Q2 -80 11 -88 L11 -82 Q2 -76 -9 -82 Z" fill="{SKIN_SH}" opacity=".8"/>')
    p.append(f'<ellipse cx="2" cy="-128" rx="31" ry="34" fill="{SKIN}" stroke="{INK}" stroke-width="3"/>')
    # құлақ (артқы жақта)
    p.append(f'<ellipse cx="-25" cy="-124" rx="6" ry="8.5" fill="{SKIN}" stroke="{INK}" stroke-width="2.4"/><path d="M-26 -128 q3 3 0 7" fill="none" stroke="{SKIN_SH}" stroke-width="2"/>')
    # бұрым: артқы иықтан алға түседі
    br = [(-31, -104), (-35, -89), (-38, -74), (-40, -59), (-41, -45)]
    p.append("".join(f'<ellipse cx="{x}" cy="{y}" rx="8.6" ry="9.6" fill="{HAIR}" stroke="{INK}" stroke-width="2.4"/>' for x, y in br))
    p.append("".join(f'<path d="M{x - 6} {y - 2} q6 5 12 0" fill="none" stroke="{HAIR_HI}" stroke-width="1.6"/>' for x, y in br))
    p.append(f'<rect x="-47" y="-39" width="12" height="6" rx="2" fill="{GOLD}" stroke="{INK}" stroke-width="1.6"/>'
             f'<path d="M-44 -33 q-4 9 -2 14 M-39 -33 q2 9 4 13" fill="none" stroke="{HAIR}" stroke-width="3.4" stroke-linecap="round"/>')
    # кекіл
    p.append(f'<path d="M-29 -132 C-32 -158 -12 -168 6 -167 C25 -165 35 -152 34 -132 C29 -141 23 -143 19 -138 C15 -146 7 -148 3 -141 '
             f'C-3 -149 -14 -149 -18 -139 C-22 -145 -27 -140 -29 -132 Z" fill="{HAIR}" stroke="{INK}" stroke-width="2.6" stroke-linejoin="round"/>')
    p.append(f'<path d="M-10 -160 C0 -165 12 -164 20 -158" fill="none" stroke="{HAIR_HI}" stroke-width="2.4" stroke-linecap="round"/>')
    # тақия мен үкі
    p.append(f'<path d="M-27 -150 C-25 -177 25 -183 31 -152 C14 -161 -10 -161 -27 -150 Z" fill="{RED}" stroke="{INK}" stroke-width="2.6" stroke-linejoin="round"/>')
    p.append(f'<path d="M-27 -150 C-10 -161 14 -161 31 -152" fill="none" stroke="{GOLD}" stroke-width="4"/>'
             f'<path d="M-27 -150 C-10 -161 14 -161 31 -152" fill="none" stroke="{INK}" stroke-width="1" transform="translate(0 2.6)"/>')
    p.append(f'<path d="M2 -175 l4 5 l-4 5 l-4 -5 z M-12 -168 l3 4 l-3 4 l-3 -4 z M16 -168 l3 4 l-3 4 l-3 -4 z" fill="{GOLD}"/>')
    for d in ("M-5 -176 C-16 -190 -18 -204 -14 -215 C-7 -203 -2 -190 -5 -176 Z", "M-3 -176 C-7 -194 -2 -208 7 -218 C7 -203 4 -189 -3 -176 Z",
              "M-1 -176 C4 -190 12 -199 22 -205 C15 -193 9 -183 -1 -176 Z"):
        p.append(f'<path d="{d}" fill="{FEATHER}" stroke="{INK}" stroke-width="1.7" stroke-linejoin="round"/>')
    p.append(f'<path d="M-11 -200 l4 2 M-9 -192 l4 2 M2 -205 l-4 3 M3 -196 l-4 3 M10 -194 l-1 4 M6 -188 l-1 4" stroke="#c9c1b2" stroke-width="1.3" stroke-linecap="round"/>')
    p.append(f'<circle cx="-3" cy="-176" r="3.4" fill="{GOLD}" stroke="{INK}" stroke-width="1.5"/>')
    # бет
    p.append(f'<circle cx="-9" cy="-111" r="4.5" fill="#f08a7a" opacity=".45"/><circle cx="25" cy="-111" r="3.8" fill="#f08a7a" opacity=".45"/>')
    p.append(_eyes(mood, (-3, 17), -126))
    p.append(_brows(mood, (-3, 17), -126))
    p.append(f'<path d="M26 -121 q4 5 -1 6" fill="none" stroke="{INK}" stroke-width="2" stroke-linecap="round"/>')
    p.append(_mouth(mood, 15, -104))
    # қимыл (нұсқалары _gestures-та: N_HEAD-тан кейін анықталған, шақыру кезінде қолжетімді)
    p.append(_gestures(gesture, HOOD, SKIN))
    return "".join(p)


N_HEAD = (2, -128, 34)      # бас ортасы мен радиусы (жергілікті координат)


def _gestures(gesture, sleeve, skin):
    if gesture == "chin":
        return _arm([(38, -34), (30, -62), (20, -86)], sleeve) + _hand(19, -92, 8.6, skin)
    if gesture == "point":
        return (_arm([(44, -40), (62, -58), (78, -72)], sleeve) + _hand(81, -75, 8, skin)
                + f'<path d="M84 -79 L97 -88" stroke="{INK}" stroke-width="7.6" stroke-linecap="round"/><path d="M84 -79 L97 -88" stroke="{skin}" stroke-width="4.4" stroke-linecap="round"/>')
    if gesture == "up":
        return (_arm([(36, -58), (46, -100), (52, -146)], sleeve) + f'<ellipse cx="53" cy="-156" rx="8" ry="10.5" fill="{skin}" stroke="{INK}" stroke-width="2.4"/>'
                + f'<path d="M48 -164 v-6 M53 -166 v-7 M58 -164 v-6" stroke="{INK}" stroke-width="1.6" stroke-linecap="round"/>')
    return ""


def mustafa(mood="calm", gesture=None, mirror=False):
    """Мустафа, оңға қарап тұр: қысқа қара шаш, көк кепка (күнқағары алдында), жасыл куртка. Координат басы - кеуде суретінің төменгі ортасы."""
    p = []
    # куртка
    p.append(f'<path d="M-66 0 C-64 -38 -56 -60 -30 -69 L-11 -76 L13 -76 L32 -69 C58 -60 66 -38 66 0 Z" fill="{JACKET}" stroke="{INK}" stroke-width="3" stroke-linejoin="round"/>')
    p.append(f'<path d="M-60 0 C-58 -32 -50 -50 -36 -58" fill="none" stroke="#24543e" stroke-width="7" stroke-linecap="round" opacity=".85"/>')
    p.append(f'<path d="M-12 -76 L1 -54 L14 -76 L28 -70 L12 -44 L1 -56 L-10 -44 L-26 -70 Z" fill="{JACKET_HI}" stroke="{INK}" stroke-width="2.4" stroke-linejoin="round"/>')
    p.append(f'<path d="M1 -54 V0" stroke="{GOLD}" stroke-width="3"/><path d="M1 -54 V0" stroke="{INK}" stroke-width="1" stroke-dasharray="2 4"/>')
    p.append(f'<rect x="-44" y="-36" width="22" height="14" rx="3" fill="#fffdf7" stroke="{INK}" stroke-width="1.8"/>'
             # кейіпкер айналып (солға) тұрса, төсбелгі жазуы қайта айналады: «AO» әрқашан оқылады (айнадағыдай «OA» емес)
             + (f'<text x="33" y="-25.5" transform="scale(-1 1)"' if mirror else '<text x="-33" y="-25.5"')
             + f' text-anchor="middle" font-family="Unbounded, Inter, sans-serif" font-weight="800" font-size="9" fill="{HOOD}">AO</text>')
    # мойын мен бас
    p.append(f'<path d="M-10 -96 L-10 -72 Q1 -64 12 -72 L12 -96 Z" fill="{MSKIN}" stroke="{INK}" stroke-width="2.6"/>')
    p.append(f'<path d="M-9 -88 Q2 -80 11 -88 L11 -82 Q2 -76 -9 -82 Z" fill="{MSKIN_SH}" opacity=".8"/>')
    p.append(f'<ellipse cx="2" cy="-127" rx="30" ry="33" fill="{MSKIN}" stroke="{INK}" stroke-width="3"/>')
    # қысқа шаш (желке мен самай)
    p.append(f'<path d="M-29 -122 C-34 -150 -18 -162 0 -162 C18 -162 30 -152 32 -134 C26 -142 16 -146 4 -146 C-10 -146 -20 -140 -24 -128 L-22 -112 C-26 -112 -29 -116 -29 -122 Z" '
             f'fill="#1d1b26" stroke="{INK}" stroke-width="2.4" stroke-linejoin="round"/>')
    p.append(f'<ellipse cx="-24" cy="-122" rx="5.6" ry="8" fill="{MSKIN}" stroke="{INK}" stroke-width="2.3"/><path d="M-25 -126 q3 3 0 7" fill="none" stroke="{MSKIN_SH}" stroke-width="2"/>')
    # кепка: күмбез, күнқағар (бет жақта), түйме, алтын белгі
    p.append(f'<path d="M-31 -142 C-31 -172 28 -176 33 -144 C16 -150 -14 -150 -31 -142 Z" fill="{CAP}" stroke="{INK}" stroke-width="2.6" stroke-linejoin="round"/>')
    p.append(f'<path d="M-6 -169 C-8 -158 -9 -150 -8 -146 M14 -168 C16 -158 16 -152 15 -147" fill="none" stroke="#1f43b8" stroke-width="1.8"/>')
    p.append(f'<path d="M22 -146 C36 -151 50 -148 58 -141 C47 -138 32 -138 20 -141 Z" fill="#2449c4" stroke="{INK}" stroke-width="2.4" stroke-linejoin="round"/>')
    p.append(f'<circle cx="2" cy="-171" r="3.2" fill="#1f43b8" stroke="{INK}" stroke-width="1.6"/><path d="M8 -158 l4 -5 l4 5 l-4 5 z" fill="{GOLD}" stroke="{INK}" stroke-width="1"/>')
    # бет
    p.append(f'<circle cx="-8" cy="-110" r="4.2" fill="#e07a62" opacity=".35"/>')
    p.append(_eyes(mood, (-2, 17), -124))
    p.append(_brows(mood, (-2, 17), -124).replace('stroke-width="2.4"', 'stroke-width="3.2"'))
    p.append(f'<path d="M26 -119 q4 5 -1 6" fill="none" stroke="{INK}" stroke-width="2" stroke-linecap="round"/>')
    p.append(_mouth(mood, 14, -103))
    p.append(_gestures(gesture, JACKET, MSKIN))
    return "".join(p)


M_HEAD = (2, -127, 33)


def bota(mood="happy"):
    """Бота (ботақан), оңға қарап тұр; 120-лық түпнұсқа маскоттан, сызба контурымен. Координат басы - аяғының ортасы."""
    p = ['<g transform="translate(-62 -108)">']
    p.append(f'<path d="M30 76 q-9 2 -7 13" fill="none" stroke="{INK}" stroke-width="5" stroke-linecap="round"/><path d="M30 76 q-9 2 -7 13" fill="none" stroke="{BOTA_SH}" stroke-width="3" stroke-linecap="round"/>')
    p.append(f'<rect x="38" y="83" width="9" height="25" rx="4" fill="{BOTA_SH}" stroke="{INK}" stroke-width="1.9"/>'
             f'<rect x="73" y="83" width="9" height="25" rx="4" fill="{BOTA_SH}" stroke="{INK}" stroke-width="1.9"/>')
    p.append(f'<path d="M30 86 C26 64 44 60 52 66 C56 50 72 50 76 64 C88 62 96 72 92 86 Z" fill="{BOTA}" stroke="{INK}" stroke-width="1.9" stroke-linejoin="round"/>')
    p.append(f'<path d="M57 56 C62 52 68 52 72 57" fill="none" stroke="#f3c993" stroke-width="2.4" stroke-linecap="round"/>')
    p.append(f'<path d="M40 74 h44 v10 h-44 z" fill="{HOOD}" stroke="{INK}" stroke-width="1.5"/>'
             f'<path d="M44 79 l4 -3 l4 3 l-4 3 z M58 79 l4 -3 l4 3 l-4 3 z M72 79 l4 -3 l4 3 l-4 3 z" fill="{GOLD}"/>')
    neck = "M84 70 C90 54 88 40 92 32"
    p.append(f'<path d="{neck}" fill="none" stroke="{INK}" stroke-width="15.6" stroke-linecap="round"/><path d="{neck}" fill="none" stroke="{BOTA}" stroke-width="11.8" stroke-linecap="round"/>')
    p.append(f'<ellipse cx="98" cy="30" rx="15" ry="12" fill="{BOTA}" stroke="{INK}" stroke-width="1.9"/>')
    p.append(f'<ellipse cx="108" cy="34" rx="7.2" ry="6.2" fill="{BOTA_MUZ}" stroke="{INK}" stroke-width="1.5"/><circle cx="112" cy="32" r="1" fill="{INK}"/>')
    p.append(f'<ellipse cx="88" cy="20" rx="3.6" ry="6.2" fill="{BOTA_SH}" stroke="{INK}" stroke-width="1.3" transform="rotate(-20 88 20)"/>')
    p.append(f'<circle cx="102" cy="33" r="2.5" fill="#f08a7a" opacity=".6"/>')
    # көзі
    if mood in ("happy", "laugh"):
        p.append(f'<path d="M94 27.5 Q98 22.5 102 27.5" fill="none" stroke="{INK}" stroke-width="1.9" stroke-linecap="round"/>')
    else:
        r, dy = (5.2, 0) if mood == "wow" else (4.2, -1.6 if mood == "think" else 0)
        p.append(f'<circle cx="98" cy="{_n(27 + dy)}" r="{r}" fill="#14213d"/><circle cx="99.4" cy="{_n(25.5 + dy)}" r="1.5" fill="#fff"/>')
    p.append(f'<path d="M94 22 l-2 -3 M97 21 l-0.5 -3.5 M100 21.5 l1 -3" stroke="{INK}" stroke-width="1.3" stroke-linecap="round"/>')
    if mood == "worried":
        p.append(f'<path d="M93 18.5 L101 16.5" stroke="{INK}" stroke-width="1.5" stroke-linecap="round"/>')
    # аузы
    if mood == "happy":
        p.append(f'<path d="M103.5 37 q4.5 5 9 0 z" fill="#8f2e25" stroke="{INK}" stroke-width="1.3"/>')
    elif mood == "laugh":
        p.append(f'<path d="M102.5 36.5 q5.5 7 10.5 0 z" fill="#8f2e25" stroke="{INK}" stroke-width="1.3"/>')
    elif mood == "wow":
        p.append(f'<ellipse cx="108" cy="38.6" rx="2.6" ry="3.2" fill="#8f2e25" stroke="{INK}" stroke-width="1.2"/>')
    elif mood in ("think", "worried"):
        p.append(f'<path d="M104.5 38 h6.5" stroke="{INK}" stroke-width="1.5" stroke-linecap="round"/>')
    else:
        p.append(f'<path d="M104 37 q4 3 8 0" fill="none" stroke="{INK}" stroke-width="1.5" stroke-linecap="round"/>')
    # тақия
    p.append(f'<path d="M86 18 q12 -14 24 0 z" fill="{RED}" stroke="{INK}" stroke-width="1.5" stroke-linejoin="round"/><path d="M87 17.5 h22" stroke="{GOLD}" stroke-width="1.8"/>'
             f'<circle cx="98" cy="9" r="2.7" fill="{GOLD}" stroke="{INK}" stroke-width="1.1"/>')
    p.append("</g>")
    return "".join(p)


BK = 1.72                 # Ботаның масштабы
B_HEAD = (36, -78, 20)    # бас ортасы (масштабқа дейінгі, translate-тен кейінгі жергілікті координат)


def actor(who, mood, x, s, face, gesture=None):
    """Кейіпкерді (x, H) нүктесіне қояды. face: 1 - оңға, -1 - солға."""
    if who == "N":
        body, k = nurai(mood, gesture), s
    elif who == "M":
        body, k = mustafa(mood, gesture, mirror=face < 0), s
    elif who in GD.DRAW:   # «Тірі заттар»: техника-кейіпкерлер (gadgets.py)
        body, k = GD.DRAW[who](mood), s
    else:
        body, k = bota(mood), s * BK
    return f'<g transform="translate({_n(x)} {H}) scale({_n(k * face)} {_n(k)})">{body}</g>'


def head_xy(who, x, s, face):
    hx, hy, hr = {"N": N_HEAD, "M": M_HEAD, **GD.HEAD}.get(who, B_HEAD)
    k = s * BK if who == "B" else s
    return x + hx * k * face, H + hy * k, hr * k


# ======================================================================== әсерлер
def fx(kind, hx, hy, hr, face):
    ox = hx + face * hr * 1.08
    if kind == "idea":
        y = hy - hr - 26
        return (f'<g transform="translate({_n(ox)} {_n(y)})"><path d="M-17 -8 l-8 -6 M17 -8 l8 -6 M0 -24 v-9 M-13 -20 l-5 -7 M13 -20 l5 -7" stroke="{GOLD}" stroke-width="3" stroke-linecap="round"/>'
                f'<path d="M-11 6 C-17 -2 -15 -18 0 -19 C15 -18 17 -2 11 6 Z" fill="#ffe27a" stroke="{INK}" stroke-width="2.4"/>'
                f'<rect x="-7" y="6" width="14" height="8" rx="2" fill="#b9b2a5" stroke="{INK}" stroke-width="2"/><path d="M-4 0 q4 -6 8 0" fill="none" stroke="{INK}" stroke-width="1.6"/></g>')
    if kind == "q":
        return "".join(f'<text x="{_n(ox + dx * face)}" y="{_n(hy - hr - dy)}" font-family="Unbounded, Inter, sans-serif" font-weight="800" font-size="{fs}" fill="{GOLD}" stroke="{INK}" stroke-width="1.6" paint-order="stroke" text-anchor="middle">?</text>'
                       for dx, dy, fs in ((-8, 6, 24), (12, 18, 17)))
    if kind == "sweat":
        x, y = hx - face * hr * .95, hy - hr * .45
        return f'<path d="M{_n(x)} {_n(y)} q-5 8 0 11 q5 -3 0 -11 z" fill="#8fd3f4" stroke="{INK}" stroke-width="1.6"/><path d="M{_n(x + 6 * -face)} {_n(y - 6)} l{_n(-4 * face)} -5" stroke="{INK}" stroke-width="1.6" stroke-linecap="round"/>'
    if kind == "spark":
        out = []
        for dx, dy, r in ((-hr * 1.2, -hr * .9, 7), (hr * 1.1, -hr * 1.2, 9), (hr * .2, -hr * 1.6, 6)):
            cx, cy = hx + dx, hy + dy
            out.append(f'<path d="M{_n(cx)} {_n(cy - r)} L{_n(cx + r * .3)} {_n(cy - r * .3)} L{_n(cx + r)} {_n(cy)} L{_n(cx + r * .3)} {_n(cy + r * .3)} L{_n(cx)} {_n(cy + r)} '
                       f'L{_n(cx - r * .3)} {_n(cy + r * .3)} L{_n(cx - r)} {_n(cy)} L{_n(cx - r * .3)} {_n(cy - r * .3)} Z" fill="{GOLD}" stroke="{INK}" stroke-width="1.4"/>')
        return "".join(out)
    return ""


def sfx(text, x, y, rot=-8, size=34, color=GOLD):
    return (f'<text x="{_n(x)}" y="{_n(y)}" transform="rotate({rot} {_n(x)} {_n(y)})" text-anchor="middle" font-family="Unbounded, Inter, sans-serif" font-weight="800" '
            f'font-size="{size}" fill="{color}" stroke="{INK}" stroke-width="3.2" paint-order="stroke" stroke-linejoin="round" letter-spacing="1">{E(text)}</text>')


# ======================================================================== сахналар
def bg(kind, w, uid, busy=False):
    o = [f'<rect width="{w}" height="{H}" fill="{PAPER}"/>']
    if kind == "yurt":
        o.append(f'<rect width="{w}" height="{H}" fill="#ecdcbf"/>')
        o.append(f'<g stroke="#b98d5c" stroke-width="3" opacity=".55">' + "".join(
            f'<path d="M{x} 210 L{x + 46} 120 M{x + 46} 210 L{x} 120"/>' for x in range(-40, w + 40, 46)) + "</g>")
        o.append(f'<rect y="112" width="{w}" height="10" fill="#a8783f" opacity=".7"/>')
        o.append(f'<g stroke="#a8783f" stroke-width="5" stroke-linecap="round" opacity=".55">' + "".join(
            f'<path d="M{_n(w / 2)} -40 L{_n(w / 2 + (i - 6) * w / 9)} 112"/>' for i in range(13)) + "</g>")
        o.append(f'<rect y="{H - 20}" width="{w}" height="20" fill="#a63a2e"/>'
                 + "".join(f'<path d="M{x} {H - 10} l7 -6 l7 6 l-7 6 z" fill="{GOLD}" opacity=".85"/>' for x in range(6, w, 28)))
    elif kind == "class":
        o.append(f'<rect width="{w}" height="{H}" fill="#dfe7e2"/><rect y="{H - 18}" width="{w}" height="18" fill="#b9a382"/>')
    elif kind in ("steppe", "aul"):
        o.append(f'<defs><linearGradient id="sk{uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fd3e6"/><stop offset="1" stop-color="#f4ecd8"/></linearGradient></defs>'
                 f'<rect width="{w}" height="{H}" fill="url(#sk{uid})"/>')
        o.append(f'<circle cx="{w - 46}" cy="38" r="20" fill="{GOLD}" stroke="{INK}" stroke-width="2.2"/>')
        o.append(f'<path d="M0 150 C{_n(w * .2)} 118 {_n(w * .4)} 140 {_n(w * .6)} 124 S{_n(w * .9)} 128 {w} 120 L{w} {H} L0 {H} Z" fill="#cdbb8b" stroke="{INK}" stroke-width="2"/>')
        o.append(f'<path d="M0 182 C{_n(w * .3)} 168 {_n(w * .6)} 186 {w} 172 L{w} {H} L0 {H} Z" fill="#a9b56a" stroke="{INK}" stroke-width="2"/>')
        if kind == "aul":
            for i, x in enumerate(range(40, w, 120)):
                s = .55 if i % 2 else .45
                o.append(f'<g transform="translate({x} 150) scale({s})"><path d="M-50 0 L-50 -36 Q0 -86 50 -36 L50 0 Z" fill="#f1e8d6" stroke="{INK}" stroke-width="3.4"/>'
                         f'<path d="M-50 -36 Q0 -86 50 -36" fill="none" stroke="#a63a2e" stroke-width="5"/><rect x="-10" y="-26" width="20" height="26" fill="#7a4a24" stroke="{INK}" stroke-width="3"/></g>')
    elif kind == "night":
        o.append(f'<rect width="{w}" height="{H}" fill="#14213d"/>')
        o.append("".join(f'<circle cx="{(i * 97) % w}" cy="{(i * 53) % 120 + 8}" r="{1.4 if i % 3 else 2.2}" fill="#f6efd9"/>' for i in range(1, 34)))
        o.append(f'<circle cx="{w - 60}" cy="44" r="18" fill="#f6efd9"/><circle cx="{w - 52}" cy="40" r="16" fill="#14213d"/>')
        o.append(f'<path d="M0 176 C{_n(w * .25)} 150 {_n(w * .55)} 172 {w} 150 L{w} {H} L0 {H} Z" fill="#0b1428"/>')
    elif kind == "desk":
        o.append(f'<rect width="{w}" height="{H}" fill="#f0e4cc"/>')
        if not busy:   # қабырғадағы жазба тақтасы: кейіпкерлердің арасында, заты бар кадрда жоқ
            nx, nw = w / 2 - 44, 88
            o.append(f'<rect x="{_n(nx)}" y="22" width="{nw}" height="56" rx="3" fill="#f7f1e3" stroke="{INK}" stroke-width="2"/>'
                     f'<path d="M{_n(nx + 9)} 38 h{nw - 18} M{_n(nx + 9)} 50 h{nw - 32} M{_n(nx + 9)} 62 h{nw - 24}" stroke="#c7b89c" stroke-width="3"/>')
        o.append(f'<rect y="{H - 30}" width="{w}" height="30" fill="#8a5a2b" stroke="{INK}" stroke-width="2"/>')
    elif kind == "flash":
        o.append(f'<defs><pattern id="ht{uid}" width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="6" cy="6" r="2.6" fill="#f2b705" opacity=".55"/></pattern></defs>'
                 f'<rect width="{w}" height="{H}" fill="#ffe9a8"/><rect width="{w}" height="{H}" fill="url(#ht{uid})"/>')
        cx, cy = w / 2, H / 2
        o.append(f'<g stroke="#f7c948" stroke-width="10" opacity=".7">' + "".join(
            f'<path d="M{_n(cx)} {_n(cy)} L{_n(cx + math.cos(a) * w)} {_n(cy + math.sin(a) * w)}"/>' for a in [i * math.pi / 10 for i in range(20)]) + "</g>")
    elif kind == "screen":
        o.append(f'<rect width="{w}" height="{H}" fill="#0f1b2d"/><g stroke="#1d3150" stroke-width="1">'
                 + "".join(f'<path d="M{x} 0 V{H}"/>' for x in range(0, w, 24)) + "".join(f'<path d="M0 {y} H{w}"/>' for y in range(0, H, 24)) + "</g>")
    return "".join(o)


# ======================================================================== заттар (props)
MONO = "JetBrains Mono, ui-monospace, monospace"
CW = 0.6     # моноширинді таңбаның ені (font-size үлесі)


def _hl(line):
    """Кодтың жеңіл бояуы: жолдар - алтын, сандар - көгілдір, түсініктеме - сұр."""
    out, i = [], 0
    for m in re.finditer(r"(#(?!include).*$|//.*$|'[^']*'|\"[^\"]*\"|\b\d+(?:\.\d+)?\b)", line):
        out.append(E(line[i:m.start()]))
        t = m.group(0)
        col = "#8b9bb4" if t.startswith(("#", "//")) else GOLD if t[0] in "'\"" else "#7fd4e6"
        out.append(f'<tspan fill="{col}">{E(t)}</tspan>')
        i = m.end()
    out.append(E(line[i:]))
    return "".join(out)


def _fit(lines, avail, fs=13.0, lo=9.0):
    n = max([len(x) for x in lines] + [1])
    while fs > lo and n * fs * CW + 24 > avail:
        fs -= .5
    return fs, n * fs * CW + 24


def p_code(spec, x0, x1, uid, term=False, top=0):
    lines = spec["lines"] if isinstance(spec, dict) else spec
    out_lines = spec.get("out", []) if isinstance(spec, dict) else []
    avail = x1 - x0
    fs, wid = _fit(lines + out_lines, avail)
    room = H - 12 - top
    hfun = lambda f: 16 + f * 1.42 * len(lines) + (10 + f * 1.42 * len(out_lines) if out_lines else 0) + 10  # noqa: E731
    while fs > 8.5 and hfun(fs) > room:
        fs -= .5
    wid = min(avail, max(len(max(lines + out_lines + [''], key=len)) * fs * CW + 24, 120))
    lh = fs * 1.42
    hh = hfun(fs)
    cx = (x0 + x1) / 2
    x, y = cx - wid / 2, top + (H - top - hh) / 2 - 3
    bgc = "#0b0b0b" if term else "#0f1b2d"
    o = [f'<g><rect x="{_n(x + 4)}" y="{_n(y + 5)}" width="{_n(wid)}" height="{_n(hh)}" rx="8" fill="{INK}" opacity=".35"/>'
         f'<rect x="{_n(x)}" y="{_n(y)}" width="{_n(wid)}" height="{_n(hh)}" rx="8" fill="{bgc}" stroke="{INK}" stroke-width="2.4"/>']
    o.append("".join(f'<circle cx="{_n(x + 12 + i * 10)}" cy="{_n(y + 9)}" r="3" fill="{c}"/>' for i, c in enumerate(("#e5534b", GOLD, "#57ab5a"))))
    ty = y + 16 + lh * .8
    for ln in lines:
        txt = (f'<tspan fill="#9be37f">$ </tspan>{E(ln[2:])}' if term and ln.startswith("$ ") else _hl(ln))
        o.append(f'<text x="{_n(x + 12)}" y="{_n(ty)}" font-family="{MONO}" font-size="{_n(fs)}" fill="#e6edf5" xml:space="preserve">{txt}</text>')
        ty += lh
    if out_lines:
        o.append(f'<path d="M{_n(x + 8)} {_n(ty - lh * .55)} H{_n(x + wid - 8)}" stroke="#2c4366" stroke-width="1.5" stroke-dasharray="4 4"/>')
        ty += 8
        for ln in out_lines:
            col = "#ff8f87" if re.match(r"^\w*(Error|error)\b", ln) or "error" in ln.lower()[:30] else "#c8f0b4"
            o.append(f'<text x="{_n(x + 12)}" y="{_n(ty)}" font-family="{MONO}" font-size="{_n(fs)}" fill="{col}" xml:space="preserve">{E(ln)}</text>')
            ty += lh
    o.append("</g>")
    return "".join(o)


def p_cells(spec, x0, x1, uid, top=0):
    vals = spec["vals"]
    top, bot, hl, arrow = spec.get("top"), spec.get("bot"), set(spec.get("hl", [])), spec.get("arrow")
    cw = min(40.0, (x1 - x0 - 8) / max(1, len(vals)))
    fs = min(15.0, cw * .42 + 2) if max(len(str(v)) for v in vals) > 2 else min(16.0, cw * .5)
    wid = cw * len(vals)
    x, y = (x0 + x1) / 2 - wid / 2, (spec.get("y") or 92)
    o = []
    for i, v in enumerate(vals):
        cx = x + i * cw
        fill = "#ffe27a" if i in hl else "#fffdf7"
        o.append(f'<rect x="{_n(cx)}" y="{_n(y)}" width="{_n(cw)}" height="{_n(cw)}" fill="{fill}" stroke="{INK}" stroke-width="2.4"/>'
                 f'<text x="{_n(cx + cw / 2)}" y="{_n(y + cw / 2 + fs * .36)}" text-anchor="middle" font-family="{MONO}" font-weight="700" font-size="{_n(fs)}" fill="{INK}">{E(v)}</text>')
        if top:
            o.append(f'<text x="{_n(cx + cw / 2)}" y="{_n(y - 7)}" text-anchor="middle" font-family="{MONO}" font-size="{_n(min(11.5, cw * .34))}" fill="#5a4a35">{E(top[i])}</text>')
        if bot:
            o.append(f'<text x="{_n(cx + cw / 2)}" y="{_n(y + cw + 15)}" text-anchor="middle" font-family="Inter, sans-serif" font-weight="600" font-size="{_n(min(11.5, cw * .34))}" fill="#5a4a35">{E(bot[i])}</text>')
    if spec.get("label"):
        o.append(f'<text x="{_n(x)}" y="{_n(y - (24 if top else 9))}" font-family="Inter, sans-serif" font-weight="700" font-size="13" fill="{INK}">{E(spec["label"])}</text>')
    if arrow:
        i, t = arrow
        ax = x + i * cw + cw / 2
        ay = y + cw + (26 if bot else 10)
        o.append(f'<path d="M{_n(ax)} {_n(ay + 30)} L{_n(ax)} {_n(ay + 4)}" stroke="#b3262e" stroke-width="3"/><path d="M{_n(ax - 6)} {_n(ay + 11)} L{_n(ax)} {_n(ay + 2)} L{_n(ax + 6)} {_n(ay + 11)}" fill="none" stroke="#b3262e" stroke-width="3" stroke-linejoin="round"/>'
                 f'<text x="{_n(ax)}" y="{_n(ay + 46)}" text-anchor="middle" font-family="Inter, sans-serif" font-weight="800" font-size="13" fill="#b3262e">{E(t)}</text>')
    return "".join(o)


def p_bits(spec, x0, x1, uid, top=0):
    rows = spec["rows"]
    n = max(len(r) for r in rows)
    r = min(13.0, (x1 - x0 - 20) / (n * 2.7))
    gap = r * 2.7
    o = []
    rh = min(46.0, 150 / max(1, len(rows)))
    y0 = (H - rh * len(rows)) / 2 + rh / 2 - 8
    for j, row in enumerate(rows):
        cy = y0 + j * rh
        wid = gap * len(row)
        x = (x0 + x1) / 2 - wid / 2 + gap / 2
        for i, b in enumerate(row):
            on = str(b) == "1"
            o.append((f'<circle cx="{_n(x + i * gap)}" cy="{_n(cy)}" r="{_n(r * 1.6)}" fill="#ffe27a" opacity=".55"/>' if on else "")
                     + f'<circle cx="{_n(x + i * gap)}" cy="{_n(cy)}" r="{_n(r)}" fill="{GOLD if on else "#4a4a4a"}" stroke="{INK}" stroke-width="2.2"/>')
            if spec.get("digits", True):
                o.append(f'<text x="{_n(x + i * gap)}" y="{_n(cy + r * .42)}" text-anchor="middle" font-family="{MONO}" font-weight="800" font-size="{_n(r * 1.05)}" fill="{INK if on else "#f2efe6"}">{b}</text>')
    if spec.get("label"):
        o.append(f'<text x="{_n((x0 + x1) / 2)}" y="{H - 12}" text-anchor="middle" font-family="Inter, sans-serif" font-weight="800" font-size="15" fill="{INK}" stroke="{PAPER}" stroke-width="4" paint-order="stroke">{E(spec["label"])}</text>')
    return "".join(o)


def _board(x0, x1, y, hh, fill="#2f4f46"):
    return (f'<rect x="{_n(x0 - 6)}" y="{_n(y - 6)}" width="{_n(x1 - x0 + 12)}" height="{_n(hh + 12)}" rx="4" fill="#8a5a2b" stroke="{INK}" stroke-width="2.4"/>'
            f'<rect x="{_n(x0)}" y="{_n(y)}" width="{_n(x1 - x0)}" height="{_n(hh)}" fill="{fill}" stroke="{INK}" stroke-width="1.6"/>')


def p_board(spec, x0, x1, uid, top=0):
    lines = spec["lines"]
    avail = x1 - x0
    fs = 15.0
    while fs > 10 and max(len(t) for t in lines) * fs * .55 + 24 > avail:
        fs -= .5
    lh = fs * 1.5
    hh = lh * len(lines) + 20
    y = max(14.0 + top, top + (H - top - hh) / 2 - 10)
    o = [_board(x0, x1, y, hh)]
    for i, t in enumerate(lines):
        o.append(f'<text x="{_n((x0 + x1) / 2)}" y="{_n(y + 14 + lh * (i + .75))}" text-anchor="middle" font-family="Inter, sans-serif" font-weight="600" font-size="{_n(fs)}" fill="#f4f1ea">{E(t)}</text>')
    return "".join(o)


def p_cards(spec, x0, x1, uid, top=0):
    """Бір не бірнеше карточка: {'items': [(мәтін, белгі, тон)], ...}; тон: good/bad/none."""
    items = spec["items"]
    avail = x1 - x0
    n = len(items)
    gap = 10
    vert = spec.get("vertical", n > 1 and avail < 260)
    if vert:
        cw, ch = min(avail - 8, 290.0), min(56.0, (180 - gap * (n - 1)) / n)
        x0 = (x0 + x1) / 2 - cw / 2 - 4
    else:
        cw, ch = (avail - gap * (n - 1)) / n, 62.0
    o = []
    for i, it in enumerate(items):
        text, tag, tone = (list(it) + [None, None])[:3]
        x = x0 + 4 + (0 if vert else i * (cw + gap))
        y = (H - (ch * n + gap * (n - 1))) / 2 - 8 + (i * (ch + gap) if vert else 0) if vert else (H - ch) / 2 - 12
        fs = 14.0
        while fs > 9.5 and len(text) * fs * .55 + 18 > cw:
            fs -= .5
        lines = [text]
        if len(text) * fs * .55 + 18 > cw:   # екі жолға бөлу
            mid = len(text) // 2
            k = text.rfind(" ", 0, mid + 6)
            k = k if k > 0 else text.find(" ", mid)
            lines = [text[:k], text[k + 1:]] if k > 0 else [text]
            fs = 14.0
            while fs > 9.5 and max(len(t) for t in lines) * fs * .55 + 18 > cw:
                fs -= .5
        tilt = (-1.5, 1.2, -.8)[i % 3]
        o.append(f'<g transform="rotate({tilt} {_n(x + cw / 2)} {_n(y + ch / 2)})"><rect x="{_n(x + 3)}" y="{_n(y + 4)}" width="{_n(cw)}" height="{_n(ch)}" rx="5" fill="{INK}" opacity=".3"/>'
                 f'<rect x="{_n(x)}" y="{_n(y)}" width="{_n(cw)}" height="{_n(ch)}" rx="5" fill="#fffdf7" stroke="{INK}" stroke-width="2.2"/>')
        ty = y + ch / 2 - (len(lines) - 1) * fs * .62 + fs * .36 - (5 if tag else 0)
        for t in lines:
            o.append(f'<text x="{_n(x + cw / 2)}" y="{_n(ty)}" text-anchor="middle" font-family="Inter, sans-serif" font-weight="700" font-size="{_n(fs)}" fill="{INK}">{E(t)}</text>')
            ty += fs * 1.24
        if tag:
            col = {"good": "#1f7a4d", "bad": "#b3262e"}.get(tone, "#5a4a35")
            o.append(f'<text x="{_n(x + cw / 2)}" y="{_n(y + ch - 7)}" text-anchor="middle" font-family="Inter, sans-serif" font-weight="800" font-size="11.5" fill="{col}">{E(tag)}</text>')
        o.append("</g>")
    return "".join(o)


def p_flow(spec, x0, x1, uid, top=0):
    """Тізбек: блоктар және стрелкалар (конвейер, компиляция кезеңдері). Сыймаса - екі қатар."""
    names = spec["nodes"]
    n = len(names)
    avail = x1 - x0
    gap = 16.0
    longest = max(len(t) for t in names)
    one_bw = (avail - gap * (n - 1)) / n
    if longest * 10 * .56 + 10 <= one_bw or n < 4:
        return _flow_row(names, x0, x1, (H - 44) / 2 - 10 + top / 2, spec, first=True, last=True) + (
            f'<text x="{_n((x0 + x1) / 2)}" y="{_n((H - 44) / 2 + 62 + top / 2)}" text-anchor="middle" font-family="Inter, sans-serif" font-weight="600" font-size="13" fill="#5a4a35">{E(spec["sub"])}</text>' if spec.get("sub") else "")
    k = (n + 1) // 2
    y1 = top + 26.0
    y2 = y1 + 44 + 34
    o = _flow_row(names[:k], x0, x1, y1, spec, first=True, last=False) + _flow_row(names[k:], x0, x1, y2, spec, first=False, last=True, cols=k)
    bw = (avail - gap * (k - 1)) / k
    xe = x0 + (k - 1) * (bw + gap) + bw / 2
    o += (f'<path d="M{_n(xe)} {_n(y1 + 46)} C{_n(xe)} {_n(y1 + 64)} {_n(x0 + bw / 2)} {_n(y2 - 22)} {_n(x0 + bw / 2)} {_n(y2 - 4)}" fill="none" stroke="{INK}" stroke-width="2.6" stroke-dasharray="5 4"/>'
          f'<path d="M{_n(x0 + bw / 2 - 5)} {_n(y2 - 10)} l5 6 l5 -6" fill="none" stroke="{INK}" stroke-width="2.6"/>')
    return o


def _flow_row(names, x0, x1, y, spec, first, last, cols=None):
    n = len(names)
    cols = cols or n
    avail = x1 - x0
    gap = 16.0
    bw = (avail - gap * (cols - 1)) / cols
    fs = 13.0
    while fs > 8.5 and max(len(t) for t in names) * fs * .56 + 10 > bw:
        fs -= .5
    bh = 44
    o = []
    for i, t in enumerate(names):
        x = x0 + i * (bw + gap)
        end = spec.get("ends") and ((first and i == 0) or (last and i == n - 1))
        o.append(f'<rect x="{_n(x)}" y="{_n(y)}" width="{_n(bw)}" height="{bh}" rx="{"20" if end else "6"}" fill="{"#ffe27a" if end else "#fffdf7"}" stroke="{INK}" stroke-width="2.4"/>'
                 f'<text x="{_n(x + bw / 2)}" y="{_n(y + bh / 2 + fs * .36)}" text-anchor="middle" font-family="Inter, sans-serif" font-weight="700" font-size="{_n(fs)}" fill="{INK}">{E(t)}</text>')
        if i < n - 1:
            ax = x + bw + 2
            o.append(f'<path d="M{_n(ax)} {_n(y + bh / 2)} h{_n(gap - 6)}" stroke="{INK}" stroke-width="2.6"/><path d="M{_n(ax + gap - 10)} {_n(y + bh / 2 - 5)} l5 5 l-5 5" fill="none" stroke="{INK}" stroke-width="2.6"/>')
    return "".join(o)



def p_set(spec, x0, x1, uid, top=0):
    """Жиын: «қап» ішіндегі элементтер (рет жоқ)."""
    items = spec["items"]
    cx, cy = (x0 + x1) / 2, 104
    rx, ry = min(86.0, (x1 - x0) / 2 - 6), 62
    o = [f'<ellipse cx="{_n(cx + 3)}" cy="{_n(cy + 4)}" rx="{_n(rx)}" ry="{ry}" fill="{INK}" opacity=".25"/>'
         f'<ellipse cx="{_n(cx)}" cy="{_n(cy)}" rx="{_n(rx)}" ry="{ry}" fill="#fff6dc" stroke="{INK}" stroke-width="2.6"/>']
    spots = [(-.5, -.35), (.35, -.45), (.05, .05), (-.45, .35), (.5, .3), (.0, -.75), (-.1, .65)]
    for i, t in enumerate(items):
        dx, dy = spots[i % len(spots)]
        o.append(f'<text x="{_n(cx + dx * rx)}" y="{_n(cy + dy * ry + 6)}" text-anchor="middle" font-family="{MONO}" font-weight="800" font-size="18" fill="{INK}">{E(t)}</text>')
    if spec.get("label"):
        o.append(f'<text x="{_n(cx - rx + 4)}" y="{_n(cy - ry + 6)}" font-family="Unbounded, Inter, sans-serif" font-weight="800" font-size="20" fill="#b3262e" stroke="{PAPER}" stroke-width="4" paint-order="stroke">{E(spec["label"])}</text>')
    return "".join(o)


def p_stamp(spec, x0, x1, uid, top=0):
    good = spec.get("tone") == "good"
    col = "#1f7a4d" if good else "#b3262e"
    cx, cy = (x0 + x1) / 2, 100
    t = spec["text"]
    w = len(t) * 15 + 34
    return (f'<g transform="rotate({spec.get("rot", -10)} {_n(cx)} {cy})" opacity=".92"><rect x="{_n(cx - w / 2)}" y="{cy - 26}" width="{_n(w)}" height="52" rx="6" fill="none" stroke="{col}" stroke-width="5"/>'
            f'<rect x="{_n(cx - w / 2 + 6)}" y="{cy - 20}" width="{_n(w - 12)}" height="40" rx="3" fill="none" stroke="{col}" stroke-width="2"/>'
            f'<text x="{_n(cx)}" y="{cy + 10}" text-anchor="middle" font-family="Unbounded, Inter, sans-serif" font-weight="800" font-size="25" fill="{col}" letter-spacing="2">{E(t)}</text></g>')


PROPS = {"code": p_code, "term": lambda s, a, b, u, top=0: p_code(s, a, b, u, term=True, top=top), "cells": p_cells, "bits": p_bits, "board": p_board,
         "cards": p_cards, "flow": p_flow, "set": p_set, "stamp": p_stamp}


def prop_alt(kind, spec):
    if kind in ("code", "term"):
        lines = spec["lines"] if isinstance(spec, dict) else spec
        out = spec.get("out", []) if isinstance(spec, dict) else []
        return ("код: " + " ⏎ ".join(lines)) + (("; шығысы: " + " ⏎ ".join(out)) if out else "")
    if kind == "cells":
        return "ұяшықтар: " + ", ".join(map(str, spec["vals"])) + (("; жоғарыда: " + ", ".join(map(str, spec["top"]))) if spec.get("top") else "")
    if kind == "bits":
        return "шамдар (биттер): " + " / ".join("".join(map(str, r)) for r in spec["rows"]) + (f'; {spec["label"]}' if spec.get("label") else "")
    if kind == "board":
        return "тақтада: " + " ⏎ ".join(spec["lines"])
    if kind == "cards":
        return "карточкалар: " + "; ".join(" - ".join(x for x in it[:2] if x) for it in spec["items"])
    if kind == "flow":
        return "тізбек: " + " → ".join(spec["nodes"])
    if kind == "set":
        return f'жиын {spec.get("label", "")}: ' + ", ".join(spec["items"])
    if kind == "stamp":
        return f'мөр: {spec["text"]}'
    return kind


# ======================================================================== кадр
def _layout(n_cast, has_prop, w, prop_side=None):
    """Кейіпкерлердің x-і, масштабы және заттың аймағы."""
    if n_cast == 0:
        return [], 1, (16, w - 16)
    if n_cast == 3:   # үш кейіпкер - тек затсыз кадрда (validate тексереді)
        return ([w * .2, w * .5, w * .8], .9 if w > 400 else .7, None)
    if w > 400:   # кең кадр
        if n_cast == 1:
            return ([110], .95, (230, w - 24)) if has_prop else ([w / 2], .95, None)
        return ([108, w - 108], .92, (212, w - 212)) if has_prop else ([w * .3, w * .7], .95, None)
    if n_cast == 1:
        if has_prop:
            return ([300] if prop_side == "l" else [82], .86, (14, 212) if prop_side == "l" else (162, 388))
        return [w / 2], .95, None
    return ([68, w - 68], .8, (130, w - 130)) if has_prop else ([108, w - 104], .92, None)


def _speak_side(cast, who):
    for c in cast:
        if c[0] == who:
            return c[2]
    return "c"


TEXTY = {"code", "term", "board", "flow", "cards", "cells", "bits"}


def _cast_art(pn, cast, xs, s, w, prop):
    art, alt, heads = [], [], {}
    for k, c in enumerate(cast):
        who, mood, side = c[0], c[1], c[2]
        gesture = c[3] if len(c) > 3 else None
        x = xs[k] if len(cast) > 1 or prop or side == "c" else (w * .3 if side == "l" else w * .7)
        face = 1 if (side == "l" or (side == "c" and k == 0)) else -1
        if c[4:5] and c[4] in (1, -1):
            face = c[4]
        art.append(actor(who, mood, x, s, face, gesture))
        heads[who] = (head_xy(who, x, s, face), face)
        alt.append(f"{WHO[who]} ({MOOD_KK[mood]})")
    for who, kind in (pn.get("fx") or {}).items():
        (hx, hy, hr), face = heads[who]
        art.append(fx(kind, hx, hy, hr, face))
    return art, alt


def _sfx_for(pn, cx, prop):
    t = pn["sfx"]
    return sfx(t, cx, 42, rot=-6, size=(30 if len(t) < 8 else 24) if prop else (34 if len(t) < 8 else 26))


def _talk(pn, cast):
    talk = []
    if pn.get("slate"):   # кино-комикстің сахна тақтасы: «САХНА 1 · ЕСКІ КІТАПХАНА · ТҮН» (INSIDE TECH кино-комикстері)
        talk.append(f'<p class="cx-slate">{E(pn["slate"])}</p>')
    if pn.get("cap"):
        talk.append(f'<p class="cx-cap">{E(pn["cap"])}</p>')
    for who, text in pn.get("say", []):
        kind = ""
        if who.endswith("~"):
            who, kind = who[:-1], " cx-th"
        elif who.endswith("!"):
            who, kind = who[:-1], " cx-sh"
        elif who.endswith("#"):
            who, kind = who[:-1], " cx-nt"
        side = _speak_side(cast, who)
        name = GEN[who] + " жазбасы" if kind == " cx-nt" else WHO[who] + {"": "", " cx-th": " (ойлайды)", " cx-sh": " (айқайлайды)"}[kind]
        talk.append(f'<p class="cx-b cx-{side}{kind}"><span class="cx-who">{name}: </span>{E(text)}</p>')
    return "".join(talk)


def panel(pn, uid, i):
    """Кадр: сөз бұлттары (HTML) + сурет (SVG). Кең кадр мен мәтінді заты бар кадрдың тар экранға арналған тік нұсқасы да бар
    (жоғарыда зат толық енімен, төменде кейіпкерлер): CSS экран еніне қарай біреуін ғана көрсетеді."""
    w = 800 if pn.get("wide") else 400
    cast = pn.get("cast", [])
    prop = pn.get("prop")
    bgk = pn.get("bg", "yurt")
    top = 48 if pn.get("sfx") else 0
    xs, s, pbox = _layout(len(cast), bool(prop), w, pn.get("prop_side"))
    if pn.get("swap"):
        xs = list(reversed(xs))
    art, alt = [bg(bgk, w, f"{uid}{i}", busy=bool(prop))], []
    if prop:
        kind, spec = prop
        art.append(PROPS[kind](spec, pbox[0], pbox[1], f"{uid}{i}", top=top))
        alt.append(prop_alt(kind, spec))
    ca, calt = _cast_art(pn, cast, xs, s, w, prop)
    art += ca
    alt += calt
    if pn.get("sfx"):
        art.append(_sfx_for(pn, (pbox[0] + pbox[1]) / 2 if prop else w / 2, prop))
    label = E(f"{i + 1}-кадр. " + "; ".join(alt))
    narrow = ""
    if w > 400 or (prop and prop[0] in TEXTY):
        xs2, s2, _ = _layout(len(cast), False, 400)
        ca2, _ = _cast_art(pn, cast, xs2, s2, 400, None)
        if prop:
            up = bg(bgk, 400, f"{uid}{i}u", busy=True) + PROPS[prop[0]](prop[1], 14, 386, f"{uid}{i}u", top=top) + (_sfx_for(pn, 200, prop) if pn.get("sfx") else "")
            down = bg(bgk, 400, f"{uid}{i}d", busy=True) + "".join(ca2)
            body = (f'<svg width="400" height="{H}" viewBox="0 0 400 {H}">{up}</svg>'
                    f'<svg y="{H}" width="400" height="{H}" viewBox="0 0 400 {H}">{down}</svg><path d="M0 {H} H400" stroke="{INK}" stroke-width="3"/>')
            hh = 2 * H
        else:
            body = bg(bgk, 400, f"{uid}{i}d") + "".join(ca2) + (_sfx_for(pn, 200, None) if pn.get("sfx") else "")
            hh = H
        narrow = f'<svg class="cx-art cx-art-n" viewBox="0 0 400 {hh}" role="img" aria-label="{label}">{body}</svg>'
    return (f'<figure class="cx-p{" cx-wide" if w > 400 else ""}">'
            f'<div class="cx-talk">{_talk(pn, cast)}</div>'
            f'<svg class="cx-art{" cx-art-w" if narrow else ""}" viewBox="0 0 {w} {H}" role="img" aria-label="{label}">{"".join(art)}</svg>{narrow}</figure>')


def strip(comic, uid, head_html="", foot_html="", cls=""):
    panels = "".join(panel(p, uid, i) for i, p in enumerate(comic["panels"]))
    return (f'<div class="cx{(" " + cls) if cls else ""}">{head_html}<div class="cx-grid">{panels}</div>{foot_html}</div>')


def uid_of(s):
    return "c" + hashlib.md5(s.encode("utf-8")).hexdigest()[:6]


# ======================================================================== «Тұзақ»: әр сабақтың жиі қатесінен 4 кадр
POOL_SAY1 = ["Мен былай істедім:", "Менің тәсілім осы:", "Осылай шештім:"]
POOL_STOP = [("Тоқта! Мұнда тұзақ бар.", "ТОҚТА!"), ("Абайла! Бұл - жиі қате.", "АБАЙЛА!"), ("Тұра тұр! Осы жерде көп адам сүрінеді.", "ОЙ-ОЙ!")]
POOL_WHY = ["Неге қате?", "Не болды сонда?", "Неге болмайды?"]
POOL_END = ["Түсіндім! Енді байқаймын.", "Есімде болады!", "Енді сүрінбеймін."]
POOL_BG = ["desk", "yurt", "class"]


def _pick(pool, key, salt):
    return pool[int(hashlib.md5((key + salt).encode("utf-8")).hexdigest(), 16) % len(pool)]


def trap(L):
    """Сабақтың тексерілген деректерінен (mistakes[0]) - қате -> тоқта -> себеп -> ереже."""
    m = L["mistakes"][0]
    key = L["id"]
    stop, bang = _pick(POOL_STOP, key, "s")
    bgk = _pick(POOL_BG, key, "b")
    fix = m["fix"].strip()
    w = _pick(["N", "M"], key, "who")      # қатені кім жасайды
    return {"title": "Тұзақ: " + L["title"], "panels": [
        {"bg": bgk, "cast": [(w, "happy", "l", "point"), ("B", "calm", "r")], "cap": "Жиі кездесетін тұзақ",
         "say": [(w, _pick(POOL_SAY1, key, "1")), (w + "#", m["mistake"].strip())]},
        {"bg": "flash", "cast": [(w, "wow", "l"), ("B", "wow", "r")], "say": [("B!", stop)], "sfx": bang},
        {"bg": bgk, "cast": [(w, "think", "l", "chin"), ("B", "think", "r")], "say": [(w, _pick(POOL_WHY, key, "w")), ("B", m["why"].strip())],
         "fx": {w: "q"}},
        {"bg": bgk, "cast": [(w, "happy", "l"), ("B", "happy", "r")], "say": [("B", "Ереже: " + fix), (w, _pick(POOL_END, key, "e"))],
         "fx": {w: "idea"}},
    ]}


def trap_html(L):
    c = trap(L)
    head = '<p class="cx-k">Комикс · Тұзақ</p>'
    foot = '<p class="cx-note">Кадрлардағы қате, себеп және ереже - осы сабақтың «Жиі қателер» деректерінен.</p>'
    return strip(c, uid_of(L["id"] + "t"), head, foot, "cx-trap")


# ======================================================================== тексеру (build кезінде)
def validate(comic, where):
    errs = []
    for i, pn in enumerate(comic["panels"]):
        cast = pn.get("cast", [])
        names = {c[0] for c in cast}
        for c in cast:
            if c[0] not in WHO:
                errs.append(f"{where} {i + 1}-кадр: белгісіз кейіпкер {c[0]}")
            if c[1] not in MOODS:
                errs.append(f"{where} {i + 1}-кадр: белгісіз көңіл-күй {c[1]}")
        if len(cast) > 3 or (len(cast) == 3 and pn.get("prop")):
            errs.append(f"{where} {i + 1}-кадр: үш кейіпкер тек затсыз кадрда (ең көбі 3)")
        if pn.get("bg", "yurt") not in BGS:
            errs.append(f"{where} {i + 1}-кадр: белгісіз сахна {pn.get('bg')}")
        for who, text in pn.get("say", []):
            if who.rstrip("~!#") not in names:
                errs.append(f"{where} {i + 1}-кадр: {who} сөйлейді, бірақ кадрда жоқ")
            if len(text) > 230:
                errs.append(f"{where} {i + 1}-кадр: сөз тым ұзын ({len(text)})")
        if pn.get("prop"):
            kind, spec = pn["prop"]
            if kind not in PROPS:
                errs.append(f"{where} {i + 1}-кадр: белгісіз зат {kind}")
            if kind in ("code", "term"):
                lines = spec["lines"] if isinstance(spec, dict) else spec
                out = spec.get("out", []) if isinstance(spec, dict) else []
                w = 800 if pn.get("wide") else 400
                _, pb = _layout(len(cast), True, w, pn.get("prop_side"))[1:]
                if (len(lines) + len(out)) > 11:
                    errs.append(f"{where} {i + 1}-кадр: код тым ұзын ({len(lines) + len(out)} жол)")
                fs, _ = _fit(lines + out, pb[1] - pb[0])
                if fs < 9.5:
                    errs.append(f"{where} {i + 1}-кадр: код кадрға сыймайды (қаріп {fs})")
        if pn.get("fx"):
            for who in pn["fx"]:
                if who not in names:
                    errs.append(f"{where} {i + 1}-кадр: әсер {who}-ге, бірақ ол кадрда жоқ")
    return errs


def layout_errors(comic, where):
    """Екі бағанды тор: екі кең кадрдың арасындағы жай кадрлар саны жұп болсын (әйтпесе тор бос қалады)."""
    errs, run = [], 0
    for i, pn in enumerate(comic["panels"] + [{"wide": True}]):
        if pn.get("wide"):
            if run % 2:
                errs.append(f"{where}: {i}-кадрға дейін жұпсыз жай кадр бар (тордың жартысы бос қалады)")
            run = 0
        else:
            run += 1
    return errs


def code_specs(comic):
    """Тексерілетін код кадрлары: (кадр нөмірі, тіл, бастапқы код, күтілетін шығыс жолдары)."""
    for i, pn in enumerate(comic["panels"]):
        pr = pn.get("prop")
        if pr and pr[0] == "code" and isinstance(pr[1], dict) and pr[1].get("check"):
            sp = pr[1]
            yield i, sp["check"], sp.get("src") or "\n".join(sp["lines"]) + "\n", sp["out"]


def out_matches(actual, want):
    """«…»-мен аяқталған күтілетін жол - басы бойынша; қалғаны - толық (жол соңындағы бос орынсыз)."""
    if len(actual) != len(want):
        return False
    for a, w in zip(actual, want):
        if w.endswith("…"):
            if not a.startswith(w[:-1]):
                return False
        elif a.rstrip() != w.rstrip():
            return False
    return True


def cover_svg(comic, uid):
    """Хаб беті үшін: бірінші кадрдың суреті ғана (сөз бұлттарынсыз)."""
    html_ = panel(comic["panels"][0], uid, 0)
    i = html_.index("<svg")
    j = html_.index("</svg>", i)
    while html_.count("<svg", i, j) > html_.count("</svg>", i, j) + 1:   # ішкі svg-лер болса - сыртқысының соңын табу
        j = html_.index("</svg>", j + 6)
    return html_[i:j + 6].replace('role="img"', 'aria-hidden="true"', 1).replace(' cx-art-w', '')


# «Тірі заттар» кейіпкерлері (ноутбук, компьютер, сервер, процессор, пакет, робот, телефон, вирус): gadgets.py бұл модульдің
# көмекші функцияларын (бет-әлпет) қолданады, сондықтан ол модульдің соңында жүктеледі
import gadgets as GD  # noqa: E402

WHO.update(GD.NAME)
GEN.update(GD.GEN)
