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

test("3D айналым: скроллмен бұрылады, алдыңғы адамның есімі жазылады", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("team.html");
  await expect(page.locator(".rng-c")).toHaveCount(5);
  await expect(page.locator(".rng-now")).toHaveText("Tutkabayeva Gulzat");
  await page.evaluate(() => { const t = document.querySelector(".rng"); scrollTo(0, t.getBoundingClientRect().top + scrollY + (t.offsetHeight - innerHeight) / 2); });
  await expect(page.locator(".rng-now")).toHaveText("Sagid Mustafa");
  await expect(page.locator(".rng-c").nth(2)).toHaveAttribute("href", "team/sagid.html");
});

test("манифест: сөздер скроллмен кезекпен жанады", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("team.html");
  const w = page.locator(".mf").first().locator(".mf-w");
  expect(await w.count()).toBeGreaterThan(10);
  const op = async (i) => +(await w.nth(i).evaluate((e) => getComputedStyle(e).opacity));
  await page.evaluate(() => { const t = document.querySelector(".mf"); scrollTo(0, t.getBoundingClientRect().top + scrollY + (t.offsetHeight - innerHeight) * .3); });
  await expect.poll(() => op(0)).toBeGreaterThan(.95);
  expect(await op((await w.count()) - 1)).toBeLessThan(.5);
  await page.evaluate(() => { const t = document.querySelector(".mf"); scrollTo(0, t.getBoundingClientRect().top + scrollY + t.offsetHeight - innerHeight); });
  const n = await w.count();
  await expect.poll(() => op(n - 1)).toBeGreaterThan(.95);
  await expect(page.locator(".mf-t").first()).toContainText("Бес адам, бір шаңырақ.");
});

test("қақпа: шеңберді жүргізу ашады, «Өткізу» бірден жабады, сессияда бір рет", async ({ browser }) => {
  const c = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await c.addInitScript(() => { try { sessionStorage.setItem("ao17:test-gate", "1"); } catch (e) {} });
  await blockFonts(c);
  const p = await c.newPage();
  await p.goto("team.html");
  const g = p.locator(".gt");
  await expect(g).toBeVisible();
  await expect(p.locator("html")).toHaveClass(/gt-lock/);
  for (let k = 0; k < 30; k++) await p.mouse.wheel(0, 120);
  await expect(p.locator(".gt-t")).toHaveText("Бес адам. Бір шаңырақ.");
  await expect(g).toHaveCount(0, { timeout: 5000 });
  await expect(p.locator("html")).not.toHaveClass(/gt-lock/);
  await p.reload();
  await expect(p.locator(".gt")).toHaveCount(0);
  await p.evaluate(() => sessionStorage.removeItem("ao17:team-pl")); await p.reload();
  await p.locator(".gt-skip").click();
  await expect(p.locator(".gt")).toHaveCount(0, { timeout: 3000 });
  await c.close();
});

