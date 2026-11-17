// © 2026 AO17 командасы. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md.
// «Команда» (tools/team_build.py, licensing/team.json): фото-фильм, бес жеке бет, басты беттің 8-сахнасы, авторлық жол.
// Тексереміз: дерек көзімен сәйкестік (есім, жас, рөл), фильмді басқару (келесі/алдыңғы/кадр), қозғалыссыз режим,
// жеке беттердегі нақты сандар мен сілтемелер, 360px-те көлденең жылжу жоқ, axe wcag2a/aa (serious+critical) = 0, консоль қатесі жоқ.
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");
const { blockFonts, collectErrors } = require("../support/helpers");
const AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const ROOT = path.resolve(__dirname, "../..");
const TEAM = JSON.parse(fs.readFileSync(path.join(ROOT, "licensing/team.json"), "utf8"));
const M = TEAM.members;

test.beforeEach(async ({ context }) => { await blockFonts(context); });

test("дерек көзі: бес автор, екі дизайнер, жас пен фото бар", () => {
  expect(M.map((m) => m.name)).toEqual(["Tutkabayeva Gulzat", "Toktybay Dastan", "Sagid Mustafa", "Magzhan Romanov", "Kopenova Merey"]);
  expect(M[2].slug).toBe("sagid");   // жоба жетекшісі - ортада
  expect(M.filter((m) => m.kind === "design").map((m) => m.slug).sort()).toEqual(["gulzat", "merey"]);
  expect(M.map((m) => m.age)).toEqual([18, 17, 18, 17, 17]);
  for (const m of M) {
    expect(fs.existsSync(path.join(ROOT, `assets/img/team/${m.slug}.jpg`)), m.slug).toBe(true);
    for (const [href] of m.works) expect(fs.existsSync(path.join(ROOT, href.endsWith("/") ? href + "index.html" : href)), href).toBe(true);
  }
});

test("авторлық жол: футер, JSON-LD және мета барлық беттерде командаға сілтейді", () => {
  for (const f of ["index.html", "team.html", "team/gulzat.html", "games.html", "academy/index.html"]) {
    const s = fs.readFileSync(path.join(ROOT, f), "utf8");
    expect(s, f).toContain("© 2026 AO17 командасы.");
    for (const m of M) expect(s, f).toContain(m.name);
    expect(s, f).toMatch(/href="(\.\.\/)*team\.html">Команда<\/a>/);
  }
  const ld = JSON.parse(fs.readFileSync(path.join(ROOT, "team.html"), "utf8").match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
  expect(ld.copyrightHolder.name).toBe("AO17 командасы");
  expect(ld.copyrightHolder.member.map((p) => p.name)).toEqual(M.map((m) => m.name));
});

test("команда беті: скролл-фильм, көлденең галерея, фото-фильм кадрлары мен басқару", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto("team.html");
  const shots = JSON.parse(await page.locator("#tf-data").textContent());
  expect(shots).toHaveLength(9);
  expect(shots.filter((s) => s.who).map((s) => s.who).sort()).toEqual(M.map((m) => m.slug).sort());
  await expect(page.locator(".tf-bar")).toBeVisible();
  await expect(page.locator(".tf-dot")).toHaveCount(9);
  await expect(page.locator(".tf-t")).toHaveText(shots[0].t);
  await expect(page.locator(".shx-l1")).toHaveText("Бір шаңырақ");
  await page.locator(".tf-next").click();
  await expect(page.locator(".tf-t")).toHaveText(shots[1].t);
  await expect(page.locator(".tf-n")).toHaveText("2 / 9");
  await expect(page.locator(".tf-cap")).toHaveAttribute("aria-live", "polite");
  await page.locator(".tf-dot").nth(7).click();
  await expect(page.locator(".tf-t")).toHaveText(shots[7].t);
  await expect(page.locator(".tf-l.is-cur img")).toHaveAttribute("src", /duo\.jpg$/);
  await page.locator(".tf-prev").click();
  await expect(page.locator(".tf-l.is-cur img")).toHaveAttribute("src", /work\.jpg$/);
  // көлденең галерея: бес кадр, әрқайсысы жеке бетке
  const panels = page.locator(".uyq-p");
  await expect(panels).toHaveCount(5);
  for (const [i, m] of M.entries()) {
    await expect(panels.nth(i).locator("a")).toHaveAttribute("href", `team/${m.slug}.html`);
    await expect(panels.nth(i)).toContainText(`${m.age} жас`);
  }
  await expect(page.locator(".uyq-hb")).toHaveCount(5);
  await page.goto("team/gulzat.html");
  await expect(page).toHaveURL(/team\/gulzat\.html$/);
  await expect(page.locator("h1")).toHaveText("Tutkabayeva Gulzat");
  expect(errors).toEqual([]);
});

