# © 2026 AO17 командасы. All Rights Reserved.
# INSIDE TECH комикстері AO17-нің 3D дәрістерінде (2-бөлім) және комикс хабында (academy/comics.html#part2).
# Дерек: tools/academy/data/inside_media.json (tools/inside_media.mjs; tools/sync_inside.py жаңартады). 44 комикс:
#   20 зертхана комиксі (әр зертхананың 1-2 сабағы, күнделікті өмірден), 10 кино-комикс (3-сабақ, әрқайсысы бір жанрда),
#   14 сабақтың өз комиксі (математика курсы және бірнеше IT сабағы).
# INSIDE TECH кадрында бір сөйлеуші бар (бет-әлпеті мен сөз бұлты). AO17 кадрында кейіпкерлер толық бойымен салынады (comic.py), сондықтан:
#   - сөйлеушінің қасында әңгімелесушісі тұрады: мәтінде аты аталған кейіпкер, болмаса алдыңғы не келесі сөйлеуші;
#   - баяндаушының (narrator) сөзі кадрдың жазбасына (cap), «САХНА 1 · ...» тақтасы кино-тақтаға (slate) айналады;
#     кадрда мәтінде аты аталған кейіпкерлер тұрады, ешкім аталмаса - келесі кадрдың кейіпкерлері;
#   - тақтадағы жазу (board) бор тақтаға салынады: тар кадрда сөйлеуші тақтаға қарап тұрады (Бота - оң жақта, өйткені оның басы
#     денесінен алға шығып тұрады; Нұрай мен Мустафа - сол жақта); жазуы ұзын кадр кең болады
#     (екі кейіпкер, ортасында тақта); тордың жұптығын (CX.layout_errors) кең кадр түзетеді
#     (алдымен баяндаушы кадры, сосын тақтасы бар кадр, сосын бірінші кадр);
#   - көңіл-күй: smile - қуанышты, explain - сабырлы (қолымен көрсетеді), think - ойланып тұр, confused - абыржыды, wow - таңғалды;
#   - сахна: кадрдың өз bg өрісі, болмаса мәтіндегі орын (түн, ғарыш, сервер, сынып, үй, дала, қала), болмаса зертхананың сахнасы;
#     дыбысы (sfx) бар кадр - жарқыл.
# Ұстаздың сөзін Бота айтады (tools/inside_media.mjs). INSIDE TECH-тегідей комикс сабақтың өз қадамында, дәрістің алдында тұрады.
import html
import json
import pathlib
import re

import comic as CX

E = lambda s: html.escape(str(s), quote=True)  # noqa: E731
DATA = pathlib.Path(__file__).resolve().parent / "data" / "inside_media.json"
WHO = {"nuray": "N", "mustafa": "M", "bota": "B"}
MOOD = {"smile": "happy", "explain": "calm", "think": "think", "confused": "worried", "wow": "wow"}
GESTURE = {"explain": "point", "think": "chin", "wow": "up"}
BG = {"room": "desk", "classroom": "class", "server-room": "screen", "circuit": "screen", "city": "aul", "night": "night", "space": "night"}
PLACE = [("night", r"түн|ғарыш|марс|орбита|спутник"), ("screen", r"сервер|экранда"),
         ("class", r"сынып|сабақ|мектеп|кабинет|кітапхана|спорт|асхана|чемпионат"), ("desk", r"асүй|бөлме|кафе|үйде"),
         ("steppe", r"саябақ|көктем|гүлзар|қыс\b|шана|дала|жылыжай"), ("aul", r"қала|көше|ауыл")]
LAB_BG = {"ai": "desk", "web": "desk", "game": "class", "net": "screen", "db": "desk", "arch": "screen", "cloud": "screen", "sec": "night",
          "algo": "class", "iot": "desk", "math": "class"}
ORDER = {"l": 0, "c": 1, "r": 2}
BOARD_W = {"B": 198, "N": 226, "M": 226}   # тар кадрдағы тақтаның ені (comic._layout: Бота оң жақта - 14..212, басқалары сол жақта - 162..388)
BOARD_MIN = 11.0     # бор тақтадағы қаріптің ең кіші өлшемі (одан кіші болса, кадр кең болады)
_cache = {}


def media():
    if "d" not in _cache:
        _cache["d"] = json.loads(DATA.read_text(encoding="utf-8"))
    return _cache["d"]


def entries():
    """Барлық комикс: {kind, lesson, step, comic}. Сабақтың өз комиксі бар қадамда зертхана комиксі көрсетілмейді (INSIDE TECH-тегідей)."""
    if "e" not in _cache:
        d, out = media(), []
        own = {(lid, v["step"]) for lid, v in d["lessonComics"].items()}
        for kind, sec in (("lab", "labComics"), ("film", "filmComics"), ("lesson", "lessonComics")):
            for lid, v in d[sec].items():
                if kind != "lesson" and (lid, v["step"]) in own:
                    continue
                out.append({"kind": kind, "lesson": lid, "step": v["step"], "comic": v["comic"]})
        _cache["e"] = out
    return _cache["e"]


