#!/usr/bin/env python3
# © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама (LICENSE-PROPRIETARY.md, COPYRIGHT.md).
# Harvard CS50 материалдары (олар осы файлда сақталмайды) CC BY-NC-SA 4.0 бойынша; үшінші тарап компоненттері өз лицензияларымен.
"""«Ағылшын тілі A0-C1» курсының (en/) бастапқы беттерін жасайды. Бір реттік скаффолдер; кейін беттер қолмен/мазмұн агенттерімен жазылады.

  python3 tools/make_en_pages.py            # жоқ беттерді жасайды (бар беттерге тиіспейді)
  python3 tools/make_en_pages.py --index    # en/index.html-ді қайта жазады (жоспар өзгергенде)
  python3 tools/make_en_pages.py --force    # БАРЛЫҚ жасалатын беттерді қайта жазады (мазмұнды өшіреді! тек тұғыр беттерге қолданыңыз)

Жасайтындары: en/index.html, en/vocab.html, en/grammar.html, en/phrasebank.html, en/placement.html және
en/lectures/week-0..23.html тұғырлары (<!-- soon --> белгісімен). Дайын сабақ беттері (белгісі жоқ) ЕШҚАШАН қайта жазылмайды.
Содан кейін:  python3 tools/build.py
"""
import ast
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EN = ROOT / "en"
COLOR, COLOR2, GLOW = "#0f766e", "#134e4a", "rgb(45 212 191 / .32)"
LEVELS = [
    ("A0", "Бастау", "Әліпби, дыбыстар, алғашқы сөздер: ағылшынша ештеңе білмейтін адамға."),
    ("A1", "Негіз", "Қарапайым сөйлемдер, күнделікті жұмыс, stand-up-та қысқаша айту."),
    ("A2", "Қарапайым қарым-қатынас", "Өткен мен болашақ, салыстыру, кеңес беру, қарапайым баг-репорт пен e-mail."),
    ("B1", "Өз бетінше қолдану", "Present Perfect, шарт, ырықсыз етіс, code review мен техникалық құжатты түсіну."),
    ("B2", "Еркін жұмыс", "Күрделі шарт, ресми хат, фразалық етістіктер, интервью және техникалық түсіндірме."),
    ("C1", "Кәсіби деңгей", "Нәзік реңктер, архитектура талқылауы, күрделі мәтін, келіссөз мен презентация."),
]
# (атауы, сипаттамасы, белгіше)
LESSONS = [
    ("Әліпби, дыбыстар және алғашқы сөздер", "Ағылшын әліпбиі, аты-жөнді әріптеп айту, сәлемдесу, I am / you are және компьютердегі алғашқы сөздер.", "book"),
    ("Сандар, түстер және заттар", "0-ден 100-ге дейін санау, түстер, this / that, a / an, көпше жалғау және компьютер құрылғыларының атаулары.", "dice"),
    ("Мен, отбасым және жұмыс орным", "I have, my / your, отбасы мен жұмыс орны, can / can't және файлмен жұмыс істеудің қарапайым сөздері.", "plan"),
    ("Қарапайым сұрақтар мен өтініштер", "What / Where / Who сұрақтары, please / thank you, Open / Save / Close командалары және экрандағы батырмалар.", "chat"),
    ("Present Simple: күнделікті жұмыс", "I work, she works, do / does сұрақтары, жиілік сөздері және stand-up-та «мен не істеймін» деп айту.", "write"),
    ("There is / there are және орын", "Заттың қайда екенін айту: in, on, under, next to; жұмыс орны мен файл құрылымын сипаттау.", "eye"),
    ("Present Continuous және can", "Қазір не істеп жатқанымызды айту, can / can't, қосымша өтініштер, қатені қысқаша хабарлау.", "bolt"),
    ("Past Simple: кеше не болды", "was / were, тұрақты етістіктердің өткен шағы, commit хабарламасындағы Fix / Add / Update.", "branch"),
    ("Қате етістіктер және хабар жазу", "went, saw, made сияқты қате етістіктер, өткен уақыт көрсеткіштері және қарапайым баг-репорт.", "search"),
    ("Болашақ: going to және will", "Жоспар мен болжам, e-mail арқылы сұрау, спринт жоспарын айту.", "peak"),
    ("Салыстыру және санау", "Comparative / superlative, much / many, some / any, құралдар мен шешімдерді салыстыру.", "scale"),
    ("Кеңес, міндет, тыйым", "should, must, have to, can't; Stack Overflow-ға қарапайым сұрақ жазу.", "check"),
    ("Present Perfect", "have done, ever / never / already / yet, for / since; «не істеп қойдым» деп айту.", "brain"),
    ("Шартты сөйлемдер (0 және 1)", "if, when, unless, шарт пен нәтиже; «егер тест құласа...» деген ойды ағылшынша айту.", "branch"),
    ("Ырықсыз етіс (Passive)", "is done, was made, has been fixed; құжаттама мен техникалық мәтіндегі ырықсыз етіс.", "book"),
    ("Жанама сөз және анықтауыш сөйлем", "He said that..., who / which / that; code review пікірлері мен кері байланыс.", "chat"),
    ("Шартты сөйлемдер (2, 3) және wish", "Шын емес не өткен жағдайлар, өкініш, post-mortem жазбасы.", "scale"),
    ("Ресми хат және сыпайы өтініш", "Ресми e-mail құрылымы, сыпайы өтініш, шағым мен түсіндірме, дайын тіркестер.", "write"),
    ("Герундий, инфинитив және байланыстырғыш сөздер", "stop doing / stop to do, however, therefore, although; техникалық түсіндірме жазу.", "link"),
    ("Фразалық етістіктер және сұхбат", "set up, roll back, look into сияқты фразалық етістіктер; интервьюдегі мінез-құлық сұрақтары.", "globe"),
    ("Болжам, инверсия және ерекше құрылымдар", "must have been, can't have, not only... but also, инверсия; архитектура талқылауы.", "brain"),
    ("Жұмсақ және нақты ой білдіру", "Hedging, register, нәзік сын, сыпайы әрі нақты кері байланыс; дизайн-құжат жазу.", "eye"),
    ("Күрделі мәтінді оқу", "Күрделі зат есімді топтар, cohesion, құжаттама мен мақаланы тез әрі терең оқу.", "book"),
    ("Идиомалар, коллокациялар және презентация", "Тұрақты тіркестер, келіссөз, демо мен техникалық сұхбатта сенімді сөйлеу.", "peak"),
]
OWN_NOTE = ('Бұл курс - Sagid Mustafa-ның авторлық оқу материалы: Harvard CS50 курсының аудармасы емес, онан мәтін алынбаған. '
            'Сөздік, мысал және жаттығулар өз сөзімізбен жазылған; Oxford, Cambridge, British Council т.б. басылымдарының тізімдері мен мәтіндері көшірілмеген. '
            '© 2026 Sagid Mustafa, барлық құқықтар қорғалған. {a}Авторлық құқық және лицензиялар</a>.')
