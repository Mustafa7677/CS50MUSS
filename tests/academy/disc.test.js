// © 2026 Sagid Mustafa. All Rights Reserved.
// AO17 дискретті құрылымдар қозғалтқышының тесттері: node tests/academy/disc.test.js
const D = require("../../assets/js/academy-disc.js");
let pass = 0, fail = 0;
const ok = (c, m) => (c ? pass++ : (fail++, console.error("FAIL:", m)));
const U = [1, 2, 3, 4, 5, 6, 7, 8], S = { A: [1, 2, 3, 4], B: [3, 4, 5, 6], C: [2, 4, 6, 8] };
const ev = (e) => D.fmt(D.evalSet(e, S, U));
ok(ev("A ∪ B") === "{1, 2, 3, 4, 5, 6}" && ev("A ∩ B") === "{3, 4}" && ev("A \\ B") === "{1, 2}" && ev("A △ B") === "{1, 2, 5, 6}", "негізгі амалдар");
ok(ev("A'") === "{5, 6, 7, 8}" && ev("(A ∪ B)'") === "{7, 8}" && ev("∅ ∪ A ∩ ∅") === "∅", "толықтауыш, бос жиын");
ok(ev("A ∪ B ∩ C") === "{1, 2, 3, 4, 6}", "∩ басым ∪-дан");
ok(D.eqSet(D.parseSet("{3, 1, 2, 2}"), [1, 2, 3]) && D.parseSet("∅").length === 0 && D.fmt(D.parseSet("b, a")) === "{a, b}", "parseSet");
const th = (f) => { try { f(); return false; } catch (e) { return e instanceof D.DiscError; } };
ok(th(() => D.parseExpr("A ∪")) && th(() => D.parseExpr("(A ∪ B")) && th(() => D.parseExpr("A B")) && th(() => D.parseSet("{1, {2}}")), "қате хабарлары");
ok(D.identical("(A ∪ B)'", "A' ∩ B'").identical, "Де Морган (жиын)");
ok(D.identical("A \\ (B ∪ C)", "(A \\ B) ∩ (A \\ C)").identical, "айырма заңы");
ok(D.identical("A △ B", "(A \\ B) ∪ (B \\ A)").identical, "симметриялық айырма");
const nid = D.identical("A \\ B", "B \\ A");
ok(!nid.identical && /A/.test(nid.region), "айырма ауыстырымды емес + аймақ");
// қасиет: identical ⇔ барлық 8 аймақ-элементті универсумда тең (толық модель)
const R = [0, 1, 2, 3, 4, 5, 6, 7], M = { A: R.filter((r) => r & 4), B: R.filter((r) => r & 2), C: R.filter((r) => r & 1) };
let seed = 7;
const rnd = (n) => ((seed = (seed * 1103515245 + 12345) % 2147483648), seed % n);
const gen = (d) => (d === 0 || rnd(4) === 0 ? "ABC"[rnd(3)] : rnd(5) === 0 ? "(" + gen(d - 1) + ")'" : "(" + gen(d - 1) + " " + ["∪", "∩", "\\", "△"][rnd(4)] + " " + gen(d - 1) + ")");
for (let i = 0; i < 300; i++) {
  const a = gen(3), b = gen(3);
  ok(D.identical(a, b).identical === D.eqSet(D.evalSet(a, M, R), D.evalSet(b, M, R)), "тепе-теңдік ⇔ толық модель: " + a + " | " + b);
}
// қатынастар
const P = D.relProps([1, 2, 3], D.parsePairs("(1,1), (2,2), (3,3), (1,2), (2,1)"));
ok(P.reflexive && P.symmetric && P.transitive && P.equivalence && P.classes.length === 2, "эквиваленттік, 2 класс");
const le = [];
for (const a of [1, 2, 3]) for (const b of [1, 2, 3]) if (a <= b) le.push([a, b]);
const Q = D.relProps([1, 2, 3], le);
ok(Q.partialOrder && !Q.symmetric, "≤ - ішінара реттілік");
const T = D.relProps([1, 2, 3], D.parsePairs("(1,2), (2,3)"));
ok(!T.transitive && T.transWitness.join() === "1,2,3" && T.antisymmetric && !T.reflexive, "транзитивті емес, куә");
ok(th(() => D.parsePairs("(1,2) 3")), "жұп форматы");
// функциялар
ok(D.funcKind([1, 2, 3], ["a", "b", "c"], [[1, "a"], [2, "b"], [3, "c"]]).kind === "bijective", "биекция");
ok(D.funcKind([1, 2, 3], ["a", "b"], [[1, "a"], [2, "b"], [3, "a"]]).kind === "surjective", "сюръекция");
ok(D.funcKind([1, 2], ["a", "b", "c"], [[1, "a"], [2, "b"]]).kind === "injective", "инъекция");
ok(D.funcKind([1, 2], ["a", "b"], [[1, "a"], [1, "b"], [2, "a"]]).kind === "notfunction", "функция емес");
ok(D.funcKind([1, 2, 3], ["a", "b", "c"], [[1, "a"], [2, "a"], [3, "b"]]).kind === "neither", "екеуі де емес");
// графтар
const g = D.graphInfo([], D.parseEdges("1-2, 2-3, 3-1, 4-5"));
ok(g.edges === 4 && g.degreeSum === 8 && g.components.length === 2 && !g.tree && !g.acyclic, "граф: дәрежелер қосындысы = 2|E|");
const t = D.graphInfo([], D.parseEdges("1-2, 1-3, 3-4, 3-5"));
ok(t.tree && t.connected && t.edges === t.vertices.length - 1, "ағаш");
ok(D.graphInfo([1, 2, 3], []).components.length === 3, "оқшау төбелер");
console.log(`academy disc: ${pass} өтті, ${fail} өтпеді`);
process.exit(fail ? 1 : 0);
