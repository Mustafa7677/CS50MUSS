// © 2026 AO17 командасы. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md.
// Пилот өлшемі (docs/AO17-CS-PILOT.md). Тексереміз:
//  * апта сынағы алғашқы әрекетті (бастапқы деңгей) бір рет жазады және бұлтқа синхрондауды бастайды (cs50kz:week);
//  * ao17cs:exam бұлттағы снимокқа кіреді, екі құрылғының нәтижесі режим бойынша дұрыс біріктіріледі;
//  * AO17Results: оқушы дерегін қатаң оқу, пилот есебі (орташа, айырма, нормаланған өсім), CSV (формула инъекциясы жоқ);
//  * мұғалім панелі (Supabase жауаптары тестте беріледі, желіге шықпайды): «Нәтижелер» қойындысы, пилот есебі, CSV, басып шығару, axe.
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");
const { blockFonts, collectErrors } = require("../support/helpers");
const AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const ROOT = path.resolve(__dirname, "../..");
const BANK = JSON.parse(fs.readFileSync(path.join(ROOT, "academy/exam.html"), "utf8").match(/<script type="application\/json" id="xm-bank">([\s\S]*?)<\/script>/)[1].replace(/<\\\//g, "</"));
const BY_ID = Object.fromEntries(BANK.items.map((x) => [x.id, x]));
const RESULTS_JS = fs.readFileSync(path.join(ROOT, "assets/js/ao17-results.js"), "utf8");
const DAY = 86400000;

async function playWeek(page, right) {
  await page.click("[data-ax-start]");
  const run = await page.evaluate(() => JSON.parse(localStorage.getItem("ao17cs:exam-run")));
  for (let i = 0; i < run.qs.length; i++) {
    const q = run.qs[i], it = BY_ID[q.id];
    if (it.k === "mc") await page.locator(".xm-opt").nth(right ? q.p.indexOf(it.a) : (q.p.indexOf(it.a) + 1) % it.o.length).click();
    else { await page.fill(".xm-num input", String(right ? it.a : Number(it.a) + 1000).replace(".", ",")); await page.click(".xm-check"); }
    await page.locator(".xm-nav .btn.gold").click();
  }
  await expect(page.locator(".xm-score b")).toBeVisible();
}

test("апта сынағы: алғашқы әрекет бір рет жазылады, кейін өзгермейді; нәтиже бұлтқа синхрондауды бастайды", async ({ page, context }) => {
  await blockFonts(context);
  const errs = collectErrors(page);
  await page.goto("academy/exam.html?w=1");
  await page.evaluate(() => { window.__wk = 0; document.addEventListener("cs50kz:week", () => { window.__wk += 1; }); });
  await playWeek(page, false);
  const one = await page.evaluate(() => JSON.parse(localStorage.getItem("ao17cs:exam")).w1);
  expect(one).toMatchObject({ first: 0, last: 0, best: 0, runs: 1 });
  expect(one.firstAt).toBe(one.at);
  expect(await page.evaluate(() => window.__wk)).toBe(1);
  await page.goto("academy/exam.html?w=1");
  await playWeek(page, true);
  const two = await page.evaluate(() => JSON.parse(localStorage.getItem("ao17cs:exam")).w1);
  expect(two).toMatchObject({ first: 0, firstAt: one.firstAt, last: 100, best: 100, runs: 2 });
  // ескі жазба (алғашқы әрекеті белгісіз): бастапқы деңгей ойдан жазылмайды
  await page.evaluate(() => localStorage.setItem("ao17cs:exam", JSON.stringify({ w1: { best: 50, last: 50, at: 1, runs: 3 } })));
  await page.goto("academy/exam.html?w=1");
  await playWeek(page, true);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("ao17cs:exam")).w1)).toMatchObject({ first: null, firstAt: null, last: 100, best: 100, runs: 4 });
  expect(errs).toEqual([]);
});

