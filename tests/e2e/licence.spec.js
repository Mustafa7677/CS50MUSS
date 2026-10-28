// © 2026 Sagid Mustafa. All Rights Reserved.
// Лицензиялық бөліну тесттері: Harvard CS50 (A), Sagid Mustafa (B), аралас (M); footer, meta, JSON-LD, copyright беті.
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");
const { blockFonts } = require("../support/helpers");

const ROOT = path.resolve(__dirname, "../..");
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
const LECTURES = [
  ...fs.readdirSync(path.join(ROOT, "lectures")).filter((f) => f.endsWith(".html")).map((f) => "lectures/" + f),
  ...["python", "sql", "ai", "web"].flatMap((c) => fs.readdirSync(path.join(ROOT, c, "lectures")).filter((f) => f.endsWith(".html")).map((f) => `${c}/lectures/${f}`)),
];
const B_PAGES = ["detective.html", "projects.html", "flask.html", "alash.html", "viz.html", "playground.html", "games.html", "profile.html", "teacher.html", "certificate.html", "copyright.html", "partners.html", "metrics.html"];
const M_PAGES = ["index.html", "about.html", "practice.html", "exam.html", "flashcards.html", "debug.html", "glossary.html", "map.html", "courses.html"];
const metaCopy = (s) => (s.match(/<meta name="copyright" content="([^"]*)"/) || [])[1] || "";
const licHref = (s) => (s.match(/<link rel="license" href="([^"]*)"/) || [])[1] || "";

test("45 лекция: CC BY-NC-SA 4.0 (Harvard аудармасы), түпнұсқа сілтемесі мен атрибуция сақталған", () => {
  expect(LECTURES.length).toBe(45);
  for (const f of LECTURES) {
    const s = read(f);
    expect(s, f).toContain('data-license="A"');
    expect(licHref(s), f).toMatch(/creativecommons\.org\/licenses\/by-nc-sa\/4\.0/);
    expect(metaCopy(s), f).toMatch(/Harvard CS50/);
    expect(metaCopy(s), f).toMatch(/Sagid Mustafa/);
    expect(s, f).toContain("cs50.harvard.edu"); // түпнұсқаға сілтеме сақталған
    expect(s, f).toMatch(/class="translator-note"[^>]*>[^]*Аударған: Sagid Mustafa[^]*CC BY-NC-SA 4\.0[^]*copyright\.html/);
    expect(s, f).toContain('"license":"https://creativecommons.org/licenses/by-nc-sa/4.0/"');
    expect(s, f).toContain('"isBasedOn":"https://cs50.harvard.edu/"');
  }
});

