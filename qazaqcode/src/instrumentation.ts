// Сервер іске қосылғанда орта айнымалылары тексеріледі: өндірісте әлсіз JWT құпиясы, HTTP APP_URL,
// Secure емес cookie не рұқсатсыз local auth болса процесс СТАРТ ІСТЕМЕЙДІ (src/lib/env.ts).
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.NEXT_PHASE === "phase-production-build") return;
  const { env } = await import("./lib/env");
  try {
    env();
  } catch (e) {
    console.error("[qazaqcode] ОРТА АЙНЫМАЛЫЛАРЫ ЖАРАМСЫЗ - сервер тоқтатылды:", (e as Error).message);
    process.exit(1);
  }
}
