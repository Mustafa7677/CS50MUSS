import Link from "next/link";
import { ConfirmButton } from "@/components/ConfirmButton";
import { PriceForm, type PriceVal } from "@/components/admin/PriceForm";
import { EmptyState, PageHeader, Section } from "@/components/ui";
import { VAT_MODE_LABEL } from "@/lib/billing/labels";
import { formatMoney, formatPercent } from "@/lib/billing/money";
import { requirePlatformAdmin } from "@/lib/context";
import { withUser } from "@/lib/db";
import { PLAN_LABEL, fmtDate } from "@/lib/format";
import { deletePriceAction } from "./actions";
import { getT } from "@/lib/i18n";

export async function generateMetadata() { const t = await getT(); return { title: t("Баға бағдарламасы") }; }
export const dynamic = "force-dynamic";

type Row = { id: string; plan: string; months: number; student_limit: number; price_tiyn: string; currency: string; vat_mode: string; vat_rate_bp: number; valid_from: string; valid_until: string | null; active: boolean };
const plain = (tt: string) => `${BigInt(tt) / 100n},${String(BigInt(tt) % 100n).padStart(2, "0")}`;

export default async function PricesPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) { const t = await getT();
  const ctx = await requirePlatformAdmin();
  const sp = await searchParams;
  const rows = await withUser(ctx.userId, (q) => q<Row>(
    "select id, plan, months, student_limit, price_tiyn::text, currency, vat_mode, vat_rate_bp, valid_from::text, valid_until::text, active from public.platform_prices order by plan, months, student_limit, valid_from desc"));
  const editing = rows.find((r) => r.id === sp.edit);
  const val: PriceVal | null = editing ? { id: editing.id, plan: editing.plan, months: editing.months, student_limit: editing.student_limit, price: plain(editing.price_tiyn), currency: editing.currency,
    vat_mode: editing.vat_mode, vat_rate: editing.vat_rate_bp ? String(editing.vat_rate_bp / 100).replace(".", ",") : "", valid_from: editing.valid_from, valid_until: editing.valid_until ?? "", active: editing.active } : null;
  const today = new Date(Date.now() + 5 * 3600_000).toISOString().slice(0, 10);
  const todayD = today;
  return (
    <>
      <p className="mb-2 text-sm"><Link href="/admin/orders">{t("← Тапсырыстар")}</Link></p>
      <PageHeader title={t("Баға бағдарламасы")} subtitle={t("Бағаны осы жерде өзіңіз белгілейсіз: кодта баға жоқ. Баға қойылмаған пакет «баға келісім бойынша» болады. Шот берілген тапсырыстың бағасы кейін өзгертілсе де өзгермейді (снапшот).")} />
      <Section title={val ? t("Бағаны өзгерту") : t("Жаңа баға")}>
        <PriceForm v={val} today={today} />
        {val && <p className="mt-2 text-sm"><Link href="/admin/prices">{t("Жаңа баға қосуға оралу")}</Link></p>}
      </Section>
      <Section title={t("Бар бағалар")}>
        {rows.length === 0 ? <EmptyState title={t("Баға қойылмаған")} text={t("Барлық тапсырыс «баға келісім бойынша» болады. Жоғарыдағы форма арқылы баға қосыңыз.")} /> : (
          <div className="table-wrap"><table className="w-full text-sm" data-testid="prices-table">
            <thead><tr><th className="th">{t("Пакет")}</th><th className="th">{t("Мерзім")}</th><th className="th">{t("Оқушыға дейін")}</th><th className="th text-right">{t("Баға")}</th><th className="th">{t("ҚҚС")}</th><th className="th">{t("Жарамдылық")}</th><th className="th">{t("Күйі")}</th><th className="th"><span className="sr-only">{t("Әрекет")}</span></th></tr></thead>
            <tbody>{rows.map((p) => {
              const live = p.active && p.valid_from <= todayD && (!p.valid_until || p.valid_until >= todayD);
              return (
                <tr key={p.id}><td className="td">{t(PLAN_LABEL[p.plan])}</td><td className="td">{p.months}{" "}{t("ай")}</td><td className="td">{p.student_limit}</td>
                  <td className="td text-right whitespace-nowrap">{formatMoney(p.price_tiyn, p.currency)}</td>
                  <td className="td">{p.vat_mode === "none" ? t("ҚҚС жоқ") : `${VAT_MODE_LABEL[p.vat_mode]} (${formatPercent(p.vat_rate_bp)})`}</td>
                  <td className="td whitespace-nowrap">{fmtDate(p.valid_from, false, t.locale)} - {p.valid_until ? fmtDate(p.valid_until, false, t.locale) : t("шектеусіз")}</td>
                  <td className="td">{live ? t("Қолданыста") : p.active ? t("Күтілуде/мерзімі өткен") : t("Өшірулі")}</td>
                  <td className="td"><div className="flex justify-end gap-2"><Link className="btn-secondary" href={`/admin/prices?edit=${p.id}`}>{t("Өзгерту")}</Link>
                    <ConfirmButton action={deletePriceAction} fields={{ id: p.id }} label={t("Жою")} title={t("Бағаны жою?")} message={t("Баға жойылады. Бұрын берілген шоттар өзгермейді.")} confirmLabel={t("Жою")} /></div></td></tr>);
            })}</tbody>
          </table></div>
        )}
      </Section>
    </>
  );
}
