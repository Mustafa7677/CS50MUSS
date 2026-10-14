import { test, expect, type Browser, type Page } from "@playwright/test";
import pg from "pg";

// Лицензия басқару: мектеп әкімшісі беті, банер (30 күн / мерзімі өткен), шектеулер, SUPER ADMIN ұзартуы, 390px.
// Өз ұйымын жасайды (бірегей slug) және соңында өшіреді. DATABASE_URL (superuser) керек.
const PASS = "LicencePass123";
const db = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
const q = async <T = any>(sql: string, p: unknown[] = []) => (await db.query(sql, p)).rows as T[];
const run = Date.now().toString(36);
const SLUG = `lic-${run}`;
const E = (n: string) => `${n}-${run}@lic.qazaqcode.kz`;
const S: Record<string, any> = { students: [] as string[] };

async function asUser<T>(uid: string, sql: string, params: unknown[]): Promise<T[]> {
  const c = await db.connect();
  try {
    await c.query("begin"); await c.query("set local role authenticated");
    await c.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify({ sub: uid, role: "authenticated" })]);
    const r = await c.query(sql, params); await c.query("commit"); return r.rows as T[];
  } catch (e) { await c.query("rollback").catch(() => {}); throw e; } finally { c.release(); }
}
const mkUser = async (email: string, name: string) => (await q("select auth_dev.sign_up($1,$2,$3) as id", [email, PASS, name]))[0].id as string;
async function login(page: Page, email: string, home: RegExp) {
  await page.goto("/login");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(PASS);
  await page.getByRole("button", { name: "Кіру" }).click();
  await page.waitForURL(home);
}
async function sess(browser: Browser, email: string, home: RegExp, width?: number) {
  const ctx = await browser.newContext({ baseURL: test.info().project.use.baseURL, locale: "kk-KZ", viewport: width ? { width, height: 844 } : undefined });
  const page = await ctx.newPage();
  await login(page, email, home);
  return { ctx, page };
}
const noHScroll = async (page: Page) => expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
const setLic = (sql: string) => q(`update licenses set ${sql} where org_id = $1`, [S.org]);

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  S.root = await mkUser(E("root"), "Лицензия Платформа Әкімші");
  await q("insert into platform_admins(user_id) values ($1)", [S.root]);
  const valid = new Date(Date.now() + 365 * 864e5).toISOString().slice(0, 10);
  const r = (await asUser<any>(S.root, "select public.create_organization($1,$2,'starter',$3) as r", [`Лицензия Мектеп ${run}`, SLUG, valid]))[0].r;
  S.org = r.org_id;
  S.admin = await mkUser(E("admin"), "Лицензия Әкімші");
  await asUser(S.admin, "select public.accept_invitation($1)", [r.admin_invite_token]);
  const t = (await asUser<any>(S.admin, "select public.create_invitation($1,'teacher') as t", [S.org]))[0].t;
  S.teacher = await mkUser(E("teacher"), "Лицензия Мұғалім");
  await asUser(S.teacher, "select public.accept_invitation($1)", [t]);
  S.cls = (await asUser<any>(S.teacher, "select public.create_classroom($1,'9А','2025-2026','Информатика') as id", [S.org]))[0].id;
  const code = (await q("select join_code from classrooms where id=$1", [S.cls]))[0].join_code;
  for (let i = 1; i <= 5; i++) {
    const id = await mkUser(E(`student${i}`), `Лицензия Оқушы ${i}`);
    await asUser(id, "select public.join_classroom($1)", [code]);
    S.students.push(id);
  }
});
test.afterAll(async () => {
  await q("delete from organizations where id = $1", [S.org]);
  await q("delete from auth.users where email like $1", [`%-${run}@lic.qazaqcode.kz`]);
  await q("delete from platform_admins where user_id = $1", [S.root]);
  await db.end();
});

test("белсенді лицензия: мектеп әкімшісі беті, сандар, банер жоқ", async ({ browser }) => {
  const { ctx, page } = await sess(browser, E("admin"), /\/school/);
  await expect(page.getByTestId("licence-banner")).toHaveCount(0);
  await page.getByRole("link", { name: "Лицензия" }).first().click();
  await expect(page.getByRole("heading", { name: "Лицензия", level: 1 })).toBeVisible();
  await expect(page.getByTestId("licence-plan")).toHaveText("STARTER");
  await expect(page.getByTestId("usage-students-used")).toHaveText("5");
  await expect(page.getByTestId("usage-students-max")).toHaveText("100");
  await expect(page.getByTestId("usage-teachers-used")).toHaveText("1");
  await expect(page.getByTestId("usage-teachers-max")).toHaveText("5");
  await expect(page.getByTestId("usage-students")).toHaveAttribute("data-level", "ok");
  await expect(page.getByTestId("licence-days")).toContainText(/36[4-6] күн/);
  await expect(page.getByText("Деректер өшірілмейді")).toBeVisible();
  await ctx.close();
});

