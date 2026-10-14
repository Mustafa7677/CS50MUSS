import { test, expect, type Browser, type BrowserContext, type Page } from "@playwright/test";
import pg from "pg";

// 1-кезеңнің негізгі сценарийі, бәрі нақты UI мен нақты дерекқор арқылы:
// мектеп тіркеледі -> әкімші -> мұғалім шақырылады -> сынып ашылады -> оқушы қосылады -> тапсырма беріледі ->
// оқушы орындайды -> жүйе нәтижені сақтайды -> мұғалім бағалайды -> әкімші жалпы есепті көреді -> CSV экспорт.
// Қосымша: ұйымдар арасындағы оқшаулау, лицензия мерзімі, мобильді жарамдылық.
// Тест өз ұйымын (бірегей slug) жасайды, бар деректі өшірмейді. DATABASE_URL керек (SUPER ADMIN-ді дайындау және сенімді тексеру үшін).

const PASS = "ScenarioPass123";
const db = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
const q = async <T = any>(sql: string, p: unknown[] = []) => (await db.query(sql, p)).rows as T[];
const run = Date.now().toString(36);
const SLUG = `e2e-${run}`;
const ROOT = { email: `root-${run}@e2e.qazaqcode.kz`, name: "E2E Платформа Әкімші" };

async function ctx(browser: Browser): Promise<{ c: BrowserContext; p: Page }> {
  const c = await browser.newContext({ locale: "kk-KZ" });
  return { c, p: await c.newPage() };
}
async function login(p: Page, email: string, password = PASS) {
  await p.goto("/login");
  await p.locator("#email").fill(email);
  await p.locator("#password").fill(password);
  await p.getByRole("button", { name: "Кіру" }).click();
}
async function register(p: Page, link: string, name: string, email: string, button: string) {
  await p.goto(link);
  await p.locator("#name").fill(name);
  const em = p.locator("#email");
  if ((await em.getAttribute("readonly")) === null) await em.fill(email); // e-mail-ға байланған шақыруда өріс оқуға ғана
  else await expect(em).toHaveValue(email);
  await p.locator("#password").fill(PASS);
  await p.getByRole("button", { name: button }).click();
}

const S: Record<string, any> = {};

test.describe.configure({ mode: "serial" });
test.afterAll(async () => { await db.end(); });

test("0. SUPER ADMIN дайындалады және жаңа мектепті тіркейді", async ({ browser }) => {
  const [r] = await q("select auth_dev.sign_up($1, $2, $3) as id", [ROOT.email, PASS, ROOT.name]);
  await q("insert into public.platform_admins(user_id) values ($1)", [r.id]);
  const { c, p } = await ctx(browser);
  await login(p, ROOT.email);
  await p.waitForURL(/\/admin/);
  await p.locator("#o-name").fill(`E2E Мектеп ${run}`);
  await p.locator("#o-slug").fill(SLUG);
  await p.locator("#o-plan").selectOption("starter");
  await p.getByRole("button", { name: "Мектепті тіркеу" }).click();
  S.adminLink = await p.getByTestId("invite-link").first().inputValue();
  expect(S.adminLink).toMatch(/\/invite\/[0-9a-f]{48}$/);
  await expect(p.getByTestId(`org-${SLUG}`)).toContainText("STARTER");
  const [org] = await q("select o.id, l.max_students, l.max_teachers from organizations o join licenses l on l.org_id = o.id where o.slug = $1", [SLUG]);
  expect([org.max_students, org.max_teachers]).toEqual([100, 5]);
  S.org = org.id;
  await c.close();
});

