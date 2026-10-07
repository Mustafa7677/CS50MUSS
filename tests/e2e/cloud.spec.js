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
  // Аналитика: 1 оқушы, 4 лекция; 12 баған, 0-апта бағаны толық
  await expect(T.locator(".ca-tiles")).toContainText("Оқушы");
  await expect(T.locator(".ca-col")).toHaveCount(12);
  await T.locator(".ca-col").first().hover();
  await expect(T.locator(".ca-tip")).toHaveText("0-апта: 1 / 1 оқушы (100%)");

  const C = await mk({ viewport: { width: 390, height: 800 } });
  await C.goto(`profile.html#login=${id}.${secret}`);
  await expect(C.locator(".cl-cred")).toBeVisible();
  expect(await C.evaluate(() => CS50KZ.profile().id)).toBe(id);
  for (const p of [T, A, B, C]) expect(p.errs).toEqual([]);
});

test("оқушы мұғалімнің сілтемесі арқылы бір қадаммен сыныпқа қосылады", async ({ browser }) => {
  const mk = async (opts) => { const c = await browser.newContext(opts); await blockFonts(c); await routeSupabase(c, MOCK); const p = await c.newPage(); p.errs = collectErrors(p); return p; };
  const T = await mk({ viewport: { width: 1280, height: 900 } });
  await T.goto("teacher.html");
  await T.fill(".cl-new [name=title]", "9Б сыныбы"); await T.fill(".cl-new [name=pw]", "mugalim2"); await T.click(".cl-new button");
  const code = (await T.locator(".cl-bigcode b").innerText()).trim();
  await T.click(".cl-join-qr");
  await expect(T.locator(".cl-join-qrbox svg")).toBeVisible();
  await T.click(".cl-refresh");
  await expect(T.locator(".cl-join-qrbox svg")).toBeVisible(); // жаңартудан кейін де QR қалады

  const S = await mk({ viewport: { width: 390, height: 844 } });
  S.removeAllListeners("dialog");
  S.on("dialog", (d) => d.accept(d.type() === "prompt" ? "Әлихан Бөкейхан" : undefined));
  await S.goto(`profile.html#join=${code.toLowerCase()}`);
  await expect(S.locator(".cl-msg.ok")).toContainText("9Б сыныбы", { timeout: 10_000 });
  await expect(S.locator(".cl-class")).toContainText(code);
  expect(await S.evaluate(() => JSON.parse(localStorage.getItem("cs50kz:progress")).name)).toBe("Әлихан Бөкейхан");

  await T.click(".cl-refresh");
  await expect(T.locator(".t-cloud tbody")).toContainText("Әлихан Бөкейхан");
  // Оқушы картасы: атын басқанда ашылады, 12 лекция жолы, Escape жабады
  await T.locator(".cl-st", { hasText: "Әлихан" }).click();
  await expect(T.locator(".sc-box h3")).toHaveText("Әлихан Бөкейхан");
  await expect(T.locator(".sc-list li")).toHaveCount(12);
  await T.keyboard.press("Escape");
  await expect(T.locator(".sc-box")).toHaveCount(0);
  for (const p of [T, S]) expect(p.errs).toEqual([]);
});

test("код-ревью регрессиялары: құпия синхрондалмайды, бос push жоқ, шығарылған оқушы қайтпайды, ескі күймен қосылу", async ({ browser }) => {
  test.setTimeout(120_000);
  const mk = async (opts) => { const c = await browser.newContext(opts); await blockFonts(c); await routeSupabase(c, MOCK); const p = await c.newPage(); p.errs = collectErrors(p); return p; };
  const T = await mk({ viewport: { width: 1280, height: 900 } });
  await T.goto("teacher.html");
  await T.fill(".cl-new [name=title]", "Регрессия"); await T.fill(".cl-new [name=pw]", "mugalim3"); await T.click(".cl-new button");
  const code = (await T.locator(".cl-bigcode b").innerText()).trim();

  const S = await mk({ viewport: { width: 1280, height: 900 } });
  S.removeAllListeners("dialog");
  S.on("dialog", (d) => d.accept(d.type() === "prompt" ? "Регрессия Оқушы" : undefined));
  await S.goto("profile.html");
  await S.click(".cl-enable");
  await expect(S.locator(".cl-status.ok")).toBeVisible();

  // 1) Кіру коды мен мұғалім құпиясөздері синхрондалатын/экспортталатын деректерде жоқ
  await S.evaluate(() => localStorage.setItem("cs50kz:tclasses", JSON.stringify([{ code: "ZZZZZZ", title: "x", pw: "teacherpw" }])));
  const keys = await S.evaluate(async () => Object.keys(window.CS50KZ_SYNC.snapshot(true).d));
  expect(keys).not.toContain("cs50kz:cloud");
  expect(keys).not.toContain("cs50kz:tclasses");

  // 2) Өзгеріс жоқ болса, қайта push болмайды
  await S.evaluate(() => window.CS50KZ_CLOUD.push(false)); // жетістік белгісі сияқты соңғы өзгерістер жіберілсін
  let pushes = 0;
  S.on("request", (r) => { if (/cs50kz_push/.test(r.url())) pushes++; });
  await S.evaluate(() => window.CS50KZ_CLOUD.push(false));
  await S.evaluate(() => window.CS50KZ_CLOUD.push(false));
  expect(pushes).toBe(0);

  // 3) Бұлт ертеден қосулы (pulled ескі) оқушы сілтеме арқылы қосылады — сынып жоғалмайды
  await S.evaluate(() => { const c = JSON.parse(localStorage.getItem("cs50kz:cloud")); c.pulled = 0; localStorage.setItem("cs50kz:cloud", JSON.stringify(c)); });
  await S.goto(`profile.html#join=${code}`);
  await expect(S.locator(".cl-msg.ok")).toContainText("Регрессия");
  await T.click(".cl-refresh");
  await expect(T.locator(".t-cloud tbody tr")).toHaveCount(1);

  // 4) Мұғалім шығарды → оқушының келесі синхрондауы оны қайта қоспайды
  await T.click(".cl-rm");
  await expect(T.locator(".t-cloud tbody")).toContainText("Әзірге ешкім қосылмаған");
  await S.evaluate(() => { const p = JSON.parse(localStorage.getItem("cs50kz:progress") || "{}"); p.read = { "week-0": 1 }; localStorage.setItem("cs50kz:progress", JSON.stringify(p)); });
  await S.evaluate(() => window.CS50KZ_CLOUD.cycle({ force: true, throw: true }));
  await T.click(".cl-refresh");
  await expect(T.locator(".t-cloud tbody")).toContainText("Әзірге ешкім қосылмаған");
  expect(await S.evaluate(() => JSON.parse(localStorage.getItem("cs50kz:cloud")).cls)).toBeNull();

  // 5) Құрылғыда өшіріп, қайта қосу сол ID-мен жұмыс істейді (жаңа код ойлап таппайды)
  const id = await S.evaluate(() => CS50KZ.profile().id);
  await S.click(".cl-off");
  await S.click(".cl-enable");
  await expect(S.locator(".cl-status.ok")).toBeVisible();
  expect(await S.evaluate(() => CS50KZ.profile().id)).toBe(id);
  for (const p of [T, S]) expect(p.errs).toEqual([]);
});

