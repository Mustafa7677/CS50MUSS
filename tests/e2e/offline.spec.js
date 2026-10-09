// Нағыз офлайн: бөлек сервермен service worker тіркеледі, сосын сервер тоқтатылады.
// (context.setOffline service worker-дің fetch-іне әсер етпейді, сондықтан серверді шынымен өшіреміз.)
const { test, expect } = require("@playwright/test");
const { spawn } = require("child_process");
const path = require("path");

test("офлайн: беттер кэштен қатесіз ашылады, белгісіз бет басты бетке түседі", async ({ browser }) => {
  test.setTimeout(120_000);
  const port = 4300 + Math.floor(Math.random() * 500);
  const srv = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1", "--directory", path.resolve(__dirname, "../..")], { stdio: "ignore" });
  try {
    const B = `http://127.0.0.1:${port}/`;
    for (let i = 0; i < 40; i++) { try { await fetch(B + "sw.js"); break; } catch (e) { await new Promise((r) => setTimeout(r, 150)); } }
    const c = await browser.newContext();
    await c.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.fulfill({ status: 200, body: "" }));
    const p = await c.newPage();
    const errs = [];
    p.on("pageerror", (e) => errs.push(`${p.url()}: ${e.message}`));
    await p.goto(B + "index.html");
    // localhost http-де main.js SW тіркемейді (тек https), сондықтан мұнда өзіміз тіркейміз
    await p.evaluate(async () => { await navigator.serviceWorker.register("sw.js"); await navigator.serviceWorker.ready; });
    await expect.poll(() => p.evaluate(async () => (await caches.keys()).length && (await (await caches.open((await caches.keys())[0])).keys()).length), { timeout: 30_000 }).toBeGreaterThan(40);
    srv.kill();
    await new Promise((r) => setTimeout(r, 500));
    for (const u of ["index.html", "lectures/week-3.html", "lectures/week-6.html", "alash.html", "practice.html", "profile.html", "glossary.html"]) {
      await p.goto(B + u);
      await expect(p.locator("h1").first()).toBeVisible();
    }
    await p.goto(B + "jok-bet.html");
    await expect(p.locator(".hero h1, h1").first()).toContainText("Информатикаға");
    expect(errs).toEqual([]);
    await c.close();
  } finally { srv.kill(); }
});
