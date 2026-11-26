// © 2026 AO17 командасы. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md.
// Метатану және ойын (assets/js/ao17-exam.js, assets/js/ao17-methods.js): сенімділік таразысы (жауап бермес бұрын «Білемін /
// Шамалаймын / Білмеймін», нәтижеде калибрация, жиынтығы «ao17cs:calib»), сұрақ дуэлі (exam.html?duel=тұқым: бір тұқым - бірдей
// сұрақтар мен нұсқа реті, нәтижені салыстыру, шақыру сілтемесі), оқу журналы (жазба, тізбек, жүктеу, жетістік).
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "../..");
const { blockFonts, collectErrors } = require("../support/helpers");
const BANK = JSON.parse(fs.readFileSync(path.join(ROOT, "academy/exam.html"), "utf8").match(/<script type="application\/json" id="xm-bank">([\s\S]*?)<\/script>/)[1].replace(/<\\\//g, "</"));
const BY_ID = Object.fromEntries(BANK.items.map((x) => [x.id, x]));
const RUN = () => JSON.parse(localStorage.getItem("ao17cs:exam-run"));
const pick = (q) => { const it = BY_ID[q.id]; return it.k === "mc" ? String(q.p.indexOf(it.a)) : String(it.a); };
const wrong = (q) => { const it = BY_ID[q.id]; return it.k === "mc" ? String((q.p.indexOf(it.a) + 1) % it.o.length) : "-987654"; };

async function answer(page, q, ok) {
  const it = BY_ID[q.id];
  if (it.k === "mc") await page.locator(".xm-opt").nth(Number(ok ? pick(q) : wrong(q))).click();
  else { await page.fill(".xm-num input", ok ? pick(q) : wrong(q)); if (await page.locator(".xm-check").count()) await page.click(".xm-check"); }
}

test("сенімділік таразысы: жауап бермес бұрын белгіленеді, нәтижеде калибрация, жиынтығы сақталады және «Қалай оқыған дұрыс» бетінде", async ({ page, context }) => {
  await blockFonts(context);
  const errs = collectErrors(page);
  await page.goto("academy/exam.html?w=2");
  await page.click("[data-ax-start]");
  const run = await page.evaluate(RUN);
  for (let i = 0; i < 8; i++) {
    const conf = i < 6 ? "sure" : "no";
    await page.locator(`.xm-conf [data-conf="${conf}"]`).click();
    await expect(page.locator(`.xm-conf [data-conf="${conf}"]`)).toHaveAttribute("aria-pressed", "true");
    await answer(page, run.qs[i], i < 6);
    await expect(page.locator(".xm-conf [data-conf]").first()).toBeDisabled();   // түсіндірме шыққан соң сенімділік өзгермейді
    await page.locator(".xm-nav .btn.gold").click();
  }
  await expect(page.locator(".xm-score b")).toHaveText("75%");
  await expect(page.locator(".xm-res h2", { hasText: "Сенімділік таразысы" })).toBeVisible();
  await expect(page.locator(".xm-cal .cal-sure b")).toHaveText("6 / 6 дұрыс");
  await expect(page.locator(".xm-cal .cal-no b")).toHaveText("0 / 2 дұрыс");
  await expect(page.locator(".xm-calv")).toContainText("Сенімді болған жерде дұрыс жауап бересің");
  const cal = await page.evaluate(() => JSON.parse(localStorage.getItem("ao17cs:calib")));
  expect(cal).toEqual({ sure: { n: 6, ok: 6 }, no: { n: 2, ok: 0 } });
  await page.goto("academy/methods.html");
  await expect(page.locator(".cal-list .cal-sure b")).toHaveText("100% дұрыс");
  await expect(page.locator(".cal-list .cal-no b")).toHaveText("0% дұрыс");
  expect(errs).toEqual([]);
});

test("таразы: асығыс сенім ескертіледі; сенімділік белгіленбесе, бөлім шықпайды", async ({ page, context }) => {
  await blockFonts(context);
  await page.goto("academy/exam.html?w=4");
  await page.click("[data-ax-start]");
  let run = await page.evaluate(RUN);
  for (let i = 0; i < 8; i++) {
    if (i < 4) await page.locator('.xm-conf [data-conf="sure"]').click();
    await answer(page, run.qs[i], i === 0);
    await page.locator(".xm-nav .btn.gold").click();
  }
  await expect(page.locator(".xm-calv")).toContainText("асығыс сенім");
  await page.goto("academy/exam.html?w=5");
  await page.click("[data-ax-start]");
  run = await page.evaluate(RUN);
  for (let i = 0; i < 8; i++) { await answer(page, run.qs[i], true); await page.locator(".xm-nav .btn.gold").click(); }
  await expect(page.locator(".xm-score b")).toHaveText("100%");
  await expect(page.locator(".xm-cal")).toHaveCount(0);
});

test("сұрақ дуэлі: бір тұқым - бірдей сұрақтар, нәтиже салыстырылады, шақыру сілтемесі жұмыс істейді", async ({ browser }) => {
  // бірінші ойыншы
  const c1 = await browser.newContext(); await blockFonts(c1);
  const p1 = await c1.newPage();
  const errs = collectErrors(p1);
  await p1.goto("academy/exam.html?duel=ab12cd");
  await expect(p1.locator("h1")).toHaveText("Сұрақ дуэлі");
  await expect(p1.locator('.xm-modes [data-mode="duel"]')).toHaveAttribute("aria-current", "page");
  await expect(p1.locator(".xm-vs")).toHaveCount(0);
  await p1.fill("[data-ax-name]", "Айгерім");
  await p1.click("[data-ax-start]");
  const r1 = await p1.evaluate(RUN);
  expect(r1.qs).toHaveLength(10);
  expect(r1.seed).toBe("ab12cd");
  expect(new Set(r1.qs.map((q) => BY_ID[q.id].t)).size).toBe(10);   // әр сұрақ әр тақырыптан
  for (let i = 0; i < 10; i++) {
    await answer(p1, r1.qs[i], i < 7);
    await p1.locator(".xm-nav .btn.gold").click();
  }
  await expect(p1.locator(".xm-score b")).toHaveText("70%");
  await expect(p1.locator(".xm-duelres .xm-vs").first()).toHaveText(/^Сен: 7 \/ 10 \(\d+:\d\d\)$/);
  const link = await p1.locator("[data-duel-link]").inputValue();
  expect(link).toMatch(/academy\/exam\.html\?duel=ab12cd&vs=%D0%90%D0%B9%D0%B3%D0%B5%D1%80%D1%96%D0%BC&s=7&t=\d+$/);
  expect(errs).toEqual([]);
  // екінші ойыншы сілтемені ашады: сұрақтар мен нұсқалар реті бірдей
  const c2 = await browser.newContext(); await blockFonts(c2);
  const p2 = await c2.newPage();
  await p2.goto(link.replace(/^https?:\/\/[^/]+\//, "/"));
  await expect(p2.locator(".xm-duel .xm-vs")).toHaveText(/^Айгерім бұл дуэльде 7 \/ 10 жинады \(\d+:\d\d\)\. Оны ұта аласың ба\?$/);
  await p2.fill("[data-ax-name]", "Болат");
  await p2.click("[data-ax-start]");
  const r2 = await p2.evaluate(RUN);
  expect(r2.qs).toEqual(r1.qs);
  for (let i = 0; i < 10; i++) { await answer(p2, r2.qs[i], true); await p2.locator(".xm-nav .btn.gold").click(); }
  await expect(p2.locator(".xm-duelv")).toHaveText("Жеңдің!");
  await expect(p2.locator("[data-duel-link]")).toHaveValue(/vs=%D0%91%D0%BE%D0%BB%D0%B0%D1%82&s=10&t=\d+$/);
  // басқа тұқым - басқа сұрақтар; «new» - жаңа тұқым
  await p2.goto("academy/exam.html?duel=zz99zz");
  await p2.click("[data-ax-start]");
  expect((await p2.evaluate(RUN)).qs.map((q) => q.id)).not.toEqual(r1.qs.map((q) => q.id));
  await p2.goto("academy/exam.html?duel=new");
  await expect(p2).toHaveURL(/\?duel=[a-z0-9]{6}$/);
  // URL-дегі атау мәтін ретінде шығады (HTML емес)
  await p2.goto("academy/exam.html?duel=ab12cd&vs=%3Cimg%20src%3Dx%3E&s=3");
  await expect(p2.locator(".xm-duel .xm-vs b")).toHaveText("<img src=x>");
  await expect(p2.locator(".xm-duel img")).toHaveCount(0);
  await c1.close(); await c2.close();
});

test("оқу журналы: жазба сақталады, тізбек есептеледі, файлға жүктеледі, 7 жазбадан соң жетістік", async ({ page, context }) => {
  await blockFonts(context);
  const errs = collectErrors(page);
  await page.goto("academy/methods.html");
  const w = page.locator("[data-mt-reflect]");
  await expect(w.locator("[data-cal-out]")).toContainText("Таразы әлі бос");
  await w.locator('button[type="submit"]').click();   // бірінші жол бос болса, жазылмайды
  expect(await page.evaluate(() => localStorage.getItem("ao17cs:journal"))).toBeNull();
  await w.locator('textarea[name="a"]').fill("Цикл шарт орындалғанша қайталанатынын түсіндім.");
  await w.locator('textarea[name="b"]').fill("break пен continue айырмасы.");
  await w.locator('textarea[name="c"]').fill("while циклінің 3 есебін шығару.");
  await w.locator('button[type="submit"]').click();
  await expect(w.locator(".jr-list li")).toHaveCount(1);
  await expect(w.locator(".jr-list li").first()).toContainText("break пен continue");
  await expect(w.locator("[data-jr-stat]")).toHaveText("Журналда 1 жазба · қатарынан 1 күн.");
  await expect(w.locator('textarea[name="a"]')).toHaveValue("");
  // кешегі және алдыңғы күнгі жазбалар: тізбек 3 күн
  await page.evaluate(() => {
    const d = (k) => { const x = new Date(); x.setDate(x.getDate() - k); return x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0"); };
    const es = JSON.parse(localStorage.getItem("ao17cs:journal"));
    es.unshift({ d: d(1), a: "Кеше", at: 1 }, { d: d(2), a: "Алдыңғы күні", at: 0 });
    localStorage.setItem("ao17cs:journal", JSON.stringify(es));
  });
  await page.reload();
  await expect(w.locator("[data-jr-stat]")).toHaveText("Журналда 3 жазба · қатарынан 3 күн.");
  const [dl] = await Promise.all([page.waitForEvent("download"), w.locator("[data-jr-export]").click()]);
  expect(dl.suggestedFilename()).toBe("ao17-cs-journal.txt");
  const txt = fs.readFileSync(await dl.path(), "utf8");
  expect(txt).toContain("AO17 CS - оқу журналы");
  expect(txt).toContain("Түсіндім: Цикл шарт орындалғанша");
  expect(await page.evaluate(() => window.CS50KZ.achievements().find((a) => a.id === "ao17-journal").done)).toBe(false);
  await page.evaluate(() => localStorage.setItem("ao17cs:journal", JSON.stringify(Array.from({ length: 7 }, (_, i) => ({ d: "2026-01-0" + (i + 1), a: "x" + i })))));
  expect(await page.evaluate(() => window.CS50KZ.achievements().find((a) => a.id === "ao17-journal").done)).toBe(true);
  expect(errs).toEqual([]);
});
