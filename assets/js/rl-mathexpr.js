/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md.
   AO17 Reality Engine: сызықтық теңдеу моделі (a·x + b = c·x + d), дәл рационал арифметикамен.
   Теңдеудің әр жағы {a, b} - x-тің коэффициенті мен бос мүше; сандар {n, d} бөлшегі (d > 0, қысқартылған).
   Амалдар: {t:"add", k} - екі жаққа k қосу; {t:"addx", k} - екі жаққа k·x қосу; {t:"mul", k}; {t:"div", k} (k ≠ 0).
   side: "both" (әдепкі) - заңды амал; "left" / "right" - бір жаққа ғана (тепе-теңдік бұзылады, broken = true).
   Браузерде window.AO17Math, Node-та module.exports. DOM-ға тәуелсіз. */
(function (root, factory) { const m = factory(); if (typeof module === "object" && module.exports) module.exports = m; else root.AO17Math = m; })(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
  const F = (n, d = 1) => { if (!Number.isInteger(n) || !Number.isInteger(d) || d === 0) throw new Error("бөлшек қате"); if (d < 0) { n = -n; d = -d; } const g = gcd(n, d); return { n: n / g, d: d / g }; };
  const add = (p, q) => F(p.n * q.d + q.n * p.d, p.d * q.d), mul = (p, q) => F(p.n * q.n, p.d * q.d), neg = (p) => F(-p.n, p.d);
  const div = (p, q) => { if (q.n === 0) throw new Error("нөлге бөлуге болмайды"); return F(p.n * q.d, p.d * q.n); };
  const eqF = (p, q) => p.n === q.n && p.d === q.d, isZero = (p) => p.n === 0, val = (p) => p.n / p.d;
  const toF = (v) => (typeof v === "object" ? F(v.n, v.d) : F(v));
  const fmtF = (p) => (p.d === 1 ? String(p.n) : `${p.n}/${p.d}`).replace("-", "−");
  /** "3", "-2", "3/4", "−1,5" → бөлшек; танылмаса null */
  function parse(s) {
    s = String(s).trim().replace(/−/g, "-").replace(",", ".").replace(/\s+/g, "");
    let m = s.match(/^(-?\d+)\/(-?\d+)$/);
    if (m) return +m[2] === 0 ? null : F(+m[1], +m[2]);
    m = s.match(/^(-?)(\d*)\.(\d{1,4})$/);
    if (m) { const d = 10 ** m[3].length; return F((m[1] ? -1 : 1) * ((+m[2] || 0) * d + +m[3]), d); }
    return /^-?\d+$/.test(s) ? F(+s) : null;
  }
  const side = (a, b) => ({ a: toF(a), b: toF(b) });
  const make = (a, b, c, d) => ({ L: side(a, b), R: side(c, d), broken: false });
  function applySide(s, op) {
    const k = toF(op.k);
    if (op.t === "add") return { a: s.a, b: add(s.b, k) };
    if (op.t === "addx") return { a: add(s.a, k), b: s.b };
    if (op.t === "mul") return { a: mul(s.a, k), b: mul(s.b, k) };
    if (op.t === "div") return { a: div(s.a, k), b: div(s.b, k) };
    throw new Error("белгісіз амал");
  }
  /** Жаңа теңдеу қайтарады (бастапқысы өзгермейді). Нөлге көбейту ақпаратты жояды, сондықтан тыйым салынған. */
  function apply(eq, op, where = "both") {
    if ((op.t === "div" || op.t === "mul") && isZero(toF(op.k))) throw new Error(op.t === "div" ? "нөлге бөлуге болмайды" : "нөлге көбейтсек, теңдеу 0 = 0 болып, x туралы ақпарат жоғалады");
    const noop = (op.t === "add" || op.t === "addx") ? isZero(toF(op.k)) : eqF(toF(op.k), F(1));
    return { L: where === "right" ? eq.L : applySide(eq.L, op), R: where === "left" ? eq.R : applySide(eq.R, op), broken: eq.broken || (where !== "both" && !noop) };
  }
  /** kind: "one" (жалғыз шешім, x), "none" (шешім жоқ), "all" (кез келген x) */
  function solve(eq) {
    const a = add(eq.L.a, neg(eq.R.a)), b = add(eq.R.b, neg(eq.L.b));
    if (!isZero(a)) return { kind: "one", x: div(b, a) };
    return { kind: isZero(b) ? "all" : "none" };
  }
  const isSolved = (eq) => (eqF(eq.L.a, F(1)) && isZero(eq.L.b) && isZero(eq.R.a)) || (eqF(eq.R.a, F(1)) && isZero(eq.R.b) && isZero(eq.L.a));
  const evalSide = (s, x) => add(mul(s.a, toF(x)), s.b);
  /** Сол жақ пен оң жақтың айырмасының таңбасы x мәнінде: −1, 0, 1 (таразының қай жаққа ауатыны) */
  const tilt = (eq, x) => Math.sign(val(add(evalSide(eq.L, x), neg(evalSide(eq.R, x)))));
  function fmtSide(s) {
    const parts = [];
    if (!isZero(s.a)) { const m = Math.abs(val(s.a)) === 1 && s.a.d === 1 ? (s.a.n < 0 ? "−" : "") : fmtF(s.a); parts.push(m + "x"); }
    if (!isZero(s.b) || !parts.length) parts.push(parts.length ? (s.b.n < 0 ? "− " : "+ ") + fmtF(F(Math.abs(s.b.n), s.b.d)) : fmtF(s.b));
    return parts.join(" ");
  }
  const fmt = (eq) => `${fmtSide(eq.L)} = ${fmtSide(eq.R)}`;
  const OPS = { add: (k) => (k.n < 0 ? `екі жақтан ${fmtF(neg(k))} азайту` : `екі жаққа ${fmtF(k)} қосу`), addx: (k) => (k.n < 0 ? `екі жақтан ${fmtF(neg(k))}x азайту` : `екі жаққа ${fmtF(k)}x қосу`), mul: (k) => `екі жақты ${fmtF(k)}-ге көбейту`, div: (k) => `екі жақты ${fmtF(k)}-ге бөлу` };
  const describe = (op) => OPS[op.t](toF(op.k));
  /** Ережелік кеңес: шешуге жақындататын келесі амал (ең қысқа стандартты жол). Шешілген не ерекше жағдайда null. */
  function suggest(eq) {
    if (isSolved(eq) || solve(eq).kind !== "one") return null;
    if (!isZero(eq.L.a) && !isZero(eq.R.a)) return { op: { t: "addx", k: neg(eq.R.a) }, why: "x екі жақта да тұр: алдымен оларды бір жаққа жинаймыз." };
    const xs = isZero(eq.R.a) ? eq.L : eq.R;
    if (!isZero(xs.b)) return { op: { t: "add", k: neg(xs.b) }, why: "x тұрған жақтағы бос санды жоямыз: оған қарама-қарсы санды екі жаққа қосамыз." };
    return { op: { t: "div", k: xs.a }, why: "x-тің алдындағы коэффициентке екі жақты бөлеміз." };
  }
  return { F, parse, make, apply, solve, isSolved, tilt, evalSide, fmt, fmtSide, fmtF, describe, suggest, val, eqF, neg };
});
