import Link from "next/link";
import { ConfirmButton } from "@/components/ConfirmButton";
import { BillingForm, OrderForm, type Billing } from "@/components/school/OrderForms";
import { Banner, EmptyState, PageHeader, Section, StatusBadge } from "@/components/ui";
import { CAN_CANCEL, ORDER_STATUS_LABEL, ORDER_TONE, VAT_MODE_LABEL } from "@/lib/billing/labels";
import { formatMoney, formatPercent } from "@/lib/billing/money";
import { requireSchoolAdmin } from "@/lib/context";
import { withUser } from "@/lib/db";
import { PLAN_LABEL, fmtDate } from "@/lib/format";
import { cancelOrderAction, requestLicenceAction, saveBillingProfileAction } from "./actions";
import { getT } from "@/lib/i18n";

export async function generateMetadata() { const t = await getT(); return { title: t("Лицензияны жаңарту") }; }
export const dynamic = "force-dynamic";

type Price = { plan: string; months: number; student_limit: number; currency: string; vat_mode: string; vat_rate_bp: number; price_tiyn: string; net_tiyn: string; vat_tiyn: string; total_tiyn: string };
type Order = {
  id: string; created_at: string; plan: string; months: number; students: number; teachers: number; status: string; admin_note: string | null;
  currency: string | null; vat_mode: string | null; vat_rate_bp: number | null; total_tiyn: string | null; vat_tiyn: string | null; invoice_no: string | null;
  invoice_date: string | null; due_date: string | null; paid_date: string | null; result_valid_until: string | null;
};

