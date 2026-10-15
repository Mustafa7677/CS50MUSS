"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { currentUserId } from "@/lib/auth/session";
import { withUser } from "@/lib/db";
import { AppError, errorMessage, type ActionResult } from "@/lib/errors";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
async function uid(): Promise<string> {
  const u = await currentUserId();
  if (!u) throw new AppError("unauthenticated");
  return u;
}

export async function setLeadStatusAction(_: ActionResult | null, f: FormData): Promise<ActionResult> {
  try {
    const p = z.object({
      id: z.string().uuid(), status: z.enum(["new", "contacted", "demo", "pilot", "won", "lost"]), notes: z.string().max(2000, "Жазба 2000 таңбадан аспауы тиіс.").nullable(),
    }).parse({ id: str(f, "id"), status: str(f, "status"), notes: str(f, "notes") || null });
    await withUser(await uid(), (q) => q("select public.set_lead_status($1,$2,$3)", [p.id, p.status, p.notes]));
    revalidatePath("/admin/leads");
    return { ok: true, message: "Сақталды." };
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, error: e.issues[0]?.message ?? "Деректер дұрыс емес." };
    return { ok: false, error: errorMessage(e) };
  }
}

export async function deleteLeadAction(f: FormData): Promise<void> {
  const id = z.string().uuid().parse(str(f, "id"));
  await withUser(await uid(), (q) => q("select public.delete_lead($1)", [id]));
  revalidatePath("/admin/leads");
}
