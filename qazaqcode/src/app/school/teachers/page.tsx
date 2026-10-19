import { requireSchoolAdmin } from "@/lib/context";
import { withUser } from "@/lib/db";
import { AppError, errorMessage } from "@/lib/errors";
import { fmtDate } from "@/lib/format";
import { Banner, EmptyState, PageHeader, ProgressBar, Section, StatusBadge } from "@/components/ui";
import { ConfirmButton } from "@/components/ConfirmButton";
import { InviteForm } from "@/components/school/InviteForm";
import { emailEnabled } from "@/lib/env";
import { emailInviteAction, inviteTeacherAction, revokeInvitationAction, setTeacherStatusAction } from "../actions";
import { loadLicense } from "../queries";
import { getT } from "@/lib/i18n";
import type { TFn } from "@/lib/i18n/core";

export async function generateMetadata() { const t = await getT(); return { title: t("Мұғалімдер") }; }
export const dynamic = "force-dynamic";

const OK_MSG = (t: TFn): Record<string, string> => ({ removed: t("Мұғалім өшірілді."), activated: t("Мұғалім қайта белсендірілді."), revoked: t("Шақырудан бас тартылды.") });

type T = { user_id: string; full_name: string | null; status: string; joined_at: string; classes: number; last_activity: string | null };
type Inv = { id: string; email: string | null; expires_at: string; accepted_at: string | null; revoked_at: string | null; created_at: string; accepted_name: string | null };

