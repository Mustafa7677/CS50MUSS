import Link from "next/link";
import { EmptyState, PageHeader } from "@/components/ui";
import { requireStudent } from "@/lib/context";
import { withUser } from "@/lib/db";
import { topicChips } from "@/lib/ai/advisor";
import { Chat } from "./Chat";

export const metadata = { title: "Көмекші" };
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function AiPage({ searchParams }: { searchParams: Promise<{ assignment?: string }> }) {
  const ctx = await requireStudent();
  const { assignment } = await searchParams;
  const data = await withUser(ctx.userId, async (q) => {
    const [st] = await q<{ s: boolean }>("select public.ai_status($1) as s", [ctx.active.org_id]);
    let a: { id: string; title: string; kind: string } | null = null;
    if (st?.s && assignment && UUID.test(assignment)) {
      [a = null] = await q<{ id: string; title: string; kind: string }>("select id, title, kind::text as kind from public.assignments where id = $1 and org_id = $2", [assignment, ctx.active.org_id]);
    }
    return { enabled: !!st?.s, a };
  });

  return (
    <>
      <PageHeader title="Көмекші" subtitle="Тақырыпты түсінуге, қатені іздеуге және келесі қадамды табуға көмектесетін оқу көмекшісі." />
      {!data.enabled ? (
        <EmptyState title="Көмекші қосылмаған"
          text="Мектебіңізде бұл мүмкіндік әлі қосылмаған. Қосу үшін мектеп әкімшісіне хабарласыңыз. Бұл кезде тапсырмалар мен курстар әдеттегідей жұмыс істей береді."
          action={<Link href="/student" className="btn-secondary">Басты бетке</Link>} />
      ) : (
        <Chat chips={topicChips()} assignment={data.a} />
      )}
    </>
  );
}
