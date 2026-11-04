# © 2026 Sagid Mustafa. All Rights Reserved.
"""AO17 CS Universe: сабақ деректерін тексеру және беттерді жасау.

    python3 tools/academy_build.py            # тексеру + academy/ беттерін жасау (build.py өзі шақырады)
    python3 tools/academy_build.py --check    # тек тексеру (схема, кілттер, код мысалдары, бірегейлік)
    python3 tools/academy_build.py --stats    # НАҚТЫ дайын сабақ/тапсырма саны (жоспармен бірге)

Сабақ «дайын» деп тек барлық тексеруден өтсе саналады. Жоспар (curriculum.py) дайын сан ретінде көрсетілмейді.
"""
import html
import json
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
import ppseudo as PS  # noqa: E402
import math  # noqa: E402,F401  (number.check өрнектері үшін)

OUT = ROOT / "academy"
CONTENT_MODULES = ["m01_a", "m01_b", "m02_a", "m02_b", "m03_a", "m03_b", "m04_a", "m04_b"]

REQUIRED = {  # өріс -> (тип, ең аз ұзындық)
    "id": (str, 1), "courseId": (str, 1), "moduleId": (str, 1), "slug": (str, 1), "title": (str, 3), "language": (str, 2),
    "academicLevel": (str, 1), "difficulty": (int, None), "minutes": (int, None), "objectives": (list, 2), "prerequisites": (list, 0),
    "concept": (str, 200), "theory": (list, 3), "visual": (dict, None), "derivation": (list, 3), "examples": (list, 1),
    "experiment": (dict, None), "exercises": (list, 3), "reasoning": (str, 100), "mistakes": (list, 2), "assessment": (list, 2),
    "reflection": (list, 1), "further": (dict, None), "references": (list, 1), "license": (str, 2), "authorship": (str, 2),
    "reviewStatus": (str, 2), "version": (str, 5),
}
EX_TYPES = {"mc", "value", "truthtable", "classify", "formula", "argument", "number", "order", "counterexample", "closedform", "recurrence", "setexpr", "setid", "props", "func", "trace", "count"}
LABS = {"truthtable", "equiv", "argument", "tree", "normal", "quant", "search", "induction", "recur", "venn", "relation", "graph", "func", "trace", "growth"}
GROWTH = {"1", "log2(n)", "sqrt(n)", "n", "n*log2(n)", "n^2", "n^3", "2^n", "100*n", "n!"}
ARITH_PROPS = set(AR.PROPS)
QUANT_PREDS = {"even", "odd", "prime", "positive", "gt3", "square"}
REVIEW = {"draft", "author-checked", "peer-reviewed"}


def load_lessons():
    out = []
    for name in CONTENT_MODULES:
        out += __import__(name).LESSONS
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
            elif "check" in ex and eval(ex["check"], {"math": math, "__builtins__": {"range": range, "sum": sum, "next": next, "len": len, "min": min, "max": max, "all": all, "any": any, "abs": abs}}) != ex["answer"]:
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


def fmt_val(v):
    if v is True or v is False:
        return "true" if v else "false"
    if isinstance(v, list):
        return "[" + ", ".join(fmt_val(x) for x in v) + "]"
    return str(v)


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
    r = subprocess.run([sys.executable, "-I", "-c", code], capture_output=True, text=True, timeout=timeout)
    return r.returncode, r.stdout.rstrip("\n"), r.stderr


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
        for i, ex in enumerate(L.get("exercises", []) + L.get("assessment", [])):
            check_exercise(ex, f"{lid} тапсырма {i + 1}", errs)
            key = re.sub(r"\s+", " ", ex.get("q", "") + "|" + ex.get("code", "") + "|" + json.dumps(ex.get("inputs", {}))).strip()
            if key in seen_q:
                errs.append(f"{lid}: сұрақ қайталанады ({seen_q[key]}): {key[:50]}")
            seen_q[key] = lid
        for m in L.get("mistakes", []):
            if not all(m.get(k) for k in ("mistake", "why", "fix")):
                errs.append(f"{lid}: mistakes элементі толық емес")
        if run_code:
            for j, exm in enumerate(L.get("examples", [])):
                if exm.get("lang") != "python":
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


