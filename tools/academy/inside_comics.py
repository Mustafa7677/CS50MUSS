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
# Тағы екі серия сол қозғалтқышпен салынады:
#   «Тірі заттар» - 6 әңгіме, кейіпкерлері техника (ноутбук, сервер, процессор, пакет...: gadgets.py); әр әңгіме өз сабағының соңында;
#   «Қалай оқу керек?» - оқу туралы 7 сенім (academy/learn.html): оқушы алдымен «миф пе, шындық па» деп болжайды, сосын комикс ашылады.
import html
import json
import pathlib
import re

import comic as CX
import gadgets as GD

E = lambda s: html.escape(str(s), quote=True)  # noqa: E731
DATA = pathlib.Path(__file__).resolve().parent / "data" / "inside_media.json"
WHO = {"nuray": "N", "mustafa": "M", "bota": "B", **{g: g for g in GD.DRAW}}
HOME = {"N": "l", "M": "r", "B": "r"}     # басты кейіпкерлердің әдеттегі жағы; техника-кейіпкерлер комикске кіру ретімен кезектеседі
MOOD = {"smile": "happy", "explain": "calm", "think": "think", "confused": "worried", "wow": "wow"}
GESTURE = {"explain": "point", "think": "chin", "wow": "up"}
BG = {"room": "desk", "classroom": "class", "server-room": "screen", "circuit": "screen", "city": "aul", "night": "night", "space": "night"}
PLACE = [("night", r"түн|ғарыш|марс|орбита|спутник"), ("screen", r"сервер|экранда"),
         ("class", r"сынып|сабақ|мектеп|кабинет|кітапхана|спорт|асхана|чемпионат"), ("desk", r"асүй|бөлме|кафе|үйде"),
         ("steppe", r"саябақ|көктем|гүлзар|қыс\b|шана|дала|жылыжай"), ("aul", r"қала|көше|ауыл")]
LAB_BG = {"ai": "desk", "web": "desk", "game": "class", "net": "screen", "db": "desk", "arch": "screen", "cloud": "screen", "sec": "night",
          "algo": "class", "iot": "desk", "math": "class"}
ORDER = {"l": 0, "c": 1, "r": 2}
BOARD_W = {"B": 198}   # тар кадрдағы тақтаның ені (comic._layout: Бота оң жақта - 14..212, басқалары сол жақта - 162..388, яғни 226)
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


def homes(src):
    """Әр кейіпкердің әдеттегі жағы (бүкіл комикс бойы тұрақты) және комикске кіру реті."""
    home, order = dict(HOME), {}
    k = 0
    for p in src:
        for w in [p["who"]] + list(p.get("with") or []):
            c = WHO.get(w)
            if not c or c in order:
                continue
            order[c] = len(order)
            if c not in home:
                home[c] = "l" if k % 2 == 0 else "r"
                k += 1
    return home, order


def _sides(codes, home=HOME, order=None):
    """Кейіпкерлердің орны: Бота әрдайым оң жақта; қалғандары - әдеттегі жағында, екеуі бір жаққа түссе, комикске ертерек кіргені
    өз жағында қалады. Үшеуі болса: сол, орта, оң (Бота болса - ол оң жақта)."""
    order = order or {}
    if len(codes) == 1:
        return {codes[0]: "c"}
    rank = sorted(codes, key=lambda c: (c == "B", home.get(c, "l") == "r", order.get(c, 99)))
    if len(codes) == 3:
        return dict(zip(rank, ("l", "c", "r")))
    a, b = codes
    if "B" in codes:
        return {a: "r" if a == "B" else "l", b: "r" if b == "B" else "l"}
    ha, hb = home.get(a, "l"), home.get(b, "r")
    if ha != hb:
        return {a: ha, b: hb}
    first, second = sorted(codes, key=lambda c: order.get(c, 99))
    return {first: ha, second: "r" if ha == "l" else "l"}


