// © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md.
// SAT Reading and Writing (2-пакет): толық R&W банкі (81 сұрақ) және төрт зертхана - grammar, rhetorical, vocab, central-ideas.
// Тексереміз: банк құрылымы (саны, домен үлесі мен реті, түсіндірмелер, id бірегейлігі, sat-bank.js-пен қайталанбау),
// зертханалардағы болжам → тексеру → қате түсіндірмесі → меңгеру тексерісі, ереже қозғалтқышы, консоль қатесі жоқ,
// 360px-те көлденең жылжу жоқ, axe wcag2a/aa (serious+critical) = 0 жарық және қараңғы режимде.
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { blockFonts, collectErrors } = require("../support/helpers");
const AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const ROOT = path.resolve(__dirname, "../..");
const PAGES = ["grammar", "rhetorical", "vocab", "central-ideas"].map((p) => `academy/sat/${p}.html`);

const load = (...files) => { const ctx = { window: {} }; vm.createContext(ctx); files.forEach((f) => vm.runInContext(fs.readFileSync(path.join(ROOT, f), "utf8"), ctx)); return ctx.window; };

test.beforeEach(async ({ context }) => { await blockFonts(context); });

test.describe("толық R&W банкі", () => {
  const W = load("assets/data/sat-bank.js", "assets/data/sat-bank-rw-full.js");
  const B = W.SAT_BANK_FULL.rw, OLD = Object.values(W.SAT_BANK.rw).flat();
  const all = ["m1", "hard", "easy"].flatMap((k) => B[k]);
  const ORDER = ["Craft and Structure", "Information and Ideas", "Standard English Conventions", "Expression of Ideas"];
  const SKILLS = { "Craft and Structure": ["Words in Context", "Text Structure and Purpose", "Cross-Text Connections"], "Information and Ideas": ["Central Ideas and Details", "Command of Evidence", "Inferences"], "Standard English Conventions": ["Boundaries", "Form, Structure, and Sense"], "Expression of Ideas": ["Rhetorical Synthesis", "Transitions"] };

  test("81 сұрақ: әр модульде 27, ресми домен үлесі мен реті", () => {
    expect(all).toHaveLength(81);
    for (const k of ["m1", "hard", "easy"]) {
      const m = B[k];
      expect(m, k).toHaveLength(27);
      const c = {}; m.forEach((q) => (c[q.domain] = (c[q.domain] || 0) + 1));
      expect(c, k).toEqual({ "Craft and Structure": 8, "Information and Ideas": 7, "Standard English Conventions": 7, "Expression of Ideas": 5 });
      // 8/27 ≈ 30%, 7/27 ≈ 26%, 5/27 ≈ 19% - ресми 28/26/26/20 үлесіне ±4 пайыз
      for (const [d, want] of Object.entries({ "Craft and Structure": 28, "Information and Ideas": 26, "Standard English Conventions": 26, "Expression of Ideas": 20 })) expect(Math.abs((c[d] / 27) * 100 - want), d).toBeLessThanOrEqual(4);
      const idx = m.map((q) => ORDER.indexOf(q.domain));
      expect(idx, k + ": домендер реті").toEqual([...idx].sort((a, b) => a - b));
      // форматтар: екі мәтін, кесте, bullet жазбалар, transitions
      expect(m.some((q) => q.passage.some((p) => p.startsWith("Text 1:")) && q.passage.some((p) => p.startsWith("Text 2:"))), k + ": cross-text").toBe(true);
      expect(m.some((q) => q.table && q.table.rows.length >= 3), k + ": кесте").toBe(true);
      expect(m.filter((q) => q.skill === "Rhetorical Synthesis").every((q) => q.passage.filter((p) => p.startsWith("• ")).length >= 3), k + ": жазбалар").toBe(true);
      expect(m.some((q) => q.skill === "Transitions"), k).toBe(true);
    }
    const diff = (k) => B[k].filter((q) => q.diff === "hard").length - B[k].filter((q) => q.diff === "easy").length;
    expect(diff("hard")).toBeGreaterThan(diff("m1"));
    expect(diff("m1")).toBeGreaterThan(diff("easy"));
    expect(B.hard.filter((q) => q.diff === "hard").length).toBeGreaterThanOrEqual(20);
    expect(B.easy.filter((q) => q.diff === "hard").length).toBe(0);
  });

  test("әр сұрақ схемаға сай: id бірегей, ресми дағды, әр нұсқаға түсіндірме", () => {
    const ids = new Set();
    for (const q of all) {
      expect(q.id).toMatch(/^rwf-/);
      expect(ids.has(q.id), q.id).toBe(false); ids.add(q.id);
      expect(SKILLS[q.domain], q.id).toContain(q.skill);
      expect(["easy", "medium", "hard"]).toContain(q.diff);
      expect(Array.isArray(q.passage) && q.passage.every((p) => typeof p === "string" && p.length > 0), q.id).toBe(true);
      const words = q.passage.join(" ").split(/\s+/).length;
      expect(words, q.id + " сөз саны").toBeGreaterThanOrEqual(25);
      expect(words, q.id + " сөз саны").toBeLessThanOrEqual(150);
      expect(q.stem.length).toBeGreaterThan(20);
      expect(q.choices).toHaveLength(4);
      expect(new Set(q.choices).size, q.id).toBe(4);
      expect(q.why).toHaveLength(4);
      q.why.forEach((w, i) => { expect(w.length, `${q.id} why[${i}]`).toBeGreaterThan(15); expect(/[А-Яа-яӘәҒғҚқҢңӨөҰұҮүҺһІі]/.test(w), `${q.id} why[${i}] қазақша`).toBe(true); });
      expect(Number.isInteger(q.ans) && q.ans >= 0 && q.ans < 4, q.id).toBe(true);
      expect(q.why[q.ans].startsWith("Дұрыс"), q.id + ": дұрыс жауаптың түсіндірмесі").toBe(true);
      q.why.forEach((w, i) => { if (i !== q.ans) expect(w.startsWith("Дұрыс:"), `${q.id}: қате нұсқа «Дұрыс» деп басталмауы керек`).toBe(false); });
      if (q.table) { expect(q.table.head.length).toBeGreaterThanOrEqual(2); q.table.rows.forEach((r) => expect(r).toHaveLength(q.table.head.length)); }
      if (/______/.test(q.passage.join(" "))) expect(q.passage.join(" ").match(/______/g), q.id).toHaveLength(1);
    }
    // жауап орындары біркелкі таралған (әр әріп әр модульде кемінде 4 рет)
    for (const k of ["m1", "hard", "easy"]) for (let a = 0; a < 4; a++) expect(B[k].filter((q) => q.ans === a).length, `${k} ans=${a}`).toBeGreaterThanOrEqual(4);
  });

  test("sat-bank.js-пен қайталанбайды; ойдан шығарылған дерек белгіленген", () => {
    const norm = (s) => s.toLowerCase().replace(/[^a-z]+/g, " ").trim();
    const oldIds = new Set(OLD.map((q) => q.id)), oldPass = new Set(OLD.map((q) => norm(q.passage.join(" "))));
    // стандарт кіріспе жолдарын (While researching..., The following text...) алып тастап, мәтіннің өз бастамасын салыстырамыз
    const body = (q) => norm(q.passage.filter((p) => !/^(While researching|The following text)/.test(p)).join(" ")).split(" ").slice(0, 8).join(" ");
    const oldStarts = new Set(OLD.map(body));
    for (const q of all) {
      expect(oldIds.has(q.id), q.id).toBe(false);
      expect(oldPass.has(norm(q.passage.join(" "))), q.id).toBe(false);
      expect(oldStarts.has(body(q)), q.id + ": бастамасы бірдей").toBe(false);
    }
    const pass = all.map((q) => norm(q.passage.join(" ")));
    expect(new Set(pass).size).toBe(81);
    // әдеби үзінділер мен ойдан шығарылған зерттеулер ашық белгіленген
    all.filter((q) => /\bfrom an original (story|poem)|original (short )?(story|poem)/i.test(q.passage.join(" "))).forEach((q) => expect(q.passage.join(" "), q.id).toMatch(/written for this practice set/));
    all.filter((q) => /\b(researchers?|botanist|hydrologists?|engineer|study|experiment|survey)\b/i.test(q.passage.join(" ")) && q.skill === "Command of Evidence" && !q.passage[0].startsWith("\"")).forEach((q) => expect(q.passage.join(" "), q.id).toMatch(/\b(Suppose|hypothetical)\b|original/));
  });
});

