# © 2026 AO17 командасы. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md.
"""Ою студиясы (academy/oyu.html): Python turtle-дің шағын, адал көшірмесі.

Оқушы кодын НАҚТЫ Python орындайды (браузерде Pyodide, build кезінде CPython - галерея мен тапсырмалардың мақсат суреті
осы модульмен салынады). Тасбақа сурет салмайды: әр сызықты жазып алады (items), суретті JS SVG етіп салады.
Стандарт turtle атаулары: forward/fd, back/bk/backward, left/lt, right/rt, penup/pu/up, pendown/pd/down, goto/setpos/
setposition, setheading/seth, home, circle, dot, pencolor/color, pensize/width, fillcolor, begin_fill/end_fill, position/pos,
heading, xcor, ycor, speed, hideturtle/showturtle, done. «import turtle», «from turtle import *» және тікелей шақыру жұмыс істейді.
Шектеу: 50 000 қозғалыс және 400 000 орындалған жол (шексіз цикл бетті қатырмасын).
"""
import json
import math
import sys
import types

MAX_MOVES = 50000
MAX_LINES = 400000
COLORS = {  # қазақша түс атаулары (Алаш палитрасы); ағылшынша CSS атаулары мен #hex те жүреді
    "қызыл": "#b3262e", "көк": "#1d6ea6", "алтын": "#c99a2e", "жасыл": "#1f7a4d", "қара": "#1b1510", "ақ": "#ffffff",
    "сары": "#f2d36b", "күлгін": "#6b3fa0", "қоңыр": "#7a4a26", "сұр": "#7a8699", "қызғылт": "#d9728f", "көгілдір": "#3fa7c9",
}


class OyuError(Exception):
    pass


class _T:
    def __init__(self):
        self.reset()

    def reset(self):
        self.x, self.y, self.h = 0.0, 0.0, 0.0
        self.down, self.col, self.w, self.fill = True, "#1b1510", 2.0, "#c99a2e"
        self.items, self.cur, self.poly, self.moves = [], None, None, 0

    def _color(self, c):
        if isinstance(c, (tuple, list)) and len(c) == 3:
            k = 255 if max(c) > 1 else 1
            return "#%02x%02x%02x" % tuple(int(max(0, min(1, v / k)) * 255) for v in c)
        s = str(c).strip()
        return COLORS.get(s.lower(), s)[:32]

    def _step(self):
        self.moves += 1
        if self.moves > MAX_MOVES:
            raise OyuError("Тым көп қозғалыс (%d-нан артық): циклдің шартын тексер." % MAX_MOVES)

    def _to(self, x, y):
        self._step()
        if self.down:
            if self.cur is None:
                self.cur = {"t": "s", "c": self.col, "w": self.w, "p": [[round(self.x, 2), round(self.y, 2)]]}
                self.items.append(self.cur)
            self.cur["p"].append([round(x, 2), round(y, 2)])
        if self.poly is not None:
            self.poly.append([round(x, 2), round(y, 2)])
        self.x, self.y = x, y

    def _lift(self):
        self.cur = None

    def forward(self, d):
        d = float(d)
        r = math.radians(self.h)
        self._to(self.x + d * math.cos(r), self.y + d * math.sin(r))

    def left(self, a):
        self.h = (self.h + float(a)) % 360

    def goto(self, x, y=None):
        if y is None:
            x, y = x
        self._to(float(x), float(y))

    def circle(self, radius, extent=None, steps=None):
        radius = float(radius)
        extent = 360.0 if extent is None else float(extent)
        n = steps or max(4, int(abs(extent) / 6) + 1)
        a = extent / n
        chord = 2 * abs(radius) * math.sin(math.radians(abs(a)) / 2)   # радиус теріс болса да хорда оң: бағытты бұрылыс береді
        sign = 1 if radius >= 0 else -1
        self.left(sign * a / 2)
        for _ in range(n):
            self.forward(chord)
            self.left(sign * a)
        self.left(-sign * a / 2)

    def set_pen(self, down):
        self.down = down
        if not down:
            self._lift()


