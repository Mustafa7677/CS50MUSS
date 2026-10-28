// © 2026 Sagid Mustafa. All Rights Reserved.
// Үш академия: басты беттегі анимациялық оқиға, бағдарламалау академиясының маршруттары, ағылшын дағдылар зертханасы, мәзір.
const { test, expect } = require("@playwright/test");
const { execFileSync } = require("child_process");
const path = require("path");
const { blockFonts, collectErrors, ROOT } = require("../support/helpers");

const { site_stats: S } = JSON.parse(execFileSync("python3", [path.join(ROOT, "tools/build.py"), "--stats"], { encoding: "utf8" }));
const CODE = ["x", "python", "sql", "ai", "web", "cpp", "java"];

test("оқиға: 1-сахна бірден ойналады, келесі сахналар тек скролл жеткенде іске қосылады", async ({ page }) => {
  await blockFonts(page.context());
  const errs = collectErrors(page);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("index.html");
  await expect(page.locator("html")).toHaveClass(/st-js/);
  await expect(page.locator(".st-scene")).toHaveCount(3);
  await expect(page.locator(".st-s1")).toHaveClass(/is-on/);
  await expect(page.locator("#scene-2")).not.toHaveClass(/is-on/);
  await expect(page.locator("#academies")).not.toHaveClass(/is-on/);
  await expect(page.locator(".st-s1 h1")).toHaveText("Бір шаңырақ үш академия");
  // скролл сахнаны тек бастайды: экранға кіргенде is-on, анимация өздігінен соңына дейін ойналады
  await page.locator("#scene-2").scrollIntoViewIfNeeded();
  await expect(page.locator("#scene-2")).toHaveClass(/is-on/);
  await expect(page.locator("#academies")).not.toHaveClass(/is-on/);
  await page.locator("#academies .ac-grid").scrollIntoViewIfNeeded();
  await expect(page.locator("#academies")).toHaveClass(/is-on/);
  await expect(page.locator(".ac-card")).toHaveCount(3);
  await expect(page.locator(".ac-card").nth(2)).toHaveCSS("opacity", "1", { timeout: 6000 });
  expect(await page.locator(".ac-card").evaluateAll((as) => as.map((a) => a.getAttribute("href")))).toEqual(["programming.html", "en/", "math/"]);
  await expect(page.locator('.ac-card[href="programming.html"] .ac-facts')).toContainText(`${S.by_course.x.lect + CODE.slice(1).reduce((n, c) => n + S.by_course[c].lect, 0)} лекция`);
  expect(errs).toEqual([]);
});

test("оқиға: қозғалыс азайтылса (жүйе не «Аа» баптауы) бәрі бірден соңғы күйінде көрінеді", async ({ browser }) => {
  for (const ctxOpts of [{ reducedMotion: "reduce" }, {}]) {
    const ctx = await browser.newContext(ctxOpts);
    await blockFonts(ctx);
    if (!ctxOpts.reducedMotion) await ctx.addInitScript(() => localStorage.setItem("cs50kz:prefs", JSON.stringify({ rm: true })));
    const page = await ctx.newPage();
    await page.goto("index.html");
    await expect(page.locator("html")).not.toHaveClass(/st-js/);
    // скроллсыз да 2 мен 3-сахна мәтіні мен карточкалары көрінеді
    for (const sel of [".st-pillars li >> nth=3", ".ac-card >> nth=2", ".st-s1 .st-acts"]) await expect(page.locator(sel)).toHaveCSS("opacity", "1");
    expect(await page.locator(".st-s1 .sun-rise").evaluate((e) => getComputedStyle(e).animationName)).toBe("none");
    await ctx.close();
  }
});

test("бағдарламалау академиясы: жеті маршрут, бекеттер лекциялармен сәйкес, прогресс пен мақсат", async ({ page }) => {
  await blockFonts(page.context());
  const errs = collectErrors(page);
  await page.addInitScript(() => { if (!sessionStorage.getItem("s")) { sessionStorage.setItem("s", 1); localStorage.setItem("cs50kz:progress", JSON.stringify({ read: { "week-0": true, "python:week-0": true, "python:week-1": true } })); } });
  await page.goto("programming.html");
  await expect(page.locator(".pa-track")).toHaveCount(7);
  for (const c of CODE) await expect(page.locator(`#t-${c} .pa-line li`)).toHaveCount(S.by_course[c].lect);
  // оқылғандар белгіленеді, келесі бекет - ағымдағы қадам
  await expect(page.locator("#t-x .pa-line li.done")).toHaveCount(1);
  await expect(page.locator("#t-x .pa-line li.cur")).toHaveAttribute("data-id", "week-1");
  await expect(page.locator("#t-python .pa-stat")).toHaveText(`2/${S.by_course.python.lect} оқылды`);
  await expect(page.locator("#t-python .pa-next")).toHaveAttribute("href", "python/lectures/week-2.html");
  await expect(page.locator("#t-python .pa-next")).toContainText("Жалғастыру:");
  await expect(page.locator("#t-sql .pa-next")).toHaveText("Бастау");
  // мақсат: жасанды интеллект -> Python, сосын AI; таңдау сақталады
  await page.click('.pa-goal[data-goal="ai"]');
  await expect(page.locator('.pa-goal[data-goal="ai"]')).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".pa-steps li")).toHaveCount(2);
  await expect(page.locator(".pa-steps a").first()).toHaveAttribute("href", "#t-python");
  await expect(page.locator(".pa-track.pa-pick")).toHaveCount(2);
  await page.reload();
  await expect(page.locator('.pa-goal[data-goal="ai"]')).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".pa-track.pa-pick")).toHaveCount(2);
  expect(errs).toEqual([]);
});

