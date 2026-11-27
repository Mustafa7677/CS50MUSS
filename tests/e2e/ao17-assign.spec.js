// © 2026 AO17 командасы. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md.
// Тапсырмалар (supabase/platform.sql: ao_assignments; assets/js/ao17-assign.js; docs/PLATFORM.md). Құқықты дерекқор шешеді -
// оны supabase/platform_test.sql тексереді. Мұнда:
//  * орындалу ережесі: сабақ меңгерілсе, сынақ 70%-дан; мерзімнен кейін - «кешікті», мерзімі өтсе - «мерзімі өтті»;
//  * мұғалім панелі: «Тапсырмалар» - беру (дұрыс сұраныс), оқушылар бойынша күйі, өшіру, қайталанған тапсырма туралы хабар;
//  * оқушы кабинеті: «Менің тапсырмаларым» - күйі осы құрылғыдағы прогрестен; дерекқор жаңартылмаса - қалған бөлімдер жұмыс істейді.
// Supabase жауаптары тестте беріледі (желіге шықпайды).
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");
const { blockFonts, collectErrors } = require("../support/helpers");
const ROOT = path.resolve(__dirname, "../..");
const ASSIGN_JS = fs.readFileSync(path.join(ROOT, "assets/js/ao17-assign.js"), "utf8");
const AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const DAY = 86400000;
const iso = (ms) => new Date(ms).toISOString();

test("AO17Assign: сабақ меңгерілсе, сынақ 70%-дан орындалды; мерзімнен кейін - кешікті; сілтемелер; жарамсыз нысана", async ({ page }) => {
  await page.goto("about:blank");
  await page.addScriptTag({ content: ASSIGN_JS });
  const now = Date.now();
  const r = await page.evaluate(([now, DAY]) => {
    const T = window.AO17Assign;
    const iso = (ms) => new Date(ms).toISOString();
    const data = T.fromData({
      "cs50kz:academy": { v: 1, lessons: { "ao17-foundation.m01.l02": { mastered: now - 5 * DAY, score: 90 }, "ao17-foundation.m01.l03": { score: 40 } } },
      "ao17cs:exam": { w1: { best: 80, bestAt: now - 2 * DAY, at: now - DAY, runs: 2 }, w2: { best: 60, at: now - DAY, runs: 1 } },
    });
    const L = (t, due) => ({ kind: "lesson", target: t, due_at: due });
    const X = (t, due) => ({ kind: "test", target: t, due_at: due });
    return {
      lessonDone: T.status(L("ao17-foundation.m01.l02", iso(now + DAY)), data, now),
      lessonLate: T.status(L("ao17-foundation.m01.l02", iso(now - 7 * DAY)), data, now).state,
      lessonPending: T.status(L("ao17-foundation.m01.l03", iso(now + DAY)), data, now),
      testDone: T.status(X("w1", iso(now - DAY)), data, now).state,
      testLate: T.status(X("w1", iso(now - 3 * DAY)), data, now).state,
      testOverdue: T.status(X("w2", iso(now - DAY)), data, now),
      noDue: T.status(X("w5", null), data, now).state,
      hrefs: [T.href(L("ao17-foundation.m10.l10")), T.href(X("w12")), T.href(X("p1")), T.href(X("p2")), T.href(X("final")), T.planHref(L("ao17-foundation.m03.l07")), T.planHref(X("w1"))],
      lessonOf: [T.lessonOf("academy/m04/l09.html"), T.lessonOf("academy/teach/m04.html"), T.lessonOf("academy/m13/l01.html")],
      invalid: [T.valid(X("w13")), T.valid(L("ao17-senior.s01.l01")), T.valid({ kind: "page", target: "x" }), T.href(X("../x"))],
      sum: T.summary(X("w1", iso(now - 3 * DAY)), [{ snapshot: { d: { "ao17cs:exam": { w1: { best: 100, bestAt: now - 4 * DAY } } } } }, { snapshot: { d: { "ao17cs:exam": { w1: { best: 90, bestAt: now - DAY } } } } }, { snapshot: null }], now),
    };
  }, [now, DAY]);
  expect(r.lessonDone).toMatchObject({ state: "done", label: "Орындады", score: 90 });
  expect(r.lessonLate).toBe("late");
  expect(r.lessonPending).toMatchObject({ state: "pending", label: "Орындалмаған", score: 40 });
  expect(r.testDone).toBe("done");
  expect(r.testLate).toBe("late");
  expect(r.testOverdue).toMatchObject({ state: "overdue", label: "Мерзімі өтті", score: 60 });
  expect(r.noDue).toBe("pending");
  expect(r.hrefs).toEqual(["academy/m10/l10.html", "academy/exam.html?w=12", "academy/exam.html?part=1", "academy/exam.html?part=2", "academy/exam.html", "academy/teach/m03.html#l07", ""]);
  expect(r.lessonOf).toEqual(["ao17-foundation.m04.l09", null, null]);
  expect(r.invalid).toEqual([false, false, false, ""]);
  expect(r.sum).toEqual({ total: 3, done: 1, late: 1, pending: 0, overdue: 1 });
});