test("грамматика: ереже қозғалтқышы, диаграмма, comma splice түсіндірмесі", async ({ page }) => {
  const errs = collectErrors(page);
  await page.goto("academy/sat/grammar.html");
  // ереже қозғалтқышы барлық дайын сөйлемдерде
  const marks = await page.evaluate(() => window.SAT_RW_GRAMMAR.bd.map((it) => ({ id: it.id, ok: window.SATRW.grammar.okMarks(it) })));
  const want = { bd1: [".", ";", "conj"], bd2: [","], bd3: [".", ";", ":", "—"], bd4: [":", "—"], bd5: [""], bd6: [".", ";", "conj"], bd7: [","], bd8: [".", ";"] };
  for (const m of marks) expect(m.ok, m.id).toEqual(want[m.id]);
  // генератор: әр жаңа сөйлемнің кемінде бір дұрыс және үш қате белгісі бар
  const gen = await page.evaluate(() => Array.from({ length: 40 }, () => { const g = window.SATRW.grammar.genBd(); const ok = window.SATRW.grammar.okMarks(g); return [ok.length, 7 - ok.length]; }));
  gen.forEach(([a, b]) => { expect(a).toBeGreaterThanOrEqual(1); expect(b).toBeGreaterThanOrEqual(3); });

  await expect(page.locator("#bd-l b")).toContainText("?");
  await page.click("#bd-cl [data-t=ic]");
  await page.click("#bd-cr [data-t=dc]");
  await expect(page.locator("#bd-fb1")).toHaveClass(/tt-bad/);
  await expect(page.locator("#bd-fb1")).toContainText("оң жақ бөлік - Тәуелсіз сөйлем");
  await expect(page.locator("#bd-l")).toHaveClass(/ic/);
  await expect(page.locator("#bd-l .s")).toHaveText("The museum's new wing");
  await expect(page.locator("#bd-l .v")).toHaveText("opened");
  await page.click('#bd-marks [data-m=","]');
  await expect(page.locator("#bd-fb2")).toHaveClass(/tt-bad/);
  await expect(page.locator("#bd-fb2")).toContainText("Comma splice");
  await expect(page.locator("#bd-joint")).toHaveClass(/no/);
  await expect(page.locator("#bd-all")).toContainText("; нүктелі үтір");
  await page.click("#bd-next");
  await page.click("#bd-cl [data-t=dc]");
  await page.click("#bd-cr [data-t=ic]");
  await expect(page.locator("#bd-fb1")).toHaveClass(/tt-ok/);
  await page.click('#bd-marks [data-m=";"]');
  await expect(page.locator("#bd-fb2")).toContainText("бағыныңқы сөйлем");
  // үш көмек → шешім → келесіге жаңа құрастырылған сөйлем қосылады
  await page.click("#bd-next");
  for (let k = 0; k < 3; k++) await page.click("#bd-h .tt-hbtn");
  await expect(page.locator("#bd-fb2")).toContainText("Шешім ашылды");
  await page.click("#bd-cl [data-t=ic]"); await page.click("#bd-cr [data-t=ic]"); await page.click('#bd-marks [data-m=":"]');
  await expect(page.locator("#bd-fb2")).toHaveClass(/tt-ok/);
  await page.click("#bd-next");
  await expect(page.locator("#bd-prog")).toContainText("генератор");
  expect(errs).toEqual([]);
});

