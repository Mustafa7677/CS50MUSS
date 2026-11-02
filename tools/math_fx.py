#!/usr/bin/env python3
# © 2026 Sagid Mustafa. All Rights Reserved.
"""Математика: әр формуланың ДӘЛ АСТЫНА жеке түсіндірме енгізеді.

Әр формулаға төрт бөлік (мәтіні tools/math_fx/<пән>.py ішіндегі FX[week][формула нөмірі]):
  Қарапайым тілмен  - формула не айтады, әр әріп пен таңбаның мағынасы;
  Бірден мысал      - қарапайым сандар, әр есептеу қадамы, белгіленген жауап, нәтиже неге солай;
  Өмірден түсінейік - формулаға дәл сәйкес келетін күнделікті жағдай;
  Неге бұлай жұмыс істейді? - формуланың қайдан шығатыны.

Тексерулер (бірі бұзылса - қате, бет өзгермейді):
  - сабақтағы әр формулаға мәтін бар, артық кілт жоқ;
  - әр мысалдың check өрнегі Python-да True береді (арифметика қатесіз);
  - бір мәтін екі формулада қайталанбайды.
Өту идемпотентті: бұрынғы енгізілгенін алып тастап, қайта қояды. Прогресс: docs/MATH-FX-PROGRESS.md.

    python3 tools/math_fx.py          # build.py да шақырады
"""
import html
import importlib.util
import math
import re
from fractions import Fraction
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "tools/math_fx"
LECT = ROOT / "math/lectures"
FORMULA = re.compile(r'(<div class="math-formula" id="f-(\d+)">.*?<div class="math-fbody">.*?</div>(?:\s*<p class="math-fnote">.*?</p>)?\s*</div>)', re.S)
OLD = re.compile(r'\n      <div class="mx-fx"[^>]*>.*?<!--/mx-fx-->', re.S)


def load():
    fx = {}
    for f in sorted(SRC.glob("*.py")):
        spec = importlib.util.spec_from_file_location("fx_" + f.stem, f)
        m = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(m)
        for week, items in m.FX.items():
            assert week not in fx, f"week-{week} екі файлда"
            fx[week] = items
    return fx


def tex(s):
    """$...$ ішіндегі < мен > - браузер оларды тег деп оқымасын (KaTeX &lt; пен &gt;-ны дұрыс сызады)."""
    return re.sub(r"\$[^$]*\$", lambda m: m.group(0).replace("<", "&lt;").replace(">", "&gt;"), s)


def block(n, i, d):
    d = {k: (tex(v) if isinstance(v, str) else v) for k, v in d.items()}
    d["now"] = {k: ([tex(x) for x in v] if isinstance(v, list) else tex(v)) for k, v in d["now"].items()}
    d["terms"] = [(tex(a), tex(b)) for a, b in d["terms"]]
    terms = "".join(f"<li><span class=\"fx-sym\">{s}</span> {html.escape(t, quote=False) if '$' not in t else t}</li>" for s, t in d["terms"])
    steps = "".join(f"<li>{s}</li>" for s in d["now"]["steps"])
    return (f'\n      <div class="mx-fx" id="fx-{i}" aria-label="Формула {i}: түсіндірме">'
            f'\n        <div class="fx-part fx-plain"><span class="fx-k">Қарапайым тілмен</span><p>{d["plain"]}</p><ul class="fx-terms">{terms}</ul></div>'
            f'\n        <div class="fx-part fx-now"><span class="fx-k">Бірден мысал</span><p class="fx-q">{d["now"]["q"]}</p><ol class="fx-steps">{steps}</ol>'
            f'<p class="fx-ans"><b>Жауабы:</b> {d["now"]["ans"]}</p><p class="fx-res">{d["now"]["res"]}</p></div>'
            f'\n        <div class="fx-part fx-life"><span class="fx-k">Өмірден түсінейік</span><p>{d["life"]}</p></div>'
            f'\n        <div class="fx-part fx-why"><span class="fx-k">Неге бұлай жұмыс істейді?</span><p>{d["why"]}</p></div>'
            f'\n      </div><!--/mx-fx-->')


