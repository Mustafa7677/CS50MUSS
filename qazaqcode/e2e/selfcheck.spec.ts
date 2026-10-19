import { test, expect, type Page } from "@playwright/test";
import pg from "pg";

// «Жеке тексеру» (браузердегі Pyodide). Production build қажет. Сыртқы желі сұранысы болмауы, жасырын кейістердің ағып кетпеуі,
// шексіз цикл таймауты, CSP және мобиль (390px) тексеріледі. Нәтиже баға емес және серверге жіберілмейді.
const EMAIL = "student4@demo.qazaqcode.kz";
const PASS = "DemoPass123";
const HIDDEN_IN = "HIDDEN_INPUT_77731";
const HIDDEN_OUT = "HIDDEN_EXPECTED_88842";
const db = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
const q = async <T = any>(sql: string, p: unknown[] = []) => (await db.query(sql, p)).rows as T[];
let pyId = "", sqlId = "";
test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  const [u] = await q("select id from auth.users where email = $1", [EMAIL]);
  await q("delete from public.submissions where student_id = $1", [u.id]);
  await q("delete from public.assignments where title like 'SC %'");
  const [cls] = await q("select c.id, c.org_id, c.teacher_id from public.classrooms c where c.name = '10Ә' limit 1");
  const mkA = async (title: string, kind: string, starter: string) => {
    const [a] = await q<{ id: string }>(
      `insert into public.assignments (org_id, created_by, title, description, kind, max_score, starter_code, status) values ($1,$2,$3,'Жеке тексеру тесті',$4::assignment_kind,100,$5,'published') returning id`,
      [cls.org_id, cls.teacher_id, title, kind, starter]);
    await q("insert into public.assignment_targets (org_id, assignment_id, classroom_id) values ($1,$2,$3)", [cls.org_id, a.id, cls.id]);
    return a.id;
  };
  pyId = await mkA("SC Факториал", "python", "");
  sqlId = await mkA("SC SQL", "sql", "select 1");
  const tc = (pos: number, input: string, out: string, hidden: boolean) =>
    q("insert into public.assignment_test_cases (org_id, assignment_id, position, input, expected_output, is_hidden) values ($1,$2,$3,$4,$5,$6)", [cls.org_id, pyId, pos, input, out, hidden]);
  await tc(0, "5", "120", false); await tc(1, "0", "1", false); await tc(2, HIDDEN_IN, HIDDEN_OUT, true);
});
test.afterAll(async () => {
  await q("delete from public.assignments where title like 'SC %'");
  await db.end();
});

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(EMAIL);
  await page.getByLabel("Құпиясөз").fill(PASS);
  await page.getByRole("button", { name: "Кіру" }).click();
  await page.waitForURL(/\/student/);
}
async function setCode(page: Page, code: string) {
  await page.locator(".cm-content").click();
  await page.keyboard.press("Control+A"); await page.keyboard.press("Delete");
  // CodeMirror автошегініс/жақша жабуын айналып өту: кодты clipboard-сыз, бір жолмен теру үшін insertText қолданамыз
  await page.keyboard.insertText(code);
}
const GOOD = "import math\nprint(math.factorial(int(input())))";
function watch(page: Page) {
  const external: string[] = [], csp: string[] = [], urls: string[] = [], posts: string[] = [];
  page.on("request", (r) => {
    const u = new URL(r.url());
    if (!/^(127\.0\.0\.1|localhost)$/.test(u.hostname) && !/^(data|blob):$/.test(u.protocol)) external.push(r.url());
    urls.push(u.pathname);
    if (r.method() === "POST") posts.push(r.postData() ?? "");
  });
  page.on("console", (m) => { if (/Content Security Policy|Refused to/i.test(m.text())) csp.push(m.text()); });
  page.on("pageerror", (e) => { if (/Content Security Policy/i.test(e.message)) csp.push(e.message); });
  return { external, csp, urls, posts };
}

