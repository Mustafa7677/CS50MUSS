import { test, expect, type Browser, type Page } from "@playwright/test";
import pg from "pg";

// Мұғалім аймағы E2E. Демо дерек (scripts/seed-demo.mjs) және DATABASE_URL керек (тест деректерін дайындау/тазалау үшін).
// Тест деректерінің атауы "QT " деп басталады; әр жүгіру алдында да, кейін де тазаланады.
const T1 = "teacher1@demo.qazaqcode.kz";
const T2 = "teacher2@demo.qazaqcode.kz";
const PASS = "DemoPass123";
const db = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
const q = async <T = any>(sql: string, p: unknown[] = []) => (await db.query(sql, p)).rows as T[];
const uniq = () => `${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Құпиясөз").fill(PASS);
  await page.getByRole("button", { name: "Кіру" }).click();
  await page.waitForURL(/\/teacher/);
}
async function newSession(browser: Browser, email: string) {
  const ctx = await browser.newContext({ locale: "kk-KZ" });
  const page = await ctx.newPage();
  await login(page, email);
  return { ctx, page };
}
async function clean() {
  await q("delete from public.assignments where title like 'QT %'");
  await q("delete from public.classrooms where name like 'QT %'");
}
/** Жаңа сынып ашады, id мен кодты қайтарады */
async function createClass(page: Page, name: string) {
  await page.goto("/teacher");
  await page.getByLabel("Сынып атауы").fill(name);
  await page.getByLabel("Сипаттамасы").fill("Автотест сыныбы");
  await page.getByRole("button", { name: "Сынып ашу" }).click();
  await page.waitForURL(/\/teacher\/classes\/[0-9a-f-]{36}/);
  const id = page.url().match(/classes\/([0-9a-f-]{36})/)![1];
  const code = (await page.getByTestId("join-code").innerText()).trim();
  return { id, code };
}

test.beforeAll(clean);
test.afterAll(async () => { await clean(); await db.end(); });

test("мұғалім кіреді және өз сыныптарын көреді", async ({ page }) => {
  await login(page, T1);
  await expect(page.getByRole("heading", { name: "Сыныптарым", level: 1 })).toBeVisible();
  await expect(page.getByTestId("class-card").filter({ hasText: "9А" })).toBeVisible();
  await expect(page.getByTestId("teacher-stats")).toContainText("Оқушылар");
  // басқа мұғалімнің сыныбы (10Ә) көрінбейді
  await expect(page.getByTestId("class-card").filter({ hasText: "10Ә" })).toHaveCount(0);
});

test("жаңа сынып ашады, кодын көреді, кодты жаңартады", async ({ page }) => {
  await login(page, T1);
  const { id, code } = await createClass(page, `QT Сынып ${uniq()}`);
  expect(code).toMatch(/^[A-HJ-NP-Z2-9]{8}$/);
  await expect(page.getByTestId("join-link")).toContainText(`/join?code=${code}`);
  await expect(page.getByTestId("copy-code")).toBeVisible();
  await page.getByRole("button", { name: "Кодты жаңарту" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Жаңарту" }).click();
  await expect(page.getByText("Қосылу коды жаңартылды")).toBeVisible();
  const code2 = (await page.getByTestId("join-code").innerText()).trim();
  expect(code2).not.toBe(code);
  // қосылуды жабу/ашу
  await page.getByRole("button", { name: "Қосылуды жабу" }).click();
  await expect(page.getByText("Қосылу жабық").first()).toBeVisible();
  await page.getByRole("button", { name: "Қосылуды ашу" }).click();
  await expect(page.getByRole("button", { name: "Қосылуды жабу" })).toBeVisible();
  // оқушы жоқ: бос күй
  await page.goto(`/teacher/classes/${id}?tab=students`);
  await expect(page.getByText("Сыныпта оқушы жоқ")).toBeVisible();
});

test("quiz тапсырма жасап (2 сұрақ), сыныпқа береді және жариялайды", async ({ page }) => {
  await login(page, T1);
  const { id } = await createClass(page, `QT Сынып ${uniq()}`);
  const title = `QT Тест ${uniq()}`;
  await page.goto(`/teacher/assignments/new?class=${id}`);
  await page.getByLabel("Тақырыбы").fill(title);
  await page.getByLabel("Түрі").selectOption("quiz");
  await expect(page.getByRole("button", { name: "Сұрақ қосу" })).toBeVisible();
  // жариялау: сұрақсыз қате
  await page.getByTestId("publish-btn").click();
  await expect(page.getByRole("alert").filter({ hasText: "кемінде бір сұрақ" })).toBeVisible();
  for (let i = 0; i < 2; i++) await page.getByRole("button", { name: "Сұрақ қосу" }).click();
  const qs = page.getByTestId("question");
  await expect(qs).toHaveCount(2);
  for (let i = 0; i < 2; i++) {
    const qn = qs.nth(i);
    await qn.getByLabel("Сұрақ мәтіні").fill(`${i + 1}-сұрақ: 2 + ${i + 1} неге тең?`);
    await qn.getByLabel("1-нұсқа мәтіні").fill(String(2 + i + 1));
    await qn.getByLabel("2-нұсқа мәтіні").fill("0");
    await qn.getByLabel("1-нұсқа дұрыс жауап").check();
  }
  await page.getByTestId("publish-btn").click();
  await page.waitForURL(/\/teacher\/assignments\?ok=published/);
  const row = page.getByTestId("assignment-row").filter({ hasText: title });
  await expect(row).toContainText("Жарияланған");
  await expect(row).toContainText("Тест");
  // сынып бетінде көрінеді
  await page.goto(`/teacher/classes/${id}?tab=assignments`);
  await expect(page.getByRole("link", { name: title })).toBeVisible();
  // көшіру -> жоба
  await page.goto("/teacher/assignments");
  await page.getByTestId("assignment-row").filter({ hasText: title }).getByRole("button", { name: "Көшіру" }).click();
  await page.waitForURL(/\/edit\?ok=duplicated/);
  await expect(page.getByLabel("Тақырыбы")).toHaveValue(`${title} (көшірме)`);
  await expect(page.getByTestId("question")).toHaveCount(2);
});

test("тексеру кезегіндегі жұмысты ашып баға қояды", async ({ page }) => {
  const [t] = await q("select id from auth.users where email = $1", [T1]);
  const [s] = await q("select id from auth.users where email = 'student1@demo.qazaqcode.kz'");
  const [cls] = await q("select id, org_id from public.classrooms where name = '9А' and teacher_id = $1", [t.id]);
  const [a] = await q(
    `insert into public.assignments (org_id, created_by, title, description, kind, max_score, status)
     values ($1, $2, $3, 'Автотест', 'python', 100, 'published') returning id`, [cls.org_id, t.id, `QT Код ${uniq()}`]);
  await q("insert into public.assignment_targets (org_id, assignment_id, classroom_id) values ($1,$2,$3)", [cls.org_id, a.id, cls.id]);
  const [sub] = await q(
    `insert into public.submissions (org_id, assignment_id, classroom_id, student_id, attempt_no, status, code, time_spent_seconds, submitted_at)
     values ($1,$2,$3,$4,1,'submitted',E'x = int(input())\nprint(x * 2)', 125, now()) returning id`, [cls.org_id, a.id, cls.id, s.id]);

  await login(page, T1);
  await page.goto("/teacher/review");
  await page.getByLabel("Сынып бойынша сүзгі").selectOption({ label: "9А" });
  await page.getByRole("button", { name: "Сүзу" }).click();
  const row = page.getByTestId("review-row").filter({ hasText: "QT Код" });
  await expect(row).toHaveCount(1);
  await row.getByRole("link", { name: "Ашу" }).click();
  await page.waitForURL(new RegExp(`/teacher/submissions/${sub.id}`));
  await expect(page.getByTestId("submission-code")).toContainText("print(x * 2)");
  await expect(page.getByText("2 мин")).toBeVisible();
  await page.getByRole("button", { name: "Тексеруді бастау" }).click();
  await expect(page.locator("main").getByText("Тексеріліп жатыр").first()).toBeVisible();
  // дұрыс емес баға
  const score = page.locator("#g-score");
  await score.fill("150");
  await page.getByRole("button", { name: "Бағаны сақтау" }).click();
  expect(await score.evaluate((el: HTMLInputElement) => el.validity.rangeOverflow)).toBe(true); // макс. баллдан жоғары жіберілмейді
  await score.fill("85");
  await page.getByLabel("Пікір").fill("Жақсы жұмыс, бірақ тексеру қосыңыз.");
  await page.getByRole("button", { name: "Бағаны сақтау" }).click();
  await expect(page.getByText("Баға сақталды.").first()).toBeVisible();
  await page.reload();
  await expect(page.getByTestId("prev-grade")).toContainText("85 / 100");
  await expect(page.getByTestId("prev-grade")).toContainText("Жақсы жұмыс");
  const [g] = await q("select score, status from public.grades g join public.submissions s on s.id = g.submission_id where s.id = $1", [sub.id]);
  expect(Number(g.score)).toBe(85);
  expect(g.status).toBe("graded");
});

test("CSV экспорт жауап береді; басқа ұстаз/анонимге жабық", async ({ page, browser }) => {
  await login(page, T1);
  const href = await page.getByTestId("class-card").filter({ hasText: "9А" }).getByRole("link", { name: "Ашу" }).getAttribute("href");
  const id = href!.match(/classes\/([0-9a-f-]{36})/)![1];
  await page.goto(`/teacher/classes/${id}?tab=analytics`);
  await expect(page.getByTestId("csv-link")).toBeVisible();
  const res = await page.request.get(`/teacher/classes/${id}/export`);
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("text/csv");
  expect(res.headers()["content-disposition"]).toContain("attachment");
  const buf = await res.body();
  expect([...buf.subarray(0, 3)]).toEqual([0xef, 0xbb, 0xbf]); // UTF-8 BOM
  const text = buf.toString("utf8");
  expect(text).toContain('"Оқушы","Тапсырма"');
  expect(text.split("\r\n").length).toBeGreaterThan(2);

  // басқа ұстаздың сыныбы
  const other = await newSession(browser, T2);
  const href2 = await other.page.getByTestId("class-card").first().getByRole("link", { name: "Ашу" }).getAttribute("href");
  const id2 = href2!.match(/classes\/([0-9a-f-]{36})/)![1];
  expect(id2).not.toBe(id);
  await page.goto(`/teacher/classes/${id2}`);
  await expect(page.getByRole("heading", { name: "Бет табылмады" })).toBeVisible();
  const rx = await page.request.get(`/teacher/classes/${id2}/export`);
  expect(rx.status()).toBe(404);
  await page.goto(`/teacher/classes/not-a-uuid`);
  await expect(page.getByRole("heading", { name: "Бет табылмады" })).toBeVisible();
  await other.ctx.close();

  // кірмеген қолданушы
  const anon = await browser.newContext();
  const ra = await anon.request.get(`${test.info().project.use.baseURL ?? ""}/teacher/classes/${id}/export`);
  expect(ra.status()).toBe(401);
  await anon.close();
});

test("басқа ұстаздың тапсырмасы мен жұмысы 404", async ({ page, browser }) => {
  const [t2] = await q("select id from auth.users where email = $1", [T2]);
  const [a2] = await q("select a.id from public.assignments a where a.created_by = $1 limit 1", [t2.id]);
  const [s2] = await q("select s.id from public.submissions s join public.classrooms c on c.id = s.classroom_id where c.teacher_id = $1 limit 1", [t2.id]);
  await login(page, T1);
  await page.goto(`/teacher/assignments/${a2.id}/edit`);
  await expect(page.getByRole("heading", { name: "Бет табылмады" })).toBeVisible();
  await page.goto(`/teacher/submissions/${s2.id}`);
  await expect(page.getByRole("heading", { name: "Бет табылмады" })).toBeVisible();
});
