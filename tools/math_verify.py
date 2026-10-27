#!/usr/bin/env python3
# © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама (LICENSE-PROPRIETARY.md, COPYRIGHT.md).
# Harvard CS50 материалдары (олар осы файлда сақталмайды) CC BY-NC-SA 4.0 бойынша; үшінші тарап компоненттері өз лицензияларымен.
"""«Математика» курсының есеп кілттерін sympy-мен автоматты тексеру (docs/MATH-COURSE-GUIDE.md §12).

  python3 tools/math_verify.py                       # барлық дайын сабақ (math/lectures/week-*.html, <!-- soon --> емес)
  python3 tools/math_verify.py math/lectures/week-0.html [...]   # нақты беттер
  python3 tools/math_verify.py --lint [файл...]      # қосымша: сабақ құрылымын тексеру (есеп/қорыту/мысал/тест саны, TeX, JSON)
  python3 tools/math_verify.py -v                    # әр есептің нәтижесін көрсету

Әр `num / expr / matrix / interval / param` есеп элементінде тәуелсіз тексеру өрнегі `"v"` МІНДЕТТІ (құжат §12). Ол - sympy өрнегі
(Python синтаксисі: x**2, sqrt(x), Rational(3,4), solve(Eq(x, 3*t-6), t)[0], diff(...), integrate(...), function_range(...), [тізім...] т.б.),
оны кілтпен (`"a"`) салыстырамыз:
  * num      - сандық мән (салыстырмалы қателік 1e-9);
  * expr     - 24 кездейсоқ нүктеде (кемі 6 жарамды нүкте) сандық сәйкестік; `eq:true` болса теңдеулер пропорционал (F_кілт = k * F_v);
  * matrix   - элемент бойынша;
  * interval - sympy жиыны (Interval/Union) ретінде теңдік (v мысалы: "continuous_domain(sqrt(x-1)/(x-3), x, S.Reals)");
  * param    - сайттың өз JS генераторымен (node) 20 түрлі seed үшін параметрлер алынады, кілт пен `v` әр жиын үшін салыстырылады;
               `#{...}` үлгілері (q, hint, sol) барлық жиында есептеледі (қате өрнек - қате).
Сонымен қатар сайттың өз парсері (assets/js/math-course.js, node арқылы) кілттерді қабылдайтынын және «кілт + 1» қате деп есептелетінін тексереді.
Қайтарады: 0 - қате жоқ; 1 - `файл:есеп id:қате` жолдары басылады.
Қауіпсіздік: "v" өрнектері шектелген ортада (builtins жоқ) орындалады, бірақ олар репозиторийдің сенімді мазмұны деп есептеледі.
"""
import json
import math
import random
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LECT = ROOT / "math" / "lectures"
SOON = "<!-- soon -->"
TYPES = {"num", "expr", "interval", "choice", "tf", "matrix", "match", "order", "reveal", "param"}
NEED_V = {"num", "expr", "matrix", "interval"}

try:
    import sympy as sp
    from sympy.parsing.sympy_parser import parse_expr, standard_transformations, implicit_multiplication_application, convert_xor
    from sympy.calculus.util import function_range, continuous_domain
except ImportError:
    print("math_verify: sympy орнатылмаған (pip install sympy)", file=sys.stderr)
    sys.exit(2)

TRANS = standard_transformations + (implicit_multiplication_application, convert_xor)
X, Y, Z, T_ = sp.symbols("x y z t")
SYMS = {n: sp.Symbol(n) for n in "xyztuvwabcdhkmnpqrs"}


