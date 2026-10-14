import { test, expect, type Page } from "@playwright/test";
import pg from "pg";

// Оқушы аймағы E2E. Демо дерек керек (scripts/seed-demo.mjs) және дерекқорға тікелей қол жеткізу (DATABASE_URL: тест дерегін дайындау үшін).
// student4 (10Ә) демода ештеңе тапсырмаған: әр жүгіруде оның жұмыстары тазаланады.
const EMAIL = "student4@demo.qazaqcode.kz";
const PASS = "DemoPass123";
const db = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
const q = async <T = any>(sql: string, p: unknown[] = []) => (await db.query(sql, p)).rows as T[];

let lateId = "";
let otherClassAssignment = "";

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  const [u] = await q("select id from auth.users where email = $1", [EMAIL]);
  await q("delete from public.submissions where student_id = $1", [u.id]);
  await q("delete from public.assignments where title like 'E2E %'");
  const [cls] = await q("select c.id, c.org_id, c.teacher_id from public.classrooms c where c.name = '10Ә' limit 1");
  const [a] = await q<{ id: string }>(
    `insert into public.assignments (org_id, created_by, title, description, kind, max_score, starter_code, deadline, status)
     values ($1, $2, 'E2E кешігетін тапсырма', 'Мерзімі өту тесті', 'python', 100, 'print(1)', now() + interval '1 day', 'published') returning id`, [cls.org_id, cls.teacher_id]);
  await q("insert into public.assignment_targets (org_id, assignment_id, classroom_id) values ($1, $2, $3)", [cls.org_id, a.id, cls.id]);
  lateId = a.id;
  [{ id: otherClassAssignment }] = await q(
    `select a.id from public.assignments a join public.assignment_targets t on t.assignment_id = a.id join public.classrooms c on c.id = t.classroom_id
      where c.name = '9А' and a.status = 'published' and a.title not like 'E2E %' limit 1`);
});
test.afterAll(async () => {
  await q("delete from public.assignments where title like 'E2E %'");
  await db.end();
});

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(EMAIL);
  await page.getByLabel("Құпиясөз").fill(PASS);
  await page.getByRole("button", { name: "Кіру" }).click();
  await page.waitForURL(/\/student/);
}
async function type(page: Page, text: string) {
  await page.locator(".cm-content").click();
  await page.keyboard.type(text);
}

test("кабинет және тапсырмалар тізімі", async ({ page }) => {
  await login(page);
  await expect(page.getByRole("heading", { name: /Сәлем/ })).toBeVisible();
  await expect(page.getByText("10Ә").first()).toBeVisible();
  await page.goto("/student/assignments");
  await expect(page.getByRole("link", { name: "Айнымалылар: қысқа тест" })).toBeVisible();
  await page.goto("/student/assignments?status=graded");
  await expect(page.getByText("Бұл күйде тапсырма жоқ")).toBeVisible();
  await page.goto("/student/assignments?status=not_started");
  await expect(page.getByRole("link", { name: "SELECT сұрауы" })).toBeVisible();
});

test("тест: жауап беру, жіберу, балл", async ({ page }) => {
  await login(page);
  await page.goto("/student/assignments");
  await page.getByRole("link", { name: "Айнымалылар: қысқа тест" }).click();
  await page.getByLabel("Мән меншіктеу").check();
  await page.getByLabel("float").check();
  await page.getByLabel("1ат").check(); // қате жауап
  await expect(page.getByTestId("save-status")).toContainText("Сақталды ✓");
  // жаңартқанда жауаптар сақталған
  await page.reload();
  await expect(page.getByLabel("Мән меншіктеу")).toBeChecked();
  await page.getByRole("button", { name: "Жіберу" }).click();
  await page.getByRole("button", { name: "Иә, жіберу" }).click();
  const res = page.getByTestId("quiz-result");
  await expect(res).toBeVisible();
  await expect(res).toContainText("66.67 / 100");
  await expect(page.getByTestId("q-correct")).toHaveCount(2);
  await expect(page.getByTestId("q-wrong")).toHaveCount(1);
  await expect(page.getByText("Бағаланған").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Жіберу", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Қайта тапсыру" })).toBeVisible();
  await page.goto("/student/grades");
  await expect(page.getByText("66.67 / 100").first()).toBeVisible();
});

test("код: жазу, авто сақтау, қайта жүктеу, жіберу", async ({ page }) => {
  await login(page);
  await page.goto("/student/assignments?status=not_started");
  await page.getByRole("link", { name: "SELECT сұрауы" }).first().click();
  await expect(page.getByText("Жұмысыңызды мұғалім тексеріп баға қояды")).toBeVisible();
  await expect(page.getByRole("button", { name: "Іске қосу" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Жіберу" })).toBeDisabled(); // код бос
  await type(page, "SELECT * FROM students WHERE age > 15;");
  await expect(page.getByTestId("save-status")).toContainText("Сақталды ✓", { timeout: 15_000 });
  await page.reload();
  await expect(page.locator(".cm-content")).toContainText("SELECT * FROM students WHERE age > 15;");
  await page.getByRole("button", { name: "Жіберу" }).click();
  await page.getByRole("button", { name: "Иә, жіберу" }).click();
  await expect(page.getByText("Жіберілген", { exact: true }).first()).toBeVisible({ timeout: 15_000 });
  await expect(page.locator(".cm-content")).toHaveAttribute("contenteditable", "false");
  await expect(page.getByRole("button", { name: "Қайта тапсыру" })).toBeVisible();
});

test("мерзімі өткен тапсырма жіберілмейді", async ({ page }) => {
  await login(page);
  await page.goto(`/student/assignments/${lateId}`);
  await type(page, "\nprint(2)");
  await expect(page.getByTestId("save-status")).toContainText("Сақталды ✓", { timeout: 15_000 });
  await q("update public.assignments set deadline = now() - interval '1 hour' where id = $1", [lateId]);
  await page.reload();
  await expect(page.getByText("Тапсыру мерзімі өтті")).toBeVisible();
  await expect(page.getByRole("button", { name: "Жіберу" })).toHaveCount(0);
  await expect(page.locator(".cm-content")).toHaveAttribute("contenteditable", "false");
  // сервер де қабылдамайды
  const [u] = await q("select id from auth.users where email = $1", [EMAIL]);
  const c = await db.connect();
  try {
    await c.query("begin");
    await c.query("set local role authenticated");
    await c.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify({ sub: u.id, role: "authenticated" })]);
    const [s] = (await c.query("select id from public.submissions where assignment_id = $1 and status = 'draft'", [lateId])).rows;
    await expect(c.query("select public.submit_assignment($1)", [s.id])).rejects.toThrow(/deadline_passed/);
  } finally { await c.query("rollback"); c.release(); }
});

test("басқа сыныптың тапсырмасы 404, /teacher жабық", async ({ page }) => {
  await login(page);
  await page.goto(`/student/assignments/${otherClassAssignment}`);
  await expect(page.getByTestId("not-found")).toBeVisible();
  await expect(page.getByTestId("workspace")).toHaveCount(0);
  await page.goto("/student/assignments/not-a-uuid");
  await expect(page.getByTestId("not-found")).toBeVisible();
  await page.goto("/teacher");
  await expect(page).not.toHaveURL(/\/teacher/);
  await expect(page).toHaveURL(/\/student/);
});
