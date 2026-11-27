// © 2026 AO17 командасы. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md.
// INSIDE TECH-тің «Бір басудың саяхаты» (academy/journey.html) және «Кім боламын?» (academy/careers.html) бөлімдері AO17-нің өз беттерінде
// (tools/academy/inside_pages.py, assets/js/journey.js, assets/js/careers.js).
// Тексереміз: саяхаттың он аялдамасы мен уақыт шкаласы, сұрақтар (қате нұсқа өшеді, дұрысы түсіндірмені ашады, шешілгені сақталады),
// шкала экрандағы аялдаманы көрсетеді; мамандық тесті INSIDE TECH-пен ортақ кілтте, нәтиже мен сәйкестік, қайта тапсыру, жолдағы дайындық;
// JS жоқ кезде бәрі оқылады; 3D хабы мен курс беті осы беттерге апарады; 360px, axe.
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");
const { blockFonts, collectErrors } = require("../support/helpers");
const AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const ROOT = path.resolve(__dirname, "../..");
const MEDIA = JSON.parse(fs.readFileSync(path.join(ROOT, "tools/academy/data/inside_media.json"), "utf8"));
const TOTAL = MEDIA.journey.reduce((n, s) => n + s.ms, 0);

test("саяхат: он аялдама, уақыттары қосылады, әр аялдаманың зертханасы бар", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto("academy/journey.html");
  await expect(page.locator(".jr-stop")).toHaveCount(10);
  await expect(page.locator(".jr-seg")).toHaveCount(10);
  await expect(page.locator("#main")).toHaveAttribute("data-total", String(TOTAL));
  let t = 0;
  for (const [k, s] of MEDIA.journey.entries()) {
    const li = page.locator(".jr-stop").nth(k);
    await expect(li.locator(".jr-time span")).toHaveText(`${t} → ${t + s.ms} мс`);
    await expect(li.locator("h2")).toHaveText(s.title);
    t += s.ms;
  }
  for (const h of await page.locator(".jr-lab a").evaluateAll((as) => as.map((a) => a.getAttribute("href"))))
    expect(h).toMatch(/^3d\/index\.html#[a-z]+$/);
  await expect(page.locator(".jr-prog")).toHaveText("0 / 10 сұрақ шешілді");
  expect(errors).toEqual([]);
});

test("саяхат: қате нұсқа өшеді, дұрысы түсіндірмені ашады, шешілгені сақталады; шкала экрандағы аялдаманы көрсетеді", async ({ page }) => {
  await page.goto("academy/journey.html");
  const s = MEDIA.journey[0], li = page.locator("#jr-key");
  const wrong = s.question.answer === 0 ? 1 : 0;
  await li.locator(`.jr-opts button[data-i="${wrong}"]`).click();
  await expect(li.locator(".jr-fb")).toHaveText("Жоқ, тағы ойлан.");
  await expect(li.locator(`.jr-opts button[data-i="${wrong}"]`)).toBeDisabled();
  await expect(li.locator(".jr-ans")).not.toHaveAttribute("open", "");
  await li.locator(`.jr-opts button[data-i="${s.question.answer}"]`).click();
  await expect(li.locator(".jr-fb")).toHaveText("Дұрыс!");
  await expect(li.locator(".jr-ans")).toHaveAttribute("open", "");
  await expect(page.locator(".jr-prog")).toHaveText("1 / 10 сұрақ шешілді");
  await page.reload();
  await expect(page.locator("#jr-key .jr-opts button").first()).toBeDisabled();
  await expect(page.locator(".jr-prog")).toHaveText("1 / 10 сұрақ шешілді");
  // аялдамаға жеткенде шкала оны белгілейді, t = сол аялдаманың соңы
  await page.locator("#jr-tls").evaluate((el) => el.scrollIntoView({ block: "center" }));
  await expect(page.locator("#main")).toHaveAttribute("data-now", "4");
  await expect(page.locator(".jr-seg").nth(4)).toHaveClass(/is-now/);
  await expect(page.locator(".jr-seg").nth(2)).toHaveClass(/is-past/);
  await expect(page.locator(".jr-now b")).toHaveText(`t = ${MEDIA.journey.slice(0, 5).reduce((n, x) => n + x.ms, 0)} мс`);
});

