import Link from "next/link";
import { redirect } from "next/navigation";
import { ActionForm } from "@/components/ActionForm";
import { loginAction } from "../actions";
import { getContext, homeFor } from "@/lib/context";
import { publicBrand, brandStyle } from "@/lib/brand";
import { getT } from "@/lib/i18n";

import { LangSwitch } from "@/components/LangSwitch";
export async function generateMetadata() { const t = await getT(); return { title: t("Кіру") }; }

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; org?: string }> }) { const t = await getT();
  const sp = await searchParams;
  const ctx = await getContext();
  if (ctx) redirect(homeFor(ctx));
  const brand = await publicBrand(sp.org);
  return (
    <main id="main" className="grid min-h-screen place-items-center px-4 py-10">
      <div className="fixed right-3 top-3 z-40"><LangSwitch /></div>
      <style dangerouslySetInnerHTML={{ __html: brandStyle(brand) }} />
      <div className="card w-full max-w-md p-7">
        <p className="text-sm font-semibold uppercase tracking-widest text-brand">{brand.name}</p>
        <h1 className="mt-1 text-2xl font-bold">{t("Жүйеге кіру")}</h1>
        {brand.welcome_text && <p className="mt-2 text-sm text-ink-muted">{brand.welcome_text}</p>}
        <ActionForm action={loginAction} submitLabel={t("Кіру")} className="mt-6" successToast={false}>
          <input type="hidden" name="next" value={sp.next ?? ""} />
          <label className="label" htmlFor="email">E-mail</label>
          <input id="email" name="email" type="email" autoComplete="username" required className="input" />
          <label className="label mt-4" htmlFor="password">{t("Құпиясөз")}</label>
          <input id="password" name="password" type="password" autoComplete="current-password" required className="input" />
        </ActionForm>
        <p className="mt-5 text-sm text-ink-muted">
          {t("Оқушы ма?")}{" "}<Link href="/join">{t("Сынып коды арқылы қосылыңыз")}</Link>{t(". Мұғалім не әкімші ме? Тіркелу үшін мектептен алған шақыру сілтемесін ашыңыз.")}
        </p>
      </div>
    </main>
  );
}
