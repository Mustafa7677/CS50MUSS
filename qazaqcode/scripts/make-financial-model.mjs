#!/usr/bin/env node
// Қаржылық модель ШАБЛОНЫ: docs/QazaqCode-financial-model.xlsx. `node scripts/make-financial-model.mjs [--out файл] [--verify]`
// ЕРЕЖЕ: барлық болжам (баға, мектеп, оқушы, конверсия, churn, шығындар) БОС = ГИПОТЕЗА/толтырылмаған. Файлда ойдан шығарылған сан жоқ.
// Есептеулердің бәрі тірі формулалар. --verify: LibreOffice болса қайта есептеп қателерсіз екенін (бос және тест толтырылған көшірмеде) тексереді.
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, existsSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
const require = createRequire(import.meta.url);
const ExcelJS = require("exceljs");

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const outArg = args.includes("--out") ? args[args.indexOf("--out") + 1] : null;
const OUT = resolve(outArg || join(ROOT, "docs/QazaqCode-financial-model.xlsx"));

export const SHEETS = { readme: "Оқы мені", assump: "Болжамдар", rev: "Кіріс", cost: "Шығын", pl: "P&L", cash: "Cash және runway", unit: "Бірлік экономикасы", sens: "Сезімталдық кестесі" };
const S = Object.fromEntries(Object.entries(SHEETS).map(([k, v]) => [k, `'${v}'`]));
const MONTHS = 36, FIRST = 4; // бірінші ай бағаны D
const col = (n) => { let s = ""; while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; };
const mc = (i) => col(FIRST + i); // i=0..35
const LAST = mc(MONTHS - 1);

const BRAND = "FF1F4FD8", RED = "FFC00000", HYP = "FFFFE9A8", INPUT_BLUE = "FF0000FF", HEAD = "FFE8EEFB", GREY = "FFF2F2F2";
const thin = { style: "thin", color: { argb: "FFBFBFBF" } };
const box = { top: thin, left: thin, bottom: thin, right: thin };

const wb = new ExcelJS.Workbook();
wb.creator = "QazaqCode"; wb.created = new Date(0);
wb.calcProperties = { fullCalcOnLoad: true };

function title(ws, text, sub) {
  ws.getCell("A1").value = text; ws.getCell("A1").font = { bold: true, size: 14, color: { argb: BRAND } };
  if (sub) { ws.getCell("A2").value = sub; ws.getCell("A2").font = { italic: true, color: { argb: RED } }; }
}
function head(row, from, to) { for (let c = from; c <= to; c++) { const x = row.getCell(c); x.font = { bold: true }; x.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEAD } }; x.border = box; x.alignment = { horizontal: "center", vertical: "middle", wrapText: true }; } }
function inputCell(c, fmt) { c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HYP } }; c.font = { color: { argb: INPUT_BLUE } }; c.border = box; if (fmt) c.numFmt = fmt; }
function calcCell(c, fmt) { c.font = { color: { argb: "FF000000" } }; c.border = box; if (fmt) c.numFmt = fmt; }

// ---------- 1. Оқы мені ----------
{
  const ws = wb.addWorksheet(SHEETS.readme, { properties: { tabColor: { argb: RED } } });
  ws.columns = [{ width: 110 }];
  const lines = [
    ["ГИПОТЕЗА, ТОЛТЫРЫЛМАҒАН БОЛЖАМДАР", { bold: true, size: 18, color: { argb: RED } }],
    ["Бұл файл - ШАБЛОН. Ішінде нақты баға, клиент, табыс, нарық көлемі не өсім жоқ: олар әлі белгісіз (QazaqCode пилотқа дейінгі сатыда, төленген клиент жоқ).", { bold: true, color: { argb: RED } }],
    ["Нәтижелер (кіріс, P&L, runway, LTV/CAC) тек сіз енгізген гипотезаларға тәуелді. Болжамдарды толтырмай тұрып барлығы 0 немесе \"—\" болады: бұл дұрыс.", {}],
    ["", {}],
    ["Қалай қолдану", { bold: true }],
    ["1. 'Болжамдар' парағында ЖЕЛТОҚ ұяшықтарды (көк қаріп) толтырыңыз: үш сценарий үшін бөлек (консервативті / базалық / оптимистік).", {}],
    ["2. Жоғарғы ұяшықтан белсенді сценарийді таңдаңыз. Шығын, P&L, Cash, Бірлік экономикасы таңдалған сценарийді көрсетеді; 'Кіріс' парағында үш сценарий да бөлек есептеледі.", {}],
    ["3. Баға мен шығынды ПИЛОТТАН кейінгі нақты деректермен ауыстырыңыз. Дереккөзсіз сан енгізбеңіз немесе енгізсеңіз, дереккөзін ескертуге жазыңыз.", {}],
    ["", {}],
    ["Түс кодтары", { bold: true }],
    ["Көк қаріп + жолақты сары фон = КІРІС ұяшығы (гипотеза, пайдаланушы енгізеді).", { color: { argb: INPUT_BLUE } }],
    ["Қара қаріп = ФОРМУЛА (қолмен өзгертпеңіз).", {}],
    ["", {}],
    ["Шектеулер", { bold: true }],
    ["- Модель жеңілдетілген: мектеп = бір жылдық лицензия, төлем ай сайын бөлінген (MRR = мектеп x оқушы x жылдық баға / 12).", {}],
    ["- Салық, амортизация, ҚҚС, валюта бағамы, маусымдылық (оқу жылы) есепке алынбаған.", {}],
    ["- Бұл инвестициялық ұсыныс не болжам емес; есептеу құралы.", {}],
    ["- Пилот сатысында: [docs/INVESTOR.md] ішіндегі бизнес-модель - гипотеза.", {}],
  ];
  lines.forEach(([t, f], i) => { const c = ws.getCell(i + 1, 1); c.value = t; c.font = f; c.alignment = { wrapText: true, vertical: "top" }; });
  ws.getRow(1).height = 30;
}

