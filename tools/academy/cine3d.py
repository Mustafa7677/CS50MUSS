# © 2026 AO17 командасы. All Rights Reserved.
# AO17 CS 2-бөлімі (3D зертхана): әр сабақтың кино-түсіндіруі. Қозғалтқышы 1-бөліммен бір (assets/js/academy-cine.js),
# сценарийі сабақтың өз мазмұнынан құрылады (tools/academy/data/inside_lessons.json), сондықтан 160 сабақтың бәрінде бар.
# Құрылымы 1-бөлімнің әдістемесімен бірдей:
#   Сұрақ  - сабақтың «алдымен болжа» сұрағы (жоқ болса - бірінші тест сұрағы): жауапты бермей тұрып жұмбақ қою;
#   Бейне  - бірінші қадамның «Түйсік» бөлімі (тұрмыстағы ұқсастық), жоқ болса - «Идея»;
#   Болжа  - сол сұрақ: фильм тоқтайды, оқушы алдымен өзі таңдайды, сосын түсіндірме;
#   Көр    - әр қадамның «Идеясы»: сахнада қадамның атауы, коды (бар болса) мен негізгі терминдері, астында - субтитр;
#            соңында «Нақты әлемде» - бұл қайда қолданылады;
#   Түйін  - сабақтың қысқаша мазмұны және жиі қате (басқа тест сұрағының қате нұсқасы мен түсіндірмесі).
# Сахна - 640 x 300; мәтіннің негізгісі субтитрде, сахнада тек қысқа белгілер (Mayer: артық мәтін жоқ).
import re

import cine as CN

W, H = CN.W, CN.H
SH, HD, HL, UN, DM = CN.SH, CN.HD, CN.HL, CN.UN, CN.DM


def plain(md):
    """Markdown -> бір жолдық таза мәтін (субтитр үшін)."""
    t = re.sub(r"```.*?```", " ", md or "", flags=re.S)
    t = re.sub(r"^#{1,6} .*$", " ", t, flags=re.M)
    t = re.sub(r"`([^`]+)`", r"\1", t)
    t = re.sub(r"\*\*(.+?)\*\*", r"\1", t)
    t = re.sub(r"(?<![\w*])\*([^*\s][^*]*?)\*(?![\w*])", r"\1", t)
    t = re.sub(r"^\s*[-*]\s+", "", t, flags=re.M)
    t = re.sub(r"^\s*\|.*$", " ", t, flags=re.M)
    return re.sub(r"\s+", " ", t).strip()


def section(body, *names):
    """«## Аты» бөлімінің мәтіні (келесі «## »-ге дейін); бірінші табылғаны."""
    for name in names:
        m = re.search(rf"^## {re.escape(name)}\s*$(.*?)(?=^## |\Z)", body or "", flags=re.M | re.S)
        if m and m.group(1).strip():
            return m.group(1)
    return ""


def first(t, limit):
    return CN._first(t, limit)


def short(t, n):
    t = re.sub(r"\s+", " ", str(t)).strip()
    return t if len(t) <= n else t[:n - 1].rsplit(" ", 1)[0] + "…"


def terms(md, k=3):
    """Негізгі терминдер: «Идея» бөліміндегі қалың әріппен жазылғандар (қысқасы, қайталанбайтыны)."""
    out = []
    for m in re.findall(r"\*\*(.+?)\*\*", md or ""):
        x = re.sub(r"[`*]", "", m).strip(" .,:;").strip()
        if 2 <= len(x) <= 22 and x.lower() not in {o.lower() for o in out}:
            out.append(x)
    return out[:k]


def code_lines(md, k=4, width=34):
    """Қадамның бірінші код блогының алғашқы жолдары (сахнаға сыятындай қысқартылған)."""
    m = re.search(r"```[^\n]*\n(.*?)```", md or "", flags=re.S)
    if not m:
        return []
    lines = [ln.rstrip().replace("\t", "  ") for ln in m.group(1).split("\n") if ln.strip()]
    out = [ln if len(ln) <= width else ln[:width - 1] + "…" for ln in lines[:k]]
    # SVG мәтіні жолдың басындағы бос орынды жояды: шегініс бөлінбейтін бос орынмен сақталады
    return [re.sub(r"^ +", lambda m: "\u00a0" * len(m.group(0)), ln) for ln in out]


def pick_ask(L):
    """Болжам сұрағы: қадамның «predict» өрісі (оның өзі болжау үшін жазылған), жоқ болса - бірінші тест сұрағы."""
    for s in L["steps"]:
        if s.get("predict"):
            return s["predict"]
    for s in L["steps"]:
        if s.get("quiz"):
            return s["quiz"][0]
    return None


def pick_trap(L, ask):
    """Жиі қате: болжам сұрағынан басқа тест сұрағы - бірінші қате нұсқасы мен дұрыс жауабы, түсіндірмесімен."""
    for s in reversed(L["steps"]):
        for q in s.get("quiz", []):
            if q is ask or q.get("question") == (ask or {}).get("question") or len(q.get("options", [])) < 2:
                continue
            a = q["answer"]
            wrong = next((o for i, o in enumerate(q["options"]) if i != a), None)
            if not wrong:
                continue
            qs = short(plain(q["question"]), 90)
            return {"wrong": f"{qs} Жауап: «{short(plain(wrong), 40)}».", "right": short(f"«{plain(q['options'][a])}». {plain(q.get('explain', ''))}", 150)}
    return None


