// © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md.
// AO17 IELTS Academy (2-пакет): Listening Test (4 бөлім, 40 сұрақ) және Pronunciation Lab.
// Тексереміз: валидатор (сөз шегі, емле, нұсқалар, тұзақ, қайталау), жаттығу режимі (түсіндірме + дәлел жолы), карта белгілеу,
// бағыт жаттығуы, тест режимі (бір рет тыңдау, соңында тексеру, шолу), fallback, айтылым жаттығуларының ұпайы,
// SpeechRecognition / MediaRecorder стабтары, консоль қатесі жоқ, 360px, axe (жарық/қараңғы).
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const { blockFonts, collectErrors } = require("../support/helpers");
const AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const LT = "academy/ielts/listening-test.html", PR = "academy/ielts/pronunciation.html";

function stubSpeech(context) {
  return context.addInitScript(() => {
    window.__LT_CFG = { read: 1, check: 2, gap: 0 };
    window.SpeechSynthesisUtterance = class { constructor(t) { this.text = t; } };
    const ss = {
      getVoices: () => [{ name: "Test GB Female", lang: "en-GB" }, { name: "Test GB Male", lang: "en-GB" }, { name: "Test GB Daniel", lang: "en-GB" }],
      speak(u) { (window.__spoken = window.__spoken || []).push(u.text); this._t = setTimeout(() => u.onend && u.onend({}), 5); },
      cancel() { clearTimeout(this._t); }, pause() {}, resume() {}, addEventListener() {},
    };
    Object.defineProperty(window, "speechSynthesis", { value: ss, configurable: true });
  });
}
function stubMicAndSR(context) {
  return context.addInitScript(() => {
    Object.defineProperty(navigator, "mediaDevices", { value: { getUserMedia: async () => ({ getTracks: () => [{ stop() {} }] }) }, configurable: true });
    window.MediaRecorder = class {
      constructor() { this.state = "inactive"; this.mimeType = "audio/webm"; }
      start() { this.state = "recording"; }
      stop() { this.state = "inactive"; if (this.ondataavailable) this.ondataavailable({ data: new Blob(["x"], { type: "audio/webm" }) }); setTimeout(() => this.onstop && this.onstop(), 0); }
    };
    const SR = class {
      start() { setTimeout(() => { this.onresult && this.onresult({ results: [[{ transcript: window.__srSay || "sheep" }, { transcript: window.__srSay ? "chip" : "ship" }]] }); this.onend && this.onend(); }, 10); }
      abort() {}
    };
    Object.defineProperty(window, "webkitSpeechRecognition", { value: SR, configurable: true, writable: true });
    Object.defineProperty(window, "SpeechRecognition", { value: SR, configurable: true, writable: true });
  });
}

test("Listening Test: валидатор - сөз шегі, емле, нұсқалар, тұзақ, қайталау", async ({ page }) => {
  await blockFonts(page.context());
  await stubSpeech(page.context());
  const errs = collectErrors(page);
  await page.goto(LT);
  const r = await page.evaluate(() => {
    const D = window.IELTS_LT, V = window.IELTS_LT_VALIDATE, all = [];
    D.parts.forEach((p) => p.groups.forEach((g) => g.qs.forEach((q) => all.push({ q, g }))));
    const c = (n, a) => { const x = all.find((y) => y.q.n === n); return x.g.lim ? V.gap(x.q, a, D.limits[x.g.lim]).code : V.choice(x.q, a).code; };
    return {
      n: all.length,
      ok: [c(1, "FENWICK"), c(5, "thirty"), c(7, "£36"), c(7, "36 pounds"), c(9, "ninth"), c(9, "the 9th"), c(33, "70%"), c(36, "UV"), c(2, "mill street")],
      dist: [c(1, "Fenwich"), c(5, "40"), c(7, "forty-eight"), c(37, "temperature"), c(38, "draught"), c(18, "A")],
      spell: [c(1, "Fenwik"), c(10, "collegue"), c(31, "sucullents")],
      limit: [c(33, "70 per cent"), c(35, "bees and beetles")],
      repeat: [c(4, "leisure group"), c(6, "the library"), c(9, "9th March")],
      plural: [c(8, "light"), c(40, "grant")], blank: c(20, ""),
    };
  });
  expect(r.n).toBe(40);
  expect(r.ok.every((x) => x === "ok")).toBe(true);
  expect(r.dist).toEqual(Array(6).fill("distractor"));
  expect(r.spell).toEqual(Array(3).fill("spelling"));
  expect(r.limit).toEqual(["word-limit", "word-limit"]);
  expect(r.repeat).toEqual(Array(3).fill("repeat"));
  expect(r.plural).toEqual(["plural", "plural"]);
  expect(r.blank).toBe("blank");
  expect(errs).toEqual([]);
});

