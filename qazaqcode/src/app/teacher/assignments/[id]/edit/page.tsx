import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmButton } from "@/components/ConfirmButton";
import { PageHeader, StatusBadge } from "@/components/ui";
import { AssignmentForm, type AssignmentInit } from "@/components/teacher/AssignmentForm";
import { Notices } from "@/components/teacher/Notices";
import { requireStaff } from "@/lib/context";
import { withUser } from "@/lib/db";
import { archiveAssignmentAction, duplicateAssignmentAction, restoreAssignmentAction, saveAssignmentAction } from "../../../actions";
import { loadClassOptions, uuidOr404 } from "../../../_data";
import { getT } from "@/lib/i18n";
import { STATUS_LABEL } from "@/lib/format";

export async function generateMetadata() { const t = await getT(); return { title: t("Тапсырманы өзгерту") }; }
export const dynamic = "force-dynamic";

export default async function EditAssignment({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; err?: string }> }) { const t = await getT();
  const { id } = await params;
  const sp = await searchParams;
  uuidOr404(id);
  const ctx = await requireStaff();
  const data = await withUser(ctx.userId, async (q) => {
    const a = (await q<any>("select * from public.assignments where id = $1", [id]))[0];
    if (!a) return null;
    const qs = await q<any>(
      `select q.prompt, q.options, q.points, k.correct_index, k.explanation from public.assignment_questions q
       left join public.assignment_answer_keys k on k.question_id = q.id where q.assignment_id = $1 order by q.position`, [id]);
    const tcs = await q<any>("select input, expected_output, is_hidden, points from public.assignment_test_cases where assignment_id = $1 order by position", [id]);
    const targets = (await q<{ classroom_id: string }>("select classroom_id from public.assignment_targets where assignment_id = $1", [id])).map((tt) => tt.classroom_id);
    const locked = (await q<{ x: boolean }>("select exists (select 1 from public.submissions where assignment_id = $1) as x", [id]))[0].x;
    const works = (await q<{ n: string }>("select count(*) as n from public.submissions where assignment_id = $1 and status <> 'draft'", [id]))[0].n;
    return { a, qs, tcs, targets, locked, works: Number(works) };
  });
  if (!data) notFound();
  const { a } = data;
  const isAdmin = ctx.memberships.some((m) => m.org_id === a.org_id && m.role === "school_admin");
  if (a.created_by !== ctx.userId && !isAdmin) notFound();
  const classes = await loadClassOptions(ctx, data.targets);
  const init: AssignmentInit = {
    id: a.id, title: a.title, description: a.description, kind: a.kind, difficulty: a.difficulty, max_score: Number(a.max_score), starter_code: a.starter_code ?? "",
    max_attempts: a.max_attempts, deadline: a.deadline ? new Date(a.deadline).toISOString() : null, allow_late: a.allow_late, hints: Array.isArray(a.hints) ? a.hints : [],
    status: a.status, class_ids: data.targets,
    questions: data.qs.map((x: any) => ({ prompt: x.prompt, options: x.options, points: Number(x.points), correct_index: x.correct_index ?? 0, explanation: x.explanation ?? "" })),
    test_cases: data.tcs.map((x: any) => ({ input: x.input, expected_output: x.expected_output, is_hidden: x.is_hidden, points: Number(x.points) })),
  };
  return (
    <>
      <PageHeader
        title={a.title}
        subtitle={<span className="inline-flex items-center gap-2"><StatusBadge status={a.status}  label={t(STATUS_LABEL[a.status] ?? a.status)}/>{" "}{t("Жіберілген жұмыс:")}{" "}{data.works}</span>}
        actions={<>
          <Link href="/teacher/assignments" className="btn-secondary">{t("Тізімге")}</Link>
          <form action={duplicateAssignmentAction}>
            <input type="hidden" name="assignment_id" value={a.id} /><input type="hidden" name="back" value={`/teacher/assignments/${a.id}/edit`} />
            <button type="submit" className="btn-secondary">{t("Көшіру")}</button>
          </form>
          {a.status === "archived"
            ? <form action={restoreAssignmentAction}><input type="hidden" name="assignment_id" value={a.id} /><button type="submit" className="btn-secondary">{t("Жобаға қайтару")}</button></form>
            : <ConfirmButton action={archiveAssignmentAction} fields={{ assignment_id: a.id, back: `/teacher/assignments/${a.id}/edit` }} label={t("Мұрағатқа жіберу")} className="btn-secondary"
                title={t("Мұрағатқа жіберу?")} message={t("Тапсырма оқушыларға көрінбейді; жұмыстар мен бағалар сақталады. Кейін жобаға қайтаруға болады.")} confirmLabel={t("Мұрағатқа жіберу")} />}
        </>}
      />
      <Notices ok={sp.ok} err={sp.err} />
      <AssignmentForm action={saveAssignmentAction} classes={classes} locked={data.locked} init={init} />
    </>
  );
}