test("грамматика: бастауыш іздеу (болжам → қадамдар), анықтауыш, меңгеру", async ({ page }) => {
  const errs = collectErrors(page);
  await page.goto("academy/sat/grammar.html");
  await expect(page.locator("#sv-ctl [data-c=play]")).toBeHidden();
  await page.click('#sv-toks [data-w="maps"]');
  await expect(page.locator("#sv-fb1")).toHaveClass(/tt-bad/);
  await expect(page.locator("#sv-fb1")).toContainText("of-тіркес");
  await expect(page.locator("#sv-ctl [data-c=n]")).toHaveText("Қадам 1 / 4");
  await page.click("#sv-ctl [data-c=next]");
  await expect(page.locator('#sv-toks [data-w="maps"]')).toHaveClass(/x/);
  await page.click("#sv-ctl [data-c=next]"); await page.click("#sv-ctl [data-c=next]");
  await expect(page.locator('#sv-toks [data-w="collection"]')).toHaveClass(/head/);
  await expect(page.locator("#sv-say")).toContainText("жекеше");
  await page.click("#sv-ctl [data-c=prev]");
  await expect(page.locator('#sv-toks [data-w="collection"]')).not.toHaveClass(/head/);
  await page.locator("#sv-opts button", { hasText: "are" }).click();
  await expect(page.locator("#sv-fb2")).toHaveClass(/tt-bad/);
  await page.click("#sv-next");
  await page.click('#sv-toks [data-w="engineers"]');
  await expect(page.locator("#sv-fb1")).toHaveClass(/tt-ok/);
  await page.locator("#sv-opts button", { hasText: "take" }).first().click();
  await expect(page.locator("#sv-fb2")).toHaveClass(/tt-ok/);
  // анықтауыш: pm5-ке жету
  for (let k = 0; k < 4; k++) { await page.locator("#pm-opts button").first().click(); await page.click("#pm-next"); }
  await expect(page.locator("#pm-text")).toContainText("Walking along the beach");
  await page.locator("#pm-opts button").first().click();
  await expect(page.locator("#pm-fb")).toHaveClass(/tt-bad/);
  await expect(page.locator("#pm-r")).toContainText("the sky");
  await expect(page.locator("#pm-j")).toContainText("✗");
  await expect(page.locator("#pm-why li")).toHaveCount(4);
  // меңгеру: 6 жаңа сөйлем, барлығы дұрыс
  await page.click("#mx-start");
  for (let k = 0; k < 6; k++) {
    const ans = await page.evaluate(() => { const s = window.SATRW.grammar.state(); return s.mx[s.mi].ans; });
    await page.locator("#mx-opts button").nth(ans).click();
    await expect(page.locator("#mx-fb")).toHaveClass(/tt-ok/);
    if (k < 5) await page.click("#mx-next");
  }
  await expect(page.locator("#mx-fb")).toContainText("6 / 6");
  await expect(page.locator("#mx-sum li.ok")).toHaveCount(6);
  const t = await page.evaluate(() => JSON.parse(localStorage.getItem("ao17:tutor:v1")).skills);
  expect(t["sat.rw.boundaries"].n).toBeGreaterThanOrEqual(3);
  expect(t["sat.rw.form-structure-and-sense"].n).toBeGreaterThanOrEqual(5);
  expect(errs).toEqual([]);
});

