// © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md.
// AO17 IELTS Academy: хаб, Reading Analyzer, Listening Laboratory, Writing Studio, Speaking Studio.
// Тексереміз: негізгі әрекеттер, дұрыс/қате жауаптың түсіндірмесі, дәлел-сөйлем, валидатор, емтихан режимі, fallback,
// редактор тарихы мен экспорт, жергілікті жазба (IndexedDB), консоль қатесі жоқ, 360px-те көлденең жылжу жоқ, axe (жарық/қараңғы).
// Headless Chromium-да speechSynthesis / MediaRecorder / getUserMedia - стаб.
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const { blockFonts, collectErrors } = require("../support/helpers");
const AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const PAGES = ["index", "reading", "listening", "writing", "speaking"].map((p) => `academy/ielts/${p}.html`);

function stubSpeech(context) {
  return context.addInitScript(() => {
    window.SpeechSynthesisUtterance = class { constructor(t) { this.text = t; } };
    const ss = {
      getVoices: () => [{ name: "Test GB One", lang: "en-GB" }, { name: "Test GB Male", lang: "en-GB" }],
      speak(u) { (window.__spoken = window.__spoken || []).push(u.text); this._t = setTimeout(() => u.onend && u.onend({}), 15); },
      cancel() { clearTimeout(this._t); }, pause() {}, resume() {}, addEventListener() {},
    };
    Object.defineProperty(window, "speechSynthesis", { value: ss, configurable: true });
  });
}
function stubMic(context, deny) {
  return context.addInitScript((deny) => {
    const md = { getUserMedia: async () => { if (deny) { const e = new Error("denied"); e.name = "NotAllowedError"; throw e; } return { getTracks: () => [{ stop() {} }] }; } };
    Object.defineProperty(navigator, "mediaDevices", { value: md, configurable: true });
    window.MediaRecorder = class {
      constructor() { this.state = "inactive"; this.mimeType = "audio/webm"; }
      start() { this.state = "recording"; }
      stop() { this.state = "inactive"; if (this.ondataavailable) this.ondataavailable({ data: new Blob(["test-audio"], { type: "audio/webm" }) }); setTimeout(() => this.onstop && this.onstop(), 0); }
    };
  }, deny);
}

test("хаб: құрылым, тәуелсіздік ескертуі, дайын зертханаларға сілтемелер", async ({ page }) => {
  await blockFonts(page.context());
  const errs = collectErrors(page);
  await page.goto("academy/ielts/index.html");
  await expect(page.locator("h1")).toHaveText("IELTS Academy");
  await expect(page.locator(".lab-hero .lab-honest")).toContainText("ресми band бағасын бермейді");
  await expect(page.locator(".lab-hero .lab-honest")).toContainText("байланысты емес");
  for (const f of ["reading.html", "listening.html", "writing.html#t1", "writing.html#t2", "speaking.html"]) await expect(page.locator(`.lab-map li.ready a[href="${f}"]`)).toHaveCount(1);
  await expect(page.locator(".lab-map li:not(.ready) .lab-st").first()).toHaveText("жоспарда");
  await expect(page.locator(".ie-fact")).toHaveCount(4);
  expect(errs).toEqual([]);
});