def _board_fits(lines, avail):
    return max(len(t) for t in lines) * BOARD_MIN * .55 + 24 <= avail


def _cast(codes, moods, speaker=None, gesture=None, prop=False, wide=False, home=HOME, order=None):
    if len(set(codes)) < len(codes):   # көшірмелер (мысалы, екі сервер): бірегей кейіпкер ортада, көшірмелер екі жағында
        dup = [c for c in codes if codes.count(c) > 1]
        seq = [dup[0]] + [c for c in codes if codes.count(c) == 1] + dup[1:]
        return [(c, moods[c], side) for c, side in zip(seq, ("l", "c", "r") if len(seq) == 3 else ("l", "r"))]
    sides = _sides(codes, home, order)
    if prop and len(codes) == 1:     # жалғыз кейіпкер тақтаға қарап тұрады (кең кадрда тақта әрдайым оң жақта)
        sides = {codes[0]: "r" if codes[0] == "B" and not wide else "l"}
    cast = []
    for c in sorted(codes, key=lambda x: ORDER[sides[x]]):
        g = gesture if (c == speaker and c in ("N", "M")) else None   # қимыл тек Нұрай мен Мустафада
        cast.append((c, moods[c], sides[c], g) if g else (c, moods[c], sides[c]))
    return cast


def convert(comic, lab_id):
    """INSIDE TECH комиксі -> AO17 комиксі (comic.py пішімі)."""
    src = comic["panels"]
    home, order = homes(src)
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
    wide = [need[i] and not _board_fits(pn["prop"][1]["lines"], BOARD_W.get(pn["_me"] or pn["_codes"][0], 226)) for i, pn in enumerate(out)]
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
        pn["cast"] = _cast(codes, moods, me, GESTURE.get(mood), bool(pn.get("prop")), wide[i], home, order)
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


# ------------------------------------------------------------------ «Тірі заттар»: 6 әңгіме, әрқайсысы өз сабағының соңында
def stories():
    return media()["stories"]


def story_for(lid):
    return next((st for st in stories() if st["lessonId"] == lid), None)


def story_section(st, base="../../"):
    """Сабақтың соңындағы «Тірі заттар» комиксі (бет: academy/3d/<зертхана>/<сабақ>.html)."""
    c = st["comic"]
    tag = f'<p class="cx-tag">{E(c["tagline"])}</p>' if c.get("tagline") else ""
    head = (f'<div class="cx-head"><div><p class="cx-k">Тірі заттар · сабақтағы ұғымдар заттардың өз көзімен</p>'
            f'<h2 class="cx-t" id="st-h">{E(c["title"])}</h2>{tag}</div><a href="{base}comics.html#stories">Барлық әңгіме</a></div>')
    strip = CX.strip(convert(c, st["labId"]), CX.uid_of("st" + st["id"]), head, "", "cx-ix cx-story")
    return f'<section class="l3-story" id="s-story" aria-labelledby="st-h">{strip}</section>'


def story_cover(st):
    p0 = {k: v for k, v in convert(st["comic"], st["labId"])["panels"][0].items() if k not in ("wide", "prop", "prop_side")}
    if len(p0["cast"]) == 1:
        p0["cast"] = [(p0["cast"][0][0], p0["cast"][0][1], "c") + tuple(p0["cast"][0][3:])]
    return CX.cover_svg({"panels": [p0]}, CX.uid_of("cvs" + st["id"]))


# ------------------------------------------------------------------ «Қалай оқу керек?»: 7 эпизод (academy/learn.html)
# Әр эпизодтың құралы: AO17-нің оқу әдістемесіндегі тактика (academy/methods.html) және INSIDE TECH-тегі құрал (3D қолданбада)
TACTIC = {"reread": ("t-recall", "Еске түсіру"), "cram": ("t-space", "Аралықпен қайталау"), "styles": ("t-dual", "Сөз бен сурет"),
          "multitask": ("t-focus", "Назар"), "errors": ("t-reflect", "Өз оқуыңды бақыла"), "interleave": ("t-mix", "Араластыру"),
          "examples": ("t-explain", "Өзіңе түсіндір")}