AI_NOTE = ('<b>Назар аударыңыз.</b> Бұл курстың мазмұны жасанды интеллект көмегімен дайындалған, сондықтан оны тәжірибелі ағылшын тілі мұғалімімен '
           'тексеріп алған жөн. A0-C1 белгілері CEFR шкаласына тек «шамамен сәйкес» дегенді білдіреді: бұл ресми емтихан, куәлік немесе IELTS/TOEFL '
           'баламасы емес. Деңгей анықтау тесті - болжамды құрал, нақты нәтиже емес.')


def icons():
    src = (ROOT / "tools/make_course_pages.py").read_text(encoding="utf-8")
    m = re.search(r"^ICONS = (\{.*?^\})", src, re.S | re.M)
    return ast.literal_eval(m.group(1))


ICONS = icons()
TPL = (ROOT / "cpp/index.html").read_text(encoding="utf-8")
HEAD_END = TPL.index("<body")
HEAD_TPL = TPL[:HEAD_END]


def head(title, desc, prefix, extra_css="", extra_js="", noindex=False):
    h = HEAD_TPL
    h = re.sub(r"<title>.*?</title>", f"<title>{title}</title>", h, count=1)
    h = re.sub(r'<!-- build:head -->.*?<!-- /build:head -->', "<!-- build:head -->\n  <!-- /build:head -->", h, flags=re.S)
    h = re.sub(r'<meta name="description" content="[^"]*">', f'<meta name="description" content="{desc}">' + ('\n  <meta name="robots" content="noindex">' if noindex else ""), h)
    h = h.replace('href="../assets/', f'href="{prefix}assets/').replace('src="../assets/', f'src="{prefix}assets/')
    h = h.replace('  <script src="' + prefix + 'assets/js/main.js"></script>', '  <script src="' + prefix + 'assets/js/main.js"></script>' + extra_js)
    if extra_css:
        h = h.replace('  <script src="' + prefix + 'assets/js/main.js"></script>', extra_css + '\n  <script src="' + prefix + 'assets/js/main.js"></script>', 1)
    return h