// ---------- 2. Болжамдар ----------
const A = {}; // key -> row
const ASSUMPTIONS = [
  ["sec", "Баға және клиенттер"],
  ["price", "Баға: 1 оқушы / жыл", "₸", "money"],
  ["spp", "Оқушы саны / мектеп", "оқушы", "int"],
  ["initial", "Бастапқы төлеуші мектеп саны (1-айда)", "мектеп", "int"],
  ["sec", "Воронка (сату)"],
  ["leads", "Жаңа лид (мектеп сұрауы) / ай", "лид", "int"],
  ["conv1", "Лид -> пилот конверсиясы", "%", "pct"],
  ["conv2", "Пилот -> төлеуші конверсиясы", "%", "pct"],
  ["lag", "Пилоттан төлеушіге дейінгі кідіріс", "ай", "lag"],
  ["churn", "Айлық churn (төлеуші мектептер)", "%/ай", "pct"],
  ["sec", "Ауыспалы шығындар"],
  ["hostVar", "Хостинг шығыны / мектеп / ай", "₸", "money"],
  ["hours", "Қолдау сағаты / мектеп / ай", "сағат", "num"],
  ["rate", "Қолдау сағатының құны", "₸/сағат", "money"],
  ["comm", "Төлем комиссиясы және салық (кірістен)", "%", "pct"],
  ["sec", "Тұрақты шығындар (ай сайын)"],
  ["hostFixed", "Тұрақты хостинг / инфрақұрылым / ай", "₸", "money"],
  ["heads", "Қызметкер саны (жалақы алатын)", "адам", "int"],
  ["salary", "Орташа жалақы / адам / ай", "₸", "money"],
  ["legal", "Заңгер / ай", "₸", "money"],
  ["marketing", "Маркетинг және сату / ай", "₸", "money"],
  ["sec", "Қаржы"],
  ["cash0", "Бастапқы касса (0-ай)", "₸", "money"],
];
const FMT = { money: "#,##0", pct: "0.0%", int: "#,##0", num: "#,##0.0", lag: "0" };
const SCEN = ["Консервативті", "Базалық", "Оптимистік"];
const SCOL = ["C", "D", "E"];
{
  const ws = wb.addWorksheet(SHEETS.assump, { properties: { tabColor: { argb: "FFFFC000" } } });
  ws.columns = [{ width: 46 }, { width: 12 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 44 }];
  title(ws, "Болжамдар (ГИПОТЕЗА: толтырылмаған)", null);
  ws.getCell("A2").value = "Белсенді сценарий:"; ws.getCell("A2").font = { bold: true };
  const sel = ws.getCell("B2"); sel.value = SCEN[1]; inputCell(sel); sel.font = { bold: true, color: { argb: INPUT_BLUE } };
  sel.dataValidation = { type: "list", allowBlank: false, formulae: ['"' + SCEN.join(",") + '"'], showErrorMessage: true, errorTitle: "Сценарий", error: "Тізімнен таңдаңыз" };
  ws.getCell("C2").value = "индекс:"; ws.getCell("C2").alignment = { horizontal: "right" };
  ws.getCell("D2").value = { formula: "IFERROR(MATCH($B$2,$C$4:$E$4,0),2)" }; calcCell(ws.getCell("D2"));
  ws.getCell("A3").value = "Барлық желтоқ ұяшық - ГИПОТЕЗА. Бос = әлі белгісіз (есептеуде 0). Дереккөзін G бағанына жазыңыз."; ws.getCell("A3").font = { italic: true, color: { argb: RED } };
  const h = ws.getRow(4); ["Параметр", "Бірлік", ...SCEN, "Белсенді", "Ескерту"].forEach((t, i) => (h.getCell(i + 1).value = t)); head(h, 1, 7);
  let r = 5;
  for (const a of ASSUMPTIONS) {
    if (a[0] === "sec") { const c = ws.getCell(r, 1); c.value = a[1]; c.font = { bold: true }; for (let k = 1; k <= 7; k++) ws.getCell(r, k).fill = { type: "pattern", pattern: "solid", fgColor: { argb: GREY } }; r++; continue; }
    const [key, label, unit, type] = a; A[key] = r;
    ws.getCell(r, 1).value = label; ws.getCell(r, 2).value = unit;
    for (const c of SCOL) {
      const cell = ws.getCell(`${c}${r}`); inputCell(cell, FMT[type]);
      if (type === "pct") cell.dataValidation = { type: "decimal", operator: "between", formulae: [0, 1], allowBlank: true, showErrorMessage: true, errorTitle: "Пайыз", error: "0% пен 100% аралығы (мысалы 5%)" };
      else if (type === "lag") cell.dataValidation = { type: "whole", operator: "between", formulae: [0, 12], allowBlank: true, showErrorMessage: true, errorTitle: "Кідіріс", error: "0-12 аралығындағы бүтін ай" };
      else if (type === "int") cell.dataValidation = { type: "whole", operator: "greaterThanOrEqual", formulae: [0], allowBlank: true, showErrorMessage: true, errorTitle: "Сан", error: "0 немесе одан үлкен бүтін сан" };
      else cell.dataValidation = { type: "decimal", operator: "greaterThanOrEqual", formulae: [0], allowBlank: true, showErrorMessage: true, errorTitle: "Сан", error: "0 немесе одан үлкен сан" };
    }
    const act = ws.getCell(`F${r}`); act.value = { formula: `INDEX(C${r}:E${r},1,$D$2)` }; calcCell(act, FMT[type]);
    const note = ws.getCell(`G${r}`); note.value = "ГИПОТЕЗА: толтырыңыз (0 / бос)"; note.font = { italic: true, color: { argb: "FF7F7F7F" } };
    r++;
  }
  ws.views = [{ state: "frozen", ySplit: 4, xSplit: 1 }];
}
const AS = (k) => `${S.assump}!$F$${A[k]}`; // белсенді мән
const AC = (k, s) => `${S.assump}!$${SCOL[s]}$${A[k]}`; // сценарий мәні
const SELIDX = `${S.assump}!$D$2`;

