// Күн аралығын тексеру (таза функция: дерекқорсыз тестілеуге болады).
export type Range = { from: string; to: string } | null;
export type RangeResult = { ok: true; range: Range } | { ok: false; error: string };

export const MAX_RANGE_DAYS = 366;
const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MS = 86_400_000;

function toUtc(s: string): number | null {
  const m = ISO.exec(s);
  if (!m) return null;
  const t = Date.UTC(+m[1], +m[2] - 1, +m[3]);
  const d = new Date(t);
  // 2025-02-31 сияқты болмайтын күндерді қабылдамаймыз
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3] ? t : null;
}
const iso = (t: number) => new Date(t).toISOString().slice(0, 10);

/** `from`/`to` (YYYY-MM-DD, екеуі де міндетті емес). Біреуі ғана берілсе: to = бүгін, from = to - 365 күн. */
export function parseRange(fromRaw: string | null | undefined, toRaw: string | null | undefined, today: string = new Date().toISOString().slice(0, 10)): RangeResult {
  const f = (fromRaw ?? "").trim(), t = (toRaw ?? "").trim();
  if (!f && !t) return { ok: true, range: null };
  const fromT = f ? toUtc(f) : null, toT0 = t ? toUtc(t) : null;
  if ((f && fromT == null) || (t && toT0 == null)) return { ok: false, error: "Күн пішімі YYYY-MM-DD болуы тиіс." };
  const toT = toT0 ?? toUtc(today)!;
  const from = fromT ?? toT - (MAX_RANGE_DAYS - 1) * DAY_MS;
  if (from > toT) return { ok: false, error: "Басталу күні аяқталу күнінен кеш болмауы тиіс." };
  if ((toT - from) / DAY_MS + 1 > MAX_RANGE_DAYS) return { ok: false, error: `Аралық ${MAX_RANGE_DAYS} күннен аспауы тиіс.` };
  return { ok: true, range: { from: iso(from), to: iso(toT) } };
}