def _ns():
    ns = {k: getattr(sp, k) for k in ("sqrt", "sin", "cos", "tan", "cot", "sec", "csc", "asin", "acos", "atan", "sinh", "cosh", "tanh", "exp", "log", "pi", "E", "oo",
                                      "Rational", "Eq", "solve", "diff", "integrate", "limit", "simplify", "Matrix", "Interval", "Union", "S", "Abs", "floor", "ceiling",
                                      "factorial", "binomial", "Sum", "series", "summation", "gcd", "lcm", "factorint", "isprime", "Symbol", "symbols", "Function", "dsolve",
                                      "Derivative", "Integral", "FiniteSet", "EmptySet", "Poly", "det", "eye", "zeros", "Max", "Min", "sign", "atan2", "N", "expand", "factor",
                                      "nsimplify", "solveset", "Integer", "Float", "cbrt", "root", "erf", "gamma", "I", "re", "im", "conjugate", "arg", "Complement", "Intersection", "Piecewise", "sequence",
                                      "fourier_transform", "laplace_transform", "inverse_laplace_transform", "mod_inverse", "totient", "divisors", "primerange", "nextprime", "Dummy", "minimal_polynomial", "degree")
          if hasattr(sp, k)}
    ns.update(SYMS)
    ns.update({"ln": sp.log, "e": sp.E, "len": len, "range": range, "sum": sum, "min": min, "max": max, "abs": abs, "int": int, "float": float, "list": list, "tuple": tuple,
               "function_range": function_range, "continuous_domain": continuous_domain, "math": math, "zip": zip, "enumerate": enumerate, "sorted": sorted, "set": set, "round": round, "pow": pow})
    return ns


NS = _ns()


def run_v(src, extra=None):
    """«v» өрнегін шектелген ортада орындау."""
    env = dict(NS)
    env.update(extra or {})
    env["__builtins__"] = {}
    return eval(src, env)  # noqa: S307 - сенімді мазмұн, builtins жоқ


def norm(src):
    s = str(src)
    for a, b in (("−", "-"), ("‒", "-"), ("–", "-"), ("—", "-"), ("×", "*"), ("⋅", "*"), ("·", "*"), ("÷", "/"), ("²", "^2"), ("³", "^3"), ("√", "sqrt"), ("π", "pi"), ("∞", "oo")):
        s = s.replace(a, b)
    s = s.replace("**", "^")
    return s


def parse_site(src, extra_syms=()):
    """Сайт синтаксисін (2x^2, sqrt, ln, pi, e, abs, tg ...) sympy өрнегіне айналдыру."""
    s = norm(src)
    s = re.sub(r"\barc(sin|cos|tan|tg)\b", lambda m: "a" + ("tan" if m.group(1) == "tg" else m.group(1)), s)
    s = re.sub(r"\b(tg)\b", "tan", s)
    s = re.sub(r"\b(ctg)\b", "cot", s)
    s = re.sub(r"\babs\b", "Abs", s)
    s = re.sub(r"\bln\b", "log", s)
    s = re.sub(r"\blg\(([^()]*)\)", r"log(\1,10)", s)
    local = {"pi": sp.pi, "e": sp.E, "oo": sp.oo, "Abs": sp.Abs, "log": sp.log, "sqrt": sp.sqrt, "x": X, "y": Y, "z": Z, "t": T_, "cbrt": sp.cbrt,
             "sin": sp.sin, "cos": sp.cos, "tan": sp.tan, "cot": sp.cot, "exp": sp.exp, "asin": sp.asin, "acos": sp.acos, "atan": sp.atan, "sinh": sp.sinh, "cosh": sp.cosh, "tanh": sp.tanh,
             "sec": sp.sec, "csc": sp.csc}
    for n in extra_syms:
        local[n] = sp.Symbol(n)
    return parse_expr(s, local_dict=local, transformations=TRANS, evaluate=True)


def to_float(v):
    return float(sp.N(v, 30))


def same_number(p, q, tol=1e-9):
    try:
        p, q = complex(sp.N(p, 30)), complex(sp.N(q, 30))
    except (TypeError, ValueError):
        return False
    return abs(p - q) <= tol * max(1.0, abs(q))


def sample_points(vars_, dom, seed, n=24):
    rnd = random.Random(seed)
    lo, hi = (dom if dom else (-3.0, 3.0))
    pts = []
    for i in range(n):
        pts.append({v: (rnd.choice([0.5, 1.5, 2.0, -0.5, -1.5]) if i < 3 else lo + rnd.random() * (hi - lo)) for v in vars_})
    return pts


