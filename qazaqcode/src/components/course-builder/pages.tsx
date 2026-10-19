import Link from "next/link";
import { safeErrText } from "@/lib/errors";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/ActionForm";
import { ConfirmButton } from "@/components/ConfirmButton";
import { Banner, EmptyState, PageHeader, ProgressBar, Section, StatusBadge } from "@/components/ui";
import { requireStaff } from "@/lib/context";
import { withUser } from "@/lib/db";
import { fmtDate } from "@/lib/format";
import {
  createCourseAction, duplicateCourseAction, setCourseStatusAction, setCourseTargetsAction, updateCourseInfoAction,
} from "@/app/courses-actions";
import { BlockView } from "./BlockView";
import { CourseBuilder } from "./CourseBuilder";
import { loadTree } from "./data";
import { courseBase, type Area, type AssignmentOption } from "./types";
import { getT } from "@/lib/i18n";
import { STATUS_LABEL } from "@/lib/format";
import type { TFn } from "@/lib/i18n/core";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const num = (v: unknown) => (v == null ? 0 : Number(v));

const OK = (t: TFn): Record<string, string> => ({
  created: t("Курс жасалды. Енді модульдер мен сабақтарды қосыңыз."),
  duplicated: t("Көшірме жоба ретінде жасалды. Сыныптарға бекітілмеген."),
  published: t("Курс жарияланды: бекітілген сыныптардың оқушылары көреді."),
  draft: t("Курс жобаға қайтарылды: оқушыларға көрінбейді."),
  archived: t("Курс мұрағатқа жіберілді."),
});
async function Notices({ ok, err }: { ok?: string; err?: string }) { const t = await getT();
  return (
    <>
      {err && <Banner tone="bad">{t(safeErrText(err.slice(0, 300)) ?? "")}</Banner>}
      {ok && OK(t)[ok] && <Banner tone="info">{OK(t)[ok]}</Banner>}
    </>
  );
}

// ---------- Курстар тізімі ----------
type Row = { id: string; title: string; status: string; author: string | null; mine: boolean; updated_at: string; modules: string; lessons: string; classes: string[] | null };
const FILTERS = (t: TFn) => [["all", t("Барлығы")], ["draft", t("Жоба")], ["published", t("Жарияланған")], ["archived", t("Мұрағат")]] as const;

