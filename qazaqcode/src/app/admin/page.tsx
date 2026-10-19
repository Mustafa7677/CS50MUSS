import Link from "next/link";
import { ConfirmButton } from "@/components/ConfirmButton";
import { LinkActionForm } from "@/components/admin/LinkAction";
import { EmptyState, PageHeader, ProgressBar, Section, StatCard, StatusBadge } from "@/components/ui";
import { requirePlatformAdmin } from "@/lib/context";
import { withUser } from "@/lib/db";
import { LICENSE_STATE_LABEL, PLAN_LABEL, fmtDate } from "@/lib/format";
import { createOrganizationAction, extendLicenseAction, inviteSchoolAdminAction, setOrgStatusAction } from "./actions";
import { getT } from "@/lib/i18n";

export async function generateMetadata() { const t = await getT(); return { title: t("Ұйымдар") }; }
type Usage = {
  days_left?: number | null;
  org_id: string; name: string; slug: string; status: string; license_state: string; plan: string | null; valid_until: string | null;
  students: string; max_students: number | null; teachers: string; max_teachers: number | null; classes: string; assignments: string; submissions_30d: string;
};
type Lic = { org_id: string; plan: string; max_students: number; max_teachers: number; valid_until: string; status: string; notes: string | null };

const todayPlus = (d: number) => new Date(Date.now() + d * 864e5).toISOString().slice(0, 10);

