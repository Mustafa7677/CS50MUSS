// © 2026 Sagid Mustafa. AO17 Академия 2.0: бағыттар × сатылар (Негіз → Junior → Middle → Senior).
// Ереже: дайын модуль - жұмыс істейтін сілтеме; жоспардағы модуль сілтемесіз және «жоспарда» деп белгіленеді.
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const { blockFonts, collectErrors } = require("../support/helpers");
const AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const TRACKS = ["software", "data-ai", "systems", "web", "math"];

test("хаб: бес бағыт, әрқайсысының баспалдағы және адал санағышы", async ({ page }) => {
  await blockFonts(page.context());
  const errs = collectErrors(page);
  await page.goto("academy/index.html");
  const rows = page.locator("#tracks .tl-row");
  await expect(rows).toHaveCount(5);
  for (let i = 0; i < 5; i++) {
    const r = rows.nth(i);
    await expect(r.locator("a")).toHaveAttribute("href", `tracks/${TRACKS[i]}.html`);
    const [ok, plan] = [await r.locator(".tl-ok").count(), await r.locator(".tl-plan").count()];
    await expect(r.locator(".tl-mini small")).toContainText(`${ok} / ${ok + plan} модуль дайын`);
  }
  expect(errs).toEqual([]);
});

test("бағыт беті: 4 саты, дайын модульдің сілтемесі ашылады, жоспардағысы сілтемесіз", async ({ page, request }) => {
  test.setTimeout(90_000);
  await blockFonts(page.context());
  const errs = collectErrors(page);
  for (const id of TRACKS) {
    await page.goto(`academy/tracks/${id}.html`);
    await expect(page.locator(".tl-grade")).toHaveCount(4);
    await expect(page.locator(".tl-grade h2")).toHaveText(["Негіз", "Junior", "Middle", "Senior"]);
    await expect(page.locator(".tl-plan a")).toHaveCount(0);
    const plans = page.locator(".tl-mods .tl-plan .tl-kind");
    for (let i = 0; i < await plans.count(); i++) await expect(plans.nth(i)).toContainText("жоспарда");
    const hrefs = await page.locator(".tl-mods .tl-ok a").evaluateAll((as) => as.map((a) => a.href));
    expect(hrefs.length, id).toBeGreaterThan(0);
    for (const h of hrefs) expect((await request.get(h.split("#")[0])).status(), h).toBe(200);
    // баспалдақтағы дайын сызықтар саны тізімдегі дайын модульдер санына тең
    await expect(page.locator(".tl-big .tl-ok")).toHaveCount(hrefs.length);
  }
  await page.locator('.tl-steps a[href="#g-senior"]').click();
  await expect(page).toHaveURL(/#g-senior$/);
  expect(errs).toEqual([]);
});

for (const scheme of ["light", "dark"]) {
  test(`бағыт беті (${scheme}): телефонда көлденең жылжу жоқ, a11y`, async ({ browser }) => {
    const c = await browser.newContext({ viewport: { width: 360, height: 740 }, colorScheme: scheme, reducedMotion: "reduce" });
    await blockFonts(c);
    const p = await c.newPage();
    const problems = [];
    for (const url of ["academy/tracks/software.html", "academy/tracks/math.html", "academy/index.html"]) {
      await p.goto(url);
      expect(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), url).toBe(true);
      await p.addScriptTag({ content: AXE });
      const v = await p.evaluate(async () => (await axe.run(document.querySelector("#main"), { runOnly: ["wcag2a", "wcag2aa"], resultTypes: ["violations"] })).violations
        .filter((x) => x.impact === "serious" || x.impact === "critical").map((x) => `${x.id} (${x.nodes.length}): ${x.nodes[0].target.join(" ")}`));
      v.forEach((x) => problems.push(`${url}: ${x}`));
    }
    expect(problems, problems.join("\n")).toEqual([]);
    await c.close();
  });
}
