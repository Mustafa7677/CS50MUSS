import Link from "next/link";
import { ActionForm } from "@/components/ActionForm";
import { EmptyState, PageHeader, StatCard, StatusBadge } from "@/components/ui";
import { Notices } from "@/components/teacher/Notices";
import { requireStaff } from "@/lib/context";
import { withUser } from "@/lib/db";
import { createClassAction } from "./actions";
import { toNum } from "./_data";
import { getT } from "@/lib/i18n";
import { STATUS_LABEL } from "@/lib/format";

export async function generateMetadata() { const t = await getT(); return { title: t("Сыныптарым") }; }
export const dynamic = "force-dynamic";

type Row = { id: string; name: string; subject: string; academic_year: string; status: string; join_enabled: boolean; students: string; pending: string };

export default async function TeacherHome({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string }> }) { const t = await getT();
  const sp = await searchParams;
  const ctx = await requireStaff();
  const org = ctx.active.org_id;
  const { classes, stats } = await withUser(ctx.userId, async (q) => {
    const classes = await q<Row>(
      `select c.id, c.name, c.subject, c.academic_year, c.status, c.join_enabled,
         (select count(*) from public.classroom_students cs where cs.classroom_id = c.id and cs.status = 'active') as students,
         (select count(*) from public.submissions s where s.classroom_id = c.id and s.status in ('submitted','under_review')) as pending
       from public.classrooms c where c.teacher_id = $1 and c.org_id = $2 order by (c.status = 'archived'), c.created_at desc`, [ctx.userId, org]);
    const published = (await q<{ n: string }>("select count(*) as n from public.assignments where created_by = $1 and org_id = $2 and status = 'published'", [ctx.userId, org]))[0].n;
    return { classes, stats: { published: toNum(published) } };
  });
  const active = classes.filter((c) => c.status === "active");
  const studentsTotal = active.reduce((s, c) => s + toNum(c.students), 0);
  const pendingTotal = classes.reduce((s, c) => s + toNum(c.pending), 0);

  return (
    <>
      <PageHeader title={t("Сыныптарым")} subtitle={t("Сыныптарыңыз, оқушылар мен тексеруді күтетін жұмыстар.")} />
      <Notices ok={sp.ok} err={sp.err} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" data-testid="teacher-stats">
        <StatCard label={t("Сыныптар")} value={active.length} />
        <StatCard label={t("Оқушылар")} value={studentsTotal} />
        <StatCard label={t("Жарияланған тапсырма")} value={stats.published} />
        <StatCard label={t("Тексеруді күтеді")} value={pendingTotal} tone={pendingTotal ? "warn" : undefined} hint={pendingTotal ? t("Тексеру кезегіне өтіңіз") : t("Кезек бос")} />
      </div>

      <section className="mt-8" aria-labelledby="cls-h">
        <h2 id="cls-h" className="mb-3 text-lg font-semibold">{t("Сыныптар")}</h2>
        {classes.length === 0 ? (
          <EmptyState title={t("Әзірге сынып жоқ")} text={t("Төмендегі форма арқылы алғашқы сыныпты ашыңыз: оқушылар қосылу коды арқылы кіреді.")} />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {classes.map((c) => (
              <li key={c.id} className="card flex flex-col p-5" data-testid="class-card">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-lg font-bold"><Link href={`/teacher/classes/${c.id}`} className="text-ink no-underline hover:text-brand">{c.name}</Link></h3>
                  {c.status === "archived" && <StatusBadge status="archived"  label={t(STATUS_LABEL["archived"] ?? "archived")}/>}
                </div>
                <p className="text-sm text-ink-muted">{c.subject} · {c.academic_year}</p>
                <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <div><dt className="text-xs text-ink-muted">{t("Оқушылар")}</dt><dd className="text-xl font-bold">{toNum(c.students)}</dd></div>
                  <div><dt className="text-xs text-ink-muted">{t("Кезек күтеді")}</dt><dd className={`text-xl font-bold ${toNum(c.pending) ? "text-amber-600" : ""}`}>{toNum(c.pending)}</dd></div>
                </dl>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={`/teacher/classes/${c.id}`} className="btn-primary">{t("Ашу")}</Link>
                  {toNum(c.pending) > 0 && <Link href={`/teacher/review?class=${c.id}`} className="btn-secondary">{t("Тексеру")}</Link>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8" aria-labelledby="new-h">
        <h2 id="new-h" className="mb-3 text-lg font-semibold">{t("Жаңа сынып")}</h2>
        <div className="card max-w-2xl p-5">
          <ActionForm action={createClassAction} submitLabel={t("Сынып ашу")} successToast={false}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="nc-name">{t("Сынып атауы")}</label>
                <input id="nc-name" name="name" required maxLength={120} className="input" placeholder={t("Мысалы, 9А")} />
              </div>
              <div>
                <label className="label" htmlFor="nc-year">{t("Оқу жылы")}</label>
                <input id="nc-year" name="year" required minLength={4} maxLength={20} defaultValue="2025-2026" className="input" />
              </div>
              <div>
                <label className="label" htmlFor="nc-subject">{t("Пән")}</label>
                <input id="nc-subject" name="subject" required maxLength={120} defaultValue={t("Информатика")} className="input" />
              </div>
              <div>
                <label className="label" htmlFor="nc-limit">{t("Оқушы лимиті")}</label>
                <input id="nc-limit" name="limit" type="number" min={1} max={500} inputMode="numeric" className="input" placeholder={t("Шектеусіз")} />
                <p className="hint">{t("Бос қалдырсаңыз, лимит қойылмайды.")}</p>
              </div>
            </div>
            <div className="mt-4">
              <label className="label" htmlFor="nc-desc">{t("Сипаттамасы")}</label>
              <textarea id="nc-desc" name="description" rows={3} maxLength={1000} className="input" placeholder={t("Міндетті емес")} />
            </div>
          </ActionForm>
        </div>
      </section>
    </>
  );
}
