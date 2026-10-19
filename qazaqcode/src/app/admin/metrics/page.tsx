import Link from "next/link";
import { Banner, EmptyState, PageHeader, Section, StatCard } from "@/components/ui";
import { ActiveUsersChart, Funnel, HealthBadge, RetentionTable } from "@/components/metrics/Charts";
import { requirePlatformAdmin } from "@/lib/context";
import { platformKpis, platformOrgHealth } from "@/lib/metrics/queries";
import { fmtShare, SMALL_N } from "@/lib/metrics/health";
import type { RoleCounts } from "@/lib/metrics/types";
import { LICENSE_STATE_LABEL } from "@/lib/format";
import { getT } from "@/lib/i18n";
import type { TFn } from "@/lib/i18n/core";

export async function generateMetadata() { const t = await getT(); return { title: t("Метрика") }; }
export const dynamic = "force-dynamic";
const DAYS = [7, 30, 90] as const;
const WEEKS = 12;

const roleHint = (c: RoleCounts, t: TFn) => t("оқушы {student} · мұғалім {teacher} · әкімші {school_admin}", { student: c.student, teacher: c.teacher, school_admin: c.school_admin });

export default async function MetricsPage({ searchParams }: { searchParams: Promise<{ days?: string; demo?: string }> }) { const t = await getT();
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
      <PageHeader title={t("Метрика")} subtitle={t("Нақты, дерекқордан есептелген жиынтық көрсеткіштер. Жеке оқушы/мұғалім деректері көрсетілмейді; баға мен кіріс жорамалы жоқ.")}
        actions={<a className="btn-secondary" href={`/admin/metrics/export?t=daily&${qs}`}>{t("CSV жүктеу")}</a>} />
      <form method="get" className="mb-4 flex flex-wrap items-end gap-3" role="search" aria-label={t("Метрика сүзгісі")}>
        <div><label className="label" htmlFor="m-days">{t("Кезең")}</label>
          <select id="m-days" name="days" className="input" defaultValue={String(days)}>{DAYS.map((d) => <option key={d} value={d}>{t("Соңғы {d} күн", { d })}</option>)}</select></div>
        <label className="flex items-center gap-2 pb-2 text-sm"><input type="checkbox" name="demo" value="1" defaultChecked={demo} />{" "}{t("ДЕМО ұйымдарын қосу")}</label>
        <button className="btn-secondary" type="submit">{t("Қолдану")}</button>
      </form>
      {demo && <Banner tone="info"><strong>{t("ДЕМО деректер қосылған:")}</strong>{" "}{t("сынақ ұйымдарының ойдан құрастырылған белсенділігі есептеледі. Инвесторға көрсетілетін нақты көрсеткіш үшін белгіні алып тастаңыз.")}</Banner>}

      {empty ? (
        <EmptyState title={t("Деректер жоқ: пилот басталмаған")} text={t("Ұйым құрылып, қолданушылар жүйеге кіре бастағанда метрика осы жерде нақты сандармен толады. Жалған дерек көрсетілмейді.")} />
      ) : (
        <>
          <section aria-label={t("Жалпы сандар")} className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard label={t("Ұйымдар")} value={k.totals.orgs} hint={demo ? t("ДЕМО қоса") : t("ДЕМО-сыз")} />
            <StatCard label={t("Белсенді оқушылар (тізімде)")} value={k.totals.students} />
            <StatCard label={t("Белсенді мұғалімдер (тізімде)")} value={k.totals.teachers} />
            <StatCard label={t("Пилот сұраулары")} value={k.totals.leads} hint={t("барлық уақыт")} />
          </section>

          <Section title={t("Белсенді қолданушылар (DAU / WAU / MAU)")}>
            {!k.has_activity ? (
              <EmptyState title={t("Белсенділік деректері жоқ: пилот басталмаған")} text={t("Белсенділік журналы қолданушы жүйеге бүгін алғаш кіргенде жазылады. Журнал бос болғандықтан график көрсетілмейді.")} />
            ) : (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <StatCard label={t("DAU (бүгін)")} value={k.current.dau.total} hint={roleHint(k.current.dau, t)} />
                  <StatCard label={t("WAU (7 күн)")} value={k.current.wau.total} hint={roleHint(k.current.wau, t)} />
                  <StatCard label={t("MAU (30 күн)")} value={k.current.mau.total} hint={roleHint(k.current.mau, t)} />
                </div>
                <div className="card mt-3 p-4"><ActiveUsersChart data={k.daily} /></div>
                <p className="hint">{t("Журнал {data_since} күнінен бастап жүргізіледі. «Бүгін» - Asia/Almaty күні, күн әлі аяқталмаған.", { data_since: k.data_since })}</p>
              </>
            )}
          </Section>

          <Section title={t("Activation воронкасы (ұйымдар бойынша)")}>
            <div className="card p-4"><Funnel steps={k.funnel} /></div>
            <p className="hint">{t("Әр қадам алдыңғысын қамтиды. «Лид» - /schools формасынан түскен сұраулар саны; ол құрылған ұйымдарға тікелей байланбаған, сондықтан лидтен ұйымға конверсия есептелмейді.")}</p>
          </Section>

          <Section title={t("Когорттық retention (апта бойынша)")}>
            {k.retention_orgs.length === 0 && k.retention_students.length === 0 ? (
              <EmptyState title={t("Когорттар әлі жоқ")} text={t("Соңғы {WEEKS} аптада құрылған ұйым не алғаш белсенді болған оқушы жоқ.", { WEEKS })} />
            ) : (
              <div className="space-y-5">
                <div><h3 className="mb-2 text-sm font-semibold">{t("Ұйымдар (құрылған аптасы; белсенді = ұйымнан кемінде 1 қолданушы кірген)")}</h3>
                  {k.retention_orgs.length ? <RetentionTable cohorts={k.retention_orgs} weeks={WEEKS} unit={t("Ұйым")} /> : <p className="text-sm text-ink-muted">{t("Деректер жоқ.")}</p>}</div>
                <div><h3 className="mb-2 text-sm font-semibold">{t("Оқушылар (журналдағы алғашқы белсенді аптасы)")}</h3>
                  {k.retention_students.length ? <RetentionTable cohorts={k.retention_students} weeks={WEEKS} unit={t("Оқушы")} /> : <p className="text-sm text-ink-muted">{t("Деректер жоқ.")}</p>}</div>
              </div>
            )}
            <p className="hint">{t("Ұяшық = сол аптада белсенді болғандар / когорт көлемі. Көлемі 5-тен аз когорттың үлесі сенімсіз (шағын n). Журнал басталмай тұрғанғы тарих жоқ.")}</p>
          </Section>

          <Section title={t("Ұйымдар денсаулығы (соңғы 28 күн)")} actions={<a className="btn-secondary" href={`/admin/metrics/export?t=health&${qs}`}>CSV</a>}>
            {sorted.length === 0 ? <EmptyState title={t("Ұйымдар жоқ")} text={t("Алдымен «Ұйымдар» бөлімінде ұйым құрыңыз.")} /> : (
              <div className="table-wrap" data-testid="health-list">
                <table className="w-full min-w-[760px]">
                  <caption className="sr-only">{t("Ұйымдар денсаулығы: белсенді оқушы үлесі, орындау, уақтылылық, лимит қолдану")}</caption>
                  <thead><tr><th scope="col" className="th">{t("Ұйым")}</th><th scope="col" className="th">{t("Лицензия")}</th><th scope="col" className="th">{t("Оқушы")}</th><th scope="col" className="th">{t("Белсенді")}</th><th scope="col" className="th">{t("Орындау")}</th><th scope="col" className="th">{t("Уақтылылық")}</th><th scope="col" className="th">{t("Ұпай")}</th><th scope="col" className="th">{t("Пилот есебі")}</th></tr></thead>
                  <tbody>
                    {sorted.map((o) => (
                      <tr key={o.org_id} className="border-t border-line">
                        <th scope="row" className="td text-left font-medium">{o.org_name}{o.is_demo && <span className="badge ml-2 bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200">{t("ДЕМО")}</span>}</th>
                        <td className="td">{t(LICENSE_STATE_LABEL[o.license_state] ?? o.license_state)}</td>
                        <td className="td">{o.students}{o.small_n && <span className="ml-1 text-xs text-ink-muted" title={t("Оқушы {SMALL_N}-дан аз: ақпараттық", { SMALL_N })}>{t("(шағын n)")}</span>}</td>
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
            <p className="hint">{t("Ұпай формуласы мен шектеулер:")}{" "}<code>docs/METRICS.md</code>{t(". Қысқаша: 35% белсенді оқушы үлесі + 30% орындау + 15% уақтылылық + 20% лицензия орнын қолдану (есептелмейтін құрамдас салмағы алынып тасталады). Ұпай 70+ - жақсы, 40-69 - бақылау, 40-тан төмен - қауіп. Оқушы {SMALL_N}-дан аз ұйымда сан ақпараттық.", { SMALL_N })}</p>
          </Section>
          <p className="mt-6 text-xs text-ink-muted">{t("Деректер күні: {generated_for}. Басқа бөлімдер:", { generated_for: k.generated_for })}{" "}<Link href="/admin">{t("ұйымдар")}</Link>.</p>
        </>
      )}
    </>
  );
}
