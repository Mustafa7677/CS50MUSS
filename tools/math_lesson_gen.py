#!/usr/bin/env python3
# © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама (LICENSE-PROPRIETARY.md, COPYRIGHT.md).
"""Математика сабақтарын ықшам Python сипаттамасынан жасайды.

  python3 tools/math_lesson_gen.py prob            # tools/math_src/prob/l1..l7.py → math/lectures/week-79..85.html + деректер
  python3 tools/math_lesson_gen.py prob discrete   # бірнеше пән

Сипаттама: `tools/math_src/<slug>/l<k>.py` (әр файлда `from math_lesson_gen import *` және `LESSON = L(...)`).
Файлы жоқ сабаққа тиіспейді (бұрынғы бет қалады).
Сабақ бөлімдері docs/MATH-COURSE-GUIDE.md §4 ретімен шығады. Пәннің формулалары (`F` блоктары), терминдері
(`<strong>..</strong> (<span class="term-en">..</span>)`) және параметрлік есептері (`param`) деректер
файлдарына (assets/data/math-{formulas,terms,problems}-<slug>.js) автоматты жиналады.
Содан кейін: python3 tools/build.py && python3 tools/math_verify.py --lint math/lectures/week-N.html
"""
import html
import importlib.util
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import make_math_pages as M  # noqa: E402
import math_plan as P  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
SRC = Path(__file__).resolve().parent / "math_src"
DATA = ROOT / "assets" / "data"
TERM_RE = re.compile(r"\[\[([^|\]]+)\|([^\]]+)\]\]")  # [[қазақша|english]] - глоссарий термині
LEVEL = {"e": ("easy", "Жеңіл"), "m": ("medium", "Орташа"), "h": ("hard", "Күрделі")}


# ---------------------------------------------------------------- сипаттама құралдары
def L(**kw):
    """Бір сабақтың сипаттамасы (кілттері төменде `render` ішінде)."""
    return kw


def D(title, body):
    return ("def", title, body)


def T(title, body, why=None):
    return ("thm", title, body, why)


def PROP(title, body, why=None):
    return ("prop", title, body, why)


def F(title, tex, note="", cond=""):
    return ("f", title, tex, note, cond)


def REM(body, title="Есте сақта"):
    return ("rem", title, body)


def ATT(body, title="Назар аудар"):
    return ("att", title, body)


def NOTE(body, title="Ескертпе"):
    return ("note", title, body)


def P_(body):
    return ("p", body)


def X(t, lvl, title, instr, data):
    """Интерактивті есеп: t - түрі (num, expr, choice, tf, match, order, reveal, param, interval, matrix)."""
    return dict(t=t, lvl=lvl, title=title, instr=instr, data=data)


def plain(s):
    s = re.sub(r"<[^>]+>", "", s)
    return html.unescape(re.sub(r"\s+", " ", s)).strip()


# ---------------------------------------------------------------- жасау
def theory_html(items, k, fm, terms_ctx):
    out, c = [], {"def": 0, "thm": 0, "f": 0}
    for it in items:
        kind = it[0]
        if kind == "p":
            out.append(f"      <p>{it[1]}</p>")
        elif kind == "def":
            c["def"] += 1
            i = c["def"]
            out.append(f'      <div class="math-def" id="def-{i}"><span class="math-tag">Анықтама {k}.{i} · {it[1]}</span>\n        <p>{it[2]}</p></div>')
            terms_ctx.append(it[2])
        elif kind in ("thm", "prop"):
            c["thm"] += 1
            i = c["thm"]
            word = "Теорема" if kind == "thm" else "Ұсыныс"
            cls = "math-thm" if kind == "thm" else "math-prop"
            out.append(f'      <div class="{cls}" id="thm-{i}"><span class="math-tag">{word} {k}.{i} · {it[1]}</span>\n        <p>{it[2]}</p></div>')
            if it[3]:
                out.append(f"      <p><em>Негіздеме.</em> {it[3]}</p>")
        elif kind == "f":
            c["f"] += 1
            i = c["f"]
            _, title, tex, note, cond = it
            fn = f'\n        <p class="math-fnote">{note}</p>' if note else ""
            out.append(f'      <div class="math-formula" id="f-{i}"><span class="math-fname">Формула {k}.{i} · {title}</span>\n        <div class="math-fbody">$${tex}$$</div>{fn}</div>')
            fm.append(dict(name=title, tex=html.unescape(tex), cond=html.unescape(cond), note=plain(note), anchor=f"f-{i}"))
        elif kind == "rem":
            out.append(f'      <div class="math-remember"><span class="math-box-title">{it[1]}</span>\n        <p>{it[2]}</p></div>')
        elif kind == "att":
            out.append(f'      <div class="math-attention"><span class="math-box-title">{it[1]}</span>\n        <p>{it[2]}</p></div>')
        elif kind == "note":
            out.append(f'      <div class="math-remark"><span class="math-box-title">{it[1]}</span>\n        <p>{it[2]}</p></div>')
        else:
            raise ValueError(kind)
    return "\n".join(out)


