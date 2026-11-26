// © 2026 AO17 командасы. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md.
// AO17 CS оқу кестесі (tools/academy/ao17plan.py, assets/js/ao17-plan.js). «Бүгін» бекітілген (2026 ж. 7 желтоқсан, дүйсенбі).
// Тексереміз: әдепкі кесте (23 бірлік, 3 емтихан, таспа, тізім); күнтізбе файлы RFC 5545-ке сай (CRLF, 75 октет, escape,
// еске салғыш) және кесте ережелерін сақтайды (тек таңдалған күндер, рет, кеш ұзақтығы, ұзақ сабақ келесі күндердің
// уақытын алады, апталық сағат шегі); баптаулар сақталады; кестеден қалу/озу және қайта құру; курс беті келесі кешті
// көрсетеді; AO17 CS жетістіктері; бет ережесі (жария); телефонда көлденең жылжу жоқ, axe таза.
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const ROOT = path.resolve(__dirname, "../..");
const { blockFonts, collectErrors } = require("../support/helpers");
const AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const DATA = JSON.parse(fs.readFileSync(path.join(ROOT, "academy/plan.html"), "utf8").match(/<script type="application\/json" id="plan-data">([\s\S]*?)<\/script>/)[1].replace(/<\\\//g, "</"));
const NOW = new Date(2026, 11, 7, 10, 0, 0);   // дүйсенбі
const ITEMS = DATA.units.reduce((n, u) => n + u.lessons.length + (u.quiz ? 1 : 0), 0) + DATA.exams.length;
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const shift = (days) => { const d = new Date(NOW); d.setDate(d.getDate() + days); return iso(d); };

async function open(page, url = "academy/plan.html") {
  await blockFonts(page.context());
  await page.clock.setFixedTime(NOW);
  await page.goto(url);
}
async function download(page) {
  const [dl] = await Promise.all([page.waitForEvent("download"), page.click("[data-plan-ics]")]);
  expect(dl.suggestedFilename()).toBe("ao17-cs-kestesi.ics");
  return fs.readFileSync(await dl.path());
}
// .ics: бүктелген жолдарды жазып, оқиғаларды {DTSTART, DTEND, SUMMARY, DESCRIPTION, ...} түрінде қайтарады
function parseIcs(buf) {
  const raw = buf.toString("utf8");
  const lines = raw.replace(/\r\n[ \t]/g, "").split("\r\n").filter(Boolean);
  const ev = [];
  let cur = null, alarm = false;
  for (const l of lines) {
    if (l === "BEGIN:VEVENT") cur = { alarm: false };
    else if (l === "END:VEVENT") { ev.push(cur); cur = null; }
    else if (l === "BEGIN:VALARM") alarm = true;
    else if (l === "END:VALARM") { alarm = false; if (cur) cur.alarm = true; }
    else if (cur && !alarm) { const i = l.indexOf(":"); cur[l.slice(0, i)] = l.slice(i + 1); }
  }
  return { raw, lines, ev };
}
const toDate = (v) => new Date(+v.slice(0, 4), +v.slice(4, 6) - 1, +v.slice(6, 8), +v.slice(9, 11), +v.slice(11, 13));
const wd = (d) => ((d.getDay() + 6) % 7) + 1;

test("әдепкі кесте: бүгіннен, аптасына 5 сағат, дс-жм 19:00; 23 бірлік, 3 емтихан, таспа мен тізім", async ({ page }) => {
  const errs = collectErrors(page);
  await open(page);
  await expect(page.locator('input[name="start"]')).toHaveValue("2026-12-07");
  await expect(page.locator('input[name="hours"][value="5"]')).toBeChecked();
  await expect(page.locator('input[name="days"]:checked')).toHaveCount(5);
  await expect(page.locator('input[name="time"]')).toHaveValue("19:00");
  await expect(page.locator("[data-plan-sum]")).toContainText(/Аяқталу күні: 2027 ж\. \d+ [а-яәіңғүұқөһ]+ · \d+ апта · \d+ оқу кеші · кешіне ≈60 минут/);
  await expect(page.locator(".pl-seg")).toHaveCount(23);
  await expect(page.locator(".pl-seg.p1")).toHaveCount(12);
  await expect(page.locator(".pl-ex")).toHaveCount(3);
  await expect(page.locator(".pl-today")).toHaveCount(1);
  await expect(page.locator(".pl-u")).toHaveCount(23);
  await expect(page.locator(".pl-xr")).toHaveCount(3);
  await expect(page.locator(".pl-u").first()).toContainText("Логика");
  await expect(page.locator(".pl-u").first().locator(".pl-ud")).toHaveText(/^7–\d+ желтоқсан$/);
  await expect(page.locator(".pl-u.is-now")).toHaveCount(1);
  // келесі оқу кеші: бүгін 19:00, 1-аптаның бірінші сабағы
  await expect(page.locator(".pl-when")).toHaveText(/^Бүгін, 19:00 · ≈\d+ минут$/);
  await expect(page.locator(".pl-st")).toContainText("Кесте бойынша келе жатырсың.");
  await expect(page.locator(".pl-items a").first()).toHaveAttribute("href", DATA.units[0].lessons[0][1]);
  await expect(page.locator("[data-plan-replan]")).toHaveCount(0);
  // барлық сілтеме бар бетке апарады
  const hrefs = await page.locator(".pl-u a, .pl-xr a, .pl-items a").evaluateAll((as) => as.map((a) => a.getAttribute("href")));
  for (const h of new Set(hrefs)) expect(fs.existsSync(path.join(ROOT, "academy", h.split(/[?#]/)[0])), h).toBe(true);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("ao17cs:plan")));
  expect(saved).toMatchObject({ start: "2026-12-07", hours: 5, days: [1, 2, 3, 4, 5], time: "19:00", base: [] });
  expect(errs).toEqual([]);
});

test("күнтізбе файлы: RFC 5545 (CRLF, 75 октет, escape, еске салғыш) және кесте ережелері", async ({ page }) => {
  const errs = collectErrors(page);
  await open(page);
  // аптасына 3 сағат, тек дс/ср/сб, 07:30 - ұзақ сабақтар келесі оқу күндерінің уақытын алады
  await page.locator('label:has(input[name="hours"][value="3"])').click();
  for (const v of ["2", "4", "5"]) await page.locator(`label:has(input[name="days"][value="${v}"])`).click();
  await page.locator(`label:has(input[name="days"][value="6"])`).click();
  await page.fill('input[name="time"]', "07:30");
  await page.locator('input[name="time"]').dispatchEvent("change");
  const sessions = Number((await page.locator("[data-plan-sum]").innerText()).match(/(\d+) оқу кеші/)[1]);
  const buf = await download(page);
  const { raw, lines, ev } = parseIcs(buf);
  expect(raw.startsWith("BEGIN:VCALENDAR\r\nVERSION:2.0\r\n")).toBe(true);
  expect(raw.endsWith("END:VCALENDAR\r\n")).toBe(true);
  expect(raw.replace(/\r\n/g, "")).not.toMatch(/[\r\n]/);   // тек CRLF
  for (const l of raw.split("\r\n")) expect(Buffer.byteLength(l, "utf8"), l).toBeLessThanOrEqual(75);
  expect(lines.filter((l) => l === "BEGIN:VEVENT")).toHaveLength(sessions);
  expect(ev).toHaveLength(sessions);
  const cap = Math.round(180 / 3);
  let items = 0, prev = null, prevMin = 0;
  for (const e of ev) {
    expect(e.alarm).toBe(true);
    expect(e.UID).toMatch(/^ao17cs-20261207-\d+@/);
    const a = toDate(e.DTSTART), b = toDate(e.DTEND), min = (b - a) / 60000;
    expect([1, 3, 6]).toContain(wd(a));
    expect(e.DTSTART.slice(9)).toBe("073000");
    const n = (e.DESCRIPTION.match(/• /g) || []).length;
    items += n;
    if (n > 1) expect(min, e.SUMMARY).toBeLessThanOrEqual(cap);
    expect(e.SUMMARY).toMatch(/^AO17 CS: /);
    expect(e.DESCRIPTION).not.toMatch(/(^|[^\\]),/);   // мәтіндегі үтір escape-телген
    if (prev) {
      // аралықтағы оқу күндері: алдыңғы кеш ұзақ болса, ол келесі оқу күндерінің уақытын да алады
      let skipped = 0;
      for (let d = new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 1); d < new Date(a.getFullYear(), a.getMonth(), a.getDate()); d.setDate(d.getDate() + 1)) if ([1, 3, 6].includes(wd(d))) skipped++;
      expect(skipped, e.DTSTART).toBe(Math.max(1, Math.round(prevMin / cap)) - 1);
    }
    prev = a;
    prevMin = min;
  }
  expect(items).toBe(ITEMS);
  expect(ev[0].DTSTART).toBe("20261207T073000");
  expect(ev[0].SUMMARY).toContain("1-апта");
  expect(ev.some((e) => e.SUMMARY.includes("Қорытынды емтихан"))).toBe(true);
  // апталық сағат шегі: орта есеппен аптасына 3 сағаттан аспайды (±25%)
  const weeks = (toDate(ev[ev.length - 1].DTSTART) - toDate(ev[0].DTSTART)) / (7 * 864e5) + 1;
  const total = ev.reduce((n, e) => n + (toDate(e.DTEND) - toDate(e.DTSTART)) / 60000, 0);
  expect(total / weeks / 60).toBeGreaterThan(3 * 0.75);
  expect(total / weeks / 60).toBeLessThan(3 * 1.25);
  // сипаттамадағы сілтемелер нақты беттерге апарады
  const urls = [...new Set(ev.flatMap((e) => e.DESCRIPTION.split("\\n").map((x) => x.match(/academy\/([^ ?#]+\.html)/)).filter(Boolean).map((m) => m[1])))];
  expect(urls.length).toBeGreaterThan(200);
  for (const u of urls) expect(fs.existsSync(path.join(ROOT, "academy", u)), u).toBe(true);
  // «Жоспарлы оқушы» жетістігі
  const ach = await page.evaluate(() => window.CS50KZ.achievements().find((a) => a.id === "ao17-plan"));
  expect(ach.done).toBe(true);
  expect(errs).toEqual([]);
});

test("баптаулар: аптасына сағат көбейсе кесте қысқарады, соңғы оқу күнін алып тастауға болмайды, бәрі сақталады", async ({ page }) => {
  const errs = collectErrors(page);
  await open(page);
  const n5 = Number((await page.locator("[data-plan-sum]").innerText()).match(/(\d+) апта/)[1]);
  await page.locator('label:has(input[name="hours"][value="12"])').click();
  await expect(page.locator("[data-plan-sum]")).toContainText("кешіне ≈144 минут");
  const n12 = Number((await page.locator("[data-plan-sum]").innerText()).match(/(\d+) апта/)[1]);
  expect(n12).toBeLessThan(n5 / 2);
  for (const v of ["1", "2", "3", "4"]) await page.locator(`label:has(input[name="days"][value="${v}"])`).click();
  await expect(page.locator('input[name="days"]:checked')).toHaveCount(1);
  await page.locator('label:has(input[name="days"][value="5"])').click();   // соңғы күн қалады
  await expect(page.locator('input[name="days"][value="5"]')).toBeChecked();
  await page.fill('input[name="start"]', "2026-12-10");
  await page.locator('input[name="start"]').dispatchEvent("change");
  await expect(page.locator(".pl-when")).toHaveText(/^Жұма, 11 желтоқсан, 19:00/);
  await expect(page.locator(".pl-st")).toContainText("Кесте 10 желтоқсан басталады.");
  await page.reload();
  await expect(page.locator('input[name="hours"][value="12"]')).toBeChecked();
  await expect(page.locator('input[name="days"]:checked')).toHaveCount(1);
  await expect(page.locator('input[name="start"]')).toHaveValue("2026-12-10");
  expect(errs).toEqual([]);
});

test("прогресс: кестеден артта қалу, қайта құру; озу; таспада аяқталған бөлік", async ({ page }) => {
  const errs = collectErrors(page);
  await open(page);
  const p1 = DATA.units.filter((u) => u.part === 1).flatMap((u) => u.lessons.map((l) => l[0]));
  // кесте 5 апта бұрын басталған (дс-жм), 1-бөлімнің 12 сабағы меңгерілген
  await page.evaluate(({ ids, start }) => {
    const L = {}; ids.forEach((id) => (L[id] = { mastered: 1 }));
    localStorage.setItem("cs50kz:academy", JSON.stringify({ v: 1, lessons: L }));
    localStorage.setItem("ao17cs:plan", JSON.stringify({ start, hours: 5, days: [1, 2, 3, 4, 5], time: "19:00", base: [] }));
  }, { ids: p1.slice(0, 12), start: shift(-35) });
  await page.reload();
  await expect(page.locator(".pl-st")).toHaveText(/^Кестеден \d+ сабақ артта қалдың\. Аяқталған сабақ: 12 \/ 280\.$/);
  await expect(page.locator(".pl-u.is-done")).toHaveCount(1);
  await expect(page.locator(".pl-seg.full")).toHaveCount(1);
  await expect(page.locator(".pl-seg .fg")).toHaveCount(2);
  await expect(page.locator(".pl-items a").first()).toHaveText("1-апта сынағы");
  await page.click("[data-plan-replan]");
  await expect(page.locator('input[name="start"]')).toHaveValue("2026-12-07");
  await expect(page.locator(".pl-st")).toContainText("Кесте бойынша келе жатырсың.");
  const st = await page.evaluate(() => JSON.parse(localStorage.getItem("ao17cs:plan")));
  expect(st.start).toBe("2026-12-07");
  expect(st.base).toHaveLength(12);
  expect(st.base.every((k) => k.startsWith("l:"))).toBe(true);
  await expect(page.locator(".pl-u").first().locator(".pl-ud")).toHaveText("7 желтоқсан");   // 1-аптада тек сынақ қалды
  // озу: кесте бір апта бұрын басталған, 30 сабақ меңгерілген
  await page.evaluate(({ ids, start }) => {
    const L = {}; ids.forEach((id) => (L[id] = { mastered: 1 }));
    localStorage.setItem("cs50kz:academy", JSON.stringify({ v: 1, lessons: L }));
    localStorage.setItem("ao17cs:plan", JSON.stringify({ start, hours: 5, days: [1, 2, 3, 4, 5], time: "19:00", base: [] }));
  }, { ids: p1.slice(0, 30), start: shift(-7) });
  await page.reload();
  await expect(page.locator(".pl-st")).toHaveText(/^Кестеден \d+ сабаққа алдасың\./);
  await expect(page.locator("[data-plan-replan]")).toHaveCount(0);
  expect(errs).toEqual([]);
});

test("курс беті: «Оқу кестесі» батырмасы, кесте құрылса - келесі оқу кеші мен аяқталу күні", async ({ page }) => {
  const errs = collectErrors(page);
  await open(page, "academy/course.html");
  await expect(page.locator('.crs-cta a[href="plan.html"]')).toHaveText("Оқу кестесі");
  await expect(page.locator("[data-plan-chip]")).toBeHidden();
  await page.goto("academy/plan.html");
  const end = (await page.locator("[data-plan-sum] b").innerText()).trim();
  await page.goto("academy/course.html");
  await expect(page.locator("[data-plan-chip]")).toBeVisible();
  await expect(page.locator("[data-plan-chip] a")).toHaveAttribute("href", "plan.html");
  await expect(page.locator("[data-plan-chip]")).toHaveText(`Оқу кестең: келесі кеш - бүгін, 19:00 · аяқталу күні - ${end}`);
  expect(errs).toEqual([]);
});

test("жетістіктер: AO17 CS белгілері сынақ, зертхана және емтихан нәтижесінен есептеледі", async ({ page }) => {
  await open(page, "index.html");
  const get = () => page.evaluate(() => Object.fromEntries(window.CS50KZ.achievements().filter((a) => a.id.startsWith("ao17-")).map((a) => [a.id, [a.done, a.cur, a.goal]])));
  // «Түсіндіруші» мен «Фокус шебері» - оқу тактикалары бетінен (ao17-methods.spec.js тексереді)
  expect(Object.keys(await get()).sort()).toEqual(["ao17-explain", "ao17-final", "ao17-focus", "ao17-lab", "ao17-plan", "ao17-quiz", "ao17-weeks"]);
  expect(Object.values(await get()).every((x) => !x[0])).toBe(true);
  await page.evaluate(() => {
    localStorage.setItem("ao17cs:exam", JSON.stringify({ w1: { best: 80 }, w2: { best: 60 }, final: { best: 91 } }));
    const lab = {}; for (let i = 0; i < 10; i++) lab["lesson-" + i] = i === 9 ? ["s1:predict"] : ["s1:q1"];
    localStorage.setItem("ao17:lab3d", JSON.stringify(lab));
  });
  const a = await get();
  expect(a["ao17-quiz"]).toEqual([true, 1, 1]);
  expect(a["ao17-weeks"]).toEqual([false, 1, 12]);
  expect(a["ao17-lab"]).toEqual([false, 9, 10]);   // болжам сұрағы ғана шешілген сабақ саналмайды
  expect(a["ao17-final"]).toEqual([true, 1, 1]);
});

test("бет ережесі: оқу кестесі жария", async () => {
  const out = execFileSync("python3", ["-c", "import sys; sys.path.insert(0, 'tools'); import gate; print(gate.page_rule('academy/plan.html'))"], { cwd: ROOT, encoding: "utf8" }).trim();
  expect(out).toBe("None");
});

for (const scheme of ["light", "dark"]) {
  test(`360px, ${scheme}: оқу кестесі көлденең жылжымайды, axe таза`, async ({ browser }) => {
    const c = await browser.newContext({ viewport: { width: 360, height: 760 }, colorScheme: scheme, reducedMotion: "reduce" });
    await blockFonts(c);
    const p = await c.newPage();
    await p.clock.setFixedTime(NOW);
    const errs = collectErrors(p);
    await p.goto("academy/plan.html");
    // аяқталған, қазіргі және алдағы бірліктер, кестеден қалу - барлық күй бетте болсын
    await p.evaluate(({ ids, start }) => {
      const L = {}; ids.forEach((id) => (L[id] = { mastered: 1 }));
      localStorage.setItem("cs50kz:academy", JSON.stringify({ v: 1, lessons: L }));
      localStorage.setItem("ao17cs:exam", JSON.stringify({ w1: { best: 90 } }));
      localStorage.setItem("ao17cs:plan", JSON.stringify({ start, hours: 5, days: [1, 2, 3, 4, 5], time: "19:00", base: [] }));
    }, { ids: DATA.units[0].lessons.map((l) => l[0]).concat(DATA.units[1].lessons.slice(0, 3).map((l) => l[0])), start: shift(-35) });
    await p.reload();
    await expect(p.locator("[data-plan-replan]")).toBeVisible();
    expect(await p.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
    await p.addScriptTag({ content: AXE });
    const v = await p.evaluate(async () => (await axe.run(document.getElementById("main"), { runOnly: ["wcag2a", "wcag2aa"], resultTypes: ["violations"] })).violations
      .filter((x) => x.impact === "serious" || x.impact === "critical").map((x) => `${x.id}: ${x.nodes[0].target.join(" ")}`));
    expect(v, v.join("\n")).toEqual([]);
    expect(errs).toEqual([]);
    await c.close();
  });
}
