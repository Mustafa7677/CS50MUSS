# © 2026 Sagid Mustafa. All Rights Reserved.
"""AO17 оқу псевдокодының Python-дағы ТӘУЕЛСІЗ интерпретаторы (JS: assets/js/academy-pseudo.js).
Мақсаты - trace/count тапсырмаларының кілттерін JS-тен бөлек есептеу. Семантика бірдей:
div - төменге дөңгелектеу, mod - теріс емес қалдық, for/while жолы «итерация саны + 1» рет есептеледі."""
import copy
import re

PREC = {"or": 1, "and": 2, "=": 4, "≠": 4, "<": 4, ">": 4, "≤": 4, "≥": 4, "+": 5, "-": 5, "*": 6, "div": 6, "mod": 6}
TWO = {"<=": "≤", ">=": "≥", "!=": "≠", "==": "=", "<>": "≠"}


class PseudoError(Exception):
    pass


def lex(s):
    out, i = [], 0
    while i < len(s):
        c = s[i]
        if c.isspace():
            i += 1
        elif s[i:i + 2] in TWO:
            out.append(("op", TWO[s[i:i + 2]]))
            i += 2
        elif c in "()[],":
            out.append((c, c))
            i += 1
        elif c in "+-*=≠<>≤≥":
            out.append(("op", c))
            i += 1
        elif c.isdigit():
            j = i
            while j < len(s) and s[j].isdigit():
                j += 1
            out.append(("num", int(s[i:j])))
            i = j
        else:
            m = re.match(r"[A-Za-z_][A-Za-z0-9_]*", s[i:])
            if not m:
                raise PseudoError(f"түсініксіз {c!r}")
            w = m.group(0)
            if w in ("div", "mod", "and", "or", "not"):
                out.append(("op", w))
            elif w in ("true", "false"):
                out.append(("num", w == "true"))
            else:
                out.append(("id", w))
            i += len(w)
    return out + [("end", None)]


def parse_expr(src):
    t = lex(src)
    k = [0]

    def peek():
        return t[k[0]]

    def nxt():
        k[0] += 1
        return t[k[0] - 1]

    def expect(ty):
        if nxt()[0] != ty:
            raise PseudoError(f"{ty} күтілген")

    def primary():
        x = nxt()
        if x[0] == "num":
            return ("lit", x[1])
        if x[0] == "(":
            e = expr(0)
            expect(")")
            return e
        if x[0] == "[":
            items = []
            if peek()[0] != "]":
                items.append(expr(0))
                while peek()[0] == ",":
                    nxt()
                    items.append(expr(0))
            expect("]")
            return ("arr", items)
        if x == ("op", "-"):
            return ("neg", primary())
        if x == ("op", "not"):
            return ("not", expr(3))
        if x[0] == "id":
            if peek()[0] == "(":
                nxt()
                args = []
                if peek()[0] != ")":
                    args.append(expr(0))
                    while peek()[0] == ",":
                        nxt()
                        args.append(expr(0))
                expect(")")
                return ("call", x[1], args)
            node = ("var", x[1])
            while peek()[0] == "[":
                nxt()
                ix = expr(0)
                expect("]")
                node = ("idx", node, ix)
            return node
        raise PseudoError(f"күтілмеген {x}")

    def expr(mn):
        a = primary()
        while peek()[0] == "op" and peek()[1] in PREC and PREC[peek()[1]] >= mn:
            op = nxt()[1]
            a = ("bin", op, a, expr(PREC[op] + 1))
        return a

    e = expr(0)
    if peek()[0] != "end":
        raise PseudoError("өрнектің соңы түсініксіз")
    return e


