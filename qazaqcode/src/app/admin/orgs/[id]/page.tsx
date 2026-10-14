import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmButton } from "@/components/ConfirmButton";
import { LinkActionForm } from "@/components/admin/LinkAction";
import { EmptyState, PageHeader, Section, StatCard, StatusBadge } from "@/components/ui";
import { requirePlatformAdmin } from "@/lib/context";
import { withUser } from "@/lib/db";
import { LICENSE_STATE_LABEL, PLAN_LABEL, fmtDate } from "@/lib/format";
import { extendLicenseAction, inviteSchoolAdminAction, setLicenseAction, setOrgStatusAction } from "../../actions";
import { LicenceForm } from "./LicenceForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ұйым лицензиясы" };

type Usage = {
  org_id: string; name: string; slug: string; status: string; license_state: string; plan: string | null; valid_until: string | null;
  students: string; max_students: number | null; teachers: string; max_teachers: number | null; classes: string; assignments: string; submissions_30d: string;
};
type Lic = { plan: string; max_students: number; max_teachers: number; valid_until: string; status: string; notes: string | null; days_left: number };
type Audit = { id: string; created_at: string; actor: string | null; action: string; meta: Record<string, any> };

const ACTION_LABEL: Record<string, string> = {
  "license.set": "Лицензия өзгертілді", "license.extend": "Лицензия ұзартылды", "organization.status": "Ұйым күйі өзгертілді", "organization.create": "Ұйым тіркелді",
};
function describe(a: Audit): string {
  const m = a.meta ?? {};
  if (a.action === "license.set") return `${PLAN_LABEL[m.plan] ?? m.plan} · оқушы ${m.max_students} · мұғалім ${m.max_teachers} · дейін ${fmtDate(m.valid_until)} · ${m.status === "suspended" ? "тоқтатылған" : "белсенді"}`;
  if (a.action === "license.extend") return `+${m.months} ай: ${fmtDate(m.from)} -> ${fmtDate(m.valid_until)}`;
  if (a.action === "organization.status") return m.status === "suspended" ? "тоқтатылды" : "белсендірілді";
  if (a.action === "organization.create") return `пакет ${PLAN_LABEL[m.plan] ?? m.plan}`;
  return "";
}

