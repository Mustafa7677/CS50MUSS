// © 2026 AO17 командасы. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md.
// INSIDE TECH-тің 44 комиксі AO17 беттерінде (tools/inside_media.mjs -> tools/academy/data/inside_media.json -> tools/academy/inside_comics.py).
// Тексереміз: комикс хабының 2-бөлім сөресі (11 зертхана, 44 карточка, бәрі бар беттерге апарады); әр комикс өз сабағының өз қадамында,
// дәрістің алдында (INSIDE TECH-тегідей); кино-комикстің жанры, ұраны мен сахна тақталары; Ұстаздың сөзін Бота айтады;
// телефонда тік нұсқа; жарқыл суреті кадрдан шықпайды; 3D хабындағы «Комикс кітапханасы» AO17 бетіне апарады; axe.
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");
const { blockFonts, collectErrors } = require("../support/helpers");
const AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const ROOT = path.resolve(__dirname, "../..");
const MEDIA = JSON.parse(fs.readFileSync(path.join(ROOT, "tools/academy/data/inside_media.json"), "utf8"));
const LESSONS = JSON.parse(fs.readFileSync(path.join(ROOT, "tools/academy/data/inside_lessons.json"), "utf8")).lessons;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");

test("хаб: 2-бөлімнің 44 комиксі 11 зертхана бойынша, әр карточка сабақтың комиксіне апарады", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto("academy/comics.html");
  await expect(page.locator("#part2")).toHaveText("2-бөлім: 3D зертхана, 44 комикс");
  await expect(page.locator(".cxh-lab")).toHaveCount(11);
  const cards = page.locator(".cxh-lab .cxh-card");
  await expect(cards).toHaveCount(44);
  for (const h of await cards.evaluateAll((as) => as.map((a) => a.getAttribute("href")))) {
    expect(h).toMatch(/^3d\/[a-z]+\/[a-z0-9-]+\.html#s-comic$/);
    expect(fs.existsSync(path.join(ROOT, "academy", h.split("#")[0])), h).toBe(true);
  }
  // мұқабалар бірдей өлшемде: бірінші кадрдың тар нұсқасы
  expect(await page.locator(".cxh-lab .cxh-card svg").evaluateAll((s) => [...new Set(s.map((x) => x.getAttribute("viewBox")))])).toEqual(["0 0 400 230"]);
  await page.locator('.cxh-lab .cxh-card[href="3d/sec/sec-3-xor.html#s-comic"]').click();
  await expect(page.locator("#s-comic .cx-p")).toHaveCount(7);
  expect(errors).toEqual([]);
});

test("44 комикстің әрқайсысы өз сабағының өз қадамында, дәрістің алдында (INSIDE TECH-тегідей)", () => {
  const all = { ...MEDIA.labComics, ...MEDIA.filmComics, ...MEDIA.lessonComics };
  expect(Object.keys(all)).toHaveLength(44);
  for (const [lid, { step, comic }] of Object.entries(all)) {
    const e = LESSONS.find((x) => x.lesson.id === lid);
    const i = e.lesson.steps.findIndex((s) => s.id === step) + 1;
    expect(i, lid).toBeGreaterThan(0);
    const html = fs.readFileSync(path.join(ROOT, "academy/3d", e.labId, lid + ".html"), "utf8");
    expect(html.split('id="s-comic"'), lid).toHaveLength(2);
    const sec = html.split(`<section class="l3-step" id="s${i}"`)[1].split("</section>")[0];
    const at = sec.indexOf('id="s-comic"');
    expect(at, `${lid}: ${step} қадамында комикс жоқ`).toBeGreaterThan(0);
    expect(at, lid).toBeLessThan(sec.indexOf('class="l3-body"'));
    expect(sec.split('<figure class="cx-p').length - 1, lid).toBe(comic.panels.length);
    expect(sec, lid).toContain(`>${esc(comic.title)}</h3>`);
    expect(html.toLowerCase(), lid).not.toContain("ұстаз");
  }
});

test("кино-комикс: жанры, ұраны, сахна тақталары, кинотаспа жиегі; Бота түсіндіреді; мазмұнда «комикс» белгісі", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto("academy/3d/sec/sec-3-xor.html");
  const cx = page.locator("#s-comic");
  await expect(cx.locator(".cx-k")).toHaveText("Кино-комикс · Тыңшылық триллер");
  await expect(cx.locator("h3")).toHaveText("Екі хат, бір кілт");
  await expect(cx.locator(".cx-tag")).toHaveText("Ең берік шифрды бір ғана қате бұзды.");
  await expect(cx.locator(".cx-slate")).toHaveText(["САХНА 1 · ЕСКІ КІТАПХАНА · ТҮН", "САХНА 2 · КЕЛЕСІ КҮНІ"]);
  await expect(cx.locator(".cx.cx-film")).toHaveCount(1);
  await expect(cx.locator(".cx-cap").first()).toContainText("Нұрай мен Мустафа «тыңшы» ойынын ойнап жүр");
  await expect(cx.locator(".cx-b", { hasText: "Бота:" })).toHaveCount(2);
  const labels = await cx.locator("svg.cx-art:not(.cx-art-n)").evaluateAll((s) => s.map((x) => x.getAttribute("aria-label")));
  expect(labels).toHaveLength(7);
  expect(labels[1]).toBe("2-кадр. тақтада: шифр = хат ⊕ кілт ⏎ хат = шифр ⊕ кілт; Бота (сабырлы)");
  // комикс «Бір реттік блокнот» қадамында, оның дәрісінің алдында; мазмұндағы сол қадамда «комикс» белгісі
  const step = page.locator("section.l3-step", { has: page.locator("#s-comic") });
  const id = await step.getAttribute("id");
  await expect(page.locator(`.l3-toc a[href="#${id}"] .l3-tcx`)).toHaveText("комикс");
  await expect(page.locator(".l3-tcx")).toHaveCount(1);
  await cx.locator(".cx-head a").click();
  await expect(page).toHaveURL(/academy\/comics\.html#part2$/);
  expect(errors).toEqual([]);
});