test("дұрыс код өтеді; Pyodide локальді жүктеледі (сыртқы сұраныс жоқ); CSP қатесі жоқ; жасырын кейіс ағып кетпейді", async ({ page }) => {
  test.setTimeout(180_000);
  const w = watch(page); const bodies: string[] = [];
  page.on("response", async (r) => {
    const ct = r.headers()["content-type"] ?? "";
    if (/json|html|text|javascript/.test(ct) && !/pyodide/.test(r.url())) { try { bodies.push(await r.text()); } catch { /* redirect */ } }
  });
  await login(page);
  await page.goto(`/student/assignments/${pyId}`);
  await expect(page.getByTestId("selfcheck")).toBeVisible();
  await expect(page.getByTestId("selfcheck-note")).toContainText("жеке тексеру, түпкілікті баға емес");
  await expect(page.getByTestId("selfcheck-size")).toContainText("13 МБ");
  await expect(page.getByRole("heading", { name: "Мысалдар" })).toBeVisible();
  await setCode(page, GOOD);
  await page.getByTestId("selfcheck-run").click();
  await expect(page.getByTestId("selfcheck-loading")).toBeVisible();
  await expect(page.getByTestId("selfcheck-summary")).toContainText("2 / 2 көрінетін тест өтті", { timeout: 120_000 });
  await expect(page.getByTestId("selfcheck-case-pass")).toHaveCount(2);
  // Pyodide файлдары өз хостымыздан
  expect(w.urls).toContain("/vendor/pyodide/pyodide.js"); expect(w.urls).toContain("/vendor/pyodide/pyodide.asm.wasm");
  expect(w.urls).toContain("/workers/py-runner.js");
  expect(w.external, "сыртқы желі сұранысы болмауы тиіс").toEqual([]);
  expect(w.csp, "CSP бұзылу хабарлары").toEqual([]);
  // нәтиже серверге жіберілмеген
  expect(w.posts.filter((b) => /Өтті|selfcheck|тест өтті/.test(b))).toEqual([]);
  // жасырын кейіс: HTML/network-те жоқ
  expect((await page.content()).includes(HIDDEN_OUT) || (await page.content()).includes(HIDDEN_IN)).toBe(false);
  expect(bodies.some((b) => b.includes(HIDDEN_OUT) || b.includes(HIDDEN_IN))).toBe(false);
});

test("қате код ағып өтпейді: айырмашылық, Python қатесі, желі API жабық, жасырын кейіс орындалмайды", async ({ page }) => {
  test.setTimeout(120_000);
  const w = watch(page);
  await login(page); await page.goto(`/student/assignments/${pyId}`);
  await setCode(page, "n = int(input())\nprint(n * 2)");
  await page.getByTestId("selfcheck-run").click();
  await expect(page.getByTestId("selfcheck-summary")).toContainText("0 / 2", { timeout: 120_000 });
  await expect(page.getByTestId("selfcheck-case-fail")).toHaveCount(2);
  await expect(page.getByTestId("selfcheck-diff").first()).toContainText("1-жол");
  await expect(page.getByTestId("selfcheck-actual").first()).toContainText("10");
  await expect(page.getByTestId("selfcheck-note")).toContainText("түпкілікті баға емес");
  // синтаксис/орындау қатесі
  await setCode(page, "print(жоқ_айнымалы)");
  await page.getByTestId("selfcheck-run").click();
  await expect(page.getByTestId("selfcheck-case-error").first()).toContainText("NameError", { timeout: 120_000 });
  await expect(page.getByTestId("selfcheck-summary")).toContainText("0 / 2");
  // желіге шығу әрекеті: нәтижесі өтпеді және сыртқы сұраныс жоқ
  await setCode(page, "import js\njs.fetch('https://example.com/x')\nprint(input())");
  await page.getByTestId("selfcheck-run").click();
  await expect(page.getByTestId("selfcheck-case-error").first()).toBeVisible({ timeout: 120_000 });
  await setCode(page, "import urllib.request\nprint(urllib.request.urlopen('https://example.com').read())");
  await page.getByTestId("selfcheck-run").click();
  await expect(page.getByTestId("selfcheck-case-error").first()).toBeVisible({ timeout: 120_000 });
  expect(w.external).toEqual([]);
  expect(w.csp).toEqual([]);
});

