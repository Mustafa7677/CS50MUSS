"""CS50 курстарының ресми конспектілері (notes) мен тапсырмаларын (problem sets) жүктейді.

GitHub Actions-та іске қосылады (әзірлеу ортасынан cs50.harvard.edu бұғатталған).
Нәтиже: sources/<курс>/notes/<N>.md және sources/<курс>/psets/<N>/<тапсырма>.md - аудармаға арналған түпнұсқа мәтін.
Лицензия: CS50 материалдары CC BY-NC-SA 4.0 (David J. Malan, Harvard University).
"""
import re, sys, time, urllib.request, urllib.error, urllib.parse
from pathlib import Path
from bs4 import BeautifulSoup
import html2text

ROOT = Path(__file__).resolve().parent.parent
UA = {"User-Agent": "CS50-kazakh-translation/1.0 (https://github.com/Mustafa7677/CS50MUSS)"}
COURSES = sys.argv[1:] or ["python", "sql", "ai", "web"]


def get(url):
    for attempt in range(4):
        time.sleep(0.7)
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
                return r.geturl(), r.read().decode("utf-8", "replace")
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None, None
            if attempt == 3:
                raise
            time.sleep(3 * (attempt + 1))


def to_md(html, base):
    soup = BeautifulSoup(html, "html.parser")
    main = soup.select_one("main") or soup.select_one("#content") or soup.body
    for bad in main.select("script, style, nav, .d-print-none, #search"):
        bad.decompose()
    # Салыстырмалы сілтемелер мен суреттерді толық мекенжайға айналдырамыз
    for tag, attr in (("a", "href"), ("img", "src")):
        for el in main.select(f"{tag}[{attr}]"):
            el[attr] = urllib.parse.urljoin(base, el[attr])
    h = html2text.HTML2Text()
    h.body_width = 0
    return h.handle(str(main)).strip() + "\n"


def main():
    total = 0
    for course in COURSES:
        out = ROOT / "sources" / course
        (out / "notes").mkdir(parents=True, exist_ok=True)
        for n in range(0, 15):
            url, html = get(f"https://cs50.harvard.edu/{course}/notes/{n}/")
            if not html:
                break
            (out / "notes" / f"{n}.md").write_text(f"<!-- {url} -->\n" + to_md(html, url), encoding="utf-8")
            total += 1
            print(f"✓ {course} notes {n}")
            # Тапсырмалар: CS50P/SQL - psets, AI/Web - projects
            for kind in ("psets", "projects"):
                purl, phtml = get(f"https://cs50.harvard.edu/{course}/{kind}/{n}/")
                if phtml:
                    break
            if not phtml:
                continue
            pdir = out / "psets" / str(n)
            pdir.mkdir(parents=True, exist_ok=True)
            (pdir / "index.md").write_text(f"<!-- {purl} -->\n" + to_md(phtml, purl), encoding="utf-8")
            soup = BeautifulSoup(phtml, "html.parser")
            main_el = soup.select_one("main") or soup
            links = set()
            for a in main_el.select("a[href]"):
                u = urllib.parse.urljoin(purl, a["href"])
                m = re.match(rf"https://cs50\.harvard\.edu/{course}/(?:\d{{4}}/)?{kind}/{n}/([a-z0-9_-]+)/?$", u)
                if m:
                    links.add(m.group(1))
            for slug in sorted(links):
                u, h = get(f"https://cs50.harvard.edu/{course}/{kind}/{n}/{slug}/")
                if h:
                    (pdir / f"{slug}.md").write_text(f"<!-- {u} -->\n" + to_md(h, u), encoding="utf-8")
                    total += 1
                    print(f"  ✓ {kind} {n}/{slug}")
        (out / "README.md").write_text(
            f"# CS50 {course}: түпнұсқа мәтін\n\nАудармаға арналған. Дереккөз: https://cs50.harvard.edu/{course}/\n"
            "Авторы: David J. Malan, Harvard University. Лицензия: CC BY-NC-SA 4.0.\n", encoding="utf-8")
    print(f"{total} файл")
    return 0 if total else 1


if __name__ == "__main__":
    sys.exit(main())
