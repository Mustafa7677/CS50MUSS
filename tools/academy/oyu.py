# © 2026 AO17 командасы. All Rights Reserved.
# AO17 CS: Ою студиясы - academy/oyu.html (жария бет). Python кодымен қазақ ою-өрнегін салу: цикл - қайталау, функция - бір
# өрнекті қайта-қайта салу, симметрия - бұру мен айна, рекурсия - өсімдік оюы. Код браузерде нағыз Python-да (Pyodide)
# орындалады: assets/py/oyu_turtle.py (turtle-дің шағын көшірмесі). Build кезінде сол модуль CPython-да галереяның суреттерін
# және тапсырмалардың мақсат суреттерін салады, сондықтан бет Python жүктелмей тұрып та толық көрінеді.
import html
import importlib.util
import json
from pathlib import Path

E = lambda s: html.escape(str(s), quote=True)  # noqa: E731
ROOT = Path(__file__).resolve().parents[2]


def _turtle():
    spec = importlib.util.spec_from_file_location("oyu_turtle", ROOT / "assets" / "py" / "oyu_turtle.py")
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


# Тапсырмалар: (id, атауы, ұғым, мақсаты, бастапқы код, шешім). Шешімнің суреті - мақсат (build кезінде салынады).
TASKS = [
    ("square", "Шаршы", "цикл", "Қабырғасы 100 шаршы сал. Бір әрекетті төрт рет жазба: for циклін қолдан.",
     "# Шаршы: алға жүр, солға бұрыл - төрт рет\nforward(100)\nleft(90)\n",
     "for _ in range(4):\n    forward(100)\n    left(90)\n"),
    ("star", "Сегіз қырлы жұлдыз", "бұрыш", "Ұзындығы 150 сегіз сәулелі жұлдыз сал: әр сәуледен кейін 135 градусқа бұрыл.",
     "# Неше рет қайталау керек? Қандай бұрыш?\nfor _ in range(2):\n    forward(150)\n    left(135)\n",
     "for _ in range(8):\n    forward(150)\n    left(135)\n"),
    ("shanyrak", "Шаңырақ", "цикл ішінде цикл", "Шаңырақ: радиусы 100 шеңбер және ортасынан шыққан 12 уық (әрқайсысы 100).",
     "# 1) 12 уық: алға 100, артқа 100, бұрыл 360/12\n# 2) шеңбер: penup(); goto(0, -100); pendown(); circle(100)\n",
     "for _ in range(12):\n    forward(100)\n    back(100)\n    left(30)\npenup()\ngoto(0, -100)\npendown()\ncircle(100)\n"),
    ("horn", "Қошқар мүйіз", "функция", "Мүйізді функция ет: тік сабақ (60), сосын радиусы 40, 28, 18, 10 болатын, әрқайсысы 90 градустық доғалар.",
     "def мүйіз():\n    forward(60)\n    for r in [40]:\n        circle(r, 90)\n\nleft(90)\nмүйіз()\n",
     "def мүйіз():\n    forward(60)\n    for r in [40, 28, 18, 10]:\n        circle(r, 90)\n\nleft(90)\nмүйіз()\n"),
    ("mirror", "Айнадай мүйіз", "симметрия", "Бір сабақтан екі жаққа бұралған қос мүйіз: оң жағы - радиустары теріс (айнадай).",
     "def мүйіз(жақ):\n    for r in [40, 28, 18, 10]:\n        circle(жақ * r, 90)\n\nleft(90)\nforward(60)\nмүйіз(1)\n# сабақтың ұшына қайтып, екінші мүйізді сал\n",
     "def мүйіз(жақ):\n    for r in [40, 28, 18, 10]:\n        circle(жақ * r, 90)\n\nleft(90)\nforward(60)\nмүйіз(1)\npenup()\ngoto(0, 60)\nsetheading(90)\npendown()\nмүйіз(-1)\n"),
    ("four", "Төрт құлақ", "айналмалы симметрия", "Бір құлақты (қос мүйіз) функция ет, сосын оны ортадан төрт рет 90 градусқа бұрып сал.",
     "def құлақ():\n    forward(50)\n    circle(25, 180)\n    circle(-12, 180)\n\nfor _ in range(1):\n    penup(); home(); pendown()\n    құлақ()\n",
     "def құлақ():\n    forward(50)\n    circle(25, 180)\n    circle(-12, 180)\n\nfor i in range(4):\n    penup(); home(); setheading(90 * i); pendown()\n    құлақ()\n"),
    ("border", "Ою жиегі", "қайталау және жылжу", "Бір өрнекті (ромб) бес рет қатарынан сал: әр жолы 60 оңға жылжы. Бастау нүктесі (-150, 0).",
     "def ромб():\n    for _ in range(2):\n        forward(40); left(60); forward(40); left(120)\n\npenup(); goto(-150, 0); pendown()\nромб()\n",
     "def ромб():\n    for _ in range(2):\n        forward(40); left(60); forward(40); left(120)\n\nfor i in range(5):\n    penup(); goto(-150 + 60 * i, 0); setheading(0); pendown()\n    ромб()\n"),
    ("tree", "Өсімдік оюы", "рекурсия", "Бұтақ функциясы өзін екі рет шақырады: тереңдігі 5, бастапқы ұзындығы 70, әр қадамда 0.7 есе қысқарады, бұрыш 30.",
     "def бұтақ(n, d):\n    if n == 0:\n        return\n    forward(d)\n    # солға бұрылып кіші бұтақ, оңға бұрылып кіші бұтақ\n    back(d)\n\nleft(90)\nбұтақ(5, 70)\n",
     "def бұтақ(n, d):\n    if n == 0:\n        return\n    forward(d)\n    left(30)\n    бұтақ(n - 1, d * 0.7)\n    right(60)\n    бұтақ(n - 1, d * 0.7)\n    left(30)\n    back(d)\n\nleft(90)\nбұтақ(5, 70)\n"),
]

