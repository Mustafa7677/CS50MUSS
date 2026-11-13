// © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md.
// Reality Engine: «Теңдеу таразысы» (academy/labs/equation.html). Жеті кезеңнен толық өту, кезеңдердің құлпы,
// бір жаққа ғана жасалған амал таразыны бұзады, қате жауапқа нақты түсіндірме, күйдің сақталуы, 360px, axe (жарық/қараңғы).
// Жауаптар спектің өзіндегі тәуелсіз есептеумен ((d − b) / (a − c)) салыстырылады.
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");
const { blockFonts, collectErrors } = require("../support/helpers");
const AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const PAGE = "academy/labs/equation.html";
const D = (() => { const w = {}; new Function("window", fs.readFileSync(path.resolve(__dirname, "../../assets/data/rl-equation.js"), "utf8"))(w); return w.RL_EQUATION; })();
const solveOf = ([a, b, c, d]) => (d - b) / (a - c);

test.beforeEach(async ({ context }) => { await blockFonts(context); });
const next = (page) => page.locator(".rl-next");
const op = async (page, kind, k, where) => {
  await page.locator(".eq-ops select").first().selectOption(kind);
  await page.locator(".eq-ops input").fill(String(k));
  if (where) await page.locator(".eq-ops select").nth(1).selectOption(where);
  await page.locator(".eq-ops .btn.gold").click();
};
async function answer(page, li, q, wrongFirst) {
  if (q.type === "mc") {
    if (wrongFirst) { const w = q.answer === 0 ? 1 : 0; await li.locator(".gd-opts button").nth(w).click(); await expect(li).toContainText(q.why[w].slice(0, 20)); }
    await li.locator(".gd-opts button").nth(q.answer).click();
  } else {
    const want = q.eq ? solveOf(q.eq) * (q.mult || 1) + (q.plus || 0) : q.value;
    expect(want).toBeCloseTo(q.value, 9);
    if (wrongFirst) { const [k, why] = Object.entries(q.errors)[0]; await li.locator("input").fill(k); await li.locator("form button").click(); await expect(li).toContainText(why.slice(0, 20)); }
    await li.locator("input").fill(String(want)); await li.locator("form button").click();
  }
  await expect(li).toHaveClass(/done/);
}

