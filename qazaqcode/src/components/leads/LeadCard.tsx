import { ActionForm } from "@/components/ActionForm";
import { ConfirmButton } from "@/components/ConfirmButton";
import { StatusBadge } from "@/components/ui";
import { fmtDate } from "@/lib/format";
import { setLeadStatusAction, deleteLeadAction } from "@/app/admin/leads/actions";
import { LEAD_ROLE_LABEL, LEAD_STATUSES, LEAD_STATUS_LABEL, LEAD_TYPE_LABEL, type LeadRow } from "./labels";
import { getT } from "@/lib/i18n";

const TONE: Record<string, string> = { new: "draft", contacted: "submitted", demo: "under_review", pilot: "in_progress", won: "graded", lost: "overdue" };

export async function LeadCard({ l }: { l: LeadRow }) { const t = await getT();
  return (
    <li className="card p-4 sm:p-5" data-testid="lead" data-lead-id={l.id}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="break-words text-lg font-bold">{l.org_name}</h3>
          <p className="text-sm text-ink-muted">{t(LEAD_TYPE_LABEL[l.org_type] ?? l.org_type)}{l.students_estimate ? t(" · шамамен {students_estimate} оқушы", { students_estimate: l.students_estimate }) : ""} · {fmtDate(l.created_at, true)}</p>
        </div>
        <StatusBadge status={TONE[l.status] ?? "none"} label={t(LEAD_STATUS_LABEL[l.status] ?? l.status)} />
      </div>
      <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
        <div><dt className="inline text-ink-muted">{t("Байланыс:")}{" "}</dt><dd className="inline break-words">{l.contact_name} ({t(LEAD_ROLE_LABEL[l.role] ?? l.role)})</dd></div>
        <div><dt className="inline text-ink-muted">E-mail: </dt><dd className="inline break-all"><a className="text-brand underline" href={`mailto:${l.email}`}>{l.email}</a></dd></div>
        {l.phone && <div><dt className="inline text-ink-muted">{t("Телефон:")}{" "}</dt><dd className="inline break-all">{l.phone}</dd></div>}
      </dl>
      {l.message && <p className="mt-3 whitespace-pre-wrap break-words rounded-lg bg-surface-2 p-3 text-sm">{l.message}</p>}
      <ActionForm action={setLeadStatusAction} submitLabel={t("Сақтау")} submitClassName="btn-secondary" className="mt-4 border-t border-line pt-4"
        footer={null}>
        <input type="hidden" name="id" value={l.id} />
        <div className="grid gap-3 sm:grid-cols-[14rem_1fr]">
          <div><label className="label" htmlFor={`st-${l.id}`}>{t("Күйі")}</label>
            <select id={`st-${l.id}`} name="status" className="input" defaultValue={l.status}>{LEAD_STATUSES.map((s) => <option key={s} value={s}>{t(LEAD_STATUS_LABEL[s])}</option>)}</select></div>
          <div><label className="label" htmlFor={`nt-${l.id}`}>{t("Жазба (ішкі)")}</label>
            <textarea id={`nt-${l.id}`} name="notes" rows={2} maxLength={2000} className="input" defaultValue={l.notes ?? ""} /></div>
        </div>
      </ActionForm>
      <div className="mt-3">
        <ConfirmButton action={deleteLeadAction} fields={{ id: l.id }} label={t("Жою")} title={t("Сұрауды жою?")} message={t("«{org_name}» сұрауы мен байланыс деректері біржола өшіріледі.", { org_name: l.org_name })} confirmLabel={t("Иә, жою")} />
      </div>
    </li>
  );
}