def for_lesson(lid):
    return next((e for e in entries() if e["lesson"] == lid), None)


# ------------------------------------------------------------------ түрлендіру
def names(text):
    """Мәтінде аты аталған кейіпкерлер (аталу ретімен)."""
    found = []
    for code, rx in (("N", r"Нұрай"), ("M", r"Мустафа"), ("B", r"\bБота")):
        m = re.search(rx, text)
        if m:
            found.append((m.start(), code))
    return [c for _, c in sorted(found)]


def place(text):
    t = text.lower()
    return next((bg for bg, rx in PLACE if re.search(rx, t)), None)


def _mood_of(panels, i, who):
    """Кейіпкердің ең жақын сөйлейтін кадрындағы көңіл-күйі (алдымен келесі кадрлар): тыңдап тұрған кейіпкердің реакциясы."""
    n = len(panels)
    for d in range(1, n):
        for j in (i + d, i - d):
            if 0 <= j < n and WHO.get(panels[j]["who"]) == who:
                return MOOD.get(panels[j].get("mood"), "calm" if who != "B" else "happy")
    return "calm" if who != "B" else "happy"


def _partner(panels, i, me):
    named = [c for c in names(panels[i]["say"]) if c != me]
    if named:
        return named[0]
    for j in list(range(i - 1, -1, -1)) + list(range(i + 1, len(panels))):
        w = WHO.get(panels[j]["who"])
        if w and w != me:
            return w
    return None


def _sides(codes):
    """Кейіпкерлердің орны: Бота - оң жақта, Нұрай - сол жақта; үшеуі болса Мустафа ортада."""
    if len(codes) == 1:
        return {codes[0]: "c"}
    if len(codes) == 3:
        return {c: {"N": "l", "M": "c", "B": "r"}[c] for c in codes}
    a, b = codes
    if "B" in codes:
        return {a: "r" if a == "B" else "l", b: "r" if b == "B" else "l"}
    return {"N": "l", "M": "r"}


def _board_fits(lines, avail):
    return max(len(t) for t in lines) * BOARD_MIN * .55 + 24 <= avail


def _cast(codes, moods, speaker=None, gesture=None, prop=False, wide=False):
    sides = _sides(codes)
    if prop and len(codes) == 1:     # жалғыз кейіпкер тақтаға қарап тұрады (кең кадрда тақта әрдайым оң жақта)
        sides = {codes[0]: "r" if codes[0] == "B" and not wide else "l"}
    cast = []
    for c in sorted(codes, key=lambda x: ORDER[sides[x]]):
        g = gesture if (c == speaker and c != "B") else None
        cast.append((c, moods[c], sides[c], g) if g else (c, moods[c], sides[c]))
    return cast


def convert(comic, lab_id):
    """INSIDE TECH комиксі -> AO17 комиксі (comic.py пішімі)."""
    src = comic["panels"]
    first = " ".join(x for x in (src[0].get("scene", ""), src[0]["say"]) if x)
    bg = BG.get(src[0].get("bg")) or place(first) or LAB_BG.get(lab_id, "desk")
    out, need = [], []
    for i, p in enumerate(src):
        if p.get("bg"):
            bg = BG.get(p["bg"], bg)
        elif p.get("scene") and i:
            bg = place(p["scene"]) or bg
        me = WHO.get(p["who"])
        lines = [t for t in (p.get("board") or "").split("\n") if t.strip()]
        pn = {"bg": "flash" if p.get("sfx") else bg, "say": []}
        if p.get("scene"):
            pn["slate"] = p["scene"]
        if p.get("sfx"):
            pn["sfx"] = p["sfx"]
        if me:
            pn["say"] = [(me, p["say"])]
            codes = [me] + [WHO[w] for w in p.get("with", []) or [] if WHO.get(w) and WHO[w] != me]
            mate = _partner(src, i, me)
            if mate and mate not in codes:
                codes.append(mate)
        else:
            pn["cap"] = p["say"]
            codes = names(p["say"])
        pn["_codes"], pn["_me"], pn["_mood"] = codes, me, p.get("mood")
        if lines:
            pn["prop"] = ("board", {"lines": lines})
        out.append(pn)
        need.append(bool(lines))
    # баяндаушы кадры: ешкім аталмаса - келесі (болмаса алдыңғы) кадрдың кейіпкерлері
    for i, pn in enumerate(out):
        if not pn["_codes"]:
            near = [out[j] for j in list(range(i + 1, len(out))) + list(range(i - 1, -1, -1)) if out[j]["_me"]]
            pn["_codes"] = list(near[0]["_codes"]) if near else ["N", "M"]
    # тақтасы бар кадр: жазуы тар кадрдың тақтасына сыйса - тек сөйлеуші, әйтпесе кең кадр
    wide = [need[i] and not _board_fits(pn["prop"][1]["lines"], BOARD_W[pn["_me"] or pn["_codes"][0]]) for i, pn in enumerate(out)]
    # тор: екі кең кадрдың арасындағы жай кадрлар саны жұп болсын
    i = 0
    while i <= len(out):
        if i == len(out) or wide[i]:
            start = i - 1
            while start >= 0 and not wide[start]:
                start -= 1
            run = list(range(start + 1, i))
            if len(run) % 2:
                cand = run[::2]
                pick = next((k for k in cand if not out[k]["_me"]), None)
                if pick is None:
                    pick = next((k for k in cand if need[k]), cand[0])
                wide[pick] = True
                i = start + 1
                continue
        i += 1
    for i, pn in enumerate(out):
        codes, me = pn.pop("_codes"), pn.pop("_me")
        mood = pn.pop("_mood")
        moods = {c: (MOOD.get(mood, "calm") if c == me else _mood_of(src, i, c)) for c in codes}
        if pn.get("prop"):
            codes = codes[:2] if wide[i] else [me or codes[0]]
            if not wide[i] and codes[0] == "B":
                pn["prop_side"] = "l"
        else:
            codes = codes[:3]
        pn["cast"] = _cast(codes, moods, me, GESTURE.get(mood), bool(pn.get("prop")), wide[i])
        if wide[i]:
            pn["wide"] = True
        if me and mood == "confused":
            pn["fx"] = {me: "q"}
        elif me and mood == "wow":
            pn["fx"] = {me: "idea" if i == len(out) - 1 else "spark"}
    return {"title": comic["title"], "panels": out}


