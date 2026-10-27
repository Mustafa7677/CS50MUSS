# © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама (LICENSE-PROPRIETARY.md, COPYRIGHT.md).
"""«Математика» курсының педагогикалық қабаты (tools/build.py әр жинақта шақырады, қолмен де іске қосуға болады).

Не істейді (бәрі идемпотентті, <!-- build:m... --> белгілерінің арасында):
  1. Әр дайын сабақтың басына нақты оқу ұзақтығын жазады (мәтін көлемі мен есептер санынан есептеледі, «15-20 минут» емес).
  2. «Қысқаша еске салу» бөліміне «Алдымен оқыңыз» сілтемелерін қосады (tools/math_prereq.py).
  3. Есеп деңгейлерін біріздендіреді: Жеңіл / Орташа / Күрделі.
  4. Ішкі навигацияға «Оқу жолы» мен «Емтихан» сілтемелерін қосады, сабақ соңына пән емтиханына сілтеме қояды.
  5. math/route.html (оқу жолы) мен math/exam.html (пән емтихандары) беттерін жасайды.
  6. assets/data/math-exam-<slug>.js: емтихан банкі (сабақтардың тексерілетін есептері мен қорытынды тест сұрақтары).
  7. math/index.html: әр пәннің ұзақтығы, алғышарт пәндері және емтихан сілтемесі.

Іске қосу: python3 tools/math_pedagogy.py [--check]   (--check: оқу жолы алғышарттарға қайшы емес пе, тексереді)
"""
import html
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import math_plan as P  # noqa: E402
import math_prereq as Q  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
LECT = ROOT / "math" / "lectures"
SLUGS = [s[1] for s in P.SUBJECTS]
SUBJ = {s[1]: s for s in P.SUBJECTS}
IDX = {s[1]: i for i, s in enumerate(P.SUBJECTS)}
LEVEL_KZ = {"easy": "Жеңіл", "medium": "Орташа", "hard": "Күрделі"}
# Есепке кететін уақыт (минут): бір есеп блогы деңгейі бойынша; тест; оқу жылдамдығы (математикалық мәтін, белгі/мин)
TASK_MIN = {"easy": 3, "medium": 5, "hard": 8}
QUIZ_MIN = 5
READ_CPM = 400
EXAM_TYPES = {"num", "tf", "choice", "expr", "interval", "matrix"}
STAGE = {slug: i for i, (_, _, subs) in enumerate(Q.ROUTE) for slug in subs}


def week(slug, k):
    return P.STARTS[IDX[slug]] + k - 1


def ref(n):
    i, k = P.locate(n)
    return P.SUBJECTS[i][1], k + 1


def is_soon(s):
    return "<!-- soon -->" in s


def lesson_title(n):
    i, k = P.locate(n)
    return P.SUBJECTS[i][7][k][0]


def prereqs(n):
    """Сабақтың алғышарттары (week нөмірлері): сол пәннің алдыңғы сабағы + басқа пәндерден."""
    slug, k = ref(n)
    out = [week(slug, k - 1)] if k > 1 else []
    for r in Q.PRE.get(f"{slug}:{k}", []):
        s2, k2 = r.split(":")
        out.append(week(s2, int(k2)))
    return out


def route_order():
    return [s for _, _, subs in Q.ROUTE for s in subs]


def check():
    errs = []
    order = route_order()
    if sorted(order) != sorted(SLUGS):
        errs.append(f"оқу жолында пәндер толық емес не қайталанады: {sorted(set(SLUGS) ^ set(order))}")
    for key, lst in Q.PRE.items():
        s, k = key.split(":")
        if s not in SUBJ or not 1 <= int(k) <= len(SUBJ[s][7]):
            errs.append(f"белгісіз сабақ: {key}")
        for r in lst:
            s2, k2 = r.split(":")
            if s2 not in SUBJ or not 1 <= int(k2) <= len(SUBJ[s2][7]):
                errs.append(f"{key}: белгісіз алғышарт {r}")
            elif s2 == s:
                errs.append(f"{key}: сол пәннің сабағы PRE-де жазылмайды ({r})")
    if errs:
        return errs
    pos = {s: i for i, s in enumerate(order)}
    for n in range(P.TOTAL):
        s, k = ref(n)
        for m in prereqs(n):
            s2, k2 = ref(m)
            if (pos[s2], k2) >= (pos[s], k):
                errs.append(f"{s}:{k} алғышарты {s2}:{k2} оқу жолында одан кейін тұр")
    return errs


