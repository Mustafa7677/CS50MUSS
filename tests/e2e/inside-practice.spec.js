// © 2026 AO17 командасы. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md.
// INSIDE TECH-тің «Есептер залы» (academy/problems.html) мен «Есте сақтау карточкалары» (academy/cards.html) AO17-нің өз беттерінде
// (tools/academy/inside_pages.py, assets/js/problems.js, assets/js/cards.js, шешім фильмі - assets/js/board-film.js).
// Тексереміз: 7 есептің әрқайсысында үш қадам; күннің есебі (2026-01-01-ден бергі күн) мен соңғы жеті күн; егіз есеп стратегиясыз жабық,
// қате стратегия мен кеңес жұлдыз алады, жауап дәлдікпен тексеріледі; жұлдыздар, күндер мен жәшіктер INSIDE TECH-пен ортақ кілттерде;
// карточкалар Лейтнер жәшіктерімен; JS жоқ кезде бәрі оқылады; 360px, axe.
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");
const { blockFonts, collectErrors } = require("../support/helpers");
const AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const ROOT = path.resolve(__dirname, "../..");
const MEDIA = JSON.parse(fs.readFileSync(path.join(ROOT, "tools/academy/data/inside_media.json"), "utf8"));
const TODAY = new Date("2026-11-27T10:00:00");
const DAY = 86400000;
const daily = (d) => MEDIA.problems[(Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(2026, 0, 1)) / DAY) % 7 + 7) % 7];

test("есептер залы: 7 есеп, әрқайсысында фильм, стратегия, егіз есеп; күннің есебі мен соңғы жеті күн", async ({ page }) => {
  const errors = collectErrors(page);
  await page.clock.setFixedTime(TODAY);
  await page.goto("academy/problems.html");
  await expect(page.locator(".pr-p")).toHaveCount(7);
  for (const p of MEDIA.problems) {
    const a = page.locator("#pr-" + p.id);
    await expect(a.locator("h2")).toHaveText(p.title);
    await expect(a.locator(`#pf-${p.id}[data-bf] .bf-tr li`)).toHaveCount(p.film.frames.length);
    await expect(a.locator(".pr-opts button")).toHaveCount(p.strategy.options.length);
    await expect(a.locator('.pr-opts button[data-ok="1"]')).toHaveText(p.strategy.options[0]);
    await expect(a.locator(".pr-step")).toHaveCount(p.twin.steps.length);
  }
  const d = daily(TODAY);
  await expect(page.locator(".pr-p.is-daily")).toHaveCount(1);
  await expect(page.locator(".pr-p.is-daily")).toHaveAttribute("id", "pr-" + d.id);
  await expect(page.locator(".pr-p.is-daily .pr-badge")).toHaveText("Бүгінгі есеп");
  await expect(page.locator(".pr-daily a")).toHaveText(d.title);
  await expect(page.locator(".pr-week li")).toHaveCount(7);
  await expect(page.locator(".pr-week li").last()).toHaveClass(/is-today/);
  await expect(page.locator(".pr-week li").last()).toHaveText("27");
  await expect(page.locator(".pr-score")).toHaveText("Жұлдыз: 0 / 21 · күндер қатары: 0 · ең ұзағы: 0");
  expect(errors).toEqual([]);
});