export default async function OrgLicencePage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requirePlatformAdmin();
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound();
  const { usage, lic, audit } = await withUser(ctx.userId, async (q) => ({
    usage: (await q<Usage>("select * from public.platform_usage()")).find((u) => u.org_id === id),
    lic: (await q<Lic>("select plan, max_students, max_teachers, valid_until::text, status, notes, (valid_until - current_date)::int as days_left from licenses where org_id = $1", [id]))[0],
    audit: await q<Audit>(
      `select a.id::text, a.created_at, p.full_name as actor, a.action, a.meta from audit_logs a left join profiles p on p.id = a.actor_id
        where a.org_id = $1 and (a.action like 'license.%' or a.action in ('organization.status', 'organization.create')) order by a.id desc limit 20`, [id]),
  }));
  if (!usage) notFound();
  const active = usage.status === "active";
  return (
    <>
      <p className="mb-2 text-sm"><Link href="/admin">← Барлық ұйымдар</Link></p>
      <PageHeader title={usage.name} subtitle={<span className="font-mono">/{usage.slug}</span>}
        actions={active
          ? <ConfirmButton action={setOrgStatusAction} fields={{ org: id, status: "suspended" }} label="Ұйымды тоқтату" title={`«${usage.name}» ұйымын тоқтату?`} message="Ұйым қолданушылары жұмыс тапсыра және жаңа нәрсе жасай алмайды. Деректер өшірілмейді. Кез келген уақытта қайта белсендіруге болады." confirmLabel="Тоқтату" />
          : <ConfirmButton action={setOrgStatusAction} fields={{ org: id, status: "active" }} label="Ұйымды белсендіру" title={`«${usage.name}» ұйымын белсендіру?`} message="Ұйым жұмысы қалпына келеді." confirmLabel="Белсендіру" danger={false} className="btn-primary" />} />

      <div className="flex flex-wrap items-center gap-3" data-testid="org-state">
        <StatusBadge status={active ? usage.license_state : "org_suspended"} label={active ? LICENSE_STATE_LABEL[usage.license_state] ?? usage.license_state : "Ұйым тоқтатылған"} />
        {lic && <span className="text-sm text-ink-muted">{PLAN_LABEL[lic.plan]} · мерзімі: <strong data-testid="org-until">{fmtDate(lic.valid_until)}</strong> ({lic.days_left < 0 ? `${-lic.days_left} күн бұрын аяқталған` : `${lic.days_left} күн қалды`})</span>}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Оқушылар" value={`${usage.students} / ${usage.max_students ?? "-"}`} />
        <StatCard label="Мұғалімдер" value={`${usage.teachers} / ${usage.max_teachers ?? "-"}`} />
        <StatCard label="Сыныптар · тапсырмалар" value={`${usage.classes} · ${usage.assignments}`} />
        <StatCard label="Жұмыс (30 күн)" value={usage.submissions_30d} />
      </div>
      <p className="hint">Платформа әкімшісі тек жиынтық сандарды көреді: оқушылардың жеке деректері, жұмыстары мен бағалары көрінбейді.</p>

      <Section title="Мерзімді ұзарту">
        <div className="card flex flex-wrap items-center gap-3 p-5">
          {lic ? (
            <>
              <p className="mr-auto text-sm text-ink-muted">Жаңа мерзім қолданыстағы мерзімнен (өтіп кетсе - бүгіннен) есептеледі.</p>
              <ConfirmButton action={extendLicenseAction} fields={{ org: id, months: "6" }} label="Ұзарту +6 ай" title="Лицензияны 6 айға ұзарту?" message="Мерзім 6 айға ұзарылады, шектеулер (мерзімі өткен болса) бірден алынады." confirmLabel="Ұзарту" danger={false} className="btn-secondary" />
              <ConfirmButton action={extendLicenseAction} fields={{ org: id, months: "12" }} label="Ұзарту +1 жыл" title="Лицензияны 1 жылға ұзарту?" message="Мерзім 1 жылға ұзарылады, шектеулер (мерзімі өткен болса) бірден алынады." confirmLabel="Ұзарту" danger={false} className="btn-primary" />
            </>
          ) : <p className="text-sm text-ink-muted">Лицензия әлі берілмеген: төмендегі форманы толтырыңыз.</p>}
        </div>
      </Section>

      <Section title="Лицензияны өзгерту">
        <div className="card p-5">
          <LicenceForm action={setLicenseAction}
            init={{ org: id, plan: lic?.plan ?? "starter", status: lic?.status ?? "active", max_students: lic?.max_students ?? 100, max_teachers: lic?.max_teachers ?? 5,
              valid_until: lic?.valid_until ?? new Date(Date.now() + 365 * 864e5).toISOString().slice(0, 10), notes: lic?.notes ?? "" }} />
        </div>
      </Section>

      <Section title="Мектеп әкімшісін шақыру">
        <div className="card p-5">
          <LinkActionForm action={inviteSchoolAdminAction} submitLabel="Шақыру сілтемесін жасау">
            <input type="hidden" name="org" value={id} />
            <label className="label" htmlFor="inv-email">E-mail (міндетті емес: берсеңіз, сілтеме тек сол мекенжайға жарайды)</label>
            <input id="inv-email" name="email" type="email" className="input" />
          </LinkActionForm>
        </div>
      </Section>

      <Section title="Лицензия журналы">
        {audit.length === 0 ? <EmptyState title="Жазба жоқ" /> : (
          <div className="table-wrap" data-testid="licence-audit"><table className="w-full">
            <thead><tr><th className="th">Уақыты</th><th className="th">Кім</th><th className="th">Әрекет</th><th className="th">Мәліметі</th></tr></thead>
            <tbody>{audit.map((a) => (
              <tr key={a.id} className="border-t border-line align-top">
                <td className="td whitespace-nowrap">{fmtDate(a.created_at, true)}</td><td className="td">{a.actor ?? "жүйе"}</td>
                <td className="td">{ACTION_LABEL[a.action] ?? a.action}</td><td className="td text-ink-muted">{describe(a)}</td>
              </tr>))}</tbody></table></div>
        )}
        <p className="hint"><Link href={`/admin/audit?org=${id}`}>Ұйымның толық аудит журналы</Link></p>
      </Section>
    </>
  );
}