def equivalent(key_expr, v_expr, vars_, dom=None, seed="k"):
    f, g = sp.lambdify(vars_, key_expr, "mpmath"), sp.lambdify(vars_, v_expr, "mpmath")
    ok = valid = 0
    import mpmath
    mpmath.mp.dps = 30
    for pt in sample_points([str(v) for v in vars_], dom, seed):
        args = [pt[str(v)] for v in vars_]
        try:
            r = g(*args)
            if r is None or not mpmath.isfinite(r) or (isinstance(r, mpmath.mpc) and abs(r.imag) > 1e-12):
                continue
            u = f(*args)
        except (ZeroDivisionError, ValueError, TypeError, OverflowError):
            continue
        if u is None or not mpmath.isfinite(u):
            return False
        valid += 1
        if abs(complex(u) - complex(r)) > 1e-8 * max(1.0, abs(complex(r))):
            return False
        ok += 1
    return valid >= 6


def parse_interval_py(src):
    s = norm(src).replace(" ", "").replace("∪", "U").replace("inf", "oo")
    if s.lower() in ("r", "(-oo;oo)", "(-oo,oo)"):
        return sp.S.Reals
    if s in ("∅", "empty", "{}"):
        return sp.S.EmptySet
    sep = ";" if ";" in s else ","
    parts = []
    for ch in s.split("U"):
        m = re.fullmatch(r"([\(\[\]])(.+?)([\)\]\[])", ch)
        if not m:
            raise ValueError(f"аралық оқылмады: {ch}")
        a, b = m.group(2).split(sep)
        lo = -sp.oo if re.fullmatch(r"-oo", a) else sp.oo if re.fullmatch(r"\+?oo", a) else parse_site(a)
        hi = -sp.oo if re.fullmatch(r"-oo", b) else sp.oo if re.fullmatch(r"\+?oo", b) else parse_site(b)
        parts.append(sp.Interval(lo, hi, m.group(1) == "(" or m.group(1) == "]", m.group(3) == ")" or m.group(3) == "["))
    return sp.Union(*parts)


# ---------------------------------------------------------------- беттен есептерді оқу
BLOCK_RE = re.compile(r'<div class="math-ex[^"]*"\s+data-type="(\w+)"\s+data-id="([^"]+)"[^>]*>(.*?)<script type="application/json" class="math-ex-data">(.*?)</script>', re.S)


def read_blocks(path):
    s = path.read_text(encoding="utf-8")
    out = []
    for m in BLOCK_RE.finditer(s):
        out.append({"type": m.group(1), "id": m.group(2), "raw": m.group(4)})
    return s, out


def items_of(blk, data):
    t = blk["type"]
    if t == "match":
        return [data]
    if t == "reveal":
        return [data]
    if t == "param":
        return [data.get("spec", data)]
    return data.get("items", [])


