#!/usr/bin/env python3
# © 2026 AO17 командасы. All Rights Reserved. Дербес авторлық бағдарлама (LICENSE-PROPRIETARY.md, COPYRIGHT.md).
"""«Команда» фотоларының бірыңғай «Алаш» өңдеуі (түпнұсқалар өзгермейді).

Фотосессияның суреттері әртүрлі жарықта түсірілген: бірі суығырақ, бірі қызғылт, жарықтығы да әртүрлі.
Бұл құрал бәрін бір кадрдан шыққандай етеді:
  1. жарықтық теңестіру - әр суреттің орташа жарықтығы бір деңгейге (гамма арқылы, кенет емес);
  2. ақ түс - фонның (жарқын аймақтардың) түсі бір жылы кілегей реңге келтіріледі;
  3. «Алаш» түс өңдеуі - көлеңке жылы сияға (#2a1c14), жарқын жер кілегей-алтынға (#f1e3c6) бұрылады, қанықтық 12%-ке басылады, жұмсақ S-қисық;
  4. жиектің жұмсақ қараюы (виньетка).
Пайдалану: python3 tools/team_photos.py <түпнұсқалар қалтасы>
Қалтада: gulzat.jpg, dastan.jpg, magzhan.jpg, merey.jpg, sagid.jpg (жеке, тік) және group.jpg, work.jpg, duo.jpg (жалпы).
Нәтиже: assets/img/team/ (жеке - 640x800, жалпы - ені 1600, group-hd - ені 2400).
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets/img/team"
INK, CREAM = np.array([42, 28, 20]) / 255, np.array([241, 227, 198]) / 255
TARGET_L, BG_TARGET = 0.46, np.array([233, 222, 205]) / 255


def lum(a):
    return a[..., 0] * .2126 + a[..., 1] * .7152 + a[..., 2] * .0722


def grade(im, vignette=.22, cy=.42):
    """Кино өңдеуі. cy - назар нүктесінің биіктігі (виньетка орталығы; портретте бет жоғарырақ)."""
    from PIL import ImageFilter
    a = np.asarray(im.convert("RGB"), dtype=np.float32) / 255
    # 1) ақ түс: ең жарқын 25% (фон, көйлек) - ортақ жылы кілегейге
    top = a[: max(8, a.shape[0] // 4)]   # тек жоғарғы ширек: қабырға/фон (ақ көйлек ақ түсті «алдамасын»)
    Lt = lum(top)
    hi = top[Lt >= np.quantile(Lt, .6)].mean(axis=0)
    gain = (BG_TARGET / hi) / (BG_TARGET / hi).mean()
    a = np.clip(a * gain, 0, 1)
    # 2) жарықтық: орташа жарықтық TARGET_L-ге (гамма)
    m = float(lum(a).mean())
    a = np.clip(a, 1e-4, 1) ** (np.log(TARGET_L) / np.log(max(1e-3, min(.99, m))))
    # 3) фильмдік қисық: көлеңкенің түбі сәл көтеріледі (қара «сия» болады, көмір емес), орта тондарға контраст, жарқын жер жұмсақ иіледі
    s_curve = .5 + .5 * np.tanh(2.1 * (a - .5)) / np.tanh(1.05)
    a = a * .45 + s_curve * .55
    a = .035 + a * (.985 - .035)
    # 4) айқындық (жергілікті контраст) және нақтылық - үлкен және кіші радиусты unsharp mask
    img = Image.fromarray((np.clip(a, 0, 1) * 255 + .5).astype(np.uint8))
    img = img.filter(ImageFilter.UnsharpMask(radius=max(12, im.width // 40), percent=22, threshold=2))
    img = img.filter(ImageFilter.UnsharpMask(radius=1.1, percent=55, threshold=2))
    a = np.asarray(img, dtype=np.float32) / 255
    # 5) қанықтықты басу және реңдік тонинг (көлеңке - сия, жарқын - кілегей-алтын)
    L = lum(a)[..., None]
    a = L + (a - L) * .86
    sh, hl = np.clip(1 - L * 2.2, 0, 1), np.clip(L * 2 - 1, 0, 1)
    a = a * (1 - .24 * sh) + INK * .24 * sh
    a = a * (1 - .12 * hl) + CREAM * .12 * hl
    # 6) алтын жарқыл (bloom): тек ең жарқын жерлер жұмсақ шашырайды
    L = lum(a)
    glow = np.clip((L - .72) / .28, 0, 1)[..., None] * a
    g = Image.fromarray((glow * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(max(6, im.width // 60)))
    g = np.asarray(g, dtype=np.float32) / 255 * np.array([1.0, .9, .7])
    a = 1 - (1 - a) * (1 - g * .35)
    # 7) виньетка: назар нүктесінен эллипс, жиегі сайттың қараңғы фонымен тұтасады
    h, w = a.shape[:2]
    y, x = np.ogrid[:h, :w]
    r = np.sqrt(((x - w / 2) / (w * .58)) ** 2 + ((y - h * cy) / (h * .62)) ** 2)
    v = np.clip((r - .55) / .75, 0, 1) ** 1.5
    a = a * (1 - vignette * v)[..., None] + INK * (vignette * .35 * v)[..., None]
    return Image.fromarray((np.clip(a, 0, 1) * 255 + .5).astype(np.uint8))


def portrait(src, dst):
    im = Image.open(src).convert("RGB")
    w, h = im.size
    im = im.crop((0, 0, w, min(h, int(w * 1.25)))).resize((640, 800), Image.LANCZOS)
    grade(im, .42, .3).save(dst, quality=86, optimize=True, progressive=True)


def wide(src, dst, width):
    im = Image.open(src).convert("RGB")
    w, h = im.size
    im = im.resize((width, round(h * width / w)), Image.LANCZOS)
    grade(im, .40, .42).save(dst, quality=82, optimize=True, progressive=True)


def main(srcdir):
    s = Path(srcdir)
    for n in ("gulzat", "dastan", "magzhan", "merey", "sagid"):
        portrait(s / f"{n}.jpg", OUT / f"{n}.jpg")
    for n in ("work", "duo", "group"):
        wide(s / f"{n}.jpg", OUT / f"{n}.jpg", 1600)
    wide(s / "group.jpg", OUT / "group-hd.jpg", 2400)
    print("team photos:", ", ".join(sorted(p.name for p in OUT.glob("*.jpg"))))


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else ROOT / "assets/img/team/src")
