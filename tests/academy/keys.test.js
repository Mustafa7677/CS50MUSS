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
const ctx = { window: { AOLogic: L }, document: { readyState: "complete", querySelector: () => null, querySelectorAll: () => [], addEventListener() {}, dispatchEvent() {} }, CustomEvent: function () {}, localStorage: { getItem: () => null, setItem() {} }, console };
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
