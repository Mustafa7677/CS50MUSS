import { headers } from "next/headers";
import { AppError } from "./errors";

// Жадтағы (процесс ішіндегі) шектеуіш: бір дана үшін жеткілікті. Көп дана/балансировщик болса - Redis не WAF қажет (docs/DEPLOY.md).
const buckets = new Map<string, { n: number; reset: number }>();

export async function clientIp(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "local").trim();
}

export async function rateLimit(action: string, limit: number, windowMs: number, extraKey = ""): Promise<void> {
  const key = `${action}:${await clientIp()}:${extraKey}`;
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < now) { buckets.set(key, { n: 1, reset: now + windowMs }); }
  else if (++b.n > limit) throw new AppError("rate_limited");
  if (buckets.size > 5000) for (const [k, v] of buckets) if (v.reset < now) buckets.delete(k);
}
export const __resetRateLimits = () => buckets.clear();
