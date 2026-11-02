// © 2026 Sagid Mustafa. All Rights Reserved.
// Әр формуланың дәл астында жеке түсіндірме: қарапайым тілмен, бірден мысал, өмірден, неге (tools/math_fx.py).
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");
const { blockFonts } = require("../support/helpers");
const ROOT = path.join(__dirname, "..", "..");

// Толық өңделген пәндер (docs/MATH-FX-PROGRESS.md): Арифметика 154-161, Precalculus 0-6, Сызықтық алгебра 7-14, Аналитикалық геометрия 15-20
const DONE = [154, 155, 156, 157, 158, 159, 160, 161, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

test("өңделген сабақтарда әр формуланың астында 4 бөлімді жеке түсіндірме бар, мәтіндер қайталанбайды", () => {
  const seen = new Set();
  const all = fs.readdirSync(path.join(ROOT, "math/lectures")).map((f) => +(f.match(/week-(\d+)/) || [])[1]).filter((n) => !isNaN(n));
  for (const n of all) {
    if (!DONE.includes(n) && !fs.readFileSync(path.join(ROOT, `math/lectures/week-${n}.html`), "utf8").includes('class="mx-fx"')) continue;
    const s = fs.readFileSync(path.join(ROOT, `math/lectures/week-${n}.html`), "utf8");
    const f = [...s.matchAll(/<div class="math-formula" id="f-(\d+)">/g)].map((m) => m[1]);
    const x = [...s.matchAll(/<div class="mx-fx" id="fx-(\d+)"/g)].map((m) => m[1]);
    expect(x, `week-${n}`).toEqual(f);
    for (const blk of s.split('<div class="mx-fx"').slice(1)) {
      const body = blk.split("<!--/mx-fx-->")[0];
      for (const k of ["fx-plain", "fx-now", "fx-life", "fx-why", "fx-ans", "fx-steps"]) expect(body, `week-${n} ${k}`).toContain(k);
      const why = body.match(/fx-why"><span class="fx-k">[^<]*<\/span><p>(.*?)<\/p>/)[1];
      expect(seen.has(why), `week-${n}: «Неге» қайталанады`).toBe(false);
      seen.add(why);
    }
  }
});

test("түсіндірме формуланың дәл астында тұр, формулалар сызылған, телефонда көлденең жылжу жоқ", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await blockFonts(ctx);
  const page = await ctx.newPage();
  await page.goto("math/lectures/week-158.html");
  const next = await page.locator(".math-formula").evaluateAll((els) => els.map((e) => e.nextElementSibling && e.nextElementSibling.className));
  next.forEach((c) => expect(c).toBe("mx-fx"));
  await expect.poll(() => page.locator(".mx-fx .katex").count(), { timeout: 15000 }).toBeGreaterThan(20);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  await expect(page.locator("#fx-2 .fx-ans")).toContainText("Жауабы");
  await ctx.close();
});