# ---------------------------------------------------------------- ұзақтық
def plain(s):
    return html.unescape(re.sub(r"\s+", " ", re.sub(r"<script.*?</script>|</?[a-zA-Z][^>]*>", " ", s, flags=re.S))).strip()


def article(s):
    a = s.find("<article")
    return s[a:s.find("</article>", a)]


def duration(s):
    """(оқу, есептер, тест) минутпен. Оқу: есептер мен тесттен басқа мәтін; есептер: блоктар деңгейі бойынша."""
    a = article(s)
    i, j, q = a.find('<h2 id="exercises"'), a.find('<h2 id="project"'), a.find('<h2 id="quiz"')
    if min(i, j, q) < 0:
        return None
    text = plain(a[:i]) + plain(a[j:q])
    read = len(text) / READ_CPM
    ex = sum(TASK_MIN[b] for b in re.findall(r'class="badge (easy|medium|hard)"', a[i:j]))
    return read, ex, QUIZ_MIN


def rnd(m, step):
    return max(step, int(round(m / step)) * step)


def fmt_min(m):
    h, mm = divmod(int(m), 60)
    if not h:
        return f"{mm} мин"
    return f"{h} сағ" + (f" {mm} мин" if mm else "")


def lesson_minutes(s):
    d = duration(s)
    if not d:
        return None
    r, e, q = rnd(d[0], 5), rnd(d[1], 10), d[2]
    return r, e, q, rnd(r + e + q, 10)


# ---------------------------------------------------------------- блоктар
def put_block(s, name, block, anchor_re, after=True):
    """<!-- build:name -->...<!-- /build:name --> блогын ауыстырады, жоқ болса anchor_re-дің соңынан (не алдынан) қояды."""
    full = f"<!-- build:{name} -->{block}<!-- /build:{name} -->"
    pat = re.compile(rf"<!-- build:{name} -->.*?<!-- /build:{name} -->", re.S)
    if pat.search(s):
        return pat.sub(lambda _: full, s, count=1)
    m = re.search(anchor_re, s, re.S)
    if not m:
        return s
    at = m.end() if after else m.start()
    return s[:at] + full + s[at:]


def subnav(prefix, cur, slug=None):
    items = [("index.html" + (f"#subj-{SUBJ[slug][0]}" if slug else ""), "Пәндер", "home"), ("formulas.html", "Формулалар", "formulas"),
             ("glossary.html", "Сөздік", "glossary"), ("practice.html", "Жаттықтырғыш", "practice"), ("route.html", "Оқу жолы", "route"),
             ("exam.html" + (f"?s={slug}" if slug else ""), "Емтихан", "exam")]
    s = "".join(f'<a href="{prefix}{h}"' + (' aria-current="page"' if k == cur else "") + f">{t}</a>" for h, t, k in items)
    return f'<nav class="math-subnav" aria-label="Математика курсының бөлімдері">{s}</nav>'


def set_subnav(s, nav):
    return re.sub(r'<nav class="math-subnav"[^>]*>.*?</nav>', lambda _: nav, s, count=1, flags=re.S)


def ready_set():
    out = set()
    for n in range(P.TOTAL):
        p = LECT / f"week-{n}.html"
        if p.exists() and not is_soon(p.read_text(encoding="utf-8")):
            out.add(n)
    return out