# ---------------------------------------------------------------- node көпірі (сайттың өз қозғалтқышы)
NODE_JS = r"""
const API = require(process.argv[1]);
const input = JSON.parse(require('fs').readFileSync(0, 'utf8'));
const out = [];
for (const job of input) {
  const r = { id: job.id, errors: [], samples: [] };
  try {
    const it = job.item, t = job.type;
    if (t === 'num') {
      const c = API.checkNumeric(String(it.a), it.a, it.tol); if (!c.ok) r.errors.push('сайт парсері кілтті қабылдамады: ' + (c.msg || 'сәйкес емес'));
      const a = typeof it.a === 'number' ? it.a : API.evalNumber(it.a);
      const w = API.checkNumeric(String(a + 1), it.a, it.tol); if (w.ok) r.errors.push('«кілт + 1» де дұрыс деп есептелді (допуск тым үлкен)');
    } else if (t === 'expr') {
      const c = API.checkExpr(String(it.a), it); if (!c.ok) r.errors.push('сайт парсері кілтті қабылдамады: ' + (c.msg || 'эквивалент емес'));
      if (!it.eq) { const w = API.checkExpr('(' + it.a + ')+1', it); if (w.ok) r.errors.push('«кілт + 1» де дұрыс деп есептелді'); }
    } else if (t === 'interval') {
      try { const iv = API.parseInterval(it.a); if (!iv) r.errors.push('аралық оқылмады'); } catch (e) { r.errors.push('аралық оқылмады: ' + e.message); }
    } else if (t === 'matrix') {
      const rows = Array.isArray(it.a[0]) ? it.a : it.a.map(x => [x]);
      const grid = rows.map(rw => rw.map(c => String(typeof c === 'number' ? c : API.evalNumber(c))));
      const c = API.checkMatrix(grid, Object.assign({}, it, { a: rows })); if (!c.ok) r.errors.push('сайт парсері матрица кілтін қабылдамады');
    } else if (t === 'param') {
      for (let k = 0; k < 20; k++) {
        const seed = 1000 + k * 7919;
        let P; try { P = API.genParams(it, seed); } catch (e) { r.errors.push('genParams: ' + e.message); break; }
        const s = { params: P };
        const fmt = (x) => API.interpolate(x, P);
        try {
          const texts = [it.q, it.hint].concat((it.sol && it.sol.steps) || [], [it.sol && it.sol.ans]).concat(it.o || []);
          s.text = texts.filter(x => x != null).map(fmt);
          if (s.text.some(x => /#\{/.test(x))) r.errors.push('интерполяция толық емес: ' + s.text.find(x => /#\{/.test(x)));
          if (s.text.some(x => /NaN|undefined|Infinity/.test(x))) r.errors.push('интерполяция NaN/undefined берді (seed ' + seed + ')');
        } catch (e) { r.errors.push('интерполяция қатесі: ' + e.message); break; }
        const ty = it.type || 'num';
        try {
          if (ty === 'num') s.key = API.evalNumber(it.a, P);
          else if (ty === 'expr') s.key = Object.keys(P).reduce((q, n) => q.replace(new RegExp('\\b' + n + '\\b', 'g'), '(' + API.fmtNum(P[n]) + ')'), it.a);
          else if (ty === 'matrix') s.key = (Array.isArray(it.a[0]) ? it.a : it.a.map(x => [x])).map(rw => rw.map(c => typeof c === 'number' ? c : API.evalNumber(c, P)));
          else if (ty === 'interval') s.key = API.interpolate(it.a, P);
        } catch (e) { r.errors.push('кілт есептелмеді: ' + e.message); break; }
        if (ty === 'expr') { const c = API.checkExpr(s.key, Object.assign({}, it, { a: s.key }), P); if (!c.ok) r.errors.push('сайт парсері параметрлік кілтті қабылдамады (seed ' + seed + ')'); }
        r.samples.push(s);
      }
    }
  } catch (e) { r.errors.push('node қатесі: ' + e.message); }
  out.push(r);
}
process.stdout.write(JSON.stringify(out));
"""


def node_check(jobs):
    if not jobs:
        return []
    try:
        res = subprocess.run(["node", "-e", NODE_JS, str(ROOT / "assets/js/math-course.js")], input=json.dumps(jobs), capture_output=True, text=True, timeout=120)
    except FileNotFoundError:
        print("math_verify: node табылмады (CI-да setup-node бар)", file=sys.stderr)
        sys.exit(2)
    if res.returncode != 0:
        raise RuntimeError("node қатесі: " + res.stderr.strip()[:500])
    return json.loads(res.stdout)


