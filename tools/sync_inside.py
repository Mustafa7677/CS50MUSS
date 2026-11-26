# © 2026 AO17 командасы. All Rights Reserved.
"""INSIDE TECH-ті AO17-ге қосу (синхрондау).

INSIDE TECH (github.com/Mustafa7677/3d-learning-) - AO17 командасының 3D оқу платформасы. Оның материалдары AO17-нің ішінде тұрады:
  1) academy/3d/app/ - 3D симуляциялардың статикалық нұсқасы (INSIDE TECH-тің өз build:artifact құралымен құрастырылады);
     шрифттер AO17-нің жергілікті шрифттеріне ауыстырылады (Google Fonts сұратылмайды), «AO17-ге оралу» батырмасы қосылады;
  2) tools/academy/data/inside_lessons.json - 160 сабақтың дәрістері, тесттері, болжамдары, мысалдары (tools/inside_extract.mjs);
     tools/academy/lab3d.py осыдан academy/3d/<зертхана>/<сабақ>.html лекция беттерін жасайды (tools/build.py кезінде);
  3) academy/3d/app/THIRD-PARTY-NOTICES.txt - бумаға кіретін кітапханалардың (React, three.js, ...) лицензия мәтіндері.
AO17 нұсқасында Ұстаз кейіпкері жоқ: құрастырудың алдында оның комикс жолдары баяндаушы (narrator) мәтініне айналады,
«Нұрай, Мустафа және Ұстаз» - «Нұрай мен Мустафа», Feynman чатындағы кеңесті Нұрай береді (strip_ustaz). Құрастырған соң
INSIDE TECH клоны бастапқы күйіне қайтарылады (git checkout), ал бумада «ұстаз» сөзі (кез келген регистрде, \\uXXXX түрінде де)
қалмағаны тексеріледі (has_ustaz).

Қолдану:  python3 tools/sync_inside.py /path/to/3d-learning-
Керек: node 22, pnpm (INSIDE TECH-тің packageManager нұсқасы). Сосын: python3 tools/build.py
"""
import json
import pathlib
import re
import shutil
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
APP = ROOT / "academy/3d/app"
DATA = ROOT / "tools/academy/data/inside_lessons.json"
BACK = ('<a class="ao17-back" href="../index.html" title="AO17 3D зертханалары: лекциялар">AO17 · 3D зертхана</a>'
        '<style>.ao17-back{position:fixed;left:12px;bottom:12px;z-index:2147483000;padding:7px 12px;border-radius:99px;background:#f2b705;color:#1b1510;'
        'font:700 12px/1.2 Inter,system-ui,sans-serif;text-decoration:none;box-shadow:0 6px 16px rgb(0 0 0 / .35)}'
        '.ao17-back:focus-visible{outline:3px solid #fff;outline-offset:2px}</style>')


def strip_ustaz(src):
    """AO17 нұсқасы үшін Ұстаз кейіпкерін алып тастау (INSIDE TECH клонының жұмыс көшірмесінде; соңында git checkout)."""
    files = [f for g in ("apps/web/src/**/*.ts", "apps/web/src/**/*.tsx", "packages/*/src/**/*.ts") for f in src.glob(g) if ".test." not in f.name]
    changed = []
    for f in files:
        s = f.read_text(encoding="utf-8")
        o = s
        if f.name == "Teach.tsx":   # «Мустафаға түсіндір»: тәлімгердің кеңесін Нұрай береді
            s = s.replace('<Face who={m.who === "ustaz" ? "ustaz" : "mustafa"}', '<Face who={m.who === "ustaz" ? "nuray" : "mustafa"}')
            s = s.replace('<b>{m.who === "ustaz" ? "Ұстаз" : "Мустафа"}</b>', '<b>{m.who === "ustaz" ? "Нұрай" : "Мустафа"}</b>')
        else:
            s = s.replace('who: "ustaz"', 'who: "narrator"')
            s = re.sub(r'with: \[([^\]]*)\]', lambda m: "with: [" + ", ".join(x for x in (y.strip() for y in m.group(1).split(",")) if x and x != '"ustaz"') + "]", s)
        s = s.replace("Нұрай, Мустафа және Ұстаз", "Нұрай мен Мустафа").replace("НҰРАЙ · МУСТАФА · ҰСТАЗ", "НҰРАЙ · МУСТАФА")
        s = s.replace(", Ұстаз?", "?")
        s = re.sub(r'"Ұстаз, (\w)', lambda m: '"' + m.group(1).upper(), s)
        s = s.replace('"Ұстаз <ustaz@insidetech.kz>"', '"Мұғалім <teacher@insidetech.kz>"')
        s = s.replace('ustaz: "Ұстаз",', 'ustaz: "",')
        s = s.replace("Ұстаз: келесі қадам", "Келесі қадам")
        s = s.replace('first.who === "narrator" ? "ustaz" : first.who', 'first.who === "narrator" ? "nuray" : first.who')
        if s != o:
            f.write_text(s, encoding="utf-8")
            changed.append(f.relative_to(src).as_posix())
    return changed


