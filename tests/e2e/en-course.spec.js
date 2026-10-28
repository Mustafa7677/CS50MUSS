// © 2026 Sagid Mustafa. All Rights Reserved.
// «Ағылшын тілі A0-C1» курсы (en/): беттер, жаттығу автотексеру, прогресс, сөздік/грамматика/фразалар/деңгей тесті, лицензия (B), статистика.
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { ROOT, blockFonts, collectErrors } = require("../support/helpers");

const EN = path.join(ROOT, "en");
const LESSONS = fs.readdirSync(path.join(EN, "lectures")).filter((f) => /^week-\d+\.html$/.test(f)).sort((a, b) => parseInt(a.slice(5)) - parseInt(b.slice(5)));
const isSoon = (f) => fs.readFileSync(path.join(EN, "lectures", f), "utf8").includes("<!-- soon -->");
const READY = LESSONS.filter((f) => !isSoon(f));
const TOOLS = ["vocab", "grammar", "phrasebank", "placement"];
const { site_stats: S } = JSON.parse(execFileSync("python3", [path.join(ROOT, "tools/build.py"), "--stats"], { encoding: "utf8" }));

test("құрылым: 24 сабақ беті бар, дайын сабақ саны статистикамен бірдей", () => {
  expect(LESSONS.length).toBe(24);
  expect(READY.length).toBeGreaterThanOrEqual(1);
  expect(S.by_course.en.lect).toBe(READY.length);
  expect(S.by_course.en.plan).toBe(24);
  expect(S.lect_own).toBe(S.by_course.cpp.lect + S.by_course.java.lect + S.by_course.en.lect + S.by_course.math.lect);
  expect(S.lect_harvard).toBe(45);
});

test("курс беті: ескерту, 24 карточка, дайын саны, B лицензиясы, сертификатсыз", async ({ page }) => {
  const errs = collectErrors(page);
  await blockFonts(page.context());
  await page.goto("en/index.html");
  await expect(page.locator("body")).toHaveAttribute("data-license", "B");
  await expect(page.locator(".course-pill .cp-label")).toHaveText("English");
  await expect(page.locator("#ai-note")).toContainText("жасанды интеллект");
  await expect(page.locator("#ai-note")).toContainText("мұғалім");
  await expect(page.locator("#ai-note")).toContainText("шамамен");
  await expect(page.locator("#ai-note")).toContainText("болжамды");
  await expect(page.locator(".week-card")).toHaveCount(24);
  await expect(page.locator(".week-card:not(.soon)")).toHaveCount(READY.length);
  await expect(page.locator(".week-card .num").first()).toHaveText("A0 · 1-сабақ");
  await expect(page.locator(".week-card .num").nth(23)).toHaveText("C1 · 4-сабақ");
  await expect(page.locator("#project")).toBeVisible();
  await expect(page.locator(".translator-note")).toContainText("Harvard CS50 курсының аудармасы емес");
  await expect(page.locator('main a[href*="certificate"], .content a[href*="certificate"]')).toHaveCount(0);
  await expect(page.locator(".content")).not.toContainText(/Бейресми|IELTS баламасы бар|ресми деңгей берілді/);
  await expect(page.locator(".course-progress")).toContainText("лекция дайын");
  expect(errs).toEqual([]);
});

test("лицензия: барлық en беттері B, All Rights Reserved, Harvard сілтемесіз, сертификат беті жоқ", () => {
  const pages = ["index.html", ...TOOLS.map((t) => t + ".html"), ...LESSONS.map((f) => "lectures/" + f)];
  for (const f of pages) {
    const s = fs.readFileSync(path.join(EN, f), "utf8");
    expect(s, f).toContain('data-license="B"');
    expect(s, f).toMatch(/<meta name="copyright" content="[^"]*All Rights Reserved/);
    expect(s, f).not.toMatch(/<meta name="copyright" content="[^"]*(Harvard|CC BY-NC-SA)/);
    expect(s, f).not.toContain('"isBasedOn"');
    expect(s, f).toContain("© 2026 Sagid Mustafa.");
    expect(s, f).toContain("AO17 — Harvard University-ден тәуелсіз жоба.");
  }
  expect(fs.existsSync(path.join(EN, "certificate.html"))).toBe(false);
  const reg = JSON.parse(fs.readFileSync(path.join(ROOT, "licensing/components.json"), "utf8")).components;
  const e = reg.find((x) => x.id === "B-course-en");
  expect(e.cat).toBe("B");
  expect(e.paths).toEqual(["en/**"]);
  expect(e.license).toBe("ARR");
  // дайын емес сабақтар: sitemap-қа кірмейді, ал дайындары кіреді
  const sm = fs.readFileSync(path.join(ROOT, "sitemap.xml"), "utf8");
  for (const f of LESSONS) expect(sm.includes(`en/lectures/${f}`), f).toBe(!isSoon(f));
  expect(sm).toContain("en/vocab.html");
});

