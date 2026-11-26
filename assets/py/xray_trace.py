# © 2026 AO17 командасы. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md.
"""AO17 X-RAY (academy/xray.html): Python кодының рентгені.

Оқушы коды НАҚТЫ Python-да орындалады (браузерде Pyodide). sys.settrace пен frame.f_trace_opcodes арқылы әр БАЙТ-КОД
нұсқауының алдындағы күй жазылады, сондықтан бір қадам бірнеше қабатта қатар көрінеді:
  бастапқы код (нұсқаудың нақты жолы мен бағаны: dis positions) -> AST түйіні (сол аралық) -> байт-код нұсқауы ->
  шақыру стегі (әр жақтаудың айнымалылары) -> шақыру ағашы (рекурсия) -> stdout.
xray(code) -> JSON: {
  ast:   {i, t, v?, p: [жол, баған, соңғы жол, соңғы баған], k: [...]},
  codes: [{n: атауы, ins: [[ығысу, нұсқау, аргумент, l1, c1, l2, c2], ...]}],
  snaps: [[[шақыру id, [[атау, мән]...]], ...] ...]   - стектің күйлері (қайталанбас үшін бір рет сақталады),
  steps: [[код, ығысу, шақыру id, стек күйі, stdout ұзындығы], ...],
  calls: [{i, p, fn, a, r, s, e, d}],  out, err, total: {ins, calls, depth}, more }
Шектеу: STEP_LIMIT қадам жазылады; бағдарлама одан әрі орындала береді (шақыру мен нұсқау саны есептеледі),
бірақ RUN_LIMIT нұсқаудан кейін тоқтатылады - шексіз цикл бетті қатырмайды.
"""
import ast
import builtins
import dis
import io
import json
import sys
import types

FILE = "<x-ray>"
STEP_LIMIT = 3000
RUN_LIMIT = 400000
CALL_LIMIT = 2500
OUT_LIMIT = 4000
AST_LIMIT = 500
REPR = 48

MSG = {
    "SyntaxError": "Синтаксис қатесі: Python бұл жолды оқи алмады. Жақша, қос нүкте (:) не тырнақша жетіспеуі мүмкін.",
    "IndentationError": "Шегініс қатесі: for, while, if, def жолынан кейінгі жолдар 4 бос орынмен басталады.",
    "TabError": "Шегіністе Tab пен бос орын араласқан. Тек бос орын қолдан.",
    "NameError": "Анықталмаған атау: айнымалыға әлі мән берілмеген не аты қате жазылған.",
    "TypeError": "Түр қатесі: амал бұл түрге жарамайды (мысалы, жол мен санды қосу) не функцияға аргумент саны қате.",
    "ValueError": "Мән қатесі: түрі дұрыс, бірақ мәні жарамсыз (мысалы, int('abc')).",
    "IndexError": "Индекс шекарадан тыс: n элементті тізімде индекс 0-ден n - 1-ге дейін.",
    "KeyError": "Сөздікте мұндай кілт жоқ.",
    "ZeroDivisionError": "Нөлге бөлу: бөлгіш 0 болды.",
    "RecursionError": "Рекурсия тым терең: базалық жағдай жоқ не оған жетпейді.",
    "AttributeError": "Нысанда мұндай әдіс не қасиет жоқ.",
    "UnboundLocalError": "Функция ішінде айнымалыға мән бермей тұрып оны қолдандың.",
    "Limit": "Тым ұзақ: %d нұсқаудан кейін тоқтатылды. Шексіз цикл болуы мүмкін." % RUN_LIMIT,
    "Input": "input() рентгенде жоқ: мәнді кодқа тікелей жаз (мысалы, n = 5).",
}

OPS = {ast.Add: "+", ast.Sub: "-", ast.Mult: "*", ast.Div: "/", ast.FloorDiv: "//", ast.Mod: "%", ast.Pow: "**", ast.MatMult: "@",
       ast.LShift: "<<", ast.RShift: ">>", ast.BitOr: "|", ast.BitXor: "^", ast.BitAnd: "&", ast.Eq: "==", ast.NotEq: "!=",
       ast.Lt: "<", ast.LtE: "<=", ast.Gt: ">", ast.GtE: ">=", ast.Is: "is", ast.IsNot: "is not", ast.In: "in", ast.NotIn: "not in",
       ast.And: "and", ast.Or: "or", ast.Not: "not", ast.USub: "-", ast.UAdd: "+", ast.Invert: "~"}
SKIP = (ast.expr_context, ast.operator, ast.cmpop, ast.unaryop, ast.boolop)
GEN = 0x20 | 0x80 | 0x100 | 0x200   # CO_GENERATOR, CO_COROUTINE, CO_ITERABLE_COROUTINE, CO_ASYNC_GENERATOR


class _Limit(BaseException):
    pass


class _NoInput(Exception):
    pass


def _short(v, n=REPR):
    try:
        r = repr(v)
    except Exception:  # noqa: BLE001 - оқушының нысанының repr-і құлауы мүмкін
        r = "<?>"
    return r if len(r) <= n else r[: n - 1] + "…"


