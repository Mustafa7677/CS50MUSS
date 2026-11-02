#!/usr/bin/env python3
# © 2026 Sagid Mustafa. All Rights Reserved.
"""C++ және Java лекциялары: код мысалының ДӘЛ АСТЫНА жеке талдау енгізеді.

Әр код блогына (лекциядағы реті бойынша нөмір, 0-ден) tools/code_fx/<тіл>_<апта>.py ішіндегі
CX[нөмір] = dict(lines=[(кодтағы үзінді, түсіндірме), ...], out="...", err="...", inp="...") беріледі:
  Жолма-жол  - әр маңызды жол не өрнек, кодтағы дәл үзіндісімен;
  Нәтижесі   - out берілсе: бағдарлама ШЫНЫМЕН компиляцияланып, іске қосылады; терминалға нақты шығыс жазылады,
               ал out - сол шығыстың неге солай екенін түсіндіреді (inp - стандарт кіріс);
  Жиі қате   - осы мысалға тән қате және оның белгісі.

Тексерулер (бірі бұзылса - қате, бет өзгермейді):
  - әр үзінді сол блоктың кодында дәл бар (кодты өзгертсек, талдау ескірмейді);
  - out бар блок компиляцияланып, қатесіз аяқталады; шығыс tools/code_fx/_outputs.json-ға сақталады
    (компилятор жоқ машинада сақталған шығыс қолданылады, код өзгерсе - қате);
  - бір түсіндірме мәтіні екі жерде қайталанбайды.
Өту идемпотентті. Прогресс: docs/CODE-FX-PROGRESS.md.

    python3 tools/code_fx.py        # build.py да шақырады
"""
import hashlib
import html
import importlib.util
import json
import os
import re
import shutil
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "tools/code_fx"
CACHE = SRC / "_outputs.json"
OLD = re.compile(r'\n      <div class="cx-fx"[^>]*>.*?<!--/cx-fx-->', re.S)


def load():
    fx = {}
    for f in sorted(SRC.glob("*.py")):
        spec = importlib.util.spec_from_file_location("cx_" + f.stem, f)
        m = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(m)
        lang, week = f.stem.split("_")
        fx[(lang, int(week))] = m.CX
    return fx


def code_of(raw):
    return html.unescape(re.sub(r"<[^>]+>", "", raw))


def run(lang, code, inp, cache):
    key = hashlib.sha1((lang + "\0" + code + "\0" + inp).encode()).hexdigest()
    tool = "g++" if lang == "cpp" else "javac"
    if not shutil.which(tool):
        if key not in cache:
            raise SystemExit(f"{tool} жоқ және шығыс сақталмаған (код өзгерген)")
        return cache[key], key
    with tempfile.TemporaryDirectory() as d:
        env = dict(os.environ, JAVA_TOOL_OPTIONS="")
        if lang == "cpp":
            src = Path(d, "main.cpp")
            src.write_text(code, encoding="utf-8")
            r = subprocess.run(["g++", "-std=c++17", "-Wall", "-Wextra", "-o", str(Path(d, "main")), str(src)], capture_output=True, text=True)
            if r.returncode:
                raise SystemExit("компиляция қатесі:\n" + r.stderr[:2000])
            cmd = [str(Path(d, "main"))]
        else:
            name = (re.search(r"public\s+(?:final\s+)?class\s+(\w+)", code) or re.search(r"class\s+(\w+)", code)).group(1)
            src = Path(d, name + ".java")
            src.write_text(code, encoding="utf-8")
            r = subprocess.run(["javac", "-encoding", "UTF-8", "-d", d, str(src)], capture_output=True, text=True, env=env)
            if r.returncode:
                raise SystemExit("компиляция қатесі:\n" + r.stderr[:2000])
            cmd = ["java", "-Dfile.encoding=UTF-8", "-Dstdout.encoding=UTF-8", "-cp", d, name]
        p = subprocess.run(cmd, input=inp, capture_output=True, text=True, timeout=20, env=env)
        out = p.stdout
        if p.returncode not in (0,):
            raise SystemExit(f"бағдарлама {p.returncode} кодымен аяқталды:\n{p.stderr[:800]}")
    return out, key


