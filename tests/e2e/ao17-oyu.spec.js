// © 2026 AO17 командасы. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md.
// Ою студиясы (tools/academy/oyu.py, assets/py/oyu_turtle.py, assets/js/ao17-oyu.js). Python (Pyodide) жергілікті бумадан
// беріледі (routePyodide). Тексереміз: галерея build кезінде салынған (Python-сыз да көрінеді); код нағыз Python-да орындалып,
// сурет салынады; тапсырма шешімі «Дәл келді!», қате сурет - ұқсастық пайызы; Python қатесі жол нөмірімен; шексіз цикл бетті
// қатырмайды; import turtle; сілтемемен бөлісу; SVG жүктеу; курс беті мен бет ережесі; 360px, axe.
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const ROOT = path.resolve(__dirname, "../..");
const { blockFonts, collectErrors, routePyodide } = require("../support/helpers");
const AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const DATA = JSON.parse(fs.readFileSync(path.join(ROOT, "academy/oyu.html"), "utf8").match(/<script type="application\/json" id="oy-data">([\s\S]*?)<\/script>/)[1].replace(/<\\\//g, "</"));
// тапсырма шешімдері (тест үшін; бетке шешім жазылмайды - тек мақсат суреті)
const SOL = {
  square: "for _ in range(4):\n    forward(100)\n    left(90)\n",
  star: "for _ in range(8):\n    forward(150)\n    left(135)\n",
};

async function open(page, url = "academy/oyu.html") {
  await blockFonts(page.context());
  await routePyodide(page.context());
  await page.goto(url);
  await expect(page.locator("[data-oy-status]")).toHaveText(/Python дайын|Дайын:/, { timeout: 90_000 });
}
async function runCode(page, code) {
  await page.locator("[data-oy-code]").fill(code);
  await page.locator("[data-oy-run]").click();
}

test("галерея мен тапсырмалар Python жүктелмей-ақ көрінеді: 6 ою build кезінде салынған, 8 тапсырманың мақсаты бар", async ({ page }) => {
  await blockFonts(page.context());
  await page.route(/pyodide/, (r) => r.abort());   // Python жоқ болса да бет толық
  await page.goto("academy/oyu.html");
  await expect(page.locator(".oy-ex")).toHaveCount(6);
  for (const t of await page.locator(".oy-ex svg").all()) expect(await t.locator("polyline, polygon, circle").count()).toBeGreaterThan(0);
  await expect(page.locator(".oy-task")).toHaveCount(8);
  expect(DATA.tasks.every((t) => t.target.length > 0 && t.starter && !("solution" in t))).toBe(true);
  await expect(page.locator(".oy-cmds tr")).toHaveCount(13);
});

test("код Python-да орындалады, сурет сызылады; тапсырма: дұрыс шешім - «Дәл келді», бастапқы код - ұқсастық пайызы", async ({ page }) => {
  test.setTimeout(150_000);
  const errs = collectErrors(page);
  await open(page);
  // бастапқы күй: қошқар мүйіз сызылған
  await expect(page.locator("[data-oy-draw] polyline")).not.toHaveCount(0);
  await page.locator('[data-task="square"]').click();
  await expect(page.locator('[data-task="square"]')).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("[data-oy-target] polyline")).toHaveCount(1);
  await expect(page.locator("[data-oy-code]")).toHaveValue(DATA.tasks[0].starter);
  await page.locator("[data-oy-check]").click();
  await expect(page.locator("[data-oy-verdict]")).toHaveText(/^Әлі ұқсамайды: ұқсастық \d+%/);
  await runCode(page, SOL.square);
  await expect(page.locator("[data-oy-status]")).toHaveText("Дайын: 4 қозғалыс");
  await page.locator("[data-oy-check]").click();
  await expect(page.locator("[data-oy-verdict]")).toHaveText("Дәл келді! «Шаршы» тапсырмасы орындалды.");
  await expect(page.locator('[data-task="square"]')).toHaveClass(/is-done/);
  // оңға бұрылып салса, шаршы басқа ширекте шығады: мақсатпен ұқсамайды
  await runCode(page, "for _ in range(4):\n    forward(100)\n    right(90)\n");
  await page.locator("[data-oy-check]").click();
  await expect(page.locator("[data-oy-verdict]")).toHaveText(/^Әлі ұқсамайды/);
  // жұлдыз
  await page.locator('[data-task="star"]').click();
  await runCode(page, SOL.star);
  await page.locator("[data-oy-check]").click();
  await expect(page.locator("[data-oy-verdict]")).toHaveText("Дәл келді! «Сегіз қырлы жұлдыз» тапсырмасы орындалды.");
  const st = await page.evaluate(() => JSON.parse(localStorage.getItem("ao17cs:oyu")));
  expect(Object.keys(st.done).sort()).toEqual(["square", "star"]);
  expect(st.code.star).toBe(SOL.star);
  // жетістік: 4 тапсырмадан кейін
  expect(await page.evaluate(() => window.CS50KZ.achievements().find((a) => a.id === "ao17-oyu").cur)).toBe(2);
  expect(errs).toEqual([]);
});

test("Python қатесі жол нөмірімен, шексіз цикл тоқтатылады, import turtle мен print жұмыс істейді", async ({ page }) => {
  test.setTimeout(150_000);
  await open(page);
  await runCode(page, "forward(50)\nleft(90\n");
  await expect(page.locator("[data-oy-out]")).toHaveText(/^Қате \(2-жол\): Синтаксис қатесі/);
  await expect(page.locator("[data-oy-status]")).toHaveText("Қате бар");
  await runCode(page, "x = 0\nwhile True:\n    x += 1\n");
  await expect(page.locator("[data-oy-out]")).toContainText("шексіз цикл болуы мүмкін");
  await runCode(page, "while True:\n    forward(1)\n");
  await expect(page.locator("[data-oy-out]")).toContainText("Тым көп қозғалыс");
  await runCode(page, "import turtle\nturtle.color('көк')\nturtle.circle(80)\nprint('Сәлем, ою!')\n");
  await expect(page.locator("[data-oy-out]")).toHaveText("Сәлем, ою!\n");
  await expect(page.locator("[data-oy-draw] polyline")).toHaveAttribute("stroke", "#1d6ea6");
  await runCode(page, "from turtle import *\nfillcolor('алтын')\nbegin_fill()\nfor _ in range(3):\n    fd(80); lt(120)\nend_fill()\n");
  await expect(page.locator("[data-oy-draw] polygon")).toHaveAttribute("fill", "#c99a2e");
});

test("сілтемемен бөлісу: код сілтемеде, ашқанда сол сурет; галереядан ою ашылады; SVG жүктеледі", async ({ page, context }) => {
  test.setTimeout(150_000);
  await open(page);
  await page.locator('[data-example="tort"]').click();
  await expect(page.locator("[data-oy-code]")).toHaveValue(DATA.examples.find((e) => e.id === "tort").code);
  const code = "color('қызыл')\nfor _ in range(6):\n    forward(90)\n    left(60)\n# Алаш\n";
  await runCode(page, code);
  await page.locator("[data-oy-share]").click();
  const link = await page.locator("[data-oy-link]").inputValue();
  expect(link).toMatch(/academy\/oyu\.html#k=[A-Za-z0-9_-]+$/);
  const [dl] = await Promise.all([page.waitForEvent("download"), page.locator("[data-oy-svgdl]").click()]);
  expect(dl.suggestedFilename()).toBe("ao17-oyu.svg");
  expect(fs.readFileSync(await dl.path(), "utf8")).toMatch(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"[\s\S]*<polyline[\s\S]*#b3262e/);
  const p2 = await context.newPage();
  await p2.goto(link.replace(/^https?:\/\/[^/]+\//, "/"));
  await expect(p2.locator("[data-oy-code]")).toHaveValue(code);
  await expect(p2.locator("[data-oy-status]")).toHaveText(/^Дайын:/, { timeout: 90_000 });
  await expect(p2.locator("[data-oy-draw] polyline")).toHaveCount(1);
});

test("курс бетінде Python апталарында студия сілтемесі; бет ережесі: жария", async ({ page }) => {
  await blockFonts(page.context());
  await page.goto("academy/course.html");
  for (const w of [6, 7, 9]) await expect(page.locator(`#w${w} .crs-oyu a`)).toHaveAttribute("href", "oyu.html");
  await expect(page.locator(".crs-oyu")).toHaveCount(3);
  const out = execFileSync("python3", ["-c", "import sys; sys.path.insert(0, 'tools'); import gate; print(gate.page_rule('academy/oyu.html'))"], { cwd: ROOT, encoding: "utf8" }).trim();
  expect(out).toBe("None");
});

for (const scheme of ["light", "dark"]) {
  test(`360px, ${scheme}: студия көлденең жылжымайды, axe таза`, async ({ browser }) => {
    test.setTimeout(150_000);
    const c = await browser.newContext({ viewport: { width: 360, height: 760 }, colorScheme: scheme, reducedMotion: "reduce" });
    await blockFonts(c);
    await routePyodide(c);
    const p = await c.newPage();
    const errs = collectErrors(p);
    await p.goto("academy/oyu.html");
    await expect(p.locator("[data-oy-status]")).toHaveText(/Python дайын|Дайын:/, { timeout: 90_000 });
    await p.locator('[data-task="horn"]').click();
    await p.locator("[data-oy-check]").click();
    expect(await p.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
    await p.addScriptTag({ content: AXE });
    const v = await p.evaluate(async () => (await axe.run(document.getElementById("main"), { runOnly: ["wcag2a", "wcag2aa"], resultTypes: ["violations"] })).violations
      .filter((x) => x.impact === "serious" || x.impact === "critical").map((x) => `${x.id}: ${x.nodes[0].target.join(" ")}`));
    expect(v, v.join("\n")).toEqual([]);
    expect(errs).toEqual([]);
    await c.close();
  });
}
