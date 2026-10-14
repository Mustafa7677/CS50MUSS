import { test, expect, type Browser, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import ExcelJS from "exceljs";
import pg from "pg";

// Есептер (Excel/PDF) және аналитика беттері. Демо дерек (scripts/seed-demo.mjs) және DATABASE_URL керек.
// Тест деректері "QR " / "=QR" деп басталады не qr-other-* ұйымы: әр жүгіру алдында және кейін тазаланады.
const PASS = "DemoPass123";
const ADMIN = "admin@demo.qazaqcode.kz", T1 = "teacher1@demo.qazaqcode.kz", T2 = "teacher2@demo.qazaqcode.kz", S1 = "student1@demo.qazaqcode.kz";
const KK = "әғқңөұүһі ӘҒҚҢӨҰҮҺІ";
const XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const db = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
const q = async <T = any>(sql: string, p: unknown[] = []) => (await db.query(sql, p)).rows as T[];
const hasPdftotext = (() => { try { execFileSync("pdftotext", ["-v"], { stdio: "ignore" }); return true; } catch { return false; } })();

async function login(page: Page, email: string, url: RegExp) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Құпиясөз").fill(PASS);
  await page.getByRole("button", { name: "Кіру" }).click();
  await page.waitForURL(url);
}
async function session(browser: Browser, email: string, url: RegExp) {
  const ctx = await browser.newContext({ locale: "kk-KZ" });
  const page = await ctx.newPage();
  await login(page, email, url);
  return { ctx, page };
}
const pdfText = (buf: Buffer) => {
  const f = path.join(mkdtempSync(path.join(tmpdir(), "qr-")), "r.pdf");
  writeFileSync(f, buf);
  return execFileSync("pdftotext", ["-layout", f, "-"], { encoding: "utf8" });
};
async function sheets(buf: Buffer) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf as any);
  return wb;
}
async function clean() {
  await q("delete from public.classrooms where name like 'QR %' or name like '=QR%'");
  await q("delete from public.organizations where slug like 'qr-other-%'");
}
const code = () => Array.from({ length: 8 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("");

let demoClass = "";
let demoOrg = "";
let otherTeacher = "";

test.beforeAll(async () => {
  await clean();
  const [c] = await q("select c.id, c.org_id, c.teacher_id from public.classrooms c join auth.users u on u.id = c.teacher_id where u.email = $1 and c.name not like 'QR %' and c.name not like '=QR%' order by c.created_at limit 1", [T1]);
  demoClass = c.id; demoOrg = c.org_id;
  // Қазақ әріптері мен формула инъекциясын тексеру үшін қосымша сыныптар (тек тест)
  await q("insert into public.classrooms(org_id, teacher_id, name, academic_year, subject, join_code) values ($1,$2,$3,'2025-2026','Информатика',$4)", [demoOrg, c.teacher_id, `QR ${KK}`, code()]);
  await q("insert into public.classrooms(org_id, teacher_id, name, academic_year, subject, join_code) values ($1,$2,'=QR1+1','2025-2026','Информатика',$3)", [demoOrg, c.teacher_id, code()]);
  // Басқа мектеп мен оның мұғалімі
  const run = Date.now().toString(36);
  const root = (await q("select id from auth.users where email = 'root@demo.qazaqcode.kz'"))[0].id;
  const asUser = async <T,>(uid: string, fn: (x: (s: string, p?: unknown[]) => Promise<any[]>) => Promise<T>) => {
    const cl = await db.connect();
    try {
      await cl.query("begin"); await cl.query("set local role authenticated");
      await cl.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify({ sub: uid, role: "authenticated" })]);
      const r = await fn((s, p = []) => cl.query(s, p as any[]).then((x) => x.rows)); await cl.query("commit"); return r;
    } catch (e) { await cl.query("rollback").catch(() => {}); throw e; } finally { cl.release(); }
  };
  const valid = new Date(Date.now() + 365 * 864e5).toISOString().slice(0, 10);
  const org = (await asUser(root, (x) => x("select public.create_organization($1,$2,'pro',$3) as r", [`QR Басқа мектеп ${run}`, `qr-other-${run}`, valid])))[0].r;
  const email = `qr-teacher-${run}@e2e.qazaqcode.kz`;
  const uid = (await q("select auth_dev.sign_up($1,$2,$3) as id", [email, PASS, "QR Басқа Мұғалім"]))[0].id;
  const adminId = (await q("select auth_dev.sign_up($1,$2,$3) as id", [`qr-admin-${run}@e2e.qazaqcode.kz`, PASS, "QR Басқа Әкімші"]))[0].id;
  await asUser(adminId, (x) => x("select public.accept_invitation($1)", [org.admin_invite_token]));
  const tok = (await asUser(adminId, (x) => x("select public.create_invitation($1,'teacher') as t", [org.org_id])))[0].t;
  await asUser(uid, (x) => x("select public.accept_invitation($1)", [tok]));
  otherTeacher = email;
});
test.afterAll(async () => { await clean(); await db.end(); });

