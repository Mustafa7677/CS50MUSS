#!/usr/bin/env python3
# © 2026 AO17 командасы. All Rights Reserved.
"""AO17 фильмдерінің кадрлары: Афишадағы (posters.html) фильм карточкаларының суреті.

Әр фильмнің ең танымал сахнасы таңдалған (FILMS: фильм, бет, сахнаның нөмірі). Кадр сахнаның ортасынан алынады
(CH[k] + 0.55 · ұзақтығы), қозғалыс азайтылған режимде (өтпелі әсерсіз) және фильмнің интерфейсінсіз (батырмалар,
шкала, логотип). Фильмдердің қозғалтқышы window.AO17Film.seek(t) береді (film/src/engine.js).

    python3 tools/make_film_stills.py
      assets/img/posters/films/<фильм>.jpg   (640×360)
Chromium басқа жерде болса: PW_CHROMIUM=/path/to/chrome python3 tools/make_film_stills.py
"""
import json
import os
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets/img/posters/films"
# (фильм, бет, сахна): ашылу сөзі, жұлдыздар графы, чип, шаңырақ, кітаптар мен терезе, дыбыс толқыны, теңдеу-таразы.
# «Шақыру» фильмінің мұрағат суреттері үшінші тараптікі (licensing: C-film-media), сондықтан оның кадры - суретсіз ашылу сахнасы.
FILMS = [("alash", "film/index.html", 0), ("cs", "film/cs/index.html", 2), ("code", "film/code/index.html", 2),
         ("math", "film/math/index.html", 0), ("en", "film/en/index.html", 1), ("ielts", "film/ielts/index.html", 0),
         ("sat", "film/sat/index.html", 0)]

RENDER = """
const { chromium } = require("playwright");
(async () => {
  const jobs = JSON.parse(require("fs").readFileSync(process.argv[2], "utf8"));
  const b = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
  const c = await b.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 0.5, reducedMotion: "reduce" });
  for (const j of jobs) {
    const p = await c.newPage();
    await p.goto(j.src);
    await p.waitForFunction(() => window.AO17Film && window.AO17Film.END > 0);
    await p.evaluate(() => document.fonts.ready);
    await p.addStyleTag({ content: ".top, #ui, #hint, #skipLink { display: none !important; }" });
    await p.evaluate((k) => { const F = window.AO17Film, CH = F.CH.concat([F.END]); F.seek(CH[k] + 0.55 * (CH[k + 1] - CH[k])); }, j.scene);
    await p.waitForTimeout(1200);
    await p.screenshot({ path: j.out, type: "jpeg", quality: 80 });
    await p.close();
  }
  await b.close();
})();
"""


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    jobs = [{"src": (ROOT / page).as_uri(), "out": str(OUT / f"{fid}.jpg"), "scene": k} for fid, page, k in FILMS]
    with tempfile.TemporaryDirectory() as tmp:
        jf, js = Path(tmp) / "jobs.json", Path(tmp) / "render.js"
        jf.write_text(json.dumps(jobs), encoding="utf8")
        js.write_text(RENDER, encoding="utf8")
        subprocess.run(["node", str(js), str(jf)], check=True, cwd=ROOT / "tests", env={**os.environ})
    for fid, _, _ in FILMS:
        print(fid, f'{(OUT / f"{fid}.jpg").stat().st_size // 1024} КБ')


if __name__ == "__main__":
    main()
