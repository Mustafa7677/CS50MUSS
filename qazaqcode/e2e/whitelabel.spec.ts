import { test, expect, type Browser, type Page } from "@playwright/test";
import pg from "pg";

// White-label (баптаулар, контраст, алдын ала көру, кіру беті), бренд оқшаулауы, демо банері және демо дерек құрамы.
// Демо дерек керек (scripts/seed-demo.mjs). Өз ұйымдарын (A, B) жасайды және соңында өшіреді. DATABASE_URL керек.
const PASS = "BrandPass123";
const db = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
const q = async <T = any>(sql: string, p: unknown[] = []) => (await db.query(sql, p)).rows as T[];
const run = Date.now().toString(36);
const O: Record<string, any> = { A: {}, B: {} };
const PW = "DemoPass123";

async function asUser<T>(uid: string, sql: string, params: unknown[]): Promise<T[]> {
  const c = await db.connect();
  try {
    await c.query("begin"); await c.query("set local role authenticated");
    await c.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify({ sub: uid, role: "authenticated" })]);
    const r = await c.query(sql, params); await c.query("commit"); return r.rows as T[];
  } catch (e) { await c.query("rollback").catch(() => {}); throw e; } finally { c.release(); }
}
const mkUser = async (email: string, name: string) => (await q("select auth_dev.sign_up($1,$2,$3) as id", [email, PASS, name]))[0].id as string;
const E = (n: string) => `${n}-${run}@brand.qazaqcode.kz`;
async function sess(browser: Browser, email: string, home: RegExp, pass = PASS, width?: number) {
  const ctx = await browser.newContext({ baseURL: test.info().project.use.baseURL, locale: "kk-KZ", viewport: width ? { width, height: 844 } : undefined });
  const page = await ctx.newPage();
  await page.goto("/login");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(pass);
  await page.getByRole("button", { name: "Кіру" }).click();
  await page.waitForURL(home);
  return { ctx, page };
}
const cssVar = (page: Page, v: string) => page.evaluate((n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim(), v);
const lum = (hex: string) => { const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, r) => r - p); return (x + 0.05) / (y + 0.05); };
const rgb2hex = (s: string) => "#" + (s.match(/\d+/g) ?? []).slice(0, 3).map((n) => Number(n).toString(16).padStart(2, "0")).join("");
const noHScroll = async (page: Page) => expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  const root = await mkUser(E("root"), "Бренд Платформа");
  await q("insert into platform_admins(user_id) values ($1)", [root]);
  O.root = root;
  const valid = new Date(Date.now() + 365 * 864e5).toISOString().slice(0, 10);
  for (const k of ["A", "B"]) {
    const o = O[k];
    o.slug = `brand-${k.toLowerCase()}-${run}`; o.name = `Бренд Мектеп ${k} ${run}`;
    const r = (await asUser<any>(root, "select public.create_organization($1,$2,'pro',$3) as r", [o.name, o.slug, valid]))[0].r;
    o.org = r.org_id;
    o.admin = await mkUser(E(`admin${k}`), `Бренд Әкімші ${k}`);
    await asUser(o.admin, "select public.accept_invitation($1)", [r.admin_invite_token]);
    const t = (await asUser<any>(o.admin, "select public.create_invitation($1,'teacher') as t", [o.org]))[0].t;
    o.teacher = await mkUser(E(`teacher${k}`), `Бренд Мұғалім ${k}`);
    await asUser(o.teacher, "select public.accept_invitation($1)", [t]);
    const cls = (await asUser<any>(o.teacher, "select public.create_classroom($1,'9А','2025-2026','Информатика') as id", [o.org]))[0].id;
    const code = (await q("select join_code from classrooms where id=$1", [cls]))[0].join_code;
    o.student = await mkUser(E(`student${k}`), `Бренд Оқушы ${k}`);
    await asUser(o.student, "select public.join_classroom($1)", [code]);
  }
  await asUser(O.A.admin, "select public.update_org_settings($1,null,'#b91c1c','#0f766e','А мектебіне қош келдіңіз','a@a.kz',null)", [O.A.org]);
  await asUser(O.B.admin, "select public.update_org_settings($1,null,'#1d4ed8','#b45309','В мектебіне қош келдіңіз','b@b.kz',null)", [O.B.org]);
});
test.afterAll(async () => {
  for (const k of ["A", "B"]) await q("delete from organizations where id=$1", [O[k].org]);
  await q("delete from auth.users where email like $1", [`%-${run}@brand.qazaqcode.kz`]);
  await q("delete from platform_admins where user_id=$1", [O.root]);
  await db.end();
});