# Галерея: дайын ою-өрнектер (ашып, өзгертуге болады)
EXAMPLES = [
    ("koshkar", "Қошқар мүйіз", "def мүйіз(жақ):\n    for r in [46, 34, 24, 15, 8]:\n        circle(жақ * r, 90)\n\ncolor(\"қызыл\")\npensize(5)\npenup(); goto(0, -110); setheading(90); pendown()\nforward(90)\nмүйіз(1)\npenup(); goto(0, -20); setheading(90); pendown()\nмүйіз(-1)\n"),
    ("tort", "Төрт құлақ", "def құлақ():\n    forward(60)\n    circle(30, 180)\n    circle(-14, 180)\n    circle(6, 180)\n\ncolor(\"көк\")\npensize(4)\nfor i in range(4):\n    penup(); home(); setheading(45 + 90 * i); pendown()\n    құлақ()\n"),
    ("shanyrak", "Шаңырақ", "color(\"алтын\")\npensize(3)\nfor _ in range(16):\n    forward(130); back(130); left(360 / 16)\nfor r in [130, 60, 30]:\n    penup(); goto(0, -r); setheading(0); pendown()\n    circle(r)\n"),
    ("juldyz", "Сегіз қырлы жұлдыз", "color(\"қызыл\", \"алтын\")\npensize(3)\npenup(); goto(-80, -30); pendown()\nbegin_fill()\nfor _ in range(8):\n    forward(160)\n    left(135)\nend_fill()\n"),
    ("jiek", "Ою жиегі", "def толқын():\n    circle(-18, 180)\n    circle(18, 180)\n\ncolor(\"қоңыр\")\npensize(4)\nfor y in [-70, 0, 70]:\n    penup(); goto(-180, y); setheading(90); pendown()\n    for _ in range(5):\n        толқын()\n"),
    ("bairak", "Өсімдік оюы", "def бұтақ(n, d):\n    if n == 0:\n        dot(8, \"алтын\")\n        return\n    pensize(n)\n    forward(d)\n    left(25)\n    бұтақ(n - 1, d * 0.72)\n    right(50)\n    бұтақ(n - 1, d * 0.72)\n    left(25)\n    pensize(n)\n    back(d)\n\ncolor(\"жасыл\")\npenup(); goto(0, -170); setheading(90); pendown()\nбұтақ(7, 80)\n"),
]

