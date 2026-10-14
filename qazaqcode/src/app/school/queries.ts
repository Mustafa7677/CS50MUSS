import { notFound } from "next/navigation";
import type { Q } from "@/lib/db";

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type LicenseInfo = {
  state: string; plan: string | null; valid_until: string | null; days_left: number | null;
  max_students: number; max_teachers: number; students: number; teachers: number;
} | null;

/** Лицензия + қолданылу (тек оқу, RLS: ұйым әкімшісі) */
export async function loadLicense(q: Q, orgId: string): Promise<LicenseInfo> {
  const r = await q<any>(
    `select public.license_state($1) as state, l.plan::text as plan, l.valid_until::text as valid_until, (l.valid_until - current_date)::int as days_left,
            l.max_students, l.max_teachers,
            (select count(*)::int from public.organization_members m where m.org_id = $1 and m.role = 'student' and m.status = 'active') as students,
            (select count(*)::int from public.organization_members m where m.org_id = $1 and m.role = 'teacher' and m.status = 'active') as teachers
       from public.organizations o left join public.licenses l on l.org_id = o.id where o.id = $1`, [orgId]);
  const x = r[0];
  if (!x || !x.plan) return null;
  return x;
}

export type ClassRow = {
  id: string; name: string; subject: string; academic_year: string; status: string; teacher_id: string; teacher_name: string | null;
  students: number; assignments: number; avg_pct: string | null; expected: number; completed: number;
};

/** Ұйымның сыныптары: оқушы/тапсырма саны, орташа %, орындалу */
export async function loadClasses(q: Q, orgId: string, opts: { teacherId?: string | null; activeOnly?: boolean } = {}): Promise<ClassRow[]> {
  return q<ClassRow>(
    `select c.id, c.name, c.subject, c.academic_year, c.status, c.teacher_id, p.full_name as teacher_name,
       (select count(*)::int from public.classroom_students cs where cs.classroom_id = c.id and cs.status = 'active') as students,
       (select count(*)::int from public.assignment_targets t join public.assignments a on a.id = t.assignment_id and a.status = 'published' where t.classroom_id = c.id) as assignments,
       (select round(avg(b.pct), 1)::text from (select distinct on (g.assignment_id, g.student_id) g.score / g.max_score * 100 as pct
          from public.grades g join public.submissions s on s.id = g.submission_id where s.classroom_id = c.id
          order by g.assignment_id, g.student_id, g.score desc) b) as avg_pct,
       (select count(*)::int from public.assignment_targets t join public.assignments a on a.id = t.assignment_id and a.status = 'published'
          join public.classroom_students cs on cs.classroom_id = c.id and cs.status = 'active' where t.classroom_id = c.id) as expected,
       (select count(*)::int from (select distinct s.assignment_id, s.student_id from public.submissions s
          join public.assignments a on a.id = s.assignment_id and a.status = 'published'
          join public.classroom_students cs on cs.classroom_id = s.classroom_id and cs.student_id = s.student_id and cs.status = 'active'
          where s.classroom_id = c.id and s.status <> 'draft') x) as completed
     from public.classrooms c left join public.profiles p on p.id = c.teacher_id
     where c.org_id = $1 and ($2::uuid is null or c.teacher_id = $2) and (not $3 or c.status = 'active')
     order by c.status, c.name`, [orgId, opts.teacherId ?? null, !!opts.activeOnly]);
}

export async function loadClass(q: Q, orgId: string, id: string) {
  if (!UUID_RE.test(id)) notFound();
  const r = await q<{ id: string; name: string; subject: string; academic_year: string; status: string; teacher_name: string | null }>(
    `select c.id, c.name, c.subject, c.academic_year, c.status, p.full_name as teacher_name
       from public.classrooms c left join public.profiles p on p.id = c.teacher_id where c.id = $1 and c.org_id = $2`, [id, orgId]);
  if (!r[0]) notFound();
  return r[0];
}

export const pct = (a: number, b: number) => (b > 0 ? Math.min(100, Math.round((a / b) * 100)) : 0);