// C++ және Java: дербес авторлық курстар (B), Harvard аудармасы емес; 45-ке кірмейді
const OWN_PAGES = ["cpp", "java"].flatMap((c) => [`${c}/index.html`, ...(fs.existsSync(path.join(ROOT, c, "lectures")) ? fs.readdirSync(path.join(ROOT, c, "lectures")).filter((f) => f.endsWith(".html")).map((f) => `${c}/lectures/${f}`) : [])]);
test("C++ және Java курстары (B): All Rights Reserved, CC BY-NC-SA жоқ, isBasedOn Harvard жоқ", () => {
  expect(OWN_PAGES.length).toBeGreaterThanOrEqual(2);
  expect(LECTURES.some((f) => /^(cpp|java)\//.test(f))).toBe(false); // Harvard 45 лекцияға кірмейді
  for (const f of OWN_PAGES) {
    const s = read(f);
    expect(s, f).toContain('data-license="B"');
    expect(metaCopy(s), f).toMatch(/All Rights Reserved/);
    expect(metaCopy(s), f).not.toMatch(/CC BY-NC-SA|Harvard/);
    expect(licHref(s), f).toMatch(/copyright\.html$/);
    expect(s, f).not.toContain("creativecommons.org/licenses/by-nc-sa");
    expect(s, f).not.toContain('"isBasedOn"');
    expect(s, f).not.toContain('class="source-link"');
    expect(s, f).toContain("© 2026 Sagid Mustafa.");
    expect(s, f).toMatch(/class="translator-note"[^>]*>[^]*Sagid Mustafa-ның авторлық оқу материалы[^]*copyright\.html/);
    expect(s, f).not.toMatch(/Аударған: Sagid Mustafa/);
    const ld = JSON.parse(s.match(/<script type="application\/ld\+json">(\{.*?\})<\/script>/)[1]);
    expect(ld.license, f).toMatch(/copyright\.html$/);
  }
  // Реестр: B-course-cpp және B-course-java
  const reg = JSON.parse(read("licensing/components.json")).components;
  for (const c of ["cpp", "java"]) {
    const e = reg.find((x) => x.id === `B-course-${c}`);
    expect(e, c).toBeTruthy();
    expect(e.cat).toBe("B");
    expect(e.paths).toEqual([`${c}/**`]);
    expect(e.holder).toBe("Sagid Mustafa");
    expect(e.license).toBe("ARR");
  }
});

test("дербес беттер (B): All Rights Reserved, Harvard лицензиясы тағайындалмаған", () => {
  for (const f of B_PAGES) {
    const s = read(f);
    expect(s, f).toContain('data-license="B"');
    expect(metaCopy(s), f).toMatch(/All Rights Reserved/);
    expect(metaCopy(s), f).not.toMatch(/CC BY-NC-SA/);
    expect(licHref(s), f).toMatch(/copyright\.html$/);
    expect(s, f).not.toContain('"isBasedOn":"https://cs50.harvard.edu/"'); // дербес өнім Harvard-қа негізделген деп көрсетілмейді
  }
});

test("аралас беттер (M): екі лицензия да ашық көрсетілген, бүкіл сайт CC деп жарияланбайды", () => {
  for (const f of M_PAGES) {
    const s = read(f);
    expect(s, f).toContain('data-license="M"');
    expect(metaCopy(s), f).toMatch(/All Rights Reserved/);
    expect(metaCopy(s), f).toMatch(/CC BY-NC-SA 4\.0/);
    expect(licHref(s), f).toMatch(/copyright\.html$/);
  }
});

test("әр HTML бетінде талап етілген footer мәтіні және лицензиялар бетіне сілтеме бар", () => {
  const pages = [...LECTURES, ...B_PAGES, ...M_PAGES, "python/index.html", "sql/index.html", "ai/index.html", "web/index.html", "cpp/index.html", "java/index.html", "404.html"];
  for (const f of pages) {
    const s = read(f);
    expect(s, f).toContain("© 2026 Sagid Mustafa.");
    expect(s, f).toContain("Барлық құқықтар қорғалған.");
    expect(s, f).toContain("AO17 платформасының тәуелсіз бағдарламалық жасақтамасы, дизайны және авторлық оқу материалдары Sagid Mustafa-ға тиесілі.");
    expect(s, f).toContain("Harvard CS50 курстарының бастапқы материалдары мен олардың қазақша бейімдеулері тиісті Creative Commons лицензиясының талаптарына сәйкес таратылады.");
    expect(s, f).toContain("Қазақша аудармалардың авторы: Sagid Mustafa.");
    expect(s, f).toContain("AO17 — Harvard University-ден тәуелсіз жоба.");
    expect(s, f).toMatch(/href="(\.\.\/)*copyright\.html">Авторлық құқық және лицензиялар<\/a>/);
    expect(s, f).toContain("https://cs50.harvard.edu/x/");
    expect(s, f).not.toMatch(/Бұл - Sagid Mustafa-ның авторлық қазақша аудармасы/); // ескі «бәрі CC» тұжырымы жоқ
  }
});

test("copyright.html: тақырып, санаттар кестесі, Harvard және Sagid Mustafa бөлімдері, тәуелсіздік ескертуі", async ({ page }) => {
  await blockFonts(page);
  await page.goto("copyright.html");
  await expect(page).toHaveTitle(/Авторлық құқық және лицензиялар/);
  await expect(page.locator("h1")).toHaveText("Авторлық құқық және лицензиялар");
  await expect(page.locator(".lic-table tbody tr")).toHaveCount(4);
  await expect(page.locator("#harvard")).toBeVisible();
  await expect(page.locator("#author")).toBeVisible();
  await expect(page.locator("#third")).toBeVisible();
  await expect(page.locator("#review")).toBeVisible();
  await expect(page.getByText("Бұл - Harvard University-дің сайты емес")).toBeVisible();
  await expect(page.locator('a[href^="https://cs50.harvard.edu/"]').first()).toBeVisible();
  await expect(page.locator("main, #main").first()).not.toContainText("Harvard University бұл сайтты қолдайды");
});

test("мобильде: copyright беті мен footer көлденең айналмайды, footer мәтіні көрінеді", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 800 } });
  const page = await ctx.newPage();
  await blockFonts(page);
  for (const u of ["copyright.html", "index.html", "lectures/week-1.html", "games.html"]) {
    await page.goto(u);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), u).toBe(true);
    await expect(page.locator(".ft-legal")).toBeVisible();
    await expect(page.locator(".ft-legal .ft-copy")).toContainText("© 2026 Sagid Mustafa.");
  }
  await ctx.close();
});

test("лицензиялық құжаттар бар, реестр толық (сыныпталмаған файл жоқ)", () => {
  for (const f of ["LICENSE.md", "LICENSE-HARVARD.md", "LICENSE-PROPRIETARY.md", "COPYRIGHT.md", "THIRD-PARTY-LICENSES.md", "licensing/components.json", "licensing/LECTURE-AUDIT.md"]) {
    expect(fs.existsSync(path.join(ROOT, f)), f).toBe(true);
  }
  const lic = read("LICENSE.md");
  expect(lic).toContain("бір лицензия бүкіл жобаға қолданылмайды");
  expect(read("LICENSE-HARVARD.md")).toContain("CC BY-NC-SA 4.0");
  expect(read("LICENSE-PROPRIETARY.md")).toContain("All Rights Reserved");
  expect(read("COPYRIGHT.md")).toMatch(/\| Файл \/ жол \| Компонент \| Құқық иесі \| Лицензия \|/);
});

test("JSON-LD жарамды JSON және лицензияға сәйкес", () => {
  for (const f of [...LECTURES.slice(0, 5), ...B_PAGES, ...M_PAGES]) {
    const m = read(f).match(/<script type="application\/ld\+json">(\{.*?\})<\/script>/);
    expect(m, f).toBeTruthy();
    expect(() => JSON.parse(m[1]), f).not.toThrow();
  }
});
