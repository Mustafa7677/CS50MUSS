import Link from "next/link";
import { EmptyState, PageHeader } from "@/components/ui";
import { requireSchoolAdmin } from "@/lib/context";
import { withUser } from "@/lib/db";
import { fmtDate, fmtPct } from "@/lib/format";

export const metadata = { title: "Оқушылар" };
export const dynamic = "force-dynamic";
const LIMIT = 200;

type Row = { user_id: string; full_name: string | null; classes: string | null; avg_pct: number | null; last_activity: string | null };

export default async function StudentsPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const sp = await searchParams;
  const ctx = await requireSchoolAdmin();
  const term = (Array.isArray(sp.q) ? sp.q[0] : sp.q ?? "").trim().slice(0, 80);
  const like = `%${term.replace(/[\\%_]/g, (m) => "\\" + m)}%`;
  const rows = await withUser(ctx.userId, (q) => q<Row>(
    `select m.user_id, p.full_name,
        (select string_agg(c.name, ', ' order by c.name) from public.classroom_students cs join public.classrooms c on c.id = cs.classroom_id
          where cs.student_id = m.user_id and cs.status = 'active' and c.org_id = m.org_id) as classes,
        (select round(avg(b.pct)::numeric, 1)::float8 from (select distinct on (g.assignment_id) g.score / g.max_score * 100 as pct
            from public.grades g where g.student_id = m.user_id and g.org_id = m.org_id order by g.assignment_id, g.score desc) b) as avg_pct,
        (select max(s.updated_at)::text from public.submissions s where s.student_id = m.user_id and s.org_id = m.org_id) as last_activity
       from public.organization_members m join public.profiles p on p.id = m.user_id
      where m.org_id = $1 and m.role = 'student' and m.status = 'active' and ($2 = '' or p.full_name ilike $3)
      order by p.full_name limit ${LIMIT + 1}`, [ctx.active.org_id, term, like]));
  const more = rows.length > LIMIT;
  const list = rows.slice(0, LIMIT);

  return (
    <>
      <PageHeader title="Оқушылар" subtitle="Ұйымның барлық белсенді оқушылары. Аты бойынша карточкаға өтіңіз." />
      <form method="get" role="search" aria-label="Оқушыларды іздеу" className="card mb-4 flex flex-wrap items-end gap-3 p-4">
        <div className="min-w-[14rem] flex-1">
          <label className="label" htmlFor="q">Аты бойынша іздеу</label>
          <input id="q" name="q" type="search" defaultValue={term} maxLength={80} className="input" placeholder="Мысалы: Айгерім" />
        </div>
        <button type="submit" className="btn-primary">Іздеу</button>
        {term && <Link href="/school/students" className="btn-secondary">Тазалау</Link>}
      </form>
      {list.length === 0 ? (
        <EmptyState title={term ? "Ештеңе табылмады" : "Оқушылар әлі жоқ"} text={term ? "Басқа атпен іздеп көріңіз." : "Оқушылар сынып коды арқылы қосылғанда осында көрінеді."} />
      ) : (
        <>
          <div className="table-wrap relative"><table className="w-full min-w-[40rem]" data-testid="students-list">
            <caption className="sr-only">Ұйымның оқушылары</caption>
            <thead className="border-b border-line"><tr><th className="th">Оқушы</th><th className="th">Сынып</th><th className="th">Орташа %</th><th className="th">Соңғы белсенділік</th></tr></thead>
            <tbody className="divide-y divide-line">
              {list.map((r) => (
                <tr key={r.user_id} data-testid="student-row">
                  <td className="td font-medium"><Link href={`/school/students/${r.user_id}`}>{r.full_name ?? "Аты көрінбейді"}</Link></td>
                  <td className="td">{r.classes ?? "-"}</td>
                  <td className="td">{fmtPct(r.avg_pct)}</td>
                  <td className="td whitespace-nowrap">{r.last_activity ? fmtDate(r.last_activity, true) : "-"}</td>
                </tr>
              ))}
            </tbody></table></div>
          <p className="hint mt-2">{more ? `Алғашқы ${LIMIT} оқушы көрсетілді: іздеу арқылы нақтылаңыз.` : `Барлығы: ${list.length}`}</p>
        </>
      )}
    </>
  );
}
