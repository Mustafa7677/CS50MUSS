#!/usr/bin/env python3
# © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама (LICENSE-PROPRIETARY.md, COPYRIGHT.md).
# Harvard CS50 материалдары (олар осы файлда сақталмайды) CC BY-NC-SA 4.0 бойынша; үшінші тарап компоненттері өз лицензияларымен.
"""Лицензиялық аудит: licensing/components.json реестрін git-тегі барлық файлмен салыстырады,
COPYRIGHT.md мен licensing/LECTURE-AUDIT.md құрады.

  python3 tools/licence_audit.py          # құжаттарды қайта жазады
  python3 tools/licence_audit.py --check  # құжаттар өзгермесе және барлық файл реестрде болса ғана 0 қайтарады (CI)

Ереже: бірінші сәйкес келген компонент жеңеді. Реестрде жоқ файл - қате (сыныпталмаған материал қалмауы керек).
Бұл құрал заңды кеңес емес: статусы 'review' компоненттерге жаңа лицензия тағайындалмайды.
"""
import json, re, subprocess, sys
from collections import OrderedDict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REG = json.loads((ROOT / "licensing/components.json").read_text(encoding="utf-8"))
LIC = REG["licenses"]
CAT_NAME = {"A1": "A1 · Harvard CS50 түпнұсқасы", "A2": "A2 · Harvard материалының аудармасы/бейімдеуі", "B": "B · Sagid Mustafa-ның дербес әзірлемесі",
            "C": "C · Үшінші тарап", "R": "R · Тексеруді қажет етеді (лицензия тағайындалмаған)"}
STATUS = {"verified": "расталған", "declared": "иесі мәлімдеген", "review": "тексеру керек"}
COURSES = {"lectures": ("CS50x", "https://cs50.harvard.edu/x/"), "python": ("CS50P", "https://cs50.harvard.edu/python/"), "sql": ("CS50 SQL", "https://cs50.harvard.edu/sql/"),
           "ai": ("CS50 AI", "https://cs50.harvard.edu/ai/"), "web": ("CS50 Web", "https://cs50.harvard.edu/web/")}


def glob_re(p):
    out, i = "", 0
    while i < len(p):
        if p.startswith("**", i):
            out += ".*"; i += 2
        elif p[i] == "*":
            out += "[^/]*"; i += 1
        else:
            out += re.escape(p[i]); i += 1
    return re.compile("^" + out + "$")


COMPS = [(c, [glob_re(p) for p in c["paths"]]) for c in REG["components"]]


def tracked():
    out = subprocess.run(["git", "ls-files", "--cached", "--others", "--exclude-standard"], cwd=ROOT, capture_output=True, text=True, check=True).stdout.splitlines()
    return [f for f in out if (ROOT / f).exists()]


def classify(files):
    owner, unmatched = {}, []
    for f in files:
        for c, rx in COMPS:
            if any(r.match(f) for r in rx):
                owner[f] = c
                break
        else:
            unmatched.append(f)
    return owner, unmatched


def strip(s):
    s = re.sub(r"<(script|style|pre)\b.*?</\1>", " ", s, flags=re.S)
    s = re.sub(r"<[^>]+>", " ", s)
    return len(re.sub(r"\s+", " ", s).split())


def block_words(s, cls):
    """Берілген class-ты div блоктарындағы сөз саны (қарапайым, ішкі div теңдігімен)."""
    total = 0
    for m in re.finditer(r'<div class="%s[ "][^>]*>' % cls, s):
        depth, i = 1, m.end()
        for t in re.finditer(r"<(/?)div\b", s[i:]):
            depth += -1 if t.group(1) else 1
            if depth == 0:
                total += strip(s[i:i + t.start()])
                break
    return total


