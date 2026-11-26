# © 2026 AO17 командасы. All Rights Reserved.
# AO17 CS: оқу кестесі - academy/plan.html (жария бет: тек сабақ атаулары мен сілтемелері, олар курс бетінде де ашық).
# Курс бірліктері (1-бөлімнің 12 аптасы, 2-бөлімнің 11 зертханасы) мен әр сабақтың ұзақтығы build кезінде жиналады.
# Кестені браузер құрады (assets/js/ao17-plan.js): бастау күні, аптасына сағат, оқу күндері, уақыт -> әр оқу кешінің күні,
# курстың аяқталатын күні, кестеден озу/қалу, келесі оқу кеші, күнтізбе файлы (.ics, еске салғышпен).
import html
import json

import course as CRS
import lab3d as L3

E = lambda s: html.escape(str(s), quote=True)  # noqa: E731
MIN = {"quiz": 15, "part": 30, "final": 45}   # апта сынағы, бөлім емтиханы, қорытынды емтихан (минут)
HOURS = (3, 5, 8, 12)
DAYS = (("Дс", "Дүйсенбі"), ("Сс", "Сейсенбі"), ("Ср", "Сәрсенбі"), ("Бс", "Бейсенбі"), ("Жм", "Жұма"), ("Сб", "Сенбі"), ("Жс", "Жексенбі"))


def units(lessons, titles):
    """[{id, part, n, label, name, href, quiz?, lessons: [[id, сілтеме, атауы, минут(, тест саны)]]}] - курстағы ретімен."""
    by_mod = {}
    for L in lessons:
        by_mod.setdefault(L["moduleId"], []).append(L)
    out = []
    for n, (mid, _q, _labs) in enumerate(CRS.WEEKS, 1):
        ls = sorted(by_mod.get(mid, []), key=lambda x: x["slug"])
        if ls:
            out.append({"id": f"w{n}", "part": 1, "n": n, "label": f"{n}-апта", "name": titles.get(mid, CRS.WEEK_SHORT.get(mid, mid)),
                        "href": f"{mid}/l01.html", "quiz": f"exam.html?w={n}",
                        "lessons": [[L["id"], f"{mid}/{L['slug']}.html", L["title"], int(L["minutes"])] for L in ls]})
    _, by_lab, _ = L3.data()
    for no, lab in enumerate(L3.lab_summary(), 1):
        mins = {L["id"]: int(L.get("estimatedMinutes", 10)) for L in by_lab[lab["id"]]}
        out.append({"id": lab["id"], "part": 2, "n": no, "label": f"{CRS.LAB_SHORT.get(lab['id'], lab['kk'])} зертханасы", "name": lab["kk"],
                    "href": f"3d/index.html#{lab['id']}",
                    "lessons": [[q["id"], f"3d/{lab['id']}/{q['id']}.html", q["kk"], mins[q["id"]], q["quiz"]] for q in lab["lessons"]]})
    return out


def data(lessons, titles):
    us = units(lessons, titles)
    last1 = max(i for i, u in enumerate(us) if u["part"] == 1)
    exams = [{"id": "p1", "after": last1, "href": "exam.html?part=1", "t": "1-бөлім емтиханы", "m": MIN["part"]},
             {"id": "p2", "after": len(us) - 1, "href": "exam.html?part=2", "t": "2-бөлім емтиханы", "m": MIN["part"]},
             {"id": "final", "after": len(us) - 1, "href": "exam.html", "t": "Қорытынды емтихан", "m": MIN["final"]}]
    return {"units": us, "exams": exams, "quizMin": MIN["quiz"], "pass": 70, "hours": list(HOURS)}


def validate(lessons, titles):
    errs = []
    d = data(lessons, titles)
    if sum(1 for u in d["units"] if u["part"] == 1) != 12 or sum(1 for u in d["units"] if u["part"] == 2) != 11:
        errs.append("оқу кестесі: 12 апта мен 11 зертхана болуы керек")
    for u in d["units"]:
        for x in u["lessons"]:
            if not (isinstance(x[3], int) and 1 <= x[3] <= 240):
                errs.append(f"оқу кестесі: «{x[0]}» сабағының ұзақтығы дұрыс емес ({x[3]})")
            if u["part"] == 2 and not x[4]:
                errs.append(f"оқу кестесі: «{x[0]}» сабағында тест жоқ (аяқталғаны белгісіз)")
    return errs


