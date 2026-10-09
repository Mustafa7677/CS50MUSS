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
  await expect(page.locator(".week-card:not(.soon)")).toHaveCount(1);
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
  await page.keyboard.type("f-жол");
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