def lecture_rows(owner):
    rows = []
    for f, c in sorted(owner.items()):
        if not c["id"].startswith("A2-lectures"):
            continue
        s = (ROOT / f).read_text(encoding="utf-8")
        key = f.split("/")[0]
        course = COURSES[key][0] if key in COURSES else key
        src = re.search(r'class="source-link" href="([^"]+)"', s)
        note = re.search(r'<p class="translator-note">(.*?)</p>', s, re.S)
        third = ""
        if note:
            t = re.sub(r"<[^>]+>", "", note.group(1))
            m = re.search(r"(Сабақ басындағы[^.]*\.|Лекция басындағы[^.]*\.|Binky[^.]*\.|[^.]*сайттың өз мысалдары\.)", t)
            third = m.group(1).strip() if m else ""
        total = strip(s[s.find('<article'):s.find('</article>')]) if "<article" in s else strip(s)
        tasks, tw = len(re.findall(r'<div class="task[ "]', s)), block_words(s, "task")
        quiz = len(re.findall(r'class="question"', s))
        viz = len(re.findall(r'<div class="viz[ "]', s))
        grad = len(re.findall(r'class="(?:autograder|js-grader|sql-grader|answer-check)\b', s))
        rows.append(dict(path=f, course=course, src=src.group(1) if src else "", total=total, tasks=tasks, task_words=tw, quiz=quiz, viz=viz, grad=grad, third=third))
    return rows


def md_escape(s):
    return s.replace("|", "\\|")


def write_copyright(owner, rows):
    by = OrderedDict()
    for c in REG["components"]:
        by[c["id"]] = [f for f, o in owner.items() if o["id"] == c["id"]]
    L = []
    L.append("# COPYRIGHT.md: авторлық құқықтар тізілімі\n")
    L.append("Бұл файл `tools/licence_audit.py` арқылы `licensing/components.json` реестрінен автоматты құрылады. Қолмен өңдемеңіз: реестрді өзгертіп, құралды қайта іске қосыңыз.\n")
    L.append("**Бұл құжат заңды кеңес емес.** Статусы «иесі мәлімдеген» компоненттер бойынша авторлық құқық иесі өзі жауап береді, «тексеру керек» компоненттерге жаңа лицензия тағайындалмаған. Тәртіп: [LICENSE.md](LICENSE.md).\n")
    L.append("Негізгі қағида: Harvard CS50 материалдары мен олардың аудармалары/бейімдеулері - **CC BY-NC-SA 4.0** ([LICENSE-HARVARD.md](LICENSE-HARVARD.md)); Sagid Mustafa-ның дербес әзірлемелері - **All Rights Reserved** ([LICENSE-PROPRIETARY.md](LICENSE-PROPRIETARY.md)); үшінші тарап компоненттері - өз лицензиясымен ([THIRD-PARTY-LICENSES.md](THIRD-PARTY-LICENSES.md)). Бұрын CC BY-NC-SA 4.0 бойынша жарияланған нұсқаларға берілген құқықтар жойылмайды.\n")
    counts = {}
    for c in REG["components"]:
        counts[c["cat"]] = counts.get(c["cat"], 0) + len(by[c["id"]])
    L.append("## 1. Қысқаша\n")
    L.append("| Санат | Файл саны |\n|---|---|")
    for k in ["A1", "A2", "B", "C", "R"]:
        L.append(f"| {CAT_NAME[k]} | {counts.get(k, 0)} |")
    L.append("")
    L.append("## 2. Компоненттер кестесі\n")
    L.append("| Файл / жол | Компонент | Құқық иесі | Лицензия | Статус |\n|---|---|---|---|---|")
    for c in REG["components"]:
        paths = "<br>".join(f"`{p}`" for p in c["paths"])
        lic = LIC.get(c["license"], c["license"])
        L.append(f"| {paths} | **{c['id']}** {md_escape(c['name'])} ({len(by[c['id']])} файл) | {md_escape(c['holder'])} | {md_escape(lic)} | {STATUS[c['status']]} |")
    L.append("")
    L.append("### Ескертулер\n")
    for c in REG["components"]:
        if c.get("note"):
            L.append(f"- **{c['id']}**: {c['note']}")
    L.append("")
    L.append("## 3. 45 лекция\n")
    L.append("Әр лекцияның негізгі мәтіні мен код мысалдары - Harvard материалының аудармасы/бейімдеуі (**CC BY-NC-SA 4.0**; түпнұсқа авторлары: Harvard University / CS50, аудармашы: Sagid Mustafa). Бетке енгізілген жаттығулар мен тесттер (R-quiz, R-checks), интерактивті кодтың бағдарламасы (B-code-trainer, B-platform) жеке жазбаларда көрсетілген. Толық есептік кесте: [licensing/LECTURE-AUDIT.md](licensing/LECTURE-AUDIT.md).\n")
    L.append("| Файл | Курс | Түпнұсқа | Лицензия (негізгі мәтін) |\n|---|---|---|---|")
    for r in rows:
        L.append(f"| `{r['path']}` | {r['course']} | {r['src'] or '-'} | CC BY-NC-SA 4.0 |")
    L.append(f"\nБарлығы: **{len(rows)}** лекция.\n")
    (ROOT / "COPYRIGHT.md").write_text("\n".join(L) + "\n", encoding="utf-8")


