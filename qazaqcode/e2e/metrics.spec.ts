import { test, expect, type Browser, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import ExcelJS from "exceljs";
import pg from "pg";

// Метрика (0013): /admin/metrics, /school/health, пилот есебі (PDF/XLSX), белсенділік журналы. Демо дерек (scripts/seed-demo.mjs) және DATABASE_URL керек.
// Іске қосу: DATABASE_URL=... E2E_BASE_URL=http://127.0.0.1:3211 npx playwright test e2e/metrics.spec.ts --output=/tmp/claude-0/pwA
const PASS = "DemoPass123";
const ROOT = "root@demo.qazaqcode.kz", ADMIN = "admin@demo.qazaqcode.kz", T1 = "teacher1@demo.qazaqcode.kz", S1 = "student1@demo.qazaqcode.kz";
const XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const STAMP = Date.now();
const db = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 3 });
const q = async <T = any>(sql: string, p: unknown[] = []) => (await db.query(sql, p)).rows as T[];
const hasPdftotext = (() => { try { execFileSync("pdftotext", ["-v"], { stdio: "ignore" }); return true; } catch { return false; } })();

async function asUser<T = any>(uid: string, s: string, p: unknown[] = []): Promise<T[]> {
  const c = await db.connect();
  try {
    await c.query("begin"); await c.query("set local role authenticated");
    await c.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify({ sub: uid, role: "authenticated" })]);
    const r = await c.query(s, p); await c.query("commit"); return r.rows;
  } catch (e) { await c.query("rollback").catch(() => {}); throw e; } finally { c.release(); }
}
async function login(page: Page, email: string, password = PASS) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Құпиясөз").fill(password);
  await page.getByRole("button", { name: "Кіру" }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"));
}
async function session(browser: Browser, email: string, viewport?: { width: number; height: number }, password = PASS) {
  const ctx = await browser.newContext({ locale: "kk-KZ", viewport });
  const page = await ctx.newPage();
  await login(page, email, password);
  return { ctx, page };
}
const pdfText = (buf: Buffer) => {
  const f = path.join(mkdtempSync(path.join(tmpdir(), "qm-")), "r.pdf");
  writeFileSync(f, buf);
  return execFileSync("pdftotext", ["-layout", f, "-"], { encoding: "utf8" });
};
const noHScroll = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);

let demoOrg = "";
let other = { org: "", admin: "", email: "" };
const OTHER_NAME = `=QM Мектеп ${STAMP}`;      // формула белгісімен басталатын ұйым аты: CSV/XLSX қорғанысын тексереді

test.beforeAll(async () => {
  demoOrg = (await q("select id from organizations where slug = 'demo-mektep'"))[0].id;
  const root = (await q("select id from auth.users where email = $1", [ROOT]))[0].id;
  const o = (await asUser(root, "select public.create_organization($1, $2, 'starter', (now() + interval '200 days')::date) as r", [OTHER_NAME, `qm-${STAMP}`]))[0].r;
  other.org = o.org_id;
  other.email = `qm-admin-${STAMP}@metrics.test`;
  other.admin = (await q("select auth_dev.sign_up($1, $2, $3) as id", [other.email, PASS, "Басқа Әкімші"]))[0].id;
  await asUser(other.admin, "select public.accept_invitation($1)", [o.admin_invite_token]);
});
test.afterAll(async () => {
  await q("delete from organizations where slug like 'qm-%'").catch(() => {});
  await q("delete from auth.users where email like '%@metrics.test'").catch(() => {});
  await db.end();
});

