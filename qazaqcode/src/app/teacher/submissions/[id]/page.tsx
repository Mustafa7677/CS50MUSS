import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/ActionForm";
import { Banner, PageHeader, StatusBadge } from "@/components/ui";
import { CopyButton } from "@/components/teacher/CopyButton";
import { Notices } from "@/components/teacher/Notices";
import { requireStaff } from "@/lib/context";
import { withUser } from "@/lib/db";
import { KIND_LABEL, fmtDate, fmtDuration, fmtNum } from "@/lib/format";
import { beginReviewAction, gradeSubmissionAction } from "../../actions";
import { toNum, uuidOr404 } from "../../_data";
import { getT } from "@/lib/i18n";
import { STATUS_LABEL } from "@/lib/format";

export async function generateMetadata() { const t = await getT(); return { title: t("Жұмысты тексеру") }; }
export const dynamic = "force-dynamic";

export default async function SubmissionPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ err?: string }> }) { const t = await getT();
  const { id } = await params;
  const sp = await searchParams;
  uuidOr404(id);
  const ctx = await requireStaff();
  const d = await withUser(ctx.userId, async (q) => {
    const s = (await q<any>(
      `select s.*, p.full_name as student, a.title, a.kind, a.max_score, a.description, c.name as class_name, c.teacher_id, c.id as cid,
         g.score as g_score, g.feedback as g_feedback, g.graded_at, g.source as g_source, gp.full_name as grader
       from public.submissions s join public.assignments a on a.id = s.assignment_id join public.classrooms c on c.id = s.classroom_id
       join public.profiles p on p.id = s.student_id left join public.grades g on g.submission_id = s.id left join public.profiles gp on gp.id = g.graded_by
       where s.id = $1`, [id]))[0];
    if (!s) return null;
    const questions = s.kind === "quiz" ? await q<any>(
      `select q.id, q.prompt, q.options, q.points, k.correct_index, k.explanation from public.assignment_questions q
       left join public.assignment_answer_keys k on k.question_id = q.id where q.assignment_id = $1 order by q.position`, [s.assignment_id]) : [];
    const others = await q<any>(
      `select s2.id, s2.attempt_no, s2.status, s2.submitted_at, g2.score from public.submissions s2 left join public.grades g2 on g2.submission_id = s2.id
       where s2.assignment_id = $1 and s2.student_id = $2 and s2.status <> 'draft' order by s2.attempt_no`, [s.assignment_id, s.student_id]);
    const queue = (await q<{ id: string }>(
      `select s3.id from public.submissions s3 join public.classrooms c3 on c3.id = s3.classroom_id
       where c3.teacher_id = $1 and s3.status in ('submitted','under_review') order by s3.submitted_at asc, s3.id`, [ctx.userId])).map((x) => x.id);
    return { s, questions, others, queue };
  });
  if (!d) notFound();
  const { s, questions, others, queue } = d;
  const isAdmin = ctx.memberships.some((m) => m.org_id === s.org_id && m.role === "school_admin");
  if (s.teacher_id !== ctx.userId && !isAdmin) notFound();

  const idx = queue.indexOf(s.id);
  const prev = idx > 0 ? queue[idx - 1] : null;
  const next = idx >= 0 ? queue[idx + 1] ?? null : queue[0] ?? null;
  const max = Number(s.max_score);
  const isQuiz = s.kind === "quiz";
  const code: string = s.code ?? "";
  const lines = code.split("\n");
  const answers: Record<string, unknown> = s.answers ?? {};
  const canGrade = s.status !== "draft";

  return (
    <>
      <PageHeader
        title={s.student}
        subtitle={<>{s.title} · {t(KIND_LABEL[s.kind] ?? s.kind)} · {s.class_name}</>}
        actions={<>
          <Link href="/teacher/review" className="btn-secondary">{t("Кезекке")}</Link>
          {prev ? <Link href={`/teacher/submissions/${prev}`} className="btn-secondary" rel="prev">{t("← Алдыңғы жұмыс")}</Link> : <span className="btn-secondary pointer-events-none opacity-50" aria-disabled="true">{t("← Алдыңғы жұмыс")}</span>}
          {next ? <Link href={`/teacher/submissions/${next}`} className="btn-secondary" rel="next">{t("Келесі жұмыс →")}</Link> : <span className="btn-secondary pointer-events-none opacity-50" aria-disabled="true">{t("Келесі жұмыс →")}</span>}
        </>}
      />
      <Notices err={sp.err} />
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="min-w-0 space-y-6">
          <section className="card p-5" aria-labelledby="meta-h">
            <h2 id="meta-h" className="sr-only">{t("Жұмыс туралы")}</h2>
            <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              <div><dt className="text-xs text-ink-muted">{t("Күйі")}</dt><dd className="mt-0.5"><StatusBadge status={s.status}  label={t(STATUS_LABEL[s.status] ?? s.status)}/></dd></div>
              <div><dt className="text-xs text-ink-muted">{t("Әрекет нөмірі")}</dt><dd className="mt-0.5 font-semibold">{s.attempt_no}</dd></div>
              <div><dt className="text-xs text-ink-muted">{t("Жіберілген")}</dt><dd className="mt-0.5 font-semibold">{fmtDate(s.submitted_at, true, t.locale)}</dd></div>
              <div><dt className="text-xs text-ink-muted">{t("Кеткен уақыт")}</dt><dd className="mt-0.5 font-semibold">{fmtDuration(s.time_spent_seconds, t.locale)}</dd></div>
            </dl>
          </section>

          {isQuiz ? (
            <section className="card p-5" aria-labelledby="qz-h">
              <h2 id="qz-h" className="mb-3 text-lg font-semibold">{t("Тест жауаптары")}</h2>
              {questions.length === 0 ? <p className="text-sm text-ink-muted">{t("Сұрақтар табылмады.")}</p> : (
                <ol className="space-y-4">
                  {questions.map((qn: any, i: number) => {
                    const raw = answers[qn.id];
                    const chosen = typeof raw === "number" ? raw : typeof raw === "string" && /^\d+$/.test(raw) ? Number(raw) : null;
                    const ok = chosen !== null && chosen === qn.correct_index;
                    return (
                      <li key={qn.id} className="rounded-xl border border-line p-4" data-testid="quiz-answer">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <p className="font-semibold">{i + 1}. {qn.prompt}</p>
                          <span className={`badge ${ok ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200" : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200"}`}>
                            {ok ? t("Дұрыс") : chosen === null ? t("Жауапсыз") : t("Қате")} · {ok ? fmtNum(qn.points, t.locale) : 0} / {fmtNum(qn.points, t.locale)}
                          </span>
                        </div>
                        <ul className="mt-2 space-y-1 text-sm">
                          {(qn.options as string[]).map((o, j) => (
                            <li key={j} className={`rounded-lg px-3 py-1.5 ${j === qn.correct_index ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100" : j === chosen ? "bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-100" : ""}`}>
                              {j === chosen ? "● " : "○ "}{o}
                              {j === qn.correct_index && <span className="ml-2 text-xs font-semibold">{t("дұрыс жауап")}</span>}
                              {j === chosen && j !== qn.correct_index && <span className="ml-2 text-xs font-semibold">{t("оқушы таңдады")}</span>}
                            </li>
                          ))}
                        </ul>
                        {qn.explanation && <p className="mt-2 text-xs text-ink-muted">{t("Түсіндірме:")}{" "}{qn.explanation}</p>}
                      </li>
                    );
                  })}
                </ol>
              )}
            </section>
          ) : (
            <section className="card p-5" aria-labelledby="code-h">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 id="code-h" className="text-lg font-semibold">{t("Оқушының жұмысы")}</h2>
                {code && <CopyButton text={code} label={t("Кодты көшіру")} testId="copy-submission" />}
              </div>
              {code.trim() === "" ? <p className="text-sm text-ink-muted">{t("Оқушы мәтін не код жазбаған.")}</p> : (
                <pre tabIndex={0} aria-label={t("Оқушы жазған код")} data-testid="submission-code"
                  className="max-h-[32rem] overflow-auto rounded-lg border border-line bg-surface-2 py-3 font-mono text-[13px] leading-6 text-ink [counter-reset:ln]">
                  {lines.map((ln, i) => (
                    <code key={i} className="block whitespace-pre pr-4 before:mr-4 before:inline-block before:w-10 before:select-none before:pr-2 before:text-right before:text-ink-muted before:[content:counter(ln)] before:[counter-increment:ln]">{ln === "" ? " " : ln}</code>
                  ))}
                </pre>
              )}
              <p className="hint">{t("Автоматты іске қосу әлі жоқ: жұмысты қолмен бағалаңыз.")}</p>
            </section>
          )}

          {others.length > 1 && (
            <section className="card p-5" aria-labelledby="oth-h">
              <h2 id="oth-h" className="mb-3 text-lg font-semibold">{t("Оқушының басқа әрекеттері")}</h2>
              <ul className="divide-y divide-line text-sm">
                {others.map((o: any) => (
                  <li key={o.id} className="flex flex-wrap items-center gap-3 py-2">
                    <span className="font-medium">{o.attempt_no}{t("-әрекет")}</span>
                    <StatusBadge status={o.status}  label={t(STATUS_LABEL[o.status] ?? o.status)}/>
                    <span className="text-ink-muted">{fmtDate(o.submitted_at, true, t.locale)}</span>
                    {o.score != null && <span>{fmtNum(o.score, t.locale)} / {fmtNum(max, t.locale)}</span>}
                    <span className="ml-auto">{o.id === s.id ? <span className="text-ink-muted">{t("осы жұмыс")}</span> : <Link href={`/teacher/submissions/${o.id}`}>{t("Ашу")}</Link>}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start" aria-label={t("Бағалау панелі")}>
          <section className="card p-5" aria-labelledby="gr-h">
            <h2 id="gr-h" className="text-lg font-semibold">{t("Бағалау")}</h2>
            {s.g_score != null && (
              <div className="mt-2 rounded-lg bg-brand-soft p-3 text-sm" data-testid="prev-grade">
                <p>{t("Қазіргі баға:")}{" "}<strong>{fmtNum(s.g_score, t.locale)} / {fmtNum(max, t.locale)}</strong> {s.g_source === "auto" ? t("(автоматты)") : `(${s.grader ?? t("мұғалім")})`}</p>
                <p className="text-xs text-ink-muted">{fmtDate(s.graded_at, true, t.locale)}</p>
                {s.g_feedback && <p className="mt-1 whitespace-pre-line">{t("Пікір:")}{" "}{s.g_feedback}</p>}
              </div>
            )}
            {!canGrade ? <Banner tone="warn">{t("Жұмыс әлі жіберілмеген: бағалау мүмкін емес.")}</Banner> : (
              <>
                {s.status === "submitted" && (
                  <form action={beginReviewAction} className="mt-3">
                    <input type="hidden" name="submission_id" value={s.id} />
                    <button type="submit" className="btn-secondary w-full">{t("Тексеруді бастау")}</button>
                  </form>
                )}
                <ActionForm action={gradeSubmissionAction} submitLabel={s.g_score != null ? t("Бағаны жаңарту") : t("Бағаны сақтау")} className="mt-3">
                  <input type="hidden" name="submission_id" value={s.id} />
                  <label className="label" htmlFor="g-score">{t("Баға (0 - {fmtNum})", { fmtNum: fmtNum(max, t.locale) })}</label>
                  <input id="g-score" name="score" type="number" required min={0} max={max} step="any" inputMode="decimal" defaultValue={s.g_score ?? ""} className="input" />
                  <label className="label mt-3" htmlFor="g-fb">{t("Пікір")}</label>
                  <textarea id="g-fb" name="feedback" rows={5} maxLength={4000} defaultValue={s.g_feedback ?? ""} className="input" placeholder={t("Оқушыға түсіндірме, ұсыныс")} />
                </ActionForm>
              </>
            )}
          </section>
          {next && <Link href={`/teacher/submissions/${next}`} className="btn-secondary w-full">{t("Келесі жұмысқа өту →")}</Link>}
        </aside>
      </div>
    </>
  );
}
