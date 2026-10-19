import Link from "next/link";
import { logoutAction } from "@/app/actions";
import { ThemeToggle } from "./ThemeToggle";
import { brandFor, brandStyle } from "@/lib/brand";
import { ROLE_LABEL } from "@/lib/format";
import type { Ctx, Membership } from "@/lib/context";
import { getT } from "@/lib/i18n";

export type NavItem = { href: string; label: string; icon?: string };

/** Барлық рөл панельдерінің ортақ қабығы: sidebar + жоғарғы жолақ + брендинг + лицензия ескертуі. */
export async function Shell({ ctx, active, nav, children, area }: { ctx: Ctx; active: Membership | null; nav: NavItem[]; children: React.ReactNode; area: string }) { const t = await getT();
  const brand = await brandFor(ctx.userId, active?.org_id);
  const roleName = area === "admin" ? t("Платформа әкімшісі") : t(ROLE_LABEL[active?.role ?? "student"]);
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[16rem_1fr]">
      <style dangerouslySetInnerHTML={{ __html: brandStyle(brand) }} />
      <aside className="hidden border-r border-line bg-surface lg:block">
        <div className="sticky top-0 flex h-screen flex-col">
          <Link href="/app" className="flex items-center gap-3 px-5 py-5">
            {brand.logo_url
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={brand.logo_url} alt="" className="h-9 w-9 rounded-lg object-contain" />
              : <span aria-hidden className="grid h-9 w-9 place-items-center rounded-lg bg-brand text-lg font-bold text-brand-ink">{brand.name.slice(0, 1)}</span>}
            <span className="font-bold leading-tight">{brand.name}</span>
          </Link>
          <nav aria-label={t("Негізгі мәзір")} className="flex-1 space-y-1 px-3">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-ink hover:bg-brand-soft">
                {n.icon && <span aria-hidden>{n.icon}</span>}{n.label}
              </Link>
            ))}
          </nav>
          <UserBox ctx={ctx} roleName={roleName} />
        </div>
      </aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-surface/90 px-4 py-3 backdrop-blur lg:px-8">
          <details className="relative lg:hidden">
            <summary className="btn-secondary cursor-pointer list-none px-3" aria-label={t("Мәзір")}>☰</summary>
            <div className="absolute left-0 top-12 w-64 rounded-xl border border-line bg-surface p-2 shadow-xl">
              <p className="px-3 py-2 text-sm font-bold">{brand.name}</p>
              {nav.map((n) => <Link key={n.href} href={n.href} className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-brand-soft">{n.icon} {n.label}</Link>)}
              <div className="mt-2 border-t border-line pt-2"><UserBox ctx={ctx} roleName={roleName} compact /></div>
            </div>
          </details>
          <p className="hidden text-sm text-ink-muted lg:block">{active ? `${active.org_name}` : t("Платформа")}</p>
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </header>
        <main id="main" className="mx-auto max-w-6xl px-4 py-6 lg:px-8">
          {/* демо және лицензия банерлері - әр рөлдің layout.tsx-інде (DemoBanner, LicenceBanner) */}
          {children}
        </main>
      </div>
    </div>
  );
}

async function UserBox({ ctx, roleName, compact }: { ctx: Ctx; roleName: string; compact?: boolean }) { const t = await getT();
  return (
    <div className={compact ? "px-3 py-1" : "border-t border-line p-4"}>
      <p className="truncate text-sm font-semibold" data-testid="user-name">{ctx.fullName}</p>
      <p className="text-xs text-ink-muted">{roleName}</p>
      <form action={logoutAction} className="mt-2"><button type="submit" className="btn-secondary w-full text-xs">{t("Шығу")}</button></form>
    </div>
  );
}