test.describe("/admin/metrics (SUPER ADMIN)", () => {
  test("бет ашылады: ДЕМО-сыз әдепкі көрініс, ДЕМО қосқанда графиктер, воронка, retention, денсаулық тізімі", async ({ browser }) => {
    const { ctx, page } = await session(browser, ROOT);
    await page.goto("/admin/metrics");
    await expect(page.getByRole("heading", { name: "Метрика", level: 1 })).toBeVisible();
    await expect(page.getByTestId("health-list")).toBeVisible();     // біздің тест ұйымы (ДЕМО емес) тізімде
    await expect(page.getByTestId("health-list")).toContainText("QM Мектеп");
    await expect(page.getByTestId("health-list")).not.toContainText("ДЕМО: №1");
    await expect(page.getByText("ДЕМО деректер қосылған")).toHaveCount(0);

    await page.goto("/admin/metrics?demo=1&days=30");
    await expect(page.getByText("ДЕМО деректер қосылған")).toBeVisible();
    await expect(page.getByTestId("chart-active-users")).toBeVisible();
    await expect(page.getByTestId("funnel")).toBeVisible();
    for (const k of ["leads", "org", "class", "assignment", "submission", "streak4"]) await expect(page.getByTestId(`funnel-${k}`)).toBeVisible();
    await expect(page.getByTestId("retention-table").first()).toBeVisible();
    await expect(page.getByTestId("health-list")).toContainText("ДЕМО");
    await expect(page.getByTestId("health-list")).toContainText("ДЕМО: №1");
    // графиктің қолжетімді сипаттамасы бар
    await expect(page.locator('[data-testid="chart-active-users"] svg')).toHaveAttribute("role", "img");
    await ctx.close();
  });

  test("ДЕМО-сыз және ұйымсыз күйі: EmptyState «Деректер жоқ: пилот басталмаған» (бос дерекқорда)", async ({ browser }) => {
    // бос күйді детерминді тексеру үшін ұйымдарды уақытша ДЕМО деп белгілеп, лидтерді санаймыз; лид бар болса бұл тест өткізіледі
    const leads = Number((await q("select count(*) n from public.leads"))[0].n);
    test.skip(leads > 0, "лидтер бар: бос күй тексерілмейді");
    await q("update organizations set is_demo = true where id = $1", [other.org]);
    const { ctx, page } = await session(browser, ROOT);
    try {
      await page.goto("/admin/metrics");
      await expect(page.getByText("Деректер жоқ: пилот басталмаған").first()).toBeVisible();
    } finally {
      await q("update organizations set is_demo = false where id = $1", [other.org]);
      await ctx.close();
    }
  });

  test("CSV: MIME, тақырып, формула қорғанысы (= белгісімен басталатын ұйым аты '-пен), жеке дерек жоқ", async ({ browser }) => {
    const { ctx } = await session(browser, ROOT);
    const h = await ctx.request.get("/admin/metrics/export?t=health");
    expect(h.status()).toBe(200);
    expect(h.headers()["content-type"]).toContain("text/csv");
    expect(h.headers()["content-disposition"]).toContain("attachment");
    const t = await h.text();
    expect(t).toContain("'=QM Мектеп");
    expect(t).not.toMatch(/(^|,|\n)=QM/);
    const d = await ctx.request.get("/admin/metrics/export?t=daily&demo=1&days=7");
    expect(d.status()).toBe(200);
    const dt = await d.text();
    expect(dt.split("\r\n")[0]).toContain("DAU");
    expect(dt).not.toContain("@demo.qazaqcode.kz");
    expect(dt).not.toContain("Аружан");
    for (const x of ["funnel", "retention_orgs", "retention_students"]) expect((await ctx.request.get(`/admin/metrics/export?t=${x}&demo=1`)).status()).toBe(200);
    expect((await ctx.request.get("/admin/metrics/export?t=nope")).status()).toBe(400);
    await ctx.close();
  });

  test("390px: бетте көлденең айналдыру жоқ", async ({ browser }) => {
    const { ctx, page } = await session(browser, ROOT, { width: 390, height: 844 });
    await page.goto("/admin/metrics?demo=1");
    await expect(page.getByTestId("funnel")).toBeVisible();
    expect(await noHScroll(page)).toBe(true);
    await ctx.close();
  });
});