# ------------------------------------------------------------------ HTML
def kicker(e):
    c = e["comic"]
    if e["kind"] == "film":
        return "Кино-комикс · " + c.get("genre", "")
    return "Комикс · Нұрай, Мустафа және Бота"


def teaser(e, n=110):
    """Хабтағы карточка үшін: кино-комикстің ұраны, болмаса комикстің бірінші сөзі (сөз шекарасында қысқартылған)."""
    c = e["comic"]
    if c.get("tagline"):
        return c["tagline"]
    t = c["panels"][0]["say"]
    if len(t) <= n:
        return t
    cut = t[:n].rsplit(" ", 1)[0].rstrip(",.:;—-")
    return cut + "…"


def section(e, lab_id, base="../../"):
    """Сабақ қадамындағы комикс (бет: academy/3d/<зертхана>/<сабақ>.html)."""
    c = e["comic"]
    tag = f'<p class="cx-tag">{E(c["tagline"])}</p>' if c.get("tagline") else ""
    head = (f'<div class="cx-head"><div><p class="cx-k">{E(kicker(e))}</p><h3 class="cx-t" id="cx-h">{E(c["title"])}</h3>{tag}</div>'
            f'<a href="{base}comics.html#part2">Барлық комикстер</a></div>')
    strip = CX.strip(convert(c, lab_id), CX.uid_of(e["lesson"] + "ix"), head, "", "cx-ix" + (" cx-film" if e["kind"] == "film" else ""))
    return f'<div class="l3-comic" id="s-comic" role="region" aria-labelledby="cx-h">{strip}</div>'


def cover(e, lab_id):
    """Хабтағы карточканың мұқабасы: бірінші кадрдың суреті, әрдайым тар кадр (400×230) - карточкалар бірдей биіктікте;
    тақта алынады, кейіпкерлер, сахна, дыбыс пен әсерлер қалады."""
    p0 = {k: v for k, v in convert(e["comic"], lab_id)["panels"][0].items() if k not in ("wide", "prop", "prop_side")}
    if p0["cast"] and len(p0["cast"]) == 1 and p0["cast"][0][2] != "c":
        p0["cast"] = [(p0["cast"][0][0], p0["cast"][0][1], "c") + tuple(p0["cast"][0][3:])]
    return CX.cover_svg({"panels": [p0]}, CX.uid_of("cv3" + e["lesson"]))


def validate(lab_of, steps_of):
    """Әр комикс бар сабақтың бар қадамында; AO17 пішіміне түрлендірілген комикс comic.py тексерісінен өтеді."""
    errs = []
    if len(entries()) != 44:
        errs.append(f"INSIDE TECH комикстері: 44 емес, {len(entries())}")
    seen = set()
    for e in entries():
        where = f"INSIDE TECH комиксі {e['lesson']}"
        if e["lesson"] in seen:
            errs.append(f"{where}: сабақта екі комикс")
        seen.add(e["lesson"])
        if e["lesson"] not in lab_of:
            errs.append(f"{where}: мұндай сабақ жоқ")
            continue
        if e["step"] not in steps_of[e["lesson"]]:
            errs.append(f"{where}: {e['step']} қадамы жоқ")
        c = convert(e["comic"], lab_of[e["lesson"]])
        errs += CX.validate(c, where) + CX.layout_errors(c, where)
        if re.search(r"[Ұұ]стаз", json.dumps(e["comic"], ensure_ascii=False)):
            errs.append(f"{where}: Ұстаз аталған")
    return errs
