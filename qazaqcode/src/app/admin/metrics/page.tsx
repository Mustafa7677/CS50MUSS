import Link from "next/link";
import { Banner, EmptyState, PageHeader, Section, StatCard } from "@/components/ui";
import { ActiveUsersChart, Funnel, HealthBadge, RetentionTable } from "@/components/metrics/Charts";
import { requirePlatformAdmin } from "@/lib/context";
import { platformKpis, platformOrgHealth } from "@/lib/metrics/queries";
import { fmtShare, SMALL_N } from "@/lib/metrics/health";
import type { RoleCounts } from "@/lib/metrics/types";
import { LICENSE_STATE_LABEL } from "@/lib/format";

export const metadata = { title: "Метрика" };
export const dynamic = "force-dynamic";
const DAYS = [7, 30, 90] as const;
const WEEKS = 12;

const roleHint = (c: RoleCounts) => `оқушы ${c.student} · мұғалім ${c.teacher} · әкімші ${c.school_admin}`;

export default async function MetricsPage({ searchParams }: { searchParams: Promise<{ days?: string; demo?: string }> }) {
  const ctx = await requirePlatformAdmin();
  const sp = await searchParams;
  const days = (DAYS as readonly number[]).includes(Number(sp.days)) ? Number(sp.days) : 30;
  const demo = sp.demo === "1";
  const [k, health] = await Promise.all([platformKpis(ctx.userId, days, demo), platformOrgHealth(ctx.userId, 28, demo)]);
  const empty = k.totals.orgs === 0 && k.totals.leads === 0 && !k.has_activity;
  const qs = `days=${days}${demo ? "&demo=1" : ""}`;
  const sorted = [...health].sort((a, b) => (a.score ?? 1000) - (b.score ?? 1000) || a.org_name.localeCompare(b.org_name));

  return (
    <>
      <PageHeader title="Метрика" subtitle="Нақты, дерекқордан есептелген жиынтық көрсеткіштер. Жеке оқушы/мұғалім деректері көрсетілмейді; баға мен кіріс жорамалы жоқ."
        actions={<a className="btn-secondary" href={`/admin/metrics/export?t=daily&${qs}`}>CSV жүктеу</a>} />
      <form method="get" className="mb-4 flex flex-wrap items-end gap-3" role="search" aria-label="Метрика сүзгісі">
        <div><label className="label" htmlFor="m-days">Кезең</label>
          <select id="m-days" name="days" className="input" defaultValue={String(days)}>{DAYS.map((d) => <option key={d} value={d}>Соңғы {d} күн</option>)}</select></div>
        <label className="flex items-center gap-2 pb-2 text-sm"><input type="checkbox" name="demo" value="1" defaultChecked={demo} /> ДЕМО ұйымдарын қосу</label>
        <button className="btn-secondary" type="submit">Қолдану</button>
      </form>
      {demo && <Banner tone="info"><strong>ДЕМО деректер қосылған:</strong> сынақ ұйымдарының ойдан құрастырылған белсенділігі есептеледі. Инвесторға көрсетілетін нақты көрсеткіш үшін белгіні алып тастаңыз.</Banner>}

      {empty ? (
        <EmptyState title="Деректер жоқ: пилот басталмаған" text="Ұйым құрылып, қолданушылар жүйеге кіре бастағанда метрика осы жерде нақты сандармен толады. Жалған дерек көрсетілмейді." />
      ) : (
        <>
          <section aria-label="Жалпы сандар" className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard label="Ұйымдар" value={k.totals.orgs} hint={demo ? "ДЕМО қоса" : "ДЕМО-сыз"} />
            <StatCard label="Белсенді оқушылар (тізімде)" value={k.totals.students} />
            <StatCard label="Белсенді мұғалімдер (тізімде)" value={k.totals.teachers} />
            <StatCard label="Пилот сұраулары" value={k.totals.leads} hint="барлық уақыт" />
          </section>

          <Section title="Белсенді қолданушылар (DAU / WAU / MAU)">
            {!k.has_activity ? (
              <EmptyState title="Белсенділік деректері жоқ: пилот басталмаған" text="Белсенділік журналы қолданушы жүйеге бүгін алғаш кіргенде жазылады. Журнал бос болғандықтан график көрсетілмейді." />
            ) : (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <StatCard label="DAU (бүгін)" value={k.current.dau.total} hint={roleHint(k.current.dau)} />
                  <StatCard label="WAU (7 күн)" value={k.current.wau.total} hint={roleHint(k.current.wau)} />
                  <StatCard label="MAU (30 күн)" value={k.current.mau.total} hint={roleHint(k.current.mau)} />
                </div>
                <div className="card mt-3 p-4"><ActiveUsersChart data={k.daily} /></div>
                <p className="hint">Журнал {k.data_since} күнінен бастап жүргізіледі. «Бүгін» - Asia/Almaty күні, күн әлі аяқталмаған.</p>
              </>
            )}
          </Section>

          <Section title="Activation воронкасы (ұйымдар бойынша)">
            <div className="card p-4"><Funnel steps={k.funnel} /></div>
            <p className="hint">Әр қадам алдыңғысын қамтиды. «Лид» - /schools формасынан түскен сұраулар саны; ол құрылған ұйымдарға тікелей байланбаған, сондықтан лидтен ұйымға конверсия есептелмейді.</p>
          </Section>

          <Section title="Когорттық retention (апта бойынша)">
            {k.retention_orgs.length === 0 && k.retention_students.length === 0 ? (
              <EmptyState title="Когорттар әлі жоқ" text={`Соңғы ${WEEKS} аптада құрылған ұйым не алғаш белсенді болған оқушы жоқ.`} />
            ) : (
              <div className="space-y-5">
                <div><h3 className="mb-2 text-sm font-semibold">Ұйымдар (құрылған аптасы; белсенді = ұйымнан кемінде 1 қолданушы кірген)</h3>
                  {k.retention_orgs.length ? <RetentionTable cohorts={k.retention_orgs} weeks={WEEKS} unit="Ұйым" /> : <p className="text-sm text-ink-muted">Деректер жоқ.</p>}</div>
                <div><h3 className="mb-2 text-sm font-semibold">Оқушылар (журналдағы алғашқы белсенді аптасы)</h3>
                  {k.retention_students.length ? <RetentionTable cohorts={k.retention_students} weeks={WEEKS} unit="Оқушы" /> : <p className="text-sm text-ink-muted">Деректер жоқ.</p>}</div>
              </div>
            )}
            <p className="hint">Ұяшық = сол аптада белсенді болғандар / когорт көлемі. Көлемі 5-тен аз когорттың үлесі сенімсіз (шағын n). Журнал басталмай тұрғанғы тарих жоқ.</p>
          </Section>

          <Section title="Ұйымдар денсаулығы (соңғы 28 күн)" actions={<a className="btn-secondary" href={`/admin/metrics/export?t=health&${qs}`}>CSV</a>}>
            {sorted.length === 0 ? <EmptyState title="Ұйымдар жоқ" text="Алдымен «Ұйымдар» бөлімінде ұйым құрыңыз." /> : (
              <div className="table-wrap" data-testid="health-list">
                <table className="w-full min-w-[760px]">
                  <caption className="sr-only">Ұйымдар денсаулығы: белсенді оқушы үлесі, орындау, уақтылылық, лимит қолдану</caption>
                  <thead><tr><th scope="col" className="th">Ұйым</th><th scope="col" className="th">Лицензия</th><th scope="col" className="th">Оқушы</th><th scope="col" className="th">Белсенді</th><th scope="col" className="th">Орындау</th><th scope="col" className="th">Уақтылылық</th><th scope="col" className="th">Ұпай</th><th scope="col" className="th">Пилот есебі</th></tr></thead>
                  <tbody>
                    {sorted.map((o) => (
                      <tr key={o.org_id} className="border-t border-line">
                        <th scope="row" className="td text-left font-medium">{o.org_name}{o.is_demo && <span className="badge ml-2 bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200">ДЕМО</span>}</th>
                        <td className="td">{LICENSE_STATE_LABEL[o.license_state] ?? o.license_state}</td>
                        <td className="td">{o.students}{o.small_n && <span className="ml-1 text-xs text-ink-muted" title={`Оқушы ${SMALL_N}-дан аз: ақпараттық`}>(шағын n)</span>}</td>
                        <td className="td">{o.active_students} <span className="text-xs text-ink-muted">({fmtShare(o.components.active_share)})</span></td>
                        <td className="td">{fmtShare(o.components.completion)}</td>
                        <td className="td">{fmtShare(o.components.timeliness)}</td>
                        <td className="td"><HealthBadge score={o.score} band={o.band} /></td>
                        <td className="td whitespace-nowrap"><a href={`/api/reports/pilot/${o.org_id}?format=pdf`}>PDF</a> · <a href={`/api/reports/pilot/${o.org_id}?format=xlsx`}>Excel</a></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="hint">Ұпай формуласы мен шектеулер: <code>docs/METRICS.md</code>. Қысқаша: 35% белсенді оқушы үлесі + 30% орындау + 15% уақтылылық + 20% лицензия орнын қолдану (есептелмейтін құрамдас салмағы алынып тасталады). Ұпай 70+ - жақсы, 40-69 - бақылау, 40-тан төмен - қауіп. Оқушы {SMALL_N}-дан аз ұйымда сан ақпараттық.</p>
          </Section>
          <p className="mt-6 text-xs text-ink-muted">Деректер күні: {k.generated_for}. Басқа бөлімдер: <Link href="/admin">ұйымдар</Link>.</p>
        </>
      )}
    </>
  );
}
