// © 2026 Sagid Mustafa. All Rights Reserved.
// AO17 Smart Tutor (assets/js/ao-tutor.js): меңгеру ережесі, қайталау кестесі, қателер дәптері, экспорт/импорт.
// node --test tests/academy/tutor.test.js
const test = require("node:test");
const assert = require("node:assert");
const vm = require("vm");
const fs = require("fs");
const path = require("path");
const SRC = fs.readFileSync(path.join(__dirname, "../../assets/js/ao-tutor.js"), "utf8");
const DAY = 86400000;

function fresh(now = 1_000_000_000_000) {
  const store = {};
  const ctx = { window: {}, localStorage: { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); } }, Date: { now: () => ctx._now }, _now: now, JSON, Math, Object, Set, Error };
  vm.createContext(ctx);
  vm.runInContext(SRC, ctx);
  return { T: ctx.window.AO17Tutor, ctx, store };
}

test("жаңа дағды - «жаңа»; көмексіз 3 дұрыс + дәлдік ≥ 80% - «меңгерілді»", () => {
  const { T } = fresh();
  assert.strictEqual(T.mastery("s").level, "жаңа");
  T.record("s", { ok: true });
  T.record("s", { ok: true });
  assert.strictEqual(T.mastery("s").level, "үйренуде");
  T.record("s", { ok: true });
  assert.strictEqual(T.mastery("s").level, "меңгерілді");
});

test("көмекпен шешілген есеп меңгеруге саналмайды", () => {
  const { T } = fresh();
  T.record("s", { ok: true }); T.record("s", { ok: true }); T.record("s", { ok: true, hints: 3 });
  assert.strictEqual(T.mastery("s").level, "үйренуде");
  T.record("s", { ok: true });
  assert.strictEqual(T.mastery("s").level, "үйренуде", "соңғы үшеуінің бірі көмекпен");
});

test("дәлдік 80%-дан төмен болса, соңғы үш дұрыс та жеткіліксіз", () => {
  const { T } = fresh();
  for (let i = 0; i < 4; i++) T.record("s", { ok: false, error: "x" });
  for (let i = 0; i < 3; i++) T.record("s", { ok: true });
  assert.strictEqual(T.mastery("s").level, "үйренуде"); // 3/7 = 43%
});

test("қате - дәптерге түседі (себебімен); дұрысы түспейді", () => {
  const { T } = fresh();
  T.record("sat.q", { item: "v1", ok: false, error: "sign-h", note: "h таңбасы" });
  T.record("sat.q", { item: "v2", ok: true });
  const nb = T.notebook();
  assert.strictEqual(nb.length, 1);
  assert.strictEqual(nb[0].error, "sign-h");
  assert.strictEqual(nb[0].note, "h таңбасы");
});

test("Лейтнер: көмексіз дұрыс - аралық өседі (1, 2, 4 күн); қате - 1 күнге қайтады", () => {
  const { T, ctx } = fresh();
  const t0 = ctx._now;
  const due = () => Object.values(JSON.parse(ctxStore()).review)[0].due - ctx._now;
  let raw;
  const ctxStore = () => raw;
  const orig = ctx.localStorage.setItem; ctx.localStorage.setItem = (k, v) => { raw = v; orig(k, v); };
  T.record("s", { item: "a", ok: true }); assert.strictEqual(due(), 1 * DAY);
  ctx._now = t0 + DAY; T.record("s", { item: "a", ok: true }); assert.strictEqual(due(), 2 * DAY);
  ctx._now = t0 + 3 * DAY; T.record("s", { item: "a", ok: true }); assert.strictEqual(due(), 4 * DAY);
  ctx._now = t0 + 7 * DAY; T.record("s", { item: "a", ok: false, error: "e" }); assert.strictEqual(due(), 1 * DAY);
  assert.strictEqual(T.due(ctx._now).length, 0);
  assert.strictEqual(T.due(ctx._now + DAY).length, 1);
});

test("экспорт → импорт деректі сақтайды; бөтен файл қабылданбайды", () => {
  const a = fresh();
  a.T.record("ielts.tfng", { ok: false, error: "ng-as-false" });
  const json = a.T.exportJSON();
  const b = fresh();
  b.T.importJSON(json);
  assert.strictEqual(b.T.notebook()[0].error, "ng-as-false");
  assert.throws(() => b.T.importJSON('{"hello":1}'));
  b.T.clear();
  assert.strictEqual(b.T.skills().length, 0);
});
