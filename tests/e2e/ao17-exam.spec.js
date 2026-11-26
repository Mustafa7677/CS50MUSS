// © 2026 AO17 командасы. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md.
// AO17 CS бағалау жүйесі (tools/academy/ao17exam.py, assets/js/ao17-exam.js): апта сынағы, бөлім емтихандары,
// қорытынды емтихан және сертификат. Тексереміз: апта сынағының сұрақтары сол аптадан және сол аптаның 3D зертханасынан,
// дұрыс жауап - 100% және нәтиже сақталады; қорытынды емтихан 36 сұрақ, таймер, бет жаңартылса жалғасады, ескі сақталған
// сынақ ұсынылмайды, уақыты біткені бағаланады; сертификат 70%-дан бастап ашылады; курс беті нәтижелерді көрсетеді; бет ережесі (емтихан жабық,
// сертификат жария); телефонда көлденең жылжу жоқ, axe таза.
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const ROOT = path.resolve(__dirname, "../..");
const { blockFonts, collectErrors } = require("../support/helpers");
const AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const BANK = JSON.parse(fs.readFileSync(path.join(ROOT, "academy/exam.html"), "utf8").match(/<script type="application\/json" id="xm-bank">([\s\S]*?)<\/script>/)[1].replace(/<\\\//g, "</"));
const BY_ID = Object.fromEntries(BANK.items.map((x) => [x.id, x]));
const RUN = () => JSON.parse(localStorage.getItem("ao17cs:exam-run"));

// сақталған сынақтың k-сұрағына дұрыс жауап (таңдау: араластырылған реттегі индекс, сан: мәні)
const correct = (q) => { const it = BY_ID[q.id]; return it.k === "mc" ? String(q.p.indexOf(it.a)) : String(it.a); };

async function axeMain(page) {
  await page.addScriptTag({ content: AXE });
  return page.evaluate(async () => (await axe.run(document.getElementById("main"), { runOnly: ["wcag2a", "wcag2aa"], resultTypes: ["violations"] })).violations
    .filter((x) => x.impact === "serious" || x.impact === "critical").map((x) => `${x.id}: ${x.nodes[0].target.join(" ")}`));
}

test("сұрақ қоры: әр апта мен зертханада сұрақ жетеді, сілтемелер нақты беттерге апарады", async () => {
  const weeks = Object.keys(BANK.topics).filter((t) => BANK.topics[t].part === 1);
  const labs = Object.keys(BANK.topics).filter((t) => BANK.topics[t].part === 2);
  expect(weeks).toHaveLength(12);
  expect(labs).toHaveLength(11);
  for (const t of weeks) expect(BANK.items.filter((x) => x.t === t).length, t).toBeGreaterThanOrEqual(6);
  for (const t of labs) expect(BANK.items.filter((x) => x.t === t).length, t).toBeGreaterThanOrEqual(2);
  expect(new Set(BANK.items.map((x) => x.id)).size).toBe(BANK.items.length);
  const missing = new Set();
  for (const it of BANK.items) {
    if (!fs.existsSync(path.join(ROOT, "academy", it.h))) missing.add(it.h);
    if (it.k === "mc") expect(it.a, it.id).toBeLessThan(it.o.length);
    else expect(typeof it.a, it.id).toBe("number");
    expect(it.q, it.id).not.toMatch(/<script|onerror=/i);
  }
  for (const t of Object.values(BANK.topics)) if (!fs.existsSync(path.join(ROOT, "academy", t.href.split("#")[0]))) missing.add(t.href);
  expect([...missing]).toEqual([]);
});

test("апта сынағы: 8 сұрақ аптадан және оның 3D зертханасынан, түсіндірме бірден, 100% сақталады, курс бетінде көрінеді", async ({ page, context }) => {
  await blockFonts(context);
  const errs = collectErrors(page);
  await page.goto("academy/exam.html?w=1");
  await expect(page.locator("h1")).toHaveText(/^1-апта сынағы:/);
  await expect(page.locator('[data-ax-week]')).toHaveValue("1");
  await expect(page.locator("[data-ax-rules]")).toContainText("8 сұрақ");
  await page.click("[data-ax-start]");
  const run = await page.evaluate(RUN);
  expect(run.mode).toBe("w1");
  expect(run.qs).toHaveLength(8);
  expect(run.limit).toBe(0);
  const topics = run.qs.map((q) => BY_ID[q.id]);
  expect(topics.filter((it) => it.t === "w1")).toHaveLength(6);
  const labs3d = new Set(BANK.weekLabs.w1);
  expect(topics.filter((it) => it.l && labs3d.has(it.l))).toHaveLength(2);
  for (let i = 0; i < 8; i++) {
    await expect(page.locator(".xm-count")).toHaveText(`${i + 1} / 8`);
    const q = run.qs[i], it = BY_ID[q.id];
    if (it.k === "mc") await page.locator(".xm-opt").nth(q.p.indexOf(it.a)).click();
    else { await page.fill(".xm-num input", String(it.a).replace(".", ",")); await page.click(".xm-check"); }
    await expect(page.locator(".xm-fb.ok")).toContainText("Дұрыс!");
    if (it.k === "mc") await expect(page.locator(".xm-opt[disabled]")).toHaveCount(it.o.length);
    await page.locator(".xm-nav .btn.gold").click();
  }
  await expect(page.locator(".xm-score b")).toHaveText("100%");
  await expect(page.locator(".xm-verdict")).toHaveText("Үздік нәтиже!");
  await expect(page.locator(".xm-wrong")).toHaveCount(0);
  await expect(page.locator(".xm-acts a", { hasText: "Курс бетіне" })).toHaveAttribute("href", "course.html#w1");
  const res = await page.evaluate(() => JSON.parse(localStorage.getItem("ao17cs:exam")));
  expect(res.w1).toMatchObject({ best: 100, last: 100, runs: 1 });
  expect(await page.evaluate(() => localStorage.getItem("ao17cs:exam-run"))).toBeNull();

  await page.goto("academy/course.html");
  await expect(page.locator('[data-quiz="w1"]')).toHaveText("ең жақсы нәтиже: 100%");
  await expect(page.locator('[data-quiz="w1"]')).toHaveClass(/ok/);
  await expect(page.locator('[data-quiz="w2"]')).toHaveText("");
  await expect(page.locator("[data-exam-me]")).toBeVisible();
  await expect(page.locator("[data-exam-me]")).toContainText("1 / 12");
  await expect(page.locator('.crs-pp[data-part="exam"]')).toHaveText("Өткен апта сынағы: 1 / 12");
  expect(errs).toEqual([]);
});

test("апта сынағы: қате жауапта дұрысы мен түсіндірмесі шығады, нәтижеде қате тізімі мен сабаққа сілтеме бар", async ({ page, context }) => {
  await blockFonts(context);
  const errs = collectErrors(page);
  await page.goto("academy/exam.html?w=3");
  await page.click("[data-ax-start]");
  const run = await page.evaluate(RUN);
  for (let i = 0; i < 8; i++) {
    const q = run.qs[i], it = BY_ID[q.id];
    if (it.k === "mc") await page.locator(".xm-opt").nth((q.p.indexOf(it.a) + 1) % it.o.length).click();
    else { await page.fill(".xm-num input", String(it.a + 1000)); await page.click(".xm-check"); }
    await expect(page.locator(".xm-fb.bad")).toContainText("Дұрыс жауап:");
    if (it.k === "mc") await expect(page.locator(".xm-opt.ok")).toHaveCount(1);
    await page.locator(".xm-nav .btn.gold").click();
  }
  await expect(page.locator(".xm-score b")).toHaveText("0%");
  await expect(page.locator(".xm-verdict")).toContainText("Өту шегі 70%");
  await expect(page.locator(".xm-wrong > li")).toHaveCount(8);
  const hrefs = await page.locator(".xm-wrong .xm-back").evaluateAll((a) => a.map((x) => x.getAttribute("href")));
  for (const h of hrefs) expect(fs.existsSync(path.join(ROOT, "academy", h)), h).toBe(true);
  await expect(page.locator(".xm-topics li")).toHaveCount(new Set(run.qs.map((q) => BY_ID[q.id].t)).size);
  expect(errs).toEqual([]);
});

test("қорытынды емтихан: 36 сұрақ, таймер, пернетақта, жаңартқанда жалғасады, 97% - сертификат ашылады", async ({ page, context }) => {
  await blockFonts(context);
  const errs = collectErrors(page);
  await page.goto("academy/exam.html");
  await expect(page.locator("h1")).toHaveText("Қорытынды емтихан");
  await expect(page.locator('.xm-modes [data-mode="final"]')).toHaveAttribute("aria-current", "page");
  await page.click("[data-ax-start]");
  await expect(page.locator(".xm-dot")).toHaveCount(36);
  await expect(page.locator('[data-ax-time][role="timer"]')).toHaveText(/^4[45]:\d\d$/);
  let run = await page.evaluate(RUN);
  expect(run.limit).toBe(45 * 60000);
  const per = {};
  run.qs.forEach((q) => { const t = BY_ID[q.id].t; per[t] = (per[t] || 0) + 1; });
  for (let n = 1; n <= 12; n++) expect(per["w" + n], "w" + n).toBe(2);
  // алғашқы үш сұраққа интерфейс арқылы жауап береміз (таңдау - пернетақтамен, сан - өріске)
  for (let i = 0; i < 3; i++) {
    const q = run.qs[i], it = BY_ID[q.id];
    if (it.k === "mc") {
      await page.locator(".xm-opt").first().focus();
      await page.keyboard.press(String(q.p.indexOf(it.a) + 1));
      await expect(page.locator(".xm-opt.on")).toHaveAttribute("aria-checked", "true");
    } else await page.fill(".xm-num input", String(it.a));
    await expect(page.locator(".xm-fb.ok, .xm-fb.bad")).toHaveCount(0);   // қорытындыда түсіндірме емтихан соңында
    await page.locator(".xm-nav .btn.gold").click();
  }
  await page.reload();
  const cont = page.locator(".xm-intro .btn.gold");
  await expect(cont).toHaveText("Жалғастыру (3 / 36)");
  await cont.click();
  await expect(page.locator(".xm-count")).toHaveText("4 / 36");
  await expect(page.locator(".xm-dot.done")).toHaveCount(3);
  // қалғанын сақталған сынаққа жазамыз: бәрі дұрыс, біреуі қате - 35 / 36 = 97%
  run = await page.evaluate(RUN);
  run.qs.forEach((q, k) => { run.ans[k] = correct(q); });
  const it0 = BY_ID[run.qs[5].id];
  run.ans[5] = it0.k === "mc" ? String((Number(run.ans[5]) + 1) % it0.o.length) : "-99999";
  await page.evaluate((r) => localStorage.setItem("ao17cs:exam-run", JSON.stringify(r)), run);
  await page.reload();
  await page.locator(".xm-intro .btn.gold").click();
  await page.locator(".xm-dot").last().click();
  await expect(page.locator(".xm-nav .btn.gold")).toHaveText("Аяқтау");
  await page.locator(".xm-nav .btn.gold").click();
  await expect(page.locator(".xm-score b")).toHaveText("97%");
  await expect(page.locator(".xm-verdict")).toHaveText("Үздік нәтиже!");
  await expect(page.locator(".xm-wrong > li")).toHaveCount(1);
  await expect(page.locator(".xm-topics li")).toHaveCount(23);
  await page.locator(".xm-acts a", { hasText: "Сертификатты алу" }).click();
  await expect(page).toHaveURL(/academy\/certificate\.html$/);
  await expect(page.locator("[data-cert-gate]")).toBeHidden();
  await expect(page.locator("[data-cert-ready]")).toBeVisible();
  await expect(page.locator("[data-cert-score]")).toHaveText("97%");
  await expect(page.locator("[data-cert-out]")).toHaveText("Аты-жөнің");
  await page.fill("[data-cert-name]", "Айгерім Серікқызы");
  await expect(page.locator("[data-cert-out]")).toHaveText("Айгерім Серікқызы");
  await expect(page.locator("[data-cert-id]")).toHaveText(/^AO17-CS-[0-9A-Z]{7}$/);
  await expect(page.locator("[data-cert-date]")).toHaveText(/^\d{4} ж\. \d{1,2} [а-яәіңғүұқөһ]+$/);
  const id1 = await page.locator("[data-cert-id]").innerText();
  await page.reload();
  await expect(page.locator("[data-cert-name]")).toHaveValue("Айгерім Серікқызы");
  await expect(page.locator("[data-cert-id]")).toHaveText(id1);
  // басып шығаруда тек сертификат көрінеді
  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".xm-certtools")).toBeHidden();
  await expect(page.locator(".xm-cert")).toBeVisible();
  await page.emulateMedia({ media: "screen" });
  await page.goto("academy/course.html");
  await expect(page.locator("[data-exam-me]")).toContainText("қорытынды емтихан - 97% (сертификат ашық)");
  expect(errs).toEqual([]);
});

