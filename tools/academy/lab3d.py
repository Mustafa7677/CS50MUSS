# © 2026 AO17 командасы. All Rights Reserved.
# AO17 · 3D зертхана: INSIDE TECH (AO17 командасының 3D платформасы) сабақтарының AO17 ішіндегі лекция беттері.
# Дерек: tools/academy/data/inside_lessons.json (tools/sync_inside.py жаңартады). Әр сабақ: дәріс (Markdown), 3D симуляциядағы тапсырма,
# болжам, тест (түсіндірмесімен), кеңес, шешілген мысал, «қатені тап», өз сөзіңмен түсіндіру. INSIDE TECH-тің 44 комиксі
# (inside_comics.py) AO17 комикс қозғалтқышымен салынады және INSIDE TECH-тегідей сабақтың өз қадамында, дәрістің алдында тұрады.
# Математиканың 10 сабағында қадамның соңында «шешім фильмі» бар (inside_films.py, assets/js/board-film.js).
# Алты сабақтың соңында «Тірі заттар» комиксі бар: сабақтағы ұғымдар техниканың өз көзімен (inside_comics.story_section).
# Сабақтың басты атауы - қазақша (lab3d_kk.TITLE_KK), ағылшынша атауы астында (lang="en").
# 3D симуляцияның өзі academy/3d/app/ ішінде (бір origin: прогресс «inside-tech:*» кілттерінде ортақ).
# Бұл - AO17 CS курсының 2-бөлімі «Технологияның ішінен»: зертханалардың реті мен сабақтардың қазақша атаулары lab3d_kk.py-да.
import html
import json
import pathlib
import re

import cine as CN
import cine3d as C3
import inside_catalog as IC
import inside_comics as IX
import inside_films as IF
import lab3d_kk as KK

E = lambda s: html.escape(str(s), quote=True)  # noqa: E731
DATA = pathlib.Path(__file__).resolve().parent / "data" / "inside_lessons.json"
SHOTS = pathlib.Path(__file__).resolve().parents[2] / "academy" / "3d" / "shots"   # tools/inside_shots.py
LAB_KK = {"ai": "Жасанды интеллект", "web": "Веб-әзірлеу", "game": "Ойын әзірлеу", "net": "Компьютерлік желілер", "db": "Дерекқорлар",
          "arch": "Компьютер архитектурасы", "cloud": "Бұлт және DevOps", "sec": "Киберқауіпсіздік", "algo": "Алгоритмдер",
          "iot": "Робототехника және IoT", "math": "Математика"}
LAB_COLOR = {"ai": "#7a5cd6", "web": "#1d84a6", "game": "#b8466a", "net": "#1f8a70", "db": "#0a4c7a", "arch": "#b3262e",
             "cloud": "#3a72c4", "sec": "#2b3a5c", "algo": "#a37a00", "iot": "#2e6b4f", "math": "#6b4fb3"}
SPECIAL = {"blackbox": "«Қара жәшік»: жасырын ережені тап", "journey": "«Бір басудың саяхаты»: перне басылғаннан экранға дейін",
           "parsons": "«Ретке келтір»: код жолдарын дұрыс ретке қой"}
_cache = {}


def data():
    if "d" not in _cache:
        d = json.loads(DATA.read_text(encoding="utf-8"))
        labs = [l for l in d["labs"] if any(x["labId"] == l["id"] for x in d["lessons"])]
        labs.sort(key=lambda l: KK.ORDER.index(l["id"]) if l["id"] in KK.ORDER else len(KK.ORDER))   # курстағы ұсынылатын рет
        by_lab = {l["id"]: sorted([x["lesson"] for x in d["lessons"] if x["labId"] == l["id"]], key=lambda s: s["order"]) for l in labs}
        lab_of = {s["id"]: lab for lab, ls in by_lab.items() for s in ls}
        _cache["d"] = (labs, by_lab, lab_of)
    return _cache["d"]


def kk(L):
    """Сабақтың AO17-дегі басты атауы (қазақша; тізімде жоқ болса - өз атауы)."""
    return KK.TITLE_KK.get(L["id"], L["title"])


def en(L):
    """Сабақтың ағылшынша атауы - қазақшадан өзгеше болса ғана (терминді екі тілде тану үшін)."""
    return L["title"] if L["title"] != kk(L) else ""


def quiz_total(L):
    return sum(len(s.get("quiz", [])) for s in L.get("steps", []))


def lab_summary():
    """Курс беті үшін: әр зертхананың реті, түсі, атауы, сабақтары (id, қазақша атауы, тест саны)."""
    labs, by_lab, _ = data()
    return [{"id": lab["id"], "kk": LAB_KK.get(lab["id"], lab["title"]), "en": lab["title"], "tag": lab.get("inside", ""),
             "color": LAB_COLOR.get(lab["id"], "#0a4c7a"), "minutes": sum(L.get("estimatedMinutes", 10) for L in by_lab[lab["id"]]),
             "lessons": [{"id": L["id"], "kk": kk(L), "quiz": quiz_total(L)} for L in by_lab[lab["id"]]]} for lab in labs]


