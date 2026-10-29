// © 2026 Sagid Mustafa. All Rights Reserved.
// «АЛАШ 1917» қозғалыс жүйесі: беттер арасындағы өту грамматикасы (Level B), микро-интеракциялар (Level C),
// Алаш мұрағаты (Level A), Дизайн 5.0 токендері. Анимация бар-жоғы емес, оның дұрыс маршрутқа түсетіні тексеріледі.
const { test, expect } = require("@playwright/test");
const { blockFonts, collectErrors } = require("../support/helpers");

// Өтудің түрін (pagereveal-да қосылған viewTransition.types) әр бетте жазып отырамыз
async function recordTransitions(ctx) {
  await ctx.addInitScript(() => {
    addEventListener("pagereveal", (e) => {
      try { sessionStorage; } catch (er) { return; }
      const rec = JSON.parse(sessionStorage.getItem("t:vt") || "[]");
      const save = (skipped) => {
        const names = [...document.querySelectorAll("[style*='view-transition-name']")].map((n) => n.style.viewTransitionName);
        rec.push({ p: location.pathname.split("/").slice(-2).join("/"), t: e.viewTransition ? [...e.viewTransition.types] : null, names, skipped });
        sessionStorage.setItem("t:vt", JSON.stringify(rec));
      };
      // ready - псевдо-элементтер құрылған сәт: атаулар әлі тұр (finished-те тазаланады)
      if (e.viewTransition) e.viewTransition.ready.then(() => save(false), () => save(true));
      else setTimeout(() => save(true), 0);
    });
  });
}
const lastVt = (page) => page.evaluate(() => JSON.parse(sessionStorage.getItem("t:vt") || "[]").slice(-1)[0]);

test("маршрут грамматикасы: әр өтудің мағынасы бар (тереңге, кері, парақ, академия, құрал, мұрағат, шаңырақ)", async ({ page }) => {
  await blockFonts(page.context());
  await page.goto("index.html");
  const kinds = await page.evaluate(() => {
    const k = (a, b) => AO17Motion.routeKind(a, b);
    return {
      homeToHub: k("index.html", "programming.html"),
      hubToCourse: k("programming.html", "python/"),
      courseToLesson: k("python/index.html", "python/lectures/week-2.html"),
      lessonNext: k("python/lectures/week-2.html", "python/lectures/week-3.html"),
      lessonPrev: k("python/lectures/week-3.html", "python/lectures/week-2.html"),
      lessonToCourse: k("math/lectures/week-4.html", "math/index.html"),
      lessonOtherCourse: k("cpp/lectures/week-1.html", "java/lectures/week-1.html"),
      enToMath: k("en/index.html", "math/index.html"),
      mathToEn: k("math/index.html", "en/index.html"),
      tools: k("games.html", "practice.html"),
      toolsBack: k("practice.html", "games.html"),
      archive: k("practice.html", "alash.html"),
      toHome: k("cpp/lectures/week-3.html", "index.html"),
      sameAnchor: k("glossary.html", "glossary.html#a"),
      outside: k("glossary.html", "https://cs50.harvard.edu/x/"),
    };
  });
  expect(kinds).toEqual({
    homeToHub: "iris", hubToCourse: "dive", courseToLesson: "dive", lessonNext: "page-f", lessonPrev: "page-b",
    lessonToCourse: "rise", lessonOtherCourse: "side-f", enToMath: "cross-f", mathToEn: "cross-b",
    tools: "side-b", toolsBack: "side-f", archive: "archive", toHome: "home", sameAnchor: null, outside: null,
  });
});

test("нақты беттер арасында: карточка тақырыпқа айналады, сабақ парақталады, «артқа» кері ойнайды; қате жоқ", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await blockFonts(ctx);
  await recordTransitions(ctx);
  const page = await ctx.newPage();
  const errs = collectErrors(page);
  await page.goto("programming.html");
  // Браузер өтуді жүргізген әр жағдайда түрі дұрыс болуы керек (жүктеме тым ауыр болса Chromium өтуді өткізіп жібере алады)
  const expectKind = async (p, kind, names) => {
    await expect.poll(async () => ((await lastVt(page)) || {}).p).toBe(p);
    const r = await lastVt(page);
    if (r.t === null) return;
    expect(r.t, p).toEqual([kind]);
    if (names && !r.skipped) expect(r.names, p).toEqual(expect.arrayContaining(names));
  };
  await page.locator('a[href="python/"]').first().click();
  await expect(page).toHaveURL(/python\/$/);
  await expectKind("python/", "dive", ["ao-hero"]);
  await page.goto("python/lectures/week-1.html");
  await page.locator(".pager a.next").click();
  await expect(page).toHaveURL(/week-2\.html$/);
  await expectKind("lectures/week-2.html", "page-f");
  await page.goBack();
  await expect(page).toHaveURL(/week-1\.html$/);
  await expectKind("lectures/week-1.html", "page-b");
  // өтуден кейін уақытша атаулар тазаланады (келесі өтуде қайталанбасын)
  await expect.poll(() => page.evaluate(() => document.querySelectorAll("[style*='view-transition-name']").length), { timeout: 3000 }).toBe(0);
  expect(errs).toEqual([]);
  await ctx.close();
});

