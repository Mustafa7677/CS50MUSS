#!/usr/bin/env python3
# © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама (LICENSE-PROPRIETARY.md, COPYRIGHT.md).
# Harvard CS50 материалдары (олар осы файлда сақталмайды) CC BY-NC-SA 4.0 бойынша; үшінші тарап компоненттері өз лицензияларымен.
"""«Математика» курсының (math/) бастапқы беттерін жасайды. Жоспар: tools/math_plan.py (24 пән, жалпы 154 сабақ).

  python3 tools/make_math_pages.py            # жоқ беттерді жасайды (бар, дайын беттерге тиіспейді)
  python3 tools/make_math_pages.py --index    # math/index.html-ді қайта жазады (жоспар өзгергенде)
  python3 tools/make_math_pages.py --refresh  # тек <!-- soon --> тұғырларын қайта жазады
  python3 tools/make_math_pages.py --skeleton 12   # week-12 үшін толық сабақ қаңқасын (мазмұн агенттеріне) stdout-қа басады
  python3 tools/make_math_pages.py --force    # БАРЛЫҚ жасалатын беттерді қайта жазады (мазмұнды өшіреді! қолданбаңыз)

Жасайтындары: math/index.html, math/formulas.html, math/glossary.html, math/practice.html, math/lectures/week-0..153.html тұғырлары
(<!-- soon -->), assets/data/math-{formulas,terms,problems}-<slug>.js бос файлдары (жоқ болса). Дайын сабақ беттері (белгісіз) ЕШҚАШАН қайта жазылмайды.
Содан кейін:  python3 tools/build.py
"""
import html
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import math_plan as P  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
MATH = ROOT / "math"
COLOR, COLOR2, GLOW = "#15803d", "#14532d", "rgb(74 222 128 / .28)"
SOON = "<!-- soon -->"

OWN_NOTE = ('Бұл курс - Sagid Mustafa-ның авторлық оқу материалы: Harvard CS50 курсының аудармасы емес, одан мәтін алынбаған. '
            'Математиканың өзі (анықтамалар, теоремалар, формулалар) жалпыға ортақ білім; ал баяндау, мысалдар мен есептер өз сөзімізбен жазылған және '
            'белгілі оқулықтар мен есептер жинақтарынан көшірілмеген. © 2026 Sagid Mustafa, барлық құқықтар қорғалған. {a}Авторлық құқық және лицензиялар</a>.')
AI_NOTE = ('<b>Назар аударыңыз.</b> Бұл курстың мазмұны жасанды интеллект көмегімен дайындалған, сондықтан оны тәжірибелі математик-оқытушымен тексеріп алған жөн. '
           'Формулалар мен дәлелдеулерді өз бетіңізбен де қайталап тексеріңіз. Бұл курс ресми емтихан, куәлік не диплом баламасы емес және оған сертификат берілмейді.')

SUBJ = [dict(no=s[0], slug=s[1], kz=s[2], en=s[3], group=s[4], pre=s[5], desc=s[6], lessons=s[7], start=P.STARTS[i], count=len(s[7])) for i, s in enumerate(P.SUBJECTS)]


def a(s):
    return html.escape(s, quote=True)


def subj_of(n):
    i, k = P.locate(n)
    return SUBJ[i], k


# ---------------------------------------------------------------- ортақ бөліктер
FONT = ('  <link rel="preconnect" href="https://fonts.googleapis.com">\n'
        '  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Unbounded:wght@500;700;800&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;700&display=swap">')


