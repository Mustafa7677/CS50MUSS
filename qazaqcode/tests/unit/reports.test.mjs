import { test } from "node:test";
import assert from "node:assert/strict";
import { parseRange } from "../../src/lib/reports/range.ts";
import { safeText } from "../../src/lib/reports/sanitize.ts";
import { supportReasons, summarizeProgress } from "../../src/components/analytics/metrics.ts";

const TODAY = "2026-10-14";

test("күн аралығы: бос = барлық уақыт", () => {
  assert.deepEqual(parseRange(null, null, TODAY), { ok: true, range: null });
  assert.deepEqual(parseRange("", "", TODAY), { ok: true, range: null });
});
test("күн аралығы: дұрыс аралық, шекаралар", () => {
  assert.deepEqual(parseRange("2026-01-01", "2026-01-31", TODAY), { ok: true, range: { from: "2026-01-01", to: "2026-01-31" } });
  assert.deepEqual(parseRange("2026-10-14", "2026-10-14", TODAY), { ok: true, range: { from: "2026-10-14", to: "2026-10-14" } });
  assert.equal(parseRange("2026-01-01", "2026-12-31", TODAY).ok, true, "365 күн");
  assert.equal(parseRange("2024-01-01", "2024-12-31", TODAY).ok, true, "366 күн (жоғарғы жыл)");
  assert.equal(parseRange("2025-01-01", "2026-01-02", TODAY).ok, false, "367 күн");
});
test("күн аралығы: қате пішім, болмайтын күн, from > to", () => {
  for (const [f, t] of [["abc", null], ["2026-1-1", "2026-02-01"], ["2026-02-31", "2026-03-01"], ["2026-13-01", null], [null, "01.02.2026"], ["2026-03-01", "2026-02-01"]]) {
    assert.equal(parseRange(f, t, TODAY).ok, false, `${f} ${t}`);
  }
});
test("күн аралығы: біреуі ғана берілсе екіншісі толтырылады", () => {
  assert.deepEqual(parseRange("2026-10-01", null, TODAY), { ok: true, range: { from: "2026-10-01", to: TODAY } });
  const r = parseRange(null, "2026-10-14", TODAY);
  assert.equal(r.ok, true);
  assert.equal(r.range.from, "2025-10-14");
  assert.equal(parseRange("2025-01-01", null, TODAY).ok, false, "бір жылдан ұзақ");
  assert.equal(parseRange("2027-01-01", null, TODAY).ok, false, "болашақ from > бүгін");
});
test("формула инъекциясы: =,+,-,@ алдына ' қосылады", () => {
  for (const s of ["=1+1", "+cmd", "-2", "@SUM(A1)", "\tx", "\rx"]) assert.equal(safeText(s), "'" + s);
  for (const s of ["Айгерім", "9А", "", "a=b", "1+1"]) assert.equal(safeText(s), s);
});
test("қолдау керек оқушы: орташа % < 50 не орындау < 50%", () => {
  assert.deepEqual(supportReasons({ assigned: 4, submitted: 4, avg_pct: 80 }), []);
  assert.equal(supportReasons({ assigned: 4, submitted: 4, avg_pct: 49.9 }).length, 1);
  assert.equal(supportReasons({ assigned: 4, submitted: 1, avg_pct: null }).length, 1);
  assert.equal(supportReasons({ assigned: 4, submitted: 1, avg_pct: 30 }).length, 2);
  assert.deepEqual(supportReasons({ assigned: 4, submitted: 2, avg_pct: 50 }), [], "дәл 50% шекте қолдау керек емес");
  assert.deepEqual(supportReasons({ assigned: 0, submitted: 0, avg_pct: null }), [], "тапсырма жоқ - белгі жоқ");
});
test("оқушы прогресі: орташа %, орындалу, уақыт, соңғы белсенділік", () => {
  const s = summarizeProgress([
    { status: "graded", best_pct: 80, time_spent: 60, last_activity: "2026-10-01T10:00:00Z" },
    { status: "submitted", best_pct: null, time_spent: 30, last_activity: "2026-10-05T10:00:00Z" },
    { status: "not_started", best_pct: null, time_spent: 0, last_activity: null },
    { status: "overdue", best_pct: 40, time_spent: 10, last_activity: null },
  ]);
  assert.deepEqual({ ...s }, { total: 4, done: 2, completionPct: 50, avgPct: 60, seconds: 100, last: "2026-10-05T10:00:00Z" });
  assert.deepEqual({ ...summarizeProgress([]) }, { total: 0, done: 0, completionPct: null, avgPct: null, seconds: 0, last: null });
});