# ---------------------------------------------------------------- бір есепті тексеру
def check_item(typ, it, node_res):
    """Қателер тізімін қайтарады."""
    errs = []
    v = it.get("v")
    if typ in NEED_V and v is None and not (typ == "param"):
        return ["\"v\" жоқ: кілттің тәуелсіз sympy тексеруі міндетті"]
    try:
        if typ == "num":
            key = parse_site(it["a"]) if isinstance(it["a"], str) else sp.nsimplify(it["a"])
            ref = run_v(v)
            if not same_number(key, ref):
                errs.append(f"кілт {it['a']!r} ≠ v мәні {sp.N(ref, 10)}")
        elif typ == "expr":
            if it.get("eq"):
                vars_ = [X, Y]
                lk, rk = str(it["a"]).split("=")
                keyF = parse_site(lk) - parse_site(rk)
                ref = run_v(v)
                refF = ref.lhs - ref.rhs if isinstance(ref, sp.Equality) else None
                if refF is None:
                    errs.append("eq:true есепте v - Eq(...) болуы керек")
                else:
                    pts = sample_points(["x", "y"], it.get("dom"), "eq", 30)
                    ks = set()
                    for p in pts:
                        a, b = complex(sp.N(keyF.subs({X: p["x"], Y: p["y"]}))), complex(sp.N(refF.subs({X: p["x"], Y: p["y"]})))
                        if abs(b) < 1e-9:
                            if abs(a) > 1e-6:
                                errs.append("теңдеулер пропорционал емес")
                                break
                            continue
                        ks.add(round((a / b).real, 6))
                    else:
                        if len(ks) != 1 or 0 in ks:
                            errs.append(f"теңдеулер пропорционал емес (қатынас {sorted(ks)[:3]})")
            else:
                vars_ = [sp.Symbol(n) for n in it.get("vars", ["x"])]
                key = parse_site(it["a"], it.get("vars", ["x"]))
                ref = run_v(v)
                if not equivalent(key, ref, vars_, it.get("dom"), str(it["a"])):
                    errs.append(f"кілт {it['a']!r} v өрнегіне эквивалент емес")
        elif typ == "matrix":
            rows = it["a"] if isinstance(it["a"][0], list) else [[c] for c in it["a"]]
            ref = run_v(v)
            if isinstance(ref, sp.MatrixBase):
                ref = ref.tolist()
            ref = ref if isinstance(ref[0], (list, tuple)) else [[c] for c in ref]
            if len(ref) != len(rows) or any(len(a) != len(b) for a, b in zip(rows, ref)):
                errs.append("матрица өлшемі кілт пен v арасында сәйкес емес")
            else:
                for i, (ra, rb) in enumerate(zip(rows, ref)):
                    for j, (ca, cb) in enumerate(zip(ra, rb)):
                        ka = sp.nsimplify(ca) if isinstance(ca, (int, float)) else parse_site(ca)
                        if not same_number(ka, cb):
                            errs.append(f"[{i + 1},{j + 1}] элементі: кілт {ca!r} ≠ v {sp.N(cb, 8)}")
        elif typ == "interval":
            key = parse_interval_py(it["a"])
            ref = run_v(v)
            if not isinstance(ref, sp.Set):
                errs.append("interval есепте v - sympy жиыны болуы керек (Interval, continuous_domain, function_range ...)")
            elif key != ref and key.symmetric_difference(ref) != sp.S.EmptySet:
                errs.append(f"кілт {key} ≠ v {ref}")
        elif typ == "choice":
            a = it["a"] if isinstance(it["a"], list) else [it["a"]]
            if not it.get("o") or any((not isinstance(i, int)) or i < 0 or i >= len(it["o"]) for i in a):
                errs.append("choice: a индексі o ішінде жоқ")
            if len(set(map(str, it.get("o", [])))) != len(it.get("o", [])):
                errs.append("choice: қайталанатын нұсқалар бар")
        elif typ == "tf":
            if not isinstance(it.get("a"), bool):
                errs.append("tf: a - true/false болуы керек")
        elif typ == "match":
            rights = [p[1] for p in it.get("pairs", [])]
            if len(it.get("pairs", [])) < 2 or len(set(rights)) != len(rights):
                errs.append("match: кемі 2 жұп және оң жақ мәндер бірегей болуы керек")
        elif typ == "order":
            if len(it.get("steps", [])) < 3:
                errs.append("order: кемі 3 қадам керек")
        elif typ == "reveal":
            if not it.get("steps") or not it.get("ans"):
                errs.append("reveal: steps және ans міндетті")
        elif typ == "param":
            errs += check_param(it, node_res)
    except Exception as e:  # noqa: BLE001
        errs.append(f"{type(e).__name__}: {e}"[:300])
    return errs