def pre_html(n, ready):
    lst = prereqs(n)
    if not lst:
        return ('<div class="mx-pre"><p class="mx-pre-h">Алдымен оқыңыз</p>'
                '<p>Бұл - курстың бастапқы сабағы: орта мектептің алгебрасынан басқа ештеңе қажет емес.</p></div>')
    li = []
    for m in lst:
        s2, k2 = ref(m)
        lab = f"{SUBJ[s2][3]} · {k2}-сабақ: {lesson_title(m)}"
        li.append(f'<li><a href="week-{m}.html">{html.escape(lab, quote=False)}</a></li>' if m in ready
                  else f'<li>{html.escape(lab, quote=False)} <span class="mx-soon">жақында</span></li>')
    return ('<div class="mx-pre"><p class="mx-pre-h">Алдымен оқыңыз</p><ul>' + "".join(li) + "</ul>"
            '<p class="mx-pre-note">Бұл сабақтар таныс болса, бірден бастай беріңіз. Толық реттілік: <a href="../route.html">оқу жолы</a>.</p></div>')


def meta_html(mins):
    r, e, q, t = mins
    return (f'<p class="lecture-meta mx-meta" aria-label="Сабақтың шамамен ұзақтығы"><span>⏱ Оқу ≈ {fmt_min(r)}</span><span>Есептер ≈ {fmt_min(e)}</span>'
            f'<span>Тест ≈ {q} мин</span><span><b>Барлығы ≈ {fmt_min(t)}</b></span></p>')


def exam_link_html(n):
    slug, k = ref(n)
    last = k == len(SUBJ[slug][7])
    name = SUBJ[slug][3]
    lead = "Пәннің соңғы сабағын аяқтадыңыз." if last else "Пәнді толық өткен соң"
    return (f'<p class="callout mx-examlink"><span class="callout-title">Пән емтиханы</span>{lead} Білімді '
            f'<a href="../exam.html?s={slug}">{html.escape(name)} емтиханымен</a> тексеріңіз: барлық сабақтан автоматты тексерілетін есептер.</p>')


SUBJ_BY_NO = {x[0]: x for x in P.SUBJECTS}
# Ерте сабақтарда қалған қазақша пән атаулары («2 · Сызықтық алгебра · 3-сабақ»): тақырыпта, мета деректе, беттеу сілтемелерінде
OLD_NAMES = {1: "Жоғары математикаға дайындық", 2: "Сызықтық алгебра", 5: "Интегралдық есептеу", 6: "Көп айнымалы анализ",
             7: "Векторлық анализ", 9: "Жай дифференциалдық теңдеулер"}
OLD_NAME_RE = re.compile(r"\b(\d{1,2}) · (" + "|".join(map(re.escape, OLD_NAMES.values())) + r")(?= · )")


def split_intro(text, lead_min=160, rest_min=80):
    """Кіріспе абзацын «баннер үшін қысқа кіріспе» + «қалғаны» деп бөледі: сөйлем шекарасы бойынша, $...$ пен тег ішінен емес."""
    cuts, in_math, in_tag = [], False, False
    for i, ch in enumerate(text):
        if ch == "<":
            in_tag = True
        elif ch == ">":
            in_tag = False
        elif ch == "$" and not in_tag:
            in_math = not in_math
        elif ch in ".?!" and not in_math and not in_tag and text[i + 1:i + 2] == " " and re.match(r"[A-ZА-ЯӘҒҚҢӨҰҮҺІЁ«$]", text[i + 2:i + 3]):
            cuts.append(i + 1)
    for c in cuts:
        if len(plain(text[:c])) >= lead_min:
            rest = text[c:].strip()
            return (text[:c], rest) if len(plain(rest)) >= rest_min else (text, "")
    return text, ""


def strip_html(n, ready):
    """Пән ішіндегі сабақтар жолағы: «Number Theory: 1 2 [3] 4 5 6» (дайын емес сабақ - сілтемесіз)."""
    slug, k = ref(n)
    sb = SUBJ[slug]
    items = []
    for j in range(1, len(sb[7]) + 1):
        w = week(slug, j)
        t = html.escape(sb[7][j - 1][0])
        if j == k:
            items.append(f'<li><a href="week-{w}.html" aria-current="page" title="{t}">{j}</a></li>')
        elif w in ready:
            items.append(f'<li><a href="week-{w}.html" title="{t}">{j}</a></li>')
        else:
            items.append(f'<li><span class="soon" title="{t} · жақында">{j}</span></li>')
    return (f'<nav class="mx-strip" aria-label="{html.escape(sb[3])}: пән сабақтары"><span class="mx-strip-h">'
            f'<a href="../index.html#subj-{sb[0]}">{html.escape(sb[3])}</a></span><ol>{"".join(items)}</ol></nav>')