export default async function OrderPage() { const t = await getT();
  const ctx = await requireSchoolAdmin();
  const org = ctx.active.org_id;
  const { lic, billing, prices, orders } = await withUser(ctx.userId, async (q) => ({
    lic: (await q<{ plan: string; max_students: number; max_teachers: number; valid_until: string; state: string }>(
      "select plan, max_students, max_teachers, valid_until::text, state from public.licence_usage($1)", [org]))[0],
    billing: ((await q<NonNullable<Billing>>(
      "select legal_name, bin_iin, address, bank_name, bik, iik, kbe, contact_name, contact_email, contact_phone from public.org_billing_profile where org_id = $1", [org]))[0] ?? null) as Billing,
    prices: await q<Price>("select plan, months, student_limit, currency, vat_mode, vat_rate_bp, price_tiyn::text, net_tiyn::text, vat_tiyn::text, total_tiyn::text from public.price_list()"),
    orders: await q<Order>(
      `select id, created_at, plan, months, students, teachers, status, admin_note, currency, vat_mode, vat_rate_bp, total_tiyn::text, vat_tiyn::text, invoice_no,
              invoice_date::text, due_date::text, paid_date::text, result_valid_until::text
         from public.licence_orders where org_id = $1 order by created_at desc limit 100`, [org]),
  }));
  return (
    <>
      <p className="mb-2 text-sm"><Link href="/school/licence">{t("← Лицензия")}</Link></p>
      <PageHeader title={t("Лицензияны жаңарту")} subtitle={t("Тапсырыс беріңіз: платформа әкімшісі баға ұсынып, төлем шотын береді. Төлем банк аударымымен жүргізіледі, төлем расталған соң лицензия жаңарады.")} />
      {lic && <p className="mb-4 text-sm text-ink-muted" data-testid="order-current">{t("Қазіргі лицензия:")}{" "}<strong>{t(PLAN_LABEL[lic.plan] ?? lic.plan)}</strong>{" "}{t("· {fmtDate} дейін · оқушы {max_students} · мұғалім", { fmtDate: fmtDate(lic.valid_until, false, t.locale), max_students: lic.max_students })}{" "}{lic.max_teachers}</p>}

      <Section title={t("1. Төлем реквизиттері")}>
        <p className="mb-3 text-sm text-ink-muted">{t("Шотта «Тапсырыс беруші» ретінде шығады. Деректерді ұйымның өзі енгізеді; заңды тұлғаның деректері ғана (жеке оқушы деректері емес).")}</p>
        <BillingForm action={saveBillingProfileAction} v={billing} />
      </Section>

      <Section title={t("2. Тапсырыс")}>
        {billing
          ? <OrderForm action={requestLicenceAction} defaults={{ plan: lic?.plan ?? "starter", students: lic?.max_students ?? 100, teachers: lic?.max_teachers ?? 5 }} />
          : <Banner tone="warn">{t("Тапсырыс беру үшін алдымен жоғарыдағы төлем реквизиттерін сақтаңыз.")}</Banner>}
        <div className="mt-4" data-testid="price-list">
          <h3 className="mb-2 text-sm font-semibold">{t("Қазіргі баға тізімі")}</h3>
          {prices.length === 0 ? (
            <Banner tone="info">{t("Баға келісім бойынша. Тапсырыс берсеңіз, платформа әкімшісі бағаны жеке ұсынады.")}</Banner>
          ) : (
            <div className="table-wrap"><table className="w-full text-sm">
              <thead><tr><th className="th">{t("Пакет")}</th><th className="th">{t("Мерзімі")}</th><th className="th">{t("Оқушыға дейін")}</th><th className="th text-right">{t("Баға")}</th><th className="th">{t("ҚҚС")}</th></tr></thead>
              <tbody>{prices.map((p, i) => (
                <tr key={i}><td className="td">{t(PLAN_LABEL[p.plan])}</td><td className="td">{p.months}{" "}{t("ай")}</td><td className="td">{p.student_limit}</td>
                  <td className="td text-right whitespace-nowrap">{formatMoney(p.total_tiyn, p.currency)}</td>
                  <td className="td">{p.vat_mode === "none" ? t("ҚҚС жоқ") : `${VAT_MODE_LABEL[p.vat_mode]} (${formatPercent(p.vat_rate_bp)})`}</td></tr>))}</tbody>
            </table></div>
          )}
          <p className="hint mt-2">{t("Баға тізімі - ақпарат үшін; соңғы сома шотта көрсетіледі.")}</p>
        </div>
      </Section>

      <Section title={t("Тапсырыстар тарихы")}>
        {orders.length === 0 ? <EmptyState title={t("Әзірге тапсырыс жоқ")} text={t("Жоғарыдағы форма арқылы бірінші тапсырысты беріңіз.")} /> : (
          <div className="table-wrap"><table className="w-full text-sm" data-testid="orders-table">
            <thead><tr><th className="th">{t("Күні")}</th><th className="th">{t("Пакет")}</th><th className="th">{t("Мерзім / лимит")}</th><th className="th">{t("Күйі")}</th><th className="th text-right">{t("Сома")}</th><th className="th">{t("Шот")}</th><th className="th"><span className="sr-only">{t("Әрекет")}</span></th></tr></thead>
            <tbody>{orders.map((o) => (
              <tr key={o.id} data-testid="order-row" data-status={o.status}>
                <td className="td whitespace-nowrap">{fmtDate(o.created_at, false, t.locale)}</td>
                <td className="td">{t(PLAN_LABEL[o.plan])}</td>
                <td className="td">{o.months}{" "}{t("ай · {students} оқушы · {teachers} мұғалім", { students: o.students, teachers: o.teachers })}</td>
                <td className="td"><StatusBadge status={ORDER_TONE[o.status] ?? "none"} label={ORDER_STATUS_LABEL[o.status] ?? o.status} />
                  {o.admin_note && (o.status === "rejected" || o.status === "quoted") && <p className="mt-1 text-xs text-ink-muted">{o.admin_note}</p>}
                  {o.status === "activated" && o.result_valid_until && <p className="mt-1 text-xs text-ink-muted">{t("Лицензия {fmtDate} дейін", { fmtDate: fmtDate(o.result_valid_until, false, t.locale) })}</p>}</td>
                <td className="td text-right whitespace-nowrap">{o.total_tiyn && o.currency ? formatMoney(o.total_tiyn, o.currency) : <span className="text-ink-muted">{t("баға келісім бойынша")}</span>}</td>
                <td className="td whitespace-nowrap">{o.invoice_no ? <>№ {o.invoice_no}{o.due_date && <span className="block text-xs text-ink-muted">{t("төлеу: {fmtDate} дейін", { fmtDate: fmtDate(o.due_date, false, t.locale) })}</span>}</> : "-"}</td>
                <td className="td"><div className="flex flex-wrap justify-end gap-2">
                  {o.invoice_no && o.status !== "cancelled" && o.status !== "rejected" && <a className="btn-secondary" href={`/api/invoices/${o.id}`} data-testid="invoice-download">{t("Шотты жүктеу (PDF)")}</a>}
                  {CAN_CANCEL(o.status) && <ConfirmButton action={cancelOrderAction} fields={{ id: o.id }} label={t("Бас тарту")} title={t("Тапсырыстан бас тарту?")} message={t("Тапсырыс жабылады. Қажет болса жаңа тапсырыс бере аласыз.")} confirmLabel={t("Иә, тапсырыстан бас тарту")} />}
                </div></td>
              </tr>))}</tbody>
          </table></div>
        )}
      </Section>
    </>
  );
}
