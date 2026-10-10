// Курстар: курстар беті, CS50P курсының беті мен лекциясы, прогресс CS50x-пен шатаспайды, автотексеруші.
const { test, expect } = require("@playwright/test");
const { blockFonts, routePyodide, collectErrors } = require("../support/helpers");

test("курстар беті және CS50P: лекция, тест, «Оқыдым», прогресс бөлек", async ({ page }) => {
  const errs = collectErrors(page);
  await blockFonts(page.context());
  await page.goto("courses.html");
  await expect(page.locator(".cx-card")).toHaveCount(5);
  await expect(page.locator(".cx-card .cx-bar:visible")).toHaveCount(0);
  await page.click('.cx-card[href="python/"]');
  await expect(page).toHaveURL(/python\/(index\.html)?$/);
  await expect(page.locator(".week-card")).toHaveCount(10);
  await expect(page.locator(".week-card:not(.soon)")).toHaveCount(10);
  await page.click('.week-card[data-id="week-0"]');
  await expect(page.locator("h1")).toHaveText("Функциялар, айнымалылар");
  await expect(page.locator(".lecture-head")).toHaveAttribute("data-n", "0");
  await expect(page.locator(".toc ol li").first()).toBeVisible();
  // Тест: барлық дұрыс жауап
  const qs = page.locator(".quiz .question");
  const n = await qs.count();
  for (let i = 0; i < n; i++) {
    const a = await qs.nth(i).getAttribute("data-answer");
    await qs.nth(i).locator(`input[value="${a}"]`).check();
  }
  await page.click(".quiz-check");
  await page.click(".mark-read .btn.gold");
  const p = await page.evaluate(() => JSON.parse(localStorage.getItem("cs50kz:progress")));
  expect(p.read["python:week-0"]).toBeTruthy();
  expect(p.read["week-0"]).toBeFalsy(); // CS50x-тің 0-аптасы емес
  expect(p.quiz["python:week-0"]).toEqual({ best: n, total: n });
  // Айналдырғанда «қайда тоқтадым» сақталады (2 секундта бір рет) - кілт пайда болғанша айналдырамыз
  await expect.poll(async () => {
    await page.evaluate(() => scrollBy(0, 300));
    await page.waitForTimeout(400);
    return page.evaluate(() => localStorage.getItem("cs50kz:last:python"));
  }, { timeout: 20_000 }).toContain("python:week-0");
  await page.goto("python/index.html");
  await expect(page.locator('.week-card[data-id="week-0"]')).toHaveClass(/is-read/);
  await expect(page.locator(".course-progress")).toContainText("1 оқылды");
  await expect(page.locator(".course-progress .btn")).toHaveAttribute("href", /python\/lectures\/week-0\.html$/);
  // Курс витринасы CS50P прогресін көрсетеді, CS50x-тікін емес
  await page.goto("courses.html");
  await expect(page.locator('.cx-card[data-course="python"] .cx-bar')).toBeVisible();
  await expect(page.locator('.cx-card[data-course="python"] .cx-foot')).toContainText("1/10 лекция оқылды");
  await expect(page.locator('.cx-card[data-course="x"] .cx-bar')).toBeHidden();
  // CS50x басты беті CS50P прогресін өзінікі деп санамайды; басты бетте CS50x-тен басқа 4 курс
  await page.goto("index.html");
  await expect(page.locator(".dash-stats")).toContainText("0/12");
  await expect(page.locator(".cx-home .cx-card")).toHaveCount(4);
  // Іздеу CS50P бөлімдерін табады
  await page.keyboard.press("Control+k");
  await expect(page.locator(".search-modal input")).toBeFocused();
  await page.keyboard.type("Жолдарды пішімдеу");
  await expect(page.locator(".search-modal")).toContainText("CS50P");
  expect(errs).toEqual([]);
});

