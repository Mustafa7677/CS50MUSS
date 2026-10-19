"use client";
import { ActionForm } from "@/components/ActionForm";
import { useFields } from "@/components/useFields";
import { savePriceAction } from "@/app/admin/prices/actions";
import { useT } from "@/lib/i18n/client";

export type PriceVal = { id: string; plan: string; months: number; student_limit: number; price: string; currency: string; vat_mode: string; vat_rate: string; valid_from: string; valid_until: string; active: boolean };

export function PriceForm({ v, today }: { v: PriceVal | null; today: string }) { const t = useT();
  const { f } = useFields({ plan: v?.plan ?? "starter", months: String(v?.months ?? 12), student_limit: v ? String(v.student_limit) : "", price: v?.price ?? "", currency: v?.currency ?? "KZT",
    vat_mode: v?.vat_mode ?? "none", vat_rate: v?.vat_rate ?? "", valid_from: v?.valid_from ?? today, valid_until: v?.valid_until ?? "" });
  return (
    <ActionForm action={savePriceAction} submitLabel={v ? t("Бағаны жаңарту") : t("Баға қосу")} className="card p-5" key={v?.id ?? "new"}>
      <input type="hidden" name="id" value={v?.id ?? ""} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div><label className="label" htmlFor="pf-plan">{t("Пакет")}</label>
          <select id="pf-plan" {...f("plan")} className="input"><option value="starter">STARTER</option><option value="pro">PRO</option><option value="enterprise">ENTERPRISE</option></select></div>
        <div><label className="label" htmlFor="pf-months">{t("Мерзімі, ай")}</label><input id="pf-months" {...f("months")} type="number" min={1} max={60} className="input" required /></div>
        <div><label className="label" htmlFor="pf-limit">{t("Оқушы лимиті (дейін)")}</label><input id="pf-limit" {...f("student_limit")} type="number" min={1} max={100000} className="input" required /></div>
        <div><label className="label" htmlFor="pf-price">{t("Баға (бүкіл мерзімге)")}</label><input id="pf-price" {...f("price")} className="input" required inputMode="decimal" placeholder={t("мысалы 1 250 000,00")} /></div>
        <div><label className="label" htmlFor="pf-cur">{t("Валюта")}</label>
          <select id="pf-cur" {...f("currency")} className="input"><option>KZT</option><option>USD</option><option>EUR</option><option>RUB</option></select></div>
        <div><label className="label" htmlFor="pf-vat">{t("ҚҚС режимі")}</label>
          <select id="pf-vat" {...f("vat_mode")} className="input"><option value="none">{t("ҚҚС жоқ")}</option><option value="included">{t("Баға ҚҚС-пен")}</option><option value="added">{t("ҚҚС үстіне қосылады")}</option></select></div>
        <div><label className="label" htmlFor="pf-rate">{t("ҚҚС ставкасы, %")}</label><input id="pf-rate" {...f("vat_rate")} className="input" inputMode="decimal" placeholder={t("ҚҚС болса ғана")} aria-describedby="pf-rate-h" />
          <p id="pf-rate-h" className="hint">{t("Ставканы бухгалтермен нақтылап енгізіңіз.")}</p></div>
        <div className="flex items-end"><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={v?.active ?? true} />{" "}{t("Белсенді")}</label></div>
        <div><label className="label" htmlFor="pf-from">{t("Жарамды (бастап)")}</label><input id="pf-from" {...f("valid_from")} type="date" className="input" required /></div>
        <div><label className="label" htmlFor="pf-until">{t("Жарамды (дейін, міндетті емес)")}</label><input id="pf-until" {...f("valid_until")} type="date" className="input" /></div>
      </div>
    </ActionForm>
  );
}