test("тірі қолтаңбалар мен құрылу: назардағы кадр ойнайды, бөлшектер терезеге жиналады", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("team.html");
  await expect(page.locator(".uyq-p .dm")).toHaveCount(5);
  await page.evaluate(() => { const t = document.querySelector(".uyq"); scrollTo(0, t.getBoundingClientRect().top + scrollY + (t.offsetHeight - innerHeight) * .25); });
  await expect(page.locator(".uyq-p").nth(1)).toHaveClass(/is-act/);
  await expect(page.locator(".uyq-p").nth(3)).not.toHaveClass(/is-act/);
  await expect(page.locator(".cr-pc")).toHaveCount(5);
  await page.evaluate(() => { const t = document.querySelector(".cr"); scrollTo(0, t.getBoundingClientRect().top + scrollY + t.offsetHeight - innerHeight); });
  await expect.poll(async () => { const w = await page.locator(".cr-win").boundingBox(); const a = await page.locator(".cr-a").boundingBox(); return a.x >= w.x - 2 && a.x + a.width <= w.x + w.width + 2; }).toBe(true);
  await expect(page.locator(".mf-end .mf-t")).toContainText("мыңдаған оқушы");
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

test("3D фильм «Жасалмаған сайт»: өзі ойнайды, сайт сілтемелері шынайы, тарту, «Өткізу» - шынайы фото", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto("team/3d.html");
  await expect(page.locator(".um")).toHaveClass(/um-(live|static)/);
  await expect(page.locator(".um-cr-l > div")).toHaveCount(5);
  await expect(page.locator('.um-cr-l a[href="sagid.html"]')).toHaveText("Sagid Mustafa");
  if (await page.locator(".um").evaluate((e) => e.classList.contains("um-live"))) {
    await expect(page.locator(".um-site")).toHaveClass(/is-on/);
    await expect(page.locator('.um-site a[href="../index.html#academies"]')).toHaveCount(1);
    await expect(page.locator(".um")).toHaveAttribute("data-act", "1");
    const w0 = await page.locator(".um-bar i").evaluate((e) => e.style.transform);
    await page.waitForTimeout(1500);
    expect(await page.locator(".um-bar i").evaluate((e) => e.style.transform)).not.toBe(w0);   // скроллсыз алға жүреді
    // IV: бөлшектерді тарту
    await page.goto("team/3d.html?seek#t=74");
    await expect(page.locator(".um")).toHaveAttribute("data-act", "4", { timeout: 15000 });
    await expect(page.locator(".um-hint")).toHaveClass(/is-on/, { timeout: 15000 });
    const box = await page.locator(".um-cv").boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 160, box.y + box.height / 2 + 40, { steps: 8 }); await page.mouse.up();
    await expect(page.locator(".um-hint")).not.toHaveClass(/is-on/);
    // «Өткізу» - VI, шынайы фото және соңғы сөз; «Қайта көру» - басынан
    await page.mouse.move(40, 300);
    await page.locator(".um-skip").click();
    await expect(page.locator(".um")).toHaveAttribute("data-act", "6", { timeout: 15000 });
    await expect(page.locator(".um-fin")).toHaveClass(/is-on/, { timeout: 15000 });
    await expect(page.locator(".um-f2")).toHaveText("Бес адамның еңбегімен жасалды.");
    await expect(page.locator(".um-fin")).toHaveClass(/is-end/, { timeout: 15000 });
    await page.locator(".um-replay").click();
    await expect(page.locator(".um")).toHaveAttribute("data-act", "1", { timeout: 15000 });
  }
  expect(errors).toEqual([]);
});

test("3D фильм: қозғалыс азайса - титрлер мен фото, WebGL іске қосылмайды", async ({ browser }) => {
  const c = await browser.newContext({ reducedMotion: "reduce" });
  await blockFonts(c);
  const p = await c.newPage();
  await p.goto("team/3d.html");
  await expect(p.locator(".um")).toHaveClass(/um-static/);
  await expect(p.locator(".um-film")).toBeHidden();
  await expect(p.locator(".um-cr-ph img")).toBeVisible();
  await expect(p.locator(".um-cr-steps li")).toHaveCount(6);
  await c.close();
});

test("команда бетінде 3D фильмге сілтеме бар", async ({ page }) => {
  await page.goto("team.html");
  await expect(page.locator('a.shx-3d[href="team/3d.html"]')).toHaveCount(1);
});

test("басты бет: 1-сахнаның 3D шаңырағы (WebGL), әдепкі автотестте - SVG", async ({ browser }) => {
  const c = await browser.newContext();
  await blockFonts(c);
  await c.addInitScript(() => { try { sessionStorage.setItem("ao17:test-gl", "1"); sessionStorage.setItem("ao17:intro", "1"); } catch (e) { /* */ } });
  const p = await c.newPage();
  const errors = collectErrors(p);
  await p.goto("index.html?nofilm");
  const gl = await p.evaluate(() => { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); });
  if (gl) {
    await expect(p.locator(".st-s1.st-3d canvas.st-gl[aria-hidden=true]")).toHaveCount(1, { timeout: 15000 });
    await expect(p.locator(".st-s1 .s17-ring").first()).toHaveCSS("opacity", "0");
    await expect(p.locator(".st-s1 .s17-mast")).toBeVisible();   // «Қазақ» газеті орнында
  }
  expect(errors).toEqual([]);
  await c.close();
  const c2 = await browser.newContext({ reducedMotion: "reduce" });
  await c2.addInitScript(() => { try { sessionStorage.setItem("ao17:test-gl", "1"); } catch (e) { /* */ } });
  const p2 = await c2.newPage();
  await p2.goto("index.html?nofilm");
  await p2.waitForTimeout(1500);
  await expect(p2.locator(".st-gl")).toHaveCount(0);
  await c2.close();
});

for (const scheme of ["light", "dark"]) {
  test(`360px, ${scheme}: көлденең жылжу жоқ, axe таза`, async ({ browser }) => {
    const c = await browser.newContext({ viewport: { width: 360, height: 740 }, colorScheme: scheme, reducedMotion: "reduce" });
    await blockFonts(c);
    const p = await c.newPage();
    for (const u of ["team.html", "team/3d.html", ...M.map((m) => `team/${m.slug}.html`)]) {
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