T = _T()


def forward(d): T.forward(d)
def back(d): T.forward(-float(d))
def left(a): T.left(a)
def right(a): T.left(-float(a))
def penup(): T.set_pen(False)
def pendown(): T.set_pen(True)
def goto(x, y=None): T.goto(x, y)
def setheading(a): T.h = float(a) % 360
def home(): T.goto(0, 0); setheading(0)
def circle(radius, extent=None, steps=None): T.circle(radius, extent, steps)
def position(): return (round(T.x, 2), round(T.y, 2))
def heading(): return round(T.h, 2)
def xcor(): return round(T.x, 2)
def ycor(): return round(T.y, 2)
def pensize(w=None):
    if w is None:
        return T.w
    T.w = max(.5, min(40.0, float(w))); T._lift()
def pencolor(*c):
    if not c:
        return T.col
    T.col = T._color(c[0] if len(c) == 1 else c); T._lift()
def color(*c):
    if not c:
        return T.col
    pencolor(c[0]) if len(c) <= 2 else pencolor(c)
    if len(c) == 2:
        fillcolor(c[1])
def fillcolor(*c):
    if not c:
        return T.fill
    T.fill = T._color(c[0] if len(c) == 1 else c)
def begin_fill(): T.poly = [[round(T.x, 2), round(T.y, 2)]]
def end_fill():
    if T.poly and len(T.poly) > 2:
        T.items.append({"t": "f", "f": T.fill, "p": T.poly})
    T.poly = None
def dot(size=None, c=None):
    T._step()
    T.items.append({"t": "d", "x": round(T.x, 2), "y": round(T.y, 2), "r": (float(size) if size else max(T.w + 4, T.w * 2)) / 2, "c": T._color(c) if c else T.col})
def _noop(*a, **k): return None


fd, bk, backward, lt, rt, pu, up, pd, down = forward, back, back, left, right, penup, penup, pendown, pendown
setpos = setposition = goto
seth = setheading
pos = position
width = pensize
speed = hideturtle = showturtle = ht = st = done = mainloop = exitonclick = tracer = update = _noop
NAMES = ["forward", "fd", "back", "bk", "backward", "left", "lt", "right", "rt", "penup", "pu", "up", "pendown", "pd", "down",
         "goto", "setpos", "setposition", "setheading", "seth", "home", "circle", "position", "pos", "heading", "xcor", "ycor",
         "pensize", "width", "pencolor", "color", "fillcolor", "begin_fill", "end_fill", "dot", "speed", "hideturtle", "showturtle",
         "ht", "st", "done", "mainloop", "exitonclick", "tracer", "update"]