def fix_badges(s):
    s = s.replace('<span class="badge easy">Оңай</span>', '<span class="badge easy">Жеңіл</span>')
    return s.replace('<span class="badge hard">Қиын</span>', '<span class="badge hard">Күрделі</span>')


def apply_lesson(n, ready, minutes):
    p = LECT / f"week-{n}.html"
    s0 = s = p.read_text(encoding="utf-8")
    slug, _ = ref(n)
    s = set_subnav(s, subnav("../", "", slug))
    s = OLD_NAME_RE.sub(lambda m: SUBJ_BY_NO[int(m.group(1))][3] if OLD_NAMES.get(int(m.group(1))) == m.group(2) else m.group(0), s)
    # тақырып белгісі тек ағылшынша пән атауымен: «Precalculus · 1-сабақ» (ескі «1 · <қазақша атау> · 1-сабақ» түрі түзетіледі)
    s = re.sub(r'(<div class="lecture-head"[^>]*>\s*<div class="num">)[^<]*', lambda m: m.group(1) + html.escape(P.unit_label(n), quote=False), s, count=1)
    s = re.sub(r'<article class="content math-lesson"(?: style="--sc:#[0-9a-f]{6}")?', f'<article class="content math-lesson" style="--sc:{P.STYLE[slug][0]}"', s, count=1)
    s = put_block(s, "mstrip", strip_html(n, ready), r'<nav class="math-subnav"[^>]*>.*?</nav>')
    if n in ready:
        m = re.search(r'(<div class="lecture-head"[^>]*>.*?</h1>\s*<p>)(.*?)(</p>)', s, re.S)
        if m:
            lead, rest = split_intro(m.group(2))
            if rest:
                s = s[:m.start(2)] + lead + s[m.end(2):]
                s = put_block(s, "mintro", f'\n      <p class="mx-intro">{rest}</p>\n      ',
                              r'<div class="lecture-head"[^>]*>.*?</h1>\s*<p>.*?</p>(?:\s*<!-- build:mmeta -->.*?<!-- /build:mmeta -->)?\s*</div>')
        s = fix_badges(s)
        mins = lesson_minutes(s)
        if mins:
            minutes[n] = mins
            s = put_block(s, "mmeta", meta_html(mins), r'<div class="lecture-head"[^>]*>.*?</h1>\s*<p>.*?</p>')
        s = put_block(s, "mpre", pre_html(n, ready), r'<p class="math-prereq">.*?</p>')
        s = put_block(s, "mexam", exam_link_html(n), r'\s*<nav class="pager">', after=False)
    if s != s0:
        p.write_text(s, encoding="utf-8")


# ---------------------------------------------------------------- емтихан банкі
def exam_bank(slug, ready):
    out = []
    for k in range(1, len(SUBJ[slug][7]) + 1):
        n = week(slug, k)
        if n not in ready:
            continue
        a = article((LECT / f"week-{n}.html").read_text(encoding="utf-8"))
        i, j = a.find('<h2 id="exercises"'), a.find('<h2 id="project"')
        for m in re.finditer(r'<div class="math-ex task" data-type="(\w+)" data-id="([\w-]+)">\s*<div class="task-head"><span class="badge (\w+)">[^<]*</span>'
                             r'<h3[^>]*>(.*?)</h3>\s*(.*?)<script type="application/json" class="math-ex-data">(.*?)</script>', a[i:j], re.S):
            typ, bid, lvl, title, instr, data = m.groups()
            if typ not in EXAM_TYPES:
                continue
            ctx = re.sub(r"^\d+\.\s*", "", plain(title)) + ". " + plain(instr)
            for t, it in enumerate(json.loads(data).get("items", [])):
                it = {kk: v for kk, v in it.items() if kk not in ("hint", "sol", "v")}
                out.append({"id": f"{bid}:{t}", "l": k, "lvl": lvl, "type": it.pop("type", typ), "ctx": ctx, **it})
        for t, m in enumerate(re.finditer(r'<div class="question" data-answer="([a-d])">\s*<p class="q-text">(.*?)</p>(.*?)<p class="explain">(.*?)</p>', a, re.S)):
            ans, q, opts, ex = m.groups()
            o = [plain(x) for x in re.findall(r"<label><input[^>]*>(.*?)</label>", opts, re.S)]
            out.append({"id": f"w{n}-q{t}", "l": k, "lvl": "quiz", "type": "choice", "q": re.sub(r"^\d+\.\s*", "", plain(q)),
                        "o": o, "a": "abcd".index(ans), "e": plain(ex)})
    return out


