// © 2026 Sagid Mustafa. All Rights Reserved.
// Тараулар: сабақ кино тарауы сияқты - тақтада «Тарау 03», ашылғанда тарау картасы (сеансқа бір рет), курс карточкаларында нөмір.
const { test, expect } = require("@playwright/test");
const { blockFonts, collectErrors } = require("../support/helpers");

test("сабақ тақтасы: «Тарау 03», English курсында «Chapter 03»; навигациялық жол бұрынғыдай", async ({ page }) => {
  await blockFonts(page.context());
  const errs = collectErrors(page);
  await page.goto("python/lectures/week-3.html");
  const chap = page.locator("#main .lecture-head .chap");
  await expect(chap.locator(".chap-w")).toHaveText("Тарау");
  await expect(chap.locator(".chap-n")).toHaveText("03");
  await expect(chap.locator(".num")).toHaveText("3-апта");
  await expect(page.locator(".crumbs [aria-current]")).toHaveText("3-апта");
  await expect(page.locator(".chap-card")).toHaveCount(0);            // автотестте тарау картасы шықпайды
  await page.goto("en/lectures/week-2.html");
  await expect(page.locator("#main .chap .chap-w")).toHaveText("Chapter");
  await expect(page.locator("#main .chap .chap-n")).toHaveText("03");
  await page.goto("math/lectures/week-5.html");                       // «Precalculus · 6-сабақ» -> пән ішіндегі нөмір
  await expect(page.locator("#main .chap .chap-n")).toHaveText("06");
  expect(errs).toEqual([]);
});

test("курс бетіндегі карточкаларда тарау нөмірі", async ({ page }) => {
  await blockFonts(page.context());
  await page.goto("python/index.html");
  const n = await page.locator(".week-card .wc-chap").allTextContents();
  expect(n.slice(0, 4)).toEqual(["00", "01", "02", "03"]);
});

test("тарау картасы: сабақ ашылғанда шығып, өзі кетеді; сол сеанста қайта шықпайды; басса бірден кетеді", async ({ page }) => {
  await blockFonts(page.context());
  await page.addInitScript(() => Object.defineProperty(navigator, "webdriver", { get: () => false }));
  await page.goto("python/lectures/week-4.html");
  const card = page.locator(".chap-card");
  await expect(card).toHaveCount(1);
  await expect(card.locator(".cc-n")).toHaveText("04");
  await expect(card.locator(".cc-k")).toHaveText("CS50P");
  await expect(card).toHaveCount(0, { timeout: 4000 });
  await page.goto("python/lectures/week-5.html");
  await expect(page.locator(".chap-card")).toHaveCount(1);
  await page.mouse.click(200, 200);
  await expect(page.locator(".chap-card")).toHaveCount(0, { timeout: 1500 });
  await page.goto("python/lectures/week-4.html");                      // бұл тарау бұл сеанста көрілген
  await page.waitForTimeout(300);
  await expect(page.locator(".chap-card")).toHaveCount(0);
});

test("қозғалыс азайтылса - тарау картасы жоқ", async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: "reduce" });
  await blockFonts(ctx);
  const page = await ctx.newPage();
  await page.addInitScript(() => Object.defineProperty(navigator, "webdriver", { get: () => false }));
  await page.goto("python/lectures/week-6.html");
  await page.waitForTimeout(300);
  await expect(page.locator(".chap-card")).toHaveCount(0);
  await expect(page.locator("#main .chap .chap-n")).toHaveText("06");
  await ctx.close();
});