test("English Academy: дағдылар зертханасы - диктант, оқу, жазу, жеке прогресс кестесі", async ({ page }) => {
  await blockFonts(page.context());
  const errs = collectErrors(page);
  await page.goto("en/skills.html");
  await expect(page.locator(".sk-cell")).toHaveCount(24);
  await expect(page.locator('.sk-lv[data-lv="A0"]')).toHaveAttribute("aria-pressed", "true");
  // диктант: тыныс белгісі мен бас әріп маңызды емес; қате сөз белгіленеді
  await page.fill("#dict-A0-0", "hello my name is aru");
  await page.click(".sk-item >> nth=0 >> .sk-check");
  await expect(page.locator(".sk-item").first()).toHaveClass(/is-done/);
  await page.fill("#dict-A0-1", "this is my computers");
  await page.press("#dict-A0-1", "Enter");
  await expect(page.locator(".sk-item").nth(1).locator(".sk-miss")).toHaveText("computer");
  await expect(page.locator('.sk-cell[data-lv="A0"][data-sk="listen"] em')).toHaveText("20%");
  // оқу: сөзді басқанда аудармасы, сұрақтар тексеріледі
  await page.click("#tab-read");
  await expect(page.locator("#tab-read")).toHaveAttribute("aria-selected", "true");
  await page.locator(".sk-gl").first().click();
  await expect(page.locator(".sk-tr").first()).toBeVisible();
  for (const [i, v] of [[0, 1], [1, 1], [2, 1], [3, 0]]) await page.check(`input[name="read-A0-${i}"][value="${v}"]`);
  await page.click(".sk-quiz button[type=submit]");
  await expect(page.locator(".sk-quiz .sk-res")).toContainText("4/4");
  // жазу: сөз саны мен тексеру тізімі
  await page.click("#tab-write");
  await page.fill(".sk-ta", "Hello there.");
  await page.click(".sk-submit");
  await expect(page.locator(".sk-panel .sk-res")).toContainText("Тағы");
  await page.fill(".sk-ta", "Hello! My name is Aidos. I am nineteen years old and I am from Taraz. I like music, football and computers. I like Python too.");
  await expect(page.locator(".sk-checks li.ok")).toHaveCount(3);
  await page.click(".sk-submit");
  await expect(page.locator(".sk-panel .sk-res")).toContainText("Барлық талап орындалды");
  const st = await page.evaluate(() => JSON.parse(localStorage.getItem("cs50kz:en:skills")));
  expect(st.A0).toEqual({ dict: [0], read: 100, write: true });
  // кесте ұяшығы деңгей мен дағдыны ашады; деңгей сақталады
  await page.click('.sk-cell[data-lv="B2"][data-sk="speak"]');
  await expect(page.locator("#tab-speak")).toHaveAttribute("aria-selected", "true");
  await expect(page.locator(".sk-phrase").first()).toHaveText("I should have checked the logs earlier.");
  await page.reload();
  await expect(page.locator('.sk-lv[data-lv="B2"]')).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator('.sk-cell[data-lv="A0"][data-sk="write"] em')).toHaveText("100%");
  expect(errs).toEqual([]);
});

test("English Academy: деңгей тестінің ұсынысы зертхананың әдепкі деңгейі; «Дағдылар» барлық ағылшын беттерінде", async ({ page }) => {
  await blockFonts(page.context());
  await page.addInitScript(() => localStorage.setItem("cs50kz:en:placement", JSON.stringify({ rec: 3 })));
  await page.goto("en/skills.html");
  await expect(page.locator('.sk-lv[data-lv="B1"]')).toHaveAttribute("aria-pressed", "true");
  for (const url of ["en/index.html", "en/vocab.html", "en/lectures/week-5.html"]) {
    await page.goto(url);
    await expect(page.locator('.en-subnav a:text-is("Дағдылар")')).toHaveCount(1);
  }
  await page.goto("en/index.html");
  await expect(page.locator("h1")).toContainText("English Academy");
  await expect(page.locator('a.en-tool-card[href="skills.html"]')).toBeVisible();
});

test("мәзір мен витрина: курстар үш академия бойынша топталған", async ({ page }) => {
  await blockFonts(page.context());
  await page.goto("courses.html");
  await expect(page.locator(".cx-acad")).toHaveCount(3);
  await expect(page.locator(".cx-acad a")).toHaveText(["Бағдарламалау академиясы", "English Academy", "Математика академиясы"]);
  await page.click(".course-pill");
  await expect(page.locator(".course-menu .cm-sep")).toHaveCount(3);
  expect(await page.locator(".course-menu .cm-sep").evaluateAll((as) => as.map((a) => a.getAttribute("href").replace(/^https?:\/\/[^/]+\//, "")))).toEqual(["programming.html", "en/", "math/"]);
  await expect(page.locator(".course-menu .cm-row")).toHaveCount(9);
  await expect(page.locator('.footer .ft-col h4:text-is("Академиялар")')).toHaveCount(1);
});
