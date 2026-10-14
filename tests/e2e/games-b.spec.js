const { test, expect } = require("@playwright/test");
const { blockFonts, collectErrors } = require("../support/helpers");

const gamesLog = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("cs50kz:games") || "{}"));
async function open(page, context, id) {
  await blockFonts(context);
  const errs = collectErrors(page);
  await page.goto("games.html#" + id);
  await expect(page.locator(".game-stage")).toBeVisible();
  return errs;
}
const noHScroll = async (page) => {
  const w = await page.evaluate(() => ({ s: document.documentElement.scrollWidth, c: document.documentElement.clientWidth }));
  expect(w.s).toBeLessThanOrEqual(w.c);
};

test("games.html: ойындар хабында 4 жаңа ойын бар", async ({ page, context }) => {
  await blockFonts(context);
  const errs = collectErrors(page);
  await page.goto("games.html");
  for (const id of ["sqlescape", "memory", "webbuilder", "binary"]) await expect(page.locator(`.game-card[href="#${id}"]`)).toBeVisible();
  const c = await page.evaluate(() => window.CS50GamesB.counts);
  expect(c.sqlRooms).toBe(6);
  expect(c.memoryTasks).toBeGreaterThanOrEqual(30);
  expect(c.webTasks).toBe(5);
  expect(errs).toEqual([]);
});

test("SQL Escape Room: дұрыс сұраныс ашады, қате түсіндіріледі, DROP/INSERT қабылданбайды", async ({ page, context }) => {
  const errs = await open(page, context, "sqlescape");
  const ta = page.locator(".gb-sql");
  const run = async (sql) => { await ta.fill(sql); await ta.press("Control+Enter"); };
  await expect(ta).toBeVisible();
  // қауіпсіздік
  await run("DROP TABLE books");
  await expect(page.locator(".gb-fb")).toContainText("SELECT");
  await run("INSERT INTO books VALUES (9,'x','y',1)");
  await expect(page.locator(".gb-fb")).toContainText("INSERT");
  await run("SELECT 1; DROP TABLE books");
  await expect(page.locator(".gb-fb")).toContainText("бір сұраныс");
  await run("SELECT title FROM kitaptar");
  await expect(page.locator(".gb-fb")).toContainText("кесте жоқ");
  await run("SELECT titl FROM books");
  await expect(page.locator(".gb-fb")).toContainText("баған");
  await run("SELEC title FROM books");
  await expect(page.locator(".gb-fb")).toContainText("басталуы керек");
  await run("SELECT title FROM books");
  await expect(page.locator(".gb-fb")).toContainText("Бағандар саны");
  await ta.fill("x".repeat(401).slice(0, 400) + "y");
  // кеңес
  await page.click(".gb-hint-btn");
  await expect(page.locator(".gb-hints li")).toHaveCount(1);
  const answers = [
    "SELECT title, author FROM books;",
    "select name from gems where price > 500 and color = 'қызыл'",
    "SELECT name, price FROM products ORDER BY price DESC LIMIT 2",
    "SELECT class, COUNT(*) AS n FROM students GROUP BY class HAVING n > 2",
    "SELECT customers.name, orders.item FROM orders JOIN customers ON customers.id = orders.customer_id WHERE amount > 1000",
    "SELECT name FROM exam WHERE score > (SELECT AVG(score) FROM exam) ORDER BY score DESC",
  ];
  for (let i = 0; i < 6; i++) {
    await expect(page.locator(".gb-title")).toContainText(`${i + 1}-бөлме`);
    if (i === 5) { // реттің маңызы: дұрыс емес ретпен
      await run("SELECT name FROM exam WHERE score > (SELECT AVG(score) FROM exam) ORDER BY score ASC");
      await expect(page.locator(".gb-fb")).toContainText("реті");
    }
    await run(answers[i]);
    await expect(page.locator(".gb-fb")).toContainText("Құлып ашылды");
    await page.click(".gb-next");
  }
  await expect(page.locator(".game-result")).toBeVisible();
  const g = (await gamesLog(page)).sqlescape;
  expect(g.plays).toBe(1);
  expect(g.best).toBe(85); // 6 бөлме * 10 + 5 кеңессіз бөлме * 5
  expect(errs).toEqual([]);
});

