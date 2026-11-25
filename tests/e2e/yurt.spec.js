// © 2026 AO17 командасы. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md.
// «Менің шаңырағым» (yurt.html, assets/js/yurt.js): прогресс қазақ үйіне айналады.
// Тексереміз: бос прогресс, нақты деректен кезең мен серия, академия бөліктері, сурет (canvas) бос емес және кезеңмен өзгереді,
// көрсетілім режимінде бөлісу өшеді, бөлісу фолбэгі сурет жүктейді, кабинеттен сілтеме, 360px-те жылжу жоқ және axe таза.
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const { blockFonts, collectErrors } = require("../support/helpers");
const AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");

// canvas пиксельдерінің қысқа саусақ ізі: суреттің өзгергенін салыстыру үшін
const fingerprint = (p) => p.evaluate(() => {
  const cv = document.getElementById("yurt-cv"), c = document.createElement("canvas"); c.width = 54; c.height = 68;
  const x = c.getContext("2d"); x.drawImage(cv, 0, 0, 54, 68); const d = x.getImageData(0, 0, 54, 68).data; let s = 0, nz = 0;
  for (let i = 0; i < d.length; i += 4) { s = (s * 31 + d[i] + d[i + 1] * 3 + d[i + 2] * 7) >>> 0; if (d[i] + d[i + 1] + d[i + 2] > 60) nz++; }
  return { hash: s, lit: nz };
});

const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

test("бос прогресс: «Орын таңдалды», 0 әрекет, сурет салынған", async ({ browser }) => {
  const c = await browser.newContext({ reducedMotion: "reduce" });
  await blockFonts(c);
  const p = await c.newPage(); const errors = collectErrors(p);
  await p.goto("yurt.html");
  await expect(p.locator("#yurt-stage")).toHaveText("Орын таңдалды");
  await expect(p.locator("#yurt-total")).toHaveText("0");
  await expect(p.locator("#yurt-streak")).toHaveText("0");
  await expect(p.locator("#yurt-light")).toContainText("Шаңырақ тыныш");
  expect((await fingerprint(p)).lit, "аспандағы жұлдыздар мен ай салынған").toBeGreaterThan(20);
  expect(errors).toEqual([]);
  await c.close();
});

test("нақты деректен: 3 академия, серия, кезең, сурет өзгереді; ақаулы деректе бет құламайды", async ({ browser }) => {
  const today = new Date(), y1 = new Date(today.getTime() - 86400000), y2 = new Date(today.getTime() - 2 * 86400000), old = new Date(today.getTime() - 9 * 86400000);
  const c = await browser.newContext({ reducedMotion: "reduce" });
  await blockFonts(c);
  await c.addInitScript((seed) => {
    if (sessionStorage.getItem("seeded")) return; sessionStorage.setItem("seeded", "1");
    const read = {}; for (let i = 0; i < 40; i++) read["week-" + i] = true;            // бағдарламалау: 40
    for (let i = 0; i < 6; i++) read["en:week-" + i] = true;                           // ағылшын: 6
    for (let i = 0; i < 4; i++) read["math:week-" + i] = true;                         // математика: 4
    localStorage.setItem("cs50kz:progress", JSON.stringify({ read, quiz: {} }));
    localStorage.setItem("cs50kz:days", JSON.stringify(seed));
    localStorage.setItem("cs50kz:en:ex", "{ақаулы json");                              // бүлінген дерек
    localStorage.setItem("cs50kz:games", JSON.stringify({ runner: { plays: 7, xp: 30 } }));
  }, { [iso(today)]: 2, [iso(y1)]: 1, [iso(y2)]: 3, [iso(old)]: 4 });
  const p = await c.newPage(); const errors = collectErrors(p);
  await p.goto("yurt.html");
  await expect(p.locator("#yurt-total")).toHaveText("50");                             // 40 + 6 + 4
  await expect(p.locator("#yurt-prog")).toHaveText("40");
  await expect(p.locator("#yurt-eng")).toHaveText("6");
  await expect(p.locator("#yurt-math")).toHaveText("4");
  await expect(p.locator("#yurt-streak")).toHaveText("3");                             // бүгін, кеше, алдыңғы күн; 9 күн бұрынғы үзілген
  await expect(p.locator("#yurt-stage")).toHaveText("Уықтар көтерілді");               // 30 ≤ 50 < 70
  await expect(p.locator("#yurt-next")).toContainText("20 әрекет қалды");              // 70 - 50
  await expect(p.locator("#yurt-ladder li.is-now")).toContainText("Уықтар көтерілді");
  const a = await fingerprint(p);
  const api = await p.evaluate(() => { const s = AO17Yurt.read(); return { st: AO17Yurt.stage(0).i, st2: AO17Yurt.stage(280).i, best: s.best, plays: s.plays }; });
  expect(api).toEqual({ st: 0, st2: 5, best: 3, plays: 7 });
  // сурет кезеңмен өзгереді: сол бет, басқа көрсетілім
  await p.goto("yurt.html#demo=320&streak=30"); await p.reload();
  const b = await fingerprint(p);
  expect(b.hash).not.toBe(a.hash);
  expect(b.lit, "толық Ақ үй мен шаңырақ жарығы көбірек жарық пиксель береді").toBeGreaterThan(a.lit);
  expect(errors).toEqual([]);
  await c.close();
});

