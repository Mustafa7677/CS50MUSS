// © 2026 AO17 командасы. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md.
// AO17 X-RAY (tools/academy/xray.py, assets/py/xray_trace.py, assets/js/ao17-xray.js). Python (Pyodide) жергілікті бумадан
// беріледі (routePyodide). Тексереміз: бет Python-сыз ашылады; бір қадамда жеті қабат сәйкес (өрнек, AST, байт-код, стек,
// машина); шақыру саны мен ағаш (факториал 4, Фибоначчи 15, мемоизация 9); уақытты кері айналдыру (ағаш түйіні -> жауап,
// айнымалы -> мәні жазылған нұсқау); цикл мен сілтеме; қателер (синтаксис, шексіз цикл, input); уақыт жолағының қадамдары;
// курс беті, мәзір, хаб, бет ережесі; 360px, axe.
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const ROOT = path.resolve(__dirname, "../..");
const { blockFonts, collectErrors, routePyodide } = require("../support/helpers");
const AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const DATA = JSON.parse(fs.readFileSync(path.join(ROOT, "academy/xray.html"), "utf8").match(/<script type="application\/json" id="xr-data">([\s\S]*?)<\/script>/)[1].replace(/<\\\//g, "</"));

async function open(page, ex) {
  await blockFonts(page.context());
  await routePyodide(page.context());
  await page.goto("academy/xray.html" + (ex ? "#ex=" + ex : ""));
  await expect(page.locator("[data-xr-status]")).toHaveText(ex ? /^Рентген дайын|^Қатемен тоқтады/ : "Python дайын", { timeout: 90_000 });
}
async function runCode(page, code) {
  if (await page.locator("[data-xr-edit]").isVisible()) await page.locator("[data-xr-edit]").click();
  await page.locator("[data-xr-code]").fill(code);
  await page.locator("[data-xr-run]").click();
}
// «Алға» батырмасымен көрсетілген нұсқауға дейін жүру
async function stepTo(page, op, max = 200) {
  for (let i = 0; i < max; i++) {
    if ((await page.locator("[data-xr-pos]").innerText()).endsWith(" · " + op)) return;
    await page.locator('[data-xr-go="next"]').click();
  }
  throw new Error(op + " табылмады");
}

test("Python-сыз: мысалдар, жеті қабат, редактор", async ({ page }) => {
  await blockFonts(page.context());
  await page.route(/pyodide/, (r) => r.abort());
  await page.goto("academy/xray.html");
  await expect(page.locator("[data-ex]")).toHaveCount(6);
  expect(DATA.examples.map((e) => e.id)).toEqual(["fact", "fib", "memo", "loop", "alias", "bug"]);
  await expect(page.locator('[data-ex="fact"]')).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("[data-xr-code]")).toHaveValue(DATA.examples[0].code);
  await expect(page.locator(".xr-p")).toHaveCount(7);
  await expect(page.locator(".xr-p h2")).toHaveText([/Бастапқы код/, /Есептеу/, /Машина деңгейі/, /Байт-код/, /AST/, /Шақыру стегі/, /Шақыру ағашы/]);
  await expect(page.locator("[data-xr-run]")).toBeDisabled();
  await expect(page.locator("[data-xr-time]")).toBeHidden();
  await expect(page.locator("[data-xr-status]")).toHaveText(/^Python жүктелмеді/, { timeout: 30_000 });
  await page.locator('[data-ex="fib"]').click();
  await expect(page.locator("[data-xr-code]")).toHaveValue(DATA.examples[1].code);
  await expect(page.locator("[data-xr-note]")).toHaveText(DATA.examples[1].note);
});

test("факториал: бір қадамда барлық қабат сәйкес, соңында 4 шақыру және 24", async ({ page }) => {
  test.setTimeout(150_000);
  const errs = collectErrors(page);
  await open(page, "fact");
  await expect(page.locator("[data-xr-status]")).toHaveText(/^Рентген дайын: \d+ нұсқау, 4 шақыру$/);
  await expect(page.locator(".xr-tn")).toHaveCount(4);
  await stepTo(page, "COMPARE_OP");
  await expect(page.locator(".xr-src mark")).toHaveText("n == 1");
  await expect(page.locator(".xr-an.on")).toHaveText("Compare ==");
  await expect(page.locator(".xr-bc li.on b")).toHaveText("COMPARE_OP");
  await expect(page.locator("[data-xr-bcfn]")).toHaveText("factorial функциясының байт-коды");
  await expect(page.locator("[data-xr-op]")).toContainText("Екі мәнді салыстырып");
  await expect(page.locator("[data-xr-hwl] a")).toHaveAttribute("href", "3d/arch/arch-11-branch.html");
  await expect(page.locator(".xr-fr.top .xr-frh")).toContainText("factorial(n=4)");
  // соңы: стек бос, ағаштың бәрі жауап қайтарды
  await page.locator('[data-xr-go="last"]').click();
  await expect(page.locator('[data-st="calls"]')).toHaveText("4 / 4");
  await expect(page.locator('[data-st="depth"]')).toHaveText("0 (ең көбі 4)");
  await expect(page.locator('[data-st="res"]')).toHaveText("24");
  await expect(page.locator(".xr-tn.back")).toHaveCount(4);
  await expect(page.locator(".xr-tn").first().locator(".xr-tr")).toHaveText("→ 24");
  await expect(page.locator("[data-xr-out]")).toHaveText("24\n");
  // басына: ағаш бос (әлі ешкім шақырылған жоқ)
  await page.locator('[data-xr-go="first"]').click();
  await expect(page.locator(".xr-tn.seen")).toHaveCount(0);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("ao17cs:xray")).runs)).toBeGreaterThan(0);
  expect(errs).toEqual([]);
});