def minutes_total(d):
    return sum(x[3] for u in d["units"] for x in u["lessons"]) + d["quizMin"] * sum(1 for u in d["units"] if u.get("quiz")) + sum(e["m"] for e in d["exams"])


def plan_html(lessons, titles, page):
    d = data(lessons, titles)
    total_h = round(minutes_total(d) / 60)
    payload = json.dumps(d, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
    hours = "".join(f'<label class="pl-chip"><input type="radio" name="hours" value="{h}"{" checked" if h == 5 else ""}><span>{h} сағат</span></label>' for h in HOURS)
    days = "".join(f'<label class="pl-chip pl-day"><input type="checkbox" name="days" value="{i}"{" checked" if i <= 5 else ""}>'
                   f'<span><b aria-hidden="true">{a}</b><span class="sr-only">{E(full)}</span></span></label>' for i, (a, full) in enumerate(DAYS, 1))
    body = f"""  <div class="layout single">
    <article class="content pl" id="main" data-plan>
      <p class="ac-crumb"><a href="course.html">AO17 CS курсы</a> / Оқу кестесі</p>
      <header class="pl-head">
        <h1>Оқу кестесі</h1>
        <p class="pl-lede">Сабақтар, апта сынақтары мен емтихандар бірге шамамен {total_h} сағат алады. Аптасына қанша уақыт бөле алатыныңды таңда: кесте әр оқу кешінің күнін есептейді, курстың қашан аяқталатынын көрсетеді және оны телефоныңның күнтізбесіне қосады.</p>
      </header>
      <form class="pl-set" data-plan-form aria-label="Кесте баптаулары">
        <label class="pl-f pl-start"><span class="pl-fl">Бастау күні</span><input type="date" name="start" required></label>
        <fieldset class="pl-f"><legend class="pl-fl">Аптасына</legend><div class="pl-chips">{hours}</div></fieldset>
        <fieldset class="pl-f"><legend class="pl-fl">Оқу күндері</legend><div class="pl-chips">{days}</div></fieldset>
        <label class="pl-f pl-time"><span class="pl-fl">Уақыты</span><input type="time" name="time" value="19:00" required></label>
      </form>
      <p class="pl-sum" data-plan-sum aria-live="polite"></p>
      <figure class="pl-rib" data-plan-rib></figure>
      <div class="pl-grid">
        <section class="pl-card pl-next" aria-labelledby="pl-next-h">
          <h2 id="pl-next-h">Келесі оқу кеші</h2>
          <div data-plan-next></div>
        </section>
        <section class="pl-card pl-ics" aria-labelledby="pl-ics-h">
          <h2 id="pl-ics-h">Күнтізбеге қосу</h2>
          <p>Әр оқу кеші күнтізбеңде өз уақытында тұрады, 15 минут бұрын еске салады. Сипаттамасында сол кештің сабақтары мен сілтемелері бар.</p>
          <p><button class="btn gold" type="button" data-plan-ics>Күнтізбе файлын жүктеу (.ics)</button></p>
          <p class="pl-note">Файлды Google Calendar (Баптаулар → Импорт), Apple Calendar не Outlook арқылы аш. Кестені өзгертсең, файлды қайта жүкте.</p>
        </section>
      </div>
      <section class="pl-agenda" aria-labelledby="pl-ag-h">
        <h2 id="pl-ag-h">Апта мен зертхана бойынша</h2>
        <div class="pl-list" data-plan-list></div>
      </section>
      <noscript><p>Кесте JavaScript-пен құрылады.</p></noscript>
    </article>
  </div>
  <script type="application/json" id="plan-data">{payload}</script>"""
    return "academy/plan.html", page("academy/plan.html", "AO17 CS: оқу кестесі",
                                     "AO17 CS курсының жеке оқу кестесі: аптасына қанша сағат бөлетініңді таңда, кесте әр сабақтың күнін есептейді және оны күнтізбеге қосады.",
                                     body, scripts=("assets/js/ao17-motion.js", "assets/js/ao17-plan.js"), styles=("assets/css/ao17-plan.css", "assets/css/ao17-motion.css"))