function monthHeader(ws, row, label) {
  ws.getCell(row, 1).value = label; ws.getCell(row, 2).value = "Бірлік"; ws.getCell(row, 3).value = "Жиыны / соңы";
  for (let i = 0; i < MONTHS; i++) { const c = ws.getCell(row, FIRST + i); c.value = i === 0 ? 1 : { formula: `${mc(i - 1)}${row}+1` }; c.numFmt = '"Ай "0'; }
  head(ws.getRow(row), 1, FIRST + MONTHS - 1);
}
function setupMonthly(ws, widthA = 42) { ws.getColumn(1).width = widthA; ws.getColumn(2).width = 10; ws.getColumn(3).width = 16; for (let i = 0; i < MONTHS; i++) ws.getColumn(FIRST + i).width = 12; ws.views = [{ state: "frozen", xSplit: 3, ySplit: 4 }]; }
function rowFormulas(ws, row, label, unit, fn, totalKind, fmt = "#,##0") {
  ws.getCell(row, 1).value = label; ws.getCell(row, 2).value = unit; ws.getCell(row, 1).font = { bold: false };
  for (let i = 0; i < MONTHS; i++) { const c = ws.getCell(row, FIRST + i); c.value = { formula: fn(i, mc(i), i > 0 ? mc(i - 1) : null) }; calcCell(c, fmt); }
  const t = ws.getCell(row, 3);
  if (totalKind === "sum") t.value = { formula: `SUM(${mc(0)}${row}:${LAST}${row})` };
  else if (totalKind === "last") t.value = { formula: `${LAST}${row}` };
  if (totalKind) calcCell(t, fmt);
}

