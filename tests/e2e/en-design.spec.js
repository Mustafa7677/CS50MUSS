// © 2026 Sagid Mustafa. All Rights Reserved.
// Ағылшын курсының дизайны мен құралдары: курс беті (бүгін, деңгей жолы, нәтижелер), сабақ беті стилі, сөздік жаттықтырғышы
// (4 режим, Лейтнер, мақсат, серия), грамматика «жиі қателер», фразаларды жасыру-еске түсіру, a11y, 390px, қараңғы/ашық.
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const { blockFonts, collectErrors } = require("../support/helpers");
const AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");

const noHScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);
const axe = async (page, scope) => {
  await page.addScriptTag({ content: AXE });
  return page.evaluate(async (sc) => (await axe.run(sc ? document.querySelector(sc) : document, { runOnly: ["wcag2a", "wcag2aa"], resultTypes: ["violations"] })).violations
    .filter((x) => x.impact === "serious" || x.impact === "critical").map((x) => `${x.id}: ${x.nodes[0].target.join(" ")}`), scope);
};
const ls = (page, k) => page.evaluate((key) => JSON.parse(localStorage.getItem(key) || "null"), k);

const URLS = ["en/index.html", "en/vocab.html", "en/grammar.html", "en/phrasebank.html", "en/placement.html", "en/lectures/week-0.html"];
for (const scheme of ["light", "dark"]) {
  for (const u of URLS) {
    test(`дизайн: ${u} (${scheme}) консоль қатесіз, 390px-те көлденең айналусыз, a11y`, async ({ browser }) => {
      const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: scheme, reducedMotion: "reduce" });
      const page = await ctx.newPage();
      const errs = collectErrors(page);
      await blockFonts(ctx);
      await page.goto(u);
      await page.waitForTimeout(500);
      expect(await noHScroll(page), "көлденең айналу").toBe(true);
      const v = await axe(page);
      expect(v, v.join("\n")).toEqual([]);
      expect(errs).toEqual([]);
      await ctx.close();
    });
  }
}

test("курс беті: бүгін, деңгей жолы (6 түйін), жалпы прогресс, нәтижелер, тест батырмасы", async ({ page }) => {
  const errs = collectErrors(page);
  await blockFonts(page.context());
  await page.goto("en/index.html");
  await expect(page.locator(".en-today .en-tcard")).toHaveCount(3);
  await expect(page.locator(".en-node")).toHaveCount(6);
  await expect(page.locator(".en-node .en-node-dot b")).toHaveText(["A0", "A1", "A2", "B1", "B2", "C1"]);
  await expect(page.locator(".en-node.is-plan, .en-node.is-part, .en-node.is-full").first()).toBeVisible();
  await expect(page.locator(".en-overall [role=progressbar]")).toBeVisible();
  await expect(page.locator(".en-results .en-res-grid li")).toHaveCount(6);
  await expect(page.locator('.en-t-place a[href="placement.html"]')).toBeVisible();
  await expect(page.locator('.en-gchip[href$="#enmatch"]')).toBeVisible();
  await expect(page.locator("#ai-note")).toContainText("болжамды");
  await expect(page.locator(".week-card")).toHaveCount(24);
  // деректер бар болса: келесі сабақ, қайталауға келген сөздер, нәтиже
  await page.evaluate(() => {
    localStorage.setItem("cs50kz:en:vocab", JSON.stringify({ x1: { b: 1, due: 0, m: 0 }, x2: { b: 2, due: 1, m: 0 }, x3: { b: 4, due: Date.now() + 9e8, m: 1 } }));
    localStorage.setItem("cs50kz:en:placement", JSON.stringify({ t: Date.now(), est: 1, upper: 2, below: false, rec: 1, got: 10, total: 30 }));
    localStorage.setItem("cs50kz:progress", JSON.stringify({ read: { "en:week-0": 1 }, quiz: { "en:week-0": { best: 8, total: 8 } } }));
  });
  await page.reload();
  await expect(page.locator(".en-t-words .en-t-v")).toHaveText("2 сөз");
  await expect(page.locator(".en-t-place .en-t-v")).toContainText("A1-A2");
  await expect(page.locator(".en-results")).toContainText("8 / 8");
  await expect(page.locator(".en-node.lv-a0")).toHaveClass(/is-/);
  expect(errs).toEqual([]);
});

