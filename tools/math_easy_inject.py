# © 2026 Sagid Mustafa. All Rights Reserved.
"""Қолмен жазылған математика сабақтарына (1-10 пәндер) «жеңіл қабатты» енгізу.

Генерацияланатын пәндерде жеңіл қабат tools/math_lesson_gen.py ішінде жасалады
(docs/MATH-COURSE-GUIDE.md §4.3). Ал 1-10 пәндердің беттері қолмен жазылған HTML,
сондықтан мұнда сол `EASY = dict(...)` пішімін (tools/math_easy/<slug>/e<k>.py)
оқып, блоктарды дәл сол орындарға қоямыз:

  mx-big       - «Сабақ мақсаттары» алдында
  #warmup      - «Интуиция» алдында
  mx-analogy, #symbols - «Анықтамалар мен теоремалар» алдында
  mx-plain     - әр анықтама/теорема қорабының ішінде (d1, t1, ...)
  #checks      - «Қорытып шығару» алдында
  mx-idea      - әр қорытудың «Мақсат» жолынан кейін

Әр енгізілген бөлік <!--easy-->…<!--/easy--> ішінде, сондықтан қайта іске қосу қауіпсіз:
алдымен ескі бөліктер алынады, сосын жаңасы қойылады.

  python3 tools/math_easy_inject.py            # барлық e<k>.py файлдарын енгізу
  python3 tools/math_easy_inject.py precalc    # бір пән
  python3 tools/math_easy_inject.py --check    # беттер файлдармен сәйкес пе (өзгертпейді)
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
import math_plan as P  # noqa: E402
from math_lesson_gen import _exec, check_easy  # noqa: E402

SRC = ROOT / "tools" / "math_easy"
LECT = ROOT / "math" / "lectures"
OPEN, CLOSE = "<!--easy-->", "<!--/easy-->"
STRIP = re.compile(re.escape(OPEN) + r".*?" + re.escape(CLOSE), re.S)


def wrap(s):
    return f"{OPEN}{s}{CLOSE}"


def before(page, marker, chunk, name):
    i = page.find(marker)
    if i < 0:
        raise SystemExit(f"{name}: «{marker}» табылмады")
    return page[:i] + wrap(chunk + "\n      ") + page[i:]


def inject(page, E, name):
    page = STRIP.sub("", page)
    page = before(page, '<h2 id="goals">', f'<div class="mx-big"><span class="mx-big-k">Бір сөйлеммен</span>\n        <p>{E["big"]}</p></div>\n', name)
    w = E["warmup"]
    st = "\n".join(f"          <li>{x}</li>" for x in w["steps"])
    page = before(page, '<h2 id="intuition"',
                  f'<h2 id="warmup">Алдымен қолмен: {w["title"]}</h2>\n      <p>Формулаға дейін нақты сандармен ойнап көрейік. Әр қадамды өзіңіз де қағазда қайталаңыз.</p>\n'
                  f'      <div class="mx-warmup"><p class="math-problem">{w["problem"]}</p>\n        <ol class="math-steps">\n{st}\n        </ol>\n'
                  f'        <p class="mx-takeaway"><b>Байқадыңыз ба?</b> {w["takeaway"]}</p></div>\n', name)
    an = "\n".join(f'      <div class="mx-analogy"><span class="math-box-title">Өмірден ұқсастық · {t}</span>\n        <p>{b}</p></div>' for t, b in E["analogies"])
    rows = "\n".join(f"        <tr><td>${tx}$</td><td>{rd}</td><td>{mn}</td></tr>" for tx, rd, mn in E["symbols"])
    page = before(page, '<h2 id="theory"',
                  an.lstrip() + '\n\n      <h2 id="symbols">Белгілерді оқу</h2>\n      <p>Жоғары математиканың қиындығының жартысы - белгілерде. Теорияға дейін әр белгіні дауыстап оқып, мағынасын біліп алайық:</p>\n'
                  f'      <table class="math-table mx-symbols"><thead><tr><th>Белгі</th><th>Қалай оқылады</th><th>Нені білдіреді</th></tr></thead>\n      <tbody>\n{rows}\n      </tbody></table>\n', name)
    # анықтама/теорема қораптары: құжат ретімен d1, d2 ... және t1, t2 ...
    plain = dict(E["plain"])
    cnt = {"d": 0, "t": 0}

    def box(m):
        body = m.group(0)
        if "<div" in body[5:]:
            raise SystemExit(f"{name}: қорап ішінде ішкі <div> бар, қолмен тексеріңіз: {body[:80]}")
        k = "d" if m.group(1) == "def" else "t"
        cnt[k] += 1
        t = plain.pop(f"{k}{cnt[k]}", None)
        if not t:
            tag = re.search(r'math-tag">([^<]*)', body)
            raise SystemExit(f"{name}: «plain» ішінде {k}{cnt[k]} жоқ ({tag.group(1) if tag else body[:60]})")
        return body[:-6] + wrap(f'\n        <p class="mx-plain"><b>Қарапайым тілмен:</b> {t}</p>') + "</div>"
    page = re.sub(r'<div class="math-(def|thm|prop)"[^>]*>.*?</div>', box, page, flags=re.S)
    if plain:
        raise SystemExit(f"{name}: «plain» артық кілттер {sorted(plain)} (бетте d{cnt['d']}, t{cnt['t']})")
    chk = "\n".join(f'      <details class="mx-check" id="chk-{i}"><summary><span class="mx-q"><b>{i}.</b> {q}</span></summary>\n        <p>{a}</p></details>'
                    for i, (q, a) in enumerate(E["checks"], 1))
    page = before(page, '<h2 id="derivations"',
                  '<h2 id="checks">Тоқта, ойлан</h2>\n      <p>Әрі қарай жүрмес бұрын, өзіңізді тексеріңіз: алдымен жауапты ойланыңыз, сосын ашыңыз.</p>\n' + chk + "\n", name)
    ideas = dict(E["ideas"])
    nd = len(re.findall(r'<details class="math-derive"', page))
    if set(ideas) != set(range(1, nd + 1)):
        raise SystemExit(f"{name}: «ideas» әр қорытуға керек: {sorted(ideas)} ≠ 1..{nd}")

    def der(m):
        i = int(m.group(1))
        body = m.group(0)
        idea = wrap(f'\n          <p class="mx-idea"><b>Идея:</b> {ideas[i]}</p>')
        g = re.search(r'<p><b>Мақсат:</b>.*?</p>', body, re.S)
        if g:
            return body[:g.end()] + idea + body[g.end():]
        j = body.index('<div class="math-derive-body">') + len('<div class="math-derive-body">')
        return body[:j] + idea + body[j:]
    page = re.sub(r'<details class="math-derive" id="d-(\d+)".*?</details>', der, page, flags=re.S)
    return page


def subjects(only=None):
    for i, s in enumerate(P.SUBJECTS):
        slug = s[1]
        if (SRC / slug).is_dir() and (only is None or slug == only):
            yield slug, P.STARTS[i], len(s[7])


def main():
    check = "--check" in sys.argv
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    bad, n = [], 0
    for slug, n0, cnt in subjects(args[0] if args else None):
        for k in range(1, cnt + 1):
            f = SRC / slug / f"e{k}.py"
            if not f.exists():
                continue
            name = f"{slug}/e{k}.py"
            E = check_easy(_exec(f, f"math_easy_{slug}_{k}").EASY, name)
            p = LECT / f"week-{n0 + k - 1}.html"
            old = p.read_text(encoding="utf-8")
            new = inject(old, E, name)
            n += 1
            if new != old:
                if check:
                    bad.append(p.name)
                else:
                    p.write_text(new, encoding="utf-8")
    if check:
        if bad:
            raise SystemExit(f"math_easy_inject: беттер ескірген {bad} - python3 tools/math_easy_inject.py іске қосыңыз")
        print(f"math_easy_inject: {n} сабақ сәйкес")
    else:
        print(f"math_easy_inject: {n} сабақ")


if __name__ == "__main__":
    main()