HEADER_FIX = """
/* AO17 нұсқасы (tools/sync_inside.py): 721-1440px енде тақырып бір қатарда қалады. Бұрын мәзір екі қатарға түсіп, биіктігі
   70px-тен 102px-ке өсетін де, беттің басын (104px шегіністі) жауып қалатын. Жасырылған сілтемелердің бәрі «Тағы» мәзірінде бар. */
@media (min-width: 721px) and (max-width: 1440px) {
  .menu { flex-wrap: nowrap; gap: 4px 16px; }
  .menuLink { font-size: 14px; white-space: nowrap; }
}
@media (min-width: 721px) and (max-width: 1380px) {
  .menu > a:nth-last-child(2) { display: none; }
}
@media (min-width: 721px) and (max-width: 1240px) {
  .menu > .wideOnly { display: none; }
}
"""


def ao17_patches(src):
    """AO17 нұсқасының INSIDE TECH-ке түзетулері (клонның жұмыс көшірмесінде; соңында git checkout)."""
    changed = []
    css = src / "apps/web/src/components/film/film.module.css"
    if css.exists() and "AO17 нұсқасы" not in css.read_text(encoding="utf-8"):
        css.write_text(css.read_text(encoding="utf-8") + HEADER_FIX, encoding="utf-8")
        changed.append(css.relative_to(src).as_posix())
    return changed


def has_ustaz(text):
    """Мәтінде (JS бумасындағы \\uXXXX түрін де ашып) кез келген регистрдегі «ұстаз» бар ма."""
    return "ұстаз" in re.sub(r"\\u([0-9a-fA-F]{4})", lambda m: chr(int(m.group(1), 16)), text).lower()


def run(cmd, cwd, env=None):
    import os
    print("$", " ".join(cmd))
    subprocess.run(cmd, cwd=cwd, check=True, env={**os.environ, **(env or {})})


def adapt_index(html):
    """INSIDE TECH-тің index.html-ін AO17 ішінде жұмыс істеуге бейімдеу."""
    html = re.sub(r'\s*<link rel="preconnect" href="https://fonts\.(googleapis|gstatic)\.com"[^>]*>', "", html)
    html = re.sub(r'\s*<link rel="stylesheet" href="https://fonts\.googleapis\.com/[^"]*">', "", html)
    html = html.replace("<title>INSIDE TECH</title>", "<title>3D зертхана · AO17 (INSIDE TECH)</title>", 1)
    head_add = ('\n<link rel="stylesheet" href="../../../assets/fonts/fonts.css">\n<meta name="robots" content="noindex">'
                '\n<style>:root{--font-body:"Inter",system-ui,sans-serif;--font-mono:"JetBrains Mono",ui-monospace,monospace}</style>\n')
    assert "</head>" in html and "</body>" in html
    html = html.replace("</head>", head_add + "</head>", 1)
    html = html.replace("</body>", BACK + "\n</body>", 1)
    assert "fonts.googleapis.com" not in html, "Google Fonts сілтемесі қалып қойды"
    return html


