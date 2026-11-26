// © 2026 AO17 командасы. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md.
// AO17 CS курсы (academy/course.html): екі бөлім. 1-бөлім - 12 апта (сабақтар, комикс эпизоды, 3D сабақ, жоба),
// 2-бөлім - 3D зертханалар ұсынылатын ретпен. Оқушы прогресі (assets/js/course.js) апта мен зертхана астында, «Жалғастыру» батырмасы.
// Тексереміз: апталар саны мен сілтемелері (сабақ беті бар, комикс бөлімі бар), 3D зертхана сілтемелері AO17-нің ішінде,
// Course JSON-LD, басты беттің негізгі батырмасы, телефонда көлденең жылжу жоқ, axe таза.
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "../..");
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
  await expect(page.locator('#story a.btn[href="academy/course.html"]')).toHaveText("AO17 CS курсы");
  // басты беттегі AO17 CS бөлімі: курсқа батырма және 12 аптаның мұқабасы
  await expect(page.locator('#ao17cs a.btn.gold')).toHaveAttribute("href", "academy/course.html");
  await expect(page.locator("#ao17cs .csh-shelf a")).toHaveCount(12);
  await expect(page.locator("#ao17cs .csh-shelf a").first()).toHaveAttribute("href", "academy/course.html#w1");
  await page.goto("academy/index.html");
  await expect(page.locator('.ac-cta a.btn.gold')).toHaveAttribute("href", "course.html");
});

test("екі бөлім: 2-бөлімде 3D зертханалар ұсынылатын ретпен, әр зертхананың бірінші сабағы бар бет", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto("academy/course.html");
  await expect(page.locator(".crs-parts a.crs-part")).toHaveCount(2);
  await expect(page.locator("#part1 .crs-w")).toHaveCount(12);
  const labs = page.locator("#part2 .crs-lab");
  await expect(labs).toHaveCount(11);
  await expect(labs.first()).toHaveAttribute("id", "lab-arch");
  await expect(labs.first().locator(".crs-ln")).toHaveText("1");
  await expect(labs.first().locator(".crs-l1 a")).toHaveText("Екілік жүйе");
  for (const h of await page.locator("#part2 .crs-l1 a").evaluateAll((as) => as.map((a) => a.getAttribute("href"))))
    expect(fs.existsSync(path.join(ROOT, "academy", h)), h).toBe(true);
  // прогресс жоқ: жолақтар мен жеке жазу көрінбейді, батырма 1-аптаға апарады
  await expect(page.locator(".has-pr")).toHaveCount(0);
  await expect(page.locator("#crs-me")).toBeHidden();
  await expect(page.locator("#crs-go")).toHaveAttribute("href", "m01/l01.html");
  expect(errors).toEqual([]);
});

