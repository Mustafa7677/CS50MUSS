import { notFound } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/ui";
import { requireStudent } from "@/lib/context";
import { withUser } from "@/lib/db";
import { DIFFICULTY_LABEL, KIND_LABEL, fmtDate } from "@/lib/format";
import { myAssignments } from "../../data";
import { Hints } from "./Hints";
import { Workspace, type Answers, type QuizResult, type Question } from "./Workspace";

export const dynamic = "force-dynamic";
export const metadata = { title: "Тапсырма" };

type A = { id: string; title: string; description: string; kind: string; difficulty: string; max_score: string; starter_code: string | null;
  max_attempts: number | null; deadline: string | null; allow_late: boolean; hints: unknown };
type Sub = { id: string; attempt_no: number; status: string; code: string | null; answers: Answers; time_spent_seconds: number };
type Grade = { score: string; max_score: string; feedback: string | null; graded_at: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function AssignmentPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireStudent();
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  // RLS: оқушы тек өз сыныбына берілген жарияланған тапсырманы көреді
  const mine = (await myAssignments(ctx.userId)).find((r) => r.assignment_id === id);
  if (!mine) notFound();

  const data = await withUser(ctx.userId, async (q) => {
    const a = (await q<A>(
      `select id, title, description, kind, difficulty, max_score, starter_code, max_attempts, deadline, allow_late, hints from public.assignments where id = $1`, [id]))[0];
    if (!a) return null;
    const subs = await q<Sub>(
      `select id, attempt_no, status, code, answers, time_spent_seconds from public.submissions where assignment_id = $1 and student_id = auth.uid() order by attempt_no`, [id]);
    const questions = a.kind === "quiz"
      ? await q<Question>(`select id, prompt, options, points::float as points from public.assignment_questions where assignment_id = $1 order by position`, [id]) : [];
    const tests = a.kind === "quiz" ? [] : await q<{ input: string; expected_output: string }>(
      `select input, expected_output from public.assignment_test_cases where assignment_id = $1 and is_hidden = false order by position`, [id]);
    const lastSub = [...subs].reverse().find((s) => s.status !== "draft");
    let result: QuizResult | null = null; let grade: Grade | null = null;
    if (lastSub) {
      if (a.kind === "quiz") {
        const r = (await q<{ score: string; passed: number; total: number; details: QuizResult["details"] }>(
          `select score, passed, total, details from public.submission_results where submission_id = $1 order by created_at desc limit 1`, [lastSub.id]))[0];
        if (r) result = { score: Number(r.score), max_score: Number(a.max_score), passed: r.passed, total: r.total, details: r.details };
      }
      grade = (await q<Grade>(`select score, max_score, feedback, graded_at from public.grades where submission_id = $1`, [lastSub.id]))[0] ?? null;
    }
    return { a, subs, questions, tests, lastSub, result, grade };
  });
  if (!data) notFound();
  const { a, subs, questions, tests, lastSub, result, grade } = data;

  const draft = subs.find((s) => s.status === "draft") ?? null;
  const used = subs.filter((s) => s.status !== "draft").length;
  const attemptsLeft = a.max_attempts == null || used < a.max_attempts;
  const pastDeadline = !!a.deadline && new Date(a.deadline).getTime() < Date.now() && !a.allow_late;
  const blocked = pastDeadline
    ? (lastSub || draft ? "Тапсыру мерзімі өтті: жұмысты енді жіберуге болмайды." : "Тапсыру мерзімі өтті, жұмыс жіберілмеді. Мұғалімге хабарласыңыз.")
    : !draft && !attemptsLeft ? "Әрекеттер саны таусылды." : null;
  const hints = Array.isArray(a.hints) ? (a.hints as unknown[]).filter((h): h is string => typeof h === "string" && h.trim() !== "") : [];

  return (
    <>
      <p className="mb-2 text-sm"><Link href="/student/assignments">← Тапсырмаларым</Link></p>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <aside className="space-y-5 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:self-start lg:overflow-y-auto lg:pr-1" aria-label="Тапсырма шарты">
          <div className="card space-y-4 p-5">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={mine.status} />
                <span className="badge bg-brand-soft text-brand">{KIND_LABEL[a.kind] ?? a.kind}</span>
                <span className="badge bg-surface-2 text-ink-muted">{DIFFICULTY_LABEL[a.difficulty] ?? a.difficulty}</span>
              </div>
              <h1 className="mt-2 text-2xl font-bold tracking-tight">{a.title}</h1>
              <p className="text-sm text-ink-muted">{mine.classroom_name}</p>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-xs text-ink-muted">Мерзімі</dt><dd className={pastDeadline ? "font-semibold text-red-600" : ""}>{a.deadline ? fmtDate(a.deadline, true) : "Мерзімсіз"}</dd></div>
              <div><dt className="text-xs text-ink-muted">Максималды балл</dt><dd>{Number(a.max_score)}</dd></div>
              <div><dt className="text-xs text-ink-muted">Әрекеттер</dt><dd>{used}{a.max_attempts ? ` / ${a.max_attempts}` : " (шектеусіз)"}</dd></div>
              {a.allow_late && <div><dt className="text-xs text-ink-muted">Кешігіп тапсыру</dt><dd>рұқсат етілген</dd></div>}
            </dl>
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">Шарты</h2>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{a.description || "Сипаттама берілмеген."}</p>
            </div>
            <Hints hints={hints} />
            <Link href={`/student/ai?assignment=${a.id}`} className="btn-secondary w-full sm:w-auto" data-testid="ask-helper">🤖 Көмекшіден сұрау</Link>
            {tests.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">Мысалдар</h2>
                <ul className="mt-2 space-y-2">
                  {tests.map((t, i) => (
                    <li key={i} className="rounded-lg border border-line bg-surface-2 p-3 text-sm">
                      <p className="text-xs text-ink-muted">Кіріс</p><pre className="overflow-x-auto whitespace-pre-wrap font-mono text-xs">{t.input || "(бос)"}</pre>
                      <p className="mt-1 text-xs text-ink-muted">Күтілетін нәтиже</p><pre className="overflow-x-auto whitespace-pre-wrap font-mono text-xs">{t.expected_output}</pre>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {grade && (!result || grade.feedback) && (
            <div className="card border-emerald-300 p-5 dark:border-emerald-800" data-testid="grade-card">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">Баға</h2>
              <p className="mt-1 text-3xl font-bold text-emerald-600">{Number(grade.score)} / {Number(grade.max_score)}</p>
              <p className="text-xs text-ink-muted">{fmtDate(grade.graded_at)}</p>
              {grade.feedback && <p className="mt-3 rounded-lg bg-brand-soft px-3 py-2 text-sm"><span className="font-semibold">Мұғалім пікірі:</span> {grade.feedback}</p>}
            </div>
          )}
        </aside>

        <section aria-label="Жұмыс орны" className="min-w-0">
          <Workspace
            key={`${draft?.id ?? "n"}-${lastSub?.attempt_no ?? 0}`}
            userId={ctx.userId} assignmentId={a.id} kind={a.kind} starterCode={a.starter_code ?? ""} questions={questions}
            draft={draft ? { id: draft.id, code: draft.code ?? "", answers: draft.answers ?? {}, seconds: draft.time_spent_seconds } : null}
            last={lastSub ? { code: lastSub.code ?? "", answers: lastSub.answers ?? {}, status: lastSub.status, attemptNo: lastSub.attempt_no } : null}
            result={result} blocked={blocked} canRetry={!pastDeadline && attemptsLeft && !!lastSub && !draft}
          />
        </section>
      </div>
    </>
  );
}

