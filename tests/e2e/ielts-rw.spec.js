// © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md.
// AO17 IELTS 2-пакет: Reading Test (3 мәтін, 40 сұрақ), Task 1 Visuals (процесс, карта, кесте, дөңгелек диаграмма), GT Letter Studio.
// Тексереміз: кілттер мен дәлел-сөйлемдердің тұтастығы, Test режимі (таймер, навигатор, сақтау, авто-аяқтау), екінші әрекет,
// Review-дағы дәлел белгілеуі мен тұзақ түсіндірмесі, Task 1 қадамдары мен ереже тексерісі, хат Tone lab-ы мен қамту тексерісі,
// консоль қатесі жоқ, 360px-те көлденең жылжу жоқ, axe wcag2a/aa (жарық/қараңғы).
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const { blockFonts, collectErrors } = require("../support/helpers");
const AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const RT = "academy/ielts/reading-test.html", TV = "academy/ielts/task1-visuals.html", LT = "academy/ielts/letter.html";

// Сұраққа жауап беру (түріне қарай): v - мән
async function answer(page, n, v) {
  await page.evaluate(([n, v]) => {
    const el = document.querySelector("#rt-a" + n);
    if (el && el.tagName === "SELECT") { el.value = v; el.dispatchEvent(new Event("change")); return; }
    if (el) { el.value = v; el.dispatchEvent(new Event("input")); return; }
    const r = document.querySelector(`#rt-a${n}-${v}`);
    if (r) { r.checked = true; r.dispatchEvent(new Event("change")); return; }
    document.querySelector(`#rt-q${n} button[data-v="${v}"]`).click();
  }, [n, v]);
}
const keyOf = (it) => (Array.isArray(it.a) ? it.a[0] : it.a);

test("Reading Test: кілттер, дәлел-сөйлемдер және сұрақ түрлері тұтас", async ({ page }) => {
  await blockFonts(page.context());
  const errs = collectErrors(page);
  await page.goto(RT);
  const rep = await page.evaluate(() => {
    const R = window.IELTS_RT, out = [], S = {};
    R.passages.forEach((p) => p.paras.forEach((pa) => pa.s.forEach((s, i) => { S[p.n + pa.id + (i + 1)] = s; })));
    const words = R.passages.map((p) => p.paras.flatMap((x) => x.s).join(" ").split(/\s+/).length);
    const items = R.groups.flatMap((g) => g.items.map((it) => ({ g, it })));
    const per = [1, 2, 3].map((n) => items.filter((x) => x.g.passage === n).length);
    const nums = items.map((x) => x.it.n);
    const TEXT = ["sent", "short", "diagram"];
    items.forEach(({ g, it }) => {
      if (!it.ev || !it.ev.length) out.push(`${it.n}: ev жоқ`);
      it.ev.forEach((e) => { if (!S[e]) out.push(`${it.n}: ${e} сөйлемі жоқ`); if (!document.getElementById("rt-s-" + e)) out.push(`${it.n}: DOM-да #rt-s-${e} жоқ`); if (+e[0] !== g.passage) out.push(`${it.n}: дәлел басқа мәтінде`); });
      if (!it.why || it.why.length < 20) out.push(`${it.n}: түсіндірме жоқ`);
      if (TEXT.includes(g.type)) {
        if (!it.a.every((a) => a === a.toLowerCase().trim())) out.push(`${it.n}: кілт қалыпқа келтірілмеген`);
        if (!it.a.some((a) => it.ev.some((e) => S[e].toLowerCase().includes(a)))) out.push(`${it.n}: жауап дәлел-сөйлемде жоқ`);
        if (it.a[0].split(" ").length > g.limit) out.push(`${it.n}: негізгі жауап сөз шегінен асады`);
        Object.keys(it.wrong || {}).forEach((w) => { if (it.a.includes(w)) out.push(`${it.n}: тұзақ дұрыс жауаппен сәйкес`); });
      } else {
        const opts = g.type === "tfng" ? ["TRUE", "FALSE", "NOT GIVEN"] : g.type === "ynng" ? ["YES", "NO", "NOT GIVEN"] : g.type === "mc" ? it.opts.map((o) => o[0]) : g.type === "para" ? g.letters.split("") : (g.options || g.box).map((o) => o[0]);
        if (!opts.includes(it.a)) out.push(`${it.n}: кілт нұсқалар ішінде жоқ`);
        Object.keys(it.trap || {}).forEach((k) => { if (!opts.includes(k) || k === it.a) out.push(`${it.n}: trap кілті «${k}» жарамсыз`); });
      }
      if (it.a === "NOT GIVEN" && !it.ng) out.push(`${it.n}: NOT GIVEN, бірақ ng белгісі жоқ`);
    });
    return { out, words, per, nums, types: [...new Set(R.groups.map((g) => g.type))].sort(), ngCount: items.filter((x) => x.it.a === "NOT GIVEN").length };
  });
  expect(rep.out, rep.out.join("\n")).toEqual([]);
  expect(rep.per).toEqual([13, 13, 14]);
  expect(rep.nums).toEqual(Array.from({ length: 40 }, (_, i) => i + 1));
  expect(rep.types).toEqual(["diagram", "ends", "feat", "mc", "para", "sent", "short", "sumbox", "tfng", "ynng"]);
  rep.words.forEach((w) => { expect(w).toBeGreaterThanOrEqual(750); expect(w).toBeLessThanOrEqual(950); });
  expect(rep.ngCount).toBeGreaterThanOrEqual(2);
  // Ойдан шығарылған зерттеушілер мәтінде «fictional» деп белгіленген
  for (const name of ["Ostrova", "Quispe", "Sato", "Benali", "Lind", "Raman", "Weiss"]) {
    const s = await page.evaluate((nm) => Object.values(window.IELTS_RT.passages).flatMap((p) => p.paras.flatMap((x) => x.s)).find((x) => x.includes(nm)), name);
    expect(s, name).toBeTruthy();
  }
  const fict = await page.evaluate(() => window.IELTS_RT.passages.flatMap((p) => p.paras.flatMap((x) => x.s)).filter((s) => /fictional/.test(s)).length);
  expect(fict).toBeGreaterThanOrEqual(6);
  await expect(page.locator(".lab-hero .lab-honest")).toContainText("band бағасы");
  expect(errs).toEqual([]);
});

