// © 2026 Sagid Mustafa. All Rights Reserved.
// AO17 арифметика қозғалтқышының тесттері: node tests/academy/arith.test.js
const A = require("../../assets/js/academy-arith.js");
let pass = 0, fail = 0;
const ok = (c, m) => (c ? pass++ : (fail++, console.error("FAIL:", m)));
const v = (s, n) => A.str(A.val(s, n));
ok(v("2n+1", 3) === "7", "жасырын көбейту 2n");
ok(v("n(n+1)/2", 4) === "10", "n(n+1)/2");
ok(v("n/2*(n+1)", 3) === "6", "рационал аралық мән");
ok(v("1/3 + 1/6", 0) === "1/2", "дәл бөлшек");
ok(v("-n^2", 3) === "-9", "-n^2 = -(n^2)");
ok(v("2^n", 62) === "4611686018427387904", "BigInt");
ok(v("2^3^2", 0) === "512", "^ оңнан");
ok(v("(-7) % 3", 0) === "2", "% теріс емес қалдық");
ok(v("n²+n+41", 40) === "1681", "² белгісі");
const throws = (s) => { try { A.val(s, 1); return false; } catch (e) { return e instanceof A.ArithError; } };
ok(throws("1/(n-1)") && throws("2^(1/2)") && throws("n +") && throws("(n") && throws("x+1"), "қате хабарлары");
// Эйлер көпмүшесі: 0..39 жай, 40-та құрама
const eu = { expr: "n^2 + n + 41", prop: "prime", domain: [0, 100] };
ok(A.searchCounterexamples(eu, 1)[0] === 40, "n²+n+41 бірінші қарсы мысалы 40");
ok(!A.isCounterexample(eu, 10).ok && A.isCounterexample(eu, 41).ok, "41 те қарсы мысал (41·43)");
ok(A.isCounterexample({ expr: "2^n - 1", prop: "prime", where: "prime", domain: [2, 40] }, 11).ok, "2^11-1 = 2047 = 23·89");
ok(!A.isCounterexample({ expr: "2^n - 1", prop: "prime", where: "prime", domain: [2, 40] }, 4).msg.includes("Тұжырым жоққа"), "where шарты");
// жабық формулалар: қасиет тесті - белгілі қосындылар
ok(A.checkClosedForm("2n-1", "n^2", 1).ok, "тақ сандар қосындысы");
ok(A.checkClosedForm("n", "n(n+1)/2", 1).ok, "Гаусс");
ok(A.checkClosedForm("n^2", "n(n+1)(2n+1)/6", 1).ok, "квадраттар");
ok(A.checkClosedForm("n^3", "(n(n+1)/2)^2", 1).ok, "кубтар");
ok(A.checkClosedForm("2^n", "2^(n+1)-2", 1).ok, "геометриялық");
ok(A.checkClosedForm("1/(n(n+1))", "n/(n+1)", 1).ok, "телескоптық (рационал)");
const bad = A.checkClosedForm("n", "n^2", 1);
ok(!bad.ok && bad.first.N === 2, "қате формула: бірінші сәйкессіздік N=2");
for (let n = 0; n < 200; n++) ok(A.isPrime(A.Q(BigInt(n))) === (n > 1 && [...Array(n).keys()].slice(2).every((d) => n % d)), "isPrime " + n);
console.log(`academy arith: ${pass} өтті, ${fail} өтпеді`);
process.exit(fail ? 1 : 0);
