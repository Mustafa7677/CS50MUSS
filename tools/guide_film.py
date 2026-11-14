# © 2026 Sagid Mustafa. All Rights Reserved.
"""AO17 Оқулық: SAT және IELTS сабақтарына кино-түсіндіру (қозғалтқыш: assets/js/academy-cine.js).

Фильм сабақтың өз мазмұнынан құрастырылады, сондықтан әр сабақтың фильмі - өзінікі:
  Сұрақ  - hook мәтінінің басы (қызығушылық саңылауы);
  Болжа  - hook.predict: фильм тоқтайды, оқушы алдымен өзі болжайды (Predict-Observe-Explain);
  Әдіс   - method.steps: емтихан әдісі жол бойындағы аялдамалар ретінде, әр аялдамада бір әрекет;
  Мысал  - worked[0]: шарт тақтада, шешім қадам-қадаммен «жазылады», жауап жанады, соңында қақпан;
  Түйін  - summary[0] және traps[0] (жиі қате → дұрысы), оны қозғалтқыш өзі қосады.
Академияның «сахнасы» әртүрлі: SAT Math - координаттық тор, SAT R&W - мәтін беті, IELTS - ашық кітап/дыбыс толқыны.
LESSON["film"] = {"hook": ..., "props": [...], "beats": [...], "key": ..., "trap": (wrong, right)} берілсе - авторлық сценарий қолданылады.
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "academy"))
import cine as CN  # noqa: E402

_plain, _first, _sentences = CN._plain, CN._first, CN._sentences
SH, HD, MV, TX, MK, TN, HL, UN, DM = "show", "hide", "move", "text", "mark", "tone", "hl", "un", "dim"


def _short(t, n):
    t = _plain(t)
    if len(t) <= n:
        return t
    f = _first(t, n)
    return f if len(f) <= n else t[:n - 1].rsplit(" ", 1)[0] + "…"


def _decor(L):
    """Академия сахнасының фоны (күңгірт, тек атмосфера)."""
    acad, sec = L["acad"], L["section"].lower()
    if acad == "sat" and sec.startswith("math"):
        grid = "".join(f"M{x} 40V262" for x in range(100, 600, 70)) + "".join(f"M70 {y}H590" for y in range(60, 262, 50))
        return [CN.path("dg", grid, tone="dim", dash=True), CN.path("da", "M70 262H600M70 262V30", tone="dim")]
    if acad == "sat":
        lines = "".join(f"M{70 if i % 4 else 96} {64 + i * 28}H{560 - (i * 37) % 120}" for i in range(7))
        return [CN.path("dg", "M48 36h544v232H48z", tone="dim"), CN.path("da", lines, tone="dim", dash=True)]
    if "listening" in sec or "speaking" in sec:
        wave = "M40 150" + "".join(f"q{12} {(-1) ** i * (14 + (i * 7) % 30)} 24 0" for i in range(23))
        return [CN.path("dg", wave, tone="dim"), CN.path("da", "M40 150H600", tone="dim", dash=True)]
    return [CN.path("dg", "M320 52C250 30 120 34 50 56V262c70-22 200-26 270 0c70-26 200-22 270 0V56C520 34 390 30 320 52zM320 52V262", tone="dim"),
            CN.path("da", "M84 96H280M84 132H270M84 168H284M360 96H556M360 132H546M360 168H560", tone="dim", dash=True)]


def film(L):
    if L.get("film"):
        f = L["film"]
        return dict(CN.story(f["hook"], f["props"], f["beats"], f["key"], tuple(f["trap"]), hookSay=f.get("hookSay")), kind="авторлық")
    hook_txt = _plain(L["hook"]["text"])
    pr, steps, w = L["hook"]["predict"], L["method"]["steps"][:5], L["worked"][0]
    n = len(steps)
    xs = [86 + i * (468 / max(1, n - 1)) for i in range(n)]
    ys = [196 if i % 2 == 0 else 112 for i in range(n)]
    props = _decor(L) + [CN.text("ttl", 320, 34, L["title"], size=21, tone="dim", maxW=600, lines=1),
                         CN.chip("q", 320, 150, "?", size=60, tone="gold")]
    for i in range(1, n):
        x0, y0, x1, y1 = round(xs[i - 1]), ys[i - 1], round(xs[i]), ys[i]
        mx = (x0 + x1) / 2
        props.append(CN.path(f"r{i}", f"M{x0} {y0}C{mx:.0f} {y0} {mx:.0f} {y1} {x1} {y1}", tone="acc"))
    for i, s in enumerate(steps):
        props.append(CN.node(f"n{i}", round(xs[i]), ys[i], str(i + 1), r=24, tone="acc"))
        props.append(CN.text(f"m{i}", round(xs[i]), ys[i] + (46 if i % 2 == 0 else -46), _short(s["name"], 26), size=18, maxW=150, lines=2))
    props.append(CN.chip("mk", round(xs[0]), ys[0] - 40, "★", tone="gold"))
    ws = [_plain(s) for s in w["steps"]][:6]
    props += [CN.text("wt", 320, 78, _short(w["task"], 150), size=21, maxW=580, lines=3),
              CN.path("wl", "M60 122H580", tone="dim"),
              CN.text("ws", 320, 176, ws[0], size=24, maxW=560, lines=3),
              CN.cells("lad", 320 - len(ws) * 23, 232, [str(i + 1) for i in range(len(ws))], cw=46, ch=34, size=18),
              CN.chip("wa", 320, 176, _short(w["answer"], 40), size=26, tone="good"),
              CN.text("wtr", 320, 252, "Қақпан: " + _short(w["trap"], 110), size=19, maxW=580, lines=2, tone="bad")]
    beats = [CN.b("Болжа", "", (SH, "ttl", "q"), (HL, "q"), ask=(pr["q"], pr["options"], pr["answer"], _plain(pr["why"])))]
    for i, s in enumerate(steps):
        do = [(HD, "q"), (SH, "ttl", "dg", "da", f"n{i}", f"m{i}", "mk"), (MV, "mk", round(xs[i]), ys[i] - 40), (HL, f"n{i}")]
        if i:
            do += [(SH, f"r{i}"), (UN, f"n{i - 1}"), (DM, f"m{i - 1}")]
        say = f"{i + 1}-қадам: {s['name']}. {_plain(s['text'])}"
        beats.append(CN.b(L["method"]["title"][:40] if i == 0 else "Әдіс", say, *do, mood="happy" if i == n - 1 else None))
    # тарау аты бірдей болсын
    for bt in beats[1:]:
        bt["ch"] = "Әдіс"
    beats.append(CN.b("Мысал", "Енді әдісті нақты есепте көрейік. Шарт: " + _plain(w["task"]), ("clear",), (SH, "dg", "da", "wt", "wl")))
    for i, s in enumerate(ws):
        do = [(SH, "ws", "lad"), (TX, "ws", s), (MK, "lad", i)]
        beats.append(CN.b("Мысал", f"{i + 1}-қадам. {s}", *do))
    beats.append(CN.b("Мысал", "Жауап: " + _plain(w["answer"]), (HD, "ws"), (SH, "wa"), (HL, "wa"), mood="wow"))
    beats.append(CN.b("Мысал", "Қақпан: " + _plain(w["trap"]), (UN, "wa"), (SH, "wtr"), (DM, "wt"), mood="think"))
    key = _short(L["summary"][0], 170)
    t0 = L["traps"][0]
    st = CN.story(_short(hook_txt, 110), props, beats, key, (_short(t0["wrong"], 120), _short(t0["fix"], 140)), hookSay=_first(hook_txt, 300))
    st["kind"] = "авто"
    return st


def check(st, where):
    """Сценарийдің тұтастығы: әр әрекет бар реквизитке сілтейді, ask дұрыс."""
    errs, ids = [], {p["id"] for p in st["props"]} | {"_hook", "_card", "_kl", "_key", "_tl", "_bad", "_div", "_good"}
    for p in st["props"]:
        if p["type"] not in CN.TYPES:
            errs.append(f"{where}: фильм реквизиті {p['id']}: белгісіз түр {p['type']}")
    for i, bt in enumerate(st["beats"]):
        for d in bt["do"]:
            if d[0] not in CN.OPS:
                errs.append(f"{where}: фильм {i}-көрініс: белгісіз әрекет {d[0]}")
            elif d[0] in ("show", "hide", "hl", "un", "dim", "move", "text", "mark", "tone", "line", "vals"):
                tgt = d[1:] if d[0] in ("show", "hide", "hl", "un", "dim") else d[1:2]
                errs += [f"{where}: фильм {i}-көрініс: жоқ реквизит {t}" for t in tgt if t not in ids]
        a = bt.get("ask")
        if a and not (0 <= a["ans"] < len(a["opts"])):
            errs.append(f"{where}: фильм сұрағының жауабы қате")
    return errs