# «Суретті болжа» (алдымен болжа, сосын іске қос): код беріледі, оқушы үш суреттің қайсысы шығатынын таңдайды.
# (id, атауы, ұғымы, нұсқалар [код...], дұрыс нұсқаның нөмірі, түсіндірме). Тапсырманың коды - дұрыс нұсқаның коды.
# Үш сурет build кезінде салынады, бір масштабта (өлшем мен орын да ақпарат). Нұсқалар сызықтары бойынша әртүрлі болуы керек.
PRED = [
    ("angle", "Үшбұрыш па, шаршы ма?", "бұрыш",
     ["for _ in range(3):\n    forward(100)\n    left(90)\n", "for _ in range(3):\n    forward(100)\n    left(120)\n", "for _ in range(4):\n    forward(100)\n    left(90)\n"], 1,
     "Үш рет 120 градусқа бұрылу - толық айналым (3 × 120 = 360), сондықтан тұйық үшбұрыш шығады. 90 градуспен үш бұрылыс шаршының үш қабырғасын ғана салар еді."),
    ("indent", "Шегініс", "цикл денесі",
     ["for _ in range(4):\n    forward(80)\nleft(90)\nforward(80)\n", "for _ in range(4):\n    forward(80)\n    left(90)\nforward(80)\n", "forward(80)\nleft(90)\nforward(80)\n"], 0,
     "left(90) шегініссіз жазылған, сондықтан циклге кірмейді: тасбақа 4 рет алға жүріп (320 қадам түзу), сосын бір-ақ рет бұрылып, тағы 80 қадам жүреді."),
    ("dir", "Оңға ма, солға ма?", "бағыт",
     ["for _ in range(4):\n    forward(90)\n    left(90)\n", "for _ in range(2):\n    forward(90)\n    right(90)\n", "for _ in range(4):\n    forward(90)\n    right(90)\n"], 2,
     "right() сағат тілімен бұрады, сондықтан шаршы бастапқы сызықтың астында салынады. left() болса, үстінде болар еді."),
    ("mirror", "Теріс радиус", "симметрия",
     ["circle(60)\nforward(140)\ncircle(60)\n", "circle(60)\npenup()\nforward(140)\npendown()\ncircle(-60)\n", "circle(60)\npenup()\nforward(140)\npendown()\ncircle(60)\n"], 1,
     "circle(60) солға бұралып, сызықтың үстінде салынады, ал circle(-60) оңға бұралып, астында салынады. penup() екі шеңберді жалғайтын сызықты салдырмайды."),
    ("func", "Ортаға оралу", "функция",
     ["def тармақ():\n    forward(60)\n\nfor _ in range(6):\n    тармақ()\n    left(60)\n", "def тармақ():\n    forward(60)\n    back(60)\n\nfor _ in range(3):\n    тармақ()\n    left(60)\n",
      "def тармақ():\n    forward(60)\n    back(60)\n\nfor _ in range(6):\n    тармақ()\n    left(60)\n"], 2,
     "тармақ() алға барып, сол жолмен кері қайтады: тасбақа әр жолы ортаға оралады, сондықтан алты сәуле ортадан шығады. back(60) болмаса, тасбақа алға жылжып, алтыбұрыш салар еді."),
    ("rec", "Рекурсия тереңдігі", "рекурсия",
     ["def бұтақ(n):\n    if n == 0:\n        return\n    forward(40)\n    left(30)\n    бұтақ(n - 1)\n    right(60)\n    бұтақ(n - 1)\n    left(30)\n    back(40)\n\nleft(90)\nбұтақ(2)\n",
      "def бұтақ(n):\n    if n == 0:\n        return\n    forward(40)\n    left(30)\n    бұтақ(n - 1)\n    left(30)\n    back(40)\n\nleft(90)\nбұтақ(2)\n",
      "def бұтақ(n):\n    if n == 0:\n        return\n    forward(40)\n    left(30)\n    бұтақ(n - 1)\n    right(60)\n    бұтақ(n - 1)\n    left(30)\n    back(40)\n\nleft(90)\nбұтақ(1)\n"], 0,
     "бұтақ(2) өзін екі рет шақырады, ал әр бұтақ(1) тағы екі рет бұтақ(0)-ді шақырады: 1 + 2 + 4 жол, екі қабат тармақ. n == 0 болғанда функция тоқтайды."),
]


