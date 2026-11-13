// © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md.
// «Сұрақ анатомиясы» (sat.reality.anatomy, AO17 Reality Engine). Тексереміз: мазмұн схемасы және әр математикалық жауап
// (осы файлда жазылған тәуелсіз есептеумен), жеті кезеңнен толық өту, кезең құлпы, қате жауаптың нақты түсіндірмесі,
// қайта жүктегеннен кейінгі сақталу, азайтылған қозғалыс, 360px-те көлденең жылжу жоқ, axe wcag2a/aa (serious+critical) = 0
// жарық және қараңғы режимде, консоль қатесі жоқ.
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { blockFonts, collectErrors } = require("../support/helpers");
const AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const ROOT = path.resolve(__dirname, "../..");
const URL = "academy/sat/anatomy.html", ID = "sat.reality.anatomy", KEY = "ao17:reality:v1";
const STAGES = ["intro", "concept", "guided", "explore", "checkpoint", "mistakes", "mastery"];

const D = (() => { const ctx = { window: {} }; vm.createContext(ctx); vm.runInContext(fs.readFileSync(path.join(ROOT, "assets/data/rl-anatomy.js"), "utf8"), ctx); return ctx.window.RL_ANATOMY; })();
const Q = D.questions;
const okIdx = (q) => q.choices.findIndex((c) => c.ok);
const num = (c) => Number(c.t);
const byTrap = (q, t) => q.choices.filter((c) => c.trap === t).map(num);

test.beforeEach(async ({ context }) => { await blockFonts(context); });

