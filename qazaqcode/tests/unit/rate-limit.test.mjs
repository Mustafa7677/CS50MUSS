import { test } from "node:test";
import assert from "node:assert/strict";
import { consume, sweep } from "../../src/lib/rate-limit-core.ts";

test("шектеуіш: лимиттен кейін бұғаттайды, терезе өткен соң қайта ашады", () => {
  const b = new Map();
  for (let i = 0; i < 3; i++) assert.equal(consume(b, "login:ip:a", 3, 1000, 0), true);
  assert.equal(consume(b, "login:ip:a", 3, 1000, 10), false);
  assert.equal(consume(b, "login:ip:b", 3, 1000, 10), true, "басқа кілт тәуелсіз");
  assert.equal(consume(b, "login:ip:a", 3, 1000, 1500), true, "терезе өткен соң қайта ашылады");
});
test("sweep: мерзімі өткен жазбаларды тазалайды", () => {
  const b = new Map();
  for (let i = 0; i < 10; i++) consume(b, `k${i}`, 1, 100, 0);
  sweep(b, 1000, 5);
  assert.equal(b.size, 0);
});