// ---------- 3. Кіріс ----------
const REV = { active: 5 }; // блок бастапқы жолдары
const BLOCK = 12; const OFF = { title: 0, leads: 1, pilots: 2, newPay: 3, churned: 4, active: 5, students: 6, mrr: 7, arr: 8, revenue: 9 };
const blockStart = (s) => 5 + BLOCK * (s + 1); // s=0..2; белсенді блок 5-те
{
  const ws = wb.addWorksheet(SHEETS.rev, { properties: { tabColor: { argb: "FF70AD47" } } });
  title(ws, "Кіріс (36 ай): MRR / ARR", "ГИПОТЕЗА: барлық болжам 'Болжамдар' парағынан; толтырылмаса 0.");
  setupMonthly(ws); monthHeader(ws, 4, "Көрсеткіш");
  const names = { leads: ["Жаңа лид", "мектеп"], pilots: ["Жаңа пилот", "мектеп"], newPay: ["Жаңа төлеуші мектеп", "мектеп"], churned: ["Кеткен (churn) мектеп", "мектеп"], active: ["Белсенді төлеуші мектеп", "мектеп"], students: ["Төлеуші оқушылар", "оқушы"], mrr: ["MRR", "₸/ай"], arr: ["ARR (= MRR x 12)", "₸/жыл"], revenue: ["Кіріс (ай)", "₸"] };
  const totKind = { leads: "sum", pilots: "sum", newPay: "sum", churned: "sum", active: "last", students: "last", mrr: "last", arr: "last", revenue: "sum" };
  const secTitle = (r, t) => { const c = ws.getCell(r, 1); c.value = t; c.font = { bold: true, size: 12, color: { argb: BRAND } }; };
  secTitle(5, "БЕЛСЕНДІ сценарий (Болжамдар!B2 таңдауы)");
  for (const k of Object.keys(names)) {
    const row = 5 + OFF[k];
    rowFormulas(ws, row, names[k][0], names[k][1], (i, c) => `CHOOSE(${SELIDX},${c}${blockStart(0) + OFF[k]},${c}${blockStart(1) + OFF[k]},${c}${blockStart(2) + OFF[k]})`, totKind[k], k === "revenue" || k === "mrr" || k === "arr" ? "#,##0" : "#,##0.0");
  }
  // блоктар
  for (let s = 0; s < 3; s++) {
    const b = blockStart(s); secTitle(b, `Сценарий: ${SCEN[s]}`);
    const R = (k) => b + OFF[k];
    rowFormulas(ws, R("leads"), names.leads[0], names.leads[1], () => `N(${AC("leads", s)})`, "sum", "#,##0.0");
    rowFormulas(ws, R("pilots"), names.pilots[0], names.pilots[1], (i, c) => `${c}${R("leads")}*N(${AC("conv1", s)})`, "sum", "#,##0.0");
    rowFormulas(ws, R("newPay"), names.newPay[0], names.newPay[1], (i, c) => `IF(${c}$4>N(${AC("lag", s)}),INDEX($${mc(0)}${R("pilots")}:$${LAST}${R("pilots")},1,MAX(1,${c}$4-N(${AC("lag", s)}))),0)*N(${AC("conv2", s)})+IF(${c}$4=1,N(${AC("initial", s)}),0)`, "sum", "#,##0.0");
    rowFormulas(ws, R("churned"), names.churned[0], names.churned[1], (i, c, p) => (p ? `${p}${R("active")}*N(${AC("churn", s)})` : `IF(${c}$4=1,0,0)`), "sum", "#,##0.0");
    rowFormulas(ws, R("active"), names.active[0], names.active[1], (i, c, p) => `${p ? p + R("active") : "0"}+${c}${R("newPay")}-${c}${R("churned")}`, "last", "#,##0.0");
    rowFormulas(ws, R("students"), names.students[0], names.students[1], (i, c) => `${c}${R("active")}*N(${AC("spp", s)})`, "last", "#,##0");
    rowFormulas(ws, R("mrr"), names.mrr[0], names.mrr[1], (i, c) => `${c}${R("students")}*N(${AC("price", s)})/12`, "last");
    rowFormulas(ws, R("arr"), names.arr[0], names.arr[1], (i, c) => `${c}${R("mrr")}*12`, "last");
    rowFormulas(ws, R("revenue"), names.revenue[0], names.revenue[1], (i, c) => `${c}${R("mrr")}`, "sum");
  }
}
const REVA = (k, c) => `${S.rev}!${c}${5 + OFF[k]}`;

