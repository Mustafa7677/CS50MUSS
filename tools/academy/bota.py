# © 2026 AO17 командасы. All Rights Reserved.
# AO17 CS: Бота әлемі - academy/bota.html (жария бет). Оқушы сайттың ботақаны Ботаны Python кодымен жүргізеді: дала торында
# алға жүреді, бұрылады, алма жинайды, таудан айналып өтіп, киіз үйге жетеді (Karel тектес оқу ортасы). Код браузерде нағыз
# Python-да (Pyodide) орындалады: assets/py/bota_world.py. Build кезінде сол модуль CPython-да әр деңгейдің шешімін тексереді:
# шешім барлық әлемде өтуі, «аңғал» шешім (бір әлемге жаттанды код) кемінде бір әлемде құлауы, бастапқы код синтаксистік
# дұрыс болуы керек. Шешімдер бетке жазылмайды.
import html
import importlib.util
import json
from pathlib import Path

E = lambda s: html.escape(str(s), quote=True)  # noqa: E731
ROOT = Path(__file__).resolve().parents[2]


def _world():
    spec = importlib.util.spec_from_file_location("bota_world", ROOT / "assets" / "py" / "bota_world.py")
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


RIGHT = "def оңға():\n    for _ in range(3):\n        солға()\n\n"

# Тараулар: (id, атауы, түсіндірмесі, курстың аптасы)
CHAPTERS = [
    ("seq", "Тізбек", "Алгоритм - қадамдардың нақты реті.", 4),
    ("fn", "Функция", "Жиі қайталанатын әрекетке ат беру.", 7),
    ("for", "for циклі", "Белгілі санды қайталау.", 6),
    ("while", "while циклі", "Шарт ақиқат болғанша қайталау.", 6),
    ("if", "if шарты", "Әлемге қарап шешім қабылдау.", 6),
    ("algo", "Алгоритм", "Кез келген әлемде жұмыс істейтін стратегия.", 9),
]

