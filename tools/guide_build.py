#!/usr/bin/env python3
# © 2026 Sagid Mustafa. All Rights Reserved.
"""AO17 Оқулық: IELTS және Digital SAT академияларының сабақтары (түсіндірме, әдіс, қадамдық мысал, жаттығу).

Мазмұн интерфейстен бөлек: әр сабақ - tools/guides/<академия>/<NN>_<slug>.py файлындағы LESSON сөздігі.
Бұл құрал оларды тексеріп, academy/<академия>/lesson-<slug>.html беттерін және хабтағы «Оқулық» тізімін жасайды.
Интерактив: assets/js/ao-guide.js (болжау, қадамдап ашылатын шешім, тексерілетін жаттығулар, AO17Tutor).

    python3 tools/guide_build.py            # тексеру + беттерді жасау
    python3 tools/guide_build.py --check    # тек тексеру
    AO17_GUIDES=sat python3 tools/guide_build.py --check   # тек бір академия (не sat/03 сияқты префикс)

Сабақ схемасы (LESSON):
  id        "sat.math.linear-functions" - AO17Tutor дағды идентификаторы (префиксі - академия)
  title, section ("Math · Algebra"), minutes (int), level ("негіз" | "орта" | "жоғары")
  goals     [2-4 оқу мақсаты]
  hook      {"text": HTML (нақты мәселе), "predict": {"q", "options"[2-4], "answer", "why"}}   - қызықтыру және болжату
  explain   [{"h": тақырыпша, "body": HTML}, ...] кемінде 3 бөлім, жиыны ≥ 350 сөз: қарапайымнан тереңге
  method    {"title", "steps": [{"name", "text"}, ...]} кемінде 3 қадам - емтиханда қолданылатын әдіс
  worked    [{"task": HTML, "steps": [HTML, ...] ≥ 3, "answer": HTML, "trap": мәтін}, ...] кемінде 2 қадамдық мысал
  traps     [{"wrong", "why", "fix"}, ...] кемінде 2 жиі қате
  practice  [жаттығу, ...] кемінде 5 (көмекпен), mastery [жаттығу, ...] кемінде 3 (көмексіз, жаңа есептер)
  summary   [3-6 түйін], lab {"href", "title"} (міндетті емес), sources [дереккөз/ескерту, ...] (міндетті емес)
Жаттығу түрлері:
  mc   {"type": "mc", "q", "passage"? (HTML), "options"[2-5], "answer", "why"[әр нұсқаға], "hints"[3]?}
  num  {"type": "num", "q", "value" (сан), "calc" (Python өрнегі - build кезінде есептеліп, value-мен салыстырылады),
        "tol"? , "unit"?, "explain", "errors"? {"қате мән": "неге"}, "hints"[3]?}
  gap  {"type": "gap", "q" (___ бар мәтін), "accept"[дұрыс жазылулар], "explain", "errors"? {"қате жауап": "неге"}, "hints"[3]?}
practice жаттығуларында hints (3 деңгей: бағыт, ұқсас мысал, қадамдық шешім) міндетті; mastery-де hints болмайды.
"""
import html
import importlib.util
import json
import math
import os
import re
import sys
from fractions import Fraction
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "tools" / "guides"
ACADS = {"sat": ("Digital SAT", "Digital SAT Academy"), "ielts": ("IELTS", "IELTS Academy")}
E = html.escape
LEVELS = {"негіз", "орта", "жоғары"}


def words(h):
    return len(re.sub(r"<[^>]+>", " ", h).split())


def load():
    only = os.environ.get("AO17_GUIDES", "")
    out = []
    for acad in ACADS:
        for f in sorted((SRC / acad).glob("[0-9][0-9]_*.py")):
            key = f"{acad}/{f.stem}"
            if only and not key.startswith(only):
                continue
            spec = importlib.util.spec_from_file_location("guide_" + acad + "_" + f.stem, f)
            mod = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(mod)
            L = dict(mod.LESSON)
            L["acad"], L["order"], L["slug"] = acad, int(f.stem[:2]), f.stem[3:].replace("_", "-")
            out.append(L)
    return out