def jdump(d):
    s = json.dumps(d, ensure_ascii=False, separators=(",", ":"))
    # JSON мәтіні HTML ретінде декодталмайды: HTML-сущностьтерді TeX/мәтінге қайтарамыз
    s = s.replace("&lt;", "\\\\lt ").replace("&gt;", ">").replace("&amp;", "&")
    assert "</script" not in s.lower(), s[:80]
    return s


def quiz_html(quiz, n):
    assert len(quiz) == 8, f"week-{n}: тест сұрағы {len(quiz)} (8 керек)"
    letters = "abcd"
    out = ['<div class="quiz">']
    used = []
    for i, (q, opts, ok, expl) in enumerate(quiz):
        assert len(opts) == 4
        for o in [q, expl] + list(opts):
            assert "$" not in o and "\\" not in o, f"week-{n}: тестте TeX: {o}"
        pos = (i * 3 + n) % 4  # дұрыс жауап орны: сұрақтан сұраққа ауысады
        rest = [o for j, o in enumerate(opts) if j != ok]
        arr = rest[:pos] + [opts[ok]] + rest[pos:]
        used.append(pos)
        out.append(f'<div class="question" data-answer="{letters[pos]}">')
        out.append(f'<p class="q-text">{i + 1}. {q}</p>')
        for j, o in enumerate(arr):
            out.append(f'<label><input type="radio" value="{letters[j]}"> {o}</label>')
        out.append(f'<p class="explain">{expl}</p>')
        out.append("</div>")
    out.append('<button class="btn quiz-check" type="button">Жауаптарды тексеру</button>')
    out.append('<p class="result" aria-live="polite"></p>')
    out.append("</div>")
    return "\n".join(out)