def story(L, lab_name, title):
    steps = L["steps"][:4]
    n = len(steps)
    ask = pick_ask(L)
    xs = [round(110 + i * (420 / max(1, n - 1))) for i in range(n)] if n > 1 else [320]
    props = [CN.text("ttl", 320, 26, short(f"{lab_name} · {title}", 48), size=18, tone="dim")]
    for i in range(1, n):
        props.append(CN.path(f"r{i}", f"M{xs[i - 1] + 20} 266H{xs[i] - 20}", tone="dim"))
    props += [CN.node(f"n{i}", xs[i], 266, str(i + 1), r=18, size=18, tone="acc") for i in range(n)]
    # сабақтың картасы (алдын ала ұйымдастырушы): әр нүктенің үстінде қадамның атауы - «Бейне» мен «Болжада» көрінеді
    gap = (xs[1] - xs[0]) if n > 1 else 600
    lim = max(10, min(22, int((gap - 36) / 8.4)))   # белгілер бір-біріне мінбейді және сахнадан шықпайды
    props += [CN.chip(f"l{i}", xs[i], 222, short(steps[i]["title"], lim), size=15, tone="dim") for i in range(n)]
    beats = []
    # Бейне: ұқсастық (Түйсік), сахнада - сабақтың қадамдарының картасы
    b0 = steps[0]["body"]
    analog = plain(section(b0, "Түйсік")) or plain(section(b0, "Идея")) or plain(b0)
    beats.append(CN.b(CN.BE, first(analog, 230), (SH, "ttl", *[f"n{i}" for i in range(n)], *[f"r{i}" for i in range(1, n)], *[f"l{i}" for i in range(n)]),
                      (DM, *[f"n{i}" for i in range(n)]), mood="happy"))
    if ask:
        why = plain(ask.get("explain", "")) or "Түсіндірмесі сабақтың өзінде."
        beats.append(CN.b(CN.BO, "", ask=(plain(ask["question"]), [short(plain(o), 60) for o in ask["options"]], ask["answer"], first(why, 220))))
    for i, s in enumerate(steps):
        body = s.get("body", "")
        idea = section(body, "Идея") or body
        lines, ts = code_lines(body), terms(idea)
        props.append(CN.chip(f"c{i}", 320, 74, short(s["title"], 30), size=24, tone="acc"))
        show = [f"c{i}"]
        if lines:
            props.append(CN.code(f"k{i}", 44, 132, lines, size=17, w=356))
            show.append(f"k{i}")
            for j, tm in enumerate(ts):
                props.append(CN.chip(f"t{i}{j}", 515, 124 + j * 42, short(tm, 18), size=17))
        else:
            gx = [320] if len(ts) == 1 else [215, 425] if len(ts) == 2 else [120, 320, 520]
            for j, tm in enumerate(ts):
                props.append(CN.chip(f"t{i}{j}", gx[j], 160, short(tm, 16), size=18))
        show += [f"t{i}{j}" for j in range(len(ts))]
        do = [(UN, *[f"n{k}" for k in range(n)]), (SH, *show), (HL, f"n{i}")] + ([(HD, *[f"l{k}" for k in range(n)])] if i == 0 else [])
        if i:
            prev = [p["id"] for p in props if re.fullmatch(rf"(c|k|t){i - 1}\d?", p["id"])]
            do = [(HD, *prev)] + do
        say = f"{i + 1}-қадам, «{short(s['title'], 60)}». {first(plain(idea), 210)}"
        beats.append(CN.b(CN.KO, say, *do, mood="happy" if i == n - 1 else None))
    world = next((plain(section(s.get("body", ""), "Нақты әлемде")) for s in reversed(L["steps"]) if section(s.get("body", ""), "Нақты әлемде")), "")
    if world:
        props.append(CN.chip("w", 320, 160, "Нақты әлемде", size=24, tone="gold"))
        last = [p["id"] for p in props if re.fullmatch(rf"(c|k|t){n - 1}\d?", p["id"])]
        beats.append(CN.b(CN.KO, "Нақты әлемде: " + first(world, 220), (HD, *last), (SH, "w"), (DM, *[f"n{k}" for k in range(n)])))
    key = short(plain(L.get("summary", "")) or title, 170)
    s = {"hook": short(plain(ask["question"]), 110) if ask else title, "props": props, "beats": beats, "key": key, "kind": "авто"}
    if ask and len(plain(ask["question"])) > 110:
        s["hookSay"] = plain(ask["question"])
    trap = pick_trap(L, ask)
    if trap:
        s["trap"] = trap
    return s


def validate(lid, s):
    """1-бөлімнің тексерісі (реквизит сахнада, әрекеттер белгілі) және 2-бөлімнің талабы: болжам сұрағы бар."""
    errs = CN.validate(lid, s)
    if not any(bt.get("ask") for bt in s["beats"]):
        errs.append(f"{lid} cine: болжам сұрағы жоқ")
    return errs