def head(title, desc, prefix, *, katex=False, plan=False, viz=False, engine=False, noindex=False):
    css = f'  <link rel="stylesheet" href="{prefix}assets/css/style.css">\n'
    if katex:
        css += f'  <link rel="stylesheet" href="{prefix}assets/vendor/katex/katex.min.css">\n'
    if katex or engine or plan:
        css += f'  <link rel="stylesheet" href="{prefix}assets/css/math-course.css">\n'
    js = f'  <script src="{prefix}assets/js/main.js"></script>\n'
    if katex:
        js += f'  <script defer src="{prefix}assets/vendor/katex/katex.min.js"></script>\n  <script defer src="{prefix}assets/vendor/katex/auto-render.min.js"></script>\n'
    if plan:
        js += f'  <script defer src="{prefix}math/data/plan.js"></script>\n'
    if katex or engine or plan:
        js += f'  <script defer src="{prefix}assets/js/math-course.js"></script>\n'
    if viz:
        js += f'  <script defer src="{prefix}assets/js/math-viz.js"></script>\n'
    robots = '\n  <meta name="robots" content="noindex">' if noindex else ""
    return f'''<!DOCTYPE html>
<html lang="kk">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{a(title)}</title>
  <!-- build:head -->
  <!-- /build:head -->
  <meta name="description" content="{a(desc)}">{robots}
  <meta name="author" content="Sagid Mustafa">
{FONT}
{css.rstrip()}
{js.rstrip()}
</head>
'''


def shell(prefix):
    return f'''<body data-license="B" data-course="math">
  <a class="skip-link" href="#main">Мазмұнға өту</a>
  <header class="topbar">
    <div class="topbar-inner">
      <a class="brand" href="{prefix}index.html">CS50 <span>қазақша</span></a>
      <nav class="nav"></nav>
    </div>
  </header>
'''


FOOT = '''
  <footer class="footer"></footer>
</body>
</html>
'''


def subnav(prefix, cur):
    items = [("index.html", "Пәндер", "home"), ("formulas.html", "Формулалар", "formulas"), ("glossary.html", "Сөздік", "glossary"), ("practice.html", "Жаттықтырғыш", "practice")]
    s = "".join(f'<a href="{prefix}{h}"' + (' aria-current="page"' if k == cur else "") + f">{t}</a>" for h, t, k in items)
    return f'<nav class="math-subnav" aria-label="Математика курсының бөлімдері">{s}</nav>'


def lesson_label(n):
    return P.unit_label(n)


def subj_h(s):
    return f'{s["no"]}. {s["en"]}'


# ---------------------------------------------------------------- курс беті
def card(n):
    s, k = subj_of(n)
    t, d = s["lessons"][k]
    return f'''        <div class="week-card soon" data-id="week-{n}" style="--c:{COLOR}">
          <div class="num">{k + 1}-сабақ</div>
          <h3>{a(t)}</h3>
          <p>{a(d)}</p>
          <div class="status">Жақында</div>
        </div>'''


def subject_block(s):
    cards = "\n".join(card(s["start"] + k) for k in range(s["count"]))
    return f'''      <section class="mx-subj" id="subj-{s["no"]}" data-subj="{s["no"]}" data-slug="{s["slug"]}" aria-labelledby="s{s["no"]}-h">
        <div class="mx-shead">
          <h3 id="s{s["no"]}-h"><span class="mx-snum" aria-hidden="true">{s["no"]}</span>{a(s["en"])}</h3>
          <div class="mx-sstat"><span>Дайын: <b class="mx-sready">0</b> / жоспар: <b class="mx-splan">{s["count"]}</b></span><span>оқылды: <b class="mx-sread">0</b></span></div>
        </div>
        <div class="mx-sbar" aria-hidden="true"><i></i></div>
        <p class="mx-sdesc">{a(s["desc"])}</p>
        <div class="weeks course-weeks">
{cards}
        </div>
      </section>'''


