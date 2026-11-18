#!/usr/bin/env python3
# © 2026 AO17 командасы. All Rights Reserved. Дербес авторлық бағдарлама (LICENSE-PROPRIETARY.md, COPYRIGHT.md).
"""AO17 команда портреттерін фоннан бөлу (team/3d.html фильмі үшін).

Әдіс - классикалық GrabCut (OpenCV), жасанды интеллект моделі жоқ, интернет қажет емес.
Команданың өзі өңдеген фотолары (assets/img/team/<slug>.jpg) түсі өзгертілмей алынады;
тек фон мөлдір болады, жиегі жұмсартылады. Нәтиже: assets/img/team/cut/<slug>.webp (RGBA).

    pip install opencv-python-headless numpy pillow
    python3 tools/team_cutout.py            # бәрі
    python3 tools/team_cutout.py sagid      # біреуі
"""
import json
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets/img/team/cut"


def cut(slug):
    src = ROOT / f"assets/img/team/{slug}.jpg"
    bgr = cv2.imread(str(src))
    h, w = bgr.shape[:2]
    mask = np.full((h, w), cv2.GC_PR_BGD, np.uint8)
    # бастапқы болжам: адам ортада, кадрдың астына дейін; жиектері - фон
    x0, x1, y0 = int(w * .07), int(w * .93), int(h * .04)
    mask[y0:, x0:x1] = cv2.GC_PR_FGD
    mask[:, :int(w * .03)] = cv2.GC_BGD
    mask[:, int(w * .97):] = cv2.GC_BGD
    mask[:int(h * .02), :] = cv2.GC_BGD
    cx = w // 2
    # бастан жоғары әрі жанындағы аймақ - анық фон (бас эллипсінен тыс, иықтан жоғары)
    yy, xx = np.mgrid[:h, :w]
    head = ((xx - cx) / (w * .2)) ** 2 + ((yy - h * .2) / (h * .19)) ** 2 <= 1
    mask[(yy / h < .24 + .45 * np.abs(xx - cx) / w) & ~head] = cv2.GC_BGD   # иық сызығынан жоғары
    mask[int(h * .3):int(h * .62), cx - int(w * .1):cx + int(w * .1)] = cv2.GC_FGD   # бет пен кеуде
    mask[int(h * .8):, cx - int(w * .22):cx + int(w * .22)] = cv2.GC_FGD               # дененің төменгі жағы
    bg, fg = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
    cv2.grabCut(bgr, mask, None, bg, fg, 8, cv2.GC_INIT_WITH_MASK)
    a = np.where((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)
    # ең үлкен бөлікті ғана қалдыру, тесіктерді жабу, жиекті жұмсарту
    n, lab, stats, _ = cv2.connectedComponentsWithStats(a, 8)
    if n > 1:
        keep = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
        a = np.where(lab == keep, 255, 0).astype(np.uint8)
    a = cv2.morphologyEx(a, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9)), iterations=2)
    holes = a.copy(); ff = np.zeros((h + 2, w + 2), np.uint8); cv2.floodFill(holes, ff, (0, 0), 255); a = a | cv2.bitwise_not(holes)
    a = cv2.erode(a, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3)))
    a = cv2.GaussianBlur(a, (0, 0), 1.6)
    # жиектегі фон түсін тазалау: жартылай мөлдір аймақтың түсін адамның ішкі түсімен толтыру (сұр «сәуле» қалмасын)
    edge = np.where(a < 250, 255, 0).astype(np.uint8)
    bgr = cv2.inpaint(bgr, edge, 5, cv2.INPAINT_TELEA)
    a = cv2.erode(a, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3)))
    rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
    img = Image.fromarray(np.dstack([rgb, a]), "RGBA")
    OUT.mkdir(parents=True, exist_ok=True)
    img.save(OUT / f"{slug}.webp", "WEBP", quality=88, method=6)
    return float((a > 128).mean())


def dark(slug):
    """Команданың өзі қара фонда өңдеген портреті (assets/img/team/dark/<slug>.jpg) үшін мөлдірлік маскасы.
    Қара костюм қара фонға сіңіп кетпес үшін маска қараңғы суреттен емес, түпнұсқа фотодағы GrabCut контурынан алынады:
    екі фото SIFT нүктелерімен сәйкестендіріліп (гомография), контур жаңа кадрға көшіріледі. Ашық пикселдер әрқашан адамға жатады."""
    src = cv2.imread(str(ROOT / f"assets/img/team/{slug}.jpg"))
    cut = np.array(Image.open(OUT / f"{slug}.webp"))[:, :, 3]
    drk = cv2.imread(str(ROOT / f"assets/img/team/dark/{slug}.jpg"))
    sift = cv2.SIFT_create(4000)
    k1, d1 = sift.detectAndCompute(cv2.cvtColor(src, cv2.COLOR_BGR2GRAY), None)
    k2, d2 = sift.detectAndCompute(cv2.cvtColor(drk, cv2.COLOR_BGR2GRAY), None)
    good = [m for m, n in cv2.BFMatcher().knnMatch(d1, d2, k=2) if m.distance < .72 * n.distance]
    A = np.float32([k1[m.queryIdx].pt for m in good]); B = np.float32([k2[m.trainIdx].pt for m in good])
    Hm, inl = cv2.findHomography(A, B, cv2.RANSAC, 4.0)
    h, w = drk.shape[:2]
    a = cv2.warpPerspective(cut, Hm, (w, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    lum = cv2.cvtColor(drk, cv2.COLOR_BGR2GRAY)
    a = np.maximum(a, np.where((lum > 60) & (cv2.GaussianBlur(a, (0, 0), 12) > 40), 255, 0).astype(np.uint8))   # ашық бөліктер (жүз, көйлек) - адам
    a = cv2.GaussianBlur(a, (0, 0), 1.4)
    rgb = cv2.cvtColor(drk, cv2.COLOR_BGR2RGB)
    Image.fromarray(np.dstack([rgb, a]), "RGBA").save(OUT / f"{slug}.webp", "WEBP", quality=88, method=6)
    return int(inl.sum()), len(good)


if __name__ == "__main__":
    if "--dark" in sys.argv:
        team = json.loads((ROOT / "licensing/team.json").read_text(encoding="utf-8"))
        for m in team["members"]:
            cut(m["slug"]); print(m["slug"], "сәйкес нүктелер (inlier, барлығы):", dark(m["slug"]))
        sys.exit(0)
    team = json.loads((ROOT / "licensing/team.json").read_text(encoding="utf-8"))
    slugs = sys.argv[1:] or [m["slug"] for m in team["members"]]
    for s in slugs:
        print(s, f"адам ауданы: {cut(s):.0%}")
