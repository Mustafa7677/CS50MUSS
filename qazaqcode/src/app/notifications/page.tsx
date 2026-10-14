import Link from "next/link";
import { redirect } from "next/navigation";
import { ActionForm } from "@/components/ActionForm";
import { EmptyState, PageHeader } from "@/components/ui";
import { getContext, homeFor } from "@/lib/context";
import { withUser } from "@/lib/db";
import { fmtDate } from "@/lib/format";
import { markAllReadAction } from "./actions";

export const metadata = { title: "Хабарландырулар" };
export const dynamic = "force-dynamic";

type Row = { id: string; kind: string; title: string; body: string | null; link: string | null; read_at: string | null; created_at: string };

const safeLink = (l: string | null) => (l && /^\/(?!\/)/.test(l) ? l : null);

export default async function NotificationsPage() {
  const ctx = await getContext();
  if (!ctx) redirect("/login");
  const rows = await withUser(ctx.userId, (q) => q<Row>(
    "select id, kind, title, body, link, read_at, created_at from public.notifications where user_id = auth.uid() order by created_at desc limit 100"));
  const unread = rows.filter((r) => !r.read_at).length;
  const home = homeFor(ctx);

  return (
    <main id="main" className="mx-auto max-w-3xl px-4 py-6">
      <p className="mb-3"><Link href={home} className="text-sm">← Басты бетке</Link></p>
      <PageHeader title="Хабарландырулар" subtitle={unread ? `Оқылмаған: ${unread}` : "Барлығы оқылған."} />
      {unread > 0 && (
        <ActionForm action={markAllReadAction} submitLabel="Бәрін оқылды деп белгілеу" submitClassName="btn-secondary" className="mb-4" successToast={false}>
          <span className="sr-only">Оқылмаған хабарландырулар бар</span>
        </ActionForm>
      )}
      {rows.length === 0 ? (
        <EmptyState title="Хабарландыру жоқ" text="Жаңа тапсырма, баға немесе курс болғанда осында хабар түседі." />
      ) : (
        <ul className="card divide-y divide-line" data-testid="notification-list">
          {rows.map((r) => {
            const href = safeLink(r.link);
            const inner = (
              <>
                <span className="flex items-start gap-2">
                  {!r.read_at && <span aria-label="Оқылмаған" className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-brand" />}
                  <span className="min-w-0">
                    <span className={`block break-words ${r.read_at ? "" : "font-semibold"}`}>{r.title}</span>
                    {r.body && <span className="block break-words text-sm text-ink-muted">{r.body}</span>}
                  </span>
                </span>
                <span className="mt-1 block text-xs text-ink-muted">{fmtDate(r.created_at, true)}</span>
              </>
            );
            return (
              <li key={r.id} data-unread={r.read_at ? "false" : "true"}>
                {href
                  ? <Link href={href} className="block px-4 py-3 text-ink no-underline hover:bg-surface-2">{inner}</Link>
                  : <div className="px-4 py-3">{inner}</div>}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
