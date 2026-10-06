// Бұлттық синхрондау: нағыз supabase/schema.sql + жергілікті PostgREST-мок.
// CLOUD_MOCK=http://127.0.0.1:8799 орнатылғанда ғана жүреді (CI-де Postgres сервисімен).
const { test, expect } = require("@playwright/test");
const { blockFonts, routeSupabase, collectErrors } = require("../support/helpers");

const MOCK = process.env.CLOUD_MOCK;
test.skip(!MOCK, "CLOUD_MOCK орнатылмаған");

test("мұғалім сыныбы, екі құрылғы, автоматты синхрондау, QR арқылы кіру", async ({ browser }) => {
  test.setTimeout(120_000);
  const mk = async (opts) => { const c = await browser.newContext(opts); await blockFonts(c); await routeSupabase(c, MOCK); const p = await c.newPage(); p.errs = collectErrors(p); return p; };

  const T = await mk({ viewport: { width: 1280, height: 900 } });
  await T.goto("teacher.html");
  await T.fill(".cl-new [name=title]", "10А информатика"); await T.fill(".cl-new [name=pw]", "mugalim1"); await T.click(".cl-new button");
  const code = (await T.locator(".cl-bigcode b").innerText()).trim();
  expect(code).toMatch(/^[2-9A-Z]{6}$/);

  const A = await mk({ viewport: { width: 390, height: 844 }, colorScheme: "dark" });
  await A.goto("index.html");
  await A.evaluate(() => localStorage.setItem("cs50kz:progress", JSON.stringify({ read: { "week-0": 1, "week-1": 1 }, quiz: {}, name: "Аружан" })));
  await A.goto("profile.html");
  await A.click(".cl-enable");
  await expect(A.locator(".cl-status.ok")).toBeVisible();
  await A.click(".cl-eye");
  const secret = (await A.locator(".cl-sec").innerText()).replace("-", "").trim();
  const id = await A.evaluate(() => CS50KZ.profile().id);
  await A.fill(".cl-code", code.toLowerCase()); await A.click(".cl-join");
  await expect(A.locator(".cl-class")).toContainText("10А информатика");

  await T.click(".cl-refresh");
  await expect(T.locator(".t-cloud tbody")).toContainText(id);
  await expect(T.locator(".t-cloud tbody")).toContainText("2/12");

  const B = await mk({ viewport: { width: 1280, height: 900 } });
  await B.goto("index.html");
  await B.evaluate(() => localStorage.setItem("cs50kz:progress", JSON.stringify({ read: { "week-5": 1 }, quiz: {} })));
  await B.goto("profile.html");
  await B.click(".cl-login-wrap summary");
  await B.fill(".cl-id", "KZ-ZZZZ-ZZZZ"); await B.fill(".cl-secret", "AAAAAAAA"); await B.click(".cl-login-btn");
  await expect(B.locator(".cl-msg.bad")).toContainText("ID не код қате");
  await B.click(".cl-login-wrap summary").catch(() => {});
  await B.fill(".cl-id", id); await B.fill(".cl-secret", secret.toLowerCase()); await B.click(".cl-login-btn");
  await expect(B.locator(".cl-cred")).toBeVisible();
  expect(await B.evaluate(() => Object.keys(JSON.parse(localStorage.getItem("cs50kz:progress")).read).sort())).toEqual(["week-0", "week-1", "week-5"]);

  await B.evaluate(() => { const p = JSON.parse(localStorage.getItem("cs50kz:progress")); p.read["week-6"] = 1; localStorage.setItem("cs50kz:progress", JSON.stringify(p)); });
  await B.click(".cl-now");
  await expect(B.locator(".cl-msg.ok")).toContainText("Синхрондалды");

  await A.evaluate(() => { const c = JSON.parse(localStorage.getItem("cs50kz:cloud")); c.pulled = 0; localStorage.setItem("cs50kz:cloud", JSON.stringify(c)); });
  await A.goto("index.html");
  await expect.poll(() => A.evaluate(() => Object.keys(JSON.parse(localStorage.getItem("cs50kz:progress")).read).length), { timeout: 10_000 }).toBe(4);

  await T.click(".cl-refresh");
  await expect(T.locator(".t-cloud tbody")).toContainText("4/12");

  const C = await mk({ viewport: { width: 390, height: 800 } });
  await C.goto(`profile.html#login=${id}.${secret}`);
  await expect(C.locator(".cl-cred")).toBeVisible();
  expect(await C.evaluate(() => CS50KZ.profile().id)).toBe(id);
  for (const p of [T, A, B, C]) expect(p.errs).toEqual([]);
});