# INSIDE TECH-тің AO17-нің өз беттеріне көшкен бөлімдері: маршрут -> academy/ ішіндегі бет
NATIVE_PAGE = {"comics": "comics.html#part2", "learn": "learn.html", "journey": "journey.html", "career": "careers.html"}


def href(lesson_or_route, base="academy/"):
    """AO17 ішіндегі сілтеме (base - сілтеме тұрған беттің academy/-ге қатысты префиксі)."""
    _, _, lab_of = data()
    if lesson_or_route in lab_of:
        return f"{base}3d/{lab_of[lesson_or_route]}/{lesson_or_route}.html"
    if lesson_or_route in NATIVE_PAGE:
        return f"{base}{NATIVE_PAGE[lesson_or_route]}"
    return f"{base}3d/app/index.html#{lesson_or_route}"


# ------------------------------------------------------------------ Markdown (дәрістерде қолданылатын бөлігі)
def inline(t):
    """Дәрістегі HTML тегтері әрқашан МӘТІН болып көрінеді (олар - мысал: `<ul>`, `<script>`, модельдің `</s>` токені): ешқашан тег болмайды."""
    t = E(t)
    codes = []

    def keep(m):
        codes.append(m.group(1))
        return f"\x00{len(codes) - 1}\x00"
    t = re.sub(r"`([^`]+)`", keep, t)
    t = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", t)
    t = re.sub(r"(?<![\*\w])\*([^*\s][^*]*?)\*(?![\*\w])", r"<em>\1</em>", t)
    return re.sub(r"\x00(\d+)\x00", lambda m: "<code>" + codes[int(m.group(1))] + "</code>", t)


def md(text, hshift=1):
    lines = str(text).replace("\r", "").split("\n")
    out, i, n = [], 0, len(lines)
    special = re.compile(r"^(```|#{1,6} |> ?|\s*[-*] |\s*\d+[.)] |\|)")
    while i < n:
        ln = lines[i]
        if not ln.strip():
            i += 1
            continue
        if ln.startswith("```"):
            buf, i = [], i + 1
            while i < n and not lines[i].startswith("```"):
                buf.append(lines[i])
                i += 1
            out.append(f'<pre class="l3-pre"><code>{E(chr(10).join(buf))}</code></pre>')
            i += 1
            continue
        m = re.match(r"^(#{1,6}) (.*)$", ln)
        if m:
            lv = min(6, len(m.group(1)) + hshift)
            out.append(f"<h{lv}>{inline(m.group(2))}</h{lv}>")
            i += 1
            continue
        if ln.startswith(">"):
            buf = []
            while i < n and lines[i].startswith(">"):
                buf.append(lines[i][1:].lstrip())
                i += 1
            out.append("<blockquote>" + "".join(f"<p>{inline(b)}</p>" for b in buf if b.strip()) + "</blockquote>")
            continue
        if ln.lstrip().startswith("|"):
            rows = []
            while i < n and lines[i].lstrip().startswith("|"):
                rows.append([c.strip() for c in lines[i].strip().strip("|").split("|")])
                i += 1
            body = [r for r in rows if not all(re.fullmatch(r":?-{2,}:?", c) for c in r if c)]
            if body:
                head, rest = body[0], body[1:]
                out.append('<div class="table-wrap"><table class="l3-table"><thead><tr>' + "".join(f"<th>{inline(c)}</th>" for c in head) + "</tr></thead><tbody>"
                           + "".join("<tr>" + "".join(f"<td>{inline(c)}</td>" for c in r) + "</tr>" for r in rest) + "</tbody></table></div>")
            continue
        m = re.match(r"^\s*([-*]|\d+[.)]) (.*)$", ln)
        if m:
            ordered = m.group(1)[0].isdigit()
            items = []
            while i < n:
                mm = re.match(r"^\s*([-*]|\d+[.)]) (.*)$", lines[i])
                if not mm or (mm.group(1)[0].isdigit()) != ordered:
                    break
                items.append(mm.group(2))
                i += 1
                while i < n and lines[i].startswith("  ") and lines[i].strip() and not re.match(r"^\s*([-*]|\d+[.)]) ", lines[i]):
                    items[-1] += " " + lines[i].strip()
                    i += 1
            tag = "ol" if ordered else "ul"
            out.append(f"<{tag}>" + "".join(f"<li>{inline(x)}</li>" for x in items) + f"</{tag}>")
            continue
        buf = []
        while i < n and lines[i].strip() and not special.match(lines[i]):
            buf.append(lines[i].strip())
            i += 1
        if not buf:   # жалғыз бөлек жол (мысалы «|»-сыз) - абзац ретінде
            buf, i = [ln.strip()], i + 1
        out.append(f"<p>{inline(' '.join(buf))}</p>")
    return "\n".join(out)