def episodes():
    return media()["episodes"]


# INSIDE TECH-тің AO17-нің өз беттеріне көшкен бөлімдері: маршрут -> academy/ ішіндегі бет
NATIVE_PAGE = {"comics": "comics.html#part2", "learn": "learn.html", "journey": "journey.html", "career": "careers.html",
               "problems": "problems.html", "cards": "cards.html"}


def tool_href(href, base=""):
    """INSIDE TECH маршруты -> AO17 ішіндегі сілтеме: /labs/<зертхана>/<сабақ> - лекция беті, AO17-ге көшкен бөлім - өз беті,
    қалғаны - 3D қолданбаның бөлімі."""
    m = re.match(r"^/labs/([a-z]+)/([a-z0-9-]+)$", href)
    if m:
        return f"{base}3d/{m.group(1)}/{m.group(2)}.html"
    route = href.strip("/").split("?")[0]
    if route in NATIVE_PAGE:
        return f"{base}{NATIVE_PAGE[route]}"
    return f"{base}3d/app/index.html#{route}"


def episode_cover(ep):
    p0 = {k: v for k, v in convert(ep["comic"], "learn")["panels"][0].items() if k not in ("wide", "prop", "prop_side")}
    if len(p0["cast"]) == 1:
        p0["cast"] = [(p0["cast"][0][0], p0["cast"][0][1], "c") + tuple(p0["cast"][0][3:])]
    return CX.cover_svg({"panels": [p0]}, CX.uid_of("cve" + ep["id"]))


