// © 2026 Sagid Mustafa. All Rights Reserved.
// AO17: тапсырма кілттерін екі тәуелсіз іске асырумен салыстыру (Python plogic ⇄ JS academy-logic).
// node tests/academy/keys.test.js
const { execFileSync } = require("child_process");
const path = require("path");
const L = require("../../assets/js/academy-logic.js");
global.window = { AOLogic: L };
const root = path.resolve(__dirname, "../..");
const items = JSON.parse(execFileSync("python3", [path.join(root, "tools/academy_build.py"), "--dump-keys"], { encoding: "utf8" }));
// academy.js-тегі checkFormula-ны браузерсіз жүктеу: DOM керек емес бөлігі
const vm = require("vm");
const fs = require("fs");
const ctx = { window: { AOLogic: L, AOArith: require("../../assets/js/academy-arith.js"), AODisc: require("../../assets/js/academy-disc.js"), AOPseudo: require("../../assets/js/academy-pseudo.js") }, document: { readyState: "complete", querySelector: () => null, querySelectorAll: () => [], addEventListener() {}, dispatchEvent() {} }, CustomEvent: function () {}, localStorage: { getItem: () => null, setItem() {} }, console };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, "assets/js/academy.js"), "utf8"), ctx);
const A = ctx.window.AOAcademy;
let pass = 0, fail = 0;
const ok = (c, m) => (c ? pass++ : (fail++, console.error("FAIL:", m)));
for (const it of items) {
  const ex = it.ex, where = `${it.lesson} ${it.set}[${it.i}]`;
  switch (ex.type) {
    case "value": ok(L.evaluate(L.parse(ex.formula), ex.env) === it.key, where + " value"); break;
    case "truthtable": ok(JSON.stringify(L.truthTable(ex.formula).rows.map((r) => r.value)) === JSON.stringify(it.key), where + " table"); break;
    case "classify": ok(L.classify(ex.formula).kind === it.key, where + " classify"); break;
    case "argument": ok(L.validArgument(ex.premises, ex.conclusion).valid === it.key, where + " argument"); break;
    case "formula":
      ok(A.checkFormula(ex, it.key).ok, where + " эталон шешімді JS тексерушісі қабылдауы керек: " + A.checkFormula(ex, it.key).msg);
      ok(!A.checkFormula(ex, "p ∧ ¬p ∧ q ∧ ¬q ∧ a ∧ ¬a").ok || ex.target === "0", where + " қайшылықты қабылдамауы керек");
      if (ex.allowed || ex.noNegatedGroups || ex.maxLength || ex.nandOnly) ok(!A.checkFormula(ex, ex.target).ok, where + " мақсаттың өзі шектеуден өтпеуі керек");
      break;
    case "counterexample": {
      const AR = require("../../assets/js/academy-arith.js");
      ok(JSON.stringify(AR.searchCounterexamples(ex)) === JSON.stringify(it.key), where + " қарсы мысалдар тізімі Python-мен бірдей");
      break;
    }
    case "closedform": { const AR = require("../../assets/js/academy-arith.js"); ok(AR.checkClosedForm(ex.term, it.key, ex.start, 30).ok, where + " closedform эталоны"); break; }
    case "recurrence": { const AR = require("../../assets/js/academy-arith.js"); ok(AR.checkRecurrence(ex, it.key, 30).ok, where + " recurrence эталоны"); break; }
    case "setexpr": { const DS = require("../../assets/js/academy-disc.js"); ok(DS.eqSet(DS.evalSet(ex.expr, ex.sets, ex.U), it.key), where + " setexpr Python-мен бірдей"); break; }
    case "setid": { const DS = require("../../assets/js/academy-disc.js"); ok(DS.identical(it.key, ex.target).identical, where + " setid эталоны"); ok(!DS.identical("A", ex.target).identical || ex.target === "A", where + " setid жалған жауапты қабылдамайды"); break; }
    case "props": { const DS = require("../../assets/js/academy-disc.js"); const P = DS.relProps(ex.S, DS.parsePairs(ex.R || "")); ok(["reflexive", "symmetric", "antisymmetric", "transitive"].every((k) => P[k] === it.key[k]), where + " props Python-мен бірдей"); break; }
    case "func": { const DS = require("../../assets/js/academy-disc.js"); ok(DS.funcKind(ex.X, ex.Y, DS.parsePairs(ex.pairs)).kind === it.key, where + " func Python-мен бірдей"); break; }
    case "trace": { const PS = require("../../assets/js/academy-pseudo.js"); const r = PS.run(ex.code, ex.inputs || {}); const f = (v) => (v === true ? "true" : v === false ? "false" : Array.isArray(v) ? "[" + v.map(f).join(", ") + "]" : String(v));
      const k = ex.ask === "result" ? f(r.result) : ex.ask === "output" ? r.output.join("\n") : f(r.env[ex.ask]); ok(k === it.key, where + " trace JS=Python: " + k + " / " + it.key); break; }
    case "count": { const PS = require("../../assets/js/academy-pseudo.js"); ok((PS.run(ex.code, ex.inputs || {}).counts[ex.line] || 0) === it.key, where + " count JS=Python"); break; }
    case "convert": case "encode": case "bitop": { const BI = require("../../assets/js/academy-bits.js"); const k = ex.type === "convert" ? BI.convert(ex.value, ex.from, ex.to) : ex.type === "bitop" ? String(BI.bitExpr(ex.expr, ex.width)) : ex.kind === "twos" ? BI.twos(ex.input, ex.bits) : ex.kind === "utf8" ? BI.utf8Hex(ex.input) : ex.kind === "parity" ? BI.parity(ex.input) : ex.kind === "float32" ? BI.float32(ex.input).bits : BI.rle(ex.input);
      ok(k === it.key, where + " bits JS=" + k + " Python=" + it.key); break; }
    default: pass++;
  }
}
// тексерушінің хабарлары
const imp = { type: "formula", target: "p → q", allowed: ["not", "or", "and"] };
ok(/қолдануға болмайды/.test(A.checkFormula(imp, "p → q").msg), "рұқсатсыз амал хабары");
ok(/Қарсы мысал/.test(A.checkFormula(imp, "p ∨ q").msg), "қарсы мысал хабары");
ok(/жақша/.test(A.checkFormula(imp, "(p ∨ q").msg), "синтаксис қатесі хабары");
console.log(`academy keys: ${pass} өтті, ${fail} өтпеді (${items.length} тапсырма)`);
process.exit(fail ? 1 : 0);
