// © 2026 Sagid Mustafa. All Rights Reserved.
// AO17 Reality Engine: сызықтық теңдеу моделі (assets/js/rl-mathexpr.js) - дәл арифметика, заңды амалдар, кеңес.
// node --test tests/academy/mathexpr.test.js
const test = require("node:test");
const assert = require("node:assert");
const M = require("../../assets/js/rl-mathexpr.js");
const DATA = (() => { const w = {}; new Function("window", require("fs").readFileSync(require("path").join(__dirname, "../../assets/data/rl-equation.js"), "utf8"))(w); return w.RL_EQUATION; })();

test("бөлшектер қысқарады, талдау: бүтін, бөлшек, ондық, минус таңбасы", () => {
  assert.deepStrictEqual(M.F(6, -4), { n: -3, d: 2 });
  assert.deepStrictEqual(M.parse("−1,5"), { n: -3, d: 2 });
  assert.deepStrictEqual(M.parse("3/4"), { n: 3, d: 4 });
  assert.deepStrictEqual(M.parse(" 12 "), { n: 12, d: 1 });
  assert.strictEqual(M.parse("1/0"), null);
  assert.strictEqual(M.parse("abc"), null);
});

test("жазылуы: коэффициент 1 мен −1, нөл мүшелер, теріс бос мүше", () => {
  assert.strictEqual(M.fmt(M.make(3, -2, 1, 0)), "3x − 2 = x");
  assert.strictEqual(M.fmt(M.make(-1, 0, 0, 5)), "−x = 5");
  assert.strictEqual(M.fmt(M.make(0, 0, 0, 0)), "0 = 0");
  assert.strictEqual(M.fmt(M.make(M.F(1, 2), 3, 0, -7)), "1/2x + 3 = −7");
});

test("заңды амал шешімді өзгертпейді; бір жаққа ғана қолданса - теңдеу бұзылады", () => {
  let e = M.make(5, -3, 2, 9);
  assert.deepStrictEqual(M.solve(e).x, { n: 4, d: 1 });
  for (const op of [{ t: "addx", k: -2 }, { t: "add", k: 3 }, { t: "mul", k: -7 }, { t: "div", k: M.F(3, 5) }, { t: "addx", k: 11 }]) {
    e = M.apply(e, op);
    assert.deepStrictEqual(M.solve(e).x, { n: 4, d: 1 }, M.fmt(e));
    assert.strictEqual(e.broken, false);
    assert.strictEqual(M.tilt(e, 4), 0);
  }
  const bad = M.apply(M.make(5, -3, 2, 9), { t: "add", k: 3 }, "left");
  assert.strictEqual(bad.broken, true);
  assert.notDeepStrictEqual(M.solve(bad).x, { n: 4, d: 1 });
  assert.strictEqual(M.tilt(bad, 4), 1);
  assert.strictEqual(M.apply(M.make(1, 0, 0, 2), { t: "add", k: 0 }, "left").broken, false);
  assert.throws(() => M.apply(M.make(1, 0, 0, 2), { t: "div", k: 0 }));
  assert.throws(() => M.apply(M.make(1, 0, 0, 2), { t: "mul", k: 0 }));
});

test("ерекше жағдайлар: шешім жоқ, кез келген x", () => {
  assert.strictEqual(M.solve(M.make(2, 3, 2, 5)).kind, "none");
  assert.strictEqual(M.solve(M.make(2, 3, 2, 3)).kind, "all");
  assert.strictEqual(M.suggest(M.make(2, 3, 2, 5)), null);
});

test("кеңес әрқашан ең көбі үш қадамда x = сан түріне жеткізеді (9^4 теңдеу, тәуелсіз тексеріс)", () => {
  let n = 0;
  for (let a = -4; a <= 4; a++) for (let b = -4; b <= 4; b++) for (let c = -4; c <= 4; c++) for (let d = -4; d <= 4; d++) {
    if (a === c) continue;
    let e = M.make(a, b, c, d), steps = 0;
    while (!M.isSolved(e)) { const s = M.suggest(e); assert.ok(s, M.fmt(e)); e = M.apply(e, s.op); assert.ok(++steps <= 3, `${a},${b},${c},${d}`); }
    const x = M.val(M.solve(e).x);
    assert.ok(Math.abs(a * x + b - (c * x + d)) < 1e-9, `${a}x+${b}=${c}x+${d}: x=${x}`);   // бастапқы теңдеуге қойып тексеру
    assert.ok(Math.abs(x - (d - b) / (a - c)) < 1e-9);
    n++;
  }
  assert.strictEqual(n, 9 * 9 * 9 * 8);
});

test("сабақ деректері: әр теңдеудің жауабы модельмен есептелгенге тең", () => {
  const sol = (q) => M.val(M.solve(M.make(...q)).x);
  assert.strictEqual(sol(DATA.intro.eq), DATA.intro.x);
  assert.strictEqual(sol(DATA.concept.eq), DATA.concept.x);
  assert.strictEqual(sol(DATA.guided.eq), DATA.guided.x);
  for (const set of [DATA.checkpoint, DATA.mastery]) for (const q of set) {
    if (q.eq) { const s = M.solve(M.make(...q.eq)); if (q.type === "num") assert.ok(Math.abs(M.val(s.x) * (q.mult || 1) + (q.plus || 0) - q.value) < 1e-9, q.q); else assert.strictEqual(s.kind, q.kind, q.q); }
    if (q.type === "mc") assert.strictEqual(q.why.length, q.options.length, q.q);
    if (set === DATA.checkpoint) assert.strictEqual(q.hints.length, 3, q.q); else assert.strictEqual(q.hints, undefined, q.q);
  }
  for (const c of DATA.mistakes) {
    // қате қадамға дейінгі жолдар дұрыс (шешімі бірдей), қате жолдан бастап шешім өзгереді
    const want = M.val(M.solve(M.make(...c.lines[0])).x);
    c.lines.forEach((l, i) => { const got = M.val(M.solve(M.make(...l)).x); if (i < c.wrong) assert.ok(Math.abs(got - want) < 1e-9, `${c.title}: ${i}-жол`); if (i === c.wrong) assert.ok(Math.abs(got - want) > 1e-9, `${c.title}: қате жол`); });
    assert.ok(c.wrong >= 1 && c.wrong < c.lines.length);
    assert.strictEqual(c.traps.length, c.trapWhy.length);
    assert.ok(Math.abs(c.right - want) < 1e-9, c.title);
  }
});