test("мектеп есебі XLSX: парақтар, қатарлар, тақырып, формула қорғанысы", async ({ browser }) => {
  const { ctx, page } = await session(browser, ADMIN, /\/school/);
  const res = await page.request.get("/api/reports/school?format=xlsx");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain(XLSX);
  expect(res.headers()["content-disposition"]).toMatch(/^attachment; filename="mektep-esebi-\d{4}-\d{2}-\d{2}\.xlsx"$/);
  expect(res.headers()["cache-control"]).toContain("no-store");
  const wb = await sheets(await res.body());
  const names = wb.worksheets.map((w) => w.name);
  expect(names).toEqual(expect.arrayContaining(["Жалпы", "Сыныптар", "Тапсырмалар"]));
  const nClasses = Number((await q("select count(*) n from public.classrooms where org_id = $1 and status = 'active'", [demoOrg]))[0].n);
  const cls = wb.getWorksheet("Сыныптар")!;
  expect(cls.rowCount).toBe(nClasses + 1);
  expect(cls.getRow(1).getCell(1).value).toBe("Сынып");
  expect(cls.views[0]).toMatchObject({ state: "frozen", ySplit: 1 });
  expect(cls.getRow(1).font?.bold).toBe(true);
  expect(cls.getColumn(1).width).toBeGreaterThan(10);
  // сандар сан түрінде
  const firstData = cls.getRow(2);
  expect(typeof firstData.getCell(5).value).toBe("number");
  // формула инъекциясы: "=QR1+1" алдына ' қосылады
  const col = cls.getColumn(1).values as unknown[];
  expect(col).toContain("'=QR1+1");
  expect(col).not.toContain("=QR1+1");
  await ctx.close();
});

