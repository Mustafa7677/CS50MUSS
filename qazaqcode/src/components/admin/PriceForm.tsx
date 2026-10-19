"use client";
import { ActionForm } from "@/components/ActionForm";
import { useFields } from "@/components/useFields";
import { savePriceAction } from "@/app/admin/prices/actions";

export type PriceVal = { id: string; plan: string; months: number; student_limit: number; price: string; currency: string; vat_mode: string; vat_rate: string; valid_from: string; valid_until: string; active: boolean };

export function PriceForm({ v, today }: { v: PriceVal | null; today: string }) {
  const { f } = useFields({ plan: v?.plan ?? "starter", months: String(v?.months ?? 12), student_limit: v ? String(v.student_limit) : "", price: v?.price ?? "", currency: v?.currency ?? "KZT",
    vat_mode: v?.vat_mode ?? "none", vat_rate: v?.vat_rate ?? "", valid_from: v?.valid_from ?? today, valid_until: v?.valid_until ?? "" });
  return (
    <ActionForm action={savePriceAction} submitLabel={v ? "Бағаны жаңарту" : "Баға қосу"} className="card p-5" key={v?.id ?? "new"}>
      <input type="hidden" name="id" value={v?.id ?? ""} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div><label className="label" htmlFor="pf-plan">Пакет</label>
          <select id="pf-plan" {...f("plan")} className="input"><option value="starter">STARTER</option><option value="pro">PRO</option><option value="enterprise">ENTERPRISE</option></select></div>
        <div><label className="label" htmlFor="pf-months">Мерзімі, ай</label><input id="pf-months" {...f("months")} type="number" min={1} max={60} className="input" required /></div>
        <div><label className="label" htmlFor="pf-limit">Оқушы лимиті (дейін)</label><input id="pf-limit" {...f("student_limit")} type="number" min={1} max={100000} className="input" required /></div>
        <div><label className="label" htmlFor="pf-price">Баға (бүкіл мерзімге)</label><input id="pf-price" {...f("price")} className="input" required inputMode="decimal" placeholder="мысалы 1 250 000,00" /></div>
        <div><label className="label" htmlFor="pf-cur">Валюта</label>
          <select id="pf-cur" {...f("currency")} className="input"><option>KZT</option><option>USD</option><option>EUR</option><option>RUB</option></select></div>
        <div><label className="label" htmlFor="pf-vat">ҚҚС режимі</label>
          <select id="pf-vat" {...f("vat_mode")} className="input"><option value="none">ҚҚС жоқ</option><option value="included">Баға ҚҚС-пен</option><option value="added">ҚҚС үстіне қосылады</option></select></div>
        <div><label className="label" htmlFor="pf-rate">ҚҚС ставкасы, %</label><input id="pf-rate" {...f("vat_rate")} className="input" inputMode="decimal" placeholder="ҚҚС болса ғана" aria-describedby="pf-rate-h" />
          <p id="pf-rate-h" className="hint">Ставканы бухгалтермен нақтылап енгізіңіз.</p></div>
        <div className="flex items-end"><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={v?.active ?? true} /> Белсенді</label></div>
        <div><label className="label" htmlFor="pf-from">Жарамды (бастап)</label><input id="pf-from" {...f("valid_from")} type="date" className="input" required /></div>
        <div><label className="label" htmlFor="pf-until">Жарамды (дейін, міндетті емес)</label><input id="pf-until" {...f("valid_until")} type="date" className="input" /></div>
      </div>
    </ActionForm>
  );
}
