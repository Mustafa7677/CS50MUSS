const { test, expect } = require("@playwright/test");
const { blockFonts, collectErrors } = require("../support/helpers");

// Сөздік: курс сүзгісін басқанда басқа курстың терминдері шынымен жасырылады, бос әріптер де жасырылады.
for (const c of ["x", "python", "sql", "ai", "web"]) {
  test(`сөздік: сүзгі ${c}`, async ({ page, context }) => {
    await blockFonts(context);
    const errs = collectErrors(page);
    await page.goto("glossary.html");
    const total = await page.locator(".g-row:visible").count();
    await page.click(`.g-courses button[data-c="${c}"]`);
    const vis = await page.locator(".g-row:visible").count();
    expect(vis).toBeGreaterThan(0);
    expect(vis).toBeLessThan(total);
    // көрінетін әр жол сол курстікі
    const bad = await page.locator(".g-row:visible").evaluateAll((rows, c) => rows.filter((r) => !(r.dataset.c || "x").split(" ").includes(c)).length, c);
    expect(bad).toBe(0);
    // жасырын жолдар шынымен көрінбейді (display:none)
    const leaked = await page.locator(".g-row[hidden]").evaluateAll((rows) => rows.filter((r) => getComputedStyle(r).display !== "none").length);
    expect(leaked).toBe(0);
    // көрінетін әр әріп тақырыбының астында кемінде бір көрінетін термин бар
    const emptyLetters = await page.locator(".g-letter:visible").evaluateAll((hs) => hs.filter((h) => { let e = h.nextElementSibling; while (e && e.classList.contains("g-row")) { if (!e.hidden) return false; e = e.nextElementSibling; } return true; }).length);
    expect(emptyLetters).toBe(0);
    await expect(page.locator(".g-count")).toHaveText(`${vis} термин`);
    expect(errs).toEqual([]);
  });
}
test("сөздік: курс сүзгісі + іздеу бірге жұмыс істейді", async ({ page, context }) => {
  await blockFonts(context);
  await page.goto("glossary.html");
  await page.click('.g-courses button[data-c="ai"]');
  await page.fill(".g-search input", "heuristic");
  const rows = await page.locator(".g-row:visible").evaluateAll((r) => r.map((x) => x.dataset.c));
  expect(rows.length).toBeGreaterThan(0);
  expect(rows.every((c) => c.split(" ").includes("ai"))).toBe(true);
});