# Дәрістің бөлімдері: әрқайсысы өз «қағазында» (lab3d.css: .l3-b-*). Тақырып мәтіні өзгермейді.
KIND = {"Идея": "idea", "Түйсік": "intuit", "Есептеп көрейік": "calc", "Нақты әлемде": "world", "Енді сен": "you", "Ойлан": "think",
        "Спецификация": "spec", "Автотексеруші": "check", "Абай бол": "warn", "Неге бұл маңызды": "why", "Бағасы": "why"}


def kind(title):
    t = title.strip()
    return KIND.get(t) or ("calc" if t.startswith("Есептеп көрейік") else "deep" if t.startswith("Тереңірек") else "other")


def body_html(text):
    """Дәріс (Markdown): «## » бөлімдері бөлек блоктарға оралады - Идея, Түйсік, Есептеп көрейік, Нақты әлемде, Енді сен ..."""
    parts = re.split(r"^## (.+)$", str(text).replace("\r", ""), flags=re.M)
    out = [md(parts[0], hshift=1)] if parts[0].strip() else []
    for title, content in zip(parts[1::2], parts[2::2]):
        out.append(f'<div class="l3-blk l3-b-{kind(title)}"><h3>{inline(title.strip())}</h3>{md(content, hshift=1)}</div>')
    return "\n".join(out)


def film(L, lab):
    """Кино-түсіндіру: сценарий сабақтың мазмұнынан (tools/academy/cine3d.py), қозғалтқыш - assets/js/academy-cine.js."""
    return C3.story(L, LAB_KK.get(lab["id"], lab["title"]), kk(L))


# ------------------------------------------------------------------ сабақ бетінің блоктары
def quiz_block(q, qid, kind="quiz"):
    opts = "".join(f'<button type="button" class="l3-opt" data-i="{k}">{inline(o)}</button>' for k, o in enumerate(q["options"]))
    hint = f' data-hint="{E(q["wrongHint"])}"' if q.get("wrongHint") else ""
    right = q["options"][q["answer"]] if 0 <= q.get("answer", -1) < len(q["options"]) else ""
    return (f'<div class="l3-q l3-{kind}" data-answer="{q["answer"]}" data-qid="{E(qid)}"{hint}>'
            f'<p class="l3-qt">{inline(q["question"])}</p><div class="l3-opts" role="group" aria-label="Жауап нұсқалары">{opts}</div>'
            f'<p class="l3-fb" role="status" aria-live="polite"></p>'
            f'<details class="l3-ans"><summary>Жауабы мен түсіндірмесі</summary><p><b>Дұрыс жауап:</b> {inline(right)}</p><p>{inline(q.get("explain", ""))}</p></details></div>')


