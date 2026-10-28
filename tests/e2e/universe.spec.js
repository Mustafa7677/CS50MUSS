// © 2026 Sagid Mustafa. All Rights Reserved.
// «Үш әлем» жүйесі: академияға кіру порталы, басты беттің алтын жібі, компас, бағдарламалау курстарының шоқжұлдызы.
const { test, expect } = require("@playwright/test");
const { blockFonts, collectErrors } = require("../support/helpers");

test("портал: академия карточкасы экранға жайылып, сол академияның әлеміне айналады, сосын бет ауысады", async ({ page }) => {
  await blockFonts(page.context());
  const errs = collectErrors(page);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("index.html");
  await page.locator("#academies .ac-card").last().scrollIntoViewIfNeeded();
  await expect(page.locator(".ac-card.is-open")).toHaveCount(3, { timeout: 8000 });
  // үлкейіп кеткен шаңырақ карточканы басуға кедергі емес
  await page.click('.ac-card[href="math/"]');
  await expect(page.locator(".portal.portal-math")).toHaveCount(1);
  await expect(page.locator(".portal-title")).toHaveText("Математика академиясы");
  await page.waitForURL(/math\/$/);
  expect(errs).toEqual([]);
});

test("портал: қозғалыс азайтылса - әдеттегі сілтеме, бірден ауысады", async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: "reduce" });
  await blockFonts(ctx);
  const page = await ctx.newPage();
  await page.goto("index.html");
  await page.click('.ax-en .btn[data-portal="en"]');
  await page.waitForURL(/en\/$/);
  await ctx.close();
});

test("алтын жіп: басты бетте жеті түйін, скролл жіпті толтырады, соңғы түйін - прогресс", async ({ page }) => {
  await blockFonts(page.context());
  await page.addInitScript(() => localStorage.setItem("cs50kz:progress", JSON.stringify({ read: { "python:week-0": 1, "math:week-0": 1 } })));
  await page.setViewportSize({ width: 1440, height: 860 });
  await page.goto("index.html");
  await expect(page.locator(".gt li")).toHaveCount(7);
  await expect(page.locator(".gt li").last()).toContainText("2/");
  const f0 = await page.locator(".gt").evaluate((n) => +getComputedStyle(n).getPropertyValue("--f"));
  await page.locator("#scene-math").scrollIntoViewIfNeeded();
  await expect.poll(() => page.locator(".gt").evaluate((n) => +n.style.getPropertyValue("--f"))).toBeGreaterThan(f0 + 0.5);
  await expect(page.locator('.gt li[aria-current] a')).toHaveAttribute("href", "#scene-math");
  // телефонда жіп жоқ
  await page.setViewportSize({ width: 390, height: 800 });
  await expect(page.locator(".gt")).toBeHidden();
});

test("компас: қайда тұрғаныңды көрсетеді, үш академияның прогресі, Esc жабады; басты бетте жоқ", async ({ page }) => {
  await blockFonts(page.context());
  const errs = collectErrors(page);
  await page.addInitScript(() => localStorage.setItem("cs50kz:progress", JSON.stringify({ read: { "math:week-0": 1, "math:week-1": 1 } })));
  await page.goto("math/lectures/week-41.html");
  const btn = page.locator(".compass");
  await expect(btn).toHaveAttribute("aria-expanded", "false");
  await btn.click();
  await expect(btn).toHaveAttribute("aria-expanded", "true");
  const panel = page.locator("#compass-panel");
  await expect(panel).toBeVisible();
  await expect(panel.locator(".cp-here")).toContainText("Математика академиясы");
  await expect(panel.locator(".cp-here")).toContainText("Екі еселі интеграл");
  await expect(panel.locator(".cp-acs li")).toHaveCount(3);
  await expect(panel.locator(".cp-acs li.is-here")).toContainText("2/162");
  await page.keyboard.press("Escape");
  await expect(panel).toBeHidden();
  await expect(btn).toBeFocused();
  await page.goto("index.html");
  await expect(page.locator(".compass")).toHaveCount(0);
  expect(errs).toEqual([]);
});

test("шоқжұлдыз: жеті курс жұлдыз; Python-ға апарса байланыстылары жанады, мақсат таңдалса маршрут жанады", async ({ page }) => {
  await blockFonts(page.context());
  const errs = collectErrors(page);
  await page.addInitScript(() => localStorage.removeItem("cs50kz:pa-goal"));
  await page.goto("programming.html");
  const stars = page.locator(".kc a[data-k]");
  await expect(stars).toHaveCount(7);
  await page.locator('.kc a[data-k="python"]').hover();
  await expect(page.locator('.kc a[data-k="python"]')).toHaveClass(/is-hot/);
  for (const k of ["sql", "ai", "web", "x"]) await expect(page.locator(`.kc a[data-k="${k}"]`)).toHaveClass(/is-near/);
  await expect(page.locator('.kc a[data-k="java"]')).not.toHaveClass(/is-near|is-hot/);
  await page.mouse.move(2, 2);
  await page.click('.pa-goal[data-goal="ai"]');
  await expect(page.locator(".kc a.is-hot")).toHaveCount(2);
  await page.locator('.kc a[data-k="sql"]').click();
  await expect(page).toHaveURL(/#t-sql$/);
  expect(errs).toEqual([]);
});

test("басты бет: Ботаның сөз бұлты мен Бота ешбір экранда қиылмайды, көлденең жылжу жоқ", async ({ browser }) => {
  for (const [w, h] of [[320, 640], [360, 760], [375, 812], [390, 844], [414, 896], [768, 1024], [1280, 800]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: "reduce" });
    await blockFonts(ctx);
    const page = await ctx.newPage();
    await page.goto("index.html");
    const say = page.locator(".st-s1 .st-say");
    await expect(say).toBeVisible();
    await expect(say).toHaveText(/Сәлем! Мен - Бота/);
    const r = await page.evaluate(() => {
      const q = document.querySelector(".st-s1 .st-say").getBoundingClientRect();
      const b = document.querySelector(".st-s1 .walker").getBoundingClientRect();
      return { l: q.left, r: q.right, bl: b.left, br: b.right, over: document.documentElement.scrollWidth - innerWidth, bubbleAbove: q.bottom <= b.top + 30 };
    });
    expect(r.l, `${w}px: бұлт сол жақтан`).toBeGreaterThanOrEqual(0);
    expect(r.r, `${w}px: бұлт оң жақтан`).toBeLessThanOrEqual(w);
    expect(r.bl, `${w}px: Бота сол жақтан`).toBeGreaterThanOrEqual(0);
    expect(r.br, `${w}px: Бота оң жақтан`).toBeLessThanOrEqual(w);
    expect(r.bubbleAbove, `${w}px: бұлт Ботаның үстінде`).toBe(true);
    expect(r.over, `${w}px: көлденең жылжу`).toBe(0);
    await ctx.close();
  }
});
