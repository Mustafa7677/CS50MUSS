// © 2026 Sagid Mustafa. All Rights Reserved.
// Академия фильмдері (film/code/, film/math/, film/en/): ортақ қозғалтқыш, финалдағы академияға кіру, телефон композициясы,
// қозғалыс азайту, академия бетінен фильмге сілтеме.
const { test, expect } = require("@playwright/test");
const { blockFonts, collectErrors } = require("../support/helpers");

const FILMS = [
  { dir: "code", page: "programming.html", go: "../../programming.html", fin: "#c4" },
  { dir: "math", page: "math/index.html", go: "../../math/", fin: "#m4" },
  { dir: "en", page: "en/index.html", go: "../../en/", fin: "#e4" },
];
const T = (page) => page.evaluate(() => window.AO17Film.t);

for (const f of FILMS) {
  test(`${f.dir}: өзі жүреді, перне келесі тарауға апарады, финалда академияға кіру`, async ({ page }) => {
    await blockFonts(page.context());
    const errs = collectErrors(page);
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(`film/${f.dir}/index.html`);
    await page.waitForFunction(() => window.AO17Film);
    await expect.poll(() => T(page)).toBeGreaterThan(.4);
    const n = await page.evaluate(() => window.AO17Film.scenes.length);
    expect(n).toBe(5);
    const end = await page.evaluate(() => window.AO17Film.END);
    expect(end).toBeGreaterThan(25);
    expect(end).toBeLessThan(45);
    await page.keyboard.press("ArrowRight");
    await expect.poll(() => T(page)).toBeGreaterThan(5);
    await page.click("#skip");
    await expect.poll(() => T(page)).toBeGreaterThan(end - 10);
    await expect(page.locator(`${f.fin} .cta a.go`)).toHaveAttribute("href", f.go);
    await expect(page.locator(`${f.fin} .cta a.go`)).toBeVisible();
    // әр сахнада дерек көзі не «көркем кадр» белгісі бар
    const src = await page.locator("#stage .sc").evaluateAll((s) => s.map((n) => n.dataset.src));
    src.forEach((v) => expect(v && v.length).toBeGreaterThan(3));
    expect(errs).toEqual([]);
  });

  test(`${f.dir}: телефон - тігінен, финал экранға сыяды, батырмалар ≥44px`, async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    await blockFonts(ctx);
    const page = await ctx.newPage();
    await page.goto(`film/${f.dir}/index.html`);
    await page.waitForFunction(() => window.AO17Film);
    await expect(page.locator("html")).toHaveClass(/portrait/);
    await page.evaluate(() => window.AO17Film.seek(window.AO17Film.END - .01));
    await page.waitForTimeout(300);
    const r = await page.evaluate((fin) => {
      const b = [...document.querySelectorAll(`${fin} .cta a`)].map((a) => a.getBoundingClientRect());
      return { over: document.documentElement.scrollWidth - innerWidth, left: Math.min(...b.map((x) => x.left)), right: Math.max(...b.map((x) => x.right)), bottom: Math.max(...b.map((x) => x.bottom)), minH: Math.min(...b.map((x) => x.height)), h: innerHeight };
    }, f.fin);
    expect(r.over).toBe(0);
    expect(r.left).toBeGreaterThanOrEqual(0);
    expect(r.right).toBeLessThanOrEqual(390);
    expect(r.bottom).toBeLessThan(r.h - 120);   // төменгі басқару жолағының үстінде
    expect(r.minH).toBeGreaterThanOrEqual(44);
    await ctx.close();
  });

  test(`${f.dir}: академия бетінде фильмге сілтеме бар`, async ({ page }) => {
    await blockFonts(page.context());
    await page.goto(f.page);
    const a = page.locator("a.ac-film");
    await expect(a).toHaveCount(1);
    await a.click();
    await page.waitForFunction(() => window.AO17Film);
    expect(page.url()).toContain(`/film/${f.dir}/`);
  });
}