test("сертификат жабық: емтихан тапсырылмаса не 70%-дан төмен болса; ескі сақталған сынақ ұсынылмайды", async ({ page, context }) => {
  await blockFonts(context);
  const errs = collectErrors(page);
  await page.goto("academy/certificate.html");
  await expect(page.locator("[data-cert-gate]")).toBeVisible();
  await expect(page.locator("[data-cert-ready]")).toBeHidden();
  await expect(page.locator("[data-cert-status]")).toHaveText("Қорытынды емтихан әлі тапсырылмаған.");
  await page.evaluate(() => localStorage.setItem("ao17cs:exam", JSON.stringify({ final: { best: 60, last: 60, at: Date.now(), runs: 1 }, w1: { best: 100 } })));
  await page.reload();
  await expect(page.locator("[data-cert-status]")).toHaveText("Ең жақсы нәтижең: 60%. Тағы 10 пайыз қалды.");
  await expect(page.locator("[data-cert-ready]")).toBeHidden();
  // сайт жаңарып, сұрақ қоры өзгерсе: жоқ сұрағы бар сақталған сынақ жалғастырылмайды, жаңасы басталады
  await page.evaluate(() => localStorage.setItem("ao17cs:exam-run", JSON.stringify({ mode: "final", qs: [{ id: "жоқ.сұрақ", p: [0, 1] }], ans: { 0: "1" }, i: 0, start: Date.now(), limit: 2700000 })));
  await page.goto("academy/exam.html");
  await expect(page.locator(".xm-intro .btn")).toHaveCount(2);   // «Бастау» және «Сертификат», «Жалғастыру» жоқ
  await expect(page.locator("[data-ax-rules]")).toContainText("60%");
  await page.click("[data-ax-start]");
  await expect(page.locator(".xm-count")).toHaveText("1 / 36");
  expect(errs).toEqual([]);
});

