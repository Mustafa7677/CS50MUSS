import Link from "next/link";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { Notices } from "@/components/teacher/Notices";
import { requireStaff } from "@/lib/context";
import { withUser } from "@/lib/db";
import { KIND_LABEL, fmtDate } from "@/lib/format";
import { isUuid } from "../_data";

export const metadata = { title: "Тексеру кезегі" };
export const dynamic = "force-dynamic";

type Row = { id: string; status: string; attempt_no: number; submitted_at: string | null; student: string; title: string; kind: string; class_id: string; class_name: string };

export default async function ReviewPage({ searchParams }: { searchParams: Promise<{ class?: string; err?: string }> }) {
  const sp = await searchParams;
  const ctx = await requireStaff();
  const filter = isUuid(sp.class) ? sp.class : null;
  const { classes, rows } = await withUser(ctx.userId, async (q) => ({
    classes: await q<{ id: string; name: string }>("select id, name from public.classrooms where teacher_id = $1 and org_id = $2 order by name", [ctx.userId, ctx.active.org_id]),
    rows: await q<Row>(
      `select s.id, s.status, s.attempt_no, s.submitted_at, p.full_name as student, a.title, a.kind, c.id as class_id, c.name as class_name
       from public.submissions s join public.classrooms c on c.id = s.classroom_id join public.assignments a on a.id = s.assignment_id
       join public.profiles p on p.id = s.student_id
       where c.teacher_id = $1 and c.org_id = $2 and s.status in ('submitted','under_review') and ($3::uuid is null or c.id = $3::uuid)
       order by s.submitted_at asc, s.id`, [ctx.userId, ctx.active.org_id, filter]),
  }));
  return (
    <>
      <PageHeader title="Тексеру кезегі" subtitle="Жіберілген және тексеріліп жатқан жұмыстар: ең ескісі жоғарыда." />
      <Notices err={sp.err} />
      {classes.length > 0 && (
        <form method="get" className="mb-4 flex flex-wrap items-end gap-2">
          <div>
            <label className="label" htmlFor="rv-class">Сынып бойынша сүзгі</label>
            <select id="rv-class" name="class" defaultValue={filter ?? ""} className="input min-w-48">
              <option value="">Барлық сыныптар</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <button type="submit" className="btn-secondary">Сүзу</button>
        </form>
      )}
      {rows.length === 0 ? (
        <EmptyState title="Тексеретін жұмыс жоқ" text="Оқушылар код не мәтін түріндегі тапсырманы жібергенде, жұмыс осында пайда болады. Тесттер автоматты бағаланады." action={<Link href="/teacher" className="btn-secondary">Сыныптарыма</Link>} />
      ) : (
        <div className="table-wrap">
          <table className="w-full min-w-[44rem]">
            <caption className="sr-only">Тексеруді күтетін жұмыстар</caption>
            <thead className="border-b border-line"><tr><th className="th">Оқушы</th><th className="th">Тапсырма</th><th className="th">Сынып</th><th className="th">Жіберілген</th><th className="th">Күйі</th><th className="th"><span className="sr-only">Ашу</span></th></tr></thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.id} data-testid="review-row">
                  <td className="td font-medium">{r.student}</td>
                  <td className="td">{r.title} <span className="text-xs text-ink-muted">· {KIND_LABEL[r.kind] ?? r.kind}{r.attempt_no > 1 ? ` · ${r.attempt_no}-әрекет` : ""}</span></td>
                  <td className="td">{r.class_name}</td>
                  <td className="td whitespace-nowrap">{fmtDate(r.submitted_at, true)}</td>
                  <td className="td"><StatusBadge status={r.status} /></td>
                  <td className="td text-right"><Link href={`/teacher/submissions/${r.id}`} className="btn-primary text-xs">Ашу</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
