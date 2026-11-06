// © 2026 Sagid Mustafa. AO17 CS Universe: сабақ беті v2 - эмблема, анимациялық түсіндіру, дәлелдеуді қадамдап оқу, мазмұн.
// Әр модульден бір сабақ (12 бет) тексеріледі; қолжетімділік (axe) - екі режимде үш сабақта.
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const { blockFonts, collectErrors } = require("../support/helpers");
const AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");

const SAMPLE = Array.from({ length: 12 }, (_, i) => `academy/m${String(i + 1).padStart(2, "0")}/l0${(i % 9) + 1}.html`);

test("әр модульдің сабағы: эмблема, фолио, анимация ойнатқышы, қатесіз", async ({ page }) => {
  test.setTimeout(120_000);
  await blockFonts(page.context());
  await page.context().route(/cdn\.jsdelivr\.net|unpkg\.com|supabase\.co/, (r) => r.abort());
  const errs = collectErrors(page);
  for (const url of SAMPLE) {
    await page.goto(url);
    await expect(page.locator(".ac-head .ac-emblem")).toHaveCount(1);
    await expect(page.locator(".ac-folio")).toContainText(url.slice(9, 11));
    const box = page.locator("[data-anim]");
    await expect(box).toHaveClass(/on/);
    const n = await box.locator("li").count();
    expect(n, url).toBeGreaterThanOrEqual(3);
    await box.scrollIntoViewIfNeeded();
    await expect(box.locator(".ac-anim-n")).toHaveText(`1 / ${n} қадам`);   // экранға кіргенде бірінші қадам өзі ашылады
    await box.locator("[data-a=next]").click();
    await expect(box.locator("li.cur")).toHaveCount(1);
    await expect(box.locator("li.shown")).toHaveCount(2);
    await box.locator("[data-a=all]").click();
    await expect(box).toHaveClass(/done/);
    await expect(box.locator("li.shown")).toHaveCount(n);
  }
  expect(errs).toEqual([]);
});

test("анимация: ойнату барлық қадамды ашады, пернетақта ← → басқарады, ойнату қайта басталады", async ({ page }) => {
  await blockFonts(page.context());
  await page.goto("academy/m02/l07.html");
  const box = page.locator("[data-anim]");
  await box.scrollIntoViewIfNeeded();
  const n = await box.locator("li").count();
  await box.locator("[data-a=play]").click();
  await expect(box.locator(".ac-anim-n")).toHaveText(`${n} / ${n} қадам`, { timeout: 3_000 * n + 2_000 });
  await expect(box.locator("[data-a=play]")).toHaveText(/Қайта ойнату/);
  await box.focus();
  await page.keyboard.press("ArrowLeft");
  await expect(box.locator(".ac-anim-n")).toHaveText(`${n - 1} / ${n} қадам`);
  await page.keyboard.press("ArrowRight");
  await expect(box).toHaveClass(/done/);
});

test("дәлелдеу сөйлем-сөйлеммен ашылады; мазмұнда оқылып жатқан бөлім белгіленеді", async ({ page }) => {
  await blockFonts(page.context());
  await page.goto("academy/m02/l07.html");
  const card = page.locator(".ac-proof").first();
  const btn = card.locator(".ac-proof-btn");
  await btn.click();
  await expect(card).toHaveClass(/stepping/);
  const total = await card.locator(".ac-ps").count();
  expect(total).toBeGreaterThanOrEqual(3);
  await expect(card.locator(".ac-ps.lit")).toHaveCount(1);
  for (let i = 1; i < total; i++) await btn.click();
  await expect(card).toHaveClass(/proved/);
  await expect(btn).toBeDisabled();
  await page.locator("#s-g").scrollIntoViewIfNeeded();
  await expect(page.locator('.ac-toc a[href="#s-g"]')).toHaveClass(/on/);
});

test("қозғалыс азайтылса: барлық қадам бірден көрінеді; телефонда көлденең жылжу жоқ", async ({ browser }) => {
  const c = await browser.newContext({ viewport: { width: 360, height: 740 }, reducedMotion: "reduce" });
  await blockFonts(c);
  const p = await c.newPage();
  for (const url of ["academy/m01/l01.html", "academy/m09/l03.html", "academy/m11/l02.html"]) {
    await p.goto(url);
    const n = await p.locator("[data-anim] li").count();
    await expect(p.locator("[data-anim] .ac-anim-n")).toHaveText(`${n} / ${n} қадам`);
    expect(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), url).toBe(true);
  }
  await c.close();
});

for (const scheme of ["light", "dark"]) {
  test(`a11y (${scheme}): жаңа сабақ тақырыбы мен ойнатқыш`, async ({ browser }) => {
    test.setTimeout(120_000);
    const c = await browser.newContext({ colorScheme: scheme, reducedMotion: "reduce" });
    await blockFonts(c);
    const p = await c.newPage();
    const problems = [];
    for (const url of ["academy/m03/l01.html", "academy/m09/l03.html", "academy/m12/l10.html"]) {
      await p.goto(url);
      await p.addScriptTag({ content: AXE });
      const v = await p.evaluate(async () => (await axe.run(document.querySelector(".ac-lesson"), { runOnly: ["wcag2a", "wcag2aa"], resultTypes: ["violations"] })).violations
        .filter((x) => x.impact === "serious" || x.impact === "critical").map((x) => `${x.id} (${x.nodes.length}): ${x.nodes[0].target.join(" ")}`));
      v.forEach((x) => problems.push(`${url}: ${x}`));
    }
    expect(problems, problems.join("\n")).toEqual([]);
    await c.close();
  });
}