test("rhetorical: болжам, матрица, қате түсіндірмесі, 12 жиынтық, меңгеру", async ({ page }) => {
  const errs = collectErrors(page);
  await page.goto("academy/sat/rhetorical.html");
  const sets = await page.evaluate(() => window.SAT_RW_RHET.sets);
  expect(sets.length).toBeGreaterThanOrEqual(10);
  for (const s of sets) { expect(s.opts.filter((o) => o.ok), s.id).toHaveLength(1); const g = s.opts.find((o) => o.ok); s.need.forEach((n) => expect(g.uses, s.id).toContain(n)); }
  await expect(page.locator("#rs-s2")).toBeHidden();
  await page.click('#rs-notes [data-n="0"]');
  await page.click("#rs-pcheck");
  await expect(page.locator("#rs-fb1")).toContainText("№2");
  await expect(page.locator('#rs-notes [data-n="1"]')).toHaveClass(/miss/);
  const opts = await page.evaluate(() => window.SATRW.rhet.state().opts);
  const bad = opts.findIndex((o) => !o.ok);
  await page.locator("#rs-opts button").nth(bad).click();
  await expect(page.locator("#rs-fb2")).toHaveClass(/tt-bad/);
  await expect(page.locator("#rs-mx table")).toBeVisible();
  await expect(page.locator("#rs-mx tbody tr")).toHaveCount(4);
  await expect(page.locator("#rs-mx td.goal.yes")).toHaveCount(1);
  await expect(page.locator("#rs-why li")).toHaveCount(4);
  for (let k = 1; k < 12; k++) {
    await page.click("#rs-next");
    const st = await page.evaluate(() => window.SATRW.rhet.state());
    if (st.i >= 8) { await expect(page.locator("#rs-h")).toBeHidden(); await expect(page.locator("#rs-s1")).toBeHidden(); }
    else { await page.click("#rs-pcheck"); }
    await page.locator("#rs-opts button").nth(st.opts.findIndex((o) => o.ok)).click();
    await expect(page.locator("#rs-fb2")).toHaveClass(/tt-ok/);
  }
  await page.click("#rs-next");
  await expect(page.locator("#rs-fb2")).toContainText("Меңгеру тексерісі: 4 / 4");
  expect(errs).toEqual([]);
});

