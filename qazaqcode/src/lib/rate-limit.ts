import { headers } from "next/headers";
import { AppError } from "./errors";
import { consume, sweep, type Bucket } from "./rate-limit-core";

// Жадтағы (процесс ішіндегі) шектеуіш: бір дана үшін жеткілікті. Көп дана/балансировщик болса - Redis не WAF қажет (docs/DEPLOY.md).
const buckets = new Map<string, Bucket>();

export async function clientIp(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "local").trim();
}

/** Тек тест ортасында өшіріледі (өндірісте RATE_LIMIT_DISABLED ескерілмейді, егер local-auth рұқсаты жоқ болса). */
const disabled = () =>
  process.env.RATE_LIMIT_DISABLED === "yes" && (process.env.NODE_ENV !== "production" || process.env.ALLOW_LOCAL_AUTH_IN_PRODUCTION === "yes");

export async function rateLimit(action: string, limit: number, windowMs: number, extraKey = ""): Promise<void> {
  if (disabled()) return;
  const now = Date.now();
  if (!consume(buckets, `${action}:${await clientIp()}:${extraKey}`, limit, windowMs, now)) throw new AppError("rate_limited");
  sweep(buckets, now);
}
