"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { currentUserId } from "@/lib/auth/session";
import { withUser } from "@/lib/db";
import { AppError, errorMessage, type ActionResult } from "@/lib/errors";
import { parseAmountToTiyn, parsePercentToBp } from "@/lib/billing/money";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
async function uid(): Promise<string> {
  const u = await currentUserId();
  if (!u) throw new AppError("unauthenticated");
  return u;
}

export async function savePriceAction(_: ActionResult | null, f: FormData): Promise<ActionResult> {
  try {
    const tiyn = parseAmountToTiyn(str(f, "price"));
    if (tiyn == null) return { ok: false, error: "Бағаны дұрыс енгізіңіз (мысалы 1 250 000,00)." };
    const p = z.object({
      id: z.union([z.literal(""), z.string().uuid()]), plan: z.enum(["starter", "pro", "enterprise"]),
      months: z.coerce.number().int().min(1, "Мерзім 1-60 ай.").max(60, "Мерзім 1-60 ай."),
      limit: z.coerce.number().int().min(1, "Оқушы лимиті 1-100000.").max(100000, "Оқушы лимиті 1-100000."),
      currency: z.enum(["KZT", "USD", "EUR", "RUB"]), mode: z.enum(["none", "included", "added"]),
      from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Жарамдылық басталу күнін толтырыңыз."), until: z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]),
    }).parse({ id: str(f, "id"), plan: str(f, "plan"), months: str(f, "months"), limit: str(f, "student_limit"), currency: str(f, "currency"), mode: str(f, "vat_mode"),
      from: str(f, "valid_from"), until: str(f, "valid_until") });
    const bp = p.mode === "none" ? 0 : parsePercentToBp(str(f, "vat_rate"));
    if (bp == null || (p.mode !== "none" && bp === 0)) return { ok: false, error: "ҚҚС ставкасын енгізіңіз (мысалы 12 не 12,5)." };
    await withUser(await uid(), (q) => q("select public.set_price($1,$2::public.license_plan,$3,$4,$5,$6,$7,$8,$9::date,$10::date,$11)",
      [p.id || null, p.plan, p.months, p.limit, tiyn, p.currency, p.mode, bp, p.from, p.until || null, f.get("active") === "on"]));
    revalidatePath("/admin/prices"); revalidatePath("/school/licence/order");
    return { ok: true, message: "Баға сақталды." };
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, error: e.issues[0]?.message ?? "Деректер дұрыс емес." };
    return { ok: false, error: errorMessage(e) };
  }
}

export async function deletePriceAction(f: FormData): Promise<void> {
  const id = z.string().uuid().parse(str(f, "id"));
  await withUser(await uid(), (q) => q("select public.delete_price($1)", [id]));
  revalidatePath("/admin/prices"); revalidatePath("/school/licence/order");
}