async function mockPlatform(context, role, over = {}) {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const user = { id: "u-" + role, aud: "authenticated", role: "authenticated", email: role + "@example.com", app_metadata: {}, user_metadata: {}, created_at: "2026-01-01T00:00:00Z" };
  const session = { access_token: `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub: user.id, exp, role: "authenticated", aud: "authenticated" })}.sig`,
    token_type: "bearer", expires_in: 3600, expires_at: exp, refresh_token: "r", user };
  const CORS = { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*" };
  const reqs = [];
  await context.addInitScript((s) => localStorage.setItem("ao17:auth", s), JSON.stringify(session));
  await context.route(/fuzkjjfpknnpauykzfip\.supabase\.co\/(.*)$/, async (route) => {
    const req = route.request(), u = new URL(req.url()), p = u.pathname;
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: CORS });
    const json = (body, status = 200) => route.fulfill({ status, contentType: "application/json", headers: CORS, body: body == null ? "" : JSON.stringify(body) });
    if (p.endsWith("/rest/v1/ao_assignments")) {
      reqs.push({ method: req.method(), query: u.search, body: req.postData() ? JSON.parse(req.postData()) : null });
      if (req.method() === "GET") return json(over.assignments || []);
      if (req.method() === "POST") return over.insertError ? json(over.insertError, 409) : json(null, 201);
      if (req.method() === "DELETE") return json(null, 204);
    }
    if (p.endsWith("/rest/v1/ao_profiles")) return json([{ id: user.id, email: user.email, display_name: "Тест", role, must_change_password: false }]);
    if (p.endsWith("/rest/v1/ao_pages")) return json(over.pages || []);
    if (p.endsWith("/rest/v1/ao_grants") || p.endsWith("/rest/v1/ao_progress")) return json([]);
    const rpc = (p.match(/\/rest\/v1\/rpc\/([a-z_]+)$/) || [])[1];
    if (rpc === "ao_admin_overview") return json([{ id: "c1", title: "7А сынып", join_code: "ABCDEFGH", invite_token: "t".repeat(32), join_open: true, archived: false, members: 3, grants: 1 }]);
    if (rpc === "ao_admin_members") return json(over.members || []);
    if (rpc === "ao_admin_teachers") return json([]);
    if (rpc === "ao_my_classes") return json([{ class_id: "c1", title: "7А сынып", joined_at: "2026-09-01T08:00:00Z" }]);
    if (rpc === "ao_my_access") return json([{ path: "academy/m01/l02.html", course: "academy", kind: "lecture", title: "Терістеу", sort: 102 }]);
    if (rpc === "ao_my_assignments") return over.myAssignments === "missing" ? json({ code: "PGRST202", message: "Could not find the function public.ao_my_assignments without parameters in the schema cache" }, 404) : json(over.myAssignments || []);
    if (rpc) return json([]);
    if (p.includes("/auth/v1/token")) return json(session);
    if (p.includes("/auth/v1/")) return json(user);
    return json({ message: "тестте күтілмеген сұраныс: " + p }, 404);
  });
  return reqs;
}

