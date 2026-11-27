# © 2026 AO17 командасы. All Rights Reserved.
# INSIDE TECH-тің «шешім фильмдері» AO17-нің 3D дәрістерінде: математика курсының 10 сабағы (сызықтық алгебра, аналитикалық геометрия).
# Фильм - есептің шешімі кадр-кадрымен: тақтаға жол-жолымен жазылады, астында түсіндірме (субтитр), жоғарыда Пойа жолының
# төрт кезеңі (Түсіну, Жоспар, Шешу, Тексеру). INSIDE TECH-тегідей фильм қадамның соңында, тесттен кейін тұрады:
# алдымен өзің шығарасың, сосын шешімді көресің.
# Дерек: tools/academy/data/inside_media.json, «board» (tools/inside_media.mjs). Ойнатқыш: assets/js/board-film.js.
# JS жоқ кезде де фильмнің толық мәтіні оқылады (әр кадрдың түсіндірмесі мен тақтаға жазылған жолдары).
# INSIDE TECH-те фильм 3D сахнаны да қозғайды (кинотеатр): «3D сахнамен көру» сілтемесі сабақты AO17-нің 3D қолданбасында ашады.
import html
import json
import pathlib

E = lambda s: html.escape(str(s), quote=True)  # noqa: E731
DATA = pathlib.Path(__file__).resolve().parent / "data" / "inside_media.json"
STAGES = ["Түсіну", "Жоспар", "Шешу", "Тексеру"]
_cache = {}


def entries():
    if "e" not in _cache:
        d = json.loads(DATA.read_text(encoding="utf-8"))
        _cache["e"] = [{"lesson": lid, "step": v["step"], "film": v["film"]} for lid, v in d["board"].items()]
    return _cache["e"]


def for_lesson(lid):
    return next((e for e in entries() if e["lesson"] == lid), None)


def fresh(film):
    """Әр кадрда тақтаға жаңадан жазылатын жолдар (алдыңғы кадрдың тақтасынан кейінгілері)."""
    prev, out = 0, []
    for f in film["frames"]:
        out.append(f["board"][prev:])
        prev = len(f["board"])
    return out


def player(film, uid="s-board", kicker="Шешім фильмі · практикадан кейін",
           note="Өзің шығарып болдың ба? Енді шешімді фильм сияқты көр: тақтаға жол-жолымен жазылады, әр қадамның себебі астында айтылады.",
           link="", heading="h3"):
    """Фильмнің ойнатқышы (assets/js/board-film.js) және JS-сіз оқылатын толық мәтіні. Бір бетте бірнеше фильм болса, uid әртүрлі."""
    frames = [{k: f[k] for k in ("stage", "board", "mark", "say") if k in f} for f in film["frames"]]
    data = json.dumps({"title": film["title"], "stages": STAGES, "frames": frames}, ensure_ascii=False).replace("</", "<\\/")
    route = "".join(f"<li>{E(s)}</li>" for s in STAGES)
    tr = []
    for f, new in zip(film["frames"], fresh(film)):
        lines = "".join(f"<code>{E(t)}</code>" for t in new)
        tr.append(f'<li><span class="bf-st">{E(STAGES[f["stage"]])}.</span> {E(f["say"])}' + (f'<span class="bf-lines">{lines}</span>' if lines else "") + "</li>")
    hid = "bf-h" if uid == "s-board" else f"{uid}-h"
    return (f'<div class="bf" id="{uid}" data-bf role="region" aria-labelledby="{hid}">'
            f'<div class="bf-head"><p class="bf-k">{E(kicker)}</p><{heading} class="bf-t" id="{hid}">{E(film["title"])}</{heading}></div>'
            f'<div class="bf-poster"><ol class="bf-route" aria-label="Шешу жолы">{route}</ol>'
            f'<p class="bf-note">{E(note)}</p>'
            f'<p class="bf-go"><button type="button" class="btn gold bf-start" hidden>▶ Фильмді көру</button>{(" " + link) if link else ""}</p></div>'
            f'<details class="bf-tr"><summary>Фильмнің мәтіні ({len(frames)} кадр)</summary><ol>{"".join(tr)}</ol></details>'
            f'<script type="application/json" class="bf-data">{data}</script></div>')


def section(e, base="../"):
    """Сабақ қадамының соңындағы фильм (бет: academy/3d/<зертхана>/<сабақ>.html). base - academy/3d/-ге дейінгі жол."""
    return player(e["film"], link=f'<a class="btn secondary" href="{base}app/index.html#{E(e["lesson"])}">3D сахнамен көру</a>')


def validate(steps_of):
    """Әр фильм бар сабақтың бар қадамында; кадрдың кезеңі 0-3; тақта алдыңғы кадрдың тақтасын жалғастырады;
    белгіленетін бөлік (mark) сол кадрдың тақтасында бар."""
    errs = []
    if len(entries()) != 10:
        errs.append(f"шешім фильмдері: 10 емес, {len(entries())}")
    for e in entries():
        where, film = f"шешім фильмі {e['lesson']}", e["film"]
        if e["lesson"] not in steps_of:
            errs.append(f"{where}: мұндай сабақ жоқ")
            continue
        if e["step"] not in steps_of[e["lesson"]]:
            errs.append(f"{where}: {e['step']} қадамы жоқ")
        if not film.get("frames"):
            errs.append(f"{where}: кадр жоқ")
        prev = []
        for k, f in enumerate(film.get("frames", []), 1):
            if f.get("stage") not in (0, 1, 2, 3):
                errs.append(f"{where} {k}-кадр: кезең {f.get('stage')}")
            if f["board"][:len(prev)] != prev:
                errs.append(f"{where} {k}-кадр: тақта алдыңғы кадрдың жолдарын өзгертті")
            if f.get("mark") and not any(f["mark"] in t for t in f["board"]):
                errs.append(f"{where} {k}-кадр: «{f['mark']}» тақтада жоқ")
            if not f.get("say"):
                errs.append(f"{where} {k}-кадр: түсіндірме жоқ")
            prev = f["board"]
    return errs
