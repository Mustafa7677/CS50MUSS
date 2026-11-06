// © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md.
// Digital SAT, 2-пакет (Math): толық Math банкі (құрылым + grid жауаптарын қайта есептеу), симулятордың толық нұсқасы
// (R&W банкі әлі жоқ болса - уақытша стаб банкпен), прогресті сақтау/жалғастыру, бес зертхана (geometry, trig, stats,
// percent, functions): негізгі әрекет, қатені нақты атау, меңгеру; 360px, axe жарық/қараңғы.
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");
const { blockFonts, collectErrors, ROOT } = require("../support/helpers");
const AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const LABS = ["geometry", "trig", "stats", "percent", "functions"];
const RW_REAL = fs.existsSync(path.join(ROOT, "assets/data/sat-bank-rw-full.js"));

/** R&W толық банкі жоқ кезде - тест үшін уақытша стаб (27 × 3 сұрақ, sat-bank.js схемасымен). */
function stubRw() {
  const D = [["Craft and Structure", "Words in Context"], ["Information and Ideas", "Inferences"], ["Standard English Conventions", "Boundaries"], ["Expression of Ideas", "Transitions"]];
  const mk = (pool) => Array.from({ length: 27 }, (_, i) => ({ id: `stub-rw-${pool}-${i + 1}`, domain: D[i % 4][0], skill: D[i % 4][1], diff: "medium",
    passage: [`Stub passage ${pool} ${i + 1}: the committee postponed the vote because several members were absent.`], stem: "Which choice completes the text?",
    choices: ["postponed", "celebrated", "ignored", "measured"], ans: 0, why: ["Дұрыс: стаб.", "Стаб қате 1.", "Стаб қате 2.", "Стаб қате 3."] }));
  window.SAT_BANK_FULL = window.SAT_BANK_FULL || {};
  window.SAT_BANK_FULL.rw = { m1: mk("m1"), hard: mk("hard"), easy: mk("easy") };
}
const withRw = async (page) => { if (!RW_REAL) await page.addInitScript(stubRw); };

test.beforeEach(async ({ context }) => { await blockFonts(context); });