const now = Date.now();
const MEMBERS = [
  { user_id: "s1", email: "aru@x.kz", display_name: "Ару", joined_at: "2026-09-01T08:00:00Z", updated_at: iso(now), summary: {},
    snapshot: { v: 1, d: { "ao17cs:exam": { w1: { best: 85, bestAt: now - 9 * DAY, at: now - 9 * DAY, runs: 1 } }, "cs50kz:academy": { v: 1, lessons: { "ao17-foundation.m01.l02": { mastered: now - DAY } } } } } },
  { user_id: "s2", email: "bek@x.kz", display_name: "Бекзат", joined_at: "2026-09-01T08:00:00Z", updated_at: iso(now), summary: {},
    snapshot: { v: 1, d: { "ao17cs:exam": { w1: { best: 90, bestAt: now - 2 * DAY, at: now - 2 * DAY, runs: 2 } } } } },
  { user_id: "s3", email: "dana@x.kz", display_name: "Дана", joined_at: "2026-09-01T08:00:00Z", updated_at: iso(now), summary: {}, snapshot: { v: 1, d: {} } },
];
const ASSIGNMENTS = [
  { id: 11, kind: "test", target: "w1", title: "1-апта сынағы", due_at: iso(now - 5 * DAY), created_at: iso(now - 12 * DAY) },
  { id: 12, kind: "lesson", target: "ao17-foundation.m01.l02", title: "Терістеу, конъюнкция, дизъюнкция", due_at: iso(now + 3 * DAY), created_at: iso(now - DAY) },
];
const PAGES = [
  { path: "academy/m01/l01.html", course: "academy", kind: "lecture", title: "Пікір және ақиқат мәні", sort: 101 },
  { path: "academy/m01/l02.html", course: "academy", kind: "lecture", title: "Терістеу, конъюнкция, дизъюнкция", sort: 102 },
  { path: "academy/teach/m01.html", course: "teach", kind: "page", title: "Мұғалімге: 1-апта", sort: 1000 },
];

test("мұғалім панелі: «Тапсырмалар» - тізім мен оқушылар бойынша күйі, беру, қайталауға хабар, өшіру; axe таза", async ({ page, context }) => {
  await blockFonts(context);
  const errs = collectErrors(page);
  const reqs = await mockPlatform(context, "teacher", { members: MEMBERS, assignments: ASSIGNMENTS, pages: PAGES });
  await page.goto("admin.html");
  await page.locator('[data-class="c1"]').click();
  await page.locator('[data-t="assign"]').click();
  const items = page.locator(".ao-assign");
  await expect(items).toHaveCount(2);
  await expect(items.nth(0).locator(".ao-assign-sum")).toHaveText("Орындады: 2 / 3 · кешікті: 1 · мерзімінде орындамады: 1");
  await expect(items.nth(0)).toContainText("мерзімі өтті");
  await items.nth(0).locator("summary").click();
  await expect(items.nth(0).locator(".ao-assign-st li")).toHaveText(["АруОрындады · 85%", "БекзатКешігіп орындады · 90%", "ДанаМерзімі өтті"]);
  await expect(items.nth(1).locator(".ao-assign-sum")).toHaveText("Орындады: 1 / 3");
  await expect(items.nth(1).locator('a[href$="academy/m01/l02.html"]')).toHaveText("Ашу");
  await expect(items.nth(1).locator('a[href$="academy/teach/m01.html#l02"]')).toHaveText("Сабақ жоспары (ҚМЖ)");
  const opts = await page.locator('[data-form="assign"] select option').evaluateAll((os) => os.map((o) => o.value));
  expect(opts).toEqual([...Array.from({ length: 12 }, (_, i) => `test|w${i + 1}`), "test|p1", "test|p2", "test|final", "lesson|ao17-foundation.m01.l01", "lesson|ao17-foundation.m01.l02"]);
  await page.locator('[data-form="assign"] select').selectOption("test|w2");
  await page.locator('[data-form="assign"] input[name="due"]').fill("2026-12-10T09:00");
  await page.locator('[data-form="assign"] button[type="submit"]').click();
  await expect(page.locator("[data-cmsg]")).toHaveText("Тапсырма берілді ✓");
  const post = reqs.find((r) => r.method === "POST");
  expect(post.body).toEqual({ class_id: "c1", kind: "test", target: "w2", title: "2-апта сынағы", due_at: new Date("2026-12-10T09:00").toISOString() });
  expect(reqs.find((r) => r.method === "GET").query).toContain("order=due_at.asc.nullslast");
  await page.locator('[data-adel="12"]').click();   // растау терезесін collectErrors қабылдайды
  await expect(page.locator("[data-cmsg]")).toHaveText("Тапсырма өшірілді ✓");
  expect(reqs.find((r) => r.method === "DELETE").query).toContain("id=eq.12");
  await page.addScriptTag({ content: AXE });
  const v = await page.evaluate(async () => (await axe.run(document.getElementById("main"), { runOnly: ["wcag2a", "wcag2aa"], resultTypes: ["violations"] })).violations
    .filter((x) => ["serious", "critical"].includes(x.impact)).map((x) => `${x.id}: ${x.nodes.length} (${x.nodes[0].html.slice(0, 140)})`));
  expect(v).toEqual([]);
  expect(errs).toEqual([]);
});