test("Reading Test: Test режимі - таймер, навигатор, белгі, сақтау, аяқтау, екінші әрекет, Review дәлелдері", async ({ page }) => {
  test.setTimeout(120_000);
  await blockFonts(page.context());
  const errs = collectErrors(page);
  await page.goto(RT);
  await expect(page.locator("#rt-test")).toBeHidden();
  await page.click("#rt-start");
  await expect(page.locator("#rt-test")).toBeVisible();
  await expect(page.locator("#rt-timer")).toHaveText(/^(60:00|59:5\d)$/);
  await expect(page.locator(".rt-nb")).toHaveCount(40);
  await expect(page.locator("#rt-p1")).toBeVisible();
  await expect(page.locator("#rt-p2")).toBeHidden();
  // Навигатор: 30-сұраққа өту 3-мәтінді ашады
  await page.locator('.rt-nb[data-n="30"]').click();
  await expect(page.locator("#rt-p3")).toBeVisible();
  await expect(page.locator("#rt-ptabs button[data-p='3']")).toHaveAttribute("aria-pressed", "true");
  // Барлық жауап: дұрыс, тек 2, 8, 26, 30 - тұзақ жауаптар
  const R = await page.evaluate(() => window.IELTS_RT.groups.flatMap((g) => g.items.map((it) => ({ n: it.n, a: it.a }))));
  const WRONG = { 2: "FALSE", 8: "storm", 26: "storage tank", 30: "YES" };
  for (const it of R) await answer(page, it.n, WRONG[it.n] || keyOf(it));
  await expect(page.locator("#rt-count")).toHaveText("Жауап берілді: 40 / 40");
  await expect(page.locator('.rt-nb[data-n="1"]')).toHaveClass(/\bon\b/);
  // Кейін қарау белгісі (навигатор арқылы 1-мәтінге оралып)
  await page.locator('.rt-nb[data-n="2"]').click();
  await expect(page.locator("#rt-p1")).toBeVisible();
  await page.locator("#rt-q2 .rt-flagb").click();
  await expect(page.locator('.rt-nb[data-n="2"]')).toHaveClass(/flag/);
  // Бет жаңартылса - жауаптар мен таймер сақталады
  await page.reload();
  await expect(page.locator("#rt-test")).toBeVisible();
  await expect(page.locator("#rt-a8")).toHaveValue("storm");
  await expect(page.locator("#rt-q1 button[data-v=TRUE]")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#rt-timer")).toHaveText(/^(60:00|59:\d\d)$/);
  // Аяқтау
  await page.click("#rt-finish");
  await expect(page.locator("#rt-result")).toBeVisible();
  await expect(page.locator("#rt-raw")).toHaveText("36 / 40");
  await expect(page.locator("#rt-res-note")).toContainText("band-ке аудармайды");
  await expect(page.locator("#rt-bytype")).toContainText("Yes / No / Not Given");
  await expect(page.locator("main")).not.toContainText(/band\s*[0-9]/i);
  // Екінші әрекет: тек қате 4 сұрақ ашық, жауаптар көрсетілмейді
  await expect(page.locator("#rt-second")).toBeVisible();
  await page.click("#rt-second");
  await expect(page.locator("#rt-count")).toHaveText("Жауап берілді: 0 / 4");
  await expect(page.locator("#rt-a1-x, #rt-q1 button[data-v=TRUE]")).toBeDisabled();
  await expect(page.locator("#rt-q2 .tt-fb")).toHaveCount(0);
  await answer(page, 2, "NOT GIVEN"); await answer(page, 8, "storms"); await answer(page, 26, "tank"); await answer(page, 30, "NO");
  await page.click("#rt-finish");
  await expect(page.locator("#rt-second-res")).toContainText("Екінші әрекет: 4 / 4");
  await expect(page.locator("#rt-raw")).toHaveText("36 / 40");
  // Review: дәлел-сөйлем белгіленеді, тұзақ түсіндіріледі
  await page.click("#rt-review");
  await expect(page.locator("#rt-test")).toHaveClass(/rt-review/);
  await expect(page.locator("#rt-timer")).toBeHidden();
  await expect(page.locator("#rt-s-1A4")).toHaveClass(/ie-ev-bad/);
  await expect(page.locator("#rt-s-1A4")).toHaveAttribute("data-qlabel", "№2");
  await expect(page.locator("#rt-s-1A2")).toHaveClass(/ie-ev/);
  await expect(page.locator("#rt-s-1A2")).not.toHaveClass(/ie-ev-bad/);
  await expect(page.locator("#rt-q2 .tt-fb")).toHaveClass(/tt-bad/);
  await expect(page.locator("#rt-q2 .tt-fb")).toContainText("Өз болжамыңыз - дәлел емес");
  await expect(page.locator("#rt-q2 .tt-fb")).toContainText("NOT GIVEN: белгіленген");
  await expect(page.locator("#rt-q8 .tt-fb")).toContainText("көпше түрде");
  await expect(page.locator("#rt-q26 .tt-fb")).toContainText("Сөз шегінен асты");
  await expect(page.locator("#rt-q1 .tt-fb")).toHaveClass(/tt-ok/);
  await expect(page.locator('.rt-nb[data-n="30"]')).toHaveClass(/\bno\b/);
  // 30-сұрақтың дәлелі 3-мәтінде: батырма мәтінді ауыстырады
  await page.locator('.rt-nb[data-n="30"]').click();
  await page.locator("#rt-q30 .ie-evbtn").click();
  await expect(page.locator("#rt-p3")).toBeVisible();
  await expect(page.locator("#rt-s-3E4")).toHaveClass(/ie-ev-bad/);
  await expect(page.locator("#rt-s-3E4")).toBeFocused();
  // Стратегия көмегі (3 деңгей) Review-да
  await expect(page.locator(".rt-group:not([hidden]) .rt-strat").first()).toBeVisible();
  // Tutor жазбалары
  const sk = await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem("ao17:tutor:v1")).skills));
  expect(sk).toEqual(expect.arrayContaining(["ielts.reading.tfng", "ielts.reading.ynng", "ielts.reading.mc", "ielts.reading.matchinfo", "ielts.reading.features", "ielts.reading.endings", "ielts.reading.sentence", "ielts.reading.short", "ielts.reading.diagram", "ielts.reading.summarybox"]));
  // Жаңа сынақ
  await page.click("#rt-tores");
  await page.locator(".rt-restart").click();
  await expect(page.locator("#rt-intro")).toBeVisible();
  expect(errs).toEqual([]);
});