test("егіз есеп: стратегиясыз жабық; қате стратегия мен кеңес жұлдыз алады; жауап дәлдікпен; жұлдыз бен күн сақталады", async ({ page }) => {
  await page.clock.setFixedTime(TODAY);
  await page.goto("academy/problems.html");
  const a = page.locator("#pr-ellipse-bed"), steps = a.locator(".pr-step");
  await expect(a.locator(".pr-lock")).toBeVisible();
  await expect(steps.first().locator("input")).toBeDisabled();
  await expect(steps.first().locator(".pr-ans")).toBeHidden();
  await expect(a.locator(".pr-close")).toBeHidden();
  await a.locator('.pr-opts button[data-ok="0"]').first().click();
  await expect(a.locator(".pr-fb")).toHaveText("Бұл идея бұл есепке келмейді. Тағы ойлан.");
  await a.locator('.pr-opts button[data-ok="1"]').click();
  await expect(a.locator(".pr-fb")).toHaveText("Дұрыс идея. Енді егіз есепті шығар.");
  await expect(a.locator(".pr-lock")).toBeHidden();
  await expect(steps.first().locator("input")).toBeFocused();
  await expect(steps.nth(1).locator("input")).toBeDisabled();
  // 1-қадам: сан емес -> ескерту, қате -> «әлі емес», дұрысы -> келесі қадам ашылады
  await steps.first().locator("input").fill("бес");
  await steps.first().locator(".pr-check").click();
  await expect(steps.first().locator(".pr-sfb")).toHaveText("Санды жаз: мысалы 62,8 не 1/7.");
  await steps.first().locator("input").fill("6");
  await steps.first().locator("input").press("Enter");
  await expect(steps.first().locator(".pr-sfb")).toHaveText("Әлі емес. Қайта есепте не кеңесті аш.");
  await steps.first().locator("input").fill("5");
  await steps.first().locator(".pr-check").click();
  await expect(steps.first()).toHaveClass(/is-done/);
  await expect(steps.nth(1).locator("input")).toBeFocused();
  // 2-қадам: кеңес бір жұлдыз алады
  await steps.nth(1).locator(".pr-hint-b").click();
  await expect(steps.nth(1).locator(".pr-hint")).toHaveText(MEDIA.problems[0].twin.steps[1].hint);
  await expect(steps.nth(1).locator(".pr-hint-b")).toBeDisabled();
  await steps.nth(1).locator("input").fill("3");
  await steps.nth(1).locator("input").press("Enter");
  await steps.nth(2).locator("input").fill("4");
  await steps.nth(2).locator("input").press("Enter");
  // 4-қадам: 20π ≈ 62,83; рұқсат 0,1 - «62,8» (үтірмен) дұрыс
  await steps.nth(3).locator("input").fill("62,8");
  await steps.nth(3).locator("input").press("Enter");
  await expect(a.locator(".pr-result")).toHaveText("Есеп шешілді: ★☆☆ (кеңес не қате стратегия бір жұлдыз алады)");
  await expect(a.locator(".pr-close")).toBeVisible();
  expect(JSON.parse(await page.evaluate(() => localStorage.getItem("inside-tech:problems")))).toEqual({ stars: { "ellipse-bed": 1 }, streak: { days: ["2026-11-27"] } });
  await expect(page.locator(".pr-score")).toHaveText("Жұлдыз: 1 / 21 · күндер қатары: 1 · ең ұзағы: 1");
  await expect(page.locator(".pr-week li").last()).toHaveClass(/is-solved/);
  await page.reload();
  await expect(page.locator("#pr-ellipse-bed .pr-stars")).toHaveText("Шешілді: ★☆☆");
});

test("күндер қатары INSIDE TECH-пен ортақ: бұрынғы күндер мен жұлдыздар оқылады, бөгде мәндер алынады", async ({ page }) => {
  await page.clock.setFixedTime(TODAY);
  await page.addInitScript(() => localStorage.setItem("inside-tech:problems", JSON.stringify({ stars: { bdp: 3, nope: 3, birthday: 9 }, streak: { days: ["2026-11-20", "2026-11-25", "2026-11-26", "жоқ"] } })));
  await page.goto("academy/problems.html");
  await expect(page.locator(".pr-score")).toHaveText("Жұлдыз: 3 / 21 · күндер қатары: 2 · ең ұзағы: 2");
  await expect(page.locator(".pr-week li.is-solved")).toHaveCount(2);   // жолақ - соңғы жеті күн (21-27), 20-сы оған кірмейді
  await expect(page.locator("#pr-bdp .pr-stars")).toHaveText("Шешілді: ★★★");
  await expect(page.locator("#pr-birthday .pr-stars")).toHaveText("");
});

test("карточкалар: аудару, білдім мен білмедім, Лейтнер жәшіктері; INSIDE TECH-пен ортақ кілт", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto("academy/cards.html");
  const box = (b) => page.locator(`.cd-box-list li[data-box="${b}"] b`);
  await expect(page.locator(".cd-due")).toHaveText("Бүгін қалды: 22 · білдім: 0 · қайталаймын: 0");
  await expect(box(1)).toHaveText("22");
  await expect(page.locator(".cd-front")).toHaveText(MEDIA.cards[0].front);
  await expect(page.locator(".cd-back")).toBeHidden();
  await page.locator(".cd-flip").click();
  await expect(page.locator(".cd-back")).toHaveText(MEDIA.cards[0].back);
  await expect(page.locator(".cd-yes")).toBeFocused();
  await page.locator(".cd-yes").click();
  await expect(box(1)).toHaveText("21");
  await expect(box(2)).toHaveText("1");
  await expect(page.locator(".cd-front")).toHaveText(MEDIA.cards[1].front);
  await page.locator(".cd-flip").click();
  await page.locator(".cd-no").click();
  await expect(page.locator(".cd-due")).toHaveText("Бүгін қалды: 20 · білдім: 1 · қайталаймын: 1");
  const deck = JSON.parse(await page.evaluate(() => localStorage.getItem("inside-tech:cards")));
  expect(deck[MEDIA.cards[0].id].box).toBe(2);
  expect(deck[MEDIA.cards[0].id].due - Date.now()).toBeGreaterThan(0.9 * DAY);
  expect(deck[MEDIA.cards[1].id].box).toBe(1);
  expect(errors).toEqual([]);
});

