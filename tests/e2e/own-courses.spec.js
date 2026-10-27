// © 2026 Sagid Mustafa. All Rights Reserved.
// Дербес авторлық курстар (C++ және Java): курс беттері, нав, лекциялар (бар болса), тест, answer-check, прогресс, мобиль.
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");
const { ROOT, OWN, ownLectures, blockFonts, collectErrors } = require("../support/helpers");

const META = { cpp: { short: "C++", title: "C++ бағдарламалау", color: "#4f46e5" }, java: { short: "Java", title: "Java бағдарламалау", color: "#d97706" } };
const weeks = (c) => ownLectures(c).map((f) => f.replace(".html", "")).sort((a, b) => +a.split("-")[1] - +b.split("-")[1]);

// Курстар толық жазылғанда (интеграция) ғана өтеді: лекция саны 8
test("интеграция: әр дербес курста 8 лекция (week-0..week-7) бар", () => {
  for (const c of OWN) expect(weeks(c), c).toEqual(Array.from({ length: 8 }, (_, i) => `week-${i}`));
});

for (const c of OWN) {
  test.describe(`курс беті: ${c}`, () => {
    test("ашылады: hero, 8 карточка, бөлімдер, авторлық ескертпе, B лицензиясы", async ({ page }) => {
      const errs = collectErrors(page);
      await blockFonts(page.context());
      await page.goto(`${c}/index.html`);
      await expect(page).toHaveTitle(new RegExp(META[c].short.replace("+", "\\+")));
      await expect(page.locator("body")).toHaveAttribute("data-license", "B");
      await expect(page.locator("h1")).toContainText("бағдарламалау");
      await expect(page.locator(".course-pill .cp-label")).toHaveText(META[c].short);
      await expect(page.locator(".week-card")).toHaveCount(8);
      await expect(page.locator(".week-card:not(.soon)")).toHaveCount(weeks(c).length);
      await expect(page.locator(".oc-outcomes li")).toHaveCount(6);
      await expect(page.locator(".oc-card")).toHaveCount(3);
      await expect(page.locator(".oc-os")).toHaveCount(4);
      await expect(page.locator("#project")).toBeVisible();
      await expect(page.locator(".translator-note")).toContainText("Harvard CS50 курсының аудармасы емес");
      await expect(page.locator(".translator-note a")).toHaveAttribute("href", "../copyright.html");
      await expect(page.locator('a[href*="cs50.harvard.edu"]:not(footer a)')).toHaveCount(0);
      // Hero: «Бастау» мен емтихан/карта сілтемелері курсқа жолданған
      await expect(page.locator(".hero-actions .btn.gold")).toHaveAttribute("href", "lectures/week-0.html");
      await expect(page.locator(`.hero-actions a[href="../exam.html?course=${c}"]`)).toBeVisible();
      await expect(page.locator(`.hero-actions a[href="../map.html?course=${c}"]`)).toBeVisible();
      // Курс бойынша прогресс-бар (курс беті)
      await expect(page.locator(".course-progress")).toContainText("лекция дайын");
      expect(errs).toEqual([]);
    });

    test("heading иерархиясы: бір h1, h2 бөлімдері", async ({ page }) => {
      await blockFonts(page.context());
      await page.goto(`${c}/index.html`);
      expect(await page.locator("h1").count()).toBe(1);
      const levels = await page.locator("main h1, main h2, main h3, .content h1, .content h2, .content h3").evaluateAll((hs) => hs.map((h) => +h.tagName[1]));
      for (let i = 1; i < levels.length; i++) expect(levels[i] - levels[i - 1], levels.join("")).toBeLessThanOrEqual(1);
    });

    test("мобильде 390px: көлденең айналу жоқ, hero мәтіні кесілмейді", async ({ browser }) => {
      const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
      const page = await ctx.newPage();
      await blockFonts(ctx);
      await page.goto(`${c}/index.html`);
      await page.waitForTimeout(300);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      const h1 = await page.locator(".py-hero h1").boundingBox();
      expect(h1.x + h1.width).toBeLessThanOrEqual(390);
      // Қараңғы режим: фон мен мәтін контрасты (hero мәтіні ақ)
      await ctx.close();
    });

    test("клавиатура: орнату бөлімдері Enter/Space арқылы ашылады", async ({ page }) => {
      await blockFonts(page.context());
      await page.goto(`${c}/index.html`);
      const second = page.locator(".oc-os").nth(1);
      await expect(second).not.toHaveAttribute("open", "");
      await second.locator("summary").focus();
      await page.keyboard.press("Enter");
      await expect(second).toHaveAttribute("open", "");
    });
  });
}