def shell(prefix):
    return f'''<body data-license="B" data-course="en">
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
    items = [("index.html#weeks", "Сабақтар", "weeks"), ("vocab.html", "Сөздік", "vocab"), ("grammar.html", "Грамматика", "grammar"),
             ("phrasebank.html", "IT-фразалар", "phrasebank"), ("placement.html", "Деңгей тесті", "placement")]
    a = "".join(f'<a href="{prefix}{h}"' + (' aria-current="page"' if k == cur else "") + f">{t}</a>" for h, t, k in items)
    return f'<nav class="en-subnav" aria-label="Ағылшын курсының бөлімдері">{a}</nav>'


def lesson_label(i):
    return f"{LEVELS[i // 4][0]} · {i % 4 + 1}-сабақ"


# ---------------------------------------------------------------- курс беті
def card(i, c=COLOR):
    t, d, ico = LESSONS[i]
    return f'''    <div class="week-card soon" data-id="week-{i}" style="--c:{c}">
      <span class="wc-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">{ICONS[ico]}</svg></span>
      <div class="num">{lesson_label(i)}</div>
      <h3>{t}</h3>
      <p>{d}</p>
      <div class="status">Жақында</div>
    </div>'''


def index_page():
    switch = ('<nav class="cx-switch" aria-label="Курсты таңдау"><a href="../index.html">CS50x</a><a href="../python/">CS50P</a><a href="../sql/">SQL</a>'
              '<a href="../ai/">AI</a><a href="../web/">Web</a><a href="../cpp/">C++</a><a href="../java/">Java</a><a class="on" aria-current="page" href="../en/">English</a><a href="../math/">Math</a></nav>')
    groups = []
    for li, (code, name, desc) in enumerate(LEVELS):
        cards = "\n".join(card(li * 4 + k) for k in range(4))
        groups.append(f'''      <h3 id="level-{code.lower()}">{code} · {name}</h3>
      <p class="en-level-desc">{desc}</p>
      <div class="weeks course-weeks">
{cards}
      </div>''')
    levels_cards = "\n".join(f'        <div class="oc-card"><h3>{c} · {n}</h3><p>{d}</p></div>' for c, n, d in LEVELS)
    tools = [("vocab.html", "Сөздік және карточкалар", "Деңгей мен тақырып бойынша сөздер, іздеу, «жаттадым» белгісі, интервалды қайталау карточкалары."),
             ("grammar.html", "Грамматика анықтамалығы", "Ережелер деңгей бойынша: қысқа түсіндірме, мысал, қазақ тілді оқушылардың жиі қателері."),
             ("phrasebank.html", "IT-фразалар жинағы", "Stand-up, code review, баг-репорт, e-mail, интервью: дайын тіркестер көшіріп алуға ыңғайлы."),
             ("placement.html", "Деңгей анықтау тесті", "30 шақты сұрақ; нәтиже «шамамен A?-B?» және қай сабақтан бастауға болатынын көрсетеді. Болжамды құрал.")]
    tool_html = "\n".join(f'        <a class="oc-card en-tool-card" href="{h}"><h3>{t}</h3><p>{d}</p></a>' for h, t, d in tools)
    return head("English: Ағылшын тілі A0-C1 - CS50 қазақша",
                "Ағылшын тілі A0-C1: авторлық қазақша курс. Грамматика, сөздік, оқу, жазу, тыңдау мен айту жаттығулары, IT-ағылшын. 24 сабақ, деңгей анықтау тесті.", "../", extra_css='  <link rel="stylesheet" href="../assets/css/en-course.css">', extra_js='\n  <script defer src="../assets/js/en-home.js"></script>') + shell("../") + f'''
  <div class="layout single wide">
    <article class="content course-home own-course en-course" id="main">
      <section class="py-hero oc-hero" data-c="en" style="--hc:{COLOR};--hc2:{COLOR2};--hglow:{GLOW}">
        <div class="py-hero-text">
          {switch}
          <span class="cx-eyebrow">Авторлық курс · Sagid Mustafa</span>
          <h1>Ағылшын тілі <span>A0-C1</span></h1>
          <p>Ағылшын тілін нөлден бастап үйреніңіз: грамматика, ереже, сөздік, оқу, жазу, тыңдау мен айту. Мысалдардың көбі IT және бағдарламалау жұмысынан алынған: stand-up, commit хабарламасы, баг-репорт, code review, e-mail, интервью.</p>
          <div class="hero-actions">
            <a class="btn gold" href="lectures/week-0.html">Бастау: A0 · 1-сабақ <span aria-hidden="true">→</span></a>
            <a class="btn ghost" href="placement.html">Деңгейімді анықтау</a>
            <a class="btn ghost" href="vocab.html">Сөздік</a>
            <a class="btn ghost" href="grammar.html">Грамматика</a>
          </div>
          <div class="cx-stats">
            <div><b><!--n:lect_en-->1<!--/n--></b><span>сабақ дайын</span></div><div><b><!--n:plan_en-->24<!--/n--></b><span>сабақ жоспарда</span></div><div><b>6</b><span>деңгей</span></div>
          </div>
        </div>
        <div class="py-win" aria-hidden="true">
          <div class="py-win-bar"><i></i><i></i><i></i><span>standup.txt</span></div>