test("толық Math банкі: 3 × 22 сұрақ, домен үлесі, grid ≈ 25%, әр нұсқаның түсіндірмесі, grid жауаптары қайта есептеледі", async ({ page }) => {
  await page.goto("academy/sat/exam.html");
  const r = await page.evaluate(() => {
    const B = window.SAT_BANK_FULL.math, out = [], ids = new Set(), stat = {};
    // grid жауаптарын тәуелсіз қайта есептеу (sympy генераторынан бөлек)
    const RE = {
      "mf-104": () => Math.floor((1200 - 80) / 35), "mf-106": () => { const m = (-5 - 7) / (4 + 2); return 7 - m * -2; }, "mf-108": () => (-6 * 6) / 4,
      "mf-111": () => (5 + Math.sqrt(25 + 56)) / 2, "mf-113": () => { const h = 8 / 2; return h * h - 8 * h + 11; }, "mf-116": () => 400 / (150 / 6),
      "mf-201": () => (3150 - 7 * 350) / (12 - 7), "mf-204": () => { const m = (23 - 11) / (6 - 2), b = 11 - 2 * m; return (50 - b) / m; }, "mf-209": () => 144 / 8,
      "mf-214": () => { const x = (3 + -5) / 2; return -2 * (x - 3) * (x + 5); }, "mf-218": () => 85 - (4.5 * 6 + 62), "mf-222": () => 5 / Math.sqrt(13 * 13 - 5 * 5),
      "mf-302": () => (-5 + 11) / (3 - 2), "mf-304": () => (16 - 3 * 2) / 2, "mf-308": () => (260 - 60) / 40, "mf-311": () => 4 - 5, "mf-314": () => 6 / 2, "mf-316": () => 0.35 * 260,
    };
    // бірнеше көп нұсқалы сұрақты да қайта есептейміз (дұрыс нұсқаның мәні)
    const MC = { "mf-101": () => 27 / 3 - 4, "mf-102": () => (31 + 9) / 4, "mf-115": () => 6400 / 2 ** 4, "mf-117": () => ((52 - 40) / 40) * 100, "mf-118": () => 7 * 6 - 30,
      "mf-120": () => 180 - 47 - 68, "mf-202": () => (48 + 27) / (8 - 3), "mf-208": () => (12 - 0.1 * 60) / 0.3, "mf-219": () => (7.8 * 1000) / 1000, "mf-301": () => 42 / 7 + 3,
      "mf-310": () => 2 * 9 - 5, "mf-317": () => (32 * 5) / 8, "mf-320": () => 2 * (84 / 7 + 7), "mf-321": () => 5 * 4 * 3, "mf-322": () => Math.hypot(9, 12) };
    const val = (s) => { s = s.replace(/−/g, "-").replace(/[,°%]/g, ""); const m = s.match(/^(-?\d+)\/(\d+)$/); return m ? m[1] / m[2] : Number(s); };
    let grids = 0, regrid = 0, remc = 0;
    for (const pool of ["m1", "hard", "easy"]) {
      const a = B[pool]; stat[pool] = { n: a.length, dom: {}, grid: 0 };
      a.forEach((q) => {
        if (!/^mf-\d{3}$/.test(q.id) || ids.has(q.id)) out.push(q.id + ": id"); ids.add(q.id);
        if (!q.domain || !q.skill || !["easy", "medium", "hard"].includes(q.diff) || !q.stem) out.push(q.id + ": өріс жоқ");
        stat[pool].dom[q.domain] = (stat[pool].dom[q.domain] || 0) + 1;
        if (q.choices) {
          if (q.choices.length !== 4 || q.why.length !== 4 || q.why.some((w) => !w || w.length < 12) || !(q.ans >= 0 && q.ans < 4)) out.push(q.id + ": нұсқа/түсіндірме");
          if (!q.why[q.ans].startsWith("Дұрыс")) out.push(q.id + ": дұрыс нұсқаның түсіндірмесі");
          q.why.forEach((w, j) => { if (j !== q.ans && w.startsWith("Дұрыс")) out.push(q.id + ": қате нұсқа «Дұрыс» деп басталады"); });
          if (new Set(q.choices).size !== 4) out.push(q.id + ": қайталанған нұсқа");
          if (MC[q.id]) { remc++; if (Math.abs(val(q.choices[q.ans]) - MC[q.id]()) > 1e-9) out.push(q.id + ": MC жауабы қайта есептегенде сәйкес емес"); }
        } else {
          grids++; stat[pool].grid++;
          if (!q.grid || !q.explain || !SAT.exam.isRight(q, `${q.grid.value[0]}/${q.grid.value[1]}`)) out.push(q.id + ": grid");
          if (!RE[q.id]) out.push(q.id + ": қайта есептеу функциясы жоқ");
          else { regrid++; if (Math.abs(q.grid.value[0] / q.grid.value[1] - RE[q.id]()) > 1e-9) out.push(q.id + `: grid ${q.grid.value} ≠ ${RE[q.id]()}`); }
          q.grid.accept.forEach((f) => { if (!SAT.exam.isRight(q, f) || SAT.exam.gridFormat(f)) out.push(q.id + ": accept " + f); if (Math.abs(Number(f) - q.grid.value[0] / q.grid.value[1]) > 0.001) out.push(q.id + ": accept дәл емес " + f); });
        }
      });
    }
    const tan = B.hard.find((q) => q.id === "mf-222"), k9 = B.m1.find((q) => q.id === "mf-108");
    const forms = ["5/12", "10/24", ".4166", ".4167", "0.416", "0.417"].map((f) => SAT.exam.isRight(tan, f));
    const wrong = [".41", "0.42", "12/5", "5/13"].map((f) => SAT.exam.isRight(tan, f));
    const neg = ["-9", "−9", "-18/2"].map((f) => SAT.exam.isRight(k9, f)).concat(SAT.exam.isRight(k9, "9"));
    return { out, stat, grids, regrid, remc, forms, wrong, neg, total: ids.size };
  });
  expect(r.out, r.out.join("\n")).toEqual([]);
  expect(r.total).toBe(66);
  expect(r.regrid).toBe(r.grids);
  expect(r.remc).toBeGreaterThanOrEqual(15);
  for (const pool of ["m1", "hard", "easy"]) {
    const s = r.stat[pool];
    expect(s.n).toBe(22);
    expect(s.dom["Algebra"]).toBeGreaterThanOrEqual(7); expect(s.dom["Advanced Math"]).toBeGreaterThanOrEqual(7);
    expect(s.dom["Problem-Solving and Data Analysis"]).toBeGreaterThanOrEqual(3); expect(s.dom["Geometry and Trigonometry"]).toBeGreaterThanOrEqual(3);
    expect(s.grid).toBeGreaterThanOrEqual(5); expect(s.grid).toBeLessThanOrEqual(7);
  }
  expect(r.forms).toEqual([true, true, true, true, true, true]);
  expect(r.wrong).toEqual([false, false, false, false]);
  expect(r.neg).toEqual([true, true, true, false]);
  // қиын пул шынымен қиынырақ: «hard» белгісі басым, жеңіл пулда - жоқ
  const diff = await page.evaluate(() => ["hard", "easy"].map((p) => SAT_BANK_FULL.math[p].filter((q) => q.diff === "hard").length));
  expect(diff[0]).toBeGreaterThanOrEqual(14); expect(diff[1]).toBe(0);
});

