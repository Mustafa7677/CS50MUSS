"use server";
import { redirect } from "next/navigation";
import { withUser } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { errorCode } from "@/lib/errors";

/** Хат алудан бас тарту (токен бойынша). GET-ке жанама әсер жоқ: растау батырмасы ғана жазады. redirect try/catch-тан тыс. */
export async function unsubscribeAction(f: FormData): Promise<void> {
  const token = String(f.get("token") ?? "");
  let to = "done";
  try {
    await rateLimit("unsubscribe", 20, 15 * 60_000);
    const r = await withUser(null, (q) => q<{ r: boolean }>("select public.email_unsubscribe($1) as r", [token]));
    if (!r[0]?.r) to = "invalid";
  } catch (e) {
    to = errorCode(e) === "rate_limited" ? "rate" : "invalid";
  }
  redirect(`/unsubscribe/${/^[0-9a-f]{36}$/.test(token) ? token : "invalid"}?s=${to}`);
}