def learn_html(page):
    eps = episodes()
    nav = "".join(f'<li><a href="#ep-{E(e["id"])}" data-ep="{E(e["id"])}"><span>{k}</span>{E(e["tool"]["label"])}</a></li>' for k, e in enumerate(eps, 1))
    arts = []
    for k, e in enumerate(eps, 1):
        c, (tid, tname) = e["comic"], TACTIC.get(e["id"], ("t-recall", "Еске түсіру"))
        head = f'<div class="cx-head"><div><p class="cx-k">Комикс · {k}-эпизод</p><h3 class="cx-t">{E(c["title"])}</h3></div></div>'
        strip = CX.strip(convert(c, "learn"), CX.uid_of("ep" + e["id"]), head, "", "cx-ix")
        arts.append(
            f'<article class="lh-ep" id="ep-{E(e["id"])}" data-ep="{E(e["id"])}" data-fact="{1 if e["fact"] else 0}" aria-labelledby="ep-{E(e["id"])}-h">'
            f'<p class="lh-k">{k}-эпизод · сенім</p><h2 class="lh-claim" id="ep-{E(e["id"])}-h">«{E(e["claim"])}»</h2>'
            f'<div class="lh-btns" role="group" aria-label="Миф пе, шындық па?"><button type="button" data-v="0">Миф</button><button type="button" data-v="1">Шындық</button></div>'
            f'<p class="lh-verdict" role="status" tabindex="-1"></p>'
            f'<p class="lh-locked" hidden>Комикс жауабыңнан кейін ашылады: алдын ала болжау оқуды күшейтеді. Бұл да зерттеулердің бірі.</p>'
            f'<div class="lh-open"><p class="lh-ans">Жауабы: <b>{"шындық" if e["fact"] else "миф"}</b>.</p>{strip}'
            f'<section class="lh-box lh-find"><h3>Зерттеулер не дейді</h3><p>{E(e["finding"])}</p></section>'
            f'<section class="lh-box lh-tool"><h3>Сайтта қалай қолданасың</h3><p>{E(e["tool"]["how"])}</p>'
            f'<p class="lh-links"><a class="btn secondary" href="{tool_href(e["tool"]["href"])}">{E(e["tool"]["label"])}</a> '
            f'<a class="btn secondary" href="methods.html#{tid}">AO17 тактикасы: {E(tname)}</a></p></section></div></article>')
    body = f"""  <div class="layout single">
    <article class="content lh" id="main">
      <p class="ac-crumb"><a href="course.html">AO17 CS курсы</a> / <a href="methods.html">Оқу әдістемесі</a> / Қалай оқу керек?</p>
      <header class="lecture-head lh-head" style="--lc:#b3262e"><div class="num">Комикс-курс · {len(eps)} эпизод</div><h1>Қалай оқу керек?</h1>
        <p>Көп адам оқуға ең тиімсіз тәсілдермен уақыт жұмсайды. Нұрай, Мустафа және Бота оқу туралы жеті танымал сенімді тексереді. Әр эпизодта алдымен өзің шеш: миф пе, шындық па? Комикс жауабыңнан кейін ашылады.</p>
        <p class="lh-prog" aria-live="polite"></p></header>
      <nav class="lh-nav" aria-label="Эпизодтар"><ol>{nav}</ol></nav>
      {"".join(arts)}
      <section class="lh-final" hidden aria-label="Курс аяқталды"><h2>Курс аяқталды</h2>
        <p>Енді сен оқудың өзін білесің: еске түсір, аралықпен қайтала, араластыр, қатеңнен үйрен, назарыңды сақта. Әр тактиканың құралы мен жаттығуы AO17-нің оқу әдістемесінде.</p>
        <p><a class="btn gold" href="methods.html">Оқу әдістемесін ашу</a></p></section>
      <p class="l3-src">Эпизодтар AO17 командасының INSIDE TECH платформасынан алынған. Болжамдарың INSIDE TECH-тің «Қалай оқу керек?» бөлімімен ортақ сақталады.</p>
    </article>
  </div>"""
    return "academy/learn.html", page("academy/learn.html", "Қалай оқу керек? Оқу туралы жеті сенім",
                                      "AO17 комикс-курсы: Нұрай, Мустафа және Бота оқу туралы жеті танымал сенімді тексереді. Алдымен болжа: миф пе, шындық па?",
                                      body, scripts=("assets/js/learn-how.js",))


def validate_more(lab_of, steps_of):
    """«Тірі заттар» мен «Қалай оқу керек?»: әр әңгіме бар сабақта, комикстер comic.py тексерісінен өтеді."""
    errs = []
    if len(stories()) != 6:
        errs.append(f"«Тірі заттар»: 6 емес, {len(stories())}")
    if len(episodes()) != 7:
        errs.append(f"«Қалай оқу керек?»: 7 емес, {len(episodes())}")
    for st in stories():
        where = f"«Тірі заттар» {st['id']}"
        if lab_of.get(st["lessonId"]) != st["labId"]:
            errs.append(f"{where}: {st['labId']}/{st['lessonId']} сабағы жоқ")
            continue
        c = convert(st["comic"], st["labId"])
        errs += CX.validate(c, where) + CX.layout_errors(c, where)
    for e in episodes():
        where = f"«Қалай оқу керек?» {e['id']}"
        c = convert(e["comic"], "learn")
        errs += CX.validate(c, where) + CX.layout_errors(c, where)
        if e["id"] not in TACTIC:
            errs.append(f"{where}: AO17 тактикасы жоқ (TACTIC)")
        m = re.match(r"^/labs/([a-z]+)/([a-z0-9-]+)$", e["tool"]["href"])
        if m and lab_of.get(m.group(2)) != m.group(1):
            errs.append(f"{where}: {e['tool']['href']} сабағы жоқ")
    if re.search(r"[Ұұ]стаз", json.dumps([stories(), episodes()], ensure_ascii=False)):
        errs.append("«Тірі заттар» не «Қалай оқу керек?»: Ұстаз аталған")
    return errs

