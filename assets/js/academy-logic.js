/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
// AO17 CS Universe: пікірлер логикасының қозғалтқышы (браузер және Node тесттері үшін бір файл).
// Парсер -> синтаксистік ағаш -> бағалау, ақиқат кестесі, эквиваленттік, жіктеу, ДҚФ/КҚФ, аргумент дұрыстығы.
// Бұл - толық ақиқат кестесі арқылы нақты есептеу (айнымалы <= 12), эвристика емес.
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.AOLogic = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  const MAX_VARS = 12;
  // Амалдар: басымдық (үлкені - бұрын), ассоциативтілік
  const BIN = {
    and: { sym: "∧", prec: 4, right: false, f: (a, b) => a && b },
    xor: { sym: "⊕", prec: 3, right: false, f: (a, b) => a !== b },
    or: { sym: "∨", prec: 2, right: false, f: (a, b) => a || b },
    imp: { sym: "→", prec: 1, right: true, f: (a, b) => !a || b },
    iff: { sym: "↔", prec: 0, right: false, f: (a, b) => a === b },
  };
  const OPS = { not: "¬", ...Object.fromEntries(Object.entries(BIN).map(([k, v]) => [k, v.sym])) };

  class LogicError extends Error {
    constructor(msg, pos) { super(msg); this.pos = pos; }
  }

  // ---------------------------------------------------------------- лексер
  function tokenize(src) {
    const s = String(src == null ? "" : src);
    const out = [];
    let i = 0;
    const two = { "->": "imp", "=>": "imp", "&&": "and", "||": "or" };
    const three = { "<->": "iff", "<=>": "iff" };
    const one = { "¬": "not", "!": "not", "~": "not", "∧": "and", "&": "and", "∨": "or", "|": "or", "→": "imp", "⇒": "imp",
      "↔": "iff", "⇔": "iff", "⊕": "xor", "^": "xor", "(": "(", ")": ")" };
    const words = { not: "not", and: "and", or: "or", xor: "xor", implies: "imp", iff: "iff",
      "емес": "not", "және": "and", "немесе": "or" };
    while (i < s.length) {
      const c = s[i];
      if (/\s/.test(c)) { i++; continue; }
      if (three[s.substr(i, 3)]) { out.push({ t: three[s.substr(i, 3)], pos: i }); i += 3; continue; }
      if (two[s.substr(i, 2)]) { out.push({ t: two[s.substr(i, 2)], pos: i }); i += 2; continue; }
      if (one[c]) { out.push({ t: one[c], pos: i }); i++; continue; }
      if (c === "1" || c === "⊤") { out.push({ t: "const", v: true, pos: i }); i++; continue; }
      if (c === "0" || c === "⊥") { out.push({ t: "const", v: false, pos: i }); i++; continue; }
      const m = /^[A-Za-zА-Яа-яӘәҒғҚқҢңӨөҰұҮүҺһІі_][A-Za-z0-9_А-Яа-яӘәҒғҚқҢңӨөҰұҮүҺһІі]*/.exec(s.slice(i));
      if (m) {
        const w = m[0];
        const lw = w.toLowerCase();
        if (words[lw]) out.push({ t: words[lw], pos: i });
        else if (w === "А" || w === "T" || lw === "true" || lw === "ақиқат") out.push({ t: "const", v: true, pos: i });
        else if (w === "Ж" || w === "F" || lw === "false" || lw === "жалған") out.push({ t: "const", v: false, pos: i });
        else out.push({ t: "var", v: w, pos: i });
        i += w.length;
        continue;
      }
      throw new LogicError(`Түсініксіз таңба «${c}» (${i + 1}-орын)`, i);
    }
    out.push({ t: "end", pos: s.length });
    return out;
  }

  // ---------------------------------------------------------------- парсер (басымдықпен)
  function parse(src) {
    const toks = tokenize(src);
    let k = 0;
    const peek = () => toks[k];
    function primary() {
      const t = peek();
      if (t.t === "not") { k++; return { op: "not", a: primary() }; }
      if (t.t === "(") {
        k++;
        const e = expr(0);
        if (peek().t !== ")") throw new LogicError(`Жабылатын жақша «)» жетіспейді (${peek().pos + 1}-орын)`, peek().pos);
        k++;
        return e;
      }
      if (t.t === "var") { k++; return { op: "var", name: t.v }; }
      if (t.t === "const") { k++; return { op: "const", v: t.v }; }
      if (t.t === "end") throw new LogicError("Өрнек толық емес: соңында айнымалы не жақша күтілген", t.pos);
      throw new LogicError(`«${OPS[t.t] || t.t}» алдында айнымалы не жақша болуы керек (${t.pos + 1}-орын)`, t.pos);
    }
    function expr(minPrec) {
      let left = primary();
      for (;;) {
        const t = peek();
        const b = BIN[t.t];
        if (!b || b.prec < minPrec) break;
        k++;
        const right = expr(b.right ? b.prec : b.prec + 1);
        left = { op: t.t, a: left, b: right };
      }
      return left;
    }
    if (toks.length === 1) throw new LogicError("Өрнек бос", 0);
    const tree = expr(0);
    if (peek().t !== "end") {
      const t = peek();
      throw new LogicError(t.t === ")" ? `Артық жабылатын жақша (${t.pos + 1}-орын)` : `Күтілмеген «${OPS[t.t] || t.v || t.t}» (${t.pos + 1}-орын): амал жетіспейді`, t.pos);
    }
    return tree;
  }

  // ---------------------------------------------------------------- талдау
  function vars(tree, acc) {
    acc = acc || new Set();
    if (tree.op === "var") acc.add(tree.name);
    if (tree.a) vars(tree.a, acc);
    if (tree.b) vars(tree.b, acc);
    return acc;
  }
  const sortVars = (set) => [...set].sort((x, y) => x.localeCompare(y));
  function opsUsed(tree, acc) {
    acc = acc || new Set();
    if (tree.op !== "var" && tree.op !== "const") acc.add(tree.op);
    if (tree.a) opsUsed(tree.a, acc);
    if (tree.b) opsUsed(tree.b, acc);
    return acc;
  }
  function evaluate(tree, env) {
    switch (tree.op) {
      case "const": return tree.v;
      case "var":
        if (!(tree.name in env)) throw new LogicError(`«${tree.name}» айнымалысының мәні берілмеген`, 0);
        return !!env[tree.name];
      case "not": return !evaluate(tree.a, env);
      default: return BIN[tree.op].f(evaluate(tree.a, env), evaluate(tree.b, env));
    }
  }
  function toStr(tree, parentPrec, side) {
    parentPrec = parentPrec == null ? -1 : parentPrec;
    switch (tree.op) {
      case "const": return tree.v ? "1" : "0";
      case "var": return tree.name;
      case "not": return "¬" + toStr(tree.a, 99);
      default: {
        const b = BIN[tree.op];
        const s = toStr(tree.a, b.prec, "l") + " " + b.sym + " " + toStr(tree.b, b.prec, "r");
        const need = b.prec < parentPrec || (b.prec === parentPrec && (b.right ? side === "l" : side === "r"));
        return need ? "(" + s + ")" : s;
      }
    }
  }
  // Барлық бағалаулар: 0..2^n-1, бірінші айнымалы - ең үлкен бит (оқулықтағы ретпен: 1 1 ... жоғарыда емес, 0-ден бастаймыз)
  function assignments(names) {
    if (names.length > MAX_VARS) throw new LogicError(`Айнымалы тым көп (${names.length}); ең көбі ${MAX_VARS}`, 0);
    const rows = [];
    const n = names.length;
    for (let m = 0; m < 1 << n; m++) {
      const env = {};
      names.forEach((v, i) => (env[v] = !!((m >> (n - 1 - i)) & 1)));
      rows.push(env);
    }
    return rows;
  }
  // Ішкі өрнектер (кестеде аралық бағандар үшін), сол жақтан оңға, қайталанбай
  function subformulas(tree) {
    const out = [], seen = new Set();
    (function walk(t) {
      if (t.op === "var" || t.op === "const") return;
      if (t.a) walk(t.a);
      if (t.b) walk(t.b);
      const s = toStr(t);
      if (!seen.has(s)) { seen.add(s); out.push(t); }
    })(tree);
    return out;
  }
  function truthTable(src, extraVars) {
    const tree = typeof src === "string" ? parse(src) : src;
    const names = sortVars(new Set([...vars(tree), ...(extraVars || [])]));
    const subs = subformulas(tree);
    const rows = assignments(names).map((env) => ({ env, cols: subs.map((t) => evaluate(t, env)), value: evaluate(tree, env) }));
    return { tree, vars: names, columns: subs.map((t) => toStr(t)), rows };
  }
  function classify(src) {
    const tt = truthTable(src);
    const n = tt.rows.filter((r) => r.value).length;
    return { kind: n === tt.rows.length ? "tautology" : n === 0 ? "contradiction" : "contingent", trueRows: n, rows: tt.rows.length };
  }
  // Эквиваленттік: екі өрнектің айнымалылар бірігуі бойынша; қарсы мысалды қайтарады
  function equivalent(a, b) {
    const ta = typeof a === "string" ? parse(a) : a, tb = typeof b === "string" ? parse(b) : b;
    const names = sortVars(new Set([...vars(ta), ...vars(tb)]));
    for (const env of assignments(names)) {
      const va = evaluate(ta, env), vb = evaluate(tb, env);
      if (va !== vb) return { equivalent: false, counterexample: env, left: va, right: vb, vars: names };
    }
    return { equivalent: true, vars: names };
  }
  // Аргумент дұрыстығы: барлық алғышарт ақиқат, қорытынды жалған болатын жол жоқ болса - дұрыс
  function validArgument(premises, conclusion) {
    const ps = premises.map((p) => (typeof p === "string" ? parse(p) : p));
    const c = typeof conclusion === "string" ? parse(conclusion) : conclusion;
    const names = sortVars(new Set([...ps.flatMap((p) => [...vars(p)]), ...vars(c)]));
    for (const env of assignments(names)) {
      if (ps.every((p) => evaluate(p, env)) && !evaluate(c, env)) return { valid: false, counterexample: env, vars: names };
    }
    return { valid: true, vars: names };
  }
  // Канондық ДҚФ / КҚФ ақиқат кестесінен
  function normalForms(src) {
    const tt = truthTable(src);
    const lit = (v, val) => (val ? v : "¬" + v);
    const t = tt.rows.filter((r) => r.value), f = tt.rows.filter((r) => !r.value);
    const dnf = !tt.vars.length ? (tt.rows[0].value ? "1" : "0")
      : t.length === 0 ? "0" : t.map((r) => "(" + tt.vars.map((v) => lit(v, r.env[v])).join(" ∧ ") + ")").join(" ∨ ");
    const cnf = !tt.vars.length ? (tt.rows[0].value ? "1" : "0")
      : f.length === 0 ? "1" : f.map((r) => "(" + tt.vars.map((v) => lit(v, !r.env[v])).join(" ∨ ") + ")").join(" ∧ ");
    return { dnf, cnf, minterms: t.length, maxterms: f.length };
  }
  const fmtEnv = (env, names) => (names || Object.keys(env)).map((v) => `${v} = ${env[v] ? 1 : 0}`).join(", ");

  return { parse, tokenize, evaluate, vars: (t) => sortVars(vars(typeof t === "string" ? parse(t) : t)), opsUsed: (t) => [...opsUsed(typeof t === "string" ? parse(t) : t)],
    toStr, truthTable, classify, equivalent, validArgument, normalForms, assignments, fmtEnv, LogicError, OPS, MAX_VARS };
});
