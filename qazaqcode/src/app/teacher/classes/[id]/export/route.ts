import { getContext } from "@/lib/context";
import { withUser } from "@/lib/db";
import { isUuid } from "../../../_data";

export const dynamic = "force-dynamic";

const STATUS: Record<string, string> = { submitted: "Жіберілген", under_review: "Тексеріліп жатыр", graded: "Бағаланған" };
/** CSV ұяшығы: тырнақшалар және формула енгізуден (=,+,-,@) қорғау */
function cell(v: unknown): string {
  let s = v == null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return `"${s.replace(/"/g, '""')}"`;
}
const iso = (d: unknown) => (d ? new Date(d as string).toISOString().replace("T", " ").slice(0, 16) : "");

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) return new Response("Табылмады", { status: 404 });
  const ctx = await getContext();
  if (!ctx) return new Response("Жүйеге кіріңіз", { status: 401 });
  const out = await withUser(ctx.userId, async (q) => {
    const c = (await q<{ id: string; org_id: string; teacher_id: string; name: string }>("select id, org_id, teacher_id, name from public.classrooms where id = $1", [id]))[0];
    if (!c) return { status: 404 as const };
    const admin = ctx.memberships.some((m) => m.org_id === c.org_id && m.role === "school_admin");
    if (c.teacher_id !== ctx.userId && !admin) return { status: 403 as const };
    const rows = await q<any>(
      `select p.full_name, a.title, s.attempt_no, s.status, g.score, g.max_score, s.submitted_at
       from public.submissions s join public.assignments a on a.id = s.assignment_id join public.profiles p on p.id = s.student_id
       left join public.grades g on g.submission_id = s.id
       where s.classroom_id = $1 and s.status <> 'draft' order by p.full_name, a.title, s.attempt_no`, [id]);
    return { status: 200 as const, rows };
  });
  if (out.status === 404) return new Response("Табылмады", { status: 404 });
  if (out.status === 403) return new Response("Рұқсат жоқ", { status: 403 });
  const head = ["Оқушы", "Тапсырма", "Әрекет", "Балл", "Максималды балл", "Күйі", "Жіберілген күні"];
  const lines = [head.map(cell).join(",")];
  for (const r of out.rows) lines.push([r.full_name, r.title, r.attempt_no, r.score ?? "", r.max_score ?? "", STATUS[r.status] ?? r.status, iso(r.submitted_at)].map(cell).join(","));
  return new Response("﻿" + lines.join("\r\n") + "\r\n", {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="class-${id.slice(0, 8)}-results.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
