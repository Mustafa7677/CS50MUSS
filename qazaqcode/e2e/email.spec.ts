import { test, expect, type Page } from "@playwright/test";
import pg from "pg";

// E-mail инфрақұрылымы: мұғалімді e-mail арқылы шақыру -> outbox, қате e-mail, құқықтар, пилот сұрауына автожауап, unsubscribe.
// Іске қосу: DATABASE_URL=... E2E_BASE_URL=http://127.0.0.1:3215 [E2E_EMAIL_OFF_URL=http://127.0.0.1:3216] npx playwright test e2e/email.spec.ts
// Сервер EMAIL_DRIVER=console (немесе smtp) болуы тиіс. E2E_EMAIL_OFF_URL - EMAIL_DRIVER=off сервері (жоқ болса сол тест өткізіледі).
const DB = process.env.DATABASE_URL!;
const OFF = process.env.E2E_EMAIL_OFF_URL || "";
const PASS = "DemoPass123";
const STAMP = Date.now();
const STARTED = new Date(STAMP - 1000).toISOString();
const em = (k: string) => `e2e-mail-${k}-${STAMP}@mailtest.kz`;
let db: pg.Pool;
const sql = async <T = any>(s: string, p: unknown[] = []) => (await db.query(s, p)).rows as T[];
const outbox = (email: string) => sql("select * from public.email_outbox where to_email = $1 order by created_at", [email]);

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(PASS);
  await page.getByRole("button", { name: "Кіру" }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"));
}
async function makeInvite(page: Page, email = "") {
  await page.goto("/school/teachers");
  if (email) await page.locator("#inv-email").fill(email);
  await page.getByRole("button", { name: "Шақыру сілтемесін жасау" }).click();
  const link = page.getByTestId("invite-link");
  await expect(link).toBeVisible();
  return await link.inputValue();
}

test.beforeAll(() => { db = new pg.Pool({ connectionString: DB, max: 3 }); });
test.afterAll(async () => {
  await sql("delete from public.email_outbox where to_email like $1", [`e2e-mail-%-${STAMP}@mailtest.kz`]);
  await sql("delete from public.leads where email like $1", [`e2e-mail-%-${STAMP}@mailtest.kz`]);
  await sql("delete from public.email_suppressions where email_hash = any($1)", [(await sql("select public.email_hash_of(e) h from unnest($1::text[]) e", [[em("unsub"), em("one")]])).map((r) => r.h)]);
  // шақырулар: басқа спектерлерге (школа: «белсенді шақыру жоқ») кедергі болмасын
  await sql("delete from public.invitations where created_at > $1 and accepted_at is null", [STARTED]);
  await db.end();
});