test.describe("мазмұн", () => {
  test("схема: әр сұрақта бір дұрыс жауап, әр қате нұсқада тұзақ пен түсіндірме", () => {
    expect(Object.keys(D.traps.rw)).toEqual(["narrow", "broad", "notin", "distort"]);
    expect(Object.keys(D.traps.math)).toEqual(["wrongq", "sign", "unit", "partial"]);
    for (const q of Object.values(Q)) {
      expect(["rw", "math"]).toContain(q.kind);
      expect(q.choices, q.id).toHaveLength(4);
      expect(q.choices.filter((c) => c.ok), q.id).toHaveLength(1);
      for (const c of q.choices) {
        expect(c.why.length, q.id).toBeGreaterThan(15);
        if (!c.ok) { expect(Object.keys(D.traps[q.kind]), q.id).toContain(c.trap); if (c.alt) expect(Object.keys(D.traps[q.kind])).toContain(c.alt); }
      }
      expect(new Set(q.choices.map((c) => c.t)).size, q.id).toBe(4);
      const roles = q.segs.map((s) => s.role).filter(Boolean);
      for (const r of ["given", "task", "asked"]) expect(roles, q.id).toContain(r);
      expect(roles.filter((r) => r === "task"), q.id).toHaveLength(1);
      expect(roles.filter((r) => r === "asked"), q.id).toHaveLength(1);
      for (const k of ["task", "asked", "real"]) expect(q.ask[k].length, q.id).toBeGreaterThan(5);
    }
    // меңгеру сұрақтары басқа кезеңдерде кездеспейді (жаңа, бұрын көрмеген)
    for (const id of D.mastery) expect([...D.concept, ...D.guided, D.intro.q]).not.toContain(id);
    // сегіз тұзақ түрінің әрқайсысы сабақта кемінде бір рет кездеседі
    const used = new Set([...Object.values(Q).flatMap((q) => q.choices.filter((c) => !c.ok).map((c) => q.kind + ":" + c.trap)), ...D.mistakes.map((m) => m.kind + ":" + m.trap)]);
    for (const kind of ["rw", "math"]) for (const t of Object.keys(D.traps[kind])) expect([...used], `${kind}:${t}`).toContain(`${kind}:${t}`);
    for (const m of D.mistakes) { expect(m.steps.filter((s) => s.bad), m.id).toHaveLength(1); expect(m.steps.filter((s) => !s.bad).every((s) => s.ok.length > 10), m.id).toBe(true); }
    for (const it of D.checkpoint) { expect(it.hints, it.q).toHaveLength(3); if (it.type === "mc") expect(it.why).toHaveLength(it.options.length); }
  });

  test("математика: әр жауап пен әр тұзақ мәні тәуелсіз есептеумен сәйкес", () => {
    // ax + b = c теңдеуін сандық шешу (деректегі өрістерге сүйенбейтін бөлек жүзеге асыру)
    const solve = (a, b, c) => { let lo = -1e6, hi = 1e6; const f = (x) => a * x + b - c; for (let i = 0; i < 200; i++) { const mid = (lo + hi) / 2; if ((f(lo) < 0) === (f(mid) < 0)) lo = mid; else hi = mid; } return Math.round(((lo + hi) / 2) * 1e6) / 1e6; };

    // m1: 2x − 6 = 10, сұралғаны 3x + 1
    let x = solve(2, -6, 10);
    expect(x).toBe(8);
    expect(num(Q.m1.choices[okIdx(Q.m1)])).toBe(3 * x + 1);
    expect(byTrap(Q.m1, "wrongq")).toEqual([x]);
    expect(byTrap(Q.m1, "partial")).toEqual([2 * x]);
    expect(byTrap(Q.m1, "sign")).toEqual([3 * solve(2, 0, 10 - 6) + 1]);   // 2x = 10 − 6

    // g_m: ұзындық = ен + 4, периметр 32
    let w = null;
    for (let i = 1; i < 32; i++) if (2 * (i + i + 4) === 32) w = i;
    expect(w).toBe(6);
    expect(num(Q.g_m.choices[okIdx(Q.g_m)])).toBe(w + 4);
    expect(byTrap(Q.g_m, "wrongq")).toEqual([w]);
    expect(byTrap(Q.g_m, "partial")).toEqual([32 / 2]);
    expect(byTrap(Q.g_m, "sign")).toEqual([(32 + 8) / 4 + 4]);

    // ms_m: 300 л, 8 л/мин, ширек сағат
    const minutes = 60 / 4, drained = 8 * minutes;
    expect(num(Q.ms_m.choices[okIdx(Q.ms_m)])).toBe(300 - drained);
    expect(byTrap(Q.ms_m, "partial")).toEqual([drained]);
    expect(byTrap(Q.ms_m, "unit")).toEqual([300 - 8 * 0.25]);
    expect(byTrap(Q.ms_m, "sign")).toEqual([300 + drained]);

    // explore: әр нұсқаға дәл бір жауап, төрт жауаптың бәрі бір рет дұрыс болады
    const M = D.explore.math;
    expect(M.given).toContain("2x − 6 = 10");
    x = solve(M.eq.a, M.eq.b, M.eq.c);
    const expr = { "x": (v) => v, "2x": (v) => 2 * v, "3x + 1": (v) => 3 * v + 1, "x − 1": (v) => v - 1 };
    const hits = M.variants.map((v) => { expect(v.p * x + v.q, v.t).toBe(expr[v.t](x)); return M.choices.indexOf(expr[v.t](x)); });
    expect([...hits].sort()).toEqual([0, 1, 2, 3]);
    for (const v of D.explore.rw.variants) { expect(v.notes).toHaveLength(4); expect(v.ok).toBeGreaterThanOrEqual(0); expect(v.ok).toBeLessThan(4); }
    expect(new Set(D.explore.rw.variants.map((v) => v.ok)).size).toBe(3);

    // checkpoint: 5x + 2 = 37 → x − 3; принтер
    const cx = solve(5, 2, 37), cpn = D.checkpoint.find((i) => i.type === "num");
    expect(cx).toBe(7);
    expect(cpn.value).toBe(cx - 3);
    expect(Object.keys(cpn.errors).map(Number).sort((a, b) => a - b)).toEqual([solve(5, 0, 37 + 2) - 3, cx, cx + 3, 5 * cx].sort((a, b) => a - b));
    const pr = D.checkpoint.find((i) => i.q.includes("printer"));
    expect(pr.options[pr.answer]).toBe(D.traps.math.unit.name);
    expect(pr.why[pr.answer]).toContain(String(12 * 2 * 60));
    expect(pr.q).toContain(String(12 * 2));

    // mistakes: дұрыс жауаптар
    const fix = (id) => D.mistakes.find((m) => m.id === id);
    let small = null; for (let a = 0; a <= 20; a++) if (a - (20 - a) === 6) small = 20 - a;
    expect(small).toBe(7); expect(fix("mk1").fix).toContain("= 7"); expect(fix("mk1").trap).toBe("wrongq");
    let root = null; for (let i = -50; i <= 50; i++) if (-2 * (i - 4) === 10) root = i;
    expect(root).toBe(-1); expect(fix("mk2").fix).toContain("x = −1"); expect(fix("mk2").trap).toBe("sign");
    expect(fix("mk2").steps[2].t).toContain(String(solve(-2, -8, 10)).replace("-", "−"));   // оқушының қате жолы: x = −9
    expect((90 / 1.5) * (40 / 60)).toBe(40); expect(fix("mk3").fix).toContain("= 40 км"); expect(fix("mk3").steps[1].t).toContain(String((90 / 1.5) * 40));
    expect(40 - 0.25 * 40 - 5).toBe(25); expect(fix("mk4").fix).toContain("= 25"); expect(fix("mk4").trap).toBe("partial");
  });
});

