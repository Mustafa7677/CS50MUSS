// © 2026 Sagid Mustafa. All Rights Reserved.
// «Математика» курсы (math/): беттер, KaTeX, есеп қозғалтқышы (барлық түр), қауіпсіз парсер, қадамдық шешім, параметрлік есеп, прогресс,
// визуализация, ортақ беттер, статистика, офлайн кэш, лицензия (B), math_verify.py. Нұсқаулық: docs/MATH-COURSE-GUIDE.md.
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");
const { execFileSync, spawn } = require("child_process");
const { ROOT, blockFonts, collectErrors } = require("../support/helpers");

const MATH = path.join(ROOT, "math");
const LESSONS = fs.readdirSync(path.join(MATH, "lectures")).filter((f) => /^week-\d+\.html$/.test(f)).sort((a, b) => parseInt(a.slice(5)) - parseInt(b.slice(5)));
const isSoon = (f) => fs.readFileSync(path.join(MATH, "lectures", f), "utf8").includes("<!-- soon -->");
const READY = LESSONS.filter((f) => !isSoon(f));
const TOOLS = ["formulas", "glossary", "practice"];
const PED = ["route", "exam"]; // tools/math_pedagogy.py жасайтын беттер: оқу жолы, пән емтихандары
const PLAN_JS = fs.readFileSync(path.join(MATH, "data/plan.js"), "utf8");
const PLAN = JSON.parse(PLAN_JS.replace(/^window\.CS50KZ_MATH_PLAN = /, "").replace(/;\s*$/, ""));
const { site_stats: S } = JSON.parse(execFileSync("python3", [path.join(ROOT, "tools/build.py"), "--stats"], { encoding: "utf8" }));
const LESSON0 = "math/lectures/week-0.html";

async function open(page, url) {
  await blockFonts(page.context());
  await page.goto(url);
  await page.waitForFunction(() => window.CS50KZ_MATH && window.CS50KZ_MATH.ready);
}
const API = (page, fn, ...args) => page.evaluate(([f, a]) => { const r = window.CS50KZ_MATH[f](...a); return r; }, [fn, args]);

// ------------------------------------------------------------------ құрылым
test("құрылым: 25 пән, жоспар = build деректері, main.js COURSE_META және MATH_COUNTS сәйкес", () => {
  expect(PLAN.subjects.length).toBe(25);
  expect(PLAN.subjects.filter((s) => s.group === "F").map((s) => s.slug)).toEqual(["arith"]);
  expect(PLAN.subjects.filter((s) => s.group === "H").length).toBe(17);
  expect(PLAN.subjects.filter((s) => s.group === "A").length).toBe(7);
  for (const s of PLAN.subjects) { expect(s.count, s.en).toBeGreaterThanOrEqual(5); expect(s.count, s.en).toBeLessThanOrEqual(8); }
  const total = PLAN.subjects.reduce((n, s) => n + s.count, 0);
  expect(PLAN.total).toBe(total);
  expect(LESSONS.length).toBe(total);
  expect(READY.length).toBeGreaterThanOrEqual(1);
  const main = fs.readFileSync(path.join(ROOT, "assets/js/main.js"), "utf8");
  expect(main).toContain(`{ id: "math", name: "Math", title: "Математика", color: "#15803d", total: ${total}`);
  const counts = JSON.parse(main.match(/const MATH_COUNTS = (\[[\d,\s]*\]);/)[1]);
  expect(counts).toEqual(PLAN.subjects.map((s) => s.count));
  // пән атаулары ТЕК ағылшынша; алғышарттар жоспарда емес, сабақ деңгейінде (tools/math_prereq.py)
  const EN = ["Precalculus", "Linear Algebra", "Analytic Geometry", "Differential Calculus", "Integral Calculus", "Multivariable Calculus", "Vector Calculus", "Sequences and Series", "Ordinary Differential Equations", "Partial Differential Equations", "Complex Analysis", "Fourier & Laplace Transforms", "Probability Theory", "Mathematical Statistics", "Discrete Mathematics", "Numerical Analysis", "Mathematical Optimization", "Real Analysis", "Abstract Algebra", "Number Theory", "Topology", "Differential Geometry", "Functional Analysis", "Stochastic Processes", "Arithmetic"];
  expect(PLAN.subjects.map((s) => s.en)).toEqual(EN);
  for (const s of PLAN.subjects) { expect(s.pre, s.en).toBeUndefined(); expect(s.kz, s.en).toBe(s.en); }
  // сабақ беттерінің нөмірлері: пәндер ретімен
  let n = 0;
  for (const s of PLAN.subjects) { expect(s.start).toBe(n); n += s.count; }
});

test("статистика: дайын/жоспар сабақтар build --stats-пен, жалпы лекция саны сәйкес", () => {
  expect(S.by_course.math.lect).toBe(READY.length);
  expect(S.by_course.math.plan).toBe(PLAN.total);
  expect(S.lect_own).toBe(S.by_course.cpp.lect + S.by_course.java.lect + S.by_course.en.lect + S.by_course.math.lect);
  expect(S.lect_harvard).toBe(45);
  expect(S.by_course.math.tasks).toBeGreaterThanOrEqual(18);
});

test("тұғырлар: <!-- soon -->, noindex, sitemap-қа кірмейді; дайындар кіреді", () => {
  const sm = fs.readFileSync(path.join(ROOT, "sitemap.xml"), "utf8");
  let soon = 0;
  for (const f of LESSONS) {
    const s = fs.readFileSync(path.join(MATH, "lectures", f), "utf8");
    expect(s, f).toContain('data-license="B"');
    expect(s, f).toContain('data-course="math"');
    expect(sm.includes(`math/lectures/${f}`), f).toBe(!s.includes("<!-- soon -->"));
    if (s.includes("<!-- soon -->")) { soon++; expect(s, f).toContain('name="robots" content="noindex"'); }
    else expect(s, f).not.toContain("noindex");
  }
  expect(soon).toBe(LESSONS.length - READY.length);
  expect(sm).toContain("math/</loc>");
  for (const t of [...TOOLS, ...PED]) expect(sm).toContain(`math/${t}.html`);
});

test("тұғыр беті: қатесіз ашылады, тақырып «Пән · k-сабақ» (пән ағылшынша), алдыңғы/келесі сілтемелер дұрыс", async ({ page }) => {
  const errs = collectErrors(page);
  await blockFonts(page.context());
  // тұғыр (soon) бетін динамикалық таңдаймыз: басқа сабақтар жазылып жатыр, бірақ ортаңғы тұғыр болмаса өткізіп жібереміз
  const soon = LESSONS.filter(isSoon).filter((f) => { const k = parseInt(f.slice(5)); return k > 0 && k < PLAN.total - 1; })[0];
  test.skip(!soon, "тұғыр қалмады");
  const n = parseInt(soon.slice(5));
  const subj = PLAN.subjects.find((x) => n >= x.start && n < x.start + x.count);
  await page.goto(`math/lectures/${soon}`);
  await expect(page.locator(".lecture-head .num")).toHaveText(`${subj.en} · ${n - subj.start + 1}-сабақ`);
  await expect(page.locator("#soon")).toBeVisible();
  await expect(page.locator(".pager a")).toHaveCount(2);
  await expect(page.locator(".pager a").first()).toHaveAttribute("href", `week-${n - 1}.html`);
  await expect(page.locator(".pager a.next")).toHaveAttribute("href", `week-${n + 1}.html`);
  expect(errs).toEqual([]);
});

// ------------------------------------------------------------------ курс беті
test("курс беті: 25 пән 3 топта, ескерту, дайын/жоспар санағы, сертификатсыз, B лицензиясы", async ({ page }) => {
  const errs = collectErrors(page);
  await open(page, "math/index.html");
  await expect(page.locator("body")).toHaveAttribute("data-license", "B");
  await expect(page.locator(".course-pill .cp-label")).toHaveText("Математика");
  await expect(page.locator("#ai-note")).toContainText("жауапкершілікті автор");
  await expect(page.locator("#ai-note")).toContainText("Sagid Mustafa");
  await expect(page.locator("#ai-note")).toContainText("сертификат берілмейді");
  await expect(page.locator(".mx-group-h")).toHaveText(["Foundations", "Higher Mathematics", "Advanced Mathematics"]);
  await expect(page.locator(".mx-subj")).toHaveCount(25);
  await expect(page.locator("#group-h ~ .mx-subj").first()).toBeVisible();
  await expect(page.locator(".week-card")).toHaveCount(PLAN.total);
  await expect(page.locator(".week-card:not(.soon)")).toHaveCount(READY.length);
  await expect(page.locator(".translator-note")).toContainText("Harvard CS50 курсының аудармасы емес");
  await expect(page.locator('.content a[href*="certificate"]')).toHaveCount(0);
  // әр пәннің санағы карточкалармен сәйкес
  for (const s of PLAN.subjects) {
    const sec = page.locator(`#subj-${s.no}`);
    await expect(sec.locator(".mx-splan")).toHaveText(String(s.count));
    const ready = READY.filter((f) => { const k = parseInt(f.slice(5)); return k >= s.start && k < s.start + s.count; }).length;
    await expect(sec.locator(".mx-sready")).toHaveText(String(ready));
    await expect(sec.locator(".week-card")).toHaveCount(s.count);
    await expect(sec.locator(".mx-sdesc")).not.toBeEmpty();
  }
  await expect(page.locator("#subj-1 .week-card:not(.soon)")).toHaveCount(READY.filter((f) => parseInt(f.slice(5)) < 7).length);
  // статистика бастапқы блогында
  await expect(page.locator(".cx-stats")).toContainText(String(S.by_course.math.lect));
  await expect(page.locator(".cx-stats")).toContainText(String(PLAN.total));
  expect(errs).toEqual([]);
});