test("Listening Test: жаттығу - Part 1 түсіндірме, дәлел жолы, Part 2 карта белгілеу, бағыт жаттығуы", async ({ page }) => {
  await blockFonts(page.context());
  await stubSpeech(page.context());
  await page.context().addInitScript(() => { window.__LT_CFG = { read: 1, check: 2, gap: 4000 }; }); // жолдар арасы ұзақ: уақыт сызығын тексеруге үлгереміз
  const errs = collectErrors(page);
  await page.goto(LT);
  await expect(page.locator("#lt-fallback")).toBeHidden();
  await expect(page.locator("#lt-tabs [role=tab]")).toHaveCount(4);
  // ойнатқыш
  await page.click("#lt-play");
  await expect.poll(() => page.evaluate(() => (window.__spoken || []).some((t) => t.includes("Greenway")))).toBe(true);
  await page.locator("#lt-tl .ie-seg").nth(1).click();
  await expect(page.locator("#lt-tl .ie-seg").nth(1)).toHaveAttribute("aria-current", "true");
  await expect.poll(() => page.evaluate(() => (window.__spoken || []).some((t) => t.includes("Fourteen, Mill Street")))).toBe(true);
  // Part 1
  await page.fill("#lt-a1", "Fenwich");
  await page.fill("#lt-a5", "30");
  await page.fill("#lt-a10", "collegue");
  await page.click("#lt-check-1");
  await expect(page.locator("#lt-fb1")).toHaveClass(/tt-bad/);
  await expect(page.locator("#lt-fb1")).toContainText("No, it's K at the end");
  await expect(page.locator("#lt-fb5")).toHaveClass(/tt-ok/);
  await expect(page.locator("#lt-fb10")).toContainText("Емле қатесі");
  await expect(page.locator("#lt-fb2")).toContainText("Жауап жоқ");
  await expect(page.locator("#lt-pout-1")).toContainText("Part 1: 1 / 10");
  await expect(page.locator("#lt-tr-1")).toBeVisible();
  await page.locator('[data-ev="1"] button').first().click();
  await expect(page.locator("#lt-l-0-0-5")).toHaveClass(/ie-key/);
  await expect(page.locator("#lt-l-0-0-5")).toHaveClass(/lt-focus/);
  await expect(page.locator("#lt-l-0-0-4")).toHaveClass(/lt-trap/);
  // Part 2: карта
  await page.click("#lt-tab-2");
  await expect(page.locator("#lt-panel-2")).toBeVisible();
  await expect(page.locator("#lt-map-q .lt-m-let")).toHaveCount(8);
  for (const [n, v] of [[16, "B"], [17, "C"], [18, "A"], [19, "G"], [20, "E"]]) await page.selectOption(`#lt-a${n}`, v);
  await page.locator("input[name=lt-r11][value='1']").check();
  await page.click("#lt-check-2");
  await expect(page.locator("#lt-fb16")).toHaveClass(/tt-ok/);
  await expect(page.locator("#lt-fb18")).toContainText("used to be right next to us");
  await expect(page.locator("#lt-fb20")).toContainText("viewing platform");
  await expect(page.locator("#lt-a18")).toHaveClass(/no/);
  await expect(page.locator("#lt-pout-2")).toContainText("4 / 10");
  // Part 3 matching
  await page.click("#lt-tab-3");
  await page.selectOption("#lt-a26", "B");
  await page.click("#lt-check-3");
  await expect(page.locator("#lt-fb26")).toContainText("I'm not sure about portion size");
  // бағыт жаттығуы: дұрыс жауапты генератордан аламыз
  const a = await page.evaluate(() => { const t = document.querySelector(".lt-dirtext").textContent; return t; });
  expect(a.length).toBeGreaterThan(20);
  const g = await page.evaluate(() => window.IELTS_LT_MAP.gen(null));
  expect(["left", "right"].some((w) => g.text.includes(w)) || g.a === "H").toBe(true);
  expect(g.why).toContain(g.start === "VC" ? "Солтүстікке" : "Оңтүстікке");
  await page.locator("#lt-dir .lab-choice button").first().click();
  await expect(page.locator("#lt-dir .tt-fb")).toBeVisible();
  await expect(page.locator("#lt-map-d .lt-m-line")).toHaveCount(1);
  const sk = await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem("ao17:tutor:v1")).skills));
  expect(sk).toEqual(expect.arrayContaining(["ielts.listening.form", "ielts.listening.map", "ielts.listening.mc", "ielts.listening.matching", "ielts.listening.directions"]));
  expect(errs).toEqual([]);
});