test("ауыстырғыш пен іздеу: English курсы нав-менюде және іздеу чипінде; сертификат ағылшын үшін жоқ", async ({ page }) => {
  await blockFonts(page.context());
  await page.goto("en/index.html");
  await page.click(".course-pill");
  await expect(page.locator(".course-menu .cm-row")).toHaveCount(9);
  await expect(page.locator(".course-menu .cm-row.on")).toContainText("English");
  await page.keyboard.press("Escape");
  await page.keyboard.press("Control+k");
  await expect(page.locator('.search-scope button[data-s="en"]')).toHaveText("English");
  await page.goto("certificate.html?course=en");
  await expect(page.locator(".certificate")).not.toContainText("Ағылшын");
  await page.goto("courses.html");
  await expect(page.locator('.cx-card[data-course="en"]')).toHaveAttribute("href", "en/");
  await expect(page.locator(".cx-card.own")).toHaveCount(4);
});

for (const t of TOOLS) {
  test(`ортақ бет ${t}: ашылады, қатесіз, 390px-те көлденең айналусыз`, async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    const errs = collectErrors(page);
    await blockFonts(ctx);
    await page.goto(`en/${t}.html`);
    await expect(page.locator("#en-app")).not.toContainText("Жүктелуде");
    await expect(page.locator("#en-app")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    expect(errs).toEqual([]);
    await ctx.close();
  });
  test(`ортақ бет ${t}: дерек жоқ болса, EmptyState көрсетіледі (қатесіз)`, async ({ page }) => {
    const errs = collectErrors(page);
    await blockFonts(page.context());
    await page.route(/assets\/data\/en-(vocab|grammar|phrases|placement)/, (r) => r.fulfill({ status: 200, body: "", headers: { "content-type": "application/javascript" } }));
    await page.goto(`en/${t}.html`);
    await expect(page.locator("#en-app .en-empty")).toBeVisible();
    expect(errs).toEqual([]);
  });
}

test("сөздік: іздеу, деңгей, «жаттадым» сақталады, карточкалар Лейтнер қорабын жаңартады", async ({ page }) => {
  await blockFonts(page.context());
  await page.goto("en/vocab.html");
  const total = await page.locator(".en-vitem").count();
  expect(total).toBeGreaterThanOrEqual(31);
  await page.fill(".en-search", "hello");
  await expect(page.locator('.en-vitem[data-id="a0-hello"]')).toBeVisible();
  await page.fill(".en-search", "рахмет");
  await expect(page.locator('.en-vitem[data-id="a0-thank-you"]')).toBeVisible();
  await page.fill(".en-search", "");
  await page.click('.en-chips button[data-v="b2"]');
  expect(await page.locator(".en-vitem").count()).toBeGreaterThanOrEqual(4);
  await page.click('.en-chips button[data-v="all"]');
  await page.locator('.en-vitem[data-id="a0-hello"] input[type=checkbox]').check();
  const v = await page.evaluate(() => JSON.parse(localStorage.getItem("cs50kz:en:vocab")));
  expect(v["a0-hello"].m).toBe(1);
  await page.reload();
  await expect(page.locator('.en-vitem[data-id="a0-hello"] input[type=checkbox]')).toBeChecked();
  // карточкалар
  await page.click(".en-cards-btn");
  await expect(page.locator(".en-card")).toBeVisible();
  await page.click(".en-card-stage .btn:has-text('Жауапты көрсету')");
  await page.click(".en-yes");
  const v2 = await page.evaluate(() => Object.values(JSON.parse(localStorage.getItem("cs50kz:en:vocab"))));
  expect(v2.some((e) => e.b >= 2 && e.due > Date.now())).toBe(true);
});