test("Фибоначчи 15 шақыру, мемоизация 9 шақыру: ағаш соған сай", async ({ page }) => {
  test.setTimeout(150_000);
  await open(page, "fib");
  await expect(page.locator("[data-xr-status]")).toHaveText(/, 15 шақыру$/);
  await expect(page.locator(".xr-tn")).toHaveCount(15);
  await page.locator('[data-xr-go="last"]').click();
  await expect(page.locator('[data-st="res"]')).toHaveText("5");
  await expect(page.locator('[data-st="depth"]')).toHaveText("0 (ең көбі 5)");
  await page.locator('[data-ex="memo"]').click();
  await expect(page.locator("[data-xr-status]")).toHaveText(/, 9 шақыру$/, { timeout: 30_000 });
  await expect(page.locator(".xr-tn")).toHaveCount(9);
  await page.locator('[data-xr-go="last"]').click();
  await expect(page.locator('[data-st="res"]')).toHaveText("5");
});

test("уақытты кері айналдыру: ағаштағы шақыру -> жауабы, айнымалы -> мәні жазылған нұсқау", async ({ page }) => {
  test.setTimeout(150_000);
  await open(page, "bug");
  await page.locator('[data-xr-go="last"]').click();
  await expect(page.locator('[data-st="res"]')).toHaveText("0");
  await page.locator(".xr-tn").first().click();
  await expect(page.locator("[data-xr-pos]")).toHaveText(/ · 6-жол · RETURN_VALUE$/);
  await expect(page.locator("[data-xr-travel]")).toContainText("осы нұсқауда 0 қайтарады");
  await page.locator('.xr-var[data-name="м"]').click();
  await expect(page.locator("[data-xr-pos]")).toHaveText(/ · 2-жол · STORE_FAST$/);
  await expect(page.locator("[data-xr-travel]")).toHaveText("Уақыт кері айналды: «м» мәнін осы нұсқау жазады (2-жол, STORE_FAST): жоқ → 0. Жаңа мән келесі қадамда стекте көрінеді.");
  await expect(page.locator(".xr-src mark")).toHaveText("м");
  // пернетақтамен: ағаш түйіні фокус алады, Enter
  await page.locator(".xr-tn").first().focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("[data-xr-pos]")).toHaveText(/RETURN_VALUE$/);
});

test("цикл байт-кодта кері секіріс; бір тізім - екі атау (#1)", async ({ page }) => {
  test.setTimeout(150_000);
  await open(page, "loop");
  await expect(page.locator(".xr-bc b", { hasText: /^JUMP_BACKWARD$/ })).toHaveCount(1);
  await stepTo(page, "JUMP_BACKWARD");
  await expect(page.locator("[data-xr-op]")).toContainText("Цикл деген - осы кері секіріс");
  await expect(page.locator(".xr-tree .xr-empty")).toBeVisible();   // функция жоқ: ағаш бос
  await page.locator('[data-ex="alias"]').click();
  await expect(page.locator("[data-xr-status]")).toHaveText(/^Рентген дайын/, { timeout: 30_000 });
  await page.locator('[data-xr-go="last"]').click();
  await expect(page.locator(".xr-fr.top dd code")).toHaveText(["#1 [1, 2, 3]", "#1 [1, 2, 3]"]);
  await expect(page.locator("[data-xr-out]")).toHaveText("[1, 2, 3]\n");
});