def check_ex(ex, where, errs, hints_required):
    t = ex.get("type")
    if t not in ("mc", "num", "gap"):
        return errs.append(f"{where}: белгісіз жаттығу түрі {t!r}")
    if len(ex.get("q", "")) < 8:
        errs.append(f"{where}: сұрақ тым қысқа")
    h = ex.get("hints")
    if hints_required and (not isinstance(h, list) or len(h) != 3 or not all(len(x) > 8 for x in h)):
        errs.append(f"{where}: 3 деңгейлі көмек керек (бағыт, ұқсас мысал, қадамдық шешім)")
    if not hints_required and h:
        errs.append(f"{where}: меңгеру жаттығуында көмек болмауы керек")
    if t == "mc":
        n = len(ex.get("options", []))
        if not (2 <= n <= 5) or not isinstance(ex.get("answer"), int) or not (0 <= ex["answer"] < n):
            errs.append(f"{where}: mc - нұсқа не жауап қате")
        elif len(ex.get("why", [])) != n or not all(len(w) > 8 for w in ex["why"]):
            errs.append(f"{where}: mc - әр нұсқаның түсіндірмесі керек")
        elif len(set(ex["options"])) != n:
            errs.append(f"{where}: mc - қайталанатын нұсқа")
    elif t == "num":
        if not isinstance(ex.get("value"), (int, float)) or len(ex.get("explain", "")) < 15:
            return errs.append(f"{where}: num - value (сан) және explain керек")
        if "calc" not in ex:
            return errs.append(f"{where}: num - calc (Python өрнегі) керек: жауап есептеліп тексеріледі")
        try:
            got = eval(ex["calc"], {"__builtins__": {}}, {"math": math, "sqrt": math.sqrt, "pi": math.pi, "Fraction": Fraction, "abs": abs, "round": round, "min": min, "max": max, "sum": sum, "sorted": sorted, "len": len})
            if abs(float(got) - float(ex["value"])) > max(1e-9, ex.get("tol", 0)):
                errs.append(f"{where}: num - calc = {float(got):g}, ал value = {ex['value']}")
        except Exception as e:  # noqa: BLE001
            errs.append(f"{where}: num - calc есептелмеді: {e}")
    else:
        if not ex.get("accept") or len(ex.get("explain", "")) < 15 or "___" not in ex["q"]:
            errs.append(f"{where}: gap - сұрақта ___, accept тізімі және explain керек")


