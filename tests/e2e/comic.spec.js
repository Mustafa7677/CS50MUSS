// © 2026 AO17 командасы. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md.
// AO17 Комикс «Нұрай, Мустафа және Бота» (tools/academy/comic.py, comic_eps.py): хаб беті, 12 эпизод, әр сабақтағы «Тұзақ» комиксі.
// Тексереміз: хабтағы эпизодтар нақты сабақтарға апарады; эпизодта 6 кадр, мәтін - HTML (экран оқу құралына қолжетімді);
// «Тұзақ» комиксі сол сабақтың «Жиі қателер» деректерін көрсетеді; телефонда тік нұсқа көрінеді, көлденең жылжу жоқ; axe таза.
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const { blockFonts, collectErrors } = require("../support/helpers");
const AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");

test("хаб: 12 эпизод, әрқайсысы сабақтың комикс бөліміне апарады", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto("academy/comics.html");
  const cards = page.locator(".cxh-card");
  await expect(cards).toHaveCount(12);
  const hrefs = await cards.evaluateAll((as) => as.map((a) => a.getAttribute("href")));
  expect(hrefs[0]).toBe("m01/l01.html#s-comic");
  expect(hrefs[11]).toBe("m12/l01.html#s-comic");
  for (const h of [hrefs[0], hrefs[6], hrefs[11]]) {
    await page.goto("academy/" + h.replace("#s-comic", "?nofilm"));
    await expect(page.locator("#s-comic .cx-p")).toHaveCount(6);
    await expect(page.locator('.ac-toc a[href="#s-comic"]')).toHaveCount(1);
  }
  expect(errors).toEqual([]);
});

test("7-эпизод: сөз бұлттары - мәтін, сөйлеуші аталған, сурет сипатталған; келесі эпизодқа сілтеме", async ({ page }) => {
  await page.goto("academy/m07/l01.html?nofilm");
  const sec = page.locator("#s-comic");
  await expect(sec.locator("h2")).toHaveText("print сөйлейді, return береді");
  await expect(sec.locator(".cx-b").first()).toContainText("Мустафа:");
  await expect(sec.locator(".cx-b", { hasText: "x None болып қалды!" })).toHaveCount(1);
  // кодтың шығысы суретте (build кезінде нағыз Python-мен тексерілген)
  await expect(sec.locator('svg.cx-art[aria-label*="TypeError"]').first()).toBeAttached();
  const labels = await sec.locator("svg.cx-art").evaluateAll((s) => s.map((x) => x.getAttribute("aria-label")));
  expect(labels.every((l) => /^\d+-кадр\. /.test(l) && /Нұрай|Мустафа|Бота/.test(l))).toBe(true);
  await expect(sec.locator('.cx-foot a[href="../m08/l01.html#s-comic"]')).toHaveCount(1);
});

test("«Тұзақ»: К бөліміндегі комикс сол сабақтың бірінші жиі қатесін көрсетеді (әр сабақта)", async ({ page }) => {
  for (const u of ["academy/m03/l05.html", "academy/m11/l04.html", "academy/s04/l02.html"]) {
    await page.goto(u + "?nofilm");
    const k = page.locator("#s-k");
    await expect(k.locator(".cx-trap .cx-p")).toHaveCount(4);
    const mistake = (await k.locator(".ac-mist li b").first().textContent()).trim();
    const note = (await k.locator(".cx-nt").textContent()).replace(/^(Нұрайдың|Мустафаның) жазбасы:\s*/, "").trim();
    expect(note, u).toBe(mistake);
    await expect(k.locator(".cx-b", { hasText: "Ереже:" })).toHaveCount(1);
  }
});

test("телефон (360px): тік нұсқа көрінеді, кең нұсқа жасырын, көлденең жылжу жоқ", async ({ browser }) => {
  const c = await browser.newContext({ viewport: { width: 360, height: 740 }, reducedMotion: "reduce" });
  await blockFonts(c);
  const p = await c.newPage();
  for (const u of ["academy/m07/l01.html?nofilm", "academy/comics.html"]) {
    await p.goto(u);
    expect(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), u).toBe(true);
  }
  await p.goto("academy/m07/l01.html?nofilm");
  const wide = p.locator("#s-comic .cx-wide").first();
  await expect(wide.locator(".cx-art-w")).toBeHidden();
  await expect(wide.locator(".cx-art-n")).toBeVisible();
  // тік нұсқадағы код оқылатын өлшемде: экрандағы әріп биіктігі кемінде 8px
  const px = await wide.locator(".cx-art-n").evaluate((svg) => { const t = svg.querySelector("text[font-size]"); const k = svg.getBoundingClientRect().width / 400; return parseFloat(t.getAttribute("font-size")) * k; });
  expect(px).toBeGreaterThanOrEqual(8);
  await c.close();
});

for (const scheme of ["light", "dark"]) {
  test(`axe (${scheme}): комикс хабы мен сабақтағы комикс бөлімдері таза`, async ({ browser }) => {
    const c = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: scheme, reducedMotion: "reduce" });
    await blockFonts(c);
    const p = await c.newPage();
    for (const [u, sel] of [["academy/comics.html", "#main"], ["academy/m05/l01.html?nofilm", "#s-comic"], ["academy/m05/l01.html?nofilm", "#s-k"]]) {
      await p.goto(u);
      await p.addScriptTag({ content: AXE });
      const v = await p.evaluate(async (sel) => (await axe.run(document.querySelector(sel), { runOnly: ["wcag2a", "wcag2aa"], resultTypes: ["violations"] })).violations
        .filter((x) => ["serious", "critical"].includes(x.impact)).map((x) => `${x.id}: ${x.nodes.length} (${x.nodes[0].html.slice(0, 140)})`), sel);
      expect(v, u + " " + sel).toEqual([]);
    }
    await c.close();
  });
}