def index_page():
    switch = ('<nav class="cx-switch" aria-label="Курсты таңдау"><a href="../index.html">CS50x</a><a href="../python/">CS50P</a><a href="../sql/">SQL</a>'
              '<a href="../ai/">AI</a><a href="../web/">Web</a><a href="../cpp/">C++</a><a href="../java/">Java</a><a href="../en/">English</a>'
              '<a class="on" aria-current="page" href="../math/">Math</a></nav>')
    groups = []
    for g, gname, gdesc in (("H", P.GROUPS["H"], "17 пән: орта мектептен кейінгі негізгі математика - алгебрадан бастап есептеуге, ықтималдыққа, дискретті математикаға және оңтайландыруға дейін. Әр пән өз алдына тәуелсіз: кез келгенін таңдап оқуға болады."),
                            ("A", P.GROUPS["A"], "7 пән: қатаң дәлелдеу тілімен жазылған курстар. Әр пән өз алдына тәуелсіз.")):
        blocks = "\n".join(subject_block(s) for s in SUBJ if s["group"] == g)
        groups.append(f'''      <h2 class="mx-group-h" id="group-{g.lower()}">{gname}</h2>
      <p>{gdesc}</p>
{blocks}''')
    tools = [("formulas.html", "Формулалар анықтамалығы", "Пән бойынша формулалар, іздеу, шарттары мен сабаққа сілтеме. Формулалар KaTeX-пен көрсетіледі."),
             ("glossary.html", "Математика сөздігі", "Терминдер қазақша мен ағылшынша: қысқа анықтама және қай сабақта түсіндірілгені."),
             ("practice.html", "Жаттықтырғыш", "Кездейсоқ коэффициентті есептер: пән мен қиындықты таңдап, серия шешіңіз. Әр сайын жаңа сандар.")]
    jump = "".join(f'<li><a href="#subj-{x["no"]}">{a(x["en"])}</a></li>' for x in SUBJ)
    tool_html = "\n".join(f'        <a class="oc-card en-tool-card" href="{h}"><h3>{t}</h3><p>{d}</p></a>' for h, t, d in tools)
    return head("Math: Математика - CS50 қазақша",
                "Математика: авторлық қазақша курс. 24 пән: Linear Algebra, Calculus, Probability Theory, Discrete Mathematics, Number Theory, Topology және т.б. Қорытып шығарулар, шешілген мысалдар, интерактивті есептер.",
                "../", katex=False, plan=True) + shell("../") + f'''
  <div class="layout single wide">
    <article class="content course-home own-course math-course" id="main">
      <section class="py-hero oc-hero" data-c="math" style="--hc:{COLOR};--hc2:{COLOR2};--hglow:{GLOW}">
        <div class="py-hero-text">
          {switch}
          <span class="cx-eyebrow">Авторлық курс · Sagid Mustafa</span>
          <h1>Математика <span>24 пән</span></h1>
          <p>Жоғары математиканы нөлден бастап түсіндіріп оқыңыз: теория, анықтама, теорема, формулаларды қорытып шығару, қадамдық шешілген мысалдар, интерактивті есептер мен визуализация. Пәндер бір-бірінен тәуелсіз: кез келгенінен бастауға болады.</p>
          <div class="hero-actions">
            <a class="btn gold" href="#weeks">Пәнді таңдау</a>
            <a class="btn ghost" href="formulas.html">Формулалар</a>
            <a class="btn ghost" href="glossary.html">Сөздік</a>
            <a class="btn ghost" href="practice.html">Жаттықтырғыш</a>
          </div>
          <div class="cx-stats">
            <div><b><!--n:lect_math-->0<!--/n--></b><span>сабақ дайын</span></div><div><b><!--n:plan_math-->{P.TOTAL}<!--/n--></b><span>сабақ жоспарда</span></div><div><b>24</b><span>пән</span></div>
          </div>
        </div>
        <div class="py-win" aria-hidden="true">
          <div class="py-win-bar"><i></i><i></i><i></i><span>derivative.py</span></div>
<pre class="py-win-code"><span class="k">from</span> sympy <span class="k">import</span> symbols, diff
x = symbols(<span class="f">"x"</span>)
f = x**<span class="f">3</span> + <span class="f">2</span>*x
<span class="f">print</span>(diff(f, x))</pre>
          <div class="py-win-out"><span class="p">▶</span> Нәтиже:<br><b>3*x**2 + 2</b><br>Яғни f&prime;(x) = 3x&sup2; + 2<span class="cur"></span></div>
        </div>
      </section>
      <div class="callout warn math-ai-note" id="ai-note">
        <span class="callout-title">Маңызды ескерту</span>
        <p>{AI_NOTE}</p>
      </div>
      <div class="course-progress" aria-live="polite"></div>
      <!-- build:route -->
      <!-- /build:route -->
      {subnav("", "home")}
      <section class="mx-start" id="start" aria-labelledby="start-h" data-math-app="home">
        <h2 id="start-h">Мазмұны: пәндер</h2>
        <p>Пәндер бір-біріне байланбайды: кез келгенін ашып, оқи беруге болады. Қажет ұғымдар сабақтың өзінде қысқаша еске салынады. Пән атаулары ағылшынша, түсіндірме қазақша.</p>
        <nav aria-label="Пәндерге өту"><ol class="mx-jump">{jump}</ol></nav>
      </section>
      <h2 id="weeks">Пәндер мен сабақтар</h2>
      <p>24 пән, әр пәнде 5-8 сабақ. Әр сабақта мақсаттар, интуиция, анықтама, теорема, қорытып шығару, қадамдық шешілген мысалдар, жиі қателер, визуализация, интерактивті есептер, қорытынды формулалар және қорытынды тест бар. Жазылып біткен сабақтар ашық, қалғандары «Жақында» белгісімен тұр.</p>
{chr(10).join(groups)}
      <section class="oc-block" aria-labelledby="tools">
        <h2 id="tools">Құралдар</h2>
        <div class="oc-cards en-tools">
{tool_html}
        </div>
      </section>
      <section class="oc-block" aria-labelledby="how">
        <h2 id="how">Қалай оқу керек</h2>
        <ol class="oc-steps">
          <li><b>Интуицияны түсініңіз.</b> Әр сабақ суретпен, мысалмен басталады. Формуланы жаттамай тұрып, оның не айтатынын түсінуге тырысыңыз.</li>
          <li><b>Қорытып шығаруды өзіңіз қайталаңыз.</b> Қорытуды жауып қойып, қағазға өзіңіз жазып көріңіз, содан кейін ашып салыстырыңыз.</li>
          <li><b>Қадамдық шешілген мысалдарды көшіріңіз.</b> Мысалды көрмей шешіп, кейін тексеріңіз.</li>
          <li><b>Есептерді шығарыңыз.</b> Тексеру автоматты. Қиын болса, «Кеңес» және «Келесі қадам» батырмаларын біртіндеп ашыңыз.</li>
          <li><b>Жаттықтырғышта қайталаңыз.</b> Сандары кездейсоқ өзгеретін есептер материалды ұзақ уақыт есте қалдырады.</li>
        </ol>
        <p class="oc-note">Өрнек енгізетін есептерде көбейтуді 2x не 2*x, дәрежені x^2, түбірді sqrt(x), π санын pi деп жазасыз. Енгізген өрнегіңіздің формуласы төменде бірден көрінеді.</p>
      </section>
      <p class="translator-note">{OWN_NOTE.format(a='<a href="../copyright.html">')}</p>
    </article>
  </div>
''' + FOOT