test("1. Мектеп әкімшісі шақыру арқылы тіркеледі, панелі бос (жалған сан жоқ)", async ({ browser }) => {
  const { c, p } = await ctx(browser);
  S.adminEmail = `admin-${run}@e2e.qazaqcode.kz`;
  await register(p, S.adminLink, "E2E Мектеп Әкімшісі", S.adminEmail, "Тіркелу және қабылдау");
  await p.waitForURL(/\/school/);
  await expect(p.getByRole("heading", { name: "Мектеп панелі" })).toBeVisible();
  await expect(p.getByTestId("stat-students")).toHaveText("0");
  await expect(p.getByTestId("stat-teachers")).toHaveText("0");
  await expect(p.getByTestId("stat-avg")).toContainText("-");
  // шақыру сілтемесі екінші рет қолданылмайды
  const again = await ctx(browser);
  await again.p.goto(S.adminLink);
  await expect(again.p.getByRole("heading", { name: "Шақыру жарамсыз" })).toBeVisible();
  await expect(again.p.locator("#name")).toHaveCount(0);
  await again.c.close();
  await c.close();
});

test("2. Әкімші мұғалімді шақырады, мұғалім тіркеледі", async ({ browser }) => {
  const a = await ctx(browser);
  await login(a.p, S.adminEmail);
  await a.p.waitForURL(/\/school/);
  await a.p.goto("/school/teachers");
  S.teacherEmail = `teacher-${run}@e2e.qazaqcode.kz`;
  await a.p.locator("#inv-email").fill(S.teacherEmail);
  await a.p.getByRole("button", { name: "Шақыру сілтемесін жасау" }).click();
  S.teacherLink = await a.p.getByTestId("invite-link").inputValue();
  const t = await ctx(browser);
  await register(t.p, S.teacherLink, "E2E Мұғалім", S.teacherEmail, "Тіркелу және қабылдау");
  await t.p.waitForURL(/\/teacher/);
  await a.p.reload();
  await expect(a.p.getByTestId("teachers-table")).toContainText("E2E Мұғалім");
  await a.c.close(); await t.c.close();
});

test("3. Мұғалім сынып ашады; оқушы кодпен тіркеліп қосылады", async ({ browser }) => {
  const t = await ctx(browser);
  await login(t.p, S.teacherEmail);
  await t.p.waitForURL(/\/teacher/);
  await t.p.getByLabel("Сынып атауы").fill("E2E 9А");
  await t.p.getByLabel("Сипаттамасы").fill("Сценарий сыныбы");
  await t.p.getByRole("button", { name: "Сынып ашу" }).click();
  await t.p.waitForURL(/\/teacher\/classes\/[0-9a-f-]{36}/);
  S.classId = t.p.url().match(/classes\/([0-9a-f-]{36})/)![1];
  S.code = (await t.p.getByTestId("join-code").innerText()).trim();
  expect(S.code).toMatch(/^[A-HJ-NP-Z2-9]{8}$/);
  // жарамсыз код
  const bad = await ctx(browser);
  await bad.p.goto("/join?code=ZZZZZZZZ");
  await expect(bad.p.getByText("дұрыс емес")).toBeVisible();
  await bad.c.close();
  // оқушы
  const s = await ctx(browser);
  S.studentEmail = `student-${run}@e2e.qazaqcode.kz`;
  await s.p.goto(`/join?code=${S.code}`);
  await expect(s.p.getByText("E2E 9А")).toBeVisible();
  await s.p.locator("#name").fill("E2E Оқушы");
  await s.p.locator("#email").fill(S.studentEmail);
  await s.p.locator("#password").fill(PASS);
  await s.p.getByRole("button", { name: "Тіркелу және қосылу" }).click();
  await s.p.waitForURL(/\/student/);
  await expect(s.p.getByRole("heading", { name: /Сәлем/ })).toBeVisible();
  await t.p.goto(`/teacher/classes/${S.classId}?tab=students`);
  await expect(t.p.getByTestId("student-row").filter({ hasText: "E2E Оқушы" })).toHaveCount(1);
  await s.c.close(); await t.c.close();
});