def _segs(items):
    """Суреттің «қолтаңбасы»: дөңгелектенген кесінділер жиыны (бағыты мен реті маңызды емес)."""
    out = set()
    for it in items:
        if it["t"] == "s":
            ps = [(round(x), round(y)) for x, y in it["p"]]
            out |= {tuple(sorted(ab)) for ab in zip(ps, ps[1:]) if ab[0] != ab[1]}
    return frozenset(out)


def pred_data():
    T, out = _turtle(), []
    for pid, title, concept, codes, ans, why in PRED:
        opts = [json.loads(T.run(c)) for c in codes]
        xs = [x for o in opts for it in o["items"] if it["t"] in "sf" for x, _ in it["p"]]
        ys = [-y for o in opts for it in o["items"] if it["t"] in "sf" for _, y in it["p"]]
        side = max(max(xs) - min(xs), max(ys) - min(ys)) * 1.2 + 16
        cx, cy = (max(xs) + min(xs)) / 2, (max(ys) + min(ys)) / 2
        out.append({"id": pid, "title": title, "concept": concept, "code": codes[ans], "ans": ans, "why": why,
                    "box": f"{cx - side / 2:g} {cy - side / 2:g} {side:g} {side:g}", "opts": [o["items"] for o in opts], "errs": [o["err"] for o in opts]})
    return out


COMMANDS = [("forward(d)  ·  fd", "d қадам алға"), ("back(d)  ·  bk", "d қадам артқа"), ("left(a)  ·  lt", "a градус солға бұрылу"),
            ("right(a)  ·  rt", "a градус оңға бұрылу"), ("penup()  ·  pendown()", "қаламды көтеру / түсіру"),
            ("goto(x, y)", "(x, y) нүктесіне бару"), ("setheading(a)", "бағытты a градусқа қою (0 - оңға, 90 - жоғары)"),
            ("home()", "ортаға оралу, бағыт 0"), ("circle(r, бұрыш)", "радиусы r доға; r теріс болса - оңға бұралады"),
            ("color(\"қызыл\")", "түс: қызыл, көк, алтын, жасыл, қара, сары, қоңыр, күлгін... не #hex"),
            ("pensize(w)", "сызық қалыңдығы"), ("begin_fill() ... end_fill()", "пішінді бояу (fillcolor)"), ("dot(size)", "нүкте")]


def render(items):
    return json.loads(_turtle().run(items)) if isinstance(items, str) else items


