// © 2026 AO17 командасы. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md.
// INSIDE TECH-тің 10 «шешім фильмі» AO17-нің математика дәрістерінде (tools/academy/inside_films.py, assets/js/board-film.js).
// Тексереміз: әр фильм өз сабағының өз қадамының соңында; JS жоқ кезде толық мәтіні оқылады; ойнатқыш тақтаға жол-жолымен жазады,
// Пойа жолының кезеңін, белгіленген бөлікті және субтитрді көрсетеді; өзі алға жылжиды, соңында тоқтайды; экраннан шықса тоқтайды;
// қозғалыс азайтылған режимде жол бірден жазылады; 360px, axe.
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");
const { blockFonts, collectErrors } = require("../support/helpers");
const AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const ROOT = path.resolve(__dirname, "../..");
const BOARD = JSON.parse(fs.readFileSync(path.join(ROOT, "tools/academy/data/inside_media.json"), "utf8")).board;
const LESSONS = JSON.parse(fs.readFileSync(path.join(ROOT, "tools/academy/data/inside_lessons.json"), "utf8")).lessons;
const V = BOARD["la-1-vectors"].film;

test("10 фильмнің әрқайсысы өз сабағының өз қадамының соңында, ойнатқыш тек осы беттерде", () => {
  expect(Object.keys(BOARD)).toHaveLength(10);
  for (const [lid, { step, film }] of Object.entries(BOARD)) {
    const e = LESSONS.find((x) => x.lesson.id === lid);
    const i = e.lesson.steps.findIndex((s) => s.id === step) + 1;
    expect(i, lid).toBeGreaterThan(0);
    const html = fs.readFileSync(path.join(ROOT, "academy/3d", e.labId, lid + ".html"), "utf8");
    expect(html.split('id="s-board"'), lid).toHaveLength(2);
    const sec = html.split(`<section class="l3-step" id="s${i}"`)[1].split("</section>")[0];
    const at = sec.indexOf('id="s-board"');
    expect(at, `${lid}: ${step} қадамында фильм жоқ`).toBeGreaterThan(sec.indexOf('class="l3-body"'));
    expect(sec.slice(at).split("<li><span class=\"bf-st\">").length - 1, lid).toBe(film.frames.length);
    expect(html, lid).toContain('src="../../../assets/js/board-film.js"');
  }
  expect(fs.readFileSync(path.join(ROOT, "academy/3d/arch/arch-1-binary.html"), "utf8")).not.toContain("board-film.js");
});

test("JS жоқ кезде: «Фильмді көру» батырмасы жасырын, фильмнің толық мәтіні оқылады", async ({ browser }) => {
  const c = await browser.newContext({ javaScriptEnabled: false });
  const p = await c.newPage();
  await p.goto("academy/3d/math/la-1-vectors.html");
  await expect(p.locator(".bf-start")).toBeHidden();
  await p.locator(".bf-tr summary").click();
  await expect(p.locator(".bf-tr li")).toHaveCount(V.frames.length);
  await expect(p.locator(".bf-tr li").first()).toContainText("Түсіну. " + V.frames[0].say);
  await expect(p.locator(".bf-tr li").last().locator("code")).toHaveText(V.frames.at(-1).board.at(-1));
  await expect(p.locator('.bf-go a[href="../app/index.html#la-1-vectors"]')).toHaveText("3D сахнамен көру");
  await c.close();
});