def step_html(L, i, s, comic="", film=""):
    lid = L["id"]
    parts = [f'<section class="l3-step" id="s{i}" aria-labelledby="s{i}-h"><h2 id="s{i}-h"><span class="l3-n">{i}</span>{inline(s["title"])}</h2>',
             comic, f'<div class="l3-body">{body_html(s.get("body", ""))}</div>']
    objs = [o["text"] for o in s.get("objectives", []) if o.get("text")]
    if objs:
        parts.append(f'<div class="l3-task"><h3>3D симуляцияда орында</h3><ul>{"".join(f"<li>{inline(t)}</li>" for t in objs)}</ul>'
                     f'<a class="btn secondary" href="../app/index.html#{E(lid)}">Симуляцияны ашу</a></div>')
    if s.get("predict"):
        parts.append('<div class="l3-box l3-predict"><h3>Алдымен болжа</h3>' + quiz_block(s["predict"], f"{lid}:{s['id']}:predict", "pred") + "</div>")
    if s.get("hints"):
        parts.append(f'<details class="l3-hint"><summary>Кеңес</summary><ul>{"".join(f"<li>{inline(h)}</li>" for h in s["hints"])}</ul></details>')
    if s.get("worked"):
        w = s["worked"]
        parts.append(f'<div class="l3-box l3-worked"><h3>Шешілген мысал</h3><p>{inline(w["problem"])}</p><ol>'
                     + "".join(f'<li><code>{E(x["line"])}</code><span>{inline(x["why"])}</span></li>' for x in w["steps"]) + "</ol></div>")
    if s.get("hunt"):
        h = s["hunt"]
        parts.append(f'<div class="l3-box l3-hunt"><h3>Қатені тап</h3><p>{inline(h["problem"])}</p><ol class="l3-lines">'
                     + "".join(f"<li><code>{E(x)}</code></li>" for x in h["lines"])
                     + f'</ol><details class="l3-ans"><summary>Жауабы</summary><p><b>{h["wrong"] + 1}-жол қате.</b> {inline(h["why"])}</p>'
                     f'<p><b>Дұрысы:</b> <code>{E(h["fix"])}</code></p></details></div>')
    if s.get("contrast"):
        c = s["contrast"]
        col = lambda x: f'<div class="l3-cside"><h4>{inline(x["label"])}</h4><ul>{"".join(f"<li><code>{E(t)}</code></li>" for t in x["lines"])}</ul><p>{inline(x["result"])}</p></div>'  # noqa: E731
        q = {"question": c["question"], "options": c["options"], "answer": c["answer"], "explain": c.get("why", "")}
        parts.append(f'<div class="l3-box l3-contrast"><h3>{inline(c["title"])}</h3><div class="l3-cgrid">{col(c["a"])}{col(c["b"])}</div>'
                     + quiz_block(q, f"{lid}:{s['id']}:contrast", "pred") + "</div>")
    if s.get("selfExplain"):
        se = s["selfExplain"]
        parts.append(f'<div class="l3-box l3-self"><h3>Өз сөзіңмен түсіндір</h3><p>{inline(se["prompt"])}</p>'
                     f'<details class="l3-ans"><summary>Жақсы түсіндірмеде болатын ойлар</summary><ul>'
                     + "".join(f'<li>{inline(x["label"])}</li>' for x in se.get("concepts", [])) + "</ul></details></div>")
    if s.get("quiz"):
        parts.append('<div class="l3-box l3-quiz"><h3>Өзіңді тексер</h3>' + "".join(quiz_block(q, f"{lid}:{s['id']}:{q['id']}") for q in s["quiz"]) + "</div>")
    parts.append(film)   # шешім фильмі: практикадан кейін, қадамның соңында (INSIDE TECH-тегідей)
    parts.append("</section>")
    return "".join(parts)


def lesson_page(lab, L, idx, prev_l, next_l, page):
    steps = L.get("steps", [])
    nq = sum(len(s.get("quiz", [])) for s in steps)
    cx = IX.for_lesson(L["id"])
    cx_step = cx["step"] if cx else None
    bf = IF.for_lesson(L["id"])
    bf_step = bf["step"] if bf else None
    tz = IX.story_for(L["id"])   # «Тірі заттар» әңгімесі
    toc = "".join(f'<li><a href="#s{i}">{inline(s["title"])}' + (' <span class="l3-tcx">комикс</span>' if s["id"] == cx_step else "")
                  + (' <span class="l3-tcx">фильм</span>' if s["id"] == bf_step else "") + "</a></li>"
                  for i, s in enumerate(steps, 1))
    nav = ('<nav class="ac-pager" aria-label="Зертхананың сабақтары">' + (f'<a href="{E(prev_l["id"])}.html">← {E(kk(prev_l))}</a>' if prev_l else "<span></span>")
           + f'<a href="../index.html#{lab["id"]}">{E(LAB_KK.get(lab["id"], lab["title"]))}</a>'
           + (f'<a href="{E(next_l["id"])}.html">{E(kk(next_l))} →</a>' if next_l else "<span></span>") + "</nav>")
    sub = f'<p class="l3-en" lang="en">{E(en(L))}</p>' if en(L) else ""
    st = film(L, lab)
    film_tr = "".join(f"<li><b>{E(c)}.</b> {E(t)}</li>" for c, t in CN.transcript(st))
    film_json = json.dumps({"cine": st}, ensure_ascii=False).replace("</", "<\\/")
    film_html = (f'<section class="ac-cine l3-cine" id="s-film" data-cine data-title="{E(kk(L))}" data-img="../../../assets/img/" aria-label="Кино-түсіндіру: {E(kk(L))}">'
                 f'<p class="ac-note">Кино-түсіндіру: сабақтың өзегі бір минуттық мультфильмде. Мәтіні төменде.</p></section>'
                 f'<details class="cn-tr"><summary>Фильмнің мәтіні (сабақтың қадамдарынан құрастырылған)</summary><ol>{film_tr}</ol></details>'
                 f'<script type="application/json" id="cn-data">{film_json}</script>')
    cv = cover(lab["id"], "../../../")
    lab_kk = LAB_KK.get(lab["id"], lab["title"])
    cv_html = (f'<a class="l3-cov" href="../../../posters.html#cs-3d-{lab["id"]}" aria-label="«{E(lab_kk)}» зертханасының комикс-мұқабасы (афиша)">'
               f'<img src="{cv}" alt="" width="240" height="360"></a>') if cv else ""
    body = f"""  <div class="layout single">
    <article class="content l3" id="main" data-lesson="{E(L['id'])}" style="--lc:{LAB_COLOR.get(lab['id'], '#0a4c7a')};--mh:{LAB_COLOR.get(lab['id'], '#0a4c7a')}">
      <p class="ac-crumb"><a href="../../course.html">AO17 CS курсы</a> / <a href="../index.html">2-бөлім: 3D зертхана</a> / <a href="../index.html#{lab['id']}">{E(LAB_KK.get(lab['id'], lab['title']))}</a></p>
      <header class="l3-head{" l3-hc" if cv_html else ""}">{cv_html}
        <p class="l3-k">{E(LAB_KK.get(lab['id'], lab['title']))} · {idx}-сабақ · ≈{L.get('estimatedMinutes', 10)} мин · {len(steps)} қадам · {nq} сұрақ</p>
        <h1>{E(kk(L))}</h1>{sub}
        <p class="l3-lede">{inline(L.get('summary', ''))}</p>
        <p class="l3-cta"><a class="btn gold" href="../app/index.html#{E(L['id'])}">3D симуляцияны ашу</a> <a class="btn secondary" href="#s1">Дәрісті оқу</a></p>
        <p class="l3-prog" id="l3-progress" aria-live="polite"></p>
      </header>
      {film_html}
      <nav class="l3-toc" aria-label="Сабақтың қадамдары"><ol>{toc}</ol>{(f'<p class="l3-toc-x">Сабақтан кейін - «Тірі заттар» комиксі: <a href="#s-story">{E(tz["comic"]["title"])}</a></p>') if tz else ""}</nav>
      {"".join(step_html(L, i, s, IX.section(cx, lab["id"]) if s["id"] == cx_step else "", IF.section(bf) if s["id"] == bf_step else "")
               for i, s in enumerate(steps, 1))}
      {IX.story_section(tz) if tz else ""}
      <p class="l3-src">Сабақ AO17 командасының INSIDE TECH 3D платформасынан алынған: дәріс, тест және 3D симуляция - бір сабақтың бөліктері. Симуляция осы сайттың ішінде ашылады, прогресі «Менің шаңырағым» бетіне қосылады.</p>
      {nav}
    </article>
  </div>"""
    rel = f"academy/3d/{lab['id']}/{L['id']}.html"
    return rel, page(rel, f"{kk(L)} · {LAB_KK.get(lab['id'], lab['title'])}", f"AO17 CS, 2-бөлім (3D зертхана): {L.get('summary', '')}"[:300], body,
                     scripts=("assets/js/lab3d.js",) + (("assets/js/board-film.js",) if bf else ()), styles=("assets/css/lab3d.css",))


