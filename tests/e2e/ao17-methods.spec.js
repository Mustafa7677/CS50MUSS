// © 2026 AO17 командасы. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md.
// «Қалай оқыған дұрыс» (tools/academy/ao17methods.py, assets/js/ao17-methods.js). Тексереміз: 8 тактика және сілтемелер;
// «Шын ба, аңыз ба?» (жауап, түсіндірме, нәтиже, сақталу); ми төккіш (таймер, автоматты белгі, нәтиже сақталады);
// ұмыту қисығы (аралық қайталау бір рет оқудан және бір түнгі жаттаудан көп есте қалдырады); жаргон детекторы (термин,
// түсіндірме, 5 критерий, «Түсіндіруші» жетістігі); 24 ұқсастық (ашу/жабу, шегі); фокус таймері (уақыт жылжығанда сессия
// саналады); аралас жаттығу (exam.html?mix=1); курс беті мен мәзірдегі сілтеме; бет ережесі; 360px, axe.
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const ROOT = path.resolve(__dirname, "../..");
const { blockFonts, collectErrors } = require("../support/helpers");
const AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const BANK = JSON.parse(fs.readFileSync(path.join(ROOT, "academy/exam.html"), "utf8").match(/<script type="application\/json" id="xm-bank">([\s\S]*?)<\/script>/)[1].replace(/<\\\//g, "</"));
const BY_ID = Object.fromEntries(BANK.items.map((x) => [x.id, x]));

test("8 тактика, мазмұны мен сілтемелері нақты беттерге апарады; дереккөздер бар", async ({ page }) => {
  await blockFonts(page.context());
  const errs = collectErrors(page);
  await page.goto("academy/methods.html");
  await expect(page.locator(".mt-t")).toHaveCount(8);
  await expect(page.locator(".mt-index a")).toHaveCount(8);
  for (const id of ["recall", "space", "mix", "explain", "analogy", "dual", "focus", "reflect"]) await expect(page.locator(`#t-${id} h2`)).toBeVisible();
  const hrefs = await page.locator(".mt-t a[href], .mt-rhythm a[href]").evaluateAll((as) => as.map((a) => a.getAttribute("href")));
  for (const h of new Set(hrefs)) {
    if (h.startsWith("#")) { expect(await page.locator(h).count(), h).toBe(1); continue; }
    expect(fs.existsSync(path.join(ROOT, "academy", h.split(/[?#]/)[0])), h).toBe(true);
  }
  await expect(page.locator(".rh-list li")).toHaveCount(7);
  expect(await page.locator(".mt-src li").count()).toBeGreaterThanOrEqual(8);
  expect(errs).toEqual([]);
});

test("«Шын ба, аңыз ба?»: жауап бергенде түсіндірме мен дереккөз ашылады, нәтиже есептеледі және сақталады", async ({ page }) => {
  await blockFonts(page.context());
  const errs = collectErrors(page);
  await page.goto("academy/methods.html");
  const cards = page.locator(".my-c");
  await expect(cards).toHaveCount(6);
  const truths = await cards.evaluateAll((cs) => cs.map((c) => c.getAttribute("data-truth")));
  expect(truths.filter((t) => t === "1")).toHaveLength(2);
  // бірінші карточкаға қате, қалғанына дұрыс жауап
  for (let i = 0; i < 6; i++) {
    const ans = i === 0 ? (truths[i] === "1" ? "0" : "1") : truths[i];
    await cards.nth(i).locator(`.my-b[data-ans="${ans}"]`).click();
    await expect(cards.nth(i).locator(".my-x")).toBeVisible();
    await expect(cards.nth(i).locator(".my-b").first()).toBeDisabled();
  }
  await expect(cards.nth(0)).toHaveClass(/bad/);
  await expect(cards.nth(1)).toHaveClass(/ok/);
  await expect(cards.nth(0).locator(".my-v")).toContainText("Шындығында:");
  await expect(page.locator("[data-my-score]")).toContainText("Нәтижең: 5 / 6.");
  await page.reload();
  await expect(page.locator(".my-c.is-open")).toHaveCount(6);
  await expect(page.locator("[data-my-score]")).toContainText("5 / 6");
  expect(errs).toEqual([]);
});

test("ми төккіш: 3 минут, сабақ атауы жазылса автоматты белгіленеді, нәтиже сақталады", async ({ page }) => {
  await blockFonts(page.context());
  await page.clock.install();
  const errs = collectErrors(page);
  await page.goto("academy/methods.html");
  const w = page.locator("[data-mt-recall]");
  await w.locator("[data-rc-week]").selectOption("6");
  await w.locator("[data-rc-start]").click();
  await expect(w.locator("[data-rc-clock]")).toHaveText("3:00");
  const titles = await page.evaluate(() => JSON.parse(document.getElementById("mt-data").textContent).weeks[5].lessons.map((l) => l[0]));
  await w.locator("[data-rc-text]").fill(`Мен ${titles[0]} және ${titles[1]} туралы есіме түсірдім.`);
  await page.clock.runFor(181000);
  await expect(w.locator("[data-rc-clock]")).toHaveText("0:00");
  await expect(w.locator(".rc-list li")).toHaveCount(titles.length);
  await expect(w.locator("[data-rc-i]:checked")).toHaveCount(2);
  for (const h of await w.locator(".rc-list a").evaluateAll((as) => as.map((a) => a.getAttribute("href")))) expect(fs.existsSync(path.join(ROOT, "academy", h)), h).toBe(true);
  await w.locator('[data-rc-i="5"]').check();
  await expect(w.locator("[data-rc-res]")).toHaveText(new RegExp(`^Есіңде қалғаны: 3 / ${titles.length}\\.`));
  const h = await page.evaluate(() => JSON.parse(localStorage.getItem("ao17cs:recall")));
  expect(h.w6).toMatchObject({ n: 3, all: titles.length });
  expect(errs).toEqual([]);
});

test("ұмыту қисығы: аралық қайталау бір рет оқудан да, бір түнгі жаттаудан да көп есте қалдырады", async ({ page }) => {
  await blockFonts(page.context());
  await page.goto("academy/methods.html");
  const w = page.locator("[data-mt-curve]");
  const end = async (k) => { await w.locator(`[data-cv="${k}"]`).click(); await expect(w.locator(`[data-cv="${k}"]`)).toHaveAttribute("aria-pressed", "true"); return Number((await w.locator("[data-cv-end]").innerText()).replace("%", "")); };
  const once = await end("once"), cram = await end("cram"), spaced = await end("spaced");
  expect(once).toBeLessThan(5);
  expect(cram).toBeLessThan(20);
  expect(spaced).toBeGreaterThan(50);
  await expect(w.locator(".rv")).toHaveCount(4);
  await expect(w.locator("path.base")).toHaveCount(1);
});

test("жаргон детекторы: түсіндірілмеген терминді табады, 5 критерий, «Түсіндіруші» жетістігі", async ({ page }) => {
  await blockFonts(page.context());
  const errs = collectErrors(page);
  await page.goto("academy/methods.html");
  const w = page.locator("[data-mt-feynman]");
  await w.locator("[data-fy-topic]").selectOption("6");   // 7-апта: Функция
  await w.locator("[data-fy-text]").fill("Функция параметр алады.");
  await w.locator("[data-fy-check]").click();
  await expect(w.locator(".fy-warn")).toContainText("кемінде 40 сөз");
  const bad = "Функция параметрді алып, рекурсия арқылы массивті өңдейтін компилятордың ішкі бөлігі болып табылатын және жадтағы нұсқағыштармен жұмыс істейтін, бағдарламалаудың маңызды әрі күрделі абстракциясы саналатын ұғым ретінде қарастырылады да, әр түрлі тілдерде әр түрлі жазылады және көп жерде қолданылады, сондай-ақ оны барлық бағдарламашылар біледі.";
  await w.locator("[data-fy-text]").fill(bad);
  await w.locator("[data-fy-check]").click();
  await expect(w.locator(".fy-score b")).not.toHaveText("5 / 5");
  expect(await w.locator(".fy-text mark.no").count()).toBeGreaterThanOrEqual(4);
  await expect(w.locator(".fy-crit li.no")).not.toHaveCount(0);
  const good = "Функция дегеніміз - атауы бар шағын бағдарлама. Оған мән бересің, ол жауап қайтарады. Мысалы, екі санды қосатын функция бар. Сен 2 мен 3 бересің. Ол 5 қайтарады. Бұл асхана терезесі сияқты. Тапсырыс бересің, табақ аласың. Ас үйдің ішін көрмейсің. Функцияны жазудың пайдасы зор, себебі бір кодты қайта-қайта жазбайсың. Бір рет жазып, көп рет шақырасың.";
  await w.locator("[data-fy-text]").fill(good);
  await w.locator("[data-fy-check]").click();
  await expect(w.locator(".fy-score b")).toHaveText("5 / 5");
  await expect(w.locator(".fy-text mark.ok").first()).toBeVisible();
  await expect(w.locator(".fy-text mark.no")).toHaveCount(0);
  const ach = await page.evaluate(() => window.CS50KZ.achievements().find((a) => a.id === "ao17-explain"));
  expect(ach.done).toBe(true);
  await page.reload();
  await w.locator("[data-fy-topic]").selectOption("6");
  await expect(w.locator("[data-fy-text]")).toHaveValue(good);
  expect(errs).toEqual([]);
});

test("ұқсастықтар: 24 карточка, ашылғанда түсіндірме мен шегі көрінеді, қайта жабылады", async ({ page }) => {
  await blockFonts(page.context());
  await page.goto("academy/methods.html");
  const cards = page.locator(".an-c");
  await expect(cards).toHaveCount(24);
  const b = cards.nth(3).locator(".an-b");
  await expect(b).toHaveAttribute("aria-expanded", "false");
  await b.click();
  await expect(b).toHaveAttribute("aria-expanded", "true");
  await expect(cards.nth(3).locator(".an-lim")).toBeVisible();
  await expect(cards.nth(3).locator(".an-lim")).toContainText("Шегі:");
  await b.click();
  await expect(cards.nth(3).locator(".an-d")).toBeHidden();
});

test("фокус таймері: 25 минут өткенде сессия саналады, үзіліс басталады, «Фокус шебері» төртінші сессиядан кейін", async ({ page }) => {
  await blockFonts(page.context());
  await page.clock.install();
  const errs = collectErrors(page);
  await page.goto("academy/methods.html");
  const w = page.locator("[data-mt-focus]");
  await expect(w.locator("[data-fc-time]")).toHaveText("25:00");
  await w.locator("[data-fc-go]").click();
  await expect(w.locator("[data-fc-go]")).toHaveText("Кідірту");
  await page.clock.runFor(60_000);
  await expect(w.locator("[data-fc-time]")).toHaveText("24:00");
  await expect(page).toHaveTitle(/^24:00 · Фокус/);
  await page.clock.runFor(24 * 60_000 + 1000);
  await expect(w.locator("[data-fc-phase]")).toHaveText("Үзіліс");
  await expect(w.locator("[data-fc-time]")).toHaveText("5:00");
  await expect(w.locator("[data-fc-stat]")).toContainText("Фокус аяқталды");
  const f = await page.evaluate(() => JSON.parse(localStorage.getItem("ao17cs:focus")));
  expect(f.total).toBe(1);
  expect(await page.evaluate(() => window.CS50KZ.achievements().find((a) => a.id === "ao17-focus").done)).toBe(false);
  await page.evaluate(() => localStorage.setItem("ao17cs:focus", JSON.stringify({ total: 4, days: {} })));
  expect(await page.evaluate(() => window.CS50KZ.achievements().find((a) => a.id === "ao17-focus").done)).toBe(true);
  await w.locator('[data-fc-p="50,10"]').click();
  await expect(w.locator("[data-fc-time]")).toHaveText("50:00");
  expect(errs).toEqual([]);
});

test("аралас жаттығу (exam.html?mix=1): 10 сұрақ әр аптадан кезектесіп, түсіндірме бірден, нәтиже «mix»", async ({ page }) => {
  await blockFonts(page.context());
  const errs = collectErrors(page);
  await page.goto("academy/exam.html?mix=1");
  await expect(page.locator("h1")).toHaveText("Аралас жаттығу");
  await expect(page.locator('.xm-modes [data-mode="mix"]')).toHaveAttribute("aria-current", "page");
  await page.click("[data-ax-start]");
  const run = await page.evaluate(() => JSON.parse(localStorage.getItem("ao17cs:exam-run")));
  expect(run.mode).toBe("mix");
  expect(run.qs).toHaveLength(10);
  const ts = run.qs.map((q) => BY_ID[q.id].t);
  expect(new Set(ts).size).toBeGreaterThanOrEqual(5);
  for (let i = 1; i < ts.length; i++) expect(ts[i], `${i}`).not.toBe(ts[i - 1]);   // қатар тұрған екі сұрақ бір аптадан емес
  expect(ts.every((t) => /^w\d+$/.test(t))).toBe(true);
  for (let i = 0; i < 10; i++) {
    const q = run.qs[i], it = BY_ID[q.id];
    if (it.k === "mc") await page.locator(".xm-opt").nth(q.p.indexOf(it.a)).click();
    else { await page.fill(".xm-num input", String(it.a)); await page.click(".xm-check"); }
    await expect(page.locator(".xm-fb.ok")).toBeVisible();
    await page.locator(".xm-nav .btn.gold").click();
  }
  await expect(page.locator(".xm-score b")).toHaveText("100%");
  const res = await page.evaluate(() => JSON.parse(localStorage.getItem("ao17cs:exam")));
  expect(res.mix.best).toBe(100);
  expect(errs).toEqual([]);
});

test("аралас жаттығу оқушы бастаған апталардан алынады", async ({ page }) => {
  await blockFonts(page.context());
  await page.goto("academy/exam.html?mix=1");
  await page.evaluate((ids) => {
    const L = {}; ids.forEach((id) => (L[id] = { ex: { "exercises:0": { ok: true } } }));
    localStorage.setItem("cs50kz:academy", JSON.stringify({ v: 1, lessons: L }));
  }, BANK.items.filter((x) => x.t === "w2" || x.t === "w5" || x.t === "w9").map((x) => x.h.replace(/^(m\d+)\/(l\d+)\.html$/, "ao17-foundation.$1.$2")));
  await page.reload();
  await page.click("[data-ax-start]");
  const run = await page.evaluate(() => JSON.parse(localStorage.getItem("ao17cs:exam-run")));
  expect(new Set(run.qs.map((q) => BY_ID[q.id].t))).toEqual(new Set(["w2", "w5", "w9"]));
});

test("курс бетінде сілтеме (мәзірдегісін academies.spec тексереді); бет ережесі: жария", async ({ page }) => {
  await blockFonts(page.context());
  await page.goto("academy/course.html");
  await expect(page.locator('.crs-how a[href="methods.html"]').first()).toBeVisible();
  const out = execFileSync("python3", ["-c", "import sys; sys.path.insert(0, 'tools'); import gate; print(gate.page_rule('academy/methods.html'))"], { cwd: ROOT, encoding: "utf8" }).trim();
  expect(out).toBe("None");
});

for (const scheme of ["light", "dark"]) {
  test(`360px, ${scheme}: «Қалай оқыған дұрыс» көлденең жылжымайды, axe таза`, async ({ browser }) => {
    const c = await browser.newContext({ viewport: { width: 360, height: 760 }, colorScheme: scheme, reducedMotion: "reduce" });
    await blockFonts(c);
    const p = await c.newPage();
    const errs = collectErrors(p);
    await p.goto("academy/methods.html");
    // барлық күйлер бетте болсын: тұжырымдар жауапталған, ұқсастық ашық, жаргон тексерілген, ми төккіш нәтижесі
    await p.locator(".my-c").nth(0).locator('.my-b[data-ans="1"]').click();
    await p.locator(".my-c").nth(1).locator('.my-b[data-ans="1"]').click();
    await p.locator(".an-b").first().click();
    await p.locator("[data-fy-text]").fill("Алгоритм дегеніміз - нақты қадамдар реті. Мысалы, бауырсақ рецепті сияқты. Компилятор мен рекурсия және массив туралы да айтамыз, себебі олар маңызды. Қадамдарды ретімен орындасаң, нәтиже шығады. Ретін бұзсаң, нәтиже бұзылады. Сондықтан әр қадам анық болуы керек және бір ғана мағынаға ие болуы тиіс. Бұл ереже әр тілде бірдей.");
    await p.locator("[data-fy-check]").click();
    await p.locator("[data-rc-check]").click();
    expect(await p.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
    await p.addScriptTag({ content: AXE });
    const v = await p.evaluate(async () => (await axe.run(document.getElementById("main"), { runOnly: ["wcag2a", "wcag2aa"], resultTypes: ["violations"] })).violations
      .filter((x) => x.impact === "serious" || x.impact === "critical").map((x) => `${x.id}: ${x.nodes[0].target.join(" ")}`));
    expect(v, v.join("\n")).toEqual([]);
    expect(errs).toEqual([]);
    await c.close();
  });
}