test("CS50P автотексеруші: эталон шешімдер өтеді, қате шешім құлайды @slow", async ({ page }) => {
  test.setTimeout(120_000);
  await routePyodide(page.context());
  await blockFonts(page.context());
  await page.goto("python/lectures/week-0.html");
  const SOL = {
    "py-indoor": 'print(input().lower())',
    "py-playback": 'print(input().replace(" ", "..."))',
    "py-faces": 'def main():\n    print(convert(input()))\n\ndef convert(s):\n    return s.replace(":)", "🙂").replace(":(", "🙁")\n\nmain()',
    "py-einstein": 'print(int(input()) * 300000000 ** 2)',
    "py-tip": 'def main():\n    d = dollars_to_float(input())\n    p = percent_to_float(input())\n    print(f"Leave ${d * p:.2f}")\n\ndef dollars_to_float(d):\n    return float(d[1:])\n\ndef percent_to_float(p):\n    return float(p[:-1]) / 100\n\nmain()',
  };
  for (const [key, code] of Object.entries(SOL)) {
    const ag = page.locator(`.autograder[data-check="${key}"]`);
    await ag.locator(".ag-code").fill(code);
    await ag.locator(".ag-run").click();
    await expect(ag.locator(".ag-score")).toContainText(/(\d+) \/ \1 тест өтті/, { timeout: 60_000 });
  }
  const ag = page.locator('.autograder[data-check="py-einstein"]');
  await ag.locator(".ag-code").fill("print(int(input()) * 3e8 ** 2)"); // float - қате
  await ag.locator(".ag-run").click();
  await expect(ag.locator(".ag-score")).toContainText("0 / 3");
});

test("сертификат: CS50x/CS50P ауыстырғыш, CS50P сертификаты өз прогресімен", async ({ page }) => {
  const errs = collectErrors(page);
  await blockFonts(page.context());
  await page.goto("certificate.html?course=python");
  await expect(page.locator(".cert-switch a.on")).toHaveText("CS50P");
  await expect(page.locator(".cert-code")).toHaveText("CS50P");
  await expect(page.locator(".certificate")).toHaveClass(/locked/);
  await expect(page.locator(".cert-gate")).toContainText("0 / 10 лекция оқылды");
  await expect(page.locator(".cert-print")).toBeDisabled();
  await page.goto("certificate.html");
  await expect(page.locator(".cert-switch a.on")).toHaveText("CS50x");
  await expect(page.locator(".cert-gate")).toContainText("0 / 12");
  expect(errs).toEqual([]);
});

test("CS50 SQL / Web: лекциядағы мысалдар мен автотексерушілер жұмыс істейді", async ({ page }) => {
  test.setTimeout(120_000);
  const errs = collectErrors(page);
  await blockFonts(page.context());
  // SQL: өз демо дерекқорында нағыз SQLite
  await page.goto("sql/lectures/week-0.html");
  const sqlBtn = page.locator('pre[data-lang="sql"][data-db] .run-btn').first();
  await sqlBtn.scrollIntoViewIfNeeded();
  await sqlBtn.click();
  await expect(page.locator(".sql-output .sql-table").first()).toBeVisible({ timeout: 60_000 });
  // SQL автотексеруші: бірінші тапсырма - эталон сұраумен өтеді
  const sg = page.locator(".sql-grader").first();
  await sg.scrollIntoViewIfNeeded();
  const ref = await page.evaluate(async (el) => {
    const src = el.dataset.src, set = el.dataset.set;
    await window.CS50KZ.loadScript(src);
    return window.CS50KZ_SQLCHECKS[set].tasks[0].ref;
  }, await sg.elementHandle());
  await sg.locator(".sg-code").fill(ref);
  await sg.locator(".sg-run").click();
  await expect(sg.locator(".sg-msg")).toContainText("Дұрыс", { timeout: 60_000 });
  await sg.locator(".sg-code").fill("SELECT 1;");
  await sg.locator(".sg-run").click();
  await expect(sg.locator(".sg-msg")).toContainText("✗");
  // Web: JS мысалы, HTML алдын ала көрсету, JS автотексеруші (шексіз цикл бетті қатырмайды)
  await page.goto("web/lectures/week-5.html");
  const jsBtn = page.locator('pre[data-lang="javascript"][data-run] .run-btn').first();
  await jsBtn.scrollIntoViewIfNeeded();
  await jsBtn.click();
  await expect(page.locator("pre.run-output").first()).toContainText("Hello, world!", { timeout: 10_000 });
  const pv = page.locator('pre[data-lang="html"][data-preview] .run-btn').first();
  await pv.scrollIntoViewIfNeeded();
  await pv.click();
  await expect(page.locator(".web-preview iframe").first()).toBeVisible();
  const jg = page.locator('.js-grader[data-check="js-capitalize"]');
  await jg.scrollIntoViewIfNeeded();
  await jg.locator(".ag-code").fill("function capitalize(w) { return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(); }");
  await jg.locator(".ag-run").click();
  await expect(jg.locator(".ag-score")).toContainText(/(\d+) \/ \1 тест өтті/, { timeout: 15_000 });
  await jg.locator(".ag-code").fill("while (true) {}");
  await jg.locator(".ag-run").click();
  await expect(jg.locator(".ag-score")).toContainText(/^0 \/ \d+/, { timeout: 15_000 });
  expect(errs).toEqual([]);
});

