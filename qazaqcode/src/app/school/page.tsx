import Link from "next/link";
import { requireSchoolAdmin } from "@/lib/context";
import { withUser } from "@/lib/db";
import { fmtDate, fmtNum, fmtPct, KIND_LABEL, LICENSE_STATE_LABEL, PLAN_LABEL } from "@/lib/format";
import { EmptyState, PageHeader, ProgressBar, Section, StatCard, StatusBadge } from "@/components/ui";
import { ActivityChart, type ActivityPoint } from "@/components/school/ActivityChart";
import { loadClasses, loadLicense, pct } from "./queries";

export const metadata = { title: "Мектеп панелі" };
export const dynamic = "force-dynamic";

type Overview = {
  students: number; active_students_30d: number; teachers: number; classes: number; assignments_published: number;
  expected_completions: number; completed: number; graded: number; pending_review: number; avg_score_pct: number | null;
};

export default async function SchoolDashboard() {
  const ctx = await requireSchoolAdmin();
  const org = ctx.active.org_id;
  const d = await withUser(ctx.userId, async (q) => {
    const [ov, series, lic, classes, teachers, recent] = await Promise.all([
      q<{ r: Overview }>("select public.org_overview($1) as r", [org]),
      q<ActivityPoint>("select day::text as day, submissions::int as submissions, active_students::int as active_students from public.activity_series($1, 30)", [org]),
      loadLicense(q, org),
      loadClasses(q, org, { activeOnly: true }),
      q<{ user_id: string; full_name: string | null; classes: number }>(
        `select m.user_id, p.full_name, (select count(*)::int from public.classrooms c where c.org_id = m.org_id and c.teacher_id = m.user_id and c.status = 'active') as classes
           from public.organization_members m left join public.profiles p on p.id = m.user_id
          where m.org_id = $1 and m.role = 'teacher' and m.status = 'active' order by p.full_name limit 8`, [org]),
      q<{ id: string; title: string; kind: string; status: string; created_at: string; author: string | null }>(
        `select a.id, a.title, a.kind::text as kind, a.status::text as status, a.created_at::text as created_at, p.full_name as author
           from public.assignments a left join public.profiles p on p.id = a.created_by where a.org_id = $1 order by a.created_at desc limit 6`, [org]),
    ]);
    return { ov: ov[0].r, series, lic, classes, teachers, recent };
  });
  const { ov, series, lic, classes, teachers, recent } = d;
  const donePct = pct(ov.completed, ov.expected_completions);
  const expiring = lic && lic.state === "active" && lic.days_left != null && lic.days_left < 30;
  const hasActivity = series.some((s) => s.submissions > 0 || s.active_students > 0);

  return (
    <>
      <PageHeader title="Мектеп панелі" subtitle={ctx.active.org_name} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" data-testid="stats">
        <StatCard label="Оқушылар" value={<span data-testid="stat-students">{fmtNum(ov.students)}</span>} hint="белсенді оқушы аккаунты" />
        <StatCard label="Белсенді оқушы" value={<span data-testid="stat-active">{fmtNum(ov.active_students_30d)}</span>} hint="соңғы 30 күнде" />
        <StatCard label="Мұғалімдер" value={<span data-testid="stat-teachers">{fmtNum(ov.teachers)}</span>} />
        <StatCard label="Сыныптар" value={<span data-testid="stat-classes">{fmtNum(ov.classes)}</span>} hint="белсенді сыныптар" />
        <StatCard label="Жарияланған тапсырма" value={<span data-testid="stat-assignments">{fmtNum(ov.assignments_published)}</span>} />
        <StatCard label="Орындалуы"
          value={<span data-testid="stat-completion">{ov.expected_completions > 0 ? `${donePct}%` : "-"}</span>}
          hint={ov.expected_completions > 0 ? `${ov.completed} / ${ov.expected_completions} жұмыс` : "күтілетін орындау жоқ"} />
        <StatCard label="Тексеруді күтетін" value={<span data-testid="stat-pending">{fmtNum(ov.pending_review)}</span>} tone={ov.pending_review > 0 ? "warn" : undefined} hint="жіберілген жұмыс" />
        <StatCard label="Орташа үлгерім" value={<span data-testid="stat-avg">{fmtPct(ov.avg_score_pct)}</span>} hint={ov.graded > 0 ? `${ov.graded} бағаланған жұмыс` : "әлі баға жоқ"} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <section className="card p-5 lg:col-span-1" aria-labelledby="lic-h">
          <div className="flex items-center justify-between gap-2">
            <h2 id="lic-h" className="text-lg font-semibold">Лицензия</h2>
            {lic ? <StatusBadge status={lic.state} label={LICENSE_STATE_LABEL[lic.state] ?? lic.state} /> : <StatusBadge status="none" label={LICENSE_STATE_LABEL.none} />}
          </div>
          {!lic ? (
            <p className="mt-3 text-sm text-ink-muted">Ұйымға лицензия тағайындалмаған. Платформа әкімшісіне хабарласыңыз.</p>
          ) : (
            <>
              <p className="mt-3 text-sm"><span className="text-ink-muted">Жоспар:</span> <strong>{PLAN_LABEL[lic.plan ?? ""] ?? lic.plan}</strong></p>
              <p className="text-sm"><span className="text-ink-muted">Жарамды:</span> <strong>{fmtDate(lic.valid_until)}</strong> дейін
                {lic.days_left != null && lic.days_left >= 0 && <span className="text-ink-muted"> (қалды: {lic.days_left} күн)</span>}
                {lic.days_left != null && lic.days_left < 0 && <span className="text-red-600"> (мерзімі {-lic.days_left} күн бұрын аяқталған)</span>}
              </p>
              {expiring && <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100" role="status">
                Лицензия мерзімі 30 күннен аз қалды. Үзіліс болмауы үшін алдын ала ұзартыңыз.</div>}
              <div className="mt-4">
                <div className="flex justify-between text-sm"><span>Оқушылар</span><span data-testid="lic-students">{lic.students} / {lic.max_students}</span></div>
                <ProgressBar value={lic.students} max={lic.max_students} label="Оқушы лимитінің қолданылуы" />
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-sm"><span>Мұғалімдер</span><span data-testid="lic-teachers">{lic.teachers} / {lic.max_teachers}</span></div>
                <ProgressBar value={lic.teachers} max={lic.max_teachers} label="Мұғалім лимитінің қолданылуы" />
              </div>
            </>
          )}
        </section>

        <section className="card p-5 lg:col-span-2" aria-labelledby="act-h">
          <h2 id="act-h" className="text-lg font-semibold">Белсенділік: соңғы 30 күн</h2>
          {hasActivity ? <div className="mt-3"><ActivityChart data={series} /></div>
            : <p className="mt-6 text-sm text-ink-muted">Соңғы 30 күнде жіберілген жұмыс жоқ. Оқушылар тапсырма жібергенде график осында көрінеді.</p>}
        </section>
      </div>

      <Section title="Сыныптар" actions={<Link href="/school/classes" className="text-sm">Барлығы</Link>}>
        {classes.length === 0 ? <EmptyState title="Сыныптар әлі жоқ" text="Мұғалімдер сынып ашқанда осында көрінеді." /> : (
          <div className="table-wrap relative"><table className="w-full min-w-[40rem]">
            <thead><tr><th className="th">Сынып</th><th className="th">Мұғалім</th><th className="th">Оқушы</th><th className="th">Тапсырма</th><th className="th">Орташа %</th><th className="th"><span className="sr-only">Әрекет</span></th></tr></thead>
            <tbody className="divide-y divide-line">
              {classes.map((c) => (
                <tr key={c.id}>
                  <td className="td font-medium">{c.name}<span className="block text-xs font-normal text-ink-muted">{c.subject}</span></td>
                  <td className="td">{c.teacher_name ?? "-"}</td>
                  <td className="td">{c.students}</td><td className="td">{c.assignments}</td><td className="td">{fmtPct(c.avg_pct)}</td>
                  <td className="td text-right"><Link href={`/school/classes/${c.id}`}>Ашу</Link></td>
                </tr>
              ))}
            </tbody></table></div>
        )}
      </Section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Мұғалімдер" actions={<Link href="/school/teachers" className="text-sm">Басқару</Link>}>
          {teachers.length === 0 ? <EmptyState title="Мұғалім жоқ" text="Мұғалімдер бетінен шақыру сілтемесін жасаңыз." /> : (
            <ul className="card divide-y divide-line">
              {teachers.map((t) => (
                <li key={t.user_id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <span className="font-medium">{t.full_name ?? "-"}</span><span className="text-ink-muted">сынып: {t.classes}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Соңғы тапсырмалар">
          {recent.length === 0 ? <EmptyState title="Тапсырмалар жоқ" text="Мұғалімдер тапсырма жасағанда осында көрінеді." /> : (
            <ul className="card divide-y divide-line">
              {recent.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                  <div className="min-w-0"><p className="truncate font-medium">{a.title}</p>
                    <p className="text-xs text-ink-muted">{a.author ?? "-"} · {KIND_LABEL[a.kind] ?? a.kind} · {fmtDate(a.created_at)}</p></div>
                  <StatusBadge status={a.status} />
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <Section title="Оқушылардың прогресі">
        {classes.filter((c) => c.expected > 0).length === 0 ? <EmptyState title="Прогресс көрсететін дерек жоқ" text="Сыныпқа тапсырма берілгенде орындау пайызы осында көрінеді." /> : (
          <div className="card divide-y divide-line">
            {classes.filter((c) => c.expected > 0).map((c) => (
              <div key={c.id} className="px-4 py-3">
                <div className="mb-1.5 flex justify-between gap-3 text-sm"><span className="font-medium">{c.name}</span><span className="text-ink-muted">{c.completed} / {c.expected} · {pct(c.completed, c.expected)}%</span></div>
                <ProgressBar value={c.completed} max={c.expected} label={`${c.name}: орындалу`} />
              </div>
            ))}
          </div>
        )}
      </Section>
    </>
  );
}
