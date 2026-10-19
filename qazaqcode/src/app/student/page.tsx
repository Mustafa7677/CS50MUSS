import Link from "next/link";
import { ActionForm } from "@/components/ActionForm";
import { EmptyState, PageHeader, ProgressBar, Section, StatCard, StatusBadge } from "@/components/ui";
import { joinClassAction } from "@/app/actions";
import { requireStudent } from "@/lib/context";
import { withUser } from "@/lib/db";
import { KIND_LABEL, fmtDate, fmtPct } from "@/lib/format";
import { avgPct, isOverdue, myAssignments } from "./data";
import { getT } from "@/lib/i18n";
import { STATUS_LABEL } from "@/lib/format";

export async function generateMetadata() { const t = await getT(); return { title: t("Басты бет") }; }
export const dynamic = "force-dynamic";

type ClassRow = { id: string; name: string; subject: string; teacher_name: string | null };
type GradeRow = { id: string; title: string; score: string; max_score: string; feedback: string | null; graded_at: string; assignment_id: string };

type CourseRow = { course_id: string; title: string; total: string; completed: string };

export default async function StudentHome() { const t = await getT();
  const ctx = await requireStudent();
  const [rows, classes, grades, courses, unreadRows] = await Promise.all([
    myAssignments(ctx.userId),
    withUser(ctx.userId, (q) => q<ClassRow>(
      `select c.id, c.name, c.subject, p.full_name as teacher_name
         from public.classroom_students cs join public.classrooms c on c.id = cs.classroom_id
         left join public.profiles p on p.id = c.teacher_id
        where cs.student_id = auth.uid() and cs.status = 'active' and c.status = 'active' order by cs.joined_at`)),
    withUser(ctx.userId, (q) => q<GradeRow>(
      `select g.id, a.title, g.score, g.max_score, g.feedback, g.graded_at, a.id as assignment_id
         from public.grades g join public.assignments a on a.id = g.assignment_id
        where g.student_id = auth.uid() order by g.graded_at desc limit 5`)),
    withUser(ctx.userId, (q) => q<CourseRow>("select * from public.my_courses() limit 3")),
    withUser(ctx.userId, (q) => q<{ n: string }>("select count(*) as n from public.notifications where user_id = auth.uid() and read_at is null")),
  ]);
  const unread = Number(unreadRows[0]?.n ?? 0);
  const now = Date.now();
  const done = rows.filter((r) => ["submitted", "under_review", "graded"].includes(r.status)).length;
  const waiting = rows.filter((r) => ["not_started", "in_progress"].includes(r.status)).length;
  const overdue = rows.filter((r) => r.status === "overdue").length;
  const avg = avgPct(rows);
  const upcoming = rows.filter((r) => ["not_started", "in_progress"].includes(r.status) && r.deadline).sort((a, b) => +new Date(a.deadline!) - +new Date(b.deadline!)).slice(0, 5);

  return (
    <>
      <PageHeader title={t("Сәлем, {v}!", { v: ctx.fullName.replace(/\s*\(демо\)\s*$/, "").split(" ")[0] })} subtitle={t("Оқу барысыңыз бір жерде.")} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label={t("Барлық тапсырма")} value={rows.length} />
        <StatCard label={t("Орындалған")} value={done} tone="ok" hint={t("жіберілген не бағаланған")} />
        <StatCard label={t("Күтіп тұр")} value={waiting} tone={waiting ? "warn" : undefined} />
        <StatCard label={t("Мерзімі өткен")} value={overdue} tone={overdue ? "bad" : undefined} />
        <StatCard label={t("Орташа нәтиже")} value={fmtPct(avg)} hint={avg == null ? t("әлі баға жоқ") : t("ең үздік баллдар бойынша")} />
      </div>

      {unread > 0 && (
        <p className="mt-4 rounded-xl border border-line bg-brand-soft px-4 py-3 text-sm" data-testid="unread-notice">
          {t("Оқылмаған хабарландыру:")}{" "}<strong>{unread}</strong>. <Link href="/notifications">{t("Ашу")}</Link>
        </p>
      )}

      <Section title={t("Курстарым")} actions={courses.length ? <Link href="/student/courses" className="text-sm">{t("Барлығы")}</Link> : undefined}>
        {courses.length === 0 ? (
          <EmptyState title={t("Әзірге курс жоқ")} text={t("Мұғалім курс жариялағанда ол осында көрінеді.")} />
        ) : (
          <ul className="grid gap-3 md:grid-cols-3" data-testid="home-courses">
            {courses.map((c) => (
              <li key={c.course_id} className="card p-4">
                <Link href={`/student/courses/${c.course_id}`} className="block break-words font-semibold">{c.title}</Link>
                <div className="mt-3"><ProgressBar value={Number(c.completed)} max={Number(c.total)} label={t("{title}: прогресс", { title: c.title })} /></div>
                <p className="mt-1 text-xs text-ink-muted">{Number(c.completed)}{" "}{t("/ {Number} сабақ", { Number: Number(c.total) })}</p>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div>
          <h2 className="mb-3 text-lg font-semibold">{t("Жақын мерзімдер")}</h2>
          {upcoming.length === 0 ? (
            <EmptyState title={t("Жақын мерзімдер жоқ")} text={rows.length ? t("Орындалуы тиіс мерзімді тапсырмалар жоқ.") : t("Сыныпқа қосылған соң мұғалім берген тапсырмалар осында көрінеді.")} />
          ) : (
            <ul className="card divide-y divide-line">
              {upcoming.map((r) => {
                const late = isOverdue(r.deadline, now);
                return (
                  <li key={r.assignment_id}>
                    <Link href={`/student/assignments/${r.assignment_id}`} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-ink no-underline hover:bg-surface-2">
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{r.title}</span>
                        <span className="text-xs text-ink-muted">{r.classroom_name} · {t(KIND_LABEL[r.kind] ?? r.kind)}</span>
                      </span>
                      <span className="flex items-center gap-3">
                        <span className={`text-sm ${late ? "font-semibold text-red-600" : "text-ink-muted"}`}>{fmtDate(r.deadline, true)}</span>
                        <StatusBadge status={r.status}  label={t(STATUS_LABEL[r.status] ?? r.status)}/>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <aside className="space-y-6">
          <div>
            <h2 className="mb-3 text-lg font-semibold">{t("Менің сыныптарым")}</h2>
            {classes.length === 0 ? (
              <EmptyState title={t("Сынып жоқ")} text={t("Мұғалім берген кодпен сыныпқа қосылыңыз.")} />
            ) : (
              <ul className="space-y-2">
                {classes.map((c) => (
                  <li key={c.id} className="card px-4 py-3">
                    <p className="font-semibold">{c.name} <span className="font-normal text-ink-muted">· {c.subject}</span></p>
                    <p className="text-xs text-ink-muted">{t("Мұғалім:")}{" "}{c.teacher_name ?? "-"}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="card p-4">
            <h2 className="text-base font-semibold">{t("Сыныпқа қосылу")}</h2>
            <ActionForm action={joinClassAction} submitLabel={t("Қосылу")} successToast={false} className="mt-2">
              <label className="label" htmlFor="join-code">{t("Мұғалім берген сынып коды")}</label>
              <input id="join-code" name="code" required minLength={6} maxLength={12} autoComplete="off" className="input font-mono uppercase tracking-widest" placeholder="ABCD2345" />
            </ActionForm>
          </div>
        </aside>
      </div>

      <Section title={t("Соңғы бағалар")} actions={grades.length ? <Link href="/student/grades" className="text-sm">{t("Барлығы")}</Link> : undefined}>
        {grades.length === 0 ? (
          <EmptyState title={t("Әзірге баға жоқ")} text={t("Жұмысты жіберіп, мұғалім тексерген соң баға мен пікір осында шығады.")} />
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {grades.map((g) => (
              <li key={g.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <Link href={`/student/assignments/${g.assignment_id}`} className="font-medium">{g.title}</Link>
                  <span className="whitespace-nowrap font-bold text-brand">{Number(g.score)} / {Number(g.max_score)}</span>
                </div>
                <p className="text-xs text-ink-muted">{fmtDate(g.graded_at)} · {fmtPct((Number(g.score) / Number(g.max_score)) * 100)}</p>
                {g.feedback && <p className="mt-2 rounded-lg bg-brand-soft px-3 py-2 text-sm"><span className="font-semibold">{t("Мұғалім пікірі:")}</span> {g.feedback}</p>}
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}