test("бұлт: ao17cs:exam снимокқа кіреді (тоқтаған сынақ пен калибровка кірмейді); екі құрылғы режим бойынша біріктіріледі", async ({ page }) => {
  await page.goto("index.html");
  await page.addScriptTag({ url: "assets/js/profile.js" });
  await page.waitForFunction(() => window.CS50KZ_SYNC);
  const snap = await page.evaluate(() => {
    localStorage.setItem("ao17cs:exam", JSON.stringify({ w1: { best: 80, last: 80, at: 5, runs: 1, first: 80, firstAt: 5 } }));
    localStorage.setItem("ao17cs:exam-run", JSON.stringify({ mode: "w1" }));
    localStorage.setItem("ao17cs:calib", JSON.stringify({ sure: { n: 1, ok: 1 } }));
    return Object.keys(window.CS50KZ_SYNC.snapshot(false).d);
  });
  expect(snap).toContain("ao17cs:exam");
  expect(snap).not.toContain("ao17cs:exam-run");
  expect(snap).not.toContain("ao17cs:calib");
  const merged = await page.evaluate(() => window.CS50KZ_SYNC.mergeKey("ao17cs:exam",
    { w1: { best: 90, bestAt: 30, last: 70, at: 40, runs: 3, first: 50, firstAt: 10 }, p1: { best: 60, last: 60, at: 7, runs: 1, first: 60, firstAt: 7 } },
    { w1: { best: 95, bestAt: 20, last: 95, at: 20, runs: 2, first: 40, firstAt: 5 }, w2: { best: 10, last: 10, at: 3, runs: 1, first: null, firstAt: null } }));
  expect(merged.w1).toEqual({ best: 95, bestAt: 20, last: 70, at: 40, runs: 3, first: 40, firstAt: 5 });
  expect(merged.p1).toMatchObject({ best: 60, first: 60 });
  expect(merged.w2).toMatchObject({ best: 10, first: null });
  // бір жағында алғашқы әрекет белгісіз: белгілісі сақталады
  const half = await page.evaluate(() => window.CS50KZ_SYNC.mergeKey("ao17cs:exam",
    { w1: { best: 70, last: 70, at: 9, runs: 2, first: null, firstAt: null } }, { w1: { best: 30, last: 30, at: 4, runs: 1, first: 30, firstAt: 4 } }));
  expect(half.w1).toMatchObject({ best: 70, last: 70, first: 30, firstAt: 4, runs: 2 });
});

const ex = (first, last, best, runs) => ({ first, last, best, runs, at: Date.now(), firstAt: Date.now() - 60 * DAY });
const MEMBERS = () => [
  { user_id: "s1", email: "aru@ao17.kz", display_name: "Ару", joined_at: "2026-09-01T08:00:00Z", updated_at: new Date().toISOString(), summary: {},
    snapshot: { v: 1, d: { "ao17cs:exam": { p1: ex(40, 80, 85, 2), w1: ex(50, 100, 100, 3) },
      "cs50kz:academy": { v: 1, lessons: { "ao17-foundation.m01.l01": { mastered: 1 }, "ao17-foundation.m01.l02": { mastered: 1 }, "ao17-foundation.m01.l03": {}, "ao17-senior.s01.l01": { mastered: 1 } } } } } },
  { user_id: "s2", email: "bek@ao17.kz", display_name: "Бекзат", joined_at: "2026-09-01T08:00:00Z", updated_at: new Date(Date.now() - 2 * DAY).toISOString(), summary: {},
    snapshot: { v: 1, d: { "ao17cs:exam": { p1: ex(60, 70, 75, 3) } } } },
  { user_id: "s3", email: "s3@ao17.kz", display_name: '=HYPERLINK("x")', joined_at: "2026-09-01T08:00:00Z", updated_at: new Date(Date.now() - 30 * DAY).toISOString(), summary: {},
    snapshot: { v: 1, d: { "ao17cs:exam": { p1: { first: 50, last: 50, best: 50, runs: 1 }, w9: { first: "x", best: 250, last: -5, runs: "2" } } } } },
  { user_id: "s4", email: "dana@ao17.kz", display_name: "Дана", joined_at: "2026-09-01T08:00:00Z", updated_at: null, summary: {}, snapshot: null },
];