test.describe.serial("e-mail: шақыру, лид жауабы, unsubscribe", () => {
  test("мектеп әкімшісі шақыру сілтемесін e-mail-ге жібереді: outbox-қа жазылады, токен сілтемемен бірдей", async ({ page }) => {
    await login(page, "admin@demo.qazaqcode.kz");
    const link = await makeInvite(page);
    const token = link.split("/invite/")[1];
    await expect(page.getByTestId("invite-send-email")).toBeVisible();
    await page.locator("#inv-send-email").fill(em("inv").toUpperCase());
    await page.getByTestId("invite-send-email").click();
    await expect(page.getByTestId("invite-email-ok")).toContainText("кезекке қойылды");
    const rows = await outbox(em("inv"));
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ template: "teacher_invite", status: "queued", locale: "kk" });
    expect(rows[0].payload.token).toBe(token);
    expect(rows[0].payload.org_name).toBeTruthy();
    // e-mail бар шақыру: өріс алдын ала толады, сол мекенжайға ғана жіберіледі
    const link2 = await makeInvite(page, em("bound"));
    await expect(page.locator("#inv-send-email")).toHaveValue(em("bound"));
    await page.locator("#inv-send-email").fill(em("other"));
    await page.getByTestId("invite-send-email").click();
    await expect(page.getByTestId("invite-email-error")).toContainText("басқа e-mail");
    expect(await outbox(em("other"))).toHaveLength(0);
    void link2;
  });

  test("дұрыс емес e-mail: қате көрсетіледі, outbox-қа ештеңе жазылмайды", async ({ page }) => {
    await login(page, "admin@demo.qazaqcode.kz");
    await makeInvite(page);
    await page.locator("#inv-send-email").evaluate((el: HTMLInputElement) => { el.type = "text"; el.form!.noValidate = true; el.removeAttribute("required"); });
    for (const bad of ["жоқ", "a@b", "a b@c.kz"]) {
      await page.locator("#inv-send-email").fill(bad);
      await page.getByTestId("invite-send-email").click();
      await expect(page.getByTestId("invite-email-error")).toContainText("E-mail мекенжайы дұрыс емес");
    }
    expect(await sql("select count(*)::int n from public.email_outbox where to_email in ('жоқ','a@b','a b@c.kz')")).toEqual([{ n: 0 }]);
  });

  test("құқық: мұғалім шақыру бетіне/RPC-ге жете алмайды, outbox-ты оқи алмайды; аноним бетке кіре алмайды", async ({ page, browser }) => {
    await login(page, "teacher1@demo.qazaqcode.kz");
    await page.goto("/school/teachers");
    await expect(page).not.toHaveURL(/\/school\/teachers/);
    // RPC деңгейі: мұғалім (әкімші емес) forbidden
    const adm = await sql("select u.id from auth.users u where u.email = 'admin@demo.qazaqcode.kz'");
    const tea = await sql("select u.id from auth.users u where u.email = 'teacher1@demo.qazaqcode.kz'");
    const asUser = async (uid: string, s: string, p: unknown[]) => {
      const c = await db.connect();
      try { await c.query("begin"); await c.query("set local role authenticated"); await c.query("select set_config('request.jwt.claims',$1,true)", [JSON.stringify({ sub: uid, role: "authenticated" })]); const r = await c.query(s, p); await c.query("commit"); return r.rows; }
      catch (e) { await c.query("rollback").catch(() => {}); throw e; } finally { c.release(); }
    };
    const org = (await sql("select m.org_id from public.organization_members m where m.user_id = $1 and m.role = 'school_admin'", [adm[0].id]))[0].org_id;
    const tok = (await asUser(adm[0].id, "select public.create_invitation($1,'teacher') t", [org]))[0].t;
    await expect(asUser(tea[0].id, "select public.queue_invitation_email($1,$2)", [tok, em("x")])).rejects.toThrow(/forbidden/);
    await expect(asUser(tea[0].id, "select * from public.email_outbox", [])).rejects.toThrow(/permission denied/);
    expect(await outbox(em("x"))).toHaveLength(0);
    // жасырын контекст: аноним
    const ctx = await browser.newContext({ baseURL: test.info().project.use.baseURL as string });
    const r = await ctx.request.get("/school/teachers", { maxRedirects: 0 });
    expect([302, 303, 307, 308]).toContain(r.status());
    await ctx.close();
  });

  test("пилот сұрауы: сәтті болса lead_ack outbox-та (тек ұйым атауы), дубликатта жауап бірдей, екінші хат жоқ", async ({ browser }) => {
    const ctx = await browser.newContext({ baseURL: test.info().project.use.baseURL as string, locale: "kk-KZ" });
    const page = await ctx.newPage();
    const send = async (org: string) => {
      await page.goto("/schools#request");
      await page.locator("#lead-org").fill(org);
      await page.locator("#lead-contact").fill("Айгүл Сәрсенбай");
      await page.locator("#lead-email").fill(em("lead"));
      await page.locator("#lead-role").selectOption("director");
      await page.locator("#lead-type").selectOption("school");
      await page.locator("#lead-consent").check();
      await page.getByRole("button", { name: "Пилотқа сұрау жіберу" }).click();
      const st = page.locator("#request form [role=status]");
      await expect(st).toBeVisible();
      return await st.innerText();
    };
    const a = await send(`E2E-MAIL ${STAMP} Лицей`);
    const rows = await outbox(em("lead"));
    expect(rows).toHaveLength(1);
    expect(rows[0].template).toBe("lead_ack");
    expect(rows[0].payload).toEqual({ org_name: `E2E-MAIL ${STAMP} Лицей` });
    expect(JSON.stringify(rows[0])).not.toContain("Сәрсенбай");
    const b = await send("Басқа ұйым");
    expect(b).toBe(a);
    expect(await outbox(em("lead"))).toHaveLength(1);
    await ctx.close();
  });

  test("unsubscribe: GET жанама әсерсіз; растағанда suppression; жарамсыз токен; one-click POST", async ({ browser }) => {
    const ctx = await browser.newContext({ baseURL: test.info().project.use.baseURL as string, locale: "kk-KZ" });
    const page = await ctx.newPage();
    await sql("select public.enqueue_email($1,'generic','kk','{\"subject\":\"Сынақ\",\"body\":\"Мәтін\"}')", [em("unsub")]);
    const tok = (await outbox(em("unsub")))[0].unsub_token as string;
    await page.goto(`/unsubscribe/${tok}`);
    await expect(page.getByRole("heading", { name: "Хат алудан бас тарту" })).toBeVisible();
    expect(await sql("select count(*)::int n from public.email_suppressions where email_hash = public.email_hash_of($1)", [em("unsub")])).toEqual([{ n: 0 }]);
    await page.getByRole("button", { name: "Бас тартуды растау" }).click();
    await expect(page.getByTestId("unsub-done")).toBeVisible();
    expect(await sql("select reason from public.email_suppressions where email_hash = public.email_hash_of($1)", [em("unsub")])).toEqual([{ reason: "unsubscribed" }]);
    expect((await outbox(em("unsub")))[0].status).toBe("suppressed");
    // жарамсыз токен
    await page.goto(`/unsubscribe/${"0".repeat(36)}`);
    await page.getByRole("button", { name: "Бас тартуды растау" }).click();
    await expect(page.getByTestId("unsub-invalid")).toBeVisible();
    await page.goto("/unsubscribe/not-a-token");
    await expect(page.getByTestId("unsub-invalid")).toBeVisible();
    // one-click (RFC 8058)
    await sql("select public.enqueue_email($1,'generic','kk','{\"subject\":\"Сынақ\",\"body\":\"Мәтін\"}')", [em("one")]);
    const t2 = (await outbox(em("one")))[0].unsub_token as string;
    expect((await ctx.request.get(`/api/email/unsubscribe/${t2}`)).status()).toBe(405);
    expect((await ctx.request.post(`/api/email/unsubscribe/${"1".repeat(36)}`)).status()).toBe(404);
    expect((await ctx.request.post(`/api/email/unsubscribe/${t2}`)).status()).toBe(200);
    expect((await outbox(em("one")))[0].status).toBe("suppressed");
    await ctx.close();
  });

  test("EMAIL_DRIVER=off серверінде батырма өшірулі, түсініктеме көрсетіледі", async ({ browser }) => {
    test.skip(!OFF, "E2E_EMAIL_OFF_URL орнатылмаған");
    const ctx = await browser.newContext({ baseURL: OFF });
    const page = await ctx.newPage();
    await login(page, "admin@demo.qazaqcode.kz");
    await makeInvite(page);
    await expect(page.getByTestId("invite-send-email")).toBeDisabled();
    await expect(page.getByText("E-mail жіберу бұл ортада қосылмаған")).toBeVisible();
    await ctx.close();
  });
});