def stats(lessons, errs_by_lesson=None):
    plan = C.plan()
    done = {L["id"] for L in lessons}
    by_mod = {}
    for p in plan:
        m = by_mod.setdefault(p["module"], {"title": p["moduleTitle"], "planned": 0, "complete": 0})
        m["planned"] += 1
        m["complete"] += p["id"] in done
    ex = sum(len(L["exercises"]) + len(L["assessment"]) for L in lessons)
    return {"levels": [{"id": lv["id"], "target": lv["target"], "complete": len(done) if lv["id"] == "I" else 0} for lv in C.LEVELS],
            "foundation_planned": len(plan), "complete_lessons": len(done), "auto_checked_tasks": ex,
            "python_examples": sum(len(L["examples"]) for L in lessons), "modules": by_mod}


# ---------------------------------------------------------------- HTML
E = html.escape
DIFF = {1: "бастапқы", 2: "негізгі", 3: "орта", 4: "күрделі", 5: "зерттеу"}
KIND = {"definition": "Анықтама", "theorem": "Теорема", "proof": "Дәлелдеу", "note": "Ескерту"}
SECTIONS = [("a", "Оқу мақсаттары"), ("b", "Алғышарттар"), ("c", "Ұғымға кіріспе"), ("d", "Академиялық теория"),
            ("e", "Көрнекі түсіндірме"), ("f", "Қадамдап қорыту"), ("g", "Жұмыс мысалдары"), ("h", "Интерактивті эксперимент"),
            ("i", "Жаттығулар"), ("j", "Математикалық пайымдау"), ("k", "Жиі қателер"), ("l", "Меңгеруді бағалау"),
            ("m", "Рефлексия"), ("n", "Тереңірек")]


def page(rel, title, desc, body, scripts=(), body_cls="ao-acad"):
    pre = "../" * rel.count("/")
    sc = "".join(f'\n  <script src="{pre}{s}" defer></script>' for s in scripts)
    return f"""<!DOCTYPE html>
<html lang="kk">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{E(title)} - AO17</title>
  <!-- build:head -->
  <!-- /build:head -->
  <meta name="description" content="{E(desc)}">
  <meta name="author" content="Sagid Mustafa">
  <link rel="stylesheet" href="{pre}assets/fonts/fonts.css">
  <link rel="stylesheet" href="{pre}assets/css/style.css">
  <link rel="stylesheet" href="{pre}assets/css/academy.css">
  <script src="{pre}assets/js/main.js"></script>
  <script src="{pre}assets/js/academy-logic.js" defer></script>
  <script src="{pre}assets/js/academy-arith.js" defer></script>
  <script src="{pre}assets/js/academy-disc.js" defer></script>
  <script src="{pre}assets/js/academy-pseudo.js" defer></script>
  <script src="{pre}assets/js/academy.js" defer></script>{sc}
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
    mod = next(m for m in C.MODULES if m[0] == L["moduleId"])
    n = int(L["slug"][1:])
    pre_links = "".join(
        f'<li><a href="../{plan_by_id[p]["module"]}/{plan_by_id[p]["slug"]}.html">{E(plan_by_id[p]["title"])}</a></li>' if p in DONE
        else f'<li>{E(plan_by_id[p]["title"])} <small>(жоспарда)</small></li>' for p in L["prerequisites"]) or "<li>Алғышарт жоқ: бұл - бастапқы сабақ.</li>"
    theory = "".join(f'<div class="ac-th ac-{t["kind"]}"><div class="ac-th-k">{KIND[t["kind"]]}</div><h4>{E(t["title"])}</h4>{t["body"]}</div>' for t in L["theory"])
    examples = "".join(
        f'<figure class="ac-ex"><figcaption>{E(x["title"])}</figcaption><pre data-lang="python"><code class="language-python">{E(x["code"])}</code></pre>'
        f'<div class="ac-out"><span>Шығыс (тексерілген)</span><pre>{E(x["output"])}</pre></div><p>{E(x["explain"])}</p></figure>' for x in L["examples"])
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
            "reflection": L["reflection"], "objectives": len(L["objectives"])}
    toc = "".join(f'<li><a href="#s-{k}">{E(t)}</a></li>' for k, t in SECTIONS)
    nav = (f'<nav class="ac-pager">' + (f'<a href="{prev_l["slug"]}.html">← {E(prev_l["title"])}</a>' if prev_l else '<span></span>')
           + f'<a href="../index.html#{L["moduleId"]}">Модуль картасы</a>' + (f'<a href="{next_l["slug"]}.html">{E(next_l["title"])} →</a>' if next_l else '<span></span>') + "</nav>")
    sec = lambda k, inner: f'<section class="ac-sec" id="s-{k}"><h2><span class="ac-n">{k.upper()}</span>{dict(SECTIONS)[k]}</h2>{inner}</section>'  # noqa: E731
    body = f"""  <div class="ac-layout">
    <aside class="ac-toc" aria-label="Сабақ бөлімдері"><p class="ac-toc-h">Бөлімдер</p><ol>{toc}</ol>
      <div class="ac-mastery" data-ac-mastery><span>Меңгеру</span><b>-</b></div></aside>
    <article class="content ac-lesson" id="main" data-lesson="{E(L['id'])}">
      <header class="ac-head">
        <p class="ac-crumb"><a href="../index.html">CS Universe</a> / <a href="../index.html#{L['moduleId']}">Level I · {E(mod[2])}</a> / {n}-сабақ</p>
        <h1>{E(L['title'])}</h1>
        <p class="ac-meta">Деңгей: {DIFF[L['difficulty']]} · шамамен {L['minutes']} мин · нұсқа {E(L['version'])} · тексеру: {E(L['reviewStatus'])}</p>
      </header>
      {sec('a', '<ul class="ac-obj">' + ''.join(f'<li>{E(o)}</li>' for o in L['objectives']) + '</ul>')}
      {sec('b', f'<ul>{pre_links}</ul>')}
      {sec('c', L['concept'])}
      {sec('d', theory)}
      {sec('e', f'<div class="ac-lab" data-lab="visual"></div><p class="ac-cap">{E(L["visual"].get("caption", ""))}</p>')}
      {sec('f', '<ol class="ac-steps">' + ''.join(f'<li>{E(s)}</li>' for s in L['derivation']) + '</ol>')}
      {sec('g', examples)}
      {sec('h', f'<p class="ac-task">{E(L["experiment"]["task"])}</p><div class="ac-lab" data-lab="experiment"></div>')}
      {sec('i', '<div class="ac-exs" data-set="exercises"></div>')}
      {sec('j', L['reasoning'])}
      {sec('k', f'<ul class="ac-mist">{mistakes}</ul>')}
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
    return rel, page(rel, L["title"], f"AO17 CS Universe, Level I: {L['title']}. {L['objectives'][0]}", body)


