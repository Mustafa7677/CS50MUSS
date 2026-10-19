import Link from "next/link";
import { EmptyState, PageHeader, ProgressBar } from "@/components/ui";
import { requireStudent } from "@/lib/context";
import { withUser } from "@/lib/db";
import { getT } from "@/lib/i18n";

export async function generateMetadata() { const t = await getT(); return { title: t("Курстар") }; }
export const dynamic = "force-dynamic";

type Row = { course_id: string; title: string; description: string | null; total: string; completed: string };

export default async function CoursesPage() { const t = await getT();
  const ctx = await requireStudent();
  const rows = await withUser(ctx.userId, (q) => q<Row>("select * from public.my_courses()"));
  return (
    <>
      <PageHeader title={t("Курстар")} subtitle={t("Мұғалім сіздің сыныбыңызға ашқан курстар.")} />
      {rows.length === 0 ? (
        <EmptyState title={t("Әзірге курс жоқ")} text={t("Мұғалім сыныпқа курс жариялағанда ол осында пайда болады.")} />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2" data-testid="course-list">
          {rows.map((c) => {
            const total = Number(c.total), done = Number(c.completed);
            return (
              <li key={c.course_id} className="card flex flex-col p-5">
                <h2 className="break-words text-lg font-semibold">{c.title}</h2>
                {c.description && <p className="mt-1 line-clamp-3 break-words text-sm text-ink-muted">{c.description}</p>}
                <div className="mt-4">
                  <ProgressBar value={done} max={total} label={t("{title}: прогресс", { title: c.title })} />
                  <p className="mt-1 text-xs text-ink-muted">{done}{" "}{t("/ {total} сабақ аяқталды", { total })}</p>
                </div>
                <div className="mt-4"><Link href={`/student/courses/${c.course_id}`} className="btn-primary no-underline">{done > 0 && done < total ? t("Жалғастыру") : done >= total && total > 0 ? t("Қайталау") : t("Бастау")}</Link></div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
