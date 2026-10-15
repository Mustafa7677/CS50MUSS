import { getContext } from "@/lib/context";
import { withUser } from "@/lib/db";
import { LEAD_COLS, LEAD_ROLE_LABEL, LEAD_STATUSES, LEAD_STATUS_LABEL, LEAD_TYPE_LABEL, likePattern, type LeadRow } from "@/components/leads/labels";
import { csvResponse } from "@/app/school/csv";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const ctx = await getContext();
  if (!ctx) return new Response("Жүйеге кіріңіз", { status: 401 });
  if (!ctx.isPlatformAdmin) return new Response("Рұқсат жоқ", { status: 403 });
  const u = new URL(req.url);
  const st = u.searchParams.get("status") ?? "";
  const status = (LEAD_STATUSES as readonly string[]).includes(st) ? st : null;
  const qs = (u.searchParams.get("q") ?? "").trim().slice(0, 100);
  try {
    const rows = await withUser(ctx.userId, async (q) => {
      const r = await q<LeadRow>(
        `select ${LEAD_COLS} from public.leads where ($1::text is null or status = $1)
            and ($2::text is null or org_name ilike $2 or contact_name ilike $2 or email ilike $2) order by created_at desc`,
        [status, qs ? likePattern(qs) : null]);
      await q("select public.audit_leads_export($1)", [r.length]); // журналсыз экспорт берілмейді
      return r;
    });
    return csvResponse("pilot-suraulary.csv",
      ["Күні", "Ұйым", "Түрі", "Байланыс адамы", "E-mail", "Телефон", "Рөлі", "Оқушы саны", "Күйі", "Хабар", "Жазба", "Дереккөз"],
      rows.map((l) => [new Date(l.created_at).toISOString().slice(0, 10), l.org_name, LEAD_TYPE_LABEL[l.org_type] ?? l.org_type, l.contact_name, l.email, l.phone ?? "",
        LEAD_ROLE_LABEL[l.role] ?? l.role, l.students_estimate ?? "", LEAD_STATUS_LABEL[l.status] ?? l.status, l.message ?? "", l.notes ?? "", l.source ?? ""]));
  } catch {
    return new Response("Қате болды", { status: 500 });
  }
}
