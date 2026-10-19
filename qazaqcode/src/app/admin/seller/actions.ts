"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { currentUserId } from "@/lib/auth/session";
import { withUser } from "@/lib/db";
import { AppError, errorMessage, type ActionResult } from "@/lib/errors";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

/** Сатушы (платформа иесі) реквизиттері. Иесі өзі енгізеді: кодта/миграцияда дерек жоқ. */
export async function saveSellerAction(_: ActionResult | null, f: FormData): Promise<ActionResult> {
  try {
    const u = await currentUserId();
    if (!u) throw new AppError("unauthenticated");
    const vatPayer = f.get("vat_payer") === "on";
    const p = z.object({
      legal_name: z.string().min(2, "Заңды атауын толтырыңыз.").max(200),
      bin_iin: z.string().regex(/^\d{12}$/, "БИН/ЖСН: 12 сан болуы тиіс."),
      address: z.string().min(5, "Мекенжайын толтырыңыз.").max(300),
      bank_name: z.string().min(2, "Банк атауын толтырыңыз.").max(160),
      bik: z.string().toUpperCase().regex(/^[A-Z0-9]{8,11}$/, "БИК: 8-11 латын әріп не сан."),
      iik: z.string().toUpperCase().regex(/^KZ\d{2}[0-9A-Z]{16}$/, "ИИК/ЖСК: KZ-мен басталатын 20 таңба."),
      kbe: z.string().regex(/^\d{2}$/, "КБе: 2 сан болуы тиіс."),
      director: z.string().min(2, "Басшының аты-жөнін толтырыңыз.").max(160),
      terms: z.coerce.number().int().min(1, "Төлеу мерзімі 1-90 күн.").max(90, "Төлеу мерзімі 1-90 күн."),
      vat_cert: z.string().max(80), email: z.union([z.literal(""), z.string().email().max(160)]), phone: z.string().max(40),
    }).parse({ legal_name: str(f, "legal_name"), bin_iin: str(f, "bin_iin"), address: str(f, "address"), bank_name: str(f, "bank_name"), bik: str(f, "bik"),
      iik: str(f, "iik").replace(/\s/g, ""), kbe: str(f, "kbe"), director: str(f, "director_name"), terms: str(f, "payment_terms_days"),
      vat_cert: str(f, "vat_cert"), email: str(f, "contact_email"), phone: str(f, "contact_phone") });
    if (vatPayer && p.vat_cert.length < 2) return { ok: false, error: "ҚҚС төлеушісі болса, ҚҚС бойынша тіркеу куәлігінің деректерін енгізіңіз." };
    await withUser(u, (q) => q("select public.set_seller_profile($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)",
      [p.legal_name, p.bin_iin, p.address, p.bank_name, p.bik, p.iik, p.kbe, vatPayer, p.vat_cert || null, p.director, p.terms, p.email || null, p.phone || null]));
    revalidatePath("/admin/seller"); revalidatePath("/admin/orders");
    return { ok: true, message: "Сатушы реквизиттері сақталды." };
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, error: e.issues[0]?.message ?? "Деректер дұрыс емес." };
    return { ok: false, error: errorMessage(e) };
  }
}