def check_param(it, node_res):
    errs = []
    ty = it.get("type", "num")
    if ty in ("num", "expr", "matrix", "interval") and it.get("v") is None:
        return ["param: \"v\" жоқ (параметрлер арқылы жазылған тәуелсіз sympy өрнегі міндетті)"]
    samples = (node_res or {}).get("samples", [])
    if len(samples) < 20:
        errs.append(f"параметрлер генераторы 20 жиын бермеді ({len(samples)})")
    for k, sm in enumerate(samples):
        P = sm["params"]
        try:
            ref = run_v(it["v"], {n: (sp.nsimplify(val) if isinstance(val, (int, float)) else val) for n, val in P.items()}) if it.get("v") is not None else None
            if ty == "num":
                if not same_number(sm["key"], ref):
                    errs.append(f"жиын #{k + 1} {P}: кілт {sm['key']} ≠ v {sp.N(ref, 8)}")
                    break
            elif ty == "expr":
                key = parse_site(sm["key"])
                if not equivalent(key, ref, [X], it.get("dom"), str(sm["key"])):
                    errs.append(f"жиын #{k + 1} {P}: кілт {sm['key']} v-ге эквивалент емес")
                    break
            elif ty == "interval":
                key = parse_interval_py(sm["key"])
                if not isinstance(ref, sp.Set) or key.symmetric_difference(ref) != sp.S.EmptySet:
                    errs.append(f"жиын #{k + 1} {P}: кілт {key} ≠ v {ref}")
                    break
            elif ty == "matrix":
                ref = ref.tolist() if isinstance(ref, sp.MatrixBase) else ref
                ref = ref if isinstance(ref[0], (list, tuple)) else [[c] for c in ref]
                for ra, rb in zip(sm["key"], ref):
                    for ca, cb in zip(ra, rb):
                        if not same_number(ca, cb):
                            raise ValueError(f"матрица элементі {ca} ≠ {cb}")
        except Exception as e:  # noqa: BLE001
            errs.append(f"жиын #{k + 1} {P}: {type(e).__name__}: {e}"[:260])
            break
    return errs


# ---------------------------------------------------------------- JSON/TeX гигиенасы
CTRL = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f]")


def walk_strings(o):
    if isinstance(o, str):
        yield o
    elif isinstance(o, list):
        for x in o:
            yield from walk_strings(x)
    elif isinstance(o, dict):
        for x in o.values():
            yield from walk_strings(x)


def tex_problems(text):
    """Бір жолдағы $...$ жұптары мен { } теңдігі."""
    probs = []
    clean = text.replace("\\$", "")
    if clean.count("$") % 2:
        probs.append("$ белгілерінің саны тақ")
    for m in re.finditer(r"\$\$?(.+?)\$\$?", clean, re.S):
        body = m.group(1)
        if body.count("{") != body.count("}") and "\\{" not in body and "\\}" not in body:
            probs.append(f"{{ }} жұпталмаған: ${body[:40]}$")
    return probs


def verify_file(path, verbose=False, lint=False):
    try:
        rel = path.relative_to(ROOT).as_posix()
    except ValueError:
        rel = path.as_posix()
    text, blocks = read_blocks(path)
    errors, stats = [], {"blocks": len(blocks), "items": 0, "checked": 0}
    seen = set()
    jobs, plan = [], []
    for b in blocks:
        if b["id"] in seen:
            errors.append((b["id"], "data-id қайталанады"))
        seen.add(b["id"])
        if b["type"] not in TYPES:
            errors.append((b["id"], f"белгісіз түрі: {b['type']}"))
            continue
        try:
            data = json.loads(b["raw"])
        except ValueError as e:
            errors.append((b["id"], f"JSON қатесі: {e}"))
            continue
        for s in walk_strings(data):
            if CTRL.search(s):
                errors.append((b["id"], "JSON жолында басқару таңбасы: TeX кері қиғаш сызығын қос жазыңыз (\\\\frac, \\\\cdot)"))
                break
            for pr in tex_problems(s):
                errors.append((b["id"], "TeX: " + pr))
        for i, it in enumerate(items_of(b, data)):
            stats["items"] += 1
            tag = b["id"] + (f"#{i + 1}" if b["type"] not in ("param", "match", "reveal") and len(items_of(b, data)) > 1 else "")
            ty = it.get("type", b["type"]) if b["type"] != "param" else "param"
            if ty in ("num", "expr", "interval", "matrix", "param") or b["type"] == "param":
                jobs.append({"id": tag, "type": ty if b["type"] != "param" else "param", "item": dict(it, type=it.get("type", "num")) if b["type"] == "param" else it})
            plan.append((tag, ty, it))
    node_res = {r["id"]: r for r in node_check(jobs)}
    for tag, ty, it in plan:
        nr = node_res.get(tag)
        errs = check_item(ty, it, nr)
        if nr:
            errs += nr["errors"]
        stats["checked"] += 1
        for e in errs:
            errors.append((tag, e))
        if verbose:
            print(f"  {'ОК ' if not errs else 'ҚАТЕ'} {rel}:{tag} ({ty})")
    if lint:
        for msg in lint_page(text, blocks):
            errors.append(("lint", msg))
    return rel, errors, stats



