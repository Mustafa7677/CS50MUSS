// Ақша есебі: ТЕК бүтін тиынмен (floating point жоқ). DB-дегі public.vat_split функциясымен бірдей ереже (half up).
export type VatMode = "none" | "included" | "added";
export type Currency = "KZT" | "USD" | "EUR" | "RUB";
export const CURRENCIES: readonly Currency[] = ["KZT", "USD", "EUR", "RUB"];
export const VAT_MODES: readonly VatMode[] = ["none", "included", "added"];
export const MAX_TIYN = 1_000_000_000_000;

export type Split = { net: number; vat: number; total: number };

/**
 * ҚҚС бөлу. bp - ставка % x 100 (1200 = 12,00%).
 *  none: net = P, vat = 0 | added: vat = round(P*r), total = P + vat | included: vat = round(P*r/(1+r)), net = P - vat.
 * Дөңгелектеу - жартысынан жоғары (0,5 тиын -> 1 тиын).
 */
export function vatSplit(priceTiyn: number, mode: VatMode, bp: number): Split {
  if (!Number.isSafeInteger(priceTiyn) || priceTiyn < 0 || priceTiyn > MAX_TIYN) throw new RangeError("price");
  if (!Number.isInteger(bp) || bp < 0 || bp > 5000) throw new RangeError("bp");
  const P = BigInt(priceTiyn), R = BigInt(bp);
  if (mode === "none") return { net: priceTiyn, vat: 0, total: priceTiyn };
  if (mode === "added") {
    const v = (P * R * 2n + 10000n) / 20000n;
    return { net: priceTiyn, vat: Number(v), total: Number(P + v) };
  }
  if (mode === "included") {
    const d = 10000n + R;
    const v = (P * R * 2n + d) / (2n * d);
    return { net: Number(P - v), vat: Number(v), total: priceTiyn };
  }
  throw new RangeError("mode");
}

const NBSP = " ";
const SYMBOL: Record<string, string> = { KZT: "₸", USD: "$", EUR: "€", RUB: "₽" };
const group = (s: string) => s.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);

/** 1234567 тиын -> «12 345,67 ₸» (KZT). Белгісіз валюта коды өзі шығады. */
export function formatMoney(tiyn: number | string | bigint, currency: string = "KZT", opts: { symbol?: boolean } = {}): string {
  const t = BigInt(tiyn);
  const neg = t < 0n;
  const a = neg ? -t : t;
  const whole = group((a / 100n).toString());
  const frac = (a % 100n).toString().padStart(2, "0");
  const cur = opts.symbol === false ? currency : (SYMBOL[currency] ?? currency);
  return `${neg ? "-" : ""}${whole},${frac}${NBSP}${cur}`;
}

/** «1 234 567,89» / «1234567.8» -> тиын; артық таңба, 2-ден артық ондық, теріс/нөл -> null */
export function parseAmountToTiyn(input: string): number | null {
  const s = input.replace(/[\s ]/g, "").replace(",", ".");
  if (!/^\d{1,13}(\.\d{1,2})?$/.test(s)) return null;
  const [w, f = ""] = s.split(".");
  const t = Number(w) * 100 + Number(f.padEnd(2, "0"));
  return Number.isSafeInteger(t) && t >= 1 && t <= MAX_TIYN ? t : null;
}

/** «12» / «12,5» -> 1200 / 1250; 0..50% */
export function parsePercentToBp(input: string): number | null {
  const s = input.replace(/\s/g, "").replace(",", ".").replace(/%$/, "");
  if (!/^\d{1,2}(\.\d{1,2})?$/.test(s)) return null;
  const [w, f = ""] = s.split(".");
  const bp = Number(w) * 100 + Number(f.padEnd(2, "0"));
  return bp >= 0 && bp <= 5000 ? bp : null;
}
export const formatPercent = (bp: number) => (bp / 100).toString().replace(".", ",") + "%";
