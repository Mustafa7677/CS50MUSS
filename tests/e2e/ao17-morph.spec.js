// © 2026 AO17 командасы. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md.
// AO17 MORPH (tools/academy/morph.py, assets/js/ao17-morph.js). Тексереміз: матрица - формула -> пішін (слайдер, дайын матрица,
// анықтауыш, меншікті мәндер, проекция) және пішін -> формула (нұсқарды сүйресең, матрица өзгереді); комплекс функция -
// w нүктесін сүйресең, алғы бейнелер саны (z² - 2, z³ - 3), жергілікті созылу; Фурье - шеңбер саны қатені азайтады, өз
// суретіңді салу; бет ережесі, хаб, мәзір; 360px, axe.
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const ROOT = path.resolve(__dirname, "../..");
const { blockFonts, collectErrors } = require("../support/helpers");
const AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");

async function open(page) {
  await blockFonts(page.context());
  await page.goto("academy/morph.html");
  await expect(page.locator("[data-mo-mread]")).toContainText("det A");
}
// canvas-тағы әлем нүктесіне (x, y) сүйреу; R - canvas-тың әлем ауқымы
async function dragTo(page, sel, R, from, to) {
  await page.locator(sel).scrollIntoViewIfNeeded();
  const b = await page.locator(sel).boundingBox();
  const px = (p) => [b.x + (p[0] + R) / (2 * R) * b.width, b.y + (R - p[1]) / (2 * R) * b.height];
  await page.mouse.move(...px(from));
  await page.mouse.down();
  await page.mouse.move(...px([(from[0] + to[0]) / 2, (from[1] + to[1]) / 2]), { steps: 4 });
  await page.mouse.move(...px(to), { steps: 4 });
  await page.mouse.up();
}
const num = async (page, sel) => Number((await page.locator(sel).inputValue()));
// range өрісін Playwright fill-мен толтыра алмайды: мәнді қойып, input оқиғасын жібереміз
const setRange = (loc, v) => loc.evaluate((el, x) => { el.value = x; el.dispatchEvent(new Event("input", { bubbles: true })); }, String(v));

test.use({ contextOptions: { reducedMotion: "reduce" } });

test("матрица: формула -> пішін (анықтауыш, меншікті мәндер, дайын матрицалар) және пішін -> формула (нұсқарды сүйреу)", async ({ page }) => {
  const errs = collectErrors(page);
  await open(page);
  // бастапқы мысал: a=1.1, b=-1, c=0.5, d=-0.9 -> det = -0.49
  await expect(page.locator("[data-mo-mread]")).toContainText("det A = ad − bc = −0.49");
  await expect(page.locator("[data-mo-mread]")).toContainText("бағыты аударылады");
  await expect(page.locator("[data-mo-mread]")).toContainText("λ₁ = 0.81, λ₂ = −0.61");
  await page.locator('[data-preset="rot"]').click();
  await expect(page.locator("[data-mo-mread]")).toContainText("комплекс: 0.7 ± 0.7i");
  await page.locator('[data-preset="proj"]').click();
  await expect(page.locator("[data-mo-mread]")).toContainText("Жазықтық сызыққа (не нүктеге) жаншылды");
  await page.locator('[data-mn="d"]').fill("2");
  await page.locator('[data-mn="d"]').dispatchEvent("change");
  await expect(page.locator("[data-mo-mread]")).toContainText("det A = ad − bc = 2");
  await expect(page.locator('[data-m="d"]')).toHaveValue("2");
  // пішін -> формула: î нұсқарының ұшын (1, 0)-ден (2, 1)-ге сүйресек, a = 2, c = 1
  await page.locator("[data-mo-reset]").click();
  await expect(page.locator("[data-mo-mread]")).toContainText("det A = ad − bc = 1");
  await dragTo(page, "[data-mo-mcv]", 3.2, [1, 0], [2, 1]);
  expect(await num(page, '[data-mn="a"]')).toBe(2);
  expect(await num(page, '[data-mn="c"]')).toBe(1);
  await expect(page.locator("[data-mo-mread]")).toContainText("det A = ad − bc = 2");
  // ĵ ұшын (0, 1)-ден (-1, 1)-ге: b = -1, d = 1 -> det = 2·1 − (−1)·1 = 3
  await dragTo(page, "[data-mo-mcv]", 3.2, [0, 1], [-1, 1]);
  await expect(page.locator("[data-mo-mread]")).toContainText("det A = ad − bc = 3");
  expect((await page.evaluate(() => JSON.parse(localStorage.getItem("ao17cs:morph")).m))).toEqual([2, -1, 1, 1]);
  expect(errs).toEqual([]);
});