test("грамматика: іздеу, деңгей сүзгісі, анкер ережені ашады", async ({ page }) => {
  await blockFonts(page.context());
  await page.goto("en/grammar.html#a1-present-simple");
  await expect(page.locator("#a1-present-simple")).toHaveAttribute("open", "");
  await expect(page.locator("#a1-present-simple .en-bad").first()).toContainText("She work here.");
  await page.fill(".en-search", "артикль");
  await expect(page.locator(".en-rule").first()).toBeVisible();
  expect(await page.locator(".en-rule").count()).toBeLessThan(await page.evaluate(() => Object.values(window.CS50KZ_EN_GRAMMAR).flat().length));
  await page.fill(".en-search", "");
  await page.click('.en-chips button[data-v="c1"]');
  expect(await page.locator(".en-rule").count()).toBeGreaterThanOrEqual(3);
});

test("IT-фразалар: санат сүзгісі, көшіру батырмасы, дыбыстау әрекеті", async ({ page }) => {
  await blockFonts(page.context());
  await page.addInitScript(() => {
    window.__said = [];
    window.SpeechSynthesisUtterance = function (t) { this.text = t; };
    Object.defineProperty(window, "speechSynthesis", { configurable: true, value: { speak: (u) => window.__said.push(u.text), cancel() {}, getVoices: () => [{ lang: "en-US" }], addEventListener() {} } });
  });
  await page.goto("en/phrasebank.html");
  const all = await page.locator(".en-phrase").count();
  await page.click('.en-chips button[data-v="commit"]');
  const c = await page.locator(".en-phrase").count();
  expect(c).toBeGreaterThanOrEqual(2);
  expect(c).toBeLessThan(all);
  await page.locator(".en-phrase .en-copy").first().click();
  await expect(page.locator(".en-phrase .en-copy").first()).toHaveText(/Көшірілді|Көшіру мүмкін болмады|Көшіру/);
  await page.locator(".en-phrase .en-say").first().click();
  expect((await page.evaluate(() => window.__said)).length).toBe(1);
});

test("деңгей тесті: барлық жауап дұрыс -> C1; «Білмеймін» -> A0; нәтиже сақталады және ескерту көрінеді", async ({ page }) => {
  await blockFonts(page.context());
  await page.goto("en/placement.html");
  await expect(page.locator(".callout.warn")).toContainText("IELTS/TOEFL");
  const qs = await page.evaluate(() => window.CS50KZ_EN_PLACEMENT.questions.map((q) => q.a));
  await page.click("text=Тестті бастау");
  for (let i = 0; i < qs.length; i++) {
    await page.locator(`.en-q input[value="${qs[i]}"]`).check();
    await page.click(i === qs.length - 1 ? "button:has-text('Аяқтау')" : "button:has-text('Келесі')");
  }
  await expect(page.locator("#pl-result")).toContainText("C1");
  await expect(page.locator(".en-result")).toContainText("болжам");
  await expect(page.locator(".en-result")).toContainText("IELTS/TOEFL");
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("cs50kz:en:placement")));
  expect(saved.est).toBe(5);
  await page.click("button:has-text('Қайта тапсыру')");
  for (let i = 0; i < qs.length; i++) await page.click("button:has-text('Білмеймін')");
  await expect(page.locator("#pl-result")).toContainText("A0");
  await expect(page.locator(".en-result")).toContainText("A0 · 1-сабақ");
  // алгоритмді тікелей тексеру
  const r = await page.evaluate(() => {
    const qs = [{ lvl: "a0", a: 0 }, { lvl: "a0", a: 0 }, { lvl: "a1", a: 0 }, { lvl: "a1", a: 0 }, { lvl: "a2", a: 0 }, { lvl: "a2", a: 0 }];
    return window.CS50KZ_EN.placementScore(qs, [0, 0, 0, 0, 1, 0]);
  });
  expect(r.est).toBe(1);
  expect(r.upper).toBe(2);
  expect(r.lesson).toBe(8);
});

