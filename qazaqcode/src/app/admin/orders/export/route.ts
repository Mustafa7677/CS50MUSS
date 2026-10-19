import { getContext } from "@/lib/context";
import { withUser } from "@/lib/db";
import { ORDER_STATUSES, ORDER_STATUS_LABEL, VAT_MODE_LABEL } from "@/lib/billing/labels";
import { csvResponse } from "@/app/school/csv";
import { getT } from "@/lib/i18n";

export const dynamic = "force-dynamic";

const money = (tt: string | null) => (tt == null ? "" : `${BigInt(tt) / 100n},${String(BigInt(tt) % 100n).padStart(2, "0")}`);

/** Тапсырыстар CSV (Excel): тек SUPER ADMIN; формула енгізуден қорғалған (csvCell); экспорт аудитке жазылады (тек саны). */
export async function GET(req: Request) { const t = await getT();
  const ctx = await getContext();
  if (!ctx) return new Response(t("Жүйеге кіріңіз"), { status: 401 });
  if (!ctx.isPlatformAdmin) return new Response(t("Рұқсат жоқ"), { status: 403 });
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
      [t("Күні"), t("Ұйым"), t("Сұраушы"), t("Пакет"), t("Ай"), t("Оқушы"), t("Мұғалім"), t("Күйі"), t("Валюта"), t("ҚҚС режимі"), t("ҚҚС ставкасы %"), t("ҚҚС-сыз"), t("ҚҚС"), t("Жиыны"), t("Шот №"), t("Шот күні"), t("Төлеу мерзімі"),
        t("Төлем құжаты"), t("Төлем күні"), t("Лицензия дейін"), t("Сатып алушы"), t("БИН/ЖСН"), t("Мектеп ескертпесі")],
      rows.map((o) => [new Date(o.created_at).toISOString().slice(0, 10), o.org_name, o.requester ?? "", String(o.plan).toUpperCase(), o.months, o.students, o.teachers,
        ORDER_STATUS_LABEL[o.status] ?? o.status, o.currency ?? "", o.vat_mode ? VAT_MODE_LABEL[o.vat_mode] : "", o.vat_rate_bp != null ? String(o.vat_rate_bp / 100).replace(".", ",") : "",
        money(o.net_tiyn), money(o.vat_tiyn), money(o.total_tiyn), o.invoice_no ?? "", o.invoice_date ?? "", o.due_date ?? "", o.paid_ref ?? "", o.paid_date ?? "",
        o.result_valid_until ?? "", o.buyer_legal_name ?? "", o.buyer_bin_iin ?? "", o.note ?? ""]));
  } catch {
    return new Response(t("Қате болды"), { status: 500 });
  }
}