test.describe("рұқсаттар", () => {
  for (const [who, email] of [["мұғалім", T1], ["оқушы", S1], ["мектеп әкімшісі", ADMIN]] as const) {
    test(`${who} /admin/metrics-ке, CSV-ге және бөтен ұйымның пилот есебіне кіре алмайды`, async ({ browser }) => {
      const { ctx, page } = await session(browser, email);
      await page.goto("/admin/metrics");
      await expect(page.getByRole("heading", { name: "Метрика", level: 1 })).toHaveCount(0);
      expect(new URL(page.url()).pathname).not.toBe("/admin/metrics");
      expect((await ctx.request.get("/admin/metrics/export?t=daily")).status()).toBe(403);
      const rep = await ctx.request.get(`/api/reports/pilot/${other.org}?format=pdf`);
      expect(rep.status()).toBe(403);
      if (who !== "мектеп әкімшісі") expect((await ctx.request.get(`/api/reports/pilot/${demoOrg}?format=pdf`)).status()).toBe(403);
      await ctx.close();
    });
  }
  test("мектеп әкімшісі /school/health бетінде басқа ұйымды көрмейді; оқушы/мұғалім /school/health-ке кіре алмайды", async ({ browser }) => {
    for (const email of [T1, S1]) {
      const { ctx, page } = await session(browser, email);
      await page.goto("/school/health");
      await expect(page.getByRole("heading", { name: "Мектеп денсаулығы" })).toHaveCount(0);
      await ctx.close();
    }
  });
  test("тіркелмеген қолданушы: пилот есебі 401, жарамсыз id 404/403", async ({ playwright, browser }) => {
    const anon = await playwright.request.newContext({ baseURL: test.info().project.use.baseURL as string });
    expect((await anon.get(`/api/reports/pilot/${demoOrg}`)).status()).toBe(401);
    expect((await anon.get("/admin/metrics/export?t=daily")).status()).toBe(401);
    await anon.dispose();
    const { ctx } = await session(browser, ROOT);
    expect((await ctx.request.get("/api/reports/pilot/not-a-uuid")).status()).toBe(404);
    expect((await ctx.request.get("/api/reports/pilot/00000000-0000-0000-0000-000000000000")).status()).toBe(404);
    expect((await ctx.request.get(`/api/reports/pilot/${demoOrg}?format=docx`)).status()).toBe(400);
    expect((await ctx.request.get(`/api/reports/pilot/${demoOrg}?from=2020-01-01&to=2026-01-01`)).status()).toBe(400);
    await ctx.close();
  });
});

