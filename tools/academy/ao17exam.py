# © 2026 AO17 командасы. All Rights Reserved.
# AO17 CS: бағалау жүйесі - апта сынақтары, бөлім емтихандары, қорытынды емтихан және сертификат.
#   academy/exam.html        - емтихан (жабық бет: 1-бөлімнің сұрақтары CS Universe сабақтарынан, олар да жабық)
#   academy/certificate.html - сертификат (жария: қорытынды емтиханда кемінде 70% алғанда ашылады)
# Сұрақ қоры build кезінде жиналады: 1-бөлім - 12 аптаның сабақтарындағы таңдау және сандық сұрақтар (жаттығу мен
# меңгеруді бағалау), 2-бөлім - 3D зертхананың тест сұрақтары (дұрыс жауабы мен түсіндірмесімен). Тексеру браузерде.
# Режимдер (assets/js/ao17-exam.js): ?w=N - N-апта сынағы (8 сұрақ, жауаптан кейін бірден түсіндірме),
# ?part=1|2 - бөлім емтиханы (30 мин), режимсіз - қорытынды емтихан (36 сұрақ, 45 мин). Өту шегі - 70%.
import html
import json
import re

import course as CRS
import lab3d as L3

E = lambda s: html.escape(str(s), quote=True)  # noqa: E731
PASS = 70


def rich(t):
    """Сұрақ мәтіні: бәрі escape, тек `код` пен **қалың** белгіленеді (тег ешқашан тег болып өтпейді)."""
    t = E(t)
    t = re.sub(r"`([^`]+)`", r"<code>\1</code>", t)
    return re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", t)


def bank(lessons):
    """Сұрақ қоры: [{id, t (апта не зертхана), k (mc|num), q, o, a, x, w, h, l}]. lessons - барлық сабақ: 1-бөлімге тек 12 аптаның модульдері алынады."""
    by_mod = {}
    for L in lessons:
        by_mod.setdefault(L["moduleId"], []).append(L)
    items, topics, week_labs = [], {}, {}
    _, by_lab, lab_of = L3.data()
    for n, (mid, question, labs) in enumerate(CRS.WEEKS, 1):
        t = f"w{n}"
        ls = sorted(by_mod.get(mid, []), key=lambda x: x["slug"])
        if not ls:
            continue
        topics[t] = {"name": f"{n}-апта: {CRS.WEEK_SHORT.get(mid, mid)}", "href": f"{mid}/l01.html", "part": 1}
        week_labs[t] = [h for h, _ in labs if h in lab_of]
        for L in ls:
            for kind in ("exercises", "assessment"):
                for i, it in enumerate(L[kind]):
                    base = {"id": f"{mid}.{L['slug']}.{kind[0]}{i}", "t": t, "q": rich(it["q"]), "h": f"{mid}/{L['slug']}.html"}
                    if it.get("type") == "mc" and 0 <= it.get("answer", -1) < len(it.get("options", [])):
                        why = it.get("why") or []
                        items.append({**base, "k": "mc", "o": [rich(o) for o in it["options"]], "a": it["answer"],
                                      "x": rich(why[it["answer"]]) if len(why) > it["answer"] else "",
                                      "w": [rich(w) for w in why] if len(why) == len(it["options"]) else None})
                    elif it.get("type") == "number" and isinstance(it.get("answer"), (int, float)):
                        items.append({**base, "k": "num", "o": None, "a": it["answer"], "x": rich("; ".join(it.get("hints", []))), "w": None})
    labs = L3.data()[0]
    for lab in labs:
        topics[lab["id"]] = {"name": L3.LAB_KK.get(lab["id"], lab["title"]), "href": f"3d/index.html#{lab['id']}", "part": 2}
        for L in by_lab[lab["id"]]:
            for s in L.get("steps", []):
                for q in s.get("quiz", []):
                    if 0 <= q.get("answer", -1) < len(q.get("options", [])):
                        items.append({"id": f"3d.{L['id']}.{s['id']}.{q['id']}", "t": lab["id"], "k": "mc", "q": L3.inline(q["question"]),
                                      "o": [L3.inline(o) for o in q["options"]], "a": q["answer"], "x": L3.inline(q.get("explain", "")), "w": None,
                                      "h": f"3d/{lab['id']}/{L['id']}.html", "l": L["id"]})
    return {"items": items, "topics": topics, "weekLabs": week_labs, "pass": PASS}