// ---------- 4. Шығын ----------
const COST = { schools: 5, revenue: 6, hostVar: 7, hostFixed: 8, support: 9, salary: 10, legal: 11, marketing: 12, comm: 13, total: 14 };
{
  const ws = wb.addWorksheet(SHEETS.cost, { properties: { tabColor: { argb: "FFED7D31" } } });
  title(ws, "Шығын (белсенді сценарий, 36 ай)", "ГИПОТЕЗА: шығын мөлшері Болжамдар парағынан; толтырылмаса 0.");
  setupMonthly(ws); monthHeader(ws, 4, "Шығын түрі");
  rowFormulas(ws, COST.schools, "Белсенді төлеуші мектеп", "мектеп", (i, c) => REVA("active", c), "last", "#,##0.0");
  rowFormulas(ws, COST.revenue, "Кіріс", "₸", (i, c) => REVA("revenue", c), "sum");
  rowFormulas(ws, COST.hostVar, "Хостинг: ауыспалы (мектепке)", "₸", (i, c) => `${c}${COST.schools}*N(${AS("hostVar")})`, "sum");
  rowFormulas(ws, COST.hostFixed, "Хостинг: тұрақты", "₸", () => `N(${AS("hostFixed")})`, "sum");
  rowFormulas(ws, COST.support, "Қолдау (сағат x құны)", "₸", (i, c) => `${c}${COST.schools}*N(${AS("hours")})*N(${AS("rate")})`, "sum");
  rowFormulas(ws, COST.salary, "Жалақы", "₸", () => `N(${AS("heads")})*N(${AS("salary")})`, "sum");
  rowFormulas(ws, COST.legal, "Заңгер", "₸", () => `N(${AS("legal")})`, "sum");
  rowFormulas(ws, COST.marketing, "Маркетинг және сату", "₸", () => `N(${AS("marketing")})`, "sum");
  rowFormulas(ws, COST.comm, "Төлем комиссиясы және салық", "₸", (i, c) => `${c}${COST.revenue}*N(${AS("comm")})`, "sum");
  rowFormulas(ws, COST.total, "ЖИЫНЫ шығын", "₸", (i, c) => `SUM(${c}${COST.hostVar}:${c}${COST.comm})`, "sum");
  for (let c = 1; c <= FIRST + MONTHS - 1; c++) ws.getCell(COST.total, c).font = { bold: true };
}

// ---------- 5. P&L ----------
const PL = { rev: 20, cogs: 21, gp: 22, gm: 23, opex: 24, comm: 25, net: 26 };
const Y = [[0, 11], [12, 23], [24, 35]];
{
  const ws = wb.addWorksheet(SHEETS.pl, { properties: { tabColor: { argb: "FF5B9BD5" } } });
  title(ws, "P&L (белсенді сценарий)", "ГИПОТЕЗА: барлық сан формуладан; Болжамдар толтырылмаса 0.");
  setupMonthly(ws); ws.views = [{ state: "frozen", xSplit: 3 }];
  monthHeader(ws, 19, "Айлық P&L");
  rowFormulas(ws, PL.rev, "Кіріс", "₸", (i, c) => `${S.cost}!${c}${COST.revenue}`, "sum");
  rowFormulas(ws, PL.cogs, "Тікелей шығын (хостинг + қолдау)", "₸", (i, c) => `${S.cost}!${c}${COST.hostVar}+${S.cost}!${c}${COST.hostFixed}+${S.cost}!${c}${COST.support}`, "sum");
  rowFormulas(ws, PL.gp, "Жалпы пайда", "₸", (i, c) => `${c}${PL.rev}-${c}${PL.cogs}`, "sum");
  rowFormulas(ws, PL.gm, "Жалпы маржа", "%", (i, c) => `IFERROR(${c}${PL.gp}/${c}${PL.rev},0)`, null, "0.0%");
  ws.getCell(PL.gm, 3).value = { formula: `IFERROR(C${PL.gp}/C${PL.rev},0)` }; calcCell(ws.getCell(PL.gm, 3), "0.0%");
  rowFormulas(ws, PL.opex, "Операциялық шығын (жалақы, заңгер, маркетинг)", "₸", (i, c) => `${S.cost}!${c}${COST.salary}+${S.cost}!${c}${COST.legal}+${S.cost}!${c}${COST.marketing}`, "sum");
  rowFormulas(ws, PL.comm, "Комиссия және салық", "₸", (i, c) => `${S.cost}!${c}${COST.comm}`, "sum");
  rowFormulas(ws, PL.net, "Таза нәтиже (EBITDA-ға жақын)", "₸", (i, c) => `${c}${PL.gp}-${c}${PL.opex}-${c}${PL.comm}`, "sum");
  for (let c = 1; c <= FIRST + MONTHS - 1; c++) ws.getCell(PL.net, c).font = { bold: true };
  // жылдық қорытынды
  const yh = ws.getRow(4); ["Жылдық қорытынды", "Бірлік", "1-жыл", "2-жыл", "3-жыл"].forEach((t, i) => (yh.getCell(i + 1).value = t)); head(yh, 1, 5);
  const rows = [["Кіріс", "rev"], ["Тікелей шығын", "cogs"], ["Жалпы пайда", "gp"], ["Операциялық шығын", "opex"], ["Комиссия және салық", "comm"], ["Таза нәтиже", "net"]];
  rows.forEach(([lab, k], idx) => {
    const r = 5 + idx; ws.getCell(r, 1).value = lab; ws.getCell(r, 2).value = "₸";
    Y.forEach(([a, b], yi) => { const c = ws.getCell(r, 3 + yi); c.value = { formula: `SUM(${mc(a)}${PL[k]}:${mc(b)}${PL[k]})` }; calcCell(c, "#,##0"); });
  });
  ws.getCell(11, 1).value = "Жалпы маржа"; ws.getCell(11, 2).value = "%";
  [0, 1, 2].forEach((yi) => { const cl = col(3 + yi); const c = ws.getCell(11, 3 + yi); c.value = { formula: `IFERROR(${cl}7/${cl}5,0)` }; calcCell(c, "0.0%"); });
  // сценарий салыстыруы
  const sh = ws.getRow(13); ["Сценарий салыстыруы (тек кіріс жағы)", "Бірлік", ...SCEN].forEach((t, i) => (sh.getCell(i + 1).value = t)); head(sh, 1, 5);
  [["36-ай ARR", "arr", "last", "₸"], ["36-айдағы төлеуші мектеп", "active", "last", "мектеп"], ["36 айдағы жиынтық кіріс", "revenue", "sum", "₸"]].forEach(([lab, k, kind, unit], idx) => {
    const r = 14 + idx; ws.getCell(r, 1).value = lab; ws.getCell(r, 2).value = unit;
    for (let s = 0; s < 3; s++) { const c = ws.getCell(r, 3 + s); c.value = { formula: `${S.rev}!C${blockStart(s) + OFF[k]}` }; calcCell(c, "#,##0"); }
  });
  ws.getColumn(3).width = 16;
}

