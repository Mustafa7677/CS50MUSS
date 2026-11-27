# © 2026 AO17 командасы. All Rights Reserved.
"""AO17 CS Universe: сабақ деректерін тексеру және беттерді жасау.

    python3 tools/academy_build.py            # тексеру + academy/ беттерін жасау (build.py өзі шақырады)
    python3 tools/academy_build.py --check    # тек тексеру (схема, кілттер, код мысалдары, бірегейлік)
    python3 tools/academy_build.py --stats    # НАҚТЫ дайын сабақ/тапсырма саны (жоспармен бірге)

Сабақ «дайын» деп тек барлық тексеруден өтсе саналады. Жоспар (curriculum.py) дайын сан ретінде көрсетілмейді.
"""
import html
import json
import os
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools" / "academy"))
sys.path.insert(0, str(ROOT / "tools" / "academy" / "content"))
import curriculum as C  # noqa: E402
import plogic as P  # noqa: E402
import parith as AR  # noqa: E402
import pdisc as DS  # noqa: E402
import emblems as EM  # noqa: E402
import ppseudo as PS  # noqa: E402
import pbits as BI  # noqa: E402
import tracks as TR  # noqa: E402
import cine as CN  # noqa: E402
import comic as CX  # noqa: E402
import comic_eps as CXE  # noqa: E402
import course as CRS  # noqa: E402
import lab3d as L3  # noqa: E402
import inside_pages as IP  # noqa: E402
import ao17exam as AX  # noqa: E402
import ao17plan as AP  # noqa: E402
import ao17methods as AM  # noqa: E402
import oyu as OY  # noqa: E402
import bota as BT  # noqa: E402
import xray as XR  # noqa: E402
import morph as MO  # noqa: E402
sys.path.insert(0, str(ROOT / "assets" / "py"))
import ao_judge as JG  # noqa: E402
import math  # noqa: E402,F401  (number.check өрнектері үшін)

OUT = ROOT / "academy"
CONTENT_MODULES = ["m01_a", "m01_b", "m02_a", "m02_b", "m03_a", "m03_b", "m04_a", "m04_b", "m05_a", "m05_b", "m06_a", "m06_b", "m07_a", "m07_b", "m08_a", "m08_b", "m09_a", "m09_b", "m10_a", "m10_b", "m11_a", "m11_b", "m12_a", "m12_b", "s01_a", "s01_b", "s02_a", "s02_b", "s03_a", "s03_b", "s04_a", "s04_b", "s05_a", "s05_b", "s06_a", "s06_b", "s07_a", "s07_b", "s08_a", "s08_b", "s09_a", "s09_b"]
# Core модульдерінің мазмұны: tools/academy/content/cNN_a.py, cNN_b.py - бар файлдар өздігінен қосылады.
# AO17_CONTENT=c03,c04 - тек аталған Core модульдерін жүктеу (қатар жазылып жатқан басқа модуль тексеруді бұзбасын).
_only = [x for x in os.environ.get("AO17_CONTENT", "").split(",") if x]
if _only:
    CONTENT_MODULES = []
CONTENT_MODULES += sorted(f.stem for f in (Path(__file__).parent / "academy" / "content").glob("c[0-9][0-9]_[ab].py") if not _only or f.stem[:3] in _only)

REQUIRED = {  # өріс -> (тип, ең аз ұзындық)
    "id": (str, 1), "courseId": (str, 1), "moduleId": (str, 1), "slug": (str, 1), "title": (str, 3), "language": (str, 2),
    "academicLevel": (str, 1), "difficulty": (int, None), "minutes": (int, None), "objectives": (list, 2), "prerequisites": (list, 0),
    "concept": (str, 200), "theory": (list, 3), "visual": (dict, None), "derivation": (list, 3), "examples": (list, 1),
    "experiment": (dict, None), "exercises": (list, 3), "reasoning": (str, 100), "mistakes": (list, 2), "assessment": (list, 2),
    "reflection": (list, 1), "further": (dict, None), "references": (list, 1), "license": (str, 2), "authorship": (str, 2),
    "reviewStatus": (str, 2), "version": (str, 5),
}
EX_TYPES = {"mc", "value", "truthtable", "classify", "formula", "argument", "number", "order", "counterexample", "closedform", "recurrence", "setexpr", "setid", "props", "func", "trace", "count", "convert", "encode", "bitop", "pycode", "pytests", "coutput"}
LABS = {"truthtable", "equiv", "argument", "tree", "normal", "quant", "search", "induction", "recur", "venn", "relation", "graph", "func", "trace", "growth", "base", "bitpanel", "utf8", "float", "rle", "pyrun", "calltree", "arena", "cshow"}
GROWTH = {"1", "log2(n)", "sqrt(n)", "n", "n*log2(n)", "n^2", "n^3", "2^n", "100*n", "n!"}
ARITH_PROPS = set(AR.PROPS)
QUANT_PREDS = {"even", "odd", "prime", "positive", "gt3", "square"}
REVIEW = {"draft", "author-checked", "peer-reviewed"}


def load_lessons():
    import viz_map
    out = []
    for name in CONTENT_MODULES:
        out += __import__(name).LESSONS
    for L in out:
        if L["id"] in viz_map.VIZ:
            L["viz"] = viz_map.VIZ[L["id"]]
    unknown = set(viz_map.VIZ) - {L["id"] for L in out}
    if unknown and not _only:
        raise SystemExit(f"viz_map: белгісіз сабақтар {sorted(unknown)}")
    return out


# ---------------------------------------------------------------- тексеру
def check_lab(spec, where, errs):
    lab = spec.get("lab")
    if lab not in LABS:
        errs.append(f"{where}: белгісіз зертхана {lab!r}")
        return
    try:
        if lab in ("truthtable", "tree", "normal"):
            P.parse(spec["formula"])
        elif lab == "equiv":
            P.parse(spec["a"]), P.parse(spec["b"])
        elif lab == "argument":
            [P.parse(x) for x in spec["premises"]], P.parse(spec["conclusion"])
        elif lab == "search":
            if spec.get("prop") not in ARITH_PROPS or (spec.get("where") and spec["where"] not in ARITH_PROPS):
                errs.append(f"{where}: search - белгісіз қасиет")
            lo, hi = spec["domain"]
            [AR.val(spec["expr"], n) for n in range(lo, hi + 1) if not spec.get("where") or AR.PROPS[spec["where"]](AR.F(n))]
        elif lab == "trace":
            PS.run(spec["code"], spec.get("inputs", {}))
        elif lab == "growth":
            if not set(spec["fns"]) <= GROWTH:
                errs.append(f"{where}: growth - белгісіз функция")
        elif lab == "pyrun":
            r = json.loads(JG.run_json(spec["code"], spec.get("stdin", "")))
            if bool(spec.get("expectError")) == bool(r["ok"]):
                errs.append(f"{where}: pyrun - {'қате күтілген, бірақ код дұрыс орындалды' if r['ok'] else 'код қатемен аяқталды: ' + str(r.get('error')) + ' ' + str(r.get('detail'))}")
        elif lab == "calltree":
            r = json.loads(JG.trace_calls(spec["code"], spec["call"]))
            if not r["ok"] or r["truncated"]:
                errs.append(f"{where}: calltree - шақыру қатемен не шексіз аяқталды")
        elif lab == "cshow":
            c_check(spec, f"{where}: cshow", errs)
        elif lab == "arena":
            r = json.loads(JG.trace_sort(spec["code"], spec["func"], spec["data"]))
            if not r["ok"] or r["truncated"] or (not r["sorted"] and not spec.get("expectUnsorted")):
                errs.append(f"{where}: arena - алгоритм қатемен, шексіз не сұрыптамай аяқталды: {r.get('error')}")
            if len(spec["data"]) > 60:
                errs.append(f"{where}: arena - кіріс 60 элементтен аспасын")
        elif lab == "base":
            BI.from_base(spec["value"].lstrip("-"), spec["from"])
        elif lab == "bitpanel":
            BI.bit_expr(f"{spec['a']} {spec['op']} {spec['b']}", spec["width"])
        elif lab in ("utf8", "rle"):
            str(spec["text"])
        elif lab == "float":
            BI.float32_bits(float(spec["value"]))
        elif lab == "venn":
            DS.evaluate(spec["expr"], spec["sets"], spec["U"])
        elif lab == "relation":
            pairs(spec["R"])
        elif lab == "graph":
            edges(spec["E"])
        elif lab == "func":
            pairs(spec["pairs"])
        elif lab == "induction":
            AR.parse(spec["term"]), AR.parse(spec["closed"])
        elif lab == "recur":
            AR.parse(spec["rule"]), AR.parse(spec["closed"])
        elif lab == "quant":
            if spec.get("pred") not in QUANT_PREDS or not all(isinstance(x, int) for x in spec.get("domain", [])):
                errs.append(f"{where}: quant зертханасы қате")
    except (ValueError, KeyError) as e:
        errs.append(f"{where}: зертхана формуласы: {e}")


def check_exercise(ex, where, errs):
    t = ex.get("type")
    if t not in EX_TYPES:
        return errs.append(f"{where}: белгісіз түр {t!r}")
    if len(ex.get("q", "")) < 8:
        errs.append(f"{where}: сұрақ тым қысқа")
    if not ex.get("hints"):
        errs.append(f"{where}: кемінде бір кеңес (hint) керек")
    try:
        if t == "mc":
            n = len(ex["options"])
            if not (2 <= n <= 6) or not (0 <= ex["answer"] < n) or len(ex.get("why", [])) != n:
                errs.append(f"{where}: mc - нұсқа/жауап/түсіндірме саны сәйкес емес")
            if len(set(ex["options"])) != n:
                errs.append(f"{where}: mc - қайталанатын нұсқа")
        elif t == "value":
            tr = P.parse(ex["formula"])
            if not P.variables(tr) <= set(ex["env"]):
                errs.append(f"{where}: value - айнымалы мәні берілмеген")
        elif t in ("truthtable", "classify"):
            P.parse(ex["formula"])
        elif t == "argument":
            [P.parse(x) for x in ex["premises"]], P.parse(ex["conclusion"])
        elif t == "number":
            if not isinstance(ex["answer"], int):
                errs.append(f"{where}: number - жауап бүтін сан болуы керек")
            elif "check" in ex and eval(ex["check"], {"math": math, "__builtins__": {"range": range, "sum": sum, "next": next, "len": len, "min": min, "max": max, "all": all, "any": any, "abs": abs, "int": int, "round": round}}) != ex["answer"]:
                errs.append(f"{where}: number - жауап ({ex['answer']}) check өрнегімен сәйкес емес")
        elif t == "setexpr":
            DS.evaluate(ex["expr"], ex["sets"], ex["U"])
        elif t == "setid":
            if not DS.identical(ex["solution"], ex["target"]):
                errs.append(f"{where}: setid - эталон шешім мақсатпен тепе-тең ЕМЕС")
            elif any(o in ex["solution"] for o in ex.get("forbid", [])):
                errs.append(f"{where}: setid - эталон шешім тыйым салынған амалды қолданады")
            elif ex.get("forbid") and not any(o in ex["target"] for o in ex["forbid"]):
                errs.append(f"{where}: setid - мақсаттың өзі шектеуден өтеді (мағынасыз)")
        elif t == "props":
            pairs(ex["R"])
        elif t == "trace":
            trace_key(ex)
        elif t in ("convert", "encode", "bitop"):
            bits_key(ex)
        elif t == "pycode":
            spec = {k: ex[k] for k in ("mode", "func", "tests", "suffix", "files") if k in ex}
            if len(ex["tests"]) < (1 if ex["mode"] == "io" else 2) and ex["mode"] == "func":
                errs.append(f"{where}: pycode - func үшін кемінде 2 тест")
            big = [v for v in json.loads(json.dumps(ex["tests"]), parse_int=int) for v in [v] if any(isinstance(x, int) and abs(x) > 2 ** 53 for x in _ints(v))]
            if big:
                errs.append(f"{where}: pycode - тестте |n| > 2^53 бүтін сан бар (браузерде JSON дәлдігі жоғалады)")
            r = JG.judge(ex["solution"], spec)
            if not r["ok"]:
                bad = next(x for x in r["results"] if not x["passed"])
                errs.append(f"{where}: pycode - эталон шешім тесттен өтпеді: {bad}")
            if JG.judge(ex.get("starter", ""), spec)["ok"]:
                errs.append(f"{where}: pycode - бастапқы код (starter) тесттерден өтіп кетеді (мағынасыз)")
        elif t == "coutput":
            c_check(ex, where, errs, ex["answer"])
        elif t == "pytests":
            if len(ex["mutants"]) < 2:
                errs.append(f"{where}: pytests - кемінде 2 мутант керек")
            spec = {"impl": ex["impl"], "mutants": ex["mutants"], "min_tests": ex.get("min_tests", 1), "files": ex.get("files")}
            r = JG.judge_tests(ex["solution"], spec)
            if not r["ok"]:
                errs.append(f"{where}: pytests - эталон тесттер талапты орындамады: {r}")
            if JG.judge_tests(ex.get("starter", ""), spec)["ok"]:
                errs.append(f"{where}: pytests - бастапқы тесттер (starter) талаптан өтіп кетеді (мағынасыз)")
        elif t == "count":
            r = PS.run(ex["code"], ex.get("inputs", {}))
            if ex["line"] not in r["counts"]:
                errs.append(f"{where}: count - {ex['line']}-жол мүлде орындалмайды")
        elif t == "func":
            pairs(ex["pairs"])
        elif t == "order":
            st = ex["steps"]
            if len(st) < 3 or len(set(st)) != len(st):
                errs.append(f"{where}: order - кемінде 3, қайталанбайтын қадам керек")
        elif t == "counterexample":
            if ex["prop"] not in ARITH_PROPS or (ex.get("where") and ex["where"] not in ARITH_PROPS):
                errs.append(f"{where}: counterexample - белгісіз қасиет")
            elif not AR.counterexamples(ex):
                errs.append(f"{where}: counterexample - облыста қарсы мысал ЖОҚ (тапсырма шешілмейді)")
        elif t == "closedform":
            ok, bad = AR.closed_ok(ex["term"], ex["solution"], ex["start"])
            if not ok:
                errs.append(f"{where}: closedform - эталон шешім N={bad}-де сәйкес емес")
            elif AR.closed_ok(ex["term"], ex["term"], ex["start"])[0]:
                errs.append(f"{where}: closedform - мүшенің өзі жауап бола алады (мағынасыз)")
        elif t == "recurrence":
            ok, bad = AR.recurrence_ok(ex, ex["solution"])
            if not ok:
                errs.append(f"{where}: recurrence - эталон шешім N={bad}-де сәйкес емес")
        elif t == "formula":
            P.parse(ex["target"])
            sol = ex.get("solution")
            if not sol:
                errs.append(f"{where}: formula - эталон шешім (solution) жоқ")
            elif not P.equivalent(sol, ex["target"]):
                errs.append(f"{where}: formula - эталон шешім мақсатқа эквивалент ЕМЕС")
            elif not P.constraints_ok(ex, sol):
                errs.append(f"{where}: formula - эталон шешім шектеулерді бұзады")
            elif P.equivalent(ex["target"], ex["target"]) and P.constraints_ok(ex, ex["target"]) and any(k in ex for k in ("allowed", "noNegatedGroups", "maxLength", "nandOnly")):
                errs.append(f"{where}: formula - мақсаттың өзі шектеулерден өтеді (тапсырма тым оңай/мағынасыз)")
    except (ValueError, KeyError, TypeError) as e:
        errs.append(f"{where}: {type(e).__name__}: {e}")


