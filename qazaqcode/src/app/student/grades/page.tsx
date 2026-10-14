import Link from "next/link";
import { EmptyState, PageHeader, Section, StatCard } from "@/components/ui";
import { requireStudent } from "@/lib/context";
import { withUser } from "@/lib/db";
import { fmtDate, fmtPct } from "@/lib/format";
import { GradesChart } from "./GradesChart";

export const metadata = { title: "Бағаларым" };
export const dynamic = "force-dynamic";

type Row = { id: string; assignment_id: string; title: string; classroom_name: string | null; score: string; max_score: string; feedback: string | null; graded_at: string; source: string };

export default async function GradesPage() {
  const ctx = await requireStudent();
  const rows = await withUser(ctx.userId, (q) => q<Row>(
    `select g.id, a.id as assignment_id, a.title, c.name as classroom_name, g.score, g.max_score, g.feedback, g.graded_at, g.source
       from public.grades g
       join public.assignments a on a.id = g.assignment_id
       left join public.submissions s on s.id = g.submission_id
       left join public.classrooms c on c.id = s.classroom_id
      where g.student_id = auth.uid() order by g.graded_at desc`));
  const pct = (r: Row) => (Number(r.score) / Number(r.max_score)) * 100;
  // Жалпы орташа: әр тапсырма бойынша ең үздік баға
  const best = new Map<string, number>();
  for (const r of rows) best.set(r.assignment_id, Math.max(best.get(r.assignment_id) ?? 0, pct(r)));
  const avg = best.size ? [...best.values()].reduce((a, b) => a + b, 0) / best.size : null;
  const chrono = [...rows].reverse();
  const points = chrono.map((r) => ({ label: fmtDate(r.graded_at).replace(/ \d{4}$/, ""), pct: Math.round(pct(r)), title: r.title }));

  return (
    <>
      <PageHeader title="Бағаларым" subtitle="Автоматты және мұғалім қойған барлық бағалар." />
      {rows.length === 0 ? (
        <EmptyState title="Әзірге баға жоқ" text="Жұмысты жіберіп, баға түскен соң осында көрінеді." action={<Link href="/student/assignments" className="btn-primary">Тапсырмаларға өту</Link>} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <StatCard label="Жалпы орташа" value={fmtPct(avg)} hint="әр тапсырманың ең үздік бағасы бойынша" />
            <StatCard label="Бағалар саны" value={rows.length} />
            <StatCard label="Ең жоғарғы" value={fmtPct(Math.max(...rows.map(pct)))} tone="ok" />
          </div>
          {points.length > 1 && (
            <Section title="Прогресс">
              <div className="card p-4"><GradesChart data={points} /></div>
            </Section>
          )}
          <Section title="Барлық бағалар">
            <ul className="space-y-3">
              {rows.map((r) => (
                <li key={r.id} className="card p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link href={`/student/assignments/${r.assignment_id}`} className="font-semibold">{r.title}</Link>
                      <p className="text-sm text-ink-muted">{r.classroom_name ?? "-"} · {fmtDate(r.graded_at)} · {r.source === "auto" ? "автоматты" : "мұғалім"}</p>
                    </div>
                    <p className="whitespace-nowrap text-lg font-bold text-brand">{Number(r.score)} / {Number(r.max_score)} <span className="text-sm font-medium text-ink-muted">({fmtPct(pct(r))})</span></p>
                  </div>
                  {r.feedback && <p className="mt-2 rounded-lg bg-brand-soft px-3 py-2 text-sm"><span className="font-semibold">Мұғалім пікірі:</span> {r.feedback}</p>}
                </li>
              ))}
            </ul>
          </Section>
        </>
      )}
    </>
  );
}