test("AO17Results: дерек қатаң оқылады; пилот есебі - орташа, айырма, нормаланған өсім; CSV формула ретінде орындалмайды", async ({ page }) => {
  await page.goto("about:blank");
  await page.addScriptTag({ content: RESULTS_JS });
  const r = await page.evaluate((rows) => {
    const R = window.AO17Results;
    return { s1: R.ofRow(rows[0]), s3: R.ofRow(rows[2]), s4: R.ofRow(rows[3]), used: R.used(rows), act: R.active(rows, Date.now(), 7),
      p1: R.pilot(rows, "p1"), w5: R.pilot(rows, "w5"), csv: R.csv(rows) };
  }, MEMBERS());
  expect(r.s1.mastered).toBe(2);
  expect(r.s1.ex.p1).toEqual({ best: 85, last: 80, first: 40, runs: 2 });
  expect(r.s3.ex.w9).toEqual({ best: 100, last: 0, first: null, runs: 2 });
  expect(r.s4).toEqual({ name: "Дана", ex: {}, mastered: 0 });
  expect(r.used).toEqual(["w1", "w9", "p1"]);
  expect(r.act).toBe(2);
  expect(r.p1).toMatchObject({ n: 4, took: 3, both: 2, pre: 50, post: 75, delta: 25, g: 0.5 });
  expect(r.p1.per.map((p) => [p.pre, p.post, p.delta])).toEqual([[40, 80, 40], [60, 70, 10], [50, null, null], [null, null, null]]);
  expect(r.w5).toMatchObject({ both: 0, pre: null, post: null, delta: null, g: null });
  expect(r.csv.startsWith("﻿Оқушы;Меңгерілген сабақ;1-апта сынағы: алғашқы, %")).toBe(true);
  const lines = r.csv.slice(1).trimEnd().split("\r\n");
  expect(lines).toHaveLength(5);
  expect(lines[3].startsWith('"\'=HYPERLINK(""x"")";0;')).toBe(true);
});

function mockPlatform(context, members) {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const user = { id: "u-admin", aud: "authenticated", role: "authenticated", email: "mustafa_admin@admin.ao17.local", app_metadata: {}, user_metadata: {}, created_at: "2026-01-01T00:00:00Z" };
  const session = { access_token: `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub: user.id, exp, role: "authenticated", aud: "authenticated" })}.sig`,
    token_type: "bearer", expires_in: 3600, expires_at: exp, refresh_token: "r", user };
  const CORS = { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*" };
  const klass = { id: "c1", title: "7А сынып", join_code: "ABCDEFGH", invite_token: "t".repeat(32), join_open: true, archived: false, members: members.length, grants: 0 };
  return Promise.all([
    context.addInitScript((s) => localStorage.setItem("ao17:auth", s), JSON.stringify(session)),
    context.route(/fuzkjjfpknnpauykzfip\.supabase\.co\/(.*)$/, async (route) => {
      const req = route.request(), p = new URL(req.url()).pathname;
      if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: CORS });
      const json = (body, status = 200) => route.fulfill({ status, contentType: "application/json", headers: CORS, body: JSON.stringify(body) });
      if (p.endsWith("/rest/v1/ao_profiles")) return json([{ id: user.id, email: user.email, display_name: "Әкімші", role: "admin", must_change_password: false }]);
      if (p.endsWith("/rest/v1/ao_pages") || p.endsWith("/rest/v1/ao_grants") || p.endsWith("/rest/v1/ao_progress")) return json([]);
      if (p.endsWith("/rest/v1/rpc/ao_admin_overview")) return json([klass]);
      if (p.endsWith("/rest/v1/rpc/ao_admin_members")) return json(members);
      if (p.includes("/auth/v1/token")) return json(session);
      if (p.includes("/auth/v1/")) return json(user);
      return json({ message: "тестте күтілмеген сұраныс: " + p }, 404);
    }),
  ]);
}