test("барлық 5 курстың басты беттері мен сертификат ауыстырғыш", async ({ page }) => {
  const errs = collectErrors(page);
  await blockFonts(page.context());
  await page.goto("courses.html");
  await expect(page.locator(".cx-card")).toHaveCount(5);
  for (const [code, n] of [["python", 10], ["sql", 7], ["ai", 7], ["web", 9]]) {
    await page.goto(`${code}/index.html`);
    await expect(page.locator(".week-card")).toHaveCount(n);
    await expect(page.locator(".week-card:not(.soon)")).toHaveCount(n);
    await page.goto(`certificate.html?course=${code}`);
    await expect(page.locator(".cert-gate")).toContainText(`0 / ${n} лекция оқылды`);
  }
  expect(errs).toEqual([]);
});

test("құрылым: курс таңдағыш, іздеу/сөздік/карточка/тест курс бойынша", async ({ page }) => {
  test.setTimeout(120_000);
  const errs = collectErrors(page);
  await blockFonts(page.context());
  // Курс таңдағыш: ағымдағы курс белгіленеді, барлық 5 курс бар
  await page.goto("sql/lectures/week-0.html");
  await expect(page.locator(".course-pill .cp-label")).toHaveText("SQL");
  await page.click(".course-pill");
  await expect(page.locator(".course-menu .cm-row")).toHaveCount(5);
  await expect(page.locator(".course-menu .cm-row.on")).toContainText("CS50 SQL");
  await page.keyboard.press("Escape");
  await expect(page.locator(".course-menu")).toBeHidden();
  // Іздеу курс бойынша сүзіледі
  await page.keyboard.press("Control+k");
  await expect(page.locator(".search-modal input")).toBeFocused();
  await page.click('.search-scope button[data-s="ai"]');
  await page.keyboard.type("іздеу");
  await expect(page.locator(".search-results li a").first()).toBeVisible();
  const hrefs = await page.locator(".search-results li a").evaluateAll((a) => a.map((x) => x.getAttribute("href")));
  expect(hrefs.length).toBeGreaterThan(0);
  expect(hrefs.every((h) => /ai\/lectures\//.test(h))).toBe(true);
  // Сөздік: курс сүзгісі
  await page.goto("glossary.html");
  const all = await page.locator(".g-row:not([hidden])").count();
  await page.click('.g-courses button[data-c="sql"]');
  const sqlN = await page.locator(".g-row:not([hidden])").count();
  expect(sqlN).toBeGreaterThan(0);
  expect(sqlN).toBeLessThan(all);
  // Аралас тест: SQL курсы 56 сұрақ
  await page.goto("practice.html");
  await page.click('.mq-courses button[data-c="sql"]');
  await expect(page.locator(".mq-from option").first()).toContainText("56 сұрақ");
  await expect(page.locator(".mq-box .mq-opts button").first()).toBeVisible();
  // Флэш-карточкалар: Web карточкалары
  await page.goto("flashcards.html");
  await page.click('.fc-course button[data-c="web"]');
  await expect(page.locator(".fc-progress")).toContainText("Меңгерілді");
  expect(errs).toEqual([]);
});

test("«Менің курстарым»: басты бет пен профильде курстар бойынша прогресс", async ({ page }) => {
  const errs = collectErrors(page);
  await blockFonts(page.context());
  await page.goto("index.html");
  await expect(page.locator(".my-courses")).toBeHidden(); // әлі ешнәрсе оқылмаған
  await page.evaluate(() => localStorage.setItem("cs50kz:progress", JSON.stringify({ read: { "python:week-0": 1, "python:week-1": 1, "sql:week-0": 1, "week-0": 1 }, quiz: {}, last: null, name: "" })));
  await page.reload();
  await expect(page.locator(".my-courses .mc-card")).toHaveCount(3);
  const py = page.locator('.mc-card:has(h3:text-is("CS50P"))');
  await expect(py).toContainText("2/10 лекция");
  await expect(py.locator(".mc-btn")).toHaveAttribute("href", /python\/lectures\/week-2\.html$/);
  await page.goto("profile.html");
  await expect(page.locator(".pf-mycourses, .my-courses .mc-card").first()).toBeVisible();
  await expect(page.locator(".pf-stats")).toContainText("4/45");
  // Курс таңдағыштағы прогресс
  await page.click(".course-pill");
  await expect(page.locator('.course-menu .cm-row:has-text("CS50P") .cm-n')).toHaveText("2/10");
  expect(errs).toEqual([]);
});