test("қозғалыс азайтылса: академия фильмі өзі жүрмейді, камера қозғалмайды", async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: "reduce" });
  await blockFonts(ctx);
  const page = await ctx.newPage();
  await page.goto("film/math/index.html");
  await page.waitForFunction(() => window.AO17Film);
  await expect(page.locator("html")).toHaveClass(/still/);
  await page.waitForTimeout(1000);
  expect(await T(page)).toBe(0);
  await page.keyboard.press("ArrowRight");
  await expect.poll(() => T(page)).toBeGreaterThan(5);
  expect(await page.locator("#m1 .cam").evaluate((n) => getComputedStyle(n).transform)).toBe("none");
  await ctx.close();
});

test("«Әріптен кодқа»: Ә әрпінің коды мен байттары дұрыс", async ({ page }) => {
  await blockFonts(page.context());
  await page.goto("film/code/index.html");
  await expect(page.locator("#c1 .u")).toHaveText("Ә = U+04D8");
  const cp = "Ә".codePointAt(0);
  expect(cp).toBe(0x04D8);
  expect(await page.locator("#c1 .d").textContent()).toContain(String(cp));
  const bytes = [...new TextEncoder().encode("Ә")].map((b) => b.toString(2).padStart(8, "0")).join(" ");
  await expect(page.locator("#c1 .bits")).toHaveAttribute("aria-label", bytes);
  expect((await page.locator("#c1 .bits").textContent()).replace(/\s/g, "")).toBe(bytes.replace(/ /g, ""));
});

test("бүкіл жол: сайт → «Шақыру» → академия → оның прологы → біткен соң академия өзі ашылады; екінші рет фильм жоқ", async ({ page }) => {
  test.setTimeout(90000);
  await blockFonts(page.context());
  await page.addInitScript(() => Object.defineProperty(navigator, "webdriver", { get: () => false }));
  await page.goto("index.html");
  await page.waitForURL(/film\/\?intro=1/);
  await page.waitForFunction(() => window.AO17Film);
  await page.evaluate(() => window.AO17Film.seek(window.AO17Film.END - .01));
  await page.click("#s8 .w-math");
  await page.waitForURL(/film\/math\/\?intro=1/);                       // академияның прологы өзі ашылды
  await page.waitForFunction(() => window.AO17Film);
  await expect.poll(() => page.evaluate(() => window.AO17Film.t)).toBeGreaterThan(.3);   // өзі ойнайды
  await page.evaluate(() => window.AO17Film.seek(window.AO17Film.END - .2));
  await page.waitForURL(/\/math\/(index\.html)?$/, { timeout: 15000 });  // соңында академия өзі ашылады
  await page.waitForTimeout(400);
  expect(page.url()).not.toContain("film/");
  await page.goto("math/index.html");                                    // сол сеанста қайта кірсе - фильм жоқ
  await page.waitForTimeout(500);
  expect(page.url()).not.toContain("film/");
});

test("академия прологы: «Өткізу» бірден академияға; финалда әрекет етсе - өзі ауыспайды", async ({ page }) => {
  await blockFonts(page.context());
  await page.goto("film/code/index.html?intro=1");
  await page.waitForFunction(() => window.AO17Film);
  await page.click("#skip");
  await page.waitForURL(/programming\.html$/);
  await page.goto("film/en/index.html?intro=1");
  await page.waitForFunction(() => window.AO17Film);
  await page.evaluate(() => window.AO17Film.seek(window.AO17Film.END - .2));
  await expect(page.locator("html")).toHaveClass(/auto/, { timeout: 5000 });
  await page.mouse.click(30, 300);                                       // адам әрекет етті - таңдау соның қолында
  await expect(page.locator("html")).not.toHaveClass(/auto/);
  await page.waitForTimeout(4500);
  expect(page.url()).toContain("film/en/");
});