// ---------- браузердегі көмекшілер ----------
const tab = (p, i) => p.locator(".rl-nav button").nth(i);
const next = (p) => p.locator(".rl-next");
const seed = (upTo, at) => { const done = {}; STAGES.slice(0, upTo).forEach((k) => (done[k] = 1)); return JSON.stringify({ [ID]: { done, state: {}, ms: 0, at } }); };
async function open(browser, opts = {}, store) {
  const c = await browser.newContext({ viewport: { width: 1280, height: 900 }, ...opts });
  await blockFonts(c);
  if (store) await c.addInitScript(([k, v]) => { if (!localStorage.getItem(k)) localStorage.setItem(k, v); }, [KEY, store]);
  const p = await c.newPage();
  const errs = collectErrors(p);
  await p.goto(URL);
  await expect(p.locator(".rl-title")).toBeVisible();
  return { c, p, errs };
}
async function label(card, q, i) { await card.locator(`.an-seg[data-i="${i}"]`).click(); await card.locator(`.an-labs [data-role="${q.segs[i].role}"]`).click(); }
async function dissect(p, q, { wrong = false, skip = [] } = {}) {
  const card = p.locator(`.an-card[data-q="${q.id}"]`);
  const idx = q.segs.map((s, i) => (s.role ? i : -1)).filter((i) => i >= 0);
  if (wrong) {   // тапсырма сөзін «берілген дерек» деп белгілеу → нақты түсіндірме
    const t = q.segs.findIndex((s) => s.role === "task");
    await card.locator(`.an-seg[data-i="${t}"]`).click(); await card.locator('.an-labs [data-role="given"]').click();
    await expect(card.locator(".tt-bad").first()).toContainText(`«${D.roles.given.name}» емес`);
    await expect(card.locator(".an-opts")).toHaveCount(0);
  }
  for (const i of idx) if (!skip.includes(i)) await label(card, q, i);
  await expect(card.locator(".an-real")).toContainText(q.ask.real);
  const ok = okIdx(q);
  if (wrong) {
    const bad = q.choices.findIndex((c) => !c.ok);
    await card.locator(`.an-opts button[data-c="${bad}"]`).click();
    await expect(card.locator(".tt-bad").last()).toContainText(q.choices[bad].why);
    await expect(card.locator(".an-match")).toHaveCount(0);
  }
  await card.locator(`.an-opts button[data-c="${ok}"]`).click();
  const wrongs = q.choices.map((c, j) => j).filter((j) => j !== ok);
  if (wrong) {   // бірінші қате нұсқаға әдейі басқа тұзақ
    const j = wrongs[0], other = Object.keys(D.traps[q.kind]).find((k) => k !== q.choices[j].trap && k !== q.choices[j].alt);
    await card.locator(`select[data-c="${j}"]`).selectOption(other);
    await card.locator(".an-check").click();
    await expect(card.locator(".an-match li").first().locator(".tt-bad")).toContainText(D.traps[q.kind][other].test);
    await expect(card.locator(".an-match li").nth(1).locator(".tt-info")).toContainText("Тұзақ таңдалмады");
  }
  for (const j of wrongs) await card.locator(`select[data-c="${j}"]`).selectOption(q.choices[j].trap);
  await card.locator(".an-check").click();
  await expect(card).toHaveClass(/done/);
  for (const j of wrongs) await expect(card.locator(".an-match")).toContainText(q.choices[j].why);
}
async function doIntro(p) {
  const q = Q[D.intro.q];
  await p.locator(".an-opts button").nth(q.choices.findIndex((c) => c.trap === "wrongq")).click();
  await expect(p.locator(".rl-body .tt-bad").first()).toContainText("x-тің дұрыс мәні");
  await p.locator('.an-parts [data-role="given"]').click();
  await expect(p.locator(".rl-body .tt-bad").last()).toContainText("Бұл бөлік емес");
  await expect(next(p)).toBeDisabled();
  await p.locator('.an-parts [data-role="asked"]').click();
}
async function doConcept(p) {
  for (let t = 0; t < D.concept.length; t++) {
    const q = Q[D.concept[t]];
    await p.locator(".rl-body .lab-choice button").nth(t).click();
    for (let k = 0; k < 8; k++) { await expect(next(p)).toBeDisabled(); await p.getByRole("button", { name: "Келесі қадам" }).click(); }
    await expect(p.locator(".rl-player .gd-n")).toHaveText("8 / 8");
    await expect(p.locator(".an-cap")).toContainText(q.choices.filter((c) => !c.ok).pop().why);
    await expect(p.locator(".an-board svg")).toHaveAttribute("aria-label", /8-қадам \/ 8/);
    await expect(p.locator(".an-b.seen, .an-b.on")).toHaveCount(8);
  }
}
async function doExplore(p) {
  const M = D.explore.math, m = p.locator('.an-card[data-x="math"]'), r = p.locator('.an-card[data-x="rw"]');
  await m.locator('.an-opts button[data-c="0"]').click();                 // «x» сұралғанда 7 емес
  await expect(m.locator(".tt-bad")).toContainText("дұрысы - B");
  await expect(next(p)).toBeDisabled();
  await m.locator('[data-v="3x+1"]').click();
  await expect(m.locator(".an-stem mark")).toHaveText("3x + 1");
  await m.locator(`.an-opts button[data-c="${M.choices.indexOf(25)}"]`).click();
  await expect(m.locator(".tt-ok")).toContainText("оның мәні 25");
  await expect(m.locator(".an-notes li").nth(1)).toContainText("«x» сұралғанда дұрыс болар еді");
  await r.locator('.an-opts button[data-c="1"]').click();
  await expect(next(p)).toBeDisabled();
  await r.locator('[data-v="detail"]').click();
  await expect(r.locator(".an-stem mark")).toHaveText("According to the text,");
  await r.locator('.an-opts button[data-c="0"]').click();
  await expect(r.locator(".an-opts button.ok")).toHaveAttribute("data-c", "0");
}
async function doCheckpoint(p) {
  const items = p.locator(".gd-exs > .gd-ex");
  for (let i = 0; i < D.checkpoint.length; i++) {
    const it = D.checkpoint[i], li = items.nth(i);
    if (it.type === "mc") await li.locator(".gd-opts button").nth(it.answer).click();
    else {
      await li.locator("input").fill("7"); await li.locator("form button").click();
      await expect(li.locator(".tt-bad")).toContainText("басқа шама табылған");
      await li.locator(".tt-hbtn").click();
      await expect(li.locator(".tt-hlist li")).toHaveCount(1);
      await li.locator("input").fill(String(it.value)); await li.locator("form button").click();
    }
    await expect(li).toHaveClass(/done/);
  }
}
async function doMistakes(p) {
  for (const m of D.mistakes) {
    const li = p.locator(`.gd-ex[data-m="${m.id}"]`), bad = m.steps.findIndex((s) => s.bad);
    if (m.id === "mk3") {
      await li.locator('[data-s="0"]').click();
      await expect(li.locator(".tt-bad")).toContainText(m.steps[0].ok);
      await expect(li.locator("[data-t]")).toHaveCount(0);
    }
    await li.locator(`[data-s="${bad}"]`).click();
    if (m.id === "mk3") { await li.locator('[data-t="sign"]').click(); await expect(li.locator(".tt-bad").last()).toContainText(D.traps.math.sign.test); }
    await li.locator(`[data-t="${m.trap}"]`).click();
    await expect(li).toHaveClass(/done/);
    await expect(li.locator(".tt-ok").last()).toContainText(m.fix);
  }
}

