// Шот нөмірі: жыл-дәйекті, 5 таңбалы (2026-00001). Нөмірді береді дерекқор (issue_invoice, invoice_counters); бұл - пішім/талдау.
export const INVOICE_NO_RE = /^(\d{4})-(\d{5})$/;
export function formatInvoiceNo(year: number, n: number): string {
  if (!Number.isInteger(year) || year < 2000 || year > 9999 || !Number.isInteger(n) || n < 1 || n > 99999) throw new RangeError("invoice no");
  return `${year}-${String(n).padStart(5, "0")}`;
}
export function parseInvoiceNo(s: string): { year: number; n: number } | null {
  const m = INVOICE_NO_RE.exec(s);
  return m ? { year: Number(m[1]), n: Number(m[2]) } : null;
}
/** Келесі нөмір: жыл ауысса қайтадан 00001 */
export function nextInvoiceNo(year: number, last: { year: number; n: number } | null): string {
  return formatInvoiceNo(year, last && last.year === year ? last.n + 1 : 1);
}
