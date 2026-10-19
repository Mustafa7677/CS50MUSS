import Link from "next/link";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { requireStudent } from "@/lib/context";
import { DIFFICULTY_LABEL, KIND_LABEL, STATUS_LABEL, fmtDate } from "@/lib/format";
import { FILTERS, isOverdue, myAssignments } from "../data";
import { getT } from "@/lib/i18n";

export async function generateMetadata() { const t = await getT(); return { title: t("Тапсырмаларым") }; }
export const dynamic = "force-dynamic";

export default async function AssignmentsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) { const t = await getT();
  const ctx = await requireStudent();
  const sp = await searchParams;
  const filter = (FILTERS as readonly string[]).includes(sp.status ?? "") ? sp.status! : "";
  const all = await myAssignments(ctx.userId);
  const rows = filter ? all.filter((r) => r.status === filter) : all;
  const count = (s: string) => all.filter((r) => r.status === s).length;
  const now = Date.now();

  return (
    <>
      <PageHeader title={t("Тапсырмаларым")} subtitle={t("Барлығы: {length}", { length: all.length })} />
      <nav aria-label={t("Күй бойынша сүзгі")} className="mb-5 flex flex-wrap gap-2">
        <Chip href="/student/assignments" active={!filter} label={t("Барлығы ({length})", { length: all.length })} />
        {FILTERS.map((s) => <Chip key={s} href={`/student/assignments?status=${s}`} active={filter === s} label={`${t(STATUS_LABEL[s])} (${count(s)})`} />)}
      </nav>

      {all.length === 0 ? (
        <EmptyState title={t("Тапсырма жоқ")} text={t("Мұғалім тапсырма бергенде немесе сыныпқа қосылған соң осында көрінеді.")} action={<Link href="/student" className="btn-secondary">{t("Сыныпқа қосылу")}</Link>} />
      ) : rows.length === 0 ? (
        <EmptyState title={t("Бұл күйде тапсырма жоқ")} action={<Link href="/student/assignments" className="btn-secondary">{t("Сүзгіні тазалау")}</Link>} />
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => {
            const late = r.status !== "graded" && isOverdue(r.deadline, now);
            return (
              <li key={r.assignment_id} className="card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`/student/assignments/${r.assignment_id}`} className="text-base font-semibold">{r.title}</Link>
                    <p className="mt-0.5 text-sm text-ink-muted">
                      {t(KIND_LABEL[r.kind] ?? r.kind)} · {t(DIFFICULTY_LABEL[r.difficulty] ?? r.difficulty)} · {r.classroom_name}
                    </p>
                  </div>
                  <StatusBadge status={r.status}  label={t(STATUS_LABEL[r.status] ?? r.status)}/>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                  <div><dt className="text-xs text-ink-muted">{t("Мерзімі")}</dt><dd className={late ? "font-semibold text-red-600" : ""}>{r.deadline ? fmtDate(r.deadline, true, t.locale) : t("Мерзімсіз")}</dd></div>
                  <div><dt className="text-xs text-ink-muted">{t("Ең үздік баға")}</dt><dd>{r.best_score != null ? `${Number(r.best_score)} / ${Number(r.max_score)}` : "-"}</dd></div>
                  <div><dt className="text-xs text-ink-muted">{t("Әрекет")}</dt><dd>{r.attempts_used}{r.max_attempts ? ` / ${r.max_attempts}` : (" " + t("(шектеусіз)"))}</dd></div>
                  <div className="flex items-end md:justify-end">
                    <Link href={`/student/assignments/${r.assignment_id}`} className="btn-secondary">
                      {r.status === "not_started" ? t("Бастау") : r.status === "in_progress" ? t("Жалғастыру") : t("Ашу")}
                    </Link>
                  </div>
                </dl>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

function Chip({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link href={href} aria-current={active ? "true" : undefined}
      className={`rounded-full border px-3 py-1.5 text-sm font-medium no-underline ${active ? "border-brand bg-brand text-brand-ink" : "border-line bg-surface text-ink hover:bg-surface-2"}`}>
      {label}
    </Link>
  );
}