test("толық нұсқа: R&W банкі жоқ болса - өшірулі және себебі жазылған", async ({ page }) => {
  test.skip(RW_REAL, "R&W толық банкі бар");
  await page.goto("academy/sat/exam.html");
  await expect(page.locator("#sx-var-full")).toBeDisabled();
  await expect(page.locator("#sx-full-note")).toContainText("Қазір қолжетімсіз");
  await expect(page.locator("#sx-full-note")).toContainText("sat-bank-rw-full.js");
  await expect(page.locator("input[name=sx-var][value=short]")).toBeChecked();
});

test("толық нұсқа (Exam Mode): 27/22 сұрақ, ресми таймер, навигатор, Mark, шолу, бейімделу, үзіліс, нәтиже", async ({ page }) => {
  test.setTimeout(240_000);
  const errs = collectErrors(page);
  await withRw(page);
  await page.goto("academy/sat/exam.html");
  await expect(page.locator("#sx-var-full")).toBeEnabled();
  await expect(page.locator("#sx-full-note")).toContainText("≥ 18/27");
  await page.locator("#sx-var-full").check();
  await page.locator("input[name=sx-mode][value=exam]").check();
  await page.click("#sx-start");
  await expect(page.locator("#sx-title")).toContainText("Section 1: Reading and Writing · Module 1");
  await expect(page.locator(".sx-top")).toContainText("толық нұсқа");
  expect(await page.locator("#sx-time").innerText()).toMatch(/^(32:00|31:5\d)$/);
  const answerAll = async (mode) => {
    const S = await page.evaluate(() => { const st = SAT.exam.state(), m = st.mods[st.mods.length - 1]; return m.items.map((q) => (q.choices ? { c: q.ans } : { g: `${q.grid.value[0]}/${q.grid.value[1]}` })); });
    for (let j = 0; j < S.length; j++) {
      const right = mode === "right" || (mode === "half" && j % 2 === 0);
      if (mode !== "blank") { if (S[j].c !== undefined) await page.locator(".sat-opts button").nth(right ? S[j].c : (S[j].c + 1) % 4).click(); else await page.fill("#sx-grid", right ? S[j].g : "999"); }
      if (j === 2) await page.click(".sx-mark");
      await page.click("#sx-next");
    }
    return S.length;
  };
  expect(await answerAll("right")).toBe(27);
  await expect(page.locator("#sx-rev-h")).toBeVisible();
  await expect(page.locator(".sx-navs button")).toHaveCount(27);
  await expect(page.locator(".sx-navs button.ans")).toHaveCount(27);
  await expect(page.locator(".sx-navs button.mk")).toHaveCount(1);
  await page.locator(".sx-navs button").nth(2).click();
  await expect(page.locator("#sx-qn")).toHaveText("3");
  await expect(page.locator(".sx-mark")).toHaveAttribute("aria-pressed", "true");
  await page.click(".sx-tool[aria-controls=sx-nav]");
  await page.locator("#sx-nav").getByRole("button", { name: "Шолу бетіне өту" }).click();
  await page.click("#sx-submit");
  await expect(page.locator("#sx-tr-h")).toContainText("1-модуль аяқталды");
  expect(await page.evaluate(() => SAT.exam.state().mods[1].pool)).toBe("hard");
  await page.click("#sx-go");
  await expect(page.locator("#sx-title")).toContainText("Module 2");
  await answerAll("blank");
  await page.click("#sx-submit");
  await expect(page.locator("#sx-br-h")).toHaveText("Үзіліс");
  await expect(page.locator("#sx-break-t")).toHaveText(/^(10:00|9:5\d)$/);
  await page.click("#sx-endbreak"); // үзілісті ерте аяқтау
  await expect(page.locator("#sx-title")).toContainText("Section 2: Math · Module 1");
  expect(await page.locator("#sx-time").innerText()).toMatch(/^(35:00|34:5\d)$/);
  expect(await page.evaluate(() => SAT.exam.state().mods[2].items[0].id)).toBe("mf-101");
  await expect(page.locator("#sx-stem")).toContainText("3(x + 4) = 27");
  expect(await answerAll("half")).toBe(22);
  await page.click("#sx-submit");
  expect(await page.evaluate(() => SAT.exam.state().mods[3].pool)).toBe("easy"); // 11/22 < 15
  await expect(page.locator(".sx-center")).toContainText("имитациясы");
  await page.click("#sx-go");
  await expect(page.locator("#sx-stem")).toContainText("7x = 42");
  await answerAll("right");
  await page.click("#sx-submit");
  await expect(page.locator("#sx-res-h")).toBeVisible();
  const res = await page.locator("#sx").innerText();
  expect(res).toContain("Reading and Writing: 27 / 54 дұрыс");
  expect(res).toContain("Math: 33 / 44 дұрыс");
  expect(res).toContain("1-модульде ≥ 15/22");
  expect(res).toContain("Толық нұсқа");
  expect(res).toContain("балл есептелмейді");
  expect(res).not.toMatch(/\b(1[0-5]\d\d|[2-8]\d0)\s*(балл|score)/i);
  expect(res).toContain("Geometry and Trigonometry");
  await page.getByRole("button", { name: "Тек белгіленгендер" }).click();
  await expect(page.locator(".sx-rev > li")).toHaveCount(4);
  expect(await page.evaluate((k) => localStorage.getItem(k), await page.evaluate(() => SAT.exam.KEY))).toBeNull(); // аяқталған емтихан сақталмайды
  expect(errs).toEqual([]);
});