test("Reading Test: уақыт біткенде автоматты тексеріледі; белгілеу сақталады", async ({ page }) => {
  await blockFonts(page.context());
  const errs = collectErrors(page);
  await page.goto(RT);
  await page.click("#rt-start");
  // Белгілеу
  await page.evaluate(() => { const s = document.querySelector("#rt-s-1B2").firstChild; const r = document.createRange(); r.setStart(s, 3); r.setEnd(s, 12); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); });
  await page.click("#rt-hl");
  await expect(page.locator("#rt-s-1B2 mark.ie-hl")).toHaveText("principle");
  await answer(page, 1, "TRUE");
  // Мерзімді өткен уақытқа қоямыз
  await page.evaluate(() => { const k = "ao17:ielts:rt:state", s = JSON.parse(localStorage.getItem(k)); s.deadline = Date.now() - 1000; localStorage.setItem(k, JSON.stringify(s)); });
  await page.reload();
  await expect(page.locator("#rt-result")).toBeVisible();
  await expect(page.locator("#rt-raw")).toHaveText("1 / 40");
  await expect(page.locator("#rt-res-note")).toContainText("автоматты");
  await expect(page.locator("#rt-s-1B2 mark.ie-hl")).toHaveText("principle");
  expect(errs).toEqual([]);
});

