// © 2026 AO17 командасы. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md.
// Бота әлемі (tools/academy/bota.py, assets/py/bota_world.py, assets/js/ao17-bota.js). Python (Pyodide) жергілікті бумадан
// беріледі (routePyodide). Тексереміз: карта, әлем және редактор Python-сыз да жұмыс істейді, шешімдер бетке жазылмаған;
// деңгей өтеді, жұлдыз бен жетістік сақталады; бір әлемге жаттанды код басқа әлемде құлайды; қателер жол нөмірімен және
// қазақша түсіндірмемен; шексіз цикл бетті қатырмайды; қадамдап режимі; редактордың шегінісі мен түймелері; курс беті,
// мәзір, бет ережесі; қозғалыс азайтылғанда анимация жоқ; 360px, axe.
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const ROOT = path.resolve(__dirname, "../..");
const { blockFonts, collectErrors, routePyodide } = require("../support/helpers");
const AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const HTML = fs.readFileSync(path.join(ROOT, "academy/bota.html"), "utf8");
const DATA = JSON.parse(HTML.match(/<script type="application\/json" id="bw-data">([\s\S]*?)<\/script>/)[1].replace(/<\\\//g, "</"));
// деңгей шешімдері тек build модулінде (тест оларды Python-нан оқиды, бетке жазылмайды)
const SOL = JSON.parse(execFileSync("python3", ["-c", "import sys, json; sys.path.insert(0, 'tools/academy'); import bota; print(json.dumps({l[1]: l[9] for l in bota.LEVELS}))"], { cwd: ROOT, encoding: "utf8" }));

async function open(page, url = "academy/bota.html") {
  await blockFonts(page.context());
  await routePyodide(page.context());
  await page.goto(url);
  await expect(page.locator("[data-bw-status]")).toHaveText("Python дайын", { timeout: 90_000 });
}
async function run(page, code, speed = "0") {
  if (code != null) await page.locator("[data-bw-code]").fill(code);
  await page.locator("[data-bw-speed]").selectOption(speed);
  await page.locator("[data-bw-run]").click();
}

test("карта, әлем және редактор Python-сыз да жұмыс істейді; шешімдер бетке жазылмаған", async ({ page }) => {
  await blockFonts(page.context());
  await page.route(/pyodide/, (r) => r.abort());
  await page.goto("academy/bota.html");
  await expect(page.locator(".bw-ch")).toHaveCount(6);
  await expect(page.locator(".bw-lv")).toHaveCount(16);
  expect(DATA.levels.length).toBe(16);
  // 1-деңгей: 5x3 тор, бір тау да жоқ, киіз үй мен Бота бар
  await expect(page.locator("[data-bw-title]")).toHaveText("1. Алғашқы қадам");
  await expect(page.locator(".bw-world .bw-t")).toHaveCount(15);
  await expect(page.locator(".bw-world .bw-home")).toHaveCount(1);
  await expect(page.locator(".bw-world .bw-bota")).toHaveCount(1);
  await expect(page.locator(".bw-world svg")).toHaveAttribute("aria-label", /Бота 1-баған, 2-жол, шығысқа қарап тұр/);
  await expect(page.locator("[data-bw-code]")).toHaveValue(DATA.levels[0].starter);
  await expect(page.locator(".bw-chip")).toHaveCount(15);
  await expect(page.locator(".bw-cmds tbody tr")).toHaveCount(10);
  await expect(page.locator("[data-bw-run]")).toBeDisabled();
  await expect(page.locator("[data-bw-status]")).toHaveText(/^Python жүктелмеді/, { timeout: 30_000 });
  // шешімдер: деректе жоқ, беттің мәтінінде де жоқ
  for (const l of DATA.levels) expect(Object.keys(l).sort()).toEqual(["ch", "concept", "goal", "hint", "id", "keys", "s3", "starter", "title", "worlds"]);
  for (const [id, sol] of Object.entries(SOL)) if (sol.length > 30) expect(HTML.includes(JSON.stringify(sol).slice(1, -1)), id).toBe(false);
  // бірнеше әлемді деңгей: қойындылар, сілтеме деңгейді ашады
  await page.locator('[data-level="maze"]').click();
  await expect(page.locator("[data-bw-w]")).toHaveCount(3);
  await expect(page.locator('[data-level="maze"]')).toHaveAttribute("aria-pressed", "true");
  expect(new URL(page.url()).hash).toBe("#l=maze");
  await page.locator('[data-bw-w="2"]').click();
  await expect(page.locator('[data-bw-w="2"]')).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".bw-world .bw-t")).toHaveCount(36);
});

