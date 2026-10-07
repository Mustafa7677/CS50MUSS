const { test, expect } = require("@playwright/test");
const { blockFonts, collectErrors } = require("../support/helpers");

test("қорытынды емтихан: тапсыру, сақталу, нәтиже, сертификат", async ({ page, context }) => {
  await blockFonts(context);
  const errs = collectErrors(page);
  await page.goto("exam.html");
  await page.click(".ex-start");
  await expect(page.locator(".ex-opts button").first()).toBeVisible();
  const n = await page.evaluate(() => JSON.parse(localStorage.getItem("cs50kz:exam-run")).qs.length);
  expect(n).toBe(24);
  for (let i = 0; i < n; i++) {
    if (i === 3) { await page.reload(); await expect(page.locator(".ex-meta span").first()).toHaveText("Сұрақ 4 / 24"); }
    // Келесі сұрақ шынымен шыққанын күтеміз: әйтпесе жүктеме кезінде алдыңғы сұрақтың батырмасы басылып кетеді
    await expect(page.locator(".ex-meta span").first()).toHaveText(`Сұрақ ${i + 1} / 24`);
    const a = await page.evaluate((i) => JSON.parse(localStorage.getItem("cs50kz:exam-run")).qs[i].a, i);
    const cnt = await page.locator(".ex-opts button").count();
    await page.locator(".ex-opts button").nth(i < 20 ? a : (a + 1) % cnt).click();
    if (i < n - 1) await page.click(".ex-next");
  }
  await page.click(".ex-next");
  await expect(page.locator(".ex-ring b")).toHaveText("83%");
  await expect(page.locator(".ex-bar")).toHaveCount(12);
  await page.goto("certificate.html");
  await expect(page.locator(".cert-exam")).toContainText("83%");
  expect(errs).toEqual([]);
});
