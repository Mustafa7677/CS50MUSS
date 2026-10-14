import Link from "next/link";
import { EmptyState, PageHeader } from "@/components/ui";
import { requirePlatformAdmin } from "@/lib/context";
import { withUser } from "@/lib/db";
import { fmtDate } from "@/lib/format";

export const metadata = { title: "Аудит журналы" };
const PAGE = 50;
type Row = { id: string; created_at: string; org_name: string | null; actor: string | null; action: string; entity: string; entity_id: string | null; meta: Record<string, unknown> };

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ org?: string; page?: string }> }) {
  const ctx = await requirePlatformAdmin();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const org = /^[0-9a-f-]{36}$/.test(sp.org ?? "") ? sp.org! : null;
  const { rows, orgs } = await withUser(ctx.userId, async (q) => ({
    rows: await q<Row>(
      `select a.id::text, a.created_at, o.name as org_name, coalesce(p.full_name, left(a.actor_id::text, 8)) as actor, a.action, a.entity, a.entity_id, a.meta
         from audit_logs a left join organizations o on o.id = a.org_id left join profiles p on p.id = a.actor_id
        where ($1::uuid is null or a.org_id = $1) order by a.id desc limit $2 offset $3`, [org, PAGE + 1, (page - 1) * PAGE]),
    orgs: await q<{ id: string; name: string }>("select id, name from organizations order by name"),
  }));
  const more = rows.length > PAGE;
  const shown = rows.slice(0, PAGE);
  const href = (p: number) => `/admin/audit?${new URLSearchParams({ ...(org ? { org } : {}), page: String(p) })}`;
  return (
    <>
      <PageHeader title="Аудит журналы" subtitle="Лицензия, мүшелік, баға және ұйым өзгерістері. Журнал өзгертілмейді және өшірілмейді." />
      <form className="mb-4 flex flex-wrap items-end gap-3" method="get">
        <div><label className="label" htmlFor="org">Ұйым</label>
          <select id="org" name="org" defaultValue={org ?? ""} className="input"><option value="">Барлығы</option>{orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</select></div>
        <button className="btn-secondary" type="submit">Сүзу</button>
      </form>
      {shown.length === 0 ? <EmptyState title="Жазба жоқ" /> : (
        <div className="table-wrap"><table className="w-full">
          <thead><tr><th className="th">Уақыты</th><th className="th">Ұйым</th><th className="th">Әрекет жасаған</th><th className="th">Әрекет</th><th className="th">Мәліметі</th></tr></thead>
          <tbody>{shown.map((r) => (
            <tr key={r.id} className="border-t border-line align-top">
              <td className="td whitespace-nowrap">{fmtDate(r.created_at, true)}</td><td className="td">{r.org_name ?? "-"}</td><td className="td">{r.actor ?? "жүйе"}</td>
              <td className="td font-mono text-xs">{r.action}</td><td className="td font-mono text-xs text-ink-muted">{Object.keys(r.meta).length ? JSON.stringify(r.meta) : "-"}</td>
            </tr>))}</tbody></table></div>
      )}
      <div className="mt-4 flex gap-2">
        {page > 1 && <Link className="btn-secondary" href={href(page - 1)}>← Алдыңғы</Link>}
        {more && <Link className="btn-secondary" href={href(page + 1)}>Келесі →</Link>}
      </div>
    </>
  );
}
