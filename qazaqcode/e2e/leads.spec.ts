import { test, expect, type Browser, type Page } from "@playwright/test";
import pg from "pg";

// «Пилот сұрауы» воронкасы: /schools#request формасы + /admin/leads (SUPER ADMIN). Демо дерек қажет (scripts/seed-demo.mjs).
// Іске қосу: DATABASE_URL=... E2E_BASE_URL=http://127.0.0.1:3209 [E2E_RL_BASE_URL=http://127.0.0.1:3219] npx playwright test e2e/leads.spec.ts
// E2E_RL_BASE_URL - rate limit ҚОСУЛЫ жеке сервер; жоқ болса rate limit тесті өткізіледі (тек валидация тексеріледі).
const DB = process.env.DATABASE_URL!;
const RL = process.env.E2E_RL_BASE_URL || "";
const PASS = "DemoPass123";
const STAMP = Date.now();
const MARK = `E2E${STAMP}`;
const em = (k: string) => `e2e-${k}-${STAMP}@leadtest.kz`;
let db: pg.Pool;
const sql = async <T = any>(s: string, p: unknown[] = []) => (await db.query(s, p)).rows as T[];
const rows = (email: string) => sql("select * from public.leads where email = $1", [email]);

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(PASS);
  await page.getByRole("button", { name: "Кіру" }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"));
}
async function fresh(browser: Browser, base?: string, viewport?: { width: number; height: number }) {
  const ctx = await browser.newContext({ baseURL: base ?? (test.info().project.use.baseURL as string), locale: "kk-KZ", viewport });
  return { ctx, page: await ctx.newPage() };
}
async function fill(page: Page, o: { org?: string; contact?: string; email?: string; phone?: string; role?: string; type?: string; students?: string; message?: string; consent?: boolean } = {}) {
  await page.locator("#lead-org").fill(o.org ?? `${MARK} Мектеп`);
  await page.locator("#lead-contact").fill(o.contact ?? "Айгүл Сәрсенбай");
  await page.locator("#lead-email").fill(o.email ?? em("a"));
  if (o.phone) await page.locator("#lead-phone").fill(o.phone);
  await page.locator("#lead-role").selectOption(o.role ?? "director");
  await page.locator("#lead-type").selectOption(o.type ?? "school");
  if (o.students) await page.locator("#lead-students").fill(o.students);
  if (o.message) await page.locator("#lead-message").fill(o.message);
  if (o.consent !== false) await page.locator("#lead-consent").check();
}
const noBrowserValidation = (page: Page) => page.locator("#request form").evaluate((f: HTMLFormElement) => { f.noValidate = true; f.querySelectorAll("[required]").forEach((e) => e.removeAttribute("required")); });
const alertOf = (page: Page) => page.locator("#request form [role=alert]");
const statusOf = (page: Page) => page.locator("#request form [role=status]");
const submit = (page: Page) => page.getByRole("button", { name: "Пилотқа сұрау жіберу" }).click();

test.beforeAll(() => { db = new pg.Pool({ connectionString: DB, max: 3 }); });
test.afterAll(async () => {
  await sql("delete from public.leads where email like $1 or org_name like $2", [`e2e-%-${STAMP}@leadtest.kz`, `${MARK}%`]);
  await db.end();
});