test("4. Мұғалім тест және код тапсырмасын жасап, сыныпқа береді", async ({ browser }) => {
  const t = await ctx(browser);
  await login(t.p, S.teacherEmail);
  await t.p.waitForURL(/\/teacher/);
  // тест (2 сұрақ)
  await t.p.goto(`/teacher/assignments/new?class=${S.classId}`);
  await t.p.getByLabel("Тақырыбы").fill("E2E Қысқа тест");
  await t.p.getByLabel("Түрі").selectOption("quiz");
  for (let i = 0; i < 2; i++) await t.p.getByRole("button", { name: "Сұрақ қосу" }).click();
  const qs = t.p.getByTestId("question");
  for (let i = 0; i < 2; i++) {
    await qs.nth(i).getByLabel("Сұрақ мәтіні").fill(`${i + 1}-сұрақ: 2 + ${i + 1} неге тең?`);
    await qs.nth(i).getByLabel("1-нұсқа мәтіні").fill(String(3 + i));
    await qs.nth(i).getByLabel("2-нұсқа мәтіні").fill("0");
    await qs.nth(i).getByLabel("1-нұсқа дұрыс жауап").check();
  }
  await t.p.getByTestId("publish-btn").click();
  await t.p.waitForURL(/\/teacher\/assignments\?ok=published/);
  // код тапсырмасы
  await t.p.goto(`/teacher/assignments/new?class=${S.classId}`);
  await t.p.getByLabel("Тақырыбы").fill("E2E Қосынды функциясы");
  await t.p.getByLabel("Түрі").selectOption("python");
  await t.p.getByTestId("publish-btn").click();
  await t.p.waitForURL(/\/teacher\/assignments\?ok=published/);
  const rows = await q("select title, status, kind from assignments where org_id = $1 order by title", [S.org]);
  expect(rows.map((r) => [r.title, r.status, r.kind])).toEqual([["E2E Қосынды функциясы", "published", "python"], ["E2E Қысқа тест", "published", "quiz"]]);
  await t.c.close();
});

test("5. Оқушы тестті орындайды: сервер бағалайды, нәтиже дерекқорда; кілт браузерге жіберілмейді", async ({ browser }) => {
  const s = await ctx(browser);
  const responses: string[] = [];
  s.p.on("response", async (r) => { if (r.url().includes("/student")) responses.push(await r.text().catch(() => "")); });
  await login(s.p, S.studentEmail);
  await s.p.waitForURL(/\/student/);
  await s.p.goto("/student/assignments");
  await s.p.getByRole("link", { name: "E2E Қысқа тест" }).click();
  // 1-сұрақта дұрыс (3), 2-де қате (0)
  await s.p.getByLabel("3", { exact: true }).first().check();
  await s.p.getByLabel("0", { exact: true }).nth(1).check();
  await expect(s.p.getByTestId("save-status")).toContainText("Сақталды ✓");
  await s.p.getByRole("button", { name: "Жіберу" }).click();
  await s.p.getByRole("button", { name: "Иә, жіберу" }).click();
  await expect(s.p.getByTestId("quiz-result")).toContainText("50");
  const [g] = await q("select g.score, g.source, g.graded_by from grades g join submissions su on su.id = g.submission_id where su.org_id = $1", [S.org]);
  expect(Number(g.score)).toBe(50);
  expect(g.source).toBe("auto");
  expect(g.graded_by).toBeNull();
  // дұрыс жауап кілті ешбір жауапта жоқ
  const keys = await q("select correct_index, explanation from assignment_answer_keys k join assignment_questions qu on qu.id = k.question_id where qu.org_id = $1", [S.org]);
  expect(keys.length).toBe(2);
  for (const body of responses) expect(body).not.toContain("correct_index");
  await s.c.close();
});