export async function CourseListPage({ area, searchParams }: { area: Area; searchParams: { status?: string; ok?: string; err?: string } }) { const t = await getT();
  const ctx = await requireStaff();
  const base = courseBase(area);
  const status = FILTERS(t).some(([k]) => k === searchParams.status) && searchParams.status !== "all" ? searchParams.status! : null;
  // әкімші (/school) ұйымның барлық курсын көреді; мұғалім (/teacher) тек өзінікін
  const onlyMine = area !== "school";
  const rows = await withUser(ctx.userId, (q) => q<Row>(
    `select c.id, c.title, c.status, p.full_name as author, (c.created_by = $2) as mine, c.updated_at,
       (select count(*) from public.course_modules m where m.course_id = c.id) as modules,
       (select count(*) from public.lessons l where l.course_id = c.id) as lessons,
       (select array_agg(z.name order by z.name) from public.course_targets t join public.classrooms z on z.id = t.classroom_id where t.course_id = c.id) as classes
     from public.courses c left join public.profiles p on p.id = c.created_by
     where c.org_id = $1 and ($3::boolean = false or c.created_by = $2) and ($4::text is null or c.status::text = $4)
     order by c.updated_at desc`, [ctx.active.org_id, ctx.userId, onlyMine, status]));
  const href = (s: string) => (s === "all" ? base : `${base}?status=${s}`);
  const newBtn = <Link href={`${base}/new`} className="btn-primary">{t("Жаңа курс")}</Link>;
  return (
    <>
      <PageHeader title={t("Курстар")} subtitle={onlyMine ? t("Өзіңіз жасаған курстар.") : t("Ұйымның барлық курстары.")} actions={newBtn} />
      <Notices ok={searchParams.ok} err={searchParams.err} />
      <nav aria-label={t("Күй бойынша сүзгі")} className="mb-4 flex flex-wrap gap-1">
        {FILTERS(t).map(([k, label]) => {
          const on = (status ?? "all") === k;
          return <Link key={k} href={href(k)} aria-current={on ? "page" : undefined} className={`rounded-full border px-3 py-1 text-sm font-medium no-underline ${on ? "border-brand bg-brand text-brand-ink" : "border-line bg-surface text-ink hover:bg-surface-2"}`}>{label}</Link>;
        })}
      </nav>
      {rows.length === 0 ? (
        <EmptyState title={status ? t("Бұл күйде курс жоқ") : t("Әзірге курс жоқ")} text={t("Курс жасап, модульдер мен сабақтар қосыңыз, содан кейін сыныптарға жариялаңыз.")} action={newBtn} />
      ) : (
        <div className="table-wrap">
          <table className="w-full min-w-[56rem]">
            <caption className="sr-only">{t("Курстар")}</caption>
            <thead className="border-b border-line"><tr>
              <th className="th">{t("Курс")}</th><th className="th">{t("Күйі")}</th><th className="th">{t("Сабақ")}</th><th className="th">{t("Сыныптар")}</th>
              {!onlyMine && <th className="th">{t("Автор")}</th>}<th className="th">{t("Жаңартылған")}</th><th className="th"><span className="sr-only">{t("Әрекеттер")}</span></th>
            </tr></thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.id} data-testid="course-row">
                  <td className="td font-medium"><Link href={`${base}/${r.id}`}>{r.title}</Link></td>
                  <td className="td"><StatusBadge status={r.status}  label={t(STATUS_LABEL[r.status] ?? r.status)}/></td>
                  <td className="td">{num(r.lessons)}<span className="text-ink-muted">{" "}{t("/ {num} модуль", { num: num(r.modules) })}</span></td>
                  <td className="td">{r.classes?.length ? r.classes.join(", ") : <span className="text-ink-muted">{t("Бекітілмеген")}</span>}</td>
                  {!onlyMine && <td className="td">{r.author ?? "-"}{r.mine && <span className="text-ink-muted">{" "}{t("(сіз)")}</span>}</td>}
                  <td className="td whitespace-nowrap">{fmtDate(r.updated_at, true, t.locale)}</td>
                  <td className="td">
                    <div className="flex justify-end gap-2">
                      <Link href={`${base}/${r.id}`} className="btn-secondary text-xs">{t("Ашу")}</Link>
                      <form action={duplicateCourseAction}><input type="hidden" name="area" value={area} /><input type="hidden" name="course_id" value={r.id} /><button type="submit" className="btn-secondary text-xs">{t("Көшірме жасау")}</button></form>
                      {r.status === "archived"
                        ? <ConfirmButton action={setCourseStatusAction} fields={{ area, course_id: r.id, status: "published", to: "list" }} label={t("Қайта жариялау")} className="btn-secondary text-xs" danger={false} title={t("Курсты қайта жариялау?")} message={t("Курс бекітілген сыныптардың оқушыларына қайта көрінеді.")} confirmLabel={t("Жариялау")} />
                        : <ConfirmButton action={setCourseStatusAction} fields={{ area, course_id: r.id, status: "archived", to: "list" }} label={t("Архивтеу")} className="btn-secondary text-xs" title={t("Курсты архивтеу?")} message={t("Курс оқушыларға көрінбейді; прогресс сақталады. Кейін қайта жариялауға болады.")} confirmLabel={t("Архивтеу")} />}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

// ---------- Жаңа курс ----------
export async function NewCoursePage({ area }: { area: Area }) { const t = await getT();
  await requireStaff();
  return (
    <>
      <PageHeader title={t("Жаңа курс")} subtitle={t("Алдымен атауын беріңіз, модульдер мен сабақтарды келесі қадамда қосасыз.")} />
      <div className="card max-w-2xl p-5">
        <ActionForm action={createCourseAction} submitLabel={t("Курс жасау")} successToast={false}
          footer={<Link href={courseBase(area)} className="btn-secondary">{t("Бас тарту")}</Link>}>
          <input type="hidden" name="area" value={area} />
          <div className="grid gap-4">
            <div><label htmlFor="c-title" className="label">{t("Курс атауы")}</label><input id="c-title" name="title" required maxLength={160} className="input" placeholder={t("Мысалы: Python негіздері")} /></div>
            <div><label htmlFor="c-desc" className="label">{t("Сипаттамасы")}</label><textarea id="c-desc" name="description" rows={4} maxLength={2000} className="input" /><p className="hint">{t("Міндетті емес, 2000 символға дейін.")}</p></div>
          </div>
        </ActionForm>
      </div>
    </>
  );
}

// ---------- Курс беті ----------
const TABS = (t: TFn) => [["structure", t("Құрылым")], ["settings", t("Баптаулар")], ["preview", t("Алдын ала қарау")], ["progress", t("Прогресс")]] as const;
type Course = { id: string; org_id: string; created_by: string; title: string; description: string | null; status: string; updated_at: string; published_at: string | null };

export async function CoursePage({ area, id, searchParams }: { area: Area; id: string; searchParams: { tab?: string; ok?: string; err?: string } }) { const t = await getT();
  if (!UUID_RE.test(id)) notFound();
  const ctx = await requireStaff();
  const base = courseBase(area);
  const tab = TABS(t).some(([k]) => k === searchParams.tab) ? searchParams.tab! : "structure";
  const isAdmin = (org: string) => ctx.memberships.some((m) => m.org_id === org && m.role === "school_admin");

  const course = await withUser(ctx.userId, async (q) => {
    const c = (await q<Course & { can: boolean }>("select c.*, public.can_manage_course(c.id) as can from public.courses c where c.id = $1", [id]))[0];
    return c && c.can ? c : null;
  });
  if (!course) notFound();
  const admin = isAdmin(course.org_id);

  const tabs = (
    <nav aria-label={t("Курс бөлімдері")} className="mb-5 flex flex-wrap gap-1 border-b border-line pb-2">
      {TABS(t).map(([k, label]) => (
        <Link key={k} href={`${base}/${id}?tab=${k}`} aria-current={tab === k ? "page" : undefined}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium no-underline ${tab === k ? "bg-brand text-brand-ink" : "text-ink hover:bg-surface-2"}`}>{label}</Link>
      ))}
    </nav>
  );
  const header = (
    <PageHeader title={course.title} subtitle={<span className="inline-flex flex-wrap items-center gap-2"><StatusBadge status={course.status}  label={t(STATUS_LABEL[course.status] ?? course.status)}/><Link href={base} className="text-sm">{t("Барлық курстар")}</Link></span>} />
  );

  let body: React.ReactNode = null;

  if (tab === "structure") {
    const { tree, assignments } = await withUser(ctx.userId, async (q) => ({
      tree: await loadTree(q, id),
      assignments: await q<AssignmentOption>(
        `select a.id, a.title, a.status::text as status, a.kind::text as kind from public.assignments a
         where a.org_id = $1 and (a.status in ('draft','published') or a.id in (select assignment_id from public.lessons where course_id = $3 and assignment_id is not null))
           and (a.created_by = $2 or $4::boolean) order by a.updated_at desc limit 300`, [course.org_id, ctx.userId, id, admin]),
    }));
    body = <CourseBuilder courseId={id} area={area} initial={tree} assignments={assignments} />;
  }

  if (tab === "settings") {
    const { classes, targets } = await withUser(ctx.userId, async (q) => {
      const targets = (await q<{ classroom_id: string }>("select classroom_id from public.course_targets where course_id = $1", [id])).map((r) => r.classroom_id);
      const classes = await q<{ id: string; name: string; subject: string; academic_year: string; status: string }>(
        `select id, name, subject, academic_year, status::text as status from public.classrooms
         where org_id = $1 and ((status = 'active' and (teacher_id = $2 or $3::boolean)) or id = any($4::uuid[])) order by name`,
        [course.org_id, ctx.userId, admin, targets]);
      return { classes, targets };
    });
    const st = course.status;
    const sf = { area, course_id: id };
    body = (
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-3 text-lg font-semibold">{t("Негізгі ақпарат")}</h2>
          <ActionForm action={updateCourseInfoAction}>
            <input type="hidden" name="area" value={area} /><input type="hidden" name="course_id" value={id} />
            <div className="grid gap-4">
              <div><label htmlFor="s-title" className="label">{t("Курс атауы")}</label><input id="s-title" name="title" required maxLength={160} defaultValue={course.title} className="input" /></div>
              <div><label htmlFor="s-desc" className="label">{t("Сипаттамасы")}</label><textarea id="s-desc" name="description" rows={4} maxLength={2000} defaultValue={course.description ?? ""} className="input" /></div>
            </div>
          </ActionForm>
        </div>
        <div className="card p-5">
          <h2 className="mb-1 text-lg font-semibold">{t("Сыныптарға бекіту")}</h2>
          <p className="mb-3 text-sm text-ink-muted">{t("Жарияланған курсты тек таңдалған сыныптардың оқушылары көреді.")}</p>
          {classes.length === 0 ? <p className="text-sm text-ink-muted">{t("Бекітуге қолжетімді сынып жоқ. Алдымен сынып ашыңыз.")}</p> : (
            <ActionForm action={setCourseTargetsAction} submitLabel={t("Бекітуді сақтау")}>
              <input type="hidden" name="area" value={area} /><input type="hidden" name="course_id" value={id} />
              <fieldset className="grid gap-2"><legend className="sr-only">{t("Сыныптар")}</legend>
                {classes.map((c) => (
                  <label key={c.id} className="flex items-start gap-2 text-sm">
                    <input type="checkbox" name="class_ids" value={c.id} defaultChecked={targets.includes(c.id)} className="mt-1" />
                    <span><span className="font-medium">{c.name}</span> <span className="text-ink-muted">· {c.subject}, {c.academic_year}{c.status === "archived" ? (" " + t("· мұрағат")) : ""}</span></span>
                  </label>
                ))}
              </fieldset>
            </ActionForm>
          )}
        </div>
        <div className="card p-5 lg:col-span-2">
          <h2 className="mb-1 text-lg font-semibold">{t("Күйі")}</h2>
          <p className="mb-3 text-sm text-ink-muted">{t("Қазір:")}{" "}<StatusBadge status={st}  label={t(STATUS_LABEL[st] ?? st)}/>{t(". Жариялау үшін кемінде бір сабақ пен бір сынып керек. Құрылымды алдымен сақтаңыз.")}</p>
          <div className="flex flex-wrap gap-2">
            {st !== "published" && <ConfirmButton action={setCourseStatusAction} fields={{ ...sf, status: "published" }} label={st === "archived" ? t("Қайта жариялау") : t("Жариялау")} className="btn-primary" danger={false} title={t("Курсты жариялау?")} message={t("Бекітілген сыныптардың оқушылары курсты көреді және хабарландыру алады.")} confirmLabel={t("Жариялау")} />}
            {st === "published" && <ConfirmButton action={setCourseStatusAction} fields={{ ...sf, status: "draft" }} label={t("Жобаға қайтару")} className="btn-secondary" title={t("Жобаға қайтару?")} message={t("Курс оқушыларға көрінбейді; прогресс сақталады.")} confirmLabel={t("Жобаға қайтару")} />}
            {st !== "archived" && <ConfirmButton action={setCourseStatusAction} fields={{ ...sf, status: "archived" }} label={t("Архивтеу")} className="btn-secondary" title={t("Курсты архивтеу?")} message={t("Курс оқушыларға көрінбейді. Кейін қайта жариялауға болады.")} confirmLabel={t("Архивтеу")} />}
            <form action={duplicateCourseAction}><input type="hidden" name="area" value={area} /><input type="hidden" name="course_id" value={id} /><button type="submit" className="btn-secondary">{t("Көшірме жасау")}</button></form>
          </div>
        </div>
      </div>
    );
  }

  if (tab === "preview") {
    const { tree, titles } = await withUser(ctx.userId, async (q) => {
      const tree = await loadTree(q, id);
      const ids = tree.flatMap((m) => m.lessons.map((l) => l.assignment_id).filter(Boolean)) as string[];
      const rows = ids.length ? await q<{ id: string; title: string }>("select id, title from public.assignments where id = any($1::uuid[])", [ids]) : [];
      return { tree, titles: new Map(rows.map((r) => [r.id, r.title])) };
    });
    body = (
      <div data-testid="course-preview">
        <Banner tone="info">{t("Оқушы көретіндей көрініс (соңғы сақталған нұсқа).")}</Banner>
        {course.description && <p className="mb-6 whitespace-pre-wrap text-ink-muted">{course.description}</p>}
        {tree.length === 0 ? <EmptyState title={t("Курс бос")} text={t("Құрылым бөлімінде модуль мен сабақ қосып, сақтаңыз.")} /> : tree.map((m, mi) => (
          <section key={m.id} className="mb-8">
            <h2 className="mb-3 text-xl font-bold">{mi + 1}. {m.title}</h2>
            <div className="grid gap-4">
              {m.lessons.length === 0 && <p className="text-sm text-ink-muted">{t("Сабақ жоқ.")}</p>}
              {m.lessons.map((l, li) => (
                <article key={l.id} className="card p-4 sm:p-5">
                  <h3 className="mb-3 text-lg font-semibold">{mi + 1}.{li + 1} {l.title}</h3>
                  <div className="grid gap-4">
                    {l.blocks.map((b, bi) => <BlockView key={bi} block={b} />)}
                    {l.assignment_id && <p className="rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm">{t("Тапсырма / тест:")}{" "}<span className="font-medium">{titles.get(l.assignment_id) ?? t("тапсырма")}</span></p>}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    );
  }

  if (tab === "progress") {
    const rows = await withUser(ctx.userId, (q) => q<{ student_id: string; full_name: string; completed: string; total: string }>("select * from public.course_progress($1)", [id]));
    body = rows.length === 0 ? (
      <EmptyState title={t("Оқушылар жоқ")} text={t("Прогресс курс бекітілген сыныптардағы оқушылар бойынша көрсетіледі. Курсты сыныпқа бекітіңіз.")} />
    ) : (
      <Section title={t("Оқушылар прогресі")}>
        <div className="table-wrap">
          <table className="w-full min-w-[32rem]" data-testid="progress-table">
            <caption className="sr-only">{t("Курс прогресі")}</caption>
            <thead className="border-b border-line"><tr><th className="th">{t("Оқушы")}</th><th className="th">{t("Аяқталған сабақ")}</th><th className="th w-1/3">{t("Прогресс")}</th></tr></thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.student_id}>
                  <td className="td font-medium">{r.full_name}</td>
                  <td className="td">{num(r.completed)} / {num(r.total)}</td>
                  <td className="td"><ProgressBar value={num(r.completed)} max={num(r.total)} label={t("{full_name}: прогресс", { full_name: r.full_name })} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    );
  }

  return (
    <>
      {header}
      <Notices ok={searchParams.ok} err={searchParams.err} />
      {tabs}
      {body}
    </>
  );
}