def write_exam_data(ready):
    for slug in SLUGS:
        fp = ROOT / "assets" / "data" / f"math-exam-{slug}.js"
        bank = exam_bank(slug, ready)
        if not bank:
            if fp.exists():
                fp.unlink()
            continue
        out = (f"/* © 2026 Sagid Mustafa. All Rights Reserved. Математика курсы, {SUBJ[slug][3]} пәнінің емтихан банкі. "
               "tools/math_pedagogy.py сабақтардан жасайды: қолмен өзгертпеңіз. */\n"
               "window.CS50KZ_MATH_EXAM = window.CS50KZ_MATH_EXAM || {};\n"
               f"window.CS50KZ_MATH_EXAM.{slug} = " + json.dumps(bank, ensure_ascii=False, separators=(",", ":")) + ";\n")
        if not fp.exists() or fp.read_text(encoding="utf-8") != out:
            fp.write_text(out, encoding="utf-8")


# ---------------------------------------------------------------- беттер
def subject_hours(slug, minutes):
    """Пәннің шамамен ұзақтығы (сағ): дайын сабақтардың орташасы барлық сабаққа көбейтіледі."""
    n0 = P.STARTS[IDX[slug]]
    vals = [minutes[n][3] for n in range(n0, n0 + len(SUBJ[slug][7])) if n in minutes]
    if not vals:
        return None
    return round(sum(vals) / len(vals) * len(SUBJ[slug][7]) / 60)


def subject_pre(slug):
    """Пәнге кіру үшін қажет басқа пәндер (оның сабақтарының алғышарттарынан)."""
    out = []
    for k in range(1, len(SUBJ[slug][7]) + 1):
        for r in Q.PRE.get(f"{slug}:{k}", []):
            s2 = r.split(":")[0]
            if s2 not in out:
                out.append(s2)
    order = route_order()
    return sorted(out, key=order.index)


def page_from_template(name, title, desc, num, h1, lead, body):
    t = (ROOT / "math" / "practice.html").read_text(encoding="utf-8")
    t = t.replace("Math · Жаттықтырғыш - CS50 қазақша", f"Math · {title} - CS50 қазақша")
    t = re.sub(r'(<meta name="description" content=")[^"]*', lambda m: m.group(1) + desc, t)
    t = re.sub(r'(<meta property="og:description" content=")[^"]*', lambda m: m.group(1) + desc, t)
    t = t.replace("math/practice.html", f"math/{name}")
    t = re.sub(r'<div class="lecture-head".*?</p>\s*</div>',
               lambda _: f'<div class="lecture-head" style="--lc:#15803d">\n        <div class="num">{num}</div>\n        <h1>{h1}</h1>\n        <p>{lead}</p>\n      </div>', t, count=1, flags=re.S)
    t = set_subnav(t, subnav("", name[:-5]))
    t = re.sub(r'<div class="mx-app" id="mx-app".*?</div>\n', lambda _: body + "\n", t, count=1, flags=re.S)
    return t