test("Reading: TFNG түсіндіргіші, жауап шолуы дәлел-сөйлеммен, сөз шегі, белгілеу сақталады", async ({ page }) => {
  await blockFonts(page.context());
  const errs = collectErrors(page);
  await page.goto("academy/ielts/reading.html");
  await expect(page.locator("#rd-passage .ie-para")).toHaveCount(7);
  // Түсіндіргіш: әр карточкаға дұрыс жауапты деректен табамыз
  const x = page.locator("#rd-explainer");
  const st = await x.locator(".ie-x-st").textContent();
  const set = await page.evaluate((st) => window.IELTS_READING.explainer.find((s) => s.st === st), st);
  for (let i = 0; i < 3; i++) {
    const card = x.locator(".ie-case").nth(i);
    const t = await card.locator(".ie-case-t").textContent();
    await card.locator(`button[data-v="${set.cases.find((c) => c.t === t).a}"]`).click();
  }
  await x.locator(".ie-x-check").click();
  await expect(x.locator(".ie-x-fb")).toHaveClass(/tt-ok/);
  await expect(x.locator(".ie-case-why").first()).toBeVisible();
  // TFNG: 1-сұрақ дұрыс (FALSE), 6-сұрақ қате (TRUE - тұзақ)
  const q = page.locator("#rd-g-tfng .ie-q");
  await expect(q).toHaveCount(8);
  await q.nth(0).locator('button[data-v="FALSE"]').click();
  await q.nth(5).locator('button[data-v="TRUE"]').click();
  await page.locator("#rd-g-tfng").getByRole("button", { name: "Бұл бөлімді тексеру" }).click();
  await expect(q.nth(0).locator(".tt-fb")).toHaveClass(/tt-ok/);
  await expect(q.nth(5).locator(".tt-fb")).toHaveClass(/tt-bad/);
  await expect(q.nth(5).locator(".tt-fb")).toContainText("Қисынды, бірақ айтылмаған = NOT GIVEN");
  await expect(page.locator("#rd-s-A3")).toHaveClass(/ie-ev/);
  await expect(page.locator("#rd-s-C3")).toHaveClass(/ie-ev-bad/);
  await expect(page.locator("#rd-s-C3")).toHaveAttribute("data-qlabel", "№6");
  // Matching Headings: B дұрыс, C - тұзақ (viii)
  await page.selectOption("#rd-h-B", "ii");
  await page.selectOption("#rd-h-C", "viii");
  await page.locator("#rd-g-head").getByRole("button", { name: "Бұл бөлімді тексеру" }).click();
  await expect(page.locator("#rd-h-B")).toHaveClass(/ok/);
  await expect(page.locator("#rd-g-head .ie-q").nth(1).locator(".tt-fb")).toContainText("Бір сөздің сәйкестігі - тақырып емес");
  // Summary: сөз шегі, емле, тұзақ, дұрыс
  await page.fill("#rd-sum-1", "Evapotranspiration");
  await page.fill("#rd-sum-2", "many many years");
  await page.fill("#rd-sum-3", "heatwaves");
  await page.fill("#rd-sum-5", "pedestrains");
  await page.locator("#rd-g-sum").getByRole("button", { name: "Бұл бөлімді тексеру" }).click();
  const fbs = page.locator("#rd-g-sum .ie-sumfb .tt-fb");
  await expect(fbs.nth(0)).toHaveClass(/tt-ok/);
  await expect(fbs.nth(1)).toContainText("Сөз шегінен асты");
  await expect(fbs.nth(2)).toContainText("droughts");
  await expect(fbs.nth(4)).toContainText("Емле қатесі");
  // AO17Tutor-ға жазылды
  const sk = await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem("ao17:tutor:v1")).skills));
  expect(sk).toEqual(expect.arrayContaining(["ielts.reading.tfng", "ielts.reading.headings", "ielts.reading.summary", "ielts.reading.tfng.concept"]));
  // Белгілеу: A1 сөйлеміндегі «urban heat island» емес, бірінші 8 таңба
  await page.evaluate(() => { const s = document.querySelector("#rd-s-B2").firstChild; const r = document.createRange(); r.setStart(s, 0); r.setEnd(s, 9); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); });
  await page.click("#rd-hl");
  await expect(page.locator("#rd-s-B2 mark.ie-hl")).toHaveText("Materials");
  // Абзац картасы: үлгі тек жазғаннан кейін
  await page.click("#tab-map");
  await page.locator("#rd-map .ie-maprow").first().getByRole("button").click();
  await expect(page.locator("#rd-map .tt-fb").first()).toContainText("Алдымен өзіңіз жазыңыз");
  await page.fill("#rd-map-A", "old discovery now matters more");
  await page.locator("#rd-map .ie-maprow").first().getByRole("button").click();
  await expect(page.locator("#rd-map .tt-fb").first()).toContainText("Үлгі түйін");
  await page.waitForTimeout(400);
  await page.reload();
  await expect(page.locator("#rd-s-B2 mark.ie-hl")).toHaveText("Materials");
  await expect(page.locator("#rd-map-A")).toHaveValue("old discovery now matters more");
  expect(errs).toEqual([]);
});

