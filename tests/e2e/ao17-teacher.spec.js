// © 2026 AO17 командасы. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md.
// Мұғалім рөлі (supabase/platform.sql, docs/PLATFORM.md): интерфейс жағы. Құқықты дерекқор шешеді (RLS, SECURITY DEFINER) -
// оны supabase/platform_test.sql тексереді; мұнда панельдің әр рөлге дұрыс көрінетінін тексереміз:
//  * мұғалім: панель ашылады («Мұғалім» белгісі), «Мұғалімдер» бөлімі жоқ; кіргеннен кейін панельге бағытталады;
//  * Super Admin: мұғалім тағайындайды және мұғалімдігін алады (ao_admin_set_role сұранысы дұрыс параметрмен);
//  * оқушы: панельге рұқсат жоқ; мұғалім жоспарлары («teach» курсы) оқушыға ашылатын мазмұн тізімінде көрінбейді.
// Supabase жауаптары тестте беріледі (желіге шықпайды).
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const { blockFonts, collectErrors } = require("../support/helpers");

async function mockAs(context, role, extra = {}) {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const user = { id: "u-" + role, aud: "authenticated", role: "authenticated", email: role + "@example.com", app_metadata: {}, user_metadata: {}, created_at: "2026-01-01T00:00:00Z" };
  const session = { access_token: `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub: user.id, exp, role: "authenticated", aud: "authenticated" })}.sig`,
    token_type: "bearer", expires_in: 3600, expires_at: exp, refresh_token: "r", user };
  const CORS = { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*" };
  const calls = [];
  const teachers = [{ id: "t1", email: "aigul@school.kz", display_name: "Айгүл Серікқызы", classes: 2 }];
  await context.addInitScript((s) => localStorage.setItem("ao17:auth", s), JSON.stringify(session));
  await context.route(/fuzkjjfpknnpauykzfip\.supabase\.co\/(.*)$/, async (route) => {
    const req = route.request(), p = new URL(req.url()).pathname;
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: CORS });
    const json = (body, status = 200) => route.fulfill({ status, contentType: "application/json", headers: CORS, body: JSON.stringify(body) });
    const rpc = p.match(/\/rest\/v1\/rpc\/([a-z_]+)$/);
    if (rpc) calls.push([rpc[1], JSON.parse(req.postData() || "{}")]);
    if (p.endsWith("/rest/v1/ao_profiles")) return json([{ id: user.id, email: user.email, display_name: "Тест " + role, role, must_change_password: false }]);
    if (p.endsWith("/rest/v1/ao_pages")) return json(extra.pages || []);
    if (p.endsWith("/rest/v1/ao_grants") || p.endsWith("/rest/v1/ao_progress")) return json([]);
    if (rpc && rpc[1] === "ao_admin_overview") return json([{ id: "c1", title: "7А сынып", join_code: "ABCDEFGH", invite_token: "t".repeat(32), join_open: true, archived: false, members: 0, grants: 0 }]);
    if (rpc && rpc[1] === "ao_admin_teachers") return json(teachers);
    if (rpc && rpc[1] === "ao_admin_set_role") return json({ email: "x", role: "teacher" });
    if (rpc && rpc[1] === "ao_admin_members") return json([]);
    if (rpc) return json([]);
    if (p.includes("/auth/v1/token")) return json(session);
    if (p.includes("/auth/v1/")) return json(user);
    return json({ message: "тестте күтілмеген сұраныс: " + p }, 404);
  });
  return calls;
}