// ---------- 6. Cash ----------
const CASH = { open: 5, net: 6, close: 7, burn: 8, avgBurn: 9, runway: 10, neg: 11 };
{
  const ws = wb.addWorksheet(SHEETS.cash, { properties: { tabColor: { argb: "FF7030A0" } } });
  title(ws, "Cash және runway (белсенді сценарий)", "ГИПОТЕЗА: бастапқы касса Болжамдар парағында; бос болса 0.");
  setupMonthly(ws); monthHeader(ws, 4, "Көрсеткіш");
  rowFormulas(ws, CASH.open, "Ай басындағы касса", "₸", (i, c, p) => (p ? `${p}${CASH.close}` : `N(${AS("cash0")})`), null);
  rowFormulas(ws, CASH.net, "Таза нәтиже (P&L)", "₸", (i, c) => `${S.pl}!${c}${PL.net}`, "sum");
  rowFormulas(ws, CASH.close, "Ай соңындағы касса", "₸", (i, c) => `${c}${CASH.open}+${c}${CASH.net}`, "last");
  rowFormulas(ws, CASH.burn, "Burn (таза шығыс)", "₸", (i, c) => `MAX(0,-${c}${CASH.net})`, "sum");
  rowFormulas(ws, CASH.avgBurn, "Орташа burn (соңғы 3 ай)", "₸", (i, c) => `AVERAGE(${mc(Math.max(0, i - 2))}${CASH.burn}:${c}${CASH.burn})`, null);
  rowFormulas(ws, CASH.runway, "Runway (ай)", "ай", (i, c) => `IF(${c}${CASH.close}<=0,0,IFERROR(${c}${CASH.close}/${c}${CASH.avgBurn},"-"))`, null, "0.0");
  rowFormulas(ws, CASH.neg, "Касса теріс (1 = иә)", "флаг", (i, c) => `IF(${c}${CASH.close}<0,1,0)`, "sum", "0");
  const k = 14;
  [["Ең төмен касса деңгейі", `MIN(${mc(0)}${CASH.close}:${LAST}${CASH.close})`, "#,##0"],
   ["Касса теріс болатын алғашқы ай", `IFERROR(MATCH(1,${mc(0)}${CASH.neg}:${LAST}${CASH.neg},0),"жоқ")`, "0"],
   ["Қосымша қаржы қажеттілігі (ең төмен касса теріс болса)", `MAX(0,-C${k})`, "#,##0"],
   ["36-ай соңындағы касса", `${LAST}${CASH.close}`, "#,##0"]].forEach(([lab, f, fmt], i) => { const r = k + i; ws.getCell(r, 1).value = lab; ws.getCell(r, 1).font = { bold: true }; const c = ws.getCell(r, 3); c.value = { formula: f }; calcCell(c, fmt); });
  ws.getCell(k + 4, 1).value = "Ескерту: runway 3 айлық орташа burn бойынша; пайдалы ай болса '-' (burn жоқ)."; ws.getCell(k + 4, 1).font = { italic: true };
}

