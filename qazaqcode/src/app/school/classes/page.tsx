import Link from "next/link";
import { requireSchoolAdmin } from "@/lib/context";
import { withUser } from "@/lib/db";
import { fmtPct } from "@/lib/format";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { UUID_RE, loadClasses } from "../queries";

export const metadata = { title: "Сыныптар" };
export const dynamic = "force-dynamic";

export default async function ClassesPage({ searchParams }: { searchParams: Promise<{ teacher?: string }> }) {
  const sp = await searchParams;
  const ctx = await requireSchoolAdmin();
  const org = ctx.active.org_id;
  const teacherId = sp.teacher && UUID_RE.test(sp.teacher) ? sp.teacher : null;
  const { classes, teachers } = await withUser(ctx.userId, async (q) => ({
    classes: await loadClasses(q, org, { teacherId }),
    teachers: await q<{ user_id: string; full_name: string | null }>(
      `select distinct c.teacher_id as user_id, p.full_name from public.classrooms c left join public.profiles p on p.id = c.teacher_id where c.org_id = $1 order by p.full_name`, [org]),
  }));

  return (
    <>
      <PageHeader title="Сыныптар" subtitle="Ұйымның барлық сыныптары. Мұнда статистика көрсетіледі; тапсырма мен баға беруді сынып мұғалімі жүргізеді." />
      <form method="get" className="card mb-4 flex flex-wrap items-end gap-3 p-4" role="search" aria-label="Сыныптарды сүзу">
        <div className="min-w-[14rem] flex-1">
          <label className="label" htmlFor="teacher">Мұғалім бойынша сүзу</label>
          <select id="teacher" name="teacher" defaultValue={teacherId ?? ""} className="input">
            <option value="">Барлық мұғалімдер</option>
            {teachers.map((t) => <option key={t.user_id} value={t.user_id}>{t.full_name ?? "Аты көрінбейді"}</option>)}
          </select>
        </div>
        <button type="submit" className="btn-primary">Сүзу</button>
        {teacherId && <Link href="/school/classes" className="btn-secondary">Тазалау</Link>}
      </form>

      {classes.length === 0 ? (
        <EmptyState title={teacherId ? "Бұл мұғалімнің сыныбы жоқ" : "Сыныптар әлі жоқ"} text="Мұғалімдер өз кабинетінде сынып ашқанда осында көрінеді." />
      ) : (
        <div className="table-wrap relative"><table className="w-full min-w-[52rem]" data-testid="classes-table">
          <thead><tr><th className="th">Сынып</th><th className="th">Пән</th><th className="th">Оқу жылы</th><th className="th">Мұғалім</th><th className="th">Оқушы</th><th className="th">Жарияланған тапсырма</th><th className="th">Орташа %</th><th className="th"><span className="sr-only">Әрекет</span></th></tr></thead>
          <tbody className="divide-y divide-line">
            {classes.map((c) => (
              <tr key={c.id}>
                <td className="td font-medium"><Link href={`/school/classes/${c.id}`}>{c.name}</Link>{c.status !== "active" && <> <StatusBadge status="archived" /></>}</td>
                <td className="td">{c.subject}</td><td className="td">{c.academic_year}</td><td className="td">{c.teacher_name ?? "-"}</td>
                <td className="td">{c.students}</td><td className="td">{c.assignments}</td><td className="td">{fmtPct(c.avg_pct)}</td>
                <td className="td text-right"><Link href={`/school/classes/${c.id}`}>Ашу</Link></td>
              </tr>
            ))}
          </tbody></table></div>
      )}
    </>
  );
}
