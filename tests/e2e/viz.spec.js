// © 2026 Sagid Mustafa. AO17 Viz: оқушы басқаратын модельдер нақты есептейді және басқарылады.
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const { routePyodide, blockFonts, collectErrors } = require("../support/helpers");
const AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");

const ready = async (v) => expect(v.locator(".aov-n")).toHaveText(/^1 \/ \d+$/, { timeout: 20_000 });

test("галерея: 20 модель, әрқайсысы қадамдайды, артқа жүреді, жылдамдық бар, қатесіз", async ({ page }) => {
  await blockFonts(page.context());
  await routePyodide(page.context());
  const errs = collectErrors(page);
  await page.goto("academy/models.html");
  const all = page.locator("[data-aov]");
  await expect(all).toHaveCount(20);
  for (const t of ["graph", "cpu", "mem", "func", "gd", "nn", "sort", "bst", "heap", "hash", "matrix", "prob", "logic", "dtree", "kmeans", "linreg", "sched", "tcp", "compiler"]) {
    const v = page.locator(`[data-aov="${t}"]`);
    await ready(v);
    await v.locator("[data-c=fwd]").click();
    await v.locator("[data-c=fwd]").click();
    await expect(v.locator(".aov-n")).toHaveText(/^3 \//);
    await v.locator("[data-c=back]").click();
    await expect(v.locator(".aov-n")).toHaveText(/^2 \//);
    await expect(v.locator(".aov-msg")).not.toBeEmpty();
    await expect(v.locator("[data-c=speed] option")).toHaveCount(5);
  }
  expect(errs).toEqual([]);
});

test("граф: BFS реті және Дейкстра қашықтықтары дұрыс; қате енгізу түсіндіріледі", async ({ page }) => {
  await blockFonts(page.context());
  await page.goto("academy/models.html");
  const v = page.locator('[data-aov="graph"]');
  await ready(v);
  await v.locator("[data-c=seek]").evaluate((e) => { e.value = e.max; e.dispatchEvent(new Event("input")); });
  await expect(v.locator(".aov-msg")).toContainText("A → B → C → D → E");
  await v.locator("select[name=algo]").selectOption("dijkstra");
  await ready(v);
  await v.locator("[data-c=seek]").evaluate((e) => { e.value = e.max; e.dispatchEvent(new Event("input")); });
  await expect(v.locator(".aov-msg")).toContainText("A=0, B=3, C=1, D=8, E=11");   // A→C→B→D→E: 1+2+5+3
  await v.locator("textarea[name=edges]").fill("A-B:4, бұзық");
  await v.locator("textarea[name=edges]").dispatchEvent("change");
  await expect(v.locator(".aov-msg")).toContainText("қате жазылу");
});

test("процессор: 1..5 қосындысы 15; нейрон желі: XOR - жасырын қабатпен шешіледі, онсыз шешілмейді", async ({ page }) => {
  test.setTimeout(60_000);
  await blockFonts(page.context());
  await page.goto("academy/models.html");
  const cpu = page.locator('[data-aov="cpu"]');
  await ready(cpu);
  await cpu.locator("[data-c=seek]").evaluate((e) => { e.value = e.max; e.dispatchEvent(new Event("input")); });
  await expect(cpu.locator(".aov-msg")).toContainText("Шығыс: 15");
  const nn = page.locator('[data-aov="nn"]');
  await ready(nn);
  await nn.locator("[data-c=seek]").evaluate((e) => { e.value = e.max; e.dispatchEvent(new Event("input")); });
  await expect(nn.locator(".aov-msg")).toContainText("дәлдік 100%");
  await nn.locator("input[name=hidden]").fill("0");
  await nn.locator("input[name=hidden]").dispatchEvent("change");
  await ready(nn);
  await nn.locator("[data-c=seek]").evaluate((e) => { e.value = e.max; e.dispatchEvent(new Event("input")); });
  await expect(nn.locator(".aov-msg")).toContainText("тек түзу сызық");
});

test("Code X-Ray: нағыз Python, рекурсия тереңдігі мен қайтару мәні көрінеді; пернетақта", async ({ page }) => {
  test.setTimeout(120_000);
  await blockFonts(page.context());
  await routePyodide(page.context());
  await page.goto("academy/m07/l05.html");
  const v = page.locator('[data-aov="pyx"]');
  await expect(v.locator(".aov-msg")).toContainText("Ойнату");   // Python бет ашылғанда жүктелмейді
  await v.locator("[data-c=fwd]").click();
  await ready(v);
  await v.focus();
  for (let i = 0; i < 9; i++) await page.keyboard.press("ArrowRight");
  await expect(v.locator(".aov-n")).toHaveText(/^10 \//);
  await v.locator("[data-c=seek]").evaluate((e) => { e.value = e.max; e.dispatchEvent(new Event("input")); });
  await expect(v.locator(".aov-msg")).toContainText("24");
});

test("қозғалыс азайтылса ойнату бір қадам ғана; телефонда көлденең жылжу жоқ; a11y", async ({ browser }) => {
  test.setTimeout(90_000);
  const c = await browser.newContext({ viewport: { width: 360, height: 740 }, reducedMotion: "reduce" });
  await blockFonts(c);
  const p = await c.newPage();
  await p.goto("academy/models.html");
  const v = p.locator('[data-aov="graph"]');
  await ready(v);
  await v.locator("[data-c=play]").click();
  await expect(v.locator(".aov-n")).toHaveText(/^2 \//);
  await p.waitForTimeout(1500);
  await expect(v.locator(".aov-n")).toHaveText(/^2 \//);
  expect(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await p.addScriptTag({ content: AXE });
  const bad = await p.evaluate(async () => (await axe.run(document.querySelector("main"), { runOnly: ["wcag2a", "wcag2aa"], resultTypes: ["violations"] })).violations
    .filter((x) => x.impact === "serious" || x.impact === "critical").map((x) => `${x.id}: ${x.nodes[0].target.join(" ")}`));
  expect(bad, bad.join("\n")).toEqual([]);
  await c.close();
});

test("2-кезең модельдері нақты есептейді: сұрыптау, үйме, компилятор, TCP байттары, толық қосқыш", async ({ page }) => {
  await blockFonts(page.context());
  await page.goto("academy/models.html");
  const end = async (t) => { const v = page.locator(`[data-aov="${t}"]`); await ready(v); await v.locator("[data-c=seek]").evaluate((e) => { e.value = e.max; e.dispatchEvent(new Event("input")); }); return v.locator(".aov-msg"); };
  await expect(await end("sort")).toContainText("[1, 2, 3, 4, 6, 7, 8, 9]");
  await expect(await end("heap")).toContainText("[6, 7, 8, 9]");
  await expect(await end("compiler")).toContainText("Нәтиже: 7");
  await expect(await end("tcp")).toContainText("16 байт, 3 сегмент");
  await expect(await end("logic")).toContainText("S = 1, Cout = 1");
  await expect(await end("bst")).toContainText("35 табылды");
  const s = page.locator('[data-aov="sort"]');
  await s.locator("input[name=data]").fill("1, 2, 3, 4, 5");
  await s.locator("input[name=data]").dispatchEvent("change");
  await expect(await end("sort")).toContainText("4 салыстыру");   // кірістіру: сұрыпталған тізімде n - 1
  const c = page.locator('[data-aov="compiler"]');
  await c.locator("input[name=expr]").fill("2 + * 3");
  await c.locator("input[name=expr]").dispatchEvent("change");
  await expect(c.locator(".aov-msg")).toContainText("Операнд жетіспейді");
});

test("курс лекцияларының ішіндегі модельдер: үш сұрақ, жұмыс істейді, математиканың өз визуализацияларымен қақтығыспайды", async ({ page }) => {
  test.setTimeout(90_000);
  await blockFonts(page.context());
  const errs = collectErrors(page);
  for (const [url, n] of [["lectures/week-5.html", 3], ["ai/lectures/week-5.html", 2], ["cpp/lectures/week-6.html", 3], ["java/lectures/week-5.html", 2], ["math/lectures/week-98.html", 1]]) {
    await page.goto(url);
    await expect(page.locator(".aov-embed")).toHaveCount(n);
    await expect(page.locator(".aov-embed .aov-3q b")).toHaveCount(3 * n);
    const v = page.locator(".aov-embed .aov").first();
    await ready(v);
    await v.locator("[data-c=fwd]").click();
    await expect(v.locator(".aov-n")).toHaveText(/^2 \//);
  }
  await page.goto("math/lectures/week-10.html");
  await expect(page.locator(".math-viz").first()).not.toBeEmpty();   // математика курсының өз data-viz жүйесі бұзылмады
  await expect(page.locator('.aov-embed [data-aov="matrix"]')).toHaveClass(/aov/);
  expect(errs).toEqual([]);
});