test("жеті кезеңнен толық өту: құлып, нақты түсіндірмелер, сақталу, аяқтау", async ({ browser }) => {
  test.setTimeout(150_000);
  const { c, p, errs } = await open(browser);
  // құлып: тек бірінші кезең ашық, «Келесі кезең» өшірулі
  await expect(p.locator(".rl-nav button")).toHaveCount(7);
  for (let i = 1; i < 7; i++) await expect(tab(p, i)).toBeDisabled();
  await expect(next(p)).toBeDisabled();
  await expect(p.locator(".rl-prog")).toHaveAttribute("aria-valuenow", "0");

  await doIntro(p);
  await expect(p.locator(".rl-note")).toContainText(Q.m1.ask.real);
  await expect(tab(p, 1)).toBeEnabled(); await expect(tab(p, 2)).toBeDisabled();
  await next(p).click();

  await doConcept(p);
  await expect(next(p)).toBeEnabled();
  await next(p).click();

  // бірге жаса: бірінші сұрақта әдейі қателесеміз, жазба жолы жаңарады
  await expect(p.locator(".rl-note")).toContainText("әзірге белгісіз");
  await dissect(p, Q.g_r, { wrong: true });
  await expect(next(p)).toBeDisabled();
  const gm = p.locator('.an-card[data-q="g_m"]');
  await label(gm, Q.g_m, 2);
  await expect(p.locator(".rl-note")).toContainText(Q.g_m.ask.task);
  await expect(gm.locator(".an-seg.an-r-task .an-tag")).toHaveText(D.roles.task.short);
  await dissect(p, Q.g_m, { skip: [2] });
  await expect(next(p)).toBeEnabled();

  // сақталу: қайта жүктегенде сол кезең, өткен кезеңдер белгіленген
  await p.reload();
  await expect(p.locator(".rl-kick")).toContainText("3-кезең / 7");
  await expect(p.locator(".rl-nav button.ok")).toHaveCount(3);
  await expect(tab(p, 3)).toBeEnabled(); await expect(tab(p, 4)).toBeDisabled();
  await expect(next(p)).toBeEnabled();
  await next(p).click();

  await doExplore(p);
  await expect(next(p)).toBeEnabled();
  expect(await p.evaluate(([k, id]) => JSON.parse(localStorage.getItem(k))[id].state.explore, [KEY, ID])).toEqual({ math: ["x", "3x+1"], rw: ["main", "detail"] });
  await next(p).click();

  await doCheckpoint(p);
  await expect(p.locator(".rl-note")).toContainText(`${D.checkpoint.length - 1} / ${D.checkpoint.length}`);
  await next(p).click();

  await doMistakes(p);
  await next(p).click();

  // меңгеру: көмек батырмасы жоқ, нақты өлшенген уақыт көрсетіледі
  await expect(p.locator(".rl-body .tt-hbtn")).toHaveCount(0);
  await dissect(p, Q.ms_r);
  await expect(next(p)).toBeDisabled();
  await dissect(p, Q.ms_m);
  await expect(p.locator(".rl-body > .tt-fb")).toContainText(/Бірінші әрекеттен дұрыс: 10 \/ 10\. Қате әрекет: 0\. Нақты өлшенген уақыт: [\d.]+ с, әрекет саны: \d+/);
  await expect(p.locator(".rl-prog")).toHaveAttribute("aria-valuenow", "7");
  await next(p).click();
  await expect(p.locator(".rl-fin")).toContainText("Сабақ аяқталды");

  // Tutor жазбалары: қателер дәптерінде тұзақ коды бар
  const tutor = await p.evaluate(() => JSON.parse(localStorage.getItem("ao17:tutor:v1")));
  expect(Object.keys(tutor.skills)).toContain(ID);
  expect(JSON.stringify(tutor.mistakes)).toContain("trap-");
  expect(errs).toEqual([]);
  await c.close();
});