test("курс беті: пән атаулары ағылшынша, мазмұны бет ретімен (Arithmetic бірінші), граф жоқ; оқу жолы блогы және әр пәннің алғышарты мен ұзақтығы", async ({ page }) => {
  await open(page, "math/index.html");
  // бетте көрінетін рет: Foundations (25-пән), сосын 1-24
  const SHOWN = [PLAN.subjects[24], ...PLAN.subjects.slice(0, 24)];
  const EN = SHOWN.map((s) => s.en);
  // жоғарғы мазмұн: 25 якорь сілтеме, бет реті бойынша
  const jump = page.locator("ol.mx-jump li a");
  await expect(jump).toHaveCount(25);
  expect(await jump.allInnerTexts()).toEqual(EN);
  for (let i = 0; i < 25; i++) await expect(jump.nth(i)).toHaveAttribute("href", `#subj-${SHOWN[i].no}`);
  // пән тақырыптары ағылшынша, топтар реті 25 / 1-17 / 18-24
  expect(await page.locator(".mx-shead h3").evaluateAll((els) => els.map((e) => e.textContent.trim()))).toEqual(SHOWN.map((s) => `${s.no}${s.en}`));
  expect(await page.locator(".mx-subj").evaluateAll((els) => els.map((e) => +e.dataset.subj))).toEqual(SHOWN.map((s) => s.no));
  await expect(page.locator("#group-f ~ .mx-subj").first()).toHaveAttribute("data-subj", "25");
  await expect(page.locator("#group-h ~ .mx-subj").first()).toHaveAttribute("data-subj", "1");
  // карточкалардағы сабақ реті 1,2,3...
  for (const s of PLAN.subjects) expect(await page.locator(`#subj-${s.no} .week-card .num`).allInnerTexts()).toEqual(Array.from({ length: s.count }, (_, k) => `${k + 1}-сабақ`));
  // граф жоқ; оқу жолы бір блок, сызықтық тізім (6 кезең)
  for (const sel of [".mx-graph", ".mx-edge", ".mx-node", "svg.mx-graph"]) await expect(page.locator(sel), sel).toHaveCount(0);
  await expect(page.locator(".mx-routebox a[href='route.html']")).toHaveCount(1);
  await expect(page.locator(".mx-routebox .mx-stages li")).toHaveCount(6);
  // әр пәнде: алғышарт пәндері (ағылшынша атаумен) не «орта мектеп»; дайын пәнде ұзақтық пен емтихан сілтемесі
  await expect(page.locator(".mx-subj .mx-smeta")).toHaveCount(25);
  await expect(page.locator("#subj-25 .mx-smeta")).toContainText("мүлде нөлден");
  await expect(page.locator("#subj-1 .mx-smeta")).toContainText("Arithmetic");
  await expect(page.locator("#subj-14 .mx-smeta")).toContainText("Probability Theory");
  await expect(page.locator("#subj-13 .mx-smeta")).toContainText(/≈ \d+ сағ/);
  await expect(page.locator('#subj-13 .mx-smeta a[href="exam.html?s=prob"]')).toHaveCount(1);
  const heads = (await page.locator(".mx-shead h3, ol.mx-jump, .mx-group-h, .nav, .course-pill, .mx-smeta").allInnerTexts()).join(" ");
  // қазақша пән атаулары көрінбейді
  for (const kz of ["Сызықтық алгебра", "Дифференциалдық есептеу", "Ықтималдық теориясы", "Топология", "Жоғары математика", "Жетілдірілген", "Тізбектер және қатарлар"]) expect(heads, kz).not.toContain(kz);
});

test("курс беті, 390px: көлденең айналусыз; пән модульдері сыяды", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await open(page, "math/index.html");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await ctx.close();
});

test("ауыстырғыш пен іздеу: Математика нав-менюде (9 курс), іздеу чипінде; certificate.html?course=math CS50x-ке оралады", async ({ page }) => {
  await open(page, "math/index.html");
  await page.click(".course-pill");
  await expect(page.locator(".course-menu .cm-row")).toHaveCount(9);
  await expect(page.locator(".course-menu .cm-row.on")).toContainText("Math");
  await page.keyboard.press("Escape");
  await page.keyboard.press("Control+k");
  await expect(page.locator('.search-scope button[data-s="math"]')).toHaveText("Math");
  await page.goto("certificate.html?course=math");
  await expect(page.locator(".certificate")).not.toContainText("Математика");
  await expect(page.locator(".cert-switch a.on, .cert-switch a[aria-current]").first()).toContainText("CS50x");
  await page.goto("courses.html");
  await expect(page.locator('.cx-card[data-course="math"]')).toHaveAttribute("href", "math/");
  await expect(page.locator(".cx-card.own")).toHaveCount(4);
});