test("прогресс сақталады: қайта жүктегенде «жалғастыру / жаңадан бастау»", async ({ page }) => {
  test.setTimeout(120_000);
  const errs = collectErrors(page);
  await withRw(page);
  await page.goto("academy/sat/exam.html");
  await expect(page.locator("#sx-resume")).toHaveCount(0);
  await page.locator("input[name=sx-mode][value=exam]").check();
  await page.click("#sx-start");
  const a0 = await page.evaluate(() => SAT.exam.state().mods[0].items[0].ans);
  await page.locator(".sat-opts button").nth(a0).click();
  await page.click("#sx-next");
  await page.locator(".sat-opts button").nth(1).click();
  await page.click(".sx-mark");
  await page.click("#sx-next");
  const before = await page.evaluate(() => { const m = SAT.exam.state().mods[0]; return { ids: m.items.map((q) => q.id + q.choices.join("|")), left: m.left }; });
  await page.reload();
  await expect(page.locator("#sx-resume")).toBeVisible();
  await expect(page.locator("#sx-resume")).toContainText("Қысқа нұсқа · Exam Mode · Reading and Writing · Module 1 · 3-сұрақ · жауап берілген: 2");
  await page.click("#sx-resume-go");
  await expect(page.locator("#sx-qn")).toHaveText("3");
  const after = await page.evaluate(() => { const m = SAT.exam.state().mods[0]; return { ids: m.items.map((q) => q.id + q.choices.join("|")), left: m.left, ans: m.ans, mark: m.mark }; });
  expect(after.ids).toEqual(before.ids); // нұсқалардың араласқан реті де сақталды
  expect(Math.abs(after.left - before.left)).toBeLessThanOrEqual(6);
  expect(after.ans[0]).toBe(a0); expect(after.ans[1]).toBe(1); expect(after.mark[1]).toBe(true);
  await page.click(".sx-tool[aria-controls=sx-nav]");
  await expect(page.locator(".sx-navs button.ans")).toHaveCount(2);
  await expect(page.locator(".sx-navs button.mk")).toHaveCount(1);
  await expect(page.locator("#sx-time")).toBeVisible();
  // модульді аяқтау → ауысу экраны да сақталады
  await page.locator("#sx-nav").getByRole("button", { name: "Шолу бетіне өту" }).click();
  await page.click("#sx-submit");
  await expect(page.locator("#sx-tr-h")).toBeVisible();
  await page.reload();
  await expect(page.locator("#sx-resume")).toContainText("1-модуль аяқталды");
  await page.click("#sx-resume-go");
  await expect(page.locator("#sx-tr-h")).toContainText("Reading and Writing: 1-модуль аяқталды");
  await page.click("#sx-go");
  await expect(page.locator("#sx-title")).toContainText("Module 2");
  // жаңадан бастау - сақталған күй өшеді
  await page.reload();
  await page.click("#sx-restart");
  await expect(page.locator("#sx-resume")).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem(SAT.exam.KEY))).toBeNull();
  // толық нұсқа үзіліс кезінде сақталады
  await page.locator("#sx-var-full").check();
  await page.click("#sx-start"); // Learning Mode
  await page.click(".sx-tool[aria-controls=sx-nav]");
  await page.locator("#sx-nav").getByRole("button", { name: "Шолу бетіне өту" }).click();
  await page.click("#sx-submit"); await page.click("#sx-go");
  await page.click(".sx-tool[aria-controls=sx-nav]");
  await page.locator("#sx-nav").getByRole("button", { name: "Шолу бетіне өту" }).click();
  await page.click("#sx-submit");
  await expect(page.locator("#sx-br-h")).toBeVisible();
  await page.reload();
  await expect(page.locator("#sx-resume")).toContainText("Толық нұсқа · Learning Mode · бөлімдер арасындағы үзіліс");
  await page.click("#sx-resume-go");
  await expect(page.locator("#sx-br-h")).toBeVisible();
  await page.click("#sx-endbreak");
  await expect(page.locator("#sx-title")).toContainText("Section 2: Math · Module 1");
  await expect(page.locator("#sx-qn")).toHaveText("1");
  expect(await page.evaluate(() => SAT.exam.state().mods[2].items.length)).toBe(22);
  expect(errs).toEqual([]);
});

