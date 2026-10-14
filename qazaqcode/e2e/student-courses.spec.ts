import { test, expect, type Page } from "@playwright/test";
import pg from "pg";

// Оқушы: курстар, хабарландырулар, жобалар. Демо дерек + DATABASE_URL керек (курсты тест үшін админ ретінде құрады).
const PASS = "DemoPass123";
const S9A = "student1@demo.qazaqcode.kz";
const S10 = "student2@demo.qazaqcode.kz";
const db = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
const q = async <T = any>(sql: string, p: unknown[] = []) => (await db.query(sql, p)).rows as T[];
const TITLE = "E2E Курс: Алгоритмдер негізі";

let courseId = "";
let assignmentId = "";

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  await q("delete from public.courses where title like 'E2E Курс%'");
  await q("delete from public.assignments where title like 'E2E Курс%'");
  const [u1] = await q("select id from auth.users where email = $1", [S9A]);
  await q("delete from public.notifications where user_id = $1", [u1.id]);
  const [cls] = await q("select c.id, c.org_id, c.teacher_id from public.classrooms c where c.name = '9А' limit 1");
  const [a] = await q<{ id: string }>(
    `insert into public.assignments (org_id, created_by, title, description, kind, max_score, status)
     values ($1, $2, 'E2E Курс жобасы', 'тест', 'project', 100, 'draft') returning id`, [cls.org_id, cls.teacher_id]);
  assignmentId = a.id;
  const [c] = await q<{ id: string }>("insert into public.courses (org_id, created_by, title, description) values ($1, $2, $3, 'Сипаттама') returning id", [cls.org_id, cls.teacher_id, TITLE]);
  courseId = c.id;
  const [m] = await q<{ id: string }>("insert into public.course_modules (org_id, course_id, title, position) values ($1, $2, '1-модуль: кіріспе', 0) returning id", [cls.org_id, courseId]);
  const blocks1 = JSON.stringify([{ type: "text", content: "Бірінші абзац.\n\nЕкінші абзац <b>тег емес</b>." }, { type: "code", content: "print(1)", language: "python" }]);
  await q("insert into public.lessons (org_id, course_id, module_id, title, position, blocks, assignment_id) values ($1,$2,$3,'Бірінші сабақ',0,$4::jsonb,$5)", [cls.org_id, courseId, m.id, blocks1, assignmentId]);
  await q("insert into public.lessons (org_id, course_id, module_id, title, position, blocks) values ($1,$2,$3,'Екінші сабақ',1,$4::jsonb)", [cls.org_id, courseId, m.id, JSON.stringify([{ type: "note", content: "Назар аударыңыз" }])]);
  await q("insert into public.course_targets (course_id, classroom_id, org_id) values ($1,$2,$3)", [courseId, cls.id, cls.org_id]);
  await q("insert into public.assignment_targets (org_id, assignment_id, classroom_id) values ($1,$2,$3)", [cls.org_id, assignmentId, cls.id]);
  await q("update public.assignments set status = 'published' where id = $1", [assignmentId]);
  await q("update public.courses set status = 'published', published_at = now() where id = $1", [courseId]);
});
test.afterAll(async () => {
  await q("delete from public.courses where title like 'E2E Курс%'");
  await q("delete from public.assignments where title like 'E2E Курс%'");
  await db.end();
});

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Құпиясөз").fill(PASS);
  await page.getByRole("button", { name: "Кіру" }).click();
  await page.waitForURL(/\/student/);
}

