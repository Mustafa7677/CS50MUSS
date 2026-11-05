// © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md.
// Digital SAT Academy (academy/sat/): хаб, квадраттық функция, таразы, transitions, дәлел іздеуші, емтихан симуляторы.
// Тексереміз: негізгі әрекеттер, дұрыс/қате жауаптың түсіндірмесі, банктің дұрыстығы, таймер, бейімделу, консоль қатесі жоқ,
// 360px-те көлденең жылжу жоқ, axe wcag2a/aa (serious+critical) = 0 жарық және қараңғы режимде.
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const { blockFonts, collectErrors } = require("../support/helpers");
const AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const PAGES = ["index", "quadratic", "linear", "transitions", "evidence", "exam"].map((p) => `academy/sat/${p}.html`);

test.beforeEach(async ({ context }) => { await blockFonts(context); });

test("хаб: ресми құрылым, тәуелсіздік ескертпесі, дайын зертханалар ашылады", async ({ page }) => {
  const errs = collectErrors(page);
  await page.goto("academy/sat/index.html");
  const t = await page.locator("main").innerText();
  for (const s of ["2 модуль × 27 сұрақ", "2 × 32 мин", "2 модуль × 22 сұрақ", "2 × 35 мин", "10 мин", "98", "2 сағ 14 мин", "200-800", "College Board-пен байланысты емес", "Algebra", "Advanced Math", "Problem-Solving and Data Analysis", "Geometry and Trigonometry", "Information and Ideas", "Craft and Structure", "Expression of Ideas", "Standard English Conventions"]) expect(t).toContain(s);
  const ready = await page.locator(".sat-skill li:has(.st.on) a").evaluateAll((as) => as.map((a) => a.getAttribute("href")));
  expect(ready.length).toBeGreaterThanOrEqual(4);
  await expect(page.locator(".sat-skill .st:not(.on)").first()).toHaveText("жоспарда");
  for (const href of new Set(ready.map((h) => h.split("#")[0]))) {
    const r = await page.request.get("academy/sat/" + href);
    expect(r.status(), href).toBe(200);
  }
  expect(errs).toEqual([]);
});