# Деңгейлер: тарау, id, атауы, ұғымы, мақсат мәтіні, мақсат кілттері, әлемдер, бастапқы код, кеңес, шешім, аңғал шешім.
# 3 жұлдыз шегі (s3) - шешімнің командалар саны (build кезінде есептеледі).
LEVELS = [
    ("seq", "first", "Алғашқы қадам", "команда",
     "Ботаны киіз үйге жеткіз.", ["home"],
     [[".....", ">...H", "....."]],
     "# Бота киіз үйге жетуі керек.\n# алға() - бір шаршы алға\nалға()\n",
     "Бота мен киіз үйдің арасы неше шаршы? Сонша рет алға() жаз: әр команда жаңа жолда.",
     "алға()\nалға()\nалға()\nалға()\n", None),
    ("seq", "turn", "Бұрылыс", "бұрылу",
     "Киіз үй жоғарыда: тауды айналып өт.", ["home"],
     [["...H", ".##.", ">..."]],
     "# солға() - Бота орнында тұрып, солға бұрылады\nалға()\n",
     "Бота қазір шығысқа (оңға) қарап тұр. солға() оны солтүстікке (жоғары) бұрады.",
     "алға()\nалға()\nалға()\nсолға()\nалға()\nалға()\n", None),
    ("seq", "apples", "Алма жина", "әрекет",
     "Жолдағы екі алманы жинап, киіз үйге жет.", ["home", "clean"],
     [["......", ">a.a.H", "......"]],
     "# ал() - Бота тұрған шаршыдағы алманы алады\nалға()\n",
     "Алманың үстіне жеткенде тоқта да, ал() жаз. Сосын әрі қарай жүр.",
     "алға()\nал()\nалға()\nалға()\nал()\nалға()\nалға()\n", None),
    ("fn", "right", "Оңға бұрылу", "функция",
     "Киіз үй таудың қойнауында. Python-да оңға() командасы жоқ: оны өзің жаса.", ["home"],
     [[">...#", "###.#", "#H#.#", "#...#"]],
     "# Үш рет солға бұрылу = бір рет оңға бұрылу.\n# Оны функция ет:\ndef оңға():\n    солға()\n\nалға()\n",
     "def оңға(): жолынан кейін 4 бос орынмен үш рет солға() жаз. Сосын оңға() деп шақыр - бір жолда үш бұрылыс.",
     "def оңға():\n    солға()\n    солға()\n    солға()\n\nалға()\nалға()\nалға()\nоңға()\nалға()\nалға()\nалға()\nоңға()\nалға()\nалға()\nоңға()\nалға()\n", None),
    ("fn", "stairs", "Баспалдақ", "өз функцияң",
     "Әр сатының үстінде бір алма. Барлығын жинап, киіз үйге көтеріл.", ["home", "clean"],
     [["......", ".....H", "....a#", "...a##", "..a###", ".a####", ">#####"]],
     RIGHT + "# Бір сатыға көтерілу: жоғары, оңға, алма\ndef саты():\n    солға()\n    алға()\n\nсаты()\n",
     "Әр саты бірдей: солға, алға, оңға, алға, ал. Осыны саты() функциясына жинап, бірнеше рет шақыр.",
     RIGHT + "def саты():\n    солға()\n    алға()\n    оңға()\n    алға()\n    ал()\n\nсаты()\nсаты()\nсаты()\nсаты()\nсолға()\nалға()\nоңға()\nалға()\n", None),
    ("for", "long", "Ұзын жол", "for",
     "Киіз үй алыста. Тоғыз рет алға() жазба: циклге сал.", ["home"],
     [["..........", ">........H", ".........."]],
     "# for циклі бір әрекетті бірнеше рет қайталайды:\nfor _ in range(2):\n    алға()\n",
     "range(n) - n рет қайталау. Цикл ішіндегі жол 4 бос орынмен шегінеді.",
     "for _ in range(9):\n    алға()\n", None),
    ("for", "row", "Алма қатары", "цикл денесі",
     "Әр шаршыда бір алма. Бәрін жинап, киіз үйге жет.", ["home", "clean"],
     [[".........", ">aaaaaaaH", "........."]],
     "for _ in range(7):\n    алға()\n",
     "Цикл ішінде екі команда болады: алға() және ал(). Ең соңғы алға() - циклден кейін.",
     "for _ in range(7):\n    алға()\n    ал()\nалға()\n", None),
    ("for", "trees", "Алма ағаштары", "цикл ішінде цикл",
     "Әр ағаштың астында үш алма (сан - алма саны). Бәрін жина.", ["home", "clean"],
     [[".......", ">33333H", "......."]],
     "for _ in range(5):\n    алға()\n    ал()\n",
     "Бір ағашта үш алма: ал() командасын да циклге сал. Цикл ішінде тағы бір цикл болады.",
     "for _ in range(5):\n    алға()\n    for _ in range(3):\n        ал()\nалға()\n", None),
    ("while", "until", "Белгісіз жол", "while",
     "Үш әлемде жол ұзындығы әртүрлі. Бір код үшеуінде де жұмыс істесін.", ["home"],
     [["......", ">....H", "......"], ["..........", ">........H", ".........."], ["...", ">.H", "..."]],
     "# 1-әлемде өтеді. Ал 2 мен 3-әлемде ше? Әлемдерді ауыстырып қара.\nfor _ in range(5):\n    алға()\n",
     "Неше қадам керек екені белгісіз: for көмектеспейді. while not үйде(): - «үйде болмағанша қайтала».",
     "while not үйде():\n    алға()\n",
     "for _ in range(5):\n    алға()\n"),
    ("while", "wall", "Тауға дейін", "екі while",
     "Тауға дейін жүр, сосын бұрылып, киіз үйге дейін жүр. Тау мен үйдің орны әр әлемде басқа.", ["home"],
     [["..H...", "......", "......", ">..#.."], ["........", "........", ".....H..", ">.....#."], [".....", ".H...", ".....", ">.#.."]],
     "while алды_бос():\n    алға()\n",
     "Екі цикл қатарынан: біріншісі алды_бос() болғанша, екіншісі үйде() болмағанша.",
     "while алды_бос():\n    алға()\nсолға()\nwhile not үйде():\n    алға()\n",
     "алға()\nалға()\nсолға()\nалға()\nалға()\nалға()\n"),
    ("if", "scatter", "Шашыраңқы алма", "if",
     "Алмалар әр әлемде әр жерде. Барлығын жинап, киіз үйге жет.", ["home", "clean"],
     [[".......", ">a..a.H", "......."], ["..........", ">.aa...a.H", ".........."], [".....", ">...H", "....."]],
     "while not үйде():\n    алға()\n    ал()\n",
     "Алма жоқ жерде ал() қате береді. if алма_бар(): - алма бар болса ғана ал.",
     "while not үйде():\n    алға()\n    if алма_бар():\n        ал()\n",
     "алға()\nал()\nалға()\nалға()\nалға()\nал()\nалға()\nалға()\n"),
    ("if", "piles", "Алма үйінділері", "while ішінде while",
     "Кей шаршыда бірнеше алма бар (сан - алма саны). Бәрін жина.", ["home", "clean"],
     [["......", ">2.3.H", "......"], ["........", ">.14.2.H", "........"], ["....", ">9.H", "...."]],
     "# Бір шаршыда бірнеше алма болуы мүмкін\nwhile not үйде():\n    алға()\n    # алма таусылғанша ал\n",
     "if бір-ақ рет тексереді. Шаршыда алма таусылғанша алу үшін while алма_бар(): керек.",
     "while not үйде():\n    алға()\n    while алма_бар():\n        ал()\n",
     "while not үйде():\n    алға()\n    if алма_бар():\n        ал()\n"),
    ("if", "hurdles", "Кедергілер", "if / else",
     "Жолда аласа таулар бар. Үстінен асып, киіз үйге жет.", ["home"],
     [["........", ">.#..#.H"], ["........", ">#.#...H"], [".......", ">....#H"]],
     RIGHT + "while not үйде():\n    алға()\n",
     "Алды бос болса - алға. Әйтпесе тауды асу керек: жоғары, оңға, екі қадам, төмен. Асуды функция ет.",
     RIGHT + "def асу():\n    солға()\n    алға()\n    оңға()\n    алға()\n    алға()\n    оңға()\n    алға()\n    солға()\n\n"
     "while not үйде():\n    if алды_бос():\n        алға()\n    else:\n        асу()\n",
     RIGHT + "while not үйде():\n    алға()\n"),
    ("algo", "deliver", "Керуен", "жинау және жеткізу",
     "Алмаларды жинап, киіз үйге жеткіз де, бәрін үйге қой (Бота үйдің жанынан бастайды).", ["home", "deliver"],
     [["H>.a.2.."], ["H>1..3.1.."], ["H>..a"]],
     "# 1) шекараға дейін жүріп, алма жина\n# 2) кері бұрыл, үйге қайт\n# 3) себетті босат: қой()\n",
     "Үш бөлік: while алды_бос() ішінде алма жина; екі рет солға(); while not үйде(); соңында while себет() > 0: қой().",
     "while алды_бос():\n    алға()\n    while алма_бар():\n        ал()\nсолға()\nсолға()\nwhile not үйде():\n    алға()\nwhile себет() > 0:\n    қой()\n",
     None),
    ("algo", "maze", "Лабиринт", "оң қол ережесі",
     "Үш түрлі лабиринт. Оң қолыңды қабырғадан айырмай жүрсең, шығатын жолды табасың.", ["home"],
     [[">..#...", "##.#.#.", "...#.#.", ".###.#.", ".....#H"],
      [">.#...", ".##.#.", "....#.", "#.###.", "#....H"],
      [">...#H", "##.#..", "...#.#", ".#...#", ".####.", "......"]],
     RIGHT + "while not үйде():\n    алға()\n",
     "Әр қадамда: оң жақ бос болса - оңға бұрылып алға; әйтпесе алды бос болса - алға; әйтпесе солға бұрыл. if / elif / else.",
     RIGHT + "while not үйде():\n    if оң_бос():\n        оңға()\n        алға()\n    elif алды_бос():\n        алға()\n    else:\n        солға()\n",
     RIGHT + "while not үйде():\n    if алды_бос():\n        алға()\n    else:\n        оңға()\n"),
    ("algo", "field", "Алма бағы", "жылан жолы",
     "Бақтың өлшемі әр әлемде әртүрлі. Барлық алманы жина: қатарма-қатар, жылан сияқты.", ["clean"],
     [["aaaa", "aa2a", ">aaa"], ["aa.aa", "a2a.a", "aaaaa", ">aa3a"], ["aa", "a3", "aa", ">a"], [">a2a.a"]],
     RIGHT + "def жина():\n    while алма_бар():\n        ал()\n\n# бір қатарды соңына дейін жина\ndef қатар():\n    жина()\n\nқатар()\n",
     "Қатарды жинағаннан кейін жоғары көтеріліп, кері бағытта жина. Солға бұрылу мен оңға бұрылу кезектеседі; жоғары жол жабық болса - тоқта (break).",
     RIGHT + "def жина():\n    while алма_бар():\n        ал()\n\ndef қатар():\n    жина()\n    while алды_бос():\n        алға()\n        жина()\n\n"
     "қатар()\nwhile сол_бос():\n    солға()\n    алға()\n    солға()\n    қатар()\n    if оң_бос():\n        оңға()\n        алға()\n        оңға()\n        қатар()\n    else:\n        break\n",
     "for _ in range(3):\n    алға()\n    ал()\n"),
]

