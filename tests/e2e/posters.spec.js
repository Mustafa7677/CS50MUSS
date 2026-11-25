// © 2026 AO17 командасы. All Rights Reserved.
// Афиша (posters.html): тоғыз курс постері, жүктеу сілтемесі, фильмдер; курс беттерін бөліскенде курс постерінің баннері.
// AO17 CS: 14 комикс-мұқаба (негізгі, 2-бөлім, 12 апта; tools/make_course_posters.py), курс бетіндегі апта карточкаларында кішірейтілген нұсқасы.
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
  const cards = page.locator(".ps-card:not(.ps-cs)");
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

test("AO17 CS: 14 комикс-мұқаба (1000×1500), әрқайсысы курсқа апарады; курс бетінде апта мұқабалары", async ({ page }) => {
  await blockFonts(page.context());
  const errs = collectErrors(page);
  await page.goto("posters.html#ao17cs");
  const cs = page.locator(".ps-card.ps-cs");
  await expect(cs).toHaveCount(14);
  const ids = await cs.evaluateAll((c) => c.map((n) => n.dataset.cs));
  expect(ids.slice(0, 2)).toEqual(["ao17cs", "ao17cs-3d"]);
  for (const id of ids) {
    const f = path.join(ROOT, `assets/img/posters/${id}.jpg`);
    expect(fs.existsSync(f), f).toBe(true);
    const href = await page.locator(`.ps-cs[data-cs="${id}"] .ps-img`).getAttribute("href");
    expect(fs.existsSync(path.join(ROOT, href.split("#")[0])), href).toBe(true);
    await expect(page.locator(`.ps-cs[data-cs="${id}"] .ps-dl`)).toHaveAttribute("download", `AO17-${id}.jpg`);
  }
  const img = page.locator('.ps-cs[data-cs="ao17cs-w05"] img');
  await img.scrollIntoViewIfNeeded();
  await expect.poll(() => img.evaluate((i) => i.complete && i.naturalWidth)).toBe(1000);
  // курс беті: әр аптаның мұқабасы бар, ол афишадағы сол нөмірге апарады
  await page.goto("academy/course.html");
  const thumbs = page.locator(".crs-w .crs-wv");
  await expect(thumbs).toHaveCount(12);
  await expect(thumbs.first()).toHaveAttribute("href", "../posters.html#cs-w01");
  for (const src of await page.locator(".crs-wv img").evaluateAll((a) => a.map((i) => i.getAttribute("src"))))
    expect(fs.existsSync(path.join(ROOT, "academy", src)), src).toBe(true);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /assets\/img\/og\/course-ao17cs\.jpg$/);
  await page.goto("academy/3d/index.html");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /assets\/img\/og\/ao17cs-3d\.jpg$/);
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