test("мұғалім панелі: «Нәтижелер» - сынып кестесі, пилот есебі, CSV және басып шығару; axe таза", async ({ page, context }) => {
  await blockFonts(context);
  const errs = collectErrors(page);
  await mockPlatform(context, MEMBERS());
  await page.goto("admin.html");
  await page.locator('[data-class="c1"]').click();
  await page.locator('[data-t="results"]').click();
  await expect(page.locator(".ao-results-sum")).toHaveText("Оқушы: 4 · соңғы 7 күнде белсенді: 2 · меңгерілген сабақ, орташа: 0.5");
  await expect(page.locator(".ao-results thead th")).toHaveText(["Оқушы", "Сабақ", "1-апта", "9-апта", "1-бөлім"]);
  await expect(page.locator(".ao-results tbody tr").first().locator("td").nth(3)).toHaveText("85%алғашқы 40%");
  await expect(page.locator("[data-pilot]")).toHaveValue("p1");
  await expect(page.locator("[data-pilot-sum]")).toHaveText("Екі әрекеті де бар оқушы: 2 / 4. Орташа: 50% → 75% (айырма +25). Нормаланған өсім: 0.5.");
  await expect(page.locator(".ao-pilot tbody tr")).toHaveCount(3);
  await expect(page.locator(".ao-pilot tbody tr").first()).toHaveText(["Ару", "40%", "80%", "+40", "2"].join(""));
  await page.locator("[data-pilot]").selectOption("w1");
  await expect(page.locator("[data-pilot-sum]")).toHaveText("Екі әрекеті де бар оқушы: 1 / 4. Орташа: 50% → 100% (айырма +50). Нормаланған өсім: 1.");
  const [dl] = await Promise.all([page.waitForEvent("download"), page.locator("[data-csv]").click()]);
  expect(dl.suggestedFilename()).toBe("ao17cs-natizheler.csv");
  const csv = fs.readFileSync(await dl.path(), "utf8");
  expect(csv.split("\r\n")[1].startsWith("Ару;2;50;100;100;3;")).toBe(true);
  await page.locator("[data-pilot]").selectOption("p1");
  const [pop] = await Promise.all([page.waitForEvent("popup"), page.locator("[data-print]").click()]);
  await expect(pop.locator("h1")).toHaveText("AO17 CS пилот есебі");
  await expect(pop.locator("body")).toContainText("Класс: 7А сынып · 1-бөлім емтиханы");
  await expect(pop.locator("body")).toContainText("Орташа: 50% → 75% (айырма +25). Нормаланған өсім: 0.5.");
  await page.addScriptTag({ content: fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8") });
  const v = await page.evaluate(async () => (await axe.run(document.getElementById("main"), { runOnly: ["wcag2a", "wcag2aa"], resultTypes: ["violations"] })).violations
    .filter((x) => ["serious", "critical"].includes(x.impact)).map((x) => `${x.id}: ${x.nodes.length} (${x.nodes[0].html.slice(0, 140)})`));
  expect(v).toEqual([]);
  expect(errs).toEqual([]);
});

test("мұғалім панелі: AO17 CS сынағы әлі жоқ класта түсінікті хабар; оқушы жоқ класта - қосылу туралы", async ({ page, context }) => {
  await mockPlatform(context, [MEMBERS()[3]]);
  await page.goto("admin.html");
  await page.locator('[data-class="c1"]').click();
  await page.locator('[data-t="results"]').click();
  await expect(page.locator("[data-pane]")).toContainText("Әзірге AO17 CS сынағын тапсырған оқушы жоқ.");
  await expect(page.locator("[data-print]")).toHaveCount(0);
});
