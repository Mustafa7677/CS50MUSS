import Link from "next/link";
import { OrderActions } from "@/components/admin/OrderActions";
import { Banner, EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { ORDER_STATUSES, ORDER_STATUS_LABEL, ORDER_TONE, VAT_MODE_LABEL } from "@/lib/billing/labels";
import { formatMoney, formatPercent } from "@/lib/billing/money";
import { requirePlatformAdmin } from "@/lib/context";
import { withUser } from "@/lib/db";
import { PLAN_LABEL, fmtDate } from "@/lib/format";

export const metadata = { title: "Лицензия тапсырыстары" };
export const dynamic = "force-dynamic";

type Row = {
  id: string; created_at: string; org_id: string; org_name: string; requester: string | null; plan: string; months: number; students: number; teachers: number;
  status: string; note: string | null; admin_note: string | null; currency: string | null; vat_mode: string | null; vat_rate_bp: number | null; price_source: string | null;
  net_tiyn: string | null; vat_tiyn: string | null; total_tiyn: string | null; invoice_no: string | null; invoice_date: string | null; due_date: string | null;
  paid_ref: string | null; paid_date: string | null; result_valid_until: string | null; buyer_legal_name: string | null; buyer_bin_iin: string | null;
};

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const ctx = await requirePlatformAdmin();
  const sp = await searchParams;
  const status = (ORDER_STATUSES as readonly string[]).includes(sp.status ?? "") ? sp.status! : null;
  const { rows, seller, prices } = await withUser(ctx.userId, async (q) => ({
    rows: await q<Row>(
      `select id, created_at, org_id, org_name, requester, plan, months, students, teachers, status, note, admin_note, currency, vat_mode, vat_rate_bp, price_source,
              net_tiyn::text, vat_tiyn::text, total_tiyn::text, invoice_no, invoice_date::text, due_date::text, paid_ref, paid_date::text, result_valid_until::text, buyer_legal_name, buyer_bin_iin
         from public.admin_list_orders($1)`, [status]),
    seller: (await q<{ n: string }>("select count(*)::text n from public.platform_seller_profile"))[0].n !== "0",
    prices: (await q<{ n: string }>("select count(*)::text n from public.platform_prices where active"))[0].n,
  }));
  const today = new Date(Date.now() + 5 * 3600_000).toISOString().slice(0, 10); // Asia/Almaty күні (UTC+5)
  const exportHref = `/admin/orders/export${status ? `?status=${status}` : ""}`;
  return (
    <>
      <PageHeader title="Лицензия тапсырыстары" subtitle="Мектептердің жаңарту тапсырыстары: баға ұсыну -> шот -> төлемді қолмен растау -> активтендіру. Тек тапсырыс деректері мен реквизиттер көрінеді, оқушы деректері емес."
        actions={<><Link className="btn-secondary" href="/admin/prices">Баға бағдарламасы</Link><Link className="btn-secondary" href="/admin/seller">Сатушы профилі</Link><a className="btn-secondary" href={exportHref}>CSV жүктеу</a></>} />
      {!seller && <Banner tone="warn">Сатушы реквизиттері толтырылмаған: шот берілмейді. <Link href="/admin/seller" className="underline">Сатушы профилін толтырыңыз</Link>.</Banner>}
      {prices === "0" && <Banner tone="info">Баға бағдарламасы бос: барлық тапсырыс «баға келісім бойынша» болады. <Link href="/admin/prices" className="underline">Бағаларды баптау</Link>.</Banner>}
      <nav aria-label="Күй сүзгісі" className="mb-4 flex flex-wrap gap-2">
        <Link href="/admin/orders" className={status ? "btn-secondary" : "btn-primary"}>Барлығы</Link>
        {ORDER_STATUSES.map((s) => <Link key={s} href={`/admin/orders?status=${s}`} className={status === s ? "btn-primary" : "btn-secondary"}>{ORDER_STATUS_LABEL[s]}</Link>)}
      </nav>
      {rows.length === 0 ? <EmptyState title={status ? "Бұл күйде тапсырыс жоқ" : "Әзірге тапсырыс жоқ"} text="Тапсырыстар мектеп әкімшісі «Лицензияны жаңарту» арқылы бергенде осында түседі." /> : (
        <ul className="space-y-4" data-testid="orders-list">{rows.map((o) => (
          <li key={o.id} className="card p-4" data-testid="admin-order" data-status={o.status} data-org={o.org_name}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold"><Link href={`/admin/orgs/${o.org_id}`}>{o.org_name}</Link></p>
                <p className="text-xs text-ink-muted">{fmtDate(o.created_at)}{o.requester ? ` · ${o.requester}` : ""}</p>
              </div>
              <StatusBadge status={ORDER_TONE[o.status] ?? "none"} label={ORDER_STATUS_LABEL[o.status] ?? o.status} />
            </div>
            <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <div><dt className="text-ink-muted">Сұралған</dt><dd>{PLAN_LABEL[o.plan]} · {o.months} ай · {o.students} оқушы · {o.teachers} мұғалім</dd></div>
              <div><dt className="text-ink-muted">Сома</dt><dd data-testid="order-total">{o.total_tiyn && o.currency ? <>{formatMoney(o.total_tiyn, o.currency)}<span className="block text-xs text-ink-muted">{VAT_MODE_LABEL[o.vat_mode ?? "none"]}{o.vat_mode !== "none" && o.vat_rate_bp ? ` ${formatPercent(o.vat_rate_bp)}, ҚҚС ${formatMoney(o.vat_tiyn ?? 0, o.currency)}` : ""}{o.price_source === "negotiated" ? " · келісілген" : ""}</span></> : <span className="text-ink-muted">баға ұсынылмаған</span>}</dd></div>
              <div><dt className="text-ink-muted">Сатып алушы</dt><dd>{o.buyer_legal_name ?? "-"}<span className="block text-xs text-ink-muted">БИН/ЖСН {o.buyer_bin_iin ?? "-"}</span></dd></div>
              <div><dt className="text-ink-muted">Шот / төлем</dt><dd>{o.invoice_no ? <>№ {o.invoice_no}<span className="block text-xs text-ink-muted">төлеу: {fmtDate(o.due_date)} дейін{o.paid_ref ? ` · төленді ${fmtDate(o.paid_date)}, ${o.paid_ref}` : ""}</span></> : "-"}</dd></div>
            </dl>
            {o.note && <p className="mt-2 text-sm"><span className="text-ink-muted">Мектеп ескертпесі:</span> {o.note}</p>}
            {o.admin_note && <p className="mt-1 text-sm"><span className="text-ink-muted">Ескертпе:</span> {o.admin_note}</p>}
            {o.status === "activated" && <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-300">Лицензия {fmtDate(o.result_valid_until)} дейін жаңартылды.</p>}
            {o.invoice_no && o.status !== "cancelled" && o.status !== "rejected" && <p className="mt-2"><a className="btn-secondary" href={`/api/invoices/${o.id}`} data-testid="admin-invoice-download">Шотты жүктеу (PDF)</a></p>}
            <OrderActions id={o.id} status={o.status} today={today} />
          </li>))}</ul>
      )}
    </>
  );
}