def pairs(s):
    """'(1,2), (a,b)' -> [(1, 2), ('a', 'b')] (JS parsePairs-пен бірдей)."""
    out = []
    for a, b in re.findall(r"\(\s*([^,()\s]+)\s*,\s*([^,()\s]+)\s*\)", s):
        out.append(tuple(int(x) if re.fullmatch(r"-?\d+", x) else x for x in (a, b)))
    rest = re.sub(r"\(\s*[^,()\s]+\s*,\s*[^,()\s]+\s*\)", "", s)
    if re.sub(r"[\s,{}]", "", rest) and s.strip() not in ("", "∅"):
        raise ValueError(f"жұптар қате: {s!r}")
    return out


def edges(s):
    out = []
    for t in filter(None, (x.strip() for x in re.split(r"[,;\n]+", s))):
        m = re.fullmatch(r"(\w+)\s*[-–—]\s*(\w+)", t)
        if not m:
            raise ValueError(f"қабырға қате: {t!r}")
        out.append(tuple(int(x) if x.isdigit() else x for x in m.groups()))
    return out


def _ints(v):
    if isinstance(v, bool):
        return []
    if isinstance(v, int):
        return [v]
    if isinstance(v, dict):
        return [x for k in v.values() for x in _ints(k)]
    if isinstance(v, (list, tuple)):
        return [x for k in v for x in _ints(k)]
    return []


def fmt_val(v):
    if v is True or v is False:
        return "true" if v else "false"
    if isinstance(v, list):
        return "[" + ", ".join(fmt_val(x) for x in v) + "]"
    return str(v)


def bits_key(ex):
    t = ex["type"]
    if t == "convert":
        return BI.convert(ex["value"], ex["from"], ex["to"])
    if t == "bitop":
        return str(BI.bit_expr(ex["expr"], ex["width"]))
    k = ex["kind"]
    if k == "twos":
        return BI.twos(ex["input"], ex["bits"])
    if k == "utf8":
        return BI.utf8_hex(ex["input"])
    if k == "parity":
        return BI.parity(ex["input"])
    if k == "float32":
        return BI.float32_bits(float(ex["input"]))
    if k == "rle":
        return BI.rle(ex["input"])
    raise ValueError(f"белгісіз encode түрі {k}")


def trace_key(ex):
    r = PS.run(ex["code"], ex.get("inputs", {}))
    ask = ex["ask"]
    if ask == "result":
        if r["result"] is None:
            raise ValueError("бағдарлама return жасамайды")
        return fmt_val(r["result"])
    if ask == "output":
        return "\n".join(r["output"])
    return fmt_val(r["env"][ask])


def run_example(code, timeout=10):
    import tempfile
    with tempfile.TemporaryDirectory(prefix="ao17_ex_") as d:  # файл жазатын мысалдар репозиторийді ластамасын
        r = subprocess.run([sys.executable, "-I", "-c", code], capture_output=True, text=True, timeout=timeout, cwd=d)
    return r.returncode, r.stdout.rstrip("\n"), r.stderr


CFLAGS = ["-std=c11", "-O0", "-Wall", "-Wextra"]


def run_c(code, stdin="", flags=None, werror=True, timeout=10, args=None):
    """C кодын нағыз gcc-мен компиляциялап іске қосу: (күй, stdout, stderr). күй: 'cc' - компиляция қатесі, иначе шығу коды."""
    import shutil
    import tempfile
    gcc = shutil.which("gcc")
    if not gcc:
        raise RuntimeError("gcc табылмады: C мысалдарын тексеру үшін gcc орнатыңыз")
    with tempfile.TemporaryDirectory(prefix="ao17_c_") as d:
        src, exe = os.path.join(d, "prog.c"), os.path.join(d, "prog")
        with open(src, "w", encoding="utf-8") as f:
            f.write(code)
        cmd = [gcc, *CFLAGS, *(["-Werror"] if werror else []), *(flags or []), "-o", exe, src, "-lm"]
        c = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
        if c.returncode != 0:
            return "cc", "", c.stderr
        r = subprocess.run([exe, *(args or [])], input=stdin, capture_output=True, text=True, timeout=timeout, cwd=d)
        return r.returncode, r.stdout.rstrip("\n"), r.stderr


def c_check(spec, where, errs, want=None):
    """C мысалы не coutput тапсырмасы: компиляция, шығу коды, stdout, (қажет болса) stderr мәтіні."""
    rc, out, err = run_c(spec["code"], spec.get("stdin", ""), spec.get("cflags"), not spec.get("warn"), args=spec.get("args"))
    if rc == "cc":
        errs.append(f"{where}: C компиляция қатесі (gcc {' '.join(CFLAGS)}): {err.strip()[:400]}")
        return
    if rc != spec.get("exit", 0):
        errs.append(f"{where}: C бағдарлама шығу коды {rc} (күтілгені {spec.get('exit', 0)}); stderr: {err.strip()[:200]}")
    want = spec["output"] if want is None else want
    norm = lambda t: "\n".join(l.rstrip() for l in t.rstrip().split("\n"))  # noqa: E731 - жол соңындағы бос орындар еленбейді (JS тексерісі сияқты)
    if norm(out) != norm(want):
        errs.append(f"{where}: C шығысы сәйкес емес\n  күтілген: {want!r}\n  нақты:    {out!r}")
    if spec.get("stderrHas") and spec["stderrHas"] not in err:
        errs.append(f"{where}: stderr-де «{spec['stderrHas']}» жоқ: {err.strip()[:200]}")


def validate(lessons, run_code=True):
    errs = []
    plan = {p["id"]: p for p in C.plan()}
    ids = set()
    seen_q = {}
    for L in lessons:
        lid = L.get("id", "?")
        for k, (typ, mn) in REQUIRED.items():
            v = L.get(k)
            if not isinstance(v, typ):
                errs.append(f"{lid}: «{k}» өрісі жоқ не түрі қате")
            elif mn is not None and len(v) < mn:
                errs.append(f"{lid}: «{k}» тым қысқа/аз ({len(v)} < {mn})")
        if lid in ids:
            errs.append(f"{lid}: id қайталанады")
        ids.add(lid)
        p = plan.get(lid)
        if not p:
            errs.append(f"{lid}: оқу картасында (curriculum.py) жоқ")
        elif p["title"] != L.get("title"):
            errs.append(f"{lid}: атауы оқу картасындағыдан өзгеше")
        for pre in L.get("prerequisites", []):
            if pre not in plan:
                errs.append(f"{lid}: белгісіз алғышарт {pre}")
        if L.get("reviewStatus") not in REVIEW:
            errs.append(f"{lid}: reviewStatus {REVIEW} ішінен болуы керек")
        if not (1 <= L.get("difficulty", 0) <= 5):
            errs.append(f"{lid}: difficulty 1..5")
        for th in L.get("theory", []):
            if th.get("kind") not in ("definition", "theorem", "proof", "note") or not th.get("body"):
                errs.append(f"{lid}: theory элементі қате")
        if not any(th.get("kind") == "proof" for th in L.get("theory", [])):
            errs.append(f"{lid}: теорияда кемінде бір дәлелдеу (proof) болуы керек")
        check_lab(L.get("visual", {}), f"{lid} visual", errs)
        check_lab(L.get("experiment", {}), f"{lid} experiment", errs)
        if not L.get("experiment", {}).get("task"):
            errs.append(f"{lid}: experiment.task жоқ")
        f = L.get("further", {})
        if not f.get("honors") or not f.get("research"):
            errs.append(f"{lid}: further.honors және further.research керек")
        try:
            errs += CX.validate(CX.trap(L), f"{lid} комикс-тұзақ")
        except (KeyError, IndexError, TypeError) as e:
            errs.append(f"{lid} комикс-тұзақ: құрылмады: {e!r}")
        try:
            errs += CN.validate(lid, CN.for_lesson(L))
        except (KeyError, IndexError, TypeError) as e:
            errs.append(f"{lid} cine: сценарий құрылмады: {e!r}")
        for i, ex in enumerate(L.get("exercises", []) + L.get("assessment", [])):
            check_exercise(ex, f"{lid} тапсырма {i + 1}", errs)
            key = re.sub(r"\s+", " ", ex.get("q", "") + "|" + ex.get("code", "") + "|" + json.dumps(ex.get("inputs", {}))).strip()
            if key in seen_q:
                errs.append(f"{lid}: сұрақ қайталанады ({seen_q[key]}): {key[:50]}")
            seen_q[key] = lid
        for v in L.get("viz", []):
            if v.get("type") not in VIZ_TYPES or not v.get("why"):
                errs.append(f"{lid}: viz - түрі белгісіз не «why» (неге бұл модель көмектеседі) жоқ: {v.get('type')}")
        for m in L.get("mistakes", []):
            if not all(m.get(k) for k in ("mistake", "why", "fix")):
                errs.append(f"{lid}: mistakes элементі толық емес")
        if run_code:
            for j, exm in enumerate(L.get("examples", [])):
                if exm.get("lang") == "c":
                    c_check(exm, f"{lid} мысал {j + 1}", errs)
                    continue
                if exm.get("lang") == "javascript":   # нағыз Node.js-пен орындалып, шығысы салыстырылады
                    r = subprocess.run(["node", "-e", exm["code"]], capture_output=True, text=True, timeout=15)
                    out = r.stdout.rstrip("\n")
                    if r.returncode != 0:
                        errs.append(f"{lid} мысал {j + 1}: JS қатемен аяқталды: {(r.stderr.strip().splitlines() or [r.returncode])[-1]}")
                    elif out != exm["output"]:
                        errs.append(f"{lid} мысал {j + 1}: шығыс сәйкес емес\n  күтілген: {exm['output']!r}\n  нақты:    {out!r}")
                    continue
                if exm.get("lang") not in ("python", "python-local"):
                    if exm.get("lang") not in ("html", "css", "sql", "http", "text"):
                        errs.append(f"{lid} мысал {j + 1}: белгісіз тіл {exm.get('lang')!r}")
                    continue
                rc, out, err = run_example(exm["code"])
                if rc != 0:
                    errs.append(f"{lid} мысал {j + 1}: код қатемен аяқталды: {err.strip().splitlines()[-1] if err.strip() else rc}")
                elif out != exm["output"]:
                    errs.append(f"{lid} мысал {j + 1}: шығыс сәйкес емес\n  күтілген: {exm['output']!r}\n  нақты:    {out!r}")
    # бірегейлік: сабақтар арасында мәтін қайталанбасын
    concepts = [re.sub(r"<[^>]+>", "", L.get("concept", ""))[:120] for L in lessons]
    if len(set(concepts)) != len(concepts):
        errs.append("concept мәтіні қайталанатын сабақтар бар")
    return errs


def validate_comics(lessons, run_code=True):
    """«Нұрай, Мустафа және Бота» эпизодтары: сабақ бар ма, кадрлар дұрыс па, код кадрларының шығысы нағыз Python/gcc шығысымен сәйкес пе."""
    errs, ids = [], {L["id"] for L in lessons}
    for n, ep in enumerate(CXE.EPISODES, 1):
        where = f"комикс {n}-эпизод ({ep['lesson']})"
        if ep["lesson"] not in ids:
            errs.append(f"{where}: мұндай сабақ жоқ")
        if len(ep["panels"]) < 4:
            errs.append(f"{where}: кемінде 4 кадр керек")
        errs += CX.validate(ep, where) + CX.layout_errors(ep, where)
        if not run_code:
            continue
        for i, lang, src, want in CX.code_specs(ep):
            if lang == "py":
                rc, out, err = run_example(src)
                got = out.split("\n") if out else []
                if rc != 0:
                    got.append((err.strip().splitlines() or [""])[-1])
            else:
                rc, out, err = run_c(src)
                if rc == "cc":
                    errs.append(f"{where} {i + 1}-кадр: C компиляция қатесі: {err.strip()[:300]}")
                    continue
                got = out.split("\n") if out else []
            if not CX.out_matches(got, want):
                errs.append(f"{where} {i + 1}-кадр: кодтың шығысы сәйкес емес\n  кадрда: {want!r}\n  нақты:  {got!r}")
    return errs


