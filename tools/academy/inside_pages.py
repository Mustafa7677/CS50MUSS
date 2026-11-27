# © 2026 AO17 командасы. All Rights Reserved.
# INSIDE TECH-тің екі бөлімі AO17-нің өз беттерінде (дерек: tools/academy/data/inside_media.json, tools/inside_media.mjs):
#   academy/journey.html - «Бір басудың саяхаты»: мекенжай жолында Enter басылғаннан бет экранда шыққанға дейінгі он аялдама (185 мс;
#     INSIDE TECH-тегідей, бір мысалдың әдеттегі мәндері: сервермен бару-қайту шамамен 40 мс).
#     Жоғарыда уақыт шкаласы (әр аялдаманың үлесі - оның миллисекунды), әр аялдамада бір сұрақ; ойнатқышы assets/js/journey.js.
#   academy/careers.html - «Кім боламын?»: жеті сұрақтық тест, сегіз IT мамандығы (бір күні, құралдары, алғашқы жоба)
#     және әрқайсысына 2-бөлімнің сабақтарынан жол; тест пен дайындық - assets/js/careers.js.
#     Тест жауаптары INSIDE TECH-пен ортақ кілтте («inside-tech:career»), мамандықтың суреті - «Тірі заттар» кейіпкері (gadgets.py).
#   academy/problems.html - «Есептер залы»: 7 қиын есеп, әрқайсысы үш қадам - маманның шешімі (шешім фильмі, inside_films.player),
#     стратегия таңдау және егіз есеп қадам-қадаммен (кеңес - бір жұлдыз); күннің есебі мен күндер қатары (assets/js/problems.js).
#   academy/cards.html - «Есте сақтау карточкалары»: 22 карточка, Лейтнердің бес жәшігі (assets/js/cards.js).
#     Жұлдыздар, күндер мен жәшіктер INSIDE TECH-пен ортақ кілттерде («inside-tech:problems», «inside-tech:cards»).
import hashlib
import html
import json

import comic as CX
import gadgets as GD
import inside_comics as IX
import inside_films as IF
import lab3d as L3

E = lambda s: html.escape(str(s), quote=True)  # noqa: E731


def media():
    return IX.media()


def lab_link(lab_id, base=""):
    return f'{base}3d/index.html#{lab_id}'


def app_href(href, base=""):
    """INSIDE TECH маршруты -> AO17 ішіндегі сілтеме. 3D қолданба тек «#атау» маршрутын түсінеді, сондықтан «?g=...» алынады."""
    if href.startswith("/labs/"):
        return IX.tool_href(href, base)
    return f"{base}3d/app/index.html#{href.strip('/').split('?')[0]}"