POSTERS = pathlib.Path(__file__).resolve().parents[2] / "assets" / "img" / "posters"   # tools/make_lab_posters.py


def cover(lab_id, base="../../"):
    """Зертхананың комикс-мұқабасы (240×360 кішірейтілгені), бар болса - сайт түбіне қатысты base арқылы жолы."""
    return f"{base}assets/img/posters/thumb/ao17cs-3d-{lab_id}.jpg" if (POSTERS / "thumb" / f"ao17cs-3d-{lab_id}.jpg").exists() else ""


def shot(name):
    """3D хаб суреті (tools/inside_shots.py), бар болса - academy/3d/-ге қатысты жолы."""
    return f"shots/{name}.jpg" if (SHOTS / f"{name}.jpg").exists() else ""


NATIVE = {"comics": ("../comics.html#part2", "Барлық 44 комикс AO17 бетінде: зертханалардың алғашқы сабақтары, он жанрдағы кино-комикс, математика сабақтары."),
          "learn": ("../learn.html", "Нұрай, Мустафа және Бота оқу туралы жеті танымал сенімді тексереді. Алдымен өзің болжа: миф пе, шындық па?"),
          "journey": ("../journey.html", "Мекенжай жолында Enter басылғаннан бет шыққанға дейінгі 185 мс: он аялдама, әрқайсысында бір сұрақ."),
          "career": ("../careers.html", "Жеті сұраққа жауап бер де, қай IT мамандығы саған жақын екенін, оның бір күнін және 2-бөлімнен оған апаратын жолды көр.")}


def native_art(route):
    """3D хабындағы AO17-нің өз беттерінің мұқабасы: комикстің бірінші кадры не «Тірі заттар» кейіпкерлері."""
    _, _, lab_of = data()
    if route == "learn":
        return IX.episode_cover(IX.episodes()[0])
    scene = {"journey": ("screen", [("packet", "wow", 130, 1), ("server", "happy", 275, -1)]),
             "career": ("class", [("robot", "happy", 125, 1), ("phone", "happy", 275, -1)])}.get(route)
    if not scene:
        e = IX.entries()[0]
        return IX.cover(e, lab_of[e["lesson"]])
    bgk, cast = scene
    art = IX.CX.bg(bgk, 400, "na" + route) + "".join(IX.CX.actor(w, m, x, .9, f) for w, m, x, f in cast)
    return f'<svg viewBox="0 0 400 230" aria-hidden="true">{art}</svg>'


