"use client";
import { ActionForm } from "@/components/ActionForm";
import { savePriceAction } from "@/app/admin/prices/actions";

export type PriceVal = { id: string; plan: string; months: number; student_limit: number; price: string; currency: string; vat_mode: string; vat_rate: string; valid_from: string; valid_until: string; active: boolean };

export function PriceForm({ v, today }: { v: PriceVal | null; today: string }) {
  return (
    <ActionForm action={savePriceAction} submitLabel={v ? "Бағаны жаңарту" : "Баға қосу"} className="card p-5" reset={!v} key={v?.id ?? "new"}>
      <input type="hidden" name="id" value={v?.id ?? ""} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div><label className="label" htmlFor="pf-plan">Пакет</label>
          <select id="pf-plan" name="plan" className="input" defaultValue={v?.plan ?? "starter"}><option value="starter">STARTER</option><option value="pro">PRO</option><option value="enterprise">ENTERPRISE</option></select></div>
        <div><label className="label" htmlFor="pf-months">Мерзімі, ай</label><input id="pf-months" name="months" type="number" min={1} max={60} className="input" required defaultValue={v?.months ?? 12} /></div>
        <div><label className="label" htmlFor="pf-limit">Оқушы лимиті (дейін)</label><input id="pf-limit" name="student_limit" type="number" min={1} max={100000} className="input" required defaultValue={v?.student_limit} /></div>
        <div><label className="label" htmlFor="pf-price">Баға (бүкіл мерзімге)</label><input id="pf-price" name="price" className="input" required inputMode="decimal" placeholder="мысалы 1 250 000,00" defaultValue={v?.price} /></div>
        <div><label className="label" htmlFor="pf-cur">Валюта</label>
          <select id="pf-cur" name="currency" className="input" defaultValue={v?.currency ?? "KZT"}><option>KZT</option><option>USD</option><option>EUR</option><option>RUB</option></select></div>
        <div><label className="label" htmlFor="pf-vat">ҚҚС режимі</label>
          <select id="pf-vat" name="vat_mode" className="input" defaultValue={v?.vat_mode ?? "none"}><option value="none">ҚҚС жоқ</option><option value="included">Баға ҚҚС-пен</option><option value="added">ҚҚС үстіне қосылады</option></select></div>
        <div><label className="label" htmlFor="pf-rate">ҚҚС ставкасы, %</label><input id="pf-rate" name="vat_rate" className="input" inputMode="decimal" placeholder="ҚҚС болса ғана" defaultValue={v?.vat_rate} aria-describedby="pf-rate-h" />
          <p id="pf-rate-h" className="hint">Ставканы бухгалтермен нақтылап енгізіңіз.</p></div>
        <div className="flex items-end"><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={v?.active ?? true} /> Белсенді</label></div>
        <div><label className="label" htmlFor="pf-from">Жарамды (бастап)</label><input id="pf-from" name="valid_from" type="date" className="input" required defaultValue={v?.valid_from ?? today} /></div>
        <div><label className="label" htmlFor="pf-until">Жарамды (дейін, міндетті емес)</label><input id="pf-until" name="valid_until" type="date" className="input" defaultValue={v?.valid_until} /></div>
      </div>
    </ActionForm>
  );
}
