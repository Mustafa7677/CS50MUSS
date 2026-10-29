// © 2026 Sagid Mustafa. All Rights Reserved.
// «Үш әлем» жүйесі: академияға кіру порталы, басты беттің алтын жібі, компас, бағдарламалау курстарының шоқжұлдызы.
const { test, expect } = require("@playwright/test");
const { blockFonts, collectErrors } = require("../support/helpers");

test("портал: академия карточкасы экранға жайылып, сол академияның әлеміне айналады, сосын бет ауысады", async ({ page }) => {
  await blockFonts(page.context());
  const errs = collectErrors(page);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("index.html");
  await page.locator("#academies .ac-card").last().scrollIntoViewIfNeeded();
  await expect(page.locator(".ac-card.is-open")).toHaveCount(3, { timeout: 8000 });
  // үлкейіп кеткен шаңырақ карточканы басуға кедергі емес
  // Портал 760 мс тұрады да бет ауысады: баяу машинада тексеріс кеш қалмас үшін оны пайда болған сәтте ұстаймыз
  const seen = page.evaluate(() => new Promise((ok) => new MutationObserver((_, o) => {
    const t = document.querySelector(".tx .tx-title");
    if (t) { o.disconnect(); ok([document.querySelector(".tx").className, t.textContent]); }
  }).observe(document.body, { childList: true })));
  await page.click('.ac-card[href="math/"]');
  const [cls, title] = await seen;
  expect(cls).toContain("tx-math");
  expect(title).toBe("Математика академиясы");
  await page.waitForURL(/math\/$/);
  expect(errs).toEqual([]);
});

test("портал: қозғалыс азайтылса - әдеттегі сілтеме, бірден ауысады", async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: "reduce" });
  await blockFonts(ctx);
  const page = await ctx.newPage();
  await page.goto("index.html");
  await page.click('.ax-en .btn[data-portal="en"]');
  await page.waitForURL(/en\/$/);
  await ctx.close();
});

test("алтын жіп: басты бетте жеті түйін, скролл жіпті толтырады, соңғы түйін - прогресс", async ({ page }) => {
  await blockFonts(page.context());
  await page.addInitScript(() => localStorage.setItem("cs50kz:progress", JSON.stringify({ read: { "python:week-0": 1, "math:week-0": 1 } })));
  await page.setViewportSize({ width: 1440, height: 860 });
  await page.goto("index.html");
  await expect(page.locator(".gt li")).toHaveCount(7);
  await expect(page.locator(".gt li").last()).toContainText("2/");
  // 07 «Сенің саяхатың»: жол прогреспен толады, батырма - ең алға кеткен академияға
  await expect(page.locator('.jr-legend li[data-ac="math"] b')).toHaveText("1/162");
  await expect(page.locator(".jr-go")).toContainText("Жалғастыру:");
  const f0 = await page.locator(".gt").evaluate((n) => +getComputedStyle(n).getPropertyValue("--f"));
  await page.locator("#scene-math").scrollIntoViewIfNeeded();
  await expect.poll(() => page.locator(".gt").evaluate((n) => +n.style.getPropertyValue("--f"))).toBeGreaterThan(f0 + 0.5);
  await expect(page.locator('.gt li[aria-current] a')).toHaveAttribute("href", "#scene-math");
  // телефонда жіп жоқ
  await page.setViewportSize({ width: 390, height: 800 });
  await expect(page.locator(".gt")).toBeHidden();
});

test("компас: қайда тұрғаныңды көрсетеді, үш академияның прогресі, Esc жабады; басты бетте жоқ", async ({ page }) => {
  await blockFonts(page.context());
  const errs = collectErrors(page);
  await page.addInitScript(() => localStorage.setItem("cs50kz:progress", JSON.stringify({ read: { "math:week-0": 1, "math:week-1": 1 } })));
  await page.goto("math/lectures/week-41.html");
  const btn = page.locator(".compass");
  await expect(btn).toHaveAttribute("aria-expanded", "false");
  await btn.click();
  await expect(btn).toHaveAttribute("aria-expanded", "true");
  const panel = page.locator("#compass-panel");
  await expect(panel).toBeVisible();
  await expect(panel.locator(".cp-here")).toContainText("Математика академиясы");
  await expect(panel.locator(".cp-here")).toContainText("Екі еселі интеграл");
  await expect(panel.locator(".cp-acs li")).toHaveCount(3);
  await expect(panel.locator(".cp-acs li.is-here")).toContainText("2/162");
  await page.keyboard.press("Escape");
  await expect(panel).toBeHidden();
  await expect(btn).toBeFocused();
  await page.goto("index.html");
  await expect(page.locator(".compass")).toHaveCount(0);
  expect(errs).toEqual([]);
});