def write_lecture_audit(rows):
    L = ["# Лекциялар аудиті (45 лекция)\n",
         "`tools/licence_audit.py` автоматты құрады. Сөз саны HTML-ден есептелген; код блоктары (`<pre>`) есепке кірмейді. Бұл эвристика, заңды қорытынды емес.\n",
         "Әр лекцияда: **A** - Harvard материалының аудармасы/бейімдеуі (CC BY-NC-SA 4.0); **R** - бетке енгізілген жаттығулар мен тесттердің мазмұны (тәуелсіздігі расталмаған, жаңа лицензия тағайындалмаған); **B** - интерактивті құралдардың бағдарламалық коды (`assets/js/*.js`, All Rights Reserved) және сайт дизайны.\n",
         "| Лекция | Курс | Негізгі мәтін (сөз) | Жаттығу блоктары | Олардың сөзі | Тест сұрағы | Визуализация | Автотексеру | Үшінші тарап ескертпесі | Түпнұсқа |",
         "|---|---|---|---|---|---|---|---|---|---|"]
    tot = dict(total=0, tasks=0, task_words=0, quiz=0, viz=0, grad=0)
    for r in rows:
        for k in tot:
            tot[k] += r[k]
        L.append(f"| `{r['path']}` | {r['course']} | {r['total']} | {r['tasks']} | {r['task_words']} | {r['quiz']} | {r['viz']} | {r['grad']} | {md_escape(r['third']) or '-'} | {r['src'] or '-'} |")
    L.append(f"| **Барлығы {len(rows)}** | | {tot['total']} | {tot['tasks']} | {tot['task_words']} | {tot['quiz']} | {tot['viz']} | {tot['grad']} | | |")
    L.append("\n## Қорытынды\n")
    share = round(100 * tot["task_words"] / max(1, tot["total"]), 1)
    L.append(f"- Жаттығу блоктарының сөзі барлық мақала сөзінің шамамен **{share}%**. Қалғаны - Harvard лекциясының аудармасы мен бейімдеуі.")
    L.append("- Жаттығулар мен тесттердің дербес екенін сайт иесі дәлелдегенше (қолжазба, жасалу тарихы, түпнұсқамен салыстыру) оларға All Rights Reserved тағайындалмайды: олар лекция контексіне тікелей байланысты.")
    L.append("- Дербес деп мойындалған жаттығуларды көшіру: `licensing/components.json`-ға жеке жазба қосып, санатын B-ға ауыстыру, содан кейін `python3 tools/licence_audit.py` іске қосу.")
    (ROOT / "licensing/LECTURE-AUDIT.md").write_text("\n".join(L) + "\n", encoding="utf-8")


def main():
    files = tracked()
    owner, unmatched = classify(files)
    if unmatched:
        print("РЕЕСТРДЕ ЖОҚ файлдар (сыныпталмаған материал қалмауы керек):")
        for f in unmatched:
            print("  ", f)
    rows = lecture_rows(owner)
    if len(rows) != 45:
        print(f"ҚАТЕ: 45 лекция күтілген, табылғаны {len(rows)}")
        sys.exit(1)
    before = {p: (ROOT / p).read_text(encoding="utf-8") if (ROOT / p).exists() else "" for p in ("COPYRIGHT.md", "licensing/LECTURE-AUDIT.md")}
    write_copyright(owner, rows)
    write_lecture_audit(rows)
    changed = [p for p in before if (ROOT / p).read_text(encoding="utf-8") != before[p]]
    n = {c["id"]: sum(1 for o in owner.values() if o["id"] == c["id"]) for c in REG["components"]}
    empty = [k for k, v in n.items() if v == 0]
    if empty:
        print("Файлсыз компоненттер (жолдарын тексеріңіз):", ", ".join(empty))
    print(f"файл: {len(files)}, сыныпталған: {len(owner)}, сыныпталмаған: {len(unmatched)}, лекция: {len(rows)}")
    if "--check" in sys.argv and (unmatched or changed):
        print("ҚАТЕ: " + ("сыныпталмаған файлдар бар. " if unmatched else "") + ("құжаттар ескірген: " + ", ".join(changed) if changed else ""))
        sys.exit(1)


if __name__ == "__main__":
    main()
