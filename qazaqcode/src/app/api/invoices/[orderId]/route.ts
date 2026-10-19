import { getContext } from "@/lib/context";
import { withUser } from "@/lib/db";
import { errorCode } from "@/lib/errors";
import { rateLimit } from "@/lib/rate-limit";
import { buildInvoicePdf, type InvoiceData } from "@/lib/billing/invoice-pdf";
import type { Requisites } from "@/lib/billing/labels";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const text = (status: number, body: string) =>
  new Response(body, { status, headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });

type Row = {
  status: string; invoice_no: string | null; invoice_date: string | null; due_date: string | null; plan: string; months: number; students: number; teachers: number;
  currency: string | null; vat_mode: InvoiceData["vat_mode"] | null; vat_rate_bp: number | null; price_tiyn: string | null;
  net_tiyn: string | null; vat_tiyn: string | null; total_tiyn: string | null; buyer_snapshot: Requisites | null; seller_snapshot: Requisites | null;
};

/**
 * Төлем шоты (PDF). Тек тапсырыс иесі ұйымның мектеп әкімшісі не SUPER ADMIN жүктей алады.
 * Құқықты дерекқор (RLS) шешеді: басқа ұйымның тапсырысы "табылмады" (404) - оның бар-жоғы білінбейді.
 * Барлық дерек шот снапшотынан алынады (баға тізімі/профиль кейін өзгерсе де шот өзгермейді).
 */
export async function GET(_req: Request, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const ctx = await getContext();
    if (!ctx) return text(401, "Жүйеге кіріңіз.");
    if (!ctx.isPlatformAdmin && !ctx.memberships.some((m) => m.role === "school_admin")) return text(403, "Рұқсат жоқ.");
    const { orderId } = await params;
    if (!UUID_RE.test(orderId)) return text(404, "Табылмады.");
    await rateLimit("invoice", 30, 60_000, ctx.userId);
    const rows = await withUser(ctx.userId, (q) => q<Row>(
      `select status, invoice_no, invoice_date::text, due_date::text, plan, months, students, teachers, currency, vat_mode, vat_rate_bp,
              price_tiyn::text, net_tiyn::text, vat_tiyn::text, total_tiyn::text, buyer_snapshot, seller_snapshot
         from public.licence_orders where id = $1`, [orderId]));
    const o = rows[0];
    if (!o) return text(404, "Табылмады.");
    if (!o.invoice_no) return text(409, "Шот әлі берілмеген: алдымен SUPER ADMIN бағаны ұсынып, шотты беруі тиіс.");
    if (o.status === "cancelled" || o.status === "rejected") return text(409, "Тапсырыс бас тартылған не қабылданбаған: бұл шот күшінде емес.");
    if (!o.seller_snapshot || !o.seller_snapshot.legal_name || !o.seller_snapshot.iik) {
      return text(409, "Сатушы реквизиттерін толтырыңыз (Админ -> Сатушы профилі). Онсыз шот PDF жасалмайды.");
    }
    if (!o.buyer_snapshot || o.price_tiyn == null || !o.vat_mode || o.vat_rate_bp == null || !o.currency || !o.invoice_date || !o.due_date) {
      return text(409, "Шот деректері толық емес.");
    }
    const pdf = await buildInvoicePdf({
      invoice_no: o.invoice_no, invoice_date: o.invoice_date, due_date: o.due_date, plan: o.plan, months: o.months, students: o.students, teachers: o.teachers,
      currency: o.currency, vat_mode: o.vat_mode, vat_rate_bp: o.vat_rate_bp, price_tiyn: o.price_tiyn,
      net_tiyn: o.net_tiyn!, vat_tiyn: o.vat_tiyn!, total_tiyn: o.total_tiyn!, buyer: o.buyer_snapshot, seller: o.seller_snapshot,
    });
    return new Response(new Uint8Array(pdf), {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="schot-${o.invoice_no}.pdf"`,
        "content-length": String(pdf.length),
        "cache-control": "no-store",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (e) {
    const code = errorCode(e);
    if (code === "rate_limited") return text(429, "Тым жиі сұраныс. Біраздан кейін қайталаңыз.");
    if (code === "forbidden") return text(403, "Рұқсат жоқ.");
    console.error("[qazaqcode] шот қатесі:", e);
    return text(500, "Шотты жасау мүмкін болмады.");
  }
}
