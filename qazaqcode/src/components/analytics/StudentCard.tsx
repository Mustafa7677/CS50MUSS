import Link from "next/link";
import { EmptyState, PageHeader, ProgressBar, StatCard, StatusBadge } from "@/components/ui";
import { KIND_LABEL, fmtDate, fmtDuration, fmtPct } from "@/lib/format";
import type { StudentCardData } from "./loadStudent";
import { summarizeProgress } from "./metrics";

/** Оқушы карточкасы (мұғалім мен мектеп әкімшісі үшін ортақ). Деректі `loadStudentCard` береді. */
export function StudentCard({ data, back }: { data: StudentCardData; back: { href: string; label: string } }) {
  const s = summarizeProgress(data.rows);
  return (
    <>
      <p className="mb-2 text-sm"><Link href={back.href}>← {back.label}</Link></p>
      <PageHeader title={data.fullName} subtitle={<>Сынып: {data.classes.map((c) => c.name).join(", ")}</>} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" data-testid="student-stats">
        <StatCard label="Орташа нәтиже" value={<span data-testid="sc-avg">{fmtPct(s.avgPct)}</span>} hint={s.avgPct == null ? "әлі баға жоқ" : "үздік баға бойынша"} tone={s.avgPct != null && s.avgPct < 50 ? "bad" : undefined} />
        <div className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Орындалу үлесі</p>
          <p className="mt-1 text-3xl font-bold text-brand" data-testid="sc-done">{s.completionPct == null ? "-" : `${s.completionPct}%`}</p>
          <div className="mt-2"><ProgressBar value={s.done} max={s.total} label={`Орындалу: ${s.done} / ${s.total}`} /></div>
          <p className="mt-1 text-xs text-ink-muted">{s.done} / {s.total} тапсырма</p>
        </div>
        <StatCard label="Жалпы уақыт" value={fmtDuration(s.seconds)} hint="тапсырмаларға жұмсалған" />
        <StatCard label="Соңғы белсенділік" value={<span className="text-xl">{s.last ? fmtDate(s.last) : "-"}</span>} hint={s.last ? fmtDate(s.last, true) : "әлі жұмыс жоқ"} />
      </div>

      <h2 className="mb-3 mt-8 text-lg font-semibold">Тапсырмалар</h2>
      {data.rows.length === 0 ? <EmptyState title="Тапсырма берілмеген" text="Оқушының сыныбына жарияланған тапсырма берілгенде осында көрінеді." /> : (
        <div className="table-wrap relative">
          <table className="w-full min-w-[52rem]" data-testid="student-progress">
            <caption className="sr-only">Оқушының тапсырмалары мен нәтижелері</caption>
            <thead className="border-b border-line"><tr>
              <th className="th">Тапсырма</th><th className="th">Түрі</th><th className="th">Сынып</th><th className="th">Мерзімі</th><th className="th">Күйі</th>
              <th className="th">Үздік нәтиже</th><th className="th">Әрекет</th><th className="th">Уақыт</th><th className="th">Соңғы әрекет</th>
            </tr></thead>
            <tbody className="divide-y divide-line">
              {data.rows.map((r) => (
                <tr key={`${r.assignment_id}-${r.classroom_name}`}>
                  <td className="td font-medium">{r.title}</td>
                  <td className="td">{KIND_LABEL[r.kind] ?? r.kind}</td>
                  <td className="td">{r.classroom_name}</td>
                  <td className="td whitespace-nowrap">{r.deadline ? fmtDate(r.deadline, true) : "-"}</td>
                  <td className="td"><StatusBadge status={r.status} /></td>
                  <td className="td w-40">{r.best_pct == null ? "-" : (
                    <div className="flex items-center gap-2"><div className="w-20"><ProgressBar value={r.best_pct} label={`${r.title}: ${fmtPct(r.best_pct)}`} /></div><span className="text-xs">{fmtPct(r.best_pct)}</span></div>)}</td>
                  <td className="td">{r.attempts}</td>
                  <td className="td whitespace-nowrap">{fmtDuration(r.time_spent)}</td>
                  <td className="td whitespace-nowrap">{r.last_activity ? fmtDate(r.last_activity, true) : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
