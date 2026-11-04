// © 2026 Sagid Mustafa. All Rights Reserved.
// AO17 логика қозғалтқышының тесттері: node tests/academy/logic.test.js
// Бекітілген мысалдар + қасиетке негізделген тесттер (кездейсоқ өрнектер, белгілі заңдар).
const L = require("../../assets/js/academy-logic.js");
let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) pass++; else { fail++; console.error("FAIL:", msg); } }
function throwsMsg(f) { try { f(); return null; } catch (e) { return e.message; } }

// --- парсер және басымдық
const ev = (s, env) => L.evaluate(L.parse(s), env);
ok(ev("p ∨ q ∧ r", { p: true, q: false, r: false }) === true, "∧ басым ∨-дан");
ok(L.toStr(L.parse("p -> q -> r")) === "p → q → r", "→ оңнан ассоциативті (жазылуы)");
ok(ev("p -> q -> r", { p: false, q: true, r: false }) === true, "p→(q→r): p=0 болса ақиқат");
ok(ev("(p -> q) -> r", { p: false, q: true, r: false }) === false, "(p→q)→r");
ok(ev("¬p ∧ q", { p: false, q: true }) === true, "¬ ең басым");
ok(ev("p and not q", { p: true, q: false }) === true, "сөзбен жазу");
ok(ev("p және q", { p: true, q: true }) === true, "қазақша сөз");
ok(ev("p ⊕ q", { p: true, q: true }) === false, "xor");
ok(ev("p <-> q", { p: false, q: false }) === true, "<->");
ok(ev("1 ∧ p", { p: true }) && !ev("0 ∨ p", { p: false }), "тұрақтылар");
ok(/жақша/.test(throwsMsg(() => L.parse("(p ∧ q"))), "жақша жетіспейді хабары");
ok(/Артық/.test(throwsMsg(() => L.parse("p ∧ q)"))), "артық жақша хабары");
ok(/толық емес/.test(throwsMsg(() => L.parse("p ∧"))), "толық емес хабары");
ok(/амал жетіспейді/.test(throwsMsg(() => L.parse("p q"))), "амалсыз екі айнымалы");
ok(/Түсініксіз/.test(throwsMsg(() => L.parse("p # q"))), "түсініксіз таңба");

// --- кесте, жіктеу, қалыпты формалар, аргумент
const tt = L.truthTable("p → q");
ok(tt.rows.length === 4 && tt.rows.map((r) => r.value).join() === "true,true,false,true", "p→q кестесі 1,1,0,1 (00,01,10,11)");
ok(L.classify("p ∨ ¬p").kind === "tautology", "үшіншісі жоқ заңы - тавтология");
ok(L.classify("p ∧ ¬p").kind === "contradiction", "қайшылық");
ok(L.classify("p → q").kind === "contingent", "бейтарап");
ok(L.equivalent("p → q", "¬q → ¬p").equivalent, "контрапозиция");
const conv = L.equivalent("p → q", "q → p");
ok(!conv.equivalent && conv.counterexample, "кері тұжырым эквивалент емес, қарсы мысал бар");
ok(L.validArgument(["p → q", "p"], "q").valid, "modus ponens");
ok(L.validArgument(["p → q", "¬q"], "¬p").valid, "modus tollens");
ok(!L.validArgument(["p → q", "q"], "p").valid, "салдарды бекіту қатесі");
ok(!L.validArgument(["p → q", "¬p"], "¬q").valid, "алғышартты терістеу қатесі");
const nf = L.normalForms("p ⊕ q");
ok(L.equivalent(nf.dnf, "p ⊕ q").equivalent && L.equivalent(nf.cnf, "p ⊕ q").equivalent, "ДҚФ/КҚФ эквивалент");
ok(L.normalForms("p ∨ ¬p").cnf === "1" && L.normalForms("p ∧ ¬p").dnf === "0", "шеткі қалыпты формалар");

// --- қасиеттер: кездейсоқ өрнектер (детерминистік генератор)
let seed = 20261104;
const rnd = (n) => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed % n; };
const VARS = ["p", "q", "r", "s"];
const BINS = ["∧", "∨", "→", "↔", "⊕"];
function gen(d) {
  if (d === 0 || rnd(4) === 0) return VARS[rnd(4)];
  if (rnd(5) === 0) return "¬" + gen(d - 1);
  return "(" + gen(d - 1) + " " + BINS[rnd(5)] + " " + gen(d - 1) + ")";
}
for (let i = 0; i < 300; i++) {
  const a = gen(4), b = gen(4);
  const A = L.parse(a);
  ok(L.equivalent(L.toStr(A), a).equivalent, "toStr -> parse мағынаны сақтайды: " + a);
  ok(L.equivalent(`¬(${a} ∧ ${b})`, `¬(${a}) ∨ ¬(${b})`).equivalent, "Де Морган 1: " + a);
  ok(L.equivalent(`¬(${a} ∨ ${b})`, `¬(${a}) ∧ ¬(${b})`).equivalent, "Де Морган 2");
  ok(L.equivalent(`¬¬(${a})`, a).equivalent, "қос терістеу");
  ok(L.equivalent(`(${a}) → (${b})`, `¬(${a}) ∨ (${b})`).equivalent, "импликацияны жою");
  const nfs = L.normalForms(a);
  ok(L.equivalent(nfs.dnf, a).equivalent && L.equivalent(nfs.cnf, a).equivalent, "қалыпты форма эквивалент: " + a);
  const c = L.classify(a);
  ok((c.kind === "tautology") === L.equivalent(a, "1").equivalent, "тавтология ⇔ 1-ге эквивалент");
  ok(L.validArgument([a], b).valid === (L.classify(`(${a}) → (${b})`).kind === "tautology"), "дедукция теоремасы (бір алғышарт)");
}
console.log(`academy logic: ${pass} өтті, ${fail} өтпеді`);
process.exit(fail ? 1 : 0);