test("vocab: белгіні табу → сигнал түрі → сөз, 18 сөйлем", async ({ page }) => {
  const errs = collectErrors(page);
  await page.goto("academy/sat/vocab.html");
  const items = await page.evaluate(() => window.SAT_RW_VOCAB.items);
  expect(items.length).toBeGreaterThanOrEqual(15);
  for (const v of items) { expect(v.s, v.id).toContain(v.clue); expect(v.s, v.id).toContain(v.sig); expect(v.s.match(/______/g)).toHaveLength(1); expect(v.why).toHaveLength(4); expect(v.why[v.ans]).toMatch(/^Дұрыс/); }
  await expect(page.locator("#vc-s2")).toBeHidden();
  await page.locator("#vc-toks button", { hasText: "guide's" }).click();
  await expect(page.locator("#vc-fb1")).toHaveClass(/tt-bad/);
  await expect(page.locator("#vc-toks .rw-clue").first()).toBeVisible();
  await page.click('#vc-types [data-t="contrast"]');
  await expect(page.locator("#vc-fb2")).toContainText("Қайталау/түсіндіру");
  await expect(page.locator("#vc-op")).toContainText("=");
  await page.locator("#vc-opts button").nth(1).click();
  await expect(page.locator("#vc-fb3")).toHaveClass(/tt-bad/);
  await expect(page.locator("#vc-fb3")).toContainText("precise");
  await expect(page.locator("#vc-bl")).toContainText("дәл, нақты");
  await page.click("#vc-next");
  await page.locator("#vc-toks button", { hasText: "Unlike" }).click();
  await expect(page.locator("#vc-fb1")).toHaveClass(/tt-ok/);
  await page.click('#vc-types [data-t="contrast"]');
  await page.locator("#vc-opts button", { hasText: "reticent" }).click();
  await expect(page.locator("#vc-fb3")).toHaveClass(/tt-ok/);
  for (let k = 2; k < 18; k++) {
    await page.click("#vc-next");
    const st = await page.evaluate(() => window.SATRW.vocab.state());
    if (st.i < 12) { await page.locator("#vc-toks button").nth(0).click(); await page.click(`#vc-types [data-t="${st.it.type}"]`); }
    else await expect(page.locator("#vc-s1")).toBeHidden();
    await page.locator("#vc-opts button").nth(st.it.ans).click();
  }
  await page.click("#vc-next");
  await expect(page.locator("#vc-fb3")).toContainText("Меңгеру тексерісі: 6 / 6");
  expect(errs).toEqual([]);
});