// ---------- 7. Бірлік экономикасы ----------
const UE = {};
{
  const ws = wb.addWorksheet(SHEETS.unit, { properties: { tabColor: { argb: "FF00B0F0" } } });
  ws.columns = [{ width: 52 }, { width: 14 }, { width: 18 }, { width: 70 }];
  title(ws, "Бірлік экономикасы (белсенді сценарий)", "ГИПОТЕЗА: барлығы Болжамдардан; бөлгіш 0 болса '-' шығады (қате емес).");
  const h = ws.getRow(4); ["Көрсеткіш", "Бірлік", "Мәні", "Формула / түсінік"].forEach((t, i) => (h.getCell(i + 1).value = t)); head(h, 1, 4);
  const rows = [
    ["arpa", "ARPA: 1 мектептен ай сайынғы кіріс", "₸/ай", `N(${AS("spp")})*N(${AS("price")})/12`, "#,##0", "оқушы x баға / 12"],
    ["host", "Хостинг (ауыспалы) / мектеп", "₸/ай", `N(${AS("hostVar")})`, "#,##0", ""],
    ["supp", "Қолдау / мектеп", "₸/ай", `N(${AS("hours")})*N(${AS("rate")})`, "#,##0", "сағат x сағат құны"],
    ["comm", "Комиссия және салық / мектеп", "₸/ай", `C5*N(${AS("comm")})`, "#,##0", "ARPA x %"],
    ["cm", "Жарна маржасы / мектеп", "₸/ай", "C5-C6-C7-C8", "#,##0", "ARPA - ауыспалы шығындар"],
    ["churn", "Айлық churn", "%", `N(${AS("churn")})`, "0.0%", ""],
    ["life", "Күтілетін өмір ұзақтығы", "ай", `IFERROR(1/C10,"-")`, "0.0", "1 / churn (churn = 0 болса '-')"],
    ["ltv", "LTV (жарна маржасы бойынша)", "₸", `IFERROR(C9/C10,"-")`, "#,##0", "жарна маржасы / churn"],
    ["cac", "CAC: 1 жаңа төлеуші мектепке сату шығыны", "₸", `IFERROR(${S.cost}!C${COST.marketing}/${S.rev}!C${5 + OFF.newPay},"-")`, "#,##0", "36 ай маркетингі / 36 айдағы жаңа төлеуші мектеп"],
    ["ratio", "LTV / CAC", "x", `IFERROR(C12/C13,"-")`, "0.00", ""],
    ["payback", "CAC өтелу мерзімі (payback)", "ай", `IFERROR(C13/C9,"-")`, "0.0", "CAC / айлық жарна маржасы"],
    ["fixed", "Орташа тұрақты шығын", "₸/ай", `(${S.cost}!C${COST.hostFixed}+${S.cost}!C${COST.salary}+${S.cost}!C${COST.legal}+${S.cost}!C${COST.marketing})/${MONTHS}`, "#,##0", "36 айдың орташасы"],
    ["be", "Нөлге шығу үшін мектеп саны (break-even)", "мектеп", `IFERROR(C16/C9,"-")`, "#,##0.0", "тұрақты шығын / жарна маржасы"],
  ];
  rows.forEach(([k, lab, unit, f, fmt, note], i) => { const r = 5 + i; UE[k] = r; ws.getCell(r, 1).value = lab; ws.getCell(r, 2).value = unit; const c = ws.getCell(r, 3); c.value = { formula: f }; calcCell(c, fmt); ws.getCell(r, 4).value = note; ws.getCell(r, 4).font = { italic: true, color: { argb: "FF7F7F7F" } }; });
}

// ---------- 8. Сезімталдық ----------
{
  const ws = wb.addWorksheet(SHEETS.sens, { properties: { tabColor: { argb: "FFA5A5A5" } } });
  ws.columns = [{ width: 36 }, ...Array(6).fill({ width: 18 })];
  title(ws, "Сезімталдық кестесі (белсенді сценарий)", "Көлденең/тік ось мәндерін ӨЗІҢІЗ енгізіңіз (ГИПОТЕЗА). Бос ось = 0.");
  const sch = `${S.rev}!$C$${5 + OFF.active}`; // 36-айдағы белсенді мектеп
  const grid = (top, name, cellFormula) => {
    ws.getCell(top, 1).value = name; ws.getCell(top, 1).font = { bold: true, color: { argb: BRAND } };
    ws.getCell(top + 1, 1).value = "Баға (₸/оқушы/жыл) ↓   |   Оқушы/мектеп →"; ws.getCell(top + 1, 1).font = { italic: true };
    for (let j = 0; j < 5; j++) { const c = ws.getCell(top + 1, 2 + j); inputCell(c, "#,##0"); c.dataValidation = { type: "decimal", operator: "greaterThanOrEqual", formulae: [0], allowBlank: true, showErrorMessage: true, errorTitle: "Сан", error: "0 немесе одан үлкен" }; }
    for (let i = 0; i < 5; i++) {
      const a = ws.getCell(top + 2 + i, 1); inputCell(a, "#,##0"); a.dataValidation = { type: "decimal", operator: "greaterThanOrEqual", formulae: [0], allowBlank: true, showErrorMessage: true, errorTitle: "Сан", error: "0 немесе одан үлкен" };
      for (let j = 0; j < 5; j++) { const c = ws.getCell(top + 2 + i, 2 + j); c.value = { formula: cellFormula(`$A${top + 2 + i}`, `${col(2 + j)}$${top + 1}`) }; calcCell(c, "#,##0"); }
    }
  };
  grid(4, "1) 36-айдағы ARR (₸): белсенді мектеп x оқушы x баға", (p, s) => `N(${sch})*N(${s})*N(${p})`);
  const nonRev36 = `(${S.cost}!${LAST}${COST.total}-${S.cost}!${LAST}${COST.comm})`;
  grid(14, "2) 36-айдағы айлық таза нәтиже (₸): кіріс x (1 - комиссия) - басқа шығындар", (p, s) => `N(${REVA("active", LAST)})*N(${s})*N(${p})/12*(1-N(${AS("comm")}))-${nonRev36}`);
  ws.getCell(24, 1).value = "Ескерту: ось бос болса кесте 0 немесе тек шығынды көрсетеді. Шығын жағы Болжамдардан келеді."; ws.getCell(24, 1).font = { italic: true };
}