test("қателер: синтаксис, шексіз цикл, input; уақыт жолағының «жол» мен «шақыру» қадамдары", async ({ page }) => {
  test.setTimeout(150_000);
  await open(page);
  await runCode(page, "def f(:\n    pass\n");
  await expect(page.locator("[data-xr-out]")).toHaveText(/^Қате \(1-жол\): Синтаксис қатесі/);
  await expect(page.locator("[data-xr-status]")).toHaveText("Қате бар");
  await runCode(page, "while True:\n    pass\n");
  await expect(page.locator("[data-xr-status]")).toHaveText(/^Қатемен тоқтады/);
  await page.locator('[data-xr-go="last"]').click();
  await expect(page.locator("[data-xr-out]")).toContainText("Тым ұзақ");
  await expect(page.locator('[data-st="ins"]')).toContainText("алғашқы 3000 жазылды");
  await runCode(page, "n = int(input())\n");
  await page.locator('[data-xr-go="last"]').click();
  await expect(page.locator("[data-xr-out]")).toContainText("input() рентгенде жоқ");
  // «шақыру» қадамы: келесі шақыруға не қайтуға секіреді; «жол» қадамы: келесі жолға
  await runCode(page, DATA.examples[0].code);
  await expect(page.locator("[data-xr-status]")).toHaveText(/^Рентген дайын/);
  await page.locator("[data-xr-gran]").selectOption("call");
  await page.locator('[data-xr-go="next"]').click();
  await expect(page.locator("[data-xr-pos]")).toHaveText(/ · 2-жол · /);   // factorial(4)-тің алғашқы нұсқауы
  await expect(page.locator(".xr-fr.top .xr-frh")).toContainText("factorial(n=4)");
  await page.locator("[data-xr-gran]").selectOption("line");
  await page.locator('[data-xr-go="next"]').click();
  await expect(page.locator("[data-xr-pos]")).toHaveText(/ · 4-жол · /);
});

test("курс бетінде 6-9 апталарда X-RAY сілтемесі; мәзір мен хабта бар; бет ережесі: жария", async ({ page }) => {
  await blockFonts(page.context());
  await page.goto("academy/course.html");
  const want = { 6: "loop", 7: "fact", 8: "alias", 9: "fib" };
  for (const [w, id] of Object.entries(want)) await expect(page.locator(`#w${w} .crs-xray a`)).toHaveAttribute("href", `xray.html#ex=${id}`);
  await expect(page.locator(".crs-xray")).toHaveCount(4);
  await expect(page.locator('#play .crs-pl h3 a[href="xray.html"]')).toHaveText("AO17 X-RAY");
  await page.goto("academy/index.html");
  await expect(page.locator('.ac-cta a[href="xray.html"]')).toHaveText("AO17 X-RAY");
  const out = execFileSync("python3", ["-c", "import sys; sys.path.insert(0, 'tools'); import gate; print(gate.page_rule('academy/xray.html'))"], { cwd: ROOT, encoding: "utf8" }).trim();
  expect(out).toBe("None");
});

for (const scheme of ["light", "dark"]) {
  test(`360px, ${scheme}: көлденең жылжымайды, axe таза`, async ({ browser }) => {
    test.setTimeout(150_000);
    const c = await browser.newContext({ viewport: { width: 360, height: 760 }, colorScheme: scheme, reducedMotion: "reduce" });
    await blockFonts(c);
    await routePyodide(c);
    const p = await c.newPage();
    const errs = collectErrors(p);
    await p.goto("academy/xray.html#ex=fib");
    await expect(p.locator("[data-xr-status]")).toHaveText(/^Рентген дайын/, { timeout: 90_000 });
    await p.locator("[data-xr-slider]").fill("40");
    expect(await p.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
    await p.addScriptTag({ content: AXE });
    const v = await p.evaluate(async () => (await axe.run(document.getElementById("main"), { runOnly: ["wcag2a", "wcag2aa"], resultTypes: ["violations"] })).violations
      .filter((x) => x.impact === "serious" || x.impact === "critical").map((x) => `${x.id}: ${x.nodes[0].target.join(" ")}`));
    expect(v, v.join("\n")).toEqual([]);
    expect(errs).toEqual([]);
    await c.close();
  });
}