test("пернетақта: бөлікті Enter-мен таңдап, атын Space-пен беру", async ({ browser }) => {
  const { c, p, errs } = await open(browser, {}, seed(2, 2));
  const card = p.locator('.an-card[data-q="g_r"]'), seg = card.locator('.an-seg[data-i="1"]');
  await seg.focus(); await p.keyboard.press("Enter");
  await expect(seg).toHaveAttribute("aria-pressed", "true");
  await card.locator('.an-labs [data-role="task"]').focus(); await p.keyboard.press("Space");
  await expect(seg).toHaveClass(/an-r-task/);
  expect(await seg.evaluate((e) => e.tagName)).toBe("BUTTON");
  expect(errs).toEqual([]);
  await c.close();
});

test("азайтылған қозғалыс: ▶ бірден соңғы күйге апарады", async ({ browser }) => {
  const { c, p, errs } = await open(browser, { reducedMotion: "reduce" }, seed(1, 1));
  await expect(p.locator(".rl-player .gd-n")).toHaveText("0 / 8");
  await p.getByRole("button", { name: "Ойнату" }).click();
  await expect(p.locator(".rl-player .gd-n")).toHaveText("8 / 8");
  await expect(p.locator(".an-b.seen, .an-b.on")).toHaveCount(8);
  expect(await p.locator(".an-b rect").first().evaluate((e) => getComputedStyle(e).transitionDuration)).toBe("0s");
  await expect(next(p)).toBeDisabled();
  await p.locator(".rl-body .lab-choice button").nth(1).click();
  await p.getByRole("button", { name: "Ойнату" }).click();
  await expect(next(p)).toBeEnabled();
  expect(errs).toEqual([]);
  await c.close();
});

