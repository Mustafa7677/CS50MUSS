import { getContext } from "@/lib/context";
import { withUser } from "@/lib/db";
import { csvResponse } from "../../../csv";
import { UUID_RE } from "../../../queries";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getContext();
  if (!ctx) return new Response("Жүйеге кіріңіз", { status: 401 });
  const m = ctx.memberships.find((x) => x.role === "school_admin" && x.org_id === ctx.active?.org_id);
  if (!m) return new Response("Рұқсат жоқ", { status: 403 });
  if (!UUID_RE.test(id)) return new Response("Табылмады", { status: 404 });
  try {
    const out = await withUser(ctx.userId, async (q) => {
      const c = await q<{ name: string }>("select name from public.classrooms where id = $1 and org_id = $2", [id, m.org_id]);
      if (!c[0]) return null;
      const rows = await q<any>("select full_name, assigned, submitted, graded, avg_pct, attempts, last_activity::text from public.class_students_overview($1)", [id]);
      return { name: c[0].name, rows };
    });
    if (!out) return new Response("Табылмады", { status: 404 });
    return csvResponse(`synyp-${id.slice(0, 8)}.csv`,
      ["Оқушы", "Берілген тапсырма", "Жіберген", "Бағаланған", "Орташа %", "Әрекеттер", "Соңғы белсенділік"],
      out.rows.map((r: any) => [r.full_name, r.assigned, r.submitted, r.graded, r.avg_pct ?? "", r.attempts, r.last_activity ?? ""]));
  } catch {
    return new Response("Қате болды", { status: 500 });
  }
}
