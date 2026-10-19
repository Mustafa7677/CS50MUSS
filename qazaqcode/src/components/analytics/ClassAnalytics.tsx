import Link from "next/link";
import { ProgressBar } from "@/components/ui";
import { withUser } from "@/lib/db";
import { fmtDate, fmtPct } from "@/lib/format";
import { ActivityBars, type DayPoint } from "./ActivityBars";
import { ReportButtons } from "./ReportButtons";
import { SUPPORT_AVG_BELOW, SUPPORT_COMPLETION_BELOW, supportReasons } from "./metrics";
import { getT } from "@/lib/i18n";

type Hard = { assignment_title: string; prompt: string; answered: number; correct: number; correct_pct: number };
type Stu = { student_id: string; full_name: string; assigned: number; submitted: number; avg_pct: number | null; last_activity: string | null };

/**
 * Сынып аналитикасы (мұғалім мен әкімші үшін): белсенділік, қиын тақырыптар, қолдау керек оқушылар, есеп жүктеу.
 * Барлық сан class_* SQL функцияларынан (RLS + құқық функция ішінде).
 */
export async function ClassAnalytics({ classId, userId, studentBase }: { classId: string; userId: string; studentBase: string }) { const t = await getT();
  const d = await withUser(userId, async (q) => ({
    series: await q<DayPoint>("select day::text as day, submissions::int as submissions, active_students::int as active_students from public.class_activity_series($1, 30)", [classId]),
    hard: await q<Hard>(
      `select assignment_title, prompt, answered::int as answered, correct::int as correct, correct_pct::float8 as correct_pct
         from public.difficult_questions($1) order by correct_pct, answered desc limit 5`, [classId]),
    students: await q<Stu>(
      `select student_id, full_name, assigned::int as assigned, submitted::int as submitted, avg_pct::float8 as avg_pct, last_activity::text as last_activity
         from public.class_students_overview($1)`, [classId]),
  }));
  const hasActivity = d.series.some((s) => s.submissions > 0 || s.active_students > 0);
  const support = d.students.map((s) => ({ s, why: supportReasons(s) })).filter((x) => x.why.length > 0);

  return (
    <div className="space-y-6" data-testid="class-analytics">
      <section className="card p-5" aria-labelledby="ca-act">
        <h2 id="ca-act" className="mb-3 text-lg font-semibold">{t("Белсенділік: соңғы 30 күн")}</h2>
        {hasActivity ? <ActivityBars data={d.series} title={t("Сынып белсенділігі")} />
          : <p className="py-6 text-sm text-ink-muted">{t("Соңғы 30 күнде жіберілген жұмыс жоқ. Оқушылар тапсырма жібергенде диаграмма осында көрінеді.")}</p>}
      </section>

      <section className="card p-5" aria-labelledby="ca-hard">
        <h2 id="ca-hard" className="text-lg font-semibold">{t("Қиын тақырыптар")}</h2>
        <p className="mb-3 text-sm text-ink-muted">{t("Тест сұрақтары бойынша дұрыс жауап үлесі ең төмен 5 сұрақ: осы тақырыпты қайталау керек болуы мүмкін.")}</p>
        {d.hard.length === 0 ? <p className="py-4 text-sm text-ink-muted">{t("Тест жұмыстары әлі жоқ: оқушылар тест тапсырғанда сұрақтар бойынша статистика пайда болады.")}</p> : (
          <ol className="divide-y divide-line" data-testid="hard-questions">
            {d.hard.map((h, i) => (
              <li key={i} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3">
                <div className="min-w-0 flex-1">
                  <p className="break-words font-medium">{h.prompt}</p>
                  <p className="text-xs text-ink-muted">{h.assignment_title}{" "}{t("· жауап саны:")}{" "}{h.answered}</p>
                </div>
                <div className="w-32"><ProgressBar value={h.correct_pct} label={t("Дұрыс жауап: {fmtPct}", { fmtPct: fmtPct(h.correct_pct) })} /></div>
                <span className={`w-14 text-right text-sm font-bold ${h.correct_pct < 50 ? "text-red-600" : h.correct_pct < 70 ? "text-amber-600" : ""}`}>{fmtPct(h.correct_pct)}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="card p-5" aria-labelledby="ca-sup">
        <h2 id="ca-sup" className="text-lg font-semibold">{t("Қолдау керек оқушылар")}</h2>
        <p className="mb-3 text-sm text-ink-muted" data-testid="support-rule">
          {t("Шарты: орташа нәтиже {SUPPORT_AVG_BELOW}%-дан төмен немесе берілген тапсырмалардың {SUPPORT_COMPLETION_BELOW}%-дан азын орындаған.", { SUPPORT_AVG_BELOW, SUPPORT_COMPLETION_BELOW })}
        </p>
        {d.students.length === 0 ? <p className="py-4 text-sm text-ink-muted">{t("Сыныпта оқушы жоқ.")}</p>
          : support.length === 0 ? <p className="py-4 text-sm text-ink-muted" data-testid="support-none">{t("Қазір бұл шартқа сәйкес келетін оқушы жоқ.")}</p> : (
            <ul className="divide-y divide-line" data-testid="support-list">
              {support.map(({ s, why }) => (
                <li key={s.student_id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3">
                  <div className="min-w-0">
                    <Link href={`${studentBase}/${s.student_id}`} className="font-medium">{s.full_name}</Link>
                    <p className="text-xs text-ink-muted">{why.join("; ")}</p>
                  </div>
                  <span className="text-xs text-ink-muted">{t("Соңғы белсенділік:")}{" "}{s.last_activity ? fmtDate(s.last_activity) : "-"}</span>
                </li>
              ))}
            </ul>
          )}
      </section>

      <section aria-labelledby="ca-rep">
        <h2 id="ca-rep" className="mb-2 text-lg font-semibold">{t("Есеп жүктеу")}</h2>
        <ReportButtons action={`/api/reports/class/${classId}`} id="cls" />
      </section>
    </div>
  );
}