<pre class="py-win-code"><span class="k">Yesterday</span> I <span class="f">fixed</span> a bug in the login page.
<span class="k">Today</span> I <span class="f">am writing</span> tests for it.
I <span class="f">have</span> no blockers.</pre>
          <div class="py-win-out"><span class="p">▶</span> Қазақша:<br><b>Кеше кіру бетіндегі қатені түзеттім.</b><br>Бүгін оған тест жазып жатырмын.<br>Кедергілерім жоқ.<span class="cur"></span></div>
        </div>
      </section>
      <div class="callout warn en-ai-note" id="ai-note">
        <span class="callout-title">Маңызды ескерту</span>
        <p>{AI_NOTE}</p>
      </div>
      <div class="course-progress" aria-live="polite"></div>
      <!-- build:route -->
      <!-- /build:route -->
      <div class="callout tip">
        <span class="callout-title">Алдын ала не білу керек?</span>
        <p>Ештеңе керек емес: курс әліпбиден басталады. Деңгейіңізді білмесеңіз, алдымен <a href="placement.html">деңгей анықтау тестін</a> өтіп көріңіз. Дыбыстау батырмалары браузердің өз дыбыс синтезін қолданады (сыртқы қызметсіз): құлаққап пен Chrome, Edge не Safari ыңғайлы.</p>
      </div>
      {subnav("", "weeks")}
      <h2 id="weeks">Сабақтар</h2>
      <p>24 сабақ: 6 деңгей, әр деңгейде 4 сабақ. Әр сабақта мақсаттар, түсіндірме, сөздік, ереже мен жиі қателер, жаттығулар, IT-ағылшын бөлімі және қорытынды тест бар. Жазылып біткен сабақтар ашық, қалғандары «Жақында» белгісімен тұр.</p>
{chr(10).join(groups)}
      <section class="oc-block" aria-labelledby="levels">
        <h2 id="levels">Деңгейлер туралы</h2>
        <p>A0-C1 белгілері Еуропалық CEFR шкаласының баспалдақтарына <b>шамамен</b> сәйкес келеді. Ресми емтихан немесе куәлік олардың орнын баспайды: бұл тек өзіңізге бағдар беретін жол.</p>
        <div class="oc-cards">
{levels_cards}
        </div>
      </section>
      <section class="oc-block" aria-labelledby="tools">
        <h2 id="tools">Құралдар</h2>
        <div class="oc-cards en-tools">
{tool_html}
        </div>
      </section>
      <section class="oc-block" aria-labelledby="how">
        <h2 id="how">Қалай оқу керек</h2>
        <ol class="oc-steps">
          <li><b>Оқыңыз.</b> Сабақтағы ережені, мысалдар мен қазақша салыстыруды оқып, сөздерді дауыстап айтып көріңіз.</li>
          <li><b>Жаттығыңыз.</b> Бос орын, таңдау, сәйкестендіру, сөйлем құру жаттығулары бірден тексеріледі. Қате болса, түсіндірмені оқып, қайта көріңіз.</li>
          <li><b>Жазыңыз.</b> Қысқа жазбаны қағазға не файлға өзіңіз жазып, өзін-өзі тексеру тізімімен салыстырыңыз.</li>
          <li><b>Қайталаңыз.</b> Сөздік бетіндегі карточкалармен жаңа сөздерді ұзақ уақыт ұстап қалыңыз: күніне 10 минут жеткілікті.</li>
        </ol>
        <p class="oc-note">Дыбыстау браузер мүмкіндігіне байланысты: кей құрылғыда ағылшын дауысы болмауы мүмкін. Онда сабақ мәтіні мен қазақша оқылу нұсқасы қалады.</p>
      </section>
      <section class="oc-block oc-project" id="project" aria-labelledby="project-h">
        <h2 id="project-h">Жоба: IT-ағылшын портфолиоң</h2>
        <p>Курс бойы өз жазбаларыңызды бір файлға жинаңыз: бұл жұмыс іздегенде не шетелдік командаға қосылғанда көрсетуге болатын нақты үлгі.</p>
        <ul class="oc-feats"><li>10 commit хабарламасы (Fix, Add, Update, Remove)</li><li>Бір баг-репорт және бір Stack Overflow сұрағы</li><li>Бір апталық stand-up мәтіндері</li><li>Бір ресми e-mail және өзіңізді таныстыру (60 секунд)</li></ul>
        <p class="oc-note">Бұл жобаны автоматты тексеретін жүйе жоқ: сабақтардағы өзін-өзі тексеру критерийлерімен өзіңіз немесе мұғалімнің көмегімен бағалайсыз.</p>
      </section>
      <p class="translator-note">{OWN_NOTE.format(a='<a href="../copyright.html">')}</p>
    </article>
  </div>