DONE = set()


def index_html(lessons, st):
    by_id = {L["id"]: L for L in lessons}
    lv = "".join(
        f'<li class="ac-level{" on" if x["id"] == "I" else ""}"><span class="ac-lv">{x["id"]}</span><div><h3>{E(x["kk"])} <small>{E(x["title"])}</small></h3>'
        f'<p>{E(x["goal"])}</p><p class="ac-count">Жоспар: {x["target"]} сабақ · дайын: <b>{st["levels"][i]["complete"]}</b></p>'
        + (f'<p class="ac-subj">{E(", ".join(x["subjects"]))}</p>' if x.get("subjects") else "") + "</div></li>"
        for i, x in enumerate(C.LEVELS))
    mods = []
    for mid, en, kk, ls in C.MODULES:
        m = st["modules"][mid]
        items = []
        for slug, title, goal in ls:
            lid = C.lesson_id(mid, slug)
            if lid in by_id:
                items.append(f'<li class="done" data-lid="{lid}"><a href="{mid}/{slug}.html">{E(title)}</a><small>{E(goal)}</small></li>')
            else:
                items.append(f'<li class="plan"><span>{E(title)}</span><small>{E(goal)}</small></li>')
        pre = ", ".join(next(x[2] for x in C.MODULES if x[0] == p) for p in C.MODULE_PREREQ.get(mid, [])) or "жоқ"
        mods.append(f'<details class="ac-mod" id="{mid}"{" open" if m["complete"] else ""}><summary><span class="ac-mn">{mid[1:]}</span><b>{E(kk)}</b> <i>{E(en)}</i>'
                    f'<span class="ac-mc">{m["complete"]}/{m["planned"]} дайын</span></summary><p class="ac-pre">Алғышарт модульдер: {E(pre)}</p><ol>{"".join(items)}</ol></details>')
    body = f"""  <main class="content ac-home" id="main">
    <header class="ac-hero">
      <p class="ac-kicker">AO17 Computer Science Universe</p>
      <h1>Алаш бастаған білім жолы бүгінгі технологиямен жалғасады</h1>
      <p>Логика мен дәлелдеуден бастап, алгоритмдер, жүйелер және зерттеуге дейінгі бес деңгейлі қазақша академиялық бағдарлама. Мазмұн AO17 үшін жаңадан жазылады; ақылы сервис пен AI API қажет емес.</p>
      <p class="ac-honest">Қазір дайын: <b>{st["complete_lessons"]}</b> толық сабақ, <b>{st["auto_checked_tasks"]}</b> автоматты тексерілетін тапсырма, <b>{st["python_examples"]}</b> тексерілген Python мысалы. Қалғаны - жоспар, ол бөлек белгіленген.</p>
      <p class="ac-cta"><a class="btn gold" href="m01/l01.html">Бірінші сабақтан бастау</a> <a class="btn secondary" href="lab.html">Логика зертханасы</a> <a class="btn secondary" href="map.html">Білім картасы</a></p>
    </header>
    <section class="ac-sec"><h2>Бес деңгей</h2><ol class="ac-levels">{lv}</ol></section>
    <section class="ac-sec"><h2>Level I · Foundation: 12 модуль, 120 сабақ</h2>
      <p class="ac-note">Белгі: сілтемесі бар сабақ - толық дайын және тексерілген; сұр түстегісі - оқу мақсаты бекітілген жоспар.</p>
      {"".join(mods)}</section>
    <section class="ac-sec"><h2>Әр сабақтың құрылымы</h2><ol class="ac-struct">{"".join(f"<li><b>{k.upper()}</b> {E(t)}</li>" for k, t in SECTIONS)}</ol></section>
    <section class="ac-sec"><h2>Прогресс</h2><div data-ac-progress></div></section>
  </main>"""
    return "academy/index.html", page("academy/index.html", "CS Universe", "AO17 Computer Science Universe: қазақ тіліндегі бес деңгейлі информатика академиясы. Логика, дәлелдеу, алгоритмдер, Python, C.", body)


