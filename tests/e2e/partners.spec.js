// © 2026 Sagid Mustafa. All Rights Reserved.
// Серіктестер беті мен іздеу жүйелеріне арналған schema.org деректері.
const { test, expect } = require("@playwright/test");
const { blockFonts, collectErrors } = require("../support/helpers");

const lds = (page) => page.$$eval('script[type="application/ld+json"]', (ns) => ns.map((n) => JSON.parse(n.textContent)));

test("серіктестер беті: метрикалар build-тен толады, салыстыру, IP бөлімі, байланыс", async ({ page }) => {
  await blockFonts(page.context());
  const errs = collectErrors(page);
  await page.goto("partners.html");
  const nums = await page.locator(".inv-stats b").allTextContents();
  expect(nums).toHaveLength(6);
  for (const n of nums) expect(+n).toBeGreaterThan(0);
  await expect(page.locator(".inv-cmp tbody tr")).toHaveCount(7);
  await expect(page.locator(".inv-own")).toContainText("барлық құқық қорғалған");
  await expect(page.locator(".inv-cc")).toContainText("CC BY-NC-SA 4.0");
  await expect(page.locator(".inv-cta .inv-form")).toBeVisible();
  await expect(page.locator('.footer a[href="partners.html"]')).toHaveCount(1);
  expect(errs).toEqual([]);
});

test("серіктестер беті телефонда: кесте карточкаға айналады, көлденең жылжу жоқ", async ({ page }) => {
  await blockFonts(page.context());
  await page.setViewportSize({ width: 360, height: 760 });
  await page.goto("partners.html");
  await expect(page.locator(".inv-cmp thead")).toHaveCSS("position", "absolute");
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
});

test("schema.org: басты бетте WebSite, курс беттерінде Course (тегін, қазақша)", async ({ page }) => {
  await page.goto("index.html");
  expect((await lds(page)).some((d) => d["@type"] === "WebSite" && d.publisher["@type"] === "Organization")).toBe(true);
  for (const c of ["math", "python", "en"]) {
    await page.goto(`${c}/index.html`);
    const course = (await lds(page)).find((d) => d["@type"] === "Course");
    expect(course, c).toBeTruthy();
    expect(course.inLanguage).toBe("kk");
    expect(course.offers.price).toBe(0);
    expect(course.provider.name).toBe("AO17");
    expect(!!course.isBasedOn).toBe(c === "python");
  }
});

test("өнімділік: басты бет тест банкін (quiz.js) «Күннің сұрағы» жақындағанда ғана жүктейді", async ({ page }) => {
  await blockFonts(page.context());
  const got = [];
  page.on("request", (r) => r.url().includes("assets/data/quiz.js") && got.push(r.url()));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("index.html");
  await page.waitForTimeout(1500);
  expect(got).toHaveLength(0);
  await page.locator(".dash-grid").scrollIntoViewIfNeeded();
  await expect(page.locator(".daily-card .daily-q .mq-opts button").first()).toBeVisible({ timeout: 10000 });
  expect(got.length).toBeGreaterThan(0);
});

test("ашық метрикалар: түпнұсқадан тыс жерде санақ жібермейді, бет түсіндіреді, санақты өшіруге болады", async ({ page }) => {
  await blockFonts(page.context());
  const errs = collectErrors(page);
  const sent = [];
  page.on("request", (r) => /supabase\.co/.test(r.url()) && sent.push(r.url()));
  for (const u of ["index.html", "python/lectures/week-1.html", "metrics.html"]) { await page.goto(u); await page.waitForTimeout(1800); }
  expect(sent).toEqual([]);
  await expect(page.locator(".om-state")).toContainText("түпнұсқа мекенжайында");
  await expect(page.locator(".om-opt-state")).toContainText("санақ жүрмейді");
  await page.click(".om-toggle");
  await expect(page.locator(".om-opt-state")).toContainText("өшірулі");
  expect(await page.evaluate(() => localStorage.getItem("cs50kz:noanalytics"))).toBe("1");
  await page.click(".om-toggle");
  expect(await page.evaluate(() => localStorage.getItem("cs50kz:noanalytics"))).toBeNull();
  expect(errs).toEqual([]);
});