test("зертхана мен сабақ комикстері: «Нұрай, Мустафа және Бота»; Ұстазға айтылған сөз Ботаға айтылады", async ({ page }) => {
  await page.goto("academy/3d/ai/ai-1-data.html");
  const cx = page.locator("#s-comic");
  await expect(cx.locator(".cx-k")).toHaveText("Комикс · Нұрай, Мустафа және Бота");
  await expect(cx.locator(".cx-p")).toHaveCount(5);
  await expect(cx.locator(".cx-b").first()).toContainText("Мустафа: Мен компьютерге мысық пен итті ажыратуды үйретемін!");
  await expect(cx.locator(".cx-tag")).toHaveCount(0);
  await page.goto("academy/3d/math/la-1-vectors.html");
  await expect(page.locator("#s-comic .cx-b").first()).toContainText("Нұрай: Бота, кітапта вектор көрсеткі дейді");
  const dec = (s) => s.toLowerCase();
  expect(dec(fs.readFileSync(path.join(ROOT, "tools/academy/data/inside_media.json"), "utf8"))).not.toContain("ұстаз");
});

test("сурет кадрдан шықпайды: жарқылдың сәулелері сөз бұлттары мен кино-тақтаның үстіне түспейді", async ({ page }) => {
  for (const u of ["academy/m07/l01.html?nofilm", "academy/3d/sec/sec-3-xor.html", "academy/comics.html", "academy/3d/index.html"]) {
    await page.goto(u);
    const [n, open] = await page.evaluate(() => {
      const s = [...document.querySelectorAll(".cx-art, .cxh-card svg, .l3-cnat svg")];
      return [s.length, s.filter((x) => getComputedStyle(x).overflow !== "hidden").length];
    });
    expect(n, u).toBeGreaterThan(0);
    expect(open, u).toBe(0);
  }
});

test("3D хабы: «Комикс кітапханасы» AO17-нің өз комикс хабына апарады, мұқабасы - комикстің кадры", async ({ page }) => {
  await page.goto("academy/3d/index.html");
  const card = page.locator("#stories a.l3-cnat", { hasText: "Комикс кітапханасы" });
  await expect(card).toHaveAttribute("href", "../comics.html#part2");
  await expect(card.locator("svg")).toHaveAttribute("aria-hidden", "true");
  await expect(card).toContainText("44 комикс");
  await card.click();
  await expect(page.locator("#part2")).toBeVisible();
});

test("телефон (360px): кең кадр мен тақталы кадрдың тік нұсқасы, көлденең жылжу жоқ", async ({ browser }) => {
  const c = await browser.newContext({ viewport: { width: 360, height: 740 }, reducedMotion: "reduce" });
  await blockFonts(c);
  const p = await c.newPage();
  for (const u of ["academy/3d/sec/sec-3-xor.html", "academy/3d/math/la-1-vectors.html", "academy/comics.html"]) {
    await p.goto(u);
    expect(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), u).toBe(true);
  }
  await p.goto("academy/3d/sec/sec-3-xor.html");
  const wide = p.locator("#s-comic .cx-wide").first();
  await expect(wide.locator(".cx-art-w")).toBeHidden();
  await expect(wide.locator(".cx-art-n")).toBeVisible();
  // тақталы тар кадр: телефонда тақта толық енімен жоғарыда, кейіпкер төменде (екі сурет қатары)
  const board = p.locator("#s-comic .cx-p:not(.cx-wide)", { has: p.locator(".cx-art-n") }).first();
  await expect(board.locator(".cx-art-n")).toBeVisible();
  expect(await board.locator(".cx-art-n").getAttribute("viewBox")).toBe("0 0 400 460");
  await c.close();
});

for (const scheme of ["light", "dark"]) {
  test(`axe (${scheme}): сабақтағы комикстер мен хабтың 2-бөлім сөресі таза`, async ({ browser }) => {
    const c = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: scheme, reducedMotion: "reduce" });
    await blockFonts(c);
    const p = await c.newPage();
    for (const [u, sel] of [["academy/3d/sec/sec-3-xor.html", "#s-comic"], ["academy/3d/math/la-1-vectors.html", "#s-comic"], ["academy/comics.html", "#main"]]) {
      await p.goto(u);
      await p.addScriptTag({ content: AXE });
      const v = await p.evaluate(async (sel) => (await axe.run(document.querySelector(sel), { runOnly: ["wcag2a", "wcag2aa"], resultTypes: ["violations"] })).violations
        .filter((x) => ["serious", "critical"].includes(x.impact)).map((x) => `${x.id}: ${x.nodes.length} (${x.nodes[0].html.slice(0, 140)})`), sel);
      expect(v, u + " " + sel).toEqual([]);
    }
    await c.close();
  });
}
