// © 2026 AO17 командасы. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md.
// AO17 · 3D зертхана (academy/3d/, tools/academy/lab3d.py): INSIDE TECH-тің 160 сабағы AO17 ішінде - дәріс, тест, 3D симуляция.
// Тексереміз: хаб (11 зертхана, 160 сабақ, бәрі бар файлдар), лекция беті (Markdown, тест, кесте), тесттің жауабы ортақ күнделікке жазылады,
// 3D қолданба AO17 ішінде қатесіз ашылады және сыртқы сұраныс жасамайды, курс ішкі беттерге апарады, 360px, axe.
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");
const { blockFonts, collectErrors } = require("../support/helpers");
const AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const ROOT = path.resolve(__dirname, "../..");
const DATA = JSON.parse(fs.readFileSync(path.join(ROOT, "tools/academy/data/inside_lessons.json"), "utf8"));
const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

test("хаб: 11 зертхана, 160 сабақ; әр сілтеме бар файлға апарады", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto("academy/3d/index.html");
  await expect(page.locator(".l3-lab")).toHaveCount(11);
  await expect(page.locator(".l3-lab").first()).toHaveAttribute("id", "arch");   // курстың 2-бөліміндегі ұсынылатын рет
  await expect(page.locator(".l3-hero .l3-k")).toHaveText("AO17 CS курсы · 2-бөлім");
  const hrefs = await page.locator(".l3-lessons a").evaluateAll((as) => as.map((a) => a.getAttribute("href")));
  expect(hrefs.length).toBe(DATA.lessons.length);
  for (const h of hrefs) expect(fs.existsSync(path.join(ROOT, "academy/3d", h)), h).toBe(true);
  await expect(page.locator(".l3-stats li").nth(1)).toContainText(String(DATA.lessons.length));
  expect(errors).toEqual([]);
});

test("хаб: шешілген сабақтар белгіленеді, зертхана астында «аяқталды: N / 15»", async ({ page }) => {
  await page.goto("academy/3d/index.html");
  const a1 = page.locator('.l3-lessons a[data-lid="arch-1-binary"]');
  const q = +(await a1.getAttribute("data-q"));
  expect(q).toBeGreaterThan(0);
  await expect(page.locator(".l3-lessons a.is-done, .l3-lessons a.is-started")).toHaveCount(0);
  await page.evaluate((q) => localStorage.setItem("ao17:lab3d", JSON.stringify({
    "arch-1-binary": Array.from({ length: q }, (_, i) => "arch-1-binary:s:q" + i).concat(["arch-1-binary:s1:predict"]),
    "arch-2-arith": ["arch-2-arith:s1:q1"],
  })), q);
  await page.reload();
  await expect(a1).toHaveClass(/is-done/);
  await expect(page.locator('.l3-lessons a[data-lid="arch-2-arith"]')).toHaveClass(/is-started/);
  await expect(page.locator("#arch .l3-labp")).toHaveText(" · аяқталды: 1 / 15");
  await expect(page.locator("#algo .l3-labp")).toHaveText("");
});


test("INSIDE TECH-тің толық порталы: 24 бөлім скриншотпен, әрқайсысы 3D қолданбаның нақты бөлімін ашады", async ({ page }) => {
  test.setTimeout(150000);
  await page.goto("academy/3d/index.html");
  const cards = page.locator(".l3-feat a.l3-card");
  await expect(cards).toHaveCount(24);
  const routes = await cards.evaluateAll((as) => as.map((a) => a.getAttribute("href")));
  for (const h of routes) expect(h, h).toMatch(/^app\/index\.html#[a-z]+$/);
  const imgs = await page.locator(".l3-feat img, .l3-tiles img, .l3-hshot img").evaluateAll((a) => a.map((i) => i.getAttribute("src")));
  expect(imgs.length).toBe(24 + 11 + 1);
  for (const src of imgs) expect(fs.existsSync(path.join(ROOT, "academy/3d", src)), src).toBe(true);
  for (const h of await page.locator(".l3-secnav a").evaluateAll((a) => a.map((x) => x.getAttribute("href")))) await expect(page.locator(h)).toHaveCount(1);
  await expect(page.locator(".l3-tiles a.l3-tile")).toHaveCount(11);
  // әр маршрут 3D қолданбада бар: белгісіз маршрут басты бетке түседі («Технологияның ішіне кір.»)
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const h of routes) {
    await page.goto("academy/3d/" + h);
    await expect(page.locator("h1").first(), h).toBeVisible({ timeout: 20000 });
    expect(await page.locator("h1").first().innerText(), h).not.toMatch(/Технологияның\s+ішіне кір/);
  }
  expect(errors).toEqual([]);
});

