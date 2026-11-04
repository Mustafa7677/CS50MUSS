# © 2026 Sagid Mustafa. All Rights Reserved.
"""AO17: дискретті құрылымдардың Python-дағы ТӘУЕЛСІЗ іске асырылуы (JS: assets/js/academy-disc.js).
Жиын өрнегі: ∪ ∩ \\ △ және постфикс ' (толықтауыш), A-Z атаулары, U (әмбебап), ∅."""
import re

import plogic


def tokens(s):
    s = re.sub(r"\s+", "", s)
    out = []
    for c in s:
        if c.isupper() and c.isascii():
            out.append(("set", c))
        elif c in "∪∩△()'∅":
            out.append((c, None))
        elif c == "ᶜ":
            out.append(("'", None))
        elif c in "\\∖−-":
            out.append(("\\", None))
        else:
            raise ValueError(f"түсініксіз {c!r}")
    return out + [("end", None)]


def parse(s):
    t = tokens(s)
    k = [0]

    def peek():
        return t[k[0]][0]

    def nxt():
        k[0] += 1
        return t[k[0] - 1]

    def atom():
        x = nxt()
        if x[0] == "set":
            return ("set", x[1])
        if x[0] == "∅":
            return ("empty",)
        if x[0] == "(":
            e = union()
            if nxt()[0] != ")":
                raise ValueError("жақша")
            return e
        raise ValueError(f"күтілмеген {x}")

    def post():
        a = atom()
        while peek() == "'":
            nxt()
            a = ("comp", a)
        return a

    def inter():
        a = post()
        while peek() == "∩":
            nxt()
            a = ("∩", a, post())
        return a

    def union():
        a = inter()
        while peek() in ("∪", "\\", "△"):
            o = nxt()[0]
            a = (o, a, inter())
        return a

    e = union()
    if peek() != "end":
        raise ValueError("артық бөлік")
    return e


def evaluate(s, sets, U=None):
    def go(n):
        op = n[0]
        if op == "empty":
            return frozenset()
        if op == "set":
            return frozenset(U) if n[1] == "U" else frozenset(sets[n[1]])
        if op == "comp":
            return frozenset(U) - go(n[1])
        a, b = go(n[1]), go(n[2])
        return {"∪": a | b, "∩": a & b, "\\": a - b, "△": a ^ b}[op]
    return go(parse(s))


def to_logic(s):
    def go(n):
        op = n[0]
        if op == "empty":
            return "0"
        if op == "set":
            return "1" if n[1] == "U" else n[1].lower()
        if op == "comp":
            return "¬(" + go(n[1]) + ")"
        a, b = go(n[1]), go(n[2])
        return {"∪": f"({a} ∨ {b})", "∩": f"({a} ∧ {b})", "\\": f"({a} ∧ ¬({b}))", "△": f"({a} ⊕ {b})"}[op]
    return go(parse(s))


def identical(a, b):
    return plogic.equivalent(to_logic(a), to_logic(b))


def rel_props(S, R):
    R = set(map(tuple, R))
    refl = all((a, a) in R for a in S)
    sym = all((b, a) in R for a, b in R)
    anti = all(a == b or (b, a) not in R for a, b in R)
    trans = all((a, d) in R for a, b in R for c, d in R if b == c)
    return {"reflexive": refl, "symmetric": sym, "antisymmetric": anti, "transitive": trans}


def func_kind(X, Y, pairs):
    img = {}
    for x, y in pairs:
        if x not in X or y not in Y or (x in img and img[x] != y):
            return "notfunction"
        img[x] = y
    if set(img) != set(X):
        return "notfunction"
    inj = len(set(img.values())) == len(img)
    sur = set(img.values()) == set(Y)
    return "bijective" if inj and sur else "injective" if inj else "surjective" if sur else "neither"


def graph_info(V, E):
    verts = set(V) | {x for e in E for x in e}
    adj = {v: [] for v in verts}
    for a, b in E:
        adj[a].append(b)
        adj[b].append(a)
    seen, comps = set(), 0
    for v in verts:
        if v in seen:
            continue
        comps += 1
        st = [v]
        seen.add(v)
        while st:
            x = st.pop()
            for y in adj[x]:
                if y not in seen:
                    seen.add(y)
                    st.append(y)
    simple = all(a != b for a, b in E) and len({frozenset(e) for e in E}) == len(E)
    return {"n": len(verts), "m": len(E), "degsum": sum(len(adj[v]) for v in verts), "components": comps,
            "tree": simple and comps == 1 and len(E) == len(verts) - 1}
