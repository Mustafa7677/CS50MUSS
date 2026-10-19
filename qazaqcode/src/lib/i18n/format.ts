// Күн, уақыт, сан форматтау (сервер де, клиент те бірдей нәтиже береді: уақыт белдеуі Asia/Almaty бекітілген).
import type { Locale } from "./core";

export const TIME_ZONE = "Asia/Almaty";

const MONTHS: Record<Locale, string[]> = {
  kk: ["қаңтар", "ақпан", "наурыз", "сәуір", "мамыр", "маусым", "шілде", "тамыз", "қыркүйек", "қазан", "қараша", "желтоқсан"],
  ru: ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"],
};

let dtf: Intl.DateTimeFormat | undefined;
function parts(x: Date) {
  dtf ??= new Intl.DateTimeFormat("en-GB", { timeZone: TIME_ZONE, hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
  const o: Record<string, string> = {};
  for (const p of dtf.formatToParts(x)) o[p.type] = p.value;
  return { y: Number(o.year), m: Number(o.month), d: Number(o.day), hh: o.hour.padStart(2, "0"), mm: o.minute.padStart(2, "0") };
}

export function fmtDate(d: string | Date | null | undefined, withTime = false, locale: Locale = "kk"): string {
  if (!d) return "-";
  const x = typeof d === "string" ? new Date(d) : d;
  if (isNaN(+x)) return "-";
  const p = parts(x);
  const date = `${p.d} ${MONTHS[locale][p.m - 1]} ${p.y}`;
  return withTime ? `${date}, ${p.hh}:${p.mm}` : date;
}
const dec = (s: string, locale: Locale) => (locale === "ru" ? s.replace(".", ",") : s);
export const fmtPct = (n: number | string | null | undefined, locale: Locale = "kk") => (n == null || n === "" ? "-" : `${Math.round(Number(n))}%`);
export const fmtNum = (n: number | string | null | undefined, locale: Locale = "kk") => (n == null ? "-" : dec(String(Number(n)), locale));
export function fmtDuration(sec: number | string | null | undefined, locale: Locale = "kk"): string {
  const s = Number(sec ?? 0);
  if (!s) return "-";
  const u = locale === "ru" ? { s: "с", m: "мин", h: "ч" } : { s: "с", m: "мин", h: "сағ" };
  if (s < 60) return `${s} ${u.s}`;
  const m = Math.round(s / 60);
  return m < 60 ? `${m} ${u.m}` : `${Math.floor(m / 60)} ${u.h} ${m % 60} ${u.m}`;
}
