import Link from "next/link";
import { ConfirmButton } from "@/components/ConfirmButton";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { Notices } from "@/components/teacher/Notices";
import { requireStaff } from "@/lib/context";
import { withUser } from "@/lib/db";
import { KIND_LABEL, STATUS_LABEL, fmtDate } from "@/lib/format";
import { archiveAssignmentAction, duplicateAssignmentAction } from "../actions";
import { KINDS, toNum } from "../_data";

export const metadata = { title: "Тапсырмалар" };
export const dynamic = "force-dynamic";

type Row = { id: string; title: string; kind: string; status: string; deadline: string | null; classes: string[] | null; works: string };
const FILTERS = [["all", "Барлығы"], ["draft", STATUS_LABEL.draft], ["published", STATUS_LABEL.published], ["archived", STATUS_LABEL.archived]] as const;

export default async function AssignmentsPage({ searchParams }: { searchParams: Promise<{ status?: string; kind?: string; ok?: string; err?: string }> }) {
  const sp = await searchParams;
  const ctx = await requireStaff();
  const status = FILTERS.some(([k]) => k === sp.status) && sp.status !== "all" ? sp.status! : null;
  const kind = (KINDS as readonly string[]).includes(sp.kind ?? "") ? sp.kind! : null;
  const rows = await withUser(ctx.userId, (q) => q<Row>(
    `select a.id, a.title, a.kind, a.status, a.deadline,
       (select array_agg(c.name order by c.name) from public.assignment_targets t join public.classrooms c on c.id = t.classroom_id where t.assignment_id = a.id) as classes,
       (select count(*) from public.submissions s where s.assignment_id = a.id and s.status <> 'draft') as works
     from public.assignments a
     where a.created_by = $1 and a.org_id = $2 and ($3::text is null or a.status::text = $3) and ($4::text is null or a.kind::text = $4)
     order by a.updated_at desc`, [ctx.userId, ctx.active.org_id, status, kind]));
  const href = (s: string | null, k: string | null) => `/teacher/assignments?${new URLSearchParams({ ...(s ? { status: s } : {}), ...(k ? { kind: k } : {}) })}`;
  return (
    <>
      <PageHeader title="Тапсырмалар" subtitle="Өзіңіз жасаған тапсырмалар." actions={<Link href="/teacher/assignments/new" className="btn-primary">Жаңа тапсырма</Link>} />
      <Notices ok={sp.ok} err={sp.err} />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <nav aria-label="Күй бойынша сүзгі" className="flex flex-wrap gap-1">
          {FILTERS.map(([k, label]) => {
            const on = (status ?? "all") === k;
            return <Link key={k} href={href(k === "all" ? null : k, kind)} aria-current={on ? "page" : undefined} className={`rounded-full border px-3 py-1 text-sm font-medium no-underline ${on ? "border-brand bg-brand text-brand-ink" : "border-line bg-surface text-ink hover:bg-surface-2"}`}>{label}</Link>;
          })}
        </nav>
        <form method="get" className="ml-auto flex items-center gap-2">
          {status && <input type="hidden" name="status" value={status} />}
          <label className="sr-only" htmlFor="as-kind">Түрі бойынша сүзгі</label>
          <select id="as-kind" name="kind" defaultValue={kind ?? ""} className="input w-auto">
            <option value="">Барлық түрлер</option>
            {KINDS.map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
          </select>
          <button type="submit" className="btn-secondary">Сүзу</button>
        </form>
      </div>
      {rows.length === 0 ? (
        <EmptyState title={status || kind ? "Бұл сүзгі бойынша тапсырма жоқ" : "Әзірге тапсырма жоқ"} text="Тапсырма жасап, оны сыныптарға беріңіз." action={<Link href="/teacher/assignments/new" className="btn-primary">Жаңа тапсырма</Link>} />
      ) : (
        <div className="table-wrap relative">
          <table className="w-full min-w-[52rem]">
            <caption className="sr-only">Менің тапсырмаларым</caption>
            <thead className="border-b border-line"><tr><th className="th">Тапсырма</th><th className="th">Түрі</th><th className="th">Күйі</th><th className="th">Сыныптар</th><th className="th">Мерзімі</th><th className="th">Жұмыс</th><th className="th"><span className="sr-only">Әрекеттер</span></th></tr></thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.id} data-testid="assignment-row">
                  <td className="td font-medium"><Link href={`/teacher/assignments/${r.id}/edit`}>{r.title}</Link></td>
                  <td className="td">{KIND_LABEL[r.kind] ?? r.kind}</td>
                  <td className="td"><StatusBadge status={r.status} /></td>
                  <td className="td">{r.classes?.length ? r.classes.join(", ") : <span className="text-ink-muted">Берілмеген</span>}</td>
                  <td className="td whitespace-nowrap">{fmtDate(r.deadline, true)}</td>
                  <td className="td">{toNum(r.works)}</td>
                  <td className="td">
                    <div className="flex justify-end gap-2">
                      <Link href={`/teacher/assignments/${r.id}/edit`} className="btn-secondary text-xs">Ашу</Link>
                      <form action={duplicateAssignmentAction}><input type="hidden" name="assignment_id" value={r.id} /><button type="submit" className="btn-secondary text-xs">Көшіру</button></form>
                      {r.status !== "archived" && <ConfirmButton action={archiveAssignmentAction} fields={{ assignment_id: r.id }} label="Мұрағат" className="btn-secondary text-xs" title="Мұрағатқа жіберу?" message="Тапсырма оқушыларға көрінбейді; жұмыстар мен бағалар сақталады." confirmLabel="Мұрағатқа жіберу" />}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
