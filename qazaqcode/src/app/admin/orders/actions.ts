"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { currentUserId } from "@/lib/auth/session";
import { withUser } from "@/lib/db";
import { AppError, errorMessage, type ActionResult } from "@/lib/errors";
import { parseAmountToTiyn, parsePercentToBp } from "@/lib/billing/money";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const uuid = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Күнді толтырыңыз.");
async function uid(): Promise<string> {
  const u = await currentUserId();
  if (!u) throw new AppError("unauthenticated");
  return u;
}
const done = () => { revalidatePath("/admin/orders"); revalidatePath("/school/licence/order"); revalidatePath("/school/licence"); };
const fail = (e: unknown): ActionResult => e instanceof z.ZodError ? { ok: false, error: e.issues[0]?.message ?? "Деректер дұрыс емес." } : { ok: false, error: errorMessage(e) };

/** Баға тізімінен ұсыныс (баға жоқ болса price_not_set) */
export async function quoteFromListAction(_: ActionResult | null, f: FormData): Promise<ActionResult> {
  try {
    const p = z.object({ id: uuid, note: z.string().max(1000) }).parse({ id: str(f, "id"), note: str(f, "note") });
    await withUser(await uid(), (q) => q("select public.quote_order($1, null, null, null, null, $2)", [p.id, p.note || null]));
    done();
    return { ok: true, message: "Баға ұсынылды." };
  } catch (e) { return fail(e); }
}

/** Келісілген бағамен ұсыныс (валюта, ҚҚС режимі ашық көрсетіледі) */
export async function quoteCustomAction(_: ActionResult | null, f: FormData): Promise<ActionResult> {
  try {
    const tiyn = parseAmountToTiyn(str(f, "amount"));
    if (tiyn == null) return { ok: false, error: "Соманы дұрыс енгізіңіз (мысалы 1 250 000,00; 2 таңбаға дейін ондық)." };
    const p = z.object({ id: uuid, currency: z.enum(["KZT", "USD", "EUR", "RUB"]), mode: z.enum(["none", "included", "added"]), note: z.string().max(1000) })
      .parse({ id: str(f, "id"), currency: str(f, "currency"), mode: str(f, "vat_mode"), note: str(f, "note") });
    const bp = p.mode === "none" ? 0 : parsePercentToBp(str(f, "vat_rate"));
    if (bp == null || (p.mode !== "none" && bp === 0)) return { ok: false, error: "ҚҚС ставкасын енгізіңіз (мысалы 12 не 12,5)." };
    await withUser(await uid(), (q) => q("select public.quote_order($1,$2,$3,$4,$5,$6)", [p.id, tiyn, p.currency, p.mode, bp, p.note || null]));
    done();
    return { ok: true, message: "Келісілген баға ұсынылды." };
  } catch (e) { return fail(e); }
}

export async function issueInvoiceAction(f: FormData): Promise<void> {
  const id = uuid.parse(str(f, "id"));
  await withUser(await uid(), (q) => q("select public.issue_invoice($1)", [id]));
  done();
}

export async function markPaidAction(_: ActionResult | null, f: FormData): Promise<ActionResult> {
  try {
    const p = z.object({ id: uuid, ref: z.string().min(1, "Төлем құжатының нөмірін енгізіңіз.").max(100), date }).parse({ id: str(f, "id"), ref: str(f, "ref"), date: str(f, "date") });
    await withUser(await uid(), (q) => q("select public.mark_paid($1,$2,$3::date)", [p.id, p.ref, p.date]));
    done();
    return { ok: true, message: "Төлем расталды." };
  } catch (e) { return fail(e); }
}

export async function activateOrderAction(f: FormData): Promise<void> {
  const id = uuid.parse(str(f, "id"));
  await withUser(await uid(), (q) => q("select public.activate_order($1)", [id]));
  done(); revalidatePath("/admin");
}

export async function rejectOrderAction(_: ActionResult | null, f: FormData): Promise<ActionResult> {
  try {
    const p = z.object({ id: uuid, note: z.string().max(1000, "Ескертпе 1000 таңбадан аспауы тиіс.") }).parse({ id: str(f, "id"), note: str(f, "note") });
    await withUser(await uid(), (q) => q("select public.reject_order($1,$2)", [p.id, p.note || null]));
    done();
    return { ok: true, message: "Тапсырыс қабылданбады." };
  } catch (e) { return fail(e); }
}