def validate(lessons):
    errs, ids, qs = [], set(), {}
    for L in lessons:
        w = f"{L['acad']}/{L['order']:02d} {L.get('id', '?')}"
        for k, typ in [("id", str), ("title", str), ("section", str), ("minutes", int), ("level", str), ("goals", list), ("hook", dict), ("explain", list),
                       ("method", dict), ("worked", list), ("traps", list), ("practice", list), ("mastery", list), ("summary", list)]:
            if not isinstance(L.get(k), typ):
                errs.append(f"{w}: «{k}» өрісі жоқ не түрі қате")
        if any(e.startswith(w + ":") for e in errs):
            continue
        if not L["id"].startswith(L["acad"] + ".") or L["id"] in ids:
            errs.append(f"{w}: id «{L['acad']}.» деп басталып, бірегей болуы керек")
        ids.add(L["id"])
        if L["level"] not in LEVELS:
            errs.append(f"{w}: level {LEVELS} ішінен")
        if not (2 <= len(L["goals"]) <= 4):
            errs.append(f"{w}: 2-4 оқу мақсаты керек")
        hk = L["hook"]
        if words(hk.get("text", "")) < 25 or not isinstance(hk.get("predict"), dict):
            errs.append(f"{w}: hook.text (≥ 25 сөз) және hook.predict керек")
        else:
            check_ex({"type": "mc", "q": hk["predict"].get("q", ""), "options": hk["predict"].get("options", []), "answer": hk["predict"].get("answer"),
                      "why": [hk["predict"].get("why", "")] * len(hk["predict"].get("options", []))}, f"{w} болжам", errs, False)
        if len(L["explain"]) < 3 or not all(x.get("h") and x.get("body") for x in L["explain"]):
            errs.append(f"{w}: explain - кемінде 3 бөлім (h, body)")
        elif sum(words(x["body"]) for x in L["explain"]) < 350:
            errs.append(f"{w}: түсіндірме тым қысқа ({sum(words(x['body']) for x in L['explain'])} сөз, кемінде 350)")
        st = L["method"].get("steps", [])
        if not L["method"].get("title") or len(st) < 3 or not all(x.get("name") and len(x.get("text", "")) > 15 for x in st):
            errs.append(f"{w}: method - атауы және кемінде 3 қадам (name, text)")
        if len(L["worked"]) < 2 or not all(x.get("task") and len(x.get("steps", [])) >= 3 and x.get("answer") and x.get("trap") for x in L["worked"]):
            errs.append(f"{w}: worked - кемінде 2 мысал, әрқайсысында task, ≥ 3 қадам, answer, trap")
        if len(L["traps"]) < 2 or not all(x.get("wrong") and x.get("why") and x.get("fix") for x in L["traps"]):
            errs.append(f"{w}: traps - кемінде 2 жиі қате (wrong, why, fix)")
        if len(L["practice"]) < 5 or len(L["mastery"]) < 3:
            errs.append(f"{w}: кемінде 5 practice және 3 mastery жаттығуы керек")
        for i, ex in enumerate(L["practice"]):
            check_ex(ex, f"{w} practice {i + 1}", errs, True)
        for i, ex in enumerate(L["mastery"]):
            check_ex(ex, f"{w} mastery {i + 1}", errs, False)
        for ex in L["practice"] + L["mastery"]:
            key = re.sub(r"\s+", " ", ex.get("q", "") + "|" + ex.get("passage", "")).strip()
            if key in qs:
                errs.append(f"{w}: сұрақ қайталанады ({qs[key]}): {ex.get('q', '')[:60]}")
            qs[key] = w
        if not (3 <= len(L["summary"]) <= 6):
            errs.append(f"{w}: 3-6 түйін керек")
        if L.get("lab") and not (ROOT / "academy" / L["acad"] / L["lab"]["href"].split("#")[0]).exists():
            errs.append(f"{w}: lab.href жоқ бетке сілтейді: {L['lab']['href']}")
    return errs


def head_from(page):
    """Бар хаб бетінің бас бөлігі мен шапкасы/футері үлгі ретінде алынады (build.py кейін оларды жаңартады)."""
    s = page.read_text(encoding="utf8")
    top = s[:s.index("<title>")]
    top = re.sub(r"\s*<script>/\* Академияға кірер алдында.*?</script>\n", "\n", top, flags=re.S)
    hdr = s[s.index('<body'):s.index("<main")] if "<main" in s else s[s.index('<body'):s.index("<article")]
    ftr = s[s.index("<footer"):]
    return top, hdr, ftr


def ex_static(ex, i):
    """JS жоқ кезде де оқылатын жаттығу мәтіні (жауапсыз); JS оны интерактивке айналдырады."""
    p = f'<div class="gd-pass">{ex["passage"]}</div>' if ex.get("passage") else ""
    opts = "<ol type=\"A\">" + "".join(f"<li>{E(o)}</li>" for o in ex["options"]) + "</ol>" if ex["type"] == "mc" else ""
    return f'<li class="gd-ex" data-i="{i}">{p}<p class="gd-q">{E(ex["q"])}</p>{opts}</li>'