# ------------------------------------------------------------------ «Бір басудың саяхаты»
def journey_html(page):
    stops = media()["journey"]
    total = sum(s["ms"] for s in stops)
    t, segs, items = 0, [], []
    for k, s in enumerate(stops, 1):
        color = L3.LAB_COLOR.get(s["lab"], "#0a4c7a")
        lab = L3.LAB_KK.get(s["lab"], s["lab"])
        q = s["question"]
        opts = "".join(f'<button type="button" data-i="{i}">{E(o)}</button>' for i, o in enumerate(q["options"]))
        segs.append(f'<span class="jr-seg" data-k="{k - 1}" style="--w:{s["ms"]};--c:{color}" title="{E(s["title"])}: {s["ms"]} мс">'
                    + (f'<small>{E(s["title"])}</small>' if s["ms"] >= 15 else "") + "</span>")
        items.append(
            f'<li class="jr-stop" id="jr-{E(s["id"])}" data-k="{k - 1}" data-t="{t + s["ms"]}" style="--c:{color}">'
            f'<div class="jr-time"><b>{s["ms"]} мс</b><span>{t} → {t + s["ms"]} мс</span></div>'
            f'<div class="jr-body"><p class="jr-lab"><span>{k}-аялдама</span> · <a href="{lab_link(s["lab"])}">{E(lab)}</a></p>'
            f'<h2>{E(s["title"])}</h2><p>{E(s["text"])}</p>'
            f'<div class="jr-q" data-answer="{q["answer"]}"><p class="jr-qt">{E(q["q"])}</p>'
            f'<div class="jr-opts" role="group" aria-label="Жауап нұсқалары">{opts}</div><p class="jr-fb" role="status" aria-live="polite"></p>'
            f'<details class="jr-ans"><summary>Жауабы мен түсіндірмесі</summary><p><b>Дұрыс жауап:</b> {E(q["options"][q["answer"]])}</p>'
            f'<p>{E(q["explain"])}</p></details></div></div></li>')
        t += s["ms"]
    body = f"""  <div class="layout single">
    <article class="content jr" id="main" data-total="{total}">
      <p class="ac-crumb"><a href="course.html">AO17 CS курсы</a> / <a href="3d/index.html">2-бөлім: 3D зертхана</a> / Бір басудың саяхаты</p>
      <header class="lecture-head jr-head" style="--lc:#0a4c7a"><div class="num">INSIDE TECH · {len(stops)} аялдама</div><h1>Бір басудың саяхаты</h1>
        <p>Браузердің мекенжай жолында Enter бастың. Бет экранда пайда болғанша шамамен {total} миллисекунд өтеді. Осы уақытта сигнал он аялдамадан өтеді: пернетақта, браузер, DNS, TCP мен TLS, бұлт, дерекқор, нейрон желі және экран. Әр аялдамада бір сұрақ бар, ал оның зертханасы 2-бөлімде.</p>
        <p class="jr-prog" aria-live="polite"></p></header>
      <div class="jr-ruler" aria-hidden="true"><div class="jr-bar">{"".join(segs)}</div><p class="jr-now"><b>t = 0 мс</b><span>{total} мс</span></p></div>
      <ol class="jr-stops">{"".join(items)}</ol>
      <section class="jr-end" aria-labelledby="jr-end-h"><h2 id="jr-end-h">{total} мс: саяхат аяқталды</h2>
        <p>Бір басу он зертхананың бәрін аралап шықты. Ең ұзақ аялдамалар - желі: қол алысу, шифрлау және жауаптың қайтуы. Сондықтан сайттар серверді пайдаланушыға жақын қояды және бір қосылымды қайта қолданады.</p>
        <p><a class="btn gold" href="3d/index.html#labs">Зертханаларды ашу</a> <a class="btn secondary" href="3d/app/index.html#journey">3D-дегі фильм нұсқасы</a></p></section>
      <p class="l3-src">Аялдамалар мен сұрақтар AO17 командасының INSIDE TECH платформасынан алынған. Уақыттар - бір мысалдың әдеттегі мәндері: сервермен бару-қайту уақыты шамамен 40 мс.</p>
    </article>
  </div>"""
    return "academy/journey.html", page("academy/journey.html", "Бір басудың саяхаты: Enter-ден экранға дейін",
                                        f"Мекенжай жолында Enter басылғаннан бет экранда шыққанға дейінгі {total} миллисекунд: он аялдама, әрқайсысында бір сұрақ.",
                                        body, scripts=("assets/js/journey.js",), styles=("assets/css/lab3d.css",))


# ------------------------------------------------------------------ «Кім боламын?»
def avatar(who, color, uid):
    art = f'<rect width="200" height="230" fill="{color}"/><circle cx="100" cy="250" r="150" fill="#fff" opacity=".28"/>' + CX.actor(who, "happy", 100, .92, 1)
    return f'<svg class="cr-av" viewBox="0 0 200 230" aria-hidden="true" data-uid="{uid}">{art}</svg>'