test("сабақ беті: бөлімдер, жаттығу күйлері, кеңес батырмасы, оқу жолағы", async ({ page }) => {
  const errs = collectErrors(page);
  await blockFonts(page.context());
  await page.goto("en/lectures/week-0.html");
  await expect(page.locator(".en-readbar")).toHaveCount(1);
  await expect(page.locator(".callout.en-kzcmp").first()).toBeVisible();
  await expect(page.locator("li.en-mis").first()).toBeVisible();
  const ex = page.locator('.en-ex[data-type="choice"]').first();
  await ex.locator(".en-check").click();
  await expect(ex).toHaveClass(/is-retry/);
  const bw = await ex.evaluate((e) => getComputedStyle(e).borderLeftColor);
  expect(bw).not.toBe("");
  // кеңес: әдепкіде жабық
  const hint = page.locator(".en-ex .en-hint-btn").first();
  if (await hint.count()) {
    await expect(hint).toHaveAttribute("aria-expanded", "false");
    await hint.click();
    await expect(hint).toHaveAttribute("aria-expanded", "true");
  }
  await page.mouse.wheel(0, 1500);
  await page.waitForTimeout(300);
  expect(await page.locator(".en-readbar i").evaluate((e) => parseFloat(e.style.width))).toBeGreaterThan(0);
  expect(errs).toEqual([]);
});

test("сөздік: 4 режим (карточка, таңдау, жазу, дыбыс), Лейтнер, мақсат, серия, статистика", async ({ page }) => {
  const errs = collectErrors(page);
  await blockFonts(page.context());
  await page.addInitScript(() => {
    window.__said = [];
    window.SpeechSynthesisUtterance = function (t) { this.text = t; };
    Object.defineProperty(window, "speechSynthesis", { configurable: true, value: { speak: (u) => window.__said.push(u.text), cancel() {}, getVoices: () => [{ lang: "en-US" }], addEventListener() {} } });
  });
  await page.goto("en/vocab.html");
  await expect(page.locator(".en-vstats")).toBeVisible();
  await expect(page.locator(".en-vs-goal")).toContainText("0 / 10");
  await page.selectOption('.en-vs-sel select', "5");
  await expect(page.locator(".en-vs-goal")).toContainText("0 / 5");
  // карточка: 3 баға
  await page.click('.en-top-modes [data-mode="card"]');
  await page.click(".en-card-stage .btn:has-text('Жауапты көрсету')");
  await page.click(".en-yes");
  let v = await ls(page, "cs50kz:en:vocab");
  expect(Object.values(v).some((e) => e.b === 2 && e.due > Date.now() && e.n === 1)).toBe(true);
  await page.click(".en-card-stage .btn:has-text('Жауапты көрсету')");
  await page.click(".en-hard");
  await page.click(".en-card-stage .btn:has-text('Жауапты көрсету')");
  await page.click(".en-no");
  v = await ls(page, "cs50kz:en:vocab");
  expect(Object.values(v).some((e) => e.b === 1 && e.x === 1)).toBe(true);
  // таңдау
  await page.click('.en-top-modes [data-mode="choice"]');
  await expect(page.locator(".en-qopt")).toHaveCount(4);
  await page.locator(".en-qopt").first().click();
  await expect(page.locator(".en-card-stage .en-ex-result")).toHaveText(/Дұрыс/);
  // жазу: дұрыс жауапты оқимыз
  await page.click('.en-top-modes [data-mode="spell"]');
  await page.fill(".en-spell-in", "zzzz-wrong");
  await page.keyboard.press("Enter");
  await expect(page.locator(".en-card-stage .en-ex-result")).toContainText("Дұрыс жазылуы");
  // дыбыс
  await page.click('.en-top-modes [data-mode="listen"]');
  await expect(page.locator(".en-play-big")).toBeVisible();
  await page.click(".en-play-big");
  expect((await page.evaluate(() => window.__said)).length).toBeGreaterThanOrEqual(1);
  await page.locator(".en-qopt").nth(1).click();
  // статистика: күн, серия
  const st = await ls(page, "cs50kz:en:vstats");
  const today = Object.values(st.days)[0];
  expect(today.n).toBeGreaterThanOrEqual(5);
  expect(st.goal).toBe(5);
  await page.click('.en-top-modes [data-mode="list"]');
  await expect(page.locator(".en-vs-num")).toContainText("1");
  await expect(page.locator(".en-vs-num li").first()).toContainText("🔥 1");
  // сақталады
  await page.reload();
  await expect(page.locator(".en-vs-goal")).toContainText("0 / 5".replace("0", String(today.n)));
  expect(errs).toEqual([]);
});