test("шексіз цикл таймаутпен тоқтайды, бет қатпайды, келесі іске қосу істейді", async ({ page }) => {
  test.setTimeout(180_000);
  await login(page); await page.goto(`/student/assignments/${pyId}`);
  await setCode(page, "while True:\n    pass");
  const t0 = Date.now();
  await page.getByTestId("selfcheck-run").click();
  // орындалу кезінде бет жауап береді (main ағын бос)
  await expect(page.getByTestId("selfcheck-running")).toBeVisible({ timeout: 120_000 });
  const ping = await page.evaluate(() => new Promise<number>((res) => { const s = performance.now(); setTimeout(() => res(performance.now() - s), 50); }));
  expect(ping).toBeLessThan(1000);
  await expect(page.getByTestId("selfcheck-case-timeout")).toHaveCount(1, { timeout: 20_000 });
  await expect(page.getByTestId("selfcheck-case-skipped")).toHaveCount(1);
  await expect(page.getByTestId("selfcheck-run")).toBeEnabled();
  expect(Date.now() - t0).toBeLessThan(60_000);
  await expect(page.getByTestId("selfcheck-case-timeout")).toContainText("Уақыт өтті");
  // кодты түзетіп қайта жүгірту
  await setCode(page, GOOD);
  await page.getByTestId("selfcheck-run").click();
  await expect(page.getByTestId("selfcheck-summary")).toContainText("2 / 2", { timeout: 120_000 });
  // Тоқтату батырмасы
  await setCode(page, "while True:\n    pass");
  await page.getByTestId("selfcheck-run").click();
  await page.getByTestId("selfcheck-stop").click();
  await expect(page.getByTestId("selfcheck-run")).toBeEnabled();
});

test("«Жіберу» өзгермейді: жібергеннен кейін жеке тексеру нәтижесі баға болмайды; SQL тапсырмада батырма жоқ", async ({ page }) => {
  test.setTimeout(150_000);
  await login(page);
  await page.goto(`/student/assignments/${sqlId}`);
  await expect(page.getByTestId("selfcheck")).toHaveCount(0);
  await page.goto(`/student/assignments/${pyId}`);
  await setCode(page, GOOD);
  await page.getByTestId("selfcheck-run").click();
  await expect(page.getByTestId("selfcheck-summary")).toContainText("2 / 2", { timeout: 120_000 });
  await page.getByRole("button", { name: "Жіберу", exact: true }).click();
  await page.getByRole("button", { name: "Иә, жіберу" }).click();
  await expect(page.getByRole("button", { name: "Жіберу", exact: true })).toHaveCount(0);
  const rows = await q("select s.status, s.code, g.score from public.submissions s left join public.grades g on g.submission_id = s.id where s.assignment_id = $1", [pyId]);
  expect(rows).toHaveLength(1); expect(rows[0].status).toBe("submitted"); expect(rows[0].score).toBeNull();
  await expect(page.getByTestId("selfcheck")).toHaveCount(0); // жіберілгеннен кейін өңдеу жоқ - жеке тексеру де жоқ
});

test("worker/vendor тақырыптары: қатаң CSP, wasm MIME, кэш; бет CSP-інде worker-src 'self' және сыртқы көз жоқ", async ({ request }) => {
  const w = await request.get("/workers/py-runner.js");
  expect(w.status()).toBe(200);
  const wc = w.headers()["content-security-policy"] ?? "";
  expect(wc).toContain("default-src 'none'"); expect(wc).toContain("'wasm-unsafe-eval'"); expect(wc).not.toContain("'unsafe-eval'"); expect(wc).not.toMatch(/https?:/);
  const wasm = await request.get("/vendor/pyodide/pyodide.asm.wasm");
  expect(wasm.headers()["content-type"]).toContain("application/wasm");
  expect(wasm.headers()["cache-control"]).toContain("immutable");
  const lic = await request.get("/vendor/pyodide/LICENSE-NOTICE"); expect(lic.status()).toBe(200);
  const page = await request.get("/login");
  const csp = page.headers()["content-security-policy"] ?? "";
  expect(csp).toContain("worker-src 'self'"); expect(csp).not.toContain("blob:".concat(" ").concat("worker")); expect(/worker-src[^;]*(https?:|\*|blob:)/.test(csp)).toBe(false);
  expect(/script-src[^;]*(https?:|unsafe-eval|wasm-unsafe-eval)/.test(csp)).toBe(false);
});

test("мобильде (390px): батырма көрінеді, көлденең айналу жоқ, нәтиже сыяды", async ({ browser }) => {
  test.setTimeout(150_000);
  await q("delete from public.submissions where assignment_id = $1", [pyId]); // алдыңғы тест жіберген жұмыс: қайтадан өңделетін күй
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "kk-KZ" });
  const page = await ctx.newPage(); const w = watch(page);
  await login(page); await page.goto(`/student/assignments/${pyId}`);
  await setCode(page, "print(int(input()) * 2)");
  await page.getByTestId("selfcheck-run").scrollIntoViewIfNeeded();
  await expect(page.getByTestId("selfcheck-run")).toBeVisible();
  await page.getByTestId("selfcheck-run").click();
  await expect(page.getByTestId("selfcheck-summary")).toContainText("0 / 2", { timeout: 120_000 });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  expect(w.csp).toEqual([]);
  await ctx.close();
});
