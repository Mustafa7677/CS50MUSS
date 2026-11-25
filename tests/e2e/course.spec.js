// © 2026 AO17 командасы. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md.
// AO17 CS курсы (academy/course.html): 12 апта, әр аптада сабақтар, комикс эпизоды, INSIDE TECH 3D зертханасы, жоба.
// Тексереміз: апталар саны мен сілтемелері (сабақ беті бар, комикс бөлімі бар), 3D зертхана сілтемелері AO17-нің ішінде,
// Course JSON-LD, басты беттің негізгі батырмасы, телефонда көлденең жылжу жоқ, axe таза.
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const { blockFonts, collectErrors } = require("../support/helpers");
const AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
// 3D зертхана AO17-нің ішінде: сабақ - 3d/<зертхана>/<id>.html, ойын беттері - 3d/app/index.html#<маршрут>
const INTERNAL = /^3d\/([a-z]+\/[a-z0-9-]+\.html|app\/index\.html#(blackbox|parsons|journey))$/;

test("12 апта: әрқайсысында сабақ, комикс, 3D зертхана сабағы; сілтемелер нақты беттерге апарады", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto("academy/course.html");
  const weeks = page.locator(".crs-w");
  await expect(weeks).toHaveCount(12);
  for (let i = 0; i < 12; i++) {
    const w = weeks.nth(i);
    await expect(w.locator(".crs-wn b")).toHaveText(String(i + 1));
    await expect(w.locator(".crs-comic a")).toHaveAttribute("href", `m${String(i + 1).padStart(2, "0")}/l01.html#s-comic`);
    const labs = await w.locator(".crs-3d a").evaluateAll((as) => as.map((a) => [a.getAttribute("href"), a.getAttribute("target"), a.getAttribute("rel")]));
    expect(labs.length).toBeGreaterThan(0);
    for (const [href] of labs) expect(href, href).toMatch(INTERNAL);
  }
  // 1-аптаның сабағы мен комиксі шынымен бар
  await page.goto("academy/m01/l01.html?nofilm");
  await expect(page.locator("#s-comic .cx-p")).toHaveCount(6);
  expect(errors).toEqual([]);
});

test("Course JSON-LD жарамды; басты беттің негізгі батырмасы курсқа апарады", async ({ page }) => {
  await page.goto("academy/course.html");
  const ld = await page.locator('script[type="application/ld+json"]').evaluateAll((s) => s.map((x) => JSON.parse(x.textContent)));
  const course = ld.find((x) => x["@type"] === "Course");
  expect(course.name).toBe("AO17 CS: Компьютерлік ғылымға кіріспе");
  expect(course.isAccessibleForFree).toBe(true);
  expect(course.hasCourseInstance.courseWorkload).toMatch(/^PT\d+H$/);
  await page.goto("index.html?nofilm");
  await expect(page.locator('a.btn[href="academy/course.html"]')).toHaveText("AO17 CS курсы");
  await page.goto("academy/index.html");
  await expect(page.locator('.ac-cta a.btn.gold')).toHaveAttribute("href", "course.html");
});

for (const scheme of ["light", "dark"]) {
  test(`360px, ${scheme}: курс беті көлденең жылжымайды, axe таза`, async ({ browser }) => {
    const c = await browser.newContext({ viewport: { width: 360, height: 740 }, colorScheme: scheme, reducedMotion: "reduce" });
    await blockFonts(c);
    const p = await c.newPage();
    await p.goto("academy/course.html");
    expect(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await p.addScriptTag({ content: AXE });
    const v = await p.evaluate(async () => (await axe.run(document.getElementById("main"), { runOnly: ["wcag2a", "wcag2aa"], resultTypes: ["violations"] })).violations
      .filter((x) => ["serious", "critical"].includes(x.impact)).map((x) => `${x.id}: ${x.nodes.length} (${x.nodes[0].html.slice(0, 140)})`));
    expect(v).toEqual([]);
    await c.close();
  });
}