def notices(src):
    """Өндірістік тәуелділіктердің лицензия мәтіндері (бумаға кіретін кітапханалар осы тізімнің ішінде)."""
    raw = subprocess.run(["pnpm", "--filter", "@inside-tech/web", "licenses", "list", "--prod", "--json"], cwd=src, check=True,
                         capture_output=True, text=True).stdout
    data = json.loads(raw)
    rows = sorted(((p["name"], ", ".join(p.get("versions", [])), lic, p.get("paths", [""])[0]) for lic, ps in data.items() for p in ps), key=lambda r: r[0])
    out = ["AO17 · 3D зертхана (INSIDE TECH) - үшінші тарап кітапханаларының лицензиялары",
           "Бұл тізім INSIDE TECH веб-қолданбасының барлық өндірістік тәуелділіктерін қамтиды; app.js бумасына кіретін кітапханалар (React, three.js,",
           "@react-three/*, postprocessing т.б.) осы тізімнің ішінде. Әр кітапхана өз лицензиясымен таратылады.", ""]
    for name, ver, lic, path in rows:
        out.append("=" * 78)
        out.append(f"{name} {ver} - {lic}")
        txt = ""
        for fn in ("LICENSE", "LICENSE.md", "LICENSE.txt", "license", "LICENCE", "LICENSE-MIT"):
            fp = pathlib.Path(path) / fn
            if path and fp.is_file():
                txt = fp.read_text(encoding="utf-8", errors="replace").strip()
                break
        out.append(txt or f"(лицензия мәтіні пакетте жоқ; лицензия: {lic})")
    return "\n".join(out) + "\n"


def main():
    if len(sys.argv) != 2:
        print(__doc__)
        sys.exit(2)
    src = pathlib.Path(sys.argv[1]).resolve()
    web = src / "apps/web"
    run(["pnpm", "install", "--frozen-lockfile"], src)
    commit = subprocess.run(["git", "rev-parse", "HEAD"], cwd=src, capture_output=True, text=True, check=True).stdout.strip()
    changed = strip_ustaz(src)
    print("strip_ustaz:", len(changed), "файл")
    patched = ao17_patches(src)
    print("ao17_patches:", patched)
    changed += [f for f in patched if f not in changed]
    try:
        run(["pnpm", "--filter", "@inside-tech/web", "build:artifact"], src, {"FULL_HTML": "1"})
        DATA.parent.mkdir(parents=True, exist_ok=True)
        run(["node", str(ROOT / "tools/inside_extract.mjs"), str(src), str(DATA)], src)
    finally:
        if changed:
            subprocess.run(["git", "checkout", "--", *changed], cwd=src, check=True)   # клон бастапқы күйіне қайтады
    art = web / "dist-artifact"
    bundle = "".join((art / f).read_text(encoding="utf-8") for f in ("app.js", "ai-lab-worker.js", "index.html"))
    left = [n for n, t in (("бума (app.js, ai-lab-worker.js, index.html)", bundle), ("inside_lessons.json", DATA.read_text(encoding="utf-8"))) if has_ustaz(t)]
    if left:
        sys.exit(f"sync_inside: Ұстаз қалды: {left}")
    if APP.exists():
        shutil.rmtree(APP)
    APP.mkdir(parents=True)
    for f in ("app.js", "ai-lab-worker.js"):
        shutil.copy2(art / f, APP / f)
    (APP / "index.html").write_text(adapt_index((art / "index.html").read_text(encoding="utf-8")), encoding="utf-8")
    (APP / "THIRD-PARTY-NOTICES.txt").write_text(notices(src), encoding="utf-8")
    (APP / "SOURCE.json").write_text(json.dumps({"repo": "https://github.com/Mustafa7677/3d-learning-", "commit": commit,
                                                 "build": "FULL_HTML=1 pnpm --filter @inside-tech/web build:artifact",
                                                 "ao17": "Ұстаз кейіпкері алынған (strip_ustaz); тақырып 721-1440px-те бір қатарда (ao17_patches)"}, indent=1) + "\n", encoding="utf-8")
    print("sync_inside: дайын ->", APP.relative_to(ROOT), "және", DATA.relative_to(ROOT))


if __name__ == "__main__":
    main()