const setRange = (page, sel, v) => page.$eval(sel, (e, v) => { e.value = String(v); e.dispatchEvent(new Event("input", { bubbles: true })); }, v);

/** Меңгеру тапсырмасы: генерацияланған 6 есепті ans арқылы шешеміз → 3/3 және «меңгерілді». */
async function master(page, lab) {
  for (let n = 0; n < 6; n++) {
    const P = await page.evaluate((l) => { const p = SAT[l].t2.cur(); return { ans: p.ans, keys: p.fields.map((f) => f.key), text: p.text }; }, lab);
    for (const k of P.keys) await page.fill(`#t2-${k}`, String(P.ans[k]));
    await page.click("#t2-check");
    await expect(page.locator("#t2-fb"), P.text).toHaveClass(/tt-ok/);
    await page.click("#t2-next");
  }
  await expect(page.locator("#t2-prog")).toContainText("3 / 3");
  for (let i = 0; i < 3; i++) await page.locator("#t2-h .tt-hbtn").click();
  await expect(page.locator("#t2-h li")).toHaveCount(3);
  await expect(page.locator("#t2-fb")).toContainText("меңгеруге саналмайды");
}

test("геометрия: болжам, сүйрелетін төбе (қосынды 180°), қадамдық дәлел, доға/аудан қатесін атау, шеңбер, меңгеру", async ({ page }) => {
  const errs = collectErrors(page);
  await page.goto("academy/sat/geometry.html");
  await expect(page.locator("[data-tab=cir]")).toBeDisabled();
  await page.click("#g-predict [data-p=up]");
  await expect(page.locator("#g-predict .tt-fb")).toHaveClass(/tt-bad/);
  await expect(page.locator("[data-tab=cir]")).toBeEnabled();
  const angC = () => page.locator("#g-read li").nth(2).locator("b").innerText();
  const c0 = await angC();
  const C = page.locator("#g-svg .sm-drag").nth(2);
  await C.focus();
  for (let i = 0; i < 4; i++) await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("Shift+ArrowUp");
  expect(await angC()).not.toBe(c0);
  await expect(page.locator("#g-read li.hot b")).toHaveText("180°");
  await expect(C).toHaveAttribute("aria-label", /C төбесі \(2\.5, 12\)|C төбесі \(2\.5, 11\.5\)/);
  // тінтуірмен сүйреу
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.locator("#g-svg").scrollIntoViewIfNeeded();
  const box = await page.locator("#g-svg").boundingBox();
  const A = page.locator("#g-svg .sm-drag").first();
  const ab = await A.boundingBox();
  await page.mouse.move(ab.x + ab.width / 2, ab.y + ab.height / 2); await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.8, { steps: 5 }); await page.mouse.up();
  await expect(A).toHaveAttribute("aria-label", /A төбесі \(3\.5, 2\.5\)/);
  await expect(page.locator("#g-read li.hot b")).toHaveText("180°");
  for (let i = 0; i < 4; i++) await page.click('#g-step button[aria-label="Келесі қадам"]');
  await expect(page.locator("#g-step")).toContainText("Қадам 5 / 5");
  await expect(page.locator("#g-steps li.on")).toContainText("жазыңқы бұрыш");
  // 1-тапсырма: қате түрін атайды
  for (const [v, txt] of [["12", "сектор АУДАНЫ"], ["2", "2 көбейткіші түсіп қалды"], ["8", "диаметр"], ["120", "бұрыштың өлшемі"]]) {
    await page.fill("#t1-k", v); await page.click("#t1-check");
    await expect(page.locator("#t1-fb")).toHaveClass(/tt-bad/); await expect(page.locator("#t1-fb")).toContainText(txt);
  }
  await page.fill("#t1-k", "4"); await page.click("#t1-check");
  await expect(page.locator("#t1-fb")).toHaveClass(/tt-ok/);
  // шеңбер: іштей бұрыш = орталықтың жартысы
  await page.click("[data-tab=cir]");
  await expect(page.locator("#g-read li").nth(0).locator("b")).toHaveText("90°");
  await expect(page.locator("#g-read li").nth(1).locator("b")).toHaveText("45°");
  await page.locator("#g-svg .sm-drag").nth(1).focus();
  await page.keyboard.press("ArrowRight"); await page.keyboard.press("ArrowRight");
  await expect(page.locator("#g-read li").nth(0).locator("b")).toHaveText("100°");
  await expect(page.locator("#g-read li").nth(1).locator("b")).toHaveText("50°");
  await expect(page.locator("#g-read li").nth(2).locator("b")).toContainText("2.222π");
  await page.click("[data-tab=sim]");
  await expect(page.locator("#g-read li").nth(0)).toContainText("= 0.6");
  await expect(page.locator("#g-read li").nth(1)).toContainText("= 0.6");
  await page.click("[data-tab=py]");
  await expect(page.locator("#g-read li").nth(3).locator("b")).toHaveText("5");
  await page.locator("#g-svg .sm-drag").nth(1).focus(); await page.keyboard.press("ArrowDown");
  await expect(page.locator("#g-read li").nth(3).locator("b")).toContainText("√18");
  await master(page, "geometry");
  await expect(page.locator("#g-badge")).toContainText("әрекет");
  expect(errs).toEqual([]);
});

