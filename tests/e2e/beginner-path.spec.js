// Новичок жолы: «Бір негізгі маршрут» компоненті (басты бет, курстар беті, курс беттері).
const { test, expect } = require("@playwright/test");
const { blockFonts, collectErrors } = require("../support/helpers");

const seed = (page, progress) => page.addInitScript((p) => {
  try { if (!sessionStorage.getItem("seeded")) { sessionStorage.setItem("seeded", "1"); if (p) localStorage.setItem("cs50kz:progress", JSON.stringify(p)); } } catch (e) {}
}, progress);

test("жаңа қолданушы: «Бастау: 0-апта», 5 қадам, нақты сілтемелер, ol + aria-current", async ({ page }) => {
  const errs = collectErrors(page);
  await blockFonts(page.context());
  await page.goto("index.html");
  const route = page.locator(".route[data-route='x']");
  await expect(route).toBeVisible();
  await expect(route.locator("ol.route-line > li.route-step")).toHaveCount(5);
  await expect(route).toHaveAttribute("data-state", "fresh");
  const go = route.locator(".route-go");
  await expect(go).toContainText("Бастау: 0-апта");
  await expect(go).toHaveAttribute("href", /(^|\/)lectures\/week-0\.html$/);
  const hrefs = (await route.locator(".route-step a").evaluateAll((as) => as.map((a) => a.getAttribute("href")))).map((h) => h.replace(/^https?:\/\/[^/]+\//, ""));
  expect(hrefs).toEqual(["index.html#main", "lectures/week-0.html", "lectures/week-0.html#practice", "lectures/week-0.html#quiz", "lectures/week-1.html"]);
  await expect(route.locator("[aria-current='step']")).toHaveCount(1);
  await expect(route.locator(".route-step[data-step='1']")).toHaveAttribute("aria-current", "step");
  // бағдарламалау тілдері басты бетте бірден көрінеді; CS50x тақтайшасы бірінші, «Бастау осыдан» белгісімен 0-лекцияға апарады
  await expect(page.locator("details.route-later")).toHaveCount(0);
  const tiles = page.locator(".kh-tile");
  await expect(tiles).toHaveCount(7);
  for (let i = 0; i < 7; i++) await expect(tiles.nth(i)).toBeVisible();
  await expect(tiles.first()).toHaveAttribute("data-course", "x");
  await expect(tiles.first()).toHaveAttribute("href", "lectures/week-0.html");
  await expect(tiles.first().locator(".kh-start")).toHaveText("Бастау осыдан");
  expect(errs).toEqual([]);
});

test("0-лекция оқылды деп белгіленсе қадам ауысады, «Жалғастыру» келесі лекцияға апарады", async ({ page }) => {
  await blockFonts(page.context());
  await seed(page, { read: { "week-0": 1700000000000 }, quiz: { "week-0": { best: 4, total: 5 } } });
  await page.goto("index.html");
  const route = page.locator(".route[data-route='x']");
  await expect(route).toHaveAttribute("data-state", "progress");
  await expect(route).toHaveAttribute("data-current", "2");
  await expect(route.locator(".route-step[data-step='1']")).toHaveClass(/is-done/);
  await expect(route.locator(".route-step[data-step='2']")).toHaveAttribute("aria-current", "step");
  const go = route.locator(".route-go");
  await expect(go).toContainText("Жалғастыру: 1-апта");
  await expect(go).toHaveAttribute("href", /lectures\/week-1\.html$/);
  await go.click();
  await expect(page).toHaveURL(/lectures\/week-1\.html$/);
});

test("нақты ағын: лекцияда «Оқыдым» басылса, маршрут келесі қадамға ауысады", async ({ page }) => {
  await blockFonts(page.context());
  await page.goto("index.html");
  await expect(page.locator(".route[data-route='x']")).toHaveAttribute("data-current", "1");
  await page.goto("lectures/week-0.html");
  await page.click(".mark-read .btn.gold");
  await page.goto("index.html");
  const route = page.locator(".route[data-route='x']");
  await expect(route).toHaveAttribute("data-current", "2");
  await expect(route.locator(".route-go")).toHaveAttribute("href", /week-1\.html$/);
});

test("лекция ашылып, тапсырма мен тест орындалса: 3 → 4 → 5 қадам, сілтеме тиісті бөлімге", async ({ page }) => {
  await blockFonts(page.context());
  await seed(page, { read: {}, last: { id: "week-0", num: "0-апта" } });
  await page.goto("index.html");
  const route = page.locator(".route[data-route='x']");
  await expect(route).toHaveAttribute("data-current", "3");
  await expect(route.locator(".route-go")).toHaveAttribute("href", /week-0\.html#practice$/);
  await page.evaluate(() => {
    localStorage.setItem("cs50kz:progress", JSON.stringify({ read: {}, last: { id: "week-0", num: "0-апта" }, quiz: { "week-0": { best: 3, total: 5 } } }));
    localStorage.setItem("check:/lectures/week-0.html:pset0", JSON.stringify([true, true]));
  });
  await page.reload();
  await expect(route).toHaveAttribute("data-current", "5");
  await expect(route.locator(".route-go")).toHaveAttribute("href", /week-1\.html$/);
});

test("курстар беті мен курс беті: маршрут бар, сілтемелер курстың ішінде", async ({ page }) => {
  await blockFonts(page.context());
  await page.goto("courses.html");
  await expect(page.locator(".route[data-route='x'] .route-step")).toHaveCount(5);
  await expect(page.locator(".cx-card")).toHaveCount(9);
  await page.goto("python/index.html");
  const route = page.locator(".route[data-route='python']");
  await expect(route.locator(".route-step")).toHaveCount(5);
  await expect(route.locator(".route-go")).toContainText("Бастау: 0-апта");
  await expect(route.locator(".route-go")).toHaveAttribute("href", /python\/lectures\/week-0\.html$|^lectures\/week-0\.html$/);
  await page.evaluate(() => localStorage.setItem("cs50kz:progress", JSON.stringify({ read: { "python:week-0": 1 } })));
  await page.reload();
  await expect(route).toHaveAttribute("data-current", "2");
  await expect(route.locator(".route-go")).toHaveAttribute("href", /python\/lectures\/week-1\.html$/);
});

for (const theme of ["light", "dark"]) {
  test(`мобильде 390px (${theme}): көлденең айналу жоқ, батырма көрінеді`, async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 800 }, colorScheme: theme });
    await blockFonts(ctx);
    const page = await ctx.newPage();
    for (const url of ["index.html", "courses.html", "python/index.html"]) {
      await page.goto(url);
      await page.evaluate((t) => { document.documentElement.dataset.theme = t; }, theme);
      const route = page.locator(".route").first();
      await expect(route).toBeVisible();
      await expect(route.locator(".route-go")).toBeVisible();
      const m = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
      expect(m.sw, url).toBeLessThanOrEqual(m.cw);
      const box = await route.boundingBox();
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(390);
    }
    await ctx.close();
  });
}

test("reduced-motion: ағымдағы қадамда анимация жоқ", async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: "reduce" });
  await blockFonts(ctx);
  const page = await ctx.newPage();
  await page.goto("index.html");
  const name = await page.locator(".route-step.is-current .route-dot").evaluate((el) => getComputedStyle(el).animationName);
  expect(name).toBe("none");
  await ctx.close();
});
