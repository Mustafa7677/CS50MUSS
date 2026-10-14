import Link from "next/link";
import { currentUserId } from "@/lib/auth/session";
import { withUser } from "@/lib/db";

/** Қоңырау: оқылмаған хабарландыру саны. Серверлік компонент (RLS: тек өз хабарландыруы). */
export async function NotificationBell({ userId }: { userId?: string } = {}) {
  let n = 0;
  try {
    const uid = userId ?? (await currentUserId());
    if (!uid) return null;
    const r = await withUser(uid, (q) => q<{ n: string }>("select count(*) as n from public.notifications where user_id = auth.uid() and read_at is null"));
    n = Number(r[0]?.n ?? 0);
  } catch { n = 0; }
  const label = n > 0 ? `Хабарландырулар: ${n} оқылмаған` : "Хабарландырулар";
  return (
    <Link href="/notifications" aria-label={label} title={label} data-testid="notification-bell" className="btn-secondary relative px-3 no-underline">
      <span aria-hidden>🔔</span>
      {n > 0 && (
        <span data-testid="notification-count" className="absolute -right-1.5 -top-1.5 grid min-w-[1.25rem] place-items-center rounded-full bg-red-600 px-1 text-[11px] font-bold leading-5 text-white">
          {n > 99 ? "99+" : n}
        </span>
      )}
    </Link>
  );
}
