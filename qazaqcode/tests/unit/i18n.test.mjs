import { test } from "node:test";
import assert from "node:assert/strict";
import { LOCALES, isLocale, toLocale, pluralCategory, interpolate, makeT, localeFromAcceptLanguage, placeholders } from "../../src/lib/i18n/core.ts";
import { fmtDate, fmtDuration, fmtNum, fmtPct } from "../../src/lib/i18n/format.ts";
import { scanKeys, loadRu } from "../../scripts/i18n-sync.mjs";
import fs from "node:fs";

const KK_ONLY = /[әғқңөұүһіӘҒҚҢӨҰҮҺІ]/;
const keys = scanKeys();
const ru = await loadRu();

test("кілт-паритет: бастапқы кодтағы әр кілттің ru аудармасы бар, артық кілт жоқ", () => {
  const missing = [...keys.keys()].filter((k) => !ru[k]);
  const extra = Object.keys(ru).filter((k) => !keys.has(k));
  assert.deepEqual(missing.slice(0, 10), [], `ru-да жоқ: ${missing.length}`);
  assert.deepEqual(extra.slice(0, 10), [], `ru-да артық: ${extra.length}`);
});

test("kk.ts бастапқы кодтан жасалған (ескірмеген), кілт = мән", async () => {
  const src = fs.readFileSync("src/lib/i18n/kk.ts", "utf8");
  for (const k of keys.keys()) assert.ok(src.includes(`${JSON.stringify(k)}: ${JSON.stringify(k)},`), `kk.ts-те жоқ: ${k}`);
  assert.equal((src.match(/^  "/gm) ?? []).length, keys.size, "kk.ts-те артық кілт бар: node scripts/i18n-sync.mjs");
});

test("ru аудармалары бос емес, қазақша жолмен бірдей емес, қазақ-тек әріптері жоқ", () => {
  const bad = [];
  for (const [k, v] of Object.entries(ru)) {
    if (!v.trim()) bad.push(`бос: ${k}`);
    else if (v === k && KK_ONLY.test(k)) bad.push(`аударылмаған: ${k}`);
    else if (KK_ONLY.test(v)) bad.push(`қазақша әріп: ${v}`);
  }
  assert.deepEqual(bad.slice(0, 10), [], `${bad.length} мәселе`);
});

test("плейсхолдерлер kk және ru-да бірдей", () => {
  const bad = [];
  for (const [k, v] of Object.entries(ru)) {
    const a = placeholders(k).join(","), b = placeholders(v).join(",");
    if (a !== b) bad.push(`${k} -> {${a}} != {${b}}`);
  }
  assert.deepEqual(bad.slice(0, 10), []);
});

test("ru көптік формалары: 1 / 2-4 / 5+ (11-14 ерекше)", () => {
  const cat = (n) => pluralCategory("ru", n);
  for (const n of [1, 21, 101, 1001]) assert.equal(cat(n), "one", String(n));
  for (const n of [2, 3, 4, 22, 23, 24, 102]) assert.equal(cat(n), "few", String(n));
  for (const n of [0, 5, 9, 10, 11, 12, 13, 14, 15, 19, 20, 25, 100, 111, 112, 114]) assert.equal(cat(n), "many", String(n));
  assert.equal(cat(1.5), "other");
  for (const n of [0, 1, 2, 5, 21]) assert.equal(pluralCategory("kk", n), "other", "kk-да көптік жоқ");
});

test("t(): kk кілтті өзгертпей қайтарады, ru аударады, жоқ кілт -> kk, параметрлер мен plural", () => {
  const dict = { "Сәлем": "Привет", "{n} оқушы": "{n, plural, one {# ученик} few {# ученика} many {# учеников}}", "Сәлем, {name}!": "Здравствуйте, {name}!" };
  const tk = makeT("kk", dict), tr = makeT("ru", dict);
  assert.equal(tk("Сәлем"), "Сәлем");
  assert.equal(tr("Сәлем"), "Привет");
  assert.equal(tr("Жоқ кілт"), "Жоқ кілт", "fallback kk");
  assert.equal(tk("Сәлем, {name}!", { name: "Аян" }), "Сәлем, Аян!");
  assert.equal(tr("Сәлем, {name}!", { name: "Аян" }), "Здравствуйте, Аян!");
  assert.equal(tk("{n} оқушы", { n: 5 }), "5 оқушы");
  assert.deepEqual([1, 2, 5, 11, 21, 22].map((n) => tr("{n} оқушы", { n })), ["1 ученик", "2 ученика", "5 учеников", "11 учеников", "21 ученик", "22 ученика"]);
  assert.equal(interpolate("kk", "{a} {b}", { a: 1 }), "1 {b}", "белгісіз плейсхолдер сақталады");
  assert.equal(interpolate("kk", "код {x}", undefined), "код {x}", "параметрсіз мәтін өзгермейді");
});

test("тіл whitelist: тек kk|ru; Accept-Language бойынша бастапқы таңдау", () => {
  assert.deepEqual([...LOCALES], ["kk", "ru"]);
  for (const v of ["kk", "ru"]) assert.ok(isLocale(v));
  for (const v of ["en", "KK", "", "ru-RU", "kk;ru", null, undefined, 1, "<script>", "../ru"]) { assert.ok(!isLocale(v), String(v)); assert.equal(toLocale(v), "kk"); }
  assert.equal(localeFromAcceptLanguage(undefined), "kk");
  assert.equal(localeFromAcceptLanguage("kk-KZ,kk;q=0.9,ru;q=0.8"), "kk");
  assert.equal(localeFromAcceptLanguage("ru-RU,ru;q=0.9,en;q=0.8"), "ru");
  assert.equal(localeFromAcceptLanguage("en-US,en;q=0.9"), "kk");
  assert.equal(localeFromAcceptLanguage("en-US,ru;q=0.5"), "kk", "ең жоғары басым ru болса ғана");
  assert.equal(localeFromAcceptLanguage("ru;q=0.5,kk;q=0.9"), "kk");
  assert.equal(localeFromAcceptLanguage("*"), "kk");
});

test("күн/сан форматы: Asia/Almaty, kk және ru айлары", () => {
  const d = "2026-03-05T20:30:00Z"; // Алматыда 6 наурыз 01:30 (UTC+5)
  assert.equal(fmtDate(d), "6 наурыз 2026");
  assert.equal(fmtDate(d, true), "6 наурыз 2026, 01:30");
  assert.equal(fmtDate(d, true, "ru"), "6 марта 2026, 01:30");
  assert.equal(fmtDate("2026-12-31T00:00:00Z", false, "ru"), "31 декабря 2026");
  assert.equal(fmtDate(null), "-");
  assert.equal(fmtDate("мағынасыз"), "-");
  assert.equal(fmtNum(3.5), "3.5");
  assert.equal(fmtNum(3.5, "ru"), "3,5");
  assert.equal(fmtPct(79.6), "80%");
  assert.equal(fmtDuration(90), "2 мин");
  assert.equal(fmtDuration(3900, "kk"), "1 сағ 5 мин");
  assert.equal(fmtDuration(3900, "ru"), "1 ч 5 мин");
});
