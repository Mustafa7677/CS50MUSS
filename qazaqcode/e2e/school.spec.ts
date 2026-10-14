import { test, expect, type Browser, type Page } from "@playwright/test";
import pg from "pg";

// Мектеп әкімшісі аймағы. Демо дерек қажет (scripts/seed-demo.mjs). SQL салыстыру үшін DATABASE_URL (superuser) керек.
// Іске қосу: DATABASE_URL=... E2E_BASE_URL=http://127.0.0.1:3191 npx playwright test e2e/school.spec.ts
const DB = process.env.DATABASE_URL!;
const PASS = "DemoPass123";
const stamp = Date.now();
const newEmail = `new.teacher.${stamp}@school.test`;
const limitEmail = `limit.teacher.${stamp}@school.test`;
let db: pg.Pool;
const sql = async <T = any>(s: string, p: unknown[] = []) => (await db.query(s, p)).rows as T[];

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(PASS);
  await page.getByRole("button", { name: "Кіру" }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"));
}
async function freshPage(browser: Browser) {
  const ctx = await browser.newContext({ baseURL: test.info().project.use.baseURL, locale: "kk-KZ" });
  return { ctx, page: await ctx.newPage() };
}

test.describe.serial("мектеп әкімшісі", () => {
  let org: string;
  let origLimits: { max_students: number; max_teachers: number };
  let origColors: { primary_color: string; secondary_color: string };

  test.beforeAll(async () => {
    db = new pg.Pool({ connectionString: DB, max: 2 });
    org = (await sql("select id from organizations where slug = 'demo-mektep'"))[0].id;
    await sql("delete from auth.users where email like '%@school.test'"); // алдыңғы жүгіртулердің қалдығы
    await sql("delete from invitations where org_id = $1 and email like '%@school.test'", [org]);
    origLimits = (await sql("select max_students, max_teachers from licenses where org_id = $1", [org]))[0];
    origColors = (await sql("select primary_color, secondary_color from organization_settings where org_id = $1", [org]))[0];
  });
  test.afterAll(async () => {
    await sql("update licenses set max_students = $2, max_teachers = $3 where org_id = $1", [org, origLimits.max_students, origLimits.max_teachers]);
    await sql("update organization_settings set primary_color = $2, secondary_color = $3 where org_id = $1", [org, origColors.primary_color, origColors.secondary_color]);
    await db.end();
  });

  test("панельдегі сандар дерекқормен сәйкес", async ({ page }) => {
    await login(page, "admin@demo.qazaqcode.kz");
    await page.waitForURL("**/school");
    await expect(page.getByRole("heading", { name: "Мектеп панелі" })).toBeVisible();
    const e = (await sql(`select
      (select count(*)::int from organization_members where org_id=$1 and role='student' and status='active') students,
      (select count(distinct student_id)::int from submissions where org_id=$1 and updated_at > now() - interval '30 days') active30,
      (select count(*)::int from organization_members where org_id=$1 and role='teacher' and status='active') teachers,
      (select count(*)::int from classrooms where org_id=$1 and status='active') classes,
      (select count(*)::int from assignments where org_id=$1 and status='published') published,
      (select count(*)::int from submissions where org_id=$1 and status in ('submitted','under_review')) pending,
      (select count(*)::int from assignment_targets t join assignments a on a.id=t.assignment_id and a.status='published'
         join classroom_students cs on cs.classroom_id=t.classroom_id and cs.status='active' where a.org_id=$1) expected,
      (select count(*)::int from (select distinct assignment_id, student_id from submissions where org_id=$1 and status<>'draft') z) completed,
      (select round(avg(m.p),1)::float from (select max(score/max_score*100) p from grades where org_id=$1 group by assignment_id, student_id) m) avg`, [org]))[0];
    expect(e.students).toBeGreaterThan(0);
    await expect(page.getByTestId("stat-students")).toHaveText(String(e.students));
    await expect(page.getByTestId("stat-active")).toHaveText(String(e.active30));
    await expect(page.getByTestId("stat-teachers")).toHaveText(String(e.teachers));
    await expect(page.getByTestId("stat-classes")).toHaveText(String(e.classes));
    await expect(page.getByTestId("stat-assignments")).toHaveText(String(e.published));
    await expect(page.getByTestId("stat-pending")).toHaveText(String(e.pending));
    await expect(page.getByTestId("stat-completion")).toHaveText(`${Math.min(100, Math.round((e.completed / e.expected) * 100))}%`);
    await expect(page.getByTestId("stat-avg")).toHaveText(`${Math.round(e.avg)}%`);
    await expect(page.getByTestId("lic-students")).toHaveText(`${e.students} / ${origLimits.max_students}`);
    await expect(page.getByTestId("lic-teachers")).toHaveText(`${e.teachers} / ${origLimits.max_teachers}`);
    await expect(page.locator(".recharts-wrapper")).toBeVisible();
    await expect(page.getByRole("table").first()).toContainText("9А");
  });

  test("мұғалімді шақыру, тіркелу, тізімде көру", async ({ page, browser }) => {
    await login(page, "admin@demo.qazaqcode.kz");
    await page.goto("/school/teachers");
    await page.locator("#inv-email").fill(newEmail);
    await page.getByRole("button", { name: "Шақыру сілтемесін жасау" }).click();
    const link = await page.getByTestId("invite-link").inputValue();
    expect(link).toMatch(/\/invite\/[0-9a-f]{48}$/);
    await expect(page.getByTestId("active-invites")).toContainText(newEmail);
    // бет жаңартылса токен қайта көрсетілмейді
    await page.reload();
    await expect(page.getByTestId("invite-link")).toHaveCount(0);

    const t = await freshPage(browser);
    await t.page.goto(link);
    await t.page.locator("#name").fill("Жаңа Мұғалім Тест");
    await expect(t.page.locator("#email")).toHaveValue(newEmail);
    await t.page.locator("#password").fill(PASS);
    await t.page.getByRole("button", { name: "Тіркелу және қабылдау" }).click();
    await t.page.waitForURL("**/teacher");
    await t.ctx.close();

    await page.goto("/school/teachers");
    const row = page.getByTestId("teachers-table").locator("tr", { hasText: "Жаңа Мұғалім Тест" });
    await expect(row).toBeVisible();
    await expect(row).toContainText("Белсенді");
    await expect(page.getByTestId("active-invites")).toHaveCount(0);
  });

  test("лимит толғанда мұғалім қабылданбайды; шақырудан бас тарту", async ({ page, browser }) => {
    await sql("update licenses set max_teachers = 2 where org_id = $1", [org]);
    await login(page, "admin@demo.qazaqcode.kz");
    await page.goto("/school/teachers");
    await expect(page.getByTestId("limit-warning")).toBeVisible();
    await page.locator("#inv-email").fill(limitEmail);
    await page.getByRole("button", { name: "Шақыру сілтемесін жасау" }).click();
    const link = await page.getByTestId("invite-link").inputValue();
    const t = await freshPage(browser);
    await t.page.goto(link);
    await t.page.locator("#name").fill("Лимит Тест");
    await t.page.locator("#password").fill(PASS);
    await t.page.getByRole("button", { name: "Тіркелу және қабылдау" }).click();
    // аккаунт жасалады, бірақ ұйымға мүше болмайды: шақыруды қабылдау лимитпен қайтарылады
    await t.page.getByRole("button", { name: "Шақыруды қабылдау" }).click();
    await expect(t.page.getByText("мұғалім лимиті толған")).toBeVisible();
    expect(await sql("select 1 from organization_members m join auth.users u on u.id = m.user_id where m.org_id = $1 and u.email = $2", [org, limitEmail])).toHaveLength(0);
    await t.ctx.close();
    // бас тарту
    await page.goto("/school/teachers");
    const inv = page.getByTestId("active-invites").locator("tr", { hasText: limitEmail });
    await inv.getByRole("button", { name: "Бас тарту" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Иә, бас тарту" }).click();
    await expect(page.getByText("Шақырудан бас тартылды.")).toBeVisible();
    await expect(page.getByTestId("active-invites")).toHaveCount(0);
    const t2 = await freshPage(browser);
    await t2.page.goto(link);
    await expect(t2.page.getByRole("heading", { name: "Шақыру жарамсыз" })).toBeVisible();
    await t2.ctx.close();
    await sql("update licenses set max_teachers = $2 where org_id = $1", [org, origLimits.max_teachers]);
  });

  test("мұғалімді өшіру және қайта белсендіру", async ({ page, browser }) => {
    await login(page, "admin@demo.qazaqcode.kz");
    await page.goto("/school/teachers");
    const row = () => page.getByTestId("teachers-table").locator("tr", { hasText: "Жаңа Мұғалім Тест" });
    await row().getByRole("button", { name: "Өшіру" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Иә, өшіру" }).click();
    await expect(page.getByText("Мұғалім өшірілді.")).toBeVisible();
    await expect(page.getByTestId("teachers-table")).toContainText("Өшірілген");
    const st = await sql("select status from organization_members where org_id=$1 and user_id=(select id from auth.users where email=$2)", [org, newEmail]);
    expect(st[0].status).toBe("removed");
    // өшірілген мұғалім /teacher-ге кіре алмайды
    const t = await freshPage(browser);
    await login(t.page, newEmail);
    await t.page.goto("/teacher");
    await expect(t.page).not.toHaveURL(/\/teacher$/);
    await t.ctx.close();
    // қайта белсендіру
    const removedRow = page.getByTestId("teachers-table").locator("tr", { hasText: "Өшірілген" }).filter({ hasText: "Қайта белсендіру" });
    await removedRow.getByRole("button", { name: "Қайта белсендіру" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Иә, белсендіру" }).click();
    await expect(page.getByText("Мұғалім қайта белсендірілді.")).toBeVisible();
  });

  test("сыныптар және сынып статистикасы + CSV", async ({ page }) => {
    await login(page, "admin@demo.qazaqcode.kz");
    await page.goto("/school/classes");
    const n = (await sql("select count(*)::int n from classrooms where org_id=$1", [org]))[0].n;
    await expect(page.getByTestId("classes-table").locator("tbody tr")).toHaveCount(n);
    const t1 = (await sql("select teacher_id from classrooms where org_id=$1 and name='9А'", [org]))[0].teacher_id;
    await page.locator("#teacher").selectOption(t1);
    await page.getByRole("button", { name: "Сүзу" }).click();
    await expect(page.getByTestId("classes-table").locator("tbody tr")).toHaveCount((await sql("select count(*)::int n from classrooms where teacher_id=$1", [t1]))[0].n);
    await page.getByRole("link", { name: "9А" }).first().click();
    await expect(page.getByRole("heading", { name: "Сынып 9А" })).toBeVisible();
    const stu = (await sql("select count(*)::int n from classroom_students cs join classrooms c on c.id=cs.classroom_id where c.name='9А' and c.org_id=$1 and cs.status='active'", [org]))[0].n;
    await expect(page.getByTestId("students-table").locator("tbody tr")).toHaveCount(stu);
    await expect(page.getByTestId("grade-dist")).toBeVisible();
    const href = await page.getByRole("link", { name: "CSV жүктеу" }).getAttribute("href");
    const res = await page.request.get(href!);
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("text/csv");
    const buf = await res.body();
    expect([buf[0], buf[1], buf[2]]).toEqual([0xef, 0xbb, 0xbf]);
    expect(buf.toString("utf8").split("\r\n").filter(Boolean)).toHaveLength(stu + 1);
  });

  test("мектеп есебі CSV", async ({ page }) => {
    await login(page, "admin@demo.qazaqcode.kz");
    await page.goto("/school/export");
    await expect(page.getByText("Excel және PDF экспорты 2-кезеңде")).toBeVisible();
    const res = await page.request.get("/school/export/csv");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("text/csv");
    const text = (await res.body()).toString("utf8");
    expect(text.charCodeAt(0)).toBe(0xfeff);
    const lines = text.split("\r\n").filter(Boolean);
    expect(lines[0]).toContain("Сынып,Оқушы,Тапсырма,Күйі,Балл");
    const exp = (await sql(`select count(*)::int n from assignment_targets t join assignments a on a.id=t.assignment_id and a.status='published'
      join classroom_students cs on cs.classroom_id=t.classroom_id and cs.status='active' where a.org_id=$1`, [org]))[0].n;
    expect(lines.length - 1).toBe(exp);
  });

  test("баптаулар: түсті өзгерту панельге бірден әсер етеді", async ({ page }) => {
    await login(page, "admin@demo.qazaqcode.kz");
    await page.goto("/school/settings");
    const brand = () => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--brand").trim());
    expect(await brand()).toBe(origColors.primary_color);
    // контраст ескертуі: ашық сары түс
    await page.locator("#primary_color").fill("#7a7a7a");
    await expect(page.getByTestId("contrast-warning")).toBeVisible();
    await page.locator("#primary_color").fill("#b91c1c");
    await expect(page.getByTestId("contrast-warning")).toHaveCount(0);
    await page.locator("#welcome_text").fill("Қош келдіңіз, тест!");
    await expect(page.getByTestId("brand-preview")).toContainText("Қош келдіңіз, тест!");
    await page.getByRole("button", { name: "Сақтау" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Баптаулар сақталды" }).first()).toBeVisible();
    await page.goto("/school");
    expect(await brand()).toBe("#b91c1c");
    const db1 = (await sql("select primary_color, welcome_text from organization_settings where org_id=$1", [org]))[0];
    expect(db1).toEqual({ primary_color: "#b91c1c", welcome_text: "Қош келдіңіз, тест!" });
    // кіру беті
    await page.goto("/school/settings");
    await expect(page.getByTestId("login-url")).toContainText("/login?org=demo-mektep");
    // http логотип қабылданбайды
    await page.locator("#logo_url").fill("http://example.com/x.png");
    await page.getByRole("button", { name: "Сақтау" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "https" }).first()).toBeVisible();
    await sql("update organization_settings set welcome_text = null where org_id = $1", [org]);
  });

  test("мұғалім мен оқушы /school-ға кіре алмайды", async ({ browser }) => {
    for (const [email, home] of [["teacher1@demo.qazaqcode.kz", "/teacher"], ["student1@demo.qazaqcode.kz", "/student"]] as const) {
      const t = await freshPage(browser);
      await login(t.page, email);
      await t.page.waitForURL("**" + home);
      for (const path of ["/school", "/school/teachers", "/school/classes", "/school/settings", "/school/export"]) {
        await t.page.goto(path);
        await expect(t.page).toHaveURL(new RegExp(home + "$"));
      }
      for (const path of ["/school/export/csv", "/school/classes/00000000-0000-0000-0000-000000000000/export"]) {
        expect((await t.page.request.get(path)).status()).toBe(403);
      }
      await t.ctx.close();
    }
    const anon = await browser.newContext({ baseURL: test.info().project.use.baseURL });
    expect((await anon.request.get("/school/export/csv")).status()).toBe(401);
    await anon.close();
  });
});
