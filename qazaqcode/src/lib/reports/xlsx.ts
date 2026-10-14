import ExcelJS from "exceljs";
import { safeText } from "./sanitize";
import type { Cell, ColType, Report } from "./types";

const NUMFMT: Record<ColType, string | undefined> = { text: undefined, int: "#,##0", dec: "#,##0.##", pct: '0.0"%"' };

/** Excel парақ аттары: ≤31 таңба, \ / ? * [ ] : жоқ, бірегей. */
function sheetName(name: string, used: Set<string>): string {
  let n = name.replace(/[\\/?*[\]:]/g, " ").trim().slice(0, 31) || "Парақ";
  let i = 2;
  while (used.has(n.toLowerCase())) n = `${n.slice(0, 28)} ${i++}`;
  used.add(n.toLowerCase());
  return n;
}

export function cellParts(c: Cell, colType: ColType): { v: string | number | null; t: ColType } {
  if (c !== null && typeof c === "object") return c;
  return { v: c, t: typeof c === "number" ? colType : "text" };
}

export async function buildXlsx(report: Report): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "QazaqCode";
  wb.created = report.generatedAt;
  wb.title = report.title;
  const used = new Set<string>();
  for (const sh of report.sheets) {
    const ws = wb.addWorksheet(sheetName(sh.name, used), { views: [{ state: "frozen", ySplit: 1 }] });
    ws.columns = sh.columns.map((c) => ({ header: c.header, width: c.width }));
    const head = ws.getRow(1);
    head.font = { bold: true, color: { argb: "FFFFFFFF" } };
    head.alignment = { vertical: "middle", wrapText: true };
    head.height = 30;
    head.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0E7490" } };
      cell.border = { bottom: { style: "thin", color: { argb: "FF0B5568" } } };
    });
    for (const r of sh.rows) {
      const row = ws.addRow(r.map((c, i) => {
        const { v } = cellParts(c, sh.columns[i].type);
        return typeof v === "string" ? safeText(v) : v;
      }));
      r.forEach((c, i) => {
        const { v, t } = cellParts(c, sh.columns[i].type);
        const cell = row.getCell(i + 1);
        if (typeof v === "number" && NUMFMT[t]) cell.numFmt = NUMFMT[t]!;
        cell.alignment = { vertical: "top", wrapText: typeof v === "string", horizontal: typeof v === "number" ? "right" : "left" };
      });
    }
    if (sh.rows.length === 0 && sh.emptyNote) ws.addRow([sh.emptyNote]).font = { italic: true };
    ws.autoFilter = sh.rows.length ? { from: { row: 1, column: 1 }, to: { row: 1 + sh.rows.length, column: sh.columns.length } } : undefined;
  }
  const info = wb.addWorksheet(sheetName("Мәлімет", used));
  info.columns = [{ width: 24 }, { width: 50 }];
  info.addRows([
    ["Есеп", safeText(report.title)], ["Ұйым", safeText(report.orgName)],
    ["Жасалған күні", report.generatedAt.toLocaleString("ru-RU", { timeZone: "Asia/Almaty" })],
    ["Кезең", report.range ? `${report.range.from} - ${report.range.to}` : "Барлық уақыт"],
  ]);
  info.getColumn(1).font = { bold: true };
  return Buffer.from(await wb.xlsx.writeBuffer());
}