test.describe.serial("пилот сұрау формасы", () => {
  test("форма #request секциясында, барлық өріс label-мен", async ({ browser }) => {
    const { ctx, page } = await fresh(browser);
    await page.goto("/schools#request");
    await expect(page.locator("#request")).toBeVisible();
    for (const id of ["lead-org", "lead-contact", "lead-email", "lead-phone", "lead-role", "lead-type", "lead-students", "lead-message", "lead-consent"]) {
      await expect(page.getByLabel(await page.locator(`label[for="${id}"]`).first().innerText(), { exact: false }).first()).toBeVisible();
    }
    await expect(page.locator("#request")).toContainText("365 күннен кейін өшіріледі");
    await expect(page.locator("#request")).toContainText("үшінші тарапқа берілмейді");
    // honeypot көрінбейді және фокус алмайды
    const hp = page.locator("#lead-website");
    await expect(hp).toHaveAttribute("tabindex", "-1");
    expect(await hp.evaluate((e) => e.closest("[aria-hidden='true']") !== null)).toBe(true);
    await ctx.close();
  });

  test("қате валидация: дұрыс емес e-mail, оқушы саны, келісімсіз - қазақша қате (role=alert), жол жасалмайды", async ({ browser }) => {
    const { ctx, page } = await fresh(browser);
    await page.goto("/schools");
    await noBrowserValidation(page);
    await fill(page, { email: "дұрыс-емес" });
    await submit(page);
    await expect(alertOf(page)).toContainText("E-mail");
    await expect(page.locator("#lead-org")).toHaveValue(`${MARK} Мектеп`);   // қате кезінде енгізілген деректер жоғалмайды
    await page.locator("#lead-email").fill(em("bad"));
    await page.locator("#lead-students").fill("0");
    await submit(page);
    await expect(alertOf(page)).toContainText("Оқушы саны");
    await page.locator("#lead-students").fill("100");
    await page.locator("#lead-consent").uncheck();
    await submit(page);
    await expect(alertOf(page)).toContainText("келісім");
    await page.locator("#lead-consent").check();
    await page.locator("#lead-message").fill("а".repeat(1001));
    await page.locator("#lead-message").evaluate((e) => e.removeAttribute("maxlength"));
    await page.locator("#lead-message").fill("а".repeat(1001));
    await submit(page);
    await expect(alertOf(page)).toContainText("1000");
    expect((await rows(em("bad"))).length).toBe(0);
    await ctx.close();
  });

  test("браузер валидациясы: бос форма жіберілмейді (required)", async ({ browser }) => {
    const { ctx, page } = await fresh(browser);
    await page.goto("/schools");
    await submit(page);
    expect(await page.locator("#lead-org").evaluate((e: HTMLInputElement) => e.validity.valueMissing)).toBe(true);
    await expect(statusOf(page)).toHaveCount(0);
    await ctx.close();
  });

  test("дұрыс сұрау жіберіледі: растау хабары, дерекқорда жол, форма тазаланады", async ({ browser }) => {
    const { ctx, page } = await fresh(browser);
    await page.goto("/schools");
    await fill(page, { email: em("a").toUpperCase(), phone: "+7 701 123 45 67", students: "450", message: "Бізге пилот қажет", role: "deputy", type: "college" });
    await submit(page);
    await expect(statusOf(page).filter({ hasText: "қабылданды" })).toBeVisible();
    const r = await rows(em("a"));
    expect(r.length).toBe(1);
    expect(r[0]).toMatchObject({ org_name: `${MARK} Мектеп`, role: "deputy", org_type: "college", students_estimate: 450, status: "new", consent: true, phone: "+7 701 123 45 67" });
    await expect(page.locator("#lead-org")).toHaveValue("");
    await ctx.close();
  });

  test("қайталанған e-mail: сәтті деп көрінеді, бірақ жаңа жол ашылмайды", async ({ browser }) => {
    const { ctx, page } = await fresh(browser);
    await page.goto("/schools");
    await fill(page, { org: `${MARK} Басқа ұйым`, email: em("a") });
    await submit(page);
    await expect(statusOf(page).filter({ hasText: "қабылданды" })).toBeVisible();
    expect((await rows(em("a"))).length).toBe(1);
    expect((await sql("select count(*)::int n from public.leads where org_name = $1", [`${MARK} Басқа ұйым`]))[0].n).toBe(0);
    await ctx.close();
  });

  test("honeypot: бот қабылдағандай көрінеді, бірақ ештеңе сақталмайды", async ({ browser }) => {
    const { ctx, page } = await fresh(browser);
    await page.goto("/schools");
    await fill(page, { email: em("bot") });
    await page.locator("#lead-website").evaluate((e: HTMLInputElement) => { e.value = "https://spam.example"; });
    await submit(page);
    await expect(statusOf(page)).toBeVisible();
    expect((await rows(em("bot"))).length).toBe(0);
    await ctx.close();
  });

  test("rate limit: IP бойынша 4 сұраудан кейін бұғатталады (E2E_RL_BASE_URL қажет)", async ({ browser }) => {
    test.skip(!RL, "rate limit ҚОСУЛЫ жеке сервер жоқ (E2E_RL_BASE_URL): тек валидация тексерілді");
    const { ctx, page } = await fresh(browser, RL);
    await page.goto("/schools");
    for (let i = 0; i < 4; i++) {
      await fill(page, { email: em(`rl${i}`), org: `${MARK} RL${i}` });
      await submit(page);
      await expect(statusOf(page).filter({ hasText: "қабылданды" })).toBeVisible();
      await page.waitForTimeout(100);
    }
    await fill(page, { email: em("rl4"), org: `${MARK} RL4` });
    await submit(page);
    await expect(alertOf(page)).toContainText("Тым жиі");
    expect((await rows(em("rl4"))).length).toBe(0);
    await ctx.close();
  });
});

