// Таза шектеуіш ядросы (Next-ке тәуелсіз): бірлік тест жасауға болады.
export type Bucket = { n: number; reset: number };

export function consume(buckets: Map<string, Bucket>, key: string, limit: number, windowMs: number, now = Date.now()): boolean {
  const b = buckets.get(key);
  if (!b || b.reset < now) { buckets.set(key, { n: 1, reset: now + windowMs }); return true; }
  b.n += 1;
  return b.n <= limit;
}

export function sweep(buckets: Map<string, Bucket>, now = Date.now(), max = 5000): void {
  if (buckets.size > max) for (const [k, v] of buckets) if (v.reset < now) buckets.delete(k);
}

export function pickIp(xff: string | null, realIp: string | null, hops: number): string {
  const parts = (xff ?? "").split(",").map((x) => x.trim()).filter(Boolean);
  if (hops > 0 && parts.length) return parts[Math.max(0, parts.length - hops)].slice(0, 64);
  return (realIp ?? "local").trim().slice(0, 64);
}
