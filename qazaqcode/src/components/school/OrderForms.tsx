"use client";
import { ActionForm } from "@/components/ActionForm";
import type { ActionResult } from "@/lib/errors";

type Action = (prev: ActionResult | null, f: FormData) => Promise<ActionResult>;
export type Billing = {
  legal_name: string; bin_iin: string; address: string; bank_name: string; bik: string; iik: string; kbe: string;
  contact_name: string | null; contact_email: string | null; contact_phone: string | null;
} | null;

/** Төлем реквизиттері: ұйымның өзі енгізеді (шоттағы «Тапсырыс беруші» деректері) */
export function BillingForm({ action, v }: { action: Action; v: Billing }) {
  return (
    <ActionForm action={action} submitLabel="Реквизиттерді сақтау" className="card p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><label className="label" htmlFor="bp-legal">Заңды атауы *</label>
          <input id="bp-legal" name="legal_name" className="input" required minLength={2} maxLength={200} defaultValue={v?.legal_name ?? ""} autoComplete="organization" /></div>
        <div><label className="label" htmlFor="bp-bin">БИН/ЖСН (12 сан) *</label>
          <input id="bp-bin" name="bin_iin" className="input font-mono" required inputMode="numeric" pattern="\d{12}" maxLength={12} defaultValue={v?.bin_iin ?? ""} /></div>
        <div><label className="label" htmlFor="bp-kbe">КБе (2 сан) *</label>
          <input id="bp-kbe" name="kbe" className="input font-mono" required inputMode="numeric" pattern="\d{2}" maxLength={2} defaultValue={v?.kbe ?? ""} aria-describedby="bp-kbe-h" />
          <p id="bp-kbe-h" className="hint">Бухгалтериядан сұраңыз.</p></div>
        <div className="sm:col-span-2"><label className="label" htmlFor="bp-addr">Заңды мекенжайы *</label>
          <input id="bp-addr" name="address" className="input" required minLength={5} maxLength={300} defaultValue={v?.address ?? ""} autoComplete="street-address" /></div>
        <div><label className="label" htmlFor="bp-bank">Банк атауы *</label>
          <input id="bp-bank" name="bank_name" className="input" required minLength={2} maxLength={160} defaultValue={v?.bank_name ?? ""} /></div>
        <div><label className="label" htmlFor="bp-bik">БИК *</label>
          <input id="bp-bik" name="bik" className="input font-mono uppercase" required maxLength={11} minLength={8} defaultValue={v?.bik ?? ""} /></div>
        <div className="sm:col-span-2"><label className="label" htmlFor="bp-iik">ИИК/ЖСК (KZ... 20 таңба) *</label>
          <input id="bp-iik" name="iik" className="input font-mono uppercase" required maxLength={24} defaultValue={v?.iik ?? ""} spellCheck={false} /></div>
        <div><label className="label" htmlFor="bp-cn">Байланыс адамы</label>
          <input id="bp-cn" name="contact_name" className="input" maxLength={160} defaultValue={v?.contact_name ?? ""} /></div>
        <div><label className="label" htmlFor="bp-cp">Телефон</label>
          <input id="bp-cp" name="contact_phone" className="input" type="tel" maxLength={40} defaultValue={v?.contact_phone ?? ""} /></div>
        <div className="sm:col-span-2"><label className="label" htmlFor="bp-ce">E-mail</label>
          <input id="bp-ce" name="contact_email" className="input" type="email" maxLength={160} defaultValue={v?.contact_email ?? ""} /></div>
      </div>
    </ActionForm>
  );
}

export function OrderForm({ action, defaults, disabled }: { action: Action; defaults: { plan: string; students: number; teachers: number }; disabled: boolean }) {
  return (
    <ActionForm action={action} submitLabel="Тапсырыс беру" className="card p-5" reset>
      <fieldset disabled={disabled} className="grid gap-4 sm:grid-cols-2">
        <div><label className="label" htmlFor="ord-plan">Пакет</label>
          <select id="ord-plan" name="plan" className="input" defaultValue={defaults.plan}>
            <option value="starter">STARTER</option><option value="pro">PRO</option><option value="enterprise">ENTERPRISE</option></select></div>
        <div><label className="label" htmlFor="ord-months">Мерзімі (ай, 1-60)</label>
          <input id="ord-months" name="months" type="number" className="input" min={1} max={60} step={1} defaultValue={12} required /></div>
        <div><label className="label" htmlFor="ord-students">Оқушы саны</label>
          <input id="ord-students" name="students" type="number" className="input" min={1} max={100000} step={1} defaultValue={defaults.students} required /></div>
        <div><label className="label" htmlFor="ord-teachers">Мұғалім саны</label>
          <input id="ord-teachers" name="teachers" type="number" className="input" min={1} max={10000} step={1} defaultValue={defaults.teachers} required /></div>
        <div className="sm:col-span-2"><label className="label" htmlFor="ord-note">Ескертпе (міндетті емес)</label>
          <textarea id="ord-note" name="note" className="input" rows={2} maxLength={1000} /></div>
      </fieldset>
      {disabled && <p className="hint mt-2">Алдымен жоғарыдағы төлем реквизиттерін сақтаңыз.</p>}
    </ActionForm>
  );
}