test("лимитке 80% және 100% жақындағанда ескерту", async ({ browser }) => {
  const { ctx, page } = await sess(browser, E("admin"), /\/school/);
  await setLic("max_students = 6");
  await page.goto("/school/licence");
  await expect(page.getByTestId("usage-students")).toHaveAttribute("data-level", "near");
  await expect(page.getByTestId("usage-students-warn")).toContainText("Лимитке жақындады");
  await setLic("max_students = 5");
  await page.reload();
  await expect(page.getByTestId("usage-students")).toHaveAttribute("data-level", "full");
  await expect(page.getByTestId("usage-students-warn")).toContainText("Лимит толды");
  await setLic("max_students = 100");
  await ctx.close();
});

test("мерзімі жақындағанда (<=30 күн) барлық рөлдерде банер", async ({ browser }) => {
  await setLic("valid_until = current_date + 12");
  for (const [email, home] of [[E("admin"), /\/school/], [E("teacher"), /\/teacher/], [E("student1"), /\/student/]] as const) {
    const { ctx, page } = await sess(browser, email, home);
    const b = page.getByTestId("licence-banner");
    await expect(b).toBeVisible();
    await expect(b).toHaveAttribute("data-state", "expiring");
    await expect(b).toContainText("12 күн қалды");
    await ctx.close();
  }
  await setLic("valid_until = current_date + 365");
});

test("мерзімі біткен: банер, жаңа сынып қазақша қатемен бұғатталады, экспорт және оқу жұмыс істейді", async ({ browser }) => {
  await setLic("valid_from = current_date - 60, valid_until = current_date - 2");
  // мектеп әкімшісі
  const a = await sess(browser, E("admin"), /\/school/);
  const b = a.page.getByTestId("licence-banner");
  await expect(b).toHaveAttribute("data-state", "expired");
  await expect(b).toContainText("Жаңа тапсырма, сынып және курс жасау шектелген");
  await expect(b).toContainText("деректер сақталған");
  await expect(b).toContainText("экспорт қолжетімді");
  await a.page.goto("/school/licence");
  await expect(a.page.getByTestId("licence-days")).toContainText("күн бұрын аяқталған");
  await expect(a.page.getByRole("alert").filter({ hasText: "мерзімі өтті" })).toBeVisible();
  const csv = await a.page.request.get("/school/export/csv");
  expect(csv.status()).toBe(200);
  expect(csv.headers()["content-type"]).toContain("text/csv");
  await a.page.goto("/school/students");
  await expect(a.page.getByText("Лицензия Оқушы 1").first()).toBeVisible(); // деректер оқылады
  await a.ctx.close();
  // мұғалім: сынып ашу қатесі қазақша
  const t = await sess(browser, E("teacher"), /\/teacher/);
  await expect(t.page.getByTestId("licence-banner")).toBeVisible();
  await t.page.getByLabel("Сынып атауы").fill("Жаңа сынып");
  await t.page.getByRole("button", { name: "Сынып ашу" }).click();
  await expect(t.page.getByRole("alert").filter({ hasText: "лицензия мерзімі аяқталған" })).toBeVisible();
  expect((await q("select count(*)::int n from classrooms where org_id=$1", [S.org]))[0].n).toBe(1);
  await t.ctx.close();
  // оқушы: банер жұмсақ мәтінмен, кабинет ашылады
  const s = await sess(browser, E("student1"), /\/student/);
  await expect(s.page.getByTestId("licence-banner")).toContainText("жұмысыңыз бен бағаларыңыз сақталған");
  await s.ctx.close();
});

