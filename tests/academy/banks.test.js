// © 2026 Sagid Mustafa. All Rights Reserved.
// AO17 мазмұн фабрикасы: Digital SAT сұрақ банктерінің тексерісі (assets/data/sat-bank*.js).
// Жарияланатын әр сұрақ: бірегей id, ресми домен, дағды, қиындық, 4 нұсқа + дұрыс жауап + ӘР нұсқаның түсіндірмесі,
// не grid-жауап (бөлшек) + түсіндірме; бір банкте қайталанатын мәтін жоқ; модуль өлшемдері құрылымға сай.
// node --test tests/academy/banks.test.js
const test = require("node:test");
const assert = require("node:assert");
const vm = require("vm");
const fs = require("fs");
const path = require("path");
const DATA = path.join(__dirname, "../../assets/data");
const DOMAINS = {
  rw: ["Craft and Structure", "Information and Ideas", "Standard English Conventions", "Expression of Ideas"],
  math: ["Algebra", "Advanced Math", "Problem-Solving and Data Analysis", "Geometry and Trigonometry"],
};
// ресми модуль өлшемі (толық нұсқа); қысқа нұсқада тек «бос емес» талап етіледі
const FULL = { rw: 27, math: 22 };

const ctx = { window: {} };
vm.createContext(ctx);
const files = fs.readdirSync(DATA).filter((f) => /^sat-bank.*\.js$/.test(f)).sort();
for (const f of files) vm.runInContext(fs.readFileSync(path.join(DATA, f), "utf8"), ctx, { filename: f });
const banks = [["SAT_BANK (қысқа)", ctx.window.SAT_BANK, false], ["SAT_BANK_FULL (толық)", ctx.window.SAT_BANK_FULL, true]].filter((b) => b[1]);

test("банк файлдары жүктеледі", () => {
  assert.ok(files.includes("sat-bank.js"), "sat-bank.js жоқ");
  assert.ok(banks.length >= 1);
});

const allIds = new Set(), allText = new Map();
for (const [name, B, full] of banks) {
  for (const sec of Object.keys(B)) {
    test(`${name}: ${sec} бөлімі`, () => {
      assert.ok(DOMAINS[sec], `белгісіз бөлім ${sec}`);
      for (const pool of ["m1", "hard", "easy"]) {
        const items = B[sec][pool];
        assert.ok(Array.isArray(items) && items.length > 0, `${sec}.${pool} бос`);
        if (full) assert.strictEqual(items.length, FULL[sec], `${sec}.${pool}: ресми ${FULL[sec]} сұрақ керек`);
        for (const q of items) {
          const at = `${name} ${sec}.${pool} ${q.id}`;
          assert.ok(q.id && !allIds.has(q.id), `${at}: id бос не қайталанады`);
          allIds.add(q.id);
          assert.ok(DOMAINS[sec].includes(q.domain), `${at}: домен ${q.domain}`);
          assert.ok(q.skill && typeof q.skill === "string", `${at}: дағды жоқ`);
          assert.ok(["easy", "medium", "hard"].includes(q.diff), `${at}: diff`);
          assert.ok(q.stem && q.stem.length > 10, `${at}: сұрақ мәтіні`);
          if (q.grid) {
            const [n, d] = q.grid.value;
            assert.ok(Number.isInteger(n) && Number.isInteger(d) && d !== 0, `${at}: grid мәні бөлшек болуы керек`);
            assert.ok(Array.isArray(q.grid.accept), `${at}: grid.accept`);
            assert.ok(q.explain && q.explain.length > 20, `${at}: grid түсіндірмесі`);
            assert.strictEqual(sec, "math", `${at}: grid тек Math-та`);
          } else {
            assert.ok(Array.isArray(q.choices) && q.choices.length === 4, `${at}: 4 нұсқа керек`);
            assert.ok(Number.isInteger(q.ans) && q.ans >= 0 && q.ans < 4, `${at}: ans`);
            assert.ok(Array.isArray(q.why) && q.why.length === 4 && q.why.every((w) => w && w.length > 10), `${at}: әр нұсқаның түсіндірмесі керек`);
            assert.strictEqual(new Set(q.choices).size, 4, `${at}: нұсқалар қайталанады`);
          }
          const key = (Array.isArray(q.passage) ? q.passage.join(" ") : q.passage || "") + "|" + q.stem + "|" + (q.choices || []).join("|");
          assert.ok(!allText.has(key), `${at}: ${allText.get(key)} сұрағымен бірдей`);
          allText.set(key, q.id);
        }
      }
      if (full) {
        // толық нұсқада әр модульде бөлімнің төрт доменінің бәрі болуы керек
        for (const pool of ["m1", "hard", "easy"]) {
          const ds = new Set(B[sec][pool].map((q) => q.domain));
          assert.strictEqual(ds.size, 4, `${sec}.${pool}: төрт домен де болуы керек`);
        }
      }
    });
  }
}