test("тригонометрия: SOH-CAH-TOA қатесін атайды, A ↔ B, бірлік шеңбер, радиан, меңгеру", async ({ page }) => {
  const errs = collectErrors(page);
  await page.goto("academy/sat/trig.html");
  await page.click("#tr-predict [data-p=half]");
  await expect(page.locator("#tr-predict .tt-fb")).toHaveClass(/tt-ok/);
  await expect(page.locator("#tr-read li").nth(1).locator("b")).toContainText("0.6");
  await page.click("#tr-at [data-at=B]");
  await expect(page.locator("#tr-read li").nth(0)).toContainText("∠B");
  await expect(page.locator("#tr-read li").nth(1).locator("b")).toContainText("0.8");
  await page.fill("#t1-s", "0.8"); await page.fill("#t1-c", "0.6"); await page.fill("#t1-t", "4/3");
  await page.click("#t1-check");
  await expect(page.locator("#t1-fb")).toHaveClass(/tt-bad/);
  await expect(page.locator("#t1-fb")).toContainText("0 / 3");
  await expect(page.locator("#t1-fb")).toContainText("Бұл - cos");
  await expect(page.locator("#t1-fb")).toContainText("Бөлшек төңкерілген");
  await page.fill("#t1-s", "3/5"); await page.fill("#t1-c", ".8"); await page.fill("#t1-t", "0.75");
  await page.click("#t1-check");
  await expect(page.locator("#t1-fb")).toHaveClass(/tt-ok/);
  await page.locator("#tr-svg .sm-drag").focus(); await page.keyboard.press("ArrowLeft"); await page.keyboard.press("ArrowLeft");
  await expect(page.locator("#tr-svg .sm-drag")).toHaveAttribute("aria-label", /AC = 7/);
  await page.click("[data-tab=uc]");
  await expect(page.locator("#tr-read li").nth(0).locator("b")).toHaveText("35° = 7π/36 рад");
  await page.locator("#tu-svg .sm-drag").focus(); await page.keyboard.press("ArrowRight"); await page.keyboard.press("ArrowRight"); await page.keyboard.press("ArrowRight"); await page.keyboard.press("ArrowRight"); await page.keyboard.press("ArrowRight");
  await expect(page.locator("#tr-read li").nth(0).locator("b")).toHaveText("60° = π/3 рад");
  await expect(page.locator("#tr-read li").nth(2).locator("b")).toHaveText("0.866");
  await expect(page.locator("#tr-read li").nth(3).locator("b")).toHaveText("0.866");
  await page.click("[data-tab=rd]");
  await page.fill("#tr-deg", "150");
  await expect(page.locator("#tr-dout")).toContainText("5π/6");
  await page.fill("#tr-rad", "3/2");
  await expect(page.locator("#tr-rout")).toContainText("270°");
  await master(page, "trig");
  expect(errs).toEqual([]);
});