test.describe("/school/health және пилот есебі", () => {
  test("мектеп әкімшісі өз көрсеткіштерін көреді; ұпай, құрамдас бөліктер, график, ДЕМО белгісі", async ({ browser }) => {
    const { ctx, page } = await session(browser, ADMIN);
    await page.goto("/school/health");
    await expect(page.getByRole("heading", { name: "Мектеп денсаулығы" })).toBeVisible();
    await expect(page.getByTestId("demo-banner")).toBeVisible();
    await expect(page.getByTestId("health-score")).toBeVisible();
    for (const k of ["active_share", "completion", "timeliness", "seats"]) await expect(page.getByTestId(`component-${k}`)).toBeVisible();
    await expect(page.getByTestId("org-daily")).toBeVisible();
    await expect(page.getByTestId("pilot-form")).toBeVisible();
    await ctx.close();
  });

  test("мектеп әкімшісі: пилот есебі PDF және XLSX, MIME дұрыс, жеке оқушы аттары жоқ", async ({ browser }) => {
    const { ctx } = await session(browser, ADMIN);
    const pdf = await ctx.request.get(`/api/reports/pilot/${demoOrg}?format=pdf`);
    expect(pdf.status()).toBe(200);
    expect(pdf.headers()["content-type"]).toBe("application/pdf");
    expect(pdf.headers()["content-disposition"]).toContain("attachment");
    expect(pdf.headers()["x-content-type-options"]).toBe("nosniff");
    const pb = await pdf.body();
    expect(pb.subarray(0, 5).toString()).toBe("%PDF-");
    if (hasPdftotext) {
      const t = pdfText(pb);
      expect(t).toContain("Пилот есебі (ДЕМО)");
      expect(t).toContain("Белсенді оқушылар");
      expect(t).toContain("Ұсыныстар");
      for (const name of ["Аружан", "Нұрсұлтан", "student1@", "Айдос"]) expect(t).not.toContain(name);
    }
    const x = await ctx.request.get(`/api/reports/pilot/${demoOrg}?format=xlsx&from=2000-01-01&to=2000-02-01`);
    expect(x.status()).toBe(200);
    expect(x.headers()["content-type"]).toBe(XLSX);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load((await x.body()) as any);
    expect(wb.worksheets.map((w) => w.name)).toEqual(expect.arrayContaining(["Қорытынды", "Белсенді күндер", "Қиындықтар", "Ұсыныстар", "Түсініктеме"]));
    const all: string[] = [];
    wb.eachSheet((ws) => ws.eachRow((r) => r.eachCell((c) => all.push(String(c.value ?? "")))));
    const flat = all.join("\n");
    expect(flat).toContain("ДЕМО");
    expect(flat).toContain("дерек жоқ");      // 2000 жылы дерек жоқ: жалған сан жоқ
    expect(flat).not.toMatch(/Аружан|Нұрсұлтан|@demo\.qazaqcode\.kz/);
    await ctx.close();
  });

  test("SUPER ADMIN: кез келген ұйымның пилот есебін алады (жиынтық), PDF/XLSX; формула қорғалған", async ({ browser }) => {
    const { ctx } = await session(browser, ROOT);
    const pdf = await ctx.request.get(`/api/reports/pilot/${demoOrg}`);
    expect(pdf.status()).toBe(200);
    expect(pdf.headers()["content-type"]).toBe("application/pdf");
    const x = await ctx.request.get(`/api/reports/pilot/${other.org}?format=xlsx`);
    expect(x.status()).toBe(200);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load((await x.body()) as any);
    const info = wb.getWorksheet("Мәлімет")!;
    const org = String(info.getCell("B2").value);
    expect(org.startsWith("'=")).toBe(true);
    const audit = await q("select count(*)::int n from audit_logs where action in ('export.pilot_pdf', 'export.pilot_xlsx')");
    expect(audit[0].n).toBeGreaterThanOrEqual(3);
    await ctx.close();
  });

  test("басқа мектептің әкімшісі: өз есебі иә, демо мектептікі жоқ; /school/health бос күй, жалған дерек жоқ", async ({ browser }) => {
    const { ctx, page } = await session(browser, other.email);
    expect((await ctx.request.get(`/api/reports/pilot/${demoOrg}?format=pdf`)).status()).toBe(403);
    const own = await ctx.request.get(`/api/reports/pilot/${other.org}?format=pdf`);
    expect(own.status()).toBe(200);
    await page.goto("/school/health");
    await expect(page.getByRole("heading", { name: "Мектеп денсаулығы" })).toBeVisible();
    await expect(page.getByText("Ұпай есептелмейді").first()).toBeVisible();
    await expect(page.getByText("Белсенділік деректері жоқ").first()).toBeVisible();
    await expect(page.getByTestId("demo-banner")).toHaveCount(0);
    await ctx.close();
  });

  test("390px: /school/health-те көлденең айналдыру жоқ", async ({ browser }) => {
    const { ctx, page } = await session(browser, ADMIN, { width: 390, height: 844 });
    await page.goto("/school/health");
    await expect(page.getByTestId("health-score")).toBeVisible();
    expect(await noHScroll(page)).toBe(true);
    await ctx.close();
  });
});

test.describe("белсенділік журналы", () => {
  test("жаңа оқушы бірнеше бет ашады -> бүгінге бір ғана жол, басқа дерек жоқ; мазмұн сақталмайды", async ({ browser }) => {
    const email = `qm-stu-${STAMP}@metrics.test`;
    const uid = (await q("select auth_dev.sign_up($1, $2, $3) as id", [email, PASS, "Журнал Оқушы"]))[0].id;
    const code = (await q("select c.join_code from classrooms c where c.org_id = $1 and c.status = 'active' limit 1", [demoOrg]))[0].join_code;
    await asUser(uid, "select public.join_classroom($1)", [code]);
    expect((await q("select count(*)::int n from activity_days where user_id = $1", [uid]))[0].n).toBe(0);
    const { ctx, page } = await session(browser, email);
    await page.goto("/student");
    await page.goto("/student/assignments");
    await page.goto("/student/grades");
    await page.reload();
    const rows = await q("select * from activity_days where user_id = $1", [uid]);
    expect(rows.length).toBe(1);
    expect(rows[0].role).toBe("student");
    expect(rows[0].org_id).toBe(demoOrg);
    expect(Object.keys(rows[0]).sort()).toEqual(["day", "org_id", "role", "user_id"]);
    await ctx.close();
  });
});
