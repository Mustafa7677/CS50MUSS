import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ActionForm } from "@/components/ActionForm";
import { BlockView, type BlockData } from "@/components/course-builder/BlockView";
import { LessonNav, type NavModule } from "@/components/student/LessonNav";
import { ProgressBar } from "@/components/ui";
import { requireStudent } from "@/lib/context";
import { withUser } from "@/lib/db";
import { completeLessonAction } from "../../actions";

export const metadata = { title: "Курс" };
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Course = { id: string; title: string; description: string | null };
type Module = { id: string; title: string };
type Lesson = { id: string; module_id: string; title: string; blocks: BlockData[]; assignment_id: string | null };

export default async function CoursePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ lesson?: string }> }) {
  const { id } = await params;
  const { lesson: lessonParam } = await searchParams;
  if (!UUID.test(id)) notFound();
  const ctx = await requireStudent();

  const data = await withUser(ctx.userId, async (q) => {
    const [course] = await q<Course>("select id, title, description from public.courses where id = $1 and status = 'published'", [id]);
    if (!course) return null;
    const [modules, lessons, done] = await Promise.all([
      q<Module>("select id, title from public.course_modules where course_id = $1 order by position", [id]),
      q<Lesson>("select id, module_id, title, blocks, assignment_id from public.lessons where course_id = $1 order by position", [id]),
      q<{ lesson_id: string }>("select lesson_id from public.lesson_progress where course_id = $1 and student_id = auth.uid()", [id]),
    ]);
    const aids = [...new Set(lessons.map((l) => l.assignment_id).filter((x): x is string => !!x))];
    const assignments = aids.length ? await q<{ id: string; title: string }>("select id, title from public.assignments where id = any($1::uuid[])", [aids]) : [];
    return { course, modules, lessons, done: new Set(done.map((d) => d.lesson_id)), assignments: new Map(assignments.map((a) => [a.id, a.title])) };
  });
  if (!data) notFound();
  const { course, modules, done, assignments } = data;

  // Тізім модуль позициясы бойынша, сабақтар модуль ішінде
  const ordered: Lesson[] = modules.flatMap((m) => data.lessons.filter((l) => l.module_id === m.id));
  const navModules: NavModule[] = modules.map((m) => ({ id: m.id, title: m.title, lessons: ordered.filter((l) => l.module_id === m.id).map((l) => ({ id: l.id, title: l.title, done: done.has(l.id) })) }));
  const total = ordered.length;
  const completed = ordered.filter((l) => done.has(l.id)).length;

  const idx = lessonParam && UUID.test(lessonParam) ? ordered.findIndex((l) => l.id === lessonParam) : -1;
  const curIdx = idx >= 0 ? idx : Math.max(0, ordered.findIndex((l) => !done.has(l.id)));
  const cur = ordered[curIdx];
  // Ағымдағы сабақты URL-ге бекіту: аяқтағаннан кейін келесіге секіріп кетпеу үшін
  if (cur && idx < 0) redirect(`/student/courses/${course.id}?lesson=${cur.id}`);
  const prev = curIdx > 0 ? ordered[curIdx - 1] : null;
  const next = curIdx < ordered.length - 1 ? ordered[curIdx + 1] : null;
  const href = (l: Lesson) => `/student/courses/${course.id}?lesson=${l.id}`;
  const aTitle = cur?.assignment_id ? assignments.get(cur.assignment_id) : undefined;

  return (
    <>
      <p className="mb-3"><Link href="/student/courses" className="text-sm">← Курстар</Link></p>
      <div className="mb-6">
        <h1 className="break-words text-2xl font-bold tracking-tight">{course.title}</h1>
        {course.description && <p className="mt-1 break-words text-sm text-ink-muted">{course.description}</p>}
        <div className="mt-3 max-w-md">
          <ProgressBar value={completed} max={total} label="Курс прогресі" />
          <p className="mt-1 text-xs text-ink-muted" data-testid="course-progress">{completed} / {total} сабақ аяқталды</p>
        </div>
      </div>

      {total === 0 || !cur ? (
        <div className="card px-6 py-10 text-center text-ink-muted">Бұл курста әзірге сабақ жоқ.</div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[17rem_1fr]">
          <details className="card p-3 lg:hidden">
            <summary className="cursor-pointer text-sm font-semibold">Сабақтар тізімі ({completed}/{total})</summary>
            <div className="mt-3"><LessonNav courseId={course.id} modules={navModules} currentId={cur.id} /></div>
          </details>
          <aside className="card hidden h-fit p-4 lg:block"><LessonNav courseId={course.id} modules={navModules} currentId={cur.id} /></aside>

          <article className="min-w-0">
            <div className="card space-y-5 p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h2 className="break-words text-xl font-semibold" data-testid="lesson-title">{cur.title}</h2>
                {done.has(cur.id) && <span className="badge bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">Аяқталған</span>}
              </div>
              {(Array.isArray(cur.blocks) ? cur.blocks : []).length === 0
                ? <p className="text-sm text-ink-muted">Бұл сабақта мазмұн әзірге жоқ.</p>
                : (cur.blocks as BlockData[]).map((b, i) => <BlockView key={i} block={b} />)}
              {cur.assignment_id && aTitle && (
                <div className="rounded-xl border border-line bg-brand-soft p-4">
                  <p className="text-sm font-semibold">Сабаққа тапсырма бекітілген</p>
                  <Link href={`/student/assignments/${cur.assignment_id}`} className="btn-secondary mt-2 no-underline">{aTitle}</Link>
                </div>
              )}
              {!done.has(cur.id) && (
                <ActionForm action={completeLessonAction} submitLabel="Сабақты аяқтадым" successToast={false}>
                  <input type="hidden" name="lessonId" value={cur.id} />
                  <input type="hidden" name="courseId" value={course.id} />
                </ActionForm>
              )}
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
              {prev ? <Link href={href(prev)} className="btn-secondary no-underline">← Алдыңғы</Link> : <span />}
              {next ? <Link href={href(next)} className="btn-primary no-underline">Келесі →</Link> : <span />}
            </div>
          </article>
        </div>
      )}
    </>
  );
}