def careers_html(page):
    d = media()
    labs, by_lab, lab_of = L3.data()
    lessons = {L["id"]: L for ls in by_lab.values() for L in ls}
    cards, nav = [], []
    for c in d["careers"]:
        road = "".join(f'<li><a href="3d/{lab_of[lid]}/{E(lid)}.html" data-lid="{E(lid)}" data-q="{L3.quiz_total(lessons[lid])}">{E(L3.kk(lessons[lid]))}</a></li>'
                       for lid in c["road"] if lid in lessons)
        day = "".join(f'<li><b>{E(x["at"])}</b> {E(x["text"])}</li>' for x in c["day"])
        nav.append(f'<li><a href="#cr-{E(c["id"])}">{E(c["title"])}</a></li>')
        cards.append(
            f'<article class="cr-card" id="cr-{E(c["id"])}" data-cr="{E(c["id"])}" style="--cc:{E(c["color"])}" aria-labelledby="cr-{E(c["id"])}-h">'
            f'<div class="cr-top">{avatar(c["who"], c["color"], c["id"])}<div><h2 id="cr-{E(c["id"])}-h">{E(c["title"])}</h2><p class="cr-tag">{E(c["tagline"])}</p>'
            f'<p class="cr-match" hidden></p></div></div>'
            f'<div class="cr-cols"><section><h3>Не істейді</h3><ul>{"".join(f"<li>{E(x)}</li>" for x in c["does"])}</ul></section>'
            f'<section><h3>Бір күні</h3><ol class="cr-day">{day}</ol></section></div>'
            f'<section><h3>Құралдары</h3><ul class="cr-tools">{"".join(f"<li>{E(x)}</li>" for x in c["tools"])}</ul></section>'
            f'<section class="cr-road"><h3>Жолы: 2-бөлімнің {len(c["road"])} сабағы <span class="cr-ready" aria-live="polite"></span></h3><ol>{road}</ol></section>'
            f'<div class="cr-cols"><section><h3>Алғашқы жобаң</h3><p>{E(c["project"])}</p></section>'
            f'<section><h3>Қайда жұмыс істейді</h3><p>{E(c["where"])}</p></section></div>'
            f'<p class="cr-play"><a class="btn secondary" href="{app_href(c["play"]["href"])}">{E(c["play"]["label"])}</a></p></article>')
    quiz = json.dumps([{"q": q["q"], "options": [{"text": o["text"], "adds": o["adds"]} for o in q["options"]]} for q in d["careerQuiz"]],
                      ensure_ascii=False).replace("</", "<\\/")
    names = json.dumps({c["id"]: c["title"] for c in d["careers"]}, ensure_ascii=False)
    body = f"""  <div class="layout single">
    <article class="content cr" id="main">
      <p class="ac-crumb"><a href="course.html">AO17 CS курсы</a> / <a href="3d/index.html">2-бөлім: 3D зертхана</a> / Кім боламын?</p>
      <header class="lecture-head cr-head" style="--lc:#7a5cd6"><div class="num">INSIDE TECH · {len(d["careers"])} мамандық</div><h1>Кім боламын?</h1>
        <p>Жеті сұраққа жауап бер: қай IT мамандығы саған жақын екенін көресің. Әр мамандықтың бір күні, құралдары, алғашқы жобасы бар, ал оған 2-бөлімнің сабақтарынан жол салынған.</p></header>
      <section class="cr-quiz" hidden aria-labelledby="cr-q-h"><h2 id="cr-q-h">Тест: жеті сұрақ</h2>
        <div class="cr-ask"><p class="cr-step"></p><p class="cr-qt" tabindex="-1"></p><div class="cr-opts" role="group" aria-label="Жауап нұсқалары"></div>
          <p><button type="button" class="btn secondary cr-back">Артқа</button></p></div>
        <div class="cr-res" hidden><p class="cr-k">Саған ең жақын</p><p class="cr-top-name" tabindex="-1"></p><ol class="cr-rank"></ol>
          <p><button type="button" class="btn secondary cr-again">Тестті қайта тапсыру</button></p></div>
        <script type="application/json" class="cr-data">{{"quiz":{quiz},"names":{names}}}</script></section>
      <nav class="cr-nav" aria-label="Мамандықтар"><ol>{"".join(nav)}</ol></nav>
      {"".join(cards)}
      <p class="l3-src">Мамандықтар мен тест AO17 командасының INSIDE TECH платформасынан алынған. Тест жауаптары INSIDE TECH-тің «Кім боламын?» бөлімімен ортақ сақталады. Жолдағы сабақ оның барлық тесті шешілгенде «өтті» деп белгіленеді.</p>
    </article>
  </div>"""
    return "academy/careers.html", page("academy/careers.html", "Кім боламын? Сегіз IT мамандығы",
                                        "Жеті сұрақтық тест және сегіз IT мамандығы: бір күні, құралдары, алғашқы жобасы және AO17 CS курсының 2-бөлімінен оған апаратын жол.",
                                        body, scripts=("assets/js/careers.js",), styles=("assets/css/lab3d.css",))


def pages(page):
    return [journey_html(page), careers_html(page), problems_html(page), cards_html(page)]