test("Listening: валидатор нұсқаларды қабылдап, бас тартуды түсіндіреді; транскрипттегі дұрыс жол белгіленеді", async ({ page }) => {
  await blockFonts(page.context());
  await stubSpeech(page.context());
  const errs = collectErrors(page);
  await page.goto("academy/ielts/listening.html");
  await expect(page.locator("#ls-fallback")).toBeHidden();
  await expect(page.locator("#ls-transcript")).toBeHidden();
  // валидатор бірліктері
  const v = await page.evaluate(() => {
    const F = window.IELTS_LISTENING.form, val = window.IELTS_LISTENING_VALIDATE, it = (n) => F.find((x) => x.n === n);
    return {
      d16: ["16", "16th", "Sixteenth", "16th October"].map((a) => val(it(2), a).ok),
      d15: val(it(2), "15th").code, of: val(it(2), "sixteenth of October").code,
      ph: [val(it(4), "07700 900461").ok, val(it(4), "07700900461").ok, val(it(4), "07700 900416").ok],
      sp: val(it(3), "Witlock").code, fee: [val(it(5), "£85").ok, val(it(5), "85 pounds").ok, val(it(5), "95").code],
      tue: val(it(1), "Tuesday").code, news: val(it(7), "Local Newspaper").ok,
    };
  });
  expect(v).toEqual({ d16: [true, true, true, true], d15: "distractor", of: "word-limit", ph: [true, true, false], sp: "spelling", fee: [true, true, "distractor"], tue: "distractor", news: true });
  // ойнатқыш: ойнату → кідірту → бөлікке өту
  await page.click("#ls-play");
  await expect(page.locator("#ls-play")).toContainText("Кідірту");
  await page.click("#ls-play");
  await expect(page.locator("#ls-now")).toContainText("Кідіртілді");
  await page.locator("#ls-timeline .ie-seg").nth(2).click();
  await expect(page.locator("#ls-timeline .ie-seg").nth(2)).toHaveAttribute("aria-current", "true");
  await expect.poll(() => page.evaluate(() => (window.__spoken || []).some((t) => t.includes("W. H. I. T"))), { timeout: 8000 }).toBe(true);
  // жауаптар
  await page.fill("#ls-f1", "thursday");
  await page.fill("#ls-f2", "15th");
  await page.fill("#ls-f3", "Whitlock");
  await page.fill("#ls-f5", "85");
  await page.locator("input[name=ls-mc9][value='1']").check();
  await page.click("#ls-check");
  const rows = page.locator("#ls-form .ie-frow");
  await expect(rows.nth(0).locator(".tt-fb")).toHaveClass(/tt-ok/);
  await expect(rows.nth(1).locator(".tt-fb")).toContainText("түзетілген");
  await expect(page.locator("#ls-transcript")).toBeVisible();
  await expect(page.locator("#ls-l-1-1")).toHaveClass(/ie-flag/);
  await expect(page.locator("#ls-l-0-2")).toHaveClass(/ie-key/);
  await expect(page.locator("#ls-mc .ie-mcq").nth(1).locator(".tt-fb")).toContainText("not for work");
  await expect(page.locator("#ls-out")).toContainText("ресми band бағасы емес");
  // Болжау және сөздік
  for (const [n, a] of [[1, "word"], [2, "number"], [3, "name"], [4, "number"], [5, "number"]]) await page.selectOption(`#ls-p${n}`, a);
  await page.click("#ls-predict-check");
  await expect(page.locator("#ls-predict-fb")).toHaveClass(/tt-ok/);
  await page.locator("#ls-vocab .lab-choice button").first().click();
  await expect(page.locator("#ls-vocab .tt-fb")).toBeVisible();
  expect(errs).toEqual([]);
});