// ------------------------------------------------------------------ эталон сабақ: құрылым
test("эталон сабақ: бөлімдер, ≥3500 сөз, қорыту ≥3, мысал 4, ≥18 есеп (барлық түр), 8 сұрақ, тақырып белгісі, KaTeX қатесіз, консоль таза", async ({ page }) => {
  const errs = collectErrors(page);
  await open(page, LESSON0);
  await expect(page.locator(".lecture-head .num")).toHaveText("Precalculus · 1-сабақ");
  await expect(page.locator("body")).toHaveAttribute("data-license", "B");
  for (const id of ["goals", "prereq", "intuition", "theory", "derivations", "examples", "mistakes", "viz", "exercises", "project", "summary", "review", "quiz"]) await expect(page.locator(`h2#${id}`), id).toHaveCount(1);
  const words = await page.evaluate(() => document.querySelector("article").innerText.split(/\s+/).filter(Boolean).length);
  expect(words).toBeGreaterThanOrEqual(3500);
  expect(await page.locator("details.math-derive").count()).toBeGreaterThanOrEqual(3);
  expect(await page.locator("details.math-derive").count()).toBeLessThanOrEqual(5);
  await expect(page.locator(".math-example")).toHaveCount(4);
  expect(await page.locator(".math-def").count()).toBeGreaterThanOrEqual(4);
  expect(await page.locator(".math-thm").count()).toBeGreaterThanOrEqual(3);
  expect(await page.locator(".math-remember, .math-attention").count()).toBeGreaterThanOrEqual(2);
  expect(await page.locator(".math-mistakes li").count()).toBeGreaterThanOrEqual(5);
  await expect(page.locator(".question")).toHaveCount(8);
  await expect(page.locator(".mx-sum")).toContainText("/ 21");
  const types = await page.$$eval(".math-ex", (els) => [...new Set(els.map((e) => e.dataset.type))].sort());
  expect(types).toEqual(["choice", "expr", "interval", "match", "matrix", "num", "order", "param", "reveal", "tf"]);
  const items = await page.evaluate(() => Object.values(window.CS50KZ_MATH.blocks).reduce((n, b) => n + b.items.length, 0));
  expect(items).toBeGreaterThanOrEqual(18);
  for (const lvl of ["easy", "medium", "hard"]) expect(await page.locator(`.math-ex .badge.${lvl}`).count(), lvl).toBeGreaterThan(0);
  // KaTeX: формулалар көрсетілген, қате жоқ
  expect(await page.locator(".katex").count()).toBeGreaterThan(200);
  await expect(page.locator(".katex-error")).toHaveCount(0);
  await expect(page.locator(".mx-err")).toHaveCount(0);
  expect(await page.locator(".math-viz canvas").count()).toBeGreaterThanOrEqual(3);
  await expect(page.locator("pre[data-lang=python]")).toHaveCount(1);
  expect(errs).toEqual([]);
  // сілтемелер жоқ CDN: KaTeX тек жергілікті
  const html = fs.readFileSync(path.join(ROOT, LESSON0), "utf8");
  expect(html).toContain("assets/vendor/katex/katex.min.js");
  expect(html).not.toMatch(/(?:cdn|jsdelivr|unpkg|cdnjs)[^"']*katex/i);
});

test("эталон сабақ, 390px: көлденең айналусыз; display формула өз ішінде айналады", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await open(page, LESSON0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  const info = await page.evaluate(() => {
    const d = document.createElement("div");
    d.className = "math-fbody";
    d.innerHTML = "$$" + "a_1+a_2+a_3+a_4+a_5+a_6+a_7+a_8+a_9+a_{10}+a_{11}+a_{12}+a_{13}+a_{14}+a_{15}+a_{16}+a_{17}+a_{18}+a_{19}+a_{20}".repeat(1) + "$$";
    document.querySelector(".math-formula .math-fbody").after(d);
    window.CS50KZ_MATH.renderMath(d);
    const k = d.querySelector(".katex-display");
    return { sw: document.documentElement.scrollWidth, cw: innerWidth, overflowX: getComputedStyle(k).overflowX, inner: k.scrollWidth, outer: k.clientWidth };
  });
  expect(info.sw).toBeLessThanOrEqual(info.cw + 1);
  expect(info.overflowX).toBe("auto");
  expect(info.inner).toBeGreaterThan(info.outer); // формула кең: өзі айналады, бет емес
  // график мен есеп өрістері экранға сыяды
  const boxes = await page.$$eval(".math-viz canvas, .mx-input:not(.mx-cell), .mx-matrix, .mx-mbrk", (els) => els.map((e) => e.getBoundingClientRect().right));
  for (const r of boxes) expect(r).toBeLessThanOrEqual(391);
  await ctx.close();
});

// ------------------------------------------------------------------ KaTeX төзімділігі
test("KaTeX жүктелмесе де бет бұзылмайды (формулалар TeX мәтіні болып қалады), қате TeX консольді бұзбайды", async ({ page }) => {
  const errs = collectErrors(page);
  await blockFonts(page.context());
  await page.route(/assets\/vendor\/katex\/.*\.js$/, (r) => r.abort());
  await page.goto(LESSON0);
  await page.waitForFunction(() => window.CS50KZ_MATH && window.CS50KZ_MATH.ready);
  await expect(page.locator("h1")).toBeVisible();
  await expect(page.locator(".katex")).toHaveCount(0);
  await expect(page.locator(".math-ex").first().locator(".mx-input").first()).toBeVisible();
  await expect(page.locator("body.math-no-katex")).toHaveCount(1);
  expect(errs.filter((e) => !/katex/i.test(e))).toEqual([]);
});

test("қате TeX (жабылмаған жақша, белгісіз команда) беттің қалған бөлігін бұзбайды", async ({ page }) => {
  const errs = collectErrors(page);
  await open(page, LESSON0);
  const r = await page.evaluate(() => {
    const d = document.createElement("div");
    d.id = "badtex";
    d.innerHTML = "<p>A $\\frac{1}{$ B</p><p>C $\\undefinedcmd{x}$ D</p><p>E $$\\begin{matrix} a &$$ F</p><p id=ok>ОК $x^2$</p>";
    document.querySelector("#main").append(d);
    window.CS50KZ_MATH.renderMath(d);
    return { text: d.innerText, ok: !!d.querySelector("#ok .katex") };
  });
  expect(r.ok).toBe(true);
  expect(r.text).toContain("A");
  expect(errs).toEqual([]);
});

// ------------------------------------------------------------------ парсер
test("парсер: эквиваленттік (қарапайым және күрделі өрнектер)", async ({ page }) => {
  await open(page, LESSON0);
  const cases = [
    ["(x+1)^2", "x^2+2*x+1", true], ["2x", "2*x", true], ["x^2", "x^3", false], ["sin(x)^2+cos(x)^2", "1", true], ["sqrt(x^2)", "abs(x)", true],
    ["e^x", "exp(x)", true], ["ln(e^x)", "x", true], ["(x^2-1)/(x-1)", "x+1", true], ["x+1", "(x^2-1)/(x-1)", true], ["1/x", "x^(-1)", true],
    ["−x²", "-x^2", true], ["2sqrt(x)", "sqrt(4x)", true], ["tan(x)", "sin(x)/cos(x)", true], ["x^2+1", "x^2+2", false], ["pi*x", "3.14159*x", false],
    ["sin^2(x)", "sin(x)^2", true], ["|x|", "abs(x)", true], ["x(x+1)", "x^2+x", true], ["3/4x", "3/(4x)", false],
  ];
  for (const [u, ref, want] of cases) {
    const got = await page.evaluate(([a, b]) => { try { return window.CS50KZ_MATH.equivalent(a, b, { vars: ["x"], dom: [-4, 4] }); } catch (e) { return "ERR:" + e.message; } }, [u, ref]);
    expect(got, `${u} ~ ${ref}`).toBe(want);
  }
  expect(await API(page, "evalNumber", "2^10")).toBe(1024);
  expect(await API(page, "evalNumber", "3/4")).toBe(0.75);
  expect(await API(page, "evalNumber", "sqrt(2)^2")).toBeCloseTo(2, 9);
  expect(await API(page, "evalNumber", "5!")).toBe(120);
  expect(await API(page, "evalNumber", "-2^2")).toBe(-4);
  expect(await API(page, "evalNumber", "2^-1")).toBe(0.5);
});

test("парсер қауіпсіздігі: инъекция орындалмайды, eval/Function қолданылмайды", async ({ page }) => {
  const errs = collectErrors(page);
  await open(page, LESSON0);
  const attacks = [
    "alert(1)", "window.__pwn=1", "(window.__pwn=1)", "constructor.constructor('window.__pwn=1')()", "x;window.__pwn=1", "this", "globalThis", "__proto__",
    "x.constructor", "`${window.__pwn=1}`", "x**x**x**x**x**x**x**x**x**x", "(".repeat(500) + "x" + ")".repeat(500), "1+".repeat(3000) + "1", "x".repeat(5000),
    "eval('window.__pwn=1')", "Function('window.__pwn=1')()", "import('x')", "document.cookie", "x=1", "<img src=x onerror=window.__pwn=1>", "\u0000x", "0x10", "1e999999",
  ];
  const res = await page.evaluate((list) => {
    window.__pwn = 0;
    const out = [];
    for (const a of list) {
      const t0 = performance.now();
      let r;
      try { r = window.CS50KZ_MATH.checkExpr(a, { a: "x" }); } catch (e) { r = { thrown: e.message }; }
      let n;
      try { n = window.CS50KZ_MATH.checkNumeric(a, 1); } catch (e) { n = { thrown: e.message }; }
      out.push({ a: a.slice(0, 30), ok: r.ok, thrown: r.thrown || n.thrown, ms: performance.now() - t0 });
    }
    return { out, pwn: window.__pwn };
  }, attacks);
  expect(res.pwn).toBe(0);
  for (const o of res.out) {
    expect(o.thrown, o.a).toBeUndefined(); // қате ұсталады, бет құламайды
    expect(o.ok, o.a).not.toBe(true);
    expect(o.ms, o.a).toBeLessThan(2000);
  }
  // қозғалтқыш JS бастапқы кодында eval, Function, innerHTML-ке жауап енгізу жоқ
  const src = fs.readFileSync(path.join(ROOT, "assets/js/math-course.js"), "utf8");
  expect(src).not.toMatch(/\beval\s*\(/);
  expect(src).not.toMatch(/new\s+Function\s*\(|[^.\w]Function\s*\(/);
  expect(errs).toEqual([]);
});

test("есеп мәтіні HTML ретінде орындалмайды: <img onerror> және <script> экрандалады", async ({ page }) => {
  const errs = collectErrors(page);
  await blockFonts(page.context());
  const evil = JSON.stringify({ items: [{ q: "<img src=x onerror=window.__xss=1> <script>window.__xss=2</script> $x$", o: ["<img src=x onerror=window.__xss=3>", "b"], a: 1, e: "<img src=x onerror=window.__xss=4>", hint: "<img src=x onerror=window.__xss=5>", sol: { steps: ["<img src=x onerror=window.__xss=6>"], ans: "<svg onload=window.__xss=7>" } }] });
  await page.route("**/" + LESSON0, async (route) => {
    const r = await route.fetch();
    let body = await r.text();
    body = body.replace("</article>", `<div class="math-ex task" data-type="choice" data-id="evil"><div class="task-head"><h3 id="evil-h">Ж</h3></div><script type="application/json" class="math-ex-data">${evil.replace(/<\//g, "<\\/")}</script></div></article>`);
    await route.fulfill({ response: r, body });
  });
  await page.goto(LESSON0);
  await page.waitForFunction(() => window.CS50KZ_MATH && window.CS50KZ_MATH.ready);
  const ex = page.locator('.math-ex[data-id="evil"]');
  await ex.locator(".mx-solbtn").click(); // кеңес
  await ex.locator(".mx-solbtn").click(); // 1-қадам
  await ex.locator(".mx-solbtn").click(); // жауап
  await ex.locator(".mx-check").click();
  await ex.locator(".mx-show").click();
  expect(await page.evaluate(() => window.__xss)).toBeUndefined();
  expect(await ex.locator("img, script:not(.math-ex-data), svg").count()).toBe(0);
  expect(errs).toEqual([]);
});

// ------------------------------------------------------------------ есептер: түрлері
async function block(page, slug) { return page.locator(`.math-ex[data-id="m1-1-${slug}"]`); }
async function checkBlock(page, slug) { const b = await block(page, slug); await b.locator(".mx-check").click(); return b; }

test("есеп түрлері: дұрыс жауап «Орындалды» береді, қате жауап бермейді (num, expr, eq, interval, matrix, choice, tf, match, order)", async ({ page }) => {
  const errs = collectErrors(page);
  await open(page, LESSON0);
  // num: қате, сосын дұрыс (санмен, бөлшекпен)
  let b = await block(page, "val");
  const inputs = b.locator(".mx-input");
  await inputs.nth(0).fill("10"); await inputs.nth(1).fill("17"); await inputs.nth(2).fill("0.75");
  await b.locator(".mx-check").click();
  await expect(b.locator(".mx-result")).toContainText("2 / 3");
  await expect(b).not.toHaveClass(/is-done/);
  await expect(inputs.nth(0)).toHaveClass(/bad/);
  await expect(inputs.nth(2)).toHaveClass(/ok/);
  await inputs.nth(0).fill("9"); await inputs.nth(2).fill("3/4");
  await b.locator(".mx-check").click();
  await expect(b).toHaveClass(/is-done/);
  await expect(b.locator(".mx-badge")).toBeVisible();
  // expr: эквивалентті жазулар; алдын ала көру; қате синтаксис түсінікті хабар береді
  b = await block(page, "comp");
  const e = b.locator(".mx-input");
  await e.nth(0).fill("2x^2-5");
  await expect(b.locator(".mx-preview").first()).toContainText("Сіз жаздыңыз");
  await expect(b.locator(".mx-preview .katex").first()).toBeVisible();
  await e.nth(1).fill("(2x+1)^2-3"); await e.nth(2).fill("(x+6)/3");
  await b.locator(".mx-check").click();
  await expect(b).toHaveClass(/is-done/);
  await e.nth(2).fill("(x+6)/");
  await b.locator(".mx-check").click();
  await expect(b.locator(".mx-fb").nth(2)).toContainText("✗");
  await expect(b).toHaveClass(/is-done/); // бұрын орындалған есептің белгісі қате әрекеттен кейін де сақталады (best прогресс)
  // интервал
  b = await block(page, "dom");
  const iv = b.locator(".mx-input");
  await iv.nth(0).fill("[1; 3) U (3; oo)"); await iv.nth(1).fill("[-2;2]"); await iv.nth(2).fill("(-oo,-2)∪(-2,3)∪(3,∞)");
  await b.locator(".mx-check").click();
  await expect(b).toHaveClass(/is-done/);
  await iv.nth(0).fill("(1; 3) U (3; oo)");
  await b.locator(".mx-check").click();
  await expect(iv.nth(0)).toHaveClass(/bad/);
  // eq (түзу теңдеуі): эквивалентті теңдеу
  b = await block(page, "line");
  await b.locator(".mx-input").nth(0).fill("3x - y - 1 = 0"); await b.locator(".mx-input").nth(1).fill("y=-2x+2");
  await b.locator(".mx-check").click();
  await expect(b).toHaveClass(/is-done/);
  await b.locator(".mx-input").nth(1).fill("y=-2x+3");
  await b.locator(".mx-check").click();
  await expect(b.locator(".mx-input").nth(1)).toHaveClass(/bad/);
  // matrix (жол және 2x2)
  b = await block(page, "table");
  const cells = b.locator(".mx-cell");
  expect(await cells.count()).toBe(9);
  const vals = ["3", "0", "-1", "0", "3", "0", "-1", "0", "3"];
  for (let i = 0; i < 9; i++) await cells.nth(i).fill(vals[i]);
  await b.locator(".mx-check").click();
  await expect(b).toHaveClass(/is-done/);
  await cells.nth(8).fill("2");
  await b.locator(".mx-check").click();
  await expect(cells.nth(8)).toHaveClass(/bad/);
  // choice: бірнеше жауап (қате, сосын дұрыс) және бір жауап
  b = await block(page, "pick");
  await b.locator(".mx-opts").first().locator("label").nth(0).click();
  await b.locator(".mx-check").click();
  await expect(b).not.toHaveClass(/is-done/);
  await b.locator(".mx-opts").first().locator("label").nth(2).click();
  await b.locator(".mx-opts").nth(1).locator("label").nth(1).click();
  await b.locator(".mx-check").click();
  await expect(b).toHaveClass(/is-done/);
  // tf: барлық жауап
  b = await block(page, "tf");
  const tf = [false, true, true, true, false];
  for (let i = 0; i < tf.length; i++) await b.locator(".mx-item").nth(i).locator(`input[value="${tf[i] ? 1 : 0}"]`).check();
  await b.locator(".mx-check").click();
  await expect(b).toHaveClass(/is-done/);
  await b.locator(".mx-item").nth(0).locator('input[value="1"]').check();
  await b.locator(".mx-check").click();
  await expect(b.locator(".mx-item").nth(0)).toHaveClass(/bad/);
  // match
  b = await block(page, "match");
  const pairs = ["жұп", "тақ", "жұп та, тақ та емес", "жұп әрі тақ"];
  for (let i = 0; i < 4; i++) await b.locator("select.mx-sel").nth(i).selectOption(pairs[i]);
  await b.locator(".mx-check").click();
  await expect(b).toHaveClass(/is-done/);
  await b.locator("select.mx-sel").nth(0).selectOption("тақ");
  await b.locator(".mx-check").click();
  await expect(b.locator("select.mx-sel").nth(0)).toHaveClass(/bad/);
  // order: бастапқы ретсіз (қате), ↑↓ батырмаларымен дұрыс ретке келтіру
  b = await block(page, "order1");
  await b.locator(".mx-check").click();
  await expect(b).not.toHaveClass(/is-done/);
  for (let guard = 0; guard < 40; guard++) {
    const order = await b.locator(".mx-ostep").evaluateAll((els) => els.map((e) => +e.dataset.k));
    const bad = order.findIndex((v, i) => v !== i);
    if (bad < 0) break;
    const from = order.indexOf(bad);
    await b.locator(".mx-ostep").nth(from).locator('button[aria-label="Жоғары жылжыту"]').click();
  }
  await b.locator(".mx-check").click();
  await expect(b).toHaveClass(/is-done/);
  expect(errs).toEqual([]);
});

test("шешім қадамдары: кеңес -> 1-қадам -> 2-қадам -> жауап ретімен ашылады; «қадамдық шешім» (reveal) толық қаралғанда орындалады", async ({ page }) => {
  await open(page, LESSON0);
  let b = await block(page, "vertex");
  const it = b.locator(".mx-item").first();
  const btn = it.locator(".mx-solbtn");
  await expect(btn).toHaveText("Кеңес");
  await btn.click();
  await expect(it.locator(".mx-solstep.hint")).toBeVisible();
  await expect(btn).toContainText("Келесі қадам (1/2)");
  await btn.click();
  await expect(it.locator(".mx-solstep.step")).toHaveCount(1);
  await btn.click();
  await expect(it.locator(".mx-solstep.step")).toHaveCount(2);
  await expect(btn).toHaveText("Жауабын көрсету");
  await btn.click();
  await expect(it.locator(".mx-solstep.ans")).toBeVisible();
  await expect(btn).toBeDisabled();
  const order = await it.locator(".mx-solstep").evaluateAll((els) => els.map((e) => e.className.replace("mx-solstep ", "")));
  expect(order).toEqual(["hint", "step", "step", "ans"]);
  await expect(it.locator(".mx-solstep .katex").first()).toBeVisible();
  // reveal
  b = await block(page, "reveal");
  const rb = b.locator(".mx-solbtn");
  await expect(b).not.toHaveClass(/is-done/);
  const total = 1 + 4 + 1; // кеңес + 4 қадам + жауап
  for (let i = 0; i < total; i++) await rb.click();
  await expect(b.locator(".mx-solstep")).toHaveCount(total);
  await expect(b).toHaveClass(/is-done/);
  await expect(b.locator(".mx-result")).toContainText("толық қаралды");
});

test("параметрлік есеп: «Жаңа нұсқа» сандарды өзгертеді, кілт параметрлерге сәйкес, қате жауап қабылданбайды, seed сақталады", async ({ page }) => {
  const errs = collectErrors(page);
  await open(page, LESSON0);
  const b = await block(page, "p-vertex");
  const get = () => page.evaluate(() => ({ p: window.CS50KZ_MATH.blocks["m1-1-p-vertex"].params, seed: window.CS50KZ_MATH.blocks["m1-1-p-vertex"].seed, ans: window.CS50KZ_MATH.blocks["m1-1-p-vertex"].getAnswerText(), q: document.querySelector('.math-ex[data-id="m1-1-p-vertex"] .mx-q').innerText }));
  const first = await get();
  expect(first.p.b).toBe(-2 * first.p.a * first.p.m);
  expect(first.p.c).toBe(first.p.a * first.p.m ** 2 + first.p.n);
  expect(String(first.ans)).toBe(String(first.p.n));
  // дұрыс жауап
  await b.locator(".mx-input").fill(String(first.p.n));
  await b.locator(".mx-check").click();
  await expect(b).toHaveClass(/is-done/);
  // жаңа нұсқа: кемінде бір рет сандар өзгереді; күй тазаланады
  const seen = new Set([first.q]);
  for (let i = 0; i < 12; i++) { await b.locator(".mx-new").click(); seen.add((await get()).q); }
  expect(seen.size).toBeGreaterThan(3);
  await expect(b).not.toHaveClass(/is-done/);
  const cur = await get();
  expect(cur.p.b).toBe(-2 * cur.p.a * cur.p.m);
  await b.locator(".mx-input").fill(String(cur.p.n + 1));
  await b.locator(".mx-check").click();
  await expect(b.locator(".mx-input")).toHaveClass(/bad/);
  await expect(b).not.toHaveClass(/is-done/);
  // «Жауабын көрсету»
  await b.locator(".mx-show").click();
  await expect(b.locator(".mx-fb.info")).toContainText(String(cur.p.n));
  // шешім қадамдарында сандар қойылған (#{...} қалмаған)
  await b.locator(".mx-solbtn").click(); await b.locator(".mx-solbtn").click();
  await expect(b.locator(".mx-sol")).not.toContainText("#{");
  // seed беттен кейін сақталады: сол сандар қайта шығады
  await page.reload();
  await page.waitForFunction(() => window.CS50KZ_MATH && window.CS50KZ_MATH.ready);
  expect((await get()).seed).toBe(cur.seed);
  // кері функция (expr) параметрлік
  const inv = await block(page, "p-inv");
  const pp = await page.evaluate(() => window.CS50KZ_MATH.blocks["m1-1-p-inv"].params);
  await inv.locator(".mx-input").fill(`(x-(${pp.b}))/${pp.a}`);
  await inv.locator(".mx-check").click();
  await expect(inv).toHaveClass(/is-done/);
  expect(errs).toEqual([]);
});

test("прогресс: орындалған есеп check:<бет>:<id> және cs50kz:math:ex-те сақталады, қайта ашқанда сақталады, санауыш жаңарады", async ({ page }) => {
  await open(page, LESSON0);
  const b = await block(page, "slope");
  await b.locator(".mx-input").nth(0).fill("-2"); await b.locator(".mx-input").nth(1).fill("-19");
  await b.locator(".mx-check").click();
  await expect(b).toHaveClass(/is-done/);
  const st = await page.evaluate(() => ({ chk: localStorage.getItem("check:/math/lectures/week-0.html:m1-1-slope"), ex: JSON.parse(localStorage.getItem("cs50kz:math:ex")) }));
  expect(st.chk).toBe("[true]");
  const rec = st.ex["week-0:m1-1-slope"];
  expect(rec.ok).toBe(true);
  expect(rec.best).toBe(2);
  await expect(page.locator(".mx-sum")).toContainText("1 / 21");
  await page.reload();
  await page.waitForFunction(() => window.CS50KZ_MATH && window.CS50KZ_MATH.ready);
  await expect((await block(page, "slope"))).toHaveClass(/is-done/);
  await expect(page.locator(".mx-sum")).toContainText("1 / 21");
  // «Оқыдым» мен тапсырма есептегіші: тапсырма картасы math-ex-ті санайды
  const tm = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith("check:")));
  expect(tm.some((k) => /\/math\/lectures\/week-0\.html:m1-1-slope$/.test(k))).toBe(true);
});

test("«Жауаптарды көрсету» және «Қайта бастау»", async ({ page }) => {
  await open(page, LESSON0);
  const b = await block(page, "vertex");
  await b.locator(".mx-show").click();
  await expect(b.locator(".mx-fb.info").first()).toContainText("3");
  await b.locator(".mx-input").first().fill("7");
  await b.locator(".mx-reset").click();
  await expect(b.locator(".mx-input").first()).toHaveValue("");
});

test("барлық есеп блогы: дұрыс жауапты автотолтырып тексергенде «Орындалды» (эталон сабақ толық жұмыс істейді)", async ({ page }) => {
  await open(page, LESSON0);
  const ids = await page.$$eval(".math-ex", (els) => els.map((e) => [e.dataset.id, e.dataset.type]));
  expect(ids.length).toBe(21);
  for (const [id, type] of ids) {
    const b = page.locator(`.math-ex[data-id="${id}"]`);
    if (type === "reveal") { while (await b.locator(".mx-solbtn:not([disabled])").count()) await b.locator(".mx-solbtn").click(); }
    else {
      await page.evaluate((i) => window.CS50KZ_MATH.blocks[i].fillCorrect(), id);
      await b.locator(".mx-check").click();
    }
    await expect(b, id).toHaveClass(/is-done/);
  }
  await expect(page.locator(".mx-sum")).toContainText("21 / 21");
});

// ------------------------------------------------------------------ визуализация
test("визуализация: canvas бос емес, слайдер сызбаны өзгертеді, батырмалар (масштаб) жұмыс істейді, 390px-ке сыяды", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const page = await ctx.newPage();
  const errs = collectErrors(page);
  await open(page, LESSON0);
  const cv = page.locator(".math-viz").first().locator("canvas");
  await cv.scrollIntoViewIfNeeded();
  const sig = () => page.evaluate(() => { const c = document.querySelector(".math-viz canvas"), d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data; let h = 0, nonBg = 0; for (let i = 0; i < d.length; i += 16) { h = (h * 31 + d[i] + d[i + 1] * 3 + d[i + 2] * 7) | 0; if (d[i] < 200 || d[i + 1] < 200) nonBg++; } return { h, nonBg, w: c.getBoundingClientRect().width }; });
  const s0 = await sig();
  expect(s0.nonBg).toBeGreaterThan(50);
  expect(s0.w).toBeLessThanOrEqual(390);
  // слайдер: a мәнін өзгерту
  const sl = page.locator(".math-viz").first().locator('input[type="range"]').first();
  await sl.evaluate((el) => { el.value = "-2.5"; el.dispatchEvent(new Event("input", { bubbles: true })); });
  const s1 = await sig();
  expect(s1.h).not.toBe(s0.h);
  // масштаб батырмасы
  await page.locator(".math-viz").first().locator('button[aria-label="Үлкейту"]').click();
  const s2 = await sig();
  expect(s2.h).not.toBe(s1.h);
  await page.locator(".math-viz").first().locator('button[aria-label="Бастапқы көрініс"]').click();
  // жылжыту (pointer): көлденең сүйреу
  const box = await cv.boundingBox();
  await page.mouse.move(box.x + 100, box.y + 100); await page.mouse.down(); await page.mouse.move(box.x + 160, box.y + 100, { steps: 4 }); await page.mouse.up();
  const s3 = await sig();
  expect(s3.h).not.toBe(s0.h);
  // 3 график, жұп/тақ графигінің легенда чекбоксы функцияны өшіреді
  const viz2 = page.locator(".math-viz").nth(1);
  await expect(viz2.locator(".mv-legend li")).toHaveCount(3);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  expect(errs).toEqual([]);
  await ctx.close();
});

test("визуализация: барлық 8 түр (graph, tangent, riemann, vectors, lintrans, series, taylor, dist) қатесіз сызылады", async ({ page }) => {
  const errs = collectErrors(page);
  await blockFonts(page.context());
  const cfgs = [
    ["graph", { fns: ["sin(x)", "x^2/4"], view: [-6, 6, -3, 5] }], ["tangent", { f: "x^2/4", x0: 1 }], ["riemann", { f: "x^2", a: 0, b: 2, n: 8 }],
    ["vectors", { u: [3, 1], v: [1, 2] }], ["lintrans", { m: [[1, 1], [0, 1]] }], ["series", { term: "1/n^2", start: 1, N: 30, limit: "pi^2/6" }],
    ["taylor", { kind: "sin" }], ["dist", { dist: "normal" }],
  ];
  await page.route("**/" + LESSON0, async (route) => {
    const r = await route.fetch();
    let body = await r.text();
    const divs = cfgs.map(([t, c]) => `<div class="math-viz" data-viz="${t}" data-title="${t}" data-config='${JSON.stringify(c)}'></div>`).join("");
    body = body.replace(/<article[\s\S]*<\/article>/, `<article class="content math-lesson" id="main"><div class="lecture-head"><div class="num">T</div><h1>T</h1></div>${divs}</article>`);
    await route.fulfill({ response: r, body });
  });
  await page.goto(LESSON0);
  await page.waitForFunction(() => window.CS50KZ_MATHVIZ);
  await page.waitForTimeout(400);
  await expect(page.locator(".math-viz canvas")).toHaveCount(8);
  await expect(page.locator(".mv-err")).toHaveCount(0);
  const painted = await page.$$eval(".math-viz canvas", (cs) => cs.map((c) => { const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 0; i < d.length; i += 16) if (d[i] < 200 || d[i + 1] < 200) n++; return n; }));
  for (const n of painted) expect(n).toBeGreaterThan(30);
  expect(await page.evaluate(() => window.CS50KZ_MATHVIZ.types.sort())).toEqual(["dist", "graph", "lintrans", "riemann", "series", "taylor", "tangent", "vectors"].sort());
  expect(errs).toEqual([]);
});

test("визуализация: қате баптау (JSON, белгісіз түр, қате өрнек) бетті бұзбайды", async ({ page }) => {
  const errs = collectErrors(page);
  await blockFonts(page.context());
  await page.route("**/" + LESSON0, async (route) => {
    const r = await route.fetch();
    let body = await r.text();
    body = body.replace(/<article[\s\S]*<\/article>/, `<article class="content math-lesson" id="main"><div class="lecture-head"><div class="num">T</div><h1>T</h1></div>
      <div class="math-viz" data-viz="graph" data-config='{bad json'></div><div class="math-viz" data-viz="nope"></div><div class="math-viz" data-viz="graph" data-config='{"fns":["alert(1)"]}'></div>
      <p id="after">дейін</p></article>`);
    await route.fulfill({ response: r, body });
  });
  await page.goto(LESSON0);
  await page.waitForFunction(() => window.CS50KZ_MATHVIZ);
  await expect(page.locator(".mv-err")).toHaveCount(3);
  await expect(page.locator("#after")).toBeVisible();
  expect(errs).toEqual([]);
});

// ------------------------------------------------------------------ ортақ беттер
for (const t of TOOLS) {
  test(`ортақ бет ${t}: қатесіз ашылады, 390px-те айналусыз; дерек бос болса EmptyState`, async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    const errs = collectErrors(page);
    await blockFonts(ctx);
    await page.route(/assets\/data\/math-(formulas|terms|problems)-/, (r) => r.fulfill({ status: 200, body: "", headers: { "content-type": "application/javascript" } }));
    await page.goto(`math/${t}.html`);
    await expect(page.locator("#mx-app")).not.toContainText("Жүктелуде");
    await expect(page.locator("#mx-app .mx-sel").first()).toBeVisible();
    if (t !== "practice") await expect(page.locator("#mx-app .mx-empty")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    expect(errs).toEqual([]);
    await ctx.close();
  });
}

test("формулалар: пән бойынша сүзу, іздеу, KaTeX, сабаққа сілтеме", async ({ page }) => {
  const errs = collectErrors(page);
  await blockFonts(page.context());
  await page.route(/assets\/data\/math-formulas-precalc\.js/, (r) => r.fulfill({ status: 200, contentType: "application/javascript", body: `window.CS50KZ_MATH_FORMULAS=window.CS50KZ_MATH_FORMULAS||{};window.CS50KZ_MATH_FORMULAS.precalc=[
      {"id":"pc-quad","name":"Квадрат теңдеудің түбірлері","tex":"x=\\\\frac{-b\\\\pm\\\\sqrt{b^2-4ac}}{2a}","cond":"a\\\\ne0","note":"Дискриминант D=b^2-4ac","tags":["квадрат","түбір"],"lesson":2,"anchor":"theory"},
      {"id":"pc-vertex","name":"Парабола төбесі","tex":"x_{\\\\text{в}}=-\\\\frac{b}{2a}","lesson":1,"anchor":"f-2"}];` }));
  await page.route(/assets\/data\/math-formulas-linalg\.js/, (r) => r.fulfill({ status: 200, contentType: "application/javascript", body: "window.CS50KZ_MATH_FORMULAS=window.CS50KZ_MATH_FORMULAS||{};window.CS50KZ_MATH_FORMULAS.linalg=[];" }));
  await page.goto("math/formulas.html#precalc");
  await expect(page.locator(".mx-fitem")).toHaveCount(2);
  await expect(page.locator("#mx-app .mx-sel").first()).toHaveValue("precalc");
  await expect(page.locator(".mx-fitem .katex").first()).toBeVisible();
  await expect(page.locator(".katex-error")).toHaveCount(0);
  await expect(page.locator(".mx-count")).toContainText("2");
  await page.fill(".mx-search", "төбесі");
  await expect(page.locator(".mx-fitem")).toHaveCount(1);
  await expect(page.locator(".mx-flink")).toHaveAttribute("href", /math\/lectures\/week-0\.html#f-2$/);
  await page.fill(".mx-search", "жоқтайсөз");
  await expect(page.locator(".mx-empty")).toBeVisible();
  await page.fill(".mx-search", "");
  await page.selectOption("#mx-app .mx-sel", "linalg");
  await expect(page.locator(".mx-empty")).toBeVisible();
  expect(errs).toEqual([]);
});

test("сөздік: іздеу, пән сүзгісі, сабаққа сілтеме", async ({ page }) => {
  const errs = collectErrors(page);
  await blockFonts(page.context());
  await page.route(/assets\/data\/math-terms-precalc\.js/, (r) => r.fulfill({ status: 200, contentType: "application/javascript", body: `window.CS50KZ_MATH_TERMS=window.CS50KZ_MATH_TERMS||{};window.CS50KZ_MATH_TERMS.precalc=[
      {"id":"t-function","kz":"функция","en":"function","def":"Әр аргументке бір ғана мән сәйкес қоятын ереже.","lesson":1},
      {"id":"t-domain","kz":"анықталу облысы","en":"domain","def":"Функция анықталған аргументтер жиыны.","lesson":1}];` }));
  await page.goto("math/glossary.html");
  await page.selectOption("#mx-app .mx-sel", "precalc");
  await expect(page.locator(".mx-term")).toHaveCount(2);
  await page.fill(".mx-search", "domain");
  await expect(page.locator(".mx-term")).toHaveCount(1);
  await expect(page.locator(".mx-term a")).toHaveAttribute("href", /week-0\.html$/);
  expect(errs).toEqual([]);
});

test("жаттықтырғыш: пән/қиындық сүзгісі, серия (параметрлік есептер), нәтиже, үздік нәтиже сақталады", async ({ page }) => {
  const errs = collectErrors(page);
  await blockFonts(page.context());
  await page.route(/assets\/data\/math-problems-precalc\.js/, (r) => r.fulfill({ status: 200, contentType: "application/javascript", body: `window.CS50KZ_MATH_PROBLEMS=window.CS50KZ_MATH_PROBLEMS||{};window.CS50KZ_MATH_PROBLEMS.precalc=[
      {"id":"pp1","lvl":"easy","type":"num","params":{"a":{"int":[2,9]},"b":{"int":[2,9]}},"q":"$#{a}\\\\cdot #{b}=?$","a":"a*b","v":"a*b"},
      {"id":"pp2","lvl":"hard","type":"num","params":{"a":{"int":[2,9]}},"q":"$#{a}^2=?$","a":"a^2","v":"a**2"}];` }));
  await page.goto("math/practice.html");
  await page.selectOption("#mx-app .mx-sel >> nth=0", "precalc");
  await page.selectOption('#mx-app .mx-sel[aria-label="Қиындық"]', "easy");
  await page.selectOption('#mx-app .mx-sel[aria-label="Сериядағы есеп саны"]', "5");
  await page.click("text=Серияны бастау");
  // пул 1 есеп -> серия ең көбі 3 есеп (pool*3)
  await expect(page.locator(".mx-phead b")).toHaveText("Есеп 1 / 3");
  await expect(page.locator(".mx-phead .lv-easy")).toBeVisible();
  for (let i = 0; i < 3; i++) {
    const q = await page.locator(".mx-q").innerText();
    const m = q.match(/(\d+)\s*[·⋅⋅\\cdot]*\s*(\d+)/);
    // q-ны есептеу үшін DOM-дағы annotation TeX-тен оқимыз
    const tex = await page.locator(".mx-q annotation").first().textContent();
    const nums = tex.match(/(\d+)\\cdot\s*(\d+)/);
    expect(nums, q + " | " + (m || "")).not.toBeNull();
    await page.fill(".mx-input", String(+nums[1] * +nums[2]));
    await page.click(".mx-pstage >> text=Тексеру");
    await expect(page.locator(".mx-pstage .mx-result.ok")).toBeVisible();
    await page.click(i < 2 ? "text=Келесі есеп" : "text=Нәтижені көру");
  }
  await expect(page.locator(".mx-pdone")).toContainText("3 / 3");
  await expect(page.locator(".mx-count")).toContainText("Үздік серия: 100%");
  const st = await page.evaluate(() => JSON.parse(localStorage.getItem("cs50kz:math:practice")));
  expect(st.best).toBe(100);
  // қате жауап дұрыс жауапты көрсетеді
  await page.click("text=Тағы бір серия");
  await page.fill(".mx-input", "99999");
  await page.click(".mx-pstage >> text=Тексеру");
  await expect(page.locator(".mx-pstage .mx-result.bad")).toBeVisible();
  await expect(page.locator(".mx-fb.info")).toContainText("Жауабы");
  expect(errs).toEqual([]);
});

// ------------------------------------------------------------------ лицензия, құжат, кэш, құралдар
test("лицензия: барлық math беттері B, All Rights Reserved, Harvard сілтемесіз; реестрде B-course-math және C-katex; сертификат жоқ", () => {
  const files = ["index.html", ...TOOLS.map((t) => t + ".html"), ...PED.map((t) => t + ".html"), ...LESSONS.map((f) => "lectures/" + f)];
  for (const f of files) {
    const s = fs.readFileSync(path.join(MATH, f), "utf8");
    expect(s, f).toContain('data-license="B"');
    expect(s, f).toMatch(/<meta name="copyright" content="[^"]*All Rights Reserved/);
    expect(s, f).not.toMatch(/<meta name="copyright" content="[^"]*(Harvard|CC BY-NC-SA)/);
    expect(s, f).not.toContain('"isBasedOn"');
    expect(s, f).toContain("© 2026 Sagid Mustafa.");
    expect(s, f).toContain("AO17 — Harvard University-ден тәуелсіз жоба.");
  }
  expect(fs.existsSync(path.join(MATH, "certificate.html"))).toBe(false);
  const reg = JSON.parse(fs.readFileSync(path.join(ROOT, "licensing/components.json"), "utf8")).components;
  const m = reg.find((x) => x.id === "B-course-math");
  expect(m.cat).toBe("B"); expect(m.paths).toEqual(["math/**"]); expect(m.license).toBe("ARR");
  expect(reg.find((x) => x.id === "B-course-math-engine").cat).toBe("B");
  const k = reg.find((x) => x.id === "C-katex");
  expect(k.cat).toBe("C"); expect(k.license).toBe("MIT");
  expect(fs.readFileSync(path.join(ROOT, "THIRD-PARTY-LICENSES.md"), "utf8")).toContain("KaTeX");
  expect(fs.readFileSync(path.join(ROOT, "COPYRIGHT.md"), "utf8")).toContain("B-course-math");
  expect(fs.existsSync(path.join(ROOT, "assets/vendor/katex/LICENSE"))).toBe(true);
  expect(fs.readFileSync(path.join(ROOT, "assets/vendor/katex/LICENSE"), "utf8")).toContain("MIT");
  // сайт footer мәтіні өзгермеген, математика курсына сертификат жоқ
  const idx = fs.readFileSync(path.join(MATH, "index.html"), "utf8");
  expect(idx).toContain("сертификат берілмейді");
  expect(idx.slice(idx.indexOf('<article'), idx.indexOf('</article>'))).not.toMatch(/certificate\.html/);
});

