import Link from "next/link";
import { ActionForm } from "@/components/ActionForm";
import { ConfirmButton } from "@/components/ConfirmButton";
import { EmptyState, PageHeader, ProgressBar, StatCard, StatusBadge } from "@/components/ui";
import { CopyButton } from "@/components/teacher/CopyButton";
import { GradeChart } from "@/components/teacher/GradeChart";
import { ClassAnalytics } from "@/components/analytics/ClassAnalytics";
import { Notices } from "@/components/teacher/Notices";
import { requireStaff } from "@/lib/context";
import { withUser } from "@/lib/db";
import { env } from "@/lib/env";
import { KIND_LABEL, fmtDate, fmtDuration, fmtPct } from "@/lib/format";
import { regenerateCodeAction, removeStudentAction, toggleJoinAction, updateClassAction } from "../../actions";
import { loadClass, toNum } from "../../_data";
import { getT } from "@/lib/i18n";
import { STATUS_LABEL } from "@/lib/format";
import type { TFn } from "@/lib/i18n/core";

export const dynamic = "force-dynamic";
export async function generateMetadata() { const t = await getT(); return { title: t("Сынып") }; }

const TABS = (t: TFn) => [
  { id: "students", label: t("Оқушылар") }, { id: "join", label: t("Қосылу") },
  { id: "assignments", label: t("Тапсырмалар") }, { id: "analytics", label: t("Аналитика") },
] as const;
type Tab = "students" | "join" | "assignments" | "analytics";