# ---------------------------------------------------------------- сабақ тұғыры
def placeholder(n):
    s, k = subj_of(n)
    t, d = s["lessons"][k]
    lab = lesson_label(n)
    if n:
        ps, pk = subj_of(n - 1)
        prev_ = f'<a href="week-{n - 1}.html"><small>Алдыңғы</small>← {lesson_label(n - 1)}: {a(ps["lessons"][pk][0])}</a>'
    else:
        prev_ = '<a href="../index.html"><small>Курс беті</small>← Математика курсы</a>'
    if n < P.TOTAL - 1:
        ns, nk = subj_of(n + 1)
        next_ = f'<a class="next" href="week-{n + 1}.html"><small>Келесі</small>{lesson_label(n + 1)}: {a(ns["lessons"][nk][0])} →</a>'
    else:
        next_ = ""
    desc = f"Математика, {lab}: {t}. Сабақ жақында жазылады."
    return head(f"Math {lab}: {t} - CS50 қазақша", desc, "../../", noindex=True) + shell("../../") + f'''
  {SOON}
  <div class="layout">
    <aside class="toc">
      <h4>Мазмұны</h4>
      <ol></ol>
    </aside>

    <article class="content" id="main">
      <div class="lecture-head" style="--lc:{COLOR}" data-n="{n}">
        <div class="num">{lab}</div>
        <h1>{a(t)}</h1>
        <p>{a(d)}</p>
      </div>

      <h2 id="soon">Бұл сабақ жақында</h2>
      <p>Сабақ әлі жазылып жатыр. Осы кезде <a href="../index.html#subj-{s["no"]}">{a(s["kz"])}</a> пәнінің жоспарын қарап, <a href="../formulas.html">формулалар анықтамалығын</a> пайдалануға болады.</p>

      <nav class="pager">
        {prev_}
        {next_}
      </nav>

      <p class="translator-note">{OWN_NOTE.format(a='<a href="../../copyright.html">')}</p>
    </article>
  </div>
''' + FOOT