for (const width of [1280, 1100]) {
  test(`3D қолданбаның тақырыбы ${width}px енде бір қатарда, беттің басын жаппайды`, async ({ browser }) => {
    const c = await browser.newContext({ viewport: { width, height: 800 }, reducedMotion: "reduce" });
    const p = await c.newPage();
    await p.goto("academy/3d/app/index.html#world");
    await expect(p.locator("h1")).toBeVisible({ timeout: 20000 });
    const r = await p.evaluate(() => {
      const hd = document.querySelector("header"), nav = hd.querySelector("nav");
      return { h: hd.getBoundingClientRect().height, bottom: hd.getBoundingClientRect().bottom, kick: document.querySelector("h1").previousElementSibling.getBoundingClientRect().top, over: nav.scrollWidth > nav.clientWidth + 1 };
    });
    expect(r.h).toBeLessThan(80);
    expect(r.kick).toBeGreaterThanOrEqual(r.bottom);
    expect(r.over).toBe(false);
    await c.close();
  });
}

test("лекция беті: дәріс Markdown-нан, тапсырма, тест; дұрыс жауап ортақ күнделікке жазылады", async ({ browser }) => {
  const c = await browser.newContext({ reducedMotion: "reduce" });
  await blockFonts(c);
  const p = await c.newPage(); const errors = collectErrors(p);
  await p.goto("academy/3d/arch/arch-1-binary.html");
  const L = DATA.lessons.find((x) => x.lesson.id === "arch-1-binary").lesson;
  await expect(p.locator("h1")).toHaveText("Екілік жүйе");   // басты атау қазақша, ағылшынша атауы астында
  await expect(p.locator(".l3-en")).toHaveText(L.title);
  await expect(p.locator(".ac-crumb a").first()).toHaveAttribute("href", "../../course.html");
  await expect(p.locator(".l3-step")).toHaveCount(L.steps.length);
  const s1 = p.locator("#s1");
  await expect(s1.locator(".l3-body h3").first()).toHaveText("Идея");
  await expect(s1.locator(".l3-body pre code")).toHaveCount(1);
  await expect(s1.locator(".l3-body blockquote")).toContainText("Түйін");
  await expect(s1.locator(".l3-task a[href='../app/index.html#arch-1-binary']")).toHaveCount(1);
  // тест: алдымен қате жауап, сосын дұрыс
  const q = s1.locator(".l3-quiz .l3-q").first();
  const ans = +(await q.getAttribute("data-answer"));
  const n = await q.locator(".l3-opt").count();
  await q.locator(".l3-opt").nth((ans + 1) % n).click();
  await expect(q.locator(".l3-opt.bad")).toHaveCount(1);
  await expect(q).not.toHaveClass(/is-ok/);
  await q.locator(".l3-opt").nth(ans).click();
  await expect(q).toHaveClass(/is-ok/);
  await expect(q.locator(".l3-fb")).toContainText("Дұрыс!");
  await expect(q.locator(".l3-ans")).toHaveAttribute("open", "");
  const log = await p.evaluate(() => JSON.parse(localStorage.getItem("inside-tech:activity")));
  expect(log.days[iso(new Date())].problem).toBe(1);
  await expect(p.locator("#l3-progress")).toContainText("1 / ");
  await p.reload();
  await expect(p.locator("#s1 .l3-quiz .l3-q").first()).toHaveClass(/is-ok/);
  expect(errors).toEqual([]);
  await c.close();
});

test("кесте мен шешілген мысал дұрыс шығады", async ({ page }) => {
  await page.goto("academy/3d/iot/iot-3-filter.html");
  await expect(page.locator(".l3-table").first()).toBeVisible();
  await expect(page.locator(".l3-table thead th").first()).toHaveText("α");
  const withWorked = DATA.lessons.find((x) => x.lesson.steps.some((s) => s.worked));
  await page.goto(`academy/3d/${withWorked.labId}/${withWorked.lesson.id}.html`);
  await expect(page.locator(".l3-worked li").first()).toBeVisible();
});

