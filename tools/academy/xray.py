# © 2026 AO17 командасы. All Rights Reserved.
# AO17 X-RAY - academy/xray.html (жария бет). Python кодының рентгені: бір кодтың бір қадамы бірнеше қабатта қатар көрінеді -
# бастапқы кодтағы нақты өрнек, AST түйіні, байт-код нұсқауы, шақыру стегі, шақыру (рекурсия) ағашы, есептеу және машина
# деңгейі (3D зертхананың архитектура сабақтарына сілтеме). Код браузерде нағыз Python-да орындалады: assets/py/xray_trace.py
# (sys.settrace + f_trace_opcodes). Build кезінде мысалдар CPython-да тексеріледі (қатесіз, күтілген шақыру саны).
import html
import importlib.util
import json
from pathlib import Path

E = lambda s: html.escape(str(s), quote=True)  # noqa: E731
ROOT = Path(__file__).resolve().parents[2]


def _xray():
    spec = importlib.util.spec_from_file_location("xray_mod", ROOT / "assets" / "py" / "xray_trace.py")
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


FIB = "def fib(n):\n    if n < 2:\n        return n\n    return fib(n - 1) + fib(n - 2)\n\nprint(fib(5))\n"

# Мысалдар: (id, атауы, ұғымы, код, неге қарау керек, күтілетін шақыру саны)
EXAMPLES = [
    ("fact", "Факториал", "рекурсия",
     "def factorial(n):\n    if n == 1:\n        return 1\n    return n * factorial(n - 1)\n\nprint(factorial(4))\n",
     "Әр шақыру стекке жаңа жақтау қосады: n-нің төрт көшірмесі қатар тұрады. Ағаш төменге өседі де, жауаптар кері қайтады: 1, 2, 6, 24.", 4),
    ("fib", "Фибоначчи", "ағаш жарылысы", FIB,
     "fib(5) 15 рет шақырылады: ағашта fib(3) екі рет, fib(2) үш рет шешіледі. fib(25) - 242 785 шақыру. Есептеу тақтасына қара.", 15),
    ("memo", "Есте сақтау", "мемоизация",
     "есте = {}\n\ndef fib(n):\n    if n in есте:\n        return есте[n]\n    if n < 2:\n        return n\n    есте[n] = fib(n - 1) + fib(n - 2)\n    return есте[n]\n\nprint(fib(5))\n",
     "Сол fib, бірақ жауап сөздікте сақталады: қайталанған бұтақтар бірден жауап береді. 15 шақырудың орнына 9.", 9),
    ("loop", "Цикл", "байт-кодтағы секіріс",
     "s = 0\nfor i in range(4):\n    s += i\nprint(s)\n",
     "Байт-кодта «цикл» деген нұсқау жоқ: FOR_ITER келесі мәнді алады, ал JUMP_BACKWARD артқа секіреді. Цикл - кері секіріс.", 0),
    ("alias", "Бір тізім, екі атау", "сілтеме",
     "a = [1, 2]\nb = a\nb.append(3)\nprint(a)\n",
     "a мен b - бір нысанның екі аты: стекте екеуінде де #1 белгісі. b арқылы өзгерткен тізім a-да да өзгереді.", 0),
    ("bug", "Қатені тап", "уақытты кері айналдыру",
     "def ең_үлкен(сандар):\n    м = 0\n    for x in сандар:\n        if x > м:\n            м = x\n    return м\n\nprint(ең_үлкен([-5, -2, -9]))\n",
     "Жауап -2 болуы керек еді, бірақ 0 шықты. Тергеу: ағаштағы ең_үлкен түйінін бас - функция жауап қайтарған сәтке барасың. Сосын стектегі м атауын бас: X-RAY оның мәні қай нұсқауда жазылғанын көрсетеді.", 1),
]

# Курс апталары: academy/xray.html#ex=<мысал>
WEEK = {6: ("loop", "X-RAY: цикл байт-кодта - кері секіріс"), 7: ("fact", "X-RAY: рекурсия стекте және ағашта"),
        8: ("alias", "X-RAY: бір тізім, екі атау"), 9: ("fib", "X-RAY: Фибоначчи ағашы мен мемоизация")}

# Машина деңгейі: байт-код нұсқауларын орындайтын аппаратура - 3D зертхананың архитектура сабақтары
MACHINE = [("arch-3-gates", "Логикалық элементтер"), ("arch-4-adder", "Қосындылағыш"), ("arch-2-arith", "Екілік арифметика"),
           ("arch-5-cpu", "Процессор"), ("arch-6-asm", "Ассемблер"), ("arch-7-memory", "Жад"), ("arch-8-cache", "Кэш"),
           ("arch-11-branch", "Тармақты болжау")]


def data():
    return {"examples": [{"id": i, "title": t, "concept": c, "code": code, "note": n} for i, t, c, code, n, _calls in EXAMPLES],
            "machine": [{"id": h, "title": t, "href": f"3d/arch/{h}.html"} for h, t in MACHINE]}


