/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
// AO17 CS Universe: n айнымалысы бар арифметикалық өрнектер (нақты рационал сандар, BigInt).
// Дәлелдеу модулі үшін: қарсы мысал іздеу, индукция кестесі, жабық формуланы тексеру.
// Жуықтау жоқ: 1/3 + 1/6 = 1/2 дәл есептеледі. Бұл - сандық тексеру құралы, теорема дәлелдеуші емес.
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.AOArith = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  class ArithError extends Error {}
  const abs = (a) => (a < 0n ? -a : a);
  const gcd = (a, b) => { a = abs(a); b = abs(b); while (b) [a, b] = [b, a % b]; return a; };
  function Q(n, d) {
    if (d === undefined) d = 1n;
    if (d === 0n) throw new ArithError("Нөлге бөлуге болмайды");
    if (d < 0n) { n = -n; d = -d; }
    const g = gcd(n, d) || 1n;
    return { n: n / g, d: d / g };
  }
  const add = (a, b) => Q(a.n * b.d + b.n * a.d, a.d * b.d);
  const sub = (a, b) => Q(a.n * b.d - b.n * a.d, a.d * b.d);
  const mul = (a, b) => Q(a.n * b.n, a.d * b.d);
  const div = (a, b) => { if (b.n === 0n) throw new ArithError("Нөлге бөлуге болмайды"); return Q(a.n * b.d, a.d * b.n); };
  function pow(a, b) {
    if (b.d !== 1n || b.n < 0n) throw new ArithError("Дәреже көрсеткіші теріс емес бүтін сан болуы керек");
    if (b.n > 4096n) throw new ArithError("Дәреже тым үлкен");
    return Q(a.n ** b.n, a.d ** b.n);
  }
  function mod(a, b) {
    if (a.d !== 1n || b.d !== 1n) throw new ArithError("% тек бүтін сандарға");
    if (b.n === 0n) throw new ArithError("Нөлге бөлуге болмайды");
    const r = a.n % b.n;
    return Q(r < 0n ? r + abs(b.n) : r);
  }
  const eq = (a, b) => a.n === b.n && a.d === b.d;
  const cmp = (a, b) => { const x = a.n * b.d, y = b.n * a.d; return x < y ? -1 : x > y ? 1 : 0; };
  const str = (a) => (a.d === 1n ? String(a.n) : `${a.n}/${a.d}`);

  // ---------------------------------------------------------------- парсер
  function tokenize(src) {
    const s = String(src).replace(/[·×]/g, "*").replace(/[−–]/g, "-").replace(/²/g, "^2").replace(/³/g, "^3");
    const out = [];
    let i = 0;
    while (i < s.length) {
      const c = s[i];
      if (/\s/.test(c)) { i++; continue; }
      if (/\d/.test(c)) { let j = i; while (j < s.length && /\d/.test(s[j])) j++; out.push({ t: "num", v: BigInt(s.slice(i, j)) }); i = j; continue; }
      if (c === "n" || c === "k" || c === "a") { out.push({ t: "var", v: c }); i++; continue; }
      if ("+-*/%^()".includes(c)) { out.push({ t: c }); i++; continue; }
      throw new ArithError(`Түсініксіз таңба «${c}». Рұқсат: сандар, n, a, + - * / % ^ ( )`);
    }
    out.push({ t: "end" });
    return out;
  }
  function parse(src) {
    const t = tokenize(src);
    let k = 0;
    const peek = () => t[k];
    const atomStart = (x) => x.t === "num" || x.t === "var" || x.t === "(";
    function atom() {
      const x = peek();
      if (x.t === "num") { k++; return { op: "num", v: Q(x.v) }; }
      if (x.t === "var") { k++; return { op: "var", v: x.v }; }
      if (x.t === "(") { k++; const e = sum(); if (peek().t !== ")") throw new ArithError("Жабылатын жақша «)» жетіспейді"); k++; return e; }
      throw new ArithError(x.t === "end" ? "Өрнек толық емес" : `«${x.t}» алдында сан не жақша керек`);
    }
    function power() { const b = atom(); if (peek().t === "^") { k++; return { op: "^", a: b, b: unary() }; } return b; }
    function unary() { if (peek().t === "-") { k++; return { op: "neg", a: unary() }; } if (peek().t === "+") { k++; return unary(); } return power(); }
    function prod() {
      let a = unary();
      for (;;) {
        const x = peek();
        if (x.t === "*" || x.t === "/" || x.t === "%") { k++; a = { op: x.t, a, b: unary() }; }
        else if (atomStart(x)) a = { op: "*", a, b: power() };   // жасырын көбейту: 2n, n(n+1)
        else return a;
      }
    }
    function sum() {
      let a = prod();
      while (peek().t === "+" || peek().t === "-") { const o = peek().t; k++; a = { op: o, a, b: prod() }; }
      return a;
    }
    if (t.length === 1) throw new ArithError("Өрнек бос");
    const e = sum();
    if (peek().t !== "end") throw new ArithError(peek().t === ")" ? "Артық жабылатын жақша" : "Өрнектің соңы түсініксіз");
    return e;
  }
  function evaluate(tree, env) {
    switch (tree.op) {
      case "num": return tree.v;
      case "var": { if (!(tree.v in env)) throw new ArithError(`${tree.v} мәні берілмеген`); const x = env[tree.v]; return typeof x === "object" ? x : Q(BigInt(x)); }
      case "neg": { const x = evaluate(tree.a, env); return Q(-x.n, x.d); }
      case "+": return add(evaluate(tree.a, env), evaluate(tree.b, env));
      case "-": return sub(evaluate(tree.a, env), evaluate(tree.b, env));
      case "*": return mul(evaluate(tree.a, env), evaluate(tree.b, env));
      case "/": return div(evaluate(tree.a, env), evaluate(tree.b, env));
      case "%": return mod(evaluate(tree.a, env), evaluate(tree.b, env));
      case "^": return pow(evaluate(tree.a, env), evaluate(tree.b, env));
    }
    throw new ArithError("белгісіз амал");
  }
  const LIMIT = 10n ** 14n;
  function isPrime(x) {
    if (x.d !== 1n || x.n < 2n) return false;
    const v = x.n;
    if (v > LIMIT) throw new ArithError("Жай санды тексеруге тым үлкен сан");
    if (v % 2n === 0n) return v === 2n;
    for (let i = 3n; i * i <= v; i += 2n) if (v % i === 0n) return false;
    return true;
  }
  function isqrt(v) { if (v < 2n) return v; let x = BigInt(Math.floor(Math.sqrt(Number(v)))); while (x * x > v) x--; while ((x + 1n) * (x + 1n) <= v) x++; return x; }
  const PROPS = {
    prime: ["жай сан", isPrime],
    composite: ["құрама сан", (x) => x.d === 1n && x.n > 1n && !isPrime(x)],
    even: ["жұп сан", (x) => x.d === 1n && x.n % 2n === 0n],
    odd: ["тақ сан", (x) => x.d === 1n && x.n % 2n !== 0n],
    positive: ["оң сан (> 0)", (x) => x.n > 0n],
    nonneg: ["теріс емес (≥ 0)", (x) => x.n >= 0n],
    integer: ["бүтін сан", (x) => x.d === 1n],
    square: ["толық квадрат", (x) => x.d === 1n && x.n >= 0n && isqrt(x.n) ** 2n === x.n],
    div3: ["3-ке бөлінеді", (x) => x.d === 1n && x.n % 3n === 0n],
    div6: ["6-ға бөлінеді", (x) => x.d === 1n && x.n % 6n === 0n],
    any: ["кез келген", () => true],
  };
  const val = (src, n) => evaluate(typeof src === "string" ? parse(src) : src, { n, k: n });
  // Тұжырым: «domain ішіндегі where(n) болатын әр n үшін prop(expr(n))». Қарсы мысал - сол шартты бұзатын n.
  function isCounterexample(spec, n) {
    const [lo, hi] = spec.domain;
    if (!Number.isInteger(n) || n < lo || n > hi) return { ok: false, msg: `n бүтін сан және ${lo} ≤ n ≤ ${hi} болуы керек` };
    if (spec.where && !PROPS[spec.where][1](Q(BigInt(n)))) return { ok: false, msg: `Тұжырым тек n ${PROPS[spec.where][0]} болғанда айтылады` };
    const v = val(spec.expr, n);
    const holds = PROPS[spec.prop][1](v);
    return holds ? { ok: false, value: v, msg: `n = ${n}: ${spec.expr} = ${str(v)} - ${PROPS[spec.prop][0]}, тұжырым орындалады` }
      : { ok: true, value: v, msg: `n = ${n}: ${spec.expr} = ${str(v)} - ${PROPS[spec.prop][0]} емес. Тұжырым жоққа шықты.` };
  }
  function searchCounterexamples(spec, max) {
    const out = [];
    for (let n = spec.domain[0]; n <= spec.domain[1] && out.length < (max || 1e9); n++) if (isCounterexample(spec, n).ok) out.push(n);
    return out;
  }
  // Жабық формула: Σ_{i=start}^{N} term(i) = closed(N), N = start..start+count-1 үшін тексеріледі
  function checkClosedForm(term, closed, start, count) {
    const tt = parse(term), ct = parse(closed);
    let s = Q(0n);
    const rows = [];
    for (let N = start; N < start + (count || 30); N++) {
      s = add(s, evaluate(tt, { n: N, k: N }));
      const c = evaluate(ct, { n: N, k: N });
      rows.push({ N, sum: s, closed: c, ok: eq(s, c) });
    }
    const bad = rows.find((r) => !r.ok);
    return { ok: !bad, first: bad || null, rows };
  }
  // Рекуррент қатынас: a(start) = first, a(n) = rule(a(n-1), n). closed(n)-ді start..start+count-1 үшін салыстырады
  function checkRecurrence(spec, closed, count) {
    const rt = parse(spec.rule), ct = parse(closed);
    let a = Q(BigInt(spec.first));
    const rows = [];
    for (let N = spec.start; N < spec.start + (count || 30); N++) {
      if (N > spec.start) a = evaluate(rt, { a, n: N, k: N });
      const c = evaluate(ct, { n: N, k: N });
      rows.push({ N, a, closed: c, ok: eq(a, c) });
    }
    const bad = rows.find((r) => !r.ok);
    return { ok: !bad, first: bad || null, rows };
  }
  return { checkRecurrence, parse, evaluate, val, Q, add, sub, mul, div, eq, cmp, str, PROPS, isPrime, isCounterexample, searchCounterexamples, checkClosedForm, ArithError };
});