def hint(e):
    """Python қатесіне қазақша кеңес (Бота әлеміндегі bota_world.explain сияқты). Хабардың өзі өзгермейді, кеңес қосылады."""
    import re
    m = str(e.msg if isinstance(e, SyntaxError) else e)
    if isinstance(e, NameError):
        name = getattr(e, "name", None) or (re.findall(r"'([^']+)'", m) or ["?"])[0]
        return "«%s» деген атау жоқ. Жазылуын тексер (forward, left, circle, color...); функция болса, алдымен def-пен анықта." % name
    if isinstance(e, IndentationError):
        if "expected an indented block" in m:
            return "Шегініс керек: for, def, if жолынан кейінгі жолдар 4 бос орынмен басталады."
        if "unexpected indent" in m:
            return "Артық шегініс: бұл жол алдыңғы жолмен бір деңгейде басталуы керек."
        return "Шегініс сәйкес емес: бос орын санын тексер (4, 8, ...)."
    if isinstance(e, SyntaxError):
        if "expected ':'" in m:
            return "Қос нүкте жетпейді: for, def, if жолы «:» белгісімен аяқталады."
        if "was never closed" in m or "unmatched" in m or "does not match" in m:
            return "Жақша сәйкес емес: әр «(» белгісіне «)» керек."
        if "Missing parentheses" in m or "Perhaps you forgot a comma" in m:
            return "Команданың мәні жақша ішінде жазылады: forward(100), left(90)."
        return "Жолды мұқият тексер: жақша, қос нүкте, тырнақша, шегініс."
    if isinstance(e, TypeError):
        if "missing" in m and "required positional argument" in m:
            return "Командаға мән жетпейді: мысалы, forward(100), circle(50)."
        if "interpreted as an integer" in m:
            return "range() бүтін сан қабылдайды: range(4), range(4.5) емес."
        if "unsupported operand" in m or "can't multiply" in m or "must be real number" in m:
            return "Мұнда сан керек, мәтін емес: forward(100), forward(\"100\") емес."
        if "positional argument" in m:
            return "Командаға тым көп мән берілді: жақша ішіндегі сандарды тексер."
    if isinstance(e, RecursionError):
        return "Функция өзін-өзі шексіз шақырып жатыр: рекурсияның тоқтау шарты (if n == 0: return) бар ма?"
    if isinstance(e, ZeroDivisionError):
        return "Нөлге бөлуге болмайды."
    return ""


def lint(code):
    """Жақшасыз команда (forward, turtle.left): Python оны қате демейді, бірақ ештеңе салынбайды."""
    import ast
    try:
        tree = ast.parse(code)
    except SyntaxError:
        return []
    names = set(NAMES) | {n.name for n in ast.walk(tree) if isinstance(n, ast.FunctionDef)}   # тек командалар мен функциялар
    out = []
    for n in ast.walk(tree):
        v = n.value if isinstance(n, ast.Expr) else None
        name = v.id if isinstance(v, ast.Name) else v.attr if isinstance(v, ast.Attribute) else None
        if name in names:
            out.append({"line": n.lineno, "msg": "«%s» жақшасыз жазылған: команда орындалмады. %s(...) деп жаз." % (name, name)})
    return sorted(out, key=lambda x: x["line"])[:5]


def run(code):
    """Кодты орындайды: {"items": [...], "out": "...", "err": null | {"msg": ..., "line": n, "hint": кеңес}} (JSON мәтін)."""
    import io
    T.reset()
    mod = types.ModuleType("turtle")
    for n in NAMES:
        setattr(mod, n, globals()[n])
    sys.modules["turtle"] = mod
    out, err, lines = io.StringIO(), None, [0]

    def tracer(frame, event, arg):
        if frame.f_code.co_filename == "<ою>" and event == "line":
            lines[0] += 1
            if lines[0] > MAX_LINES:
                raise OyuError("Код тым ұзақ орындалды: шексіз цикл болуы мүмкін.")
        return tracer
    ns = {"__name__": "__main__"}
    for n in NAMES:
        ns[n] = globals()[n]
    old_out = sys.stdout
    sys.stdout = out
    sys.settrace(tracer)
    try:
        exec(compile(code, "<ою>", "exec"), ns)
    except SyntaxError as e:
        err = {"msg": "Синтаксис қатесі: " + str(e.msg), "line": e.lineno or 0, "hint": hint(e)}
    except BaseException as e:  # noqa: BLE001 - оқушы кодының кез келген қатесін көрсетеміз
        tb, line = e.__traceback__, 0
        while tb is not None:
            if tb.tb_frame.f_code.co_filename == "<ою>":
                line = tb.tb_lineno
            tb = tb.tb_next
        err = {"msg": ("%s: %s" % (type(e).__name__, e)) if not isinstance(e, OyuError) else str(e), "line": line,
               "hint": "" if isinstance(e, OyuError) else hint(e)}
    finally:
        sys.settrace(None)
        sys.stdout = old_out
    return json.dumps({"items": T.items, "out": out.getvalue()[:4000], "err": err, "moves": T.moves, "warn": lint(code)}, ensure_ascii=False)