test("lisence_audit --check және math_verify.py: қатесіз", () => {
  execFileSync("python3", [path.join(ROOT, "tools/licence_audit.py"), "--check"], { encoding: "utf8" });
  const out = execFileSync("python3", [path.join(ROOT, "tools/math_verify.py"), "--lint"], { encoding: "utf8" });
  expect(out).toMatch(/қате: 0/);
});

test("math_verify.py бұзылған кілтті табады (файл:есеп id:қате)", () => {
  const tmp = path.join(ROOT, "test-results", "mv-bad.html");
  fs.mkdirSync(path.dirname(tmp), { recursive: true });
  let s = fs.readFileSync(path.join(ROOT, LESSON0), "utf8");
  s = s.replace('"a":"3/4"', '"a":"3/5"').replace('"a":"x^2","v"', '"a":"x^3","v"');
  fs.writeFileSync(tmp, s);
  let out = "";
  try { execFileSync("python3", [path.join(ROOT, "tools/math_verify.py"), tmp], { encoding: "utf8" }); } catch (e) { out = e.stdout; expect(e.status).toBe(1); }
  fs.unlinkSync(tmp);
  expect(out).toMatch(/m1-1-val#3: кілт '3\/5'/);
  expect(out).toMatch(/m1-1-parity#1: кілт 'x\^3'/);
});

test("құжат: docs/MATH-COURSE-GUIDE.md негізгі бөлімдерді қамтиды", () => {
  const g = fs.readFileSync(path.join(ROOT, "docs/MATH-COURSE-GUIDE.md"), "utf8");
  for (const k of ["math_plan.py", "week-N", "math-def", "math-thm", "math-remember", "math-attention", "math-derive", "data-type", "param", "\\\\frac", "math_verify.py", "KaTeX", "cs50kz:math:", "check:<бет", "math-formulas-", "math-terms-", "math-problems-", "All Rights Reserved", "сертификат", "Higher Mathematics", "Stochastic Processes"]) expect(g, k).toContain(k);
  for (const t of ["num", "expr", "interval", "choice", "tf", "matrix", "match", "order", "reveal", "param"]) expect(g, t).toContain("`" + t + "`");
});

test("офлайн (PWA): sw.js кэшіне KaTeX, қаріптер, қозғалтқыш, дайын сабақтар кіреді; тұғырлар кірмейді", () => {
  const sw = fs.readFileSync(path.join(ROOT, "sw.js"), "utf8");
  for (const f of ["assets/vendor/katex/katex.min.js", "assets/vendor/katex/auto-render.min.js", "assets/vendor/katex/katex.min.css", "assets/js/math-course.js", "assets/js/math-viz.js", "assets/css/math-course.css", "math/index.html", "math/formulas.html", "math/glossary.html", "math/practice.html", "math/data/plan.js"]) expect(sw, f).toContain(`"${f}"`);
  for (const f of fs.readdirSync(path.join(ROOT, "assets/vendor/katex/fonts"))) expect(sw, f).toContain(`"assets/vendor/katex/fonts/${f}"`);
  for (const f of LESSONS) expect(sw.includes(`"math/lectures/${f}"`), f).toBe(!isSoon(f));
  expect(fs.readdirSync(path.join(ROOT, "assets/vendor/katex/fonts")).length).toBeGreaterThanOrEqual(19);
});

test("офлайн (нағыз): service worker кэшінен сабақ, KaTeX, есептер және визуализация сервер тоқтағанда да жұмыс істейді", async ({ browser }) => {
  test.setTimeout(150_000);
  const port = 4800 + Math.floor(Math.random() * 400);
  const srv = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1", "--directory", ROOT], { stdio: "ignore" });
  try {
    const B = `http://127.0.0.1:${port}/`;
    for (let i = 0; i < 40; i++) { try { await fetch(B + "sw.js"); break; } catch (e) { await new Promise((r) => setTimeout(r, 150)); } }
    const c = await browser.newContext();
    await blockFonts(c);
    const p = await c.newPage();
    const errs = [];
    p.on("pageerror", (e) => errs.push(`${p.url()}: ${e.message}`));
    await p.goto(B + LESSON0);
    await p.evaluate(async () => { await navigator.serviceWorker.register("/sw.js"); await navigator.serviceWorker.ready; });
    await expect.poll(() => p.evaluate(async () => { const k = await caches.keys(); if (!k.length) return 0; const c = await caches.open(k[0]); return (await c.match("/math/lectures/week-0.html")) && (await c.match("/assets/vendor/katex/fonts/KaTeX_Main-Regular.woff2")) && (await c.match("/assets/vendor/katex/katex.min.js")) ? 1 : 0; }), { timeout: 60_000 }).toBe(1);
    srv.kill();
    await new Promise((r) => setTimeout(r, 600));
    await p.goto(B + LESSON0);
    await p.waitForFunction(() => window.CS50KZ_MATH && window.CS50KZ_MATH.ready);
    expect(await p.locator(".katex").count()).toBeGreaterThan(100);
    await expect(p.locator(".katex-error")).toHaveCount(0);
    await expect(p.locator("h1")).toContainText("Функция ұғымы");
    expect(await p.locator(".math-viz canvas").count()).toBeGreaterThanOrEqual(3);
    await p.locator('.math-ex[data-id="m1-1-val"] .mx-input').first().fill("9");
    await p.locator('.math-ex[data-id="m1-1-val"] .mx-check').click();
    await expect(p.locator('.math-ex[data-id="m1-1-val"] .mx-item').first()).toHaveClass(/ok/);
    await p.goto(B + "math/index.html");
    await expect(p.locator(".mx-subj")).toHaveCount(25);
    await p.goto(B + "math/formulas.html");
    await expect(p.locator("#mx-app .mx-sel").first()).toBeVisible();
    expect(errs).toEqual([]);
    await c.close();
  } finally { srv.kill(); }
});

test("тақырып ауысқанда (қараңғы режим) визуализация мен есептер оқылады", async ({ browser }) => {
  const ctx = await browser.newContext({ colorScheme: "dark", viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const errs = collectErrors(page);
  await open(page, LESSON0);
  const c = await page.evaluate(() => { const cs = getComputedStyle(document.querySelector(".math-def")); return [cs.backgroundColor, getComputedStyle(document.body).color]; });
  expect(c[0]).not.toBe(c[1]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  expect(errs).toEqual([]);
  await ctx.close();
});

// ------------------------------------------------------------------ жаңа ережелер: ағылшынша пән атаулары, тәуелсіз пәндер, «Көмекші» батырмасы
test("сүзгілер мен беттер: формулалар/сөздік/жаттықтырғыш сүзгілерінде пән атаулары ағылшынша", async ({ page }) => {
  for (const t of TOOLS) {
    await open(page, `math/${t}.html`);
    const opts = await page.locator("#mx-app .mx-sel").first().locator("option").allInnerTexts();
    const subjOpts = opts.filter((o) => /^\d+\. /.test(o));
    expect(subjOpts, t).toEqual(PLAN.subjects.map((s) => `${s.no}. ${s.en}`));
    expect(subjOpts.join(" "), t).not.toMatch(/алгебра|анализ|геометрия|теңдеу|теориясы|статистика|математика|Топология/);
  }
});

test("сабақ беті: «Қысқаша еске салу» бөлімінде «Алдымен оқыңыз» тізімі (math_prereq.py), сілтемелер дайын сабақтарға", async ({ page }) => {
  await open(page, LESSON0);
  await expect(page.locator("h2#prereq")).toHaveCount(1);
  await expect(page.locator(".math-prereq")).toHaveCount(1);
  // Precalculus-тың бірінші сабағы енді Arithmetic-тің соңғы сабағына сүйенеді
  await expect(page.locator(".mx-pre")).toContainText("Arithmetic · 8-сабақ");
  await expect(page.locator('.mx-pre li a[href$="week-161.html"]')).toHaveCount(1);
  await open(page, "math/lectures/week-154.html");
  await expect(page.locator(".mx-pre")).toContainText("бастапқы сабағы");
  await open(page, "math/lectures/week-110.html");
  const links = page.locator(".mx-pre li a");
  expect(await links.count()).toBeGreaterThanOrEqual(2);
  for (const h of await links.evaluateAll((els) => els.map((e) => e.getAttribute("href")))) expect(READY, h).toContain(h);
  await expect(page.locator(".mx-pre")).toContainText("Mathematical Statistics · 5-сабақ");
  await expect(page.locator('.mx-pre a[href="../route.html"]')).toHaveCount(1);
});

test("педагогика: әр дайын сабақта нақты ұзақтық, алғышарт блогы, емтихан сілтемесі; деңгейлер тек Жеңіл/Орташа/Күрделі; оқу жолы алғышарттарға сай", () => {
  expect(execFileSync("python3", [path.join(ROOT, "tools/math_pedagogy.py"), "--check"], { encoding: "utf8" })).toContain("үйлесімді");
  for (const f of READY) {
    const s = fs.readFileSync(path.join(MATH, "lectures", f), "utf8");
    expect(s, f).toMatch(/<p class="lecture-meta mx-meta"[^>]*><span>⏱ Оқу ≈ [^<]+<\/span><span>Есептер ≈ [^<]+<\/span><span>Тест ≈ \d+ мин<\/span><span><b>Барлығы ≈ [^<]+<\/b>/);
    expect(s, f).not.toContain("15-20 минут");
    expect(s, f).toContain('<div class="mx-pre">');
    expect(s, f).toMatch(/class="callout mx-examlink"[\s\S]*?href="\.\.\/exam\.html\?s=\w+"/);
    const badges = [...s.matchAll(/<span class="badge (easy|medium|hard)">([^<]*)<\/span>/g)].map((m) => m[1] + ":" + m[2]);
    for (const b of badges) expect(["easy:Жеңіл", "medium:Орташа", "hard:Күрделі"], f).toContain(b);
    expect(s, f).toMatch(/<a href="\.\.\/route\.html">Оқу жолы<\/a><a href="\.\.\/exam\.html\?s=\w+">Емтихан<\/a><\/nav>/);
  }
});

test("разметка: мәтіндегі (TeX ішіндегі) «<» әрдайым &lt; - браузер оны тег деп оқып, мәтінді жасырмауы керек", () => {
  const TAGS = new Set("a abbr article aside b blockquote body br button canvas caption code col details div dl dt dd em figcaption figure footer form h1 h2 h3 h4 h5 h6 head header hr html i img input kbd label li link main mark meta nav noscript ol option p path pre q s samp script section select small span strong style sub summary sup svg table tbody td textarea tfoot th thead time title tr u ul var circle line rect g polyline polygon text defs marker clippath".split(" "));
  const bad = [];
  for (const f of READY) {
    const s = fs.readFileSync(path.join(MATH, "lectures", f), "utf8").replace(/<script\b[\s\S]*?<\/script>|<pre\b[\s\S]*?<\/pre>|<code\b[\s\S]*?<\/code>|<!--[\s\S]*?-->|<style\b[\s\S]*?<\/style>/g, "");
    for (const m of s.matchAll(/<\/?([A-Za-z][^\s\/><]*)/g)) if (!TAGS.has(m[1].toLowerCase())) bad.push(`${f}: <${m[1].slice(0, 30)}`);
  }
  expect(bad).toEqual([]);
});

test("оқу жолы: 6 кезең, 25 пән бір рет, оқылған сабақ белгіленеді, келесі қадам - бірінші оқылмаған дайын сабақ; 390px", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const errs = collectErrors(page);
  await blockFonts(ctx);
  // Arithmetic (154-161) толық оқылған, Precalculus-тан week-0 оқылған: келесі қадам - week-1
  await page.addInitScript(() => { const read = { "math:week-0": 1 }; for (let k = 154; k <= 161; k++) read[`math:week-${k}`] = 1; localStorage.setItem("cs50kz:progress", JSON.stringify({ read })); });
  await page.goto("math/route.html");
  await page.waitForFunction(() => window.CS50KZ_MATH && window.CS50KZ_MATH.ready);
  await expect(page.locator(".mx-stage")).toHaveCount(6);
  const slugs = await page.locator(".mx-rsubj").evaluateAll((els) => els.map((e) => e.dataset.slug));
  expect(slugs.length).toBe(25);
  expect(new Set(slugs).size).toBe(25);
  expect(slugs[0]).toBe("arith");
  expect(slugs[1]).toBe("precalc");
  await expect(page.locator('li[data-id="week-0"].is-read')).toHaveCount(1);
  await expect(page.locator(".mx-rnow .btn")).toHaveAttribute("href", "lectures/week-1.html");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  expect(errs).toEqual([]);
  await ctx.close();
});

test("пән емтиханы: әр сабақтан 3 сұрақ, жауап тек «Тапсыру»-да тексеріледі, нәтиже сабақтар бойынша, сақталады", async ({ page }) => {
  const errs = collectErrors(page);
  await open(page, "math/exam.html?s=prob");
  await expect(page.locator("#mx-app .mx-sel")).toHaveValue("prob");
  const opts = await page.locator("#mx-app .mx-sel option").allInnerTexts();
  for (const o of opts) expect(PLAN.subjects.map((s) => `${s.no}. ${s.en}`)).toContain(o);
  await page.click("text=Емтиханды бастау");
  await expect(page.locator(".mx-eitem")).toHaveCount(21);
  await expect(page.locator(".mx-eitem .mx-fb:visible")).toHaveCount(0);
  await expect(page.locator(".mx-eitem .katex-error")).toHaveCount(0);
  await page.click("text=Тапсыру және тексеру");
  await expect(page.locator(".mx-eres")).toContainText("21 сұраққа жауап берілмеген");
  await expect(page.locator(".mx-eitem .mx-fb:visible")).toHaveCount(0);
  await page.click("text=Бәрібір тапсыру");
  await expect(page.locator(".mx-eres h3")).toHaveText("Нәтиже: 0 / 21 (0%)");
  await expect(page.locator(".mx-eres tbody tr")).toHaveCount(7);
  await expect(page.locator(".mx-eres tbody tr a").first()).toHaveAttribute("href", /week-79\.html$/);
  await expect(page.locator(".mx-eitem.bad")).toHaveCount(21);
  const st = await page.evaluate(() => JSON.parse(localStorage.getItem("cs50kz:math:exam")));
  expect(st.prob.last).toBe(0);
  expect(st.prob.n).toBe(1);
  expect(errs).toEqual([]);
});

test("көмекші: математика беттерінде өзі шықпайды, «Көмекші» батырмасын басқанда ғана шығады", async ({ page }) => {
  test.setTimeout(150000);
  for (const url of ["math/index.html", "math/formulas.html", "math/glossary.html", "math/practice.html", LESSON0]) {
    await open(page, url);
    await page.waitForTimeout(4000);
    await expect(page.locator(".bota-pop, .bota-tip"), url).toHaveCount(0);
    // кодтан (мысалы, мақсат орындалды, тест 100%) шақырылса да өзі шықпайды
    await page.evaluate(() => window.CS50KZ.botaSay("Автоматты хабар"));
    await page.waitForTimeout(500);
    await expect(page.locator(".bota-pop"), url).toHaveCount(0);
    const btn = page.getByRole("button", { name: "Көмекші" });
    await expect(btn, url).toBeVisible();
    await expect(btn).toHaveAttribute("aria-label", "Көмекші");
    await btn.focus();
    await expect(btn).toBeFocused();
    await btn.click();
    await expect(page.locator(".bota-pop.show"), url).toBeVisible();
    await expect(page.locator(".bota-pop p")).not.toBeEmpty();
    await page.keyboard.press("Escape");
    await expect(page.locator(".bota-pop")).toHaveCount(0);
  }
});

test("көмекші: басқа курстарда бота мінезі өзгермеген (хабар шығады, Ботаның кеңесі бар, «Көмекші» батырмасы жоқ)", async ({ page }) => {
  await blockFonts(page.context());
  await page.goto("cpp/index.html");
  await page.waitForFunction(() => window.CS50KZ);
  await expect(page.locator(".math-help-btn")).toHaveCount(0);
  await page.evaluate(() => window.CS50KZ.botaSay("Сынақ хабары"));
  await expect(page.locator(".bota-pop.show")).toBeVisible();
  await expect(page.locator(".bota-pop")).not.toHaveClass(/math-help-pop/);
  await page.goto("cpp/lectures/week-0.html");
  await page.waitForFunction(() => window.CS50KZ);
  await expect(page.locator(".bota-tip")).toHaveCount(1);
  await expect(page.locator(".bota-tip")).toContainText("Ботаның кеңесі");
  await expect(page.locator(".math-help-btn")).toHaveCount(0);
});

test("көмекші, 390px: батырма көрінеді, мазмұнды жаппайды, көлденең айналу жоқ", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  for (const url of ["math/index.html", LESSON0, "math/practice.html"]) {
    await open(page, url);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), url).toBe(true);
    const btn = page.getByRole("button", { name: "Көмекші" });
    await expect(btn).toBeVisible();
    const b = await btn.boundingBox();
    expect(b.x).toBeGreaterThanOrEqual(0); expect(b.y + b.height).toBeLessThanOrEqual(844); expect(b.width).toBeGreaterThanOrEqual(40); expect(b.width).toBeLessThan(120);
    await btn.click();
    const pop = await page.locator(".bota-pop.show").boundingBox();
    expect(pop.x).toBeGreaterThanOrEqual(0); expect(pop.x + pop.width).toBeLessThanOrEqual(391);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), url).toBe(true);
  }
  await ctx.close();
});