test("қозғалыс азайтылса: фильм өздігінен ойнамайды, қолмен ауысады", async ({ browser }) => {
  const c = await browser.newContext({ reducedMotion: "reduce" });
  await blockFonts(c);
  const p = await c.newPage();
  await p.goto("team.html");
  await p.waitForTimeout(3500);
  await expect(p.locator(".tf-n")).toHaveText("1 / 9");
  await expect(p.locator(".tf-play")).toHaveAttribute("aria-label", "Ойнату");
  await p.locator(".tf-next").click();
  await expect(p.locator(".tf-n")).toHaveText("2 / 9");
  await c.close();
});

test("жеке беттер: рөл, жас, қолтаңба, нақты сілтемелер, көршілер", async ({ page }) => {
  for (const [i, m] of M.entries()) {
    const errors = collectErrors(page);
    await page.goto(`team/${m.slug}.html`);
    await expect(page.locator("h1")).toHaveText(m.name);
    await expect(page.locator(".tp-meta")).toContainText(m.role);
    await expect(page.locator(".tp-meta")).toContainText(`${m.age} жас`);
    await expect(page.locator(".tp-sig .sg")).toHaveCount(1);
    await expect(page.locator(".tp-works a")).toHaveCount(m.works.length);
    await expect(page.locator(".tp-nav .tp-mini").last()).toHaveAttribute("href", `${M[(i + 1) % M.length].slug}.html`);
    expect(errors, m.slug).toEqual([]);
  }
  // Dastan: сандар файлдардан есептеледі - тест өзі қайта санайды
  await page.goto("team/dastan.html");
  const specs = fs.readdirSync(path.join(ROOT, "tests/e2e")).filter((f) => f.endsWith(".spec.js")).length;
  await expect(page.locator(".sg-stats b").nth(3)).toHaveAttribute("data-to", String(specs));
  // Magzhan: код үзіндісі - нақты файлдан
  await page.goto("team/magzhan.html");
  expect(fs.readFileSync(path.join(ROOT, "assets/js/rl-mathexpr.js"), "utf8")).toContain((await page.locator(".sg-ln").nth(1).textContent()).trim());
});

test("скролл: ашылу сахнасы мен галерея --p бойынша жылжиды, Sagid ортада", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("team.html");
  const open = page.locator(".shx-open");
  await expect(open).toHaveAttribute("style", /--p: 0/);
  await page.evaluate(() => { const o = document.querySelector(".shx-open"); scrollTo(0, o.getBoundingClientRect().top + scrollY + o.offsetHeight - innerHeight); });
  await expect.poll(async () => +(await open.evaluate((e) => e.style.getPropertyValue("--p")))).toBeGreaterThan(0.99);
  await expect(page.locator(".shx-l1")).toHaveCSS("opacity", "1");
  // галереяның ортасы - үшінші кадр (Sagid Mustafa)
  await page.evaluate(() => { const t = document.querySelector(".uyq"); scrollTo(0, t.getBoundingClientRect().top + scrollY + (t.offsetHeight - innerHeight) / 2); });
  await expect(page.locator(".uyq-hb.is-on")).toHaveText("Sagid Mustafa");
  await expect.poll(async () => { const b = await page.locator(".uyq-p").nth(2).boundingBox(); return Math.abs(b.x + b.width / 2 - 640); }).toBeLessThan(12);
});

test("басты бет: 8-сахна, бес есім, команда бетіне сілтеме", async ({ page }) => {
  await page.goto("index.html");
  const s = page.locator("#scene-team");
  await s.scrollIntoViewIfNeeded();
  await expect(s).toHaveClass(/is-on/);
  await expect(s.locator(".at-names li")).toHaveCount(5);
  await expect(s.locator(".at-dot")).toHaveCount(5);
  await expect(s.locator('a[href="team.html"]')).toBeVisible();
});

for (const scheme of ["light", "dark"]) {
  test(`360px, ${scheme}: көлденең жылжу жоқ, axe таза`, async ({ browser }) => {
    const c = await browser.newContext({ viewport: { width: 360, height: 740 }, colorScheme: scheme, reducedMotion: "reduce" });
    await blockFonts(c);
    const p = await c.newPage();
    for (const u of ["team.html", ...M.map((m) => `team/${m.slug}.html`)]) {
      await p.goto(u);
      expect(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), u + ": horizontal scroll").toBe(true);
      await p.addScriptTag({ content: AXE });
      const v = await p.evaluate(async () => (await axe.run(document.querySelector("main"), { runOnly: ["wcag2a", "wcag2aa"], resultTypes: ["violations"] })).violations
        .filter((x) => ["serious", "critical"].includes(x.impact)).map((x) => `${x.id}: ${x.nodes.length} (${x.nodes[0].html.slice(0, 140)})`));
      expect(v, u).toEqual([]);
    }
    await c.close();
  });
}
