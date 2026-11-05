# © 2026 Sagid Mustafa. All Rights Reserved.
"""Курстардың лекцияларына AO17 интерактивті модельдеріне (academy/models.html) апаратын блок қояды.

Модельдердің өзі AO17 авторлық жұмысы (B санаты) - аударма беттерге (A санаты) тек СІЛТЕМЕ қойылады, код кірістірілмейді.
Блок <!-- aov:links --> ... <!-- /aov:links --> белгілері арасында тұрады, сондықтан қайта іске қосу нәтижені өзгертпейді.
tools/build.py-дан шақырылады.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

NAMES = {
    "graph": "Граф алгоритмдері (BFS, DFS, Дейкстра)", "pyx": "Code X-Ray: Python кодының орындалуы", "cpu": "Оқу процессоры (Virtual Computer)",
    "mem": "C жады: стек, үйме, көрсеткіш", "func": "Функция түрлендірулері", "gd": "Градиенттік түсу", "nn": "Нейрондық желіні оқыту",
    "sort": "Сұрыптау алгоритмдері", "bst": "Екілік іздеу ағашы", "heap": "Үйме (heap)", "hash": "Хэш-кесте", "matrix": "Матрица - жазықтықтың түрлендіруі",
    "prob": "Үлкен сандар заңы", "logic": "Логикалық схема", "dtree": "Шешім ағашы", "kmeans": "k-means кластерлеу", "linreg": "Сызықтық регрессия",
    "sched": "Процесстерді жоспарлау", "tcp": "TCP байланысы", "compiler": "Компилятор: лексер → парсер",
}

LINKS = {
    "lectures/week-3.html": ["sort", "bst"], "lectures/week-4.html": ["mem", "cpu"], "lectures/week-5.html": ["hash", "bst", "heap"],
    "lectures/week-1.html": ["compiler", "cpu"],
    "python/lectures/week-0.html": ["pyx"], "python/lectures/week-2.html": ["pyx"],
    "cpp/lectures/week-3.html": ["mem"], "cpp/lectures/week-6.html": ["sort", "heap", "hash"],
    "ai/lectures/week-0.html": ["graph"], "ai/lectures/week-2.html": ["prob"], "ai/lectures/week-3.html": ["gd"],
    "ai/lectures/week-4.html": ["dtree", "kmeans", "linreg"], "ai/lectures/week-5.html": ["nn", "gd"],
    "math/lectures/week-0.html": ["func"], "math/lectures/week-10.html": ["matrix"], "math/lectures/week-12.html": ["matrix"], "math/lectures/week-13.html": ["matrix"],
    "math/lectures/week-81.html": ["prob"], "math/lectures/week-90.html": ["linreg"], "math/lectures/week-97.html": ["graph", "bst"],
    "math/lectures/week-98.html": ["logic"], "math/lectures/week-108.html": ["gd"],
}
START, END = "<!-- aov:links -->", "<!-- /aov:links -->"


def block(rel, keys):
    pre = "../" * rel.count("/")
    items = "".join(f'<li><a href="{pre}academy/models.html#v-{k}">{NAMES[k]}</a></li>' for k in keys)
    return (f'{START}\n      <aside class="callout tip aov-links" aria-label="AO17 интерактивті модельдері">'
            f'<span class="callout-title">Өзің басқарып көр: AO17 интерактивті модельдері</span>'
            f'<p>Осы тақырыптың нақты есептейтін моделі: іске қосып, қадамдап жүріп, параметрлерді өзгертіңіз.</p><ul>{items}</ul></aside>\n      {END}')


def apply():
    changed = 0
    for rel, keys in LINKS.items():
        fp = ROOT / rel
        if not fp.exists():
            continue
        t = fp.read_text(encoding="utf-8")
        new = block(rel, keys)
        if START in t:   # бұрынғы блокты алып, орнын қайта таңдаймыз
            a, b = t.index(START), t.index(END) + len(END)
            t = t[:a].rstrip() + "\n" + t[b:].lstrip("\n ")
        if '<nav class="pager">' in t:   # «Алдыңғы/Келесі» навигациясының алдына - лекцияның соңғы мазмұны
            i = t.rindex('<nav class="pager">')
            t2 = t[:i] + new + "\n\n      " + t[i:]
        elif "</article>" in t:
            i = t.rindex("</article>")
            t2 = t[:i] + new + "\n    " + t[i:]
        else:
            continue
        if t2 != fp.read_text(encoding="utf-8"):
            fp.write_text(t2, encoding="utf-8")
            changed += 1
    return changed


if __name__ == "__main__":
    print("aov links:", apply())
