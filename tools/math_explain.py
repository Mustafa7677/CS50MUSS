#!/usr/bin/env python3
# © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама (LICENSE-PROPRIETARY.md, COPYRIGHT.md).
"""Математика: «Сызбамен түсіндіру» - әр сабақтың әдістемелік түсіндірмесі (docs/MATH-COURSE-GUIDE.md §4.4).

Тақырып университеттегідей кезең-кезеңімен ашылады. Әр қадам:
  сұрақ (неге керек) → теория (қарапайымнан күрделіге) → сызба (дәл график не диаграмма) → формула → қысқа мысал.
Сызбалар tools/math_fig.py арқылы SVG болып салынады: түсі сайттың тақырыбына (жарық/қараңғы) бейімделеді.

Дерек: tools/math_explain/<slug>/x<k>.py
  from math_explain import S
  from math_fig import *
  EXPLAIN = dict(intro="...", steps=[S(...), ...], outro="...")
  S(title, why, theory, fig=None, alt="", caption="", formula=None, q="", sol=(), a="", v=())
    theory  - абзацтар тізімі (TeX $...$, **қалың**)
    fig     - Plot(...) не Diagram(...); alt - сызбаның мәтіндік сипаттамасы (экран оқитын құрал үшін)
    formula - қорапқа алынатын негізгі формула (TeX)
    q, sol, a - мысал: шарты, қадамдары, жауабы
    v       - sympy тексерістері [("өрнек", "мәні"), ...]

  python3 tools/math_explain.py            # барлық x<k>.py файлдарын беттерге енгізу (тексерістермен)
  python3 tools/math_explain.py diffcalc   # бір пән
  python3 tools/math_explain.py --check    # беттер сәйкес пе және v-тексерістер дұрыс па (өзгертпейді)

Блок <!--explain-->…<!--/explain--> «Анықтамалар мен теоремалар» (<h2 id="theory">) алдында; жеңіл қабат одан бұрын тұрады.
math_lesson_gen.py бетті қайта жазса, осы скриптті қайта іске қосыңыз.
"""
import html
import importlib.util
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
import math_fig  # noqa: E402
import math_plan as P  # noqa: E402

SRC = ROOT / "tools" / "math_explain"
LECT = ROOT / "math" / "lectures"
OPEN, CLOSE = "<!--explain-->", "<!--/explain-->"
STRIP = re.compile(re.escape(OPEN) + r".*?" + re.escape(CLOSE) + r"\n?\s*", re.S)
MARK = '<h2 id="theory"'


def S(title, why, theory, fig=None, alt="", caption="", formula=None, q="", sol=(), a="", v=()):
    return dict(title=title, why=why, theory=list(theory), fig=fig, alt=alt, caption=caption, formula=formula, q=q, sol=list(sol), a=a, v=list(v))


def _load(path):
    spec = importlib.util.spec_from_file_location(f"math_explain_{path.parent.name}_{path.stem}", path)
    mod = importlib.util.module_from_spec(spec)
    sys.modules.setdefault("math_explain", sys.modules[__name__])
    spec.loader.exec_module(mod)
    return mod.EXPLAIN


def check(ex, name):
    errs = []
    st = ex.get("steps") or []
    if not ex.get("intro"):
        errs.append("intro жоқ")
    if len(st) < 3:
        errs.append(f"қадам саны {len(st)} < 3")
    if sum(1 for s in st if s["fig"]) < 2:
        errs.append("кемінде 2 сызба керек")
    for i, s in enumerate(st, 1):
        if not (s["title"] and s["why"] and s["theory"] and s["q"] and s["sol"] and s["a"]):
            errs.append(f"{i}-қадам: title, why, theory және мысал (q, sol, a) міндетті")
        if s["fig"] and not (s["alt"] and s["caption"]):
            errs.append(f"{i}-қадам: сызбаға alt пен caption керек")
        for t in s["theory"] + s["sol"] + [s["why"], s["q"], s["a"], s["caption"], s["formula"] or ""]:
            if t.replace(r"\$", "").count("$") % 2:
                errs.append(f"{i}-қадам: жұп емес $: {t[:60]}")
    if errs:
        raise SystemExit(f"{name}: " + "; ".join(errs))
    return ex