const PROCESS_ESSAY = `The diagram illustrates the process of making packaging from seaweed, from collecting the raw material to composting the finished product.

Overall, there are ten stages in the process, which begins with the harvesting of seaweed and ends with the packaging being composted. It is mainly linear, although faulty items are returned to an earlier stage.

First, seaweed is harvested from coastal farms and then it is washed in fresh water to remove salt and sand. After this, it is chopped and boiled so that a natural gel is extracted. Once the gel has been filtered, it is mixed with plant fibres.

Next, the mixture is pressed into moulds and the shapes are dried in warm tunnels for 12 hours. Each item is then checked, and faulty items are crushed and returned to the mixing stage. Finally, the finished packaging is packed and delivered to food companies, and after use it can be composted at home by the consumer.`;

test("Task 1 Visuals: процесс - рет, топтау, шолу, passive, жаңа есеп, редактор, ереже, тарих, экспорт", async ({ page }) => {
  test.setTimeout(120_000);
  await blockFonts(page.context());
  const errs = collectErrors(page);
  await page.goto(TV + "#process");
  await expect(page.locator("#wtv-fig-process svg text")).toContainText(["harvesting"]);
  const P = page.locator("#wtv-process");
  // 1. Рет: қате рет → себеп; дұрыс рет → ok
  await P.locator(".wt-stage:not([hidden])").getByRole("button", { name: "Ретті тексеру" }).click();
  await expect(P.locator(".wt-stage:not([hidden]) > .tt-fb").first()).toHaveClass(/tt-bad/);
  await page.evaluate(() => { localStorage.setItem("ao17:ielts:wt:process:order", JSON.stringify(window.IELTS_WTV.process.stages.map((s) => s.id))); });
  await page.reload();
  await P.getByRole("button", { name: "Ретті тексеру" }).click();
  await expect(P.locator(".wt-stage:not([hidden]) > .tt-fb").first()).toContainText("10 / 10");
  await expect(P.locator(".ie-steps button").first()).toHaveClass(/done/);
  // ↑ ↓ пернетақтамен
  const firstText = await P.locator(".wt-order li span").first().textContent();
  await P.locator(".wt-order li").first().getByRole("button", { name: /төмен/ }).click();
  await expect(P.locator(".wt-order li span").nth(1)).toHaveText(firstText);
  // 2. Топтау
  await P.locator(".ie-steps button").nth(1).click();
  const st = await page.evaluate(() => window.IELTS_WTV.process.stages.map((s) => [s.id, s.phase]));
  for (const [id, ph] of st) await page.selectOption(`#wtv-g-process-${id}`, ph);
  await page.selectOption("#wtv-g-process-filter", "prep");
  await P.getByRole("button", { name: "Топтауды тексеру" }).click();
  await expect(P.locator("#wtv-g-process-filter")).toHaveClass(/no/);
  await expect(P.locator(".wt-stage:not([hidden]) .wt-rows .tt-bad").first()).toContainText("Сүзу гельден кейін");
  await page.selectOption("#wtv-g-process-filter", "make");
  await P.getByRole("button", { name: "Топтауды тексеру" }).click();
  await expect(P.locator(".wt-stage:not([hidden]) > .tt-fb").first()).toContainText("10 / 10");
  // 3. Шолу: бөлшек таңдалса - қате
  await P.locator(".ie-steps button").nth(2).click();
  const ov = P.locator(".wt-stage:not([hidden]) .ie-chk li");
  for (let i = 0; i < 5; i++) { const t = await ov.nth(i).locator("label").textContent(); if (/ten stages|largely linear|12 hours/.test(t)) await ov.nth(i).locator("input").check(); }
  await P.getByRole("button", { name: "Тексеру" }).click();
  await expect(P.locator(".wt-stage:not([hidden]) > .tt-fb").first()).toContainText("12 сағат");
  await ov.filter({ hasText: "12 hours" }).locator("input").uncheck();
  await P.getByRole("button", { name: "Тексеру" }).click();
  await expect(P.locator(".wt-stage:not([hidden]) > .tt-fb").first()).toHaveClass(/tt-ok/);
  // 4. Тіл: қате таңдау - түсіндірме
  await P.locator(".ie-steps button").nth(3).click();
  await page.selectOption("#wtv-l-process-0", "harvests");
  await P.locator(".wt-stage:not([hidden])").getByRole("button", { name: "Тексеру", exact: true }).first().click();
  await expect(P.locator(".wt-stage:not([hidden]) .ie-qfb").first()).toContainText("Белсенді етіс");
  // Жаңа есеп: passive түрлендіру (жауапты деректен табамыз)
  const src = await P.locator(".lab-task .wt-gap").textContent();
  const acc = await page.evaluate((a) => window.IELTS_WTV.process.lang.transform.find((x) => x.a === a).accept[0], src);
  await page.fill("#wtv-tr-in", acc.replace(" is ", " was ").replace(" are ", " were "));
  await P.locator(".lab-task").getByRole("button", { name: "Тексеру" }).click();
  await expect(P.locator(".lab-task .tt-fb")).toContainText("Өткен шақ");
  await page.fill("#wtv-tr-in", acc[0].toUpperCase() + acc.slice(1) + ".");
  await P.locator(".lab-task").getByRole("button", { name: "Тексеру" }).click();
  await expect(P.locator(".lab-task .tt-fb")).toHaveClass(/tt-ok/);
  // 5. Жазу
  await P.locator(".ie-steps button").nth(4).click();
  await page.fill("#wt-ed-t1-process", "Seaweed is harvested. I think it is good.");
  await P.getByRole("button", { name: "Ережемен тексеру" }).click();
  const fb = P.locator(".wt-stage:not([hidden]) .ie-rules");
  await expect(fb).toContainText("Кемінде 150 сөз");
  await expect(fb).toContainText("жеке пікір");
  await expect(fb).toContainText("Шолу (overview) белгісі табылмады");
  await page.fill("#wt-ed-t1-process", PROCESS_ESSAY);
  await expect(page.locator("#wt-wc-t1-process")).toContainText("/ кемінде 150");
  await P.getByRole("button", { name: "Ережемен тексеру" }).click();
  await expect(fb).toContainText("10 / 10 кезең аталды");
  await expect(fb).toContainText("Ырықсыз етіс");
  await expect(fb).toContainText("Цикл");
  await expect(fb.locator("li.no")).toHaveCount(0);
  // Нұсқа тарихы
  await P.getByRole("button", { name: "Нұсқа сақтау" }).click();
  await expect(P.locator(".ie-hist li")).toHaveCount(1);
  await expect(P.locator(".ie-hist li").first()).toContainText("қолмен");
  // Өзін-өзі тексеру ресми критерий атауларымен + экспорт
  await expect(P.locator(".ie-crit legend")).toHaveText(["Task Achievement", "Coherence and Cohesion", "Lexical Resource", "Grammatical Range and Accuracy"]);
  await P.locator(".ie-crit input").first().check();
  const [dl] = await Promise.all([page.waitForEvent("download"), P.getByRole("button", { name: "Мұғалімге: .txt жүктеу" }).click()]);
  const txt = fs.readFileSync(await dl.path(), "utf8");
  expect(txt).toContain("seaweed is harvested from coastal farms");
  expect(txt).toContain("[x]");
  expect(txt).toContain("ресми IELTS бағасы емес");
  await expect(page.locator("main")).not.toContainText(/band\s*[0-9]/i);
  const sk = await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem("ao17:tutor:v1")).skills));
  expect(sk).toEqual(expect.arrayContaining(["ielts.writing.t1.process.order", "ielts.writing.t1.process.group", "ielts.writing.t1.overview", "ielts.writing.t1.process.language", "ielts.writing.t1.process.passive"]));
  expect(errs).toEqual([]);
});