test("6. Оқушы код жазады (автосақтау, жаңарту), жібереді; мұғалім көріп баға қояды", async ({ browser }) => {
  const s = await ctx(browser);
  await login(s.p, S.studentEmail);
  await s.p.waitForURL(/\/student/);
  await s.p.goto("/student/assignments");
  await s.p.getByRole("link", { name: "E2E Қосынды функциясы" }).click();
  await s.p.locator(".cm-content").click();
  await s.p.keyboard.type("def add(a, b):\n    return a + b");
  await expect(s.p.getByTestId("save-status")).toContainText("Сақталды ✓", { timeout: 15_000 });
  await s.p.reload();
  await expect(s.p.locator(".cm-content")).toContainText("return a + b"); // код жоғалмайды
  await s.p.getByRole("button", { name: "Жіберу" }).click();
  await s.p.getByRole("button", { name: "Иә, жіберу" }).click();
  await expect(s.p.getByText("Жіберілген", { exact: true }).first()).toBeVisible({ timeout: 15_000 });
  const [sub] = await q("select su.status, su.code from submissions su join assignments a on a.id = su.assignment_id where a.title = 'E2E Қосынды функциясы' and a.org_id = $1", [S.org]);
  expect(sub.status).toBe("submitted");
  expect(sub.code).toContain("return a + b");

  const t = await ctx(browser);
  await login(t.p, S.teacherEmail);
  await t.p.waitForURL(/\/teacher/);
  await t.p.goto("/teacher/review");
  const row = t.p.getByTestId("review-row").filter({ hasText: "E2E Қосынды функциясы" });
  await expect(row).toHaveCount(1);
  await row.getByRole("link", { name: "Ашу" }).click();
  await expect(t.p.getByTestId("submission-code")).toContainText("return a + b");
  await t.p.locator("#g-score").fill("90");
  await t.p.getByLabel("Пікір").fill("Дұрыс, бірақ типтерді тексеріңіз.");
  await t.p.getByRole("button", { name: "Бағаны сақтау" }).click();
  await expect(t.p.getByText("Баға сақталды.").first()).toBeVisible();
  const [gr] = await q("select g.score, g.source, g.feedback from grades g join submissions su on su.id = g.submission_id join assignments a on a.id = su.assignment_id where a.title = 'E2E Қосынды функциясы' and a.org_id = $1", [S.org]);
  expect([Number(gr.score), gr.source]).toEqual([90, "manual"]);
  // оқушы бағасы мен пікірін көреді
  await s.p.goto("/student/grades");
  await expect(s.p.getByText("90").first()).toBeVisible();
  await s.p.goto("/student/assignments");
  await s.p.getByRole("link", { name: "E2E Қосынды функциясы" }).click();
  await expect(s.p.getByText("Дұрыс, бірақ типтерді тексеріңіз.")).toBeVisible();
  await s.c.close(); await t.c.close();
});

test("7. Мектеп әкімшісі нақты статистиканы көреді; CSV экспорт жұмыс істейді", async ({ browser }) => {
  const a = await ctx(browser);
  await login(a.p, S.adminEmail);
  await a.p.waitForURL(/\/school/);
  await expect(a.p.getByTestId("stat-students")).toHaveText("1");
  await expect(a.p.getByTestId("stat-teachers")).toHaveText("1");
  await expect(a.p.getByTestId("stat-classes")).toHaveText("1");
  await expect(a.p.getByTestId("stat-assignments")).toHaveText("2");
  await expect(a.p.getByTestId("stat-pending")).toHaveText("0");
  // орташа: (50 + 90) / 2 = 70%
  await expect(a.p.getByTestId("stat-avg")).toContainText("70");
  const res = await a.p.request.get("/school/export/csv");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("text/csv");
  const body = (await res.body()).toString("utf8");
  expect(body).toContain("E2E Оқушы");
  expect(body).toContain("E2E Қысқа тест");
  await a.c.close();
});