# Командалар анықтамасы: (қазақша, ағылшынша, мағынасы)
COMMANDS = [("алға()", "move()", "бір шаршы алға"), ("солға()", "turn_left()", "орнында 90° солға бұрылу"),
            ("ал()", "pick()", "тұрған шаршыдан бір алма алу"), ("қой()", "put()", "себеттен бір алма қою"),
            ("алды_бос()", "front_is_clear()", "алдында тау не шекара жоқ па"), ("сол_бос()", "left_is_clear()", "сол жағы бос па"),
            ("оң_бос()", "right_is_clear()", "оң жағы бос па"), ("алма_бар()", "on_apple()", "тұрған шаршыда алма бар ма"),
            ("үйде()", "at_home()", "Бота киіз үйде ме"), ("себет()", "bag()", "себеттегі алма саны")]

# Тез енгізу түймелері (телефонда «_» мен жақшаны теру қиын): (жазуы, енгізілетін мәтін)
CHIPS = [("алға()", "алға()"), ("солға()", "солға()"), ("ал()", "ал()"), ("қой()", "қой()"),
         ("алды_бос()", "алды_бос()"), ("сол_бос()", "сол_бос()"), ("оң_бос()", "оң_бос()"), ("алма_бар()", "алма_бар()"),
         ("үйде()", "үйде()"), ("себет()", "себет()"), ("for", "for _ in range(3):\n    "), ("while", "while not үйде():\n    "),
         ("if", "if алма_бар():\n    "), ("else", "else:\n    "), ("def", "def оңға():\n    ")]