test("ойнатқыш: тақтаға жол-жолымен жазылады; кезең, белгі, субтитр; соңында тоқтайды; жабу", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto("academy/3d/math/la-1-vectors.html");
  const bf = page.locator("#s-board");
  await bf.locator(".bf-start").click();
  await expect(bf.locator(".bf-poster")).toBeHidden();
  await expect(bf.locator(".bf-player")).toBeVisible();
  await expect(bf).toHaveAttribute("data-frame", "0");
  await expect(bf.locator(".bf-pp")).toBeFocused();
  await expect(bf.locator(".bf-say")).toHaveText(V.frames[0].say);
  await expect(bf.locator('.bf-route li[aria-current="step"]')).toHaveText("Түсіну");
  await expect(bf.locator(".bf-count")).toHaveText("1 / " + V.frames.length);
  await expect(bf.locator(".bf-prev")).toBeDisabled();
  await expect(bf.locator(".bf-line").first()).toHaveText(V.frames[0].board[0]);
  // 4-кадр: «Шешу» кезеңі, тақтада 4 жол, жаңа жолдағы «(3, 4, 0)» белгіленген
  await bf.locator(".bf-pp").click();
  for (let k = 0; k < 3; k++) await bf.locator(".bf-next").click();
  await expect(bf).toHaveAttribute("data-frame", "3");
  await expect(bf.locator(".bf-line")).toHaveCount(4);
  await expect(bf.locator(".bf-line").last().locator("mark")).toHaveText("(3, 4, 0)");
  await expect(bf.locator('.bf-route li[data-state="done"]')).toHaveText(["Түсіну", "Жоспар"]);
  await expect(bf.locator('.bf-route li[data-state="now"]')).toHaveText("Шешу");
  // соңғы кадр: «Тексеру», ойнату батырмасы «басынан қайта ойнату» болады
  await bf.locator(".bf-range").evaluate((r) => { r.value = r.max; r.dispatchEvent(new Event("input", { bubbles: true })); });
  await expect(bf.locator(".bf-count")).toHaveText(`${V.frames.length} / ${V.frames.length}`);
  await expect(bf.locator(".bf-next")).toBeDisabled();
  await expect(bf.locator(".bf-line").last().locator("mark")).toHaveText("✓");
  await expect(bf.locator(".bf-pp")).toHaveAttribute("aria-label", "Басынан қайта ойнату");
  await bf.locator(".bf-close").click();
  await expect(bf.locator(".bf-poster")).toBeVisible();
  await expect(bf.locator(".bf-start")).toBeFocused();
  expect(errors).toEqual([]);
});

test("ойнатқыш өзі алға жылжиды, экраннан шықса тоқтайды; жылдамдық ауысады", async ({ page }) => {
  await page.goto("academy/3d/math/la-2-dot.html");
  const bf = page.locator("#s-board");
  await bf.locator(".bf-start").click();
  await bf.locator(".bf-speed").click();
  await bf.locator(".bf-speed").click();
  await expect(bf.locator(".bf-speed")).toHaveAttribute("aria-label", "Жылдамдық: 0.75×");
  await bf.locator(".bf-speed").click();
  await expect(bf.locator(".bf-speed")).toHaveText("1×");
  await expect(bf).toHaveAttribute("data-frame", "1", { timeout: 12000 });
  await expect(bf).toHaveClass(/is-playing/);
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(bf).not.toHaveClass(/is-playing/);
  await expect(bf.locator(".bf-pp")).toHaveAttribute("aria-label", "Ойнату");
});

test("қозғалыс азайтылған режимде жаңа жол бірден толық жазылады, жыпылықтайтын курсор жоқ", async ({ browser }) => {
  const c = await browser.newContext({ reducedMotion: "reduce" });
  const p = await c.newPage();
  await p.goto("academy/3d/math/la-3-gauss.html");
  const bf = p.locator("#s-board");
  await bf.locator(".bf-start").click();
  await bf.locator(".bf-pp").click();
  const F = BOARD["la-3-gauss"].film.frames;
  await bf.locator(".bf-next").click();
  expect(await bf.locator(".bf-line").evaluateAll((ls) => ls.map((l) => l.textContent))).toEqual(F[1].board);
  await expect(bf.locator(".bf-caret")).toHaveCount(0);
  await c.close();
});

for (const scheme of ["light", "dark"]) {
  test(`360px, ${scheme}: көлденең жылжу жоқ; axe (постер мен ойнатқыш) таза`, async ({ browser }) => {
    const c = await browser.newContext({ viewport: { width: 360, height: 740 }, colorScheme: scheme, reducedMotion: "reduce" });
    await blockFonts(c);
    const p = await c.newPage();
    await p.goto("academy/3d/math/ag-4-conics.html");
    await p.addScriptTag({ content: AXE });
    const run = () => p.evaluate(async () => (await axe.run(document.getElementById("s-board"), { runOnly: ["wcag2a", "wcag2aa"], resultTypes: ["violations"] })).violations
      .filter((x) => ["serious", "critical"].includes(x.impact)).map((x) => `${x.id}: ${x.nodes.length} (${x.nodes[0].html.slice(0, 140)})`));
    await p.locator(".bf-tr summary").click();
    expect(await run()).toEqual([]);
    await p.locator(".bf-start").click();
    await p.locator(".bf-pp").click();
    await p.locator(".bf-next").click();
    expect(await run()).toEqual([]);
    expect(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await c.close();
  });
}
