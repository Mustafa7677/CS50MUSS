#!/usr/bin/env python3
# © 2026 Sagid Mustafa. All Rights Reserved.
"""Математика сабағының ағымы: теория мен формула → БІРДЕН шешілген мысал → тоқта, ойлан → қорытып шығару.

«Қадамдық шешілген мысалдар» бөлімі «Тоқта, ойлан» (ол жоқ болса «Қорытып шығару») алдына көшіріледі. Өту идемпотентті:
екінші рет іске қосқанда ештеңе өзгермейді. tools/build.py әр жинауда шақырады, сондықтан генераторлар бұрынғы ретпен
жазса да, сайттағы рет бірдей болады.

    python3 tools/math_reorder.py
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LEAD = '\n      <p class="mx-now">Теорияны бірден іске қосамыз: әр мысалда алдымен <b>не берілгенін</b>, сосын <b>қай формула не анықтама</b> қолданылатынын, соңында <b>неге дәл осылай</b> екенін көресіз. Қағаз бен қаламды алып, әр қадамды өзіңіз қайталаңыз.</p>'


def reorder(s):
    m = re.search(r'\n      (?:<!--\w+-->)?<h2 id="examples">.*?(?=\n      (?:<!--\w+-->)?<h2 id="mistakes">)', s, re.S)
    if not m:
        return s
    block = m.group(0)
    if 'class="mx-now"' not in block:
        block = block.replace("</h2>", "</h2>" + LEAD, 1)
    rest = s[:m.start()] + s[m.end():]
    anchor = re.search(r'\n      (?:<!--\w+-->)?<h2 id="(?:checks|derivations)">', rest)
    if not anchor:
        return s
    out = rest[:anchor.start()] + block + "\n" + rest[anchor.start():]
    return re.sub(r"\n{3,}", "\n\n", out)


def main():
    n = 0
    for p in sorted((ROOT / "math/lectures").glob("week-*.html")):
        s = p.read_text(encoding="utf-8")
        t = reorder(s)
        if t != s:
            p.write_text(t, encoding="utf-8")
            n += 1
    return n


if __name__ == "__main__":
    print("өзгерген сабақ:", main())
