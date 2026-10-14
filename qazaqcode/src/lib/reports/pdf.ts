import path from "node:path";
import PDFDocument from "pdfkit";
import { cellParts } from "./xlsx";
import type { Cell, Column, Report } from "./types";

const FONT = path.join(process.cwd(), "assets", "fonts", "DejaVuSans.ttf");
const FONT_BOLD = path.join(process.cwd(), "assets", "fonts", "DejaVuSans-Bold.ttf");
const BRAND = "#0e7490";
const MARGIN = 36;
const PAD = 4;
const SIZE = 8.5;

function fmtCell(c: Cell, col: Column): string {
  const { v, t } = cellParts(c, col.type);
  if (v == null || v === "") return "";
  if (typeof v === "string") return v;
  const x = Math.round(v * 100) / 100;
  const s = x.toLocaleString("ru-RU", { maximumFractionDigits: 2 });
  return t === "pct" ? `${s}%` : s;
}

/** A4 альбомдық PDF: тақырып, ұйым, күні, кестелер, бет нөмірі. Қазақ әріптері үшін DejaVu Sans. */
export async function buildPdf(report: Report): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: MARGIN, bufferPages: true, font: FONT,
    info: { Title: report.title, Author: "QazaqCode", Subject: report.orgName } });
  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((resolve, reject) => { doc.on("end", () => resolve(Buffer.concat(chunks))); doc.on("error", reject); });

  const W = doc.page.width - MARGIN * 2;
  const bottom = () => doc.page.height - MARGIN - 14;

  doc.font(FONT_BOLD).fontSize(18).fillColor(BRAND).text(report.title, MARGIN, MARGIN, { width: W });
  doc.font(FONT).fontSize(10).fillColor("#334155").moveDown(0.3);
  doc.text(`Ұйым: ${report.orgName}`, { width: W });
  doc.text(`Жасалған күні: ${report.generatedAt.toLocaleString("ru-RU", { timeZone: "Asia/Almaty" })}`, { width: W });
  doc.text(`Кезең: ${report.range ? `${report.range.from} - ${report.range.to}` : "барлық уақыт"}`, { width: W });
  doc.moveDown(0.8);

  for (const sh of report.sheets) {
    const total = sh.columns.reduce((a, c) => a + c.width, 0);
    const widths = sh.columns.map((c) => (c.width / total) * W);
    const heightOf = (cells: string[], bold: boolean) => {
      doc.font(bold ? FONT_BOLD : FONT).fontSize(SIZE);
      return Math.max(...cells.map((s, i) => doc.heightOfString(s || " ", { width: widths[i] - PAD * 2 }))) + PAD * 2;
    };
    const drawRow = (cells: string[], y: number, h: number, kind: "head" | "even" | "odd") => {
      let x = MARGIN;
      if (kind === "head") doc.rect(MARGIN, y, W, h).fill(BRAND);
      else if (kind === "even") doc.rect(MARGIN, y, W, h).fill("#f1f5f9");
      doc.font(kind === "head" ? FONT_BOLD : FONT).fontSize(SIZE).fillColor(kind === "head" ? "#ffffff" : "#0f172a");
      cells.forEach((s, i) => {
        const numeric = sh.columns[i].type !== "text" && kind !== "head";
        doc.text(s, x + PAD, y + PAD, { width: widths[i] - PAD * 2, align: numeric ? "right" : "left" });
        x += widths[i];
      });
    };
    const head = sh.columns.map((c) => c.header);
    const headH = heightOf(head, true);

    if (doc.y + headH + 40 > bottom()) doc.addPage();
    doc.font(FONT_BOLD).fontSize(12).fillColor("#0f172a").text(sh.title, MARGIN, doc.y, { width: W });
    doc.moveDown(0.3);
    let y = doc.y;
    if (sh.rows.length === 0) {
      doc.font(FONT).fontSize(SIZE + 1).fillColor("#64748b").text(sh.emptyNote ?? "Дерек жоқ.", MARGIN, y, { width: W });
      doc.moveDown(1);
      continue;
    }
    drawRow(head, y, headH, "head");
    y += headH;
    sh.rows.forEach((r, ri) => {
      const cells = r.map((c, i) => fmtCell(c, sh.columns[i]));
      const h = heightOf(cells, false);
      if (y + h > bottom()) {
        doc.addPage();
        y = MARGIN;
        drawRow(head, y, headH, "head");
        y += headH;
      }
      drawRow(cells, y, h, ri % 2 === 0 ? "odd" : "even");
      y += h;
    });
    doc.x = MARGIN;
    doc.y = y + 18;
    if (doc.y > bottom()) doc.addPage();
  }

  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    // төменгі өріс ішінде жазғанда pdfkit жаңа бет ашпауы үшін өрісті нөлге түсіреміз
    doc.page.margins.bottom = 0;
    doc.font(FONT).fontSize(8).fillColor("#64748b");
    doc.text(`Бет ${i + 1} / ${range.count}`, MARGIN, doc.page.height - MARGIN + 4, { width: W, align: "right", lineBreak: false });
    doc.text(`QazaqCode · ${report.orgName}`, MARGIN, doc.page.height - MARGIN + 4, { width: W / 2, align: "left", lineBreak: false });
  }
  doc.end();
  return done;
}
