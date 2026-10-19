"use client";
import { ActionForm } from "@/components/ActionForm";
import { useFields } from "@/components/useFields";
import type { ActionResult } from "@/lib/errors";

type Action = (prev: ActionResult | null, f: FormData) => Promise<ActionResult>;
export type Billing = {
  legal_name: string; bin_iin: string; address: string; bank_name: string; bik: string; iik: string; kbe: string;
  contact_name: string | null; contact_email: string | null; contact_phone: string | null;
} | null;

/** Төлем реквизиттері: ұйымның өзі енгізеді (шоттағы «Тапсырыс беруші» деректері) */
export function BillingForm({ action, v }: { action: Action; v: Billing }) {
  const { f } = useFields({ legal_name: v?.legal_name ?? "", bin_iin: v?.bin_iin ?? "", kbe: v?.kbe ?? "", address: v?.address ?? "", bank_name: v?.bank_name ?? "", bik: v?.bik ?? "", iik: v?.iik ?? "",
    contact_name: v?.contact_name ?? "", contact_phone: v?.contact_phone ?? "", contact_email: v?.contact_email ?? "" });
  return (
    <ActionForm action={action} submitLabel="Реквизиттерді сақтау" className="card p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><label className="label" htmlFor="bp-legal">Заңды атауы *</label>
          <input id="bp-legal" {...f("legal_name")} className="input" required minLength={2} maxLength={200}  autoComplete="organization" /></div>
        <div><label className="label" htmlFor="bp-bin">БИН/ЖСН (12 сан) *</label>
          <input id="bp-bin" {...f("bin_iin")} className="input font-mono" required inputMode="numeric" pattern="\d{12}" maxLength={12}  /></div>
        <div><label className="label" htmlFor="bp-kbe">КБе (2 сан) *</label>
          <input id="bp-kbe" {...f("kbe")} className="input font-mono" required inputMode="numeric" pattern="\d{2}" maxLength={2}  aria-describedby="bp-kbe-h" />
          <p id="bp-kbe-h" className="hint">Бухгалтериядан сұраңыз.</p></div>
        <div className="sm:col-span-2"><label className="label" htmlFor="bp-addr">Заңды мекенжайы *</label>
          <input id="bp-addr" {...f("address")} className="input" required minLength={5} maxLength={300}  autoComplete="street-address" /></div>
        <div><label className="label" htmlFor="bp-bank">Банк атауы *</label>
          <input id="bp-bank" {...f("bank_name")} className="input" required minLength={2} maxLength={160}  /></div>
        <div><label className="label" htmlFor="bp-bik">БИК *</label>
          <input id="bp-bik" {...f("bik")} className="input font-mono uppercase" required maxLength={11} minLength={8}  /></div>
        <div className="sm:col-span-2"><label className="label" htmlFor="bp-iik">ИИК/ЖСК (KZ... 20 таңба) *</label>
          <input id="bp-iik" {...f("iik")} className="input font-mono uppercase" required maxLength={24}  spellCheck={false} /></div>
        <div><label className="label" htmlFor="bp-cn">Байланыс адамы</label>
          <input id="bp-cn" {...f("contact_name")} className="input" maxLength={160}  /></div>
        <div><label className="label" htmlFor="bp-cp">Телефон</label>
          <input id="bp-cp" {...f("contact_phone")} className="input" type="tel" maxLength={40}  /></div>
        <div className="sm:col-span-2"><label className="label" htmlFor="bp-ce">E-mail</label>
          <input id="bp-ce" {...f("contact_email")} className="input" type="email" maxLength={160}  /></div>
      </div>
    </ActionForm>
  );
}

export function OrderForm({ action, defaults }: { action: Action; defaults: { plan: string; students: number; teachers: number } }) {
  const { f } = useFields({ plan: defaults.plan, months: "12", students: String(defaults.students), teachers: String(defaults.teachers), note: "" });
  return (
    <ActionForm action={action} submitLabel="Тапсырыс беру" className="card p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label" htmlFor="ord-plan">Пакет</label>
          <select id="ord-plan" {...f("plan")} className="input">
            <option value="starter">STARTER</option><option value="pro">PRO</option><option value="enterprise">ENTERPRISE</option></select></div>
        <div><label className="label" htmlFor="ord-months">Мерзімі (ай, 1-60)</label>
          <input id="ord-months" {...f("months")} type="number" className="input" min={1} max={60} step={1} required /></div>
        <div><label className="label" htmlFor="ord-students">Оқушы саны</label>
          <input id="ord-students" {...f("students")} type="number" className="input" min={1} max={100000} step={1} required /></div>
        <div><label className="label" htmlFor="ord-teachers">Мұғалім саны</label>
          <input id="ord-teachers" {...f("teachers")} type="number" className="input" min={1} max={10000} step={1} required /></div>
        <div className="sm:col-span-2"><label className="label" htmlFor="ord-note">Ескертпе (міндетті емес)</label>
          <textarea id="ord-note" {...f("note")} className="input" rows={2} maxLength={1000} /></div>
      </div>
    </ActionForm>
  );
}
