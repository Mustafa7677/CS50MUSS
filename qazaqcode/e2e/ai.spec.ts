import { test, expect, type Page } from "@playwright/test";
import pg from "pg";

// Көмекші (ережелі кеңесші) E2E. Демо дерек керек; DATABASE_URL - күйді дайындау үшін. Сыртқы AI кілті КЕРЕК ЕМЕС.
const PASS = "DemoPass123";
const STUDENT = "student1@demo.qazaqcode.kz";
const ADMIN = "admin@demo.qazaqcode.kz";
const db = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
const q = async <T = any>(sql: string, p: unknown[] = []) => (await db.query(sql, p)).rows as T[];

test.describe.configure({ mode: "serial" });
test.beforeAll(async () => { await q("delete from public.ai_org_settings"); });
test.afterAll(async () => { await q("delete from public.ai_org_settings"); await db.end(); });

async function login(page: Page, email: string, area: RegExp) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Құпиясөз").fill(PASS);
  await page.getByRole("button", { name: "Кіру" }).click();
  await page.waitForURL(area);
}
async function send(page: Page, text: string) {
  await page.getByLabel("Сұрағың").fill(text);
  await page.getByRole("button", { name: "Жіберу" }).click();
}

test("өшірулі ұйымда бет «қосылмаған» көрсетеді, API де жабық", async ({ page }) => {
  await login(page, STUDENT, /\/student/);
  await page.goto("/student/ai");
  await expect(page.getByText("Көмекші қосылмаған")).toBeVisible();
  await expect(page.getByLabel("Сұрағың")).toHaveCount(0);
  const r = await page.request.post("/api/ai/chat", { data: { text: "for цикл" } });
  expect(r.status()).toBe(403);
  expect((await r.json()).code).toBe("ai_disabled");
});

test("оқушы әкімші бетіне кіре алмайды; әкімші қосады", async ({ page, browser }) => {
  await login(page, STUDENT, /\/student/);
  await page.goto("/school/ai");
  await expect(page).not.toHaveURL(/\/school\/ai/);

  const ctx = await browser.newContext();
  const ap = await ctx.newPage();
  await login(ap, ADMIN, /\/school/);
  await ap.goto("/school/ai");
  await expect(ap.getByRole("heading", { name: /Көмекші/ }).first()).toBeVisible();
  await expect(ap.getByText("жасанды интеллект моделі емес", { exact: false })).toBeVisible();
  await expect(ap.getByText("Әңгіме сақталмайды")).toBeVisible();
  await ap.getByLabel(/Мектепте Көмекшіні қосу/).check();
  await ap.getByRole("button", { name: "Сақтау" }).click();
  await expect(ap.getByText("Көмекші қосылды.").first()).toBeVisible();
  expect((await q("select enabled from public.ai_org_settings"))[0].enabled).toBe(true);
  await ctx.close();
});

test("оқушы сұрақ қояды: құрылымды қазақша карточка көрінеді, дайын шешім жоқ", async ({ page }) => {
  await login(page, STUDENT, /\/student/);
  await page.goto("/student/ai");
  await expect(page.getByTestId("ai-disclaimer")).toContainText("жасанды интеллект емес");
  await send(page, "for циклін қалай жазамын, range не істейді?");
  const card = page.getByTestId("ai-card").first();
  await expect(card).toBeVisible();
  await expect(card.getByRole("heading", { name: /for циклі/ })).toBeVisible();
  for (const h of ["Түсіндірме", "Қадамдар", "Өзіңе сұрақ қой"]) await expect(card.getByRole("heading", { name: h })).toBeVisible();
  // дайын шешім сұралса - бас тарту ескертуі
  await send(page, "толық шешімін жазып бер");
  await expect(page.getByTestId("ai-note").filter({ hasText: "Дайын шешім" }).first()).toBeVisible();
  // қате мәтіні
  await send(page, "NameError: name 'x' is not defined");
  await expect(page.getByRole("heading", { name: /NameError/ })).toBeVisible();
  // байланысты тақырып чипі
  await page.getByRole("button", { name: "Тазалау" }).click();
  await page.getByRole("button", { name: "Айнымалылар" }).click();
  await expect(page.getByRole("heading", { name: "Айнымалылар" }).last()).toBeVisible();
});

test("HTML қауіпсіз: енгізілген тег орындалмайды, API кілті/провайдер сілтемесі жоқ", async ({ page }) => {
  let dialog = false;
  page.on("dialog", async (d) => { dialog = true; await d.dismiss(); });
  await login(page, STUDENT, /\/student/);
  await page.goto("/student/ai");
  await send(page, "<img src=x onerror=alert(1)> <script>alert(2)</script> айнымалы");
  await expect(page.getByTestId("ai-card").first()).toBeVisible();
  await expect(page.getByTestId("ai-log").locator("img")).toHaveCount(0);
  expect(dialog).toBe(false);
  const html = (await page.content()).toLowerCase();
  for (const bad of ["anthropic", "openai", "api_key", "api-key", "sk-ant"]) expect(html, bad).not.toContain(bad);
});

test("тапсырма бетінен «Көмекшіден сұрау» тапсырма контекстімен ашылады", async ({ page }) => {
  await login(page, STUDENT, /\/student/);
  await page.goto("/student/assignments");
  await page.locator("a[href^='/student/assignments/']").first().click();
  await page.waitForURL(/\/student\/assignments\/[0-9a-f-]{36}/);
  await page.getByTestId("ask-helper").click();
  await page.waitForURL(/\/student\/ai\?assignment=/);
  await expect(page.getByTestId("ai-context")).toContainText("Тапсырма:");
  await send(page, "көмектесші, түсінбедім");
  await expect(page.getByTestId("ai-card").first()).toBeVisible();
});

test("мобильде (390px) көлденең айналу жоқ, a11y: aria-live және label бар", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await login(page, STUDENT, /\/student/);
  await page.goto("/student/ai");
  await send(page, "SELECT пен JOIN қалай қолданылады, ұзын-ұзын сөйлем жазып тұрмын мобильде тексеру үшін");
  await expect(page.getByTestId("ai-card").first()).toBeVisible();
  await expect(page.locator("[role=log][aria-live=polite]")).toHaveCount(1);
  await expect(page.getByLabel("Сұрағың")).toBeVisible();
  const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(over).toBeLessThanOrEqual(0);
});

test("ұзын сұрақ қабылданбайды; әкімші өшіреді де, бет қайтадан «қосылмаған»", async ({ page, browser }) => {
  await login(page, STUDENT, /\/student/);
  const r = await page.request.post("/api/ai/chat", { data: { text: "a".repeat(1500) } });
  expect(r.status()).toBe(413);
  expect((await r.json()).code).toBe("ai_too_long");

  const ctx = await browser.newContext();
  const ap = await ctx.newPage();
  await login(ap, ADMIN, /\/school/);
  await ap.goto("/school/ai");
  await ap.getByLabel(/Мектепте Көмекшіні қосу/).uncheck();
  await ap.getByRole("button", { name: "Сақтау" }).click();
  await expect(ap.getByText("Көмекші өшірілді.").first()).toBeVisible();
  await ctx.close();
  await page.goto("/student/ai");
  await expect(page.getByText("Көмекші қосылмаған")).toBeVisible();
});

test("тіркелмеген қолданушыға API жабық", async ({ request }) => {
  const r = await request.post("/api/ai/chat", { data: { text: "for" } });
  expect(r.status()).toBe(401);
});