test("мұғалім тапсырма береді: оқушы баннерді көреді, орындағаны мұғалімге көрінеді", async ({ browser }) => {
  test.setTimeout(120_000);
  const mk = async (opts) => { const c = await browser.newContext(opts); await blockFonts(c); await routeSupabase(c, MOCK); const p = await c.newPage(); p.errs = collectErrors(p); return p; };
  const T = await mk({ viewport: { width: 1280, height: 900 } });
  await T.goto("teacher.html");
  await T.fill(".cl-new [name=title]", "Тапсырма сыныбы"); await T.fill(".cl-new [name=pw]", "mugalim4"); await T.click(".cl-new button");
  const code = (await T.locator(".cl-bigcode b").innerText()).trim();

  const S = await mk({ viewport: { width: 390, height: 844 } });
  S.removeAllListeners("dialog");
  S.on("dialog", (d) => d.accept(d.type() === "prompt" ? "Тапсырма Оқушы" : undefined));
  await S.goto(`profile.html#join=${code}`);
  await expect(S.locator(".cl-msg.ok")).toBeVisible();

  // Мұғалім: 1-апта, мерзімі ертең
  const due = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
  await T.selectOption(".tk-form [name=lecture]", "week-1");
  await T.fill(".tk-form [name=due]", due);
  await T.fill(".tk-form [name=note]", "Жұмаға дейін");
  await T.click(".tk-form .btn.gold");
  await expect(T.locator(".tk-now")).toContainText("0 / 1 орындады");
  await expect(T.locator(".tk-todo")).toContainText("Тапсырма Оқушы");

  // Оқушы: синхрондаған соң басты бетте баннер шығады
  await S.evaluate(() => window.CS50KZ_CLOUD.cycle({ pull: true, force: true }));
  await S.goto("index.html");
  await expect(S.locator(".tk-home .tk-banner")).toContainText("1-апта");
  await expect(S.locator(".tk-home .tk-banner")).toContainText("Жұмаға дейін");
  await expect(S.locator(".tk-home .tk-banner .btn")).toHaveAttribute("href", /lectures\/week-1\.html/);

  // Оқушы лекцияны оқыды → баннер жасыл, мұғалімде 1/1
  await S.evaluate(() => { const p = JSON.parse(localStorage.getItem("cs50kz:progress") || "{}"); p.read = Object.assign(p.read || {}, { "week-1": 1 }); p.quiz = Object.assign(p.quiz || {}, { "week-1": { best: 2, total: 5 } }); localStorage.setItem("cs50kz:progress", JSON.stringify(p)); });
  await S.evaluate(() => window.CS50KZ_CLOUD.cycle({ force: true }));
  await S.reload();
  await expect(S.locator(".tk-home .tk-banner.done")).toContainText("Орындалды");
  await T.click(".cl-refresh");
  await expect(T.locator(".tk-now")).toContainText("1 / 1 орындады");
  await expect(T.locator(".ca-hard .ca-hrow.low")).toContainText("1-апта");
  await expect(T.locator(".ca-hard .ca-hrow.low b")).toHaveText("40%");
  await expect(T.locator(".ca-hard .ca-insight")).toContainText("қайталау сабағы");
  await T.locator(".ca").screenshot({ path: test.info().outputPath("hard.png") });

  // Оқушы профилінде сыныптағы орны (аттарсыз): 1/1, тапсырманы орындағандар 1/1
  await S.goto("profile.html");
  await expect(S.locator(".cp-rank b")).toHaveText("1/1");
  await expect(S.locator(".cp-card")).toContainText("тапсырманы орындағандар: 1/1");
  await expect(S.locator(".cp-legend")).toContainText("1 / 12 дәріс");
  await S.screenshot({ path: test.info().outputPath("pulse.png"), fullPage: true });

  // Алып тастау
  await T.click(".tk-clear");
  await expect(T.locator(".tk-now")).toHaveCount(0);
  for (const p of [T, S]) expect(p.errs).toEqual([]);
});
