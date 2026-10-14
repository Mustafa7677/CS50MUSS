import { pool } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = { "content-type": "application/json", "cache-control": "no-store" };

/** Жария health-check (Docker HEALTHCHECK, баланстаушы): құпиясыз, тек күй. DB қатесінің мәтіні сыртқа шықпайды. */
export async function GET() {
  try {
    const t = await Promise.race([
      pool().query("select 1"),
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timeout")), 3000)),
    ]);
    void t;
    return new Response(JSON.stringify({ status: "ok", db: "ok" }), { status: 200, headers });
  } catch (e) {
    console.error("[qazaqcode] health: DB қолжетімсіз:", (e as Error).message);
    return new Response(JSON.stringify({ status: "degraded", db: "down" }), { status: 503, headers });
  }
}
