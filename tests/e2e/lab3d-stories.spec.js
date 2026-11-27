// © 2026 AO17 командасы. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md.
// «Тірі заттар» (INSIDE TECH-тің 6 әңгімесі, техника-кейіпкерлер: tools/academy/gadgets.py) және «Қалай оқу керек?» (7 эпизод, academy/learn.html).
// Тексереміз: әр әңгіме өз сабағының соңында, мазмұнда сілтемесі, сөйлеушілер мен суреттегі кейіпкерлер аталған; комикс хабының
// «Тірі заттар» мен «Қалай оқу керек?» сөрелері; learn.html: алдымен болжа, сосын комикс ашылады, болжам INSIDE TECH-пен ортақ
// кілтте сақталады, жеті эпизодтан кейін курс аяқталады; JS жоқ кезде бәрі оқылады; 360px, axe.
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");
const { blockFonts, collectErrors } = require("../support/helpers");
const AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const ROOT = path.resolve(__dirname, "../..");
const MEDIA = JSON.parse(fs.readFileSync(path.join(ROOT, "tools/academy/data/inside_media.json"), "utf8"));
const NAME = { laptop: "Ноутбук", computer: "Компьютер", server: "Сервер", cpu: "Процессор", packet: "Пакет", robot: "Робот", phone: "Телефон", virus: "Вирус" };

test("6 әңгіме өз сабағының соңында; мазмұнда сілтемесі; техника-кейіпкерлер сөйлейді және суретте бар", () => {
  expect(MEDIA.stories).toHaveLength(6);
  for (const st of MEDIA.stories) {
    const html = fs.readFileSync(path.join(ROOT, "academy/3d", st.labId, st.lessonId + ".html"), "utf8");
    const at = html.indexOf('id="s-story"');
    expect(at, st.id).toBeGreaterThan(html.lastIndexOf('<section class="l3-step"'));
    expect(at, st.id).toBeLessThan(html.indexOf('class="l3-src"'));
    expect(html, st.id).toContain('<a href="#s-story">' + st.comic.title + "</a>");
    const sec = html.slice(at, html.indexOf('class="l3-src"'));
    expect(sec.split('<figure class="cx-p').length - 1, st.id).toBe(st.comic.panels.length);
    for (const g of new Set(st.comic.panels.map((p) => p.who).filter((w) => NAME[w]))) {
      expect(sec, `${st.id}: ${g} сөйлейді`).toContain(`<span class="cx-who">${NAME[g]}: </span>`);
      expect(sec, `${st.id}: ${g} суретте`).toContain(`${NAME[g]} (`);
    }
  }
});

test("«Шаршаған сервер»: оркестратор ортада, екі жағында сервердің көшірмелері", async ({ page }) => {
  await page.goto("academy/3d/cloud/cloud-2-orchestration.html");
  const label = await page.locator("#s-story .cx-p").nth(4).locator("svg.cx-art").first().getAttribute("aria-label");
  expect(label).toMatch(/^5-кадр\. Сервер \([^)]+\); Робот \([^)]+\); Сервер \([^)]+\)$/);
  await expect(page.locator("#s-story .cx-p").nth(4).locator(".cx-b")).toContainText("Робот: Жүктеме көп пе?");
});

test("комикс хабы: «Тірі заттар» (6) мен «Қалай оқу керек?» (7) сөрелері бар беттерге апарады", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto("academy/comics.html");
  const st = page.locator("#stories + p + .cxh-grid .cxh-card");
  await expect(st).toHaveCount(6);
  for (const h of await st.evaluateAll((as) => as.map((a) => a.getAttribute("href")))) {
    expect(h).toMatch(/^3d\/[a-z]+\/[a-z0-9-]+\.html#s-story$/);
    expect(fs.existsSync(path.join(ROOT, "academy", h.split("#")[0])), h).toBe(true);
  }
  const lh = page.locator("#learn + p + .cxh-grid .cxh-card");
  await expect(lh).toHaveCount(7);
  expect(await lh.evaluateAll((as) => as.map((a) => a.getAttribute("href")))).toEqual(MEDIA.episodes.map((e) => "learn.html#ep-" + e.id));
  await st.first().click();
  await expect(page.locator("#s-story .cx-p")).toHaveCount(MEDIA.stories[0].comic.panels.length);
  expect(errors).toEqual([]);
});