def parse(src):
    lines = src.replace("\r", "").split("\n")
    pos = [0]

    def block(stops):
        body = []
        while pos[0] < len(lines):
            no = pos[0] + 1
            raw = re.sub(r"(#|//).*$", "", lines[pos[0]]).strip()
            if not raw:
                pos[0] += 1
                continue
            word = raw.split()[0]
            if word in stops:
                return body, word
            pos[0] += 1
            m = re.match(r"^if\s+(.+?)\s+then$", raw)
            if m:
                cond = parse_expr(m.group(1))
                yes, stop = block(["else", "end"])
                no2 = []
                if stop == "else":
                    pos[0] += 1
                    no2, _ = block(["end"])
                pos[0] += 1
                body.append(("if", no, cond, yes, no2))
                continue
            m = re.match(r"^while\s+(.+?)\s+do$", raw)
            if m:
                cond = parse_expr(m.group(1))
                b, _ = block(["end"])
                pos[0] += 1
                body.append(("while", no, cond, b))
                continue
            m = re.match(r"^for\s+([A-Za-z_]\w*)\s*(?:←|:=|<-)\s*(.+?)\s+to\s+(.+?)\s+do$", raw)
            if m:
                fr, to = parse_expr(m.group(2)), parse_expr(m.group(3))
                b, _ = block(["end"])
                pos[0] += 1
                body.append(("for", no, m.group(1), fr, to, b))
                continue
            m = re.match(r"^print\s+(.+)$", raw)
            if m:
                body.append(("print", no, parse_expr(m.group(1))))
                continue
            m = re.match(r"^return\s+(.+)$", raw)
            if m:
                body.append(("return", no, parse_expr(m.group(1))))
                continue
            m = re.match(r"^(.+?)\s*(?:←|:=|<-)\s*(.+)$", raw)
            if m:
                body.append(("set", no, parse_expr(m.group(1)), parse_expr(m.group(2))))
                continue
            raise PseudoError(f"{no}-жол: түсініксіз нұсқау {raw!r}")
        return body, None

    return block([])[0]


class _Ret(Exception):
    pass


def run(src, inputs=None, max_steps=20000):
    prog = parse(src)
    env = copy.deepcopy(inputs or {})
    out, counts = [], {}
    state = {"steps": 0, "result": None}

    def tick(line):
        counts[line] = counts.get(line, 0) + 1
        state["steps"] += 1
        if state["steps"] > max_steps:
            raise PseudoError("қадам шегі")

    def ev(e):
        k = e[0]
        if k == "lit":
            return e[1]
        if k == "arr":
            return [ev(x) for x in e[1]]
        if k == "var":
            if e[1] not in env:
                raise PseudoError(f"{e[1]} мәні жоқ")
            return env[e[1]]
        if k == "idx":
            a, i = ev(e[1]), ev(e[2])
            if not isinstance(a, list) or not 0 <= i < len(a):
                raise PseudoError("индекс шекарадан тыс")
            return a[i]
        if k == "call":
            args = [ev(x) for x in e[2]]
            return {"len": lambda: len(args[0]), "abs": lambda: abs(args[0]), "min": lambda: min(args), "max": lambda: max(args)}[e[1]]()
        if k == "neg":
            return -ev(e[1])
        if k == "not":
            return not ev(e[1])
        op = e[1]
        if op == "and":
            return bool(ev(e[2])) and bool(ev(e[3]))
        if op == "or":
            return bool(ev(e[2])) or bool(ev(e[3]))
        a, b = ev(e[2]), ev(e[3])
        if op in ("div", "mod") and b == 0:
            raise PseudoError("нөлге бөлу")
        return {"+": lambda: a + b, "-": lambda: a - b, "*": lambda: a * b, "div": lambda: a // b, "mod": lambda: a % b,
                "=": lambda: a == b, "≠": lambda: a != b, "<": lambda: a < b, ">": lambda: a > b, "≤": lambda: a <= b, "≥": lambda: a >= b}[op]()

    def exe(lst):
        for s in lst:
            tick(s[1])
            k = s[0]
            if k == "set":
                v = ev(s[3])
                v = list(v) if isinstance(v, list) else v
                tgt = s[2]
                if tgt[0] == "var":
                    env[tgt[1]] = v
                else:
                    a, i = ev(tgt[1]), ev(tgt[2])
                    if not 0 <= i < len(a):
                        raise PseudoError("индекс шекарадан тыс")
                    a[i] = v
            elif k == "print":
                v = ev(s[2])
                out.append("true" if v is True else "false" if v is False else str(v))
            elif k == "return":
                state["result"] = ev(s[2])
                raise _Ret
            elif k == "if":
                exe(s[3] if ev(s[2]) else s[4])
            elif k == "while":
                while ev(s[2]):
                    exe(s[3])
                    tick(s[1])
            elif k == "for":
                a, b = ev(s[3]), ev(s[4])
                for v in range(a, b + 1):
                    env[s[2]] = v
                    exe(s[5])
                    tick(s[1])

    try:
        exe(prog)
    except _Ret:
        pass
    return {"env": env, "output": out, "counts": counts, "steps": state["steps"], "result": state["result"]}
