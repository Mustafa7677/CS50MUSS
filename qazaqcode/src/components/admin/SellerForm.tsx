"use client";
import { useState } from "react";
import { ActionForm } from "@/components/ActionForm";
import { saveSellerAction } from "@/app/admin/seller/actions";

export type SellerVal = {
  legal_name: string; bin_iin: string; address: string; bank_name: string; bik: string; iik: string; kbe: string; vat_payer: boolean; vat_cert: string | null;
  director_name: string; payment_terms_days: number; contact_email: string | null; contact_phone: string | null;
} | null;

export function SellerForm({ v }: { v: SellerVal }) {
  const [vat, setVat] = useState(v?.vat_payer ?? false);
  return (
    <ActionForm action={saveSellerAction} submitLabel="Сақтау" className="card p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><label className="label" htmlFor="sp-legal">Заңды атауы *</label><input id="sp-legal" name="legal_name" className="input" required minLength={2} maxLength={200} defaultValue={v?.legal_name ?? ""} /></div>
        <div><label className="label" htmlFor="sp-bin">БИН/ЖСН (12 сан) *</label><input id="sp-bin" name="bin_iin" className="input font-mono" required inputMode="numeric" pattern="\d{12}" maxLength={12} defaultValue={v?.bin_iin ?? ""} /></div>
        <div><label className="label" htmlFor="sp-kbe">КБе (2 сан) *</label><input id="sp-kbe" name="kbe" className="input font-mono" required inputMode="numeric" pattern="\d{2}" maxLength={2} defaultValue={v?.kbe ?? ""} /></div>
        <div className="sm:col-span-2"><label className="label" htmlFor="sp-addr">Заңды мекенжайы *</label><input id="sp-addr" name="address" className="input" required minLength={5} maxLength={300} defaultValue={v?.address ?? ""} /></div>
        <div><label className="label" htmlFor="sp-bank">Банк атауы *</label><input id="sp-bank" name="bank_name" className="input" required minLength={2} maxLength={160} defaultValue={v?.bank_name ?? ""} /></div>
        <div><label className="label" htmlFor="sp-bik">БИК *</label><input id="sp-bik" name="bik" className="input font-mono uppercase" required minLength={8} maxLength={11} defaultValue={v?.bik ?? ""} /></div>
        <div className="sm:col-span-2"><label className="label" htmlFor="sp-iik">ИИК/ЖСК (KZ... 20 таңба) *</label><input id="sp-iik" name="iik" className="input font-mono uppercase" required maxLength={24} defaultValue={v?.iik ?? ""} spellCheck={false} /></div>
        <div><label className="label" htmlFor="sp-dir">Басшының аты-жөні *</label><input id="sp-dir" name="director_name" className="input" required minLength={2} maxLength={160} defaultValue={v?.director_name ?? ""} /></div>
        <div><label className="label" htmlFor="sp-terms">Шот төлеу мерзімі, күн *</label><input id="sp-terms" name="payment_terms_days" type="number" min={1} max={90} className="input" required defaultValue={v?.payment_terms_days} /></div>
        <div className="sm:col-span-2"><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="vat_payer" checked={vat} onChange={(e) => setVat(e.target.checked)} /> ҚҚС төлеушісімін</label></div>
        {vat && <div className="sm:col-span-2"><label className="label" htmlFor="sp-cert">ҚҚС бойынша тіркеу куәлігі (серия, нөмір) *</label><input id="sp-cert" name="vat_cert" className="input" required maxLength={80} defaultValue={v?.vat_cert ?? ""} /></div>}
        <div><label className="label" htmlFor="sp-mail">E-mail</label><input id="sp-mail" name="contact_email" type="email" className="input" maxLength={160} defaultValue={v?.contact_email ?? ""} /></div>
        <div><label className="label" htmlFor="sp-tel">Телефон</label><input id="sp-tel" name="contact_phone" type="tel" className="input" maxLength={40} defaultValue={v?.contact_phone ?? ""} /></div>
      </div>
    </ActionForm>
  );
}