test("Listening Test: тест режимі - бір рет, оқу уақыты, тексеру соңында, шолу", async ({ page }) => {
  test.setTimeout(150_000);
  await blockFonts(page.context());
  await stubSpeech(page.context());
  await page.context().addInitScript(() => { window.__LT_CFG = { read: 1, check: 2, gap: 120 }; }); // Part 1 ≈ 4 с - тест ортасында тексереміз
  const errs = collectErrors(page);
  await page.goto(LT);
  await page.locator("input[name=lt-mode][value=test]").check();
  await expect(page.locator("#lt-testbar")).toBeVisible();
  await expect(page.locator("#lt-play")).toBeDisabled();
  await expect(page.locator("#lt-check-1")).toBeHidden();
  await page.click("#lt-start");
  await expect(page.locator("#lt-phase")).toContainText("оқу уақыты");
  await expect.poll(() => page.evaluate(() => (window.__spoken || []).some((t) => t.startsWith("Part 1. You will hear")))).toBe(true);
  await expect(page.locator("#lt-phase")).toContainText("бір рет қана");
  await expect(page.locator("#lt-tr-1")).toBeHidden();
  await expect(page.locator("#lt-replay")).toBeDisabled();
  await page.fill("#lt-a1", "Fenwick");
  await page.fill("#lt-a7", "36");
  await expect(page.locator("#lt-fb1")).toBeEmpty(); // тексеру тек соңында
  await expect(page.locator("#lt-phase")).toContainText("Part 2", { timeout: 30_000 });
  await page.click("#lt-tab-2"); // басқа бөлімнің сұрақтарын көруге болады
  await page.selectOption("#lt-a16", "B");
  await expect(page.locator("#lt-phase")).toContainText("2 минут", { timeout: 60_000 });
  await expect(page.locator("#lt-review")).toBeVisible({ timeout: 10_000 });
  await expect(page.locator("#lt-score")).toHaveText("3 / 40");
  await expect(page.locator("#lt-review")).toContainText("Band бағасына аудару берілмейді");
  await expect(page.locator("#lt-rv-list li")).toHaveCount(40);
  await expect(page.locator("#lt-fb1")).toHaveClass(/tt-ok/);
  await expect(page.locator("#lt-fb2")).toHaveClass(/tt-bad/);
  // әр бөлім бір рет қана ойнатылды
  const counts = await page.evaluate(() => ["Good evening, Greenway", "Good morning, everyone, and welcome", "Come in, Maya", "Today I'm going to talk about green roofs"].map((s) => window.__spoken.filter((t) => t.startsWith(s)).length));
  expect(counts).toEqual([1, 1, 1, 1]);
  // шолу: транскрипт ашық, қайта тыңдауға болады
  await page.locator("#lt-rv-list li").nth(19).getByRole("button").click();
  await expect(page.locator("#lt-tr-2")).toBeVisible();
  await expect(page.locator("#lt-l-1-7-2")).toHaveClass(/lt-focus/);
  await expect(page.locator("#lt-replay")).toBeEnabled();
  await expect(page.locator("main")).not.toContainText(/band\s*[0-9]/i);
  expect(errs).toEqual([]);
});

test("Listening Test: тестті ерте аяқтау екі рет растауды сұрайды", async ({ page }) => {
  await blockFonts(page.context());
  await stubSpeech(page.context());
  await page.goto(LT);
  await page.locator("input[name=lt-mode][value=test]").check();
  await page.click("#lt-start");
  await page.click("#lt-submit");
  await expect(page.locator("#lt-review")).toBeHidden();
  await expect(page.locator("#lt-submit")).toContainText("Иә");
  await page.click("#lt-submit");
  await expect(page.locator("#lt-review")).toBeVisible();
  await expect(page.locator("#lt-score")).toHaveText("0 / 40");
});