def lesson_html(L, prev_l, next_l, tmpl):
    top, hdr, ftr = tmpl
    name, acad_title = ACADS[L["acad"]]
    rel = f"academy/{L['acad']}/lesson-{L['slug']}.html"
    li = lambda xs: "".join(f"<li>{E(x)}</li>" for x in xs)  # noqa: E731
    explain = "".join(f'<section class="gd-part"><h3>{E(x["h"])}</h3>{x["body"]}</section>' for x in L["explain"])
    method = "".join(f'<li><b>{E(s["name"])}</b><span>{E(s["text"])}</span></li>' for s in L["method"]["steps"])
    worked = "".join(
        f'<article class="gd-worked" data-worked><h3>{i + 1}-мысал</h3><div class="gd-task">{x["task"]}</div><ol class="gd-wsteps">{"".join(f"<li>{s}</li>" for s in x["steps"])}</ol>'
        f'<p class="gd-ans"><b>Жауап:</b> {x["answer"]}</p><p class="gd-trap"><b>Қақпан:</b> {E(x["trap"])}</p></article>' for i, x in enumerate(L["worked"]))
    traps = "".join(f'<li><b>{E(t["wrong"])}</b><span>Неге қате: {E(t["why"])}</span><span>Дұрысы: {E(t["fix"])}</span></li>' for t in L["traps"])
    pr = L["hook"]["predict"]
    data = {"id": L["id"], "title": L["title"], "predict": pr, "practice": L["practice"], "mastery": L["mastery"]}
    nav = ('<nav class="ac-pager">' + (f'<a href="lesson-{prev_l["slug"]}.html">← {E(prev_l["title"])}</a>' if prev_l else "<span></span>")
           + '<a href="index.html#guide">Оқулық мазмұны</a>' + (f'<a href="lesson-{next_l["slug"]}.html">{E(next_l["title"])} →</a>' if next_l else "<span></span>") + "</nav>")
    lab = f'<p class="lab-row"><a class="btn gold" href="{E(L["lab"]["href"])}">Зертханада бекіту: {E(L["lab"]["title"])}</a></p>' if L.get("lab") else ""
    src = f'<section class="gd-sec gd-src"><h2>Дереккөз және ескерту</h2><ul>{li(L["sources"])}</ul></section>' if L.get("sources") else ""
    desc = f"AO17 {name} оқулығы: {L['title']}. {L['goals'][0]}"
    body = f"""{hdr}<main class="content gd" id="main" data-guide="{E(L['id'])}">
    <header class="lab-hero gd-head">
      <p class="ac-crumb"><a href="../index.html">CS Universe</a> / <a href="index.html">{E(acad_title)}</a> / <a href="index.html#guide">Оқулық</a></p>
      <p class="lab-kicker">{E(L['section'])} · {L['order']}-сабақ</p>
      <h1>{E(L['title'])}</h1>
      <ul class="ac-chips"><li>{E(L['level'])}</li><li>≈ {L['minutes']} мин</li><li>{len(L['practice']) + len(L['mastery'])} жаттығу</li><li><span data-gd-badge></span></li></ul>
    </header>
    <section class="gd-sec"><h2>Не үйренесіз</h2><ul class="ac-obj">{li(L['goals'])}</ul></section>
    <section class="gd-sec gd-hook"><h2>Алдымен ойланыңыз</h2>{L['hook']['text']}
      <div class="gd-predict" data-gd-predict><p class="gd-q">{E(pr['q'])}</p><ol type="A">{li(pr['options'])}</ol></div></section>
    <section class="gd-sec"><h2>Түсіндірме</h2>{explain}</section>
    <section class="gd-sec gd-method"><h2>{E(L['method']['title'])}</h2><ol class="gd-steps">{method}</ol></section>
    <section class="gd-sec"><h2>Қадамдық мысалдар</h2><p class="ac-note">Әр қадамды кезекпен ашыңыз: алдымен келесі қадамды өзіңіз болжап көріңіз.</p>{worked}</section>
    <section class="gd-sec"><h2>Жиі қателер</h2><ul class="gd-traps">{traps}</ul></section>
    <section class="gd-sec"><h2>Жаттығу</h2><p class="ac-note">Қате жауапқа себебі түсіндіріледі. Көмек үш деңгейлі: бағыт, ұқсас мысал, қадамдық шешім.</p>
      <ol class="gd-exs" data-gd-set="practice">{"".join(ex_static(x, i) for i, x in enumerate(L['practice']))}</ol></section>
    <section class="gd-sec"><h2>Меңгеруді тексеру</h2><p class="ac-note">Жаңа есептер, көмексіз. Бәрін дұрыс шешсеңіз, сабақ «меңгерілді» деп белгіленеді (AO17 ережесі, ресми емтихан бағасы емес).</p>
      <ol class="gd-exs" data-gd-set="mastery">{"".join(ex_static(x, i) for i, x in enumerate(L['mastery']))}</ol><div data-gd-result role="status"></div></section>
    <section class="gd-sec gd-sum"><h2>Түйін</h2><ul>{li(L['summary'])}</ul>{lab}</section>
    {src}
    {nav}
  </main>
  <script type="application/json" id="gd-data">{json.dumps(data, ensure_ascii=False).replace("</", "<\\/")}</script>
  {ftr}"""
    head = (top + f"<title>{E(L['title'])} - {E(name)} оқулығы - AO17</title>\n  <!-- build:head -->\n  <!-- /build:head -->\n"
            f'  <meta name="description" content="{E(desc[:300])}">\n  <meta name="author" content="Sagid Mustafa">\n'
            '  <link rel="stylesheet" href="../../assets/fonts/fonts.css">\n  <link rel="stylesheet" href="../../assets/css/style.css">\n'
            '  <link rel="stylesheet" href="../../assets/css/academy.css">\n  <link rel="stylesheet" href="../../assets/css/ao-labs.css">\n'
            '  <script src="../../assets/js/main.js"></script>\n  <script src="../../assets/js/ao-tutor.js" defer></script>\n  <script src="../../assets/js/ao-guide.js" defer></script>\n</head>\n')
    return rel, head + body


