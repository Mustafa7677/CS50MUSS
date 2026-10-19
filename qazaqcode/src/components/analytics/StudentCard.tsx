import Link from "next/link";
import { EmptyState, PageHeader, ProgressBar, StatCard, StatusBadge } from "@/components/ui";
import { KIND_LABEL, fmtDate, fmtDuration, fmtPct } from "@/lib/format";
import type { StudentCardData } from "./loadStudent";
import { summarizeProgress } from "./metrics";
import { getT } from "@/lib/i18n";
import { STATUS_LABEL } from "@/lib/format";

/** Оқушы карточкасы (мұғалім мен мектеп әкімшісі үшін ортақ). Деректі `loadStudentCard` береді. */
export async function StudentCard({ data, back }: { data: StudentCardData; back: { href: string; label: string } }) { const t = await getT();
  const s = summarizeProgress(data.rows);
  return (
    <>
      <p className="mb-2 text-sm"><Link href={back.href}>← {back.label}</Link></p>
      <PageHeader title={data.fullName} subtitle={<>{t("Сынып:")}{" "}{data.classes.map((c) => c.name).join(", ")}</>} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" data-testid="student-stats">
        <StatCard label={t("Орташа нәтиже")} value={<span data-testid="sc-avg">{fmtPct(s.avgPct)}</span>} hint={s.avgPct == null ? t("әлі баға жоқ") : t("үздік баға бойынша")} tone={s.avgPct != null && s.avgPct < 50 ? "bad" : undefined} />
        <div className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{t("Орындалу үлесі")}</p>
          <p className="mt-1 text-3xl font-bold text-brand" data-testid="sc-done">{s.completionPct == null ? "-" : `${s.completionPct}%`}</p>
          <div className="mt-2"><ProgressBar value={s.done} max={s.total} label={t("Орындалу: {done} / {total}", { done: s.done, total: s.total })} /></div>
          <p className="mt-1 text-xs text-ink-muted">{s.done}{" "}{t("/ {total} тапсырма", { total: s.total })}</p>
        </div>
        <StatCard label={t("Жалпы уақыт")} value={fmtDuration(s.seconds)} hint={t("тапсырмаларға жұмсалған")} />
        <StatCard label={t("Соңғы белсенділік")} value={<span className="text-xl">{s.last ? fmtDate(s.last) : "-"}</span>} hint={s.last ? fmtDate(s.last, true) : t("әлі жұмыс жоқ")} />
      </div>

      <h2 className="mb-3 mt-8 text-lg font-semibold">{t("Тапсырмалар")}</h2>
      {data.rows.length === 0 ? <EmptyState title={t("Тапсырма берілмеген")} text={t("Оқушының сыныбына жарияланған тапсырма берілгенде осында көрінеді.")} /> : (
        <div className="table-wrap relative">
          <table className="w-full min-w-[52rem]" data-testid="student-progress">
            <caption className="sr-only">{t("Оқушының тапсырмалары мен нәтижелері")}</caption>
            <thead className="border-b border-line"><tr>
              <th className="th">{t("Тапсырма")}</th><th className="th">{t("Түрі")}</th><th className="th">{t("Сынып")}</th><th className="th">{t("Мерзімі")}</th><th className="th">{t("Күйі")}</th>
              <th className="th">{t("Үздік нәтиже")}</th><th className="th">{t("Әрекет")}</th><th className="th">{t("Уақыт")}</th><th className="th">{t("Соңғы әрекет")}</th>
            </tr></thead>
            <tbody className="divide-y divide-line">
              {data.rows.map((r) => (
                <tr key={`${r.assignment_id}-${r.classroom_name}`}>
                  <td className="td font-medium">{r.title}</td>
                  <td className="td">{t(KIND_LABEL[r.kind] ?? r.kind)}</td>
                  <td className="td">{r.classroom_name}</td>
                  <td className="td whitespace-nowrap">{r.deadline ? fmtDate(r.deadline, true) : "-"}</td>
                  <td className="td"><StatusBadge status={r.status}  label={t(STATUS_LABEL[r.status] ?? r.status)}/></td>
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