test("learn.html: алдымен болжа; дұрыс және қате болжам; комикс ашылады; болжам INSIDE TECH-пен ортақ кілтте", async ({ page }) => {
  const errors = collectErrors(page);
  // INSIDE TECH-те бұрын шешілген эпизод (ортақ кілт): «cram» - қате болжам
  await page.addInitScript(() => { if (!sessionStorage.getItem("t")) { localStorage.setItem("inside-tech:learn-how", JSON.stringify({ cram: false })); sessionStorage.setItem("t", "1"); } });
  await page.goto("academy/learn.html");
  await expect(page.locator(".lh-prog")).toHaveText("1 / 7 эпизод · 0 дұрыс болжам");
  await expect(page.locator("#ep-cram .lh-open")).toBeVisible();
  await expect(page.locator('.lh-nav a[data-ep="cram"]')).toHaveAttribute("data-state", "wrong");
  const ep = page.locator("#ep-reread");
  await expect(ep.locator(".lh-open")).toBeHidden();
  await expect(ep.locator(".lh-locked")).toBeVisible();
  await ep.locator(".lh-btns button", { hasText: "Миф" }).click();
  await expect(ep.locator(".lh-verdict")).toHaveText("Дұрыс таптың. Бұл: миф. Енді комиксті оқы.");
  await expect(ep.locator(".lh-verdict")).toBeFocused();
  await expect(ep.locator(".lh-open .cx-p")).toHaveCount(MEDIA.episodes[0].comic.panels.length);
  await expect(ep.locator(".lh-ans")).toBeHidden();
  await expect(ep.locator(".lh-btns button").first()).toBeDisabled();
  await expect(ep.locator('.lh-btns button[data-state="truth"]')).toHaveText("Миф");
  await expect(ep.locator(".lh-tool a").first()).toHaveAttribute("href", "3d/app/index.html#recall");
  await expect(ep.locator(".lh-tool a").last()).toHaveAttribute("href", "methods.html#t-recall");
  await expect(page.locator(".lh-prog")).toHaveText("2 / 7 эпизод · 1 дұрыс болжам");
  expect(JSON.parse(await page.evaluate(() => localStorage.getItem("inside-tech:learn-how")))).toEqual({ cram: false, reread: true });
  await page.reload();
  await expect(page.locator("#ep-reread .lh-open")).toBeVisible();
  // қалған бес эпизод: шын жауабымен; соңында курс аяқталады
  await expect(page.locator(".lh-final")).toBeHidden();
  for (const e of MEDIA.episodes.filter((x) => !["reread", "cram"].includes(x.id)))
    await page.locator(`#ep-${e.id} .lh-btns button`, { hasText: e.fact ? "Шындық" : "Миф" }).click();
  await expect(page.locator(".lh-prog")).toHaveText("7 / 7 эпизод · 6 дұрыс болжам");
  await expect(page.locator(".lh-final")).toBeVisible();
  // «3D зертхана» құралы - AO17-нің лекция беті
  await expect(page.locator("#ep-styles .lh-tool a").first()).toHaveAttribute("href", "3d/math/ag-4-conics.html");
  expect(errors).toEqual([]);
});

test("learn.html JS-сіз: жауабы, комикс, зерттеу және құралдар бірден оқылады", async ({ browser }) => {
  const c = await browser.newContext({ javaScriptEnabled: false });
  const p = await c.newPage();
  await p.goto("academy/learn.html");
  await expect(p.locator(".lh-open")).toHaveCount(7);
  await expect(p.locator(".lh-open").first()).toBeVisible();
  await expect(p.locator("#ep-multitask .lh-ans")).toHaveText("Жауабы: шындық.");
  await expect(p.locator(".lh-locked").first()).toBeHidden();
  await c.close();
});

test("оқу әдістемесі мен 3D хабы «Қалай оқу керек?» бетіне апарады", async ({ page }) => {
  await page.goto("academy/methods.html");
  await expect(page.locator('.my-more a[href="learn.html"]')).toHaveText("Қалай оқу керек?");
  await page.goto("academy/3d/index.html");
  await expect(page.locator('#stories a.l3-cnat[href="../learn.html"]')).toContainText("Қалай оқу керек?");
});

for (const scheme of ["light", "dark"]) {
  test(`360px, ${scheme}: learn.html мен әңгімелі сабақ көлденең жылжымайды; axe таза`, async ({ browser }) => {
    const c = await browser.newContext({ viewport: { width: 360, height: 740 }, colorScheme: scheme, reducedMotion: "reduce" });
    await blockFonts(c);
    const p = await c.newPage();
    for (const [u, sel, click] of [["academy/learn.html", "#main", true], ["academy/3d/arch/arch-1-binary.html", "#s-story", false]]) {
      await p.goto(u);
      if (click) await p.locator("#ep-reread .lh-btns button").first().click();
      expect(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), u).toBe(true);
      await p.addScriptTag({ content: AXE });
      const v = await p.evaluate(async (sel) => (await axe.run(document.querySelector(sel), { runOnly: ["wcag2a", "wcag2aa"], resultTypes: ["violations"] })).violations
        .filter((x) => ["serious", "critical"].includes(x.impact)).map((x) => `${x.id}: ${x.nodes.length} (${x.nodes[0].html.slice(0, 140)})`), sel);
      expect(v, u).toEqual([]);
    }
    await c.close();
  });
}
