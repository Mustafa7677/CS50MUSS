# © 2026 AO17 командасы. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md.
"""Бота әлемі (academy/bota.html): тор әлемінде Ботаны Python кодымен жүргізу (Karel тектес оқу ортасы).

Карта жолдары: «.» - шөп, «#» - тау, «a» не 1-9 - алма(лар), «H» - киіз үй, «> ^ < v» - Бота және бағыты.
Оқушы коды НАҚТЫ Python-да орындалады (браузерде Pyodide, build кезінде CPython: әр деңгейдің шешімі тексеріледі).
Әр әрекет жазылады: [түрі, x, y, бағыт, код жолы] - суретті JS анимациялайды және сол сәтте орындалып жатқан жолды
белгілейді. Бір деңгейде бірнеше әлем болуы мүмкін: код бәрінде өтуі керек - сондықтан тек жалпы шешім (цикл мен шарт)
жұмыс істейді. Командалар: алға/move, солға/turn_left, ал/pick, қой/put, алды_бос/front_is_clear, сол_бос/left_is_clear,
оң_бос/right_is_clear, алма_бар/on_apple, үйде/at_home, себет/bag. Оңға бұрылу жоқ: оны оқушы функция етіп жазады.
"""
import ast
import io
import json
import re
import sys

DIRS = [(1, 0), (0, -1), (-1, 0), (0, 1)]   # 0 - шығыс (оңға), 1 - солтүстік (жоғары), 2 - батыс, 3 - оңтүстік
MAX_ACTIONS = 2000
MAX_LINES = 100000
FILE = "<бота>"


class BotaError(Exception):
    pass


class World:
    def __init__(self, rows):
        self.h, self.w = len(rows), max(len(r) for r in rows)
        self.walls, self.apples, self.home = set(), {}, None
        self.x = self.y = self.d = 0
        for y, row in enumerate(rows):
            for x, ch in enumerate(row):
                if ch == "#":
                    self.walls.add((x, y))
                elif ch == "a":
                    self.apples[(x, y)] = 1
                elif ch.isdigit() and ch != "0":
                    self.apples[(x, y)] = int(ch)
                elif ch == "H":
                    self.home = (x, y)
                elif ch in ">^<v":
                    self.x, self.y, self.d = x, y, ">^<v".index(ch)
        self.bag, self.log, self.line = 0, [], 0

    def free(self, d):
        dx, dy = DIRS[d % 4]
        nx, ny = self.x + dx, self.y + dy
        return 0 <= nx < self.w and 0 <= ny < self.h and (nx, ny) not in self.walls

    def act(self, kind):
        if len(self.log) >= MAX_ACTIONS:
            raise BotaError("Тым көп әрекет (%d-нан артық): цикл тоқтай ма?" % MAX_ACTIONS)
        self.log.append([kind, self.x, self.y, self.d, self.line])

    def move(self):
        if not self.free(self.d):
            self.act("bump")
            raise BotaError("Бота тауға не шекараға соқтығысты. Алдымен тексер: алды_бос()")
        dx, dy = DIRS[self.d]
        self.x, self.y = self.x + dx, self.y + dy
        self.act("m")

    def turn_left(self):
        self.d = (self.d + 1) % 4
        self.act("t")

    def pick(self):
        if self.apples.get((self.x, self.y), 0) <= 0:
            self.act("nopick")
            raise BotaError("Мұнда алма жоқ. Алдымен тексер: алма_бар()")
        self.apples[(self.x, self.y)] -= 1
        self.bag += 1
        self.act("p")

    def put(self):
        if self.bag <= 0:
            self.act("noput")
            raise BotaError("Себет бос: қоятын алма жоқ. Тексер: себет() > 0")
        self.apples[(self.x, self.y)] = self.apples.get((self.x, self.y), 0) + 1
        self.bag -= 1
        self.act("q")

    def left_apples(self):
        return sum(n for n in self.apples.values() if n > 0)


def check(w, goal):
    """Мақсат: «home» - Бота үйде, «clean» - далада алма қалмады, «deliver» - барлық алма киіз үйде, себет бос."""
    why = []
    if "home" in goal and (w.x, w.y) != w.home:
        why.append("Бота киіз үйге жеткен жоқ")
    if "clean" in goal and w.left_apples() > 0:
        why.append("далада %d алма қалды" % w.left_apples())
    if "deliver" in goal:
        away = w.left_apples() - max(0, w.apples.get(w.home, 0))
        if away > 0 or w.bag > 0:
            why.append("%d алма киіз үйге жеткізілмеді" % (away + w.bag))
    return why


def _api(w):
    def front_is_clear(): return w.free(w.d)
    def left_is_clear(): return w.free(w.d + 1)
    def right_is_clear(): return w.free(w.d + 3)
    def on_apple(): return w.apples.get((w.x, w.y), 0) > 0
    def at_home(): return (w.x, w.y) == w.home
    def bag(): return w.bag
    api = {"move": w.move, "turn_left": w.turn_left, "pick": w.pick, "put": w.put, "front_is_clear": front_is_clear,
           "left_is_clear": left_is_clear, "right_is_clear": right_is_clear, "on_apple": on_apple, "at_home": at_home, "bag": bag}
    kk = {"алға": "move", "солға": "turn_left", "ал": "pick", "қой": "put", "алды_бос": "front_is_clear", "сол_бос": "left_is_clear",
          "оң_бос": "right_is_clear", "алма_бар": "on_apple", "үйде": "at_home", "себет": "bag"}
    for k, v in kk.items():
        api[k] = api[v]
    return api


