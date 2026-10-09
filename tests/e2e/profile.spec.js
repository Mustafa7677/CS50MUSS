const { test, expect } = require("@playwright/test");
const { blockFonts, collectErrors } = require("../support/helpers");

test("профиль: код арқылы басқа құрылғыға көшіру және біріктіру, мұғалімде бір жол", async ({ browser }) => {
  const mk = async (opts) => { const c = await browser.newContext(opts); await blockFonts(c); const p = await c.newPage(); p.errs = collectErrors(p); return p; };
  const A = await mk({ viewport: { width: 1280, height: 900 } });
  await A.goto("index.html");
  await A.evaluate(() => {
    localStorage.setItem("cs50kz:progress", JSON.stringify({ read: { "week-0": 1, "week-1": 1 }, quiz: { "week-1": { best: 3, total: 7 } }, name: "Аружан" }));
    localStorage.setItem("cs50kz:exam", JSON.stringify({ best: 83, tries: [{ p: 83, d: "5.10.2026", s: 900 }] }));
  });
  await A.goto("profile.html");
  const idA = (await A.locator(".pf-id").innerText()).trim();
  await A.click(".pf-make");
  await expect(A.locator(".pf-code")).toHaveText(/^KZP1\./);
  const code = (await A.locator(".pf-code").innerText()).trim();

  const B = await mk({ viewport: { width: 390, height: 844 }, colorScheme: "dark" });
  await B.goto("index.html");
  await B.evaluate(() => localStorage.setItem("cs50kz:progress", JSON.stringify({ read: { "week-3": 1 }, quiz: { "week-1": { best: 5, total: 7 } } })));
  await B.goto("profile.html#import=" + code);
  await expect(B.locator(".pf-result.ok")).toBeVisible();
  const st = await B.evaluate(() => ({ id: CS50KZ.profile().id, p: JSON.parse(localStorage.getItem("cs50kz:progress")), e: JSON.parse(localStorage.getItem("cs50kz:exam")) }));
  expect(st.id).toBe(idA);
  expect(Object.keys(st.p.read).sort()).toEqual(["week-0", "week-1", "week-3"]);
  expect(st.p.quiz["week-1"].best).toBe(5); // ең жақсысы сақталады
  expect(st.e.best).toBe(83);

  await B.fill(".pf-in", "KZP1.zbroken!!"); await B.click(".pf-import");
  await expect(B.locator(".pf-result.bad")).toContainText("бүлінген");

  // Мұғалім: екі құрылғыдан келген код → бір жол (ID бойынша)
  const codeOf = (p) => p.evaluate(async () => { const b = document.createElement("button"); b.className = "share-progress"; document.body.appendChild(b); b.click(); await new Promise((r) => setTimeout(r, 500)); return document.querySelector(".share-code code").textContent; });
  await A.goto("index.html"); await B.goto("index.html");
  const [cA, cB] = [await codeOf(A), await codeOf(B)];
  const T = await mk({ viewport: { width: 1280, height: 900 } });
  await T.goto("teacher.html");
  await T.fill(".t-input", cA + " " + cB); await T.click(".t-add");
  await expect(T.locator(".teacher tbody tr")).toHaveCount(1);
  await expect(T.locator(".teacher tbody")).toContainText(idA);
  for (const p of [A, B, T]) expect(p.errs).toEqual([]);
});

test("белсенділік күнтізбесі: тест күнді белгілейді, серия саналады, синхрондағанда біріктіріледі", async ({ page }) => {
  const errs = collectErrors(page);
  await blockFonts(page.context());
  await page.goto("index.html");
  // Кеше мен алдыңғы күні белсенді болған
  await page.evaluate(() => {
    const k = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return CS50KZ.dayKey(d); };
    localStorage.setItem("cs50kz:days", JSON.stringify({ [k(1)]: 4, [k(2)]: 12 }));
  });
  await page.goto("profile.html");
  await expect(page.locator(".cal-kpi")).toContainText("2 күн қатарынан");
  await expect(page.locator(".cal-foot p")).toContainText("3 күн қатарынан");
  await expect(page.locator(".cal-g i.l2")).toHaveCount(1);
  await expect(page.locator(".cal-g i.l4")).toHaveCount(1);

  // Тест тапсыру бүгінгі күнді белгілейді
  await page.goto("lectures/week-0.html");
  await page.locator(".quiz .question").first().locator("input").first().check();
  await page.locator(".quiz-check").first().click();
  await page.goto("profile.html");
  await expect(page.locator(".cal-kpi")).toContainText("3 күн қатарынан");
  await expect(page.locator(".cal-foot p")).toContainText("Бүгін де оқыдыңыз");
  await page.locator(".pf-cal").screenshot({ path: test.info().outputPath("cal.png") });

  // Біріктіру ережесі: бір күн — көбі сақталады
  const m = await page.evaluate(() => CS50KZ_SYNC.mergeKey("cs50kz:days", { a: 2, b: 5 }, { a: 7, c: 1 }));
  expect(m).toEqual({ a: 7, b: 5, c: 1 });
  expect(errs).toEqual([]);
});

test("бүгінгі мақсат: сақина, мақсатты таңдау, орындалғанда Бота құттықтайды", async ({ page }) => {
  const errs = collectErrors(page);
  await blockFonts(page.context());
  await page.goto("index.html");
  await page.evaluate(() => {
    const k = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return CS50KZ.dayKey(d); };
    localStorage.setItem("cs50kz:days", JSON.stringify({ [k(0)]: 1, [k(1)]: 3, [k(2)]: 4 }));
  });
  await page.reload();
  const g = page.locator(".dash-goal");
  await expect(g).toContainText("Бүгінгі мақсат: 3 әрекет");
  await expect(g).toContainText("Тағы 2 әрекет қалды");
  await expect(g).toContainText("2 күн қатарынан");
  await g.locator('button[data-g="1"]').click();
  await expect(g).toHaveClass(/done/);
  await expect(g).toContainText("3 күн қатарынан");
  await g.locator('button[data-g="5"]').click();
  await expect(g.locator('button[data-g="5"]')).toHaveAttribute("aria-pressed", "true");
  await page.locator(".dashboard-wrap").first().screenshot({ path: test.info().outputPath("goal.png") });
  // Мақсат 3: бүгін 1 → тест тапсырсақ 2, тағы бір → 3 → Бота
  await g.locator('button[data-g="3"]').click();
  await page.goto("lectures/week-0.html");
  await page.locator(".quiz .question").first().locator("input").first().check();
  await page.locator(".quiz-check").first().click();
  await page.locator(".quiz-check").first().click();
  await expect(page.locator(".bota-pop")).toContainText("Бүгінгі мақсат орындалды", { timeout: 5000 });
  expect(errs).toEqual([]);
});

test("серия жазғы/қысқы уақыт ауысқан күні үзілмейді (DST, Europe/Berlin)", async ({ browser }) => {
  const c = await browser.newContext({ timezoneId: "Europe/Berlin" });
  const page = await c.newPage();
  await page.goto("index.html");
  // 2026-10-25 - Еуропада сағат кері бұралатын күн (25 сағат)
  await page.evaluate(() => localStorage.setItem("cs50kz:days", JSON.stringify({ "2026-10-24": 5, "2026-10-25": 5, "2026-10-26": 5 })));
  await page.goto("profile.html");
  await expect(page.locator(".cal-kpi")).toContainText("3 ең ұзақ серия");
  await c.close();
});