''' + FOOT


# ---------------------------------------------------------------- сабақ тұғыры
def placeholder(i):
    code, lname, _ = LEVELS[i // 4]
    t, d, _ = LESSONS[i]
    lab = lesson_label(i)
    prev_ = f'<a href="week-{i - 1}.html"><small>Алдыңғы</small>← {lesson_label(i - 1)}: {LESSONS[i - 1][0]}</a>' if i else '<a href="../index.html"><small>Курс беті</small>← Ағылшын тілі курсы</a>'
    next_ = f'<a class="next" href="week-{i + 1}.html"><small>Келесі</small>{lesson_label(i + 1)}: {LESSONS[i + 1][0]} →</a>' if i < 23 else ""
    desc = f"Ағылшын тілі {lab}: {t}. Сабақ жақында жазылады."
    return head(f"English {lab}: {t} - CS50 қазақша", desc, "../../",
                extra_css='  <link rel="stylesheet" href="../../assets/css/en-course.css">', noindex=True) + shell("../../") + f'''
  {SOON}
  <div class="layout">
    <aside class="toc">
      <h4>Мазмұны</h4>
      <ol></ol>
    </aside>

    <article class="content" id="main">
      <div class="lecture-head" style="--lc:{COLOR}" data-n="{i}">
        <div class="num">{lab}</div>
        <h1>{t}</h1>
        <p>{d}</p>
      </div>

      <h2 id="soon">Бұл сабақ жақында</h2>
      <p>Сабақ әлі жазылып жатыр. Осы кезде <a href="../vocab.html">сөздік</a> пен <a href="../grammar.html">грамматика анықтамалығын</a> қолдануға, ал <a href="../placement.html">деңгей тестін</a> өтуге болады.</p>

      <nav class="pager">
        {prev_}
        {next_}
      </nav>

      <p class="translator-note">{OWN_NOTE.format(a='<a href="../../copyright.html">')}</p>
    </article>
  </div>
