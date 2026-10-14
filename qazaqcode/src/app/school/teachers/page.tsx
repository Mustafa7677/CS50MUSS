import { requireSchoolAdmin } from "@/lib/context";
import { withUser } from "@/lib/db";
import { AppError, errorMessage } from "@/lib/errors";
import { fmtDate } from "@/lib/format";
import { Banner, EmptyState, PageHeader, ProgressBar, Section, StatusBadge } from "@/components/ui";
import { ConfirmButton } from "@/components/ConfirmButton";
import { InviteForm } from "@/components/school/InviteForm";
import { inviteTeacherAction, revokeInvitationAction, setTeacherStatusAction } from "../actions";
import { loadLicense } from "../queries";

export const metadata = { title: "Мұғалімдер" };
export const dynamic = "force-dynamic";

const OK_MSG: Record<string, string> = { removed: "Мұғалім өшірілді.", activated: "Мұғалім қайта белсендірілді.", revoked: "Шақырудан бас тартылды." };

type T = { user_id: string; full_name: string | null; status: string; joined_at: string; classes: number; last_activity: string | null };
type Inv = { id: string; email: string | null; expires_at: string; accepted_at: string | null; revoked_at: string | null; created_at: string; accepted_name: string | null };

export default async function TeachersPage({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string }> }) {
  const sp = await searchParams;
  const ctx = await requireSchoolAdmin();
  const org = ctx.active.org_id;
  const { teachers, invs, lic } = await withUser(ctx.userId, async (q) => ({
    lic: await loadLicense(q, org),
    teachers: await q<T>(
      `select m.user_id, p.full_name, m.status, m.joined_at::text as joined_at,
         (select count(*)::int from public.classrooms c where c.org_id = m.org_id and c.teacher_id = m.user_id and c.status = 'active') as classes,
         (select max(s.updated_at)::text from public.submissions s join public.classrooms c on c.id = s.classroom_id
           where c.org_id = m.org_id and c.teacher_id = m.user_id and s.status <> 'draft') as last_activity
       from public.organization_members m left join public.profiles p on p.id = m.user_id
       where m.org_id = $1 and m.role = 'teacher' order by (m.status = 'active') desc, p.full_name nulls last, m.joined_at`, [org]),
    invs: await q<Inv>(
      `select i.id, i.email, i.expires_at::text as expires_at, i.accepted_at::text as accepted_at, i.revoked_at::text as revoked_at, i.created_at::text as created_at, p.full_name as accepted_name
         from public.invitations i left join public.profiles p on p.id = i.accepted_by
        where i.org_id = $1 and i.role = 'teacher' order by i.created_at desc limit 50`, [org]),
  }));
  const now = Date.now();
  const kind = (i: Inv) => i.accepted_at ? "accepted" : i.revoked_at ? "revoked" : new Date(i.expires_at).getTime() < now ? "expired" : "active";
  const active = invs.filter((i) => kind(i) === "active");
  const past = invs.filter((i) => kind(i) !== "active");
  const count = teachers.filter((t) => t.status === "active").length;
  const full = !!lic && count >= lic.max_teachers;

  return (
    <>
      <PageHeader title="Мұғалімдер" subtitle="Мұғалімдерді шақырып, олардың қолжетімділігін басқарыңыз."
        actions={lic && <span className="badge bg-surface text-ink border border-line" data-testid="teacher-limit">Мұғалім: {count} / {lic.max_teachers}</span>} />
      {sp.ok && OK_MSG[sp.ok] && <Banner tone="info">{OK_MSG[sp.ok]}</Banner>}
      {sp.err && <Banner tone="bad">{errorMessage(new AppError(/^[a-z_]+$/.test(sp.err) ? sp.err : "validation"))}</Banner>}

      {lic && <div className="card mb-6 p-4"><div className="mb-1.5 flex justify-between text-sm"><span>Лицензиядағы мұғалім лимиті</span><span>{count} / {lic.max_teachers}</span></div>
        <ProgressBar value={count} max={lic.max_teachers} label="Мұғалім лимиті" /></div>}

      <section className="card p-5" aria-labelledby="inv-h">
        <h2 id="inv-h" className="text-lg font-semibold">Мұғалімді шақыру</h2>
        {full && <Banner tone="warn"><span data-testid="limit-warning">Мұғалім лимиті толған ({count} / {lic!.max_teachers}).</span> Шақыру сілтемесін жасауға болады, бірақ орын босағанша мұғалім тіркеле алмайды. Орын босату үшін мұғалімді өшіріңіз не лицензияны кеңейтіңіз.</Banner>}
        <div className="mt-3"><InviteForm action={inviteTeacherAction} /></div>
      </section>

      <Section title="Мұғалімдер тізімі">
        {teachers.length === 0 ? <EmptyState title="Мұғалім жоқ" text="Жоғарыдағы форма арқылы бірінші мұғалімді шақырыңыз." /> : (
          <div className="table-wrap relative"><table className="w-full min-w-[42rem]" data-testid="teachers-table">
            <thead><tr><th className="th">Аты</th><th className="th">Қосылған күні</th><th className="th">Сынып</th><th className="th">Соңғы белсенділік</th><th className="th">Күйі</th><th className="th"><span className="sr-only">Әрекет</span></th></tr></thead>
            <tbody className="divide-y divide-line">
              {teachers.map((t) => (
                <tr key={t.user_id}>
                  <td className="td font-medium">{t.full_name ?? <span className="text-ink-muted">Аты көрінбейді</span>}</td>
                  <td className="td">{fmtDate(t.joined_at)}</td>
                  <td className="td">{t.classes}</td>
                  <td className="td">{t.last_activity ? fmtDate(t.last_activity, true) : "-"}</td>
                  <td className="td"><StatusBadge status={t.status === "active" ? "active" : "archived"} label={t.status === "active" ? "Белсенді" : "Өшірілген"} /></td>
                  <td className="td text-right">
                    {t.status === "active" ? (
                      <ConfirmButton action={setTeacherStatusAction} fields={{ user_id: t.user_id, status: "removed" }} label="Өшіру" title="Мұғалімді өшіру"
                        message={`${t.full_name ?? "Мұғалім"} жүйеге кіре алмайды. Оның сыныптары мен тапсырмалары өшпейді, мұғалімді кейін қайта белсендіруге болады.`} confirmLabel="Иә, өшіру" />
                    ) : (
                      <ConfirmButton action={setTeacherStatusAction} fields={{ user_id: t.user_id, status: "active" }} label="Қайта белсендіру" title="Мұғалімді қайта белсендіру"
                        message="Мұғалімге қолжетімділік қайтарылады (лицензия лимиті тексеріледі)." confirmLabel="Иә, белсендіру" className="btn-secondary" danger={false} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody></table></div>
        )}
      </Section>

      <Section title="Белсенді шақырулар">
        {active.length === 0 ? <p className="text-sm text-ink-muted">Белсенді шақыру жоқ.</p> : (
          <div className="table-wrap relative"><table className="w-full min-w-[32rem]" data-testid="active-invites">
            <thead><tr><th className="th">E-mail</th><th className="th">Жасалған</th><th className="th">Мерзімі</th><th className="th"><span className="sr-only">Әрекет</span></th></tr></thead>
            <tbody className="divide-y divide-line">
              {active.map((i) => (
                <tr key={i.id}>
                  <td className="td">{i.email ?? <span className="text-ink-muted">кез келген e-mail</span>}</td>
                  <td className="td">{fmtDate(i.created_at, true)}</td><td className="td">{fmtDate(i.expires_at, true)}</td>
                  <td className="td text-right"><ConfirmButton action={revokeInvitationAction} fields={{ id: i.id }} label="Бас тарту" title="Шақырудан бас тарту" message="Бұл шақыру сілтемесі жұмыс істемейді." confirmLabel="Иә, бас тарту" /></td>
                </tr>
              ))}
            </tbody></table></div>
        )}
      </Section>

      {past.length > 0 && (
        <Section title="Қолданылған және мерзімі өткен шақырулар">
          <div className="table-wrap relative"><table className="w-full min-w-[32rem]">
            <thead><tr><th className="th">E-mail</th><th className="th">Жасалған</th><th className="th">Күйі</th></tr></thead>
            <tbody className="divide-y divide-line">
              {past.map((i) => {
                const k = kind(i);
                return (
                  <tr key={i.id}>
                    <td className="td">{i.email ?? <span className="text-ink-muted">кез келген e-mail</span>}</td>
                    <td className="td">{fmtDate(i.created_at, true)}</td>
                    <td className="td">{k === "accepted" ? <StatusBadge status="graded" label={`Қолданылған${i.accepted_name ? `: ${i.accepted_name}` : ""}`} />
                      : k === "revoked" ? <StatusBadge status="archived" label="Бас тартылған" /> : <StatusBadge status="expired" label="Мерзімі өткен" />}</td>
                  </tr>
                );
              })}
            </tbody></table></div>
        </Section>
      )}
    </>
  );
}
