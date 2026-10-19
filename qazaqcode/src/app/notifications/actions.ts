"use server";
import { revalidatePath } from "next/cache";
import { currentUserId } from "@/lib/auth/session";
import { withUser } from "@/lib/db";
import { AppError, errorMessage, type ActionResult } from "@/lib/errors";
import { getT } from "@/lib/i18n";

/** Барлық оқылмаған хабарландыруды оқылды деп белгілеу. */
export async function markAllReadAction(_?: ActionResult | null, __?: FormData): Promise<ActionResult> { const t = await getT();
  try {
    const u = await currentUserId();
    if (!u) throw new AppError("unauthenticated");
    await withUser(u, (q) => q("select public.mark_notifications_read(null)"));
    revalidatePath("/notifications");
    revalidatePath("/", "layout");
    return { ok: true, message: t("Барлығы оқылды деп белгіленді.") };
  } catch (e) {
    return { ok: false, error: errorMessage(e) };
  }
}