export default async function AdminPage() { const t = await getT();
  const ctx = await requirePlatformAdmin();
  const { usage, lic } = await withUser(ctx.userId, async (q) => ({
    usage: await q<Usage>("select * from public.platform_usage()"),
    lic: await q<Lic>("select org_id, plan, max_students, max_teachers, valid_until::text, status, notes from licenses"),
  }));
  const daysLeft = (d: string | null) => (d ? Math.round((new Date(d.slice(0, 10) + "T00:00:00Z").getTime() - Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())) / 864e5) : null);
  const L = new Map(lic.map((l) => [l.org_id, l]));
  const sum = (k: keyof Usage) => usage.reduce((a, u) => a + Number(u[k] ?? 0), 0);
  const active = usage.filter((u) => u.license_state === "active").length;
  return (
    <>
      <PageHeader title={t("Ұйымдар")} subtitle={t("Мектептерді тіркеу, лицензия мен лимиттерді басқару. Оқушылардың жеке деректері (жұмыс, баға) бұл жерде көрінбейді: тек жиынтық сандар.")} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t("Ұйымдар")} value={usage.length} hint={t("{active} белсенді лицензиямен", { active })} />
        <StatCard label={t("Оқушылар")} value={sum("students")} />
        <StatCard label={t("Мұғалімдер")} value={sum("teachers")} />
        <StatCard label={t("Жұмыс (30 күн)")} value={sum("submissions_30d")} />
      </div>

      <Section title={t("Жаңа мектеп тіркеу")}>
        <div className="card p-5">
          <LinkActionForm action={createOrganizationAction} submitLabel={t("Мектепті тіркеу")} className="grid gap-4 sm:grid-cols-2">
            <div><label className="label" htmlFor="o-name">{t("Мектеп атауы")}</label><input id="o-name" name="name" required minLength={2} maxLength={160} className="input" placeholder={t("№12 мектеп-лицей")} /></div>
            <div><label className="label" htmlFor="o-slug">{t("Қысқа атау (slug)")}</label><input id="o-slug" name="slug" required pattern="[a-z0-9][a-z0-9\-]{1,38}[a-z0-9]" className="input font-mono" placeholder="mektep-12" /><p className="hint">{t("Кіру беті: /login?org=slug. Тек латын кіші әріп, сан, сызықша.")}</p></div>
            <div><label className="label" htmlFor="o-plan">{t("Пакет")}</label>
              <select id="o-plan" name="plan" className="input" defaultValue="starter"><option value="starter">{t("STARTER: 100 оқушы, 5 мұғалім")}</option><option value="pro">{t("PRO: 500 оқушы, 25 мұғалім")}</option><option value="enterprise">{t("ENTERPRISE: келісім бойынша")}</option></select></div>
            <div><label className="label" htmlFor="o-until">{t("Лицензия мерзімі (дейін)")}</label><input id="o-until" name="valid_until" type="date" required defaultValue={todayPlus(365)} className="input" /></div>
            <div><label className="label" htmlFor="o-ms">{t("Оқушы лимиті (бос = пакеттегідей)")}</label><input id="o-ms" name="max_students" type="number" min={0} className="input" /></div>
            <div><label className="label" htmlFor="o-mt">{t("Мұғалім лимиті (бос = пакеттегідей)")}</label><input id="o-mt" name="max_teachers" type="number" min={0} className="input" /></div>
          </LinkActionForm>
        </div>
      </Section>

      <Section title={t("Тіркелген ұйымдар")}>
        {usage.length === 0 ? <EmptyState title={t("Ұйым әлі жоқ")} text={t("Жоғарыдағы форма арқылы бірінші мектепті тіркеңіз.")} /> : (
          <div className="space-y-4">
            {usage.map((u) => {
              const l = L.get(u.org_id);
              (u as Usage & { days_left?: number | null }).days_left = daysLeft(l?.valid_until ?? u.valid_until);
              const ms = Number(u.students), mt = Number(u.teachers);
              return (
                <article key={u.org_id} className="card p-5" data-testid={`org-${u.slug}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold">{u.name} <span className="font-mono text-xs text-ink-muted">/{u.slug}</span></h3>
                      <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink-muted">
                        <StatusBadge status={u.status === "suspended" ? "suspended" : u.license_state} label={u.status === "suspended" ? t("Ұйым тоқтатылған") : t(LICENSE_STATE_LABEL[u.license_state] ?? u.license_state)} />
                        {u.plan && <span>{t(PLAN_LABEL[u.plan])}</span>}<span>{t("мерзімі:")}{" "}{fmtDate(u.valid_until, false, t.locale)}</span>
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {u.status === "active"
                        ? <ConfirmButton action={setOrgStatusAction} fields={{ org: u.org_id, status: "suspended" }} label={t("Тоқтату")} title={t("«{name}» ұйымын тоқтату?", { name: u.name })} message={t("Ұйым қолданушылары жұмыс тапсыра және жаңа нәрсе жасай алмайды. Деректер өшірілмейді. Кез келген уақытта қайта белсендіруге болады.")} confirmLabel={t("Тоқтату")} />
                        : <ConfirmButton action={setOrgStatusAction} fields={{ org: u.org_id, status: "active" }} label={t("Белсендіру")} title={t("«{name}» ұйымын белсендіру?", { name: u.name })} message={t("Ұйым жұмысы қалпына келеді.")} confirmLabel={t("Белсендіру")} danger={false} className="btn-primary" />}
                    </div>
                  </div>
                  <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                    <div><dt className="text-ink-muted">{t("Оқушылар")}</dt><dd className="font-semibold">{ms} / {u.max_students ?? "-"}</dd><ProgressBar value={ms} max={u.max_students ?? 0} label={t("Оқушы лимиті")} /></div>
                    <div><dt className="text-ink-muted">{t("Мұғалімдер")}</dt><dd className="font-semibold">{mt} / {u.max_teachers ?? "-"}</dd><ProgressBar value={mt} max={u.max_teachers ?? 0} label={t("Мұғалім лимиті")} /></div>
                    <div><dt className="text-ink-muted">{t("Сыныптар · тапсырмалар")}</dt><dd className="font-semibold">{u.classes} · {u.assignments}</dd></div>
                    <div><dt className="text-ink-muted">{t("Жұмыс (30 күн)")}</dt><dd className="font-semibold">{u.submissions_30d}</dd></div>
                  </dl>
                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    <div className="rounded-lg border border-line p-3">
                      <p className="text-sm font-semibold">{t("Лицензия")}</p>
                      <p className="mt-1 text-xs text-ink-muted">{l ? t("{PLAN_LABEL} · {max_students} оқушы · {max_teachers} мұғалім", { PLAN_LABEL: t(PLAN_LABEL[l.plan]), max_students: l.max_students, max_teachers: l.max_teachers }) : t("Лицензия жоқ")}{u.days_left != null ? ` · ${u.days_left < 0 ? t("{v} күн бұрын аяқталған", { v: -u.days_left }) : t("{days_left} күн қалды", { days_left: u.days_left })}` : ""}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Link href={`/admin/orgs/${u.org_id}`} className="btn-secondary" data-testid={`manage-${u.slug}`}>{t("Лицензияны басқару")}</Link>
                        {l && <ConfirmButton action={extendLicenseAction} fields={{ org: u.org_id, months: "12" }} label={t("+1 жыл")} title={t("Лицензияны 1 жылға ұзарту?")} message={t("Мерзім қолданыстағы мерзімнен (өтіп кетсе - бүгіннен) 1 жылға ұзарады.")} confirmLabel={t("Ұзарту")} danger={false} className="btn-primary" />}
                      </div>
                    </div>
                    <details className="rounded-lg border border-line p-3">
                      <summary className="cursor-pointer text-sm font-semibold">{t("Мектеп әкімшісін шақыру")}</summary>
                      <LinkActionForm action={inviteSchoolAdminAction} submitLabel={t("Шақыру сілтемесін жасау")} className="mt-3">
                        <input type="hidden" name="org" value={u.org_id} />
                        <label className="label" htmlFor={`e-${u.slug}`}>{t("E-mail (міндетті емес: берсеңіз, сілтеме тек сол мекенжайға жарайды)")}</label>
                        <input id={`e-${u.slug}`} name="email" type="email" className="input" />
                      </LinkActionForm>
                    </details>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </Section>
    </>
  );
}
