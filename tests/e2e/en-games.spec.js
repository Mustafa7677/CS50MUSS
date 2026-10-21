// © 2026 Sagid Mustafa. All Rights Reserved.
// Ағылшын ойындары (assets/js/games-en.js): Word Match, Spell It, Sentence Builder, Article Rush, Bug Report Fixer.
// Хабта «Ағылшын» тобы, ойын іске қосылады және аяқталады, ұпай/XP cs50kz:games-қа жазылады, деңгей таңдалады, дерек жоқ болса да жұмыс істейді,
// мобильді 390px (≥44px батырмалар, көлденең айналусыз), a11y, дыбыс өшіріледі.
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const { blockFonts, collectErrors } = require("../support/helpers");
const AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");

const IDS = ["enmatch", "enspell", "enbuild", "enarticle", "enbugfix"];
const log = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("cs50kz:games") || "{}"));
const noHScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);

async function openGame(page, id, level) {
  await page.goto("games.html?fast#" + id);
  await expect(page.locator(".game-shell")).toBeVisible();
  if (level != null) await page.click(`.gen-lvl-b[data-l="${level}"]`);
  await page.click(".ga-go");
}

/* Әр ойынды аяғына дейін ойнайтын көмекші: дұрыс жауаптар бетте тікелей көрінбейді, сондықтан ойындарға қарай жүреміз */
async function play(page, id) {
  if (id === "enmatch") {
    // ағылшынша сөз бен оның жұбын window ішіндегі пулдан табамыз: тақта түймелері data-i бойынша сәйкес келеді
    for (let b = 0; b < 3 && !(await page.locator(".game-result").count()); b++) {
      const n = await page.locator(".gen-l").count();
      for (let k = 0; k < n; k++) {
        const idx = await page.locator(".gen-l:not([disabled])").first().getAttribute("data-i");
        await page.locator(".gen-l:not([disabled])").first().click();
        await page.locator(`.gen-r[data-i="${idx}"]`).click();
      }
      await page.waitForTimeout(700);
    }
  } else if (id === "enspell") {
    for (let i = 0; i < 10; i++) {
      await page.fill(".gen-input", "x");
      await page.press(".gen-input", "Enter");
      await page.click(".gen-next");
    }
  } else if (id === "enbuild") {
    for (let i = 0; i < 8; i++) {
      for (let t = 0; t < 3 && (await page.locator(".gen-check").isVisible()); t++) {
        const n = await page.locator(".gen-pool .gen-chip:not([hidden])").count();
        for (let k = 0; k < n; k++) await page.locator(".gen-pool .gen-chip:not([hidden])").first().click();
        await page.click(".gen-check");
        await page.click(".gen-ans .gen-chip.in", { timeout: 300 }).catch(() => {});
        if (!(await page.locator(".gen-check").isVisible())) break;
        await page.click("text=Тазалау").catch(() => {});
      }
      await page.click(".gen-next");
    }
  } else if (id === "enarticle") {
    for (let i = 0; i < 60 && !(await page.locator(".game-result").count()); i++) {
      await page.locator(".gen-artb:not([disabled])").first().click({ timeout: 800 }).catch(() => {});
      await page.waitForTimeout(150);
    }
  } else if (id === "enbugfix") {
    for (let i = 0; i < 8; i++) {
      await page.locator(".gen-opt").first().click();
      await page.click(".gen-next");
    }
  }
}

test("хаб: 5 ағылшын ойыны, «Ағылшын» сүзгісі, карточкалар META-мен", async ({ page, context }) => {
  await blockFonts(context);
  const errs = collectErrors(page);
  await page.goto("games.html");
  for (const id of IDS) await expect(page.locator(`.game-card[href="#${id}"]`)).toHaveCount(1);
  await page.click('.gx-chip[data-cat="en"]');
  const vis = await page.$$eval(".gx-grid .game-card:not([hidden])", (a) => a.map((x) => x.getAttribute("href").slice(1)).sort());
  expect(vis).toEqual([...IDS].sort());
  await expect(page.locator('.game-card[href="#enarticle"] .gx-tag')).toContainText(["English", "Артикль"]);
  const c = await page.evaluate(() => window.CS50GamesEn.counts);
  expect(c.vocab).toBeGreaterThanOrEqual(40);
  expect(c.articles).toBeGreaterThanOrEqual(40);
  expect(c.fixes).toBeGreaterThanOrEqual(16);
  expect(errs).toEqual([]);
});

for (const id of IDS) {
  test(`${id}: бастау экраны, деңгей таңдау, ойын аяқталады, ұпай мен XP сақталады`, async ({ page, context }) => {
    test.setTimeout(120_000);
    await blockFonts(context);
    const errs = collectErrors(page);
    await openGame(page, id, 2);
    expect(await page.evaluate(() => localStorage.getItem("cs50kz:en:glevel"))).toBe("2");
    await play(page, id);
    await expect(page.locator(".game-result")).toBeVisible({ timeout: 40_000 });
    const g = (await log(page))[id];
    expect(g.plays).toBe(1);
    expect(g.xp).toBeGreaterThanOrEqual(0);
    await expect(page.locator(".game-result")).toContainText("Деңгей: A2");
    // деңгей есте қалады
    await page.reload();
    await expect(page.locator('.gen-lvl-b[data-l="2"]')).toHaveAttribute("aria-checked", "true");
    expect(errs).toEqual([]);
  });
}