test("мектеп есебі PDF: %PDF, қазақ әріптері", async ({ browser }) => {
  const { ctx, page } = await session(browser, ADMIN, /\/school/);
  const res = await page.request.get("/api/reports/school?format=pdf");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("application/pdf");
  expect(res.headers()["content-disposition"]).toContain("attachment");
  const buf = await res.body();
  expect(buf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
  if (hasPdftotext) {
    const t = pdfText(buf);
    expect(t).toContain("Мектеп жалпы есебі");
    expect(t).toContain("Ұйым");
    expect(t).toContain("Бет 1 /");
    for (const ch of "әғқңөұүһіӘҒҚҢӨҰҮҺІ") expect(t, `PDF-те «${ch}» жоқ`).toContain(ch);
  }
  await ctx.close();
});

test("сынып есебі: мұғалім XLSX/PDF, күн аралығы сүзгісі", async ({ browser }) => {
  const { ctx, page } = await session(browser, T1, /\/teacher/);
  const nStud = Number((await q("select count(*) n from public.classroom_students where classroom_id = $1 and status = 'active'", [demoClass]))[0].n);
  const x = await page.request.get(`/api/reports/class/${demoClass}?format=xlsx`);
  expect(x.status()).toBe(200);
  const wb = await sheets(await x.body());
  expect(wb.worksheets.map((w) => w.name)).toEqual(expect.arrayContaining(["Қорытынды", "Оқушылар", "Тапсырмалар", "Бағалар", "Бағалар таралуы"]));
  expect(wb.getWorksheet("Оқушылар")!.rowCount).toBe(nStud + 1);
  const gradesAll = wb.getWorksheet("Бағалар")!.rowCount;
  expect(gradesAll).toBeGreaterThan(1);
  // өте ескі аралық: баға жоқ
  const old = await page.request.get(`/api/reports/class/${demoClass}?format=xlsx&from=2020-01-01&to=2020-01-31`);
  expect(old.status()).toBe(200);
  const wb2 = await sheets(await old.body());
  expect(wb2.getWorksheet("Бағалар")!.getRow(2).getCell(1).value).toBe("Таңдалған кезеңде баға жоқ.");
  expect(wb2.getWorksheet("Оқушылар")!.rowCount).toBe(nStud + 1);
  const p = await page.request.get(`/api/reports/class/${demoClass}?format=pdf`);
  expect(p.status()).toBe(200);
  const buf = await p.body();
  expect(buf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
  if (hasPdftotext) expect(pdfText(buf)).toContain("Сынып есебі");
  await ctx.close();
});

test("құқық: оқушы, мұғалім, басқа мектеп, SUPER ADMIN, кіргізбеген", async ({ browser, request }) => {
  expect((await request.get("/api/reports/school?format=pdf")).status()).toBe(401);
  const st = await session(browser, S1, /\/student/);
  for (const u of ["/api/reports/school?format=xlsx", `/api/reports/class/${demoClass}?format=xlsx`]) {
    expect([403, 404]).toContain((await st.page.request.get(u)).status());
  }
  await st.ctx.close();

  const t1 = await session(browser, T1, /\/teacher/);
  expect((await t1.page.request.get("/api/reports/school?format=xlsx")).status()).toBe(403);
  await t1.ctx.close();

  const t2 = await session(browser, T2, /\/teacher/);
  expect([403, 404]).toContain((await t2.page.request.get(`/api/reports/class/${demoClass}?format=xlsx`)).status());
  await t2.ctx.close();

  const other = await session(browser, otherTeacher, /\/teacher/);
  const r = await other.page.request.get(`/api/reports/class/${demoClass}?format=pdf`);
  expect([403, 404]).toContain(r.status());
  expect(r.headers()["content-type"]).not.toContain("json");
  expect((await other.page.request.get("/api/reports/school?format=pdf")).status()).toBe(403);
  await other.ctx.close();

  const root = await browser.newContext();
  const rp = await root.newPage();
  await login(rp, "root@demo.qazaqcode.kz", /\/admin/);
  expect((await rp.request.get("/api/reports/school?format=xlsx")).status()).toBe(403);
  expect([403, 404]).toContain((await rp.request.get(`/api/reports/class/${demoClass}?format=xlsx`)).status());
  await root.close();
});

test("дұрыс емес параметрлер: 400 / 404", async ({ browser }) => {
  const { ctx, page } = await session(browser, ADMIN, /\/school/);
  const bad = [
    "format=doc", "format=pdf&from=2026-03-01&to=2026-02-01", "format=pdf&from=2026-02-31&to=2026-03-01", "format=pdf&from=abc",
    "format=xlsx&from=2025-01-01&to=2026-12-31", "format=xlsx&to=26-01-01",
  ];
  for (const qs of bad) expect((await page.request.get(`/api/reports/school?${qs}`)).status(), qs).toBe(400);
  expect((await page.request.get("/api/reports/school?format=xlsx&from=2026-01-01&to=2026-12-31")).status()).toBe(200);
  expect((await page.request.get("/api/reports/school?format=xlsx&from=&to=")).status()).toBe(200);
  expect((await page.request.get("/api/reports/class/not-a-uuid?format=xlsx")).status()).toBe(404);
  expect((await page.request.get("/api/reports/class/00000000-0000-4000-8000-000000000000?format=xlsx")).status()).toBe(404);
  await ctx.close();
});

test("UI: оқушы карточкасы, оқушылар беті, сынып аналитикасы, 390px", async ({ browser }) => {
  const t = await session(browser, T1, /\/teacher/);
  await t.page.setViewportSize({ width: 390, height: 800 });
  await t.page.goto(`/teacher/classes/${demoClass}`);
  const link = t.page.getByTestId("student-row").first().getByRole("link").first();
  const name = (await link.innerText()).trim();
  await link.click();
  await expect(t.page.getByRole("heading", { level: 1, name })).toBeVisible();
  await expect(t.page.getByTestId("student-stats")).toBeVisible();
  await expect(t.page.getByTestId("student-progress")).toBeVisible();
  expect(await t.page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  // басқа мұғалімнің оқушысы: 404
  const foreign = (await q("select cs.student_id from public.classroom_students cs where cs.classroom_id <> $1 limit 1", [demoClass]))[0].student_id;
  const r = await t.page.goto(`/teacher/classes/${demoClass}/students/${foreign}`);
  expect(r?.status()).toBe(404);
  await t.page.goto(`/teacher/classes/${demoClass}?tab=analytics`);
  await expect(t.page.getByTestId("class-analytics")).toBeVisible();
  await expect(t.page.getByTestId("support-rule")).toContainText("50%");
  await expect(t.page.getByTestId("activity-bars").locator(".sr-only table")).toHaveCount(1);
  await expect(t.page.getByRole("heading", { name: "Қиын тақырыптар" })).toBeVisible();
  await expect(t.page.getByTestId("report-xlsx")).toBeVisible();
  expect(await t.page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await t.ctx.close();

  const a = await session(browser, ADMIN, /\/school/);
  await a.page.setViewportSize({ width: 390, height: 800 });
  await a.page.goto("/school/students");
  const total = await a.page.getByTestId("student-row").count();
  expect(total).toBeGreaterThan(1);
  await a.page.getByLabel("Аты бойынша іздеу").fill("Айгерім");
  await a.page.getByRole("button", { name: "Іздеу" }).click();
  await expect(a.page).toHaveURL(/q=/);
  const found = await a.page.getByTestId("student-row").count();
  expect(found).toBeGreaterThan(0);
  expect(found).toBeLessThan(total);
  await a.page.getByTestId("student-row").first().getByRole("link").click();
  await expect(a.page).toHaveURL(/\/school\/students\/[0-9a-f-]{36}/);
  await expect(a.page.getByTestId("student-progress")).toBeVisible();
  await a.page.goto("/school/students?q=%D0%B6%D0%BE%D2%9B-%D0%B1%D1%83%D0%BB%D0%BC%D0%B0%D0%B9%D0%B4%D1%8B");
  await expect(a.page.getByText("Ештеңе табылмады")).toBeVisible();
  await a.page.goto("/school");
  await expect(a.page.getByTestId("report-pdf")).toBeVisible();
  expect(await a.page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await a.ctx.close();
});
