"use client";
import { useState } from "react";
import { ActionForm } from "@/components/ActionForm";
import { useFields } from "@/components/useFields";
import { saveSellerAction } from "@/app/admin/seller/actions";

export type SellerVal = {
  legal_name: string; bin_iin: string; address: string; bank_name: string; bik: string; iik: string; kbe: string; vat_payer: boolean; vat_cert: string | null;
  director_name: string; payment_terms_days: number; contact_email: string | null; contact_phone: string | null;
} | null;

export function SellerForm({ v }: { v: SellerVal }) {
  const [vat, setVat] = useState(v?.vat_payer ?? false);
  const { f } = useFields({ legal_name: v?.legal_name ?? "", bin_iin: v?.bin_iin ?? "", kbe: v?.kbe ?? "", address: v?.address ?? "", bank_name: v?.bank_name ?? "", bik: v?.bik ?? "", iik: v?.iik ?? "",
    director_name: v?.director_name ?? "", payment_terms_days: v ? String(v.payment_terms_days) : "", vat_cert: v?.vat_cert ?? "", contact_email: v?.contact_email ?? "", contact_phone: v?.contact_phone ?? "" });
  return (
    <ActionForm action={saveSellerAction} submitLabel="Сақтау" className="card p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><label className="label" htmlFor="sp-legal">Заңды атауы *</label><input id="sp-legal" {...f("legal_name")} className="input" required minLength={2} maxLength={200}  /></div>
        <div><label className="label" htmlFor="sp-bin">БИН/ЖСН (12 сан) *</label><input id="sp-bin" {...f("bin_iin")} className="input font-mono" required inputMode="numeric" pattern="\d{12}" maxLength={12}  /></div>
        <div><label className="label" htmlFor="sp-kbe">КБе (2 сан) *</label><input id="sp-kbe" {...f("kbe")} className="input font-mono" required inputMode="numeric" pattern="\d{2}" maxLength={2}  /></div>
        <div className="sm:col-span-2"><label className="label" htmlFor="sp-addr">Заңды мекенжайы *</label><input id="sp-addr" {...f("address")} className="input" required minLength={5} maxLength={300}  /></div>
        <div><label className="label" htmlFor="sp-bank">Банк атауы *</label><input id="sp-bank" {...f("bank_name")} className="input" required minLength={2} maxLength={160}  /></div>
        <div><label className="label" htmlFor="sp-bik">БИК *</label><input id="sp-bik" {...f("bik")} className="input font-mono uppercase" required minLength={8} maxLength={11}  /></div>
        <div className="sm:col-span-2"><label className="label" htmlFor="sp-iik">ИИК/ЖСК (KZ... 20 таңба) *</label><input id="sp-iik" {...f("iik")} className="input font-mono uppercase" required maxLength={24}  spellCheck={false} /></div>
        <div><label className="label" htmlFor="sp-dir">Басшының аты-жөні *</label><input id="sp-dir" {...f("director_name")} className="input" required minLength={2} maxLength={160}  /></div>
        <div><label className="label" htmlFor="sp-terms">Шот төлеу мерзімі, күн *</label><input id="sp-terms" {...f("payment_terms_days")} type="number" min={1} max={90} className="input" required  /></div>
        <div className="sm:col-span-2"><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="vat_payer" checked={vat} onChange={(e) => setVat(e.target.checked)} /> ҚҚС төлеушісімін</label></div>
        {vat && <div className="sm:col-span-2"><label className="label" htmlFor="sp-cert">ҚҚС бойынша тіркеу куәлігі (серия, нөмір) *</label><input id="sp-cert" {...f("vat_cert")} className="input" required maxLength={80} /></div>}
        <div><label className="label" htmlFor="sp-mail">E-mail</label><input id="sp-mail" {...f("contact_email")} type="email" className="input" maxLength={160}  /></div>
        <div><label className="label" htmlFor="sp-tel">Телефон</label><input id="sp-tel" {...f("contact_phone")} type="tel" className="input" maxLength={40}  /></div>
      </div>
    </ActionForm>
  );
}
