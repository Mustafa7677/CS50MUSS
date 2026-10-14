import Link from "next/link";
import { ActionForm } from "@/components/ActionForm";
import { acceptInviteAction, registerWithInviteAction, logoutAction } from "../../actions";
import { getContext } from "@/lib/context";
import { withUser } from "@/lib/db";
import { ROLE_LABEL } from "@/lib/format";
import { messageForCode } from "@/lib/errors";

export const metadata = { title: "Шақыру" };

export default async function InvitePage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ e?: string }> }) {
  const { token } = await params;
  const errMsg = messageForCode((await searchParams).e);
  const pv = await withUser(null, (q) => q<{ org_name: string; role: string; email: string | null; expired: boolean }>("select * from public.invitation_preview($1)", [token]));
  const inv = pv[0];
  const ctx = await getContext();
  return (
    <main id="main" className="grid min-h-screen place-items-center px-4 py-10">
      <div className="card w-full max-w-md p-7">
        {!inv || inv.expired ? (
          <>
            <h1 className="text-2xl font-bold">Шақыру жарамсыз</h1>
            <p className="mt-2 text-sm text-ink-muted">Шақыру сілтемесі қате, мерзімі өткен не бұрын қолданылған. Мектеп әкімшісінен жаңа сілтеме сұраңыз.</p>
            <p className="mt-4"><Link href="/login" className="btn-secondary">Кіру бетіне</Link></p>
          </>
        ) : (
          <>
            <p className="text-sm font-semibold uppercase tracking-widest text-brand">{inv.org_name}</p>
            <h1 className="mt-1 text-2xl font-bold">Шақыру: {ROLE_LABEL[inv.role] ?? inv.role}</h1>
            <p className="mt-2 text-sm text-ink-muted">Сізді «{inv.org_name}» ұйымына {ROLE_LABEL[inv.role]?.toLowerCase()} ретінде шақырды.</p>
            {errMsg && <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">{errMsg}</p>}
            {ctx ? (
              <div className="mt-6">
                <p className="text-sm">Сіз <strong>{ctx.fullName}</strong> ретінде кірдіңіз.</p>
                <ActionForm action={acceptInviteAction} submitLabel="Шақыруды қабылдау" className="mt-3" successToast={false}>
                  <input type="hidden" name="token" value={token} />
                </ActionForm>
                <form action={logoutAction} className="mt-3"><button className="btn-ghost text-xs" type="submit">Басқа аккаунтпен кіру</button></form>
              </div>
            ) : (
              <>
                <ActionForm action={registerWithInviteAction} submitLabel="Тіркелу және қабылдау" className="mt-6" successToast={false}>
                  <input type="hidden" name="token" value={token} />
                  <label className="label" htmlFor="name">Аты-жөніңіз</label>
                  <input id="name" name="name" required minLength={2} maxLength={120} autoComplete="name" className="input" />
                  <label className="label mt-4" htmlFor="email">E-mail</label>
                  <input id="email" name="email" type="email" required autoComplete="username" defaultValue={inv.email ?? ""} readOnly={!!inv.email} className="input" />
                  <label className="label mt-4" htmlFor="password">Құпиясөз</label>
                  <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" className="input" />
                  <p className="hint">Кемінде 8 символ.</p>
                </ActionForm>
                <p className="mt-5 text-sm text-ink-muted">Аккаунтыңыз бар ма? <Link href={`/login?next=/invite/${token}`}>Кіріңіз</Link>.</p>
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}