def validate():
    """Саяхаттың сұрақтары дұрыс, мамандықтардың жолындағы сабақтар бар, тест опциялары белгілі мамандықтарға ұпай қосады."""
    errs = []
    d = media()
    _, _, lab_of = L3.data()
    if len(d["journey"]) != 10:
        errs.append(f"«Бір басудың саяхаты»: 10 аялдама емес, {len(d['journey'])}")
    for s in d["journey"]:
        q = s["question"]
        if not (0 <= q["answer"] < len(q["options"])):
            errs.append(f"саяхат {s['id']}: жауап нұсқалардың сыртында")
        if s["lab"] not in L3.LAB_KK:
            errs.append(f"саяхат {s['id']}: белгісіз зертхана {s['lab']}")
    ids = {c["id"] for c in d["careers"]}
    if len(ids) != 8:
        errs.append(f"«Кім боламын?»: 8 мамандық емес, {len(ids)}")
    for c in d["careers"]:
        if c["who"] not in GD.DRAW:
            errs.append(f"мамандық {c['id']}: кейіпкер {c['who']} жоқ")
        for lid in c["road"]:
            if lid not in lab_of:
                errs.append(f"мамандық {c['id']}: жолдағы {lid} сабағы жоқ")
    if len(d["problems"]) != 7:
        errs.append(f"«Есептер залы»: 7 есеп емес, {len(d['problems'])}")
    for p in d["problems"]:
        if p["labId"] not in L3.LAB_KK:
            errs.append(f"есеп {p['id']}: белгісіз зертхана {p['labId']}")
        if len(p["strategy"]["options"]) < 2 or not p["twin"]["steps"]:
            errs.append(f"есеп {p['id']}: стратегия не егіз есеп толық емес")
        for s in p["twin"]["steps"]:
            if not isinstance(s["answer"], (int, float)) or not s.get("hint"):
                errs.append(f"есеп {p['id']}: қадамның жауабы не кеңесі жоқ")
        prev = []
        for f in p["film"]["frames"]:
            if f["board"][:len(prev)] != prev or f.get("stage") not in (0, 1, 2, 3):
                errs.append(f"есеп {p['id']}: фильмнің тақтасы не кезеңі дұрыс емес")
            prev = f["board"]
    if len(d["cards"]) != 22 or len({c["id"] for c in d["cards"]}) != 22:
        errs.append(f"карточкалар: 22 бірегей карточка емес, {len(d['cards'])}")
    if d["cardIntervals"] != [0, 0, 1, 3, 7, 14]:
        errs.append(f"карточкалар: Лейтнер аралықтары өзгерді {d['cardIntervals']} (беттің мәтінін тексер)")
    for c in d["cards"]:
        if c["lab"] not in L3.LAB_KK:
            errs.append(f"карточка {c['id']}: белгісіз зертхана {c['lab']}")
    if len(d["careerQuiz"]) != 7:
        errs.append(f"«Кім боламын?»: 7 сұрақ емес, {len(d['careerQuiz'])}")
    for k, q in enumerate(d["careerQuiz"], 1):
        if len(q["options"]) != 4:
            errs.append(f"мамандық тесті {k}-сұрақ: 4 нұсқа емес")
        for o in q["options"]:
            bad = set(o["adds"]) - ids
            if bad:
                errs.append(f"мамандық тесті {k}-сұрақ: белгісіз мамандық {sorted(bad)}")
    return errs


# ------------------------------------------------------------------ «Есептер залы» (academy/problems.html)
def _num(x, tol=None):
    """Жауаптың қазақша жазылуы: бүтін сан - бүтін, бөлшек - рұқсат етілген дәлдікке дейін, үтірмен."""
    if float(x).is_integer():
        return str(int(x))
    digits = 2 if not tol else max(0, -int(f"{tol:e}".split("e")[1]))
    return f"{x:.{digits}f}".replace(".", ",")


def _order(pid, n):
    """Стратегия нұсқаларының тұрақты аралас реті (деректе бірінші нұсқа - дұрыс): әр есепте әртүрлі, әр жүктеуде бірдей."""
    return sorted(range(n), key=lambda i: hashlib.md5(f"{pid}:{i}".encode()).hexdigest())