test("Task 1 Visuals: карта, кесте, дөңгелек диаграмма - деректен тұжырымдар, орын тілі, сандарды тексеру", async ({ page }) => {
  test.setTimeout(120_000);
  await blockFonts(page.context());
  const errs = collectErrors(page);
  await page.goto(TV);
  for (const k of ["map", "table", "pie"]) {
    await page.locator(`#wtv-kinds button[data-k=${k}]`).click();
    const P = page.locator("#wtv-" + k);
    await expect(P).toBeVisible();
    await expect(page.locator("#wtv-process")).toBeHidden();
    // 1-қадам: data-ok бойынша дұрыс жауап
    const rows = P.locator(".wt-stage:not([hidden]) .wt-rows li");
    const n = await rows.count();
    for (let i = 0; i < n; i++) { const ok = await rows.nth(i).getAttribute("data-ok"); await rows.nth(i).getByRole("button", { name: ok === "true" ? "Сай" : "Сай емес", exact: true }).click(); }
    await P.locator(".wt-stage:not([hidden])").getByRole("button", { name: "Тексеру", exact: true }).click();
    await expect(P.locator(".wt-stage:not([hidden]) > .tt-fb").first()).toHaveClass(/tt-ok/);
    // Жаңа тұжырымдар - басқа жиын
    await P.getByRole("button", { name: "Жаңа тұжырымдар" }).click();
    await expect(P.locator(".wt-stage:not([hidden]) .wt-rows .tt-fb")).toHaveCount(0);
    // 2-қадам: топтау деректен есептеледі
    await P.locator(".ie-steps button").nth(1).click();
    const sels = P.locator(".wt-stage:not([hidden]) select");
    const m = await sels.count();
    for (let i = 0; i < m; i++) await sels.nth(i).selectOption({ index: 1 });
    await P.getByRole("button", { name: "Топтауды тексеру" }).click();
    await expect(P.locator(".wt-stage:not([hidden]) .wt-rows .tt-fb").first()).toBeVisible();
    await expect(P.locator(".wt-stage:not([hidden]) .wt-rows .tt-bad").first()).toContainText("Дұрысы");
    // 4-қадам: жаңа есеп - кез келген жауапқа түсіндірме
    await P.locator(".ie-steps button").nth(3).click();
    await P.locator(".lab-task .lab-choice button").first().click();
    await expect(P.locator(".lab-task .tt-fb")).toBeVisible();
  }
  // Кесте: сандар дәлдігі
  await page.locator("#wtv-kinds button[data-k=table]").click();
  const T = page.locator("#wtv-table");
  await T.locator(".ie-steps button").nth(4).click();
  await page.fill("#wt-ed-t1-table", "Overall, use fell in Arden from 165 to 128 litres, whereas Corvel rose to 155 litres.");
  await T.getByRole("button", { name: "Ережемен тексеру" }).click();
  await expect(T.locator(".ie-rules")).toContainText("Деректерде жоқ сан(дар): 155");
  await expect(T.locator(".ie-rules")).toContainText("Аталмаған: belmor, dunmore");
  // Дөңгелек диаграмма: шартты белгі, тақырып, кесте
  await page.locator("#wtv-kinds button[data-k=pie]").click();
  await expect(page.locator("#wtv-pie .wt-legend li")).toHaveCount(5);
  await expect(page.locator("#wtv-pie svg title").first()).toContainText("Heating 52%");
  await page.locator("#wtv-pie .ie-steps button").nth(4).click();
  await page.fill("#wt-ed-t1-pie", "Overall, the household used less energy in 2025, and heating fell from 52% to 38%.");
  await page.locator("#wtv-pie").getByRole("button", { name: "Ережемен тексеру" }).click();
  await expect(page.locator("#wtv-pie .ie-rules")).toContainText("тек үлесті көрсетеді");
  // Карта: орын тілі (жаңа сұрақ генерацияланады)
  await page.locator("#wtv-kinds button[data-k=map]").click();
  await page.locator("#wtv-map .ie-steps button").nth(4).click();
  await page.fill("#wt-ed-t1-map", "Overall, the town changed. A bridge was built.");
  await page.locator("#wtv-map").getByRole("button", { name: "Ережемен тексеру" }).click();
  await expect(page.locator("#wtv-map .ie-rules")).toContainText("Екі картаның жылын");
  await expect(page.locator("#wtv-map .ie-rules")).toContainText("Орын сөздері аз");
  // Таңдалған түр есте қалады
  await page.reload();
  await expect(page.locator("#wtv-kinds button[data-k=map]")).toHaveAttribute("aria-pressed", "true");
  const sk = await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem("ao17:tutor:v1")).skills));
  expect(sk).toEqual(expect.arrayContaining(["ielts.writing.t1.map.identify", "ielts.writing.t1.table.identify", "ielts.writing.t1.pie.identify", "ielts.writing.t1.map.location"]));
  expect(errs).toEqual([]);
});

