import { withUser } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** RFC 8058 one-click: пошта клиенті `List-Unsubscribe-Post: List-Unsubscribe=One-Click` бойынша POST жібереді. GET жанама әсерсіз (405). */
export async function POST(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  try {
    await rateLimit("unsubscribe", 60, 15 * 60_000);
    const r = await withUser(null, (q) => q<{ r: boolean }>("select public.email_unsubscribe($1) as r", [token]));
    return new Response(null, { status: r[0]?.r ? 200 : 404, headers: { "cache-control": "no-store" } });
  } catch {
    return new Response(null, { status: 429, headers: { "cache-control": "no-store" } });
  }
}