test("Listening: емтихан режимі - бір рет тыңдау, транскрипт тек соңында", async ({ page }) => {
  test.setTimeout(90_000);
  await blockFonts(page.context());
  await stubSpeech(page.context());
  const errs = collectErrors(page);
  await page.goto("academy/ielts/listening.html");
  await page.locator("input[name=ls-mode][value=exam]").check();
  await expect(page.locator("#ls-exam-bar")).toBeVisible();
  await expect(page.locator("#ls-tr-toggle")).toBeDisabled();
  await expect(page.locator("#ls-replay")).toBeDisabled();
  await page.click("#ls-play");
  await expect(page.locator("#ls-play")).toBeDisabled();
  await expect(page.locator("#ls-now")).toContainText("тыңдаңыз");
  await expect(page.locator("#ls-now")).toHaveText("Жазба аяқталды.", { timeout: 40_000 });
  await expect(page.locator("#ls-play")).toBeDisabled();
  await expect(page.locator("#ls-transcript")).toBeHidden();
  await page.fill("#ls-f2", "16th");
  await page.click("#ls-check");
  await expect(page.locator("#ls-transcript")).toBeVisible();
  await expect(page.locator("#ls-mode-msg")).toContainText("Емтихан аяқталды");
  expect(errs).toEqual([]);
});

test("Listening: speechSynthesis жоқ браузерде адал оқу режимі", async ({ page }) => {
  await blockFonts(page.context());
  await page.context().addInitScript(() => { Object.defineProperty(window, "speechSynthesis", { value: undefined, configurable: true }); });
  const errs = collectErrors(page);
  await page.goto("academy/ielts/listening.html");
  await expect(page.locator("#ls-fallback")).toBeVisible();
  await expect(page.locator("#ls-transcript")).toBeVisible();
  await expect(page.locator("#ls-play")).toBeDisabled();
  await page.fill("#ls-f6", "notebook");
  await page.click("#ls-check");
  await expect(page.locator("#ls-form .ie-frow").nth(5).locator(".tt-fb")).toHaveClass(/tt-ok/);
  expect(errs).toEqual([]);
});

