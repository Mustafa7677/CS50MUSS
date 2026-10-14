import { headers } from "next/headers";
import { AppError } from "./errors";
import { consume, sweep, type Bucket } from "./rate-limit-core";

// Жадтағы (процесс ішіндегі) шектеуіш: бір дана үшін жеткілікті. Көп дана/балансировщик болса - Redis не WAF қажет (docs/DEPLOY.md).
const buckets = new Map<string, Bucket>();

/**
 * Клиент IP-і. X-Forwarded-For-дың СОЛ жағын клиент өзі жаза алады, сондықтан оңнан санаймыз:
 * TRUSTED_PROXY_HOPS (әдепкі 1) = сенімді proxy қосқан соңғы жазба. Қосымша тек proxy артында (ішкі желіде) тұруы тиіс
 * және proxy X-Forwarded-For-ды қосуы/қайта жазуы тиіс (Caddy/nginx үлгісі: docs/DEPLOY.md).
 */
export function pickIp(xff: string | null, realIp: string | null, hops: number): string {
  const parts = (xff ?? "").split(",").map((x) => x.trim()).filter(Boolean);
  if (hops > 0 && parts.length) return parts[Math.max(0, parts.length - hops)].slice(0, 64);
  return (realIp ?? "local").trim().slice(0, 64);
}
export async function clientIp(): Promise<string> {
  const h = await headers();
  const hops = Number(process.env.TRUSTED_PROXY_HOPS ?? "1");
  return pickIp(h.get("x-forwarded-for"), h.get("x-real-ip"), Number.isFinite(hops) ? hops : 1);
}

/** Тек тест ортасында өшіріледі (өндірісте RATE_LIMIT_DISABLED ескерілмейді, егер local-auth рұқсаты жоқ болса). */
const disabled = () =>
  process.env.RATE_LIMIT_DISABLED === "yes" && (process.env.NODE_ENV !== "production" || process.env.ALLOW_LOCAL_AUTH_IN_PRODUCTION === "yes");

/** perIp=false: IP-ден тәуелсіз кілт (мысалы, бір e-mail-ге таратылған brute force: X-Forwarded-For ауыстыру көмектеспейді) */
export async function rateLimit(action: string, limit: number, windowMs: number, extraKey = "", perIp = true): Promise<void> {
  if (disabled()) return;
  const now = Date.now();
  if (!consume(buckets, `${action}:${perIp ? await clientIp() : "*"}:${extraKey}`, limit, windowMs, now)) throw new AppError("rate_limited");
  sweep(buckets, now);
}
