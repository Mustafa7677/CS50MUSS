import { requireSchoolAdmin } from "@/lib/context";
import { withUser } from "@/lib/db";
import { EmptyState, PageHeader } from "@/components/ui";

export const metadata = { title: "Мектеп есебі" };
export const dynamic = "force-dynamic";

export default async function ExportPage() {
  const ctx = await requireSchoolAdmin();
  const n = await withUser(ctx.userId, async (q) => (await q<{ n: number }>(
    `select count(*)::int as n from public.assignment_targets t join public.assignments a on a.id = t.assignment_id and a.status = 'published'
       join public.classroom_students cs on cs.classroom_id = t.classroom_id and cs.status = 'active' where a.org_id = $1`, [ctx.active.org_id]))[0].n);
  return (
    <>
      <PageHeader title="Мектеп есебі" subtitle="Барлық сыныптар бойынша орындау мен баллдарды CSV файлына жүктеңіз." />
      {n === 0 ? <EmptyState title="Есепке дерек жоқ" text="Сыныптарға тапсырма жарияланғанда есеп толады." /> : (
        <div className="card p-5">
          <h2 className="text-lg font-semibold">CSV есебі</h2>
          <p className="mt-1 text-sm text-ink-muted">Бағандар: сынып, оқушы, тапсырма, күй, балл, күні. Жолдар саны: {n}. Файл UTF-8 кодтауында, Excel-де ашуға болады.</p>
          <p className="mt-4"><a className="btn-primary" href="/school/export/csv" download>CSV жүктеу</a></p>
        </div>
      )}
      <p className="mt-4 text-sm text-ink-muted">Excel және PDF экспорты 2-кезеңде қосылады.</p>
    </>
  );
}