const LETTER = `Dear Sir or Madam,

I am writing to ask for your help in finding a bag that I left on one of your coaches last Friday, on the 9 am service from Riverton to Hallam.

The bag is a small black rucksack with a red zip. I left it on the luggage rack above seat 14 when I got off the coach in Hallam, and I only noticed it was missing an hour later.

The bag is very important to me because it contains my passport and the notes for a university exam that I have to take next week. Without the passport I cannot travel home at the end of the month.

I would be grateful if you could check your lost property office and contact me on 0700 123 456 as soon as possible. I would also appreciate it if you could let me know how I can collect the bag.

Thank you in advance for your help.

Yours sincerely,
Aigerim Sadykova`;

test("GT Letter Studio: болжау, Tone lab, жаңа жағдай, қамту тексерісі, ереже, экспорт", async ({ page }) => {
  test.setTimeout(120_000);
  await blockFonts(page.context());
  const errs = collectErrors(page);
  await page.goto(LT);
  await expect(page.locator("#wtl-tasks button")).toHaveCount(3);
  const P = page.locator("#wtl-formal");
  // Болжау: қате → түсіндірме, дұрыс сұрақтар ашылады
  await P.getByRole("button", { name: "Бейресми (дос, туыс)" }).click();
  await expect(P.locator(".tt-fb").first()).toContainText("Дұрысы: Ресми");
  // Tone lab: Yours sincerely - қате (неге), Dear Sir or Madam - дұрыс
  await P.getByRole("button", { name: "Yours sincerely,", exact: true }).first().click();
  await expect(P.locator(".ie-qfb.tt-bad, .tt-bad").filter({ hasText: "Yours faithfully" }).first()).toBeVisible();
  await P.getByRole("button", { name: "Dear Sir or Madam,", exact: true }).first().click();
  await expect(P.locator(".tt-ok").filter({ hasText: "аты белгісіз" }).first()).toBeVisible();
  await P.getByRole("button", { name: /I demand that/ }).click();
  await expect(P.locator(".tt-bad").filter({ hasText: "дөрекі" }).first()).toBeVisible();
  // Жаңа жағдай: деректен дұрыс жауапты есептейміз
  const who = (await P.locator(".wt-scn").textContent()).replace("You are writing to ", "").replace(/\.$/, "");
  const sc = await page.evaluate((w) => window.IELTS_WTL.scenarios.find((s) => s.who === w), who);
  const open = sc.reg === "formal" ? "Dear Sir or Madam," : sc.reg === "semi" ? `Dear ${sc.title} ${sc.last},` : `Dear ${sc.first},`;
  const close = sc.reg === "formal" ? "Yours faithfully," : sc.reg === "semi" ? "Yours sincerely," : "Best wishes,";
  const task = P.locator(".lab-task");
  await task.getByRole("button", { name: open, exact: true }).click();
  await task.getByRole("button", { name: close, exact: true }).click();
  await task.getByRole("button", { name: "Тексеру" }).click();
  await expect(task.locator(".tt-fb")).toHaveClass(/tt-ok/);
  await task.getByRole("button", { name: "Жаңа жағдай" }).click();
  await expect(task.locator(".tt-fb")).toHaveCount(0);
  // Хат: Yours sincerely - ереже қатесі
  await page.fill("#wt-ed-gt-formal", LETTER);
  await P.getByRole("button", { name: "Ережемен тексеру" }).click();
  const rules = P.locator(".ie-rules").last();
  await expect(rules).toContainText("Аяқталу «yours sincerely» бұл хатқа сай емес");
  await expect(rules).toContainText("Ашылу регистрге сай");
  await expect(rules).toContainText("Қолтаңба");
  // Қамту: белгісіз → тармақтар жоқ; белгілеген соң → ok
  await P.getByRole("button", { name: "Абзацтарды көрсету" }).click();
  const cov = P.locator(".wt-cov > li");
  await expect(cov).toHaveCount(5);
  await P.getByRole("button", { name: "Қамтуды тексеру" }).click();
  await expect(P.locator(".wt-cov + div .ie-rules")).toContainText("«Мақсат» деп белгіленбеді");
  await cov.nth(0).getByLabel("Мақсат").check();
  await cov.nth(1).getByLabel("1-тармақ").check();
  await cov.nth(2).getByLabel("2-тармақ").check();
  await P.getByRole("button", { name: "Қамтуды тексеру" }).click();
  await expect(P.locator(".wt-cov + div .ie-rules")).toContainText("3-тармақ («say what you would like the company to do») ешбір абзацта белгіленбеді");
  await cov.nth(3).getByLabel("3-тармақ").check();
  await P.getByRole("button", { name: "Қамтуды тексеру" }).click();
  await expect(P.locator(".wt-cov + div .ie-rules li.no")).toHaveCount(0);
  await expect(P.locator(".wt-cov + div .ie-rules")).toContainText("Мақсат бірінші абзацта");
  // Белгілер жаңартудан кейін сақталады
  await page.waitForTimeout(700);
  await page.reload();
  await P.getByRole("button", { name: "Абзацтарды көрсету" }).click();
  await expect(P.locator(".wt-cov > li").nth(3).getByLabel("3-тармақ")).toBeChecked();
  // Экспорт
  const [dl] = await Promise.all([page.waitForEvent("download"), P.getByRole("button", { name: ".json жүктеу" }).click()]);
  const j = JSON.parse(fs.readFileSync(await dl.path(), "utf8"));
  expect(j.register).toBe("formal");
  expect(j.paragraphTags[0].tags).toEqual(["Мақсат"]);
  expect(j.selfCheck["Task Achievement"].length).toBe(4);
  // Бейресми хат: «Yours faithfully» досқа - қате
  await page.locator("#wtl-tasks button[data-t=informal]").click();
  await page.fill("#wt-ed-gt-informal", "Dear Sam,\n\nI am writing to inform you that I cannot come.\n\nYours faithfully,\nAigerim");
  await page.locator("#wtl-informal").getByRole("button", { name: "Ережемен тексеру" }).click();
  await expect(page.locator("#wtl-informal .ie-rules").last()).toContainText("Досқа тым ресми тіркестер");
  await expect(page.locator("#wtl-informal .ie-rules").last()).toContainText("бұл хатқа сай емес");
  const sk = await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem("ao17:tutor:v1")).skills));
  expect(sk).toEqual(expect.arrayContaining(["ielts.writing.gt.register", "ielts.writing.gt.tone", "ielts.writing.gt.tone.new", "ielts.writing.gt.coverage", "ielts.writing.gt.rules"]));
  await expect(page.locator("main")).not.toContainText(/band\s*[0-9]/i);
  expect(errs).toEqual([]);
});

