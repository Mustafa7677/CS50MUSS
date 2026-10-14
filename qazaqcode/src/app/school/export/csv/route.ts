import { getContext } from "@/lib/context";
import { withUser } from "@/lib/db";
import { STATUS_LABEL } from "@/lib/format";
import { csvResponse } from "../../csv";

export const dynamic = "force-dynamic";

export async function GET() {
  const ctx = await getContext();
  if (!ctx) return new Response("Жүйеге кіріңіз", { status: 401 });
  const m = ctx.memberships.find((x) => x.role === "school_admin" && x.org_id === ctx.active?.org_id);
  if (!m) return new Response("Рұқсат жоқ", { status: 403 });
  try {
    const rows = await withUser(ctx.userId, (q) => q<any>(
      `select c.name as class_name, p.full_name as student, a.title, ls.status::text as sub_status, ls.submitted_at, ls.updated_at,
              g.score, g.max_score, a.deadline, a.max_score as a_max
         from public.assignment_targets t
         join public.assignments a on a.id = t.assignment_id and a.status = 'published'
         join public.classrooms c on c.id = t.classroom_id
         join public.classroom_students cs on cs.classroom_id = c.id and cs.status = 'active'
         left join public.profiles p on p.id = cs.student_id
         left join lateral (select s.status, s.submitted_at, s.updated_at from public.submissions s
                             where s.assignment_id = a.id and s.student_id = cs.student_id and s.classroom_id = c.id
                             order by s.attempt_no desc limit 1) ls on true
         left join lateral (select g2.score, g2.max_score from public.grades g2 where g2.assignment_id = a.id and g2.student_id = cs.student_id
                             order by g2.score desc limit 1) g on true
        where a.org_id = $1 order by c.name, p.full_name, a.title`, [m.org_id]));
    const fmt = (d: Date | null) => (d ? new Date(d).toISOString().slice(0, 10) : "");
    return csvResponse("mektep-esebi.csv", ["Сынып", "Оқушы", "Тапсырма", "Күйі", "Балл", "Максималды балл", "Күні"],
      rows.map((r) => {
        const st = r.sub_status == null ? "not_started" : r.sub_status === "draft" ? "in_progress" : r.sub_status;
        return [r.class_name, r.student ?? "", r.title, STATUS_LABEL[st] ?? st, r.score ?? "", r.max_score ?? "", fmt(r.submitted_at)];
      }));
  } catch {
    return new Response("Қате болды", { status: 500 });
  }
}