test("деңгей өтеді: жұлдыз сақталады, жетістік есептеледі, келесі деңгейге өтуге болады", async ({ page }) => {
  test.setTimeout(150_000);
  const errs = collectErrors(page);
  await open(page, "academy/bota.html#l=first");
  await run(page, SOL.first);
  await expect(page.locator("[data-bw-verdict]")).toContainText("Деңгей өтті!");
  await expect(page.locator("[data-bw-verdict] .bw-st i.on")).toHaveCount(3);
  await expect(page.locator("[data-bw-verdict]")).toContainText("Кодың: 4 команда.");
  await expect(page.locator('[data-level="first"]')).toHaveClass(/is-done/);
  await expect(page.locator('[data-level="first"] .bw-lvs')).toHaveAttribute("data-stars", "3");
  await expect(page.locator("[data-bw-total]")).toHaveText("3");
  await expect(page.locator(".bw-world svg")).toHaveAttribute("aria-label", /Бота 5-баған, 2-жол/);
  const st = await page.evaluate(() => JSON.parse(localStorage.getItem("ao17cs:bota")));
  expect(st.stars).toEqual({ first: 3 });
  expect(st.code.first).toBe(SOL.first);
  expect(await page.evaluate(() => window.CS50KZ.achievements().find((a) => a.id === "ao17-bota").cur)).toBe(1);
  // ұзын, бірақ дұрыс шешім: 2 жұлдыз (функциясыз оңға бұрылу)
  await page.locator("[data-bw-next]").click();
  await expect(page.locator("[data-bw-title]")).toHaveText("2. Бұрылыс");
  await page.locator('[data-level="right"]').click();
  const long = "алға()\nалға()\nалға()\n" + "солға()\nсолға()\nсолға()\n" + "алға()\nалға()\nалға()\n" + "солға()\nсолға()\nсолға()\n" + "алға()\nалға()\n" + "солға()\nсолға()\nсолға()\n" + "алға()\n";
  await run(page, long);
  await expect(page.locator("[data-bw-verdict]")).toContainText("Деңгей өтті!");
  await expect(page.locator("[data-bw-verdict] .bw-st i.on")).toHaveCount(2);
  await expect(page.locator("[data-bw-verdict]")).toContainText("3 жұлдыз үшін 16 командадан аспауы керек");
  await run(page, SOL.right);
  await expect(page.locator("[data-bw-verdict] .bw-st i.on")).toHaveCount(3);
  // бір жолға нүктелі үтірмен тығыздау ұтыс бермейді
  await page.locator('[data-level="first"]').click();
  await run(page, "алға(); алға(); алға(); алға()");
  await expect(page.locator("[data-bw-verdict]")).toContainText("Кодың: 4 команда.");
  expect(errs).toEqual([]);
});

test("бірнеше әлем: бір әлемге жаттанды код басқасында құлайды, while бәрінде өтеді", async ({ page }) => {
  test.setTimeout(150_000);
  await open(page, "academy/bota.html#l=until");
  await run(page, null);   // бастапқы код: for _ in range(5) - тек 1-әлемге сай
  await expect(page.locator("[data-bw-verdict]")).toContainText("2-әлемде өтпеді");
  await expect(page.locator("[data-bw-verdict]")).toContainText("Бота киіз үйге жеткен жоқ.");
  await expect(page.locator('[data-bw-w="0"]')).toHaveClass(/is-ok/);
  await expect(page.locator('[data-bw-w="1"]')).toHaveClass(/is-bad/);
  await expect(page.locator('[data-bw-w="1"]')).toHaveAttribute("aria-pressed", "true");   // құлаған әлем бірден көрсетіледі
  await page.locator('[data-bw-world="2"]').click();
  await expect(page.locator('[data-bw-w="2"]')).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("[data-bw-verdict]")).toContainText("3-әлемде өтпеді");
  await expect(page.locator("[data-bw-verdict]")).toContainText("3-жолда: Бота тауға не шекараға соқтығысты");
  await expect(page.locator(".ae-hl")).toHaveClass(/bad/);
  await expect(page.locator(".ae-hl")).toBeVisible();
  await run(page, SOL.until);
  await expect(page.locator("[data-bw-verdict]")).toContainText("Барлық 3 әлемде өтті!");
  for (const j of [0, 1, 2]) await expect(page.locator(`[data-bw-w="${j}"]`)).toHaveClass(/is-ok/);
});