def _level_json(lv, s3):
    ch, lid, title, concept, goal, keys, worlds, starter, hint, _sol, _naive = lv
    return {"id": lid, "ch": ch, "title": title, "concept": concept, "goal": goal, "keys": keys, "worlds": worlds,
            "starter": starter, "hint": hint, "s3": s3}


def data():
    W = _world()
    return {"chapters": [{"id": c, "title": t, "note": n, "week": w} for c, t, n, w in CHAPTERS],
            "levels": [_level_json(lv, W.size(lv[9])) for lv in LEVELS]}


def validate():
    errs, W = [], _world()
    ids = [lv[1] for lv in LEVELS]
    if len(set(ids)) != len(ids):
        errs.append("бота әлемі: деңгей id қайталанады")
    chs = {c[0] for c in CHAPTERS}
    for ch, lid, _t, _c, _g, keys, worlds, starter, _h, sol, naive in LEVELS:
        if ch not in chs:
            errs.append(f"бота әлемі: «{lid}» деңгейінің тарауы белгісіз ({ch})")
        for rows in worlds:
            flat = "".join(rows)
            if sum(flat.count(c) for c in ">^<v") != 1 or ("home" in keys or "deliver" in keys) and flat.count("H") != 1:
                errs.append(f"бота әлемі: «{lid}» әлемінде бір Бота және бір киіз үй болуы керек")
            if len({len(r) for r in rows}) != 1:
                errs.append(f"бота әлемі: «{lid}» әлемінің жолдары бірдей ұзын емес")
            if max(len(rows[0]), len(rows)) > 10:
                errs.append(f"бота әлемі: «{lid}» әлемі тым үлкен (10x10-нан аспасын)")
        lvj = {"worlds": worlds, "goal": keys, "s3": W.size(sol)}
        r = json.loads(W.run(sol, lvj))
        if not r["ok"] or r["stars"] != 3:
            bad = [(i + 1, w["err"], w["why"]) for i, w in enumerate(r["worlds"]) if not w["ok"]]
            errs.append(f"бота әлемі: «{lid}» деңгейінің шешімі өтпеді: {bad}")
        if len(worlds) > 1 and naive:
            nr = json.loads(W.run(naive, lvj))
            if nr["ok"]:
                errs.append(f"бота әлемі: «{lid}» деңгейінде аңғал шешім де өтіп кетті - әлемдер жалпы шешімді талап етпейді")
            if json.loads(W.run(naive, {"worlds": worlds[:1], "goal": keys, "s3": 99}))["ok"] is False and lid not in ("hurdles", "maze", "field", "piles"):
                errs.append(f"бота әлемі: «{lid}» деңгейінің аңғал шешімі 1-әлемде де өтпейді (ол 1-әлемге жаттанды болуы керек)")
        try:
            compile(starter, "<бота>", "exec")
        except SyntaxError as e:
            errs.append(f"бота әлемі: «{lid}» деңгейінің бастапқы коды қате ({e})")
        sr = json.loads(W.run(starter, lvj))
        if sr["ok"]:
            errs.append(f"бота әлемі: «{lid}» деңгейінің бастапқы коды бірден өтіп кетеді")
    return errs