def verify(ex, name):
    try:
        import sympy as sp
    except ImportError:
        raise SystemExit("math_explain: sympy орнатылмаған (pip install sympy)")
    ns = {k: getattr(sp, k) for k in dir(sp) if not k.startswith("_")}
    for s in "x y z t n k a b c u v r s w h m p q".split():
        ns[s] = sp.Symbol(s, real=True)
    bad = []
    for i, s in enumerate(ex["steps"], 1):
        for lhs, rhs in s["v"]:
            try:
                L, R = eval(lhs, {"__builtins__": {}}, ns), eval(rhs, {"__builtins__": {}}, ns)
                d = 0 if L == R else sp.simplify(L - R)  # L == R: шексіздіктер де (oo - oo = nan болмасын)
                ok = d == 0 or (getattr(d, "is_number", False) and d.is_finite and abs(complex(sp.N(d))) < 1e-9)
            except Exception as e:  # noqa: BLE001
                ok, d = False, f"қате: {e}"
            if not ok:
                bad.append(f"{name} {i}-қадам: {lhs} ≠ {rhs} (айырма: {d})")
    return bad


def md(t):
    return re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", html.escape(t, quote=False))


def render(ex, uni, k, uid):
    o = [f'{OPEN}<section class="mx-explain" aria-labelledby="explain">',
         '        <h2 id="explain">Сызбамен түсіндіру</h2>',
         f'        <p class="mx-xuni"><span>Университетте</span> {md(uni[0])}, {md(uni[1])}, {k}-дәріс</p>',
         f'        <p class="mx-xintro">{md(ex["intro"])}</p>',
         '        <ol class="mx-xsteps">']
    for i, s in enumerate(ex["steps"], 1):
        text = "".join(f"<p>{md(t)}</p>" for t in s["theory"])
        fig = ""
        if s["fig"]:
            fig = f'<figure class="mx-fig">{math_fig.render(s["fig"], f"{uid}-{i}", s["alt"])}<figcaption>{md(s["caption"])}</figcaption></figure>'
        sol = "".join(f"<li>{md(t)}</li>" for t in s["sol"])
        o.append(f'''          <li class="mx-xstep" id="xs-{i}">
            <h3>{md(s["title"])}</h3>
            <p class="mx-xwhy"><b>Сұрақ.</b> {md(s["why"])}</p>
            <div class="mx-xbody{" has-fig" if fig else ""}"><div class="mx-xtext">{text}</div>{fig}</div>{f'<div class="mx-xformula">{md(s["formula"])}</div>' if s["formula"] else ""}
            <div class="mx-xtry"><p class="mx-xq"><b>Мысал.</b> {md(s["q"])}</p><ol class="math-steps">{sol}</ol><p class="math-answer"><b>Жауабы:</b> {md(s["a"])}</p></div>
          </li>''')
    o.append("        </ol>")
    if ex.get("outro"):
        o.append(f'        <p class="mx-xoutro"><b>Қорытынды.</b> {md(ex["outro"])}</p>')
    o.append(f"      </section>{CLOSE}\n      ")
    return "\n".join(o)


def inject(page, block, name):
    page = STRIP.sub("", page)
    i = page.find(MARK)
    if i < 0:
        raise SystemExit(f"{name}: «{MARK}» табылмады")
    return page[:i] + block + page[i:]


def main():
    chk = "--check" in sys.argv
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    stale, bad, n = [], [], 0
    for si, sb in enumerate(P.SUBJECTS):
        slug = sb[1]
        if not (SRC / slug).is_dir() or (args and slug not in args):
            continue
        for k in range(1, len(sb[7]) + 1):
            f = SRC / slug / f"x{k}.py"
            if not f.exists():
                continue
            name = f"{slug}/x{k}.py"
            ex = check(_load(f), name)
            bad += verify(ex, name)
            p = LECT / f"week-{P.STARTS[si] + k - 1}.html"
            old = p.read_text(encoding="utf-8")
            new = inject(old, render(ex, P.UNI[slug], k, f"{slug}{k}"), name)
            n += 1
            if new != old:
                if chk:
                    stale.append(p.name)
                else:
                    p.write_text(new, encoding="utf-8")
    if bad:
        raise SystemExit("math_explain: тексеріс құлады:\n  " + "\n  ".join(bad))
    if chk and stale:
        raise SystemExit(f"math_explain: беттер ескірген {stale} - python3 tools/math_explain.py іске қосыңыз")
    print(f"math_explain: {n} сабақ" + (" сәйкес" if chk else ""))


if __name__ == "__main__":
    main()