test("Memory Master: 12 сұрақ ойналады, жад торы көрінеді", async ({ page, context }) => {
  const errs = await open(page, context, "memory");
  for (let i = 0; i < 12; i++) {
    await expect(page.locator(".g-hud")).toContainText(`Сұрақ ${i + 1}/12`);
    const opts = page.locator(".g-opt");
    if (await opts.count()) await opts.first().click();
    else { await page.fill(".gb-input", "1"); await page.keyboard.press("Enter"); }
    await expect(page.locator(".gb-mem .gb-cell").first()).toBeVisible();
    await expect(page.locator(".gb-expl")).toBeVisible();
    await page.click(".gb-next");
  }
  await expect(page.locator(".game-result")).toBeVisible();
  expect((await gamesLog(page)).memory.plays).toBe(1);
  expect(errs).toEqual([]);
});

test("Memory Master: барлық тапсырма деректері дұрыс (3 деңгей, дұрыс жауап бар)", async ({ page, context }) => {
  await blockFonts(context);
  await page.goto("games.html");
  const r = await page.evaluate(() => {
    const m = window.CS50GamesB.memory;
    return { n: m.length, lv: [1, 2, 3].map((l) => m.filter((t) => t.l === l).length), badOpts: m.filter((t) => !(t.f || (t.o && t.o.length >= 3))).length, noMem: m.filter((t) => !t.mem || !t.e).length };
  });
  expect(r.n).toBeGreaterThanOrEqual(30);
  r.lv.forEach((c) => expect(c).toBeGreaterThanOrEqual(10));
  expect(r.badOpts).toBe(0);
  expect(r.noMem).toBe(0);
});

test("Web Builder: тапсырмалар, қауіпсіз алдын ала көру, көшіру/жүктеу", async ({ page, context }) => {
  await page.setViewportSize({ width: 1280, height: 1500 }); // сүйреп тастау кезінде айналдыру болмасын
  const errs = await open(page, context, "webbuilder");
  await expect(page.locator("iframe.gb-frame")).toHaveAttribute("sandbox", "");
  // 1-тапсырма: қызыл тақырып
  await page.click('.gb-pal[aria-label="Тақырып қосу"]');
  await page.fill('.gb-props input[type=color] >> nth=0', "#ff0000");
  await page.click("text=✔ Тексеру");
  await expect(page.locator(".gb-req.ok")).toHaveCount(2);
  await expect(page.locator(".game-stage")).toContainText("Мақсат орындалды");
  // XSS: мәтін экрандалады
  await page.fill('.gb-props input[type=text]', '<img src=x onerror=alert(1)><script>1</script>');
  const html = await page.inputValue(".gb-src");
  expect(html).toContain("&lt;img src=x");
  expect(html).not.toContain("<img src=x");
  expect(html).toContain("color:#ff0000");
  // 2-тапсырма: ортадағы батырма
  await page.click(".gb-tab >> nth=1");
  await page.click('.gb-pal[aria-label="Батырма қосу"]');
  await page.click("text=✔ Тексеру");
  await expect(page.locator(".gb-req.no")).toHaveCount(1);
  await page.selectOption(".gb-props select", "center");
  await page.click("text=✔ Тексеру");
  await expect(page.locator(".gb-req.ok")).toHaveCount(2);
  // еркін режим: сүйреп тастау, көшіру, жүктеу
  await page.click(".gb-tab >> nth=5");
  await page.dragAndDrop('.gb-pal[aria-label="Абзац қосу"]', ".gb-outline");
  await expect(page.locator(".gb-row")).toHaveCount(1);
  await page.click(".gb-row .gb-mini >> nth=2");
  await expect(page.locator(".gb-row")).toHaveCount(0);
  await page.click('.gb-pal[aria-label="Карточка қосу"]');
  const [dl] = await Promise.all([page.waitForEvent("download"), page.click(".gb-dl")]);
  expect(dl.suggestedFilename()).toBe("my-page.html");
  await context.grantPermissions(["clipboard-read", "clipboard-write"]).catch(() => {});
  await page.click(".gb-copy");
  await expect(page.locator(".game-stage")).toContainText("көшірілді");
  await page.click("text=Аяқтау және ұпай алу");
  await expect(page.locator(".game-result")).toBeVisible();
  const g = (await gamesLog(page)).webbuilder;
  expect(g.plays).toBe(1);
  expect(g.best).toBe(40);
  expect(errs).toEqual([]);
});