test("8. Ұйымдар оқшауланған: басқа мектеп мұғалімі/оқушысы A мектебінің дерегін көрмейді", async ({ browser }) => {
  // екінші мектеп (SUPER ADMIN арқылы SQL функциясымен, UI қайталамай)
  const [rt] = await q("select id from auth.users where email = $1", [ROOT.email]);
  const claims = JSON.stringify({ sub: rt.id, role: "authenticated" });
  const c = await db.connect();
  let tok: string;
  try {
    await c.query("begin"); await c.query("set local role authenticated"); await c.query("select set_config('request.jwt.claims', $1, true)", [claims]);
    const r = await c.query("select public.create_organization($1, $2, 'starter', (current_date + 30)) as r", [`E2E Басқа мектеп ${run}`, `${SLUG}-b`]);
    tok = r.rows[0].r.admin_invite_token; await c.query("commit");
  } finally { c.release(); }
  const base = test.info().project.use.baseURL as string;
  const b = await ctx(browser);
  await register(b.p, `${base}/invite/${tok}`, "Басқа Әкімші", `other-${run}@e2e.qazaqcode.kz`, "Тіркелу және қабылдау");
  await b.p.waitForURL(/\/school/);
  await expect(b.p.getByTestId("stat-students")).toHaveText("0");
  await expect(b.p.getByText("E2E Оқушы")).toHaveCount(0);
  // A мектебінің сыныбы мен жұмысына тікелей URL
  await b.p.goto(`/school/classes/${S.classId}`);
  await expect(b.p.getByText("E2E Оқушы")).toHaveCount(0);
  await b.p.goto(`/teacher/classes/${S.classId}`);
  await expect(b.p.getByText("E2E Оқушы")).toHaveCount(0);
  const csv = await b.p.request.get(`/school/classes/${S.classId}/export`);
  expect([403, 404]).toContain(csv.status());
  // оқушы өзге рөлдердің бетіне кіре алмайды
  const s = await ctx(browser);
  await login(s.p, S.studentEmail);
  await s.p.waitForURL(/\/student/);
  for (const path of ["/teacher", "/school", "/admin"]) {
    await s.p.goto(path);
    await expect(s.p).toHaveURL(/\/student/);
  }
  await s.c.close(); await b.c.close();
});

test("9. Лицензия мерзімі өтсе: ескерту, жаңа сынып/тапсырма бұғатталады, дерек оқылады", async ({ browser }) => {
  await q("update licenses set valid_from = current_date - 40, valid_until = current_date - 1 where org_id = $1", [S.org]);
  const t = await ctx(browser);
  await login(t.p, S.teacherEmail);
  await t.p.waitForURL(/\/teacher/);
  await expect(t.p.getByText("Лицензия күйі")).toBeVisible();
  await t.p.getByLabel("Сынып атауы").fill("E2E Жаңа сынып");
  await t.p.getByRole("button", { name: "Сынып ашу" }).click();
  await expect(t.p.getByText(/лицензия мерзімі аяқталған/i).first()).toBeVisible();
  const [n] = await q("select count(*)::int n from classrooms where org_id = $1", [S.org]);
  expect(n.n).toBe(1); // жаңа сынып жасалмады
  await t.p.goto(`/teacher/classes/${S.classId}?tab=students`);
  await expect(t.p.getByTestId("student-row").filter({ hasText: "E2E Оқушы" })).toHaveCount(1); // бұрынғы дерек оқылады
  // оқушы жаңа сыныпқа қосыла алмайды (жаңа аккаунт)
  const s = await ctx(browser);
  await s.p.goto(`/join?code=${S.code}`);
  await s.p.locator("#name").fill("Кеш Оқушы");
  await s.p.locator("#email").fill(`late-${run}@e2e.qazaqcode.kz`);
  await s.p.locator("#password").fill(PASS);
  await s.p.getByRole("button", { name: "Тіркелу және қосылу" }).click();
  await expect(s.p.getByText(/лицензия/i).first()).toBeVisible();
  await q("update licenses set valid_until = current_date + 365 where org_id = $1", [S.org]);
  await t.c.close(); await s.c.close();
});

test("10. Мобильді экранда негізгі беттер көлденең жылжымайды", async ({ browser }) => {
  const c = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "kk-KZ" });
  const p = await c.newPage();
  await login(p, S.teacherEmail);
  await p.waitForURL(/\/teacher/);
  for (const path of ["/teacher", `/teacher/classes/${S.classId}`, "/teacher/assignments", "/teacher/review"]) {
    await p.goto(path);
    const overflow = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `${path} көлденең жылжиды`).toBeLessThanOrEqual(1);
  }
  await c.close();
  const sc = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "kk-KZ" });
  const sp = await sc.newPage();
  await login(sp, S.studentEmail);
  await sp.waitForURL(/\/student/);
  for (const path of ["/student", "/student/assignments", "/student/grades"]) {
    await sp.goto(path);
    const overflow = await sp.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `${path} көлденең жылжиды`).toBeLessThanOrEqual(1);
  }
  await sc.close();
});