test("жеті кезеңнен толық өту", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto(PAGE);
  const tabs = page.locator(".rl-nav button");
  await expect(tabs).toHaveCount(7);
  await expect(tabs.nth(1)).toBeDisabled();
  await expect(next(page)).toBeDisabled();
  // 1. кіріспе: слайдерді пернетақтамен жылжытып теңестіру
  const r = page.locator("#eq-x");
  await r.focus();
  for (let i = 0; i < D.intro.x - 1; i++) await page.keyboard.press("ArrowRight");
  await expect(page.locator(".eq-board")).toHaveClass(/eq-off/);
  await expect(page.locator(".rl-note")).toContainText("Оң жақ ауыр");
  await page.keyboard.press("ArrowRight");
  expect(solveOf(D.intro.eq)).toBe(D.intro.x);
  await expect(page.locator(".eq-board")).not.toHaveClass(/eq-off/);
  await expect(page.locator(".eq-board svg title")).toContainText("Таразы тең тұр");
  await next(page).click();
  // 2. көр: қадамдарды қолмен жүргізу
  await expect(next(page)).toBeDisabled();
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Келесі қадам" }).click();
  await expect(page.locator(".eq-line")).toContainText(`x = ${solveOf(D.concept.eq)}`);
  await next(page).click();
  // 3. бірге жаса: нөлге бөлу мүмкін емес, кеңес, шешу
  await op(page, "div", 0);
  await expect(page.locator(".rl-body")).toContainText("Нөлге бөлуге болмайды");
  await page.getByRole("button", { name: "Дәл амалды көрсету" }).click();
  await expect(page.locator(".rl-body")).toContainText("екі жақтан 2x азайту");
  await op(page, "subx", 2); await op(page, "add", 3);
  await expect(page.locator(".eq-log li.cur b")).toHaveText("3x = 12");
  await expect(next(page)).toBeDisabled();
  await op(page, "div", 3);
  await expect(page.locator(".eq-log li.cur b")).toHaveText(`x = ${solveOf(D.guided.eq)}`);
  await expect(page.locator(".rl-note")).toContainText("ең қысқа жол - 3 амал");
  await next(page).click();
  // 4. өзің зертте: бір жаққа ғана амал → таразы бұзылады → қайтару; өз теңдеуін шешу; шешімі жоқ жағдай
  await op(page, "sub", 1, "left");
  await expect(page.locator(".eq-board")).toHaveClass(/eq-off/);
  await expect(page.locator(".rl-note")).toContainText("Тепе-теңдік бұзылды");
  await expect(page.locator(".eq-log li.cur")).toContainText("тек сол жақтан 1 азайту");
  await page.getByRole("button", { name: "Қайтару" }).click();
  await expect(page.locator(".eq-board")).not.toHaveClass(/eq-off/);
  const mk = async (v) => { for (const [i, n] of ["a", "b", "c", "d"].entries()) await page.locator("#eq-m" + n).fill(String(v[i])); await page.getByRole("button", { name: "Теңдеуді құру" }).click(); };
  await mk([2, 3, 2, 7]);
  await op(page, "subx", 2, "both");
  await expect(page.locator(".rl-note")).toContainText("шешім жоқ");
  await mk([3, -4, 1, 6]);
  await op(page, "subx", 1, "both"); await op(page, "add", 4, "both"); await op(page, "div", 2, "both");
  await expect(page.locator(".eq-log li.cur b")).toHaveText(`x = ${solveOf([3, -4, 1, 6])}`);
  await next(page).click();
  // 5. тексер: бірінші есепте қате жауап → нақты түсіндірме; көмек бар
  const cp = page.locator(".rl-body .gd-ex");
  await expect(cp).toHaveCount(D.checkpoint.length);
  await expect(cp.first().locator(".tt-hbtn").first()).toBeVisible();
  for (let i = 0; i < D.checkpoint.length; i++) await answer(page, cp.nth(i), D.checkpoint[i], i === 0);
  await expect(page.locator(".rl-note")).toContainText(`${D.checkpoint.length - 1} / ${D.checkpoint.length}`);
  await next(page).click();
  // 6. қатені талда
  const cases = page.locator(".eq-case");
  for (let i = 0; i < D.mistakes.length; i++) {
    const c = D.mistakes[i], box = cases.nth(i), lines = box.locator(".eq-lines button");
    expect(c.right).toBeCloseTo(solveOf(c.lines[0].map((v) => (typeof v === "object" ? v.n / v.d : v))), 9);
    await expect(lines.first()).toBeDisabled();
    if (i === 1) { await lines.nth(1).click(); await expect(box).toContainText("Бұл жол қате емес."); }
    await lines.nth(c.wrong).click();
    if (i === 0) { await box.locator(".gd-opts button").nth(1).click(); await expect(box).toContainText(c.trapWhy[1].slice(0, 20)); }
    await box.locator(".gd-opts button").nth(c.trap).click();
    await expect(box).toHaveClass(/done/);
  }
  await next(page).click();
  // 7. меңгеру: көмек жоқ
  const ms = page.locator(".rl-body .gd-ex");
  await expect(ms.first().locator(".tt-hbtn")).toHaveCount(0);
  for (let i = 0; i < D.mastery.length; i++) await answer(page, ms.nth(i), D.mastery[i], false);
  await expect(page.locator(".rl-note")).toContainText("Дағды меңгерілді");
  await next(page).click();
  await expect(page.locator(".rl-fin")).toContainText("Сабақ аяқталды");
  // күй сақталады
  await page.reload();
  await expect(page.locator(".rl-nav button.ok")).toHaveCount(7);
  const st = await page.evaluate(() => JSON.parse(localStorage.getItem("ao17:reality:v1"))["math.reality.equation"]);
  expect(Object.keys(st.done)).toHaveLength(7);
  expect(st.state.mastery).toBe(D.mastery.length);
  expect(JSON.stringify(await page.evaluate(() => JSON.parse(localStorage.getItem("ao17:tutor:v1"))))).toContain("math.reality.equation");
  expect(errors).toEqual([]);
});

for (const scheme of ["light", "dark"]) {
  test(`360px, ${scheme}: көлденең жылжу жоқ, axe таза, қозғалыс азайтылған`, async ({ browser }) => {
    const c = await browser.newContext({ viewport: { width: 360, height: 740 }, colorScheme: scheme, reducedMotion: "reduce" });
    await blockFonts(c);
    const p = await c.newPage();
    await p.addInitScript(() => { const done = {}; ["intro", "concept", "guided", "explore", "checkpoint", "mistakes", "mastery"].forEach((k) => { done[k] = 1; }); localStorage.setItem("ao17:reality:v1", JSON.stringify({ "math.reality.equation": { done, state: {}, ms: 0, at: 0 } })); });
    await p.goto(PAGE);
    await p.addScriptTag({ content: AXE });
    for (let i = 0; i < 7; i++) {
      await p.locator(".rl-nav button").nth(i).click();
      if (i === 1) { await p.getByRole("button", { name: "Ойнату" }).click(); await expect(p.locator(".eq-line")).toContainText("✓"); }   // қозғалыссыз: бірден соңғы күй
      expect(await p.evaluate(() => parseFloat(getComputedStyle(document.querySelector(".eq-beam") || document.body).transitionDuration)), "transition").toBeLessThan(0.01);
      expect(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `кезең ${i + 1}: horizontal scroll`).toBe(true);
      const v = await p.evaluate(async () => (await axe.run(document.querySelector("main"), { runOnly: ["wcag2a", "wcag2aa"], resultTypes: ["violations"] })).violations
        .filter((x) => ["serious", "critical"].includes(x.impact)).map((x) => `${x.id}: ${x.nodes.length} (${x.nodes[0].html.slice(0, 140)})`));
      expect(v, `кезең ${i + 1}`).toEqual([]);
    }
    await c.close();
  });
}