def stats(lessons, errs_by_lesson=None):
    plan = C.plan()
    done = {L["id"] for L in lessons}
    by_mod = {}
    for p in plan:
        m = by_mod.setdefault(p["module"], {"title": p["moduleTitle"], "planned": 0, "complete": 0})
        m["planned"] += 1
        m["complete"] += p["id"] in done
    ex = sum(len(L["exercises"]) + len(L["assessment"]) for L in lessons)
    return {"levels": [{"id": lv["id"], "target": lv["target"], "complete": sum(L["academicLevel"] == lv["id"] for L in lessons)} for lv in C.LEVELS],
            "foundation_planned": sum(p["module"].startswith("m") for p in plan), "senior_planned": sum(p["module"].startswith("s") for p in plan),
            "senior_complete": sum(L["moduleId"].startswith("s") for L in lessons), "complete_lessons": len(done), "auto_checked_tasks": ex,
            "python_examples": sum(len(L["examples"]) for L in lessons), "modules": by_mod}


# ---------------------------------------------------------------- HTML
E = html.escape
VIZ_TYPES = {"graph", "gd", "nn", "cpu", "mem", "pyx", "func", "sort", "bst", "heap", "hash", "matrix", "prob", "logic", "dtree", "kmeans", "linreg", "sched", "tcp", "compiler"}   # assets/js/ao-viz.js MACHINES
DIFF = {1: "бастапқы", 2: "негізгі", 3: "орта", 4: "күрделі", 5: "зерттеу"}
KIND = {"definition": "Анықтама", "theorem": "Теорема", "proof": "Дәлелдеу", "note": "Ескерту"}
SECTIONS = [("a", "Оқу мақсаттары"), ("b", "Алғышарттар"), ("c", "Ұғымға кіріспе"), ("d", "Академиялық теория"),
            ("e", "Көрнекі түсіндірме"), ("f", "Қадамдап қорыту"), ("g", "Жұмыс мысалдары"), ("h", "Интерактивті эксперимент"),
            ("i", "Жаттығулар"), ("j", "Математикалық пайымдау"), ("k", "Жиі қателер"), ("l", "Меңгеруді бағалау"),
            ("m", "Рефлексия"), ("n", "Тереңірек")]


def page(rel, title, desc, body, scripts=(), body_cls="ao-acad", intro="", styles=()):
    pre = "../" * rel.count("/")
    intro_js = ("\n  <script>/* Академияға кірер алдында - оның фильм-прологы: әр сеанста бір рет. Сілтемеде #… болса, ?nofilm, іздеу роботы не автотест болса - жоқ. */\n"
                "  (function () { try {\n"
                f'    var k = "ao17-intro-{intro}";\n'
                "    if (sessionStorage.getItem(k) || location.hash || /nofilm/.test(location.search) || navigator.webdriver || /bot|crawl|spider|slurp|preview|lighthouse/i.test(navigator.userAgent) || matchMedia(\"(prefers-reduced-motion: reduce)\").matches) return;\n"
                "    sessionStorage.setItem(k, \"1\");\n"
                f'    location.replace("{pre}film/{intro}/?intro=1");\n'
                "  } catch (e) {} })();\n  </script>") if intro else ""
    sc = "".join(f'\n  <script src="{pre}{s}" defer></script>' for s in scripts)
    css = "".join(f'\n  <link rel="stylesheet" href="{pre}{s}">' for s in styles)
    return f"""<!DOCTYPE html>
<html lang="kk">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">{intro_js}
  <title>{E(title)} - AO17</title>
  <!-- build:head -->
  <!-- /build:head -->
  <meta name="description" content="{E(desc)}">
  <meta name="author" content="AO17 командасы">
  <link rel="stylesheet" href="{pre}assets/fonts/fonts.css">
  <link rel="stylesheet" href="{pre}assets/css/style.css">
  <link rel="stylesheet" href="{pre}assets/css/academy.css">
  <link rel="stylesheet" href="{pre}assets/css/ao-viz.css">
  <link rel="stylesheet" href="{pre}assets/css/ao-labs.css">
  <link rel="stylesheet" href="{pre}assets/css/comic.css">{css}
  <script src="{pre}assets/js/main.js"></script>
  <script src="{pre}assets/js/academy-logic.js" defer></script>
  <script src="{pre}assets/js/academy-arith.js" defer></script>
  <script src="{pre}assets/js/academy-disc.js" defer></script>
  <script src="{pre}assets/js/academy-pseudo.js" defer></script>
  <script src="{pre}assets/js/academy-bits.js" defer></script>
  <script src="{pre}assets/js/academy.js" defer></script>
  <script src="{pre}assets/js/academy-cine.js" defer></script>
  <script src="{pre}assets/js/ao-viz.js" defer></script>
  <script src="{pre}assets/js/ao-viz2.js" defer></script>{sc}
</head>
<body class="{body_cls}">
  <a class="skip-link" href="#main">Мазмұнға өту</a>
  <header class="topbar">
    <div class="topbar-inner">
      <a class="brand" href="{pre}index.html">AO<span>17</span></a>
      <nav class="nav"></nav>
    </div>
  </header>
{body}
  <footer class="footer"></footer>
</body>
</html>
"""


def lesson_html(L, plan_by_id, prev_l, next_l):
    rel = f"academy/{L['moduleId']}/{L['slug']}.html"
    mod = next(m for m in C.ALL_MODULES if m[0] == L["moduleId"])
    lvl = f"Senior · Level {C.SENIOR_LEVEL[mod[0]]}" if mod[0] in C.SENIOR_LEVEL else "Core · Level II" if mod[0] in C.CORE_IDS else "Level I"
    n = int(L["slug"][1:])
    pre_links = "".join(
        f'<li><a href="../{plan_by_id[p]["module"]}/{plan_by_id[p]["slug"]}.html">{E(plan_by_id[p]["title"])}</a></li>' if p in DONE
        else f'<li>{E(plan_by_id[p]["title"])} <small>(жоспарда)</small></li>' for p in L["prerequisites"]) or "<li>Алғышарт жоқ: бұл - бастапқы сабақ.</li>"
    theory = "".join(f'<div class="ac-th ac-{t["kind"]}"><div class="ac-th-k">{KIND[t["kind"]]}</div><h4>{E(t["title"])}</h4>{t["body"]}</div>' for t in L["theory"])
    examples = "".join(
        f'<figure class="ac-ex"><figcaption>{E(x["title"])}</figcaption><pre data-lang="{x.get("lang", "python")}"><code class="language-{x.get("lang", "python").replace("-local", "")}">{E(x["code"])}</code></pre>'
        + (f'<div class="ac-out"><span>stdin</span><pre>{E(x["stdin"])}</pre></div>' if x.get("stdin") else "")
        + (f'<div class="ac-out"><span>Іске қосу</span><pre>./prog {E(" ".join(x["args"]))}</pre></div>' if x.get("args") else "")
        + f'<div class="ac-out"><span>{"Шығыс (build кезінде gcc арқылы алынған)" if x.get("lang") == "c" else "Шығыс (build кезінде CPython + gcc арқылы алынған; браузерде subprocess жоқ - өз компьютеріңізде іске қосыңыз)" if x.get("lang") == "python-local" else "Шығыс (build кезінде Node.js арқылы алынған)" if x.get("lang") == "javascript" else "Нәтиже (сипаттама, автоматты тексерілмеген)" if x.get("lang") in ("html", "css", "sql", "http", "text") else "Шығыс (тексерілген)"}</span><pre>{E(x["output"])}</pre></div>'
        + (f'<div class="ac-out"><span>stderr (gcc {E(" ".join(x["cflags"]))})</span><pre>{E(x["stderrShow"])}</pre></div>' if x.get("stderrShow") else "")
        + f'<p>{E(x["explain"])}</p></figure>' for x in L["examples"])
    mistakes = "".join(f'<li><b>{E(m["mistake"])}</b><br>Себебі: {E(m["why"])}<br>Түзету: {E(m["fix"])}</li>' for m in L["mistakes"])
    proj = ""
    if L.get("project"):
        pj = L["project"]
        li = lambda xs: "".join(f"<li>{E(x)}</li>" for x in xs)  # noqa: E731
        proj = (f'<section class="ac-sec ac-project" id="project"><h2>Модуль жобасы: {E(pj["title"])}</h2><p>{E(pj["statement"])}</p>'
                f'<h3>Функционалдық талаптар</h3><ul>{li(pj["requirements"])}</ul><h3>Кезеңдер</h3><ul>{li(pj["milestones"])}</ul>'
                f'<h3>Қабылдау тесттері</h3><ul>{li(pj["acceptance"])}</ul><h3>Бағалау рубрикасы</h3><ul>{li(pj["rubric"])}</ul>'
                f'<p class="ac-note">Жобаны мұғалім рубрикамен бағалайды: бұл бетте автоматты бағаланбайды.</p></section>')
    data = {"id": L["id"], "visual": L["visual"], "experiment": L["experiment"], "exercises": L["exercises"], "assessment": L["assessment"],
            "reflection": L["reflection"], "objectives": len(L["objectives"]), "cine": CN.for_lesson(L)}
    film = data["cine"]
    film_tr = "".join(f"<li><b>{E(c)}.</b> {E(t)}</li>" for c, t in CN.transcript(film))
    film_html = (f'<section class="ac-cine" id="s-film" data-cine data-title="{E(L["title"])}" data-img="../../assets/img/" aria-label="Кино-түсіндіру: {E(L["title"])}">'
                 f'<p class="ac-note">Кино-түсіндіру: сабақтың өзегі бір минуттық мультфильмде. Мәтіні төменде.</p></section>'
                 f'<details class="cn-tr"><summary>Фильмнің мәтіні ({"авторлық сценарий" if film["kind"] == "авторлық" else "сабақ қадамдарынан құрастырылған"})</summary><ol>{film_tr}</ol></details>')
    comic_html, ep = "", CXE.BY_LESSON.get(L["id"])
    if ep:
        n_ep, e = ep
        prv, nxt = (CXE.EPISODES[n_ep - 1] if n_ep else None), (CXE.EPISODES[n_ep + 1] if n_ep + 1 < len(CXE.EPISODES) else None)
        hrefs = lambda x: "../" + x["lesson"].split(".")[1] + "/" + x["lesson"].split(".")[2] + ".html#s-comic"  # noqa: E731
        head = (f'<div class="cx-head"><div><p class="cx-k">Комикс · «Нұрай, Мустафа және Бота», {n_ep + 1}-эпизод</p>'
                f'<h2 class="cx-t" id="cx-h">{E(e["title"])}</h2></div><a href="../comics.html">Барлық эпизодтар</a></div>')
        foot = ('<p class="cx-foot">' + (f'<a href="{hrefs(prv)}">← {E(prv["title"])}</a>' if prv else '<span></span>')
                + (f'<a href="{hrefs(nxt)}">{E(nxt["title"])} →</a>' if nxt else '<span></span>') + '</p>')
        comic_html = f'<section class="ac-comic" id="s-comic" aria-labelledby="cx-h">{CX.strip(e, CX.uid_of(L["id"]), head, foot)}</section>'
    toc = '<li><a href="#s-film">▶ Кино-түсіндіру</a></li>' + ('<li><a href="#s-comic">Комикс</a></li>' if comic_html else '') + "".join(f'<li><a href="#s-{k}">{E(t)}</a></li>' for k, t in SECTIONS)
    nav = (f'<nav class="ac-pager">' + (f'<a href="{prev_l["slug"]}.html">← {E(prev_l["title"])}</a>' if prev_l else '<span></span>')
           + f'<a href="../index.html#{L["moduleId"]}">Модуль картасы</a>' + (f'<a href="{next_l["slug"]}.html">{E(next_l["title"])} →</a>' if next_l else '<span></span>') + "</nav>")
    sec = lambda k, inner: f'<section class="ac-sec" id="s-{k}"><h2><span class="ac-n">{k.upper()}</span>{dict(SECTIONS)[k]}</h2>{inner}</section>'  # noqa: E731
    body = f"""  <div class="ac-layout">
    <aside class="ac-toc" aria-label="Сабақ бөлімдері"><p class="ac-toc-h">Бөлімдер</p><ol>{toc}</ol>
      <div class="ac-mastery" data-ac-mastery><span>Меңгеру</span><b>-</b></div></aside>
    <article class="content ac-lesson" id="main" data-lesson="{E(L['id'])}" style="--mh:{EM.hue(L['moduleId'])}">
      <header class="ac-head">
        <div class="ac-head-t">
          <p class="ac-crumb"><a href="../index.html">CS Universe</a> / <a href="../index.html#{L['moduleId']}">{lvl} · {E(mod[2])}</a> / {n}-сабақ</p>
          <p class="ac-folio"><span>{L['moduleId'].upper() if L['moduleId'][0] in 'sc' else L['moduleId'][1:]}</span><i>·</i><span>{n:02d}</span><small>{E(mod[1])}</small></p>
          <h1>{E(L['title'])}</h1>
          <ul class="ac-chips"><li>{DIFF[L['difficulty']]}</li><li>≈ {L['minutes']} мин</li><li>{len(L['objectives'])} мақсат</li><li>{len(L['exercises']) + len(L['assessment'])} тапсырма</li></ul>
          <p class="ac-meta">нұсқа {E(L['version'])} · тексеру: {E(L['reviewStatus'])}</p>
        </div>
        {EM.svg(L['moduleId'])}
      </header>
      {film_html}
      {comic_html}
      {sec('a', '<ul class="ac-obj">' + ''.join(f'<li>{E(o)}</li>' for o in L['objectives']) + '</ul>')}
      {sec('b', f'<ul>{pre_links}</ul>')}
      {sec('c', L['concept'])}
      {sec('d', theory)}
      {sec('e', f'<div class="ac-lab" data-lab="visual"></div><p class="ac-cap">{E(L["visual"].get("caption", ""))}</p>' + "".join(f'<h3 class="ac-viz-h">Интерактивті модель: өзің басқар</h3><p class="ac-cap">{E(v["why"])}</p><div data-aov="{E(v["type"])}" data-aov-params="{E(json.dumps(v.get("params", {}), ensure_ascii=False))}"></div>' for v in L.get("viz", [])))}
      {sec('f', '<div class="ac-anim" data-anim><p class="ac-anim-h">Анимациялық түсіндіру: қадамдар кезекпен ашылады. «Ойнату» не → пернесі.</p><ol class="ac-steps">' + ''.join(f'<li>{E(s)}</li>' for s in L['derivation']) + '</ol></div>')}
      {sec('g', examples)}
      {sec('h', f'<p class="ac-task">{E(L["experiment"]["task"])}</p><div class="ac-lab" data-lab="experiment"></div>')}
      {sec('i', '<div class="ac-exs" data-set="exercises"></div>')}
      {sec('j', L['reasoning'])}
      {sec('k', CX.trap_html(L) + f'<ul class="ac-mist">{mistakes}</ul>')}
      {sec('l', '<p class="ac-note">Барлық сұраққа дұрыс жауап берсеңіз, сабақ «меңгерілді» деп белгіленеді. Тексеру браузерде өтеді: бұл оқу тексерісі, емтихан емес.</p><div class="ac-exs" data-set="assessment"></div>')}
      {sec('m', '<div data-ac-reflect></div>')}
      {sec('n', '<h3>Honors</h3><ul>' + ''.join(f'<li>{E(x)}</li>' for x in L['further']['honors']) + '</ul><h3>Research</h3><ul>' + ''.join(f'<li>{E(x)}</li>' for x in L['further']['research']) + '</ul>')}
      {proj}
      <section class="ac-sec ac-src"><h2>Дереккөз және лицензия</h2><ul>{''.join(f'<li>{E(r)}</li>' for r in L['references'])}</ul>
        <p>Сабақ мәтіні, мысалдары мен тапсырмалары AO17 үшін жаңадан жазылған (авторлық: Sagid Mustafa, All Rights Reserved). Дереккөздер ұғымдарды салыстыру үшін пайдаланылды, мәтін көшірілмеген. ID: <code>{E(L['id'])}</code></p></section>
      {nav}
    </article>
  </div>
  <script type="application/json" id="ac-data">{json.dumps(data, ensure_ascii=False).replace("</", "<\\/")}</script>"""
    return rel, page(rel, L["title"], f"AO17 CS Universe, {lvl}: {L['title']}. {L['objectives'][0]}", body)