export async function build(path = OUT) {
  mkdirSync(dirname(path), { recursive: true });
  await wb.xlsx.writeFile(path);
  return path;
}

async function verify(path) {
  const so = spawnSync("soffice", ["--version"], { encoding: "utf8" });
  const bad = /#(REF|DIV\/0|NAME|VALUE|N\/A|NUM|NULL)[!?]?|Err:\d+/;
  const scan = async (file, label) => {
    const w = new ExcelJS.Workbook(); await w.xlsx.readFile(file); let formulas = 0, errors = [], nonZero = 0;
    w.eachSheet((ws) => ws.eachRow((row) => row.eachCell((c) => {
      const v = c.value;
      if (v && typeof v === "object" && "formula" in v) { formulas++; const res = v.result; if (typeof res === "number" && res !== 0) nonZero++; if (typeof res === "string" && bad.test(res)) errors.push(`${ws.name}!${c.address}=${res}`); if (res && typeof res === "object" && res.error) errors.push(`${ws.name}!${c.address}=${res.error}`); }
      else if (typeof v === "string" && bad.test(v)) errors.push(`${ws.name}!${c.address}=${v}`);
    })));
    console.log(`[${label}] формула ${formulas}, нөлден өзгеше нәтиже ${nonZero}, қате ${errors.length}`); if (errors.length) console.log(errors.slice(0, 10).join("\n"));
    return errors.length === 0;
  };
  const tmp = mkdtempSync(join(tmpdir(), "fm-"));
  // soffice бар болғанмен Calc модулі орнатылмаған болуы мүмкін: нақты csv->xlsx конвертациясымен тексереміз
  let canCalc = so.status === 0;
  if (canCalc) { const probe = join(tmp, "p.csv"); writeFileSync(probe, "a,b\n1,2\n"); canCalc = spawnSync("soffice", ["--headless", "--convert-to", "xlsx", "--outdir", tmp, probe], { encoding: "utf8", timeout: 120000 }).status === 0 && existsSync(join(tmp, "p.xlsx")); }
  if (!canCalc) { console.log("LibreOffice Calc қолжетімсіз (soffice жоқ немесе libreoffice-calc орнатылмаған): қайта есептеу жасалмады. Статикалық формула тексеруі: tests/unit/financial-model.test.mjs."); return true; }
  const recalc = (file, dir) => { mkdirSync(dir, { recursive: true }); const r = spawnSync("soffice", ["--headless", "--convert-to", "xlsx", "--outdir", dir, file], { encoding: "utf8", timeout: 180000 }); return join(dir, file.split("/").pop()); };
  let ok = await scan(recalc(path, join(tmp, "empty")), "бос шаблон (LibreOffice қайта есептеген)");
  // тест үшін ВАҚЫТША толтырылған көшірме (docs-қа жазылмайды): формулалар жұмыс істейтінін көрсету үшін ойша сандар
  const w = new ExcelJS.Workbook(); await w.xlsx.readFile(path); const ws = w.getWorksheet(SHEETS.assump);
  const test = { price: 1000, spp: 100, initial: 1, leads: 4, conv1: 0.5, conv2: 0.5, lag: 1, churn: 0.02, hostVar: 10, hours: 1, rate: 5, comm: 0.03, hostFixed: 50, heads: 1, salary: 100, legal: 10, marketing: 20, cash0: 5000 };
  for (const [k, v] of Object.entries(test)) for (const c of SCOL) ws.getCell(`${c}${A[k]}`).value = v;
  const wp = join(tmp, "filled.xlsx"); await w.xlsx.writeFile(wp);
  ok = (await scan(recalc(wp, join(tmp, "filled")), "ТЕСТ-толтырылған көшірме (тек тексеру, сақталмайды)")) && ok;
  return ok;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const p = await build();
  console.log("Жазылды:", p);
  if (args.includes("--verify")) process.exit((await verify(p)) ? 0 : 1);
}
