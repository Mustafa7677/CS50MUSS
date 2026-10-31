#!/usr/bin/env python3
# © 2026 Sagid Mustafa. All Rights Reserved.
"""AO17 «Шақыру» фильмін бір файлға жинайды: film/src/film.html -> film/index.html.

Шығыс файл дербес: PT Serif қаріптері (OFL) мен архивтік суреттер (assets/img/film/, Википедия / Wikimedia Commons,
қоғамдық игілік; дерек көздері assets/data/film-media.json ішінде) base64 болып ішіне енеді, сондықтан фильмді интернетсіз де, жеке файл ретінде жіберіп те ашуға болады.
Генерацияланатын бөліктер (қолжазба жолдары, карта, код бағандары) кездейсоқ емес: тұқымы тұрақты, нәтиже әр жинауда бірдей.

    python3 tools/make_film.py
"""
import base64
import math
import random
import re
from pathlib import Path

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


def code_cols(rng):
    """Бағдарламалау әлемінің артқы жоспары: баяу ағатын код бағандары (тек декор, aria-hidden)."""
    lines = ["def oqu(sabaq):", "  for bet in sabaq:", "    oqu(bet)", "SELECT esim FROM alash;", "int main() {", "  return 0;", "}",
             "const jol = 'bilim';", "print('Сәлем, әлем!')", "while (true) oqy();", "class Alash {}", "x = [1917, 2026]"]
    out = []
    for k in range(7):
        txt = "\n".join(rng.choice(lines) for _ in range(18))
        out.append(f'<i style="left:{4 + k * 14}%;animation:codeflow {18 + k * 3}s linear {-k * 2}s infinite">{txt}</i>')
    return "".join(out)


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
        "<!--{{CODE}}-->": code_cols(rng),
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
        "{{IMG_MAP_SEMIPALATINSK}}": img("map-semipalatinsk"),
    }
    for k, v in rep.items():
        assert k in s, f"үлгіде {k} жоқ"
        s = s.replace(k, v)
    assert "{{" not in s, "толтырылмаған орын қалды"
    OUT.write_text(s, encoding="utf8")
    print(f"film/index.html: {len(s.encode()) / 1024:.0f} КБ")


if __name__ == "__main__":
    main()
