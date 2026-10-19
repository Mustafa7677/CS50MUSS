"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSchoolAdmin } from "@/lib/context";
import { withUser } from "@/lib/db";
import { AppError, errorMessage, type ActionResult } from "@/lib/errors";
import { rateLimit } from "@/lib/rate-limit";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const uuid = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
const digits = (n: number, label: string) => z.string().regex(new RegExp(`^\\d{${n}}$`), `${label}: ${n} сан болуы тиіс.`);

/** Төлем реквизиттерін сақтау (иесі ұйымның өзі енгізеді; жалған әдепкі мән жоқ) */
export async function saveBillingProfileAction(_: ActionResult | null, f: FormData): Promise<ActionResult> {
  const ctx = await requireSchoolAdmin();
  try {
    const p = z.object({
      legal_name: z.string().min(2, "Заңды атауын толтырыңыз.").max(200),
      bin_iin: digits(12, "БИН/ЖСН"),
      address: z.string().min(5, "Мекенжайын толтырыңыз.").max(300),
      bank_name: z.string().min(2, "Банк атауын толтырыңыз.").max(160),
      bik: z.string().toUpperCase().regex(/^[A-Z0-9]{8,11}$/, "БИК: 8-11 латын әріп не сан."),
      iik: z.string().toUpperCase().regex(/^KZ\d{2}[0-9A-Z]{16}$/, "ИИК/ЖСК: KZ-мен басталатын 20 таңба."),
      kbe: digits(2, "КБе"),
      contact_name: z.string().max(160), contact_email: z.union([z.literal(""), z.string().email().max(160)]), contact_phone: z.string().max(40),
    }).parse({
      legal_name: str(f, "legal_name"), bin_iin: str(f, "bin_iin"), address: str(f, "address"), bank_name: str(f, "bank_name"),
      bik: str(f, "bik"), iik: str(f, "iik").replace(/\s/g, ""), kbe: str(f, "kbe"),
      contact_name: str(f, "contact_name"), contact_email: str(f, "contact_email"), contact_phone: str(f, "contact_phone"),
    });
    await withUser(ctx.userId, (q) => q("select public.set_billing_profile($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)",
      [ctx.active.org_id, p.legal_name, p.bin_iin, p.address, p.bank_name, p.bik, p.iik, p.kbe, p.contact_name || null, p.contact_email || null, p.contact_phone || null]));
    revalidatePath("/school/licence/order");
    return { ok: true, message: "Реквизиттер сақталды." };
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, error: e.issues[0]?.message ?? errorMessage(new AppError("validation")) };
    return { ok: false, error: errorMessage(e) };
  }
}

export async function requestLicenceAction(_: ActionResult | null, f: FormData): Promise<ActionResult> {
  const ctx = await requireSchoolAdmin();
  try {
    const p = z.object({
      plan: z.enum(["starter", "pro", "enterprise"]),
      months: z.coerce.number().int().min(1, "Мерзім 1-60 ай.").max(60, "Мерзім 1-60 ай."),
      students: z.coerce.number().int().min(1, "Оқушы саны 1-ден кем емес.").max(100000, "Оқушы саны тым көп."),
      teachers: z.coerce.number().int().min(1, "Мұғалім саны 1-ден кем емес.").max(10000, "Мұғалім саны тым көп."),
      note: z.string().max(1000, "Ескертпе 1000 таңбадан аспауы тиіс."),
    }).parse({ plan: str(f, "plan"), months: str(f, "months"), students: str(f, "students"), teachers: str(f, "teachers"), note: str(f, "note") });
    await rateLimit("order-request", 10, 15 * 60_000, ctx.userId);
    await withUser(ctx.userId, (q) => q("select public.request_licence($1,$2::public.license_plan,$3,$4,$5,$6)",
      [ctx.active.org_id, p.plan, p.months, p.students, p.teachers, p.note || null]));
    revalidatePath("/school/licence/order"); revalidatePath("/admin/orders");
    return { ok: true, message: "Тапсырыс жіберілді. Платформа әкімшісі баға ұсынып, шот береді." };
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, error: e.issues[0]?.message ?? errorMessage(new AppError("validation")) };
    return { ok: false, error: errorMessage(e) };
  }
}

export async function cancelOrderAction(f: FormData): Promise<void> {
  const ctx = await requireSchoolAdmin();
  const id = uuid.parse(str(f, "id"));
  await withUser(ctx.userId, (q) => q("select public.cancel_order($1)", [id]));
  revalidatePath("/school/licence/order"); revalidatePath("/admin/orders");
}
