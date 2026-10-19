import Link from "next/link";
import { requireSchoolAdmin } from "@/lib/context";
import { withUser } from "@/lib/db";
import { fmtDate, fmtPct, KIND_LABEL } from "@/lib/format";
import { ClassAnalytics } from "@/components/analytics/ClassAnalytics";
import { EmptyState, PageHeader, ProgressBar, Section, StatusBadge } from "@/components/ui";
import { loadClass, pct } from "../../queries";
import { getT } from "@/lib/i18n";
import { STATUS_LABEL } from "@/lib/format";

export const dynamic = "force-dynamic";
export async function generateMetadata() { const t = await getT(); return { title: t("Сынып статистикасы") }; }

export default async function ClassDetail({ params }: { params: Promise<{ id: string }> }) { const t = await getT();
  const { id } = await params;
  const ctx = await requireSchoolAdmin();
  const d = await withUser(ctx.userId, async (q) => {
    const cls = await loadClass(q, ctx.active.org_id, id);
    const [students, assignments, dist] = await Promise.all([
      q<any>("select student_id, full_name, assigned::int, submitted::int, graded::int, avg_pct::text, attempts::int, last_activity::text from public.class_students_overview($1)", [id]),
      q<any>("select assignment_id, title, kind::text, status::text, deadline::text, assigned::int, submitted::int, graded::int, avg_pct::text from public.class_assignments_overview($1)", [id]),
      q<{ bucket: string; students: number }>("select bucket, students::int from public.class_grade_distribution($1)", [id]),
    ]);
    return { cls, students, assignments, dist };
  });
  const { cls, students, assignments, dist } = d;
  const maxBucket = Math.max(1, ...dist.map((b) => b.students));
  const graded = dist.reduce((a, b) => a + b.students, 0);

  return (
    <>
      <p className="mb-2 text-sm"><Link href="/school/classes">{t("← Барлық сыныптар")}</Link></p>
      <PageHeader title={t("Сынып {name}", { name: cls.name })} subtitle={t("{subject} · {academic_year} · Мұғалім: {v}", { subject: cls.subject, academic_year: cls.academic_year, v: cls.teacher_name ?? "-" })}
        actions={<a className="btn-secondary" href={`/school/classes/${cls.id}/export`} download>{t("CSV жүктеу")}</a>} />

      <Section title={t("Оқушылар")}>
        {students.length === 0 ? <EmptyState title={t("Сыныпта оқушы жоқ")} text={t("Оқушылар сынып коды арқылы қосылады.")} /> : (
          <div className="table-wrap relative"><table className="w-full min-w-[44rem]" data-testid="students-table">
            <thead><tr><th className="th">{t("Оқушы")}</th><th className="th">{t("Берілген")}</th><th className="th">{t("Жіберген")}</th><th className="th">{t("Бағаланған")}</th><th className="th">{t("Орындау")}</th><th className="th">{t("Орташа %")}</th><th className="th">{t("Соңғы белсенділік")}</th></tr></thead>
            <tbody className="divide-y divide-line">
              {students.map((s: any) => (
                <tr key={s.student_id}>
                  <td className="td font-medium"><Link href={`/school/students/${s.student_id}`}>{s.full_name}</Link></td><td className="td">{s.assigned}</td><td className="td">{s.submitted}</td><td className="td">{s.graded}</td>
                  <td className="td w-36">{s.assigned > 0 ? <div className="flex items-center gap-2"><div className="w-20"><ProgressBar value={s.submitted} max={s.assigned} label={t("{full_name}: орындау", { full_name: s.full_name })} /></div><span className="text-xs text-ink-muted">{pct(s.submitted, s.assigned)}%</span></div> : "-"}</td>
                  <td className="td">{fmtPct(s.avg_pct)}</td><td className="td">{s.last_activity ? fmtDate(s.last_activity, true, t.locale) : "-"}</td>
                </tr>
              ))}
            </tbody></table></div>
        )}
      </Section>

      <Section title={t("Тапсырмалар")}>
        {assignments.length === 0 ? <EmptyState title={t("Тапсырма берілмеген")} /> : (
          <div className="table-wrap relative"><table className="w-full min-w-[44rem]">
            <thead><tr><th className="th">{t("Тапсырма")}</th><th className="th">{t("Түрі")}</th><th className="th">{t("Күйі")}</th><th className="th">{t("Мерзімі")}</th><th className="th">{t("Жіберген")}</th><th className="th">{t("Бағаланған")}</th><th className="th">{t("Орташа %")}</th></tr></thead>
            <tbody className="divide-y divide-line">
              {assignments.map((a: any) => (
                <tr key={a.assignment_id}>
                  <td className="td font-medium">{a.title}</td><td className="td">{t(KIND_LABEL[a.kind] ?? a.kind)}</td><td className="td"><StatusBadge status={a.status}  label={t(STATUS_LABEL[a.status] ?? a.status)}/></td>
                  <td className="td">{a.deadline ? fmtDate(a.deadline, true, t.locale) : "-"}</td>
                  <td className="td">{a.submitted} / {a.assigned}</td><td className="td">{a.graded}</td><td className="td">{fmtPct(a.avg_pct)}</td>
                </tr>
              ))}
            </tbody></table></div>
        )}
      </Section>

      <Section title={t("Бағалар таралуы")}>
        {graded === 0 ? <EmptyState title={t("Әлі бағаланған оқушы жоқ")} text={t("Мұғалім жұмыстарды бағалағанда таралу осында көрінеді.")} /> : (
          <div className="card p-5" data-testid="grade-dist">
            <ul className="space-y-3">
              {dist.map((b) => (
                <li key={b.bucket} className="grid grid-cols-[4.5rem_1fr_2.5rem] items-center gap-3 text-sm">
                  <span className="font-medium">{b.bucket}%</span>
                  <ProgressBar value={b.students} max={maxBucket} label={t("{bucket}%: {students} оқушы", { bucket: b.bucket, students: b.students })} />
                  <span className="text-right text-ink-muted">{b.students}</span>
                </li>
              ))}
            </ul>
            <p className="hint mt-3">{t("Оқушының барлық бағаланған тапсырмалары бойынша орташа нәтиже.")}</p>
          </div>
        )}
      </Section>

      <Section title={t("Сынып аналитикасы")}>
        <ClassAnalytics classId={cls.id} userId={ctx.userId} studentBase="/school/students" />
      </Section>
    </>
  );
}