test("Writing: Task 1 қадамдары, ереже тексерісі, тарих, Task 2 құрастырушы және экспорт; band бағасы жоқ", async ({ page }) => {
  await blockFonts(page.context());
  const errs = collectErrors(page);
  await page.goto("academy/ielts/writing.html");
  await expect(page.locator("#wr-chart svg polyline")).toHaveCount(3);
  await page.selectOption("#wr-tr-museum", "fell");
  await page.selectOption("#wr-tr-garden", "rose");
  await page.selectOption("#wr-tr-aquarium", "fluct");
  await page.click("#wr-trend-check");
  await expect(page.locator("#wr-trend-fb")).toContainText("2 / 3");
  await expect(page.locator("#wr-trend-fb")).toContainText("тұрақтылық");
  await page.selectOption("#wr-tr-aquarium", "stable");
  await page.click("#wr-trend-check");
  await expect(page.locator("#wr-trend-fb")).toHaveClass(/tt-ok/);
  // 2-қадам: деректерден құрылған тұжырымдар - бәріне «сай» деп жауап беріп, нәтиже есептелетінін көреміз
  await page.locator("#wr-steps button").nth(1).click();
  const items = page.locator("#wr-cmp .ie-q");
  await expect(items).toHaveCount(5);
  for (let i = 0; i < 5; i++) await items.nth(i).locator('button[data-v="1"]').click();
  await page.click("#wr-cmp-check");
  await expect(page.locator("#wr-cmp-fb")).toContainText("/ 5");
  await expect(page.locator("#wr-cmp .ie-case-why").first()).not.toBeEmpty();
  // 3-қадам: шолу
  await page.locator("#wr-steps button").nth(2).click();
  await page.locator("#wr-ov li", { hasText: "visits to the botanical garden rose sharply" }).locator("input").check();
  await page.locator("#wr-ov li", { hasText: "In 2008, the science museum" }).locator("input").check();
  await page.click("#wr-ov-check");
  await expect(page.locator("#wr-ov-fb")).toHaveClass(/tt-bad/);
  await expect(page.locator("#wr-ov-fb")).toContainText("бөлшек");
  // 5-қадам: редактор
  await page.locator("#wr-steps button").nth(4).click();
  await page.fill("#wr-ed-t1", "The graph shows visitors. The museum fell from 220 to 250 thousand in 2030, I think.");
  await expect(page.locator("#wr-wc-t1")).toContainText("16 сөз / кемінде 150");
  await page.click("#wr-t1-check");
  const fb = page.locator("#wr-t1-fb");
  await expect(fb).toContainText("Графикте жоқ сан(дар): 250");
  await expect(fb).toContainText("Графикте жоқ жыл: 2030");
  await expect(fb).toContainText("жеке пікір");
  await page.locator("#t1 details.ie-note summary", { hasText: "Нұсқалар" }).click();
  await page.locator("#t1").getByRole("button", { name: "Нұсқа сақтау" }).click();
  await page.fill("#wr-ed-t1", "Overall, the garden became the most popular attraction.");
  await page.locator("#t1 .ie-hist li").first().getByRole("button", { name: "Қазіргімен салыстыру" }).click();
  await expect(page.locator("#t1 .ie-diff ins").first()).toBeVisible();
  await page.locator("#t1 .ie-hist li").first().getByRole("button", { name: "Қалпына келтіру" }).click();
  await expect(page.locator("#wr-ed-t1")).toHaveValue(/220 to 250/);
  await page.waitForTimeout(800);
  await page.reload();
  await expect(page.locator("#wr-ed-t1")).toHaveValue(/220 to 250/);
  // Task 2
  await page.locator("input[name=wr-stance][value=partly]").check();
  await page.fill("#wr-r1", "broaden their thinking");
  await page.fill("#wr-r2", "it may take time from core studies");
  await page.locator("#wr-pats button").first().click();
  await expect(page.locator("#wr-thesis")).toHaveValue(/partly agree/);
  await page.click("#wr-th-check");
  await expect(page.locator("#wr-th-fb")).toHaveClass(/tt-ok/);
  await page.fill("#wr-c0-claim", "Studying another field broadens students' thinking.");
  await page.fill("#wr-counter", "Some say it wastes time.");
  await expect(page.locator("#wr-map .ie-node.thesis")).toContainText("partly agree");
  await expect(page.locator("#wr-map")).toContainText("Some say it wastes time.");
  await page.click("#wr-cree-check");
  await expect(page.locator("#wr-cree-fb")).toContainText("rebuttal");
  await page.locator("#wr-plan li").nth(1).getByRole("button", { name: /жоғары/ }).click();
  await expect(page.locator("#wr-plan li").first()).toContainText("Body 1");
  await expect(page.locator("#wr-plan-note")).toContainText("Кіріспе бірінші");
  const [dl] = await Promise.all([page.waitForEvent("download"), page.click("#wr-exp-json")]);
  const data = JSON.parse(fs.readFileSync(await dl.path(), "utf8"));
  expect(data.task2.stance).toBe("partly");
  expect(data.task1.text).toContain("220 to 250");
  expect(JSON.stringify(data)).not.toMatch(/"band"/i);
  await expect(page.locator("main")).not.toContainText(/band\s*[0-9]/i);
  expect(errs).toEqual([]);
});

