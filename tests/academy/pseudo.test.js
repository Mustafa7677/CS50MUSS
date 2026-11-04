// © 2026 Sagid Mustafa. All Rights Reserved.
// AO17 псевдокод интерпретаторының тесттері: node tests/academy/pseudo.test.js
// Бекітілген нәтижелер + JS пен тәуелсіз Python интерпретаторын (tools/academy/ppseudo.py) бірдей бағдарламаларда салыстыру.
const P = require("../../assets/js/academy-pseudo.js");
const { execFileSync } = require("child_process");
const path = require("path");
let pass = 0, fail = 0;
const ok = (c, m) => (c ? pass++ : (fail++, console.error("FAIL:", m)));
const PROGS = [
  ["s ← 0\nfor i ← 1 to n do\n  s ← s + i\nend\nreturn s", { n: 10 }],
  ["A ← [2, 5, 8, 12, 16, 23, 38]\nlo ← 0\nhi ← len(A) - 1\nsteps ← 0\nwhile lo ≤ hi do\n  steps ← steps + 1\n  mid ← (lo + hi) div 2\n  if A[mid] = x then\n    return mid\n  else\n    if A[mid] < x then\n      lo ← mid + 1\n    else\n      hi ← mid - 1\n    end\n  end\nend\nreturn -1", { x: 23 }],
  ["a ← 252\nb ← 105\nwhile b ≠ 0 do\n  t ← b\n  b ← a mod b\n  a ← t\nend\nprint a", {}],
  ["n ← 27\nc ← 0\nwhile n ≠ 1 do\n  if n mod 2 = 0 then\n    n ← n div 2\n  else\n    n ← 3 * n + 1\n  end\n  c ← c + 1\nend\nprint c", {}],
  ["A ← [5, 1, 4, 2, 8]\nfor i ← 0 to len(A) - 2 do\n  for j ← 0 to len(A) - 2 - i do\n    if A[j] > A[j + 1] then\n      t ← A[j]\n      A[j] ← A[j + 1]\n      A[j + 1] ← t\n    end\n  end\nend\nprint A[0]\nprint A[4]", {}],
  ["x ← -7 div 2\ny ← -7 mod 3\nz ← not 3 > 4 and true\nprint x\nprint y\nprint z", {}],
  ["c ← 0\nfor i ← 1 to n do\n  for j ← i to n do\n    c ← c + 1\n  end\nend\nreturn c", { n: 6 }],
];
const js = PROGS.map(([src, inp]) => { const r = P.run(src, inp); return { result: r.result === undefined ? null : r.result, output: r.output, counts: r.counts, steps: r.steps }; });
ok(js[0].result === 55 && js[0].counts[2] === 11 && js[0].counts[3] === 10, "қосынды және жол санағыштары (for: n+1)");
ok(js[1].result === 5, "екілік іздеу");
ok(js[2].output[0] === "21", "Евклид ЕҮОБ(252,105)=21");
ok(js[3].output[0] === "111", "Коллатц 27 → 111 қадам");
ok(js[4].output.join() === "1,8", "көпіршікті сұрыптау");
ok(js[5].output.join() === "-4,2,true", "div/mod теріс сандар, not басымдығы");
ok(js[6].result === 21, "n(n+1)/2 = 21");
const throwsLine = (src, inp) => { try { P.run(src, inp); return null; } catch (e) { return e instanceof P.PseudoError ? e.line : "bad"; } };
ok(throwsLine("x ← 1\nwhile true do\n  x ← x + 1\nend") === 2 || throwsLine("x ← 1\nwhile true do\n  x ← x + 1\nend") === 3, "шексіз цикл ұсталады");
ok(throwsLine("A ← [1, 2]\nprint A[2]") === 2, "индекс шекарасы");
ok(throwsLine("print y") === 1, "мәні жоқ айнымалы");
ok(throwsLine("if x > 1 then\n  x ← 2") !== null, "end жоқ");
ok(throwsLine("x ← (1 + 2") === 1, "жақша");
// Python интерпретаторымен салыстыру
const py = `import json,sys\nsys.path.insert(0,${JSON.stringify(path.resolve(__dirname, "../../tools/academy"))})\nimport ppseudo\nprogs=json.loads(sys.stdin.read())\nout=[]\nfor src,inp in progs:\n    r=ppseudo.run(src,inp)\n    out.append({'result':r['result'],'output':r['output'],'counts':{str(k):v for k,v in r['counts'].items()},'steps':r['steps']})\nprint(json.dumps(out))`;
const pyres = JSON.parse(execFileSync("python3", ["-I", "-c", py], { input: JSON.stringify(PROGS), encoding: "utf8" }));
PROGS.forEach((_, i) => {
  ok(JSON.stringify(pyres[i].result) === JSON.stringify(js[i].result), `#${i} нәтиже JS=Python`);
  ok(JSON.stringify(pyres[i].output) === JSON.stringify(js[i].output), `#${i} шығыс JS=Python`);
  ok(JSON.stringify(pyres[i].counts) === JSON.stringify(Object.fromEntries(Object.entries(js[i].counts).map(([k, v]) => [String(k), v]))), `#${i} жол санағыштары JS=Python`);
  ok(pyres[i].steps === js[i].steps, `#${i} қадам саны JS=Python`);
});
console.log(`academy pseudo: ${pass} өтті, ${fail} өтпеді`);
process.exit(fail ? 1 : 0);
