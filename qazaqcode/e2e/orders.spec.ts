import { test, expect, type Browser, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import pg from "pg";

// Табыс арнасы: тапсырыс -> баға -> шот PDF -> төленді -> активтенді -> лицензия жаңарды; құқықтар; 390px; CSV; еске салғыш.
// Өз ұйымын жасайды, соңында өшіреді (бағалар мен сатушы профилі глобалды: бастапқы күйі қалпына келтіріледі). DATABASE_URL (superuser) керек.
const PASS = "OrderPass123";
const db = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 3 });
const q = async <T = any>(sql: string, p: unknown[] = []) => (await db.query(sql, p)).rows as T[];
const run = Date.now().toString(36);
const E = (n: string) => `${n}-${run}@ord.qazaqcode.kz`;
const ORG = `Тапсырыс Мектеп ${run}`;
const LEGAL = `=ТАПСЫРЫС КММ ${run}`;                       // CSV формула қорғанысын тексеру үшін әдейі «=» мен басталады
const SELLER_NAME = `Тест Сатушы ЖШС ${run}`;
const S: Record<string, any> = {};

async function asUser<T>(uid: string, sql: string, params: unknown[]): Promise<T[]> {
  const c = await db.connect();
  try {
    await c.query("begin"); await c.query("set local role authenticated");
    await c.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify({ sub: uid, role: "authenticated" })]);
    const r = await c.query(sql, params); await c.query("commit"); return r.rows as T[];
  } catch (e) { await c.query("rollback").catch(() => {}); throw e; } finally { c.release(); }
}
const mkUser = async (email: string, name: string) => (await q("select auth_dev.sign_up($1,$2,$3) as id", [email, PASS, name]))[0].id as string;
async function sess(browser: Browser, email: string, home: RegExp, width?: number) {
  const ctx = await browser.newContext({ baseURL: test.info().project.use.baseURL, locale: "kk-KZ", viewport: width ? { width, height: 844 } : undefined });
  const page = await ctx.newPage();
  await page.goto("/login");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(PASS);
  await page.getByRole("button", { name: "Кіру" }).click();
  await page.waitForURL(home);
  return { ctx, page };
}
const noHScroll = async (page: Page) => expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
const card = (page: Page) => page.locator(`[data-testid=admin-order][data-org="${ORG}"]`).first();
const confirm = async (page: Page, trigger: string, ok: string) => {
  await page.getByRole("button", { name: trigger, exact: true }).click();
  await page.locator("dialog[open]").getByRole("button", { name: ok, exact: true }).click();
};
const pdfText = (buf: Buffer) => {
  const f = path.join(os.tmpdir(), `ord-${run}-${Math.random().toString(36).slice(2)}.pdf`);
  fs.writeFileSync(f, buf);
  try { return execFileSync("pdftotext", ["-layout", f, "-"], { encoding: "utf8" }); } finally { fs.rmSync(f, { force: true }); }
};

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  S.sellerBefore = (await q("select * from platform_seller_profile"))[0] ?? null;
  await q("delete from platform_seller_profile");                       // «сатушы профилі жоқ» күйінен бастаймыз
  S.pricesBefore = await q("select * from platform_prices");
  await q("delete from platform_prices");
  S.root = await mkUser(E("root"), "Тапсырыс Платформа Әкімші");
  await q("insert into platform_admins(user_id) values ($1)", [S.root]);
  const valid = new Date(Date.now() + 20 * 864e5).toISOString().slice(0, 10);
  const r = (await asUser<any>(S.root, "select public.create_organization($1,$2,'starter',$3) as r", [ORG, `ord-${run}`, valid]))[0].r;
  S.org = r.org_id; S.valid = valid;
  S.admin = await mkUser(E("admin"), "Тапсырыс Әкімші");
  await asUser(S.admin, "select public.accept_invitation($1)", [r.admin_invite_token]);
  const t = (await asUser<any>(S.admin, "select public.create_invitation($1,'teacher') as t", [S.org]))[0].t;
  S.teacher = await mkUser(E("teacher"), "Тапсырыс Мұғалім");
  await asUser(S.teacher, "select public.accept_invitation($1)", [t]);
  const r2 = (await asUser<any>(S.root, "select public.create_organization($1,$2,'starter',$3) as r", [`${ORG} B`, `ordb-${run}`, valid]))[0].r;
  S.orgB = r2.org_id;
  S.adminB = await mkUser(E("adminb"), "Басқа Әкімші");
  await asUser(S.adminB, "select public.accept_invitation($1)", [r2.admin_invite_token]);
});
test.afterAll(async () => {
  await q("delete from organizations where id = any($1)", [[S.org, S.orgB]]);
  await q("delete from platform_prices");
  await q("delete from platform_seller_profile");
  for (const p of S.pricesBefore ?? []) await q(`insert into platform_prices(id,plan,months,student_limit,price_tiyn,currency,vat_mode,vat_rate_bp,valid_from,valid_until,active) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    [p.id, p.plan, p.months, p.student_limit, p.price_tiyn, p.currency, p.vat_mode, p.vat_rate_bp, p.valid_from, p.valid_until, p.active]);
  const s = S.sellerBefore;
  if (s) await q(`insert into platform_seller_profile(id,legal_name,bin_iin,address,bank_name,bik,iik,kbe,vat_payer,vat_cert,director_name,contact_email,contact_phone,payment_terms_days) values (true,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
    [s.legal_name, s.bin_iin, s.address, s.bank_name, s.bik, s.iik, s.kbe, s.vat_payer, s.vat_cert, s.director_name, s.contact_email, s.contact_phone, s.payment_terms_days]);
  await q("delete from invoice_counters where year = -1");
  await q("delete from auth.users where email like $1", [`%-${run}@ord.qazaqcode.kz`]);
  await q("delete from platform_admins where user_id = $1", [S.root]);
  await db.end();
});

test("мектеп әкімшісі: лицензия бетінде «Лицензияны жаңарту»; реквизитсіз тапсырыс берілмейді, қате реквизит қабылданбайды", async ({ browser }) => {
  const { ctx, page } = await sess(browser, E("admin"), /\/school/);
  await page.goto("/school/licence");
  await page.getByTestId("renew-licence").click();
  await expect(page).toHaveURL(/\/school\/licence\/order$/);
  await expect(page.getByTestId("order-current")).toContainText("STARTER");
  await expect(page.getByTestId("price-list")).toContainText("Баға келісім бойынша");   // баға қойылмаған - жалған баға жоқ
  await expect(page.getByText("Әзірге тапсырыс жоқ")).toBeVisible();
  await expect(page.getByText("алдымен жоғарыдағы төлем реквизиттерін сақтаңыз")).toBeVisible();   // реквизитсіз тапсырыс формасы жоқ
  await expect(page.locator("#ord-plan")).toHaveCount(0);
  // қате БИН (HTML валидациясын айналып өту)
  await page.locator("#bp-legal").fill(LEGAL);
  await page.locator("form:has(#bp-legal)").evaluate((f: HTMLFormElement) => { f.noValidate = true; f.querySelectorAll("[pattern],[minlength]").forEach((e) => { e.removeAttribute("pattern"); e.removeAttribute("minlength"); }); });
  await page.locator("#bp-bin").fill("12345");
  await page.locator("#bp-addr").fill("Тест қаласы, Тест көшесі 1");
  await page.locator("#bp-bank").fill("Тест банк");
  await page.locator("#bp-bik").fill("testkzkx");
  await page.locator("#bp-iik").fill("kz00 test 0000 0000 0001");
  await page.locator("#bp-kbe").fill("14");
  await page.getByRole("button", { name: "Реквизиттерді сақтау" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "БИН/ЖСН" }).first()).toBeVisible();
  await page.locator("#bp-bin").fill("123456789012");
  await page.getByRole("button", { name: "Реквизиттерді сақтау" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Реквизиттер сақталды" }).first()).toBeVisible();
  await expect(page.locator("#ord-plan")).toBeVisible();     // реквизит сақталған соң тапсырыс формасы ашылады
  const row = (await q("select * from org_billing_profile where org_id=$1", [S.org]))[0];
  expect(row.iik).toBe("KZ00TEST000000000001");     // бос орындар алынды, үлкен әріп
  expect(row.bik).toBe("TESTKZKX");
  await ctx.close();
});

test("тапсырыс беру: форма валидациясы, тарихта «Сұралды», бағасы «келісім бойынша»", async ({ browser }) => {
  const { ctx, page } = await sess(browser, E("admin"), /\/school/);
  await page.goto("/school/licence/order");
  await page.locator("#ord-plan").selectOption("pro");
  await page.locator("#ord-months").fill("12");
  await page.locator("#ord-students").fill("300");
  await page.locator("#ord-teachers").fill("10");
  await page.locator("#ord-note").fill("Келесі оқу жылына жаңарту");
  await page.getByRole("button", { name: "Тапсырыс беру" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Тапсырыс жіберілді" }).first()).toBeVisible();
  const row = page.getByTestId("order-row").first();
  await expect(row).toHaveAttribute("data-status", "requested");
  await expect(row).toContainText("Сұралды");
  await expect(row).toContainText("баға келісім бойынша");
  await expect(row.getByTestId("invoice-download")).toHaveCount(0);
  S.orderId = (await q("select id from licence_orders where org_id=$1", [S.org]))[0].id;
  // шот әлі жоқ: PDF 409 және ЖАЛҒАН ештеңе жоқ
  const r = await page.request.get(`/api/invoices/${S.orderId}`);
  expect(r.status()).toBe(409);
  expect(await r.text()).toContain("Шот әлі берілмеген");
  await ctx.close();
});

test("SUPER ADMIN: баға жоқ -> қате; бағаны UI-да баптайды; тізімнен ұсыныс (ҚҚС есебі)", async ({ browser }) => {
  const { ctx, page } = await sess(browser, E("root"), /\/admin/);
  await page.goto("/admin/orders");
  await expect(page.getByText("Баға бағдарламасы бос")).toBeVisible();
  await expect(page.getByText("Сатушы реквизиттері толтырылмаған")).toBeVisible();
  const c = card(page);
  await expect(c).toBeVisible();
  await expect(c).toContainText(LEGAL);
  await expect(c).toContainText("баға ұсынылмаған");
  await c.getByRole("button", { name: "Баға тізімінен ұсыну" }).click();
  await expect(c.getByRole("alert").filter({ hasText: "баға қойылмаған" }).first()).toBeVisible();
  // баға қосу (бағаны иесі енгізеді; бұл тест деректері)
  await page.goto("/admin/prices");
  await expect(page.getByText("Баға қойылмаған", { exact: true })).toBeVisible();
  await page.locator("#pf-plan").selectOption("pro");
  await page.locator("#pf-months").fill("12");
  await page.locator("#pf-limit").fill("500");
  await page.locator("#pf-price").fill("1 000 000,00");
  await page.locator("#pf-vat").selectOption("added");
  await page.locator("#pf-rate").fill("12");
  await page.getByRole("button", { name: "Баға қосу" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Баға сақталды" }).first()).toBeVisible();
  await expect(page.getByTestId("prices-table")).toContainText("PRO");
  await expect(page.getByTestId("prices-table")).toContainText("1 000 000,00");
  // дұрыс емес баға
  await page.locator("#pf-price").fill("0");
  await page.getByRole("button", { name: "Баға қосу" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Бағаны дұрыс енгізіңіз" }).first()).toBeVisible();
  await page.goto("/admin/orders");
  await card(page).getByRole("button", { name: "Баға тізімінен ұсыну" }).click();
  await expect(card(page)).toHaveAttribute("data-status", "quoted");
  await expect(card(page).getByTestId("order-total")).toContainText("1 120 000,00");     // 1 000 000 + 12% ҚҚС
  await expect(card(page).getByTestId("order-total")).toContainText("120 000,00");
  const o = (await q("select * from licence_orders where id=$1", [S.orderId]))[0];
  expect([o.net_tiyn, o.vat_tiyn, o.total_tiyn].map(Number)).toEqual([100000000, 12000000, 112000000]);
  await ctx.close();
});

test("шот беру: сатушы профилі жоқта бас тартады; профилді толтырған соң нөмір береді", async ({ browser }) => {
  const { ctx, page } = await sess(browser, E("root"), /\/admin/);
  await page.goto("/admin/orders");
  await confirm(page, "Шот беру", "Шот беру");
  await expect(page.getByTestId("admin-order").first()).toHaveAttribute("data-status", "quoted");
  expect((await q("select status from licence_orders where id=$1", [S.orderId]))[0].status).toBe("quoted");
  // сатушы профилі
  await page.goto("/admin/seller");
  await expect(page.getByText("сатушы реквизиттерін толтырыңыз", { exact: false }).first()).toBeVisible();
  await page.locator("#sp-legal").fill(SELLER_NAME);
  await page.locator("#sp-bin").fill("210987654321");
  await page.locator("#sp-kbe").fill("17");
  await page.locator("#sp-addr").fill("Тест қаласы, Сатушы көшесі 2");
  await page.locator("#sp-bank").fill("Сатушы банк");
  await page.locator("#sp-bik").fill("SELLKZKX");
  await page.locator("#sp-iik").fill("KZ00SELL000000000002");
  await page.locator("#sp-dir").fill("Тестов Басшы");
  await page.locator("#sp-terms").fill("7");
  // ҚҚС ұсыныста бар, сатушы ҚҚС төлеушісі емес болса - шот берілмейді
  await page.getByRole("button", { name: "Сақтау" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Сатушы реквизиттері сақталды" }).first()).toBeVisible();
  await page.goto("/admin/orders");
  await confirm(page, "Шот беру", "Шот беру");
  expect((await q("select status from licence_orders where id=$1", [S.orderId]))[0].status).toBe("quoted");
  // ҚҚС төлеушісі деп белгілейміз (куәлік міндетті)
  await page.goto("/admin/seller");
  await page.getByLabel("ҚҚС төлеушісімін").check();
  await page.getByRole("button", { name: "Сақтау" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Сатушы реквизиттері сақталды" }).first()).toBeHidden({ timeout: 1 }).catch(() => {});
  await page.locator("#sp-cert").fill("серия 00000 №0000000");
  await page.getByRole("button", { name: "Сақтау" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Сатушы реквизиттері сақталды" }).first()).toBeVisible();
  await page.goto("/admin/orders");
  await confirm(page, "Шот беру", "Шот беру");
  await expect(card(page)).toHaveAttribute("data-status", "invoiced");
  const o = (await q("select * from licence_orders where id=$1", [S.orderId]))[0];
  expect(o.invoice_no).toMatch(/^\d{4}-\d{5}$/);
  S.invoiceNo = o.invoice_no;
  await ctx.close();
});

test("шот PDF: %PDF, қазақ әріптері, реквизиттер, ҚҚС; заңгер ескертуі PDF-те ЖОҚ; мектеп те жүктейді", async ({ browser }) => {
  const { ctx, page } = await sess(browser, E("admin"), /\/school/);
  await page.goto("/school/licence/order");
  const row = page.getByTestId("order-row").first();
  await expect(row).toContainText("Шот берілді");
  await expect(row).toContainText(S.invoiceNo);
  await expect(row).toContainText("1 120 000,00");
  const res = await page.request.get(`/api/invoices/${S.orderId}`);
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("application/pdf");
  expect(res.headers()["content-disposition"]).toContain(`schot-${S.invoiceNo}.pdf`);
  expect(res.headers()["cache-control"]).toContain("no-store");
  const buf = await res.body();
  expect(buf.subarray(0, 5).toString()).toBe("%PDF-");
  const txt = pdfText(buf);
  for (const must of ["Төлем шоты", "Счёт на оплату", S.invoiceNo, SELLER_NAME, LEGAL, "210987654321", "123456789012", "KZ00SELL000000000002", "KZ00TEST000000000001",
    "ҚҚС", "12%", "1 000 000,00", "120 000,00", "1 120 000,00", "Төлем мақсаты", "Төлеу мерзімі", "серия 00000", "Тестов Басшы", "Тапсырыс беруші"]) {
    expect(txt.replace(/ /g, " "), `PDF-те «${must}» жоқ`).toContain(must);
  }
  expect(txt).not.toMatch(/заңгер|юрист|бухгалтер тексеруін|үлгісі/i);
  // жүктеу батырмасы
  const [dl] = await Promise.all([page.waitForEvent("download"), row.getByTestId("invoice-download").click()]);
  expect(dl.suggestedFilename()).toBe(`schot-${S.invoiceNo}.pdf`);
  await ctx.close();
});

test("PDF құқықтары: мұғалім 403, басқа ұйым 404, анонимді 401, жарамсыз id 404, SUPER ADMIN 200", async ({ browser, request }) => {
  expect((await request.get(`/api/invoices/${S.orderId}`)).status()).toBe(401);
  const t = await sess(browser, E("teacher"), /\/teacher/);
  expect((await t.page.request.get(`/api/invoices/${S.orderId}`)).status()).toBe(403);
  await t.ctx.close();
  const b = await sess(browser, E("adminb"), /\/school/);
  expect((await b.page.request.get(`/api/invoices/${S.orderId}`)).status()).toBe(404);
  expect((await b.page.request.get(`/api/invoices/not-a-uuid`)).status()).toBe(404);
  expect((await b.page.request.get(`/api/invoices/00000000-0000-4000-8000-000000000000`)).status()).toBe(404);
  // басқа ұйымның тапсырыс беті өз тапсырысын ғана көрсетеді
  await b.page.goto("/school/licence/order");
  await expect(b.page.getByText("Әзірге тапсырыс жоқ")).toBeVisible();
  await b.ctx.close();
  const r = await sess(browser, E("root"), /\/admin/);
  const ok = await r.page.request.get(`/api/invoices/${S.orderId}`);
  expect(ok.status()).toBe(200);
  expect((await ok.body()).subarray(0, 4).toString()).toBe("%PDF");
  await r.ctx.close();
});

test("мектеп әкімшісі админ беттеріне кіре алмайды; тапсырыс әрекеттері RPC-де жабық", async ({ browser }) => {
  const { ctx, page } = await sess(browser, E("admin"), /\/school/);
  for (const u of ["/admin/orders", "/admin/prices", "/admin/seller"]) {
    await page.goto(u);
    await expect(page).not.toHaveURL(new RegExp(u + "$"));
  }
  expect((await page.request.get("/admin/orders/export")).status()).not.toBe(200);
  await ctx.close();
  await expect(asUser(S.admin, "select public.mark_paid($1,'x',current_date)", [S.orderId])).rejects.toThrow(/forbidden/);
  await expect(asUser(S.admin, "select public.activate_order($1)", [S.orderId])).rejects.toThrow(/forbidden/);
});

test("төлем: SUPER ADMIN «төленді» белгілейді (валидациямен), активтендіреді; лицензия жаңарады", async ({ browser }) => {
  const r = await sess(browser, E("root"), /\/admin/);
  const page = r.page;
  await page.goto("/admin/orders");
  const c = card(page);
  // активтендіру батырмасы төлемге дейін жоқ
  await expect(c.getByRole("button", { name: "Лицензияны активтендіру" })).toHaveCount(0);
  await c.getByLabel("Төлем құжатының нөмірі (банк)").fill("ТЕСТ-ПП-77");
  await c.getByRole("button", { name: "Төленді деп белгілеу" }).click();
  await expect(card(page)).toHaveAttribute("data-status", "paid");
  expect((await q("select paid_ref from licence_orders where id=$1", [S.orderId]))[0].paid_ref).toBe("ТЕСТ-ПП-77");
  const before = (await q("select valid_until::text v, plan, max_students, max_teachers from licenses where org_id=$1", [S.org]))[0];
  expect(before.plan).toBe("starter");
  await confirm(page, "Лицензияны активтендіру", "Активтендіру");
  await expect(card(page)).toHaveAttribute("data-status", "activated");
  const after = (await q("select valid_until::text v, plan, max_students, max_teachers from licenses where org_id=$1", [S.org]))[0];
  const exp = new Date(before.v + "T00:00:00Z"); exp.setUTCMonth(exp.getUTCMonth() + 12);
  expect(after.v).toBe(exp.toISOString().slice(0, 10));
  expect([after.plan, after.max_students, after.max_teachers]).toEqual(["pro", 300, 10]);
  await r.ctx.close();
  const a = await sess(browser, E("admin"), /\/school/);
  await a.page.goto("/school/licence");
  await expect(a.page.getByTestId("licence-plan")).toHaveText("PRO");
  await expect(a.page.getByTestId("licence-until")).not.toBeEmpty();
  await expect(a.page.getByTestId("usage-students-max")).toHaveText("300");
  await a.page.goto("/school/licence/order");
  await expect(a.page.getByTestId("order-row").first()).toContainText("Активтенді");
  await a.page.goto("/notifications");
  await expect(a.page.getByText("Лицензия жаңартылды").first()).toBeVisible();
  await a.ctx.close();
});

test("бас тарту: мектеп әкімшісі ашық тапсырыстан бас тартады; жабық күйде батырма жоқ", async ({ browser }) => {
  const { ctx, page } = await sess(browser, E("admin"), /\/school/);
  await page.goto("/school/licence/order");
  await expect(page.getByTestId("order-row").first().getByRole("button", { name: "Бас тарту" })).toHaveCount(0);   // активтенген
  await page.locator("#ord-months").fill("6");
  await page.getByRole("button", { name: "Тапсырыс беру" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Тапсырыс жіберілді" }).first()).toBeVisible();
  const rows = page.getByTestId("order-row");
  await expect(rows).toHaveCount(2);
  await rows.first().getByRole("button", { name: "Бас тарту" }).click();
  await page.locator("dialog[open]").getByRole("button", { name: "Бас тарту", exact: true }).click();
  await expect(rows.first()).toHaveAttribute("data-status", "cancelled");
  await ctx.close();
});

test("CSV: SUPER ADMIN жүктейді, формула қорғалған (' префикс), аудитке жазылады; басқаға жабық", async ({ browser, request }) => {
  expect((await request.get("/admin/orders/export")).status()).toBe(401);
  const r = await sess(browser, E("root"), /\/admin/);
  const res = await r.page.request.get("/admin/orders/export");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("text/csv");
  const csv = await res.text();
  expect(csv.startsWith("﻿")).toBe(true);
  expect(csv).toContain(S.invoiceNo);
  expect(csv).toContain(`'${LEGAL}`);                                          // «=» алдынан ' қойылған
  expect(csv).not.toMatch(new RegExp(`(^|,)"?=${LEGAL.slice(1, 6)}`, "m"));
  const f = await r.page.request.get("/admin/orders/export?status=activated");
  expect((await f.text())).toContain("Активтенді");
  expect((await q("select count(*)::int n from audit_logs where action='order.export'"))[0].n).toBeGreaterThanOrEqual(2);
  await r.ctx.close();
  const a = await sess(browser, E("admin"), /\/school/);
  expect((await a.page.request.get("/admin/orders/export")).status()).toBe(403);
  await a.ctx.close();
});

test("еске салғыш: 7 күн қалғанда мектеп әкімшісіне хабарландыру, қайталанбайды", async ({ browser }) => {
  await q("update licenses set valid_until = current_date + 7 where org_id=$1", [S.org]);
  await q("delete from licence_reminder_log where org_id=$1", [S.org]);
  expect(Number((await q("select public.licence_reminders() n"))[0].n)).toBeGreaterThanOrEqual(1);
  expect(Number((await q("select public.licence_reminders() n"))[0].n)).toBe(0);
  const { ctx, page } = await sess(browser, E("admin"), /\/school/);
  await page.goto("/notifications");
  await expect(page.getByText("Лицензия 7 күннен кейін аяқталады")).toHaveCount(1);
  await ctx.close();
});

test("390px: тапсырыс беті мен админ беттерінде көлденең айналдыру жоқ", async ({ browser }) => {
  const a = await sess(browser, E("admin"), /\/school/, 390);
  for (const u of ["/school/licence", "/school/licence/order"]) { await a.page.goto(u); await noHScroll(a.page); }
  await a.ctx.close();
  const r = await sess(browser, E("root"), /\/admin/, 390);
  for (const u of ["/admin/orders", "/admin/prices", "/admin/seller"]) { await r.page.goto(u); await noHScroll(r.page); }
  await r.ctx.close();
});