test("шоқжұлдыз: жеті курс жұлдыз; Python-ға апарса байланыстылары жанады, мақсат таңдалса маршрут жанады", async ({ page }) => {
  await blockFonts(page.context());
  const errs = collectErrors(page);
  await page.addInitScript(() => localStorage.removeItem("cs50kz:pa-goal"));
  await page.goto("programming.html");
  const stars = page.locator(".kc a[data-k]");
  await expect(stars).toHaveCount(7);
  await page.locator('.kc a[data-k="python"]').hover();
  await expect(page.locator('.kc a[data-k="python"]')).toHaveClass(/is-hot/);
  for (const k of ["sql", "ai", "web", "x"]) await expect(page.locator(`.kc a[data-k="${k}"]`)).toHaveClass(/is-near/);
  await expect(page.locator('.kc a[data-k="java"]')).not.toHaveClass(/is-near|is-hot/);
  await page.mouse.move(2, 2);
  await page.click('.pa-goal[data-goal="ai"]');
  await expect(page.locator(".kc a.is-hot")).toHaveCount(2);
  await page.locator('.kc a[data-k="sql"]').click();
  await expect(page).toHaveURL(/#t-sql$/);
  expect(errs).toEqual([]);
});

test("басты бет: «1917, баспахананың түні» - шаңырақ, жарық бағаны, «Қазақ» газеті; мультфильм жоқ; ешбір экранда көлденең жылжу жоқ", async ({ browser }) => {
  for (const [w, h] of [[320, 640], [390, 844], [768, 1024], [1280, 800]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: "reduce" });
    await blockFonts(ctx);
    const page = await ctx.newPage();
    await page.goto("index.html");
    await expect(page.locator(".st-s1 .st-art17")).toBeVisible();
    await expect(page.locator(".st-s1 .s17-mast")).toHaveText("ҚАЗАҚ");
    await expect(page.locator(".st-s1 .s17-uyk path")).toHaveCount(36);
    await expect(page.locator(".bota, .walker, .st-say, .eagle")).toHaveCount(0);
    // шаңырақ (жарық көзі) экранда көрінеді: телефонда да кадрдан шықпайды
    const r = await page.evaluate(() => { const b = document.querySelector(".st-s1 .s17-ring").getBoundingClientRect(); return { l: b.left, r: b.right, over: document.documentElement.scrollWidth - innerWidth }; });
    expect(r.l, `${w}px: шаңырақ сол жақтан`).toBeGreaterThanOrEqual(-r.r + r.l);
    expect(r.r, `${w}px: шаңырақ кадрда`).toBeGreaterThan(0);
    expect(r.l, `${w}px: шаңырақ кадрда`).toBeLessThan(w);
    expect(r.over, `${w}px: көлденең жылжу`).toBe(0);
    await ctx.close();
  }
});

test("өтулер: код пен ағылшын сахналары; келгенде пластина ериді; артқа қайтқанда кадр кері жиналады", async ({ page }) => {
  test.setTimeout(90_000);
  await blockFonts(page.context());
  const errs = collectErrors(page);
  await page.setViewportSize({ width: 1280, height: 800 });
  for (const [k, url, need] of [["code", /programming\.html$/, "<AO17 />"], ["en", /en\/$/, "Dear reader,"]]) {
    await page.goto("index.html");
    await page.locator("#academies .ac-card").last().scrollIntoViewIfNeeded();
    await expect(page.locator(".ac-card.is-open")).toHaveCount(3, { timeout: 8000 });
    // сахна қажетті трансформацияға жеткенде (газет атауы кодқа / хат ағылшынға) ұстаймыз
    const seen = page.evaluate((need) => new Promise((ok) => {
      const tick = () => { const t = document.querySelector(".tx"); if (t && t.textContent.includes(need)) ok(t.className); else requestAnimationFrame(tick); };
      tick();
    }), need);
    await page.click(`.ac-card[data-portal="${k}"]`);
    expect(await seen).toContain("tx-" + k);
    await page.waitForURL(url);
    // келу пластинасы 1.6 с ішінде міндетті түрде ериді
    await expect.poll(() => page.evaluate(() => document.documentElement.classList.contains("tx-in")), { timeout: 3000 }).toBe(false);
    expect(await page.evaluate(() => JSON.parse(sessionStorage.getItem("ao17:portal")).k)).toBe(k);
  }
  await page.goBack();
  await page.waitForURL(/index\.html$/);
  await expect(page.locator(".tx")).toHaveCount(0, { timeout: 3000 });
  expect(errs).toEqual([]);
});

test("сабақтан сабаққа: келесі/алдыңғы - қатесіз, жылдам (камера өтуі тек браузердің View Transitions-ы)", async ({ page }) => {
  await blockFonts(page.context());
  const errs = collectErrors(page);
  await page.goto("lectures/week-1.html");
  const t0 = Date.now();
  await page.locator(".pager a.next").click();
  await page.waitForURL(/week-2\.html$/);
  expect(Date.now() - t0).toBeLessThan(4000);
  await page.locator(".pager a").first().click();
  await page.waitForURL(/week-1\.html$/);
  expect(errs).toEqual([]);
});