def check(n, items, nums):
    if sorted(items) != sorted(nums):
        raise SystemExit(f"week-{n}: формулалар {sorted(nums)}, мәтін {sorted(items)}")
    for i, d in items.items():
        for k in ("plain", "terms", "now", "life", "why", "check"):
            if not d.get(k):
                raise SystemExit(f"week-{n} f-{i}: «{k}» жоқ")
        if len(d["now"]["steps"]) < 2:
            raise SystemExit(f"week-{n} f-{i}: мысалда кемінде 2 қадам керек")
        if eval(d["check"], {"Fraction": Fraction, "isqrt": math.isqrt, "abs": abs, "divmod": divmod, "sum": sum, "range": range}) is not True:
            raise SystemExit(f"week-{n} f-{i}: мысалдың есебі тексеруден өтпеді: {d['check']}")


def main():
    fx = load()
    seen = {}
    rows, added = [], 0
    for p in sorted(LECT.glob("week-*.html"), key=lambda q: int(q.stem.split("-")[1])):
        n = int(p.stem.split("-")[1])
        s = OLD.sub("", p.read_text(encoding="utf-8"))
        nums = [int(m.group(2)) for m in FORMULA.finditer(s)]
        title = re.search(r"<h1>(.*?)</h1>", s, re.S).group(1)
        items = fx.get(n)
        if items:
            check(n, items, nums)
            for i, d in items.items():
                for k in ("plain", "life", "why"):
                    key = re.sub(r"\s+", " ", d[k])
                    if key in seen:
                        raise SystemExit(f"week-{n} f-{i}: «{k}» мәтіні {seen[key]}-де қайталанады")
                    seen[key] = f"week-{n} f-{i}"
            s = FORMULA.sub(lambda m: m.group(1) + block(n, int(m.group(2)), items[int(m.group(2))]), s)
            added += len(items)
        old = p.read_text(encoding="utf-8")
        if s != old:
            p.write_text(s, encoding="utf-8")
        label = re.search(r'<div class="num">(.*?)</div>', s).group(1)
        rows.append((n, label, re.sub("<[^>]+>", "", title), len(nums), len(items or {})))
    write_progress(rows, added)
    return added


def write_progress(rows, added):
    done = [r for r in rows if r[3] and r[4] == r[3]]
    total_f = sum(r[3] for r in rows)
    out = ["# Математика: әр формулаға жеке түсіндірме - орындалу барысы", "",
           "© 2026 Sagid Mustafa. Бұл файлды `tools/math_fx.py` жасайды (әр `build.py` жинауында жаңарады), қолмен өзгертпеңіз.", "",
           "Әр формуланың астында: «Қарапайым тілмен» (әр әріп пен таңба), «Бірден мысал» (қадамдар, жауап, неге), «Өмірден түсінейік», «Неге бұлай жұмыс істейді?».",
           "Мәтін: `tools/math_fx/<пән>.py`. Әр мысалдың есебі Python-мен тексеріледі.", "",
           f"- Сабақ барлығы: **{len(rows)}**; толық өңделген: **{len(done)}**; өңделмеген: **{len(rows) - len(done)}**",
           f"- Формула барлығы: **{total_f}**; жеке түсіндірме мен «Бірден мысал» қосылғаны: **{added}**", "",
           "| Сабақ | Белгі | Тақырып | Формула | Түсіндірме | Күйі |", "|---|---|---|---|---|---|"]
    for n, label, title, nf, nx in rows:
        st = "дайын, тексерілді" if nf and nx == nf else ("формуласыз" if not nf else "өңделмеген")
        out.append(f"| week-{n} | {label} | {title} | {nf} | {nx} | {st} |")
    (ROOT / "docs/MATH-FX-PROGRESS.md").write_text("\n".join(out) + "\n", encoding="utf-8")


if __name__ == "__main__":
    print("формулаға қосылған түсіндірме:", main())