def feature_card(route, title, desc):
    img = shot(route)
    pic = f'<img src="{img}" alt="" width="560" height="350" loading="lazy">' if img else ""
    if route in NATIVE:   # INSIDE TECH-тің бұл бөлімі AO17-нің өз бетінде
        href, desc = NATIVE[route]
        return (f'<li><a class="l3-card l3-cnat" href="{href}">{native_art(route)}'
                f'<span class="l3-ct"><b>{E(title)}</b><span>{E(desc)}</span></span></a></li>')
    return (f'<li><a class="l3-card" href="app/index.html#{E(route)}">{pic}'
            f'<span class="l3-ct"><b>{E(title)}</b><span>{E(desc)}</span></span></a></li>')


def hub_page(page):
    """2-бөлімнің хабы және INSIDE TECH-тің толық порталы: зертханалар, ойындар, комикстер, оқу құралдары, мамандық, барлық сабақ."""
    labs, by_lab, _ = data()
    n_l = sum(len(v) for v in by_lab.values())
    n_q = sum(len(s.get("quiz", [])) for v in by_lab.values() for L in v for s in L["steps"])
    secs, tiles = [], []
    for no, lab in enumerate(labs, 1):
        ls = by_lab[lab["id"]]
        name, color = LAB_KK.get(lab["id"], lab["title"]), LAB_COLOR.get(lab["id"], "#0a4c7a")
        items = "".join(f'<li><a href="{lab["id"]}/{E(L["id"])}.html" data-lid="{E(L["id"])}" data-q="{quiz_total(L)}"><b>{E(kk(L))}</b>' + (f'<i lang="en">{E(en(L))}</i>' if en(L) else "")
                        + f'<span>{inline(L.get("summary", ""))}</span><small>≈{L.get("estimatedMinutes", 10)} мин · {len(L["steps"])} қадам · {quiz_total(L)} сұрақ</small></a></li>' for L in ls)
        mins = sum(L.get("estimatedMinutes", 10) for L in ls)
        secs.append(f'<section class="l3-lab" id="{lab["id"]}" style="--lc:{color}" aria-labelledby="h-{lab["id"]}">'
                    f'<h3 id="h-{lab["id"]}"><span class="l3-no">{no}</span>{E(name)} <small lang="en">{E(lab["title"])}</small></h3>'
                    + (f'<p class="l3-tag">{E(lab["inside"])}</p>' if lab.get("inside") else "")
                    + f'<p class="l3-labn">{len(ls)} сабақ · ≈{round(mins / 60, 1):g} сағат<span class="l3-labp" aria-live="polite"></span>'
                    f' · <a href="app/index.html#{lab["id"]}">3D беті</a></p><ol class="l3-lessons">{items}</ol></section>')
        cv = cover(lab["id"])
        img = cv or shot(f"lab-{lab['id']}")
        tiles.append(f'<li style="--lc:{color}"><a class="l3-tile{" l3-tcov" if cv else ""}" href="#{lab["id"]}">'
                     + (f'<img src="{img}" alt="" width="{240 if cv else 560}" height="{360 if cv else 350}" loading="lazy">' if img else "")
                     + f'<span class="l3-tt"><span class="l3-no">{no}</span><b>{E(name)}</b><small>{len(ls)} сабақ · ≈{round(mins / 60):g} сағат</small></span></a></li>')
    groups = []
    for gid, gname, _, gdesc in IC.GROUPS:
        cards = "".join(feature_card(r, t, d) for r, g, t, d in IC.FEATURES if g == gid)
        groups.append(f'<section class="l3-feat" id="{gid}" aria-labelledby="h-{gid}"><h2 id="h-{gid}">{E(gname)}</h2><p class="l3-gi">{E(gdesc)}</p>'
                      f'<ul class="l3-cards">{cards}</ul></section>')
    home = shot("home")
    poster = "../../assets/img/posters/ao17cs-3d.jpg" if (POSTERS / "ao17cs-3d.jpg").exists() else ""
    first = f'{labs[0]["id"]}/{by_lab[labs[0]["id"]][0]["id"]}.html'
    secnav = "".join(f'<a href="#{h}">{E(t)}</a>' for h, t in [("labs", f"{len(labs)} зертхана"), *[(g, short) for g, _, short, _ in IC.GROUPS], ("all", f"{n_l} сабақ")])
    body = f"""  <div class="layout single">
    <article class="content l3 l3-hub" id="main">
      <p class="ac-crumb"><a href="../course.html">AO17 CS курсы</a> / 2-бөлім: 3D зертхана</p>
      <header class="l3-hero{" l3-hero-x" if home or poster else ""}{" l3-hero-p" if poster else ""}">
        <div class="l3-hx">
          <p class="l3-k">AO17 CS курсы · 2-бөлім</p>
          <h1>Технологияның ішінен</h1>
          <p class="l3-lede">Курстың бірінші бөлімінде логикадан жүйеге дейін жүрдің. Енді машинаның ішіне кіресің: процессордың, желінің, дерекқордың, нейрон желінің ішін 3D симуляцияда көріп, өлшейсің. INSIDE TECH-тің бәрі осы жерде: {len(labs)} зертхана, ойындар, комикстер және оқу құралдары.</p>
          <ul class="l3-stats"><li><b>{len(labs)}</b><span>зертхана</span></li><li><b>{n_l}</b><span>сабақ</span></li><li><b>{n_q}</b><span>тест сұрағы</span></li><li><b>{len(IC.FEATURES)}</b><span>ойын мен құрал</span></li></ul>
          <p class="l3-cta"><a class="btn gold" href="{first}">Бірінші сабақтан бастау</a> <a class="btn secondary" href="app/index.html">INSIDE TECH-ті толық ашу</a> <a class="btn secondary" href="../course.html#part2">Курс бағдарламасы</a></p>
        </div>
        {(f'<a class="l3-hshot l3-hpos" href="../../posters.html#cs-3d" aria-label="2-бөлімнің комикс-мұқабасы (афиша)"><img src="{poster}" alt="AO17 CS, 2-бөлімнің мұқабасы «Технологияның ішінен»: изометриялық чип ішінде ALU, кэш, жад және желі, қасында Нұрай мен Мустафа" width="1000" height="1500"></a>' if poster
          else f'<a class="l3-hshot" href="app/index.html" aria-label="INSIDE TECH басты бетін ашу"><img src="{home}" alt="INSIDE TECH басты беті: «Технологияның ішіне кір» және 3D чип" width="560" height="350"></a>' if home else "")}
      </header>
      <nav class="l3-secnav" aria-label="Хабтың бөлімдері">{secnav}</nav>
      <section class="l3-labs" id="labs" aria-labelledby="h-labs"><h2 id="h-labs">{len(labs)} зертхана</h2>
        <p class="l3-gi">Әр зертхана - 2-бөлімнің бір нөмірі. Ұсынылатын рет: архитектура мен алгоритмдер қалғанының негізі. Әр зертханада 10-15 сабақ, әр сабақта кино-түсіндіру, дәріс, тест және 3D симуляция.</p>
        <ol class="l3-tiles{" l3-rack" if cover(labs[0]["id"]) else ""}">{"".join(tiles)}</ol></section>
      {"".join(groups)}
      <section class="l3-all" id="all" aria-labelledby="h-all"><h2 id="h-all">Барлық {n_l} сабақ</h2>
        <p class="l3-gi">Сабақтың беті - толық дәріс пен тест; «3D симуляцияны ашу» батырмасы сол сабақты INSIDE TECH қолданбасында ашады. Прогресс екеуінде ортақ.</p>
        {"".join(secs)}</section>
      <p class="l3-src">Материалдар AO17 командасының INSIDE TECH 3D платформасынан алынған. AO17 нұсқасында атаулар қазақша, Ұстаз кейіпкері жоқ. Үшінші тарап кітапханаларының лицензиялары: <a href="app/THIRD-PARTY-NOTICES.txt">THIRD-PARTY-NOTICES.txt</a>.</p>
    </article>
  </div>"""
    return "academy/3d/index.html", page("academy/3d/index.html", "Технологияның ішінен: AO17 CS курсының 2-бөлімі (3D зертхана)",
                                         f"AO17 CS курсының 2-бөлімі және INSIDE TECH-тің толық порталы: {len(labs)} зертхана, {n_l} сабақ, {n_q} тест сұрағы, ойындар, комикстер, оқу құралдары.",
                                         body, scripts=("assets/js/lab3d.js",), styles=("assets/css/lab3d.css",))