test("пилот өтінімі: бос форма жіберілмейді, толтырылғаны cs50kz_feedback_send-ке pilot түрімен кетеді", async ({ page }) => {
  await blockFonts(page.context());
  let body = null;
  await page.route(/supabase\.co\/rest\/v1\/rpc\/cs50kz_feedback_send/, (r) => { body = JSON.parse(r.request().postData()); r.fulfill({ status: 200, contentType: "application/json", body: '{"id":1}', headers: { "access-control-allow-origin": "*" } }); });
  await page.goto("partners.html");
  await page.click('.inv-form button[type="submit"]');
  await expect(page.locator(".inv-result")).toContainText("толтырыңыз");
  await expect(page.locator('.inv-form [name="org"]')).toHaveAttribute("aria-invalid", "true");
  expect(page.url()).not.toContain("contact=");
  await page.fill('[name="org"]', "Мектеп");
  await page.fill('[name="contact"]', "+7 700 000 0000");
  await page.click('.inv-form button[type="submit"]');
  await expect(page.locator(".inv-result")).toContainText("Өтінім жіберілді");
  expect(body.p_kind).toBe("pilot");
  expect(body.p_quote).toBe("Мектеп");
  expect(body.p_message).toContain("+7 700 000 0000");
  expect(page.url()).not.toContain("contact=");
});

test("басты бет: hero сандары, «Өзің жазып көр» тірі редакторы, мұғалім сахнасы", async ({ page }) => {
  await blockFonts(page.context());
  const errs = collectErrors(page);
  await page.goto("index.html");
  const proof = page.locator(".st-proof > div");
  await expect(proof).toHaveCount(5);
  expect(+(await proof.nth(1).locator("b").textContent())).toBeGreaterThan(200);
  await page.locator("#scene-code").scrollIntoViewIfNeeded();
  await page.click(".axc-try");
  const ta = page.locator(".axc-input");
  await expect(ta).toBeFocused();
  await ta.fill("<h1>Сынақ</h1><script>parent.document.title='x'</script>");
  await expect(page.frameLocator(".axc-frame").locator("h1")).toHaveText("Сынақ");
  await expect(page.locator(".axc-frame")).toHaveAttribute("sandbox", "");
  expect(await page.title()).not.toBe("x");
  await page.locator("#teachers").scrollIntoViewIfNeeded();
  await expect(page.locator("#teachers .tb-table tbody tr")).toHaveCount(6);
  await expect(page.locator("#teachers .tb-demo")).toHaveText("Демо деректер");
  await expect(page.locator('#teachers a[href="partners.html#contact"]')).toBeVisible();
  for (const w of [320, 390]) { await page.setViewportSize({ width: w, height: 800 }); expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0); }
  expect(errs).toEqual([]);
});

test("курс карточкалары: әр курстың тапсырма саны көрінеді (C++ мен Java «1 жоба» емес)", async ({ page }) => {
  await blockFonts(page.context());
  await page.goto("courses.html");
  for (const c of ["x", "python", "sql", "ai", "web", "cpp", "java", "en", "math"]) {
    const t = await page.locator(`.cx-card[data-course="${c}"] .cx-foot span`).first().textContent();
    const n = +(t.match(/(\d+) тапсырма/) || [])[1];
    expect(n, `${c}: ${t}`).toBeGreaterThan(10);
  }
});

test("ашылу сәті: шаңырақ сызылып күнге ұшады, сессияда бір рет; шапка мөлдір, сахнадан өткенде қалыпты", async ({ page }) => {
  await blockFonts(page.context());
  const errs = collectErrors(page);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("index.html");
  await expect(page.locator(".st-intro .si-mark")).toBeVisible();
  await expect(page.locator(".st-intro.si-fly")).toHaveCount(1, { timeout: 5000 });
  const fs = await page.locator(".st-intro").evaluate((n) => +n.style.getPropertyValue("--fs"));
  expect(fs).toBeGreaterThan(0.2);
  await expect(page.locator(".st-s1.si-landed")).toHaveCount(1, { timeout: 3000 });
  // шапка сахна үстінде мөлдір, мәтіні ақ
  expect(await page.locator(".topbar").evaluate((n) => getComputedStyle(n).backgroundColor)).toBe("rgba(0, 0, 0, 0)");
  await page.mouse.wheel(0, 1400);
  await expect(page.locator("html.tb-solid")).toHaveCount(1);
  // қайта ашқанда кіріспе жоқ, мәтін бірден
  await page.reload();
  await expect(page.locator("html.st-seen")).toHaveCount(1);
  await expect(page.locator(".st-intro")).toBeHidden();
  await expect(page.locator(".st-s1 h1")).toBeVisible();
  expect(errs).toEqual([]);
});

test("бренд: телефонда (сенсорлы) «AO17» толық көрінеді", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  await blockFonts(ctx);
  const page = await ctx.newPage();
  for (const u of ["index.html", "math/lectures/week-0.html", "partners.html"]) {
    await page.goto(u);
    await expect(page.locator(".topbar .brand")).toHaveText(/^AO\s*17$/);
    await expect(page.locator(".topbar .brand span")).toBeVisible();
  }
  await ctx.close();
});