''' + FOOT


SOON = "<!-- soon -->"
LV_IDS = ["a0", "a1", "a2", "b1", "b2", "c1"]


# ---------------------------------------------------------------- ортақ беттер
TOOLS = {
    "vocab": ("Сөздік", "Ағылшын сөздігі", "Деңгей мен тақырып бойынша сөздер, іздеу, «жаттадым» белгісі және интервалды қайталау карточкалары.",
              "Ағылшын курсының сөздігі: деңгей мен тақырып бойынша сөздер, іздеу, жатталған сөздерді белгілеу және интервалды қайталау карточкалары.",
              [f"../assets/data/en-vocab-{l}.js" for l in LV_IDS] + ["data/lectures.js"]),
    "grammar": ("Грамматика", "Грамматика анықтамалығы", "Ережелер деңгей бойынша: қысқа түсіндірме, мысалдар және қазақ тілді оқушылардың жиі қателері.",
                "Ағылшын грамматикасының анықтамалығы A0-C1: ереже, мысал және қазақ тілді оқушылардың жиі қателері, іздеу мен деңгей сүзгісі.",
                [f"../assets/data/en-grammar-{l}.js" for l in LV_IDS] + ["data/lectures.js"]),
    "phrasebank": ("IT-фразалар", "IT-ағылшын фразалары", "Stand-up, code review, баг-репорт, e-mail, интервью: дайын тіркестер, көшіру және дыбыстау.",
                   "IT-ағылшын фразалар жинағы: stand-up, code review, баг-репорт, commit, e-mail және интервью тіркестері қазақша аудармасымен.",
                   ["../assets/data/en-phrases.js"]),
    "placement": ("Деңгей тесті", "Деңгей анықтау тесті", "Шамамен 30 сұрақ: нәтиже «шамамен A?-B?» түрінде және қай сабақтан бастауға болатыны көрсетіледі. Болжамды құрал.",
                  "Ағылшын тілінің деңгейін болжамды анықтау тесті: нәтиже шамамен A0-C1 аралығында және қай сабақтан бастау керегі.",
                  ["../assets/data/en-placement.js", "data/lectures.js"]),
}


def tool_page(key):
    label, h1, intro, desc, scripts = TOOLS[key]
    js = "".join(f'\n  <script defer src="{s}"></script>' for s in scripts) + \
         '\n  <script defer src="../assets/js/en-course.js"></script>' + ('\n  <script defer src="../assets/js/en-trainer.js"></script>' if key in ("vocab", "grammar", "phrasebank") else "") + '\n  <script defer src="../assets/js/en-tools.js"></script>'
    warn = ('<div class="callout warn"><span class="callout-title">Болжамды құрал</span><p>Нәтиже ресми емтихан деңгейі емес және IELTS/TOEFL баламасы емес: тек қай сабақтан бастауға болатынын болжайды. '
            'Контентті тәжірибелі ағылшын тілі мұғалімімен тексерген жөн.</p></div>' if key == "placement" else "")
    return head(f"English · {label} - CS50 қазақша", desc, "../", extra_css='  <link rel="stylesheet" href="../assets/css/en-course.css">', extra_js=js) + shell("../") + f'''
  <div class="layout single wide">
    <article class="content en-tool" id="main">
      <div class="lecture-head" style="--lc:{COLOR}">
        <div class="num">Ағылшын тілі A0-C1 · {label}</div>
        <h1>{h1}</h1>
        <p>{intro}</p>
      </div>
      {subnav("", key)}
      {warn}
      <div class="en-app" id="en-app" data-app="{key}"><p class="en-loading">Жүктелуде...</p></div>
      <noscript><p class="callout warn">Бұл бет JavaScript арқылы жұмыс істейді. Браузерде JavaScript-ті қосыңыз.</p></noscript>
      <p class="translator-note">{OWN_NOTE.format(a='<a href="../copyright.html">')}</p>
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


def main():
    force = "--force" in sys.argv
    n = 0
    if "--index" in sys.argv or force or not (EN / "index.html").exists():
        (EN / "index.html").parent.mkdir(exist_ok=True)
        (EN / "index.html").write_text(index_page(), encoding="utf-8")
        n += 1
    for key in TOOLS:
        n += write(EN / f"{key}.html", tool_page(key), force)
    for i in range(24):
        n += write(EN / "lectures" / f"week-{i}.html", placeholder(i), force, replace_if=lambda cur: SOON in cur and "--refresh" in sys.argv)
    print(f"en: {n} файл жазылды")


if __name__ == "__main__":
    main()
