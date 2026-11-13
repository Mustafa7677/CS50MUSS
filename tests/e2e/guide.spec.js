// © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md.
// «Нөлден дайындық курсы»: SAT және IELTS оқулығының сабақ беттері (tools/guide_build.py + assets/js/ao-guide.js).
// Әр сабақта: болжау → қадамдық мысал → жаттығу (қате жауапқа түсіндірме) → меңгеру тексерісі (бәрі дұрыс = «меңгерілді»),
// консоль қатесі жоқ, 360px-те көлденең жылжу жоқ; axe wcag2a/aa (serious+critical) = 0 жарық және қараңғы режимде.
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");
const { blockFonts, collectErrors } = require("../support/helpers");
const AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const ROOT = path.resolve(__dirname, "../..");
const PAGES = ["sat", "ielts"].flatMap((a) => fs.readdirSync(path.join(ROOT, "academy", a)).filter((f) => /^lesson-.*\.html$/.test(f)).map((f) => `academy/${a}/${f}`)).sort();
const dataOf = (page) => JSON.parse(fs.readFileSync(path.join(ROOT, page), "utf8").match(/<script type="application\/json" id="gd-data">([\s\S]*?)<\/script>/)[1]);

test.beforeEach(async ({ context }) => { await blockFonts(context); });

// Бір жаттығуды шешеді; wrongFirst болса, алдымен қате жауап беріп, түсіндірменің шыққанын тексереді.
async function solve(page, li, ex, wrongFirst) {
  if (ex.type === "mc") {
    const btns = li.locator(".gd-opts button");
    await expect(btns).toHaveCount(ex.options.length);
    if (wrongFirst) {
      const w = ex.answer === 0 ? 1 : 0;
      await btns.nth(w).click();
      await expect(li.locator(".tt-fb, [class*=tt-]").first()).toContainText(ex.why[w].replace(/<[^>]+>/g, "").slice(0, 12));
      await expect(btns.nth(w)).toBeDisabled();
    }
    await btns.nth(ex.answer).click();
  } else {
    const inp = li.locator("input");
    if (wrongFirst) {
      await inp.fill(ex.type === "num" ? String(ex.value + 1000.5) : "zzzz");
      await li.locator("form button").click();
      await expect(li).toContainText("Қате.");
    }
    await inp.fill(ex.type === "num" ? String(ex.value) : ex.accept[0]);
    await li.locator("form button").click();
  }
  await expect(li).toHaveClass(/done/);
}

test("сабақтар бар және хабтарда тізімделген", () => {
  expect(PAGES.length).toBeGreaterThanOrEqual(15);
  for (const a of ["sat", "ielts"]) {
    const hub = fs.readFileSync(path.join(ROOT, "academy", a, "index.html"), "utf8");
    expect(hub, a).toContain("Нөлден дайындық курсы");
    for (const p of PAGES.filter((x) => x.startsWith(`academy/${a}/`))) expect(hub, p).toContain(path.basename(p));
  }
});

for (const pg of PAGES) {
  test(`${pg}: болжау, қадамдар, жаттығу, меңгеру`, async ({ page }) => {
    const errors = collectErrors(page), D = dataOf(pg);
    await page.goto(pg);
    // болжау
    const pb = page.locator("[data-gd-predict]");
    await pb.locator(".lab-choice button").nth(D.predict.answer).click();
    await expect(pb).toContainText("Дұрыс болжадыңыз.");
    // қадамдық мысал: жауап соңғы қадамнан кейін ғана ашылады
    const w = page.locator("[data-worked]").first(), steps = w.locator(".gd-wsteps > li"), n = await steps.count();
    await expect(w.locator(".gd-ans")).toBeHidden();
    for (let i = 0; i < n; i++) { await w.locator(".lab-row .btn.gold").click(); await expect(steps.nth(i)).toBeVisible(); }
    await expect(w.locator(".gd-ans")).toBeVisible();
    // жаттығу: бірінші есепте қате → түсіндірме → дұрыс
    const pr = page.locator('[data-gd-set="practice"] > .gd-ex');
    await expect(pr).toHaveCount(D.practice.length);
    await solve(page, pr.first(), D.practice[0], true);
    // меңгеру: бәрі бірінші әрекеттен дұрыс
    const ms = page.locator('[data-gd-set="mastery"] > .gd-ex');
    await expect(ms.first().locator(".tt-hbtn")).toHaveCount(0);
    for (let i = 0; i < D.mastery.length; i++) await solve(page, ms.nth(i), D.mastery[i], false);
    await expect(page.locator("[data-gd-result]")).toContainText("Сабақ меңгерілді.");
    const rec = await page.evaluate((id) => JSON.parse(localStorage.getItem("ao17:tutor:v1") || "{}"), D.id);
    expect(JSON.stringify(rec)).toContain(D.id);
    expect(errors).toEqual([]);
  });
}

test("меңгеру: қате бірінші әрекет сабақты «меңгерілді» қылмайды", async ({ page }) => {
  const pg = PAGES[0], D = dataOf(pg);
  await page.goto(pg);
  const ms = page.locator('[data-gd-set="mastery"] > .gd-ex');
  for (let i = 0; i < D.mastery.length; i++) await solve(page, ms.nth(i), D.mastery[i], i === 0);
  await expect(page.locator("[data-gd-result]")).toContainText(`${D.mastery.length - 1} / ${D.mastery.length}`);
  await expect(page.locator("[data-gd-result]")).not.toContainText("Сабақ меңгерілді.");
});

for (const scheme of ["light", "dark"]) {
  test(`360px, ${scheme}: көлденең жылжу жоқ, axe таза`, async ({ browser }) => {
    const c = await browser.newContext({ viewport: { width: 360, height: 740 }, colorScheme: scheme, reducedMotion: "reduce" });
    await blockFonts(c);
    const p = await c.newPage();
    for (const pg of PAGES) {
      await p.goto(pg);
      await p.locator("[data-worked] .lab-row .btn.secondary").first().click();
      expect(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), pg + ": horizontal scroll").toBe(true);
      await p.addScriptTag({ content: AXE });
      const v = await p.evaluate(async () => (await axe.run(document.querySelector("main"), { runOnly: ["wcag2a", "wcag2aa"], resultTypes: ["violations"] })).violations
        .filter((x) => ["serious", "critical"].includes(x.impact)).map((x) => `${x.id}: ${x.nodes.length} (${x.nodes[0].html.slice(0, 120)})`));
      expect(v, pg).toEqual([]);
    }
    await c.close();
  });
}
