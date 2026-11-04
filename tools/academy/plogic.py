# © 2026 Sagid Mustafa. All Rights Reserved.
"""AO17: пікірлер логикасының Python-дағы ТӘУЕЛСІЗ іске асырылуы.

Мақсаты - тапсырма кілттерін JS қозғалтқышынан (assets/js/academy-logic.js) бөлек тексеру:
екі түрлі іске асыру бір жауап берсе, кілттегі қате байқалмай қалу ықтималдығы азаяды.
Синтаксис: ¬ ∧ ⊕ ∨ → ↔ (басымдық осы ретпен кемиді), → оңнан ассоциативті, 0/1 тұрақтылары, кіші әріп айнымалылар.
"""
import itertools
import re

BIN = {"∧": (4, False), "⊕": (3, False), "∨": (2, False), "→": (1, True), "↔": (0, False)}
NAME = {"∧": "and", "⊕": "xor", "∨": "or", "→": "imp", "↔": "iff", "¬": "not"}


def tokens(s):
    out = []
    for m in re.finditer(r"\s*([¬∧∨→↔⊕()01]|[a-z][a-z0-9_]*)", s):
        out.append(m.group(1))
    if "".join(out) != re.sub(r"\s+", "", s):
        raise ValueError(f"түсініксіз таңба: {s!r}")
    return out


def parse(s):
    t = tokens(s)
    pos = [0]

    def peek():
        return t[pos[0]] if pos[0] < len(t) else None

    def primary():
        c = peek()
        if c is None:
            raise ValueError(f"толық емес: {s!r}")
        pos[0] += 1
        if c == "¬":
            return ("not", primary())
        if c == "(":
            e = expr(0)
            if peek() != ")":
                raise ValueError(f"жақша: {s!r}")
            pos[0] += 1
            return e
        if c in ("0", "1"):
            return ("const", c == "1")
        if re.fullmatch(r"[a-z][a-z0-9_]*", c):
            return ("var", c)
        raise ValueError(f"күтілмеген {c!r}: {s!r}")

    def expr(minp):
        left = primary()
        while peek() in BIN and BIN[peek()][0] >= minp:
            op = peek()
            prec, right = BIN[op]
            pos[0] += 1
            left = (NAME[op], left, expr(prec if right else prec + 1))
        return left

    tree = expr(0)
    if pos[0] != len(t):
        raise ValueError(f"артық бөлік: {s!r}")
    return tree


def variables(tree, acc=None):
    acc = set() if acc is None else acc
    if tree[0] == "var":
        acc.add(tree[1])
    for ch in tree[1:]:
        if isinstance(ch, tuple):
            variables(ch, acc)
    return acc


def ev(tree, env):
    op = tree[0]
    if op == "const":
        return tree[1]
    if op == "var":
        return env[tree[1]]
    if op == "not":
        return not ev(tree[1], env)
    a, b = ev(tree[1], env), ev(tree[2], env)
    return {"and": a and b, "or": a or b, "xor": a != b, "imp": (not a) or b, "iff": a == b}[op]


def envs(names):
    for bits in itertools.product([False, True], repeat=len(names)):
        yield dict(zip(names, bits))


def table(s):
    tr = parse(s)
    names = sorted(variables(tr))
    return [ev(tr, e) for e in envs(names)]


def equivalent(a, b):
    ta, tb = parse(a), parse(b)
    names = sorted(variables(ta) | variables(tb))
    return all(ev(ta, e) == ev(tb, e) for e in envs(names))


def classify(s):
    v = table(s)
    return "tautology" if all(v) else "contradiction" if not any(v) else "contingent"


def valid(premises, conclusion):
    ps = [parse(p) for p in premises]
    c = parse(conclusion)
    names = sorted(set().union(*[variables(p) for p in ps], variables(c)))
    return all(ev(c, e) for e in envs(names) if all(ev(p, e) for p in ps))


def ops(tree, acc=None):
    acc = set() if acc is None else acc
    if tree[0] not in ("var", "const"):
        acc.add(tree[0])
    for ch in tree[1:]:
        if isinstance(ch, tuple):
            ops(ch, acc)
    return acc


def leaves(tree):
    if tree[0] in ("var", "const"):
        return 1
    return sum(leaves(ch) for ch in tree[1:] if isinstance(ch, tuple))


def _literal(t):
    return t[0] == "var" or (t[0] == "not" and t[1][0] == "var")


def _flat(t, op):
    return _flat(t[1], op) + _flat(t[2], op) if t[0] == op else [t]


def is_form(tree, form):
    outer, inner = ("or", "and") if form == "dnf" else ("and", "or")
    return all(all(_literal(x) for x in _flat(term, inner)) for term in _flat(tree, outer))


def neg_only_on_vars(tree):
    if tree[0] == "not" and tree[1][0] not in ("var", "const"):
        return False
    return all(neg_only_on_vars(ch) for ch in tree[1:] if isinstance(ch, tuple))


def nand_only(tree):
    if tree[0] in ("var", "const"):
        return True
    return tree[0] == "not" and tree[1][0] == "and" and nand_only(tree[1][1]) and nand_only(tree[1][2])


def constraints_ok(ex, answer):
    """Формула тапсырмасының шектеулері (JS-тегі checkFormula-мен бірдей ережелер)."""
    tr = parse(answer)
    if "allowed" in ex and not ops(tr) <= set(ex["allowed"]):
        return False
    if ex.get("noNegatedGroups") and not neg_only_on_vars(tr):
        return False
    if "maxLength" in ex and leaves(tr) > ex["maxLength"]:
        return False
    if "form" in ex and not is_form(tr, ex["form"]):
        return False
    if ex.get("nandOnly") and not nand_only(tr):
        return False
    if "requireVars" in ex and not set(ex["requireVars"]) <= variables(tr):
        return False
    return True