def problems_html(page):
    probs = media()["problems"]
    nav = "".join(f'<li><a href="#pr-{E(p["id"])}" data-pr="{E(p["id"])}"><span>{k}</span>{E(p["title"])}</a></li>' for k, p in enumerate(probs, 1))
    arts = []
    for k, p in enumerate(probs, 1):
        pid, lab = p["id"], L3.LAB_KK.get(p["labId"], p["labId"])
        film = IF.player(p["film"], uid=f"pf-{pid}", kicker="1-қадам · Талдау: маманның шешімі", heading="h3",
                         note="Алдымен маманның шешімін көр: тақтаға жол-жолымен жазылады, әр қадамның себебі астында айтылады.")
        st = p["strategy"]
        opts = "".join(f'<button type="button" data-ok="{1 if i == 0 else 0}">{E(st["options"][i])}</button>' for i in _order(pid, len(st["options"])))
        steps = []
        for j, s in enumerate(p["twin"]["steps"], 1):
            sid = f"pr-{pid}-{j}"
            unit = f'<span class="pr-unit">{E(s["unit"])}</span>' if s.get("unit") else ""
            steps.append(
                f'<li class="pr-step" data-answer="{s["answer"]!r}" data-tol="{s.get("tol", 0)!r}"><label for="{sid}">{E(s["prompt"])}</label>'
                f'<span class="pr-in"><input id="{sid}" type="text" inputmode="decimal" autocomplete="off" spellcheck="false">{unit}</span>'
                f'<span class="pr-acts"><button type="button" class="btn secondary pr-check">Тексеру</button>'
                f'<button type="button" class="pr-hint-b">Кеңес (−1 жұлдыз)</button></span>'
                f'<p class="pr-hint" hidden>{E(s["hint"])}</p><p class="pr-sfb" role="status" aria-live="polite"></p>'
                f'<details class="pr-ans"><summary>Жауабы</summary><p>{E(_num(s["answer"], s.get("tol")))} {E(s.get("unit", ""))}</p><p>{E(s["hint"])}</p></details></li>')
        arts.append(
            f'<article class="pr-p" id="pr-{E(pid)}" data-pr="{E(pid)}" style="--c:{L3.LAB_COLOR.get(p["labId"], "#0a4c7a")}" aria-labelledby="pr-{E(pid)}-h">'
            f'<p class="pr-k">{k}-есеп · <a href="3d/index.html#{E(p["labId"])}">{E(lab)}</a> · {E(", ".join(p["tags"]))}</p>'
            f'<h2 id="pr-{E(pid)}-h">{E(p["title"])}</h2><p class="pr-stars" aria-live="polite"></p><p class="pr-stmt">{E(p["statement"])}</p>'
            f'{film}<details class="pr-idea"><summary>Негізгі идея</summary><p>{E(p["idea"])}</p></details>'
            f'<section class="pr-strat" aria-labelledby="pr-{E(pid)}-s"><h3 id="pr-{E(pid)}-s">2-қадам · Стратегия</h3><p class="pr-q">{E(st["question"])}</p>'
            f'<div class="pr-opts" role="group" aria-label="Идеяның нұсқалары">{opts}</div><p class="pr-fb" role="status" aria-live="polite"></p>'
            f'<details class="pr-why"><summary>Дұрыс идея</summary><p><b>{E(st["options"][0])}.</b> {E(st["why"])}</p></details></section>'
            f'<section class="pr-twin" aria-labelledby="pr-{E(pid)}-t"><h3 id="pr-{E(pid)}-t">3-қадам · Өзің шығар: егіз есеп</h3>'
            f'<p class="pr-lock" hidden>Алдымен 2-қадамда идеяны таңда: егіз есеп сол идеямен шығады.</p>'
            f'<p class="pr-stmt">{E(p["twin"]["statement"])}</p><ol class="pr-steps">{"".join(steps)}</ol>'
            f'<p class="pr-close">{E(p["twin"]["closing"])}</p></section></article>')
    body = f"""  <div class="layout single">
    <article class="content pr" id="main">
      <p class="ac-crumb"><a href="course.html">AO17 CS курсы</a> / <a href="3d/index.html">2-бөлім: 3D зертхана</a> / Есептер залы</p>
      <header class="lecture-head pr-head" style="--lc:#a37a00"><div class="num">INSIDE TECH · {len(probs)} қиын есеп</div><h1>Есептер залы</h1>
        <p>Әр қиын есеп үш қадам: маманның шешімін фильм сияқты талда, егіз есепке қай идея керек екенін таңда, сосын өзің қадам-қадаммен шығар. Кеңес алсаң, бір жұлдыз кетеді. Күн сайын бір «бүгінгі есеп» бар: шешкен күндерің қатарға тізіледі.</p>
        <div class="pr-hud" hidden><p class="pr-daily"></p><ol class="pr-week" aria-label="Соңғы жеті күн"></ol><p class="pr-score" aria-live="polite"></p></div></header>
      <nav class="pr-nav" aria-label="Есептер"><ol>{nav}</ol></nav>
      {"".join(arts)}
      <p class="l3-src">Есептер, фильмдер мен егіз есептер AO17 командасының INSIDE TECH платформасынан алынған. Жұлдыздар мен күндер INSIDE TECH-тің «Есептер залымен» ортақ сақталады.</p>
    </article>
  </div>"""
    return "academy/problems.html", page("academy/problems.html", "Есептер залы: қиын есепті үш қадаммен",
                                         f"{len(probs)} қиын есеп: маманның шешімін фильммен талда, стратегия таңда, егіз есепті өзің шығар. Күннің есебі мен күндер қатары.",
                                         body, scripts=("assets/js/board-film.js", "assets/js/problems.js"), styles=("assets/css/lab3d.css",))


