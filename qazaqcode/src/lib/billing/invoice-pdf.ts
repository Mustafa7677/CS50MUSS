import path from "node:path";
import PDFDocument from "pdfkit";
import { formatMoney, formatPercent } from "./money";
import type { Requisites } from "../billing/labels";
import { PLAN_LABEL } from "../format";

const FONT = path.join(process.cwd(), "assets", "fonts", "DejaVuSans.ttf");
const FONT_BOLD = path.join(process.cwd(), "assets", "fonts", "DejaVuSans-Bold.ttf");
const M = 42;
const INK = "#0f172a", MUTED = "#475569", LINE = "#94a3b8";

export type InvoiceData = {
  invoice_no: string; invoice_date: string; due_date: string; plan: string; months: number; students: number; teachers: number;
  currency: string; vat_mode: "none" | "included" | "added"; vat_rate_bp: number; price_tiyn: number | string;
  net_tiyn: number | string; vat_tiyn: number | string; total_tiyn: number | string;
  buyer: Requisites; seller: Requisites;
};

/** 2026-10-14 -> 14.10.2026 */
export const ruDate = (iso: string) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso); return m ? `${m[3]}.${m[2]}.${m[1]}` : iso; };

/** «Төлем шоты / Счёт на оплату» (A4, DejaVu Sans: қазақ әріптері). Деректің бәрі шот снапшотынан: баға тізімі кейін өзгерсе де шот өзгермейді. */
export async function buildInvoicePdf(d: InvoiceData): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", margin: M, font: FONT, bufferPages: true,
    info: { Title: `Төлем шоты № ${d.invoice_no}`, Author: d.seller.legal_name, Subject: "Төлем шоты / Счёт на оплату" } });
  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((res, rej) => { doc.on("end", () => res(Buffer.concat(chunks))); doc.on("error", rej); });
  const W = doc.page.width - M * 2;
  const money = (v: number | string) => formatMoney(v, d.currency);

  // 1) Сатушының банк деректері (рамка)
  const s = d.seller;
  doc.font(FONT_BOLD).fontSize(9).fillColor(INK);
  const boxTop = M;
  const bank = [
    [`Бенефициар / Бенефициар: ${s.legal_name}`, `БИН/ЖСН: ${s.bin_iin}`],
    [`Банк бенефициара: ${s.bank_name}`, `БИК: ${s.bik}`],
    [`ИИК / ЖСК: ${s.iik}`, `КБе: ${s.kbe}`],
  ];
  let y = boxTop;
  doc.rect(M, boxTop, W, 3 * 22).lineWidth(0.6).strokeColor(LINE).stroke();
  for (const [a, b] of bank) {
    doc.font(FONT).fontSize(9).fillColor(INK).text(a, M + 6, y + 6, { width: W * 0.62 - 12, lineBreak: false, ellipsis: true });
    doc.text(b, M + W * 0.62, y + 6, { width: W * 0.38 - 6, lineBreak: false, ellipsis: true });
    y += 22;
    if (y < boxTop + 66) doc.moveTo(M, y).lineTo(M + W, y).lineWidth(0.4).strokeColor(LINE).stroke();
  }

  // 2) Тақырып
  y = boxTop + 66 + 22;
  doc.font(FONT_BOLD).fontSize(15).fillColor(INK).text(`Төлем шоты / Счёт на оплату № ${d.invoice_no} от ${ruDate(d.invoice_date)}`, M, y, { width: W });
  doc.moveDown(0.2);
  doc.moveTo(M, doc.y + 2).lineTo(M + W, doc.y + 2).lineWidth(1.4).strokeColor(INK).stroke();
  doc.moveDown(0.8);

  // 3) Тараптар
  const yPartyStart = doc.y;
  doc.font(FONT_BOLD).fontSize(8.5).fillColor(MUTED).text("Орындаушы / Исполнитель:", M, yPartyStart, { width: 128 });
  doc.y = yPartyStart; doc.x = M;
  const partyBody = (r: Requisites, withVat: boolean) => {
    doc.font(FONT).fontSize(9.5).fillColor(INK);
    const lines = [r.legal_name, `БИН/ЖСН: ${r.bin_iin}`, `Мекенжайы / Адрес: ${r.address}`,
      ...(withVat ? [r.vat_payer ? `ҚҚС төлеушісі, куәлік: ${r.vat_cert}` : "ҚҚС төлеушісі емес"] : []),
      ...(!withVat ? [`Банк: ${r.bank_name}, БИК ${r.bik}`, `ИИК / ЖСК: ${r.iik}, КБе ${r.kbe}`] : []),
      ...(!withVat && r.contact_name ? [`Байланыс: ${r.contact_name}${r.contact_phone ? `, ${r.contact_phone}` : ""}`] : [])];
    let yy = doc.y;
    for (const l of lines) { doc.text(l, M + 135, yy, { width: W - 135 }); yy = doc.y; }
    doc.y = yy + 8;
  };
  partyBody(s, true);
  const yBuyer = doc.y;
  doc.font(FONT_BOLD).fontSize(8.5).fillColor(MUTED).text("Тапсырыс беруші / Заказчик:", M, yBuyer, { width: 128 });
  doc.y = yBuyer;
  partyBody(d.buyer, false);
  doc.moveDown(0.4);

  // 4) Позициялар кестесі
  const cols = [{ w: 26, h: "№", a: "left" }, { w: W - 26 - 40 - 90 - 95, h: "Атауы / Наименование", a: "left" }, { w: 40, h: "Саны", a: "right" },
    { w: 90, h: "Бағасы / Цена", a: "right" }, { w: 95, h: "Сомасы / Сумма", a: "right" }] as const;
  const plan = PLAN_LABEL[d.plan] ?? d.plan;
  const name = `QazaqCode платформасына лицензия: ${plan} пакеті, ${d.months} ай, ${d.students} оқушыға дейін, ${d.teachers} мұғалімге дейін / Лицензия на платформу QazaqCode: пакет ${plan}, ${d.months} мес., до ${d.students} учеников, до ${d.teachers} учителей`;
  // 'included' режимінде баға ҚҚС-пен, 'added'/'none' режимінде ҚҚС-сыз көрсетіледі
  const unit = d.vat_mode === "included" ? d.total_tiyn : d.net_tiyn;
  const rowH = doc.heightOfString(name, { width: cols[1].w - 8 }) + 10;
  let x = M, ty = doc.y;
  doc.rect(M, ty, W, 20).fillAndStroke("#e2e8f0", LINE);
  doc.font(FONT_BOLD).fontSize(8.5).fillColor(INK);
  for (const c of cols) { doc.text(c.h, x + 4, ty + 6, { width: c.w - 8, align: c.a }); x += c.w; }
  ty += 20;
  doc.rect(M, ty, W, rowH).lineWidth(0.6).strokeColor(LINE).stroke();
  doc.font(FONT).fontSize(8.5).fillColor(INK);
  x = M;
  const cells = ["1", name, "1", money(unit), money(unit)];
  cols.forEach((c, i) => { doc.text(cells[i], x + 4, ty + 5, { width: c.w - 8, align: c.a }); x += c.w; });
  ty += rowH;

  // 5) Жиынтық
  doc.y = ty + 10;
  const total = (label: string, value: string, bold = false) => {
    const yy = doc.y;
    doc.font(bold ? FONT_BOLD : FONT).fontSize(bold ? 10 : 9.5).fillColor(INK);
    doc.text(label, M, yy, { width: W - 120, align: "right" });
    doc.text(value, M + W - 115, yy, { width: 115, align: "right" });
    doc.y = yy + (bold ? 17 : 15);
  };
  if (d.vat_mode === "none") {
    total("Жиыны / Итого:", money(d.total_tiyn));
    total("ҚҚС / НДС:", "ҚҚС-сыз / без НДС");
  } else if (d.vat_mode === "added") {
    total("Жиыны (ҚҚС-сыз) / Итого без НДС:", money(d.net_tiyn));
    total(`ҚҚС / НДС ${formatPercent(d.vat_rate_bp)}:`, money(d.vat_tiyn));
  } else {
    total("Жиыны / Итого:", money(d.total_tiyn));
    total(`оның ішінде ҚҚС / в т.ч. НДС ${formatPercent(d.vat_rate_bp)}:`, money(d.vat_tiyn));
  }
  total("Төлеуге барлығы / Всего к оплате:", money(d.total_tiyn), true);
  doc.moveDown(0.4);
  doc.font(FONT).fontSize(9.5).fillColor(INK).text(`Барлық атау саны 1, сомасы ${money(d.total_tiyn)} / Всего наименований 1, на сумму ${money(d.total_tiyn)}`, M, doc.y, { width: W });
  doc.moveDown(0.8);

  // 6) Төлем мақсаты, мерзімі
  doc.font(FONT_BOLD).fontSize(9.5).text("Төлем мақсаты / Назначение платежа: ", M, doc.y, { continued: true });
  doc.font(FONT).text(`QazaqCode лицензиясы үшін төлем, шот № ${d.invoice_no} от ${ruDate(d.invoice_date)}. Оплата лицензии QazaqCode, счёт № ${d.invoice_no} от ${ruDate(d.invoice_date)}.`, { width: W });
  doc.moveDown(0.4);
  doc.font(FONT_BOLD).text("Төлеу мерзімі / Срок оплаты: ", M, doc.y, { continued: true });
  doc.font(FONT).text(`${ruDate(d.due_date)} дейін / до ${ruDate(d.due_date)}`, { width: W });
  doc.moveDown(0.4);
  doc.font(FONT).fontSize(8.5).fillColor(MUTED).text("Төлем банк аударымымен жүргізіледі. Төлем расталған соң лицензия белсендіріледі. / Оплата банковским переводом; лицензия активируется после подтверждения оплаты.", M, doc.y, { width: W });

  // 7) Қол
  doc.moveDown(2);
  const sy = doc.y;
  doc.font(FONT_BOLD).fontSize(9.5).fillColor(INK).text("Басшы / Руководитель", M, sy, { width: 130 });
  doc.moveTo(M + 135, sy + 12).lineTo(M + 290, sy + 12).lineWidth(0.6).strokeColor(INK).stroke();
  doc.font(FONT).text(`/ ${s.director_name ?? ""} /`, M + 300, sy, { width: W - 300 });

  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(range.start + i);
    doc.page.margins.bottom = 0;   // төменгі жол шетте тұр: әйтпесе pdfkit бос бет қосады
    doc.font(FONT).fontSize(8).fillColor(MUTED).text(`Шот № ${d.invoice_no} · ${i + 1}/${range.count}`, M, doc.page.height - M + 8, { width: W, align: "center", lineBreak: false });
  }
  doc.end();
  return done;
}
