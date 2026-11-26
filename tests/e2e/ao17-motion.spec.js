// © 2026 AO17 командасы. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md.
// AO17 CS қозғалыс қабаты (assets/js/ao17-motion.js, assets/css/ao17-motion.css). Тексереміз: курс картасы экранға кіргенде
// сызылады, бекеттер кезекпен шығады, анимациядан соң ауысу сызығының hover-жарығы жұмыс істейді; санақтар соңғы мәніне
// жетеді; скролл жолағы; тактикалар мазмұнында экрандағы бөлім белгіленеді; «аралас» тақтайшалар орнына келеді; оқу
// кестесінің таспасы бір рет өседі; сынақ нәтижесінің шеңбері толады. Қозғалысты азайтқанда - ешбір анимация жоқ, бәрі бірден.
const { test, expect } = require("@playwright/test");
const { blockFonts, collectErrors } = require("../support/helpers");

// шексіз анимациялардан (келесі бекеттің тынысы) басқасының бәрі аяқталғанша күтеміз
const settle = (page, sel) => page.evaluate(async (sel) => {
  const scope = sel ? document.querySelector(sel) : document;
  const list = (scope.getAnimations ? scope.getAnimations({ subtree: true }) : document.getAnimations()).filter((a) => a.effect && a.effect.getTiming().iterations !== Infinity);
  await Promise.all(list.map((a) => a.finished.catch(() => 0)));
  return list.length;
}, sel);