test("комплекс функция: w-ны сүйресең, алғы бейнелер (z² - 2, z³ - 3); созылу мен бұру; полюс", async ({ page }) => {
  await open(page);
  const rd = page.locator("[data-mo-cread]");
  await expect(rd).toContainText("f(z) = z²: z = 0.8 + 0.6i → w = 0.28 + 0.96i");
  await expect(rd).toContainText("|f′(z)| = 2 есе, бұру 36.87°");
  await dragTo(page, "[data-mo-wcv]", 4, [0.28, 0.96], [-1, 1]);
  await expect(rd).toContainText("Алғы бейнелер: 2.");
  await page.locator('[data-fn="cube"]').click();
  await expect(page.locator('[data-fn="cube"]')).toHaveAttribute("aria-pressed", "true");
  await dragTo(page, "[data-mo-wcv]", 4, [0, 0], [1, 1]);
  await expect(rd).toContainText("Алғы бейнелер: 3.");
  // пернетақта: z жазықтығында оңға - z нақты бөлігі 0.05-ке өседі; w жазықтығында жоғары - алғы бейнелер шығады
  await page.locator('[data-fn="sq"]').click();
  await page.evaluate(() => document.querySelector("[data-morph]")._morphComplex.setZ(0.8, 0.6));
  await page.locator("[data-mo-zcv]").focus();
  await page.keyboard.press("ArrowRight");
  await expect(rd).toContainText("z = 0.85 + 0.6i");
  await expect(rd).not.toContainText("Алғы бейнелер");
  await page.locator("[data-mo-wcv]").focus();
  await page.keyboard.press("Shift+ArrowUp");
  await expect(rd).toContainText("Алғы бейнелер: 2.");
  await page.locator('[data-fn="inv"]').click();
  await page.evaluate(() => document.querySelector("[data-morph]")._morphComplex.setZ(0, 0));
  await expect(rd).toContainText("полюс");
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("ao17cs:morph")).fn)).toBe("inv");
});

test("Фурье: шеңбер көбейсе, қате азаяды; өз сурет -> коэффициенттер", async ({ page }) => {
  await open(page);
  const rd = page.locator("[data-mo-fread]");
  await expect(page.locator('[data-shape="oyu"]')).toHaveAttribute("aria-pressed", "true");
  // азайтылған қозғалыс: өзі ойнамайды, бірақ батырмамен ойнайды
  const play = page.locator("[data-mo-fplay]");
  await expect(play).toHaveText("Ойнату");
  await play.click();
  await expect(play).toHaveText("Тоқтату");
  // экраннан тыс болса, кадр салынбайды; қайта көрінгенде анимация жалғасады
  const frames = () => page.evaluate(() => document.querySelector("[data-morph]")._morphFourier.frames());
  await page.locator("#matrix").scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  const f1 = await frames();
  await page.waitForTimeout(500);
  expect(await frames()).toBe(f1);
  await page.locator("[data-mo-fcv]").scrollIntoViewIfNeeded();
  await expect.poll(frames).toBeGreaterThan(f1 + 5);
  await play.click();
  await expect(play).toHaveText("Ойнату");
  const err = () => page.evaluate(() => document.querySelector("[data-morph]")._morphFourier.err());
  await setRange(page.locator("[data-mo-k]"), 2);
  const e2 = await err();
  await setRange(page.locator("[data-mo-k]"), 128);
  const e128 = await err();
  expect(e128).toBeLessThan(e2 / 5);
  await expect(rd).toContainText("128 шеңбер");
  await page.locator('[data-shape="square"]').click();
  await expect(rd).toContainText("Ең үлкен мүшелер");
  // өзің сал: шеңбер сызамыз -> бір мүше жетеді
  await page.locator('[data-shape="draw"]').click();
  await expect(rd).toHaveText("Тордың үстінде тышқанмен не саусақпен бір тұйық сызық сал.");
  await expect(page.locator("[data-mo-fcv]")).toHaveClass(/is-draw/);   // тек осы кезде canvas бетті жылжытпайды
  const b = await page.locator("[data-mo-fcv]").boundingBox();
  const cx = b.x + b.width / 2, cy = b.y + b.height / 2, r = b.width * 0.3;
  await page.mouse.move(cx + r, cy);
  await page.mouse.down();
  for (let i = 1; i <= 60; i++) await page.mouse.move(cx + r * Math.cos(i / 60 * 2 * Math.PI), cy + r * Math.sin(i / 60 * 2 * Math.PI));
  await page.mouse.up();
  await expect(page.locator('[data-shape="draw"]')).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("[data-mo-fcv]")).not.toHaveClass(/is-draw/);
  await setRange(page.locator("[data-mo-k]"), 1);
  expect(await err()).toBeLessThan(0.05);   // шеңбер = бір айналатын шеңбер
  await expect(rd).toContainText("1 шеңбер");
});