test("көрсетілім режимі: ескерту көрінеді, бөлісу өшеді (жалған прогресс бөлісілмейді)", async ({ page }) => {
  await page.goto("yurt.html#demo=140&streak=12"); await page.reload();
  await expect(page.locator("#yurt-demo")).toBeVisible();
  await expect(page.locator("#yurt-stage")).toHaveText("Киіз жабылды");
  await expect(page.locator("#yurt-share")).toHaveAttribute("aria-disabled", "true");
  await expect(page.locator("#yurt-wa")).toHaveAttribute("aria-disabled", "true");
  await page.goto("yurt.html"); await page.reload();
  await expect(page.locator("#yurt-demo")).toBeHidden();
  await expect(page.locator("#yurt-share")).not.toHaveAttribute("aria-disabled", "true");
});

test("бөлісу: сурет жүктеледі (PNG, 1080×1350), WhatsApp/Telegram сілтемесінде мәтін мен сайт мекенжайы бар", async ({ browser }) => {
  const c = await browser.newContext({ acceptDownloads: true, reducedMotion: "reduce" });
  await blockFonts(c);
  await c.addInitScript(() => { try { delete Navigator.prototype.canShare; Object.defineProperty(navigator, "canShare", { value: undefined, configurable: true }); } catch (e) { /* */ } });
  const p = await c.newPage(); const errors = collectErrors(p);
  await p.goto("yurt.html");
  const wa = decodeURIComponent(await p.locator("#yurt-wa").getAttribute("href"));
  expect(wa).toContain("https://wa.me/?text=");
  expect(wa).toContain("Менің шаңырағым");
  expect(wa).toContain("https://mustafa7677.github.io/CS50MUSS/yurt.html");
  expect(decodeURIComponent(await p.locator("#yurt-tg").getAttribute("href"))).toContain("t.me/share/url?url=https://mustafa7677.github.io/CS50MUSS/yurt.html");
  await expect(p.locator("#yurt-share")).toHaveText("Суретті жүктеу");   // canShare жоқ: жүктеу фолбэгі
  const [dl] = await Promise.all([p.waitForEvent("download"), p.locator("#yurt-share").click()]);
  expect(dl.suggestedFilename()).toBe("ao17-shanyrak.png");
  const buf = fs.readFileSync(await dl.path());
  expect(buf.slice(1, 4).toString()).toBe("PNG");
  expect(buf.readUInt32BE(16)).toBe(1080);
  expect(buf.readUInt32BE(20)).toBe(1350);
  expect(errors).toEqual([]);
  await c.close();
});

test("кабинеттен және footer-ден шаңыраққа сілтеме бар", async ({ page }) => {
  await page.goto("profile.html");
  await expect(page.locator('.cabinet a[href="yurt.html"]')).toHaveCount(1, { timeout: 10000 });
  await expect(page.locator('footer a[href="yurt.html"]')).toHaveCount(1);
});

for (const scheme of ["light", "dark"]) {
  test(`360px, ${scheme}: көлденең жылжу жоқ, axe таза`, async ({ browser }) => {
    const c = await browser.newContext({ viewport: { width: 360, height: 740 }, colorScheme: scheme, reducedMotion: "reduce" });
    await blockFonts(c);
    const p = await c.newPage();
    await p.goto("yurt.html#demo=140&streak=12"); await p.reload();
    expect(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "horizontal scroll").toBe(true);
    await p.addScriptTag({ content: AXE });
    const v = await p.evaluate(async () => (await axe.run(document.getElementById("main"), { runOnly: ["wcag2a", "wcag2aa"], resultTypes: ["violations"] })).violations
      .filter((x) => ["serious", "critical"].includes(x.impact)).map((x) => `${x.id}: ${x.nodes.length} (${x.nodes[0].html.slice(0, 140)})`));
    expect(v).toEqual([]);
    await c.close();
  });
}