def comics_shelf(base=""):
    """Комикс хабы үшін: 2-бөлімнің 44 комиксі зертханалар бойынша (мұқаба - бірінші кадр); сілтеме - сабақтың комиксі (#s-comic)."""
    labs, by_lab, _ = data()
    out = []
    for lab in labs:
        ls = by_lab[lab["id"]]
        cards = []
        for k, L in enumerate(ls, 1):
            e = IX.for_lesson(L["id"])
            if not e:
                continue
            kind = {"film": "кино-комикс", "lab": "комикс", "lesson": "комикс"}[e["kind"]]
            genre = f' · {E(e["comic"]["genre"])}' if e["kind"] == "film" and e["comic"].get("genre") else ""
            cards.append(f'<li><a class="cxh-card" href="{base}3d/{lab["id"]}/{E(L["id"])}.html#s-comic">{IX.cover(e, lab["id"])}<div class="cxh-tx">'
                         f'<p class="cxh-ep">{k}-сабақ, {kind}{genre}</p><h4>{E(e["comic"]["title"])}</h4><p>{E(IX.teaser(e))}</p></div></a></li>')
        if cards:
            name = LAB_KK.get(lab["id"], lab["title"])
            out.append(f'<section class="cxh-lab" style="--lc:{LAB_COLOR.get(lab["id"], "#0a4c7a")}" aria-labelledby="cxh-{lab["id"]}">'
                       f'<h3 id="cxh-{lab["id"]}">{E(name)} <small>{len(cards)} комикс</small></h3><ul class="cxh-grid">{"".join(cards)}</ul></section>')
    return "".join(out)