test("карточкалар: сессияның соңы - келесі қайту күні не «тағы бір айналым»", async ({ page }) => {
  await page.addInitScript((ids) => {
    const far = Date.now() + 3 * 86400000, deck = {};
    ids.forEach((id, i) => { deck[id] = i === 0 ? { box: 3, due: Date.now() - 1000 } : { box: 4, due: far }; });
    if (!sessionStorage.getItem("seeded")) { localStorage.setItem("inside-tech:cards", JSON.stringify(deck)); sessionStorage.setItem("seeded", "1"); }
  }, MEDIA.cards.map((c) => c.id));
  await page.goto("academy/cards.html");
  await expect(page.locator(".cd-due")).toHaveText("Бүгін қалды: 1 · білдім: 0 · қайталаймын: 0");
  await expect(page.locator(".cd-lab")).toHaveText(`${"Веб-әзірлеу"} · 3-жәшік`);
  await page.locator(".cd-flip").click();
  await page.locator(".cd-no").click();
  await expect(page.locator(".cd-done")).toContainText("Сессия бітті: білдім 0, қайталаймын 1. Қайталайтын 1 карточка қазір дайын.");
  await page.locator(".cd-again").click();
  await expect(page.locator(".cd-front")).toHaveText(MEDIA.cards[0].front);
  await expect(page.locator(".cd-lab")).toHaveText("Веб-әзірлеу · 1-жәшік");
  await page.locator(".cd-flip").click();
  await page.locator(".cd-yes").click();
  await expect(page.locator(".cd-done")).toContainText("Бүгінге бітті: білдім 1, қайталаймын 0. Келесі карточка");
  await expect(page.locator(".cd-done")).toContainText("(1 күннен соң)");
});

test("JS жоқ кезде: есептердің идеясы, стратегиясы мен әр қадамның жауабы, барлық карточка оқылады", async ({ browser }) => {
  const c = await browser.newContext({ javaScriptEnabled: false });
  const p = await c.newPage();
  await p.goto("academy/problems.html");
  await expect(p.locator(".pr-hud")).toBeHidden();
  await p.locator("#pr-ellipse-bed .pr-step").nth(3).locator(".pr-ans summary").click();
  await expect(p.locator("#pr-ellipse-bed .pr-step").nth(3).locator(".pr-ans")).toContainText("62,8 м²");
  await expect(p.locator("#pr-ellipse-bed .pr-close")).toBeVisible();
  await p.goto("academy/cards.html");
  await expect(p.locator(".cd-review")).toBeHidden();
  await expect(p.locator(".cd-all li")).toHaveCount(22);
  await c.close();
});

test("«Қалай оқу керек?» мен 3D хабы жаңа беттерге апарады", async ({ page }) => {
  await page.goto("academy/learn.html");
  await expect(page.locator("#ep-cram .lh-tool a").first()).toHaveAttribute("href", "cards.html");
  await expect(page.locator("#ep-examples .lh-tool a").first()).toHaveAttribute("href", "problems.html");
  await page.goto("academy/3d/index.html");
  await expect(page.locator('a.l3-cnat[href="../problems.html"]')).toContainText("Есептер залы");
  await expect(page.locator('a.l3-cnat[href="../cards.html"]')).toContainText("Есте сақтау карточкалары");
});

for (const scheme of ["light", "dark"]) {
  test(`360px, ${scheme}: есептер залы мен карточкалар көлденең жылжымайды; axe таза`, async ({ browser }) => {
    const c = await browser.newContext({ viewport: { width: 360, height: 740 }, colorScheme: scheme, reducedMotion: "reduce" });
    await blockFonts(c);
    const p = await c.newPage();
    for (const u of ["academy/problems.html", "academy/cards.html"]) {
      await p.goto(u);
      if (u.includes("problems")) await p.locator('#pr-ellipse-bed .pr-opts button[data-ok="1"]').click();
      else await p.locator(".cd-flip").click();
      expect(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), u).toBe(true);
      await p.addScriptTag({ content: AXE });
      const v = await p.evaluate(async () => (await axe.run(document.getElementById("main"), { runOnly: ["wcag2a", "wcag2aa"], resultTypes: ["violations"] })).violations
        .filter((x) => ["serious", "critical"].includes(x.impact)).map((x) => `${x.id}: ${x.nodes.length} (${x.nodes[0].html.slice(0, 140)})`));
      expect(v, u).toEqual([]);
    }
    await c.close();
  });
}