def block(lang, i, d, out, inp, has_term, code):
    lines = "".join(f'<li><code>{html.escape(a)}</code> - {b}</li>' for a, b in sorted(d["lines"], key=lambda ab: code.find(ab[0])))
    parts = [f'\n        <div class="cx-part cx-lines"><span class="cx-k">Жолма-жол</span><ol>{lines}</ol></div>']
    if "out" in d:
        cmd = "$ ./main" if lang == "cpp" else "$ java " + (re.search(r"public\s+(?:final\s+)?class\s+(\w+)", code) or re.search(r"class\s+(\w+)", code)).group(1)
        term = html.escape(cmd + "\n" + (f"(кіріс: {inp.strip()})\n" if inp else "") + out.rstrip("\n"))
        if has_term:  # лекцияда шығыс бар: оны қайталамай, неге солай екенін түсіндіреміз (код бәрібір іске қосылып тексерілді)
            parts.append(f'\n        <div class="cx-part cx-out"><span class="cx-k">Нәтиже неге осындай</span><p>{d["out"]}</p></div>')
        else:
            parts.append(f'\n        <div class="cx-part cx-out"><span class="cx-k">Нәтижесі (шын іске қосылды)</span>'
                         f'<pre class="terminal"><code class="language-plaintext">{term}</code></pre><p>{d["out"]}</p></div>')
    if d.get("err"):
        parts.append(f'\n        <div class="cx-part cx-err"><span class="cx-k">Жиі қате</span><p>{d["err"]}</p></div>')
    return f'\n      <div class="cx-fx" id="cx-{i}" aria-label="Код {i + 1}: талдау">{"".join(parts)}\n      </div><!--/cx-fx-->'


def main():
    fx = load()
    cache = json.loads(CACHE.read_text(encoding="utf-8")) if CACHE.exists() else {}
    used = {}
    seen = set()
    rows = []
    total_blocks = done_blocks = 0
    for lang in ("cpp", "java"):
        for f in sorted((ROOT / lang / "lectures").glob("week-*.html"), key=lambda p: int(p.stem.split("-")[1])):
            n = int(f.stem.split("-")[1])
            s = OLD.sub("", f.read_text(encoding="utf-8"))
            pat = re.compile(r'<pre data-lang="%s"><code[^>]*>(.*?)</code></pre>' % lang, re.S)
            ms = list(pat.finditer(s))
            items = fx.get((lang, n), {})
            total_blocks += len(ms)
            for i in items:
                if i >= len(ms):
                    raise SystemExit(f"{lang} week-{n}: {i}-блок жоқ (барлығы {len(ms)})")
            out_s, pos = [], 0
            for i, m in enumerate(ms):
                if i not in items:
                    continue
                d = items[i]
                code = code_of(m.group(1))
                for a, b in d["lines"]:
                    if a not in code:
                        raise SystemExit(f"{lang} week-{n} блок {i}: «{a}» кодта жоқ")
                    for t in (b,):
                        if len(t) > 40 and t in seen:
                            raise SystemExit(f"{lang} week-{n} блок {i}: мәтін қайталанды: {t[:60]}")
                        seen.add(t)
                for k in ("out", "err"):
                    if d.get(k):
                        if d[k] in seen:
                            raise SystemExit(f"{lang} week-{n} блок {i}: «{k}» мәтіні қайталанды")
                        seen.add(d[k])
                output = ""
                if "out" in d:
                    output, key = run(lang, code, d.get("inp", ""), cache)
                    used[key] = output
                    for must in d.get("expect", []):
                        if must not in output:
                            raise SystemExit(f"{lang} week-{n} блок {i}: шығыста «{must}» жоқ:\n{output}")
                # блоктан кейінгі терминал блоктарынан соң қоямыз
                end = m.end()
                tail = re.match(r'(\s*<pre class="terminal"><code[^>]*>.*?</code></pre>)*', s[end:], re.S)
                end += tail.end()
                out_s.append(s[pos:end])
                out_s.append(block(lang, i, d, output, d.get("inp", ""), tail.end() > 0, code))
                pos = end
                done_blocks += 1
            out_s.append(s[pos:])
            new = "".join(out_s)
            if new != f.read_text(encoding="utf-8"):
                f.write_text(new, encoding="utf-8")
            rows.append((lang, n, len(ms), len(items)))
    CACHE.write_text(json.dumps(dict(sorted(used.items())), ensure_ascii=False, indent=0), encoding="utf-8")
    lines = ["# C++ және Java: код мысалдарының жеке талдауы - орындалу барысы", "",
             "Әр талданған код мысалының астында: «Жолма-жол» (кодтағы дәл үзінділермен), «Нәтижесі» (бағдарлама шынымен компиляцияланып, іске қосылған шығыс), «Жиі қате».", "",
             f"- Код мысалы барлығы: **{total_blocks}**; жеке талдау қосылғаны: **{done_blocks}**", "",
             "| Курс | Лекция | Код мысалы | Талданды |", "|---|---|---|---|"]
    lines += [f"| {'C++' if l == 'cpp' else 'Java'} | week-{n} | {a} | {b} |" for l, n, a, b in rows]
    (ROOT / "docs/CODE-FX-PROGRESS.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"код талдауы: {done_blocks}/{total_blocks}")


if __name__ == "__main__":
    main()
