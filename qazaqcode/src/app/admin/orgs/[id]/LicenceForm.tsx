"use client";
import { useRef, useState } from "react";
import { ActionForm } from "@/components/ActionForm";
import type { ActionResult } from "@/lib/errors";

type Action = (prev: ActionResult | null, f: FormData) => Promise<ActionResult>;
type Init = { org: string; plan: string; status: string; max_students: number; max_teachers: number; valid_until: string; notes: string };
const PRESETS: Record<string, [number, number] | null> = { starter: [100, 5], pro: [500, 25], enterprise: null };

const iso = (d: Date) => d.toISOString().slice(0, 10);
function addMonths(base: string, n: number) {
  const d = new Date(base + "T00:00:00Z"); const day = d.getUTCDate();
  d.setUTCMonth(d.getUTCMonth() + n); if (d.getUTCDate() !== day) d.setUTCDate(0);
  return iso(d);
}

/** Лицензия формасы: пакетті таңдағанда лимиттер автотолтырылады (ENTERPRISE - қолмен); мерзімді +6 ай / +1 жыл батырмаларымен ұзартуға болады. */
export function LicenceForm({ init, action }: { init: Init; action: Action }) {
  const [v, setV] = useState(init);
  const studentsRef = useRef<HTMLInputElement>(null);
  const set = (k: keyof Init, val: string | number) => setV((s) => ({ ...s, [k]: val }));
  const preset = PRESETS[v.plan];
  const custom = preset ? preset[0] !== v.max_students || preset[1] !== v.max_teachers : false;
  const onPlan = (plan: string) => {
    const p = PRESETS[plan];
    setV((s) => ({ ...s, plan, ...(p ? { max_students: p[0], max_teachers: p[1] } : {}) }));
    if (!p) setTimeout(() => studentsRef.current?.focus(), 0);
  };
  const today = iso(new Date());
  const extend = (n: number) => setV((s) => ({ ...s, valid_until: addMonths(s.valid_until && s.valid_until > today ? s.valid_until : today, n) }));
  const past = v.valid_until && v.valid_until < today;
  return (
    <ActionForm action={action} submitLabel="Лицензияны сақтау" className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="org" value={v.org} />
      <div>
        <label className="label" htmlFor="lic-plan">Пакет</label>
        <select id="lic-plan" name="plan" value={v.plan} onChange={(e) => onPlan(e.target.value)} className="input">
          <option value="starter">STARTER: 100 оқушы, 5 мұғалім</option><option value="pro">PRO: 500 оқушы, 25 мұғалім</option><option value="enterprise">ENTERPRISE: келісім бойынша</option>
        </select>
        <p className="hint" data-testid="plan-hint">{v.plan === "enterprise" ? "ENTERPRISE: лимиттерді келісімшарт бойынша қолмен енгізіңіз." : custom ? "Лимиттер пакеттегіден өзгеше (қолмен өзгертілген)." : "Лимиттер пакет бойынша автоматты толтырылды."}</p>
      </div>
      <div>
        <label className="label" htmlFor="lic-status">Лицензия күйі</label>
        <select id="lic-status" name="status" value={v.status} onChange={(e) => set("status", e.target.value)} className="input">
          <option value="active">Белсенді</option><option value="suspended">Тоқтатылған</option>
        </select>
      </div>
      <div>
        <label className="label" htmlFor="lic-ms">Оқушы лимиті</label>
        <input id="lic-ms" ref={studentsRef} name="max_students" type="number" min={0} max={100000} required value={v.max_students} onChange={(e) => set("max_students", Number(e.target.value))} className="input" />
      </div>
      <div>
        <label className="label" htmlFor="lic-mt">Мұғалім лимиті</label>
        <input id="lic-mt" name="max_teachers" type="number" min={0} max={10000} required value={v.max_teachers} onChange={(e) => set("max_teachers", Number(e.target.value))} className="input" />
      </div>
      <div>
        <label className="label" htmlFor="lic-until">Мерзімі (дейін)</label>
        <input id="lic-until" name="valid_until" type="date" required value={v.valid_until} onChange={(e) => set("valid_until", e.target.value)} className="input" />
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" className="btn-secondary px-3 py-1 text-xs" onClick={() => extend(6)}>+6 ай</button>
          <button type="button" className="btn-secondary px-3 py-1 text-xs" data-testid="form-plus-year" onClick={() => extend(12)}>+1 жыл</button>
        </div>
        {past && <p className="hint text-amber-700 dark:text-amber-300">Өткен күн қойылса, лицензия бірден «мерзімі өткен» болады.</p>}
      </div>
      <div>
        <label className="label" htmlFor="lic-notes">Ескертпе (келісімшарт №)</label>
        <input id="lic-notes" name="notes" value={v.notes} onChange={(e) => set("notes", e.target.value)} maxLength={300} className="input" />
      </div>
    </ActionForm>
  );
}
