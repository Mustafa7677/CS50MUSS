const { test, expect } = require("@playwright/test");
const { blockFonts, collectErrors } = require("../support/helpers");

async function noHScroll(page) {
  const w = await page.evaluate(() => ({ s: document.documentElement.scrollWidth, c: document.documentElement.clientWidth }));
  expect(w.s).toBeLessThanOrEqual(w.c);
}
async function stored(page, id) {
  return page.evaluate((i) => (JSON.parse(localStorage.getItem("cs50kz:games") || "{}")[i] || {}), id);
}
async function open(page, context, hash, opts = {}) {
  await blockFonts(context);
  const errs = collectErrors(page);
  await page.goto("games.html" + (opts.fast ? "?fast" : "") + "#" + hash);
  await expect(page.locator(".game-shell")).toBeVisible();
  return errs;
}

test("hub: 4 ойын карточкасы бар (games-a)", async ({ page, context }) => {
  await blockFonts(context);
  const errs = collectErrors(page);
  await page.goto("games.html");
  for (const id of ["runner", "bughunt", "battle", "algo"]) await expect(page.locator(`.game-card[href="#${id}"]`)).toHaveCount(1);
  expect(errs).toEqual([]);
});

test("Code Runner: батырмалармен ойнап, жан таусылғанша; нәтиже мен жазба", async ({ page, context }) => {
  page.setViewportSize({ width: 390, height: 800 });
  const errs = await open(page, context, "runner");
  await page.click(".ga-go");
  await expect(page.locator(".ga-lane")).not.toHaveCount(0);
  await noHScroll(page);
  for (let i = 0; i < 40 && !(await page.locator(".game-result").count()); i++) {
    await page.locator(".ga-lane").nth(i % 2).click();
    if (i % 3 === 0) await page.keyboard.press("ArrowRight");
    await page.click(".ga-ok");
    await page.waitForTimeout(400);
    // қате болса 2 секунд кідіреді: нәтижені немесе келесі сұрақты күтеміз
    await page.waitForFunction(() => document.querySelector(".game-result") || !document.querySelector(".ga-ok")?.disabled, null, { timeout: 5000 });
  }
  await expect(page.locator(".game-result")).toBeVisible({ timeout: 20000 });
  await noHScroll(page);
  expect((await stored(page, "runner")).plays).toBe(1);
  expect(errs).toEqual([]);
});

test("Code Runner: reduced-motion қадамдық режим, пернетақта", async ({ page, context }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errs = await open(page, context, "runner");
  await expect(page.locator(".ga-note")).toBeVisible();
  await page.click(".ga-go");
  await expect(page.locator(".ga-lane")).not.toHaveCount(0);
  const before = await page.locator(".ga-prompt").innerText();
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("Enter");
  await expect(page.locator(".g-fb")).toContainText(/Дұрыс|Қате/);
  expect(before.length).toBeGreaterThan(5);
  expect(errs).toEqual([]);
});

test("Bug Hunter: 12 раунд, түсіндірме, нәтиже", async ({ page, context }) => {
  page.setViewportSize({ width: 390, height: 800 });
  const errs = await open(page, context, "bughunt");
  await page.click(".ga-go");
  for (let r = 1; r <= 12; r++) {
    await expect(page.locator(".g-hud")).toContainText(`${r}/12`);
    await noHScroll(page);
    await page.locator(".ga-line").first().click();
    await expect(page.locator(".ga-explain")).toBeVisible();
    await expect(page.locator(".ga-explain")).toContainText("Түзету");
    await expect(page.locator(".ga-line.ok")).toHaveCount(1);
    await page.click(".ga-next");
  }
  await expect(page.locator(".game-result")).toBeVisible();
  expect((await stored(page, "bughunt")).plays).toBe(1);
  expect(errs).toEqual([]);
});

test("Bug Hunter: таймермен уақыт біткенде жалғасады", async ({ page, context }) => {
  const errs = await open(page, context, "bughunt", { fast: true });
  await page.check(".ga-timer");
  await page.click(".ga-go");
  await expect(page.locator(".ga-explain")).toBeVisible({ timeout: 10000 });
  await expect(page.locator(".g-fb")).toContainText("Уақыт бітті");
  expect(errs).toEqual([]);
});