# ---------------------------------------------------------------- деректер файлдары (assets/data/math-*-<slug>.js)
DATA_RE = re.compile(r"=\s*(\[.*\])\s*;\s*$", re.S)


def read_data(kind, slug):
    fp = ROOT / "assets" / "data" / f"math-{kind}-{slug}.js"
    rel = fp.relative_to(ROOT).as_posix()
    if not fp.exists():
        return rel, None, [("файл", "жоқ")]
    m = DATA_RE.search(fp.read_text(encoding="utf-8").strip())
    if not m:
        return rel, None, [("формат", "window.CS50KZ_MATH_*.<slug> = [ ... ]; түрінде болуы керек")]
    try:
        return rel, json.loads(m.group(1)), []
    except ValueError as e:
        return rel, None, [("JSON", f"массив қатаң JSON болуы тиіс (қос тырнақшалы кілттер, соңғы үтірсіз): {e}")]


def verify_data():
    sys.path.insert(0, str(ROOT / "tools"))
    import math_plan as PL
    results, total = [], 0
    for kind in ("formulas", "terms", "problems"):
        ids = {}
        for sb in PL.SUBJECTS:
            slug, count = sb[1], len(sb[7])
            rel, arr, errs = read_data(kind, slug)
            errs = list(errs)
            if arr is not None:
                total += len(arr)
                jobs, plan = [], []
                for i, it in enumerate(arr):
                    tag = str(it.get("id", f"#{i + 1}"))
                    if "id" not in it:
                        errs.append((tag, "id жоқ"))
                    elif it["id"] in ids:
                        errs.append((tag, f"id қайталанады ({ids[it['id']]})"))
                    else:
                        ids[it["id"]] = rel
                    if "lesson" in it and not (isinstance(it["lesson"], int) and 1 <= it["lesson"] <= count):
                        errs.append((tag, f"lesson 1..{count} аралығында болуы керек"))
                    if kind == "formulas":
                        for k in ("name", "tex"):
                            if not it.get(k):
                                errs.append((tag, f"{k} жоқ"))
                        for pr in tex_problems("$" + it.get("tex", "") + "$") + (tex_problems("$" + it["cond"] + "$") if it.get("cond") else []):
                            errs.append((tag, "TeX: " + pr))
                        if CTRL.search(json.dumps(it, ensure_ascii=False)) or any(CTRL.search(v) for v in it.values() if isinstance(v, str)):
                            errs.append((tag, "басқару таңбасы: TeX-те \\\\ қос жазыңыз"))
                    elif kind == "terms":
                        for k in ("kz", "en", "def"):
                            if not it.get(k):
                                errs.append((tag, f"{k} жоқ"))
                        for pr in tex_problems(it.get("def", "")):
                            errs.append((tag, "TeX: " + pr))
                    else:
                        if it.get("lvl") not in ("easy", "medium", "hard"):
                            errs.append((tag, "lvl: easy | medium | hard"))
                        if it.get("type", "num") not in ("num", "expr", "matrix", "interval", "choice"):
                            errs.append((tag, "type: num | expr | matrix | interval | choice"))
                        if not it.get("params"):
                            errs.append((tag, "params жоқ"))
                        for sstr in walk_strings(it):
                            if CTRL.search(sstr):
                                errs.append((tag, "JSON жолында басқару таңбасы: TeX-те \\\\ қос жазыңыз"))
                                break
                            for pr in tex_problems(sstr):
                                errs.append((tag, "TeX: " + pr))
                        spec = dict(it, type=it.get("type", "num"))
                        jobs.append({"id": tag, "type": "param", "item": spec})
                        plan.append((tag, spec))
                if jobs:
                    nres = {r["id"]: r for r in node_check(jobs)}
                    for tag, spec in plan:
                        nr = nres.get(tag, {})
                        for e in check_param(spec, nr) + nr.get("errors", []):
                            errs.append((tag, e))
            results.append((rel, errs))
    return results, total