export default async function TeachersPage({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string }> }) { const t = await getT();
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
  const count = teachers.filter((tt) => tt.status === "active").length;
  const full = !!lic && count >= lic.max_teachers;

  return (
    <>
      <PageHeader title={t("Мұғалімдер")} subtitle={t("Мұғалімдерді шақырып, олардың қолжетімділігін басқарыңыз.")}
        actions={lic && <span className="badge bg-surface text-ink border border-line" data-testid="teacher-limit">{t("Мұғалім: {count} /", { count })}{" "}{lic.max_teachers}</span>} />
      {sp.ok && OK_MSG(t)[sp.ok] && <Banner tone="info">{OK_MSG(t)[sp.ok]}</Banner>}
      {sp.err && <Banner tone="bad">{t(errorMessage(new AppError(/^[a-z_]+$/.test(sp.err) ? sp.err : "validation")))}</Banner>}

      {lic && <div className="card mb-6 p-4"><div className="mb-1.5 flex justify-between text-sm"><span>{t("Лицензиядағы мұғалім лимиті")}</span><span>{count} / {lic.max_teachers}</span></div>
        <ProgressBar value={count} max={lic.max_teachers} label={t("Мұғалім лимиті")} /></div>}

      <section className="card p-5" aria-labelledby="inv-h">
        <h2 id="inv-h" className="text-lg font-semibold">{t("Мұғалімді шақыру")}</h2>
        {full && <Banner tone="warn"><span data-testid="limit-warning">{t("Мұғалім лимиті толған ({count} / {max_teachers}).", { count, max_teachers: lic!.max_teachers })}</span>{" "}{t("Шақыру сілтемесін жасауға болады, бірақ орын босағанша мұғалім тіркеле алмайды. Орын босату үшін мұғалімді өшіріңіз не лицензияны кеңейтіңіз.")}</Banner>}
        <div className="mt-3"><InviteForm action={inviteTeacherAction} emailAction={emailInviteAction} emailEnabled={emailEnabled()} /></div>
      </section>

      <Section title={t("Мұғалімдер тізімі")}>
        {teachers.length === 0 ? <EmptyState title={t("Мұғалім жоқ")} text={t("Жоғарыдағы форма арқылы бірінші мұғалімді шақырыңыз.")} /> : (
          <div className="table-wrap relative"><table className="w-full min-w-[42rem]" data-testid="teachers-table">
            <thead><tr><th className="th">{t("Аты")}</th><th className="th">{t("Қосылған күні")}</th><th className="th">{t("Сынып")}</th><th className="th">{t("Соңғы белсенділік")}</th><th className="th">{t("Күйі")}</th><th className="th"><span className="sr-only">{t("Әрекет")}</span></th></tr></thead>
            <tbody className="divide-y divide-line">
              {teachers.map((tt) => (
                <tr key={tt.user_id}>
                  <td className="td font-medium">{tt.full_name ?? <span className="text-ink-muted">{t("Аты көрінбейді")}</span>}</td>
                  <td className="td">{fmtDate(tt.joined_at, false, t.locale)}</td>
                  <td className="td">{tt.classes}</td>
                  <td className="td">{tt.last_activity ? fmtDate(tt.last_activity, true, t.locale) : "-"}</td>
                  <td className="td"><StatusBadge status={tt.status === "active" ? "active" : "archived"} label={tt.status === "active" ? t("Белсенді") : t("Өшірілген")} /></td>
                  <td className="td text-right">
                    {tt.status === "active" ? (
                      <ConfirmButton action={setTeacherStatusAction} fields={{ user_id: tt.user_id, status: "removed" }} label={t("Өшіру")} title={t("Мұғалімді өшіру")}
                        message={t("{v} жүйеге кіре алмайды. Оның сыныптары мен тапсырмалары өшпейді, мұғалімді кейін қайта белсендіруге болады.", { v: tt.full_name ?? t("Мұғалім") })} confirmLabel={t("Иә, өшіру")} />
                    ) : (
                      <ConfirmButton action={setTeacherStatusAction} fields={{ user_id: tt.user_id, status: "active" }} label={t("Қайта белсендіру")} title={t("Мұғалімді қайта белсендіру")}
                        message={t("Мұғалімге қолжетімділік қайтарылады (лицензия лимиті тексеріледі).")} confirmLabel={t("Иә, белсендіру")} className="btn-secondary" danger={false} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody></table></div>
        )}
      </Section>

      <Section title={t("Белсенді шақырулар")}>
        {active.length === 0 ? <p className="text-sm text-ink-muted">{t("Белсенді шақыру жоқ.")}</p> : (
          <div className="table-wrap relative"><table className="w-full min-w-[32rem]" data-testid="active-invites">
            <thead><tr><th className="th">E-mail</th><th className="th">{t("Жасалған")}</th><th className="th">{t("Мерзімі")}</th><th className="th"><span className="sr-only">{t("Әрекет")}</span></th></tr></thead>
            <tbody className="divide-y divide-line">
              {active.map((i) => (
                <tr key={i.id}>
                  <td className="td">{i.email ?? <span className="text-ink-muted">{t("кез келген e-mail")}</span>}</td>
                  <td className="td">{fmtDate(i.created_at, true, t.locale)}</td><td className="td">{fmtDate(i.expires_at, true, t.locale)}</td>
                  <td className="td text-right"><ConfirmButton action={revokeInvitationAction} fields={{ id: i.id }} label={t("Бас тарту")} title={t("Шақырудан бас тарту")} message={t("Бұл шақыру сілтемесі жұмыс істемейді.")} confirmLabel={t("Иә, бас тарту")} /></td>
                </tr>
              ))}
            </tbody></table></div>
        )}
      </Section>

      {past.length > 0 && (
        <Section title={t("Қолданылған және мерзімі өткен шақырулар")}>
          <div className="table-wrap relative"><table className="w-full min-w-[32rem]">
            <thead><tr><th className="th">E-mail</th><th className="th">{t("Жасалған")}</th><th className="th">{t("Күйі")}</th></tr></thead>
            <tbody className="divide-y divide-line">
              {past.map((i) => {
                const k = kind(i);
                return (
                  <tr key={i.id}>
                    <td className="td">{i.email ?? <span className="text-ink-muted">{t("кез келген e-mail")}</span>}</td>
                    <td className="td">{fmtDate(i.created_at, true, t.locale)}</td>
                    <td className="td">{k === "accepted" ? <StatusBadge status="graded" label={t("Қолданылған{v}", { v: i.accepted_name ? `: ${i.accepted_name}` : "" })} />
                      : k === "revoked" ? <StatusBadge status="archived" label={t("Бас тартылған")} /> : <StatusBadge status="expired" label={t("Мерзімі өткен")} />}</td>
                  </tr>
                );
              })}
            </tbody></table></div>
        </Section>
      )}
    </>
  );
}
