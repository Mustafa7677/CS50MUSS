/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
// AO17 CS Universe: оқу псевдокодының интерпретаторы және трассалаушы (Code X-Ray-дің бірінші қадамы).
// Бұл - AO17 оқу тілі (нақты бағдарламалау тілі емес). Ол әр орындалған жолдан кейін айнымалылар күйін жазады.
// Синтаксис (бір жолда бір нұсқау, блок «end»-мен жабылады):
//   x ← 0            A[i] ← 5          print x          return x
//   if x > 0 then ... else ... end     while i < n do ... end     for i ← 1 to n do ... end
// Өрнектер: бүтін сандар, true/false, [1, 2, 3], A[i] (0-ден), len(A), + - * div mod, = ≠ < ≤ > ≥, and or not.
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.AOPseudo = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  class PseudoError extends Error { constructor(m, line) { super(line ? `${line}-жол: ${m}` : m); this.line = line; } }
  const MAX_STEPS = 20000;

  // ---------------------------------------------------------------- өрнектер
  function lexExpr(s, line) {
    const out = [];
    let i = 0;
    const two = { "<=": "≤", ">=": "≥", "!=": "≠", "==": "=", "<>": "≠" };
    while (i < s.length) {
      const c = s[i];
      if (/\s/.test(c)) { i++; continue; }
      if (two[s.substr(i, 2)]) { out.push({ t: "op", v: two[s.substr(i, 2)] }); i += 2; continue; }
      if ("+-*()[],=≠<>≤≥".includes(c)) { out.push({ t: c === "(" || c === ")" || c === "[" || c === "]" || c === "," ? c : "op", v: c }); i++; continue; }
      if (/\d/.test(c)) { let j = i; while (j < s.length && /\d/.test(s[j])) j++; out.push({ t: "num", v: Number(s.slice(i, j)) }); i = j; continue; }
      const m = /^[A-Za-z_][A-Za-z0-9_]*/.exec(s.slice(i));
      if (m) {
        const w = m[0];
        if (["div", "mod", "and", "or", "not"].includes(w)) out.push({ t: "op", v: w });
        else if (w === "true" || w === "false") out.push({ t: "num", v: w === "true" });
        else out.push({ t: "id", v: w });
        i += w.length; continue;
      }
      throw new PseudoError(`түсініксіз таңба «${c}»`, line);
    }
    out.push({ t: "end" });
    return out;
  }
  const PREC = { or: 1, and: 2, "=": 4, "≠": 4, "<": 4, ">": 4, "≤": 4, "≥": 4, "+": 5, "-": 5, "*": 6, div: 6, mod: 6 };
  function parseExpr(src, line) {
    const t = lexExpr(src, line);
    let k = 0;
    const peek = () => t[k];
    const expect = (ty) => { if (t[k].t !== ty) throw new PseudoError(`«${ty}» күтілген`, line); k++; };
    function primary() {
      const x = t[k++];
      if (x.t === "num") return { k: "lit", v: x.v };
      if (x.t === "(") { const e = expr(0); expect(")"); return e; }
      if (x.t === "[") { const items = []; if (peek().t !== "]") { items.push(expr(0)); while (peek().t === ",") { k++; items.push(expr(0)); } } expect("]"); return { k: "arr", items }; }
      if (x.t === "op" && x.v === "-") return { k: "neg", a: primary() };
      if (x.t === "op" && x.v === "not") return { k: "not", a: expr(3) };
      if (x.t === "id") {
        if (peek().t === "(") { k++; const args = []; if (peek().t !== ")") { args.push(expr(0)); while (peek().t === ",") { k++; args.push(expr(0)); } } expect(")"); return { k: "call", f: x.v, args }; }
        let node = { k: "var", v: x.v };
        while (peek().t === "[") { k++; const ix = expr(0); expect("]"); node = { k: "idx", a: node, i: ix }; }
        return node;
      }
      throw new PseudoError(x.t === "end" ? "өрнек толық емес" : `күтілмеген «${x.v ?? x.t}»`, line);
    }
    function expr(min) {
      let a = primary();
      for (;;) {
        const x = peek();
        if (x.t !== "op" || !(x.v in PREC) || PREC[x.v] < min) return a;
        k++;
        a = { k: "bin", op: x.v, a, b: expr(PREC[x.v] + 1) };
      }
    }
    const e = expr(0);
    if (peek().t !== "end") throw new PseudoError(`өрнектің соңы түсініксіз: «${peek().v ?? peek().t}»`, line);
    return e;
  }

  // ---------------------------------------------------------------- нұсқаулар
  function parse(src) {
    const lines = String(src).replace(/\r/g, "").split("\n");
    let i = 0;
    function block(stops) {
      const body = [];
      while (i < lines.length) {
        const no = i + 1;
        const raw = lines[i].replace(/(#|\/\/).*$/, "").trim();
        if (!raw) { i++; continue; }
        const word = raw.split(/\s+/)[0];
        if (stops.includes(word)) return { body, stop: word, line: no };
        i++;
        let m;
        if ((m = /^if\s+(.+?)\s+then$/.exec(raw))) {
          const cond = parseExpr(m[1], no);
          const yes = block(["else", "end"]);
          let no2 = [];
          if (yes.stop === "else") { i++; no2 = block(["end"]).body; }
          if (i >= lines.length) throw new PseudoError("if блогының «end»-і жоқ", no);
          i++;
          body.push({ k: "if", line: no, cond, yes: yes.body, no: no2 });
        } else if ((m = /^while\s+(.+?)\s+do$/.exec(raw))) {
          const cond = parseExpr(m[1], no);
          const b = block(["end"]);
          if (b.stop !== "end") throw new PseudoError("while блогының «end»-і жоқ", no);
          i++;
          body.push({ k: "while", line: no, cond, body: b.body });
        } else if ((m = /^for\s+([A-Za-z_]\w*)\s*(?:←|:=|<-)\s*(.+?)\s+to\s+(.+?)\s+do$/.exec(raw))) {
          const from = parseExpr(m[2], no), to = parseExpr(m[3], no);
          const b = block(["end"]);
          if (b.stop !== "end") throw new PseudoError("for блогының «end»-і жоқ", no);
          i++;
          body.push({ k: "for", line: no, v: m[1], from, to, body: b.body });
        } else if ((m = /^print\s+(.+)$/.exec(raw))) body.push({ k: "print", line: no, e: parseExpr(m[1], no) });
        else if ((m = /^return\s+(.+)$/.exec(raw))) body.push({ k: "return", line: no, e: parseExpr(m[1], no) });
        else if ((m = /^(.+?)\s*(?:←|:=|<-)\s*(.+)$/.exec(raw))) {
          const target = parseExpr(m[1], no);
          if (target.k !== "var" && target.k !== "idx") throw new PseudoError("меншіктеудің сол жағында айнымалы не A[i] болуы керек", no);
          body.push({ k: "set", line: no, target, e: parseExpr(m[2], no) });
        } else if (["else", "end"].includes(word)) throw new PseudoError(`артық «${word}»`, no);
        else throw new PseudoError(`түсініксіз нұсқау: «${raw}»`, no);
      }
      return { body, stop: null };
    }
    const prog = block([]);
    return prog.body;
  }

  // ---------------------------------------------------------------- орындау
  function run(src, inputs, opts) {
    const prog = typeof src === "string" ? parse(src) : src;
    const env = {};
    Object.entries(inputs || {}).forEach(([k, v]) => (env[k] = Array.isArray(v) ? v.slice() : v));
    const trace = [], output = [], counts = {};
    let steps = 0, result;
    const limit = (opts && opts.maxSteps) || MAX_STEPS;
    const snap = () => JSON.parse(JSON.stringify(env));
    const tick = (line) => {
      counts[line] = (counts[line] || 0) + 1;
      if (++steps > limit) throw new PseudoError(`${limit} қадамнан асты - шексіз цикл болуы мүмкін`, line);
    };
    const num = (v, line) => { if (typeof v !== "number") throw new PseudoError("сан күтілген", line); return v; };
    function ev(e, line) {
      switch (e.k) {
        case "lit": return e.v;
        case "arr": return e.items.map((x) => ev(x, line));
        case "var": if (!(e.v in env)) throw new PseudoError(`«${e.v}» айнымалысына мән берілмеген`, line); return env[e.v];
        case "idx": {
          const a = ev(e.a, line), i = num(ev(e.i, line), line);
          if (!Array.isArray(a)) throw new PseudoError("индекс тек массивке қолданылады", line);
          if (i < 0 || i >= a.length) throw new PseudoError(`индекс ${i} шекарадан тыс (ұзындығы ${a.length})`, line);
          return a[i];
        }
        case "call": {
          const args = e.args.map((x) => ev(x, line));
          if (e.f === "len") { if (!Array.isArray(args[0])) throw new PseudoError("len тек массивке", line); return args[0].length; }
          if (e.f === "abs") return Math.abs(num(args[0], line));
          if (e.f === "min") return Math.min(...args.map((x) => num(x, line)));
          if (e.f === "max") return Math.max(...args.map((x) => num(x, line)));
          throw new PseudoError(`белгісіз функция «${e.f}»`, line);
        }
        case "neg": return -num(ev(e.a, line), line);
        case "not": return !ev(e.a, line);
        case "bin": {
          if (e.op === "and") return !!ev(e.a, line) && !!ev(e.b, line);
          if (e.op === "or") return !!ev(e.a, line) || !!ev(e.b, line);
          const a = ev(e.a, line), b = ev(e.b, line);
          switch (e.op) {
            case "+": return num(a, line) + num(b, line);
            case "-": return num(a, line) - num(b, line);
            case "*": return num(a, line) * num(b, line);
            case "div": if (num(b, line) === 0) throw new PseudoError("нөлге бөлу", line); return Math.floor(a / b);
            case "mod": if (num(b, line) === 0) throw new PseudoError("нөлге бөлу", line); return ((a % b) + b) % b;
            case "=": return a === b;
            case "≠": return a !== b;
            case "<": return num(a, line) < num(b, line);
            case ">": return num(a, line) > num(b, line);
            case "≤": return num(a, line) <= num(b, line);
            case "≥": return num(a, line) >= num(b, line);
          }
        }
      }
      throw new PseudoError("белгісіз өрнек", line);
    }
    const RET = {};
    function exec(list) {
      for (const s of list) {
        tick(s.line);
        switch (s.k) {
          case "set": {
            const v = ev(s.e, s.line);
            if (s.target.k === "var") env[s.target.v] = Array.isArray(v) ? v.slice() : v;
            else {
              const a = ev(s.target.a, s.line), i = num(ev(s.target.i, s.line), s.line);
              if (!Array.isArray(a) || i < 0 || i >= a.length) throw new PseudoError(`A[${i}]: индекс шекарадан тыс`, s.line);
              a[i] = v;
            }
            trace.push({ line: s.line, env: snap() });
            break;
          }
          case "print": output.push(String(ev(s.e, s.line))); trace.push({ line: s.line, env: snap(), out: output[output.length - 1] }); break;
          case "return": result = ev(s.e, s.line); trace.push({ line: s.line, env: snap(), ret: result }); throw RET;
          case "if": { const c = !!ev(s.cond, s.line); trace.push({ line: s.line, env: snap(), cond: c }); exec(c ? s.yes : s.no); break; }
          case "while":
            for (;;) {
              const c = !!ev(s.cond, s.line);
              trace.push({ line: s.line, env: snap(), cond: c });
              if (!c) break;
              exec(s.body);
              tick(s.line);
            }
            break;
          case "for": {
            const a = num(ev(s.from, s.line), s.line), b = num(ev(s.to, s.line), s.line);
            for (let v = a; v <= b; v++) {
              env[s.v] = v;
              trace.push({ line: s.line, env: snap() });
              exec(s.body);
              tick(s.line);
            }
            break;
          }
        }
      }
    }
    try { exec(prog); } catch (e) { if (e !== RET) throw e; }
    return { env, trace, output, counts, steps, result };
  }
  return { parse, run, parseExpr, PseudoError, MAX_STEPS };
});