test("дизайн: әр пәннің өз түсі мен белгісі, кезең сүзгісі, сабақтар жолағы, карта үзіндісінде TeX жоқ", async ({ page }) => {
  await open(page, "math/index.html");
  const cols = await page.locator(".mx-subj").evaluateAll((els) => els.map((e) => e.style.getPropertyValue("--sc")));
  expect(new Set(cols).size).toBe(25);
  expect(await page.locator(".mx-subj[data-glyph]").count()).toBe(25);
  // карта үзінділерінде өңделмеген $...$ жоқ (курс беті KaTeX жүктемейді)
  expect((await page.locator(".mx-subj .week-card p").allInnerTexts()).filter((t) => t.includes("$"))).toEqual([]);
  // сүзгі: «Нөлден бастау» - тек Arithmetic; 4-кезең - тек сол кезеңнің пәндері; «Барлығы» - қайта 25
  await page.click('.mx-fchip[data-stage="0"]');
  await expect(page.locator(".mx-subj:not(.is-hidden)")).toHaveCount(1);
  await expect(page.locator(".mx-subj:not(.is-hidden)")).toHaveAttribute("data-slug", "arith");
  await page.click('.mx-fchip[data-stage="5"]');
  await expect(page.locator(".mx-subj:not(.is-hidden)")).toHaveCount(7);
  await expect(page.locator('.mx-fchip[data-stage="5"]')).toHaveAttribute("aria-pressed", "true");
  await page.click('.mx-fchip[data-stage=""]');
  await expect(page.locator(".mx-subj:not(.is-hidden)")).toHaveCount(25);
  // сабақ беті: баннер мен блоктар пән түсімен, пән ішіндегі сабақтар жолағы
  await open(page, "math/lectures/week-128.html");
  await expect(page.locator(".lecture-head")).toHaveAttribute("data-msubj", "numtheory");
  await expect(page.locator(".mx-strip li")).toHaveCount(6);
  await expect(page.locator('.mx-strip a[aria-current="page"]')).toHaveText("4");
  await expect(page.locator(".mx-intro")).toHaveCount(1);
});