test("квадраттық: болжам → h белгі қақпаны, тапсырма қате параметрді атайды, кез келген a > 0 қабылданады", async ({ page }) => {
  const errs = collectErrors(page);
  await page.goto("academy/sat/quadratic.html");
  await expect(page.locator("#q-a")).toBeDisabled();
  await page.locator("#q-predict [data-p=left]").click();
  await expect(page.locator("#q-pfb")).toContainText("қақпан");
  await expect(page.locator("#q-a")).toBeEnabled();
  await expect(page.locator("#q-formula")).toHaveText("y = (x − 3)²");
  await expect(page.locator("#q-ex li.hot")).toContainText("ОҢҒА 3");
  const set = async (a, h, k) => { await page.fill("#q-an", String(a)); await page.fill("#q-hn", String(h)); await page.fill("#q-kn", String(k)); };
  await set(-0.5, -3, 2);
  await expect(page.locator("#q-formula")).toHaveText("y = −0.5(x + 3)² + 2");
  await page.click("#t1-check");
  const fb = page.locator("#t1-fb");
  await expect(fb).toHaveClass(/tt-bad/);
  await expect(fb).toContainText("Белгі қақпаны");
  await expect(fb).toContainText("k = 2 - таңбасы керісінше");
  await expect(fb).toContainText("төмен ашылып тұр");
  await set(0, 3, -2);
  await page.click("#t1-check");
  await expect(fb).toContainText("Бұл парабола емес");
  for (const a of [2, 0.5]) {
    await set(a, 3, -2);
    await page.click("#t1-check");
    await expect(fb).toHaveClass(/tt-ok/);
    await expect(fb).toContainText("кез келген оң a дұрыс");
  }
  // генерацияланған есептер: шартты оқып, есептеп шешеміз
  for (let n = 0; n < 6; n++) {
    const q = await page.locator("#t2-q").innerText();
    const nums = (q.replace(/−/g, "-").match(/-?\d+(\.\d+)?/g) || []).map(Number);
    let a = /төмен/.test(q) ? -1 : 1;
    const [h, k] = nums;
    if (/P\(/.test(q)) { const [, , p, y] = nums; a = (y - k) / (p - h) ** 2; }
    await set(a, h, k);
    await page.click("#t2-check");
    await expect(page.locator("#t2-fb"), q).toHaveClass(/tt-ok/);
    await page.click("#t2-next");
  }
  await expect(page.locator("#t2-prog")).toContainText("3 / 3");
  await expect(page.locator("#q-badge")).toContainText("меңгерілді");
  // үш деңгейлі көмек: шешім ашылған соң есеп меңгеруге саналмайды
  for (let i = 0; i < 3; i++) await page.locator("#t2-h .tt-hbtn").click();
  await expect(page.locator("#t2-h li")).toHaveCount(3);
  await expect(page.locator("#t2-fb")).toContainText("меңгеруге саналмайды");
  expect(errs).toEqual([]);
});

test("таразы: екі жаққа амал теңдікті сақтайды, бір жаққа - түсіндіріледі; теріс/бөлшек - символдық режим; жүйе", async ({ page }) => {
  const errs = collectErrors(page);
  await page.goto("academy/sat/linear.html");
  await expect(page.locator("#ln-eq")).toHaveText("3x + 5 = 2x + 9");
  await expect(page.locator("#ln-svg .sb-xb")).toHaveCount(5);
  await page.locator("#ln-quick button", { hasText: "− x" }).click();
  await expect(page.locator("#ln-eq")).toHaveText("2x + 5 = x + 9");
  await expect(page.locator("#ln-fb")).toContainText("теңдік сақталды");
  await page.locator("#ln-quick button", { hasText: "− x" }).click();
  await expect(page.locator("#ln-eq")).toHaveText("x + 5 = 9");
  await page.fill("#ln-val", "5");
  await page.click("#ln-left");
  await expect(page.locator("#ln-fb")).toContainText("таразы қисайды");
  await expect(page.locator("#ln-eq")).toHaveText("x + 5 = 9");
  await page.selectOption("#ln-op", "/");
  await page.fill("#ln-val", "x");
  await page.click("#ln-both");
  await expect(page.locator("#ln-fb")).toContainText("x-ке көбейтуге/бөлуге болмайды");
  await page.selectOption("#ln-op", "-");
  await page.fill("#ln-val", "5");
  await page.click("#ln-both");
  await expect(page.locator("#ln-eq")).toHaveText("x = 4");
  await expect(page.locator("#ln-fb")).toContainText("x = 4 - x жалғыз қалды");
  await expect(page.locator("#ln-steps li")).toHaveCount(3);
  await page.fill("#ln-ans", "-4");
  await page.click("#ln-check");
  await expect(page.locator("#ln-afb")).toContainText("Таңба қатесі");
  await page.fill("#ln-ans", "4");
  await page.click("#ln-check");
  await expect(page.locator("#ln-afb")).toHaveClass(/tt-ok/);
  for (const lv of ["neg", "frac"]) {
    await page.click(`[data-lv=${lv}]`);
    await expect(page.locator("#ln-mode")).toContainText("Символдық режим");
    await expect(page.locator("#ln-svg .sb-xb")).toHaveCount(0);
    const x0 = await page.evaluate(() => { const e = SAT.linear.orig(), f = SAT.fr; return f.str(f.div(f.sub(e.R.c, e.L.c), f.sub(e.L.x, e.R.x))).replace("−", "-"); });
    if (lv === "neg") expect(x0).toMatch(/^-\d+$/); else expect(x0).toContain("/");
    await page.fill("#ln-ans", x0);
    await page.click("#ln-check");
    await expect(page.locator("#ln-afb")).toHaveClass(/tt-ok/);
  }
  // жүйе
  const s = await page.evaluate(() => SAT.linear.sys());
  await page.fill("#sy-x", String(s.y0 === s.x0 ? s.x0 + 1 : s.y0));
  await page.fill("#sy-y", String(s.x0));
  await page.click("#sy-check");
  await expect(page.locator("#sy-fb")).toHaveClass(/tt-bad/);
  await page.fill("#sy-x", String(s.x0));
  await page.fill("#sy-y", String(s.y0));
  await page.click("#sy-check");
  await expect(page.locator("#sy-fb")).toHaveClass(/tt-ok/);
  await expect(page.locator("#sy-steps li")).toHaveCount(6);
  expect(errs).toEqual([]);
});

test("transitions: қатынас → сөз → диаграмма мен әр нұсқаның түсіндірмесі; 12 жаттығу + жаңа мәтінмен тексеру", async ({ page }) => {
  test.setTimeout(120_000);
  const errs = collectErrors(page);
  await page.goto("academy/sat/transitions.html");
  const D = await page.evaluate(() => window.SAT_TRANS);
  expect(D.practice.length).toBeGreaterThanOrEqual(12);
  for (const it of [...D.practice, ...D.check]) {
    expect(it.opts).toContain(it.ans);
    expect(D.words[it.ans]).toBe(it.rel);
    expect(it.opts.filter((o) => D.words[o] === it.rel), it.id).toHaveLength(1); // тек бір нұсқа сәйкес
    if (it.rel === "contrast" || it.rel === "concession") expect(it.opts.filter((o) => ["contrast", "concession"].includes(D.words[o])), it.id).toHaveLength(1);
  }
  await page.click("#tr-rels [data-rel=cause]");
  await expect(page.locator("#tr-fb1")).toHaveClass(/tt-ok/);
  await expect(page.locator("#tr-sym")).toContainText("→");
  await page.click('#tr-opts [data-w="For example"]');
  await expect(page.locator("#tr-fb2")).toHaveClass(/tt-bad/);
  await expect(page.locator("#tr-fb2")).toContainText("мысал");
  await expect(page.locator("#tr-why li")).toHaveCount(4);
  await expect(page.locator("#tr-why li.ok")).toContainText("Consequently");
  await expect(page.locator("#tr-blank")).toHaveText("For example");
  for (let i = 1; i < D.practice.length; i++) {
    await page.click("#tr-next");
    const it = D.practice[i];
    await expect(page.locator("#tr-s1")).toHaveText(it.s1);
    await page.click(`#tr-rels [data-rel=${it.rel}]`);
    await page.click(`#tr-opts [data-w="${it.ans}"]`);
    await expect(page.locator("#tr-fb2")).toHaveClass(/tt-ok/);
    await expect(page.locator("#tr-next")).toBeVisible();
  }
  await expect(page.locator("#tr-next")).toHaveText("Меңгеру тексерісіне өту");
  for (let i = 0; i < D.check.length; i++) {
    await page.click("#tr-next");
    await expect(page.locator("#tr-step1")).toBeHidden();
    await expect(page.locator("#tr-h")).toBeHidden();
    const s1 = await page.locator("#tr-s1").innerText();
    const it = D.check.find((x) => x.s1 === s1);
    await page.click(`#tr-opts [data-w="${it.ans}"]`);
  }
  await page.click("#tr-next");
  await expect(page.locator("#tr-fb2")).toContainText(`${D.check.length} / ${D.check.length}`);
  expect(errs).toEqual([]);
});

test("дәлел іздеуші: дұрыс жауап + қате дәлел, дұрыс дәлел + қате жауап, пернетақтамен белгілеу", async ({ page }) => {
  const errs = collectErrors(page);
  await page.goto("academy/sat/evidence.html");
  const D = await page.evaluate(() => window.SAT_EVIDENCE);
  expect(D.length).toBeGreaterThanOrEqual(6);
  for (const it of D) {
    expect(it.choices).toHaveLength(4);
    it.why.forEach((w, j) => { if (j !== it.ans) expect(w, it.id).toBeTruthy(); });
    it.sets.flat().forEach((k) => expect(it.allow).toContain(k));
  }
  await page.click('#ev-check');
  await expect(page.locator("#ev-fb")).toContainText("Алдымен жауапты таңда");
  await page.click('#ev-opts [data-c="0"]');
  // пернетақта: Tab-пен сөйлемге келіп, Space
  await page.locator('#ev-text [data-i="1"]').focus();
  await page.keyboard.press("Space");
  await expect(page.locator('#ev-text [data-i="1"]')).toHaveAttribute("aria-pressed", "true");
  await page.click("#ev-check");
  await expect(page.locator("#ev-fb")).toContainText("Жауап дұрыс, бірақ дәлел дұрыс емес");
  await expect(page.locator("#ev-fb")).toContainText("2-сөйлем тәжірибенің қалай құрылғанын");
  await page.click('#ev-text [data-i="1"]');
  await page.click('#ev-text [data-i="2"]');
  await page.click("#ev-check");
  await expect(page.locator("#ev-fb")).toContainText("Екеуін де дәлелде"); // partial: тек 3-сөйлем
  await page.click('#ev-text [data-i="3"]');
  await page.click("#ev-check");
  await expect(page.locator("#ev-fb")).toHaveClass(/tt-ok/);
  await page.click("#ev-next");
  await page.click('#ev-opts [data-c="1"]');
  await page.click('#ev-text [data-i="4"]');
  await page.click("#ev-check");
  await expect(page.locator("#ev-fb")).toContainText("Дәлелің дұрыс, бірақ жауап оған сай емес");
  await page.click('#ev-opts [data-c="0"]');
  await page.click("#ev-check");
  await expect(page.locator("#ev-fb")).toHaveClass(/tt-ok/);
  // қалған мәтіндер; соңғы екеуінде көмек жоқ
  for (let i = 2; i < D.length; i++) {
    await page.click("#ev-next");
    if (i >= D.length - 2) await expect(page.locator("#ev-h")).toBeHidden();
    await page.click(`#ev-opts [data-c="${D[i].ans}"]`);
    for (const k of D[i].sets[0]) await page.click(`#ev-text [data-i="${k}"]`);
    await page.click("#ev-check");
    await expect(page.locator("#ev-fb")).toHaveClass(/tt-ok/);
  }
  await expect(page.locator("#ev-fb")).toContainText("Барлық мәтін аяқталды");
  expect(errs).toEqual([]);
});

test("емтихан банкі: құрылым, түсіндірмелер, grid-in жауап пішімдері", async ({ page }) => {
  await page.goto("academy/sat/exam.html");
  const r = await page.evaluate(() => {
    const B = window.SAT_BANK, out = [];
    for (const sec of ["rw", "math"]) for (const pool of ["m1", "hard", "easy"]) {
      const a = B[sec][pool];
      if (a.length !== 8) out.push(`${sec}.${pool}: ${a.length}`);
      a.forEach((q) => {
        if (!q.domain || !q.skill || !q.diff || !q.stem) out.push(q.id + ": өріс жоқ");
        if (q.choices) { if (q.choices.length !== 4 || q.why.length !== 4 || q.why.some((w) => !w) || !(q.ans >= 0 && q.ans < 4)) out.push(q.id + ": нұсқа/түсіндірме"); }
        else if (!q.grid || !q.explain || !SAT.exam.isRight(q, `${q.grid.value[0]}/${q.grid.value[1]}`)) out.push(q.id + ": grid");
      });
    }
    const sin = B.math.m1.find((q) => q.id === "m1-08");
    const forms = ["12/13", "24/26", ".9230", ".9231", "0.923"].map((f) => SAT.exam.isRight(sin, f));
    const wrong = [".92", "0.92", "13/12", "1"].map((f) => SAT.exam.isRight(sin, f));
    const fmt = ["3/4", ".75", "-2", "1.5"].map((f) => SAT.exam.gridFormat(f)).concat(SAT.exam.gridFormat("abc") ? ["bad"] : [""], SAT.exam.gridFormat("123456") ? ["long"] : [""]);
    return { out, forms, wrong, fmt, rw: SAT.exam.secTime("rw"), math: SAT.exam.secTime("math"), calc: [SAT.calc("(175-95)/4"), SAT.calc("2^3+√16"), SAT.calc("2π")] };
  });
  expect(r.out).toEqual([]);
  expect(r.forms).toEqual([true, true, true, true, true]);
  expect(r.wrong).toEqual([false, false, false, false]);
  expect(r.fmt).toEqual(["", "", "", "", "bad", "long"]);
  expect(r.rw).toBe(Math.round((32 * 60 * 8) / 27));
  expect(r.math).toBe(Math.round((35 * 60 * 8) / 22));
  expect(r.calc[0]).toBe(20); expect(r.calc[1]).toBe(12); expect(r.calc[2]).toBeCloseTo(6.2831853, 5);
});

test("емтихан (Exam Mode): таймер, Mark for Review, навигатор, бейімделу, үзіліс, анықтама, калькулятор, шолу", async ({ page }) => {
  test.setTimeout(120_000);
  const errs = collectErrors(page);
  await page.goto("academy/sat/exam.html");
  await page.locator("input[name=sx-mode][value=exam]").check();
  await page.click("#sx-start");
  await expect(page.locator("#sx-title")).toContainText("Section 1: Reading and Writing · Module 1");
  const t0 = await page.locator("#sx-time").innerText();
  expect(t0).toMatch(/^9:(29|28|27)$/);
  await expect(page.locator("#sx-fb")).toHaveCount(0); // дұрыстығы көрсетілмейді
  const answerAll = async (right) => {
    const S = await page.evaluate(() => { const st = SAT.exam.state(), m = st.mods[st.mods.length - 1]; return m.items.map((q) => (q.choices ? { c: q.ans } : { g: `${q.grid.value[0]}/${q.grid.value[1]}` })); });
    for (let j = 0; j < S.length; j++) {
      if (S[j].c !== undefined) { if (right !== null) await page.locator(".sat-opts button").nth(right ? S[j].c : (S[j].c + 1) % 4).click(); }
      else if (right !== null) await page.fill("#sx-grid", right ? S[j].g : "999");
      if (j === 2) await page.click(".sx-mark");
      await page.click("#sx-next");
    }
  };
  await answerAll(true);
  await expect(page.locator("#sx-rev-h")).toBeVisible();
  await expect(page.locator(".sx-navs button.ans")).toHaveCount(8);
  await expect(page.locator(".sx-navs button.mk")).toHaveCount(1);
  await page.locator(".sx-navs button").nth(2).click();
  await expect(page.locator(".sx-mark")).toHaveAttribute("aria-pressed", "true");
  await page.click("#sx-next"); for (let i = 3; i < 8; i++) await page.click("#sx-next");
  await page.click("#sx-submit");
  await expect(page.locator("#sx-tr-h")).toContainText("1-модуль аяқталды");
  await expect(page.locator(".sx-center")).toContainText("имитациясы");
  expect(await page.evaluate(() => SAT.exam.state().mods[1].pool)).toBe("hard");
  await page.click("#sx-go");
  await expect(page.locator("#sx-title")).toContainText("Module 2");
  await answerAll(false);
  await page.click("#sx-submit");
  await expect(page.locator("#sx-br-h")).toHaveText("Үзіліс");
  await expect(page.locator("#sx-break-t")).toHaveText(/^(10:00|9:5\d)$/);
  await page.click("#sx-endbreak");
  await expect(page.locator("#sx-title")).toContainText("Section 2: Math · Module 1");
  await page.getByRole("button", { name: "Анықтама" }).click();
  await expect(page.locator("#sx-ref")).toContainText("c² = a² + b²");
  await expect(page.locator("#sx-ref")).toContainText("V = πr²h");
  await page.getByRole("button", { name: "Калькулятор" }).click();
  await page.fill("#sx-cin", "(175-95)/4");
  await page.keyboard.press("Enter");
  await expect(page.locator("#sx-cout")).toHaveText("20");
  await answerAll(null); // жауапсыз
  await page.click("#sx-submit");
  await expect(page.locator("#sx-tr-h")).toContainText("Math: 1-модуль аяқталды");
  expect(await page.evaluate(() => SAT.exam.state().mods[3].pool)).toBe("easy");
  await page.click("#sx-go");
  await answerAll(true);
  await page.click("#sx-submit");
  await expect(page.locator("#sx-res-h")).toBeVisible();
  const res = await page.locator("#sx").innerText();
  expect(res).toContain("Reading and Writing: 8 / 16 дұрыс");
  expect(res).toContain("Math: 8 / 16 дұрыс");
  expect(res).toContain("балл есептелмейді");
  expect(res).not.toMatch(/\b(1[0-5]\d\d|[2-8]\d\d)\s*балл\b/);
  await page.getByRole("button", { name: "Тек қателер" }).click();
  await expect(page.locator(".sx-rev > li")).toHaveCount(16);
  await expect(page.locator(".sx-rev > li.ok")).toHaveCount(0);
  const tutor = await page.evaluate(() => JSON.parse(localStorage.getItem("ao17:tutor:v1")).skills);
  expect(tutor["sat.rw.words-in-context"].n).toBe(2);
  expect(tutor["sat.math.linear-equations-in-one-variable"].n).toBe(2);
  expect(errs).toEqual([]);
});

test("емтихан: уақыт біткенде модуль өзі тапсырылады; Learning Mode түсіндірме береді", async ({ page }) => {
  const errs = collectErrors(page);
  await page.clock.install();
  await page.goto("academy/sat/exam.html");
  await page.locator("input[name=sx-mode][value=exam]").check();
  await page.click("#sx-start");
  await page.clock.runFor(570_000);
  await expect(page.locator("#sx-tr-h")).toBeVisible();
  await expect(page.locator(".sx-center")).toContainText("Уақыт бітті");
  await page.goto("academy/sat/exam.html");
  await page.click("#sx-start"); // әдепкі - Learning Mode
  await expect(page.locator(".sx-top")).toContainText("таймер жоқ");
  const ans = await page.evaluate(() => SAT.exam.state().mods[0].items[0].ans);
  await page.locator(".sat-opts button").nth((ans + 1) % 4).click();
  await page.click("#sx-hint .tt-hbtn");
  await expect(page.locator("#sx-hint li")).toHaveCount(1);
  await page.click("#sx-check");
  await expect(page.locator("#sx-fb")).toHaveClass(/tt-bad/);
  await expect(page.locator("#sx-fb")).toContainText("дұрысы -");
  await expect(page.locator(".sat-opts button.ok")).toHaveCount(1);
  await page.click("#sx-next");
  await page.locator(".sat-opts button").nth(await page.evaluate(() => SAT.exam.state().mods[0].items[1].ans)).click();
  await page.click("#sx-check");
  await expect(page.locator("#sx-fb")).toHaveClass(/tt-ok/);
  expect(errs).toEqual([]);
});

for (const scheme of ["light", "dark"]) {
  test(`SAT беттері (${scheme}): 360px-те жылжу жоқ, a11y`, async ({ browser }) => {
    test.setTimeout(120_000);
    const c = await browser.newContext({ viewport: { width: 360, height: 740 }, colorScheme: scheme, reducedMotion: "reduce" });
    await blockFonts(c);
    const p = await c.newPage();
    const errs = collectErrors(p);
    const problems = [];
    const check = async (label) => {
      expect(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), label + ": horizontal scroll").toBe(true);
      await p.addScriptTag({ content: AXE });
      const v = await p.evaluate(async () => (await axe.run(document.querySelector("main"), { runOnly: ["wcag2a", "wcag2aa"], resultTypes: ["violations"] })).violations
        .filter((x) => x.impact === "serious" || x.impact === "critical").map((x) => `${x.id} (${x.nodes.length}): ${x.nodes[0].target.join(" ")}`));
      v.forEach((x) => problems.push(`${label}: ${x}`));
    };
    for (const url of PAGES) { await p.goto(url); await check(url); }
    // интерактивті күйлер
    await p.goto("academy/sat/quadratic.html"); await p.click("#q-predict [data-p=left]"); await p.click("#t1-check"); await check("quadratic-feedback");
    await p.goto("academy/sat/transitions.html"); await p.click("#tr-rels [data-rel=contrast]"); await p.click('#tr-opts [data-w="For example"]'); await check("transitions-answered");
    await p.goto("academy/sat/evidence.html"); await p.click('#ev-opts [data-c="0"]'); await p.click('#ev-text [data-i="2"]'); await p.click("#ev-check"); await check("evidence-checked");
    await p.goto("academy/sat/linear.html"); await p.click("#ln-left"); await check("linear-illegal");
    await p.goto("academy/sat/exam.html"); await p.locator("input[name=sx-mode][value=exam]").check(); await p.click("#sx-start"); await p.click("#sx-next"); await p.click(".sx-tool[aria-controls=sx-nav]"); await check("exam-module");
    await p.goto("academy/sat/exam.html"); await p.click("#sx-start"); await p.locator(".sat-opts button").first().click(); await p.click("#sx-check"); await check("exam-learning");
    expect(problems, problems.join("\n")).toEqual([]);
    expect(errs).toEqual([]);
    await c.close();
  });
}