test("контрастсыз түс: ескерту, автотүзету (AA), сақтау", async ({ browser }) => {
  const { ctx, page } = await sess(browser, E("adminA"), /\/school/);
  await page.goto("/school/settings");
  await page.locator("#primary_color").fill("#7a7a7a");
  const warn = page.getByTestId("contrast-warning");
  await expect(warn).toBeVisible();
  await expect(warn).toContainText("4.5:1");
  await page.getByTestId("autofix-primary").click();
  await expect(warn).toHaveCount(0);
  await expect(page.getByTestId("contrast-ok")).toBeVisible();
  const fixed = await page.locator("#primary_color").inputValue();
  expect(fixed).toMatch(/^#[0-9a-f]{6}$/);
  expect(fixed).not.toBe("#7a7a7a");
  const ink = lum(fixed) > 0.4 ? "#0f172a" : "#ffffff";
  expect(ratio(fixed, ink)).toBeGreaterThanOrEqual(4.5);
  // қосымша түс: ашық сары + қара мәтін жақсы, ортаңғы сұр - ескерту
  await page.locator("#secondary_color").fill("#777777");
  await expect(page.getByTestId("contrast-warning-secondary")).toBeVisible();
  await page.getByTestId("autofix-secondary").click();
  await expect(page.getByTestId("contrast-warning-secondary")).toHaveCount(0);
  await page.getByRole("button", { name: "Сақтау" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Баптаулар сақталды" }).first()).toBeVisible();
  expect((await q("select primary_color from organization_settings where org_id=$1", [O.A.org]))[0].primary_color).toBe(fixed);
  await asUser(O.A.admin, "select public.update_org_settings($1,null,'#b91c1c','#0f766e','А мектебіне қош келдіңіз','a@a.kz',null)", [O.A.org]);
  await ctx.close();
});

test("алдын ала көру: тікелей жаңарады, қараңғы режимде мәтін оқылады, логотип тек https", async ({ browser }) => {
  const { ctx, page } = await sess(browser, E("adminA"), /\/school/);
  await page.goto("/school/settings");
  await page.locator("#welcome_text").fill("Сәлем, жаңа оқу жылы!");
  await page.locator("#contact_email").fill("info@mektep.kz");
  const login = page.getByTestId("preview-login");
  await expect(login).toContainText("Сәлем, жаңа оқу жылы!");
  await expect(login).toContainText("info@mektep.kz");
  await expect(page.getByTestId("preview-sidebar")).toContainText(O.A.name);
  for (const mode of ["light", "dark"] as const) {
    await page.getByTestId(`preview-${mode}`).click();
    await expect(page.getByTestId("brand-preview")).toHaveAttribute("data-mode", mode);
    const colors = await page.getByTestId("preview-sidebar").evaluate((el) => {
      const bg = getComputedStyle(el).backgroundColor, fg = getComputedStyle(el).color, a = getComputedStyle(el.querySelector("a")!).color;
      return { bg, fg, a };
    });
    expect(ratio(rgb2hex(colors.bg), rgb2hex(colors.fg)), `${mode}: мәтін`).toBeGreaterThanOrEqual(4.5);
    expect(ratio(rgb2hex(colors.bg), rgb2hex(colors.a)), `${mode}: сілтеме`).toBeGreaterThanOrEqual(4.5);
  }
  // логотип: http қабылданбайды, https қателік көрсетпейді
  await page.locator("#logo_url").fill("http://example.com/x.png");
  await expect(page.getByTestId("logo-error")).toBeVisible();
  await page.getByRole("button", { name: "Сақтау" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "https" }).first()).toBeVisible();
  await page.locator("#logo_url").fill("https://example.com/logo.png");
  await expect(page.getByTestId("logo-error")).toHaveCount(0);
  await page.locator("#logo_url").fill("javascript:alert(1)");
  await expect(page.getByTestId("logo-error")).toBeVisible();
  await ctx.close();
});

test("қараңғы режимде түс мәтін ретінде бейімделеді (--brand-link оқылады)", async ({ browser }) => {
  await asUser(O.A.admin, "select public.update_org_settings($1,null,'#1e3a8a','#0f766e',null,null,null)", [O.A.org]); // қою көк: қараңғы фонда нашар
  const { ctx, page } = await sess(browser, E("adminA"), /\/school/);
  const surfaceLight = await page.evaluate(() => getComputedStyle(document.body).getPropertyValue("--surface").trim());
  const linkLight = await cssVar(page, "--brand-link");
  expect(ratio(surfaceLight, linkLight)).toBeGreaterThanOrEqual(4.5);
  await page.evaluate(() => document.documentElement.classList.add("dark"));
  const surfaceDark = await cssVar(page, "--surface");
  const linkDark = await cssVar(page, "--brand-link");
  expect(linkDark).toMatch(/^#[0-9a-f]{6}$/);
  expect(ratio(surfaceDark, linkDark)).toBeGreaterThanOrEqual(4.5);
  await ctx.close();
  await asUser(O.A.admin, "select public.update_org_settings($1,null,'#b91c1c','#0f766e','А мектебіне қош келдіңіз','a@a.kz',null)", [O.A.org]);
});

test("кіру беті ?org=slug: сол мектептің брендингі; басқа мектеп/әдепкі араласпайды", async ({ browser }) => {
  const ctx = await browser.newContext({ baseURL: test.info().project.use.baseURL, locale: "kk-KZ" });
  const page = await ctx.newPage();
  await page.goto(`/login?org=${O.A.slug}`);
  await expect(page.getByText(O.A.name)).toBeVisible();
  await expect(page.getByText("А мектебіне қош келдіңіз")).toBeVisible();
  expect(await cssVar(page, "--brand")).toBe("#b91c1c");
  await page.goto(`/login?org=${O.B.slug}`);
  await expect(page.getByText("В мектебіне қош келдіңіз")).toBeVisible();
  await expect(page.getByText("А мектебіне қош келдіңіз")).toHaveCount(0);
  await expect(page.getByText(O.A.name)).toHaveCount(0);
  expect(await cssVar(page, "--brand")).toBe("#1d4ed8");
  expect(await page.content()).not.toContain("#b91c1c");
  // slug жоқ не бөтен: әдепкі бренд
  for (const url of ["/login", "/login?org=joq-mektep-xyz", "/login?org=%27%3E%3Cscript%3E"]) {
    await page.goto(url);
    await expect(page.getByText("QazaqCode").first()).toBeVisible();
    expect(await cssVar(page, "--brand")).toBe("#0e7490");
  }
  // тоқтатылған ұйымның жария брендингі жоқ
  await q("update organizations set status='suspended' where id=$1", [O.B.org]);
  await page.goto(`/login?org=${O.B.slug}`);
  await expect(page.getByText("В мектебіне қош келдіңіз")).toHaveCount(0);
  await q("update organizations set status='active' where id=$1", [O.B.org]);
  await ctx.close();
});

test("бренд оқшаулауы: панельде әр ұйым өз түсін көреді, A өзгерісі B-ға әсер етпейді", async ({ browser }) => {
  const a = await sess(browser, E("teacherA"), /\/teacher/);
  const b = await sess(browser, E("teacherB"), /\/teacher/);
  expect(await cssVar(a.page, "--brand")).toBe("#b91c1c");
  expect(await cssVar(b.page, "--brand")).toBe("#1d4ed8");
  // A әкімшісі түсті өзгертеді
  const adm = await sess(browser, E("adminA"), /\/school/);
  await adm.page.goto("/school/settings");
  await adm.page.locator("#primary_color").fill("#15803d");
  await adm.page.getByRole("button", { name: "Сақтау" }).click();
  await expect(adm.page.getByRole("status").filter({ hasText: "Баптаулар сақталды" }).first()).toBeVisible();
  await a.page.reload(); await b.page.reload();
  expect(await cssVar(a.page, "--brand")).toBe("#15803d");
  expect(await cssVar(b.page, "--brand")).toBe("#1d4ed8");
  expect((await q("select primary_color from organization_settings where org_id=$1", [O.B.org]))[0].primary_color).toBe("#1d4ed8");
  expect(await b.page.content()).not.toContain("А мектебіне");
  // B әкімшісі A баптауына серверге жалған org жібере алмайды: форма org-ды сессиядан алады
  const forged = await asUser<any>(O.B.admin, "select public.update_org_settings($1,null,'#000000','#ffffff',null,null,null)", [O.A.org]).then(() => "ok", (e) => e.message);
  expect(forged).toBe("forbidden");
  // /school/settings басқа рөлге жабық
  await a.page.goto("/school/settings");
  await expect(a.page).toHaveURL(/\/teacher/);
  for (const s of [a, b, adm]) await s.ctx.close();
});

test("демо банері: тек демо ұйымда, барлық рөлде", async ({ browser }) => {
  for (const [email, home] of [["admin@demo.qazaqcode.kz", /\/school/], ["teacher1@demo.qazaqcode.kz", /\/teacher/], ["student1@demo.qazaqcode.kz", /\/student/]] as const) {
    const s = await sess(browser, email, home, PW);
    await expect(s.page.getByTestId("demo-banner")).toContainText("ДЕМО ДЕРЕК");
    await s.ctx.close();
  }
  for (const [email, home] of [[E("adminA"), /\/school/], [E("teacherA"), /\/teacher/], [E("studentA"), /\/student/], [E("adminB"), /\/school/]] as const) {
    const s = await sess(browser, email, home);
    await expect(s.page.getByTestId("demo-banner")).toHaveCount(0);
    await expect(s.page.getByText("ДЕМО ДЕРЕК")).toHaveCount(0);
    await s.ctx.close();
  }
});

test("демо дерек құрамы: 20 оқушы, 2 мұғалім, 2 сынып, 3 курс, 10 тапсырма, әртүрлі нәтиже", async () => {
  const [org] = await q("select id, is_demo from organizations where slug='demo-mektep'");
  expect(org.is_demo).toBe(true);
  const [n] = await q(`select
    (select count(*)::int from organization_members where org_id=$1 and role='student' and status='active') students,
    (select count(*)::int from organization_members where org_id=$1 and role='teacher' and status='active') teachers,
    (select count(*)::int from classrooms where org_id=$1 and status='active') classes,
    (select count(*)::int from courses where org_id=$1 and status='published') courses,
    (select count(*)::int from assignments where org_id=$1 and status='published') assignments,
    (select count(distinct kind)::int from assignments where org_id=$1) kinds,
    (select count(*)::int from assignments where org_id=$1 and deadline < now()) overdue,
    (select count(*)::int from assignments where org_id=$1 and deadline > now()) upcoming,
    (select count(*)::int from notifications where org_id=$1) notes`, [org.id]);
  // басқа тесттер демо ұйымға қосымша сынып/тапсырма қоса алады: сид мөлшерінен кем болмауы тексеріледі
  expect(n.students).toBeGreaterThanOrEqual(20); expect(n.teachers).toBeGreaterThanOrEqual(2); expect(n.classes).toBeGreaterThanOrEqual(2);
  expect(n.courses).toBeGreaterThanOrEqual(3); expect(n.assignments).toBeGreaterThanOrEqual(10);
  expect((await q("select count(*)::int n from classrooms where org_id=$1 and name in ('9А','10Ә')", [org.id]))[0].n).toBeGreaterThanOrEqual(2);
  expect(n.kinds).toBeGreaterThanOrEqual(5); expect(n.overdue).toBeGreaterThanOrEqual(1); expect(n.upcoming).toBeGreaterThanOrEqual(1);
  expect(n.notes).toBeGreaterThan(20);
  const courses = await q(`select c.title, (select count(*)::int from course_modules m where m.course_id=c.id) mods,
    (select count(*)::int from lessons l where l.course_id=c.id) lessons from courses c where c.org_id=$1 and c.title in ('Python негіздері','SQL бастамасы','Веб негіздері')`, [org.id]);
  expect(courses).toHaveLength(3);
  for (const c of courses) { expect(c.mods, c.title).toBe(2); expect(c.lessons, c.title).toBeGreaterThanOrEqual(4); }
  // шынайы таралу: кейбір оқушы мүлде жібермеген, кейбіреуі көп жіберген
  const per = await q(`select m.user_id, count(s.id) filter (where s.status <> 'draft')::int n from organization_members m
    left join submissions s on s.student_id = m.user_id and s.org_id = m.org_id where m.org_id=$1 and m.role='student' group by 1`, [org.id]);
  expect(per.filter((r) => r.n === 0).length).toBeGreaterThanOrEqual(3);
  expect(Math.max(...per.map((r) => r.n))).toBeGreaterThanOrEqual(4);
  const [g] = await q("select count(distinct score)::int d from grades where org_id=$1", [org.id]);
  expect(g.d).toBeGreaterThanOrEqual(5);
});

test("390px: баптаулар беті мобильде көлденең айналмайды", async ({ browser }) => {
  const s = await sess(browser, E("adminA"), /\/school/, PASS, 390);
  await s.page.goto("/school/settings");
  await s.page.locator("#welcome_text").fill("Өте-өте-ұзын-сөз-".repeat(10));
  await noHScroll(s.page);
  await s.page.locator("#logo_url").fill("https://example.com/" + "a".repeat(120) + ".png");
  await noHScroll(s.page);
  await s.ctx.close();
});
