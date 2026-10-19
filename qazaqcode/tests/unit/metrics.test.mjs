import { test } from "node:test";
import assert from "node:assert/strict";
import { HEALTH_WEIGHTS, bandOf, healthComponents, healthScore, fmtShare, retentionShare, recommendations, SMALL_N } from "../../src/lib/metrics/health.ts";

const base = { students: 5, activeStudents: 4, expected: 10, completed: 5, completedWithDeadline: 3, onTime: 2, maxStudents: 500 };

test("салмақтар қосындысы 100", () => {
  assert.equal(Object.values(HEALTH_WEIGHTS).reduce((a, b) => a + b, 0), 100);
});

test("health score: db/tests/metrics.test.mjs-тегі белгілі мысал SQL-мен бірдей (53)", () => {
  const r = healthScore(base);
  assert.equal(r.components.active_share, 0.8);
  assert.equal(r.components.completion, 0.5);
  assert.ok(Math.abs(r.components.timeliness - 2 / 3) < 1e-12);
  assert.ok(Math.abs(r.components.seats - 0.02) < 1e-12);
  assert.equal(r.score, 53);   // (35*0.8 + 30*0.5 + 15*(2/3) + 20*0.02) = 53.4
  assert.equal(r.band, "watch");
  assert.equal(r.smallN, true);
});

test("health score: барлығы тамаша = 100; барлығы нөл (белсенді оқушы 0, бірақ оқушы бар) = 0 -> қауіп", () => {
  const best = healthScore({ students: 20, activeStudents: 20, expected: 40, completed: 40, completedWithDeadline: 40, onTime: 40, maxStudents: 30 });
  assert.equal(best.score, 100); assert.equal(best.band, "good"); assert.equal(best.smallN, false);
  const worst = healthScore({ students: 20, activeStudents: 0, expected: 40, completed: 0, completedWithDeadline: 0, onTime: 0, maxStudents: 5000 });
  assert.equal(worst.components.seats, 20 / 5000 / 0.5);
  assert.equal(worst.score, Math.round((100 * (20 * (20 / 5000 / 0.5))) / 85));   // активті 0, орындау 0, уақтылылық жоқ: салмақ 35+30+20
  assert.equal(worst.band, "risk");
});

test("есептелмейтін құрамдас салмағы алынып тасталады (қайта нормалау), жалған 0 жоқ", () => {
  // тек белсенді үлес: 80%
  const only = healthScore({ students: 10, activeStudents: 8, expected: 0, completed: 0, completedWithDeadline: 0, onTime: 0, maxStudents: null });
  assert.equal(only.score, 80);
  assert.equal(only.components.completion, null); assert.equal(only.components.timeliness, null); assert.equal(only.components.seats, null);
  // белсенді + орындау: (35*1 + 30*0) / 65 = 53.8 -> 54
  assert.equal(healthScore({ students: 10, activeStudents: 10, expected: 10, completed: 0, completedWithDeadline: 0, onTime: 0, maxStudents: 0 }).score, 54);
});

test("оқушы жоқ -> ұпай жоқ, no_data", () => {
  const r = healthScore({ students: 0, activeStudents: 0, expected: 0, completed: 0, completedWithDeadline: 0, onTime: 0, maxStudents: 100 });
  assert.equal(r.score, null); assert.equal(r.band, "no_data");
  assert.equal(r.components.active_share, null);
});

test("лимит қолдану: 50% толтыру = 1 (жоғарыдан қиылады); max_students 0/null -> есептелмейді", () => {
  assert.equal(healthComponents({ ...base, students: 250, maxStudents: 500 }).seats, 1);
  assert.equal(healthComponents({ ...base, students: 400, maxStudents: 500 }).seats, 1);
  assert.equal(healthComponents({ ...base, maxStudents: 0 }).seats, null);
  assert.equal(healthComponents({ ...base, maxStudents: null }).seats, null);
});

test("жолақ шекаралары: 70 жақсы, 69 бақылау, 40 бақылау, 39 қауіп", () => {
  assert.equal(bandOf(70), "good"); assert.equal(bandOf(69), "watch");
  assert.equal(bandOf(40), "watch"); assert.equal(bandOf(39), "risk");
  assert.equal(bandOf(0), "risk"); assert.equal(bandOf(null), "no_data");
});

test("шағын n шегі", () => {
  assert.equal(healthScore({ ...base, students: SMALL_N - 1, activeStudents: 1 }).smallN, true);
  assert.equal(healthScore({ ...base, students: SMALL_N, activeStudents: 1 }).smallN, false);
});

test("fmtShare / retentionShare", () => {
  assert.equal(fmtShare(0.534), "53%"); assert.equal(fmtShare(null), "-"); assert.equal(fmtShare(undefined), "-"); assert.equal(fmtShare(1), "100%");
  assert.equal(retentionShare(1, 4), 0.25); assert.equal(retentionShare(0, 4), 0);
  assert.equal(retentionShare(null, 4), null, "болашақ апта"); assert.equal(retentionShare(3, 0), null, "бос когорт");
});

const pilot = (o = {}) => ({ ...base, hasActivity: true, hardAssignments: [], lowCompletion: [], studentsBelow50: 0, gradedStudents: 0, ...o });

test("ұсыныстар: белсенділік жоқ болса тек бір түсіндірме (ойдан шығарылған кеңес жоқ)", () => {
  const r = recommendations(pilot({ hasActivity: false }));
  assert.equal(r.length, 1); assert.match(r[0], /дерек жоқ/);
});

test("ұсыныстар: сандардан шығады, аттар жоқ, тапсырма атауы мен сандар сәйкес", () => {
  const r = recommendations(pilot({
    students: 40, activeStudents: 10, expected: 100, completed: 30, completedWithDeadline: 30, onTime: 12, maxStudents: 1000,
    hardAssignments: [{ title: "Циклдер", avg_pct: 41.5, n: 12 }], lowCompletion: [{ title: "SQL-1", expected: 40, completed: 9 }], studentsBelow50: 6, gradedStudents: 25,
  })).join("\n");
  assert.match(r, /25%/);                       // белсенді үлес 10/40
  assert.match(r, /30%/);                       // орындау 30/100
  assert.match(r, /40%/);                       // уақтылылық 12/30
  assert.match(r, /«Циклдер».*41\.5%.*12 оқушы/);
  assert.match(r, /«SQL-1».*9\/40/);
  assert.match(r, /6 оқушының орташа нәтижесі 50%-дан төмен/);
  assert.match(r, /Лицензиядағы/);
});

test("ұсыныстар: сау ұйымға қауіп белгісі жоқ деген бір жол; шағын n ескертеді", () => {
  const ok = recommendations(pilot({ students: 30, activeStudents: 27, expected: 60, completed: 55, completedWithDeadline: 55, onTime: 50, maxStudents: 60 }));
  assert.equal(ok.length, 1); assert.match(ok[0], /қауіп белгілері табылмады/);
  assert.match(recommendations(pilot({ students: 4, activeStudents: 4 }))[0], /Оқушы саны аз/);
});