test("уақыты біткен емтихан: жауаптар жоғалмайды, берілген жауаптар бойынша бағаланады", async ({ page, context }) => {
  await blockFonts(context);
  const errs = collectErrors(page);
  await page.goto("academy/exam.html?part=1");
  await page.click("[data-ax-start]");
  await expect(page.locator(".xm-dot")).toHaveCount(24);
  const run = await page.evaluate(RUN);
  expect(run.limit).toBe(30 * 60000);
  // 12 сұраққа дұрыс жауап, уақыт бір сағат бұрын басталған
  for (let k = 0; k < 12; k++) run.ans[k] = correct(run.qs[k]);
  run.start = Date.now() - 60 * 60000;
  await page.evaluate((r) => localStorage.setItem("ao17cs:exam-run", JSON.stringify(r)), run);
  await page.reload();
  const over = page.locator(".xm-intro .btn.gold");
  await expect(over).toHaveText("Уақыт бітті: нәтижесін көру (12 / 24 жауап)");
  await over.click();
  await expect(page.locator(".xm-score b")).toHaveText("50%");
  await expect(page.locator(".xm-wrong > li")).toHaveCount(12);
  const res = await page.evaluate(() => JSON.parse(localStorage.getItem("ao17cs:exam")));
  expect(res.p1).toMatchObject({ best: 50, last: 50, runs: 1 });
  expect(await page.evaluate(() => localStorage.getItem("ao17cs:exam-run"))).toBeNull();
  expect(errs).toEqual([]);
});