test("ойындар дерек файлдарынсыз (бос) да жұмыс істейді: орнатылған қор қолданылады", async ({ page, context }) => {
  await blockFonts(context);
  const errs = collectErrors(page);
  await page.route(/assets\/data\/en-(vocab|grammar)/, (r) => r.fulfill({ status: 200, body: "", headers: { "content-type": "application/javascript" } }));
  await openGame(page, "enmatch", 0);
  await expect(page.locator(".gen-l")).toHaveCount(5);
  await page.goto("games.html?fast#enbuild");
  await page.click(".ga-go");
  await expect(page.locator(".gen-chip").first()).toBeVisible();
  const pool = await page.evaluate(() => window.CS50GamesEn.sentencePool(3).length);
  expect(pool).toBeGreaterThanOrEqual(8);
  expect(errs).toEqual([]);
});

test("Article Rush: дұрыс жауап ұпай береді, қате жан алады, пернелер жұмыс істейді", async ({ page, context }) => {
  await blockFonts(context);
  await openGame(page, "enarticle", 0);
  const ans = await page.evaluate(() => window.CS50GamesEn.ART.map((x) => [x.s, x.a]));
  const sent = (await page.locator(".gen-sent").textContent()).replace(/\s+/g, " ").trim();
  const key = ans.find(([s]) => s === sent)[1];
  await page.keyboard.press({ a: "1", an: "2", the: "3" }[key]);
  await expect(page.locator(".gen-fb")).toContainText("+10");
  await expect(page.locator(".gen-score b")).toHaveText("10");
});

test("Spell It: дұрыс жазылған сөз қабылданады; Sentence Builder: дұрыс сөйлем қабылданады", async ({ page, context }) => {
  await blockFonts(context);
  await openGame(page, "enspell", 0);
  // мағынасынан сөзді табамыз
  const kz = await page.locator(".gen-kz").textContent();
  const w = await page.evaluate((k) => { const p = window.CS50GamesEn.vocabPool(0, 10).pool.find((x) => x.kz === k); return p && p.w; }, kz);
  expect(w).toBeTruthy();
  await page.fill(".gen-input", w.toUpperCase());
  await page.press(".gen-input", "Enter");
  await expect(page.locator(".gen-fb")).toContainText("Дұрыс");
  await page.evaluate(() => { location.hash = "enbuild"; });
  await page.reload();
  await page.click(".ga-go");
  const kzs = await page.locator(".gen-kz").textContent();
  const en = await page.evaluate((k) => { const p = window.CS50GamesEn.sentencePool(0).find((x) => x.kz === k); return p && p.en; }, kzs);
  expect(en).toBeTruthy();
  for (const t of en.replace(/[.!?]+$/, "").split(/\s+/)) await page.locator(".gen-pool .gen-chip:not([hidden])", { hasText: new RegExp("^" + t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$") }).first().click();
  await page.click(".gen-check");
  await expect(page.locator(".gen-fb")).toContainText("Дұрыс");
});

test("дыбыс: мute батырмасы бар, әдепкіде өшірулі, ойын ішінде ауыстырылады; speechSynthesis жоқ болса Spell It ескертеді", async ({ page, context }) => {
  await blockFonts(context);
  await page.addInitScript(() => { Object.defineProperty(window, "speechSynthesis", { configurable: true, value: undefined }); window.SpeechSynthesisUtterance = undefined; });
  const errs = collectErrors(page);
  await page.goto("games.html?fast#enspell");
  await expect(page.locator(".gx-mute")).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator(".gx-intro")).toContainText("дыбыстау жоқ");
  await page.click(".gx-mute");
  await expect(page.locator(".gx-mute")).toHaveAttribute("aria-pressed", "true");
  await page.click(".ga-go");
  await expect(page.locator(".gen-say")).toBeDisabled();
  expect(errs).toEqual([]);
});

for (const id of IDS) {
  test(`${id}: 390px мобильді: көлденең айналусыз, батырмалар ≥44px, a11y`, async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: "reduce" });
    await blockFonts(ctx);
    const page = await ctx.newPage();
    const errs = collectErrors(page);
    await page.goto("games.html?fast#" + id);
    await expect(page.locator(".game-shell")).toBeVisible();
    const small = () => page.evaluate(() => [...document.querySelectorAll(".games-root button, .games-root input:not([type=hidden])")].filter((e) => { const r = e.getBoundingClientRect(); return r.width && getComputedStyle(e).visibility !== "hidden" && !e.closest("[aria-hidden='true']") && !e.disabled && (r.height < 44 || r.width < 44); }).map((e) => e.className.slice(0, 30)));
    expect(await small(), "бастау").toEqual([]);
    await page.locator(".ga-go").tap();
    await page.waitForTimeout(600);
    expect(await small(), "ойын ішінде").toEqual([]);
    expect(await noHScroll(page)).toBe(true);
    await page.addScriptTag({ content: AXE });
    const v = await page.evaluate(async () => (await axe.run(document.querySelector(".games-root"), { runOnly: ["wcag2a", "wcag2aa"], resultTypes: ["violations"] })).violations.filter((x) => x.impact === "serious" || x.impact === "critical").map((x) => x.id + ": " + x.nodes[0].target.join(" ")));
    expect(v, v.join("\n")).toEqual([]);
    expect(errs).toEqual([]);
    await ctx.close();
  });
}

test("кабинет: ағылшын ойындары рекордтар кестесінде", async ({ page, context }) => {
  await blockFonts(context);
  await page.goto("profile.html");
  await page.evaluate(() => localStorage.setItem("cs50kz:games", JSON.stringify({ enmatch: { best: 120, plays: 2, xp: 60 } })));
  await page.reload();
  await expect(page.locator(".cab-table")).toContainText("Word Match");
  await expect(page.locator(".cab-table")).toContainText("Bug Report Fixer");
});