test.describe("қозғалыс бар", () => {
  test.use({ contextOptions: { reducedMotion: "no-preference" } });

  test("курс картасы экранға кіргенде сызылады, бекеттер кезекпен шығады, кейін hover-жарық жұмыс істейді", async ({ page }) => {
    await blockFonts(page.context());
    const errs = collectErrors(page);
    await page.goto("academy/course.html");
    await expect(page.locator("html")).toHaveClass(/ao-move/);
    const map = page.locator(".crs-map");
    await expect(map).not.toHaveClass(/ao-in/);
    expect(await page.locator('.crs-map [data-st="w1"]').evaluate((e) => getComputedStyle(e).opacity)).toBe("0");
    await map.scrollIntoViewIfNeeded();
    await expect(map).toHaveClass(/ao-in/);
    const n = await settle(page, ".crs-map");
    expect(n).toBeGreaterThanOrEqual(23);   // кемінде әр бекеттің анимациясы
    for (const sid of ["w1", "w12", "arch", "iot"]) expect(await page.locator(`.crs-map [data-st="${sid}"]`).evaluate((e) => getComputedStyle(e).opacity)).toBe("1");
    expect(await page.locator(".crs-map .cm-l1").evaluate((e) => getComputedStyle(e).strokeDasharray)).toBe("none");
    // бекеттер жол бойындағы ретімен: 1-апта - 0, 12-апта - 11, бірінші зертхана - 12
    expect(await page.locator('.crs-map [data-st="w1"]').getAttribute("style")).toBe("--i:0");
    expect(await page.locator('.crs-map [data-st="arch"]').getAttribute("style")).toBe("--i:12");
    // анимация біткен соң ауысу сызығы hover-да жанады (fill-mode оны бұзбайды)
    await page.locator('.crs-map [data-st="w1"]').hover();
    await expect.poll(() => page.locator(".crs-map .cx-w1").first().evaluate((e) => getComputedStyle(e).opacity)).toBe("1");
    expect(errs).toEqual([]);
  });

  test("санақтар соңғы мәніне жетеді, скролл жолағы бетпен бірге жүреді", async ({ page }) => {
    await blockFonts(page.context());
    const html = await (await page.request.get("academy/course.html")).text();
    const want = [...html.match(/<ul class="crs-stats">([\s\S]*?)<\/ul>/)[1].matchAll(/<b data-ao-count>([^<]+)<\/b>/g)].map((m) => m[1]);
    expect(want).toHaveLength(6);
    await page.goto("academy/course.html");
    await expect(page.locator(".crs-stats b")).toHaveText(want);
    const bar = page.locator(".ao-progress");
    await expect(bar).toHaveCount(1);
    await expect(bar).toHaveAttribute("aria-hidden", "true");
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect.poll(() => bar.evaluate((e) => Number(e.style.getPropertyValue("--p")))).toBeGreaterThan(0.98);
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect.poll(() => bar.evaluate((e) => Number(e.style.getPropertyValue("--p")))).toBeLessThan(0.02);
  });

  test("тактикалар: экрандағы бөлім мазмұнда белгіленеді, «аралас» тақтайшалар орнына келеді, қисық сызылады", async ({ page }) => {
    await blockFonts(page.context());
    const errs = collectErrors(page);
    await page.setViewportSize({ width: 1280, height: 860 });
    await page.goto("academy/methods.html");
    await page.locator("#t-focus").scrollIntoViewIfNeeded();
    await page.evaluate(() => document.getElementById("t-focus").scrollIntoView({ block: "start" }));
    await expect(page.locator('.mt-index a[href="#t-focus"]')).toHaveClass(/is-cur/);
    await expect(page.locator('.mt-index a[href="#t-focus"]')).toHaveAttribute("aria-current", "location");
    await expect(page.locator(".mt-index a.is-cur")).toHaveCount(1);
    // компьютерде мазмұн жабысып тұрады
    expect(await page.locator(".mt-index").evaluate((e) => getComputedStyle(e).position)).toBe("sticky");
    await page.evaluate(() => document.getElementById("t-mix").scrollIntoView({ block: "start" }));
    await expect(page.locator(".mt-mixrow").nth(1).locator("i").first()).toHaveAttribute("style", /transition/);
    await settle(page, ".mt-mix");
    await expect.poll(() => page.locator(".mt-mixrow").nth(1).locator("i").evaluateAll((ts) => ts.every((t) => !t.style.transform))).toBe(true);
    await page.evaluate(() => document.getElementById("t-space").scrollIntoView({ block: "start" }));
    await page.locator('[data-cv="cram"]').click();
    await expect(page.locator("[data-cv-svg] svg")).toHaveClass(/cv-anim/);
    expect(await page.locator("[data-cv-svg] .cv").getAttribute("pathLength")).toBe("1");
    expect(errs).toEqual([]);
  });

  test("оқу кестесі: таспа бір рет өседі; сынақ: жауап сәті белгіленеді, нәтиже шеңбері толады", async ({ page }) => {
    await blockFonts(page.context());
    const errs = collectErrors(page);
    await page.goto("academy/plan.html");
    await expect(page.locator(".pl-rib")).toHaveClass(/ao-first/);
    expect(await page.locator(".pl-rib").evaluate((e) => e.getAnimations({ subtree: true }).length)).toBeGreaterThan(20);
    await expect(page.locator(".pl-rib")).not.toHaveClass(/ao-first/, { timeout: 6000 });
    // баптау өзгерсе, таспа қайта өспейді
    await page.locator('label:has(input[name="hours"][value="8"])').click();
    expect(await page.locator(".pl-rib").evaluate((e) => e.getAnimations({ subtree: true }).length)).toBe(0);
    await page.goto("academy/exam.html?w=1");
    await page.click("[data-ax-start]");
    // дұрыс жауаптар (қордан): нәтиже 100%, шеңбер толық сызылады
    const ans = await page.evaluate(() => {
      const bank = JSON.parse(document.getElementById("xm-bank").textContent), by = Object.fromEntries(bank.items.map((x) => [x.id, x]));
      return JSON.parse(localStorage.getItem("ao17cs:exam-run")).qs.map((q) => { const it = by[q.id]; return it.k === "mc" ? { k: "mc", v: q.p.indexOf(it.a) } : { k: "num", v: String(it.a) }; });
    });
    expect(ans).toHaveLength(8);
    for (const a of ans) {
      if (a.k === "mc") await page.locator(".xm-opt").nth(a.v).click();
      else { await page.fill(".xm-num input", a.v); await page.click(".xm-check"); }
      await expect(page.locator(".xm-q")).toHaveClass(/just/);
      await page.locator(".xm-nav .btn.gold").click();
    }
    await expect(page.locator(".xm-res")).toBeVisible();
    expect(await page.locator(".xm-score .va").evaluate((c) => c.getAnimations().length)).toBe(1);
    await settle(page, ".xm-res");
    await expect(page.locator(".xm-score b")).toHaveText("100%");
    expect(errs).toEqual([]);
  });
});

