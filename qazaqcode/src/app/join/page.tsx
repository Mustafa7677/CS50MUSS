import Link from "next/link";
import { ActionForm } from "@/components/ActionForm";
import { joinClassAction, registerWithCodeAction } from "../actions";
import { getContext } from "@/lib/context";
import { withUser } from "@/lib/db";
import { publicBrand, brandStyle } from "@/lib/brand";
import { messageForCode } from "@/lib/errors";

export const metadata = { title: "Сыныпқа қосылу" };

export default async function JoinPage({ searchParams }: { searchParams: Promise<{ code?: string; e?: string }> }) {
  const sp = await searchParams;
  const errMsg = messageForCode(sp.e);
  const code = (sp.code ?? "").trim().toUpperCase();
  const ctx = await getContext();
  const pv = code ? await withUser(null, (q) => q<{ classroom_name: string; subject: string; org_name: string; org_slug: string; teacher_name: string | null }>("select * from public.classroom_preview($1)", [code])) : [];
  const cls = pv[0];
  const brand = await publicBrand(cls?.org_slug);
  return (
    <main id="main" className="grid min-h-screen place-items-center px-4 py-10">
      <style dangerouslySetInnerHTML={{ __html: brandStyle(brand) }} />
      <div className="card w-full max-w-md p-7">
        <p className="text-sm font-semibold uppercase tracking-widest text-brand">{cls?.org_name ?? brand.name}</p>
        <h1 className="mt-1 text-2xl font-bold">Сыныпқа қосылу</h1>
        {!code && (
          <form method="get" className="mt-6">
            <label className="label" htmlFor="code">Мұғалім берген сынып коды</label>
            <input id="code" name="code" required minLength={6} maxLength={12} autoComplete="off" className="input font-mono uppercase tracking-widest" placeholder="ABCD2345" />
            <button type="submit" className="btn-primary mt-4">Жалғастыру</button>
            <p className="mt-5 text-sm text-ink-muted">Аккаунтыңыз бар ма? <Link href="/login?next=/join">Кіріңіз</Link>.</p>
          </form>
        )}
        {code && !cls && (
          <>
            <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">Сынып коды дұрыс емес немесе қосылу жабық.</p>
            <p className="mt-4"><Link href="/join" className="btn-secondary">Қайта енгізу</Link></p>
          </>
        )}
        {code && cls && (
          <>
            <div className="mt-3 rounded-lg bg-brand-soft p-3 text-sm">
              <p><strong>{cls.classroom_name}</strong> · {cls.subject}</p>
              {cls.teacher_name && <p className="text-ink-muted">Мұғалім: {cls.teacher_name}</p>}
            </div>
            {errMsg && <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">{errMsg}</p>}
            {ctx ? (
              <ActionForm action={joinClassAction} submitLabel="Сыныпқа қосылу" className="mt-5" successToast={false}>
                <input type="hidden" name="code" value={code} />
                <p className="text-sm">Сіз <strong>{ctx.fullName}</strong> ретінде кірдіңіз.</p>
              </ActionForm>
            ) : (
              <>
                <ActionForm action={registerWithCodeAction} submitLabel="Тіркелу және қосылу" className="mt-5" successToast={false}>
                  <input type="hidden" name="code" value={code} />
                  <label className="label" htmlFor="name">Аты-жөніңіз</label>
                  <input id="name" name="name" required minLength={2} maxLength={120} autoComplete="name" className="input" />
                  <label className="label mt-4" htmlFor="email">E-mail</label>
                  <input id="email" name="email" type="email" required autoComplete="username" className="input" />
                  <label className="label mt-4" htmlFor="password">Құпиясөз</label>
                  <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" className="input" />
                  <p className="hint">Кемінде 8 символ. Деректеріңіз тек мектебіңіздің ішінде көрінеді.</p>
                </ActionForm>
                <p className="mt-5 text-sm text-ink-muted">Аккаунтыңыз бар ма? <Link href={`/login?next=${encodeURIComponent("/join?code=" + code)}`}>Кіріңіз</Link>.</p>
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}