def chip_html():
    return "".join(f'<button type="button" class="bw-chip{" kw" if not c.endswith(")") else ""}" data-ins="{E(ins)}">{E(c)}</button>' for c, ins in CHIPS)


SPRITES = """<defs>
  <symbol id="bw-s-side" viewBox="0 0 120 120"><ellipse cx="60" cy="112" rx="34" ry="5" fill="#000" opacity=".14"/><g fill="#c98a4a"><rect x="38" y="84" width="9" height="24" rx="4"/><rect x="73" y="84" width="9" height="24" rx="4"/></g><path d="M30 86 C26 64 44 60 52 66 C56 50 72 50 76 64 C88 62 96 72 92 86 Z" fill="#e3a865"/><path d="M40 74 h44 v10 h-44 z" fill="#0a4c7a"/><path d="M44 79 l4 -3 l4 3 l-4 3 z M58 79 l4 -3 l4 3 l-4 3 z M72 79 l4 -3 l4 3 l-4 3 z" fill="#f2b705"/><path d="M84 70 C90 54 88 40 92 32" stroke="#e3a865" stroke-width="12" stroke-linecap="round" fill="none"/><ellipse cx="98" cy="30" rx="15" ry="12" fill="#e3a865"/><ellipse cx="108" cy="34" rx="7" ry="6" fill="#f0c48f"/><ellipse cx="88" cy="20" rx="3.5" ry="6" fill="#c98a4a" transform="rotate(-20 88 20)"/><circle cx="98" cy="27" r="4.2" fill="#14213d"/><circle cx="99.3" cy="25.6" r="1.4" fill="#fff"/><path d="M104 37 q4 3 8 0" stroke="#8a5a2b" stroke-width="1.6" fill="none" stroke-linecap="round"/><circle cx="102" cy="33" r="2.4" fill="#f08a7a" opacity=".6"/><path d="M86 18 q12 -14 24 0 z" fill="#c4342d"/><circle cx="98" cy="9" r="2.6" fill="#f2b705"/><path d="M30 76 q-8 2 -6 12" stroke="#c98a4a" stroke-width="3" fill="none" stroke-linecap="round"/></symbol>
  <symbol id="bw-s-front" viewBox="0 0 120 120"><ellipse cx="60" cy="112" rx="30" ry="5" fill="#000" opacity=".14"/><g fill="#c98a4a"><rect x="42" y="84" width="10" height="24" rx="4"/><rect x="68" y="84" width="10" height="24" rx="4"/></g><ellipse cx="60" cy="80" rx="31" ry="15" fill="#e3a865"/><path d="M30 76 h60 v9 q-30 7 -60 0 z" fill="#0a4c7a"/><path d="M40 80 l4 -3 l4 3 l-4 3 z M56 80 l4 -3 l4 3 l-4 3 z M72 80 l4 -3 l4 3 l-4 3 z" fill="#f2b705"/><rect x="53" y="40" width="14" height="36" rx="7" fill="#e3a865"/><ellipse cx="42" cy="28" rx="7" ry="3.5" fill="#c98a4a" transform="rotate(-24 42 28)"/><ellipse cx="78" cy="28" rx="7" ry="3.5" fill="#c98a4a" transform="rotate(24 78 28)"/><ellipse cx="60" cy="34" rx="16" ry="14" fill="#e3a865"/><ellipse cx="60" cy="43" rx="9" ry="7" fill="#f0c48f"/><circle cx="56.5" cy="42" r="1.2" fill="#8a5a2b"/><circle cx="63.5" cy="42" r="1.2" fill="#8a5a2b"/><path d="M56 47 q4 3 8 0" stroke="#8a5a2b" stroke-width="1.5" fill="none" stroke-linecap="round"/><circle cx="53" cy="32" r="3.6" fill="#14213d"/><circle cx="67" cy="32" r="3.6" fill="#14213d"/><circle cx="54" cy="30.8" r="1.2" fill="#fff"/><circle cx="68" cy="30.8" r="1.2" fill="#fff"/><circle cx="47" cy="39" r="2.4" fill="#f08a7a" opacity=".6"/><circle cx="73" cy="39" r="2.4" fill="#f08a7a" opacity=".6"/><path d="M47 24 q13 -17 26 0 z" fill="#c4342d"/><circle cx="60" cy="13" r="2.6" fill="#f2b705"/></symbol>
  <symbol id="bw-s-back" viewBox="0 0 120 120"><ellipse cx="60" cy="112" rx="30" ry="5" fill="#000" opacity=".14"/><ellipse cx="44" cy="24" rx="7" ry="3.5" fill="#b97c40" transform="rotate(-24 44 24)"/><ellipse cx="76" cy="24" rx="7" ry="3.5" fill="#b97c40" transform="rotate(24 76 24)"/><rect x="53" y="34" width="14" height="30" rx="7" fill="#d4995a"/><ellipse cx="60" cy="31" rx="15" ry="12" fill="#d4995a"/><path d="M47 22 q13 -17 26 0 z" fill="#c4342d"/><circle cx="60" cy="11" r="2.6" fill="#f2b705"/><g fill="#c98a4a"><rect x="42" y="84" width="10" height="24" rx="4"/><rect x="68" y="84" width="10" height="24" rx="4"/></g><ellipse cx="60" cy="80" rx="31" ry="16" fill="#e3a865"/><ellipse cx="60" cy="64" rx="17" ry="12" fill="#e3a865"/><path d="M29 72 h62 v11 q-31 8 -62 0 z" fill="#0a4c7a"/><path d="M40 77 l4 -3 l4 3 l-4 3 z M56 77 l4 -3 l4 3 l-4 3 z M72 77 l4 -3 l4 3 l-4 3 z" fill="#f2b705"/><path d="M60 88 q-3 9 2 16" stroke="#c98a4a" stroke-width="3.5" fill="none" stroke-linecap="round"/></symbol>
  <symbol id="bw-s-mtn" viewBox="-32 -32 64 64"><ellipse cx="0" cy="25" rx="27" ry="4" fill="#000" opacity=".1"/><polygon points="-6,24 11,-14 29,24" fill="#6b7a96"/><polygon points="11,-14 16.5,-2 13.5,-4.5 10.5,-1 7.5,-4" fill="#f3ead6"/><polygon points="-29,25 -5,-25 19,25" fill="#4b5d79"/><polygon points="-5,-25 2.5,-9 -0.5,-11.5 -4,-7.5 -7.5,-11 -12.5,-9" fill="#f3ead6"/><path d="M-5 -25 L-12 25" stroke="#3b4a63" stroke-width="1.5" opacity=".5"/></symbol>
  <symbol id="bw-s-yurt" viewBox="-32 -32 64 64"><ellipse cx="0" cy="26" rx="28" ry="4" fill="#000" opacity=".12"/><path d="M-25 24 V2 Q-25 -4 -18 -5 H18 Q25 -4 25 2 V24 Z" fill="#f7f0df" stroke="#b8913f" stroke-width="1.5"/><path d="M-27 -2 Q0 -32 27 -2 Z" fill="#efe2c2" stroke="#b8913f" stroke-width="1.5"/><path d="M-20 -6 L-4 -22 M20 -6 L4 -22 M-11 -4 L-2 -22 M11 -4 L2 -22" stroke="#c99a2e" stroke-width="1.2" opacity=".7"/><circle cx="0" cy="-22" r="4.5" fill="#c99a2e"/><circle cx="0" cy="-22" r="1.8" fill="#f7f0df"/><rect x="-25" y="3" width="50" height="6" fill="#b3262e"/><path d="M-19 6 l3 -2 l3 2 l-3 2 z M-3 6 l3 -2 l3 2 l-3 2 z M13 6 l3 -2 l3 2 l-3 2 z" fill="#f2d36b"/><rect x="-6.5" y="10" width="13" height="14" rx="2" fill="#0a4c7a"/><path d="M0 12 V22 M-4 17 H4" stroke="#f2d36b" stroke-width="1.2"/></symbol>
  <symbol id="bw-s-apple" viewBox="-32 -32 64 64"><ellipse cx="0" cy="14" rx="10" ry="2.5" fill="#000" opacity=".12"/><path d="M0 -6 C-4 -10 -13 -9 -13 0 C-13 8 -6 14 0 12 C6 14 13 8 13 0 C13 -9 4 -10 0 -6 Z" fill="#c4342d"/><ellipse cx="-6" cy="-2" rx="2.5" ry="4" fill="#fff" opacity=".35" transform="rotate(20 -6 -2)"/><path d="M0 -6 q1 -5 3 -8" stroke="#6b4423" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M3 -12 q7 -4 10 2 q-7 3 -10 -2 z" fill="#1f7a4d"/></symbol>
  <symbol id="bw-s-tuft" viewBox="-8 -8 16 16"><path d="M-6 6 l2 -7 l2 7 M0 6 l2 -9 l2 9" stroke="#8fa264" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></symbol>
</defs>"""


