# © 2026 Sagid Mustafa. All Rights Reserved.
"""AO17: n айнымалысы бар арифметикалық өрнектердің Python-дағы ТӘУЕЛСІЗ іске асырылуы (fractions.Fraction).
JS нұсқасы: assets/js/academy-arith.js. Грамматика бірдей: + - * / % ^, унарлы минус, жасырын көбейту (2n, n(n+1))."""
import re
from fractions import Fraction as F


def tokens(s):
    s = s.replace("·", "*").replace("×", "*").replace("−", "-").replace("²", "^2").replace("³", "^3")
    out = []
    for m in re.finditer(r"\s*(\d+|[nka]|[-+*/%^()])", s):
        out.append(m.group(1))
    if "".join(out) != re.sub(r"\s+", "", s):
        raise ValueError(f"түсініксіз таңба: {s!r}")
    return out


def parse(s):
    t = tokens(s) + [None]
    k = [0]
    peek = lambda: t[k[0]]  # noqa: E731

    def nxt():
        k[0] += 1
        return t[k[0] - 1]

    def atom():
        x = nxt()
        if x is None:
            raise ValueError("толық емес")
        if x.isdigit():
            return ("num", F(int(x)))
        if x in ("n", "k", "a"):
            return ("var", x)
        if x == "(":
            e = summ()
            if nxt() != ")":
                raise ValueError("жақша")
            return e
        raise ValueError(f"күтілмеген {x!r}")

    def power():
        b = atom()
        if peek() == "^":
            nxt()
            return ("^", b, unary())
        return b

    def unary():
        if peek() == "-":
            nxt()
            return ("neg", unary())
        if peek() == "+":
            nxt()
            return unary()
        return power()

    def starts(x):
        return x is not None and (x.isdigit() or x in ("n", "k", "a", "("))

    def prod():
        a = unary()
        while True:
            x = peek()
            if x in ("*", "/", "%"):
                nxt()
                a = (x, a, unary())
            elif starts(x):
                a = ("*", a, power())
            else:
                return a

    def summ():
        a = prod()
        while peek() in ("+", "-"):
            o = nxt()
            a = (o, a, prod())
        return a

    e = summ()
    if peek() is not None:
        raise ValueError(f"артық бөлік: {s!r}")
    return e


def ev(tr, n, prev=None):
    op = tr[0]
    if op == "num":
        return tr[1]
    if op == "var":
        if tr[1] == "a":
            if prev is None:
                raise ValueError("a мәні берілмеген")
            return prev
        return F(n)
    if op == "neg":
        return -ev(tr[1], n, prev)
    a, b = ev(tr[1], n, prev), ev(tr[2], n, prev)
    if op == "+":
        return a + b
    if op == "-":
        return a - b
    if op == "*":
        return a * b
    if op == "/":
        if b == 0:
            raise ZeroDivisionError
        return a / b
    if op == "%":
        if a.denominator != 1 or b.denominator != 1 or b == 0:
            raise ValueError("%")
        return F(int(a) % abs(int(b)))
    if op == "^":
        if b.denominator != 1 or b < 0:
            raise ValueError("^")
        return a ** int(b)


def val(s, n):
    return ev(parse(s), n)


def is_prime(x):
    if x.denominator != 1 or x < 2:
        return False
    v = int(x)
    if v % 2 == 0:
        return v == 2
    i = 3
    while i * i <= v:
        if v % i == 0:
            return False
        i += 2
    return True


def _isq(v):
    import math
    return v >= 0 and math.isqrt(v) ** 2 == v


PROPS = {
    "prime": is_prime,
    "composite": lambda x: x.denominator == 1 and x > 1 and not is_prime(x),
    "even": lambda x: x.denominator == 1 and int(x) % 2 == 0,
    "odd": lambda x: x.denominator == 1 and int(x) % 2 != 0,
    "positive": lambda x: x > 0,
    "nonneg": lambda x: x >= 0,
    "integer": lambda x: x.denominator == 1,
    "square": lambda x: x.denominator == 1 and _isq(int(x)),
    "div3": lambda x: x.denominator == 1 and int(x) % 3 == 0,
    "div6": lambda x: x.denominator == 1 and int(x) % 6 == 0,
    "any": lambda x: True,
}


def counterexamples(spec):
    lo, hi = spec["domain"]
    out = []
    for n in range(lo, hi + 1):
        if spec.get("where") and not PROPS[spec["where"]](F(n)):
            continue
        if not PROPS[spec["prop"]](val(spec["expr"], n)):
            out.append(n)
    return out


def closed_ok(term, closed, start, count=30):
    s = F(0)
    for N in range(start, start + count):
        s += val(term, N)
        if s != val(closed, N):
            return False, N
    return True, None


def recurrence_ok(spec, closed, count=30):
    rule = parse(spec["rule"])
    a = F(spec["first"])
    for N in range(spec["start"], spec["start"] + count):
        if N > spec["start"]:
            a = ev(rule, N, a)
        if a != val(closed, N):
            return False, N
    return True, None
