// © 2026 Sagid Mustafa. All Rights Reserved.
// Серіктестер беті мен іздеу жүйелеріне арналған schema.org деректері.
const { test, expect } = require("@playwright/test");
const { blockFonts, collectErrors } = require("../support/helpers");

const lds = (page) => page.$$eval('script[type="application/ld+json"]', (ns) => ns.map((n) => JSON.parse(n.textContent)));

test("серіктестер беті: метрикалар build-тен толады, салыстыру, IP бөлімі, байланыс", async ({ page }) => {
  await blockFonts(page.context());
  const errs = collectErrors(page);
  await page.goto("partners.html");
  const nums = await page.locator(".inv-stats b").allTextContents();
  expect(nums).toHaveLength(6);
  for (const n of nums) expect(+n).toBeGreaterThan(0);
  await expect(page.locator(".inv-cmp tbody tr")).toHaveCount(7);
  await expect(page.locator(".inv-own")).toContainText("барлық құқық қорғалған");
  await expect(page.locator(".inv-cc")).toContainText("CC BY-NC-SA 4.0");
  await expect(page.locator(".inv-cta .fb-open")).toBeVisible();
  await expect(page.locator('.footer a[href="partners.html"]')).toHaveCount(1);
  expect(errs).toEqual([]);
});

test("серіктестер беті телефонда: кесте карточкаға айналады, көлденең жылжу жоқ", async ({ page }) => {
  await blockFonts(page.context());
  await page.setViewportSize({ width: 360, height: 760 });
  await page.goto("partners.html");
  await expect(page.locator(".inv-cmp thead")).toHaveCSS("position", "absolute");
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
});

test("schema.org: басты бетте WebSite, курс беттерінде Course (тегін, қазақша)", async ({ page }) => {
  await page.goto("index.html");
  expect((await lds(page)).some((d) => d["@type"] === "WebSite" && d.publisher["@type"] === "Organization")).toBe(true);
  for (const c of ["math", "python", "en"]) {
    await page.goto(`${c}/index.html`);
    const course = (await lds(page)).find((d) => d["@type"] === "Course");
    expect(course, c).toBeTruthy();
    expect(course.inLanguage).toBe("kk");
    expect(course.offers.price).toBe(0);
    expect(course.provider.name).toBe("CS50MUSS");
    expect(!!course.isBasedOn).toBe(c === "python");
  }
});

test("өнімділік: басты бет тест банкін (quiz.js) «Күннің сұрағы» жақындағанда ғана жүктейді", async ({ page }) => {
  await blockFonts(page.context());
  const got = [];
  page.on("request", (r) => r.url().includes("assets/data/quiz.js") && got.push(r.url()));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("index.html");
  await page.waitForTimeout(1500);
  expect(got).toHaveLength(0);
  await page.locator(".dash-grid").scrollIntoViewIfNeeded();
  await expect(page.locator(".daily-card .daily-q .mq-opts button").first()).toBeVisible({ timeout: 10000 });
  expect(got.length).toBeGreaterThan(0);
});