test("central-ideas: детальдардан негізгі ой, қамту тақтасы, inference, меңгеру", async ({ page }) => {
  const errs = collectErrors(page);
  await page.goto("academy/sat/central-ideas.html");
  const D = await page.evaluate(() => window.SAT_RW_CENTRAL);
  expect(D.length).toBeGreaterThanOrEqual(8);
  for (const c of D) {
    expect(c.mains.filter((m) => m.ok), c.id).toHaveLength(1);
    const core = c.cards.map((x, k) => (x.core ? k : -1)).filter((k) => k >= 0);
    core.forEach((k) => expect(c.mains.find((m) => m.ok).covers, c.id).toContain(k));
    expect(c.inf.why).toHaveLength(4); expect(c.inf.why[c.inf.ans]).toMatch(/^Дұрыс/);
  }
  await page.click('#ci-cards [data-k="3"]');
  await page.click("#ci-build");
  await expect(page.locator("#ci-fb1")).toContainText("Түсіп қалған негізгі деталь");
  await expect(page.locator('#ci-cards [data-k="3"]')).toHaveClass(/side/);
  const mains = await page.evaluate(() => window.SATRW.central.state().mains);
  const narrow = mains.findIndex((m) => m.flaw.startsWith("Тым тар"));
  await page.locator("#ci-opts button").nth(narrow).click();
  await expect(page.locator("#ci-fb2")).toHaveClass(/tt-bad/);
  await expect(page.locator("#ci-fb2")).toContainText("Тым тар");
  await expect(page.locator("#ci-cov li")).toHaveCount(4);
  await expect(page.locator("#ci-cov li.pick .bar i.hit, #ci-cov li.pick .bar i.extra")).toHaveCount(1);
  await page.locator("#ci-iopts button").nth(0).click();
  await expect(page.locator("#ci-fb3")).toHaveClass(/tt-ok/);
  for (let k = 1; k < D.length; k++) {
    await page.click("#ci-next");
    const st = await page.evaluate(() => window.SATRW.central.state());
    if (st.i < 6) await page.click("#ci-build"); else await expect(page.locator("#ci-h")).toBeHidden();
    await page.locator("#ci-opts button").nth(st.mains.findIndex((m) => m.ok)).click();
    await page.locator("#ci-iopts button").nth(st.it.inf.ans).click();
    await expect(page.locator("#ci-fb3")).toHaveClass(/tt-ok/);
  }
  await page.click("#ci-next");
  await expect(page.locator("#ci-fb3")).toContainText("3 / 3");
  const t = await page.evaluate(() => JSON.parse(localStorage.getItem("ao17:tutor:v1")).skills);
  expect(t["sat.rw.central-ideas-and-details"].n).toBe(D.length);
  expect(t["sat.rw.inferences"].n).toBe(D.length);
  expect(errs).toEqual([]);
});

test("қозғалысты азайту: «Ойнату» бірден толық түсіндірілген соңғы қадамды көрсетеді", async ({ browser }) => {
  const c = await browser.newContext({ reducedMotion: "reduce" });
  await blockFonts(c);
  const p = await c.newPage();
  await p.goto("academy/sat/grammar.html");
  await p.click('#sv-toks [data-w="collection"]');
  await p.click("#sv-ctl [data-c=play]");
  await expect(p.locator("#sv-ctl [data-c=n]")).toHaveText("Қадам 4 / 4");
  await expect(p.locator('#sv-toks [data-w="collection"]')).toHaveClass(/head/);
  await c.close();
});

for (const scheme of ["light", "dark"]) {
  test(`SAT R&W зертханалары (${scheme}): 360px-те жылжу жоқ, a11y`, async ({ browser }) => {
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
    await p.goto("academy/sat/grammar.html");
    await p.click("#bd-cl [data-t=ic]"); await p.click("#bd-cr [data-t=ph]"); await p.click('#bd-marks [data-m=","]');
    await p.click('#sv-toks [data-w="maps"]'); await p.click("#sv-ctl [data-c=play]"); await p.locator("#sv-opts button").first().click();
    await p.locator("#pm-opts button").nth(1).click();
    await p.click("#mx-start"); await p.locator("#mx-opts button").first().click();
    await check("grammar-answered");
    await p.goto("academy/sat/rhetorical.html"); await p.click('#rs-notes [data-n="0"]'); await p.click("#rs-pcheck"); await p.locator("#rs-opts button").first().click(); await p.click("#rs-h .tt-hbtn"); await check("rhetorical-answered");
    await p.goto("academy/sat/vocab.html"); await p.locator("#vc-toks button").nth(3).click(); await p.click('#vc-types [data-t="cause"]'); await p.locator("#vc-opts button").nth(2).click(); await check("vocab-answered");
    await p.goto("academy/sat/central-ideas.html"); await p.click('#ci-cards [data-k="0"]'); await p.click("#ci-build"); await p.locator("#ci-opts button").first().click(); await p.locator("#ci-iopts button").nth(1).click(); await check("central-answered");
    expect(problems, problems.join("\n")).toEqual([]);
    expect(errs).toEqual([]);
    await c.close();
  });
}
