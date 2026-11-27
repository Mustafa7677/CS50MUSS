# © 2026 AO17 командасы. All Rights Reserved.
# «Тірі заттар»: AO17 комиксінің сегіз техника-кейіпкері (INSIDE TECH-тің «Тірі заттар» әңгімелері үшін, tools/academy/inside_comics.py):
# ноутбук, компьютер, сервер, процессор, пакет, робот, телефон, вирус. Әрқайсысының беті бар және көңіл-күйі (comic.MOODS) көрінеді;
# қолы мен аяғы бар (вирус ұшып жүреді). Сызба стилі - comic.py кейіпкерлерімен бірдей: қара контур, тегіс түстер.
# Координат басы - аяғының ортасы (жер), y жоғары қарай теріс; биіктігі Нұрай мен Мустафаға жақын (≈170-190).
# Сурет айнадағыдай аударылса да (comic.actor, face=-1) дұрыс көрінеді: мәтін жоқ, бет симметриялы.
import math

import comic as CX

NAME = {"laptop": "Ноутбук", "computer": "Компьютер", "server": "Сервер", "cpu": "Процессор", "packet": "Пакет", "robot": "Робот",
        "phone": "Телефон", "virus": "Вирус"}
GEN = {"laptop": "Ноутбуктың", "computer": "Компьютердің", "server": "Сервердің", "cpu": "Процессордың", "packet": "Пакеттің",
       "robot": "Роботтың", "phone": "Телефонның", "virus": "Вирустың"}
# бет ортасы мен радиусы (comic.fx әсерлері үшін: идея шамы, сұрақ белгісі, жарқыл)
HEAD = {"laptop": (0, -124, 44), "computer": (0, -132, 44), "server": (0, -141, 34), "cpu": (0, -88, 40), "packet": (0, -86, 42),
        "robot": (0, -134, 44), "phone": (0, -122, 32), "virus": (0, -104, 46)}
INK = CX.INK
_n = CX._n


def _face(mood, cx, cy, sc=1.0, gap=17):
    """Көз, қас, ауыз (comic.py-дағы Нұрай мен Мустафаның бет-әлпетімен бірдей сызба)."""
    xs = (cx - gap * sc, cx + gap * sc)
    return CX._eyes(mood, xs, cy, sc=sc) + CX._brows(mood, xs, cy, sc=sc) + CX._mouth(mood, cx, cy + 24 * sc, sc=sc)


def _limbs(arm_y, arm_x, leg_x, leg_top, hand="#d9dde6", foot="#2b2f3a", arm_drop=34, arms=True, legs=True):
    """Қол мен аяқ: жіңішке контур сызық, дөңгелек алақан, сопақ табан."""
    o = []
    if legs:
        for sx in (-1, 1):
            x = sx * leg_x
            d = f"M{_n(x)} {_n(leg_top)} L{_n(x + sx * 4)} -8"
            o.append(f'<path d="{d}" stroke="{INK}" stroke-width="9" stroke-linecap="round" fill="none"/>'
                     f'<path d="{d}" stroke="#5b6170" stroke-width="5" stroke-linecap="round" fill="none"/>'
                     f'<ellipse cx="{_n(x + sx * 9)}" cy="-5" rx="14" ry="6.5" fill="{foot}" stroke="{INK}" stroke-width="2.4"/>')
    if arms:
        for sx in (-1, 1):
            x0 = sx * arm_x
            x1, y1 = x0 + sx * 18, arm_y + arm_drop * .45
            x2, y2 = x0 + sx * 26, arm_y + arm_drop
            d = f"M{_n(x0)} {_n(arm_y)} Q{_n(x1)} {_n(y1 - 6)} {_n(x2)} {_n(y2)}"
            o.append(f'<path d="{d}" stroke="{INK}" stroke-width="9" stroke-linecap="round" fill="none"/>'
                     f'<path d="{d}" stroke="#5b6170" stroke-width="5" stroke-linecap="round" fill="none"/>'
                     f'<circle cx="{_n(x2)}" cy="{_n(y2)}" r="8" fill="{hand}" stroke="{INK}" stroke-width="2.4"/>')
    return "".join(o)