def _label(n):
    if isinstance(n, ast.Name):
        return n.id
    if isinstance(n, ast.Constant):
        return _short(n.value, 24)
    if isinstance(n, (ast.BinOp, ast.UnaryOp, ast.AugAssign)):
        return OPS.get(type(n.op), "")
    if isinstance(n, ast.BoolOp):
        return OPS.get(type(n.op), "")
    if isinstance(n, ast.Compare):
        return " ".join(OPS.get(type(o), "?") for o in n.ops)
    if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
        return n.name
    if isinstance(n, ast.Call) and isinstance(n.func, ast.Name):
        return n.func.id + "()"
    if isinstance(n, ast.Attribute):
        return "." + n.attr
    if isinstance(n, ast.arg):
        return n.arg
    return ""


def _col(lines):
    """CPython баған нөмірін UTF-8 байтпен береді; қазақша атауларда әріп 2 байт - JS үшін әріп нөміріне айналдырамыз."""
    def cc(line, col):
        if col is None or col < 0 or not line or line > len(lines):
            return -1 if col is None else col
        return len(lines[line - 1].encode("utf-8")[:col].decode("utf-8", "ignore"))
    return cc


def _ast(tree, cc):
    """AST -> ықшам JSON: әр түйінде түрі, белгісі және бастапқы кодтағы аралығы (байт-кодпен сәйкестендіру үшін)."""
    count = [0]

    def node(n):
        d = {"i": count[0], "t": type(n).__name__}
        count[0] += 1
        if getattr(n, "lineno", None) is not None:
            l2 = getattr(n, "end_lineno", None) or n.lineno
            d["p"] = [n.lineno, cc(n.lineno, n.col_offset), l2, cc(l2, getattr(n, "end_col_offset", None) or n.col_offset)]
        v = _label(n)
        if v:
            d["v"] = v
        kids = []
        for _f, val in ast.iter_fields(n):
            for x in (val if isinstance(val, list) else [val]):
                if isinstance(x, ast.AST) and not isinstance(x, SKIP) and count[0] < AST_LIMIT:
                    kids.append(node(x))
        if kids:
            d["k"] = kids
        return d
    return node(tree)


def _codes(co, cc):
    """Барлық код нысандары (модуль, функциялар, ішкі функциялар) және олардың нұсқаулары (нақты аралығымен)."""
    out, index = [], {}

    def walk(c):
        index[c] = len(out)
        ins = []
        for i in dis.get_instructions(c):
            p = getattr(i, "positions", None)
            l1 = p.lineno if p and p.lineno is not None else -1
            l2 = p.end_lineno if p and p.end_lineno is not None else -1
            pos = [l1, cc(l1, p.col_offset) if p and p.col_offset is not None else -1, l2, cc(l2, p.end_col_offset) if p and p.end_col_offset is not None else -1]
            ins.append([i.offset, i.opname, (i.argrepr or "")[:32]] + pos)
        out.append({"n": getattr(c, "co_qualname", c.co_name), "ins": ins})
        for k in c.co_consts:
            if isinstance(k, types.CodeType):
                walk(k)
    walk(co)
    return out, index


_PRIMED = [False]


def _prime():
    """CPython 3.12 (Pyodide): sys.settrace алғаш қосылғанда f_trace_opcodes әсер етпейді (нұсқау оқиғасы келмейді),
    келесі рет жұмыс істейді. Сондықтан бос кодпен бір рет алдын ала іске қосып аламыз."""
    if _PRIMED[0]:
        return

    def p(frame, ev, arg):
        if frame.f_code.co_filename != "<prime>":
            return None
        frame.f_trace_opcodes = True
        return p
    sys.settrace(p)
    try:
        exec(compile("x = 1\n", "<prime>", "exec"), {})
    finally:
        sys.settrace(None)
    _PRIMED[0] = True


