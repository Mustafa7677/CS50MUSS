// © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md.
// AO17 Reality Engine: «Мәтін тергеушісі» (academy/ielts/detective.html, сабақ id: ielts.reality.detective).
// Тексереміз: мазмұн схемасы мен дұрыстығы (тәуелсіз іске асырумен), жеті кезеңнен толық өту, кезеңдердің құлпы,
// қате жауаптың нақты түсіндірмесі, пернетақта, дәлел жібі, қайта жүктегеннен кейінгі күй, қозғалысты азайту,
// меңгеру шегі, 360px-те көлденең жылжу жоқ, axe wcag2a/aa (serious+critical) = 0 жарық және қараңғы режимде, консоль қатесі жоқ.
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { blockFonts, collectErrors } = require("../support/helpers");
const AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const ROOT = path.resolve(__dirname, "../..");
const URL = "academy/ielts/detective.html", ID = "ielts.reality.detective", KEY = "ao17:reality:v1";
const STAGES = ["intro", "concept", "guided", "explore", "checkpoint", "mistakes", "mastery"];

const D = (() => { const ctx = { window: {} }; vm.createContext(ctx); vm.runInContext(fs.readFileSync(path.join(ROOT, "assets/data/rl-detective.js"), "utf8"), ctx); return ctx.window.RL_DETECTIVE; })();
const VN = { T: "True", F: "False", NG: "Not Given" };

