import { ActionForm } from "@/components/ActionForm";
import { ConfirmButton } from "@/components/ConfirmButton";
import { StatusBadge } from "@/components/ui";
import { fmtDate } from "@/lib/format";
import { setLeadStatusAction, deleteLeadAction } from "@/app/admin/leads/actions";
import { LEAD_ROLE_LABEL, LEAD_STATUSES, LEAD_STATUS_LABEL, LEAD_TYPE_LABEL, type LeadRow } from "./labels";

const TONE: Record<string, string> = { new: "draft", contacted: "submitted", demo: "under_review", pilot: "in_progress", won: "graded", lost: "overdue" };

export function LeadCard({ l }: { l: LeadRow }) {
  return (
    <li className="card p-4 sm:p-5" data-testid="lead" data-lead-id={l.id}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="break-words text-lg font-bold">{l.org_name}</h3>
          <p className="text-sm text-ink-muted">{LEAD_TYPE_LABEL[l.org_type] ?? l.org_type}{l.students_estimate ? ` · шамамен ${l.students_estimate} оқушы` : ""} · {fmtDate(l.created_at, true)}</p>
        </div>
        <StatusBadge status={TONE[l.status] ?? "none"} label={LEAD_STATUS_LABEL[l.status] ?? l.status} />
      </div>
      <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
        <div><dt className="inline text-ink-muted">Байланыс: </dt><dd className="inline break-words">{l.contact_name} ({LEAD_ROLE_LABEL[l.role] ?? l.role})</dd></div>
        <div><dt className="inline text-ink-muted">E-mail: </dt><dd className="inline break-all"><a className="text-brand underline" href={`mailto:${l.email}`}>{l.email}</a></dd></div>
        {l.phone && <div><dt className="inline text-ink-muted">Телефон: </dt><dd className="inline break-all">{l.phone}</dd></div>}
      </dl>
      {l.message && <p className="mt-3 whitespace-pre-wrap break-words rounded-lg bg-surface-2 p-3 text-sm">{l.message}</p>}
      <ActionForm action={setLeadStatusAction} submitLabel="Сақтау" submitClassName="btn-secondary" className="mt-4 border-t border-line pt-4"
        footer={null}>
        <input type="hidden" name="id" value={l.id} />
        <div className="grid gap-3 sm:grid-cols-[14rem_1fr]">
          <div><label className="label" htmlFor={`st-${l.id}`}>Күйі</label>
            <select id={`st-${l.id}`} name="status" className="input" defaultValue={l.status}>{LEAD_STATUSES.map((s) => <option key={s} value={s}>{LEAD_STATUS_LABEL[s]}</option>)}</select></div>
          <div><label className="label" htmlFor={`nt-${l.id}`}>Жазба (ішкі)</label>
            <textarea id={`nt-${l.id}`} name="notes" rows={2} maxLength={2000} className="input" defaultValue={l.notes ?? ""} /></div>
        </div>
      </ActionForm>
      <div className="mt-3">
        <ConfirmButton action={deleteLeadAction} fields={{ id: l.id }} label="Жою" title="Сұрауды жою?" message={`«${l.org_name}» сұрауы мен байланыс деректері біржола өшіріледі.`} confirmLabel="Иә, жою" />
      </div>
    </li>
  );
}