# ---------------------------------------------------------------- ортақ беттер
TOOLS = {
    "formulas": ("Формулалар", "Формулалар анықтамалығы", "Пән бойынша формулалар: іздеу, шарттары және сабаққа сілтеме. Формулалар KaTeX-пен көрсетіледі.",
                 "Математика формулаларының анықтамалығы: 24 пән бойынша іздеу, шарттары және сабаққа сілтеме."),
    "glossary": ("Сөздік", "Математика сөздігі", "Математикалық терминдер қазақша және ағылшынша: қысқа анықтама мен сабаққа сілтеме.",
                 "Математика терминдерінің қазақша-ағылшынша сөздігі: пән бойынша сүзу және іздеу."),
    "practice": ("Жаттықтырғыш", "Кездейсоқ есептер жаттықтырғышы", "Пән мен қиындықты таңдап, кездейсоқ коэффициентті есептер сериясын шешіңіз. Әр сайын жаңа сандар.",
                 "Математика жаттықтырғышы: кездейсоқ коэффициентті есептер сериясы, пән мен қиындық бойынша сүзгі."),
}


def tool_page(key):
    label, h1, intro, desc = TOOLS[key]
    return head(f"Math · {label} - CS50 қазақша", desc, "../", katex=True, plan=True) + shell("../") + f'''
  <div class="layout single wide">
    <article class="content math-tool" id="main">
      <div class="lecture-head" style="--lc:{COLOR}">
        <div class="num">Математика · {label}</div>
        <h1>{h1}</h1>
        <p>{intro}</p>
      </div>
      {subnav("", key)}
      <div class="mx-app" id="mx-app" data-math-app="{key}"><p class="mx-loading">Жүктелуде...</p></div>
      <noscript><p class="callout warn">Бұл бет JavaScript арқылы жұмыс істейді. Браузерде JavaScript-ті қосыңыз.</p></noscript>
      <p class="translator-note">{OWN_NOTE.format(a='<a href="../copyright.html">')}</p>
    </article>
  </div>
''' + FOOT