test("Listening Test: speechSynthesis жоқ - адал оқу режимі", async ({ page }) => {
  await blockFonts(page.context());
  await page.context().addInitScript(() => { Object.defineProperty(window, "speechSynthesis", { value: undefined, configurable: true }); });
  const errs = collectErrors(page);
  await page.goto(LT);
  await expect(page.locator("#lt-fallback")).toBeVisible();
  await expect(page.locator("#lt-tr-1")).toBeVisible();
  await expect(page.locator("#lt-play")).toBeDisabled();
  await expect(page.locator("input[name=lt-mode][value=test]")).toBeDisabled();
  await page.fill("#lt-a6", "library");
  await page.click("#lt-check-1");
  await expect(page.locator("#lt-fb6")).toHaveClass(/tt-ok/);
  expect(errs).toEqual([]);
});

test("Pronunciation: минималды жұп жаттығуының ұпайы, сөз/сөйлем екпіні, интонация, байланыстыру", async ({ page }) => {
  await blockFonts(page.context());
  await stubSpeech(page.context());
  const errs = collectErrors(page);
  await page.goto(PR);
  await expect(page.locator("#pr-kz .pr-kcard")).toHaveCount(9);
  await expect(page.locator("#pr-cinfo")).toContainText("ұзақтығы сөз мағынасын өзгертпейді");
  // 8 айналым: 6 дұрыс, 2 қате (айтылған сөз - соңғы speak)
  const last = () => page.evaluate(() => window.__spoken[window.__spoken.length - 1]);
  await page.click("#pr-d-start");
  for (let i = 0; i < 8; i++) {
    const w = await last();
    const btn = i < 6 ? page.locator(`#pr-d-opts button[data-w="${w}"]`) : page.locator(`#pr-d-opts button:not([data-w="${w}"])`);
    await btn.click();
    if (i === 6) await expect(page.locator("#pr-d-fb")).toContainText("Айтылғаны");
    if (i < 7) await page.locator("#pr-d-fb .pr-next").click();
  }
  await expect(page.locator("#pr-d-score")).toHaveText("6 / 8");
  await expect(page.locator("#pr-d-fb")).toContainText("Айналым аяқталды: 6 / 8");
  // контраст ауыстыру
  await page.locator("#pr-contrasts button", { hasText: "/θ/ - /s/" }).click();
  await expect(page.locator("#pr-cinfo")).toContainText("тістің арасына");
  await expect(page.locator("#pr-d-score")).toHaveText("0 / 8");
  // сөз екпіні: дұрыс буынды деректен табамыз
  const ws = await page.evaluate(() => { const w = document.querySelector(".pr-wsword").textContent; return window.IELTS_PRON.stress.find((x) => x.w === w).s; });
  await page.locator(`#pr-ws .pr-sb[data-i="${ws}"]`).click();
  await expect(page.locator("#pr-ws .tt-fb")).toHaveClass(/tt-ok/);
  await expect(page.locator(`#pr-ws .pr-sb[data-i="${ws}"]`)).toHaveClass(/st/);
  // сөйлем екпіні: «I want to go to the shops.» - тек want пен go белгілейміз, ал «to» артық
  await page.locator("#pr-ss .pr-wt").nth(1).click();
  await page.locator("#pr-ss .pr-wt").nth(2).click();
  await page.click("#pr-ss-check");
  await expect(page.locator("#pr-ss .tt-fb")).toHaveClass(/tt-bad/);
  await expect(page.locator("#pr-ss .tt-fb")).toContainText("Белгіленбеген мағыналы сөз(дер): go, shops");
  await expect(page.locator("#pr-ss .tt-fb")).toContainText("Артық белгіленген: to");
  await expect(page.locator("#pr-ss .pr-weak").first()).toHaveText("/tə/");
  // интонация
  const ia = await page.evaluate(() => window.IELTS_PRON.intonation.find((x) => x.q === document.querySelector("#pr-in .ie-qcard").textContent).a);
  await page.locator(`#pr-in button[data-v="${ia}"]`).click();
  await expect(page.locator("#pr-in .tt-fb")).toHaveClass(/tt-ok/);
  await expect(page.locator("#pr-in svg polyline")).toHaveCount(1);
  // байланыстыру: қате тип
  const ct = await page.evaluate(() => { const ex = document.querySelector("#pr-cs .ie-qcard").firstChild.textContent; return window.IELTS_PRON.connected.find((x) => x.ex === ex).type; });
  const wrongT = ["link", "elision", "assim", "intrusion"].find((t) => t !== ct);
  await page.locator(`#pr-cs button[data-v="${wrongT}"]`).click();
  await expect(page.locator("#pr-cs .tt-fb")).toHaveClass(/tt-bad/);
  const sk = await page.evaluate(() => JSON.parse(localStorage.getItem("ao17:tutor:v1")).skills);
  expect(Object.keys(sk)).toEqual(expect.arrayContaining(["ielts.pron.minimal", "ielts.pron.wordstress", "ielts.pron.sentstress", "ielts.pron.intonation", "ielts.pron.connected"]));
  expect(errs).toEqual([]);
});