test("прогресс: апта мен зертхана астында шығады, «Жалғастыру» 1-бөлімнің келесі сабағына апарады", async ({ page }) => {
  await page.goto("academy/course.html");
  const data = JSON.parse(await page.locator("#crs-data").textContent());
  const w1 = data.weeks.w1, arch1 = data.labs.arch[0];
  await page.evaluate(([w1, arch1]) => {
    const L = {};
    w1.slice(0, 3).forEach((x) => (L[x[0]] = { ex: { "exercises:0": { ok: true } }, mastered: 1 }));
    localStorage.setItem("cs50kz:academy", JSON.stringify({ v: 1, lessons: L }));
    localStorage.setItem("ao17:lab3d", JSON.stringify({ [arch1[0]]: Array.from({ length: arch1[3] }, (_, i) => "q" + i) }));
  }, [w1, arch1]);
  await page.reload();
  await expect(page.locator("#w1 .crs-pr")).toHaveText(`3 / ${w1.length} сабақ аяқталды`);
  await expect(page.locator("#lab-arch .crs-pr")).toHaveText(`1 / ${data.labs.arch.length} сабақ аяқталды`);
  await expect(page.locator("#w2.has-pr")).toHaveCount(0);
  await expect(page.locator("#crs-me")).toContainText("1-бөлім - 3 / 120");
  // 1-бөлім басталған, бітпеген: 3D сабағы шешілсе де, келесі қадам - 1-бөлімнің 4-сабағы
  await expect(page.locator("#crs-go")).toHaveAttribute("href", w1[3][1]);
  await expect(page.locator("#crs-go")).toHaveText("Жалғастыру: " + w1[3][2]);
  // мұқаба коллекциясы: 2-аптаның бәрі аяқталса - мұқабасы «жиналды»
  await page.evaluate((w2) => {
    const d = JSON.parse(localStorage.getItem("cs50kz:academy"));
    w2.forEach((x) => (d.lessons[x[0]] = { ex: { "exercises:0": { ok: true } }, mastered: 1 }));
    localStorage.setItem("cs50kz:academy", JSON.stringify(d));
  }, data.weeks.w2);
  await page.reload();
  await expect(page.locator("#w2.is-got")).toHaveCount(1);
  await expect(page.locator(".crs-w.is-got")).toHaveCount(1);
  await expect(page.locator("#crs-me")).toContainText("Мұқаба коллекциясы: 1 / 12");
  // тек 2-бөлімде әрекет болса - 2-бөлімнің келесі сабағы
  await page.evaluate(() => localStorage.removeItem("cs50kz:academy"));
  await page.reload();
  await expect(page.locator("#crs-go")).toHaveAttribute("href", data.labs.arch[1][1]);
  await page.addScriptTag({ content: AXE });
  const v = await page.evaluate(async () => (await axe.run(document.getElementById("main"), { runOnly: ["wcag2a", "wcag2aa"], resultTypes: ["violations"] })).violations
    .filter((x) => ["serious", "critical"].includes(x.impact)).map((x) => `${x.id}: ${x.nodes.length} (${x.nodes[0].html.slice(0, 140)})`));
  expect(v).toEqual([]);
});

test("курс картасы: 12 апта мен 11 зертхана бекеті, сілтемелері бар, прогресс бекеттерді бояйды", async ({ page }) => {
  await page.goto("academy/course.html");
  const st = page.locator(".crs-map .cm-st");
  await expect(st).toHaveCount(23);
  for (const h of await st.evaluateAll((a) => a.map((x) => x.getAttribute("href")))) await expect(page.locator(h), h).toHaveCount(1);
  await expect(page.locator('.crs-map [data-st="w1"]')).toHaveAttribute("href", "#w1");
  await expect(page.locator('.crs-map [data-st="arch"]')).toHaveAttribute("href", "#lab-arch");
  await expect(page.locator(".crs-map .cm-x")).toHaveCount(13);   // аптада қолданылатын 3D зертханаға ауысулар
  await expect(page.locator(".crs-map .st-done, .crs-map .st-on, .crs-map .st-next")).toHaveCount(0);
  const data = JSON.parse(await page.locator("#crs-data").textContent());
  await page.evaluate((d) => {
    const L = {};
    d.weeks.w1.forEach((x) => (L[x[0]] = { ex: {}, mastered: 1 }));
    L[d.weeks.w2[0][0]] = { ex: { "exercises:0": { ok: true } }, score: 10 };
    localStorage.setItem("cs50kz:academy", JSON.stringify({ v: 1, lessons: L }));
    localStorage.setItem("ao17:lab3d", JSON.stringify({ [d.labs.arch[0][0]]: ["q1"] }));
  }, data);
  await page.reload();
  await expect(page.locator('.crs-map [data-st="w1"]')).toHaveClass(/st-done/);
  await expect(page.locator('.crs-map [data-st="w2"]')).toHaveClass(/st-on/);
  await expect(page.locator('.crs-map [data-st="w2"]')).toHaveClass(/st-next/);
  await expect(page.locator('.crs-map [data-st="arch"]')).toHaveClass(/st-on/);
  await expect(page.locator(".crs-map .st-next")).toHaveCount(1);
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