test("қозғалыс қосулы: ▶ қадамдарды өзі ойнатады", async ({ browser }) => {
  const { c, p, errs } = await open(browser, {}, seed(1, 1));
  await p.locator(".rl-player select").selectOption("2");
  await p.getByRole("button", { name: "Ойнату" }).click();
  await expect(p.locator(".rl-player .gd-n")).toHaveText("2 / 8", { timeout: 5000 });
  await p.getByRole("button", { name: "Тоқтату" }).click();
  expect(errs).toEqual([]);
  await c.close();
});

for (const scheme of ["light", "dark"]) {
  test(`360px (${scheme}): көлденең жылжу жоқ, axe serious/critical = 0`, async ({ browser }) => {
    test.setTimeout(150_000);
    const problems = [];
    const acts = [doIntro, async (p) => { await p.getByRole("button", { name: "Ойнату" }).click(); }, async (p) => { await dissect(p, Q.g_r, { wrong: true }); }, doExplore, doCheckpoint, doMistakes, async (p) => { await dissect(p, Q.ms_m, { wrong: false }).catch(() => {}); }];
    for (let i = 0; i < STAGES.length; i++) {
      const { c, p, errs } = await open(browser, { viewport: { width: 360, height: 740 }, colorScheme: scheme, reducedMotion: "reduce" }, seed(i, i));
      const check = async (label) => {
        expect(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), label + ": horizontal scroll").toBe(true);
        await p.addScriptTag({ content: AXE });
        const v = await p.evaluate(async () => (await axe.run(document.querySelector("main"), { runOnly: ["wcag2a", "wcag2aa"], resultTypes: ["violations"] })).violations
          .filter((x) => x.impact === "serious" || x.impact === "critical").map((x) => `${x.id} (${x.nodes.length}): ${x.nodes[0].target.join(" ")}`));
        v.forEach((x) => problems.push(`${label}: ${x}`));
      };
      await expect(p.locator(".rl-kick")).toContainText(`${i + 1}-кезең / 7`);
      await check(STAGES[i]);
      if (STAGES[i] === "mastery") await dissect(p, Q.ms_r); else await acts[i](p);
      await check(STAGES[i] + "-acted");
      expect(errs, STAGES[i]).toEqual([]);
      await c.close();
    }
    expect(problems, problems.join("\n")).toEqual([]);
  });
}