test.describe("басты бет: мұқабалар сөресі", () => {
  test.use({ contextOptions: { reducedMotion: "no-preference" } });
  test("экранға кіргенде 12 мұқаба бумадан жайылады, кейін hover жұмыс істейді", async ({ page }) => {
    await blockFonts(page.context());
    const errs = collectErrors(page);
    await page.addInitScript(() => { try { sessionStorage.setItem("ao17:intro", "1"); } catch (e) { /* */ } });
    await page.goto("index.html");
    const shelf = page.locator(".csh-shelf");
    await expect(shelf).not.toHaveClass(/ao-in/);
    // әр мұқабаның анимациясы басталғанын тіркейміз (кешігуі әртүрлі, сондықтан бір сәттегі санға сенбейміз)
    await shelf.evaluate((e) => { window.__deal = new Set(); e.querySelectorAll("li").forEach((l, i) => l.addEventListener("animationstart", (ev) => { if (/^csh-(deal|rise)$/.test(ev.animationName)) window.__deal.add(i); })); });
    await shelf.evaluate((e) => e.scrollIntoView({ block: "center", behavior: "instant" }));
    await expect(shelf).toHaveClass(/ao-in/);
    await expect.poll(() => page.evaluate(() => window.__deal.size), { timeout: 5000 }).toBe(12);
    await settle(page, ".csh-shelf");
    expect(await shelf.locator("li").evaluateAll((ls) => ls.every((l) => getComputedStyle(l).opacity === "1" && getComputedStyle(l).transform === "none"))).toBe(true);
    expect(await shelf.locator("li").evaluateAll((ls) => ls.map((l) => l.style.getPropertyValue("--k")))).toEqual(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"]);
    const a = shelf.locator("li a").nth(4);
    const before = await a.evaluate((e) => getComputedStyle(e).transform);
    await a.hover();
    await expect.poll(() => a.evaluate((e) => getComputedStyle(e).transform)).not.toBe(before);
    expect(errs).toEqual([]);
  });
});

test.describe("қозғалыс азайтылған", () => {
  test.use({ contextOptions: { reducedMotion: "reduce" } });

  test("бәрі бірден соңғы күйінде: карта көрінеді, санақтар өзгермейді, анимация жоқ", async ({ page }) => {
    await blockFonts(page.context());
    const errs = collectErrors(page);
    const html = await (await page.request.get("academy/course.html")).text();
    const want = [...html.match(/<ul class="crs-stats">([\s\S]*?)<\/ul>/)[1].matchAll(/<b data-ao-count>([^<]+)<\/b>/g)].map((m) => m[1]);
    await page.goto("academy/course.html");
    await expect(page.locator("html")).toHaveClass(/ao-still/);
    expect(await page.locator(".crs-stats b").allInnerTexts()).toEqual(want);   // бірден, күтпей
    await page.locator(".crs-map").scrollIntoViewIfNeeded();
    expect(await page.locator('.crs-map [data-st="w1"]').evaluate((e) => getComputedStyle(e).opacity)).toBe("1");
    expect(await page.evaluate(() => document.getAnimations().filter((a) => a.effect && a.effect.target && a.effect.target.closest && a.effect.target.closest(".crs-map, .crs-wv")).length)).toBe(0);
    await page.goto("academy/plan.html");
    await expect(page.locator(".pl-rib")).not.toHaveClass(/ao-first/);
    await page.goto("academy/methods.html");
    await page.evaluate(() => document.getElementById("t-space").scrollIntoView());
    await expect(page.locator("[data-cv-svg] svg")).not.toHaveClass(/cv-anim/);
    expect(errs).toEqual([]);
  });
});