test("статистика: болжам (шеткі мән), нүктені жылжыту, бокс-диаграмма, құрастыру тапсырмасы, қателік шегі, меңгеру", async ({ page }) => {
  const errs = collectErrors(page);
  await page.goto("academy/sat/stats.html");
  await expect(page.locator("#st-out")).toBeDisabled();
  await page.click("#st-predict [data-p=median]");
  await expect(page.locator("#st-predict .tt-fb")).toHaveClass(/tt-bad/);
  await expect(page.locator("#st-read li").nth(1).locator("b")).toHaveText("8");
  await expect(page.locator("#st-read li").nth(0).locator("b")).toContainText("9.11");
  const pt = page.locator("#st-svg .sm-drag").first();
  await pt.focus(); await page.keyboard.press("ArrowRight");
  await expect(pt).toHaveAttribute("aria-label", /мәні 5/);
  await expect(page.locator("#st-live")).toContainText("Орташа 9.22");
  await page.click("#st-out");
  await expect(page.locator("#st-live")).toContainText("орташаны өзіне тартады");
  await expect(page.locator("#st-read li").nth(5).locator("b")).toHaveText("10");
  await page.click("#t1-check");
  await expect(page.locator("#t1-fb")).toHaveClass(/tt-bad/);
  await expect(page.locator("#t1-fb")).toContainText("9 керек");
  await page.click("#st-out");
  await page.click("#t1-check");
  await expect(page.locator("#t1-fb")).toContainText("қосынды 9·10 = 90");
  await page.evaluate(() => SAT.stats.setData([4, 6, 7, 7, 8, 11, 13, 16, 17]));
  const last = page.locator("#st-svg .sm-drag").nth(8);
  await last.focus(); await page.keyboard.press("ArrowRight");
  await page.click("#t1-check");
  await expect(page.locator("#t1-fb")).toHaveClass(/tt-ok/);
  await page.click("#st-pack");
  await expect(page.locator("#st-read li").nth(3).locator("b")).toContainText("−");
  // қателік шегі
  await page.locator('[data-q=moe1] button[data-ok=true]').click();
  await expect(page.locator("[data-q=moe1] .tt-fb")).toHaveClass(/tt-ok/);
  await page.locator('[data-q=moe2] button[data-ok=false]').first().click();
  await expect(page.locator("[data-q=moe2] .tt-fb")).toHaveClass(/tt-bad/);
  await expect(page.locator("[data-q=moe2] .tt-fb")).toContainText("Дұрысы: «It will decrease.»");
  await master(page, "stats");
  expect(errs).toEqual([]);
});

test("пайыздар: +20% −20% қақпаны, қадамдық бағана, өзгеріс ескі мәннен, кері пайыз қатесі, меңгеру", async ({ page }) => {
  const errs = collectErrors(page);
  await page.goto("academy/sat/percent.html");
  await expect(page.locator("#pc-p1")).toBeDisabled();
  await page.click("#pc-predict [data-p=same]");
  await expect(page.locator("#pc-predict .tt-fb")).toContainText("классикалық қақпаны");
  await expect(page.locator("#pc-step")).toContainText("Қадам 1 / 4");
  await expect(page.locator("#pc-svg rect.sm-bar")).toHaveCount(1);
  for (let i = 0; i < 3; i++) await page.click('#pc-step button[aria-label="Келесі қадам"]');
  await expect(page.locator("#pc-svg rect.sm-bar")).toHaveCount(5);
  await expect(page.locator("#pc-read li").nth(3).locator("b")).toHaveText("−4%");
  await expect(page.locator("#pc-note")).toContainText("бір-бірін жоймайды");
  // Ойнату батырмасы
  await page.click('#pc-step button[aria-label="Басынан бастау"]');
  await page.selectOption("#pc-step select", "800");
  await page.click('#pc-step button[aria-label="Ойнату"]');
  await expect(page.locator("#pc-step")).toContainText("Қадам 4 / 4", { timeout: 5000 });
  await setRange(page, "#pc-p1", 50);
  await expect(page.locator("#pc-read li").nth(3).locator("b")).toHaveText("+20%");
  await page.click("[data-tab=chg]");
  await expect(page.locator("#pc-read li").nth(1).locator("b")).toHaveText("+30%");
  await page.fill("#pc-new", "30");
  await expect(page.locator("#pc-read li").nth(1).locator("b")).toHaveText("−25%");
  await page.click("[data-tab=rev]");
  await expect(page.locator("#pc-read li").nth(2).locator("b")).toHaveText("24 000");
  for (const [v, txt] of [["22500", "кері қолдандың"], ["13500", "тағы бір рет"]]) {
    await page.fill("#t1-x", v); await page.click("#t1-check");
    await expect(page.locator("#t1-fb")).toContainText(txt);
  }
  await page.fill("#t1-x", "24000"); await page.click("#t1-check");
  await expect(page.locator("#t1-fb")).toHaveClass(/tt-ok/);
  await master(page, "percent");
  expect(errs).toEqual([]);
});

