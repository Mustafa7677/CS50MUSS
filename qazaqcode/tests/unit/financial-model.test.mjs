import { test, before } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const ExcelJS = createRequire(import.meta.url)("exceljs");
const FILE = join(mkdtempSync(join(tmpdir(), "fm-")), "model.xlsx");
const NAMES = ["Оқы мені", "Болжамдар", "Кіріс", "Шығын", "P&L", "Cash және runway", "Бірлік экономикасы", "Сезімталдық кестесі"];
let wb;
before(async () => {
  execFileSync("node", [join(ROOT, "scripts/make-financial-model.mjs"), "--out", FILE], { cwd: ROOT, stdio: "pipe" });
  wb = new ExcelJS.Workbook(); await wb.xlsx.readFile(FILE);
});
const cells = (ws) => { const o = []; ws.eachRow((r) => r.eachCell((c) => o.push(c))); return o; };
const isF = (c) => c.value && typeof c.value === "object" && "formula" in c.value;

test("қаржылық модель: ашылады, парақ аттары дұрыс", () => {
  assert.deepEqual(wb.worksheets.map((w) => w.name), NAMES);
});

test("қаржылық модель: формулалар көп, #REF! жоқ, барлық сілтеме парақтары бар", () => {
  let n = 0;
  for (const ws of wb.worksheets) for (const c of cells(ws)) {
    const s = isF(c) ? c.value.formula : typeof c.value === "string" ? c.value : "";
    assert.ok(!/#REF!|#NAME\?|#DIV\/0!|#VALUE!/.test(s), `${ws.name}!${c.address}`);
    if (isF(c)) {
      n++;
      for (const m of s.matchAll(/'([^']+)'!/g)) assert.ok(NAMES.includes(m[1]), `${ws.name}!${c.address} -> ${m[1]}`);
      assert.equal((s.match(/\(/g) || []).length, (s.match(/\)/g) || []).length, `жақшалар ${ws.name}!${c.address}`);
    }
  }
  assert.ok(n > 2000, "формула саны: " + n);
});

test("қаржылық модель: болжамдар БОС (гипотеза), сары фон + көк қаріп, валидация бар", () => {
  const ws = wb.getWorksheet("Болжамдар");
  let inputs = 0;
  for (let r = 5; r <= 40; r++) {
    if (!ws.getCell(`G${r}`).value) continue; // секция жолдары
    for (const c of ["C", "D", "E"]) {
      const cell = ws.getCell(`${c}${r}`); inputs++;
      assert.ok(cell.value === null || cell.value === undefined, `${c}${r} бос болуы керек`);
      assert.equal(cell.font?.color?.argb, "FF0000FF", "көк қаріп");
      assert.equal(cell.fill?.fgColor?.argb, "FFFFE9A8", "гипотеза түсі");
      assert.ok(cell.dataValidation && cell.dataValidation.type, `валидация ${c}${r}`);
    }
    assert.match(String(ws.getCell(`G${r}`).value), /ГИПОТЕЗА/);
  }
  assert.ok(inputs >= 3 * 15, "кіріс ұяшықтары: " + inputs);
  assert.equal(ws.getCell("B2").dataValidation.type, "list");
  assert.match(String(wb.getWorksheet("Оқы мені").getCell("A1").value), /ГИПОТЕЗА/);
});

test("қаржылық модель: есептеу парақтарында hardcode нәтиже жоқ; формулалар қара", () => {
  for (const name of ["Кіріс", "Шығын", "P&L", "Cash және runway", "Бірлік экономикасы"]) {
    for (const c of cells(wb.getWorksheet(name))) {
      if (typeof c.value === "number") assert.ok(c.row === 4 || c.row === 19, `${name}!${c.address} қолмен сан (${c.value})`); // тек "Ай 1" тақырыбы
      if (isF(c)) assert.notEqual(c.font?.color?.argb, "FF0000FF", `${name}!${c.address} формула көк болмауы керек`);
    }
  }
  // сезімталдық: сандық ұяшықтар жоқ (осьтер бос), барлық ішкі ұяшық формула
  const s = wb.getWorksheet("Сезімталдық кестесі");
  for (const c of cells(s)) assert.ok(typeof c.value !== "number", c.address);
});

test("қаржылық модель: бөлгіш қауіпті формулалар IFERROR-мен қорғалған", () => {
  const f = [];
  for (const ws of wb.worksheets) for (const c of cells(ws)) if (isF(c) && /\/(?!\d)/.test(c.value.formula)) f.push([ws.name, c.address, c.value.formula]);
  for (const [w, a, s] of f) assert.match(s, /IFERROR/, `${w}!${a}: ${s}`);
  assert.ok(f.length > 20);
});