test("жеңіл қабат: бір сөйлем, қолмен жылыту, ұқсастық, белгілер, қарапайым тілмен, идея, тоқта-ойлан", async ({ page }) => {
  await open(page, "math/lectures/week-131.html");
  await expect(page.locator(".mx-big p")).toHaveCount(1);
  // бөлімдер ретті: мақсаттар → еске салу → қолмен → интуиция → белгілер → теория → тоқта-ойлан → қорытулар
  const ids = await page.locator("article h2[id]").evaluateAll((els) => els.map((e) => e.id));
  const order = ["goals", "prereq", "warmup", "intuition", "symbols", "theory", "checks", "derivations"];
  expect(order.map((i) => ids.indexOf(i))).toEqual([...order.map((i) => ids.indexOf(i))].sort((a, b) => a - b));
  for (const i of order) expect(ids).toContain(i);
  expect(await page.locator(".mx-warmup .math-steps li").count()).toBeGreaterThanOrEqual(3);
  expect(await page.locator(".mx-analogy").count()).toBeGreaterThanOrEqual(1);
  expect(await page.locator(".mx-symbols tbody tr").count()).toBeGreaterThanOrEqual(4);
  // әр анықтама мен теоремада «Қарапайым тілмен», әр қорытуда «Идея»
  const boxes = await page.locator("#theory ~ .math-def, #theory ~ .math-thm, #theory ~ .math-prop").count();
  expect(await page.locator(".math-def .mx-plain, .math-thm .mx-plain, .math-prop .mx-plain").count()).toBe(boxes);
  expect(await page.locator("details.math-derive .mx-idea").count()).toBe(await page.locator("details.math-derive").count());
  // тоқта-ойлан: жауап жасырын, басқанда ашылады
  const chk = page.locator("details.mx-check").first();
  await expect(chk.locator("p")).toBeHidden();
  await chk.locator("summary").click();
  await expect(chk.locator("p")).toBeVisible();
  expect(await page.locator(".katex-error").count()).toBe(0);
});