def lab_html():
    body = """  <main class="content ac-labpage" id="main">
    <p class="ac-crumb"><a href="index.html">CS Universe</a> / Логика зертханасы</p>
    <h1>CS Universe зертханасы</h1>
    <p>Формуланы енгізіңіз: кесте, ағаш, түрі, ДҚФ/КҚФ бірден шығады. Екі формуланы салыстыруға, аргументті тексеруге болады. Есептеу толық ақиқат кестесімен жүреді (ең көбі 12 айнымалы) - бұл нақты есептеу, болжам емес. «Қарсы мысал», «Индукция», «Рекуррент» қойындылары n айнымалысы бар өрнектерді дәл бөлшектермен есептейді: бұл сандық тексеріс, дәлелдеу емес.</p>
    <div class="ac-tabs" role="tablist"><button type="button" role="tab" data-tab="truthtable" aria-selected="true">Кесте</button><button type="button" role="tab" data-tab="equiv" aria-selected="false">Эквиваленттік</button><button type="button" role="tab" data-tab="argument" aria-selected="false">Аргумент</button><button type="button" role="tab" data-tab="normal" aria-selected="false">ДҚФ/КҚФ</button><button type="button" role="tab" data-tab="tree" aria-selected="false">Ағаш</button><button type="button" role="tab" data-tab="quant" aria-selected="false">Кванторлар</button><button type="button" role="tab" data-tab="search" aria-selected="false">Қарсы мысал</button><button type="button" role="tab" data-tab="induction" aria-selected="false">Индукция</button><button type="button" role="tab" data-tab="recur" aria-selected="false">Рекуррент</button><button type="button" role="tab" data-tab="venn" aria-selected="false">Венн</button><button type="button" role="tab" data-tab="relation" aria-selected="false">Қатынас</button><button type="button" role="tab" data-tab="func" aria-selected="false">Функция</button><button type="button" role="tab" data-tab="graph" aria-selected="false">Граф</button><button type="button" role="tab" data-tab="trace" aria-selected="false">Трасса</button><button type="button" role="tab" data-tab="growth" aria-selected="false">Өсу жылдамдығы</button></div>
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
    errs = validate(lessons)
    if errs:
        print("academy: ТЕКСЕРУДЕН ӨТПЕДІ:", *errs, sep="\n  ")
        sys.exit(1)
    DONE.clear()
    DONE.update(L["id"] for L in lessons)
    st = stats(lessons)
    if not write:
        print(f"academy check: OK ({st['complete_lessons']} сабақ, {st['auto_checked_tasks']} тапсырма, {st['python_examples']} мысал)")
        return
    plan_by_id = {p["id"]: p for p in C.plan()}
    pages = [index_html(lessons, st), lab_html(), map_html(lessons)]
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
