"use client";
import { useState } from "react";
import { ActionForm } from "@/components/ActionForm";
import { requestPilotAction } from "@/app/schools/actions";
import type { ActionResult } from "@/lib/errors";

const ROLES: [string, string][] = [["director", "Директор"], ["deputy", "Директордың орынбасары"], ["teacher", "Мұғалім"], ["it", "IT маманы"], ["other", "Басқа"]];
const TYPES: [string, string][] = [["school", "Мектеп"], ["college", "Колледж"], ["academy", "Академия / оқу орталығы"], ["other", "Басқа"]];
const EMPTY = { org_name: "", contact_name: "", email: "", phone: "", role: "", org_type: "", students: "", message: "", consent: false };

/**
 * React 19 форма әрекеті аяқталғанда басқарылмайтын өрістерді тазалайды (қате болса да): пайдаланушы 10 өрісті қайта жазбасын деп
 * өрістерді басқарамыз (controlled) және тек сәтті жіберуден кейін өзіміз тазалаймыз.
 */
export function RequestForm() {
  const [v, setV] = useState(EMPTY);
  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setV((p) => ({ ...p, [k]: e.target instanceof HTMLInputElement && e.target.type === "checkbox" ? e.target.checked : e.target.value }));
  const action = async (prev: ActionResult | null, f: FormData): Promise<ActionResult> => {
    const r = await requestPilotAction(prev, f);
    if (r.ok) setV(EMPTY);
    return r;
  };
  return (
    <ActionForm action={action} submitLabel="Пилотқа сұрау жіберу" className="card p-5 sm:p-6">
      {/* Бот тұзағы: көрінбейді, пернетақтамен де жетпейді. Адам толтырмайды. */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", width: 1, height: 1, overflow: "hidden" }}>
        <label htmlFor="lead-website">Веб-сайт (толтырмаңыз)</label>
        <input id="lead-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label" htmlFor="lead-org">Ұйым атауы *</label>
          <input id="lead-org" name="org_name" className="input" required minLength={2} maxLength={160} autoComplete="organization" value={v.org_name} onChange={set("org_name")} /></div>
        <div><label className="label" htmlFor="lead-contact">Байланыс адамы *</label>
          <input id="lead-contact" name="contact_name" className="input" required minLength={2} maxLength={120} autoComplete="name" value={v.contact_name} onChange={set("contact_name")} /></div>
        <div><label className="label" htmlFor="lead-email">E-mail *</label>
          <input id="lead-email" name="email" type="email" className="input" required maxLength={160} autoComplete="email" value={v.email} onChange={set("email")} /></div>
        <div><label className="label" htmlFor="lead-phone">Телефон (міндетті емес)</label>
          <input id="lead-phone" name="phone" type="tel" className="input" minLength={5} maxLength={40} autoComplete="tel" value={v.phone} onChange={set("phone")} /></div>
        <div><label className="label" htmlFor="lead-role">Сіздің рөліңіз *</label>
          <select id="lead-role" name="role" className="input" required value={v.role} onChange={set("role")}>
            <option value="" disabled>Таңдаңыз</option>{ROLES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
        <div><label className="label" htmlFor="lead-type">Ұйым түрі *</label>
          <select id="lead-type" name="org_type" className="input" required value={v.org_type} onChange={set("org_type")}>
            <option value="" disabled>Таңдаңыз</option>{TYPES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
        <div><label className="label" htmlFor="lead-students">Оқушы саны (шамамен)</label>
          <input id="lead-students" name="students" type="number" inputMode="numeric" min={1} max={100000} step={1} className="input" value={v.students} onChange={set("students")} /></div>
      </div>
      <div className="mt-4"><label className="label" htmlFor="lead-message">Хабар (міндетті емес)</label>
        <textarea id="lead-message" name="message" rows={4} maxLength={1000} className="input" aria-describedby="lead-message-hint" value={v.message} onChange={set("message")} />
        <p id="lead-message-hint" className="hint">Қандай сабақтарда қолданғыңыз келеді, қашан бастағыңыз келеді. 1000 таңбаға дейін.</p></div>
      <div className="mt-4 flex items-start gap-3">
        <input id="lead-consent" name="consent" type="checkbox" required className="mt-1 h-4 w-4 shrink-0" aria-describedby="lead-consent-text" checked={v.consent} onChange={set("consent")} />
        <label htmlFor="lead-consent" id="lead-consent-text" className="text-sm text-ink-muted">
          Деректерімді өңдеуге келісемін. Деректер тек пилот туралы байланысу үшін қолданылады, 365 күннен кейін өшіріледі, үшінші тарапқа берілмейді.
          Тек платформа әкімшісі көреді. *
        </label>
      </div>
    </ActionForm>
  );
}
