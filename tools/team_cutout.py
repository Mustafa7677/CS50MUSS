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
    # 5.0: маска қара фондағы фотоның өзінен (GrabCut). Көшірілген контур тек бастапқы болжам: шаш пен жүз жарық болғандықтан,
    # ол қате кескен жерлерді (мысалы, шаштың шеті) суреттің өзі түзетеді. Қара киім үшін көшірілген контур кеуде тұсында сақталады.
    lum = cv2.cvtColor(drk, cv2.COLOR_BGR2GRAY)
    warped = a.copy()
    near = cv2.dilate(warped, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (61, 61)))
    gm = np.full((h, w), cv2.GC_PR_BGD, np.uint8)
    gm[warped > 128] = cv2.GC_PR_FGD
    gm[(near > 0) & (lum > 34)] = cv2.GC_PR_FGD
    gm[cv2.erode(warped, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (41, 41))) > 200] = cv2.GC_FGD
    gm[(lum > 70) & (near > 0)] = cv2.GC_FGD
    gm[(near == 0) & (lum < 20)] = cv2.GC_BGD
    bgm, fgm = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
    cv2.grabCut(drk, gm, None, bgm, fgm, 6, cv2.GC_INIT_WITH_MASK)
    a = np.where((gm == cv2.GC_FGD) | (gm == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)
    yy = np.arange(h)[:, None]
    a = np.maximum(a, np.where(yy > h * .42, warped, 0).astype(np.uint8))   # қара киім: кеуденің төменгі жағы
    n, lab, st, _ = cv2.connectedComponentsWithStats(a, 8)
    if n > 1:
        a = np.where(lab == 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA])), 255, 0).astype(np.uint8)
    a = cv2.morphologyEx(a, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7)))
    # жиек: шаш ұштары жарықтығына қарай жұмсақ (қара фонға табиғи сіңеді)
    soft = np.clip((lum.astype(np.float32) - 14) / 40, 0, 1)
    edge = cv2.dilate(a, np.ones((9, 9), np.uint8)) - cv2.erode(a, np.ones((9, 9), np.uint8))
    a = cv2.GaussianBlur(a, (0, 0), 1.2).astype(np.float32)
    a = np.where(edge > 0, np.maximum(a * .85, soft * 255 * (a > 20)), a).clip(0, 255).astype(np.uint8)
    rgb = cv2.cvtColor(drk, cv2.COLOR_BGR2RGB)
    Image.fromarray(np.dstack([rgb, a]), "RGBA").save(OUT / f"{slug}.webp", "WEBP", quality=88, method=6)
    return int(inl.sum()), len(good)


if __name__ == "__main__" and "--group" not in sys.argv:
    if "--dark" in sys.argv:
        team = json.loads((ROOT / "licensing/team.json").read_text(encoding="utf-8"))
        for m in team["members"]:
            cut(m["slug"]); print(m["slug"], "сәйкес нүктелер (inlier, барлығы):", dark(m["slug"]))
        sys.exit(0)
    team = json.loads((ROOT / "licensing/team.json").read_text(encoding="utf-8"))
    slugs = sys.argv[1:] or [m["slug"] for m in team["members"]]
    for s in slugs:
        print(s, f"адам ауданы: {cut(s):.0%}")


def group_layers():
    """Топ фотосын екі қабатқа бөлу (team/3d.html «The Living Frame» ашылуы үшін):
    group-fg.webp - бес адам (мөлдір фон), group-bg.jpg - адамдар алынып, орны толтырылған (inpaint) фон.
    Бастапқы болжам - team.json-дағы бет орындары; бастан төмен қарай дене бағаны."""
    team = json.loads((ROOT / "licensing/team.json").read_text(encoding="utf-8"))
    img = cv2.imread(str(ROOT / "assets/img/team/group-hd.jpg"))
    s = 1200 / img.shape[1]
    sm = cv2.resize(img, None, fx=s, fy=s, interpolation=cv2.INTER_AREA)
    h, w = sm.shape[:2]
    gm = np.full((h, w), cv2.GC_BGD, np.uint8)
    for m in team["members"]:
        fx, fy = m["face"][0] / 100 * w, m["face"][1] / 100 * h
        hw = w * .075
        cv2.ellipse(gm, (int(fx), int(fy)), (int(hw * 1.5), int(hw * 1.9)), 0, 0, 360, cv2.GC_PR_FGD, -1)
        cv2.rectangle(gm, (int(fx - hw * 2.3), int(fy + hw * .8)), (int(fx + hw * 2.3), h), cv2.GC_PR_FGD, -1)
    for m in team["members"]:
        fx, fy = m["face"][0] / 100 * w, m["face"][1] / 100 * h
        hw = w * .075
        cv2.ellipse(gm, (int(fx), int(fy)), (int(hw * .45), int(hw * .6)), 0, 0, 360, cv2.GC_FGD, -1)
        cv2.rectangle(gm, (int(fx - hw * .5), int(fy + hw * 1.6)), (int(fx + hw * .5), int(min(h - 1, fy + hw * 4))), cv2.GC_FGD, -1)
    bg, fg = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
    cv2.grabCut(sm, gm, None, bg, fg, 8, cv2.GC_INIT_WITH_MASK)
    a = np.where((gm == cv2.GC_FGD) | (gm == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)
    a = cv2.morphologyEx(a, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))
    a = cv2.morphologyEx(a, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11)))
    out_w = 1800
    k = out_w / img.shape[1]
    big = cv2.resize(img, None, fx=k, fy=k, interpolation=cv2.INTER_AREA)
    Ak = cv2.GaussianBlur(cv2.resize(a, (big.shape[1], big.shape[0]), interpolation=cv2.INTER_LINEAR), (0, 0), 1.6)
    rgb = cv2.cvtColor(big, cv2.COLOR_BGR2RGB)
    Image.fromarray(np.dstack([rgb, Ak]), "RGBA").save(ROOT / "assets/img/team/group-fg.webp", "WEBP", quality=86, method=6)
    hole = cv2.dilate(np.where(Ak > 20, 255, 0).astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (31, 31)))
    small = cv2.resize(big, None, fx=.25, fy=.25)
    hs = cv2.resize(hole, (small.shape[1], small.shape[0]))
    fill = cv2.resize(cv2.inpaint(small, hs, 9, cv2.INPAINT_TELEA), (big.shape[1], big.shape[0]), interpolation=cv2.INTER_CUBIC)
    fill = cv2.GaussianBlur(fill, (0, 0), 6)
    bgimg = np.where(hole[..., None] > 0, fill, big)
    cv2.imwrite(str(ROOT / "assets/img/team/group-bg.jpg"), bgimg, [cv2.IMWRITE_JPEG_QUALITY, 84])
    return float((Ak > 128).mean())


if __name__ == "__main__" and "--group" in sys.argv:
    print("топ фотосындағы адам ауданы:", round(group_layers(), 3))