test("қателер қазақша түсіндіріледі, жол нөмірімен; шексіз цикл тоқтатылады", async ({ page }) => {
  test.setTimeout(150_000);
  await open(page, "academy/bota.html#l=right");
  const v = page.locator("[data-bw-verdict]");
  await run(page, "алға()\nалға\n");   // жақшасыз команда: Python үнсіз өткізеді, біз ескертеміз
  await expect(v).toContainText("Ескерту (2-жол): «алға» жақшасыз жазылған: команда орындалмады. алға() деп жаз.");
  await run(page, "алға()\nоңға()\n");
  await expect(v).toContainText("2-жолда: «оңға» командасы жоқ: оны өзің функция етіп жаз");
  await expect(v.locator(".bw-v-py")).toContainText("NameError: name 'оңға' is not defined");
  await run(page, "алға(\n");
  await expect(v).toContainText("1-жолда: Жақша сәйкес емес");
  await run(page, "for _ in range(3)\n    алға()\n");
  await expect(v).toContainText("Қос нүкте жетпейді");
  await run(page, "for _ in range(3):\nалға()\n");
  await expect(v).toContainText("Шегініс керек");
  await run(page, "алға(3)\n");
  await expect(v).toContainText("жақша ішіне ештеңе қабылдамайды");
  await run(page, "while True:\n    pass\n");
  await expect(v).toContainText("Код тым ұзақ орындалды: шексіз цикл болуы мүмкін.");
  await run(page, "while True:\n    солға()\n");
  await expect(v).toContainText("Тым көп әрекет");
  await expect(page.locator("[data-bw-status]")).toHaveText("Қате бар");
  // print шығысы көрсетіледі
  await page.locator('[data-level="first"]').click();
  await run(page, "print('Сәлем, Бота!')\n" + SOL.first);
  await expect(page.locator("[data-bw-out]")).toHaveText("Сәлем, Бота!\n");
});

test("анимация: қадамдап режимі әр әрекетте код жолын белгілейді, «Соңына өту» бірден аяқтайды", async ({ page }) => {
  test.setTimeout(150_000);
  await open(page, "academy/bota.html#l=turn");
  await page.locator("[data-bw-code]").fill(SOL.turn);
  await page.locator("[data-bw-speed]").selectOption("1");
  const bota = page.locator(".bw-bota");
  const start = await bota.evaluate((e) => e.style.transform);
  await page.locator("[data-bw-step]").click();
  await expect(page.locator("[data-bw-n]")).toHaveText("1");
  await expect(page.locator(".ae-hl")).toBeVisible();
  expect(await page.locator(".ae-hl").evaluate((e) => e.style.transform)).toBe("translateY(14px)");   // 1-жол
  expect(await bota.evaluate((e) => e.style.transform)).not.toBe(start);
  await page.locator("[data-bw-step]").click();
  await expect(page.locator("[data-bw-n]")).toHaveText("2");
  expect(await page.locator(".ae-hl").evaluate((e) => e.style.transform)).toBe("translateY(38px)");   // 2-жол
  await expect(page.locator("[data-bw-verdict]")).toBeHidden();
  // толық ойнату: батырма «Соңына өту» болады, басқанда нәтиже бірден
  await page.locator("[data-bw-speed]").selectOption("2");
  await page.locator("[data-bw-run]").click();
  await expect(page.locator("[data-bw-run]")).toHaveText("Соңына өту");
  await page.locator("[data-bw-run]").click();
  await expect(page.locator("[data-bw-verdict]")).toContainText("Деңгей өтті!");
  await expect(page.locator("[data-bw-run]")).toHaveText("Іске қосу");
  await expect(page.locator("[data-bw-n]")).toHaveText("6");
  // Бота бұрылды: арқасынан көрінеді (солтүстікке қарап тұр)
  await expect(page.locator(".bw-spr use")).toHaveAttribute("href", "#bw-s-back");
});

test("редактор: Enter шегіністі сақтайды, түйме команданы курсорға қояды, Esc + Tab редактордан шығарады", async ({ page }) => {
  await blockFonts(page.context());
  await page.route(/pyodide/, (r) => r.abort());
  await page.goto("academy/bota.html#l=until");
  const ta = page.locator("[data-bw-code]");
  await ta.fill("");
  await ta.focus();
  await page.keyboard.type("while not үйде():");
  await page.keyboard.press("Enter");
  await page.keyboard.type("алға()");
  await page.keyboard.press("Enter");
  await expect(ta).toHaveValue("while not үйде():\n    алға()\n    ");
  await page.keyboard.press("Backspace");   // бір шегініс деңгейін өшіреді
  await expect(ta).toHaveValue("while not үйде():\n    алға()\n");
  await page.keyboard.press("Tab");
  await expect(ta).toHaveValue("while not үйде():\n    алға()\n    ");
  await page.locator('.bw-chip[data-ins="солға()"]').click();
  await expect(ta).toHaveValue("while not үйде():\n    алға()\n    солға()");
  await page.locator('.bw-chip', { hasText: /^if$/ }).click();
  await expect(ta).toHaveValue("while not үйде():\n    алға()\n    солға()\n    if алма_бар():\n        ");
  await expect(page.locator(".ae-gut")).toHaveText(/^1\n2\n3\n4\n5\n$/);
  await ta.focus();
  await page.keyboard.press("Escape");
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => document.activeElement && document.activeElement.matches("[data-bw-code]"))).toBe(false);
  // код деңгей бойынша сақталады
  await page.locator('[data-level="first"]').click();
  await page.locator('[data-level="until"]').click();
  await expect(ta).toHaveValue("while not үйде():\n    алға()\n    солға()\n    if алма_бар():\n        ");
  await page.locator("[data-bw-reset]").click();
  await expect(ta).toHaveValue(DATA.levels.find((l) => l.id === "until").starter);
});

