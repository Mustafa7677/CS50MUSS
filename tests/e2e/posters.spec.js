// © 2026 AO17 командасы. All Rights Reserved.
// Афиша (posters.html): тоғыз курс постері, жүктеу сілтемесі, фильмдер; курс беттерін бөліскенде курс постерінің баннері.
// AO17 CS: 25 комикс-мұқаба: негізгі, 2-бөлім, 12 апта (tools/make_course_posters.py) және 2-бөлімнің 11 зертханасы (tools/make_lab_posters.py);
// курс бетіндегі апта мен зертхана карточкаларында, 3D хабы мен сабақтың басында кішірейтілген нұсқасы. Афишада AO17-нің жеті фильмі.
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");
const { blockFonts, collectErrors } = require("../support/helpers");

const ROOT = path.join(__dirname, "..", "..");
const IDS = ["x", "python", "sql", "ai", "web", "cpp", "java", "en", "math"];

test("афиша: 9 постер жүктеледі, әрқайсысы курсқа апарады және жүктеп алуға болады", async ({ page }) => {
  await blockFonts(page.context());
  const errs = collectErrors(page);
  await page.goto("posters.html");
  const cards = page.locator(".ps-card:not(.ps-cs)");
  await expect(cards).toHaveCount(9);
  expect(await cards.evaluateAll((c) => c.map((n) => n.dataset.course))).toEqual(IDS);
  for (const id of IDS) {
    const img = page.locator(`.ps-card[data-course="${id}"] img`);
    await img.scrollIntoViewIfNeeded();
    await expect.poll(() => img.evaluate((i) => i.complete && i.naturalWidth)).toBe(1200);
    expect(await img.evaluate((i) => i.naturalHeight)).toBe(1800);
    expect((await img.getAttribute("alt")).length).toBeGreaterThan(10);
    await expect(page.locator(`.ps-card[data-course="${id}"] .ps-dl`)).toHaveAttribute("download", `AO17-${id}-poster.jpg`);
  }
  expect(await page.locator(".ps-films a").evaluateAll((a) => a.map((n) => n.getAttribute("href")))).toEqual(["film/", "film/cs/", "film/code/", "film/math/", "film/en/", "film/ielts/", "film/sat/"]);
  for (const h of await page.locator(".ps-films a").evaluateAll((a) => a.map((n) => n.getAttribute("href"))))
    expect(fs.existsSync(path.join(ROOT, h, "index.html")), h).toBe(true);
  expect(errs).toEqual([]);
});

