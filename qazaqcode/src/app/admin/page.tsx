import Link from "next/link";
import { ConfirmButton } from "@/components/ConfirmButton";
import { LinkActionForm } from "@/components/admin/LinkAction";
import { EmptyState, PageHeader, ProgressBar, Section, StatCard, StatusBadge } from "@/components/ui";
import { requirePlatformAdmin } from "@/lib/context";
import { withUser } from "@/lib/db";
import { LICENSE_STATE_LABEL, PLAN_LABEL, fmtDate } from "@/lib/format";
import { createOrganizationAction, extendLicenseAction, inviteSchoolAdminAction, setOrgStatusAction } from "./actions";

export const metadata = { title: "Ұйымдар" };
type Usage = {
  days_left?: number | null;
  org_id: string; name: string; slug: string; status: string; license_state: string; plan: string | null; valid_until: string | null;
  students: string; max_students: number | null; teachers: string; max_teachers: number | null; classes: string; assignments: string; submissions_30d: string;
};
type Lic = { org_id: string; plan: string; max_students: number; max_teachers: number; valid_until: string; status: string; notes: string | null };

const todayPlus = (d: number) => new Date(Date.now() + d * 864e5).toISOString().slice(0, 10);

export default async function AdminPage() {
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
      <PageHeader title="Ұйымдар" subtitle="Мектептерді тіркеу, лицензия мен лимиттерді басқару. Оқушылардың жеке деректері (жұмыс, баға) бұл жерде көрінбейді: тек жиынтық сандар." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Ұйымдар" value={usage.length} hint={`${active} белсенді лицензиямен`} />
        <StatCard label="Оқушылар" value={sum("students")} />
        <StatCard label="Мұғалімдер" value={sum("teachers")} />
        <StatCard label="Жұмыс (30 күн)" value={sum("submissions_30d")} />
      </div>

      <Section title="Жаңа мектеп тіркеу">
        <div className="card p-5">
          <LinkActionForm action={createOrganizationAction} submitLabel="Мектепті тіркеу" className="grid gap-4 sm:grid-cols-2">
            <div><label className="label" htmlFor="o-name">Мектеп атауы</label><input id="o-name" name="name" required minLength={2} maxLength={160} className="input" placeholder="№12 мектеп-лицей" /></div>
            <div><label className="label" htmlFor="o-slug">Қысқа атау (slug)</label><input id="o-slug" name="slug" required pattern="[a-z0-9][a-z0-9\-]{1,38}[a-z0-9]" className="input font-mono" placeholder="mektep-12" /><p className="hint">Кіру беті: /login?org=slug. Тек латын кіші әріп, сан, сызықша.</p></div>
            <div><label className="label" htmlFor="o-plan">Пакет</label>
              <select id="o-plan" name="plan" className="input" defaultValue="starter"><option value="starter">STARTER: 100 оқушы, 5 мұғалім</option><option value="pro">PRO: 500 оқушы, 25 мұғалім</option><option value="enterprise">ENTERPRISE: келісім бойынша</option></select></div>
            <div><label className="label" htmlFor="o-until">Лицензия мерзімі (дейін)</label><input id="o-until" name="valid_until" type="date" required defaultValue={todayPlus(365)} className="input" /></div>
            <div><label className="label" htmlFor="o-ms">Оқушы лимиті (бос = пакеттегідей)</label><input id="o-ms" name="max_students" type="number" min={0} className="input" /></div>
            <div><label className="label" htmlFor="o-mt">Мұғалім лимиті (бос = пакеттегідей)</label><input id="o-mt" name="max_teachers" type="number" min={0} className="input" /></div>
          </LinkActionForm>
        </div>
      </Section>

      <Section title="Тіркелген ұйымдар">
        {usage.length === 0 ? <EmptyState title="Ұйым әлі жоқ" text="Жоғарыдағы форма арқылы бірінші мектепті тіркеңіз." /> : (
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
                        <StatusBadge status={u.status === "suspended" ? "suspended" : u.license_state} label={u.status === "suspended" ? "Ұйым тоқтатылған" : LICENSE_STATE_LABEL[u.license_state] ?? u.license_state} />
                        {u.plan && <span>{PLAN_LABEL[u.plan]}</span>}<span>мерзімі: {fmtDate(u.valid_until)}</span>
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {u.status === "active"
                        ? <ConfirmButton action={setOrgStatusAction} fields={{ org: u.org_id, status: "suspended" }} label="Тоқтату" title={`«${u.name}» ұйымын тоқтату?`} message="Ұйым қолданушылары жұмыс тапсыра және жаңа нәрсе жасай алмайды. Деректер өшірілмейді. Кез келген уақытта қайта белсендіруге болады." confirmLabel="Тоқтату" />
                        : <ConfirmButton action={setOrgStatusAction} fields={{ org: u.org_id, status: "active" }} label="Белсендіру" title={`«${u.name}» ұйымын белсендіру?`} message="Ұйым жұмысы қалпына келеді." confirmLabel="Белсендіру" danger={false} className="btn-primary" />}
                    </div>
                  </div>
                  <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                    <div><dt className="text-ink-muted">Оқушылар</dt><dd className="font-semibold">{ms} / {u.max_students ?? "-"}</dd><ProgressBar value={ms} max={u.max_students ?? 0} label="Оқушы лимиті" /></div>
                    <div><dt className="text-ink-muted">Мұғалімдер</dt><dd className="font-semibold">{mt} / {u.max_teachers ?? "-"}</dd><ProgressBar value={mt} max={u.max_teachers ?? 0} label="Мұғалім лимиті" /></div>
                    <div><dt className="text-ink-muted">Сыныптар · тапсырмалар</dt><dd className="font-semibold">{u.classes} · {u.assignments}</dd></div>
                    <div><dt className="text-ink-muted">Жұмыс (30 күн)</dt><dd className="font-semibold">{u.submissions_30d}</dd></div>
                  </dl>
                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    <div className="rounded-lg border border-line p-3">
                      <p className="text-sm font-semibold">Лицензия</p>
                      <p className="mt-1 text-xs text-ink-muted">{l ? `${PLAN_LABEL[l.plan]} · ${l.max_students} оқушы · ${l.max_teachers} мұғалім` : "Лицензия жоқ"}{u.days_left != null ? ` · ${u.days_left < 0 ? `${-u.days_left} күн бұрын аяқталған` : `${u.days_left} күн қалды`}` : ""}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Link href={`/admin/orgs/${u.org_id}`} className="btn-secondary" data-testid={`manage-${u.slug}`}>Лицензияны басқару</Link>
                        {l && <ConfirmButton action={extendLicenseAction} fields={{ org: u.org_id, months: "12" }} label="+1 жыл" title="Лицензияны 1 жылға ұзарту?" message="Мерзім қолданыстағы мерзімнен (өтіп кетсе - бүгіннен) 1 жылға ұзарады." confirmLabel="Ұзарту" danger={false} className="btn-primary" />}
                      </div>
                    </div>
                    <details className="rounded-lg border border-line p-3">
                      <summary className="cursor-pointer text-sm font-semibold">Мектеп әкімшісін шақыру</summary>
                      <LinkActionForm action={inviteSchoolAdminAction} submitLabel="Шақыру сілтемесін жасау" className="mt-3">
                        <input type="hidden" name="org" value={u.org_id} />
                        <label className="label" htmlFor={`e-${u.slug}`}>E-mail (міндетті емес: берсеңіз, сілтеме тек сол мекенжайға жарайды)</label>
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