// ---- Сабақтар: әр дайын сабақтағы жаттығуларды дерегінен шешіп тексереміз
for (const f of READY) {
  test(`сабақ ${f}: құрылым, жаттығулар автотексеріледі, тест, прогресс`, async ({ page }) => {
    test.setTimeout(120_000);
    const errs = collectErrors(page);
    await blockFonts(page.context());
    await page.goto(`en/lectures/${f}`);
    await expect(page.locator("body")).toHaveAttribute("data-license", "B");
    await expect(page.locator(".course-pill .cp-label")).toHaveText("English");
    await expect(page.locator(".translator-note")).toContainText("Sagid Mustafa-ның авторлық оқу материалы");
    await expect(page.locator(".lecture-head .num")).toHaveText(/^(A0|A1|A2|B1|B2|C1) · [1-4]-сабақ$/);
    for (const id of ["goals", "mistakes", "it-english", "exercises", "summary", "quiz"]) await expect(page.locator("#" + id), id).toHaveCount(1);
    const n = await page.locator(".en-ex").count();
    expect(n, "жаттығу блоктары").toBeGreaterThanOrEqual(8);
    expect(await page.locator(".quiz .question").count()).toBe(8);
    await expect(page.locator(".en-ex-sum")).toContainText(`0 / ${n}`);
    // қате жауап: бірінші choice
    const firstChoice = page.locator('.en-ex[data-type="choice"]').first();
    await firstChoice.locator(".en-check").click();
    await expect(firstChoice.locator(".en-ex-result")).toHaveClass(/bad/);

    for (let i = 0; i < n; i++) {
      const ex = page.locator(".en-ex").nth(i);
      const type = await ex.getAttribute("data-type");
      const data = JSON.parse(await ex.locator("script.en-ex-data").textContent());
      if (type === "choice") {
        for (let k = 0; k < data.items.length; k++) await ex.locator(".en-q").nth(k).locator(`input[value="${data.items[k].a}"]`).check();
      } else if (type === "fill") {
        let b = 0;
        for (const it of data.items) {
          const a = Array.isArray(it.a[0]) ? it.a.map((x) => x[0]) : [it.a[0]];
          for (const v of a) await ex.locator(".en-blank").nth(b++).fill(v);
        }
      } else if (type === "match") {
        for (let k = 0; k < data.pairs.length; k++) await ex.locator(".en-sel").nth(k).selectOption(data.pairs[k][1]);
      } else if (type === "order") {
        for (let k = 0; k < data.items.length; k++) {
          const it = data.items[k], ans = (it.a && it.a.length ? it.a[0] : it.w.join(" ")).replace(/[.,!?]/g, "").split(/\s+/);
          const box = ex.locator(".en-order").nth(k);
          const pool = box.locator(".en-pool .en-chip");
          for (const w of ans) {
            // әр басу сөзді бассейннен шығаруы керек: жүктеме кезінде басу жоғалса, қайта басамыз (бір сөз бір-ақ рет шығады)
            const left = await pool.count();
            await expect(async () => {
              if ((await pool.count()) === left) await pool.filter({ hasText: new RegExp("^" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "[.,!?]?$", "i") }).first().click({ timeout: 2000 });
              expect(await pool.count()).toBe(left - 1);
            }).toPass({ timeout: 10_000 });
          }
        }
      } else if (type === "write") {
        await ex.locator("textarea").fill(data.model);
        const boxes = ex.locator(".en-crit input");
        for (let k = 0; k < (await boxes.count()); k++) await boxes.nth(k).check();
      } else if (type === "listen") {
        let d = 0;
        for (let k = 0; k < data.items.length; k++) {
          const it = data.items[k];
          if (typeof it.a === "number") await ex.locator("li").nth(k).locator(`input[value="${it.a}"]`).check();
          else await ex.locator(".en-blank").nth(d++).fill(it.a[0]);
        }
      } else if (type === "speak") {
        const boxes = ex.locator("input[type=checkbox]");
        for (let k = 0; k < (await boxes.count()); k++) await boxes.nth(k).check();
      } else throw new Error("белгісіз түр " + type);
      await ex.locator(".en-check").click();
      await expect(ex.locator(".en-ex-result"), `${await ex.getAttribute("data-id")} (${type})`).toHaveClass(/ok/);
      await expect(ex).toHaveClass(/is-done/);
    }
    await expect(page.locator(".en-ex-sum")).toContainText(`${n} / ${n}`);
    // прогресс: cs50kz:en:ex және check:* кілттері
    const st = await page.evaluate(() => ({ ex: JSON.parse(localStorage.getItem("cs50kz:en:ex")), checks: Object.keys(localStorage).filter((k) => k.startsWith("check:") && k.includes("/en/lectures/") && JSON.parse(localStorage.getItem(k)).every(Boolean)) }));
    expect(Object.values(st.ex).filter((e) => e.ok).length).toBe(n);
    expect(st.checks.length).toBe(n);
    await page.reload();
    await expect(page.locator(".en-ex.is-done")).toHaveCount(n);
    // тест және «Оқыдым»
    const qs = page.locator(".quiz .question");
    for (let i = 0; i < 8; i++) await qs.nth(i).locator(`input[value="${await qs.nth(i).getAttribute("data-answer")}"]`).check();
    await page.click(".quiz-check");
    await expect(page.locator(".quiz .result")).toContainText("8 / 8");
    await page.click(".mark-read .btn.gold");
    const w = f.replace(".html", "");
    const p = await page.evaluate(() => JSON.parse(localStorage.getItem("cs50kz:progress")));
    expect(p.read["en:" + w]).toBeTruthy();
    expect(p.read[w]).toBeFalsy();
    expect(p.quiz["en:" + w]).toEqual({ best: 8, total: 8 });
    await page.goto("en/index.html");
    await expect(page.locator(`.week-card[data-id="${w}"]`)).toHaveClass(/is-read/);
    expect(errs).toEqual([]);
  });

  test(`сабақ ${f}: дыбыстау браузер API-імен; API жоқ болса ескерту көрсетіледі`, async ({ browser }) => {
    const ctx = await browser.newContext();
    await blockFonts(ctx);
    const p1 = await ctx.newPage();
    await p1.addInitScript(() => {
      window.__said = [];
      window.SpeechSynthesisUtterance = function (t) { this.text = t; };
      Object.defineProperty(window, "speechSynthesis", { configurable: true, value: { speak: (u) => window.__said.push(u.text), cancel() {}, getVoices: () => [{ lang: "en-US" }], addEventListener() {} } });
    });
    await p1.goto(`en/lectures/${f}`);
    await p1.locator(".en-vocab .en-say").first().click();
    expect((await p1.evaluate(() => window.__said)).length).toBe(1);
    await expect(p1.locator(".en-tts-warn")).toBeHidden();
    const p2 = await ctx.newPage();
    await p2.addInitScript(() => { Object.defineProperty(window, "speechSynthesis", { configurable: true, value: undefined }); window.SpeechSynthesisUtterance = undefined; });
    await p2.goto(`en/lectures/${f}`);
    await expect(p2.locator(".en-tts-warn")).toBeVisible();
    await expect(p2.locator(".en-tts-warn")).toContainText("қолжетімсіз");
    await ctx.close();
  });

  test(`сабақ ${f}: мобиль 390px көлденең айналусыз, қараңғы режим`, async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: "dark" });
    const page = await ctx.newPage();
    await blockFonts(ctx);
    await page.goto(`en/lectures/${f}`);
    await page.waitForTimeout(400);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await ctx.close();
  });
}

test("own-viz en-tobe: қадамдап жұмыс істейді", async ({ page }) => {
  await blockFonts(page.context());
  await page.goto("en/lectures/week-0.html");
  const viz = page.locator('.own-viz[data-viz="en-tobe"]');
  await expect(viz).toHaveAttribute("data-ov-ready", "1");
  await viz.locator(".ov-next").click();
  await viz.locator(".ov-next").click();
  await viz.locator(".ov-next").click();
  await expect(viz.locator(".ov-result")).toContainText("-мын");
});

test("тұғыр сабақ беті: «жақында», дайын лекция емес, іздеуге кірмейді", async ({ page }) => {
  const soon = LESSONS.filter(isSoon);
  test.skip(!soon.length, "барлық сабақ дайын");
  await blockFonts(page.context());
  await page.goto(`en/lectures/${soon[0]}`);
  await expect(page.locator("h1")).toBeVisible();
  await expect(page.locator("#soon")).toContainText("жақында");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex");
  const idx = fs.readFileSync(path.join(ROOT, "assets/data/search-index.js"), "utf8");
  expect(idx.includes(`en/lectures/${soon[0]}`)).toBe(false);
});