test("AO17 CS: 25 комикс-мұқаба (1000×1500), әрқайсысы курсқа апарады; курс бетінде апта мен зертхана мұқабалары", async ({ page }) => {
  await blockFonts(page.context());
  const errs = collectErrors(page);
  await page.goto("posters.html#ao17cs");
  const cs = page.locator(".ps-card.ps-cs");
  await expect(cs).toHaveCount(25);
  const ids = await cs.evaluateAll((c) => c.map((n) => n.dataset.cs));
  expect(ids.slice(0, 2)).toEqual(["ao17cs", "ao17cs-3d"]);
  // 2-бөлім: 11 зертхана курстағы ретпен (№ 01 - архитектура), әрқайсысы 3D хабындағы өз зертханасына апарады
  const labs = ["arch", "algo", "math", "net", "web", "db", "sec", "cloud", "ai", "game", "iot"];
  expect(ids.slice(14)).toEqual(labs.map((l) => `ao17cs-3d-${l}`));
  await expect(page.locator("#cs-3d-arch figcaption span")).toHaveText("№ 01 · 2-бөлім");
  await expect(page.locator("#cs-3d-arch .ps-img")).toHaveAttribute("href", "academy/3d/index.html#arch");
  for (const id of ids) {
    const f = path.join(ROOT, `assets/img/posters/${id}.jpg`);
    expect(fs.existsSync(f), f).toBe(true);
    const href = await page.locator(`.ps-cs[data-cs="${id}"] .ps-img`).getAttribute("href");
    expect(fs.existsSync(path.join(ROOT, href.split("#")[0])), href).toBe(true);
    await expect(page.locator(`.ps-cs[data-cs="${id}"] .ps-dl`)).toHaveAttribute("download", `AO17-${id}.jpg`);
  }
  const img = page.locator('.ps-cs[data-cs="ao17cs-w05"] img');
  await img.scrollIntoViewIfNeeded();
  await expect.poll(() => img.evaluate((i) => i.complete && i.naturalWidth)).toBe(1000);
  // курс беті: әр аптаның мұқабасы бар, ол афишадағы сол нөмірге апарады
  await page.goto("academy/course.html");
  const thumbs = page.locator(".crs-w .crs-wv");
  await expect(thumbs).toHaveCount(12);
  await expect(thumbs.first()).toHaveAttribute("href", "../posters.html#cs-w01");
  for (const src of await page.locator(".crs-wv img").evaluateAll((a) => a.map((i) => i.getAttribute("src"))))
    expect(fs.existsSync(path.join(ROOT, "academy", src)), src).toBe(true);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /assets\/img\/og\/course-ao17cs\.jpg$/);
  // курс бетінің басы: негізгі мұқаба афишаға, фильм film/cs/-ке апарады
  await expect(page.locator(".crs-hero .crs-hcov")).toHaveAttribute("href", "../posters.html#cs-main");
  await expect(page.locator(".crs-hero a.crs-hfilm")).toHaveAttribute("href", "../film/cs/");
  // 2-бөлімнің зертханалары: әрқайсысының мұқабасы афишадағы өз нөміріне апарады
  const lv = page.locator(".crs-lab .crs-wv");
  await expect(lv).toHaveCount(11);
  await expect(lv.first()).toHaveAttribute("href", "../posters.html#cs-3d-arch");
  await page.goto("academy/3d/index.html");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /assets\/img\/og\/ao17cs-3d\.jpg$/);
  await expect(page.locator(".l3-hero .l3-hpos")).toHaveAttribute("href", "../../posters.html#cs-3d");
  expect(await page.locator(".l3-rack .l3-tcov img").evaluateAll((a) => a.map((i) => i.getAttribute("src").split("/").pop())))
    .toEqual(labs.map((l) => `ao17cs-3d-${l}.jpg`));
  // зертхананың сабағы: басында сол зертхананың мұқабасы, бөліскенде - сол зертхананың баннері
  await page.goto("academy/3d/algo/algo-1-search.html");
  await expect(page.locator(".l3-head .l3-cov")).toHaveAttribute("href", "../../../posters.html#cs-3d-algo");
  await expect(page.locator(".l3-head .l3-cov img")).toHaveAttribute("src", "../../../assets/img/posters/thumb/ao17cs-3d-algo.jpg");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /assets\/img\/og\/ao17cs-3d-algo\.jpg$/);
  for (const l of labs) {
    for (const f of [`posters/ao17cs-3d-${l}.jpg`, `posters/thumb/ao17cs-3d-${l}.jpg`, `og/ao17cs-3d-${l}.jpg`])
      expect(fs.existsSync(path.join(ROOT, "assets/img", f)), f).toBe(true);
  }
  expect(errs).toEqual([]);
});

test("курс беттерін бөліскенде - сол курстың баннері (1200×630)", async ({ page }) => {
  for (const id of IDS.filter((i) => i !== "x")) {
    const f = path.join(ROOT, `assets/img/og/course-${id}.jpg`);
    expect(fs.existsSync(f), f).toBe(true);
    await page.goto(`${id}/index.html`, { waitUntil: "domcontentloaded" });
    expect(await page.locator('meta[property="og:image"]').getAttribute("content")).toMatch(new RegExp(`assets/img/og/course-${id}\\.jpg$`));
  }
});

test("басты бетте афишаға сілтеме бар", async ({ page }) => {
  await blockFonts(page.context());
  await page.goto("index.html");
  await expect(page.locator('a.st-aff[href="posters.html"]')).toHaveCount(1);
});