def svg(items, cls="oy-thumb", fit=False):
    """Build кезінде: тасбақа жазбасынан SVG (галерея суреті). y осі жоғары, SVG-де төмен - сондықтан y теріс.
    fit=True - кадр оюдың өз шекарасына қарай (кішкене белгіше үшін: ою бүкіл суретті толтырады)."""
    out = []
    for it in items:
        if it["t"] == "s":
            pts = " ".join(f"{x:g},{-y:g}" for x, y in it["p"])
            out.append(f'<polyline points="{pts}" fill="none" stroke="{E(it["c"])}" stroke-width="{it["w"]:g}" stroke-linecap="round" stroke-linejoin="round"/>')
        elif it["t"] == "f":
            pts = " ".join(f"{x:g},{-y:g}" for x, y in it["p"])
            out.append(f'<polygon points="{pts}" fill="{E(it["f"])}" stroke="none"/>')
        elif it["t"] == "d":
            out.append(f'<circle cx="{it["x"]:g}" cy="{-it["y"]:g}" r="{it["r"]:g}" fill="{E(it["c"])}"/>')
    # бояу (fill) астында тұрсын: алдымен полигондар
    out.sort(key=lambda s: 0 if s.startswith("<polygon") else 1)
    box = "-220 -220 440 440"
    if fit:
        xs = [x for it in items if it["t"] in "sf" for x, _ in it["p"]] + [it["x"] for it in items if it["t"] == "d"]
        ys = [-y for it in items if it["t"] in "sf" for _, y in it["p"]] + [-it["y"] for it in items if it["t"] == "d"]
        if xs and ys:
            side = max(max(xs) - min(xs), max(ys) - min(ys)) * 1.24 + 10
            cx, cy = (max(xs) + min(xs)) / 2, (max(ys) + min(ys)) / 2
            box = f"{cx - side / 2:g} {cy - side / 2:g} {side:g} {side:g}"
    return f'<svg class="{cls}" viewBox="{box}" aria-hidden="true">{"".join(out)}</svg>'


def data():
    T = _turtle()
    tasks, examples = [], []
    for tid, title, concept, goal, starter, sol in TASKS:
        r = json.loads(T.run(sol))
        tasks.append({"id": tid, "title": title, "concept": concept, "goal": goal, "starter": starter, "target": r["items"]})
    for eid, title, code in EXAMPLES:
        r = json.loads(T.run(code))
        examples.append({"id": eid, "title": title, "code": code, "items": r["items"]})
    return {"tasks": tasks, "examples": examples, "pred": [{k: v for k, v in z.items() if k != "errs"} for z in pred_data()]}


def validate():
    errs = []
    T = _turtle()
    for tid, _t, _c, _g, starter, sol in TASKS:
        r = json.loads(T.run(sol))
        if r["err"] or not r["items"]:
            errs.append(f"ою студиясы: «{tid}» тапсырмасының шешімі қате ({r['err']})")
        s = json.loads(T.run(starter))
        if s["err"]:
            errs.append(f"ою студиясы: «{tid}» тапсырмасының бастапқы коды қате ({s['err']})")
    for eid, _t, code in EXAMPLES:
        r = json.loads(T.run(code))
        if r["err"] or not r["items"]:
            errs.append(f"ою студиясы: «{eid}» үлгісі қате ({r['err']})")
    for z in pred_data():   # «Суретті болжа»: қатесіз, үш сурет әртүрлі
        if any(z["errs"]) or any(not o for o in z["opts"]):
            errs.append(f"ою студиясы: «{z['id']}» болжау тапсырмасының нұсқасы қате ({z['errs']})")
        elif len({_segs(o) for o in z["opts"]}) != len(z["opts"]):
            errs.append(f"ою студиясы: «{z['id']}» болжау тапсырмасының екі нұсқасы бірдей сурет салады")
    if sorted({z[4] for z in PRED}) != [0, 1, 2]:
        errs.append("ою студиясы: болжауда дұрыс жауап үш орынның бәрінде де болсын (әйтпесе әрдайым «А» таңдауға болады)")
    return errs


def pred_list(pred):
    return "".join(f'<li><button type="button" class="oy-pz" data-opz="{z["id"]}" aria-pressed="false"><b>{i}</b> {E(z["title"])}<span class="sr-only" data-sr></span></button></li>'
                   for i, z in enumerate(pred, 1))