def laptop(mood):
    p = [_limbs(-72, 72, 30, -60, arm_drop=36)]
    p.append(f'<rect x="-66" y="-172" width="132" height="98" rx="8" fill="#2b2f3a" stroke="{INK}" stroke-width="3"/>')
    p.append(f'<rect x="-56" y="-163" width="112" height="80" rx="4" fill="#cfeaff" stroke="{INK}" stroke-width="1.6"/>')
    p.append('<path d="M-50 -158 L-30 -158 M-50 -150 L-40 -150" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8"/>')
    p.append(f'<path d="M-74 -74 L74 -74 L84 -58 L-84 -58 Z" fill="#9aa3b5" stroke="{INK}" stroke-width="3" stroke-linejoin="round"/>')
    p.append('<path d="M-22 -66 H22" stroke="#6b7385" stroke-width="3" stroke-linecap="round"/>')
    p.append(_face(mood, 0, -131, 1.25))
    return "".join(p)


def computer(mood):
    p = [_limbs(-128, 70, 0, 0, hand="#e9e4d6", arm_drop=40, legs=False)]
    p.append(f'<path d="M-14 -88 L14 -88 L18 -16 L-18 -16 Z" fill="#c9c2b0" stroke="{INK}" stroke-width="2.6" stroke-linejoin="round"/>')
    p.append(f'<rect x="-52" y="-18" width="104" height="16" rx="6" fill="#c9c2b0" stroke="{INK}" stroke-width="2.6"/>')
    p.append(f'<rect x="-72" y="-182" width="144" height="98" rx="8" fill="#e9e4d6" stroke="{INK}" stroke-width="3"/>')
    p.append(f'<rect x="-61" y="-172" width="122" height="76" rx="4" fill="#c9ecd0" stroke="{INK}" stroke-width="1.6"/>')
    p.append(f'<circle cx="58" cy="-90" r="2.6" fill="#2ecc71" stroke="{INK}" stroke-width="1"/>')
    p.append('<g stroke="#a8d8b2" stroke-width="1.4" opacity=".7">' + "".join(f'<path d="M-58 {y} H58"/>' for y in range(-166, -98, 8)) + "</g>")
    p.append(_face(mood, 0, -140, 1.25))
    return "".join(p)


def server(mood):
    p = [_limbs(-104, 48, 0, 0, hand="#9aa3b5", arm_drop=34, legs=False)]
    p.append(f'<rect x="-40" y="-10" width="22" height="10" rx="2" fill="#2b2f3a" stroke="{INK}" stroke-width="2"/>'
             f'<rect x="18" y="-10" width="22" height="10" rx="2" fill="#2b2f3a" stroke="{INK}" stroke-width="2"/>')
    p.append(f'<rect x="-50" y="-190" width="100" height="182" rx="8" fill="#3a4152" stroke="{INK}" stroke-width="3"/>')
    p.append(f'<rect x="-40" y="-178" width="80" height="68" rx="5" fill="#ffe9a8" stroke="{INK}" stroke-width="1.8"/>')
    for k, y in enumerate((-98, -76, -54, -32)):
        led = (CX.GOLD if k == 1 else "#2ecc71")
        p.append(f'<rect x="-40" y="{y}" width="80" height="16" rx="3" fill="#2a3040" stroke="{INK}" stroke-width="1.6"/>'
                 f'<circle cx="-29" cy="{y + 8}" r="3.4" fill="{led}" stroke="{INK}" stroke-width="1"/>'
                 f'<path d="M-18 {y + 8} H30" stroke="#5d6680" stroke-width="2.4" stroke-dasharray="6 3"/>')
    p.append(_face(mood, 0, -150, 1.0, gap=16))
    return "".join(p)


def cpu(mood):
    p = [_limbs(-88, 62, 26, -26, hand="#d6d9e0", arm_drop=34)]
    pins = []
    for k in range(6):
        t = -46 + k * 18.4
        pins.append(f"M{_n(t)} -150 v-12 M{_n(t)} -26 v10 M-62 {_n(t - 42)} h-12 M62 {_n(t - 42)} h12")
    p.append(f'<path d="{" ".join(pins)}" stroke="{INK}" stroke-width="7" stroke-linecap="round"/>'
             f'<path d="{" ".join(pins)}" stroke="#c9a24a" stroke-width="4" stroke-linecap="round"/>')
    p.append(f'<rect x="-62" y="-150" width="124" height="124" rx="8" fill="#4b5262" stroke="{INK}" stroke-width="3"/>')
    p.append(f'<rect x="-44" y="-132" width="88" height="88" rx="5" fill="#d6d9e0" stroke="{INK}" stroke-width="1.8"/>')
    p.append(f'<circle cx="-52" cy="-140" r="4" fill="{CX.GOLD}" stroke="{INK}" stroke-width="1.2"/>')
    p.append(_face(mood, 0, -96, 1.15))
    return "".join(p)