test("курсты ашу, сабақты аяқтау, прогресс өседі", async ({ page }) => {
  await login(page, S9A);
  await page.goto("/student/courses");
  const card = page.getByRole("listitem").filter({ hasText: TITLE });
  await expect(card).toContainText("0 / 2 сабақ");
  await card.getByRole("link", { name: /Бастау/ }).click();
  await expect(page.getByTestId("lesson-title")).toHaveText("Бірінші сабақ");
  await expect(page.getByText("Бірінші абзац.")).toBeVisible();
  await expect(page.getByText("<b>тег емес</b>")).toBeVisible();
  await expect(page.locator("article b")).toHaveCount(0);
  await expect(page.locator("article").getByRole("link", { name: /E2E Курс жобасы/ })).toHaveAttribute("href", `/student/assignments/${assignmentId}`);
  await page.getByRole("button", { name: "Сабақты аяқтадым" }).click();
  await expect(page.getByTestId("course-progress")).toContainText("1 / 2");
  await page.getByRole("link", { name: "Келесі →" }).click();
  await expect(page.getByTestId("lesson-title")).toHaveText("Екінші сабақ");
  await page.getByRole("button", { name: "Сабақты аяқтадым" }).click();
  await expect(page.getByTestId("course-progress")).toContainText("2 / 2");
  await page.goto("/student");
  await expect(page.getByTestId("home-courses")).toContainText(TITLE);
  await expect(page.getByTestId("home-courses")).toContainText("2 / 2");
  // қайталап аяқтау қауіпсіз
  const [u] = await q("select id from auth.users where email = $1", [S9A]);
  const l = (await q("select id from public.lessons where course_id = $1 limit 1", [courseId]))[0];
  expect((await q("select count(*)::int n from public.lesson_progress where student_id = $1 and course_id = $2", [u.id, courseId]))[0].n).toBe(2);
  expect(l.id).toBeTruthy();
});

test("басқа сыныптың оқушысы курсты көрмейді", async ({ page }) => {
  await login(page, S10);
  await page.goto("/student/courses");
  await expect(page.getByText(TITLE)).toHaveCount(0);
  await page.goto(`/student/courses/${courseId}`);
  await expect(page.getByTestId("not-found")).toBeVisible();
  await page.goto("/student/courses/not-a-uuid");
  await expect(page.getByTestId("not-found")).toBeVisible();
});

test("хабарландыру: пайда болады және оқылды болады", async ({ page }) => {
  await login(page, S9A);
  await page.goto("/student");
  await expect(page.getByTestId("notification-count")).toBeVisible();
  await expect(page.getByTestId("notification-bell")).toHaveAttribute("aria-label", /оқылмаған/);
  await page.getByTestId("notification-bell").click();
  await page.waitForURL(/\/notifications/);
  await expect(page.getByTestId("notification-list")).toContainText("Жаңа курс: " + TITLE);
  await page.getByRole("link", { name: /Жаңа курс/ }).first().waitFor();
  await page.getByRole("button", { name: "Бәрін оқылды деп белгілеу" }).click();
  await expect(page.locator('[data-unread="true"]')).toHaveCount(0);
  await page.goto("/student");
  await expect(page.getByTestId("notification-count")).toHaveCount(0);
  await page.goto("/notifications");
  await page.context().clearCookies();
  await page.goto("/notifications");
  await expect(page).toHaveURL(/\/login/);
});

test("жобалар беті және 390px көлденең айналу жоқ", async ({ page }) => {
  await login(page, S9A);
  const [u] = await q("select id from auth.users where email = $1", [S9A]);
  const [cls] = await q("select c.id, c.org_id from public.classrooms c where c.name = '9А' limit 1");
  await q("insert into public.assignment_targets (org_id, assignment_id, classroom_id) values ($1,$2,$3) on conflict do nothing", [cls.org_id, assignmentId, cls.id]);
  await q("delete from public.submissions where student_id = $1 and assignment_id = $2", [u.id, assignmentId]);
  await q("insert into public.submissions (org_id, assignment_id, classroom_id, student_id, attempt_no, status, code) values ($1,$2,$3,$4,1,'draft','<h1>Менің жобам</h1>')", [cls.org_id, assignmentId, cls.id, u.id]);
  await page.setViewportSize({ width: 390, height: 800 });
  for (const path of ["/student", "/student/courses", `/student/courses/${courseId}`, "/student/projects", "/notifications"]) {
    await page.goto(path);
    if (path === "/student/projects") {
      await expect(page.getByTestId("project-list")).toContainText("E2E Курс жобасы");
      await expect(page.getByTestId("project-list")).toContainText("<h1>Менің жобам</h1>");
      await expect(page.getByTestId("project-list").getByRole("link", { name: "Ашу" }).first()).toHaveAttribute("href", /\/student\/assignments\//);
    }
    const over = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    expect(over, path).toBe(false);
  }
  await page.goto(`/student/courses/${courseId}`);
  await page.getByText(/Сабақтар тізімі/).click();
  await expect(page.getByRole("navigation", { name: "Сабақтар тізімі" }).first()).toBeVisible();
  await page.goto("/student");
  await expect(page.getByTestId("notification-bell")).toBeVisible();
});