def explain(e):
    """Python қатесін оқушыға түсінікті қазақша кеңеске айналдыру. Нағыз Python хабары да қоса көрсетіледі."""
    m = str(e.msg if isinstance(e, SyntaxError) else e)
    if isinstance(e, BotaError):
        return m
    if isinstance(e, NameError):
        name = getattr(e, "name", None) or (re.findall(r"'([^']+)'", m) or ["?"])[0]
        if name in ("оңға", "turn_right"):
            return "«%s» командасы жоқ: оны өзің функция етіп жаз - солға() үш рет (def %s(): ...)." % (name, name)
        return "«%s» деген атау жоқ. Жазылуын тексер (мысалы: алға(), солға(), алды_бос()); функция болса, алдымен def-пен анықта." % name
    if isinstance(e, IndentationError):
        if "expected an indented block" in m:
            return "Шегініс керек: for, while, if, def жолынан кейінгі жолдар 4 бос орынмен басталады."
        if "unexpected indent" in m:
            return "Артық шегініс: бұл жол алдыңғы жолмен бір деңгейде басталуы керек."
        return "Шегініс сәйкес емес: бос орын санын тексер (4, 8, ...)."
    if isinstance(e, SyntaxError):
        if "expected ':'" in m:
            return "Қос нүкте жетпейді: for, while, if, else, def жолы «:» белгісімен аяқталады."
        if "was never closed" in m or "unmatched" in m or "does not match" in m:
            return "Жақша сәйкес емес: әр «(» белгісіне «)» керек."
        if "unterminated string" in m:
            return "Тырнақша жабылмаған: мәтін екі жағынан да тырнақшамен қоршалады."
        return "Синтаксис қатесі: жолды мұқият тексер (жақша, қос нүкте, шегініс)."
    if isinstance(e, TypeError) and "positional argument" in m:
        return "Бота командалары жақша ішіне ештеңе қабылдамайды: алға() деп жаз. Бірнеше қадам керек болса - цикл."
    if isinstance(e, RecursionError):
        return "Функция өзін-өзі шексіз шақырып жатыр: рекурсия тоқтамайды."
    if isinstance(e, ZeroDivisionError):
        return "Нөлге бөлуге болмайды."
    return "Python қатесі."


def run_one(code, rows, goal):
    w = World(rows)
    out, err, lines = io.StringIO(), None, [0]

    def tracer(frame, event, arg):
        if frame.f_code.co_filename != FILE:
            return None   # Python-ның ішкі функцияларын санамаймыз
        if event == "line":
            w.line = frame.f_lineno
            lines[0] += 1
            if lines[0] > MAX_LINES:
                raise BotaError("Код тым ұзақ орындалды: шексіз цикл болуы мүмкін.")
        return tracer
    ns = {"__name__": "__main__"}
    ns.update(_api(w))
    old = sys.stdout
    sys.stdout = out
    try:
        tree = compile(code, FILE, "exec")
        sys.settrace(tracer)
        exec(tree, ns)
    except SyntaxError as e:
        err = {"msg": explain(e), "py": "%s: %s" % (type(e).__name__, e.msg), "line": e.lineno or 0}
    except BaseException as e:  # noqa: BLE001 - оқушы кодының кез келген қатесі
        tb, line = e.__traceback__, 0
        while tb is not None:
            if tb.tb_frame.f_code.co_filename == FILE:
                line = tb.tb_lineno
            tb = tb.tb_next
        err = {"msg": explain(e), "py": "" if isinstance(e, BotaError) else "%s: %s" % (type(e).__name__, e), "line": line or w.line}
    finally:
        sys.settrace(None)
        sys.stdout = old
    why = [] if err else check(w, goal)
    return {"log": w.log, "err": err, "why": why, "ok": not err and not why, "out": out.getvalue()[:2000]}


def lint(code):
    """Жаңа бастаушының үнсіз қатесі: команда жақшасыз жазылған (алға) - Python оны қате демейді, бірақ ештеңе орындалмайды."""
    try:
        tree = ast.parse(code)
    except SyntaxError:
        return []
    names = set(_api(World(["."])).keys()) | {n.name for n in ast.walk(tree) if isinstance(n, ast.FunctionDef)}   # тек командалар мен функциялар
    out = []
    for n in ast.walk(tree):
        if isinstance(n, ast.Expr) and isinstance(n.value, ast.Name) and n.value.id in names:
            out.append({"line": n.lineno, "msg": "«%s» жақшасыз жазылған: команда орындалмады. %s() деп жаз." % (n.value.id, n.value.id)})
    return sorted(out, key=lambda x: x["line"])[:5]


def size(code):
    """Жұлдыз үшін: командалар саны (AST-тегі нұсқаулар). Бір жолға «;» арқылы тығыздау ұтыс бермейді."""
    try:
        return sum(1 for n in ast.walk(ast.parse(code)) if isinstance(n, ast.stmt))
    except SyntaxError:
        return 0


def stars(ok, n, s3):
    return 0 if not ok else 3 if n <= s3 else 2 if n <= s3 + 3 else 1


def run(code, level_json):
    lv = json.loads(level_json) if isinstance(level_json, str) else level_json
    res = [run_one(code, rows, lv["goal"]) for rows in lv["worlds"]]
    ok = all(r["ok"] for r in res)
    n = size(code)
    return json.dumps({"worlds": res, "ok": ok, "size": n, "stars": stars(ok, n, lv["s3"]), "lint": lint(code)}, ensure_ascii=False)