DONE = set()


def comics_html(lessons):
    """«Нұрай, Мустафа және Бота» хабы: Level I эпизодтары (мұқаба - бірінші кадр), «Тұзақ» комикстері және 2-бөлімнің (3D зертхана)
    44 комиксі (tools/academy/inside_comics.py)."""
    by_id = {L["id"]: L for L in lessons}
    cards = []
    for n, e in enumerate(CXE.EPISODES, 1):
        L = by_id.get(e["lesson"])
        if not L:
            continue
        href = f'{L["moduleId"]}/{L["slug"]}.html#s-comic'
        cards.append(f'<li><a class="cxh-card" href="{href}">{CX.cover_svg(e, CX.uid_of("cv" + e["lesson"]))}<div class="cxh-tx">'
                     f'<p class="cxh-ep">{n}-эпизод · {E(L["title"])}</p><h3>{E(e["title"])}</h3><p>{E(e["teaser"])}</p></div></a></li>')
    sample = next(L for L in lessons if L["moduleId"] == "m07" and L["slug"] == "l01")
    n3 = len(L3.IX.entries())
    body = f"""  <div class="layout single">
    <article class="content" id="main">
      <header class="lecture-head" style="--lc:#b3262e"><div class="num">CS Universe</div><h1>Комикс: Нұрай, Мустафа және Бота</h1>
        <p>Нұрай - мұқият, сұрақ қоятын оқушы. Мустафа - батыл, асығыс кодтайтын, сондықтан тұзаққа жиі түсетін оқушы. Бота - AO17-нің ботақаны, ол түсіндіреді. Нұрай мен Мустафа INSIDE TECH 3D зертханаларында да кездеседі. Level I-дің әр модулі бір эпизодпен ашылады: күнделікті өмірден алынған мысал, қате және оның себебі. Комикстегі әр код кадрының шығысы сайтты құрастыру кезінде нағыз Python не gcc арқылы тексерілген. Курстың <a href="#part2">2-бөлімінде, 3D зертханаларда, тағы {n3} комикс</a>, техника-кейіпкерлердің <a href="#stories">«Тірі заттар» әңгімелері</a> және оқу туралы <a href="#learn">«Қалай оқу керек?» эпизодтары</a> бар.</p></header>
      <h2>Level I: {len(cards)} эпизод</h2>
      <ul class="cxh-grid">{"".join(cards)}</ul>
      <h2>«Тұзақ» комикстері: әр сабақта</h2>
      <p>Әр сабақтың «Жиі қателер» бөлімінде төрт кадрлық комикс бар: Нұрай не Мустафа жиі кездесетін қатені жасайды, Бота тоқтатады, себебін түсіндіреді және ережені айтады. Мәтін сабақтың тексерілген деректерінен алынады, сондықтан {len(lessons)} сабақтың әрқайсысында өз тұзағы бар. Мысал - «{E(sample["title"])}» сабағы:</p>
      {CX.trap_html(sample)}
      <h2 id="part2">2-бөлім: 3D зертхана, {n3} комикс</h2>
      <p>INSIDE TECH 3D зертханаларының комикстері. Әр зертхананың алғашқы екі сабағы күнделікті өмірдегі бір жағдайдан басталады, ал үшінші сабағы - кино-комикс: тыңшылық триллер, ғылыми фантастика, детектив және тағы жеті жанр. Математика сабақтарының өз комикстері бар. Комикс сабақтың өз қадамында, дәрістің алдында тұрады. Мұнда да түсіндіретін - Бота.</p>
      {L3.comics_shelf()}
      <h2 id="stories">«Тірі заттар»: {len(L3.IX.stories())} әңгіме</h2>
      <p>Бұл әңгімелерде ноутбук, сервер, процессор, желі пакеті, телефон, робот және вирус өздері сөйлейді: сабақтағы ұғымды техниканың өз көзімен көресің. Әр әңгіме өз сабағының соңында тұр.</p>
      {L3.stories_shelf()}
      <h2 id="learn">«Қалай оқу керек?»: {len(L3.IX.episodes())} эпизод</h2>
      <p>Оқу туралы жеті танымал сенім. Әр эпизодта алдымен өзің шешесің: миф пе, шындық па? Сосын комикс, зерттеулердің нәтижесі және сайттағы құрал ашылады.</p>
      {L3.learn_shelf()}
      <p><a href="index.html">CS Universe картасына оралу</a> · <a href="3d/index.html">2-бөлім: 3D зертхана</a> · <a href="learn.html">Қалай оқу керек?</a></p>
    </article>
  </div>"""
    return "academy/comics.html", page("academy/comics.html", "Комикс: Нұрай, Мустафа және Бота", "AO17 комиксі: Нұрай, Мустафа және Бота бағдарламалау, логика және компьютер негіздерін күнделікті өмір мысалдарымен түсіндіреді. Әр сабақта жиі қате туралы комикс, 3D зертханаларда тағы 44 комикс.", body)


OYU_WEEK = {6: "Ою студиясы: циклмен шаршы, жұлдыз, шаңырақ", 7: "Ою студиясы: функциямен қошқар мүйіз, айна, төрт құлақ",
            9: "Ою студиясы: рекурсиямен өсімдік оюы"}   # Python апталары: academy/oyu.html тапсырмалары
BOTA_WEEK = {4: ("first", "Бота әлемі: алгоритм - қадамдардың нақты реті"), 6: ("long", "Бота әлемі: for, while және if деңгейлері"),
             7: ("right", "Бота әлемі: оңға() функциясын өзің жаса"), 9: ("deliver", "Бота әлемі: керуен, лабиринт, алма бағы")}   # academy/bota.html#l=<деңгей>


def course_map(weeks, labs):
    """AO17 CS курсының метро картасы (SVG). Жоғарғы қызыл желі - 1-бөлімнің апталары, оң жақта бұрылып төменгі көк желіге -
    2-бөлімнің зертханаларына жалғасады. Үзік сызық - аптада қолданылатын 3D зертханаға ауысу (бекетті нұсқағанда жанады).
    Бекет - сілтеме (апта не зертхана карточкасына); прогресті course.js бояйды (st-on, st-done, st-next).
    weeks: [(n, бекет id, қысқа атауы, [зертхана id])], labs: [(n, зертхана id, қысқа атауы)]."""
    top, bot, x0, x1 = 96, 284, 58, 938
    xw = {sid: x0 + i * (x1 - x0) / (len(weeks) - 1) for i, (_, sid, _, _) in enumerate(weeks)}
    xl = {lid: x1 - j * (x1 - x0) / (len(labs) - 1) for j, (_, lid, _) in enumerate(labs)}
    mid = (top + bot) / 2
    g = [f'<path class="cm-l1" pathLength="1" d="M{x0} {top} H{x1} C976 {top} 982 {top + 26} 982 {top + 56} V{mid}"/>',
         f'<path class="cm-l2" pathLength="1" d="M982 {mid} V{bot - 56} C982 {bot - 26} 976 {bot} {x1} {bot} H{x0}"/>']
    rules = []
    for _, sid, _, lids in weeks:
        for lid in dict.fromkeys(lids):
            if lid in xl:
                a, b = xw[sid], xl[lid]
                g.append(f'<path class="cm-x cx-{sid} cx-{lid}" d="M{a:.1f} {top + 16} C{a:.1f} {mid}, {b:.1f} {mid}, {b:.1f} {bot - 16}"/>')
    def station(cls, sid, x, y, n, label, href, above):
        ly = y - 24 if above else y + 36
        rules.append(sid)   # rules-тің реті - жол бойындағы реті (ao17-motion.css: бекеттер кезекпен шығады)
        return (f'<a class="cm-st {cls}" href="{href}" data-st="{sid}" aria-label="{E(label)}" style="--i:{len(rules) - 1}">'
                f'<circle class="cm-ring" cx="{x:.1f}" cy="{y}" r="19"/><circle class="cm-dot" cx="{x:.1f}" cy="{y}" r="13"/>'
                f'<text class="cm-n" x="{x:.1f}" y="{y + 4}">{n}</text><text class="cm-lb" x="{x:.1f}" y="{ly}">{E(label.split(": ", 1)[1])}</text></a>')
    for i, (n, sid, short, _) in enumerate(weeks):
        g.append(station("cm-w", sid, xw[sid], top, n, f"{n}-апта: {short}", f"#{sid}", i % 2 == 0))
    for j, (n, lid, short) in enumerate(labs):
        g.append(station("cm-lab", lid, xl[lid], bot, n, f"{n}-зертхана: {short}", f"#lab-{lid}", j % 2 == 1))
    g.append(f'<text class="cm-ln" x="{x0 - 14}" y="30">1-бөлім · Негіз: 12 апта</text>'
             f'<text class="cm-ln cm-ln2" x="{x0 - 14}" y="{bot + 76}">2-бөлім · Технологияның ішінен: {len(labs)} зертхана</text>')
    css = "".join(f'.crs-map:has([data-st="{r}"]:is(:hover,:focus-visible)) .cx-{r}{{opacity:1;stroke:#c98a00;stroke-dasharray:none}}' for r in rules)
    return (f'<section class="crs-map" aria-labelledby="map-h" data-ao-in><h2 id="map-h">Курс картасы</h2>'
            f'<p class="crs-note">Курс - бір жол: 12 аптадан кейін 3D зертханаларға өтесің. Бекетті басса, сол апта не зертхана ашылады; үзік сызық - аптада қолданылатын 3D зертхана (бекетті нұсқағанда жанады).</p>'
            f'<style>{css}</style><div class="crs-map-sc"><svg class="crs-map-svg" viewBox="0 0 1000 380" role="group" aria-label="AO17 CS курсының картасы: 12 апта және {len(labs)} зертхана">{"".join(g)}</svg></div>'
            '<p class="crs-map-lg"><span class="cml cml-done">аяқталды</span><span class="cml cml-on">басталды</span><span class="cml cml-next">келесі қадам</span></p></section>')


