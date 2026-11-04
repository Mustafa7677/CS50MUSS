/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
// AO17 CS Universe: дискретті құрылымдар қозғалтқышы - жиындар, жиын өрнектері, қатынастар, функциялар, графтар.
// Жиын тепе-теңдігі логикаға аударылып (∪→∨, ∩→∧, '→¬, \→∧¬, △→⊕), AOLogic ақиқат кестесімен ДӘЛ тексеріледі.
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(typeof require === "function" ? require("./academy-logic.js") : null);
  else root.AODisc = factory(root.AOLogic);
})(typeof self !== "undefined" ? self : this, function (L) {
  "use strict";
  class DiscError extends Error {}
  const key = (x) => (typeof x === "number" ? "n:" + x : "s:" + x);
  const sortEls = (arr) => [...arr].sort((a, b) => (typeof a === typeof b ? (typeof a === "number" ? a - b : String(a).localeCompare(String(b))) : typeof a === "number" ? -1 : 1));
  function norm(arr) { const m = new Map(); arr.forEach((x) => m.set(key(x), x)); return sortEls([...m.values()]); }
  const fmt = (s) => (s.length ? "{" + s.join(", ") + "}" : "∅");
  const eqSet = (a, b) => { const A = norm(a), B = norm(b); return A.length === B.length && A.every((x, i) => key(x) === key(B[i])); };
  // "{1, 2, 3}", "1, 2, 3", "∅", "{a, b}" -> массив
  function parseSet(src) {
    const s = String(src).trim();
    if (s === "∅" || s === "{}" || s === "") return [];
    const inner = s.replace(/^\{/, "").replace(/\}$/, "");
    if (/[{}]/.test(inner)) throw new DiscError("Ішкі жиындар бұл жерде қолданылмайды");
    return norm(inner.split(",").map((t) => t.trim()).filter(Boolean).map((t) => {
      if (/^-?\d+$/.test(t)) return Number(t);
      if (/^[A-Za-zА-Яа-яӘәҒғҚқҢңӨөҰұҮүҺһІі_][\wА-Яа-яӘәҒғҚқҢңӨөҰұҮүҺһІі]*$/.test(t)) return t;
      throw new DiscError(`«${t}» - элемент ретінде түсініксіз (сан не сөз жазыңыз)`);
    }));
  }
  // ---------------------------------------------------------------- жиын өрнектері
  // Грамматика: union := inter ((∪ | \ | △) inter)* ; inter := post (∩ post)* ; post := atom (' | ᶜ)* ; atom := A..Z | ∅ | U | ( union )
  function tokenize(src) {
    const s = String(src).replace(/\s+/g, "");
    const out = [];
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (/[A-Z]/.test(c)) out.push({ t: "set", v: c });
      else if ("∪∩△()'ᶜ∅".includes(c)) out.push({ t: c === "ᶜ" ? "'" : c });
      else if (c === "\\" || c === "∖" || c === "−" || c === "-") out.push({ t: "\\" });
      else if (c === "|" || c === "+") out.push({ t: "∪" });
      else if (c === "&" || c === "*") out.push({ t: "∩" });
      else throw new DiscError(`Түсініксіз таңба «${c}». Рұқсат: A-Z, ∪ ∩ \\ △ ' ( ) ∅`);
    }
    out.push({ t: "end" });
    return out;
  }
  function parseExpr(src) {
    const t = tokenize(src);
    let k = 0;
    const peek = () => t[k];
    function atom() {
      const x = t[k++];
      if (x.t === "set") return { op: "set", v: x.v };
      if (x.t === "∅") return { op: "empty" };
      if (x.t === "(") { const e = union(); if (t[k++].t !== ")") throw new DiscError("Жабылатын жақша «)» жетіспейді"); return e; }
      throw new DiscError(x.t === "end" ? "Өрнек толық емес" : `«${x.t}» алдында жиын не жақша керек`);
    }
    function post() { let a = atom(); while (peek().t === "'") { k++; a = { op: "comp", a }; } return a; }
    function inter() { let a = post(); while (peek().t === "∩") { k++; a = { op: "∩", a, b: post() }; } return a; }
    function union() { let a = inter(); while (["∪", "\\", "△"].includes(peek().t)) { const o = t[k++].t; a = { op: o, a, b: inter() }; } return a; }
    if (t.length === 1) throw new DiscError("Өрнек бос");
    const e = union();
    if (peek().t !== "end") throw new DiscError(peek().t === ")" ? "Артық жабылатын жақша" : "Өрнекте амал жетіспейді");
    return e;
  }
  function names(tree, acc) {
    acc = acc || new Set();
    if (tree.op === "set" && tree.v !== "U") acc.add(tree.v);
    if (tree.a) names(tree.a, acc);
    if (tree.b) names(tree.b, acc);
    return acc;
  }
  function evalSet(src, sets, U) {
    const tree = typeof src === "string" ? parseExpr(src) : src;
    const uni = norm(U || []);
    const has = (arr, x) => arr.some((y) => key(y) === key(x));
    const go = (n) => {
      switch (n.op) {
        case "empty": return [];
        case "set": if (n.v === "U") return uni; if (!(n.v in sets)) throw new DiscError(`${n.v} жиыны берілмеген`); return norm(sets[n.v]);
        case "comp": { if (!U) throw new DiscError("Толықтауыш үшін әмбебап жиын U керек"); const a = go(n.a); return uni.filter((x) => !has(a, x)); }
        case "∪": return norm([...go(n.a), ...go(n.b)]);
        case "∩": { const b = go(n.b); return go(n.a).filter((x) => has(b, x)); }
        case "\\": { const b = go(n.b); return go(n.a).filter((x) => !has(b, x)); }
        case "△": { const a = go(n.a), b = go(n.b); return norm([...a.filter((x) => !has(b, x)), ...b.filter((x) => !has(a, x))]); }
      }
      throw new DiscError("белгісіз амал");
    };
    return go(tree);
  }
  // Жиын өрнегі -> пікірлер логикасы формуласы (мүшелік: «x ∈ A» -> a)
  function toLogic(src) {
    const tree = typeof src === "string" ? parseExpr(src) : src;
    const go = (n) => {
      switch (n.op) {
        case "empty": return "0";
        case "set": return n.v === "U" ? "1" : n.v.toLowerCase();
        case "comp": return "¬(" + go(n.a) + ")";
        case "∪": return "(" + go(n.a) + " ∨ " + go(n.b) + ")";
        case "∩": return "(" + go(n.a) + " ∧ " + go(n.b) + ")";
        case "\\": return "(" + go(n.a) + " ∧ ¬(" + go(n.b) + "))";
        case "△": return "(" + go(n.a) + " ⊕ " + go(n.b) + ")";
      }
    };
    return go(tree);
  }
  // A ≡ B барлық жиындар үшін (тепе-теңдік) ⇔ мүшелік формулалары эквивалент
  function identical(a, b) {
    if (!L) throw new DiscError("AOLogic жоқ");
    const r = L.equivalent(toLogic(a), toLogic(b));
    if (r.equivalent) return { identical: true };
    const region = r.vars.map((v) => (r.counterexample[v] ? "∈ " : "∉ ") + v.toUpperCase()).join(", ");
    return { identical: false, region, left: r.left, right: r.right };
  }
  // ---------------------------------------------------------------- қатынастар
  // "(1,2), (2,3)" -> [[1,2],[2,3]]
  function parsePairs(src) {
    const s = String(src).trim();
    if (!s || s === "∅") return [];
    const out = [];
    const re = /\(\s*([^,()\s]+)\s*,\s*([^,()\s]+)\s*\)/g;
    let m, used = 0;
    while ((m = re.exec(s))) { out.push([/^-?\d+$/.test(m[1]) ? +m[1] : m[1], /^-?\d+$/.test(m[2]) ? +m[2] : m[2]]); used += m[0].length; }
    const rest = s.replace(re, "").replace(/[\s,{}]/g, "");
    if (rest) throw new DiscError("Жұптарды (a, b) түрінде, үтірмен бөліп жазыңыз");
    return out;
  }
  function relProps(S, R) {
    const has = (a, b) => R.some(([x, y]) => key(x) === key(a) && key(y) === key(b));
    const refl = S.every((a) => has(a, a));
    const sym = R.every(([a, b]) => has(b, a));
    const anti = R.every(([a, b]) => key(a) === key(b) || !has(b, a));
    let trans = true, witness = null;
    for (const [a, b] of R) for (const [c, d] of R) if (key(b) === key(c) && !has(a, d)) { trans = false; witness = witness || [a, b, d]; }
    const out = { reflexive: refl, symmetric: sym, antisymmetric: anti, transitive: trans, transWitness: witness };
    out.equivalence = refl && sym && trans;
    out.partialOrder = refl && anti && trans;
    if (out.equivalence) {
      const seen = new Set(), classes = [];
      S.forEach((a) => { if (seen.has(key(a))) return; const cl = S.filter((b) => has(a, b)); cl.forEach((b) => seen.add(key(b))); classes.push(norm(cl)); });
      out.classes = classes;
    }
    return out;
  }
  // ---------------------------------------------------------------- функциялар
  function funcKind(X, Y, pairs) {
    const img = new Map();
    for (const [x, y] of pairs) {
      if (!X.some((a) => key(a) === key(x))) return { kind: "notfunction", why: `${x} анықталу облысында жоқ` };
      if (!Y.some((b) => key(b) === key(y))) return { kind: "notfunction", why: `${y} мәндер облысында жоқ` };
      if (img.has(key(x)) && key(img.get(key(x))) !== key(y)) return { kind: "notfunction", why: `${x} екі мәнге бейнеленеді` };
      img.set(key(x), y);
    }
    const missing = X.find((x) => !img.has(key(x)));
    if (missing !== undefined) return { kind: "notfunction", why: `${missing} үшін мән берілмеген` };
    const vals = [...img.values()].map(key);
    const inj = new Set(vals).size === vals.length;
    const sur = Y.every((y) => vals.includes(key(y)));
    return { kind: inj && sur ? "bijective" : inj ? "injective" : sur ? "surjective" : "neither", injective: inj, surjective: sur };
  }
  // ---------------------------------------------------------------- графтар
  // "1-2, 2-3" (бағытсыз) -> қабырғалар
  function parseEdges(src) {
    const s = String(src).trim();
    if (!s) return [];
    return s.split(/[,;\n]+/).map((t) => t.trim()).filter(Boolean).map((t) => {
      const m = /^([\wА-Яа-яӘәҒғҚқҢңӨөҰұҮүҺһІі]+)\s*[-–—]\s*([\wА-Яа-яӘәҒғҚқҢңӨөҰұҮүҺһІі]+)$/.exec(t);
      if (!m) throw new DiscError(`«${t}» - қабырға «u-v» түрінде жазылуы керек`);
      const f = (x) => (/^-?\d+$/.test(x) ? +x : x);
      return [f(m[1]), f(m[2])];
    });
  }
  function graphInfo(V, E) {
    const vs = norm(V.length ? V : E.flat());
    const adj = new Map(vs.map((v) => [key(v), []]));
    let loops = 0;
    const seenE = new Set();
    let multi = 0;
    for (const [a, b] of E) {
      if (!adj.has(key(a))) adj.set(key(a), []), vs.push(a);
      if (!adj.has(key(b))) adj.set(key(b), []), vs.push(b);
      const ek = [key(a), key(b)].sort().join("|");
      if (seenE.has(ek)) multi++;
      seenE.add(ek);
      if (key(a) === key(b)) { loops++; adj.get(key(a)).push(a); adj.get(key(a)).push(a); }
      else { adj.get(key(a)).push(b); adj.get(key(b)).push(a); }
    }
    const verts = norm(vs);
    const deg = Object.fromEntries(verts.map((v) => [String(v), adj.get(key(v)).length]));
    const comp = [], seen = new Set();
    for (const v of verts) {
      if (seen.has(key(v))) continue;
      const stack = [v], cur = [];
      seen.add(key(v));
      while (stack.length) { const x = stack.pop(); cur.push(x); for (const y of adj.get(key(x))) if (!seen.has(key(y))) { seen.add(key(y)); stack.push(y); } }
      comp.push(norm(cur));
    }
    const n = verts.length, m = E.length;
    const simple = !loops && !multi;
    const acyclic = simple && m === n - comp.length;
    return { vertices: verts, edges: m, degrees: deg, degreeSum: Object.values(deg).reduce((a, b) => a + b, 0), components: comp, connected: comp.length === 1, simple, acyclic, tree: acyclic && comp.length === 1 };
  }
  return { parseSet, parseExpr, evalSet, toLogic, identical, fmt, eqSet, norm, parsePairs, relProps, funcKind, parseEdges, graphInfo, names: (s) => [...names(parseExpr(s))].sort(), DiscError };
});