def route_page(ready, minutes):
    parts = []
    for si, (title, desc, subs) in enumerate(Q.ROUTE):
        cards = []
        for slug in subs:
            s = SUBJ[slug]
            n0 = P.STARTS[IDX[slug]]
            hrs = subject_hours(slug, minutes)
            pre = subject_pre(slug)
            rd = sum(1 for k in range(len(s[7])) if n0 + k in ready)
            lis = []
            for k, (lt, _) in enumerate(s[7]):
                n = n0 + k
                lis.append(f'<li data-id="week-{n}"><a href="lectures/week-{n}.html">{html.escape(lt)}</a>' + (f' <span class="mx-rmin">{fmt_min(minutes[n][3])}</span>' if n in minutes else "") + "</li>"
                           if n in ready else f'<li data-id="week-{n}" class="soon">{html.escape(lt)} <span class="mx-soon">жақында</span></li>')
            pre_txt = ("Алдымен: " + ", ".join(f'<a href="#r-{p}">{html.escape(SUBJ[p][3])}</a>' for p in pre)) if pre else ("Алғышарт жоқ: мүлде нөлден" if slug == "arith" else "Алғышарт: орта мектеп математикасы")
            info = f"{len(s[7])} сабақ · дайын {rd}" + (f" · ≈ {hrs} сағ" if hrs else "")
            exam = f' · <a href="exam.html?s={slug}">емтихан</a>' if rd else ""
            cards.append(f'''        <section class="mx-rsubj" id="r-{slug}" data-slug="{slug}" style="--sc:{P.STYLE[slug][0]}" data-glyph="{html.escape(P.STYLE[slug][1])}">
          <h3><span class="mx-snum" aria-hidden="true">{s[0]}</span>{html.escape(s[3])}</h3>
          <p class="mx-rinfo">{info}{exam}</p>
          <p class="mx-rpre">{pre_txt}</p>
          <details class="mx-rles"><summary>Сабақтар</summary><ol>{"".join(lis)}</ol></details>
        </section>''')
        parts.append(f'''      <section class="mx-stage" id="stage-{si}" aria-labelledby="stage-{si}-h">
        <h2 id="stage-{si}-h">{html.escape(title)}</h2>
        <p>{html.escape(desc)}</p>
        <div class="mx-rgrid">
{chr(10).join(cards)}
        </div>
      </section>''')
    body = ('      <div class="mx-app" id="mx-app" data-math-app="route"><p class="mx-loading">Жүктелуде...</p></div>\n'
            '      <p>Жол реттелген: әр сабақтың алғышарттары одан бұрын тұр. Пәндер ішіндегі сабақтарды ретімен оқыңыз; '
            'кезеңдегі пәндерді көрсетілген ретпен алу ұсынылады. Ұзақтық - оқу, есептер мен тесттің шамамен уақыты; нақты уақыт дайындығыңызға байланысты.</p>\n'
            + "\n".join(parts))
    return page_from_template("route.html", "Оқу жолы", "Математика курсының оқу жолы: нөлден университет деңгейіне дейін, кезеңдер, алғышарттар және ұзақтық.",
                              "Математика · Оқу жолы", "Нөлден университет деңгейіне дейін",
                              "25 пән бес кезеңге бөлінген. Әр пәннің алғышарттары, сабақтары, шамамен ұзақтығы және емтиханы. Оқыған сабақтарыңыз белгіленеді, келесі қадам көрсетіледі.", body)


def exam_page(ready):
    have = [s for s in SLUGS if any(week(s, k) in ready for k in range(1, len(SUBJ[s][7]) + 1))]
    body = f'      <div class="mx-app" id="mx-app" data-math-app="exam" data-subjects="{",".join(have)}"><p class="mx-loading">Жүктелуде...</p></div>'
    return page_from_template("exam.html", "Пән емтихандары", "Математика пәндерінің емтихандары: барлық сабақтан автоматты тексерілетін есептер, нәтиже сабақтар бойынша.",
                              "Математика · Емтихан", "Пән емтихандары",
                              "Пәнді таңдаңыз: әр сабақтан қорытынды тест сұрағы мен орташа және күрделі есептер алынады. Жауаптар соңында бір рет тексеріледі; 70% және одан жоғары - емтихан тапсырылды.", body)