test("Code Battle: 1-4 пернелері, таймер, нәтиже", async ({ page, context }) => {
  page.setViewportSize({ width: 390, height: 800 });
  const errs = await open(page, context, "battle", { fast: true });
  await page.click(".ga-go");
  await expect(page.locator(".ga-clock")).toBeVisible();
  await noHScroll(page);
  for (let i = 0; i < 4; i++) { await page.keyboard.press(String(i + 1)); await page.waitForTimeout(1000); }
  await expect(page.locator(".game-result")).toBeVisible({ timeout: 15000 });
  await expect(page.locator(".game-result")).toContainText("Дәлдік");
  expect((await stored(page, "battle")).plays).toBe(1);
  await noHScroll(page);
  expect(errs).toEqual([]);
});

test("Code Battle: қайталанбайтын сұрақтар (80+)", async ({ page, context }) => {
  await open(page, context, "battle");
  const d = await page.evaluate(() => window.CS50GamesA.QUIZ.map((q) => q[1] + "|" + q[2]));
  expect(d.length).toBeGreaterThanOrEqual(80);
  expect(new Set(d).size).toBe(d.length);
});

test("Algorithm Race: ↑↓, 5 раунд, қате орындар белгіленеді", async ({ page, context }) => {
  page.setViewportSize({ width: 390, height: 800 });
  const errs = await open(page, context, "algo");
  await page.click(".ga-go");
  for (let r = 1; r <= 5; r++) {
    await expect(page.locator(".ga-step")).not.toHaveCount(0);
    await noHScroll(page);
    if (r === 1) {
      const first = await page.locator(".ga-step .ga-txt").first().innerText();
      await page.locator(".ga-step .ga-dn").first().click();
      expect(await page.locator(".ga-step .ga-txt").nth(1).innerText()).toBe(first);
    }
    await page.click(".ga-check-btn");
    if (!(await page.locator(".ga-nx").count())) { await expect(page.locator(".ga-step.bad").first()).toBeVisible(); await page.click(".ga-check-btn"); }
    await expect(page.locator(".ga-nx")).toBeVisible();
    await page.click(".ga-nx");
  }
  await expect(page.locator(".game-result")).toBeVisible();
  expect((await stored(page, "algo")).plays).toBe(1);
  expect(errs).toEqual([]);
});

test("Algorithm Race: дұрыс ретке келтіріп толық ұпай алу (DnD + пернетақта)", async ({ page, context }) => {
  const errs = await open(page, context, "algo");
  await page.click(".ga-go");
  const correct = await page.evaluate(() => {
    const txt = [...document.querySelectorAll(".ga-txt")].map((e) => e.textContent);
    const a = window.CS50GamesA.ALGO.find((x) => x[1].every((s) => txt.includes(s)));
    return a[1];
  });
  for (let target = 0; target < correct.length; target++) {
    const cur = await page.locator(".ga-txt").allInnerTexts();
    const from = cur.indexOf(correct[target]);
    if (from === target) continue;
    if (target % 2 === 0) { // сүйреу
      const dt = await page.evaluateHandle(() => new DataTransfer());
      await page.locator(".ga-step").nth(from).dispatchEvent("dragstart", { dataTransfer: dt });
      await page.locator(".ga-step").nth(target).dispatchEvent("dragover", { dataTransfer: dt });
      await page.locator(".ga-step").nth(target).dispatchEvent("drop", { dataTransfer: dt });
    } else { // Shift+ArrowUp
      await page.locator(".ga-step").nth(from).focus();
      for (let k = from; k > target; k--) await page.keyboard.press("Shift+ArrowUp");
    }
  }
  expect(await page.locator(".ga-txt").allInnerTexts()).toEqual(correct);
  await page.click(".ga-check-btn");
  await expect(page.locator(".g-fb")).toContainText("Бәрі дұрыс");
  await expect(page.locator(".ga-step.ok")).toHaveCount(correct.length);
  expect(errs).toEqual([]);
});

test("қараңғы режим: ойындар оқылады, 390px айналусыз", async ({ page, context }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  page.setViewportSize({ width: 390, height: 800 });
  const errs = await open(page, context, "bughunt");
  await page.click(".ga-go");
  await noHScroll(page);
  const bg = await page.locator(".game-shell").evaluate((e) => getComputedStyle(e).backgroundColor);
  expect(bg).not.toBe("rgb(255, 255, 255)");
  expect(errs).toEqual([]);
});