# ------------------------------------------------------------------ «Есте сақтау карточкалары» (academy/cards.html)
def cards_html(page):
    d = media()
    cards, gaps = d["cards"], d["cardIntervals"]
    labs = {c["lab"] for c in cards}
    when = ["бүгін"] + [f"{gaps[b]} күннен соң" for b in range(2, len(gaps))]
    boxes = "".join(f'<li data-box="{b}"><b>0</b><span>{b}-жәшік</span><small>{E(when[b - 1])}</small></li>' for b in range(1, len(gaps)))
    allc = "".join(f'<li><b>{E(c["front"])}</b> <span>{E(c["back"])}</span> <a href="3d/index.html#{E(c["lab"])}">{E(L3.LAB_KK.get(c["lab"], c["lab"]))}</a></li>'
                   for c in cards)
    data = json.dumps({"cards": [{"id": c["id"], "front": c["front"], "back": c["back"], "lab": L3.LAB_KK.get(c["lab"], c["lab"])} for c in cards],
                       "gaps": gaps}, ensure_ascii=False).replace("</", "<\\/")
    body = f"""  <div class="layout single">
    <article class="content cd" id="main">
      <p class="ac-crumb"><a href="course.html">AO17 CS курсы</a> / <a href="3d/index.html">2-бөлім: 3D зертхана</a> / Есте сақтау карточкалары</p>
      <header class="lecture-head cd-head" style="--lc:#1f8a70"><div class="num">INSIDE TECH · {len(cards)} карточка · {len(labs)} зертхана</div><h1>Есте сақтау карточкалары</h1>
        <p>Аралықпен қайталау: білгенің {gaps[2]}, {gaps[3]}, {gaps[4]}, {gaps[5]} күннен кейін қайтады, білмегенің бүгін қайта шығады. Карточка бес жәшік бойымен жылжиды (Лейтнер жүйесі): білсең - келесі жәшікке, білмесең - біріншіге.</p></header>
      <section class="cd-review" hidden aria-labelledby="cd-r-h"><h2 id="cd-r-h">Бүгінгі қайталау</h2><p class="cd-due" aria-live="polite"></p>
        <div class="cd-card" tabindex="-1"><p class="cd-lab"></p><p class="cd-front"></p><p class="cd-back" hidden></p></div>
        <p class="cd-acts"><button type="button" class="btn gold cd-flip">Жауабын көру</button><button type="button" class="btn secondary cd-no" hidden>Білмедім</button><button type="button" class="btn gold cd-yes" hidden>Білдім</button></p>
        <p class="cd-done" hidden></p></section>
      <section class="cd-boxes" aria-labelledby="cd-b-h"><h2 id="cd-b-h">Бес жәшік</h2><ol class="cd-box-list">{boxes}</ol></section>
      <section class="cd-all" aria-labelledby="cd-a-h"><h2 id="cd-a-h">Барлық {len(cards)} карточка</h2><ul>{allc}</ul></section>
      <p>Курстың терминдері де карточкамен жатталады: <a href="../flashcards.html">AO17 терминдер карточкалары</a>.</p>
      <script type="application/json" class="cd-data">{data}</script>
      <p class="l3-src">Карточкалар AO17 командасының INSIDE TECH платформасынан алынған. Жәшіктер INSIDE TECH-тің карточкаларымен ортақ сақталады.</p>
    </article>
  </div>"""
    return "academy/cards.html", page("academy/cards.html", "Есте сақтау карточкалары: аралықпен қайталау",
                                      f"{len(cards)} карточка {len(labs)} зертханадан: білгенің {gaps[2]}, {gaps[3]}, {gaps[4]}, {gaps[5]} күннен кейін қайтады, білмегенің бүгін қайта шығады.",
                                      body, scripts=("assets/js/cards.js",), styles=("assets/css/lab3d.css",))