def bota_html(page):
    d = data()
    n_lv = len(d["levels"])
    by_ch = {}
    for i, lv in enumerate(d["levels"], 1):
        by_ch.setdefault(lv["ch"], []).append((i, lv))
    chapters = []
    for c in d["chapters"]:
        lvls = "".join(f'<li><button type="button" class="bw-lv" data-level="{lv["id"]}" aria-pressed="false">'
                       f'<span class="bw-lvn"><span class="sr-only">Деңгей </span>{i}</span><span class="bw-lvt">{E(lv["title"])}</span>'
                       f'<span class="bw-lvs" data-stars="0" aria-hidden="true"><i></i><i></i><i></i></span><span class="sr-only" data-sr></span></button></li>'
                       for i, lv in by_ch[c["id"]])
        chapters.append(f'<li class="bw-ch"><p class="bw-chn"><b>{E(c["title"])}</b> <span>{E(c["note"])}</span></p><ol class="bw-lvls">{lvls}</ol></li>')
    cmds = "".join(f"<tr><td><code>{E(k)}</code></td><td><code>{E(en)}</code></td><td>{E(x)}</td></tr>" for k, en, x in COMMANDS)
    payload = json.dumps(d, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
    body = f"""  <div class="layout single">
    <article class="content bw" id="main" data-bota>
      <p class="ac-crumb"><a href="course.html">AO17 CS курсы</a> / Бота әлемі</p>
      <header class="bw-head">
        <img class="bw-mascot" src="../assets/img/bota-happy.svg" alt="" width="104" height="104">
        <h1>Бота әлемі</h1>
        <p class="bw-lede">Ботаны Python кодымен жүргіз: дала торында алға жүреді, бұрылады, алма жинайды, тауды айналып өтіп, киіз үйге жетеді. {n_lv} деңгей: қарапайым тізбектен лабиринт алгоритміне дейін. Кейбір деңгейде бірнеше әлем бар, ал код бәрінде жұмыс істеуі керек.</p>
      </header>
      <nav class="bw-map" aria-label="Деңгейлер">
        <ol class="bw-chs">{"".join(chapters)}</ol>
        <p class="bw-total">Жұлдыз: <b data-bw-total>0</b> / {3 * n_lv} · өткен деңгей: <b data-bw-passed>0</b> / {n_lv}</p>
      </nav>
      <section class="bw-stage" aria-label="Деңгей">
        <div class="bw-left">
          <div class="bw-bar">
            <button class="btn gold" type="button" data-bw-run disabled>Іске қосу</button>
            <button class="btn secondary" type="button" data-bw-step disabled>Қадамдап</button>
            <button class="btn secondary" type="button" data-bw-reset>Бастапқы код</button>
            <span class="bw-status" data-bw-status role="status">Python жүктелуде...</span>
          </div>
          <label class="sr-only" for="bw-code">Python коды</label>
          <textarea id="bw-code" class="bw-code" data-bw-code spellcheck="false" autocapitalize="off" autocomplete="off" wrap="off" rows="14"></textarea>
          <p class="bw-chips" aria-label="Команданы енгізу">{chip_html()}</p>
          <p class="bw-hint">Ctrl + Enter - іске қосу. Tab - шегініс; Esc, сосын Tab - редактордан шығу. Түйме команданы курсор тұрған жерге қояды.</p>
          <div class="bw-out" data-bw-out aria-live="polite"></div>
        </div>
        <div class="bw-right">
          <div class="bw-card">
            <h2 data-bw-title>Деңгей</h2>
            <p class="bw-goal" data-bw-goal></p>
            <p class="bw-rule" data-bw-rule></p>
            <details class="bw-tip"><summary>Кеңес</summary><p data-bw-tip></p></details>
          </div>
          <div class="bw-tabs" data-bw-tabs role="group" aria-label="Әлемдер" hidden></div>
          <figure class="bw-world">
            <svg data-bw-svg viewBox="0 0 320 192" role="img" aria-label="Бота әлемі">{SPRITES}<g data-bw-board></g></svg>
          </figure>
          <p class="bw-hud">
            <span>Себет: <b data-bw-bag>0</b></span>
            <span>Әрекет: <b data-bw-n>0</b></span>
            <label class="bw-sp"><span>Жылдамдығы</span><select data-bw-speed><option value="1">қалыпты</option><option value="2">баяу</option><option value="3">жылдам</option><option value="0">бірден</option></select></label>
          </p>
          <div class="bw-verdict" data-bw-verdict aria-live="polite" hidden></div>
        </div>
      </section>
      <section class="bw-ref" aria-labelledby="bw-r-h">
        <h2 id="bw-r-h">Командалар</h2>
        <p class="bw-note">Қазақша және ағылшынша атаулар бірдей жұмыс істейді. Оңға бұрылатын команда әдейі жоқ: оны өзің функция етіп жазасың.</p>
        <table class="bw-cmds"><thead><tr><th scope="col">Қазақша</th><th scope="col">Ағылшынша</th><th scope="col">Не істейді</th></tr></thead><tbody>{cmds}</tbody></table>
      </section>
      <section class="bw-why" aria-labelledby="bw-w-h">
        <h2 id="bw-w-h">Неге бірнеше әлем?</h2>
        <p>Бір әлемге арнап «үш алға, бір солға» деп жаттап жазуға болады. Бірақ бағдарлама бір мысалға емес, көп жағдайға арналады. Сондықтан кей деңгейде екі-үш әлем бар: код олардың бәрінде өтуі керек. Бұл - тесттің мәні (курстың 8-аптасы): бағдарлама бір мысалда емес, түрлі кірісте тексеріледі.</p>
        <p>Жұлдыз кодтың қысқалығына беріледі. Функция мен цикл кодты қысқартады: бірдей әрекетті қайта жазудың орнына оған ат береміз. Бір жолға нүктелі үтірмен тығыздау ұтыс бермейді - әр команда бөлек саналады.</p>
      </section>
      <noscript><p>Бота әлемі JavaScript пен Python (Pyodide) арқылы жұмыс істейді.</p></noscript>
    </article>
  </div>
  <script type="application/json" id="bw-data">{payload}</script>"""
    return "academy/bota.html", page("academy/bota.html", "Бота әлемі: Python-мен Ботаны жүргіз",
                                     f"Ботаны Python кодымен жүргіз: алға жүр, бұрыл, алма жина, киіз үйге жет. {n_lv} деңгей: тізбек, функция, for, while, if және лабиринт алгоритмі.",
                                     body, scripts=("assets/js/ao17-motion.js", "assets/js/ao17-editor.js", "assets/js/ao17-bota.js"),
                                     styles=("assets/css/ao17-editor.css", "assets/css/ao17-bota.css", "assets/css/ao17-motion.css"))