def hub_block(lessons):
    """Хабтағы «Оқулық» тізімі: бөлім бойынша топталған сабақтар."""
    secs = {}
    for L in lessons:
        secs.setdefault(L["section"], []).append(L)
    out = ['<p class="ac-note">Әр сабақ: нақты мәселе, түсіндірме, емтихандағы әдіс, қадамдық мысалдар, жиі қателер, жаттығу және көмексіз меңгеру тексерісі.</p>']
    for sec, ls in secs.items():
        out.append(f'<h3 class="gd-hsec">{E(sec)}</h3><ol class="gd-list">' + "".join(
            f'<li><a href="lesson-{L["slug"]}.html">{E(L["title"])}</a><small>{E(L["goals"][0])} · ≈ {L["minutes"]} мин</small></li>' for L in ls) + "</ol>")
    return "\n      ".join(out)


def build(write=True):
    lessons = load()
    errs = validate(lessons)
    if errs:
        print("guides: ТЕКСЕРУДЕН ӨТПЕДІ:", *errs, sep="\n  ")
        sys.exit(1)
    n_ex = sum(len(L["practice"]) + len(L["mastery"]) for L in lessons)
    if not write:
        print(f"guides check: OK ({len(lessons)} сабақ, {n_ex} жаттығу)")
        return []
    pages = []
    for acad in ACADS:
        ls = [L for L in lessons if L["acad"] == acad]
        hub = ROOT / "academy" / acad / "index.html"
        tmpl = head_from(hub)
        keep = set()
        for i, L in enumerate(ls):
            rel, text = lesson_html(L, ls[i - 1] if i else None, ls[i + 1] if i + 1 < len(ls) else None, tmpl)
            fp = ROOT / rel
            keep.add(fp.name)
            core = lambda t: re.sub(r"<!-- build:head -->.*?<!-- /build:head -->", "", re.sub(r'<header class="topbar">.*?</header>|<footer class="footer">.*?</footer>', "", t, flags=re.S), flags=re.S)  # noqa: E731
            if not fp.exists() or core(fp.read_text(encoding="utf8")) != core(text):
                fp.write_text(text, encoding="utf8")
            pages.append(rel)
        for old in (ROOT / "academy" / acad).glob("lesson-*.html"):
            if old.name not in keep and not os.environ.get("AO17_GUIDES"):
                old.unlink()
        s = hub.read_text(encoding="utf8")
        if "<!-- guide:list -->" in s and ls:
            s = re.sub(r"<!-- guide:list -->.*?<!-- /guide:list -->", "<!-- guide:list -->\n      " + hub_block(ls).replace("\\", "\\\\") + "\n      <!-- /guide:list -->", s, flags=re.S)
            hub.write_text(s, encoding="utf8")
    print(f"guides: {len(pages)} сабақ беті, {n_ex} жаттығу")
    return pages


if __name__ == "__main__":
    build(write="--check" not in sys.argv)