test("3D қолданба AO17 ішінде: қатесіз ашылады, сыртқы шрифт сұратпайды, AO17-ге оралу батырмасы бар", async ({ page }) => {
  const errors = [], external = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => { if (!/^http:\/\/(127\.0\.0\.1|localhost)/.test(r.url()) && !r.url().startsWith("data:")) external.push(r.url()); });
  await page.goto("academy/3d/app/index.html#arch-1-binary");
  await expect(page.locator("a.ao17-back")).toHaveAttribute("href", "../index.html");
  await expect(page).toHaveTitle(/Екілік жүйе/, { timeout: 20000 });   // AO17 нұсқасында 3D қолданбадағы атаулар да қазақша (sync_inside: kazakh_titles)
  await page.waitForTimeout(1500);
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
  const src = JSON.parse(fs.readFileSync(path.join(ROOT, "academy/3d/app/SOURCE.json"), "utf8"));
  expect(src.commit).toMatch(/^[0-9a-f]{40}$/);
  expect(fs.statSync(path.join(ROOT, "academy/3d/app/THIRD-PARTY-NOTICES.txt")).size).toBeGreaterThan(10000);
});

test("AO17 нұсқасында Ұстаз кейіпкері жоқ: бумада, деректе және 3D комикс кітапханасында", async ({ page }) => {
  const dec = (s) => s.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16))).toLowerCase();
  for (const f of ["academy/3d/app/app.js", "academy/3d/app/ai-lab-worker.js", "academy/3d/app/index.html", "tools/academy/data/inside_lessons.json", "tools/academy/data/inside_media.json"])
    expect(dec(fs.readFileSync(path.join(ROOT, f), "utf8")).includes("ұстаз"), f).toBe(false);
  await page.goto("academy/3d/app/index.html#comics");
  await expect(page.locator("button", { hasText: "Кино-комикстер" })).toBeVisible({ timeout: 20000 });
  expect((await page.locator("body").innerText()).toLowerCase()).not.toContain("ұстаз");
});