test("жеңіл қабат: барлық сабақта бар - генерацияланатын және қолмен жазылған (бір сөйлем, қолмен, белгілер, тоқта-ойлан)", () => {
  let checked = 0;
  for (const s of PLAN.subjects) {
    for (let k = 0; k < s.count; k++) {
      const html = fs.readFileSync(path.join(MATH, "lectures", `week-${s.start + k}.html`), "utf8");
      for (const mark of ['class="mx-big"', 'id="warmup"', 'class="mx-analogy"', 'id="symbols"', 'id="checks"', 'class="mx-idea"', 'class="mx-plain"'])
        expect(html.includes(mark), `${s.slug} ${k + 1}: ${mark}`).toBe(true);
      checked++;
    }
  }
  expect(checked).toBe(PLAN.total);
});

test("жеңіл қабат: 1-10 пәндердің беттері tools/math_easy/ файлдарымен сәйкес (math_easy_inject.py --check)", () => {
  const out = execFileSync("python3", [path.join(ROOT, "tools/math_easy_inject.py"), "--check"], { encoding: "utf8" });
  expect(out).toMatch(/67 сабақ сәйкес/);
});

// ------------------------------------------------------------------ сызбамен түсіндіру (tools/math_explain.py)
test("сызбамен түсіндіру: кезеңдер, сызбалар, формула, мысал; университеттегі орны; рет: белгілер → түсіндіру → теория", async ({ page }) => {
  const files = fs.readdirSync(path.join(ROOT, "tools/math_explain")).flatMap((slug) => fs.readdirSync(path.join(ROOT, "tools/math_explain", slug)).filter((f) => /^x\d+\.py$/.test(f)));
  expect(files.length).toBeGreaterThanOrEqual(1);
  await open(page, "math/lectures/week-21.html");
  const ids = await page.locator("article h2[id]").evaluateAll((els) => els.map((e) => e.id));
  expect(ids.indexOf("symbols")).toBeLessThan(ids.indexOf("explain"));
  expect(ids.indexOf("explain")).toBeLessThan(ids.indexOf("theory"));
  await expect(page.locator(".mx-xuni")).toContainText("1-курс, 1-семестр, Математикалық анализ I, 1-дәріс");
  const steps = page.locator(".mx-xstep");
  expect(await steps.count()).toBeGreaterThanOrEqual(3);
  for (let i = 0; i < (await steps.count()); i++) {
    const s = steps.nth(i);
    await expect(s.locator(".mx-xwhy")).toContainText("Сұрақ.");
    await expect(s.locator(".mx-xtry .math-answer")).toContainText("Жауабы:");
    expect(await s.locator(".mx-xtry .math-steps li").count()).toBeGreaterThanOrEqual(2);
  }
  // сызбалар: экран оқитын құралға сипаттама, бос емес график, KaTeX формулалары
  const figs = page.locator(".mx-explain figure.mx-fig svg.mf[role=img]");
  expect(await figs.count()).toBeGreaterThanOrEqual(2);
  for (let i = 0; i < (await figs.count()); i++) {
    expect((await figs.nth(i).getAttribute("aria-label")).length).toBeGreaterThan(20);
    expect(await figs.nth(i).locator("path.mf-fn").count()).toBeGreaterThanOrEqual(1);
  }
  expect(await page.locator(".mx-explain .katex").count()).toBeGreaterThan(20);
  // университеттегі орын пән карточкасында да
  await open(page, "math/index.html");
  await expect(page.locator("#subj-4 .mx-suni")).toContainText("1-курс, 1-семестр, Математикалық анализ I");
  await expect(page.locator(".mx-suni")).toHaveCount(25);
});