def course_html(lessons, st):
    """AO17 CS: екі бөлімді курс беті. 1-бөлім «Негіз» - 12 апта (CS Universe Level I + комикс + 3D сабақ + жоба),
    2-бөлім «Технологияның ішінен» - 3D зертхананың зертханалары (tools/academy/lab3d.py). Оқушы прогресі: assets/js/course.js."""
    by_mod = {}
    for L in lessons:
        by_mod.setdefault(L["moduleId"], []).append(L)
    mods = {m[0]: m for m in C.ALL_MODULES}
    eps = {e["lesson"].split(".")[1]: e for e in CXE.EPISODES}
    weeks, n3d, tot_l, tot_t, tot_min = [], set(), 0, 0, 0
    prog = {"weeks": {}, "labs": {}}   # course.js: [id, сілтеме, атауы(, тест саны)]
    bar = '<div class="crs-bar" aria-hidden="true"><i></i></div><p class="crs-pr"></p>'
    for n, (mid, question, labs) in enumerate(CRS.WEEKS, 1):
        ls = sorted(by_mod.get(mid, []), key=lambda x: x["slug"])
        if not ls:
            continue
        tasks = sum(len(x["exercises"]) + len(x["assessment"]) for x in ls)
        mins = sum(x["minutes"] for x in ls)
        tot_l, tot_t, tot_min = tot_l + len(ls), tot_t + tasks, tot_min + mins
        prog["weeks"][f"w{n}"] = [[x["id"], f'{mid}/{x["slug"]}.html', x["title"]] for x in ls]
        pj = next((x for x in ls if x.get("project")), None)
        ep = eps.get(mid)
        n3d.update(h for h, _ in labs)
        lab_links = ", ".join(f'<a href="{L3.href(h, "")}">{E(t)}</a>' for h, t in labs)
        items = (f'<li class="crs-comic"><span>Комикс</span><a href="{mid}/l01.html#s-comic">{E(ep["title"])}</a></li>' if ep else "") \
            + f'<li class="crs-3d"><span>3D зертхана</span><p>{lab_links}</p></li>' \
            + (f'<li class="crs-oyu"><span>Студия</span><p><a href="oyu.html">{E(OYU_WEEK[n])}</a></p></li>' if n in OYU_WEEK else "") \
            + (f'<li class="crs-bota"><span>Ойын</span><p><a href="bota.html#l={BOTA_WEEK[n][0]}">{E(BOTA_WEEK[n][1])}</a></p></li>' if n in BOTA_WEEK else "") \
            + (f'<li class="crs-xray"><span>X-RAY</span><p><a href="xray.html#ex={XR.WEEK[n][0]}">{E(XR.WEEK[n][1])}</a></p></li>' if n in XR.WEEK else "") \
            + f'<li class="crs-quiz"><span>Сынақ</span><p><a href="exam.html?w={n}">{n}-апта сынағы: 8 сұрақ</a> <small data-quiz="w{n}"></small></p></li>' \
            + (f'<li class="crs-pj"><span>Жоба</span><p><a href="{mid}/{pj["slug"]}.html#project">{E(CRS.PROJECT_KK.get(pj["project"]["id"], pj["project"]["title"]))}</a>'
               + (f' <small lang="en">{E(pj["project"]["title"])}</small>' if pj["project"]["id"] in CRS.PROJECT_KK else "") + '</p></li>' if pj else "")
        thumb = f"assets/img/posters/thumb/ao17cs-w{n:02d}.jpg"
        cover = (f'<a class="crs-wv" href="../posters.html#cs-w{n:02d}" aria-label="{n}-аптаның комикс-мұқабасы" data-ao-in="cover"><img src="../{thumb}" alt="" width="240" height="360" loading="lazy"></a>'
                 if (ROOT / thumb).exists() else "")
        weeks.append(f'<li class="crs-w{" has-cover" if cover else ""}" id="w{n}">{cover}<p class="crs-wn"><span>Апта</span><b>{n}</b></p><div class="crs-wb">'
                     f'<h3><a href="{mid}/l01.html">{E(mods[mid][2])}</a></h3><p class="crs-wq">{E(question)}</p>'
                     f'<p class="crs-wm">{len(ls)} сабақ · {tasks} тапсырма · ≈{round(mins / 60)} сағат</p></div><ul class="crs-wl">{items}</ul>{bar}</li>')
    final = next((x for x in sorted(by_mod.get("m12", []), key=lambda x: x["slug"]) if x.get("project")), None)
    pillars = "".join(f'<li><b>{E(a)}</b><p>{E(b)}</p></li>' for a, b in CRS.PILLARS)
    # 2-бөлім: 3D зертханалар ұсынылатын ретпен
    LS = L3.lab_summary()
    n3_l = sum(len(x["lessons"]) for x in LS)
    n3_q = sum(q["quiz"] for x in LS for q in x["lessons"])
    n3_min = sum(x["minutes"] for x in LS)
    labs_html = []
    for no, x in enumerate(LS, 1):
        first = x["lessons"][0]
        prog["labs"][x["id"]] = [[q["id"], f'3d/{x["id"]}/{q["id"]}.html', q["kk"], q["quiz"]] for q in x["lessons"]]
        lthumb = f"assets/img/posters/thumb/ao17cs-3d-{x['id']}.jpg"   # tools/make_lab_posters.py: зертхананың комикс-мұқабасы
        lcover = (f'<a class="crs-wv" href="../posters.html#cs-3d-{x["id"]}" aria-label="«{E(x["kk"])}» зертханасының комикс-мұқабасы" data-ao-in="cover">'
                  f'<img src="../{lthumb}" alt="" width="240" height="360" loading="lazy"></a>') if (ROOT / lthumb).exists() else ""
        labs_html.append(f'<li class="crs-lab{" has-cover" if lcover else ""}" id="lab-{x["id"]}" style="--lc:{x["color"]}">{lcover}<p class="crs-ln" aria-hidden="true">{no}</p><div class="crs-lb">'
                         f'<h3><a href="3d/index.html#{x["id"]}">{E(x["kk"])}</a> <small lang="en">{E(x["en"])}</small></h3>'
                         + (f'<p class="crs-lt">{E(x["tag"])}</p>' if x["tag"] else "")
                         + f'<p class="crs-wm">{len(x["lessons"])} сабақ · {sum(q["quiz"] for q in x["lessons"])} тест сұрағы · ≈{round(x["minutes"] / 60)} сағат</p>'
                         f'<p class="crs-l1">Бірінші сабақ: <a href="3d/{x["id"]}/{first["id"]}.html">{E(first["kk"])}</a></p>{bar}</div></li>')
    hours = round((tot_min + n3_min) / 60)
    ld = {"@context": "https://schema.org", "@type": "Course", "name": "AO17 CS: Компьютерлік ғылымға кіріспе", "inLanguage": "kk",
          "description": (f"Екі бөлімді тегін курс. 1-бөлім (12 апта): логика, дәлелдеу, дискретті құрылымдар, алгоритмдер, бит, Python, функциялар, "
                          f"деректер құрылымы, C, жад және жүйелер. 2-бөлім: {len(LS)} 3D зертхана - архитектура, алгоритмдер, желілер, веб, дерекқор, "
                          f"қауіпсіздік, бұлт, AI. Барлығы {tot_l + n3_l} сабақ."),
          "provider": {"@type": "Organization", "name": "AO17", "url": "https://mustafa7677.github.io/CS50MUSS/"},
          "isAccessibleForFree": True, "url": "https://mustafa7677.github.io/CS50MUSS/academy/course.html",
          "image": "https://mustafa7677.github.io/CS50MUSS/assets/img/og/course-ao17cs.jpg",
          "hasCourseInstance": {"@type": "CourseInstance", "courseMode": "online", "courseWorkload": f"PT{hours}H"}}
    poster = (ROOT / "assets/img/posters/ao17cs.jpg").exists()
    hv = ('<div class="crs-hv"><a class="crs-hcov" href="../posters.html#cs-main" aria-label="AO17 CS курсының комикс-мұқабасы (афиша)">'
          '<img src="../assets/img/posters/ao17cs.jpg" alt="AO17 CS курсының мұқабасы: шаңырақ-схема астында Нұрай, Мустафа және Бота" width="1000" height="1500"></a>'
          '<a class="crs-hfilm" href="../film/cs/"><span class="crs-hplay" aria-hidden="true"></span><span><b>Фильм: «Даладан жұлдызға»</b><small>36 секунд</small></span></a></div>') if poster else ""
    film_m = ' <a class="btn secondary crs-film-m" href="../film/cs/">Фильм: 36 секунд</a>' if hv else ""   # телефонда: мұқабаның астындағы жолдың орнына
    body = f"""  <div class="layout single">
    <article class="content crs" id="main" data-ao-progress>
      <header class="crs-hero{" crs-hx" if hv else ""}">{hv}
        <p class="crs-k">AO17 CS</p>
        <h1>Компьютерлік ғылымға кіріспе</h1>
        <p class="crs-lede">Екі бөлім, бір жол. Бірінші бөлімде он екі аптада логикадан жүйеге дейін жүресің: ұғымды түсіндірме мен комикстен аласың, кодты өзің жазасың. Екінші бөлімде технологияның ішіне кіресің: процессордың, желінің, дерекқордың, нейрон желінің ішін 3D симуляцияда көріп, өлшейсің. Қазақ тілінде, тегін, браузерде.</p>
        <ul class="crs-stats"><li><b data-ao-count>2</b><span>бөлім</span></li><li><b data-ao-count>{tot_l + n3_l}</b><span>сабақ</span></li><li><b data-ao-count>{tot_t + n3_q}</b><span>тапсырма мен тест</span></li>
          <li><b data-ao-count>{len(CXE.EPISODES)}</b><span>комикс эпизоды</span></li><li><b data-ao-count>{len(LS)}</b><span>3D зертхана</span></li><li><b data-ao-count>≈{hours}</b><span>сағат</span></li></ul>
        <p class="crs-cta"><a class="btn gold" id="crs-go" href="m01/l01.html">1-аптадан бастау</a> <a class="btn secondary" href="#part2">2-бөлім: 3D зертхана</a> <a class="btn secondary" href="comics.html">Комикстер</a> <a class="btn secondary" href="../posters.html#ao17cs">Курс мұқабалары</a> <a class="btn secondary" href="plan.html">Оқу кестесі</a>{film_m}</p>
        <p class="crs-plan" data-plan-chip hidden></p>
        <p class="crs-me" id="crs-me" hidden></p>
      </header>
      <nav class="crs-parts" aria-label="Курс бөлімдері">
        <a class="crs-part" href="#part1"><span class="crs-pk">1-бөлім</span><b>Негіз</b><span>12 апта · {tot_l} сабақ · {tot_t} тапсырма. Логикадан жүйеге дейін: Python, C, жад.</span><span class="crs-pp" data-part="0"></span></a>
        <a class="crs-part crs-part3" href="#exam"><span class="crs-pk">Бағалау</span><b>Сынақ және сертификат</b><span>12 апта сынағы, 2 бөлім емтиханы, қорытынды емтихан. Нәтижең сертификатты ашады.</span><span class="crs-pp" data-part="exam"></span></a>
        <a class="crs-part crs-part2" href="#part2"><span class="crs-pk">2-бөлім</span><b>Технологияның ішінен</b><span>{len(LS)} зертхана · {n3_l} сабақ · {n3_q} тест сұрағы. Машинаның ішін 3D симуляцияда көр.</span><span class="crs-pp" data-part="1"></span></a>
      </nav>
      {course_map([(n, f"w{n}", CRS.WEEK_SHORT.get(mid, mid), [L3.data()[2].get(h) for h, _ in labs if L3.data()[2].get(h)]) for n, (mid, _, labs) in enumerate(CRS.WEEKS, 1)],
                  [(no, x["id"], CRS.LAB_SHORT.get(x["id"], x["kk"])) for no, x in enumerate(LS, 1)])}
      <section class="crs-sec" id="part1" aria-labelledby="part1-h">
        <h2 id="part1-h"><span class="crs-pk">1-бөлім</span>Негіз: 12 апта</h2>
        <h3>Әр апта үш қадаммен жүреді</h3>
        <ol class="crs-pillars">{pillars}</ol>
        <ol class="crs-weeks">{"".join(weeks)}</ol>
        <section class="crs-final"><h3>1-бөлімнің қорытынды жобасы</h3>
          <p>Он екінші аптаның жобасы{(" - «" + E(CRS.PROJECT_KK.get(final["project"]["id"], final["project"]["title"])) + "»") if final else ""}: бөлімнің бәрін бір жүйеге жинайсың. Деректі оқитын, тексеретін, есептейтін және нәтиже шығаратын компоненттерді Python мен C-да жазып, екеуін тестпен салыстырасың. Жобаны мұғалім рубрикамен бағалайды.</p>
          {f'<p><a class="btn secondary" href="m12/{final["slug"]}.html#project">Жобаның талаптары</a></p>' if final else ""}</section>
      </section>
      <section class="crs-sec" id="part2" aria-labelledby="part2-h">
        <h2 id="part2-h"><span class="crs-pk">2-бөлім</span>Технологияның ішінен: {len(LS)} зертхана</h2>
        <p class="crs-note">Бірінші бөлімде бит, код және жад туралы білгеніңді енді нақты жүйенің ішінде көресің. Әр сабақ: кино-түсіндіру, дәріс, алдымен болжау, 3D симуляциядағы тапсырма, тест, шешілген мысал және «қатені тап». Әр зертханада есептер жинағы бар: нұсқаулықсыз, тек спецификация мен автотексеруші. Зертханалар ұсынылатын ретпен тұр: архитектура мен алгоритмдер қалғанының негізі, бірақ кез келгенінен бастауға болады.</p>
        <ol class="crs-labs">{"".join(labs_html)}</ol>
        <p class="crs-more"><a class="btn secondary" href="3d/index.html">2-бөлімнің барлық {n3_l} сабағы</a> <a class="btn secondary" href="3d/app/index.html">3D қолданбаны ашу</a></p>
      </section>
      <section class="crs-sec crs-eval" id="exam" aria-labelledby="exam-h">
        <h2 id="exam-h"><span class="crs-pk">Бағалау</span>Сынақтар, емтихан және сертификат</h2>
        <p class="crs-note">Білімді тексерудің ең сенімді жолы - еске түсіру. Әр аптаның соңында қысқа сынақ, бөлімнің соңында емтихан, ал курстың соңында қорытынды емтихан бар. Сұрақтар {len(AX.bank(lessons)["items"])} сұрақтық қордан кездейсоқ таңдалады, сондықтан әр жолы басқаша.</p>
        <ol class="crs-steps" role="list">
          <li><b>Апта сынағы</b><p>12 апта, әрқайсысында 8 сұрақ: аптаның сабақтарынан және сол аптаның 3D зертханасынан. Уақыт шектелмейді, әр жауаптан кейін түсіндірмесі шығады.</p><a href="exam.html?w=1">1-апта сынағынан бастау</a></li>
          <li><b>Бөлім емтихандары</b><p>1-бөлім: 24 сұрақ, 2-бөлім: 22 сұрақ, әрқайсысы 30 минут. Нәтиже апта мен зертхана бойынша талданады.</p><span class="crs-sl"><a href="exam.html?part=1">1-бөлім емтиханы</a><a href="exam.html?part=2">2-бөлім емтиханы</a></span></li>
          <li><b>Қорытынды емтихан</b><p>Екі бөлімнен 36 сұрақ, 45 минут, өту шегі {AX.PASS}%. Бет жаңартылса, емтихан тоқтаған жерінен жалғасады.</p><a class="btn gold" href="exam.html">Емтиханға өту</a></li>
          <li><b>Сертификат</b><p>Қорытынды емтиханнан өткен соң атың жазылған AO17 CS сертификаты ашылады: басып шығаруға не PDF ретінде сақтауға болады.</p><a href="certificate.html">Сертификат</a></li>
        </ol>
        <p class="crs-me" data-exam-me hidden></p>
      </section>
      <section class="crs-sec crs-play" id="play" aria-labelledby="play-h">
        <h2 id="play-h"><span class="crs-pk">Python алаңы</span>Кодпен ойна</h2>
        <p class="crs-note">Сабақтағы Python бірден көрінетін нәтижеге айналатын үш орта. Бота әлемінде код Ботаны жүргізеді, Ою студиясында қазақ оюын салады, ал X-RAY кодтың өз ішін көрсетеді. Үшеуінде де код браузерде нағыз Python-да орындалады: қате жолы белгіленеді, себебі қазақша түсіндіріледі.</p>
        <ul class="crs-play-l" role="list">
          <li class="crs-pl"><img src="../assets/img/bota-happy.svg" alt="" width="84" height="84"><div><h3><a href="bota.html">Бота әлемі</a></h3>
            <p>{len(BT.LEVELS)} деңгей: тізбек, функция, for, while, if және лабиринт алгоритмі. «Болжап көр» бөлімінде кодты іске қоспай оқып, Бота қайда тоқтайтынын болжайсың, ал «Өз әлемің» бөлімінде әлемді өзің салып, досыңа жібересің.</p>
            <p class="crs-plp" data-play="bota">Бірінші деңгейден баста</p></div></li>
          <li class="crs-pl">{OY.svg(OY.data()["examples"][0]["items"], "crs-pl-oyu", fit=True)}<div><h3><a href="oyu.html">Ою студиясы</a></h3>
            <p>{len(OY.TASKS)} тапсырма: цикл, функция, симметрия және рекурсия суретке айналады. «Суретті болжа» бөлімінде кодты оқып, қай сурет шығатынын таңдайсың.</p>
            <p class="crs-plp" data-play="oyu">Шаршыдан баста</p></div></li>
          <li class="crs-pl"><svg class="crs-pl-xr" viewBox="0 0 84 84" aria-hidden="true"><rect width="84" height="84" rx="12" fill="#101c31"/><g stroke="#7fd3ff" stroke-width="2" opacity=".7"><line x1="42" y1="28" x2="24" y2="50"/><line x1="42" y1="28" x2="60" y2="50"/></g><rect x="27" y="14" width="30" height="14" rx="4" fill="#f2d36b"/><g fill="#16243d" stroke="#7fd3ff" stroke-width="1.5"><rect x="9" y="50" width="30" height="14" rx="4"/><rect x="45" y="50" width="30" height="14" rx="4"/></g></svg><div><h3><a href="xray.html">AO17 X-RAY</a></h3>
            <p>Кодтың ішіне қара: AST, байт-код, шақыру стегі және рекурсия ағашы бір уақыт жолағында. Айнымалының атын бассаң, оның мәні жазылған нұсқауға кері ораласың.</p>
            <p class="crs-plp" data-play="xray">Факториалдан баста</p></div></li>
        </ul>
      </section>
      <section class="crs-sec crs-how" aria-labelledby="how-h">
        <h2 id="how-h"><span class="crs-pk">Оқу тактикалары</span>Қалай оқыған дұрыс</h2>
        <p class="crs-note">Көп оқу мен дұрыс оқу - екі бөлек нәрсе. Оқу ғылымы тексерген сегіз тактика: еске түсіру, аралық қайталау, араластыру, түсіндіру, ұқсастық, сөз бен сурет, фокус және өзіңді бағалау. Әрқайсысын бірден жаттықтыратын құрал бар: ми төккіш, ұмыту қисығы, жаргон детекторы, 24 ұқсастық, фокус таймері.</p>
        <p class="crs-cta2"><a class="btn gold" href="methods.html">Тактикаларды ашу</a> <a class="btn secondary" href="exam.html?mix=1">Аралас жаттығу</a></p>
      </section>
      <section class="crs-faq"><h2>Жиі қойылатын сұрақтар</h2>
        <details><summary>Курс кімге арналған?</summary><p>Бағдарламалауды нөлден бастағысы келетін оқушы мен студентке. Алдын ала білім керек емес: бірінші апта логикадан, «иә» мен «жоқтан» басталады.</p></details>
        <details><summary>Ақылы ма?</summary><p>Жоқ. Курс тегін, тіркеусіз ашылады. Прогресс осы құрылғыда сақталады, оны кабинеттен басқа құрылғыға көшіруге болады.</p></details>
        <details><summary>Екі бөлімнің айырмасы неде?</summary><p>Бірінші бөлім - іргетас: логика, дәлелдеу, алгоритм, Python, C және жад, әр аптада өзің жазатын код пен жоба. Екінші бөлім - {len(LS)} зертхананың {n3_l} сабағы: әрқайсысында кино-түсіндіру, толық дәріс, тест, шешілген мысал және 3D симуляция бар. Материалдар AO17 командасының INSIDE TECH 3D платформасынан алынған. 3D зертханадағы оқу күндері «Менің шаңырағым» бетіндегі серияға да қосылады.</p></details>
        <details><summary>Тапсырмалар қалай тексеріледі?</summary><p>Браузерде, бірден: Python коды AO17 Judge-де нағыз тестпен тексеріледі, C мысалдарының шығысы сайтты құрастыру кезінде gcc арқылы алынған, 3D зертхананың тесттері жауапты түсіндірмесімен береді. Модуль жобасын мұғалім рубрикамен бағалайды.</p></details>
        <details><summary>Сертификат бере ме?</summary><p>Иә. Қорытынды емтиханда кемінде {AX.PASS}% алсаң, атың жазылған AO17 CS сертификаты ашылады. Ол AO17 платформасындағы оқу нәтижесін растайды; ресми білім туралы құжат емес.</p></details>
        <details><summary>Прогресім қайда көрінеді?</summary><p>Осы беттің өзінде: әр аптаның және әр зертхананың астында аяқталған сабақтар саны шығады, ал «Жалғастыру» батырмасы тоқтаған жеріңе апарады. Деректер тек осы браузерде сақталады.</p></details>
      </section>
      <p><a href="index.html">CS Universe картасына оралу</a> · <a href="../yurt.html">Менің шаңырағым</a></p>
    </article>
  </div>
  <script type="application/json" id="crs-data">{json.dumps(prog, ensure_ascii=False).replace("</", "<\\/")}</script>
  <script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>"""
    return "academy/course.html", page("academy/course.html", "AO17 CS: Компьютерлік ғылымға кіріспе",
                                       f"AO17 CS - екі бөлімді тегін курс қазақ тілінде: 12 апта логикадан жүйеге дейін және {len(LS)} 3D зертхана. {tot_l + n3_l} сабақ, комикстер, 3D симуляциялар.",
                                       body, scripts=("assets/js/ao17-motion.js", "assets/js/course.js"), styles=("assets/css/course.css", "assets/css/ao17-motion.css"))


