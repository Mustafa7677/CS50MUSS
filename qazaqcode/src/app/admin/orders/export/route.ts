import { getContext } from "@/lib/context";
import { withUser } from "@/lib/db";
import { ORDER_STATUSES, ORDER_STATUS_LABEL, VAT_MODE_LABEL } from "@/lib/billing/labels";
import { csvResponse } from "@/app/school/csv";

export const dynamic = "force-dynamic";

const money = (t: string | null) => (t == null ? "" : `${BigInt(t) / 100n},${String(BigInt(t) % 100n).padStart(2, "0")}`);

/** Тапсырыстар CSV (Excel): тек SUPER ADMIN; формула енгізуден қорғалған (csvCell); экспорт аудитке жазылады (тек саны). */
export async function GET(req: Request) {
  const ctx = await getContext();
  if (!ctx) return new Response("Жүйеге кіріңіз", { status: 401 });
  if (!ctx.isPlatformAdmin) return new Response("Рұқсат жоқ", { status: 403 });
  const st = new URL(req.url).searchParams.get("status") ?? "";
  const status = (ORDER_STATUSES as readonly string[]).includes(st) ? st : null;
  try {
    const rows = await withUser(ctx.userId, async (q) => {
      const r = await q<Record<string, any>>(
        `select created_at, org_name, requester, plan, months, students, teachers, status, currency, vat_mode, vat_rate_bp, net_tiyn::text, vat_tiyn::text, total_tiyn::text,
                invoice_no, invoice_date::text, due_date::text, paid_ref, paid_date::text, result_valid_until::text, buyer_legal_name, buyer_bin_iin, note
           from public.admin_list_orders($1)`, [status]);
      await q("select public.audit_orders_export($1)", [r.length]); // журналсыз экспорт берілмейді
      return r;
    });
    return csvResponse("tapsyrystar.csv",
      ["Күні", "Ұйым", "Сұраушы", "Пакет", "Ай", "Оқушы", "Мұғалім", "Күйі", "Валюта", "ҚҚС режимі", "ҚҚС ставкасы %", "ҚҚС-сыз", "ҚҚС", "Жиыны", "Шот №", "Шот күні", "Төлеу мерзімі",
        "Төлем құжаты", "Төлем күні", "Лицензия дейін", "Сатып алушы", "БИН/ЖСН", "Мектеп ескертпесі"],
      rows.map((o) => [new Date(o.created_at).toISOString().slice(0, 10), o.org_name, o.requester ?? "", String(o.plan).toUpperCase(), o.months, o.students, o.teachers,
        ORDER_STATUS_LABEL[o.status] ?? o.status, o.currency ?? "", o.vat_mode ? VAT_MODE_LABEL[o.vat_mode] : "", o.vat_rate_bp != null ? String(o.vat_rate_bp / 100).replace(".", ",") : "",
        money(o.net_tiyn), money(o.vat_tiyn), money(o.total_tiyn), o.invoice_no ?? "", o.invoice_date ?? "", o.due_date ?? "", o.paid_ref ?? "", o.paid_date ?? "",
        o.result_valid_until ?? "", o.buyer_legal_name ?? "", o.buyer_bin_iin ?? "", o.note ?? ""]));
  } catch {
    return new Response("Қате болды", { status: 500 });
  }
}