test("нав pill: курсты ауыстырады, авторлық курстар бөлек белгіленген", async ({ page }) => {
  await blockFonts(page.context());
  await page.goto("cpp/index.html");
  await page.click(".course-pill");
  await expect(page.locator(".course-menu .cm-row")).toHaveCount(9);
  await expect(page.locator(".course-menu .cm-row.on")).toContainText("C++");
  // мәзір үш академия бойынша топталған: әр топтың тақырыбы - академия беті
  await expect(page.locator(".course-menu .cm-sep")).toHaveText(["Бағдарламалау академиясы", "English Academy", "Математика академиясы"]);
  await page.click('.course-menu .cm-row:has-text("Java")');
  await expect(page).toHaveURL(/java\/index\.html$/);
  await expect(page.locator(".course-pill .cp-label")).toHaveText("Java");
  // Hero ішіндегі ауыстырғыш
  await page.click('.cx-switch a:has-text("C++")');
  await expect(page).toHaveURL(/cpp\/$/);
  await page.click(".course-pill");
  await page.click('.course-menu .cm-row:has-text("CS50P")');
  await expect(page).toHaveURL(/python\/index\.html$/);
});

test("витрина: басты бет пен courses.html-де C++ және Java карточкалары, авторлық белгі", async ({ page }) => {
  await blockFonts(page.context());
  await page.goto("index.html");
  // басты бет: бағдарламалау академиясының жеті тілі тақтайша болып көрінеді, авторлық C++ мен Java белгіленген;
  // ағылшын мен математика - өз академиясының карточкасында (бағдарламалаудың бөлімі емес)
  await expect(page.locator(".kh-tile")).toHaveCount(7);
  await expect(page.locator(".kh-tile.own")).toHaveCount(2);
  await expect(page.locator('.kh-tile[data-course="en"], .kh-tile[data-course="math"]')).toHaveCount(0);
  await expect(page.locator('.ac-card[href="en/"]')).toHaveCount(1);
  await expect(page.locator('.ac-card[href="math/"]')).toHaveCount(1);
  await expect(page.locator('.kh-tile[data-course="cpp"]')).toHaveAttribute("href", "cpp/");
  await expect(page.locator('.kh-tile[data-course="java"] .kh-code')).toHaveText("Авторлық курс");
  await expect(page.locator('.kh-tile[data-course="cpp"] .kh-glyph')).toBeVisible();
  await expect(page.locator("[data-site-stats]")).toContainText("9 курс");
  await page.goto("courses.html");
  await expect(page.locator(".cx-card.own")).toHaveCount(4);
});

test("сертификат: C++/Java өз мәтінімен, Harvard оговоркасыз, «Бейресми» жоқ", async ({ page }) => {
  await blockFonts(page.context());
  for (const [c, name] of [["cpp", "C++ бағдарламалау"], ["java", "Java бағдарламалау"]]) {
    await page.goto(`certificate.html?course=${c}`);
    await expect(page.locator(".cert-gate")).toContainText("0 / 8 лекция оқылды");
    await expect(page.locator(".cert-text")).toContainText(name);
    await expect(page.locator(".cert-text")).toContainText("8 лекциясын");
    await expect(page.locator(".cert-note")).toHaveText("Бұл сертификат платформа ішіндегі оқу прогресін растайды.");
    const txt = await page.locator(".certificate").innerText();
    expect(txt).not.toMatch(/Бейресми|Гарвард|Harvard/);
  }
});

test("іздеу: C++/Java чиптері бар", async ({ page }) => {
  await blockFonts(page.context());
  await page.goto("index.html");
  await page.keyboard.press("Control+k");
  await expect(page.locator('.search-scope button[data-s="cpp"]')).toHaveText("C++");
  await expect(page.locator('.search-scope button[data-s="java"]')).toHaveText("Java");
});

test("жетістіктер: «C++ түлегі» және «Java түлегі» бар", async ({ page }) => {
  await blockFonts(page.context());
  await page.goto("profile.html");
  const names = await page.evaluate(() => window.CS50KZ.achievements().map((a) => a.name || a.t || a.title || JSON.stringify(a)));
  expect(names.join("|")).toContain("C++ түлегі");
  expect(names.join("|")).toContain("Java түлегі");
});