def validate(lessons):
    """Әр аптада сынаққа жететін сұрақ (кемінде 6), әр зертханада кемінде 2 сұрақ болуы керек."""
    b = bank(lessons)
    errs = []
    count = {}
    for it in b["items"]:
        count[it["t"]] = count.get(it["t"], 0) + 1
    for t, meta in b["topics"].items():
        need = 6 if meta["part"] == 1 else 2
        if count.get(t, 0) < need:
            errs.append(f"емтихан: «{meta['name']}» бойынша сұрақ аз ({count.get(t, 0)} < {need})")
    ids = [it["id"] for it in b["items"]]
    if len(ids) != len(set(ids)):
        errs.append("емтихан: сұрақ id қайталанады")
    return errs


def exam_html(lessons, page):
    b = bank(lessons)
    n1 = sum(1 for it in b["items"] if b["topics"][it["t"]]["part"] == 1)
    n2 = len(b["items"]) - n1
    data = json.dumps(b, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
    body = f"""  <div class="layout single">
    <article class="content xm" id="main" data-ax>
      <p class="ac-crumb"><a href="course.html">AO17 CS курсы</a> / <span data-ax-crumb>Қорытынды емтихан</span></p>
      <header class="xm-head">
        <p class="xm-k" data-ax-kicker>AO17 CS · бағалау</p>
        <h1 data-ax-title>Қорытынды емтихан</h1>
        <p class="xm-lede" data-ax-lede>Курстың екі бөлімінен 36 сұрақ: әр аптадан екі, әр зертханадан бір. 45 минут. Өту шегі {PASS}%, ал нәтижең сертификатты ашады.</p>
      </header>
      <nav class="xm-modes" aria-label="Сынақ түрлері">
        <a href="exam.html" data-mode="final">Қорытынды емтихан</a><a href="exam.html?part=1" data-mode="p1">1-бөлім</a><a href="exam.html?part=2" data-mode="p2">2-бөлім</a><a href="exam.html?mix=1" data-mode="mix">Аралас жаттығу</a>
        <label class="xm-week"><span>Апта сынағы</span><select data-ax-week aria-label="Апта сынағын таңдау"><option value="">таңда</option>{"".join(f'<option value="{n}">{E(b["topics"][f"w{n}"]["name"])}</option>' for n in range(1, 13) if f"w{n}" in b["topics"])}</select></label>
      </nav>
      <section class="xm-stage" data-ax-stage aria-live="polite">
        <div class="xm-card xm-intro">
          <ul class="xm-rules" data-ax-rules></ul>
          <p class="xm-note">Сұрақ қоры: {n1} сұрақ 1-бөлімнің сабақтарынан, {n2} сұрақ 3D зертханадан. Әр жолы сұрақтар кездейсоқ таңдалады. Нәтиже осы браузерде сақталады; бет жаңартылса, сынақ тоқтаған жерінен жалғасады.</p>
          <p><button class="btn gold" type="button" data-ax-start>Бастау</button> <a class="btn secondary" href="certificate.html">Сертификат</a></p>
        </div>
      </section>
      <noscript><p>Сынақ JavaScript-пен жұмыс істейді.</p></noscript>
    </article>
  </div>
  <script type="application/json" id="xm-bank">{data}</script>"""
    return "academy/exam.html", page("academy/exam.html", "AO17 CS: апта сынақтары мен қорытынды емтихан",
                                     "AO17 CS курсының бағалауы: 12 апта сынағы, бөлім емтихандары және қорытынды емтихан. Нәтиже апта мен зертхана бойынша талданады.",
                                     body, scripts=("assets/js/ao17-exam.js",), styles=("assets/css/ao17-exam.css",))


def cert_html(lessons, page):
    """Сертификат беті (жария): қорытынды емтихан нәтижесі мен оқу прогресі осы браузерден оқылады."""
    p1 = sorted(L["id"] for L in lessons if L["moduleId"] in {m for m, _, _ in CRS.WEEKS})
    labs, by_lab, _ = L3.data()
    p2 = {L["id"]: L3.quiz_total(L) for lab in labs for L in by_lab[lab["id"]]}
    data = json.dumps({"p1": p1, "p2": p2, "pass": PASS}, ensure_ascii=False, separators=(",", ":"))
    body = f"""  <div class="layout single">
    <article class="content xm xm-certpage" id="main" data-cert>
      <p class="ac-crumb xm-noprint"><a href="course.html">AO17 CS курсы</a> / Сертификат</p>
      <section class="xm-gate xm-noprint" data-cert-gate>
        <h1>AO17 CS сертификаты</h1>
        <p>Сертификат қорытынды емтиханда кемінде {PASS}% алғанда ашылады. Емтихан курстың екі бөлімінен 36 сұрақ қояды, нәтиже осы браузерде сақталады.</p>
        <p class="xm-gate-st" data-cert-status></p>
        <p><a class="btn gold" href="exam.html">Қорытынды емтиханға өту</a> <a class="btn secondary" href="course.html">Курс бағдарламасы</a></p>
      </section>
      <section class="xm-certwrap" data-cert-ready hidden>
        <div class="xm-certtools xm-noprint">
          <label>Сертификаттағы атың <input type="text" data-cert-name maxlength="60" autocomplete="name" placeholder="Аты-жөнің"></label>
          <button class="btn gold" type="button" data-cert-print>Басып шығару / PDF</button>
        </div>
        <article class="xm-cert" aria-label="AO17 CS сертификаты">
          <div class="xm-cert-frame">
            <p class="xm-cert-org">AO17</p>
            <h1 class="xm-cert-h">Сертификат</h1>
            <p class="xm-cert-sub">Бұл сертификат</p>
            <p class="xm-cert-name" data-cert-out>Аты-жөнің</p>
            <p class="xm-cert-sub">AO17 CS: Компьютерлік ғылымға кіріспе курсының қорытынды емтиханын</p>
            <p class="xm-cert-score"><b data-cert-score>0%</b> нәтижемен тапсырғанын растайды.</p>
            <ul class="xm-cert-stats"><li><b data-cert-p1>0</b> / {len(p1)}<span>1-бөлімнің меңгерілген сабағы</span></li><li><b data-cert-p2>0</b> / {len(p2)}<span>3D зертхананың аяқталған сабағы</span></li></ul>
            <div class="xm-cert-foot"><p><span data-cert-date></span><small>күні</small></p><p class="xm-cert-seal" aria-hidden="true">AO17</p><p><span data-cert-id></span><small>нөмірі</small></p></div>
            <p class="xm-cert-note">AO17 командасы. Сертификат AO17 платформасындағы оқу нәтижесін растайды; ресми білім туралы құжат емес.</p>
          </div>
        </article>
      </section>
    </article>
  </div>
  <script type="application/json" id="cert-data">{data}</script>"""
    return "academy/certificate.html", page("academy/certificate.html", "AO17 CS сертификаты",
                                            "AO17 CS курсының сертификаты: қорытынды емтиханда кемінде 70% алғанда ашылады, басып шығаруға не PDF ретінде сақтауға болады.",
                                            body, scripts=("assets/js/ao17-exam.js",), styles=("assets/css/ao17-exam.css",))