test("AO17 CS курсы 3D сабақтарға AO17-нің ішінде апарады", async ({ page }) => {
  await page.goto("academy/course.html");
  const hrefs = await page.locator(".crs-3d a").evaluateAll((as) => as.map((a) => a.getAttribute("href")));
  expect(hrefs.length).toBeGreaterThan(12);
  for (const h of hrefs) {
    expect(h, h).toMatch(/^3d\/([a-z]+\/[a-z0-9-]+\.html|app\/index\.html#[a-z]+)$/);
    expect(fs.existsSync(path.join(ROOT, "academy", h.split("#")[0])), h).toBe(true);
  }
  await page.locator('.crs-3d a[href="3d/arch/arch-1-binary.html"]').click();
  await expect(page.locator("h1")).toHaveText("Екілік жүйе");
});

test("қауіпсіздік: дәрістегі HTML/XSS мысалдары мәтін болып көрінеді, бетте орындалмайды", async ({ page }) => {
  let dialog = false;
  page.on("dialog", (d) => { dialog = true; d.dismiss(); });
  await page.goto("academy/3d/sec/sec-8-injection.html");
  // мысалдағы <script> - мәтін: бетте evil.kz-ке сілтейтін бірде-бір <script> элементі жоқ
  expect(await page.evaluate(() => [...document.scripts].filter((x) => /evil\.kz/.test(x.textContent)).length)).toBe(0);
  await expect(page.locator("#main code", { hasText: "<script>" }).first()).toBeVisible();
  await page.goto("academy/3d/web/web-2-html.html");
  expect(await page.evaluate(() => document.querySelectorAll("#main .l3-body ul > li").length)).toBeGreaterThan(0);
  await expect(page.locator("#main code", { hasText: "<h1>" }).first()).toBeVisible();
  expect(dialog).toBe(false);
});

for (const scheme of ["light", "dark"]) {
  test(`360px, ${scheme}: хаб пен лекция беті көлденең жылжымайды, axe таза`, async ({ browser }) => {
    const c = await browser.newContext({ viewport: { width: 360, height: 740 }, colorScheme: scheme, reducedMotion: "reduce" });
    await blockFonts(c);
    const p = await c.newPage();
    for (const u of ["academy/3d/index.html", "academy/3d/arch/arch-1-binary.html", "academy/3d/iot/iot-3-filter.html"]) {
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


test("3D сабақтың кино-түсіндіруі: 5 тарау, болжам сұрағы; 1-бөлімнің прогресіне тиіспейді; дәріс бөлімдері өз блоктарында", async ({ browser }) => {
  const c = await browser.newContext({ reducedMotion: "reduce" });
  await blockFonts(c);
  const p = await c.newPage(); const errors = collectErrors(p);
  await p.goto("academy/3d/algo/algo-1-search.html");
  const film = p.locator("#s-film");
  await expect(film.locator(".cn-pk")).toContainText("Кино-түсіндіру · 5 тарау");
  await expect(film.locator(".cn-poster h3")).toHaveText("Іздеу");
  // деректер бөлек блокта: #ac-data жоқ, сондықтан academy.js бұл бетті 1-бөлімнің сабағы деп санамайды
  await expect(p.locator("#cn-data")).toHaveCount(1);
  await expect(p.locator("#ac-data")).toHaveCount(0);
  const L = DATA.lessons.find((x) => x.lesson.id === "algo-1-search").lesson;
  const ask = L.steps.map((s) => s.predict).find(Boolean) || L.steps[0].quiz[0];
  await film.locator('[data-a="start"]').click();
  await expect(film.locator(".cn-say")).toContainText(ask.question.slice(0, 30));
  // Бейне -> Болжа: сұрақ пен нұсқалар; қате болжам - түсіндірме, сосын жалғастыру
  await film.locator('[data-a="next"]').click();
  await film.locator('[data-a="next"]').click();
  const opts = film.locator(".cn-opts button");
  await expect(opts).toHaveCount(ask.options.length);
  await opts.nth((ask.answer + 1) % ask.options.length).click();
  await expect(film.locator(".cn-why")).toBeVisible();
  await expect(opts.nth(ask.answer)).toHaveClass(/ok/);
  await film.locator('[data-a="cont"]').click();
  // Көр: бірінші қадамның атауы мен коды сахнада
  await expect(film.locator(".cn-say")).toContainText("1-қадам, «Сызықтық іздеу»");
  await expect(film.locator(".cn-stage")).toContainText("for i from 0 to n");   // сабақта «n−1» (Unicode минус)
  // фильмнің мәтіні (JS жоқ кезде де оқылады)
  await expect(p.locator(".cn-tr li").first()).toContainText("Сұрақ");
  expect(await p.evaluate(() => localStorage.getItem("cs50kz:academy"))).toBeNull();
  // дәрістің бөлімдері: Идея, Түйсік, Есептеп көрейік, Нақты әлемде, Енді сен - әрқайсысы өз блогында
  const kinds = await p.locator("#s1 .l3-blk").evaluateAll((a) => a.map((b) => [...b.classList].find((c) => c.startsWith("l3-b-")) + ":" + b.querySelector("h3").textContent));
  expect(kinds).toEqual(["l3-b-idea:Идея", "l3-b-intuit:Түйсік", "l3-b-calc:Есептеп көрейік", "l3-b-world:Нақты әлемде", "l3-b-you:Енді сен"]);
  expect(errors).toEqual([]);
  await c.close();
});

test("160 сабақтың бәрінде кино-түсіндіру бар (сценарий - сабақтың мазмұнынан)", async () => {
  const labs = new Set(DATA.lessons.map((x) => x.labId));
  let n = 0;
  for (const lab of labs) {
    for (const f of fs.readdirSync(path.join(ROOT, "academy/3d", lab)).filter((x) => x.endsWith(".html"))) {
      const html = fs.readFileSync(path.join(ROOT, "academy/3d", lab, f), "utf8");
      const m = html.match(/<script type="application\/json" id="cn-data">(.*?)<\/script>/s);
      expect(m, f).not.toBeNull();
      const st = JSON.parse(m[1]).cine;
      expect(st.beats.some((b) => b.ask), f).toBe(true);
      expect(st.key.length, f).toBeGreaterThan(10);
      n++;
    }
  }
  expect(n).toBe(DATA.lessons.length);
});
