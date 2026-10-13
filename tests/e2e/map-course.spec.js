const { test, expect } = require("@playwright/test");
const { blockFonts, collectErrors } = require("../support/helpers");

// Курс картасы: әр курстың өз картасы, лекциялар сол курстан, прогресс сол курстың кілттерімен.
for (const [c, n, code] of [["python", 10, "CS50P"], ["sql", 7, "CS50 SQL"], ["ai", 7, "CS50 AI"], ["web", 9, "CS50 Web"]]) {
  test(`курс картасы: ${code}`, async ({ page, context }) => {
    await blockFonts(context);
    const errs = collectErrors(page);
    await page.addInitScript((c) => {
      localStorage.setItem("cs50kz:progress", JSON.stringify({ read: { [c + ":week-0"]: 1 }, quiz: {} }));
    }, c);
    await page.goto(`map.html?course=${c}`);
    await expect(page.locator(".map-stop")).toHaveCount(n);
    await expect(page.locator(`.map-switch a[data-c="${c}"]`)).toHaveClass(/on/);
    await expect(page.locator(".map-stop.read")).toHaveCount(1);
    await expect(page.locator(".map-stop.next")).toHaveCount(1);
    const hrefs = await page.locator(".map-title").evaluateAll((a) => a.map((x) => x.getAttribute("href")));
    expect(hrefs.every((h) => h.startsWith(`${c}/lectures/`) || h.includes(`/${c}/lectures/`))).toBe(true);
    expect(errs).toEqual([]);
  });
}
test("курс картасы: CS50x өзгермейді", async ({ page, context }) => {
  await blockFonts(context);
  await page.goto("map.html");
  await expect(page.locator(".map-stop")).toHaveCount(12);
  await expect(page.locator('.map-switch a[data-c="x"]')).toHaveClass(/on/);
});