def render(n, Ls, probs):
    s, k0 = M.subj_of(n)
    k = k0 + 1
    no = s["no"]
    sk = M.skeleton(n)
    a0 = sk.index('<article class="content math-lesson" id="main">')
    a1 = sk.index("</article>")
    subnav = re.search(r'<nav class="math-subnav".*?</nav>', sk, re.S).group(0)
    callout = re.search(r'<div class="callout note">.*?</div>', sk, re.S).group(0)
    pager = re.search(r'<nav class="pager">.*?</nav>', sk, re.S).group(0)
    tnote = re.search(r'<p class="translator-note">.*?</p>', sk, re.S).group(0)
    title, desc = s["lessons"][k0]
    fm, terms_ctx = [], []
    o = []
    o.append(f'<article class="content math-lesson" id="main">\n      <div class="lecture-head" style="--lc:{M.COLOR}" data-n="{n}">\n        <div class="num">{M.lesson_label(n)}</div>\n        <h1>{M.a(title)}</h1>\n        <p>{Ls["intro"]}</p>\n      </div>\n')
    o.append(f"      {subnav}\n\n      {callout}\n")
    o.append('      <h2 id="goals">Сабақ мақсаттары</h2>\n      <p>Сабақ соңында сіз мыналарды істей аласыз:</p>\n      <ul>\n' + "\n".join(f"        <li>{g}</li>" for g in Ls["goals"]) + "\n      </ul>\n")
    o.append(f'      <h2 id="prereq">Қысқаша еске салу</h2>\n      <p class="math-prereq">{Ls["prereq"]}</p>\n')
    o.append('      <h2 id="intuition">Интуиция</h2>\n' + "\n".join(f"      <p>{p}</p>" for p in Ls["intuition"]) + "\n")
    o.append('      <h2 id="theory">Анықтамалар мен теоремалар</h2>\n' + theory_html(Ls["theory"], k, fm, terms_ctx) + "\n")
    # қорытулар
    o.append('      <h2 id="derivations">Қорытып шығару</h2>\n      <div class="mx-derive-tools"></div>')
    for i, (t, goal, steps) in enumerate(Ls["derivations"], 1):
        op = " open" if i == 1 else ""
        st = "\n".join(f"            <li>{x}</li>" for x in steps)
        o.append(f'      <details class="math-derive" id="d-{i}"{op}>\n        <summary>Қорытып шығару {i}: {t}</summary>\n        <div class="math-derive-body">\n          <p><b>Мақсат:</b> {goal}</p>\n          <ol class="math-steps">\n{st}\n          </ol>\n          <p class="math-qed">∎</p>\n        </div>\n      </details>')
    o.append("")
    o.append('      <h2 id="examples">Қадамдық шешілген мысалдар</h2>')
    for i, (t, prob, steps, ans) in enumerate(Ls["examples"], 1):
        st = "\n".join(f"          <li><b>{j}-қадам.</b> {x}</li>" for j, x in enumerate(steps, 1))
        o.append(f'      <div class="math-example" id="ex-{i}"><h3>Мысал {i}. {t}</h3>\n        <p class="math-problem">{prob}</p>\n        <ol class="math-steps">\n{st}\n        </ol>\n        <p class="math-answer"><b>Жауабы:</b> {ans}</p></div>')
    o.append("")
    o.append('      <h2 id="mistakes">Жиі қателер</h2>\n      <ul class="math-mistakes">')
    for bad, good, why in Ls["mistakes"]:
        o.append(f'        <li><span class="math-bad">{bad}</span> → <span class="math-good">{good}</span><br>Неге қате: {why}</li>')
    o.append("      </ul>\n")
    o.append('      <h2 id="viz">Визуализация</h2>')
    for typ, t, cfg, obs in Ls["viz"]:
        c = json.dumps(cfg, ensure_ascii=False).replace("'", "&#39;")
        o.append(f"      <div class=\"math-viz\" data-viz=\"{typ}\" data-title=\"{M.a(t)}\" data-config='{c}'></div>\n      <p><b>Бақылаңыз:</b> {obs}</p>")
    o.append("")
    o.append('      <h2 id="exercises">Интерактивті есептер</h2>\n      <p>Есептер үш деңгейге бөлінген: <b>жеңіл</b> (анықтаманы тікелей қолдану), <b>орташа</b> (2-3 қадам) және <b>күрделі</b> (бірнеше идеяны біріктіру). Әр есепте «Кеңес» және қадамдық шешім бар: алдымен өзіңіз ойланыңыз.</p>\n      <p class="mx-sum"></p>')
    for i, ex in enumerate(Ls["exercises"], 1):
        cls, lab = LEVEL[ex["lvl"]]
        did = f"m{no}-{k}-{ex['t'][:3]}{i}"
        o.append(f'      <div class="math-ex task" data-type="{ex["t"]}" data-id="{did}">\n        <div class="task-head"><span class="badge {cls}">{lab}</span><h3 id="m{no}-{k}-t{i}">{i}. {ex["title"]}</h3></div>\n        <p>{ex["instr"]}</p>\n        <script type="application/json" class="math-ex-data">{jdump(ex["data"])}</script>\n      </div>')
        if ex["t"] == "param":
            d = dict(ex["data"])
            pid = f"{s['slug']}-{k}-{i}"
            probs.append(dict(id=pid, lvl=cls, **d))
    o.append("")
    pj = Ls["project"]
    o.append('      <h2 id="project">Қолданыс және мини-жоба</h2>')
    for p in pj["text"]:
        o.append(f"      <p>{p}</p>")
    code = html.escape(pj["code"].strip("\n"), quote=False)
    o.append(f'<pre data-lang="python"><code class="language-python">{code}\n</code></pre>')
    if pj.get("tasks"):
        o.append("      <p><b>Өзіңіз жалғастырыңыз:</b></p>\n      <ol>\n" + "\n".join(f"        <li>{t}</li>" for t in pj["tasks"]) + "\n      </ol>")
    o.append("")
    o.append('      <h2 id="summary">Қорытынды формулалар</h2>\n      <table class="math-table"><thead><tr><th>Ұғым</th><th>Формула немесе ереже</th><th>Шарты</th></tr></thead>\n      <tbody>')
    for a_, b_, c_ in Ls["summary"]:
        o.append(f"        <tr><td>{a_}</td><td>{b_}</td><td>{c_}</td></tr>")
    o.append("      </tbody></table>\n")
    o.append(f'      <h2 id="review">Қайталау тізімі</h2>\n      <p>Өзіңізді тексеріп көріңіз. Әр тармақты өз сөзіңізбен түсіндіре алсаңыз, белгілеңіз:</p>\n      <ul class="checklist" data-id="m{no}-{k}-self">')
    for r in Ls["review"]:
        o.append(f'        <li><input type="checkbox"> <span>{r}</span></li>')
    o.append('      </ul>\n      <p class="progress"></p>\n')
    o.append('      <h2 id="quiz">Қорытынды тест</h2>\n' + quiz_html(Ls["quiz"], n) + "\n")
    o.append(f"      {pager}\n\n      {tnote}\n    ")
    page = sk[:a0] + TERM_RE.sub(lambda m: f'<strong>{m.group(1)}</strong> (<span class="term-en">{m.group(2)}</span>)', "\n".join(o)) + sk[a1:]
    terms_ctx = [TERM_RE.sub(lambda m: f'<strong>{m.group(1)}</strong> (<span class="term-en">{m.group(2)}</span>)', c) for c in terms_ctx]
    if "TODO" in page or "ЖАЗЫҢЫЗ" in page:
        raise SystemExit(f"week-{n}: толтырылмаған орын бар")
    # терминдер
    terms = []
    art = page[page.index("<article"):page.index("</article>")]
    for m in re.finditer(r'<strong>([^<]{2,60})</strong> \(<span class="term-en">([^<]{2,80})</span>\)', art):
        kz, en = m.group(1), m.group(2)
        ctx = next((c for c in terms_ctx if m.group(0) in c), None)
        if ctx is None:
            st = art.rfind("<p", 0, m.start())
            en_ = art.find("</p>", m.end())
            ctx = art[st:en_]
        sent = plain(ctx)
        if len(sent) > 260:
            cut = sent.find(". ", 120)
            sent = sent[:cut + 1] if 0 < cut < 260 else sent[:257].rstrip() + "…"
        terms.append(dict(kz=kz, en=en, defn=sent))
    return page, fm, terms