# ---------------------------------------------------------------- сабақ қаңқасы (мазмұн агенттері үшін)
def skeleton(n):
    s, k = subj_of(n)
    t, d = s["lessons"][k]
    lab = lesson_label(n)
    p = "../../"
    if n:
        ps, pk = subj_of(n - 1)
        prev_ = f'<a href="week-{n - 1}.html"><small>Алдыңғы</small>← {lesson_label(n - 1)}: {a(ps["lessons"][pk][0])}</a>'
    else:
        prev_ = '<a href="../index.html"><small>Курс беті</small>← Математика курсы</a>'
    if n < P.TOTAL - 1:
        ns, nk = subj_of(n + 1)
        next_ = f'<a class="next" href="week-{n + 1}.html"><small>Келесі</small>{lesson_label(n + 1)}: {a(ns["lessons"][nk][0])} →</a>'
    else:
        next_ = ""
    return head(f"Math {lab}: {t} - CS50 қазақша", d, p, katex=True, plan=False, viz=True) + shell(p) + f'''
  <div class="layout">
    <aside class="toc">
      <h4>Мазмұны</h4>
      <ol></ol>
    </aside>

    <article class="content math-lesson" id="main">
      <div class="lecture-head" style="--lc:{COLOR}" data-n="{n}">
        <div class="num">{lab}</div>
        <h1>{a(t)}</h1>
        <p>ЖАЗЫҢЫЗ: 2-3 сөйлем - сабақта не үйренесіз және неге керек.</p>
      </div>

      {subnav("../", "").replace('<a href="../index.html">', '<a href="../index.html#subj-%d">' % s["no"])}

      <div class="callout note">
        <span class="callout-title">Курс туралы</span>
        <p>Бұл сабақтың мазмұны жасанды интеллект көмегімен дайындалған, сондықтан математик-оқытушымен тексеріп алған жөн. Бұл ресми емтихан не куәлік баламасы емес.</p>
      </div>

      <h2 id="goals">Сабақ мақсаттары</h2>
      <ul><li>ЖАЗЫҢЫЗ: 4-6 өлшенетін мақсат.</li></ul>

      <h2 id="prereq">Қысқаша еске салу</h2>
      <p class="math-prereq">ЖАЗЫҢЫЗ: осы сабаққа қажет ұғымдарды 2-4 сөйлеммен осы жерде еске түсіріңіз (басқа пәнге сілтеме БЕРМЕҢІЗ).</p>

      <h2 id="intuition">Интуиция</h2>
      <p>ЖАЗЫҢЫЗ: формуласыз, суретпен/мысалмен түсіндіру.</p>

      <h2 id="theory">Анықтамалар мен теоремалар</h2>
      <div class="math-def" id="def-1"><span class="math-tag">Анықтама 1.1 · Атауы</span><p>ЖАЗЫҢЫЗ. Термин: <strong>атауы</strong> (<span class="term-en">english</span>). Формула: $x^2$.</p></div>
      <div class="math-thm" id="thm-1"><span class="math-tag">Теорема 1.1 · Атауы</span><p>ЖАЗЫҢЫЗ.</p></div>
      <div class="math-formula" id="f-1"><span class="math-fname">Формула 1.1 · Атауы</span><div class="math-fbody">$$ax^2+bx+c=0$$</div><p class="math-fnote">Қолдану шарты.</p></div>
      <div class="math-remember"><span class="math-box-title">Есте сақта</span><p>ЖАЗЫҢЫЗ.</p></div>
      <div class="math-attention"><span class="math-box-title">Назар аудар</span><p>ЖАЗЫҢЫЗ.</p></div>

      <h2 id="derivations">Қорытып шығару</h2>
      <div class="mx-derive-tools"></div>
      <details class="math-derive" id="d-1" open>
        <summary>Қорытып шығару 1: ЖАЗЫҢЫЗ (формула атауы)</summary>
        <div class="math-derive-body">
          <p>Мақсат: ... Қадамдар:</p>
          <ol class="math-steps"><li>1-қадам ...</li><li>2-қадам ...</li></ol>
          <p class="math-qed">∎</p>
        </div>
      </details>

      <h2 id="examples">Қадамдық шешілген мысалдар</h2>
      <div class="math-example" id="ex-1">
        <h3>Мысал 1. Атауы</h3>
        <p class="math-problem">Есептің шарты ($x$ ...).</p>
        <ol class="math-steps"><li><b>1-қадам.</b> ...</li><li><b>2-қадам.</b> ...</li></ol>
        <p class="math-answer"><b>Жауабы:</b> ...</p>
      </div>

      <h2 id="mistakes">Жиі қателер</h2>
      <ul class="math-mistakes">
        <li><span class="math-bad">$(a+b)^2=a^2+b^2$</span> → <span class="math-good">$(a+b)^2=a^2+2ab+b^2$</span><br>Неге қате: ...</li>
      </ul>

      <h2 id="viz">Визуализация</h2>
      <div class="math-viz" data-viz="graph" data-title="Атауы" data-config='{{"fns":["x^2"],"view":[-4,4,-2,8]}}'></div>

      <h2 id="exercises">Интерактивті есептер</h2>
      <p class="mx-sum"></p>
      <div class="math-ex task" data-type="num" data-id="m{s["no"]}-{k + 1}-num-1">
        <div class="task-head"><span class="badge easy">Оңай</span><h3 id="m{s["no"]}-{k + 1}-t1">1. Атауы</h3></div>
        <p>Нұсқау.</p>
        <script type="application/json" class="math-ex-data">{{"items":[{{"q":"$2+3=?$","a":"5","hint":"Қосыңыз.","sol":{{"steps":["$2+3=5$."],"ans":"5"}},"v":"2+3"}}]}}</script>
      </div>

      <h2 id="project">Мини-жоба</h2>
      <p>ЖАЗЫҢЫЗ: қолданыс/бағдарламалау байланысы, Python фрагменті.</p>
<pre><code class="language-python">print(2 + 3)</code></pre>

      <h2 id="summary">Қорытынды формулалар</h2>
      <table class="math-table"><thead><tr><th>Атауы</th><th>Формула</th><th>Шарты</th></tr></thead>
      <tbody><tr><td>Атауы</td><td>$x^2$</td><td>-</td></tr></tbody></table>

      <h2 id="review">Қайталау тізімі</h2>
      <ul class="checklist" data-id="m{s["no"]}-{k + 1}-self"><li><label><input type="checkbox"> ЖАЗЫҢЫЗ: «мен ... түсіндіре аламын»</label></li></ul>
      <p class="progress"></p>

      <h2 id="quiz">Қорытынды тест</h2>
      <div class="quiz">
        <div class="question" data-answer="b">
          <p class="q-text">1. Сұрақ ($x^2$ ...)?</p>
          <label><input type="radio" value="a"> A нұсқа</label>
          <label><input type="radio" value="b"> B нұсқа</label>
          <label><input type="radio" value="c"> C нұсқа</label>
          <label><input type="radio" value="d"> D нұсқа</label>
          <p class="explain">Түсіндірме.</p>
        </div>
        <button class="btn quiz-check" type="button">Жауаптарды тексеру</button>
        <p class="result" aria-live="polite"></p>
      </div>

      <nav class="pager">
        {prev_}
        {next_}
      </nav>

      <p class="translator-note">{OWN_NOTE.format(a='<a href="../../copyright.html">')}</p>
    </article>
  </div>
''' + FOOT