test("қозғалыс азайтылса: беттер арасындағы өту өткізіледі, ортақ элемент аталмайды", async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: "reduce" });
  await blockFonts(ctx);
  await recordTransitions(ctx);
  const page = await ctx.newPage();
  await page.goto("programming.html");
  await page.locator('a[href="python/"]').first().click();
  await expect(page).toHaveURL(/python\/$/);
  await expect.poll(() => lastVt(page)).toMatchObject({ names: [] });
  expect((await lastVt(page)).t || []).not.toContain("dive");
  await ctx.close();
});

test("Алаш мұрағаты: карточка құжатқа жақындайды, сурет дерегі көрсетіледі, Esc жабады, фокус батырмаға оралады", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await blockFonts(ctx);
  const page = await ctx.newPage();
  const errs = collectErrors(page);
  await page.goto("alash.html");
  await expect(page.locator(".al-open")).toHaveCount(12);
  const open = page.locator(".al-open").nth(1);
  await open.click();
  const doc = page.locator("dialog.al-doc");
  await expect(doc).toBeVisible();
  await expect(doc.locator("h2")).toHaveText("Ахмет Байтұрсынұлы");
  await expect(doc.locator(".ad-mast")).toContainText("AO17 мұрағат карточкасы");
  await expect(doc.locator(".ad-src")).toContainText("Wikimedia Commons");
  await expect(doc.locator("blockquote").first()).toBeVisible();
  await expect(doc.locator(".ad-close")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(doc).toHaveCount(0);
  await expect(open).toBeFocused();
  // фонды басу да жабады
  await open.click();
  await expect(doc).toBeVisible();
  await page.mouse.click(8, 400);
  await expect(doc).toHaveCount(0);
  expect(errs).toEqual([]);
  await ctx.close();
});

test("микро-интеракциялар: қате жауап шайқалады, дұрысы мөрдей басылады; батырма басқанда батады", async ({ page }) => {
  await blockFonts(page.context());
  const errs = collectErrors(page);
  await page.goto("lectures/week-0.html");
  const q = page.locator(".quiz .question").first();
  const ans = await q.getAttribute("data-answer");
  const wrong = q.locator(`input:not([value="${ans}"])`).first();
  await wrong.check();
  const quiz = page.locator(".quiz").first();
  await quiz.locator(".quiz-check").click();
  await expect(q.locator("label.wrong")).toHaveCount(1);
  expect(await q.locator("label.wrong").evaluate((n) => getComputedStyle(n).animationName)).toBe("c-shake");
  expect(await q.locator("label.correct").evaluate((n) => getComputedStyle(n).animationName)).toBe("c-stamp");
  // басу физикасы жеке transform қасиеттерімен (scale, translate): компоненттің өз transform-ы бұзылмайды
  const tp = await quiz.locator(".quiz-check").evaluate((n) => getComputedStyle(n).transitionProperty);
  expect(tp).toContain("scale");
  expect(tp).toContain("translate");
  expect(errs).toEqual([]);
});

test("Дизайн 5.0: Алаш палитрасы мен баспа әрпі барлық академияда; академия мінезі html[data-ac]", async ({ page }) => {
  await blockFonts(page.context());
  const cases = { "programming.html": "code", "python/lectures/week-1.html": "code", "en/index.html": "en", "en/lectures/week-2.html": "en", "math/lectures/week-3.html": "math", "alash.html": "core", "games.html": "code" };
  for (const [u, ac] of Object.entries(cases)) {
    await page.goto(u);
    await expect(page.locator("html"), u).toHaveAttribute("data-ac", ac);
    const st = await page.evaluate(() => ({ bg: getComputedStyle(document.body).backgroundColor, h1: getComputedStyle(document.querySelector("h1")).fontFamily }));
    expect(st.h1, u).toContain("PT Serif");
    expect(st.bg, u).not.toBe("rgb(255, 255, 255)");
  }
  // келесі бетті алдын ала жүктеу (тек prefetch, бет орындалмайды)
  const rules = await page.locator('script[type="speculationrules"]').textContent();
  expect(JSON.parse(rules).prefetch[0].eagerness).toBe("moderate");
  expect(rules).not.toContain("prerender");
});