test("бет ережесі: емтихан жабық («test»), сертификат пен курс беті жария", async () => {
  const out = execFileSync("python3", ["-c", "import sys; sys.path.insert(0, 'tools'); import gate; print(gate.page_rule('academy/exam.html'), gate.page_rule('academy/certificate.html'), gate.page_rule('academy/course.html'))"], { cwd: ROOT, encoding: "utf8" }).trim();
  expect(out).toBe("('academy', 'test') None None");
});

test("курс беті: әр аптада сынақ сілтемесі, бағалау бөлімі және бөлімдер карточкасы", async ({ page, context }) => {
  await blockFonts(context);
  await page.goto("academy/course.html");
  for (let n = 1; n <= 12; n++) {
    await expect(page.locator(`#w${n} .crs-quiz a`)).toHaveAttribute("href", `exam.html?w=${n}`);
    await expect(page.locator(`#w${n} [data-quiz="w${n}"]`)).toHaveCount(1);
  }
  const ev = page.locator("#exam");
  await expect(ev.locator(".crs-steps > li")).toHaveCount(4);
  for (const h of ["exam.html?w=1", "exam.html?part=1", "exam.html?part=2", "exam.html", "certificate.html"]) await expect(ev.locator(`a[href="${h}"]`)).toHaveCount(1);
  await expect(ev).toContainText(`${BANK.items.length} сұрақтық қордан`);
  await expect(page.locator('a.crs-part3[href="#exam"]')).toHaveCount(1);
  await expect(page.locator("[data-exam-me]")).toBeHidden();
  await expect(page.locator(".crs-faq summary", { hasText: "Сертификат бере ме?" })).toHaveCount(1);
});