// ---- тәуелсіз іске асыру (rl-detective.js-тегі words/shared/verdict-пен салыстыру үшін, басқа тәсілмен жазылған) ----
const tokens = (s) => s.toLowerCase().replace(/[^a-z0-9'\- ]+/g, " ").split(" ").map((w) => w.replace(/^['-]+|['-]+$/g, "")).filter(Boolean);
const sharedRef = (a, b) => { const out = []; for (const w of tokens(a)) if (tokens(b).indexOf(w) !== -1 && out.indexOf(w) === -1) out.push(w); return out; };
const verdictRef = (sts) => { let v = "T"; for (const s of sts) { if (s === "no") return "F"; if (s === "absent") v = "NG"; } return v; };

test.beforeEach(async ({ context }) => { await blockFonts(context); });

test.describe("мазмұн (assets/data/rl-detective.js)", () => {
  test("мәтіндер: көлемі, ойдан жазылғаны белгіленген, әр сөйлемнің тақырыбы бар", () => {
    const wc = (P) => P.sentences.map((s) => s.t).join(" ").split(/\s+/).length;
    expect(wc(D.passageA)).toBeGreaterThanOrEqual(250);
    expect(wc(D.passageA)).toBeLessThanOrEqual(300);
    expect(wc(D.passageB)).toBeGreaterThanOrEqual(80);
    expect(wc(D.passageB)).toBeLessThanOrEqual(150);
    for (const P of [D.passageA, D.passageB]) for (const s of P.sentences) { expect(/[.!?]$/.test(s.t), s.t).toBe(true); expect(/[А-Яа-яӘәҒғҚқҢңӨөҰұҮүІі]/.test(s.topic), s.t).toBe(true); }
    expect(fs.readFileSync(path.join(ROOT, URL), "utf8")).toContain("ойдан жазылған");
    // меңгеру мәтіні - жаңа: А мәтінімен ортақ сөйлем жоқ
    expect(D.passageB.sentences.some((s) => D.passageA.sentences.some((a) => a.t === s.t))).toBe(false);
  });

  test("мәлімдемелер: үкім, дәлел индексі, жіптің екі ұшы да мәтіннің дәл үзіндісі", () => {
    const sets = [[D.passageA, D.guided, false], [D.passageA, D.checkpoint, true], [D.passageB, D.mastery, false]];
    const ids = new Set();
    for (const [P, items, cp] of sets) {
      expect(new Set(items.map((x) => x.verdict)).size, "үш үкім де кездеседі").toBe(3);
      for (const it of items) {
        expect(ids.has(it.id), it.id).toBe(false); ids.add(it.id);
        expect(["T", "F", "NG"]).toContain(it.verdict);
        expect(it.ev.length, it.id).toBe(it.verdict === "NG" ? 0 : 1);
        it.ev.forEach((k) => expect(P.sentences[k], it.id).toBeTruthy());
        for (const l of it.links || []) { expect(it.text.includes(l.q), `${it.id}: ${l.q}`).toBe(true); expect(P.sentences[it.ev[0]].t.includes(l.p), `${it.id}: ${l.p}`).toBe(true); expect(l.q.toLowerCase()).not.toBe(l.p.toLowerCase()); }
        expect(it.why.length, it.id).toBeGreaterThan(30);
        const need = ["T", "F", "NG"].filter((v) => v !== it.verdict && (cp || it.verdict === "NG" ? true : v !== "NG"));
        need.forEach((v) => expect((it.whyNot[v] || "").length, `${it.id} whyNot.${v}`).toBeGreaterThan(30));
        Object.keys(it.traps || {}).forEach((k) => { expect(P.sentences[k], it.id).toBeTruthy(); expect(it.ev.includes(+k), it.id).toBe(false); });
        if (cp) { expect(it.hints).toHaveLength(3); it.ev.forEach((k) => expect(it.cands).toContain(k)); expect(it.cands.length).toBeGreaterThanOrEqual(2); if (it.verdict === "NG") it.cands.forEach((k) => expect(it.traps[k], it.id).toBeTruthy()); }
      }
    }
    D.guided.forEach((it) => expect(it.hints).toHaveLength(3));
    D.mastery.forEach((it) => expect(it.hints, "меңгеруде көмек жоқ").toBeUndefined());
    // меңгеру мәлімдемелері бұрынғылардан бөлек
    const old = [...D.guided, ...D.checkpoint, ...D.mistakes].map((x) => x.text);
    D.mastery.forEach((it) => expect(old).not.toContain(it.text));
  });

  test("есептелетін деректер тәуелсіз тексерілген: сандар, ортақ сөздер, үкім ережесі", () => {
    // x1: «less than half as long» - 11 минут 24 минуттың жартысынан аз
    const m = D.passageB.sentences[2].t.match(/from (\d+) minutes to (\d+) minutes/);
    expect(+m[2]).toBeLessThan(+m[1] / 2);
    expect(D.mastery[0].verdict).toBe("T");
    // x4: бесеудің үшеуі - бәрі емес; x2: fewer than half - көпшілік емес; c1: half ≠ all
    expect(D.passageB.sentences[1].t).toContain("three of its five");
    expect(D.passageA.sentences[1].t).toContain("nine secondary schools");
    // кіріспе: мәлімдеменің БАРЛЫҚ сөзі сөйлемде бар, бірақ үкім - False; төңкеретін сөз мәлімдемеде жоқ
    const I = D.intro, S = D.passageA.sentences[I.sent].t;
    expect(sharedRef(I.statement, S).length).toBe(new Set(tokens(I.statement)).size);
    expect(sharedRef(I.statement, S)).toHaveLength(8);
    expect(tokens(S)).toContain(I.flip); expect(tokens(I.statement)).not.toContain(I.flip); expect(I.answer).toBe("F");
    // «Көр»: бір қайшы тұжырым → False
    expect(verdictRef(D.concept.claims.map((c) => c.st))).toBe("F");
    D.concept.claims.forEach((c) => expect(D.passageA.sentences[c.sent].t.includes(c.p), c.p).toBe(true));
    expect(D.concept.caps).toHaveLength(D.concept.claims.length + 3);
    // «Өзің зертте»: үш үкім де шығады, тіркес мәтінде бар
    const vs = new Set();
    D.explore.forEach((E) => E.opts.forEach((O) => { vs.add(verdictRef(["ok", O.st])); if (O.sent != null) { expect(E.sents).toContain(O.sent); expect(D.passageA.sentences[O.sent].t.includes(O.p), O.w).toBe(true); } else expect(O.st).toBe("absent"); }));
    expect([...vs].sort()).toEqual(["F", "NG", "T"]);
    // парафраз: әр сол жақтағы тіркес мәтінде бар және дәл бір жұбы бар
    D.pairs.left.forEach((L) => { expect(D.passageA.sentences.some((s) => s.t.includes(L.t)), L.t).toBe(true); expect(D.pairs.right.filter((r) => r.pair === L.id)).toHaveLength(1); });
    expect(D.pairs.right.filter((r) => r.pair === null)).toHaveLength(1);
    // қателер: әр тұзақ бір рет, «айтылған» үкім дұрысынан өзгеше
    expect(D.mistakes.map((x) => x.trap).sort()).toEqual([0, 1, 2, 3, 4]);
    D.mistakes.forEach((x) => { expect(x.said).not.toBe(x.right); if (x.sent != null) expect(D.passageA.sentences[x.sent]).toBeTruthy(); });
    expect(D.masteryPass).toBeLessThanOrEqual(D.mastery.length);
  });
});

// ---------------- бет бойынша көмекшілер ----------------
const next = (p) => p.click(".rl-next");
const tab = (p, i) => p.locator(".rl-nav button").nth(i);
async function doIntro(p) { await p.click(`.rd-verdicts [data-v="${D.intro.answer}"]`); await p.click(`.rd-task2 [data-w="${D.intro.flip}"]`); }
async function doConcept(p) {
  for (let k = 0; k < D.concept.claims.length + 2; k++) await p.click('.rl-player [aria-label="Келесі қадам"]');
  await p.locator(".rd-askbox button").nth(D.concept.claims.findIndex((c) => c.st !== "ok")).click();
}
async function solveCase(p, it) {
  if (it.verdict === "NG") await p.click(".rd-none"); else await p.click(`.rd-pass .rd-s[data-i="${it.ev[0]}"]`);
  await p.click(`.rd-card [data-v="${it.verdict}"]`);
}
async function doInvestigate(p, items) { for (const it of items) { await solveCase(p, it); await p.click(".rd-nextcase"); } }
async function doExplore(p) { for (let n = 0; n < D.explore.length; n++) for (const O of D.explore[n].opts) await p.locator(".rd-exp").nth(n).locator(`[data-w="${O.w}"]`).click(); }
async function doCheckpoint(p) {
  for (const L of D.pairs.left) { await p.locator(".rd-col").first().getByRole("button", { name: L.t, exact: true }).click(); await p.locator(".rd-col").nth(1).getByRole("button", { name: D.pairs.right.find((r) => r.pair === L.id).t, exact: true }).click(); }
  for (let n = 0; n < D.checkpoint.length; n++) {
    const it = D.checkpoint[n], li = p.locator(".gd-exs > .gd-ex").nth(n);
    await li.locator(`[data-v="${it.verdict}"]`).click();
    if (it.verdict === "NG") for (let k = 0; k < it.cands.length; k++) await li.locator('[data-a="no"]').nth(k).click();
    else await li.locator(`[data-k="${it.ev[0]}"]`).click();
  }
}
async function doMistakes(p) { for (let n = 0; n < D.mistakes.length; n++) await p.locator(".gd-exs > .gd-ex").nth(n).locator(".gd-opts button").nth(D.mistakes[n].trap).click(); }
const DO = { intro: doIntro, concept: doConcept, guided: (p) => doInvestigate(p, D.guided), explore: doExplore, checkpoint: doCheckpoint, mistakes: doMistakes, mastery: (p) => doInvestigate(p, D.mastery) };
// белгілі кезеңге бірден секіру: алдыңғы кезеңдер «өтілген» деп жазылады
const seed = async (p, n) => { await p.evaluate(([k, id, st, n]) => { const done = {}; st.slice(0, n).forEach((s) => { done[s] = 1; }); const v = JSON.stringify({ [id]: { done, state: {}, ms: 0, at: n } }); localStorage.setItem(k, v); addEventListener("pagehide", () => localStorage.setItem(k, v)); /* қозғалтқыш pagehide кезінде өз күйін жазады: одан кейін қайта жазамыз */ }, [KEY, ID, STAGES, n]); await p.reload(); await expect(p.locator(".rl-nav button.on")).toHaveCount(1); };

test("жеті кезеңнен толық өту: құлып, есептелген мәндер, Tutor жазбалары, консоль қатесі жоқ", async ({ page: p }) => {
  test.setTimeout(150_000);
  const errs = collectErrors(p);
  await p.goto(URL);
  await expect(p.locator(".rl-nav button")).toHaveCount(7);
  for (let i = 1; i < 7; i++) await expect(tab(p, i)).toBeDisabled();
  await expect(p.locator(".rl-next")).toBeDisabled();

  // 1. кіріспе: бет санаған ортақ сөздер тәуелсіз санақпен бірдей
  const I = D.intro, ref = sharedRef(I.statement, D.passageA.sentences[I.sent].t);
  await expect(p.locator(".rd-count .rd-n")).toHaveText(String(ref.length));
  expect(await p.locator(".rd-blk").first().locator(".rd-shared").count()).toBe(ref.length);
  expect(await p.evaluate(([a, b]) => window.RLDetective.shared(a, b), [I.statement, D.passageA.sentences[I.sent].t])).toEqual(ref);
  await p.click('.rd-verdicts [data-v="F"]');
  await expect(p.locator(".rl-next"), "болжамнан кейін әлі құлыптаулы").toBeDisabled();
  await p.click(`.rd-task2 [data-w="${I.flip}"]`);
  await expect(p.locator(".rd-threads path")).toHaveCount(1);
  await expect(p.locator(".rl-next")).toBeEnabled();
  await expect(tab(p, 1)).toBeEnabled(); await expect(tab(p, 2)).toBeDisabled();
  await next(p);

  // 2. көр: қадам сайын тұжырым тексеріледі, үкім ережемен есептеледі
  await expect(p.locator(".rd-askbox")).toBeHidden();
  const step = () => p.click('.rl-player [aria-label="Келесі қадам"]');
  await step(); await expect(p.locator(".rd-claim.rd-off")).toHaveCount(0); await expect(p.locator(".rd-threads path")).toHaveCount(0);
  for (let j = 0; j < D.concept.claims.length; j++) { await step(); await expect(p.locator(".rd-threads path")).toHaveCount(j + 1); await expect(p.locator(".rd-cap")).toHaveText(D.concept.caps[j + 2]); }
  await expect(p.locator(".rd-claim.rd-ok")).toHaveCount(2); await expect(p.locator(".rd-claim.rd-no")).toHaveCount(1);
  await expect(p.locator(".rd-b-out")).toHaveClass(/rd-off/);
  await step();
  await expect(p.locator(".rd-b-out .rd-stamp")).toHaveText(VN[verdictRef(D.concept.claims.map((c) => c.st))]);
  await expect(p.locator(".rl-next"), "анимацияны көру жеткіліксіз").toBeDisabled();
  await p.locator(".rd-askbox button").first().click();
  await expect(p.locator(".rd-askbox .tt-bad")).toContainText(D.concept.askNo);
  await p.locator(".rd-askbox button").nth(2).click();
  await next(p);

  // 3. бірге жаса
  await doInvestigate(p, D.guided.slice(0, 1));
  await expect(p.locator(".rd-step").first()).toHaveText("Іс 2 / 4");
  await doInvestigate(p, D.guided.slice(1));
  await expect(p.locator(".rd-sum")).toContainText("4 / 4");
  await next(p);

  // 4. өзің зертте: әр сөздің үкімі тәуелсіз ережемен бірдей
  for (let n = 0; n < D.explore.length; n++) for (const O of D.explore[n].opts) {
    const blk = p.locator(".rd-exp").nth(n);
    await blk.locator(`[data-w="${O.w}"]`).click();
    await expect(blk.locator(".rd-out .rd-stamp")).toHaveText(VN[verdictRef(["ok", O.st])]);
    await expect(blk.locator(".rd-why")).toHaveText(O.why);
    await expect(blk.locator(".rd-threads path")).toHaveCount(O.sent != null ? 1 : 0);
    if (O.sent != null) await expect(blk.locator("mark.rd-kw")).toHaveText(O.p);
  }
  await expect(p.locator(".rd-track")).toContainText(`Тәжірибе саны: ${D.explore.reduce((a, E) => a + E.opts.length, 0)}`);
  await expect(p.locator(".rd-chip.on")).toHaveCount(3);
  await next(p);

  // 5. тексер
  await expect(p.locator(".rl-next")).toBeDisabled();
  await doCheckpoint(p);
  await expect(p.locator(".rd-ph.ok")).toHaveCount(8);
  await expect(p.locator(".rl-note")).toContainText(`үкімдер - ${D.checkpoint.length} / ${D.checkpoint.length}`);
  await next(p);

  // 6. қатені талда
  await doMistakes(p);
  await expect(p.locator(".rl-note")).toContainText("5 / 5");
  await next(p);

  // 7. меңгеру: көмек жоқ
  await expect(p.locator(".tt-hbtn")).toHaveCount(0);
  await expect(p.locator(".rd-ptitle")).toHaveText(D.passageB.title);
  await doInvestigate(p, D.mastery);
  await expect(p.locator(".rd-sum")).toContainText(`${D.mastery.length} / ${D.mastery.length}`);
  await expect(p.locator(".rl-next")).toHaveText("Сабақты аяқтау");
  await next(p);
  await expect(p.locator(".rl-fin")).toContainText("Сабақ аяқталды");
  await expect(p.locator(".rl-nav button.ok")).toHaveCount(7);

  const t = await p.evaluate((id) => { const s = JSON.parse(localStorage.getItem("ao17:tutor:v1")); return { sk: s.skills[id], mistakes: s.mistakes.length }; }, ID);
  expect(t.sk.title).toBe("Мәтін тергеушісі");
  expect(t.sk.n).toBe(D.guided.length + D.pairs.left.length + D.checkpoint.length + D.mistakes.length + D.mastery.length);
  expect(t.sk.ok).toBe(t.sk.n); expect(t.mistakes).toBe(0);
  const rec = await p.evaluate(([k, id]) => JSON.parse(localStorage.getItem(k))[id], [KEY, ID]);
  expect(Object.keys(rec.done).sort()).toEqual([...STAGES].sort());
  expect(rec.state.best).toBe(D.mastery.length);
  expect(errs).toEqual([]);
});

test("қате жауап нақты түсіндірме береді; пернетақтамен таңдау; дәлел жібі мәлімдеме мен парафразды қосады", async ({ page: p }) => {
  const errs = collectErrors(p);
  await p.goto(URL); await seed(p, 2);
  const g1 = D.guided[0], box = p.locator(".rd-card .tt-fb");
  // «сөйлем жоқ» - қате: сөйлем бар
  await p.click(".rd-none");
  await expect(box).toHaveClass(/tt-bad/); await expect(box).toContainText(g1.about);
  // тұзақ сөйлем: арнайы түсіндірме
  await p.click('.rd-pass .rd-s[data-i="5"]');
  await expect(box).toContainText(g1.traps[5]);
  await expect(p.locator('.rd-pass .rd-s[data-i="5"]')).toHaveClass(/no/);
  // кездейсоқ сөйлем: сөйлемнің тақырыбы + мәлімдеменің тақырыбы
  await p.click('.rd-pass .rd-s[data-i="12"]');
  await expect(box).toContainText(D.passageA.sentences[12].topic); await expect(box).toContainText(g1.about);
  await expect(p.locator(".rd-verdicts")).toHaveCount(0);
  // пернетақта: ↓ келесі сөйлемге, Enter таңдайды, назар үкім батырмасына өтеді
  await p.locator('.rd-pass .rd-s[data-i="5"]').focus();
  await p.keyboard.press("ArrowDown");
  await expect(p.locator('.rd-pass .rd-s[data-i="6"]')).toBeFocused();
  await p.keyboard.press("Enter");
  await expect(p.locator('.rd-pass .rd-s[data-i="6"]')).toHaveAttribute("aria-pressed", "true");
  await expect(p.locator('.rd-verdicts [data-v="T"]')).toBeFocused();
  // жіп: әр link үшін бір сызық, ұштары - мәлімдемедегі сөз бен мәтіндегі парафраз
  await expect(p.locator(".rd-threads path")).toHaveCount(g1.links.length);
  await expect(p.locator(".rd-card .rd-stmt mark")).toHaveText(g1.links.map((l) => l.q));
  await expect(p.locator('.rd-pass .rd-s[data-i="6"] mark')).toHaveText(g1.links.map((l) => l.p).sort((x, y) => D.passageA.sentences[6].t.indexOf(x) - D.passageA.sentences[6].t.indexOf(y)));
  await expect(p.locator(".rd-link")).toContainText(`«${g1.links[0].q}» ↔ «${g1.links[0].p}»`);
  const geo = await p.evaluate((p0) => { const h = document.querySelector(".rd-scene").getBoundingClientRect(), d = document.querySelector(".rd-threads path").getAttribute("d").match(/-?[\d.]+/g).map(Number), a = document.querySelector(".rd-card .rd-stmt mark").getClientRects()[0], b = [...document.querySelectorAll(".rd-pass mark")].find((m) => m.textContent === p0).getClientRects()[0]; const inR = (x, y, r) => x >= r.left - h.left - 2 && x <= r.right - h.left + 2 && y >= r.top - h.top - 2 && y <= r.bottom - h.top + 2; return [inR(d[0], d[1], a), inR(d[6], d[7], b)]; }, g1.links[0].p);
  expect(geo, "жіптің ұштары екі белгінің шетінде").toEqual([true, true]);
  // таңдалған сөйлем бар кезде Not Given - қате, себебімен
  await p.keyboard.press("ArrowRight"); // назарды өзгертпейді (топ ішінде), жай тексеріс
  await p.click('.rd-card [data-v="NG"]');
  await expect(box).toContainText("Not Given бола алмайды");
  await p.click('.rd-card [data-v="F"]');
  await expect(box).toContainText(g1.whyNot.F);
  await p.click('.rd-card [data-v="T"]');
  await expect(box).toContainText(g1.why);
  await p.click(".rd-nextcase"); await solveCase(p, D.guided[1]); await p.click(".rd-nextcase");
  // Not Given: ұқсас сөзі бар сөйлемді таңдау - «сөз аңшылығы» түсіндірмесі; «жоқ» деп растау керек
  const g3 = D.guided[2];
  await p.click('.rd-pass .rd-s[data-i="9"]');
  await expect(box).toContainText(g3.traps[9]);
  await p.click(".rd-none"); await expect(box).toHaveClass(/tt-ok/);
  await p.click('.rd-card [data-v="F"]');
  await expect(box).toContainText(g3.whyNot.F);
  await p.click('.rd-card [data-v="NG"]'); await p.click(".rd-nextcase");
  await solveCase(p, D.guided[3]); await p.click(".rd-nextcase");
  await expect(p.locator(".rd-sum")).toContainText("2 / 4");          // g1 мен g3 қатемен шешілді
  // көмек: үш деңгей
  await p.locator(".rl-nav button").nth(2).click();
  for (let k = 0; k < 3; k++) await p.click(".rd-card .tt-hbtn");
  await expect(p.locator(".rd-card .tt-hlist li")).toHaveCount(3);
  await expect(p.locator(".rd-card .tt-hlist li").nth(2)).toContainText(g1.hints[2]);

  // тексеру кезеңі: парафраз бен үкім қателері
  await seed(p, 4);
  const mfb = p.locator(".rd-match + .tt-fb"), L = D.pairs.left[1], wrongR = D.pairs.right.find((r) => r.pair === null);
  await p.locator(".rd-col").nth(1).getByRole("button", { name: wrongR.t, exact: true }).click();
  await expect(mfb).toContainText("Алдымен сол жақтан");
  await p.locator(".rd-col").first().getByRole("button", { name: L.t, exact: true }).click();
  await p.locator(".rd-col").nth(1).getByRole("button", { name: wrongR.t, exact: true }).click();
  await expect(mfb).toContainText(L.kk); await expect(mfb).toContainText(wrongR.kk);
  const c4 = D.checkpoint[3], li4 = p.locator(".gd-exs > .gd-ex").nth(3);
  await li4.locator('[data-v="NG"]').click();                        // False мен Not Given-ді шатастыру
  await expect(li4.locator(".tt-fb")).toContainText(c4.whyNot.NG);
  await li4.locator('[data-v="F"]').click(); await li4.locator('[data-k="1"]').click();
  await expect(li4.locator(".tt-fb")).toContainText(D.passageA.sentences[1].topic);
  await li4.locator('[data-k="16"]').click(); await expect(li4).toHaveClass(/done/);
  const c3 = D.checkpoint[2], li3 = p.locator(".gd-exs > .gd-ex").nth(2);
  await li3.locator('[data-v="NG"]').click();
  await expect(li3, "Not Given растаусыз жабылмайды").not.toHaveClass(/done/);
  await li3.locator('[data-a="yes"]').first().click();
  await expect(li3.locator(".tt-fb")).toContainText(c3.traps[c3.cands[0]]);
  await li3.locator('[data-a="no"]').nth(0).click(); await expect(li3).not.toHaveClass(/done/);
  await li3.locator('[data-a="no"]').nth(1).click(); await expect(li3).toHaveClass(/done/);
  await expect(p.locator(".rl-next")).toBeDisabled();

  // қатені талдау: қате тұзақ - сол тұзақтың белгісі + осы істің ерекшелігі
  await seed(p, 5);
  const M = D.mistakes[2], q3 = p.locator(".gd-exs > .gd-ex").nth(2);
  await q3.locator(".gd-opts button").nth(3).click();
  await expect(q3.locator(".tt-fb")).toContainText(D.traps[3].sign); await expect(q3.locator(".tt-fb")).toContainText(M.clue);
  await q3.locator(".gd-opts button").nth(M.trap).click();
  await expect(q3.locator(".tt-fb")).toContainText(M.ok);

  const nb = await p.evaluate(() => JSON.parse(localStorage.getItem("ao17:tutor:v1")).mistakes.map((m) => m.error));
  expect(nb).toEqual(expect.arrayContaining(["evidence-missed", "word-match", "evidence-wrong", "verdict-NG-for-T", "verdict-F-for-NG", "paraphrase-wrong", "verdict-NG-for-F"]));
  expect(errs).toEqual([]);
});

test("меңгеру шегі: екі қатемен кезең ашылмайды, «Қайта өту» ұсынылады", async ({ page: p }) => {
  await p.goto(URL); await seed(p, 6);
  for (let n = 0; n < D.mastery.length; n++) {
    const it = D.mastery[n];
    if (n < 2) { if (it.verdict === "NG") await p.click(".rd-pass .rd-s[data-i=\"0\"]"); else await p.click(".rd-none"); }
    await solveCase(p, it); await p.click(".rd-nextcase");
  }
  await expect(p.locator(".rd-sum")).toContainText(`${D.mastery.length - 2} / ${D.mastery.length}`);
  await expect(p.locator(".rd-sum")).toContainText(/Нақты уақыт: \d+ с/);
  await expect(p.locator(".rl-next")).toBeDisabled();
  await p.click(".rd-again");
  await expect(p.locator(".rd-step").first()).toHaveText(`Іс 1 / ${D.mastery.length}`);
  await doInvestigate(p, D.mastery);
  await expect(p.locator(".rl-next")).toBeEnabled();
});

test("күй сақталады: қайта жүктегенде сол кезең, сол іс, өтілген кезеңдер ашық", async ({ page: p }) => {
  await p.goto(URL);
  await doIntro(p); await next(p); await doConcept(p); await next(p);
  await doInvestigate(p, D.guided.slice(0, 2));
  await p.reload();
  await expect(p.locator(".rl-nav button.on")).toContainText("Бірге жаса");
  await expect(p.locator(".rl-nav button.ok")).toHaveCount(2);
  await expect(p.locator(".rd-step").first()).toHaveText("Іс 3 / 4");
  await expect(p.locator(".rd-card .rd-stmt")).toHaveText(D.guided[2].text);
  await expect(tab(p, 3)).toBeDisabled();
  await tab(p, 0).click();
  await expect(p.locator(".rl-next"), "өтілген кезеңнен бірден әрі өтуге болады").toBeEnabled();
  await expect(p.locator(".rl-prog")).toHaveAttribute("aria-valuenow", "2");
});

test("қозғалысты азайту: «Ойнату» бірден соңғы күйді көрсетеді, жіп анимациясыз", async ({ browser }) => {
  const c = await browser.newContext({ reducedMotion: "reduce" });
  await blockFonts(c);
  const p = await c.newPage();
  await p.goto(URL); await seed(p, 1);
  const n = D.concept.claims.length + 2;
  await p.click('.rl-player [aria-label="Ойнату"]');
  await expect(p.locator(".rl-player .gd-n")).toHaveText(`${n} / ${n}`);
  await expect(p.locator(".rd-cap")).toHaveText(D.concept.caps[n]);
  await expect(p.locator(".rd-threads path")).toHaveCount(D.concept.claims.length);
  expect(await p.locator(".rd-threads path").first().evaluate((e) => getComputedStyle(e).animationName)).toBe("none");
  await expect(p.locator(".rd-askbox")).toBeVisible();
  await c.close();
});

for (const scheme of ["light", "dark"]) {
  test(`${scheme}: 360px-те көлденең жылжу жоқ, axe (wcag2a/aa serious+critical) = 0 барлық кезеңде`, async ({ browser }) => {
    test.setTimeout(180_000);
    const c = await browser.newContext({ viewport: { width: 360, height: 740 }, colorScheme: scheme, reducedMotion: "reduce" });
    await blockFonts(c);
    const p = await c.newPage();
    const errs = collectErrors(p), problems = [];
    const check = async (label) => {
      expect(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), label + ": horizontal scroll").toBe(true);
      await p.addScriptTag({ content: AXE });
      const v = await p.evaluate(async () => (await axe.run(document.querySelector("main"), { runOnly: ["wcag2a", "wcag2aa"], resultTypes: ["violations"] })).violations
        .filter((x) => x.impact === "serious" || x.impact === "critical").map((x) => `${x.id} (${x.nodes.length}): ${x.nodes[0].target.join(" ")}`));
      v.forEach((x) => problems.push(`${label}: ${x}`));
    };
    await p.goto(URL);
    expect(await p.evaluate(() => matchMedia("(prefers-color-scheme: dark)").matches)).toBe(scheme === "dark");
    for (let i = 0; i < STAGES.length; i++) {
      const s = STAGES[i];
      await seed(p, i);
      await check(s + "-start");
      if (s === "guided") {                       // қате күйлері де тексеріледі
        await p.click('.rd-pass .rd-s[data-i="5"]'); await check("guided-wrong");
        await solveCase(p, D.guided[0]); await p.click(".rd-card .tt-hbtn"); await check("guided-solved");
        await p.click(".rd-nextcase"); await doInvestigate(p, D.guided.slice(1));
      } else if (s === "checkpoint") {
        await p.locator(".gd-exs > .gd-ex").nth(3).locator('[data-v="NG"]').click();
        await p.locator(".gd-exs > .gd-ex").nth(2).locator('[data-v="NG"]').click(); await p.locator(".gd-exs > .gd-ex").nth(2).locator('[data-a="yes"]').first().click();
        await p.locator(".gd-exs > .gd-ex").first().locator(".tt-hbtn").click();
        await check("checkpoint-wrong");
        await p.reload(); await doCheckpoint(p);
      } else if (s === "mistakes") {
        await p.locator(".gd-exs > .gd-ex").first().locator(".gd-opts button").nth(2).click(); await check("mistakes-wrong");
        await doMistakes(p);
      } else await DO[s](p);
      await expect(p.locator(".rl-next")).toBeEnabled();
      await check(s + "-done");
    }
    await next(p); await check("finished");
    expect(problems).toEqual([]);
    expect(errs).toEqual([]);
    await c.close();
  });
}