for (const scheme of ["light", "dark"]) {
  test(`IELTS R&W (${scheme}): 360px-те көлденең жылжу жоқ, axe wcag2a/aa`, async ({ browser }) => {
    test.setTimeout(150_000);
    const c = await browser.newContext({ viewport: { width: 360, height: 740 }, colorScheme: scheme, reducedMotion: "reduce" });
    await blockFonts(c);
    const p = await c.newPage();
    const errs = collectErrors(p);
    const problems = [];
    const audit = async (label) => {
      await p.waitForTimeout(150);
      expect(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), label).toBe(true);
      await p.addScriptTag({ content: AXE });
      const v = await p.evaluate(async () => (await axe.run(document.querySelector("main"), { runOnly: ["wcag2a", "wcag2aa"], resultTypes: ["violations"] })).violations
        .filter((x) => x.impact === "serious" || x.impact === "critical").map((x) => `${x.id} (${x.nodes.length}): ${x.nodes[0].target.join(" ")} ${x.nodes[0].failureSummary}`));
      v.forEach((x) => problems.push(`${label}: ${x}`));
    };
    await p.goto(RT); await audit("reading-test intro");
    await p.click("#rt-start"); await audit("reading-test test");
    await p.locator("#rt-ptabs button[data-p='2']").click(); await audit("reading-test passage 2");
    await p.click("#rt-finish"); await audit("reading-test result");
    await p.click("#rt-review"); await audit("reading-test review");
    await p.goto(TV + "#process");
    for (const k of ["process", "map", "table", "pie"]) {
      await p.locator(`#wtv-kinds button[data-k=${k}]`).click();
      await audit("visuals " + k);
      await p.locator(`#wtv-${k} .ie-steps button`).nth(4).click(); await audit("visuals " + k + " write");
    }
    await p.goto(LT);
    await p.locator("#wtl-formal").getByRole("button", { name: "Ресми (адресат аты белгісіз)" }).click();
    await audit("letter formal");
    for (const t of ["semi", "informal"]) { await p.locator(`#wtl-tasks button[data-t=${t}]`).click(); await audit("letter " + t); }
    expect(problems, problems.join("\n")).toEqual([]);
    expect(errs).toEqual([]);
    await c.close();
  });
}
