const { test, expect } = require("@playwright/test");
const { blockFonts, routeSupabase, collectErrors } = require("../support/helpers");

async function selectText(page, selector) {
  await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    el.scrollIntoView({ block: "center" });
    const r = document.createRange();
    r.selectNodeContents(el);
    const s = getSelection(); s.removeAllRanges(); s.addRange(r);
  }, selector);
}

test("мәтінді белгілеп қатені хабарлау: бұлт жоқ болса GitHub issue ұсынылады", async ({ page, context }) => {
  await blockFonts(context);
  await context.route(/supabase\.co/, (r) => r.abort());
  const errs = collectErrors(page);
  await page.goto("lectures/week-1.html");
  await page.waitForFunction(() => window.CS50KZ_FEEDBACK);
  await selectText(page, "#intro ~ p");
  await expect(page.locator(".fb-fab")).toBeVisible();
  await page.click(".fb-fab");
  await expect(page.locator(".fb-quote")).not.toBeEmpty();
  await expect(page.locator(".fb-where")).toContainText("lectures/week-1.html");
  await page.click(".fb-send");
  await expect(page.locator(".fb-result.bad")).toContainText("Хабарламаны жазыңыз");
  await page.fill(".fb-msg", "Бұл жерде «бастапқы код» деген дұрысырақ.");
  await page.click(".fb-send");
  const link = page.locator(".fb-result.bad a");
  await expect(link).toBeVisible();
  const href = decodeURIComponent(await link.getAttribute("href"));
  expect(href).toContain("github.com/Mustafa7677/CS50MUSS/issues/new");
  expect(href).toContain("lectures/week-1.html");
  expect(href).toContain("бастапқы код");
  expect(errs.filter((e) => !/supabase/.test(e))).toEqual([]);
});

test("футердегі «Пікір қалдыру» және бұлтқа жіберу", async ({ page, context }) => {
  test.skip(!process.env.CLOUD_MOCK, "CLOUD_MOCK орнатылмаған");
  await blockFonts(context);
  await routeSupabase(context, process.env.CLOUD_MOCK);
  const errs = collectErrors(page);
  await page.goto("index.html");
  await page.waitForFunction(() => window.CS50KZ_FEEDBACK);
  await page.click(".fb-open");
  await expect(page.locator('.fb-kinds input[value="idea"]')).toBeChecked();
  await page.fill(".fb-msg", "Керемет сайт! Тағы бір детектив қосыңыз.");
  await page.click(".fb-send");
  await expect(page.locator(".fb-result.ok")).toContainText("Рахмет");
  expect(await page.evaluate(() => !!JSON.parse(localStorage.getItem("cs50kz:used")).feedback)).toBe(true);
  expect(errs).toEqual([]);
});