def write(path, text, force, replace_if=None):
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists() and not force:
        cur = path.read_text(encoding="utf-8")
        if not (replace_if and replace_if(cur)):
            return False
    path.write_text(text, encoding="utf-8")
    return True


def data_stub(kind):
    glob = {"formulas": "CS50KZ_MATH_FORMULAS", "terms": "CS50KZ_MATH_TERMS", "problems": "CS50KZ_MATH_PROBLEMS"}[kind]
    fmt = {"formulas": "docs/MATH-COURSE-GUIDE.md §9.1 (формулалар)", "terms": "§9.2 (терминдер)", "problems": "§9.3 (параметрлік есептер банкі)"}[kind]
    return lambda slug, kz: (f"/* © 2026 Sagid Mustafa. All Rights Reserved. Математика курсы, «{kz}» пәні. Формат: {fmt}. */\n"
                             f"window.{glob} = window.{glob} || {{}};\nwindow.{glob}.{slug} = [];\n")


def main():
    force = "--force" in sys.argv
    if "--skeleton" in sys.argv:
        n = int(sys.argv[sys.argv.index("--skeleton") + 1])
        sys.stdout.write(skeleton(n))
        return
    n = 0
    if "--index" in sys.argv or force or not (MATH / "index.html").exists():
        MATH.mkdir(exist_ok=True)
        (MATH / "index.html").write_text(index_page(), encoding="utf-8")
        n += 1
    for key in TOOLS:
        n += write(MATH / f"{key}.html", tool_page(key), force)
    for i in range(P.TOTAL):
        n += write(MATH / "lectures" / f"week-{i}.html", placeholder(i), force, replace_if=lambda cur: SOON in cur and ("--refresh" in sys.argv or "--index" in sys.argv))
    for kind in ("formulas", "terms", "problems"):
        mk = data_stub(kind)
        for s in SUBJ:
            n += write(ROOT / "assets" / "data" / f"math-{kind}-{s['slug']}.js", mk(s["slug"], s["kz"]), False)
    print(f"math: {n} файл жазылды")


if __name__ == "__main__":
    main()