test.describe.serial("/admin/leads (SUPER ADMIN)", () => {
  let id: string;
  test.beforeAll(async () => {
    // CSV инъекциясын тексеру үшін формуласы бар ұйым (анонимді RPC арқылы, нақты жолмен)
    await sql("select public.submit_lead($1,$2,$3,$4,'it','other',null,$5,true,'e2e')", [`${MARK} =HYPERLINK("http://x.kz")`, "+Қауіпті Ат", em("csv"), "-123456", "@SUM(1+1)"]);
    id = (await rows(em("a")))[0].id;
  });

  test("тізімде нақты сұрау көрінеді, воронка саны дерекқормен сәйкес, сүзгі мен іздеу жұмыс істейді", async ({ browser }) => {
    const { ctx, page } = await fresh(browser);
    await login(page, "root@demo.qazaqcode.kz");
    await page.goto("/admin/leads");
    await expect(page.getByRole("heading", { name: "Пилот сұраулары" })).toBeVisible();
    await expect(page.locator(`[data-lead-id="${id}"]`)).toContainText(`${MARK} Мектеп`);
    await expect(page.locator(`[data-lead-id="${id}"]`)).toContainText(em("a"));
    const db_ = await sql<{ status: string; n: number }>("select status, count(*)::int n from public.leads group by 1");
    const want = (s: string) => String(db_.find((r) => r.status === s)?.n ?? 0);
    const label: Record<string, string> = { new: "Жаңа", contacted: "Байланыс орнатылды", demo: "Демо", pilot: "Пилот", won: "Сатылды", lost: "Жоғалды" };
    for (const [s, l] of Object.entries(label)) {
      await expect(page.locator('section[aria-label="Воронка"] .card').filter({ hasText: l }).locator("p").nth(1)).toHaveText(want(s));
    }
    await page.locator("#f-q").fill(em("a"));
    await page.getByRole("button", { name: "Сүзу" }).click();
    await expect(page.locator('[data-testid="lead"]')).toHaveCount(1);
    await page.locator("#f-q").fill("жоқ-мұндай-ұйым-zzz");
    await page.getByRole("button", { name: "Сүзу" }).click();
    await expect(page.getByText("Сұраныс бойынша ештеңе табылмады")).toBeVisible();
    await page.goto("/admin/leads?status=won");
    await expect(page.locator(`[data-lead-id="${id}"]`)).toHaveCount(0);
    await ctx.close();
  });

  test("статус ауыстыру және жазба сақталады, аудитте мазмұнсыз жазба", async ({ browser }) => {
    const { ctx, page } = await fresh(browser);
    await login(page, "root@demo.qazaqcode.kz");
    await page.goto("/admin/leads");
    const card = page.locator(`[data-lead-id="${id}"]`);
    await card.locator("select").selectOption("demo");
    await card.locator("textarea").fill("Сәрсенбіде демо");
    await card.getByRole("button", { name: "Сақтау" }).click();
    await expect(card.getByRole("status")).toContainText("Сақталды");
    const [r] = await rows(em("a"));
    expect(r.status).toBe("demo"); expect(r.notes).toBe("Сәрсенбіде демо");
    const a = await sql("select * from public.audit_logs where action='lead.status' and entity_id=$1", [id]);
    expect(a.length).toBeGreaterThan(0);
    expect(JSON.stringify(a)).not.toContain("leadtest.kz");
    await page.goto("/admin/leads?status=demo");
    await expect(page.locator(`[data-lead-id="${id}"]`)).toBeVisible();
    await ctx.close();
  });

  test("CSV: құрамы дұрыс, формула инъекциясынан қорғалған, экспорт аудитке жазылады", async ({ browser }) => {
    const { ctx, page } = await fresh(browser);
    await login(page, "root@demo.qazaqcode.kz");
    const before = (await sql("select count(*)::int n from public.audit_logs where action='lead.export'"))[0].n;
    const res = await page.request.get("/admin/leads/export");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("text/csv");
    const t = await res.text();
    expect(t.startsWith("﻿Күні,Ұйым,Түрі,Байланыс адамы,E-mail")).toBe(true);
    expect(t).toContain(em("a"));
    expect(t).toContain("Сәрсенбіде демо");
    expect(t).toContain("Демо");
    // = + - @ басталатын ұяшықтарға ' қосылған
    expect(t).toContain("'+Қауіпті Ат");
    expect(t).toContain("'-123456");
    expect(t).toContain("'@SUM(1+1)");
    for (const line of t.replace(/^﻿/, "").split("\r\n").slice(1)) {
      for (const cell of line.match(/("([^"]|"")*"|[^,]*)(,|$)/g) ?? []) {
        const c = cell.replace(/,$/, "").replace(/^"/, "");
        expect(c).not.toMatch(/^[=+\-@\t\r]/);
      }
    }
    const filtered = await (await page.request.get("/admin/leads/export?status=demo")).text();
    expect(filtered).toContain(em("a")); expect(filtered).not.toContain(em("csv"));
    const after = (await sql("select count(*)::int n from public.audit_logs where action='lead.export'"))[0].n;
    expect(after).toBe(before + 2);
    await ctx.close();
  });

  test("жою (ConfirmButton): растаудан кейін жол өшеді", async ({ browser }) => {
    const { ctx, page } = await fresh(browser);
    await login(page, "root@demo.qazaqcode.kz");
    const [{ id: cid }] = await rows(em("csv"));
    await page.goto("/admin/leads");
    const card = page.locator(`[data-lead-id="${cid}"]`);
    await card.getByRole("button", { name: "Жою", exact: true }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Иә, жою" }).click();
    await expect(card).toHaveCount(0);
    expect((await rows(em("csv"))).length).toBe(0);
    await ctx.close();
  });

  test("оқушы /admin/leads-ке кіре алмайды, CSV 403, аноним 401; мәліметтер көрінбейді", async ({ browser }) => {
    const { ctx, page } = await fresh(browser);
    await login(page, "student1@demo.qazaqcode.kz");
    await page.goto("/admin/leads");
    expect(new URL(page.url()).pathname.startsWith("/admin")).toBe(false);
    expect(await page.content()).not.toContain(em("a"));
    const r = await page.request.get("/admin/leads/export");
    expect(r.status()).toBe(403);
    expect(await r.text()).not.toContain("leadtest.kz");
    const anon = await fresh(browser);
    expect((await anon.page.request.get("/admin/leads/export", { maxRedirects: 0 })).status()).toBe(401);
    await anon.page.goto("/admin/leads");
    expect(anon.page.url()).toContain("/login");
    await anon.ctx.close();
    // мектеп әкімшісі де кіре алмайды
    const ad = await fresh(browser);
    await login(ad.page, "admin@demo.qazaqcode.kz");
    await ad.page.goto("/admin/leads");
    expect(new URL(ad.page.url()).pathname.startsWith("/admin")).toBe(false);
    await ad.ctx.close();
    await ctx.close();
  });
});

test("390px: /schools#request және /admin/leads көлденең айналмайды", async ({ browser }) => {
  const { ctx, page } = await fresh(browser, undefined, { width: 390, height: 844 });
  const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  await page.goto("/schools#request");
  await expect(page.locator("#lead-org")).toBeVisible();
  expect(await overflow()).toBeLessThanOrEqual(0);
  await login(page, "root@demo.qazaqcode.kz");
  await sql("select public.submit_lead($1,$2,$3,null,'teacher','academy',10,$4,true,'e2e')", [`${MARK} ${"Ұзынатау".repeat(12)}`, "Ұзын Ат", em("long"), "ұзынсөз".repeat(40)]);
  await page.goto("/admin/leads");
  await expect(page.getByRole("heading", { name: "Пилот сұраулары" })).toBeVisible();
  expect(await overflow()).toBeLessThanOrEqual(0);
  await ctx.close();
});
