import { Banner, EmptyState, PageHeader, ProgressBar, Section, StatCard } from "@/components/ui";
import { HealthBadge, OrgDailyBars } from "@/components/metrics/Charts";
import { requireSchoolAdmin } from "@/lib/context";
import { orgHealth } from "@/lib/metrics/queries";
import { fmtShare, HEALTH_WEIGHTS, SMALL_N } from "@/lib/metrics/health";
import { getT } from "@/lib/i18n";

export async function generateMetadata() { const t = await getT(); return { title: t("Мектеп денсаулығы") }; }
export const dynamic = "force-dynamic";
const DAYS = [7, 28, 90] as const;

export default async function SchoolHealthPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) { const t = await getT();
  const ctx = await requireSchoolAdmin();
  const sp = await searchParams;
  const days = (DAYS as readonly number[]).includes(Number(sp.days)) ? Number(sp.days) : 28;
  const h = await orgHealth(ctx.userId, ctx.active.org_id, days);
  const c = h.components;
  const anyActivity = (h.daily ?? []).some((d) => d.students > 0 || d.teachers > 0);
  const rows: { key: keyof typeof c; title: string; weight: number; detail: string; help: string }[] = [
    { key: "active_share", title: t("Белсенді оқушы үлесі"), weight: HEALTH_WEIGHTS.active_share, detail: t("{active_students} / {students} оқушы кезеңде жүйеге кірген", { active_students: h.active_students, students: h.students }), help: t("Кезеңде кемінде бір рет кірген оқушы / ұйымдағы белсенді оқушылар.") },
    { key: "completion", title: t("Тапсырма орындау үлесі"), weight: HEALTH_WEIGHTS.completion, detail: h.expected > 0 ? t("{completed} / {expected} жұмыс жіберілген", { completed: h.completed, expected: h.expected }) : t("Кезеңде мерзімі өткен тапсырма жоқ"), help: t("Мерзімі кезеңде өткен тапсырмалар бойынша: жұмыс жіберген (тапсырма, оқушы) жұптары / барлық жұп.") },
    { key: "timeliness", title: t("Мерзімінде жіберу"), weight: HEALTH_WEIGHTS.timeliness, detail: h.completed_with_deadline > 0 ? t("{on_time} / {completed_with_deadline} жұмыс мерзімінде", { on_time: h.on_time, completed_with_deadline: h.completed_with_deadline }) : t("Мерзімі бар жіберілген жұмыс жоқ"), help: t("Мерзімі бар тапсырмалардың жіберілген жұмыстарының ішінде мерзімінде жіберілгені.") },
    { key: "seats", title: t("Лицензия орнын қолдану"), weight: HEALTH_WEIGHTS.seats, detail: h.max_students ? t("{students} / {max_students} оқушы орны (50% = толық баға)", { students: h.students, max_students: h.max_students }) : t("Лицензия жоқ"), help: t("min(1, оқушы / лицензиядағы max_students / 0,5).") },
  ];
  return (
    <>
      <PageHeader title={t("Мектеп денсаулығы")} subtitle={t("Мектебіңіздің жүйені қолдану көрсеткіштері: тек жиынтық сандар, нақты дерекқордан.")} />
      <form method="get" className="mb-4 flex flex-wrap items-end gap-3" aria-label={t("Кезең")}>
        <div><label className="label" htmlFor="h-days">{t("Кезең")}</label>
          <select id="h-days" name="days" className="input" defaultValue={String(days)}>{DAYS.map((d) => <option key={d} value={d}>{t("Соңғы {d} күн", { d })}</option>)}</select></div>
        <button className="btn-secondary" type="submit">{t("Қолдану")}</button>
      </form>
      {h.small_n && h.students > 0 && <Banner tone="info">{t("Оқушы саны аз ({students}, шекара: {SMALL_N}): көрсеткіштер ақпараттық, бір оқушының әрекеті үлесті айтарлықтай өзгертеді.", { students: h.students, SMALL_N })}</Banner>}

      {h.score == null ? (
        <EmptyState title={t("Ұпай есептелмейді: деректер жоқ")} text={h.students === 0 ? t("Ұйымда белсенді оқушы жоқ. Оқушылар сынып кодымен қосылғанда көрсеткіштер пайда болады.") : t("Кезеңде есептеуге жеткілікті дерек жоқ.")} />
      ) : (
        <section aria-label={t("Жалпы ұпай")} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="card p-4" data-testid="health-score">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{t("Денсаулық ұпайы")}</p>
            <p className="mt-1 text-4xl font-bold text-brand">{h.score}<span className="text-lg text-ink-muted"> / 100</span></p>
            <p className="mt-2"><HealthBadge score={h.score} band={h.band} /></p>
          </div>
          <StatCard label={t("Белсенді оқушылар")} value={`${h.active_students} / ${h.students}`} hint={t("кезеңде: {from} - {to}", { from: h.from, to: h.to })} />
          <StatCard label={t("Белсенді мұғалімдер")} value={`${h.active_teachers} / ${h.teachers}`} />
        </section>
      )}

      <Section title={t("Құрамдас бөліктер")}>
        <ul className="space-y-4">
          {rows.map((r) => {
            const v = c[r.key];
            return (
              <li key={r.key} className="card p-4" data-testid={`component-${r.key}`}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-semibold">{r.title} <span className="text-xs font-normal text-ink-muted">{t("салмағы {weight}%", { weight: r.weight })}</span></h3>
                  <span className="text-lg font-bold">{fmtShare(v)}</span>
                </div>
                <div className="mt-2">{v == null ? <p className="text-sm text-ink-muted">{t("Есептелмейді: {detail}. Ұпайға қосылмайды.", { detail: r.detail })}</p> : <ProgressBar value={Math.round(v * 100)} label={r.title} />}</div>
                <p className="mt-2 text-sm">{r.detail}</p>
                <p className="hint">{r.help}</p>
              </li>
            );
          })}
        </ul>
        <p className="hint">{t("Ұпай = Σ(салмақ × құрамдас) / Σ(салмақ), тек есептелетін құрамдастар бойынша. 70+ жақсы, 40-69 бақылау, 40-тан төмен қауіп. Формуласы: docs/METRICS.md.")}</p>
      </Section>

      <Section title={t("Күн сайынғы белсенділік")}>
        {anyActivity ? <div className="card p-4"><OrgDailyBars data={h.daily ?? []} /></div>
          : <EmptyState title={t("Белсенділік деректері жоқ")} text={t("Журнал қолданушы жүйеге күн сайын алғаш кіргенде жазылады. Кезеңде ешкім кірмеген не журнал жаңа ғана қосылған.")} />}
      </Section>

      <Section title={t("Пилот есебі")}>
        <form method="get" action={`/api/reports/pilot/${h.org_id}`} className="card flex flex-wrap items-end gap-3 p-4" aria-label={t("Пилот есебін жүктеу")} data-testid="pilot-form">
          <div><label className="label" htmlFor="p-from">{t("Басталуы")}</label><input id="p-from" name="from" type="date" className="input" /></div>
          <div><label className="label" htmlFor="p-to">{t("Аяқталуы")}</label><input id="p-to" name="to" type="date" className="input" /></div>
          <div className="flex flex-wrap gap-2">
            <button type="submit" name="format" value="pdf" className="btn-primary" data-testid="pilot-pdf">{t("PDF жүктеу")}</button>
            <button type="submit" name="format" value="xlsx" className="btn-secondary" data-testid="pilot-xlsx">{t("Excel жүктеу")}</button>
          </div>
          <p className="hint basis-full">{t("Күндерді таңдамасаңыз - соңғы 28 күн. Аралық 366 күннен аспауы тиіс. Есепте оқушылардың аттары жоқ, тек жиынтық сандар.")}</p>
        </form>
      </Section>
    </>
  );
}
