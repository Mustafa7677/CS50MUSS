#!/usr/bin/env python3
# © 2026 AO17 командасы. All Rights Reserved.
"""3D хабқа (academy/3d/index.html) INSIDE TECH бөлімдерінің скриншоттары: academy/3d/shots/<атауы>.jpg, 560×350.

3D қолданба (academy/3d/app/) жергілікті серверде ашылады, әр маршрут 1280×800 терезеде түсіріледі де 560×350-ге
кішірейеді. Деректер бос: жаңа келген оқушы көретін түр. Маршруттар: tools/academy/inside_catalog.py (басты бет,
ойындар, комикстер, құралдар, мамандық) және 11 зертхананың беті (lab-<id>.jpg). tools/sync_inside.py-дан кейін:

    python3 tools/inside_shots.py            # Chromium басқа жерде болса: PW_CHROMIUM=/path/to/chrome
"""
import functools
import http.server
import json
import os
import socketserver
import subprocess
import sys
import tempfile
import threading
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "academy/3d/shots"
sys.path.insert(0, str(ROOT / "tools/academy"))
import inside_catalog as IC  # noqa: E402
import lab3d as L3  # noqa: E402

RENDER = """
const { chromium } = require("playwright");
(async () => {
  const jobs = JSON.parse(require("fs").readFileSync(process.argv[2], "utf8"));
  const b = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
  const c = await b.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 0.4375, reducedMotion: "reduce" });
  const bad = [];
  for (const j of jobs) {
    const p = await c.newPage();
    p.on("pageerror", (e) => bad.push(j.name + ": " + e.message));
    await p.goto(j.url);
    await p.addStyleTag({ content: ".ao17-back{display:none!important}" });
    await p.waitForTimeout(j.wait);
    await p.screenshot({ path: j.out, type: "jpeg", quality: 80 });
    await p.close();
  }
  await b.close();
  if (bad.length) { console.error(bad.join("\\n")); process.exit(1); }
})();
"""


class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    httpd = socketserver.TCPServer(("127.0.0.1", 0), functools.partial(Quiet, directory=str(ROOT)))
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{httpd.server_address[1]}/academy/3d/app/index.html"
    shots = IC.SHOTS + [(f"lab-{lab['id']}", lab["id"]) for lab in L3.data()[0]]
    jobs = [{"name": n, "url": base + (f"#{r}" if r else ""), "out": str(OUT / f"{n}.jpg"), "wait": 3000 if not r else 1800} for n, r in shots]
    try:
        with tempfile.TemporaryDirectory() as tmp:
            jf, js = Path(tmp) / "jobs.json", Path(tmp) / "render.js"
            jf.write_text(json.dumps(jobs), encoding="utf8")
            js.write_text(RENDER, encoding="utf8")
            subprocess.run(["node", str(js), str(jf)], check=True, cwd=ROOT / "tests", env={**os.environ})
    finally:
        httpd.shutdown()
    names = {f"{n}.jpg" for n, _ in shots}
    for old in OUT.glob("*.jpg"):   # каталогтан шыққан бөлімнің ескі суреті қалмасын
        if old.name not in names:
            old.unlink()
    total = sum((OUT / n).stat().st_size for n in names)
    print(f"inside_shots: {len(names)} сурет, {total // 1024} КБ -> {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