test("Binary Challenge: жауаптар тексеріледі, уақыт біткенде нәтиже сақталады", async ({ page, context }) => {
  await page.clock.install();
  const errs = await open(page, context, "binary");
  let right = 0;
  const kinds = new Set();
  for (let i = 0; i < 14; i++) {
    const q = await page.evaluate(() => { const c = window.CS50GamesB.binary.current(); return { kind: c.kind, mode: c.mode, ans: c.ans }; });
    kinds.add(q.kind);
    if (q.mode === "bits") {
      const n = Number(q.ans);
      const btns = page.locator(".gb-bit");
      const w = await btns.count();
      for (let b = 0; b < w; b++) if ((n >> (w - 1 - b)) & 1) await btns.nth(b).click();
      await page.click(".gb-send");
    } else {
      await page.fill(".gb-answer", String(q.ans));
      await page.keyboard.press("Enter");
    }
    right++;
    await expect(page.locator(".g-hud")).toContainText(`Серия: ${right}`);
  }
  // қате жауап → серия үзіледі
  if (await page.locator(".gb-answer").count()) { await page.fill(".gb-answer", "zzz"); await page.keyboard.press("Enter"); await expect(page.locator(".g-hud")).toContainText("Серия: 0"); }
  await page.clock.fastForward(61000);
  await expect(page.locator(".game-result")).toBeVisible();
  const g = (await gamesLog(page)).binary;
  expect(g.plays).toBe(1);
  expect(g.best).toBeGreaterThan(100);
  expect(errs).toEqual([]);
});

test("Binary генераторы: жауап кілті дұрыс (500 сұрақ)", async ({ page, context }) => {
  await blockFonts(context);
  await page.goto("games.html");
  const bad = await page.evaluate(() => {
    const out = [];
    for (let i = 0; i < 500; i++) {
      const q = window.CS50GamesB.binary.gen(1 + (i % 3));
      if (q.mode === "bits") { if (!q.check(q.ans) || q.check(q.ans + 1)) out.push(q.prompt); }
      else if (!q.check(q.ans) || q.check("999999x")) out.push(q.prompt + " => " + q.ans);
    }
    return out;
  });
  expect(bad).toEqual([]);
});

for (const [id, dark] of [["sqlescape", false], ["memory", true], ["webbuilder", false], ["binary", true]]) {
  test(`390px: ${id} көлденең айналусыз (${dark ? "қараңғы" : "ашық"})`, async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: dark ? "dark" : "light" });
    const page = await ctx.newPage();
    const errs = await open(page, ctx, id);
    await page.waitForTimeout(600);
    if (id === "memory") { await page.locator(".g-opt, .gb-input").first().click(); await page.waitForTimeout(100); }
    if (id === "webbuilder") { await page.click('.gb-pal[aria-label="Карточка қосу"]'); await page.click('.gb-pal[aria-label="Тізім қосу"]'); }
    if (id === "sqlescape") { await page.fill(".gb-sql", "SELECT * FROM books"); await page.click(".gb-run"); }
    await noHScroll(page);
    expect(errs).toEqual([]);
    await ctx.close();
  });
}