def xray(code, limit=STEP_LIMIT):
    _prime()
    res = {"ast": None, "codes": [], "snaps": [], "steps": [], "calls": [], "out": "", "err": None,
           "total": {"ins": 0, "calls": 0, "depth": 0}, "more": False}
    try:
        tree = ast.parse(code)
        co = compile(code, FILE, "exec")
    except SyntaxError as e:
        kind = type(e).__name__
        res["err"] = {"kind": kind, "msg": MSG.get(kind, MSG["SyntaxError"]), "py": "%s: %s" % (kind, e.msg), "line": e.lineno or 0}
        return json.dumps(res, ensure_ascii=False)
    cc = _col(code.splitlines())
    res["ast"] = _ast(tree, cc)
    res["codes"], cindex = _codes(co, cc)
    out = io.StringIO()
    steps, calls, snaps, sidx = res["steps"], res["calls"], res["snaps"], {}
    stack, fcall = [], {}          # белсенді шақырулар (id) және жақтау -> шақыру id
    marks, keep = {}, []           # өзгермелі нысандардың белгісі (#1, #2): екі атауда бір белгі - бір нысан
    tot = res["total"]
    user_names = set()

    def show(v):
        if isinstance(v, (list, dict, set, bytearray)):
            k = id(v)
            if k not in marks:
                marks[k] = "#%d" % (len(marks) + 1)
                keep.append(v)
            return marks[k] + " " + _short(v, REPR - 4)
        if isinstance(v, types.FunctionType):
            return "ƒ " + v.__name__
        return _short(v)

    def frame_vars(f):
        if f.f_code.co_name == "<module>":
            items = [(k, v) for k, v in f.f_globals.items() if k in user_names and not k.startswith("__")]
        else:
            items = list(f.f_locals.items())
        return [[k, show(v)] for k, v in items[:24]]

    def snapshot(frame):
        chain, f = [], frame
        while f is not None:
            if f.f_code.co_filename == FILE and id(f) in fcall:
                chain.append(f)
            f = f.f_back
        chain.reverse()
        snap = [[fcall[id(f)], frame_vars(f)] for f in chain[-30:]]
        key = json.dumps(snap, ensure_ascii=False)
        if key not in sidx:
            sidx[key] = len(snaps)
            snaps.append(snap)
        return sidx[key]

    def trace(frame, ev, arg):
        if frame.f_code.co_filename != FILE:
            return None
        if ev == "call":
            if id(frame) in fcall:            # генератор қайта жалғасты
                stack.append(fcall[id(frame)])
            else:
                cid = len(calls) if len(calls) < CALL_LIMIT else -1
                if frame.f_code.co_name != "<module>":
                    tot["calls"] += 1
                if cid >= 0:
                    c = frame.f_code
                    args = "" if c.co_name == "<module>" else ", ".join("%s=%s" % (k, show(frame.f_locals.get(k))) for k in c.co_varnames[:c.co_argcount])
                    calls.append({"i": cid, "p": stack[-1] if stack else -1, "fn": c.co_name, "a": args[:80], "s": len(steps), "d": len(stack)})
                fcall[id(frame)] = cid
                stack.append(cid)
                tot["depth"] = max(tot["depth"], len(stack) - 1)
            frame.f_trace_opcodes = True
            return trace
        if ev == "line":
            # CPython 3.12+: «call» кезінде қосылған f_trace_opcodes келесі оқиғаға дейін әсер етпейді - қайта қосамыз
            frame.f_trace_opcodes = True
            return trace
        if ev == "opcode":
            tot["ins"] += 1
            if tot["ins"] > RUN_LIMIT:
                raise _Limit()
            if len(steps) < limit:
                ci = cindex.get(frame.f_code)
                if ci is not None:
                    steps.append([ci, frame.f_lasti, fcall.get(id(frame), -1), snapshot(frame), min(len(out.getvalue()), OUT_LIMIT)])
            else:
                res["more"] = True
        elif ev == "return":
            cid = fcall.get(id(frame))
            if stack:
                stack.pop()
            if frame.f_code.co_flags & GEN:
                keep.append(frame)     # генератор қайта жалғасуы мүмкін: жақтауды тірі ұстаймыз (id басқа жақтауға берілмесін)
            else:
                fcall.pop(id(frame), None)   # аяқталған жақтау: оның id-і жаңа жақтауға қайта берілуі мүмкін
            if cid is not None and cid >= 0 and frame.f_code.co_name != "<module>":
                calls[cid]["r"] = show(arg)
                calls[cid]["e"] = len(steps)
        return trace

    def no_input(*_a, **_k):
        raise _NoInput()
    ns = {"__name__": "__main__", "input": no_input}
    for n in ast.walk(tree):     # модуль деңгейіндегі оқушы атаулары (globals-тан тек солар көрсетіледі)
        if isinstance(n, ast.Name) and isinstance(n.ctx, ast.Store):
            user_names.add(n.id)
        elif isinstance(n, (ast.FunctionDef, ast.ClassDef, ast.AsyncFunctionDef)):
            user_names.add(n.name)
        elif isinstance(n, (ast.Import, ast.ImportFrom)):
            user_names.update((a.asname or a.name).split(".")[0] for a in n.names)
    old = sys.stdout
    sys.stdout = out
    sys.settrace(trace)
    try:
        exec(co, ns)
    except BaseException as e:  # noqa: BLE001 - оқушы кодының кез келген қатесі
        kind = "Limit" if isinstance(e, _Limit) else "Input" if isinstance(e, _NoInput) else type(e).__name__
        tb, line = e.__traceback__, 0
        while tb is not None:
            if tb.tb_frame.f_code.co_filename == FILE:
                line = tb.tb_lineno
            tb = tb.tb_next
        res["err"] = {"kind": kind, "msg": MSG.get(kind, "Python қатесі."), "py": "" if kind in ("Limit", "Input") else "%s: %s" % (kind, _short(e, 120)), "line": line}
    finally:
        sys.settrace(None)
        sys.stdout = old
    res["out"] = out.getvalue()[:OUT_LIMIT]
    return json.dumps(res, ensure_ascii=False)
