// © 2026 Sagid Mustafa. All Rights Reserved.
// ҰБТ-ға дайындық (math/ubt.html): блоктардан құралған сынақ, кері санақ, өзі тапсыру, нәтиже мен қайталау жоспары.
const { test, expect } = require("@playwright/test");
const { blockFonts, collectErrors } = require("../support/helpers");

test("ҰБТ: толық сынақ 40 сұрақ, жылдам 20; блоктар үлесі; тапсырғанда нәтиже, жоспар, тарих", async ({ page }) => {
  test.setTimeout(120_000);
  await blockFonts(page.context());
  const errs = collectErrors(page);
  await page.goto("math/ubt.html");
  await page.click("text=Сынақты бастау");
  await expect(page.locator(".mx-eitem")).toHaveCount(40, { timeout: 20000 });
  const chips = await page.locator(".mx-eitem .mx-phead .mx-chip").allTextContents();
  const cnt = {}; chips.forEach((x) => { cnt[x] = (cnt[x] || 0) + 1; });
  expect(cnt).toEqual({ "Арифметика": 6, "Алгебра": 12, "Тригонометрия": 6, "Координаталық геометрия": 5, "Анализ бастамалары": 7, "Ықтималдық және статистика": 4 });
  // бос болса бір рет ескертеді, екінші басқанда тапсырады
  await page.click("text=Тапсыру және тексеру");
  await expect(page.locator(".mx-eres .mx-fail")).toContainText("жауап берілмеген");
  await page.click("text=Бәрібір тапсыру");
  await expect(page.locator(".mx-eres h3")).toHaveText("Нәтиже: 0 / 40 (0%)");
  await expect(page.locator(".ubt-blocks li")).toHaveCount(6);
  const plan = page.locator(".ubt-plan a").first();
  await expect(plan).toHaveAttribute("href", /math\/lectures\/week-\d+\.html$/);
  await expect(page.locator(".ubt-trend li")).toHaveCount(1);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("cs50kz:math:ubt")).hist.length)).toBe(1);
  // жылдам нұсқа
  await page.click('.ubt-modes [data-mode="short"]');
  await page.click("text=Сынақты бастау");
  await expect(page.locator(".mx-eitem")).toHaveCount(20, { timeout: 20000 });
  expect(errs).toEqual([]);
});

test("ҰБТ: уақыт біткенде сынақ өзі тапсырылады, 5 минут қалғанда сағат ескертеді", async ({ page }) => {
  test.setTimeout(120_000);
  await blockFonts(page.context());
  await page.clock.install();
  await page.goto("math/ubt.html");
  await page.clock.runFor(1000);
  await page.click('.ubt-modes [data-mode="short"]');
  await page.click("text=Сынақты бастау");
  await expect(page.locator(".mx-eitem")).toHaveCount(20, { timeout: 20000 });
  await expect(page.locator(".ubt-clock")).toHaveText(/^(40:00|39:5\d)$/);
  await page.clock.runFor(35 * 60 * 1000 + 2000);
  await expect(page.locator(".ubt-clock.ubt-late")).toHaveCount(1);
  await page.clock.runFor(5 * 60 * 1000 + 2000);
  await expect(page.locator(".mx-eres h3")).toContainText("/ 20");
  expect(await page.locator("fieldset.mx-exam").evaluate((f) => f.disabled)).toBe(true);
});

test("ҰБТ: телефонда көлденең жылжу жоқ; мәзірде ҰБТ сілтемесі бар", async ({ page }) => {
  await blockFonts(page.context());
  await page.setViewportSize({ width: 360, height: 760 });
  await page.goto("math/lectures/week-0.html");
  await expect(page.locator('.math-subnav a[href="../ubt.html"]')).toHaveCount(1);
  await page.goto("math/ubt.html");
  await page.click("text=Сынақты бастау");
  await expect(page.locator(".mx-eitem").first()).toBeVisible({ timeout: 20000 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
});
