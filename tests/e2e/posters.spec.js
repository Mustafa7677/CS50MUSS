// © 2026 Sagid Mustafa. All Rights Reserved.
// Афиша (posters.html): тоғыз курс постері, жүктеу сілтемесі, фильмдер; курс беттерін бөліскенде курс постерінің баннері.
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");
const { blockFonts, collectErrors } = require("../support/helpers");

const ROOT = path.join(__dirname, "..", "..");
const IDS = ["x", "python", "sql", "ai", "web", "cpp", "java", "en", "math"];

test("афиша: 9 постер жүктеледі, әрқайсысы курсқа апарады және жүктеп алуға болады", async ({ page }) => {
  await blockFonts(page.context());
  const errs = collectErrors(page);
  await page.goto("posters.html");
  const cards = page.locator(".ps-card");
  await expect(cards).toHaveCount(9);
  expect(await cards.evaluateAll((c) => c.map((n) => n.dataset.course))).toEqual(IDS);
  for (const id of IDS) {
    const img = page.locator(`.ps-card[data-course="${id}"] img`);
    await img.scrollIntoViewIfNeeded();
    await expect.poll(() => img.evaluate((i) => i.complete && i.naturalWidth)).toBe(1200);
    expect(await img.evaluate((i) => i.naturalHeight)).toBe(1800);
    expect((await img.getAttribute("alt")).length).toBeGreaterThan(10);
    await expect(page.locator(`.ps-card[data-course="${id}"] .ps-dl`)).toHaveAttribute("download", `AO17-${id}-poster.jpg`);
  }
  expect(await page.locator(".ps-films a").evaluateAll((a) => a.map((n) => n.getAttribute("href")))).toEqual(["film/", "film/code/", "film/math/", "film/en/"]);
  expect(errs).toEqual([]);
});

test("курс беттерін бөліскенде - сол курстың баннері (1200×630)", async ({ page }) => {
  for (const id of IDS.filter((i) => i !== "x")) {
    const f = path.join(ROOT, `assets/img/og/course-${id}.jpg`);
    expect(fs.existsSync(f), f).toBe(true);
    await page.goto(`${id}/index.html`, { waitUntil: "domcontentloaded" });
    expect(await page.locator('meta[property="og:image"]').getAttribute("content")).toMatch(new RegExp(`assets/img/og/course-${id}\\.jpg$`));
  }
});

test("басты бетте афишаға сілтеме бар", async ({ page }) => {
  await blockFonts(page.context());
  await page.goto("index.html");
  await expect(page.locator('a.st-aff[href="posters.html"]')).toHaveCount(1);
});