def study_html(lessons):
    """«Менің оқуым»: үш академияның ортақ оқушы кабинеті (assets/js/ao-study.js, деректер браузерде)."""
    cat = {L["id"]: [f'{L["moduleId"].upper() if L["moduleId"][0] in "sc" else L["moduleId"][1:]}.{L["slug"][1:]} · {L["title"]}', f'{L["moduleId"]}/{L["slug"]}.html'] for L in lessons}
    sec = lambda i, h, note="": f'<section class="ac-sec st-sec"><h2>{h}</h2>{f"<p class=ac-note>{note}</p>" if note else ""}<div id="{i}"></div></section>'  # noqa: E731
    body = f"""  <main class="content ac-home st-home" id="main">
    <header class="lab-hero"><p class="lab-kicker">AO17 · үш академия</p><h1>Менің оқуым</h1>
      <p>CS Universe, IELTS және Digital SAT бойынша жеке оқу картаңыз: қай жерде тоқтадыңыз, не меңгерілді, қай ұғым қиын, қандай қателер қайталанады және бүгін нені қайталау керек.</p>
      <p class="lab-honest">Деректер тек осы браузерде сақталады (тіркелгі қажет емес). Басқа құрылғыға көшіру үшін экспорт/импортты қолданыңыз. Меңгеру ережесі: соңғы үш әрекет көмексіз дұрыс және дәлдік кемінде 80%; бұл - AO17-нің ережесі, ресми емтихан бағасы емес.</p></header>
    {sec("st-today", "Бүгін")}
    {sec("st-review", "Қайталау жоспары", "Аралықпен қайталау: дұрыс жауаптан кейін аралық ұзарады (1, 2, 4, 8, 16 күн), қатеден кейін қайта басынан.")}
    {sec("st-skills", "Дағдылар картасы")}
    {sec("st-hard", "Қиындық тудыратын ұғымдар")}
    {sec("st-notebook", "Қателер дәптері", "Әр қатенің себебі - зертхана берген түсіндірме. Қайта оқып, сол зертханаға оралыңыз.")}
    {sec("st-history", "Оқу тарихы")}
    <section class="ac-sec st-sec"><h2>Прогресті сақтау</h2>
      <p class="lab-row"><button type="button" class="btn gold" id="st-export">Экспорт (JSON)</button>
      <label class="btn secondary" for="st-import">Импорт</label><input type="file" id="st-import" accept="application/json" class="sr-only">
      <button type="button" class="btn secondary" id="st-clear">Зертхана прогресін өшіру</button></p><p id="st-msg" class="ac-note" role="status"></p></section>
  </main>
  <script type="application/json" id="study-data">{json.dumps(cat, ensure_ascii=False).replace("</", "<\\/")}</script>"""
    return "academy/study.html", page("academy/study.html", "Менің оқуым", "AO17 оқушы кабинеті: CS Universe, IELTS және Digital SAT бойынша меңгеру картасы, қателер дәптері, қайталау жоспары және прогресс экспорты.", body,
                                      scripts=("assets/js/ao-tutor.js", "assets/js/ao-study.js"))


def index_html(lessons, st):
    by_id = {L["id"]: L for L in lessons}
    lv = "".join(
        f'<li class="ac-level{" on" if x["id"] == "I" else ""}"><span class="ac-lv">{x["id"]}</span><div><h3>{E(x["kk"])} <small>{E(x["title"])}</small></h3>'
        f'<p>{E(x["goal"])}</p><p class="ac-count">Жоспар: {x["target"]} сабақ · дайын: <b>{st["levels"][i]["complete"]}</b></p>'
        + (f'<p class="ac-subj">{E(", ".join(x["subjects"]))}</p>' if x.get("subjects") else "") + "</div></li>"
        for i, x in enumerate(C.LEVELS))
    def mod_list(modules):
        out = []
        for mid, en, kk, ls in modules:
            m = st["modules"][mid]
            items = []
            for slug, title, goal in ls:
                lid = C.lesson_id(mid, slug)
                if lid in by_id:
                    items.append(f'<li class="done" data-lid="{lid}"><a href="{mid}/{slug}.html">{E(title)}</a><small>{E(goal)}</small></li>')
                else:
                    items.append(f'<li class="plan"><span>{E(title)}</span><small>{E(goal)}</small></li>')
            pre = ", ".join(next(x[2] for x in C.ALL_MODULES if x[0] == p) for p in C.ALL_PREREQ.get(mid, [])) or "жоқ"
            out.append(f'<details class="ac-mod" id="{mid}" style="--mh:{EM.hue(mid)}"{" open" if m["complete"] else ""}><summary>{EM.svg(mid).replace('class="ac-emblem"', 'class="ac-emblem ac-emblem-s"')}<span class="ac-mn">{mid[1:]}</span><b>{E(kk)}</b> <i>{E(en)}</i>'
                        f'<span class="ac-mc">{m["complete"]}/{m["planned"]} дайын</span></summary><p class="ac-pre">Алғышарт модульдер: {E(pre)}</p><ol>{"".join(items)}</ol></details>')
        return "".join(out)
    body = f"""  <main class="content ac-home" id="main">
    <header class="ac-hero">
      <p class="ac-kicker">AO17 Computer Science Universe</p>
      <h1>Негізден Senior деңгейіне дейін, қазақ тілінде</h1>
      <p>Курс таңдамайсыз - бағыт таңдайсыз. Әр бағыт төрт сатыдан тұрады: Негіз, Junior, Middle, Senior. Әр сатыда не үйренетініңіз, қай модульді оқитыныңыз және портфолиоға қандай жоба жасайтыныңыз алдын ала жазылған. Мазмұн AO17 үшін жаңадан жазылады, әр тапсырма автоматты тексеріледі.</p>
      <p class="ac-honest">Қазір дайын: <b>{st["complete_lessons"]}</b> толық сабақ, <b>{st["auto_checked_tasks"]}</b> автоматты тексерілетін тапсырма, <b>{st["python_examples"]}</b> тексерілген Python мысалы. Қалғаны - жоспар, ол бөлек белгіленген.</p>
      <p class="ac-cta"><a class="btn gold" href="course.html">AO17 CS курсы: 12 апта</a> <a class="btn secondary" href="#tracks">Бағыт таңдау</a> <a class="btn secondary" href="m01/l01.html">Бірінші сабақтан бастау</a> <a class="btn secondary" href="3d/index.html">3D зертхана</a> <a class="btn secondary" href="comics.html">Комикс: Нұрай, Мустафа және Бота</a> <a class="btn secondary" href="bota.html">Бота әлемі</a> <a class="btn secondary" href="oyu.html">Ою студиясы</a> <a class="btn secondary" href="xray.html">AO17 X-RAY</a> <a class="btn secondary" href="morph.html">AO17 MORPH</a> <a class="btn secondary" href="lab.html">Логика зертханасы</a> <a class="btn secondary" href="labs/index.html">CS зертханалары</a> <a class="btn secondary" href="ielts/index.html">IELTS</a> <a class="btn secondary" href="sat/index.html">Digital SAT</a> <a class="btn secondary" href="models.html">Интерактивті модельдер</a> <a class="btn secondary" href="study.html">Менің оқуым</a> <a class="btn secondary" href="map.html">Білім картасы</a></p>
      <p><a class="ac-film" href="../film/cs/">Фильм: «Даладан жұлдызға», 36 секунд</a></p>
    </header>
    <section class="ac-sec tl-sec" id="tracks"><h2>Бес бағыт, төрт саты</h2>
      <p class="ac-note">Баспалдақтың әр сызығы - бір модуль: тұтас сызық - дайын, үзік сызық - жоспарда. Бір модуль бірнеше бағытқа ортақ болуы мүмкін: мысалы, Python негіздері бәріне керек.</p>
      {tracks_hub()}</section>
    <section class="ac-sec"><h2>Бес деңгей</h2><ol class="ac-levels">{lv}</ol></section>
    <section class="ac-sec"><h2>Level I · Foundation: 12 модуль, 120 сабақ</h2>
      <p class="ac-note">Белгі: сілтемесі бар сабақ - толық дайын және тексерілген; сұр түстегісі - оқу мақсаты бекітілген жоспар.</p>
      {mod_list(C.MODULES)}</section>
    {f"""<section class="ac-sec" id="core"><h2>Level II · Computer Science Core: {len(C.CORE_MODULES)} модуль</h2>
      <p class="ac-note">AO17-нің өз авторлық модульдері: жасанды интеллект, машиналық оқыту, деректер қоры, операциялық жүйелер, желілер, веб және бағдарлама жобалау. Дайын: <b>{sum(st["modules"][M["id"]]["complete"] for M in C.CORE_MODULES)}</b> / {10 * len(C.CORE_MODULES)} сабақ.</p>
      {mod_list([m for m in C.ALL_MODULES if m[0] in C.CORE_IDS])}</section>""" if C.CORE_MODULES else ""}
    <section class="ac-sec" id="senior"><h2>Senior сатысы: 9 модуль, 90 сабақ</h2>
      <p class="ac-note">Бағыттардың ең жоғарғы сатысы: архитектура, таралған жүйелер, сенімділік, көшбасшылық, компиляторлар, қауіпсіздік, MLOps, сенімді AI және зерттеу. Дайын: <b>{st["senior_complete"]}</b> / {st["senior_planned"]} сабақ; әр сабақ Level I-дің сапа талаптарымен тексеріледі (дәлелдеу, орындалатын мысал, автоматты тапсырма).</p>
      {mod_list([m for m in C.ALL_MODULES if m[0].startswith("s")])}</section>
    <section class="ac-sec"><h2>Әр сабақтың құрылымы</h2><ol class="ac-struct">{"".join(f"<li><b>{k.upper()}</b> {E(t)}</li>" for k, t in SECTIONS)}</ol></section>
    <section class="ac-sec"><h2>Прогресс</h2><div data-ac-progress></div></section>
  </main>"""
    return "academy/index.html", page("academy/index.html", "CS Universe", "AO17 Computer Science Universe: қазақ тіліндегі бес деңгейлі информатика академиясы. Логика, дәлелдеу, алгоритмдер, Python, C.", body, intro="cs")