test("мамандық тесті: жеті сұрақ, нәтиже мен сәйкестік; INSIDE TECH-пен ортақ кілт; қайта тапсыру", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto("academy/careers.html");
  const quiz = page.locator(".cr-quiz");
  await expect(quiz).toBeVisible();
  await expect(quiz.locator(".cr-step")).toHaveText("1 / 7-сұрақ");
  await expect(quiz.locator(".cr-back")).toBeHidden();
  await quiz.locator(".cr-opts button").nth(3).click();
  await expect(quiz.locator(".cr-step")).toHaveText("2 / 7-сұрақ");
  await quiz.locator(".cr-back").click();
  await expect(quiz.locator(".cr-step")).toHaveText("1 / 7-сұрақ");
  for (let k = 0; k < 7; k++) await quiz.locator(".cr-opts button").first().click();
  await expect(quiz.locator(".cr-res")).toBeVisible();
  await expect(quiz.locator(".cr-rank li")).toHaveCount(8);
  expect(JSON.parse(await page.evaluate(() => localStorage.getItem("inside-tech:career")))).toEqual([0, 0, 0, 0, 0, 0, 0]);
  // әр сұрақтың бірінші нұсқасы: сәйкестік - мамандықтың ең көп ұпайының пайызы (INSIDE TECH-тегі rank())
  const max = (id) => MEDIA.careerQuiz.reduce((n, q) => n + Math.max(0, ...q.options.map((o) => o.adds[id] || 0)), 0);
  const score = {};
  for (const q of MEDIA.careerQuiz) for (const [id, n] of Object.entries(q.options[0].adds)) score[id] = (score[id] || 0) + n;
  const want = MEDIA.careers.map((c) => ({ id: c.id, p: Math.round((100 * (score[c.id] || 0)) / max(c.id)) })).sort((a, b) => b.p - a.p);
  const top = MEDIA.careers.find((c) => c.id === want[0].id);
  await expect(quiz.locator(".cr-top-name")).toHaveText(`${top.title} · ${want[0].p}% сәйкес`);
  await expect(quiz.locator(".cr-top-name a")).toHaveAttribute("href", "#cr-" + top.id);
  await expect(page.locator(`#cr-${top.id}`)).toHaveClass(/is-top/);
  await expect(page.locator(`#cr-${top.id} .cr-match`)).toHaveText(`Тест бойынша сәйкестігі: ${want[0].p}%`);
  await page.reload();
  await expect(page.locator(".cr-res")).toBeVisible();
  await page.locator(".cr-again").click();
  await expect(page.locator(".cr-step")).toHaveText("1 / 7-сұрақ");
  expect(await page.evaluate(() => localStorage.getItem("inside-tech:career"))).toBeNull();
  await expect(page.locator(".cr-card.is-top")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("мамандықтың жолы: 2-бөлімнің бар сабақтары; тесті шешілген сабақ «өтті» болып белгіленеді", async ({ page }) => {
  const fe = MEDIA.careers.find((c) => c.id === "frontend");
  await page.addInitScript((lid) => localStorage.setItem("ao17:lab3d", JSON.stringify({ [lid]: ["a:q1", "a:q2", "a:q3", "a:q4", "a:q5", "a:q6", "a:q7", "a:q8", "a:q9", "a:q10"] })), fe.road[0]);
  await page.goto("academy/careers.html");
  const road = page.locator("#cr-frontend .cr-road a");
  await expect(road).toHaveCount(fe.road.length);
  for (const h of await page.locator(".cr-road a").evaluateAll((as) => as.map((a) => a.getAttribute("href")))) {
    expect(h).toMatch(/^3d\/[a-z]+\/[a-z0-9-]+\.html$/);
    expect(fs.existsSync(path.join(ROOT, "academy", h)), h).toBe(true);
  }
  await expect(road.first()).toHaveClass(/is-done/);
  await expect(page.locator("#cr-frontend .cr-ready")).toHaveText(`· өттің: 1 / ${fe.road.length}`);
  await expect(page.locator("#cr-frontend .cr-av")).toHaveAttribute("aria-hidden", "true");
  await expect(page.locator("#cr-frontend .cr-play a")).toHaveAttribute("href", "3d/app/index.html#arcade");
});

test("JS жоқ кезде: тест жасырын, мамандықтар мен саяхаттың жауаптары оқылады", async ({ browser }) => {
  const c = await browser.newContext({ javaScriptEnabled: false });
  const p = await c.newPage();
  await p.goto("academy/careers.html");
  await expect(p.locator(".cr-quiz")).toBeHidden();
  await expect(p.locator(".cr-card")).toHaveCount(8);
  await p.goto("academy/journey.html");
  await p.locator("#jr-dns .jr-ans summary").click();
  await expect(p.locator("#jr-dns .jr-ans")).toContainText("Дұрыс жауап:");
  await c.close();
});

test("3D хабы, курс беті және 2-бөлімнің хабы саяхат пен мамандық беттеріне апарады", async ({ page }) => {
  await page.goto("academy/3d/index.html");
  await expect(page.locator('#stories a.l3-cnat[href="../journey.html"]')).toContainText("Бір басудың саяхаты");
  await expect(page.locator('#career a.l3-cnat[href="../careers.html"]')).toContainText("Кім боламын?");
  await page.goto("academy/course.html");
  await expect(page.locator('a[href="journey.html"]').first()).toBeVisible();
});

for (const scheme of ["light", "dark"]) {
  test(`360px, ${scheme}: саяхат пен мамандық беттері көлденең жылжымайды; axe таза`, async ({ browser }) => {
    const c = await browser.newContext({ viewport: { width: 360, height: 740 }, colorScheme: scheme, reducedMotion: "reduce" });
    await blockFonts(c);
    const p = await c.newPage();
    for (const u of ["academy/journey.html", "academy/careers.html"]) {
      await p.goto(u);
      expect(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), u).toBe(true);
      await p.addScriptTag({ content: AXE });
      const v = await p.evaluate(async () => (await axe.run(document.getElementById("main"), { runOnly: ["wcag2a", "wcag2aa"], resultTypes: ["violations"] })).violations
        .filter((x) => ["serious", "critical"].includes(x.impact)).map((x) => `${x.id}: ${x.nodes.length} (${x.nodes[0].html.slice(0, 140)})`));
      expect(v, u).toEqual([]);
    }
    await c.close();
  });
}