export default async function ClassPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string; ok?: string; err?: string }> }) { const t = await getT();
  const { id } = await params;
  const sp = await searchParams;
  const ctx = await requireStaff();
  const cls = await loadClass(ctx, id);
  const tab: Tab = (TABS(t).find((tt) => tt.id === sp.tab)?.id ?? "students") as Tab;
  const pending = toNum((await withUser(ctx.userId, (q) => q<{ n: string }>(
    "select count(*) as n from public.submissions where classroom_id = $1 and status in ('submitted','under_review')", [cls.id])))[0].n);

  return (
    <>
      <PageHeader
        title={cls.name}
        subtitle={<>{cls.subject} · {cls.academic_year} {cls.status === "archived" && <StatusBadge status="archived"  label={t(STATUS_LABEL["archived"] ?? "archived")}/>}</>}
        actions={<>
          {pending > 0 && <Link href={`/teacher/review?class=${cls.id}`} className="btn-secondary">{t("Тексеру кезегі:")}{" "}{pending}</Link>}
          <Link href={`/teacher/assignments/new?class=${cls.id}`} className="btn-primary">{t("Тапсырма беру")}</Link>
        </>}
      />
      {cls.description && <p className="-mt-3 mb-5 max-w-2xl whitespace-pre-line text-sm text-ink-muted">{cls.description}</p>}
      <Notices ok={sp.ok} err={sp.err} />
      <nav aria-label={t("Сынып бөлімдері")} className="mb-6 flex gap-1 overflow-x-auto border-b border-line">
        {TABS(t).map((tt) => (
          <Link key={tt.id} href={`/teacher/classes/${cls.id}?tab=${tt.id}`} aria-current={tab === tt.id ? "page" : undefined} scroll={false}
            className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold no-underline ${tab === tt.id ? "border-brand text-ink" : "border-transparent text-ink-muted hover:text-ink"}`}>
            {tt.label}
          </Link>
        ))}
      </nav>
      {tab === "students" && <Students classId={cls.id} userId={ctx.userId} />}
      {tab === "join" && <Join cls={cls} />}
      {tab === "assignments" && <Assignments classId={cls.id} userId={ctx.userId} />}
      {tab === "analytics" && <Analytics classId={cls.id} userId={ctx.userId} />}
    </>
  );
}

type StudentRow = { student_id: string; full_name: string; assigned: string; submitted: string; graded: string; avg_pct: string | null; attempts: string; avg_seconds: string | null; last_activity: string | null };

async function Students({ classId, userId }: { classId: string; userId: string }) { const t = await getT();
  const rows = await withUser(userId, (q) => q<StudentRow>("select * from public.class_students_overview($1)", [classId]));
  if (!rows.length) return <EmptyState title={t("Сыныпта оқушы жоқ")} text={t("Оқушыларға «Қосылу» бөліміндегі кодты не сілтемені беріңіз.")} action={<Link href={`/teacher/classes/${classId}?tab=join`} className="btn-primary">{t("Қосылу кодын көру")}</Link>} />;
  return (
    <div className="table-wrap relative">
      <table className="w-full min-w-[56rem]">
        <caption className="sr-only">{t("Сынып оқушылары мен көрсеткіштері")}</caption>
        <thead className="border-b border-line">
          <tr><th className="th">{t("Оқушы")}</th><th className="th">{t("Берілген")}</th><th className="th">{t("Тапсырған")}</th><th className="th">{t("Бағаланған")}</th><th className="th">{t("Орташа %")}</th><th className="th">{t("Әрекет")}</th><th className="th">{t("Орт. уақыт")}</th><th className="th">{t("Соңғы белсенділік")}</th><th className="th"><span className="sr-only">{t("Әрекеттер")}</span></th></tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((r) => (
            <tr key={r.student_id} data-testid="student-row">
              <td className="td font-medium"><Link href={`/teacher/classes/${classId}/students/${r.student_id}`}>{r.full_name}</Link></td>
              <td className="td">{toNum(r.assigned)}</td>
              <td className="td">{toNum(r.submitted)}</td>
              <td className="td">{toNum(r.graded)}</td>
              <td className="td">{fmtPct(r.avg_pct)}</td>
              <td className="td">{toNum(r.attempts)}</td>
              <td className="td">{fmtDuration(r.avg_seconds, t.locale)}</td>
              <td className="td whitespace-nowrap">{fmtDate(r.last_activity, true, t.locale)}</td>
              <td className="td text-right">
                <ConfirmButton action={removeStudentAction} fields={{ class_id: classId, student_id: r.student_id }} label={t("Сыныптан шығару")} className="btn-secondary text-xs"
                  title={t("Оқушыны сыныптан шығару?")} message={t("{full_name} сыныптан шығарылады: жаңа тапсырмаларды көрмейді. Бұрынғы жұмыстары мен бағалары сақталады.", { full_name: r.full_name })} confirmLabel={t("Шығару")} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

async function Join({ cls }: { cls: Awaited<ReturnType<typeof loadClass>> }) { const t = await getT();
  const link = `${env().APP_URL.replace(/\/$/, "")}/join?code=${cls.join_code}`;
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="card p-5" aria-labelledby="jc-h">
        <h2 id="jc-h" className="text-lg font-semibold">{t("Қосылу коды")}</h2>
        {!cls.join_enabled && <p className="mt-2"><StatusBadge status="expired" label={t("Қосылу жабық")} /></p>}
        <p className="my-4 break-all rounded-xl bg-brand-soft px-4 py-5 text-center font-mono text-4xl font-bold tracking-[0.25em] text-brand sm:text-5xl" data-testid="join-code" aria-label={t("Қосылу коды: {join}", { join: cls.join_code.split("").join(" ") })}>{cls.join_code}</p>
        <div className="flex flex-wrap gap-2">
          <CopyButton text={cls.join_code} label={t("Кодты көшіру")} className="btn-primary" testId="copy-code" />
          <ConfirmButton action={regenerateCodeAction} fields={{ class_id: cls.id }} label={t("Кодты жаңарту")} className="btn-secondary"
            title={t("Кодты жаңарту?")} message={t("Жаңа код жасалады, ескі код бірден жұмыс істемейді. Сыныптағы оқушылар сыныптан шықпайды.")} confirmLabel={t("Жаңарту")} danger={false} />
        </div>
        <h3 className="mt-6 text-sm font-semibold">{t("Қосылу сілтемесі")}</h3>
        <p className="mt-1 break-all rounded-lg border border-line bg-surface-2 px-3 py-2 font-mono text-sm" data-testid="join-link">{link}</p>
        <div className="mt-2"><CopyButton text={link} label={t("Сілтемені көшіру")} /></div>
        <form action={toggleJoinAction} className="mt-6 border-t border-line pt-4">
          <input type="hidden" name="class_id" value={cls.id} />
          <input type="hidden" name="enable" value={cls.join_enabled ? "false" : "true"} />
          <p className="mb-2 text-sm text-ink-muted">{cls.join_enabled ? t("Қазір оқушылар код арқылы қоса алады.") : t("Қазір жаңа оқушы қосыла алмайды.")}</p>
          <button type="submit" className={cls.join_enabled ? "btn-secondary" : "btn-primary"}>{cls.join_enabled ? t("Қосылуды жабу") : t("Қосылуды ашу")}</button>
        </form>
      </section>

      <section className="card p-5" aria-labelledby="st-h">
        <h2 id="st-h" className="text-lg font-semibold">{t("Сынып баптаулары")}</h2>
        <ActionForm action={updateClassAction} submitLabel={t("Сақтау")} className="mt-3">
          <input type="hidden" name="class_id" value={cls.id} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><label className="label" htmlFor="sc-name">{t("Атауы")}</label><input id="sc-name" name="name" required maxLength={120} defaultValue={cls.name} className="input" /></div>
            <div><label className="label" htmlFor="sc-year">{t("Оқу жылы")}</label><input id="sc-year" name="year" required minLength={4} maxLength={20} defaultValue={cls.academic_year} className="input" /></div>
            <div><label className="label" htmlFor="sc-subject">{t("Пән")}</label><input id="sc-subject" name="subject" required maxLength={120} defaultValue={cls.subject} className="input" /></div>
            <div><label className="label" htmlFor="sc-limit">{t("Оқушы лимиті")}</label><input id="sc-limit" name="limit" type="number" min={1} max={500} defaultValue={cls.student_limit ?? ""} className="input" placeholder={t("Шектеусіз")} /></div>
          </div>
          <div className="mt-4"><label className="label" htmlFor="sc-desc">{t("Сипаттамасы")}</label><textarea id="sc-desc" name="description" rows={3} maxLength={1000} defaultValue={cls.description ?? ""} className="input" /></div>
          <label className="mt-4 flex items-center gap-2 text-sm"><input type="checkbox" name="join_enabled" defaultChecked={cls.join_enabled} className="h-4 w-4 accent-[var(--brand)]" />{" "}{t("Оқушылар код арқылы қосыла алады")}</label>
          <label className="mt-2 flex items-center gap-2 text-sm"><input type="checkbox" name="archived" defaultChecked={cls.status === "archived"} className="h-4 w-4 accent-[var(--brand)]" />{" "}{t("Сыныпты мұрағатқа жіберу")}</label>
          <p className="hint">{t("Мұрағаттағы сынып тізімде сұрғылт болып көрінеді; деректер сақталады.")}</p>
        </ActionForm>
      </section>
    </div>
  );
}

type AsgRow = { assignment_id: string; title: string; kind: string; status: string; deadline: string | null; assigned: string; submitted: string; graded: string; avg_pct: string | null };
async function Assignments({ classId, userId }: { classId: string; userId: string }) { const t = await getT();
  const rows = await withUser(userId, (q) => q<AsgRow>("select * from public.class_assignments_overview($1)", [classId]));
  if (!rows.length) return <EmptyState title={t("Тапсырма берілмеген")} text={t("Тапсырма жасап, осы сыныпқа беріңіз.")} action={<Link href={`/teacher/assignments/new?class=${classId}`} className="btn-primary">{t("Тапсырма беру")}</Link>} />;
  return (
    <div className="table-wrap relative">
      <table className="w-full min-w-[44rem]">
        <caption className="sr-only">{t("Сыныпқа берілген тапсырмалар")}</caption>
        <thead className="border-b border-line"><tr><th className="th">{t("Тапсырма")}</th><th className="th">{t("Түрі")}</th><th className="th">{t("Күйі")}</th><th className="th">{t("Мерзімі")}</th><th className="th">{t("Жіберген")}</th><th className="th">{t("Бағаланған")}</th><th className="th">{t("Орташа %")}</th></tr></thead>
        <tbody className="divide-y divide-line">
          {rows.map((r) => (
            <tr key={r.assignment_id}>
              <td className="td font-medium"><Link href={`/teacher/assignments/${r.assignment_id}/edit`}>{r.title}</Link></td>
              <td className="td">{t(KIND_LABEL[r.kind] ?? r.kind)}</td>
              <td className="td"><StatusBadge status={r.status}  label={t(STATUS_LABEL[r.status] ?? r.status)}/></td>
              <td className="td whitespace-nowrap">{fmtDate(r.deadline, true, t.locale)}</td>
              <td className="td">{toNum(r.submitted)} / {toNum(r.assigned)}</td>
              <td className="td">{toNum(r.graded)}</td>
              <td className="td">{fmtPct(r.avg_pct)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

async function Analytics({ classId, userId }: { classId: string; userId: string }) { const t = await getT();
  const [dist, asg] = await withUser(userId, async (q) => [
    await q<{ bucket: string; students: string }>("select * from public.class_grade_distribution($1)", [classId]),
    await q<AsgRow>("select * from public.class_assignments_overview($1)", [classId]),
  ] as const);
  const published = asg.filter((a) => a.status === "published");
  const expected = published.reduce((s, a) => s + toNum(a.assigned), 0);
  const done = published.reduce((s, a) => s + toNum(a.submitted), 0);
  const completion = expected ? Math.round((done / expected) * 100) : 0;
  const hard = asg.filter((a) => a.avg_pct != null).sort((a, b) => Number(a.avg_pct) - Number(b.avg_pct)).slice(0, 5);
  const graded = dist.reduce((s, d) => s + toNum(d.students), 0);
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label={t("Орындау пайызы")} value={expected ? `${completion}%` : "-"} hint={expected ? t("{done} / {expected} жұмыс жарияланған тапсырмалар бойынша", { done, expected }) : t("Жарияланған тапсырма жоқ")} />
        <StatCard label={t("Бағаланған оқушы")} value={graded} />
        <div className="card flex items-center justify-between gap-3 p-4">
          <div><p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{t("Экспорт")}</p><p className="mt-1 text-sm text-ink-muted">{t("Барлық жіберілген жұмыстар (CSV, UTF-8)")}</p></div>
          <a href={`/teacher/classes/${classId}/export`} className="btn-secondary shrink-0" data-testid="csv-link" download>{t("CSV жүктеу")}</a>
        </div>
      </div>
      <section className="card p-5" aria-labelledby="gd-h">
        <h2 id="gd-h" className="mb-3 text-lg font-semibold">{t("Бағалар таралуы")}</h2>
        {graded === 0 ? <p className="py-8 text-center text-sm text-ink-muted">{t("Бағаланған жұмыс әлі жоқ: диаграмма бағалар түскен соң пайда болады.")}</p> : <GradeChart data={dist.map((d) => ({ bucket: d.bucket, students: toNum(d.students) }))} />}
      </section>
      <section className="card p-5" aria-labelledby="hd-h">
        <h2 id="hd-h" className="text-lg font-semibold">{t("Қиын тапсырмалар")}</h2>
        <p className="mb-3 text-sm text-ink-muted">{t("Орташа балы ең төмен тапсырмалар: мүмкін, түсіндіруді қайталау керек.")}</p>
        {hard.length === 0 ? <p className="py-4 text-sm text-ink-muted">{t("Бағаланған тапсырма әлі жоқ.")}</p> : (
          <ul className="divide-y divide-line">
            {hard.map((a) => (
              <li key={a.assignment_id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3">
                <Link href={`/teacher/assignments/${a.assignment_id}/edit`} className="min-w-0 flex-1 font-medium">{a.title}</Link>
                <div className="w-40"><ProgressBar value={Number(a.avg_pct)} label={t("{title}: орташа {fmtPct}", { title: a.title, fmtPct: fmtPct(a.avg_pct) })} /></div>
                <span className={`w-12 text-right text-sm font-bold ${Number(a.avg_pct) < 50 ? "text-red-600" : Number(a.avg_pct) < 70 ? "text-amber-600" : ""}`}>{fmtPct(a.avg_pct)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <ClassAnalytics classId={classId} userId={userId} studentBase={`/teacher/classes/${classId}/students`} />
    </div>
  );
}