def oyu_html(page):
    d = data()
    tasks = "".join(f'<li><button type="button" class="oy-task" data-task="{t["id"]}" aria-pressed="false"><span class="oy-tn">{i}</span><b>{E(t["title"])}</b><small>{E(t["concept"])}</small><i class="oy-ok" aria-hidden="true"></i></button></li>'
                    for i, t in enumerate(d["tasks"], 1))
    gallery = "".join(f'<li class="oy-ex"><button type="button" data-example="{e["id"]}">{svg(e["items"])}<b>{E(e["title"])}</b><span>Кодын ашу</span></button></li>' for e in d["examples"])
    cmds = "".join(f"<tr><td><code>{E(c)}</code></td><td>{E(x)}</td></tr>" for c, x in COMMANDS)
    payload = json.dumps({"tasks": [{k: v for k, v in t.items()} for t in d["tasks"]],
                          "examples": [{"id": e["id"], "title": e["title"], "code": e["code"]} for e in d["examples"]], "pred": d["pred"]},
                         ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
    body = f"""  <div class="layout single">
    <article class="content oy" id="main" data-oyu>
      <p class="ac-crumb"><a href="course.html">AO17 CS курсы</a> / Ою студиясы</p>
      <header class="oy-head">
        <h1>Ою студиясы</h1>
        <p class="oy-lede">Python кодымен қазақ оюын сал. Цикл - бір қозғалысты қайталау, функция - бір өрнекті қайта-қайта салу, симметрия - бұру мен айнадай шағылыстыру, рекурсия - бұтақтан бұтақ өсіру. Код браузерде нағыз Python-да орындалады.</p>
      </header>
      <section class="oy-studio" aria-label="Студия">
        <div class="oy-left">
          <div class="oy-bar">
            <button class="btn gold" type="button" data-oy-run disabled>Іске қосу</button>
            <button class="btn secondary" type="button" data-oy-reset>Бастапқы код</button>
            <span class="oy-status" data-oy-status role="status">Python жүктелуде...</span>
          </div>
          <label class="sr-only" for="oy-code">Python коды</label>
          <textarea id="oy-code" class="oy-code" data-oy-code spellcheck="false" autocapitalize="off" autocomplete="off" rows="16"></textarea>
          <p class="oy-hint">Ctrl + Enter - іске қосу. Tab - шегініс; Esc, сосын Tab - редактордан шығу.</p>
          <pre class="oy-out" data-oy-out aria-live="polite"></pre>
        </div>
        <div class="oy-right">
          <figure class="oy-canvas">
            <svg data-oy-svg viewBox="-220 -220 440 440" role="img" aria-label="Ою суреті">
              <g class="oy-grid" aria-hidden="true"><path d="M-220 0H220M0 -220V220"/><circle r="100"/><circle r="200"/></g>
              <g class="oy-target" data-oy-target></g>
              <g class="oy-draw" data-oy-draw></g>
            </svg>
          </figure>
          <p class="oy-tools">
            <label class="oy-sp"><span>Жылдамдығы</span><select data-oy-speed><option value="1">қалыпты</option><option value="3">баяу</option><option value="0">бірден</option></select></label>
            <button class="btn secondary" type="button" data-oy-share>Сілтемемен бөлісу</button>
            <button class="btn secondary" type="button" data-oy-png>PNG</button>
            <button class="btn secondary" type="button" data-oy-svgdl>SVG</button>
          </p>
          <p class="oy-share" data-oy-sharebox hidden><input type="text" readonly data-oy-link aria-label="Бөлісу сілтемесі"></p>
        </div>
      </section>
      <section class="oy-tasks" aria-labelledby="oy-t-h">
        <h2 id="oy-t-h">Сегіз тапсырма</h2>
        <p class="oy-note">Тапсырманы таңда: мақсат суреті кенепте сұр түспен көрінеді. Кодыңды жазып, іске қос, сосын «Тексеру» бас: студия суретіңді мақсатпен салыстырады.</p>
        <ol class="oy-tlist">{tasks}</ol>
        <div class="oy-tcard" data-oy-tcard hidden>
          <h3 data-oy-ttitle></h3>
          <p data-oy-tgoal></p>
          <p class="oy-row"><button class="btn gold" type="button" data-oy-check>Тексеру</button> <label class="oy-sw"><input type="checkbox" data-oy-showt checked> мақсатты көрсету</label></p>
          <p class="oy-verdict" data-oy-verdict aria-live="polite"></p>
        </div>
      </section>
      <section class="oy-pred" aria-labelledby="oy-p-h" data-oy-pred>
        <h2 id="oy-p-h">Суретті болжа</h2>
        <p class="oy-note">Кодты оқы да, қай сурет шығатынын таңда. Сосын «Тексеру» дұрыс жауапты көрсетіп, себебін түсіндіреді. Кодты іске қоспай-ақ оның не салатынын көру - бағдарламашының басты дағдысы.</p>
        <ol class="oy-plist">{pred_list(d["pred"])}</ol>
        <div class="oy-pgrid">
          <div class="oy-pleft">
            <h3 class="oy-ptitle" data-oy-ptitle></h3>
            <div class="oy-pcode" data-oy-pcode role="region" aria-label="Тапсырманың коды"></div>
          </div>
          <fieldset class="oy-popts"><legend>Қай сурет шығады?</legend>
            {"".join(f'<label class="oy-popt"><input type="radio" name="oy-pick" value="{i}" data-oy-opt><span class="oy-pl" aria-hidden="true">{L}</span><svg viewBox="-220 -220 440 440" aria-hidden="true"><g data-oy-og="{i}"></g></svg><span class="sr-only">{L} нұсқасы</span></label>' for i, L in enumerate("АӘБ"))}
          </fieldset>
        </div>
        <p class="oy-row"><button class="btn gold" type="button" data-oy-pcheck disabled>Тексеру</button> <button class="btn secondary" type="button" data-oy-pstudio>Студияда ашу</button></p>
        <p class="oy-pmsg" data-oy-pmsg role="status"></p>
      </section>
      <section class="oy-gallery" aria-labelledby="oy-g-h">
        <h2 id="oy-g-h">Галерея</h2>
        <p class="oy-note">Дайын оюлар. Кез келгенін аш, сандарын өзгертіп көр: радиус, бұрыш, қайталау саны.</p>
        <ul class="oy-glist">{gallery}</ul>
      </section>
      <section class="oy-ref" aria-labelledby="oy-r-h">
        <h2 id="oy-r-h">Командалар</h2>
        <p class="oy-note">Python-ның turtle модулінің командалары. <code>import turtle</code> не <code>from turtle import *</code> деп жазуға да болады.</p>
        <table class="oy-cmds"><tbody>{cmds}</tbody></table>
      </section>
      <noscript><p>Студия JavaScript пен Python (Pyodide) арқылы жұмыс істейді.</p></noscript>
    </article>
  </div>
  <script type="application/json" id="oy-data">{payload}</script>"""
    return "academy/oyu.html", page("academy/oyu.html", "Ою студиясы: Python-мен қазақ оюы",
                                    "Python кодымен қазақ ою-өрнегін сал: цикл, функция, симметрия, рекурсия. Сегіз тапсырма, автоматты тексеру, галерея және сілтемемен бөлісу.",
                                    body, scripts=("assets/js/ao17-motion.js", "assets/js/ao17-editor.js", "assets/js/ao17-oyu.js"),
                                    styles=("assets/css/ao17-editor.css", "assets/css/ao17-oyu.css", "assets/css/ao17-motion.css"))