for (const scheme of ["light", "dark"]) {
  test(`360px, ${scheme}: емтихан мен сертификат көлденең жылжымайды, axe таза`, async ({ browser }) => {
    const c = await browser.newContext({ viewport: { width: 360, height: 760 }, colorScheme: scheme, reducedMotion: "reduce" });
    await blockFonts(c);
    const p = await c.newPage();
    const errs = collectErrors(p);
    const problems = [];
    const check = async (tag) => {
      const sw = await p.evaluate(() => document.documentElement.scrollWidth);
      if (sw > 360) problems.push(`${tag}: scrollWidth ${sw}`);
      (await axeMain(p)).forEach((v) => problems.push(`${tag}: ${v}`));
    };
    await p.goto("academy/exam.html?w=2");
    await check("кіріспе");
    await p.click("[data-ax-start]");
    await check("сұрақ");
    const run = await p.evaluate(RUN);
    const it = BY_ID[run.qs[0].id];
    if (it.k === "mc") await p.locator(".xm-opt").nth((run.qs[0].p.indexOf(it.a) + 1) % it.o.length).click();
    else { await p.fill(".xm-num input", "123456"); await p.click(".xm-check"); }
    await check("түсіндірме");
    // collectErrors растау терезесін (жауапсыз сұрақтар) өзі қабылдайды
    await p.locator(".xm-dot").last().click();
    await p.locator(".xm-nav .btn.gold").click();
    await expect(p.locator(".xm-res")).toBeVisible();
    await check("нәтиже");
    await p.goto("academy/certificate.html");
    await check("сертификат (жабық)");
    await p.evaluate(() => localStorage.setItem("ao17cs:exam", JSON.stringify({ final: { best: 88, last: 88, at: Date.now(), runs: 1 } })));
    await p.reload();
    await p.fill("[data-cert-name]", "Айгерім-Жанерке Серікқызы Нұрмағамбетова");
    await check("сертификат");
    expect(problems, problems.join("\n")).toEqual([]);
    expect(errs).toEqual([]);
    await c.close();
  });
}