test("Pronunciation: SpeechRecognition (шамамен тану) және жергілікті жазба", async ({ page }) => {
  await blockFonts(page.context());
  await stubSpeech(page.context());
  await stubMicAndSR(page.context());
  const errs = collectErrors(page);
  await page.goto(PR);
  await expect(page.locator("#pr-sr")).toBeVisible();
  await page.selectOption("#pr-sp-word", "sheep");
  await page.click("#pr-sr-go");
  await expect(page.locator("#pr-sp-out")).toContainText("Браузер «sheep» деп таныды");
  await expect(page.locator("#pr-sp-out")).toContainText("бағалау емес");
  await page.evaluate(() => { window.__srSay = "ship"; });
  await page.click("#pr-sr-go");
  await expect(page.locator("#pr-sp-out")).toContainText("Браузер «ship» деп естіді");
  await page.click("#pr-rec");
  await expect(page.locator("#pr-rec")).toContainText("Тоқтату");
  await page.click("#pr-rec");
  await expect(page.locator("#pr-rec-list li audio")).toHaveCount(1);
  await expect(page.locator("#pr-rec-msg")).toContainText("ешқайда жіберілмейді");
  await page.locator("#pr-rec-list li").getByRole("button", { name: "Жазбаны өшіру" }).click();
  await expect(page.locator("#pr-rec-list li")).toHaveCount(0);
  expect(errs).toEqual([]);
});

test("Pronunciation: SpeechRecognition жоқ - тану бөлімі жасырын, speechSynthesis жоқ - ескерту", async ({ page }) => {
  await blockFonts(page.context());
  await page.context().addInitScript(() => { Object.defineProperty(window, "speechSynthesis", { value: undefined, configurable: true }); Object.defineProperty(window, "webkitSpeechRecognition", { value: undefined, configurable: true }); Object.defineProperty(window, "SpeechRecognition", { value: undefined, configurable: true }); });
  const errs = collectErrors(page);
  await page.goto(PR);
  await expect(page.locator("#pr-sr")).toBeHidden();
  await expect(page.locator(".pr-nottsmsg")).toBeVisible();
  await expect(page.locator("#pr-d-start")).toBeDisabled();
  await page.locator("#pr-in button[data-v=up]").click();
  await expect(page.locator("#pr-in .tt-fb")).toBeVisible();
  expect(errs).toEqual([]);
});

for (const scheme of ["light", "dark"]) {
  test(`IELTS L&S (${scheme}): 360px-те көлденең жылжу жоқ, axe wcag2a/aa`, async ({ browser }) => {
    test.setTimeout(120_000);
    const c = await browser.newContext({ viewport: { width: 360, height: 740 }, colorScheme: scheme, reducedMotion: "reduce" });
    await blockFonts(c);
    await stubSpeech(c);
    const p = await c.newPage();
    const errs = collectErrors(p);
    const problems = [];
    const run = async (label) => {
      expect(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), label).toBe(true);
      await p.addScriptTag({ content: AXE });
      const v = await p.evaluate(async () => (await axe.run(document.querySelector("main"), { runOnly: ["wcag2a", "wcag2aa"], resultTypes: ["violations"] })).violations
        .filter((x) => x.impact === "serious" || x.impact === "critical").map((x) => `${x.id} (${x.nodes.length}): ${x.nodes[0].target.join(" ")} ${x.nodes[0].failureSummary}`));
      v.forEach((x) => problems.push(`${label}: ${x}`));
    };
    await p.goto(LT); await p.waitForTimeout(200); await run("lt-p1");
    await p.click("#lt-check-1"); await p.click("#lt-tab-2"); await p.click("#lt-check-2"); await run("lt-p2-checked");
    await p.goto(PR); await p.waitForTimeout(200);
    await p.click("#pr-d-start"); await p.locator("#pr-d-opts button").first().click();
    await p.locator("#pr-ws .pr-sb").first().click(); await p.click("#pr-ss-check"); await p.locator("#pr-in button").first().click();
    await run("pron");
    expect(problems, problems.join("\n")).toEqual([]);
    expect(errs, errs.join("\n")).toEqual([]);
    await c.close();
  });
}
