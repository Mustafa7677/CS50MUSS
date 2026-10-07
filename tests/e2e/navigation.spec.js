// Мазмұн (TOC) сілтемелері бөлімге дәл апаруы керек.
// Ескерту: content-visibility: auto осыны бұзады (бірінші секіріс 800px+ қате түседі) — қолданбаңыз.
const { test, expect } = require("@playwright/test");
const { blockFonts, collectErrors } = require("../support/helpers");

for (const lec of ["week-3", "week-6"]) {
  test(`${lec}: TOC және тікелей якорь бөлімге дәл түседі`, async ({ page, context }) => {
    await blockFonts(context);
    const errs = collectErrors(page);
    await page.goto(`lectures/${lec}.html`);
    const hrefs = await page.evaluate(() => [...document.querySelectorAll(".toc a")].map((a) => a.getAttribute("href")));
    expect(hrefs.length).toBeGreaterThan(10);
    for (const h of hrefs.slice(-5)) {
      await page.click(`.toc a[href="${h}"]`);
      await expect.poll(() => page.evaluate((h) => Math.round(document.querySelector(h).getBoundingClientRect().top), h), { timeout: 4000 }).toBeLessThan(160);
    }
    await page.goto(`lectures/${lec}.html#problem-set`);
    await expect.poll(() => page.evaluate(() => Math.round(document.querySelector("#problem-set").getBoundingClientRect().top))).toBeLessThan(160);
    expect(errs).toEqual([]);
  });
}

test("телефонда мазмұн батырма арқылы ашылып-жабылады", async ({ page, context }) => {
  await blockFonts(context);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("lectures/week-1.html");
  const btn = page.locator(".toc-toggle");
  await expect(btn).toHaveAttribute("aria-expanded", "false");
  await btn.click();
  await expect(btn).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator(".toc ol")).toBeVisible();
  await page.locator(".toc ol a").nth(3).click();
  await expect(page.locator(".toc")).not.toHaveClass(/open/);
});

test("басты бет: күн сөзі шығады, «Келесі» ауыстырады; лекция оқылғанда Бота ұлы сөз айтады", async ({ page }) => {
  const errs = collectErrors(page);
  await page.clock.install();
  await page.goto("index.html");
  const q = page.locator(".qt-card blockquote");
  await expect(q).not.toBeEmpty();
  await expect(page.locator(".qt-card figcaption b")).not.toBeEmpty();
  const first = await q.innerText();
  await page.click(".qt-next");
  await expect(q).not.toHaveText(first);
  await expect(page.locator(".qt-count")).toHaveText(/^\d+ \/ 1[7-9]$|^\d+ \/ [2-9]\d$/);
  // Өзі ауысады (уақытты жылдамдатамыз): тінтуір картадан тыс тұрғанда
  await page.mouse.move(0, 0);
  const second = await q.innerText();
  await page.clock.runFor(13_000);
  await expect(q).not.toHaveText(second);
  // Тоқтату батырмасы
  await page.click(".qt-play");
  await page.mouse.move(0, 0);
  const third = await q.textContent();
  await page.clock.runFor(30_000);
  await expect(page.locator(".qt-card")).toHaveClass(/is-paused/);
  await expect(q).toHaveText(third);
  // Тұлғалар жолағы: Абайды бассақ — Абайдың сөзі, тағы бассақ — оның келесі сөзі
  await expect(page.locator(".qt-faces button")).toHaveCount(11); // сөзі бар тұлғалар
  await page.click('.qt-faces button[data-a="Абай Құнанбайұлы"]');
  await expect(page.locator(".qt-card figcaption b")).toHaveText("Абай Құнанбайұлы");
  await expect(page.locator('.qt-faces button[data-a="Абай Құнанбайұлы"]')).toHaveAttribute("aria-pressed", "true");
  const abai1 = await q.textContent();
  await page.click('.qt-faces button[data-a="Абай Құнанбайұлы"]');
  await expect(q).not.toHaveText(abai1);
  await expect(page.locator(".qt-card figcaption b")).toHaveText("Абай Құнанбайұлы");
  await page.locator(".qt-card").screenshot({ path: test.info().outputPath("quote.png") });
  await page.goto("lectures/week-0.html");
  await page.locator(".mark-read .btn.gold").click();
  await expect(page.locator(".bota-pop")).toContainText("Жарайсыз!");
  expect(errs).toEqual([]);
});

test("Алаш тұлғалары беті: карталар, дәйексөздер, Python блоктары", async ({ page }) => {
  const errs = collectErrors(page);
  await page.goto("index.html");
  await page.click(".qt-more");
  await expect(page).toHaveURL(/alash\.html$/);
  await expect(page.locator(".al-card")).toHaveCount(12);
  await expect(page.locator(".al-card.has-portrait")).toHaveCount(12); // барлығы портретпен
  await expect(page.locator(".al-card").first()).toContainText("Әлихан Бөкейхан");
  await expect(page.locator('pre[data-lang="python"] .run-btn')).toHaveCount(3);
  await page.screenshot({ path: test.info().outputPath("alash.png"), fullPage: true });
  expect(errs).toEqual([]);
});

test("күн сөзі суретке айналады (PNG жүктеледі)", async ({ page }) => {
  const errs = collectErrors(page);
  await page.goto("index.html");
  await expect(page.locator(".qt-card blockquote")).not.toBeEmpty();
  const [dl] = await Promise.all([page.waitForEvent("download"), page.click(".qt-img")]);
  expect(dl.suggestedFilename()).toBe("cs50kz-soz.png");
  await dl.saveAs(test.info().outputPath("quote-share.png"));
  expect(errs).toEqual([]);
});

test("ұлағатты сөз лекция соңында және жаттығу бетінде; тапсырма біткенде Бота сөз айтады", async ({ page }) => {
  const errs = collectErrors(page);
  await page.goto("lectures/week-1.html");
  const m = page.locator(".qt-mini");
  await expect(m.locator("blockquote")).not.toBeEmpty();
  const t1 = await m.locator("blockquote").textContent();
  await m.locator(".qm-next").click();
  await expect(m.locator("blockquote")).not.toHaveText(t1);
  await m.screenshot({ path: test.info().outputPath("mini.png") });
  // Тапсырманың барлық тексеруін белгілеу
  const list = page.locator(".checklist[data-id]").first();
  const boxes = list.locator("input[type=checkbox]");
  const n = await boxes.count();
  for (let k = 0; k < n; k++) await boxes.nth(k).check();
  await expect(page.locator(".bota-pop")).toContainText("Тапсырма орындалды!");
  await page.goto("practice.html");
  await expect(page.locator(".qt-slot blockquote")).not.toBeEmpty();
  expect(errs).toEqual([]);
});