# ---------- Академия 2.0: бағыттар × сатылар (tools/academy/tracks.py) ----------
MOD_KIND = {"ao": "AO17 сабағы", "tr": "Аударма курс", "lab": "Интерактивті модель"}


def _exists(href):
    return bool(href) and (ROOT / href.split("#")[0]).exists()


def ladder_svg(t, big=False):
    """Бағыттың баспалдағы: 4 саты солдан оңға көтеріледі. Әр сатының табаны модульдерге бөлінген:
    тұтас сызық - дайын модуль, үзік сызық - жоспарда. Сурет мәтінді қайталайды (aria-hidden), мәтін бөлек бар."""
    W, H, sw = (640, 168, 6) if big else (240, 72, 4)
    step_w, rise = W / 4, (H - 16) / 4
    parts = []
    for i, (gk, _, _) in enumerate(TR.GRADES):
        mods = t["grades"][gk]["mods"]
        y = H - 8 - i * rise - rise / 2
        x0 = i * step_w
        if i:
            parts.append(f'<path class="tl-rise" d="M{x0:.1f} {y + rise:.1f}V{y:.1f}"/>')
        seg = (step_w - 6) / len(mods)
        for j, (_, href, _) in enumerate(mods):
            a, b = x0 + 3 + j * seg + sw / 2 + 1, x0 + 3 + (j + 1) * seg - sw / 2 - 1
            parts.append(f'<path class="tl-{"ok" if _exists(href) else "plan"}" d="M{a:.1f} {y:.1f}H{b:.1f}"/>')
    return (f'<svg class="tl-ladder{" tl-big" if big else ""}" viewBox="0 0 {W} {H}" aria-hidden="true" focusable="false">'
            f'<g fill="none" stroke="currentColor" stroke-width="{sw}" stroke-linecap="round">{"".join(parts)}</g></svg>')


def _grade_counts(t):
    return [(sum(_exists(h) for _, h, _ in t["grades"][gk]["mods"]), len(t["grades"][gk]["mods"])) for gk, _, _ in TR.GRADES]


def tracks_hub():
    st = TR.stats(_exists)
    rows = []
    for t in TR.TRACKS:
        r, n = st[t["id"]]
        gc = _grade_counts(t)
        lbl = ", ".join(f"{g[1]} {a}/{b}" for g, (a, b) in zip(TR.GRADES, gc))
        emb = EM.svg(t["glyph"]).replace('class="ac-emblem"', 'class="ac-emblem ac-emblem-s"')
        rows.append(f'<li class="tl-row" style="--th:{t["hue"]}"><a href="tracks/{t["id"]}.html">{emb}'
                    f'<span class="tl-name"><b>{E(t["title"])}</b><small>{E(t["lead"])}</small></span>'
                    f'<span class="tl-mini">{ladder_svg(t)}<small>{r} / {n} модуль дайын<span class="sr-only"> ({E(lbl)})</span></small></span></a></li>')
    return f'<ol class="tl-hub">{"".join(rows)}</ol>'


def track_html(t):
    rel = f"academy/tracks/{t['id']}.html"
    gc = _grade_counts(t)
    r, n = TR.stats(_exists)[t["id"]]
    steps = "".join(f'<li><a href="#g-{gk}"><b>{E(gn)}</b><span>{a} / {b} дайын</span></a></li>' for (gk, gn, _), (a, b) in zip(TR.GRADES, gc))
    secs = []
    for i, (gk, gn, gtag) in enumerate(TR.GRADES):
        g = t["grades"][gk]
        mods = "".join(
            (f'<li class="tl-ok"><a href="../../{E(h)}">{E(nm)}</a><span class="tl-kind">{MOD_KIND[k]}</span></li>' if _exists(h)
             else f'<li class="tl-plan"><span>{E(nm)}</span><span class="tl-kind">{MOD_KIND[k]}, жоспарда</span></li>')
            for nm, h, k in g["mods"])
        skills = "".join(f"<li>{E(x)}</li>" for x in g["skills"])
        secs.append(f"""    <section class="tl-grade" id="g-{gk}" aria-labelledby="h-{gk}">
      <header><p class="tl-step">{i + 1}-саты</p><h2 id="h-{gk}">{E(gn)}</h2><p class="tl-tag">{E(gtag)}</p><p class="tl-goal">{E(g["goal"])}</p></header>
      <div class="tl-body">
        <h3>Сатының соңында сіз</h3><ul class="tl-skills">{skills}</ul>
        <h3>Модульдер</h3><ol class="tl-mods">{mods}</ol>
        <p class="tl-proj"><b>Портфолио жобасы.</b> {E(g["project"])}</p>
      </div>
    </section>
""")
    others = "".join(f'<li style="--th:{o["hue"]}"><a href="{o["id"]}.html">{E(o["title"])}</a></li>' for o in TR.TRACKS if o["id"] != t["id"])
    body = f"""  <main class="content tl-page" id="main" style="--th:{t["hue"]}">
    <p class="ac-crumb"><a href="../index.html">CS Universe</a> / <a href="../index.html#tracks">Бағыттар</a> / {E(t["title"])}</p>
    <header class="tl-hero">
      {EM.svg(t["glyph"])}
      <div><h1>{E(t["title"])}</h1><p class="tl-lead">{E(t["lead"])}</p>
      <p class="tl-out"><b>Бағыттың соңында:</b> {E(t["outcome"])}</p></div>
    </header>
    <figure class="tl-fig">
      {ladder_svg(t, big=True)}
      <ol class="tl-steps">{steps}</ol>
      <figcaption>Әр сатының сызығы - оның модульдері: тұтас сызық - дайын, ашық модуль; үзік сызық - мазмұны жоспарда. Барлығы {r} / {n} модуль дайын.</figcaption>
    </figure>
{"".join(secs)}    <nav class="tl-others" aria-label="Басқа бағыттар"><h2>Басқа бағыттар</h2><ul>{others}</ul></nav>
  </main>"""
    return rel, page(rel, t["title"], f"AO17 Академия: {t['title']}, Негізден Senior деңгейіне дейінгі бағыт. {t['lead']}", body)


MODELS = [
    ("graph", {}, "Алгоритмдер · графтар", "Граф алгоритмдері", "BFS, DFS және Дейкстра бір графта. Әр кадр - бір амал: кезектен алу, көршіні тексеру, қашықтықты жаңарту. Қабырғалар мен салмақтарды өзгертіп, нәтиженің қалай өзгеретінін бақылаңыз.", "m09.l09, m09.l07"),
    ("pyx", {}, "Python · бағдарламалау", "Code X-Ray", "Сіз жазған Python коды браузерде нағыз орындалады; әр жолдан бұрынғы айнымалылар, шақыру тереңдігі және шығыс көрінеді. Рекурсия, циклдар, тізімдер - бәрі «ішінен».", "m06.l06, m06.l07, m07.l05, m09.l02"),
    ("cpu", {}, "Компьютер архитектурасы", "Оқу процессоры (Virtual Computer)", "4 регистр, 16 ұяшық жад, PC және 13 команда. Өз бағдарламаңызды жазып, циклдың машиналық деңгейде шартты өтуге айналатынын, 8 биттік асып кетуді көріңіз.", "m05.l03, m10.l01, m10.l04, m11.l01"),
    ("mem", {}, "C · жад", "Стек, үйме, көрсеткіш", "swap(&x, &y), malloc/free және ілулі көрсеткіш сценарийлері: жақтаулардың пайда болуы мен жоғалуы, үйме блогының өмірі.", "m11.l02, m11.l04, m11.l05, m11.l06"),
    ("func", {}, "Математика · функциялар", "Функция түрлендірулері", "y = a·f(b·x + c) + d: әр параметрдің графикке әсері. Параметрді ойнату арқылы бірқалыпты өзгертіп, «неге солға жылжиды?» сұрағына жауап табыңыз.", "m03.l06; математика курсы"),
    ("gd", {}, "Оңтайландыру · Machine Learning", "Градиенттік түсу", "x ← x − η·f′(x). Қадам ұзындығы мен бастапқы нүктенің жинақталуға, алшақтауға және жергілікті минимумға әсері.", "m12.l05; AI курсы"),
    ("sort", {}, "Алгоритмдер · сұрыптау", "Сұрыптау алгоритмдері", "Көпіршік, таңдау, кірістіру, біріктіру және жылдам сұрыптау бір тізімде: әр салыстыру мен жазу санағышымен.", "m09.l03, m09.l04, m09.l05"),
    ("bst", {}, "Деректер құрылымдары", "Екілік іздеу ағашы", "Кірістіру ретінің ағаш пішініне әсері және іздеудің тереңдікке тәуелділігі.", "m08; Level II"),
    ("heap", {}, "Деректер құрылымдары", "Үйме (heap)", "Басымдық кезегі массивте: sift-up және sift-down қадамдары.", "m09.l07 (Дейкстра кезегі); Level II"),
    ("hash", {}, "Деректер құрылымдары", "Хэш-кесте", "Хэш функциясының есебі, коллизиялар және жүктеменің іздеу уақытына әсері.", "m08.l03, m08.l04"),
    ("matrix", {}, "Математика · сызықтық алгебра", "Матрица - жазықтықтың түрлендіруі", "2×2 матрицаның бірлік шаршыны қалай өзгертетіні; анықтауыштың геометриялық мағынасы.", "математика курсы; Level II"),
    ("prob", {}, "Математика · ықтималдық", "Үлкен сандар заңы", "Тиын лақтырудың жиілігі p-ге қалай жақындайды және ауытқудың 1/√n заңы.", "математика курсы"),
    ("logic", {}, "Математика · логика · архитектура", "Логикалық схема", "Жартылай/толық қосқыш пен мультиплексор: сигналдың вентильдер арқылы өтуі және ақиқат кестесі.", "m01.l10, m05.l03"),
    ("dtree", {}, "AI · классификация", "Шешім ағашы", "Gini бойынша ашкөз бөлу, тереңдік және артық үйрену.", "AI курсы; Level III"),
    ("kmeans", {}, "AI · кластерлеу", "k-means", "Тағайындау мен жаңарту қадамдары, жинақталу және бастапқы нүктеге тәуелділік.", "AI курсы; Level III"),
    ("linreg", {}, "AI · регрессия", "Сызықтық регрессия", "MSE шығыны, градиенттер және оқу қадамының жинақталуға әсері.", "AI курсы; m12.l05"),
    ("sched", {}, "Жүйелік инженерия · ОЖ", "Процесстерді жоспарлау", "FCFS, SJF және Round Robin: Гант диаграммасы мен күту уақыты.", "Level IV (операциялық жүйелер)"),
    ("tcp", {}, "Жүйелік инженерия · желі", "TCP байланысы", "Үш қадамды қол алысу, сегменттер, ack нөмірлері және жоғалған сегментті қайта жіберу.", "Level IV (желілер)"),
    ("compiler", {}, "Жүйелік инженерия · компиляторлар", "Компилятор: лексер → парсер → есептеу", "Өрнек токендерге, сосын шунт алгоритмімен RPN-ге аударылып, стек машинасында есептеледі.", "m10.l01, m12.l01; Level IV"),
    ("nn", {}, "AI · нейрондық желілер", "Нейрондық желіні оқыту", "2 кіріс, жасырын қабат, 1 шығыс; тура өту, кросс-энтропия, backprop - бәрі нақты есептеледі. Жасырын нейрондар санын өзгертіп, XOR-ды неге сызықтық модель шеше алмайтынын көріңіз.", "AI курсы; Level II-III"),
]