def stories_shelf(base=""):
    """Комикс хабы үшін: «Тірі заттар» (6 әңгіме) - сабақтың соңындағы комикске апарады."""
    _, by_lab, _ = data()
    cards = []
    for st in IX.stories():
        ls = by_lab[st["labId"]]
        k, L = next((k, L) for k, L in enumerate(ls, 1) if L["id"] == st["lessonId"])
        cards.append(f'<li><a class="cxh-card" href="{base}3d/{st["labId"]}/{E(L["id"])}.html#s-story">{IX.story_cover(st)}<div class="cxh-tx">'
                     f'<p class="cxh-ep">{E(LAB_KK.get(st["labId"], st["labId"]))}, {k}-сабақ</p><h4>{E(st["comic"]["title"])}</h4>'
                     f'<p>{E(st["comic"].get("tagline", ""))}</p></div></a></li>')
    return f'<ul class="cxh-grid">{"".join(cards)}</ul>'


def learn_shelf(base=""):
    """Комикс хабы үшін: «Қалай оқу керек?» (7 эпизод) - academy/learn.html-дағы эпизодқа апарады."""
    cards = "".join(f'<li><a class="cxh-card" href="{base}learn.html#ep-{E(e["id"])}">{IX.episode_cover(e)}<div class="cxh-tx">'
                    f'<p class="cxh-ep">{k}-эпизод · {E(e["tool"]["label"])}</p><h4>{E(e["comic"]["title"])}</h4><p>«{E(e["claim"])}» Миф пе, шындық па?</p></div></a></li>'
                    for k, e in enumerate(IX.episodes(), 1))
    return f'<ul class="cxh-grid">{cards}</ul>'


def pages(page):
    labs, by_lab, _ = data()
    out = [hub_page(page)]
    for lab in labs:
        ls = by_lab[lab["id"]]
        for k, L in enumerate(ls):
            out.append(lesson_page(lab, L, k + 1, ls[k - 1] if k else None, ls[k + 1] if k + 1 < len(ls) else None, page))
    return out


def validate():
    """Дерек толық па: әр сабақта қадам, әр қадамда дәріс; тест жауабының индексі нұсқалар ішінде."""
    errs = []
    labs, by_lab, _ = data()
    ids = set()
    for lab in labs:
        for L in by_lab[lab["id"]]:
            if L["id"] in ids:
                errs.append(f"3D: сабақ id қайталанады: {L['id']}")
            ids.add(L["id"])
            if not L.get("steps"):
                errs.append(f"3D {L['id']}: қадам жоқ")
            if not re.search(r"[А-Яа-яӘәҒғҚқҢңӨөҰұҮүҺһІі]", kk(L)):
                errs.append(f"3D {L['id']}: қазақша атауы жоқ (tools/academy/lab3d_kk.py: TITLE_KK)")
            errs += C3.validate(L["id"], film(L, lab))
            for s in L.get("steps", []):
                if len(s.get("body", "")) < 200:
                    errs.append(f"3D {L['id']}/{s.get('id')}: дәріс тым қысқа")
                for q in s.get("quiz", []) + ([s["predict"]] if s.get("predict") else []):
                    if not (0 <= q.get("answer", -1) < len(q.get("options", []))):
                        errs.append(f"3D {L['id']}/{s.get('id')}: тест жауабы нұсқалардың сыртында")
    _, _, lab_of = data()
    errs += IF.validate({L["id"]: [s["id"] for s in L.get("steps", [])] for ls in by_lab.values() for L in ls})
    errs += IX.validate_more(lab_of, {})
    errs += IX.validate(lab_of,
                        {L["id"]: [s["id"] for s in L.get("steps", [])] for ls in by_lab.values() for L in ls})
    return errs