def packet(mood):
    p = [_limbs(-100, 66, 26, -46, hand="#fff5d6", arm_drop=32)]
    p.append(f'<rect x="-68" y="-150" width="136" height="104" rx="6" fill="#fff5d6" stroke="{INK}" stroke-width="3"/>')
    p.append(f'<path d="M-66 -146 L0 -104 L66 -146" fill="none" stroke="#c9a24a" stroke-width="3" stroke-linejoin="round"/>')
    p.append(f'<rect x="36" y="-142" width="24" height="16" fill="{CX.RED}" stroke="{INK}" stroke-width="1.6"/>'
             f'<path d="M40 -134 h16" stroke="#f7e1c8" stroke-width="2" stroke-dasharray="3 2"/>')
    p.append(_face(mood, 0, -90, 1.1))
    return "".join(p)


def robot(mood):
    p = [_limbs(-82, 42, 20, -34, hand="#a9c4ff", arm_drop=36)]
    p.append(f'<path d="M0 -176 V-196" stroke="{INK}" stroke-width="3.4"/><circle cx="0" cy="-200" r="7" fill="{CX.RED}" stroke="{INK}" stroke-width="2.2"/>')
    p.append(f'<rect x="-42" y="-96" width="84" height="64" rx="10" fill="#7f9ce0" stroke="{INK}" stroke-width="3"/>')
    p.append(f'<rect x="-22" y="-84" width="44" height="26" rx="4" fill="#dbe6ff" stroke="{INK}" stroke-width="1.6"/>'
             f'<circle cx="-10" cy="-71" r="4" fill="#2ecc71" stroke="{INK}" stroke-width="1"/><circle cx="4" cy="-71" r="4" fill="{CX.GOLD}" stroke="{INK}" stroke-width="1"/>')
    p.append(f'<rect x="-60" y="-112" width="10" height="26" rx="4" fill="#7f9ce0" stroke="{INK}" stroke-width="2"/>'
             f'<rect x="50" y="-112" width="10" height="26" rx="4" fill="#7f9ce0" stroke="{INK}" stroke-width="2"/>')
    p.append(f'<rect x="-52" y="-178" width="104" height="82" rx="16" fill="#a9c4ff" stroke="{INK}" stroke-width="3"/>')
    p.append(_face(mood, 0, -144, 1.25))
    return "".join(p)


def phone(mood):
    p = [_limbs(-118, 44, 18, -30, hand="#d8e2ff", arm_drop=36)]
    p.append(f'<rect x="-44" y="-186" width="88" height="158" rx="18" fill="#23252d" stroke="{INK}" stroke-width="3"/>')
    p.append(f'<rect x="-35" y="-170" width="70" height="128" rx="6" fill="#d8e2ff" stroke="{INK}" stroke-width="1.6"/>')
    p.append('<rect x="-10" y="-181" width="20" height="5" rx="2.5" fill="#555a66"/>')
    p.append(f'<circle cx="0" cy="-35" r="3" fill="#555a66"/>')
    p.append(_face(mood, 0, -130, 1.05, gap=15))
    return "".join(p)


def virus(mood):
    p = ['<ellipse cx="0" cy="-6" rx="44" ry="7" fill="#1b1510" opacity=".18"/>']
    cx, cy, r = 0, -104, 46
    for k in range(10):
        a = k * math.pi / 5 + math.pi / 10
        x1, y1 = cx + math.cos(a) * (r - 4), cy + math.sin(a) * (r - 4)
        x2, y2 = cx + math.cos(a) * (r + 20), cy + math.sin(a) * (r + 20)
        p.append(f'<path d="M{_n(x1)} {_n(y1)} L{_n(x2)} {_n(y2)}" stroke="{INK}" stroke-width="8" stroke-linecap="round"/>'
                 f'<path d="M{_n(x1)} {_n(y1)} L{_n(x2)} {_n(y2)}" stroke="#3f8f2f" stroke-width="4.4" stroke-linecap="round"/>'
                 f'<circle cx="{_n(cx + math.cos(a) * (r + 24))}" cy="{_n(cy + math.sin(a) * (r + 24))}" r="7" fill="#c64fd6" stroke="{INK}" stroke-width="2.2"/>')
    p.append(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="#7fd36b" stroke="{INK}" stroke-width="3"/>')
    p.append(f'<path d="M-26 {cy - 22} q8 -8 18 -6" stroke="#b5ec9f" stroke-width="5" stroke-linecap="round" fill="none"/>')
    p.append(_face(mood, 0, cy - 4, 1.2))
    return "".join(p)


DRAW = {"laptop": laptop, "computer": computer, "server": server, "cpu": cpu, "packet": packet, "robot": robot, "phone": phone, "virus": virus}
