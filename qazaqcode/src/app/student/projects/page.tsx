import Link from "next/link";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { requireStudent } from "@/lib/context";
import { withUser } from "@/lib/db";
import { KIND_LABEL, fmtDate } from "@/lib/format";
import { getT } from "@/lib/i18n";
import { STATUS_LABEL } from "@/lib/format";

export async function generateMetadata() { const t = await getT(); return { title: t("Жобалар") }; }
export const dynamic = "force-dynamic";

type Row = {
  id: string; assignment_id: string; title: string; kind: string; status: string; code: string | null; updated_at: string;
  score: string | null; max_score: string | null; feedback: string | null;
};

export default async function ProjectsPage() { const t = await getT();
  const ctx = await requireStudent();
  const rows = await withUser(ctx.userId, (q) => q<Row>(
    `select s.id, a.id as assignment_id, a.title, a.kind, s.status, left(s.code, 1500) as code, s.updated_at, g.score, g.max_score, g.feedback
       from public.submissions s
       join public.assignments a on a.id = s.assignment_id
       left join public.grades g on g.submission_id = s.id
      where s.student_id = auth.uid() and a.kind in ('project', 'html_css', 'file')
      order by s.updated_at desc limit 60`));
  return (
    <>
      <PageHeader title={t("Жобалар")} subtitle={t("Жобалық, HTML/CSS және файл тапсырмалары бойынша жұмыстарыңыз.")} />
      {rows.length === 0 ? (
        <EmptyState title={t("Әзірге жоба жоқ")} text={t("Жобалық тапсырманы бастағанда жұмысыңыз осында көрінеді.")}
          action={<Link href="/student/assignments" className="btn-primary no-underline">{t("Тапсырмаларға өту")}</Link>} />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2" data-testid="project-list">
          {rows.map((r) => (
            <li key={r.id} className="card flex min-w-0 flex-col p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h2 className="min-w-0 break-words font-semibold">{r.title}</h2>
                <StatusBadge status={r.status === "draft" ? "in_progress" : r.status}  label={t(STATUS_LABEL[r.status === "draft" ? "in_progress" : r.status] ?? r.status === "draft" ? "in_progress" : r.status)}/>
              </div>
              <p className="text-xs text-ink-muted">{t(KIND_LABEL[r.kind] ?? r.kind)} · {fmtDate(r.updated_at, true)}</p>
              {r.code
                ? <pre className="mt-3 max-h-40 overflow-auto rounded-lg border border-line bg-surface-2 p-3 text-xs"><code className="font-mono">{r.code}</code></pre>
                : <p className="mt-3 text-sm text-ink-muted">{t("Код жоқ.")}</p>}
              {r.score != null && r.max_score != null && <p className="mt-3 font-bold text-brand">{Number(r.score)} / {Number(r.max_score)}</p>}
              {r.feedback && <p className="mt-2 rounded-lg bg-brand-soft px-3 py-2 text-sm"><span className="font-semibold">{t("Мұғалім пікірі:")}</span> <span className="break-words">{r.feedback}</span></p>}
              <div className="mt-4"><Link href={`/student/assignments/${r.assignment_id}`} className="btn-secondary no-underline">{t("Ашу")}</Link></div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
