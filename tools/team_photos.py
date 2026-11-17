#!/usr/bin/env python3
# © 2026 AO17 командасы. All Rights Reserved. Дербес авторлық бағдарлама (LICENSE-PROPRIETARY.md, COPYRIGHT.md).
"""«Команда» фотоларының бірыңғай «Алаш» өңдеуі (түпнұсқалар өзгермейді).

Фотосессияның суреттері әртүрлі жарықта түсірілген: бірі суығырақ, бірі қызғылт, жарықтығы да әртүрлі.
Бұл құрал бәрін бір кадрдан шыққандай етеді:
  1. жарықтық теңестіру - әр суреттің орташа жарықтығы бір деңгейге (гамма арқылы, кенет емес);
  2. ақ түс - фонның (жарқын аймақтардың) түсі бір жылы кілегей реңге келтіріледі;
  3. «Алаш» түс өңдеуі - көлеңке жылы сияға (#2a1c14), жарқын жер кілегей-алтынға (#f1e3c6) бұрылады, қанықтық 12%-ке басылады, жұмсақ S-қисық;
  4. жиектің жұмсақ қараюы (виньетка).
Пайдалану: python3 tools/team_photos.py <түпнұсқалар қалтасы>   (автоматты өңдеу)
           python3 tools/team_photos.py --edited <өңделгендер> <түпнұсқалар>   (команданың өз өңдеуі)
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


MAUVE = np.array([.385, .335, .345])   # фонның мақсатты реңі: сұрғылт-күлгін (мысал фотодан өлшенген)


def grade_moody(im, cy=.3, vignette=.5):
    """Low-key кино портреті: терең қаралар, түссізденген сұрғылт-күлгін фон, тірі жылы тері, бетке түскен жарық.
    Тері маскасы (реңі қызғылт-сарғыш, қанық, жарық) бойынша: фон түссізденеді, тері табиғи қалады және сәл тегістеледі."""
    from PIL import ImageFilter
    a = np.asarray(im.convert("RGB"), dtype=np.float32) / 255
    h, w = a.shape[:2]
    # 1) ақ түс пен деңгей: жоғарғы ширектегі қабырға - MAUVE реңіне
    top = a[: max(8, h // 4)]
    Lt = lum(top)
    bg = top[Lt >= np.quantile(Lt, .5)].mean(axis=0)
    a = np.clip(a * (MAUVE / bg), 0, 1)
    # 2) тері маскасы: R > G > B, жеткілікті қанық әрі жарық; жұмсақ жиекпен
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    sat = (a.max(axis=2) - a.min(axis=2)) / np.maximum(a.max(axis=2), 1e-3)
    skin = ((r > g) & (g > b) & (r - b > .07) & (sat > .14) & (sat < .62) & (r > .22)).astype(np.float32)
    skin = np.asarray(Image.fromarray((skin * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(max(3, w // 160))), dtype=np.float32)[..., None] / 255
    # 3) түс: фон мен киім түссізденеді (40%), тері 90% сақталады
    L = lum(a)[..., None]
    a = L + (a - L) * (.42 + .66 * skin)
    # фон мен киімге сұрғылт-күлгін рең (жарықтығы сақталады), теріге тимейді
    tint = L * (MAUVE / float(lum(MAUVE[None, None, :])[0, 0]))
    a = a * (1 - .32 * (1 - skin)) + tint * .32 * (1 - skin)
    # 4) low-key қисық: көлеңкелер «қысылады» (терең қара), орта тондарда контраст, жалпы жарық төмендейді
    a = np.clip((a - .03) / (1 - .03), 0, 1)
    a = .5 + .5 * np.tanh(2.3 * (a - .42)) / np.tanh(1.15)
    a = np.clip(a, 0, 1) ** .98
    # 5) бетке түскен жарық: назар нүктесінде жұмсақ дөңгелек жарық (+12%), ал жиегі қараяды
    y, x = np.ogrid[:h, :w]
    d = np.sqrt(((x - w * .5) / (w * .42)) ** 2 + ((y - h * cy) / (h * .3)) ** 2)
    a = a * (1 + .26 * np.exp(-d * d * 1.6))[..., None]
    v = np.clip((np.sqrt(((x - w / 2) / (w * .62)) ** 2 + ((y - h * (cy + .12)) / (h * .7)) ** 2) - .5) / .7, 0, 1) ** 1.4
    a = a * (1 - vignette * v)[..., None]
    img = Image.fromarray((np.clip(a, 0, 1) * 255 + .5).astype(np.uint8))
    # 6) айқындық пен нақтылық; тері жұмсақ тегістеледі
    sharp = img.filter(ImageFilter.UnsharpMask(radius=max(14, w // 36), percent=34, threshold=2)).filter(ImageFilter.UnsharpMask(radius=1.0, percent=70, threshold=3))
    soft = img.filter(ImageFilter.GaussianBlur(max(1.2, w / 520)))
    A, S = np.asarray(sharp, dtype=np.float32), np.asarray(soft, dtype=np.float32)
    k = skin * .45
    out = A * (1 - k) + S * k
    # 7) жылы тері: терінің қызыл-сарысы сәл тереңдейді (мысалдағыдай)
    out = out * (1 + skin * np.array([.09, -.01, -.05]))
    return Image.fromarray(np.clip(out + .5, 0, 255).astype(np.uint8))


def portrait(src, dst):
    im = Image.open(src).convert("RGB")
    w, h = im.size
    im = im.crop((0, 0, w, min(h, int(w * 1.25)))).resize((640, 800), Image.LANCZOS)
    grade_moody(im, .28, .46).save(dst, quality=86, optimize=True, progressive=True)


def wide(src, dst, width):
    im = Image.open(src).convert("RGB")
    w, h = im.size
    im = im.resize((width, round(h * width / w)), Image.LANCZOS)
    grade_moody(im, .32, .42).save(dst, quality=82, optimize=True, progressive=True)


# ---------- команданың өз өңдеуі: суреттер өзгертілмей қойылады; жоғары сапалы нұсқа - сол өңдеудің түсіне дәлденеді ----------
def match_hist(src, refs):
    """src суретінің әр арнасын refs суреттерінің жиынтық гистограммасына келтіреді (CDF сәйкестендіру): түс пен тон бірдей болады, анықтық src-тікі."""
    a = np.asarray(src.convert("RGB"), dtype=np.uint8)
    rr = [np.asarray(r.convert("RGB").resize((min(900, r.width), round(r.height * min(900, r.width) / r.width))), dtype=np.uint8) for r in refs]
    out = np.empty_like(a)
    for c in range(3):
        sh = np.bincount(a[..., c].ravel(), minlength=256).astype(np.float64)
        rh = sum(np.bincount(r[..., c].ravel(), minlength=256) for r in rr).astype(np.float64)
        scdf, rcdf = np.cumsum(sh) / sh.sum(), np.cumsum(rh) / rh.sum()
        lut = np.interp(scdf, rcdf, np.arange(256)).clip(0, 255).astype(np.uint8)
        out[..., c] = lut[a[..., c]]
    return Image.fromarray(out)


def place_edited(edited, originals):
    """edited: команда өңдеген файлдар (gulzat, dastan, magzhan, merey, sagid, group, work .jpg);
    originals: түпнұсқалар (group.jpg, duo.jpg) - фильмге керек жоғары сапалы нұсқа сол өңдеудің түсіне келтіріледі."""
    e, o = Path(edited), Path(originals)
    for n in ("gulzat", "dastan", "magzhan", "merey", "sagid"):
        im = Image.open(e / f"{n}.jpg").convert("RGB")
        w, h = im.size
        im.crop((0, 0, w, min(h, int(w * 1.25)))).resize((640, 800), Image.LANCZOS).save(OUT / f"{n}.jpg", quality=88, optimize=True, progressive=True)
    for n in ("group", "work"):
        im = Image.open(e / f"{n}.jpg").convert("RGB")
        if im.width > 1600:
            im = im.resize((1600, round(im.height * 1600 / im.width)), Image.LANCZOS)
        im.save(OUT / f"{n}.jpg", quality=88, optimize=True, progressive=True)
    g = Image.open(o / "group.jpg").convert("RGB")
    g = g.resize((2400, round(g.height * 2400 / g.width)), Image.LANCZOS)
    match_hist(g, [Image.open(e / "group.jpg")]).save(OUT / "group-hd.jpg", quality=82, optimize=True, progressive=True)
    d = Image.open(o / "duo.jpg").convert("RGB")
    d = d.resize((1600, round(d.height * 1600 / d.width)), Image.LANCZOS)
    match_hist(d, [Image.open(e / "gulzat.jpg"), Image.open(e / "merey.jpg")]).save(OUT / "duo.jpg", quality=84, optimize=True, progressive=True)
    print("team photos (edited):", ", ".join(sorted(p.name for p in OUT.glob("*.jpg"))))


def main(srcdir):
    s = Path(srcdir)
    for n in ("gulzat", "dastan", "magzhan", "merey", "sagid"):
        portrait(s / f"{n}.jpg", OUT / f"{n}.jpg")
    for n in ("work", "duo", "group"):
        wide(s / f"{n}.jpg", OUT / f"{n}.jpg", 1600)
    wide(s / "group.jpg", OUT / "group-hd.jpg", 2400)
    print("team photos:", ", ".join(sorted(p.name for p in OUT.glob("*.jpg"))))


if __name__ == "__main__":
    if len(sys.argv) > 2 and sys.argv[1] == "--edited":   # python3 tools/team_photos.py --edited <өңделгендер> <түпнұсқалар>
        place_edited(sys.argv[2], sys.argv[3])
        sys.exit()
    main(sys.argv[1] if len(sys.argv) > 1 else ROOT / "assets/img/team/src")