def write_if_changed(p, s):
    if not p.exists() or p.read_text(encoding="utf-8") != s:
        p.write_text(s, encoding="utf-8")


def sync_index(minutes, ready):
    p = ROOT / "math" / "index.html"
    s0 = s = p.read_text(encoding="utf-8")

    def subj(m):
        body = m.group(0)
        slug = re.search(r'data-slug="(\w+)"', body).group(1)
        hrs = subject_hours(slug, minutes)
        pre = subject_pre(slug)
        n0 = P.STARTS[IDX[slug]]
        rd = any(n0 + k in ready for k in range(len(SUBJ[slug][7])))
        bits = [("Алдымен: " + ", ".join(f'<a href="#subj-{SUBJ[x][0]}">{html.escape(SUBJ[x][3])}</a>' for x in pre)) if pre else ("Алғышарт жоқ: мүлде нөлден" if slug == "arith" else "Алғышарт: орта мектеп математикасы")]
        if hrs:
            bits.append(f"≈ {hrs} сағ")
        if rd:
            bits.append(f'<a href="exam.html?s={slug}">Пән емтиханы</a>')
        body = put_block(body, "msmeta", '<p class="mx-smeta">' + " · ".join(bits) + "</p>", r'<p class="mx-sdesc">.*?</p>')
        col, glyph = P.STYLE[slug]
        attrs = f' style="--sc:{col}" data-stage="{STAGE[slug]}" data-glyph="{html.escape(glyph)}"'
        body = re.sub(r'(class="week-card[^"]*" data-id="week-\d+"[^>]*style=")--c:#[0-9a-fA-F]{6}', lambda m_: m_.group(1) + "--c:" + col, body)
        return re.sub(r'(<section class="mx-subj"[^>]*?data-slug="\w+")(?: style="[^"]*" data-stage="\d" data-glyph="[^"]*")?', lambda m_: m_.group(1) + attrs, body, count=1)
    s = re.sub(r'<section class="mx-subj".*?</section>', subj, s, flags=re.S)
    # пәндерге өту тізімі: әр пәннің түсі
    s = re.sub(r'<li(?: style="--sc:#[0-9a-f]{6}")?><a href="#subj-(\d+)">', lambda m_: f'<li style="--sc:{P.STYLE[P.SUBJECTS[int(m_.group(1)) - 1][1]][0]}"><a href="#subj-{m_.group(1)}">', s)
    # кезең сүзгісі (math-course.js: appHome) - пәндер тізімінің алдында
    chips = '<button type="button" class="mx-fchip" data-stage="" aria-pressed="true">Барлығы</button>' + "".join(
        f'<button type="button" class="mx-fchip" data-stage="{i}" aria-pressed="false">{html.escape(t.split(":")[0])}</button>' for i, (t, _, _) in enumerate(Q.ROUTE))
    s = put_block(s, "mfilter", f'\n      <div class="mx-filter" role="group" aria-label="Пәндерді оқу жолының кезеңі бойынша сүзу">{chips}</div>\n      ',
                  r'<h2 id="weeks">.*?</h2>\s*<p>.*?</p>')
    stages = "".join(f'<li><a href="route.html#stage-{i}">{html.escape(t)}</a></li>' for i, (t, _, _) in enumerate(Q.ROUTE))
    s = put_block(s, "mroute", f'''
      <section class="mx-routebox" aria-labelledby="mroute-h">
        <h2 id="mroute-h">Нөлден бастасаңыз: оқу жолы</h2>
        <p>Пәндерді кез келген ретпен ашуға болады, бірақ математиканы нөлден үйренсеңіз, бес кезеңдік жолмен жүріңіз: әр сабақтың алғышарттары одан бұрын тұр, әр сабақта шамамен ұзақтық көрсетілген, әр пәннің соңында емтихан бар.</p>
        <ol class="mx-stages">{stages}</ol>
        <p><a class="btn" href="route.html">Оқу жолын ашу →</a></p>
      </section>
      ''', r'<nav class="math-subnav"[^>]*>.*?</nav>')
    s = s.replace("Әр пән өз алдына тәуелсіз: кез келгенін таңдап оқуға болады.", "Пәндерді кез келген ретпен ашуға болады; нөлден бастасаңыз, оқу жолын ұстаныңыз.")
    s = s.replace("Пәндер бір-бірінен тәуелсіз: кез келгенінен бастауға болады.", "Нөлден бастасаңыз, оқу жолымен жүріңіз; әр сабақта алғышарттар мен шамамен ұзақтық көрсетілген.")
    s = s.replace("17 пән: орта мектептен кейінгі негізгі математика - алгебрадан бастап есептеуге, ықтималдыққа, дискретті математикаға және оңтайландыруға дейін. Пәндерді кез келген ретпен ашуға болады; нөлден бастасаңыз, оқу жолын ұстаныңыз.",
                  "17 пән: университеттің негізгі математикасы - сызықтық алгебра мен анализден ықтималдыққа, статистикаға, сандық әдістер мен оңтайландыруға дейін.")
    s = s.replace("Пәндер бір-біріне байланбайды: кез келгенін ашып, оқи беруге болады. Қажет ұғымдар сабақтың өзінде қысқаша еске салынады. Пән атаулары ағылшынша, түсіндірме қазақша.",
                  "Кез келген пәнге бірден өтуге болады: әр пәннің астында алғышарттары, шамамен ұзақтығы және емтиханы көрсетілген. Пән атаулары ағылшынша, түсіндірме қазақша.")
    s = s.replace("<p>25 пән, әр пәнде 5-8 сабақ. Әр сабақта мақсаттар, интуиция, анықтама, теорема, қорытып шығару, қадамдық шешілген мысалдар, жиі қателер, визуализация, интерактивті есептер, қорытынды формулалар және қорытынды тест бар. Жазылып біткен сабақтар ашық, қалғандары «Жақында» белгісімен тұр.</p>",
                  "<p>25 пән, әр пәнде 5-8 сабақ: интуиция, анықтама мен теорема, қорытып шығару, шешілген мысалдар, визуализация, автоматты тексерілетін есептер және тест. Жазылып біткен сабақтар ашық, қалғандары «Жақында» белгісімен тұр.</p>")
    s = s.replace("7 пән: қатаң дәлелдеу тілімен жазылған курстар. Әр пән өз алдына тәуелсіз.", "7 пән: қатаң дәлелдеу тілімен жазылған курстар. Алғышарттары әр пәннің астында көрсетілген.")
    if 'href="route.html">Оқу жолы</a>' not in s:
        s = s.replace('<a class="btn ghost" href="practice.html">Жаттықтырғыш</a>', '<a class="btn ghost" href="practice.html">Жаттықтырғыш</a>\n            <a class="btn ghost" href="route.html">Оқу жолы</a>', 1)
    s = set_subnav(s, subnav("", "home"))
    if s != s0:
        p.write_text(s, encoding="utf-8")


def week0_minutes():
    p = LECT / "week-0.html"
    m = lesson_minutes(p.read_text(encoding="utf-8")) if p.exists() else None
    return m[3] if m else None


def main():
    errs = check()
    if errs:
        print("math_pedagogy: оқу жолы қатесі:\n  " + "\n  ".join(errs))
        return 1
    if "--check" in sys.argv:
        print("math_pedagogy: оқу жолы мен алғышарттар үйлесімді")
        return 0
    ready = ready_set()
    minutes = {}
    for n in range(P.TOTAL):
        apply_lesson(n, ready, minutes)
    write_exam_data(ready)
    write_if_changed(ROOT / "math" / "route.html", route_page(ready, minutes))
    write_if_changed(ROOT / "math" / "exam.html", exam_page(ready))
    for name in ("formulas.html", "glossary.html", "practice.html"):
        fp = ROOT / "math" / name
        write_if_changed(fp, set_subnav(fp.read_text(encoding="utf-8"), subnav("", name[:-5])))
    sync_index(minutes, ready)
    return 0


if __name__ == "__main__":
    sys.exit(main())