def _exec(path, name):
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


class _Pack:
    """`tools/math_src/<slug>/l1.py, l2.py ...` (әр файлда `LESSON = L(...)`): бір пән - бір бума."""
    def __init__(self, slug, count):
        d = SRC / slug
        self.LESSONS = []
        for k in range(1, count + 1):
            f = d / f"l{k}.py"
            self.LESSONS.append(_exec(f, f"math_src_{slug}_{k}").LESSON if f.exists() else None)


def load(slug, count):
    if (SRC / slug).is_dir():
        return _Pack(slug, count)
    return _exec(SRC / f"{slug}.py", f"math_src_{slug}")


def js_file(kind, var, slug, en, rows):
    head = f"/* © 2026 Sagid Mustafa. All Rights Reserved. Математика курсы, {en} пәні. Формат: docs/MATH-COURSE-GUIDE.md §{ {'formulas': '9.1', 'terms': '9.2', 'problems': '9.3'}[kind] }. */\n"
    body = ",\n".join(" " + json.dumps(r, ensure_ascii=False) for r in rows)
    return head + f"window.{var} = window.{var} || {{}};\nwindow.{var}.{slug} = [\n{body}\n];\n"


def gen(slug):
    si = next(i for i, x in enumerate(P.SUBJECTS) if x[1] == slug)
    sub = M.SUBJ[si]
    mod = load(slug, sub["count"])
    Ls = mod.LESSONS
    pref = slug
    fm_all, terms_all, probs = [], [], []
    seen_t = set()
    for k, spec in enumerate(Ls):
        if spec is None:
            continue
        n = sub["start"] + k
        page, fm, terms = render(n, spec, probs)
        (M.MATH / "lectures" / f"week-{n}.html").write_text(page, encoding="utf-8")
        for j, f in enumerate(fm, 1):
            fm_all.append({"id": f"{pref}-{k + 1}-{j}", "name": f["name"], "tex": f["tex"], "cond": f["cond"], "note": f["note"],
                           "tags": [sub["en"], sub["lessons"][k][0]], "lesson": k + 1, "anchor": f["anchor"]})
        for t in terms:
            key = t["kz"].lower()
            if key in seen_t:
                continue
            seen_t.add(key)
            terms_all.append({"id": f"{pref}-t{len(terms_all) + 1}", "kz": t["kz"], "en": t["en"], "def": t["defn"], "lesson": k + 1})
        print(f"week-{n}: {sub['lessons'][k][0]}")
    (DATA / f"math-formulas-{slug}.js").write_text(js_file("formulas", "CS50KZ_MATH_FORMULAS", slug, sub["en"], fm_all), encoding="utf-8")
    (DATA / f"math-terms-{slug}.js").write_text(js_file("terms", "CS50KZ_MATH_TERMS", slug, sub["en"], terms_all), encoding="utf-8")
    for p in probs:
        p["id"] = f"{pref}-p{probs.index(p) + 1}"
    (DATA / f"math-problems-{slug}.js").write_text(js_file("problems", "CS50KZ_MATH_PROBLEMS", slug, sub["en"], probs), encoding="utf-8")
    print(f"{slug}: формула {len(fm_all)}, термин {len(terms_all)}, параметрлік есеп {len(probs)}")


if __name__ == "__main__":
    for sl in sys.argv[1:]:
        gen(sl)