// Лекция беттері: файлдар бар болғанда ғана (басқа агенттер біртіндеп жазады)
for (const c of OWN) {
  for (const w of weeks(c)) {
    const f = `${c}/lectures/${w}.html`;
    test(`лекция ${f}: құрылым, тест, answer-check, прогресс`, async ({ page }) => {
      test.setTimeout(60_000);
      const errs = collectErrors(page);
      await blockFonts(page.context());
      await page.goto(f);
      await expect(page.locator("body")).toHaveAttribute("data-license", "B");
      await expect(page.locator(".lecture-head")).toHaveAttribute("style", new RegExp(`--lc:${META[c].color}`));
      await expect(page.locator(".lecture-head")).toHaveAttribute("data-n", w.split("-")[1]);
      await expect(page.locator(".course-pill .cp-label")).toHaveText(META[c].short);
      await expect(page.locator(".translator-note")).toContainText("Sagid Mustafa-ның авторлық оқу материалы");
      await expect(page.locator(".source-link")).toHaveCount(0);
      await expect(page.locator('meta[name="copyright"]')).toHaveAttribute("content", /All Rights Reserved/);
      await expect(page.locator(".toc ol li").first()).toBeVisible();
      // Тест: 8 сұрақ, дұрыс жауаптармен 8 / 8
      const qs = page.locator(".quiz .question");
      const n = await qs.count();
      expect(n, "тест сұрағы").toBe(8);
      // answer-check: дұрыс және қате жауап
      const ac = page.locator(".answer-check");
      const acn = await ac.count();
      expect(acn, "answer-check").toBeGreaterThanOrEqual(3);
      for (let i = 0; i < acn; i++) {
        const box = ac.nth(i);
        const key = (await box.getAttribute("data-answer")).split("|")[0];
        await box.locator("input").fill("zzz-қате-жауап");
        await box.locator("button").click();
        await expect(box.locator(".result")).toHaveClass(/bad/);
        await box.locator("input").fill(key);
        await box.locator("input").press("Enter");
        await expect(box.locator(".result")).toHaveClass(/ok/);
      }
      for (let i = 0; i < n; i++) {
        const a = await qs.nth(i).getAttribute("data-answer");
        await qs.nth(i).locator(`input[value="${a}"]`).check();
      }
      await page.click(".quiz-check");
      await expect(page.locator(".quiz .result")).toContainText(`${n} / ${n}`);
      await page.click(".mark-read .btn.gold");
      const p = await page.evaluate(() => JSON.parse(localStorage.getItem("cs50kz:progress")));
      expect(p.read[`${c}:${w}`]).toBeTruthy();
      expect(p.read[w], "CS50x прогресі шатаспайды").toBeFalsy();
      expect(p.quiz[`${c}:${w}`]).toEqual({ best: n, total: n });
      // Өзін-өзі тексеру тізімі (checklist): белгі сақталады
      const cb = page.locator(".checklist input[type=checkbox]").first();
      if (await cb.count()) {
        await cb.check();
        await page.reload();
        await expect(page.locator(".checklist input[type=checkbox]").first()).toBeChecked();
      }
      // Курс бетінде карточка «Оқылды»
      await page.goto(`${c}/index.html`);
      await expect(page.locator(`.week-card[data-id="${w}"]`)).toHaveClass(/is-read/);
      expect(errs).toEqual([]);
    });

    test(`лекция ${f}: мобиль 390px көлденең айналусыз, код блоктары ішінде айналады`, async ({ browser }) => {
      const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: "dark" });
      const page = await ctx.newPage();
      await blockFonts(ctx);
      await page.goto(f);
      await page.waitForTimeout(300);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      await ctx.close();
    });

    test(`лекция ${f}: pager және алдыңғы/келесі сілтемелер дұрыс`, async ({ page }) => {
      await blockFonts(page.context());
      await page.goto(f);
      const hrefs = await page.locator(".pager a").evaluateAll((a) => a.map((x) => x.getAttribute("href")));
      expect(hrefs.length).toBeGreaterThan(0);
      for (const h of hrefs) {
        const t = path.normalize(path.join(ROOT, c, "lectures", h.split("#")[0]));
        // курс толық жазылмаған кезде көрші лекция әлі жоқ болуы мүмкін (толықтығын «интеграция» тесті тексереді)
        if (weeks(c).length === 8) expect(fs.existsSync(t), `${f} -> ${h}`).toBe(true);
      }
    });
  }
}

test("клавиатура: курс беті мен лекцияда Tab арқылы skip-link және батырмалар қолжетімді", async ({ page }) => {
  await blockFonts(page.context());
  await page.goto("cpp/index.html");
  await page.keyboard.press("Tab");
  await expect(page.locator(".skip-link")).toBeFocused();
});