# ---------------------------------------------------------------- құрылым (lint)
def lint_page(text, blocks):
    msgs = []
    art = text[text.find("<article"):text.find("</article>")]
    vis = re.sub(r"<[^>]+>", " ", re.sub(r"<script.*?</script>", " ", art, flags=re.S))
    words = len(vis.split())
    if SOON in text:
        msgs.append("бетте <!-- soon --> белгісі қалған")
    for sid in ("goals", "prereq", "intuition", "theory", "derivations", "examples", "mistakes", "viz", "exercises", "project", "summary", "review", "quiz"):
        if f'<h2 id="{sid}"' not in art:
            msgs.append(f"міндетті бөлім жоқ: <h2 id=\"{sid}\">")
    n_ex = len(blocks)
    n_der = len(re.findall(r'<details class="math-derive"', art))
    n_exm = len(re.findall(r'<div class="math-example"', art))
    n_q = len(re.findall(r'<div class="question"', art))
    n_viz = len(re.findall(r'class="math-viz"', art))
    if n_ex < 12:
        msgs.append(f"интерактив есеп блоктары {n_ex} < 12")
    if n_der < 1:
        msgs.append("қорытып шығару (details.math-derive) жоқ")
    if not 3 <= n_exm <= 5:
        msgs.append(f"қадамдық шешілген мысал саны {n_exm}: 3-5 болуы керек")
    if n_q != 8:
        msgs.append(f"тест сұрағы {n_q}: дәл 8 болуы керек")
    if n_viz < 1:
        msgs.append("визуализация (.math-viz) жоқ")
    if words < 1500:
        msgs.append(f"көрінетін сөз саны {words} < 1500 (эталон сабақта ≥ 3500)")
    for badge in ("easy", "medium", "hard"):
        if f'badge {badge}' not in art:
            msgs.append(f"{badge} деңгейлі есеп жоқ")
    if re.search(r'<script[^>]+src="https?://(?!fonts)', text):
        msgs.append("сыртқы CDN скрипті табылды (KaTeX тек жергілікті)")
    return msgs


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("-")]
    verbose = "-v" in sys.argv
    lint = "--lint" in sys.argv
    if args:
        files = [Path(a) if Path(a).is_absolute() else (Path.cwd() / a) for a in args]
    else:
        files = sorted(LECT.glob("week-*.html"), key=lambda p: int(p.stem.split("-")[1]))
        files = [f for f in files if SOON not in f.read_text(encoding="utf-8")]
    total_err = 0
    total_items = 0
    if "--data" in sys.argv or not args:
        res, n = verify_data()
        for rel, errs in res:
            for tag, msg in errs:
                print(f"{rel}:{tag}: {msg}")
            total_err += len(errs)
        print(f"math_verify: деректер файлдары: {len(res)} файл, {n} жазба")
        if "--data" in sys.argv:
            print(f"math_verify: қате: {total_err}")
            return 1 if total_err else 0
    for f in files:
        rel, errors, st = verify_file(f.resolve(), verbose, lint)
        total_items += st["items"]
        for tag, msg in errors:
            print(f"{rel}:{tag}: {msg}")
        total_err += len(errors)
    print(f"math_verify: {len(files)} бет, {total_items} есеп элементі, қате: {total_err}")
    return 1 if total_err else 0


if __name__ == "__main__":
    sys.exit(main())