test("терезе өлшемі өзгерсе, төрт canvas та қайта салынады", async ({ page }) => {
  await open(page);
  await page.setViewportSize({ width: 900, height: 800 });
  await page.evaluate(() => window.dispatchEvent(new Event("resize")));
  await page.waitForTimeout(400);
  // fit() canvas-ты мөлдір етеді, draw() фонмен толтырады: мөлдір пиксель - сурет салынбаған
  const alpha = await page.evaluate(() => ["mcv", "zcv", "wcv", "fcv"].map((k) => document.querySelector("[data-mo-" + k + "]").getContext("2d").getImageData(3, 3, 1, 1).data[3]));
  expect(alpha).toEqual([255, 255, 255, 255]);
});

test("бет ережесі: жария; хабта бар; тоғыз математика сабағынан тиісті сахнаға сілтеме", async ({ page }) => {
  await blockFonts(page.context());
  await page.goto("academy/index.html");
  await expect(page.locator('.ac-cta a[href="morph.html"]')).toHaveText("AO17 MORPH");
  const out = execFileSync("python3", ["-c", "import sys; sys.path.insert(0, 'tools'); import gate; print(gate.page_rule('academy/morph.html'))"], { cwd: ROOT, encoding: "utf8" }).trim();
  expect(out).toBe("None");
  // сабақтан MORPH-қа: tools/math_pedagogy.py қояды (дереккөз - morph.py LINKS)
  const want = { matrix: [10, 12, 13, 14], complex: [67, 68, 69], fourier: [73, 74] };
  for (const [scene, weeks] of Object.entries(want)) {
    for (const w of weeks) {
      const s = fs.readFileSync(path.join(ROOT, `math/lectures/week-${w}.html`), "utf8");
      expect(s, `week-${w}`).toContain(`<a href="../../academy/morph.html#${scene}">MORPH-та ашу</a>`);
    }
  }
  // сілтеме апаратын сахна шынымен бар
  await page.goto("academy/morph.html#fourier");
  await expect(page.locator("#fourier[data-scene]")).toBeVisible();
});

for (const scheme of ["light", "dark"]) {
  test(`360px, ${scheme}: көлденең жылжымайды, axe таза`, async ({ browser }) => {
    const c = await browser.newContext({ viewport: { width: 360, height: 760 }, colorScheme: scheme, reducedMotion: "reduce" });
    await blockFonts(c);
    const p = await c.newPage();
    const errs = collectErrors(p);
    await p.goto("academy/morph.html");
    await expect(p.locator("[data-mo-mread]")).toContainText("det A");
    expect(await p.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
    await p.addScriptTag({ content: AXE });
    const v = await p.evaluate(async () => (await axe.run(document.getElementById("main"), { runOnly: ["wcag2a", "wcag2aa"], resultTypes: ["violations"] })).violations
      .filter((x) => x.impact === "serious" || x.impact === "critical").map((x) => `${x.id}: ${x.nodes[0].target.join(" ")}`));
    expect(v, v.join("\n")).toEqual([]);
    expect(errs).toEqual([]);
    await c.close();
  });
}