test("сөздік: дыбыстау жоқ болса, «Дыбыс» режимі өшірулі; сүзгі жаттықтырғышқа әсер етеді; сессия аяқталады", async ({ page }) => {
  const errs = collectErrors(page);
  await blockFonts(page.context());
  await page.addInitScript(() => { Object.defineProperty(window, "speechSynthesis", { configurable: true, value: undefined }); window.SpeechSynthesisUtterance = undefined; });
  await page.goto("en/vocab.html");
  await expect(page.locator('.en-top-modes [data-mode="listen"]')).toBeDisabled();
  await page.click('.en-chips button[data-v="b2"]');
  await page.click('.en-top-modes [data-mode="choice"]');
  await expect(page.locator(".en-card-n").first()).toContainText("/");
  const n = await page.locator(".en-tr-head .en-info").textContent();
  expect(n).toMatch(/бұл сессия: \d+/);
  const total = +n.match(/бұл сессия: (\d+)/)[1];
  for (let i = 0; i < total; i++) {
    await page.locator(".en-qopt").first().click();
    await page.locator(".en-card-stage .en-ex-ctrl .btn").first().click();
  }
  await expect(page.locator(".en-card-stage")).toContainText("Дайын!");
  await expect(page.locator(".en-card-stage")).toContainText("серия");
  expect(errs).toEqual([]);
});

test("грамматика: «Жиі қателер» көрінісі, іздеу, жаттықтыру режимі дұрыс жауапты жасырады", async ({ page }) => {
  const errs = collectErrors(page);
  await blockFonts(page.context());
  await page.goto("en/grammar.html");
  await page.click('.en-views [data-view="mistakes"]');
  const n = await page.locator(".en-mis-card").count();
  expect(n).toBeGreaterThanOrEqual(3);
  await expect(page.locator(".en-mis-card .en-bad").first()).toBeVisible();
  await page.fill(".en-search", "zzzzqq");
  await expect(page.locator(".en-mis-list .en-empty")).toBeVisible();
  await page.fill(".en-search", "");
  await page.click(".en-mis-practice");
  await expect(page.locator(".en-mis-card .en-mis-rev").first()).toBeHidden();
  await page.locator(".en-mis-show").first().click();
  await expect(page.locator(".en-mis-card .en-mis-rev").first()).toBeVisible();
  await page.click('.en-views [data-view="rules"]');
  await expect(page.locator(".en-rule").first()).toBeVisible();
  expect(errs).toEqual([]);
});

test("фразалар: жаттықтыру (жасыру-еске түсіру) аяқталады, нәтиже сақталады", async ({ page }) => {
  const errs = collectErrors(page);
  await blockFonts(page.context());
  await page.goto("en/phrasebank.html");
  await page.click('.en-views [data-view="drill"]');
  await expect(page.locator(".en-mask")).toContainText("_");
  const info = await page.locator(".en-drill .en-info").first().textContent();
  const total = +info.match(/(\d+) фраза/)[1];
  for (let i = 0; i < total; i++) {
    await page.locator(".en-drill-stage .btn:has-text('Көрсету')").click();
    await expect(page.locator(".en-mask.shown")).not.toContainText("_");
    await page.locator(i % 2 ? ".en-drill-stage .btn:has-text('Қайта қараймын')" : ".en-drill-stage .en-yes").click();
  }
  await expect(page.locator(".en-drill-stage")).toContainText("Дайын!");
  const r = await ls(page, "cs50kz:en:phr");
  expect(Object.keys(r).length).toBe(total);
  await page.click('.en-views [data-view="list"]');
  await expect(page.locator(".en-phrase").first()).toBeVisible();
  expect(errs).toEqual([]);
});

test("дерек бос болса: жаттықтырғыш пен үй беті қателерсіз ашылады", async ({ page }) => {
  const errs = collectErrors(page);
  await blockFonts(page.context());
  await page.route(/assets\/data\/en-(vocab|grammar|phrases|placement)/, (r) => r.fulfill({ status: 200, body: "", headers: { "content-type": "application/javascript" } }));
  for (const u of ["en/vocab.html", "en/grammar.html", "en/phrasebank.html", "en/index.html"]) await page.goto(u);
  await expect(page.locator(".en-node")).toHaveCount(6);
  expect(errs).toEqual([]);
});
