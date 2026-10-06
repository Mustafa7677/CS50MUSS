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