test("мұғалім: панель ашылады, «Мұғалім» белгісі бар, «Мұғалімдер» бөлімі жоқ; өз класын ашады", async ({ page, context }) => {
  await blockFonts(context);
  const errs = collectErrors(page);
  const calls = await mockAs(context, "teacher");
  await page.goto("admin.html");
  await expect(page.locator(".ao-top h1")).toHaveText("Мұғалім панелі");
  await expect(page.locator(".ao-who")).toContainText("Мұғалім");
  await expect(page.locator(".ao-teachers")).toHaveCount(0);
  await expect(page.locator('[data-class="c1"]')).toBeVisible();
  expect(calls.some(([f]) => f === "ao_admin_teachers")).toBe(false);
  await page.locator('[data-form="new"] input').fill("8Б сынып");
  await page.locator('[data-form="new"] button[type="submit"]').click();
  await expect.poll(() => calls.find(([f]) => f === "ao_admin_class_create")).toEqual(["ao_admin_class_create", { p_title: "8Б сынып" }]);
  expect(errs).toEqual([]);
});

test("Super Admin: мұғалім тағайындайды және мұғалімдігін алады", async ({ page, context }) => {
  await blockFonts(context);
  const calls = await mockAs(context, "admin");
  await page.goto("admin.html");
  await expect(page.locator(".ao-who")).toContainText("Super Admin");
  await expect(page.locator('[data-list="teachers"] li')).toHaveCount(1);
  await expect(page.locator('[data-list="teachers"] li')).toContainText("Айгүл Серікқызы");
  await expect(page.locator('[data-list="teachers"] li')).toContainText("aigul@school.kz · 2 класс");
  await page.locator('[data-form="teacher"] input').fill(" new.teacher@school.kz ");
  await page.locator('[data-form="teacher"] button').click();
  await expect(page.locator("[data-gmsg]")).toHaveText("new.teacher@school.kz енді мұғалім ✓");
  expect(calls).toContainEqual(["ao_admin_set_role", { p_email: "new.teacher@school.kz", p_role: "teacher" }]);
  page.once("dialog", (d) => d.accept());
  await page.locator('[data-unteach="aigul@school.kz"]').click();
  await expect(page.locator("[data-gmsg]")).toHaveText("Мұғалімдігі алынды ✓");
  expect(calls).toContainEqual(["ao_admin_set_role", { p_email: "aigul@school.kz", p_role: "student" }]);
});

test("оқушы: панельге рұқсат жоқ; мұғалім жоспарлары («teach») оқушыға ашылатын мазмұн тізімінде жоқ", async ({ page, context, browser }) => {
  await mockAs(context, "student");
  await page.goto("admin.html");
  await expect(page.locator(".ao-top h1")).toHaveText("Рұқсат жоқ");
  await expect(page.locator(".ao-card")).toContainText("Мұғалім аккаунтын Super Admin береді");
  const c2 = await browser.newContext();
  await mockAs(c2, "admin", { pages: [
    { path: "academy/m01/l01.html", course: "academy", kind: "lecture", title: "Пікір", sort: 101 },
    { path: "academy/teach/m01.html", course: "teach", kind: "page", title: "Мұғалімге: 1-апта", sort: 1000 },
  ] });
  const p2 = await c2.newPage();
  await p2.goto("admin.html");
  await p2.locator('[data-class="c1"]').click();
  await expect(p2.locator(".ao-course")).toHaveCount(1);
  await expect(p2.locator('.ao-course[data-course="academy"]')).toBeVisible();
  await expect(p2.locator('.ao-course[data-course="teach"]')).toHaveCount(0);
  await c2.close();
});

test("gate: мұғалім жоспарлары - «teach» курсы, индекс жария, AO17 CS сабақтары - «academy»", async () => {
  const { execFileSync } = require("child_process");
  const path = require("path");
  const root = path.resolve(__dirname, "../..");
  const out = execFileSync("python3", ["-c", "import sys; sys.path.insert(0, 'tools'); import gate; print(gate.page_rule('academy/teach/m01.html'), gate.page_rule('academy/teach/index.html'), gate.page_rule('academy/m01/l01.html'))"], { cwd: root }).toString().trim();
  expect(out).toBe("('teach', 'page') None ('academy', 'lecture')");
  expect(fs.existsSync(path.join(root, "academy/teach/m01.html"))).toBe(true);
});