test("мұғалім панелі: бұрын берілген тапсырманы қайта берсе - түсінікті хабар", async ({ page, context }) => {
  await mockPlatform(context, "teacher", { members: MEMBERS, assignments: [], pages: PAGES, insertError: { code: "23505", message: "duplicate key value violates unique constraint" } });
  await page.goto("admin.html");
  await page.locator('[data-class="c1"]').click();
  await page.locator('[data-t="assign"]').click();
  await expect(page.locator(".ao-assign-list")).toContainText("Әзірге тапсырма жоқ.");
  await page.locator('[data-form="assign"] button[type="submit"]').click();
  await expect(page.locator("[data-cmsg]")).toHaveText("Бұл тапсырма бұл класқа бұрын берілген");
});

test("оқушы кабинеті: «Менің тапсырмаларым» - күйі осы құрылғыдағы прогрестен, сілтемелер; axe таза", async ({ page, context }) => {
  await blockFonts(context);
  const errs = collectErrors(page);
  await context.addInitScript(([now, DAY]) => {
    localStorage.setItem("ao17cs:exam", JSON.stringify({ w1: { best: 75, bestAt: now - 6 * DAY, at: now - 6 * DAY, runs: 1 } }));
    localStorage.setItem("cs50kz:academy", JSON.stringify({ v: 1, lessons: {} }));
  }, [now, DAY]);
  await mockPlatform(context, "student", { myAssignments: [
    { id: 11, class_id: "c1", class_title: "7А сынып", kind: "test", target: "w1", title: "1-апта сынағы", due_at: iso(now - 5 * DAY), created_at: iso(now - 12 * DAY) },
    { id: 13, class_id: "c1", class_title: "7А сынып", kind: "test", target: "p1", title: "1-бөлім емтиханы", due_at: iso(now - DAY), created_at: iso(now - 9 * DAY) },
    { id: 12, class_id: "c1", class_title: "7А сынып", kind: "lesson", target: "ao17-foundation.m01.l02", title: "Терістеу, конъюнкция, дизъюнкция", due_at: iso(now + 3 * DAY), created_at: iso(now - DAY) },
  ] });
  await page.goto("student.html");
  const rows = page.locator(".ao-assign-row");
  await expect(rows).toHaveCount(3);
  await expect(rows.nth(0).locator(".ao-badge")).toHaveText("Орындады · 75%");
  await expect(rows.nth(1).locator(".ao-badge")).toHaveText("Мерзімі өтті");
  await expect(rows.nth(2).locator(".ao-badge")).toHaveText("Орындалмаған");
  await expect(rows.nth(0)).toContainText("7А сынып · мерзімі");
  await expect(rows.nth(1).locator("a")).toHaveAttribute("href", /academy\/exam\.html\?part=1$/);
  await expect(rows.nth(2).locator("a")).toHaveAttribute("href", /academy\/m01\/l02\.html$/);
  await expect(page.locator("[data-my] li")).toHaveCount(1);
  await page.addScriptTag({ content: AXE });
  const v = await page.evaluate(async () => (await axe.run(document.getElementById("main"), { runOnly: ["wcag2a", "wcag2aa"], resultTypes: ["violations"] })).violations
    .filter((x) => ["serious", "critical"].includes(x.impact)).map((x) => `${x.id}: ${x.nodes.length} (${x.nodes[0].html.slice(0, 140)})`));
  expect(v).toEqual([]);
  expect(errs).toEqual([]);
});

test("оқушы кабинеті: дерекқор әлі жаңартылмаса (ao_my_assignments жоқ) - кластар мен мазмұн бұрынғыдай көрінеді", async ({ page, context }) => {
  await mockPlatform(context, "student", { myAssignments: "missing" });
  await page.goto("student.html");
  await expect(page.locator("[data-assign]")).toHaveText("Тапсырмалар әзірге қолжетімсіз.");
  await expect(page.locator("[data-my] li")).toHaveCount(1);
  await expect(page.locator("[data-access] a")).toHaveText("Терістеу");
  await expect(page.locator("[data-jmsg]")).toHaveText("");
});