def validate():
    errs, X = [], _xray()
    ids = [e[0] for e in EXAMPLES]
    if len(set(ids)) != len(ids):
        errs.append("x-ray: мысал id қайталанады")
    for eid, _t, _c, code, _n, calls in EXAMPLES:
        r = json.loads(X.xray(code))
        if r["err"]:
            errs.append(f"x-ray: «{eid}» мысалы қатемен аяқталды ({r['err']})")
        elif r["total"]["calls"] != calls:
            errs.append(f"x-ray: «{eid}» мысалында {r['total']['calls']} шақыру (күтілгені {calls})")
        elif r["more"] or not r["steps"]:
            errs.append(f"x-ray: «{eid}» мысалының трассасы толық емес")
    for h, _t in MACHINE:
        if not (ROOT / "academy" / "3d" / "arch" / f"{h}.html").exists():
            errs.append(f"x-ray: машина деңгейінің сілтемесі жоқ бетке апарады ({h})")
    for _w, (eid, _t) in WEEK.items():
        if eid not in ids:
            errs.append(f"x-ray: курс аптасы белгісіз мысалға сілтейді ({eid})")
    return errs


def xray_html(page):
    d = data()
    chips = "".join(f'<button type="button" class="xr-ex" data-ex="{e["id"]}" aria-pressed="false"><b>{E(e["title"])}</b><span>{E(e["concept"])}</span></button>' for e in d["examples"])
    payload = json.dumps(d, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
    body = f"""  <div class="layout single wide">
    <article class="content xr" id="main" data-xray>
      <p class="ac-crumb"><a href="course.html">AO17 CS курсы</a> / AO17 X-RAY</p>
      <header class="xr-head">
        <h1><span class="xr-brand">AO17 X-RAY</span> Кодтың рентгені</h1>
        <p class="xr-lede">Код жаз да, оның ішіне қара. Компьютер кодты бірден орындамайды: алдымен оны ағашқа (AST) айналдырады, ағаштан виртуал машинаның нұсқауларын (байт-код) жасайды, сосын нұсқауларды бірінен соң бірін орындайды. X-RAY осының бәрін бір уақытта көрсетеді: уақыт жолағын жылжытсаң, барлық қабат бірге жүреді.</p>
      </header>
      <div class="xr-exs" role="group" aria-label="Мысалдар">{chips}</div>
      <p class="xr-note" data-xr-note></p>
      <section class="xr-work" aria-label="Рентген">
        <div class="xr-bar">
          <button class="btn gold" type="button" data-xr-run disabled>Рентгенге түсіру</button>
          <span class="xr-status" data-xr-status role="status">Python жүктелуде...</span>
        </div>
        <div class="xr-time" data-xr-time hidden>
          <button type="button" class="xr-tb" data-xr-go="first" aria-label="Басына">⏮</button>
          <button type="button" class="xr-tb" data-xr-go="prev" aria-label="Артқа">◀</button>
          <button type="button" class="xr-tb xr-play" data-xr-play aria-label="Ойнату">▶</button>
          <button type="button" class="xr-tb" data-xr-go="next" aria-label="Алға">▶|</button>
          <button type="button" class="xr-tb" data-xr-go="last" aria-label="Соңына">⏭</button>
          <label class="sr-only" for="xr-slider">Уақыт жолағы</label>
          <input id="xr-slider" class="xr-slider" type="range" min="0" max="0" value="0" data-xr-slider>
          <label class="xr-gran"><span>Қадам</span><select data-xr-gran><option value="ins">нұсқау</option><option value="line">жол</option><option value="call">шақыру</option></select></label>
          <span class="xr-pos" data-xr-pos aria-live="polite"></span>
        </div>
        <div class="xr-grid">
          <div class="xr-col xr-ca">
          <section class="xr-p xr-p-code" aria-labelledby="xr-h-code">
            <h2 id="xr-h-code"><span class="xr-n">1</span> Бастапқы код</h2>
            <label class="sr-only" for="xr-code">Python коды</label>
            <textarea id="xr-code" class="xr-code" data-xr-code spellcheck="false" autocapitalize="off" autocomplete="off" rows="14"></textarea>
            <div class="xr-src" data-xr-src tabindex="0" role="region" aria-label="Рентгендегі код: белгіленген - орындалып жатқан өрнек" hidden></div>
            <p class="xr-edit" data-xr-editrow hidden><button class="btn secondary" type="button" data-xr-edit>Кодты өңдеу</button></p>
            <div class="xr-out" data-xr-out></div>
          </section>
          <section class="xr-p xr-p-stats" aria-labelledby="xr-h-stats">
            <h2 id="xr-h-stats"><span class="xr-n">6</span> Есептеу</h2>
            <dl class="xr-stats" data-xr-stats>
              <div><dt>Функция шақыру</dt><dd data-st="calls">-</dd></div>
              <div><dt>Стек тереңдігі</dt><dd data-st="depth">-</dd></div>
              <div><dt>Нұсқау</dt><dd data-st="ins">-</dd></div>
              <div><dt>Нәтиже</dt><dd data-st="res">-</dd></div>
            </dl>
          </section>
          <section class="xr-p xr-p-hw" aria-labelledby="xr-h-hw">
            <h2 id="xr-h-hw"><span class="xr-n">7</span> Машина деңгейі</h2>
            <p class="xr-hw" data-xr-hw>Байт-код нұсқауын CPython интерпретаторы процессордың нақты нұсқауларымен орындайды. Одан төменде - жад, регистрлер, ассемблер және логикалық элементтер: оларды 3D зертханада көр.</p>
            <p class="xr-hwl" data-xr-hwl></p>
          </section>
          </div>
          <div class="xr-col xr-cb">
          <section class="xr-p xr-p-bc" aria-labelledby="xr-h-bc">
            <h2 id="xr-h-bc"><span class="xr-n">3</span> Байт-код</h2>
            <p class="xr-fn" data-xr-bcfn></p>
            <ol class="xr-bc" data-xr-bc tabindex="0" aria-label="Байт-код нұсқаулары"></ol>
            <p class="xr-op" data-xr-op></p>
          </section>
          <section class="xr-p xr-p-ast" aria-labelledby="xr-h-ast">
            <h2 id="xr-h-ast"><span class="xr-n">2</span> AST - синтаксис ағашы</h2>
            <div class="xr-ast" data-xr-ast tabindex="0" role="region" aria-label="AST ағашы"><p class="xr-empty">Python кодты алдымен ағашқа айналдырады: әр түйін - бір құрылым (функция, шарт, амал, атау).</p></div>
          </section>
          </div>
          <div class="xr-col xr-cc">
          <section class="xr-p xr-p-stack" aria-labelledby="xr-h-stack">
            <h2 id="xr-h-stack"><span class="xr-n">4</span> Шақыру стегі</h2>
            <div class="xr-stack" data-xr-stack tabindex="0" role="region" aria-label="Шақыру стегі"><p class="xr-empty">Әр функция шақырылғанда стекке жаңа жақтау қосылады: онда функцияның өз айнымалылары тұрады.</p></div>
            <p class="xr-travel" data-xr-travel aria-live="polite"></p>
          </section>
          </div>
          <section class="xr-p xr-p-tree" aria-labelledby="xr-h-tree">
            <h2 id="xr-h-tree"><span class="xr-n">5</span> Шақыру ағашы</h2>
            <div class="xr-tree" data-xr-tree tabindex="0" role="region" aria-label="Шақыру ағашы"><p class="xr-empty">Кім кімді шақырды: рекурсия ағаш болып өседі, жауаптар төменнен жоғары қайтады.</p></div>
          </section>
        </div>
      </section>
      <section class="xr-how" aria-labelledby="xr-h-how">
        <h2 id="xr-h-how">Қалай оқу керек</h2>
        <ol class="xr-steps">
          <li><b>Бір нұсқау - бір қадам.</b> Уақыт жолағын жылжыт: бастапқы кодта нұсқаудың нақты өрнегі, AST-та сол түйін, байт-кодта сол нұсқау белгіленеді.</li>
          <li><b>Стек пен ағаш.</b> Функция шақырылғанда стек өседі, ағашқа жаңа түйін қосылады; функция қайтқанда жақтау жабылады, ал ағаштағы түйін жауабын алады.</li>
          <li><b>Уақытты кері айналдыр.</b> Ағаштағы шақыруды бассаң, ол жауап қайтарған сәтке барасың. Стектегі айнымалының атын бассаң, оның мәні жазылған нұсқауға ораласың. Қате қай жерде пайда болғанын осылай табасың.</li>
        </ol>
        <p class="xr-note2">Python-ды жол-жолымен қадағалау үшін <a href="labs/python.html">Python орындалуын көру</a> зертханасы да бар. X-RAY бір қабат тереңірек түседі: AST, байт-код және машина деңгейі.</p>
      </section>
      <noscript><p>X-RAY JavaScript пен Python (Pyodide) арқылы жұмыс істейді.</p></noscript>
    </article>
  </div>
  <script type="application/json" id="xr-data">{payload}</script>"""
    return "academy/xray.html", page("academy/xray.html", "AO17 X-RAY: кодтың рентгені",
                                     "Python кодының ішіне қара: AST, байт-код, шақыру стегі, рекурсия ағашы және машина деңгейі бір уақытта. Уақыт жолағымен алға-артқа жүр, мәннің қай нұсқауда өзгергенін тап.",
                                     body, scripts=("assets/js/ao17-motion.js", "assets/js/ao17-editor.js", "assets/js/ao17-xray.js"),
                                     styles=("assets/css/ao17-editor.css", "assets/css/ao17-xray.css", "assets/css/ao17-motion.css"))
