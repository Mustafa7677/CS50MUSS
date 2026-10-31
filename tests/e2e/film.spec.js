// © 2026 Sagid Mustafa. All Rights Reserved.
// «Шақыру» интерактивті тарихи фильмі (film/index.html): бір уақыт ойнатқышы, скролл/перне/шкала, қозғалыс азайту,
// архив пен реконструкцияның белгісі, телефон композициясы, финалдағы үш академия.
const { test, expect } = require("@playwright/test");
const { blockFonts, collectErrors } = require("../support/helpers");

const T = (page) => page.evaluate(() => window.AO17Film.t);

test("фильм өзі жүреді; скролл алға-артқа жүргізеді, тоқтаған соң сол жерден жалғасады; перне мен «Өткізу»", async ({ page }) => {
  await blockFonts(page.context());
  const errs = collectErrors(page);
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("film/index.html");
  await page.waitForFunction(() => window.AO17Film);
  await expect.poll(() => T(page)).toBeGreaterThan(0.5);                       // autoplay
  await page.mouse.move(640, 360);
  for (let i = 0; i < 10; i++) await page.mouse.wheel(0, 200);
  await expect.poll(() => T(page)).toBeGreaterThan(10);                         // скролл алға
  const held = await T(page);
  await expect.poll(() => T(page), { timeout: 5000 }).toBeGreaterThan(held + 0.8); // скролл біткен соң фильм жалғасады
  for (let i = 0; i < 12; i++) await page.mouse.wheel(0, -250);
  await expect.poll(() => T(page)).toBeLessThan(3);                             // кері скролл - алдыңғы сахна
  await page.keyboard.press("ArrowRight");
  await expect.poll(() => T(page)).toBeGreaterThan(6);                          // келесі тарау
  await expect(page.locator("#capCh")).toHaveText("Үш сұрақ");
  await page.click("#skip");
  await expect.poll(() => T(page)).toBeGreaterThan(70);                         // финал
  const worlds = page.locator("#s8 .world");
  await expect(worlds).toHaveCount(3);
  expect(await worlds.evaluateAll((a) => a.map((n) => n.getAttribute("href")))).toEqual(["../programming.html", "../math/", "../en/"]);
  expect(errs).toEqual([]);
});

test("тарих адал: әр тарауда дерек көзі; архив пен реконструкция бөлек белгіленген; әр архив суретінің дерек көзі жазылған", async ({ page }) => {
  await blockFonts(page.context());
  await page.goto("film/index.html");
  const src = await page.locator("#stage .sc").evaluateAll((s) => s.map((n) => n.dataset.src));
  expect(src.length).toBe(9);
  src.forEach((v) => expect(v && v.length).toBeGreaterThan(3));
  for (const id of ["s2", "s3", "s4", "s6"]) expect(await page.locator(`#${id}`).getAttribute("data-src")).toContain("архив");
  await expect(page.locator("#s2 .tag")).toContainText("РЕКОНСТРУКЦИЯ");   // петиция беті - қайта жасалған
  await expect(page.locator("#s3 .tag")).toContainText("АРХИВ");           // «Оян, қазақ!» мұқабасы - түпнұсқа көшірме
  await expect(page.locator("#s4 .tag")).toContainText("22 наурыз 1913");  // «Қазақ» газетінің нақты нөмірі
  // әр сурет сипатталған; үш тұлғаның портреті бар
  const alts = await page.locator("#stage img").evaluateAll((im) => im.map((i) => i.alt));
  alts.forEach((a) => expect(a.length).toBeGreaterThan(10));
  for (const n of ["Әлихан Бөкейхан", "Ахмет Байтұрсынұлы", "Міржақып Дулатұлы"]) expect(alts.some((a) => a.startsWith(n))).toBe(true);
  // фильмдегі әр архив файлының дерек көзі мен лицензиясы бар
  const fs = require("fs"), path = require("path");
  const root = path.join(__dirname, "..", "..");
  const credits = JSON.parse(fs.readFileSync(path.join(root, "assets/data/film-media.json"), "utf8"));
  for (const f of fs.readdirSync(path.join(root, "assets/img/film"))) {
    const c = credits[f.replace(/\.jpg$/, "")];
    expect(c, f).toBeTruthy();
    expect(c.license).toMatch(/Public domain|CC|рұқсатымен/);
    expect(c.file).toBe(`assets/img/film/${f}`);
  }
  await expect(page.locator("#s2 .lead")).toContainText("14 500");
  await expect(page.locator("#s6 .lead")).toContainText("5-13 желтоқсан 1917");
});

test("қозғалыс азайтылса: фильм өзі жүрмейді, камера қозғалмайды, тараулар шкаладан ауысады", async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: "reduce" });
  await blockFonts(ctx);
  const page = await ctx.newPage();
  await page.goto("film/index.html");
  await page.waitForFunction(() => window.AO17Film);
  await expect(page.locator("html")).toHaveClass(/still/);
  await page.waitForTimeout(1200);
  expect(await T(page)).toBe(0);
  await page.keyboard.press("ArrowRight");
  await expect.poll(() => T(page)).toBeGreaterThan(6);
  expect(await page.locator("#s1 .cam").evaluate((n) => getComputedStyle(n).transform)).toBe("none");
  await ctx.close();
});

test("телефон: тігінен композиция, көлденең жылжу жоқ, басқару батырмалары ≥44px, финал экранға сыяды", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  await blockFonts(ctx);
  const page = await ctx.newPage();
  const errs = collectErrors(page);
  await page.goto("film/index.html");
  await page.waitForFunction(() => window.AO17Film);
  await expect(page.locator("html")).toHaveClass(/portrait/);
  for (const sel of ["#play", "#skip", "#snd"]) {
    const b = await page.locator(sel).boundingBox();
    expect(Math.min(b.width, b.height), sel).toBeGreaterThanOrEqual(44);
  }
  await page.evaluate(() => window.AO17Film.seek(window.AO17Film.END - 0.01));
  await page.waitForTimeout(300);
  const r = await page.evaluate(() => {
    const ws = [...document.querySelectorAll("#s8 .world")].map((w) => w.getBoundingClientRect());
    return { over: document.documentElement.scrollWidth - innerWidth, left: Math.min(...ws.map((w) => w.left)), right: Math.max(...ws.map((w) => w.right)), bottom: Math.max(...ws.map((w) => w.bottom)), h: innerHeight };
  });
  expect(r.over).toBe(0);
  expect(r.left).toBeGreaterThanOrEqual(0);
  expect(r.right).toBeLessThanOrEqual(390);
  expect(r.bottom).toBeLessThan(r.h);
  expect(errs).toEqual([]);
  await ctx.close();
});
