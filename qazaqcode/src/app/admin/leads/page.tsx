import { EmptyState, PageHeader, StatCard } from "@/components/ui";
import { LeadCard } from "@/components/leads/LeadCard";
import { LEAD_COLS, LEAD_STATUSES, LEAD_STATUS_LABEL, likePattern, type LeadRow } from "@/components/leads/labels";
import { requirePlatformAdmin } from "@/lib/context";
import { withUser } from "@/lib/db";
import { getT } from "@/lib/i18n";

export async function generateMetadata() { const t = await getT(); return { title: t("Пилот сұраулары") }; }
export const dynamic = "force-dynamic";
const LIMIT = 200;

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) { const t = await getT();
  const ctx = await requirePlatformAdmin();
  const sp = await searchParams;
  const status = (LEAD_STATUSES as readonly string[]).includes(sp.status ?? "") ? sp.status! : null;
  const qs = (sp.q ?? "").trim().slice(0, 100);
  const { rows, funnel } = await withUser(ctx.userId, async (q) => ({
    rows: await q<LeadRow>(
      `select ${LEAD_COLS} from public.leads where ($1::text is null or status = $1)
          and ($2::text is null or org_name ilike $2 or contact_name ilike $2 or email ilike $2)
        order by created_at desc limit $3`, [status, qs ? likePattern(qs) : null, LIMIT + 1]),
    funnel: await q<{ status: string; total: string; last_30d: string }>("select status, total, last_30d from public.lead_funnel()"),
  }));
  const shown = rows.slice(0, LIMIT);
  const total = funnel.reduce((a, r) => a + Number(r.total), 0);
  const exportHref = `/admin/leads/export?${new URLSearchParams({ ...(status ? { status } : {}), ...(qs ? { q: qs } : {}) })}`;
  return (
    <>
      <PageHeader title={t("Пилот сұраулары")} subtitle={t("Жария беттен (/schools) түскен нақты сұраулар. Тек SUPER ADMIN көреді; 365 күннен кейін өшіріледі.")}
        actions={<a className="btn-secondary" href={exportHref}>{t("CSV жүктеу")}</a>} />
      <section aria-label={t("Воронка")} className="mb-6">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {funnel.map((r) => <StatCard key={r.status} label={t(LEAD_STATUS_LABEL[r.status] ?? r.status)} value={r.total} hint={t("соңғы 30 күнде: {last_30d}", { last_30d: r.last_30d })} />)}
        </div>
        <p className="mt-2 text-xs text-ink-muted">{t("Барлығы: {total}. Сандар дерекқордан есептеледі.", { total })}</p>
      </section>
      <form method="get" className="mb-4 flex flex-wrap items-end gap-3" role="search">
        <div><label className="label" htmlFor="f-status">{t("Күйі")}</label>
          <select id="f-status" name="status" className="input" defaultValue={status ?? ""}><option value="">{t("Барлығы")}</option>{LEAD_STATUSES.map((s) => <option key={s} value={s}>{t(LEAD_STATUS_LABEL[s])}</option>)}</select></div>
        <div className="min-w-0 flex-1 sm:max-w-xs"><label className="label" htmlFor="f-q">{t("Іздеу")}</label>
          <input id="f-q" name="q" className="input" defaultValue={qs} placeholder={t("Ұйым, аты не e-mail")} maxLength={100} /></div>
        <button className="btn-secondary" type="submit">{t("Сүзу")}</button>
      </form>
      {shown.length === 0 ? <EmptyState title={status || qs ? t("Сұраныс бойынша ештеңе табылмады") : t("Әзірге сұрау жоқ")} text={status || qs ? undefined : t("Сұраулар /schools бетіндегі формадан түседі.")} /> : (
        <ul className="space-y-4">{shown.map((l) => <LeadCard key={l.id} l={l} />)}</ul>
      )}
      {rows.length > LIMIT && <p className="mt-3 text-sm text-ink-muted">{t("Алғашқы {LIMIT} жазба көрсетілді; сүзгіні пайдаланыңыз немесе CSV жүктеңіз.", { LIMIT })}</p>}
    </>
  );
}