test("функциялар: f(x − 2) болжамы, нысана графикті беттестіру (белгі қақпаны), сызықтық/экспонента кестесі, жүйе, меңгеру", async ({ page }) => {
  const errs = collectErrors(page);
  await page.goto("academy/sat/functions.html");
  await page.click("#fn-predict [data-p=left]");
  await expect(page.locator("#fn-predict .tt-fb")).toContainText("қақпан");
  await expect(page.locator("#fn-formula")).toHaveText("y = (x − 2)²");
  await expect(page.locator("#fn-read li").first().locator("b")).toHaveText("(1, 1) → (3, 1)");
  await page.selectOption("#fn-base", "abs");
  await page.fill("#fn-an", "-2"); await page.fill("#fn-hn", "3"); await page.fill("#fn-kn", "4");
  await expect(page.locator("#fn-formula")).toHaveText("y = −2|x − 3| + 4");
  await page.click("#t1-check");
  await expect(page.locator("#t1-fb")).toHaveClass(/tt-bad/);
  await expect(page.locator("#t1-fb")).toContainText("белгі қақпаны");
  await page.fill("#fn-hn", "-3"); await page.fill("#fn-an", "2");
  await page.click("#t1-check");
  await expect(page.locator("#t1-fb")).toContainText("x осі бойынша шағылысқан");
  await page.fill("#fn-an", "-2");
  await page.click("#t1-check");
  await expect(page.locator("#t1-fb")).toHaveClass(/tt-ok/);
  await page.check("#fn-ry");
  await expect(page.locator("#fn-formula")).toHaveText("y = −2|−(x + 3)| + 4");
  await page.click("[data-tab=le]");
  await expect(page.locator("#fl-tbl")).toContainText("+10");
  await expect(page.locator("#fl-tbl")).toContainText("×1.4");
  await expect(page.locator("#fn-read li").nth(2).locator("b")).toContainText("x ≈");
  await page.click("[data-tab=sy]");
  await expect(page.locator("#fn-read li").first().locator("b")).toHaveText("бір шешім");
  await setRange(page, "#fs-m2", 1);
  await expect(page.locator("#fn-read li").first().locator("b")).toHaveText("шешім жоқ");
  await setRange(page, "#fs-b2", 2);
  await expect(page.locator("#fn-read li").first().locator("b")).toHaveText("шексіз көп");
  await master(page, "functions");
  expect(errs).toEqual([]);
});

for (const scheme of ["light", "dark"]) {
  test(`SAT Math беттері (${scheme}): 360px-те жылжу жоқ, a11y`, async ({ browser }) => {
    test.setTimeout(150_000);
    const c = await browser.newContext({ viewport: { width: 360, height: 740 }, colorScheme: scheme, reducedMotion: "reduce" });
    await blockFonts(c);
    if (!RW_REAL) await c.addInitScript(stubRw);
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
    for (const l of LABS) { await p.goto(`academy/sat/${l}.html`); await check(l); }
    await p.goto("academy/sat/geometry.html"); await p.click("#g-predict [data-p=same]"); await p.click("[data-tab=cir]"); await p.fill("#t1-k", "12"); await p.click("#t1-check"); await check("geometry-circle");
    await p.goto("academy/sat/trig.html"); await p.click("#tr-predict [data-p=two]"); await p.click("[data-tab=uc]"); await check("trig-unit");
    await p.goto("academy/sat/stats.html"); await p.click("#st-predict [data-p=mean]"); await p.locator('[data-q=moe1] button').first().click(); await check("stats-answered");
    await p.goto("academy/sat/percent.html"); await p.click("#pc-predict [data-p=less4]"); await p.click('#pc-step button[aria-label="Келесі қадам"]'); await check("percent-step");
    await p.goto("academy/sat/functions.html"); await p.click("#fn-predict [data-p=right]"); await p.click("[data-tab=le]"); await check("functions-table");
    await p.goto("academy/sat/exam.html"); await check("exam-intro-full");
    await p.locator("#sx-var-full").check(); await p.locator("input[name=sx-mode][value=exam]").check(); await p.click("#sx-start"); await p.click("#sx-next"); await p.click(".sx-tool[aria-controls=sx-nav]"); await check("exam-full-module");
    await p.goto("academy/sat/exam.html"); await check("exam-resume-panel");
    expect(problems, problems.join("\n")).toEqual([]);
    expect(errs).toEqual([]);
    await c.close();
  });
}