def models_html():
    toc = "".join(f'<li><a href="#v-{t}">{E(h)}</a></li>' for t, _, _, h, _, _ in MODELS)
    secs = "".join(f'<section class="aov-sec" id="v-{t}"><p class="ac-kicker">{E(k)}</p><h2>{E(h)}</h2><p>{E(d)}</p><p class="ac-note">Қолданылатын сабақтар: {E(where)}</p>'
                   f'<div data-aov="{t}" data-aov-params="{E(json.dumps(p))}"></div></section>' for t, p, k, h, d, where in MODELS)
    body = f"""  <main class="content aov-gallery" id="main">
    <p class="ac-crumb"><a href="index.html">CS Universe</a> / Интерактивті модельдер</p>
    <h1>Интерактивті модельдер</h1>
    <p>Бұл беттегі әр модель - сурет не видео емес, нақты есептеу: алгоритм, формула, нейрондық желі, процессор не Python-ның өз орындалуы. Сіз оны іске қосып, тоқтатып, бір қадам алға-артқа жылжытып, жылдамдығын және кіріс деректерін өзгерте аласыз; әр қадамда не болғаны қазақша жазылады.</p>
    <p class="ac-note">Басқару: Бос орын - ойнату/тоқтату, ← → - қадам, R - басынан (модельге фокус қойып). Қозғалыс азайтылған режимде ойнату тек бір қадам жасайды.</p>
    <ul class="aov-toc">{toc}</ul>
{secs}
  </main>"""
    return "academy/models.html", page("academy/models.html", "Интерактивті модельдер", "AO17: граф алгоритмдері, Code X-Ray, оқу процессоры, C жады, функциялар, градиенттік түсу, нейрондық желі - оқушы басқаратын нақты модельдер.", body)


def lab_html():
    body = """  <main class="content ac-labpage" id="main">
    <p class="ac-crumb"><a href="index.html">CS Universe</a> / Логика зертханасы</p>
    <h1>CS Universe зертханасы</h1>
    <p>Формуланы енгізіңіз: кесте, ағаш, түрі, ДҚФ/КҚФ бірден шығады. Екі формуланы салыстыруға, аргументті тексеруге болады. Есептеу толық ақиқат кестесімен жүреді (ең көбі 12 айнымалы) - бұл нақты есептеу, болжам емес. «Қарсы мысал», «Индукция», «Рекуррент» қойындылары n айнымалысы бар өрнектерді дәл бөлшектермен есептейді: бұл сандық тексеріс, дәлелдеу емес.</p>
    <div class="ac-tabs" role="tablist"><button type="button" role="tab" data-tab="truthtable" aria-selected="true">Кесте</button><button type="button" role="tab" data-tab="equiv" aria-selected="false">Эквиваленттік</button><button type="button" role="tab" data-tab="argument" aria-selected="false">Аргумент</button><button type="button" role="tab" data-tab="normal" aria-selected="false">ДҚФ/КҚФ</button><button type="button" role="tab" data-tab="tree" aria-selected="false">Ағаш</button><button type="button" role="tab" data-tab="quant" aria-selected="false">Кванторлар</button><button type="button" role="tab" data-tab="search" aria-selected="false">Қарсы мысал</button><button type="button" role="tab" data-tab="induction" aria-selected="false">Индукция</button><button type="button" role="tab" data-tab="recur" aria-selected="false">Рекуррент</button><button type="button" role="tab" data-tab="venn" aria-selected="false">Венн</button><button type="button" role="tab" data-tab="relation" aria-selected="false">Қатынас</button><button type="button" role="tab" data-tab="func" aria-selected="false">Функция</button><button type="button" role="tab" data-tab="graph" aria-selected="false">Граф</button><button type="button" role="tab" data-tab="trace" aria-selected="false">Трасса</button><button type="button" role="tab" data-tab="growth" aria-selected="false">Өсу жылдамдығы</button><button type="button" role="tab" data-tab="base" aria-selected="false">Санау жүйесі</button><button type="button" role="tab" data-tab="bitpanel" aria-selected="false">Бит панелі</button><button type="button" role="tab" data-tab="utf8" aria-selected="false">UTF-8</button><button type="button" role="tab" data-tab="float" aria-selected="false">IEEE 754</button></div>
    <div class="ac-lab ac-lab-big" data-lab="page"></div>
    <section class="ac-sec"><h2>Синтаксис</h2><p>Арифметика: сандар, n, + − * / % ^ және жақша; 2n және n(n+1) жасырын көбейту ретінде оқылады. Логика: ¬ (not, !, ~), ∧ (and, &amp;), ∨ (or, |), → (->), ↔ (&lt;->), ⊕ (xor, ^), тұрақтылар 0 және 1. Басымдық: ¬ &gt; ∧ &gt; ⊕ &gt; ∨ &gt; → &gt; ↔; → оңнан топтасады.</p></section>
  </main>"""
    return "academy/lab.html", page("academy/lab.html", "Логика зертханасы", "AO17 логика зертханасы: ақиқат кестесі, эквиваленттік, аргумент, ДҚФ/КҚФ, кванторлар.", body)


def map_html(lessons):
    nodes = [{"id": mid, "kk": kk, "en": en, "pre": C.MODULE_PREREQ.get(mid, []),
              "lessons": [{"id": C.lesson_id(mid, s), "t": t, "done": C.lesson_id(mid, s) in DONE, "href": f"{mid}/{s}.html"} for s, t, _ in ls]}
             for mid, en, kk, ls in C.MODULES]
    body = f"""  <main class="content ac-mappage" id="main">
    <p class="ac-crumb"><a href="index.html">CS Universe</a> / Білім картасы</p>
    <h1>Білім картасы · Level I</h1>
    <p>Модульдер алғышарттарымен байланысқан. Түс сіздің прогресіңізді көрсетеді (осы құрылғыда сақталған). Модульді басыңыз - оның сабақтары ашылады.</p>
    <p class="ac-legend"><span class="lg mastered">меңгерілді</span> <span class="lg started">басталды</span> <span class="lg ready">алғышарты дайын</span> <span class="lg plan">жоспарда</span></p>
    <div class="ac-map" data-ac-map></div>
    <div class="ac-map-detail" data-ac-map-detail></div>
  </main>
  <script type="application/json" id="ac-map-data">{json.dumps(nodes, ensure_ascii=False)}</script>"""
    return "academy/map.html", page("academy/map.html", "Білім картасы", "AO17 CS Universe: Level I модульдерінің алғышарттар картасы және жеке прогресс.", body)


def build(write=True):
    lessons = load_lessons()
    titles = {m[0]: m[2] for m in C.ALL_MODULES}   # оқу кестесі: аптаның толық атауы
    errs = validate(lessons) + validate_comics(lessons) + L3.validate() + AX.validate(lessons) + AP.validate(lessons, titles) + AM.validate(lessons) + OY.validate() + BT.validate() + XR.validate() + MO.validate() + IP.validate()
    if errs:
        print("academy: ТЕКСЕРУДЕН ӨТПЕДІ:", *errs, sep="\n  ")
        sys.exit(1)
    # Мазмұн фабрикасы: Draft (reviewStatus «draft») тексеріледі, бірақ жарияланбайды; Reviewed (author-checked, peer-reviewed) - жарияланады
    drafts = [L["id"] for L in lessons if L["reviewStatus"] == "draft"]
    if drafts:
        print(f"academy: {len(drafts)} draft сабақ жарияланбайды: {', '.join(drafts[:5])}{' ...' if len(drafts) > 5 else ''}")
        lessons = [L for L in lessons if L["reviewStatus"] != "draft"]
    DONE.clear()
    DONE.update(L["id"] for L in lessons)
    st = stats(lessons)
    if not write:
        print(f"academy check: OK ({st['complete_lessons']} сабақ, {st['auto_checked_tasks']} тапсырма, {st['python_examples']} мысал)")
        return
    plan_by_id = {p["id"]: p for p in C.plan()}
    pages = [index_html(lessons, st), lab_html(), map_html(lessons), models_html(), study_html(lessons), comics_html(lessons), course_html(lessons, st),
             AX.exam_html(lessons, page), AX.cert_html(lessons, page), AP.plan_html(lessons, titles, page), AM.methods_html(lessons, page), OY.oyu_html(page), BT.bota_html(page), XR.xray_html(page), MO.morph_html(page), L3.IX.learn_html(page)] + IP.pages(page) + L3.pages(page) + [track_html(t) for t in TR.TRACKS]
    by_mod = {}
    for L in lessons:
        by_mod.setdefault(L["moduleId"], []).append(L)
    for mid, ls in by_mod.items():
        ls.sort(key=lambda x: x["slug"])
        for i, L in enumerate(ls):
            pages.append(lesson_html(L, plan_by_id, ls[i - 1] if i else None, ls[i + 1] if i + 1 < len(ls) else None))
    for rel, text in pages:
        fp = ROOT / rel
        fp.parent.mkdir(parents=True, exist_ok=True)
        old = fp.read_text(encoding="utf-8") if fp.exists() else None
        # build.py басты (head/nav/footer) бөлікті өңдеп қойған болса, мазмұн өзгермесе файлды қозғамаймыз
        if old is None or _core(old) != _core(text):
            fp.write_text(text, encoding="utf-8")
    (ROOT / "docs" / "academy").mkdir(parents=True, exist_ok=True)
    (ROOT / "docs" / "academy" / "status.json").write_text(json.dumps(st, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    (ROOT / "docs" / "academy" / "curriculum.md").write_text(curriculum_md(st), encoding="utf-8")
    return [rel for rel, _ in pages]


def curriculum_md(st):
    """docs/academy/curriculum.md - оқу картасынан автоматты (қолмен өңдемеңіз)."""
    out = ["# AO17 CS Universe: оқу картасы", "", "_Бұл файлды `tools/academy_build.py` жасайды: қолмен өңдемеңіз, `tools/academy/curriculum.py`-ны өзгертіңіз._", "",
           f"Нақты күй: **{st['complete_lessons']}** толық сабақ дайын, Foundation жоспары {st['foundation_planned']} сабақ. "
           f"Автоматты тексерілетін тапсырма: {st['auto_checked_tasks']}, тексерілген Python мысалы: {st['python_examples']}.", "", "## Бес деңгей", ""]
    for i, lv in enumerate(C.LEVELS):
        out.append(f"- **{lv['id']}. {lv['title']}** ({lv['kk']}): жоспар {lv['target']} сабақ, дайын {st['levels'][i]['complete']}. {lv['goal']}")
        if lv.get("subjects"):
            out.append(f"  - Пәндер: {', '.join(lv['subjects'])}")
    out += ["", "## Level I · Foundation: 12 модуль × 10 сабақ", "", "Белгі: ✅ - толық дайын және тексерілген, ▫️ - жоспар (оқу мақсаты бекітілген).", ""]
    for mid, en, kk, ls in C.MODULES:
        pre = ", ".join(C.MODULE_PREREQ.get(mid, [])) or "-"
        out += [f"### {mid} · {en} - {kk}", "", f"Алғышарт модульдер: {pre}. Дайын: {st['modules'][mid]['complete']}/{st['modules'][mid]['planned']}.", ""]
        for slug, title, goal in ls:
            lid = C.lesson_id(mid, slug)
            out.append(f"- {'✅' if lid in DONE else '▫️'} `{lid}` **{title}** - {goal}")
        out.append("")
    out += ["## Foundation жобалары (Project Foundry)", ""] + [f"- `{pid}` {t} (модуль {m})" for pid, t, m in C.PROJECTS] + [""]
    return "\n".join(out)


def _core(s):
    """Генератор жауап беретін бөлік: head/nav/footer/body атрибуттарын (build.py толтырады) есепке алмай салыстыру."""
    s = re.sub(r"<!-- build:head -->.*?<!-- /build:head -->", "", s, flags=re.S)
    s = re.sub(r'<nav class="nav">.*?</nav>', "", s, count=1, flags=re.S)
    s = re.sub(r'<footer class="footer">.*?</footer>', "", s, count=1, flags=re.S)
    s = re.sub(r"<body[^>]*>", "<body>", s, count=1)
    s = re.sub(r'<a class="skip-link"[^>]*>.*?</a>', "", s, count=1)
    return s


def dump_keys():
    """Python (plogic) есептеген кілттер: tests/academy/keys.test.js оларды JS қозғалтқышымен салыстырады."""
    out = []
    for L in load_lessons():
        for set_ in ("exercises", "assessment"):
            for i, ex in enumerate(L[set_]):
                t, k = ex["type"], None
                if t == "value":
                    k = P.ev(P.parse(ex["formula"]), ex["env"])
                elif t == "truthtable":
                    k = P.table(ex["formula"])
                elif t == "classify":
                    k = P.classify(ex["formula"])
                elif t == "argument":
                    k = P.valid(ex["premises"], ex["conclusion"])
                elif t == "formula":
                    k = ex["solution"]
                elif t == "counterexample":
                    k = AR.counterexamples(ex)
                elif t in ("closedform", "recurrence"):
                    k = ex["solution"]
                elif t == "trace":
                    k = trace_key(ex)
                elif t in ("convert", "encode", "bitop"):
                    k = bits_key(ex)
                elif t in ("pycode", "pytests"):
                    k = ex["solution"]
                elif t == "coutput":
                    k = ex["answer"]
                elif t == "count":
                    k = PS.run(ex["code"], ex.get("inputs", {}))["counts"].get(ex["line"], 0)
                elif t == "setexpr":
                    k = sorted(DS.evaluate(ex["expr"], ex["sets"], ex["U"]), key=str)
                elif t == "setid":
                    k = ex["solution"]
                elif t == "props":
                    k = DS.rel_props(ex["S"], pairs(ex["R"]))
                elif t == "func":
                    k = DS.func_kind(ex["X"], ex["Y"], pairs(ex["pairs"]))
                out.append({"lesson": L["id"], "set": set_, "i": i, "ex": ex, "key": k})
    print(json.dumps(out, ensure_ascii=False))


if __name__ == "__main__":
    if "--dump-keys" in sys.argv:
        dump_keys()
    elif "--stats" in sys.argv:
        print(json.dumps(stats(load_lessons()), ensure_ascii=False, indent=1))
    elif "--check" in sys.argv:
        build(write=False)
    else:
        print("academy:", len(build()), "бет")