test("SUPER ADMIN лицензияны +1 жылға ұзартады -> шектеу алынады, аудитте көрінеді", async ({ browser }) => {
  const r = await sess(browser, E("root"), /\/admin/);
  await r.page.goto(`/admin/orgs/${S.org}`);
  await expect(r.page.getByTestId("org-state")).toContainText("Мерзімі өткен");
  await r.page.getByRole("button", { name: "Ұзарту +1 жыл" }).click();
  await r.page.getByRole("dialog").getByRole("button", { name: "Ұзарту", exact: true }).click();
  await expect(r.page.getByTestId("org-state")).toContainText("Белсенді");
  const [l] = await q("select (valid_until - current_date) d from licenses where org_id=$1", [S.org]);
  expect(l.d).toBeGreaterThanOrEqual(364); expect(l.d).toBeLessThanOrEqual(366);
  await expect(r.page.getByTestId("licence-audit")).toContainText("Лицензия ұзартылды");
  await r.ctx.close();
  const t = await sess(browser, E("teacher"), /\/teacher/);
  await expect(t.page.getByTestId("licence-banner")).toHaveCount(0);
  await t.page.getByLabel("Сынып атауы").fill("10Ә");
  await t.page.getByRole("button", { name: "Сынып ашу" }).click();
  await t.page.waitForURL(/\/teacher\/classes\//);
  expect((await q("select count(*)::int n from classrooms where org_id=$1", [S.org]))[0].n).toBe(2);
  await t.ctx.close();
});

test("SUPER ADMIN: пакет таңдағанда лимиттер автотолтырылады, ENTERPRISE қолмен, сақтау аудитке жазылады", async ({ browser }) => {
  const r = await sess(browser, E("root"), /\/admin/);
  await r.page.goto(`/admin/orgs/${S.org}`);
  await r.page.locator("#lic-plan").selectOption("pro");
  await expect(r.page.locator("#lic-ms")).toHaveValue("500");
  await expect(r.page.locator("#lic-mt")).toHaveValue("25");
  await r.page.locator("#lic-plan").selectOption("starter");
  await expect(r.page.locator("#lic-ms")).toHaveValue("100");
  await r.page.locator("#lic-plan").selectOption("enterprise");
  await expect(r.page.getByTestId("plan-hint")).toContainText("қолмен");
  await r.page.locator("#lic-ms").fill("1500");
  await r.page.locator("#lic-mt").fill("60");
  await r.page.locator("#lic-notes").fill("Келісімшарт №42");
  await r.page.getByRole("button", { name: "Лицензияны сақтау" }).click();
  await expect(r.page.getByText("Лицензия жаңартылды.").first()).toBeVisible();
  const [l] = await q("select plan, max_students, max_teachers, notes from licenses where org_id=$1", [S.org]);
  expect(l).toEqual({ plan: "enterprise", max_students: 1500, max_teachers: 60, notes: "Келісімшарт №42" });
  await r.page.reload();
  await expect(r.page.getByTestId("licence-audit")).toContainText("ENTERPRISE");
  // форма: +1 жыл батырмасы мерзімді өзгертеді
  const before = await r.page.locator("#lic-until").inputValue();
  await r.page.getByTestId("form-plus-year").click();
  expect(await r.page.locator("#lic-until").inputValue() > before).toBe(true);
  await r.ctx.close();
});

test("SUPER ADMIN ұйымды тоқтатады және қайта қосады; жеке дерек көрінбейді", async ({ browser }) => {
  const r = await sess(browser, E("root"), /\/admin/);
  await r.page.goto("/admin");
  const card = r.page.getByTestId(`org-${SLUG}`);
  await expect(card).toContainText("ENTERPRISE");
  await expect(card).not.toContainText("Лицензия Оқушы"); // оқушылардың аты көрінбейді
  await card.getByRole("button", { name: "Тоқтату" }).click();
  await r.page.getByRole("dialog").getByRole("button", { name: "Тоқтату", exact: true }).click();
  await expect(card).toContainText("Ұйым тоқтатылған");
  expect((await q("select status from organizations where id=$1", [S.org]))[0].status).toBe("suspended");
  await card.getByRole("button", { name: "Белсендіру" }).click();
  await r.page.getByRole("dialog").getByRole("button", { name: "Белсендіру", exact: true }).click();
  await expect(card).not.toContainText("Ұйым тоқтатылған");
  expect((await q("select status from organizations where id=$1", [S.org]))[0].status).toBe("active");
  // SUPER ADMIN мектеп аймағына кіре алмайды
  await r.page.goto("/school/students");
  await expect(r.page).toHaveURL(/\/admin/);
  await r.ctx.close();
});

test("390px: лицензия және админ беттерінде көлденең айналу жоқ", async ({ browser }) => {
  await setLic("valid_until = current_date + 5"); // банер де өлшемге кіреді
  const a = await sess(browser, E("admin"), /\/school/, 390);
  for (const p of ["/school", "/school/licence", "/school/settings"]) { await a.page.goto(p); await noHScroll(a.page); }
  await a.ctx.close();
  const r = await sess(browser, E("root"), /\/admin/, 390);
  for (const p of ["/admin", `/admin/orgs/${S.org}`]) { await r.page.goto(p); await noHScroll(r.page); }
  await r.ctx.close();
});