test("Speaking: рұқсаттан кейін ғана жазу, IndexedDB-де сақтау және өшіру, рефлексия тарихы", async ({ page }) => {
  await blockFonts(page.context());
  await stubMic(page.context(), false);
  await stubSpeech(page.context());
  const errs = collectErrors(page);
  await page.goto("academy/ielts/speaking.html");
  await page.evaluate(() => new Promise((r) => { const q = indexedDB.deleteDatabase("ao17-ielts-speaking"); q.onsuccess = q.onerror = q.onblocked = () => r(); }));
  await page.reload();
  await expect(page.locator("#sp-p1-ctl").getByRole("button", { name: /Жазуды бастау/ })).toBeDisabled();
  await page.click("#sp-mic");
  await expect(page.locator("#sp-mic-msg")).toContainText("Микрофон қосулы");
  // Part 2: дайындық → сөйлеу (автоматты жазу) → тоқтату
  await page.click("#sp-p2-go");
  await expect(page.locator("#sp-phase")).toContainText("Дайындық");
  await expect(page.locator("#sp-bigt")).toHaveText(/00:5\d|01:00/);
  await page.click("#sp-p2-go");
  await expect(page.locator("#sp-phase")).toContainText("Жазылып жатыр");
  await expect(page.locator("#sp-rec-ind")).toBeVisible();
  await page.click("#sp-p2-stop");
  await expect(page.locator("#sp-recs li audio")).toHaveCount(1);
  await expect(page.locator("#sp-recs li").first()).toContainText("Part 2");
  // Part 1 қолмен жазу
  const rb = page.locator("#sp-p1-ctl").getByRole("button", { name: /Жазуды бастау/ });
  await rb.click();
  await page.locator("#sp-p1-ctl").getByRole("button", { name: /Жазуды тоқтату/ }).click();
  await expect(page.locator("#sp-recs li audio")).toHaveCount(2);
  await page.locator("#sp-recs li").first().getByRole("button", { name: "Жазбаны өшіру" }).click();
  await expect(page.locator("#sp-recs li audio")).toHaveCount(1);
  await page.evaluate(() => { window.confirm = () => true; });
  await page.click("#sp-del-all");
  await expect(page.locator("#sp-recs li audio")).toHaveCount(0);
  // Жауапты дамыту (тексерілетін)
  await page.locator('#sp-ext button[data-best="1"]').click();
  await expect(page.locator("#sp-ext .tt-fb")).toHaveClass(/tt-ok/);
  // Рефлексия
  await page.locator("input[name=sp-sa-0-0][value=yes]").check();
  await page.locator("input[name=sp-sa-3-0][value=not]").check();
  await page.fill("#sp-sa-note", "more linking words");
  await page.click("#sp-sa-save");
  await expect(page.locator("#sp-hist li").first()).toContainText("Келесі назар: Pronunciation");
  await expect(page.locator("main")).not.toContainText(/band\s*[0-9]/i);
  expect(errs).toEqual([]);
});

test("Speaking: микрофонға рұқсат берілмесе, бет құламайды", async ({ page }) => {
  await blockFonts(page.context());
  await stubMic(page.context(), true);
  const errs = collectErrors(page);
  await page.goto("academy/ielts/speaking.html");
  await page.click("#sp-mic");
  await expect(page.locator("#sp-mic-msg")).toContainText("рұқсат берілмеді");
  await page.click("#sp-p2-go");
  await page.click("#sp-p2-go");
  await expect(page.locator("#sp-phase")).toContainText("Жазу өшік");
  await page.click("#sp-p2-stop");
  await expect(page.locator("#sp-p2-after")).toBeVisible();
  expect(errs).toEqual([]);
});

for (const scheme of ["light", "dark"]) {
  test(`IELTS (${scheme}): 360px-те көлденең жылжу жоқ, axe wcag2a/aa`, async ({ browser }) => {
    test.setTimeout(120_000);
    const c = await browser.newContext({ viewport: { width: 360, height: 740 }, colorScheme: scheme, reducedMotion: "reduce" });
    await blockFonts(c);
    await stubSpeech(c);
    const p = await c.newPage();
    const errs = collectErrors(p);
    const problems = [];
    for (const url of PAGES) {
      await p.goto(url);
      await p.waitForTimeout(200);
      expect(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), url).toBe(true);
      await p.addScriptTag({ content: AXE });
      const v = await p.evaluate(async () => (await axe.run(document.querySelector("main"), { runOnly: ["wcag2a", "wcag2aa"], resultTypes: ["violations"] })).violations
        .filter((x) => x.impact === "serious" || x.impact === "critical").map((x) => `${x.id} (${x.nodes.length}): ${x.nodes[0].target.join(" ")} ${x.nodes[0].failureSummary}`));
      v.forEach((x) => problems.push(`${url}: ${x}`));
    }
    expect(problems, problems.join("\n")).toEqual([]);
    expect(errs).toEqual([]);
    await c.close();
  });
}