test("курс бетінде 4, 6, 7, 9-апталарда Бота сілтемесі, «Python алаңы» прогресі; бет ережесі: жария", async ({ page }) => {
  await blockFonts(page.context());
  await page.goto("academy/course.html");
  const want = { 4: "first", 6: "long", 7: "right", 9: "deliver" };
  for (const [w, id] of Object.entries(want)) await expect(page.locator(`#w${w} .crs-bota a`)).toHaveAttribute("href", `bota.html#l=${id}`);
  await expect(page.locator(".crs-bota")).toHaveCount(4);
  // «Python алаңы» бөлімі: Бота әлемі мен Ою студиясы, оқушының прогресімен
  await expect(page.locator("#play .crs-pl")).toHaveCount(2);
  await expect(page.locator('[data-play="bota"]')).toHaveText("Бірінші деңгейден баста");
  await page.evaluate(() => { localStorage.setItem("ao17cs:bota", JSON.stringify({ stars: { first: 3, turn: 2, apples: 0 } })); localStorage.setItem("ao17cs:oyu", JSON.stringify({ done: { square: 1 } })); });
  await page.reload();
  await expect(page.locator('[data-play="bota"]')).toHaveText("Өткен деңгей: 2 / 16 · жұлдыз: 5 / 48");
  await expect(page.locator('[data-play="oyu"]')).toHaveText("Орындалған тапсырма: 1 / 8");
  await expect(page.locator("#play .crs-pl-oyu polyline")).not.toHaveCount(0);
  await page.locator(`#w7 .crs-bota a`).click();
  await expect(page).toHaveURL(/academy\/bota\.html#l=right$/);
  await expect(page.locator("[data-bw-title]")).toHaveText("4. Оңға бұрылу");
  const out = execFileSync("python3", ["-c", "import sys; sys.path.insert(0, 'tools'); import gate; print(gate.page_rule('academy/bota.html'))"], { cwd: ROOT, encoding: "utf8" }).trim();
  expect(out).toBe("None");
});

test("қозғалыс азайтылғанда анимация жоқ: нәтиже бірден, Бота соңғы орнында", async ({ browser }) => {
  test.setTimeout(150_000);
  const c = await browser.newContext({ reducedMotion: "reduce" });
  await blockFonts(c);
  await routePyodide(c);
  const p = await c.newPage();
  await p.goto("academy/bota.html#l=apples");
  await expect(p.locator("[data-bw-status]")).toHaveText("Python дайын", { timeout: 90_000 });
  await p.locator("[data-bw-code]").fill(SOL.apples);
  await p.locator("[data-bw-speed]").selectOption("2");   // баяу таңдалса да
  await p.locator("[data-bw-run]").click();
  await expect(p.locator("[data-bw-verdict]")).toContainText("Деңгей өтті!", { timeout: 2_000 });
  await expect(p.locator("[data-bw-bag]")).toHaveText("2");
  await expect(p.locator(".bw-world .bw-ap")).toHaveCount(0);
  expect(await p.locator(".bw-bota").evaluate((e) => e.style.transitionDuration)).toBe("0ms");
  await c.close();
});

for (const scheme of ["light", "dark"]) {
  test(`360px, ${scheme}: көлденең жылжымайды, axe таза`, async ({ browser }) => {
    test.setTimeout(150_000);
    const c = await browser.newContext({ viewport: { width: 360, height: 760 }, colorScheme: scheme, reducedMotion: "reduce" });
    await blockFonts(c);
    await routePyodide(c);
    const p = await c.newPage();
    const errs = collectErrors(p);
    await p.goto("academy/bota.html#l=maze");
    await expect(p.locator("[data-bw-status]")).toHaveText("Python дайын", { timeout: 90_000 });
    await run(p, "while not үйде():\n    алға()\n");
    await expect(p.locator("[data-bw-verdict]")).toContainText("өтпеді");
    await p.locator(".bw-tip summary").click();
    expect(await p.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
    await p.addScriptTag({ content: AXE });
    const v = await p.evaluate(async () => (await axe.run(document.getElementById("main"), { runOnly: ["wcag2a", "wcag2aa"], resultTypes: ["violations"] })).violations
      .filter((x) => x.impact === "serious" || x.impact === "critical").map((x) => `${x.id}: ${x.nodes[0].target.join(" ")}`));
    expect(v, v.join("\n")).toEqual([]);
    expect(errs).toEqual([]);
    await c.close();
  });
}
