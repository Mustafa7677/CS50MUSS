import { ActionForm } from "@/components/ActionForm";
import { requestPilotAction } from "@/app/schools/actions";

const ROLES: [string, string][] = [["director", "Директор"], ["deputy", "Директордың орынбасары"], ["teacher", "Мұғалім"], ["it", "IT маманы"], ["other", "Басқа"]];
const TYPES: [string, string][] = [["school", "Мектеп"], ["college", "Колледж"], ["academy", "Академия / оқу орталығы"], ["other", "Басқа"]];

export function RequestForm() {
  return (
    <ActionForm action={requestPilotAction} submitLabel="Пилотқа сұрау жіберу" reset className="card p-5 sm:p-6">
      {/* Бот тұзағы: көрінбейді, пернетақтамен де жетпейді. Адам толтырмайды. */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", width: 1, height: 1, overflow: "hidden" }}>
        <label htmlFor="lead-website">Веб-сайт (толтырмаңыз)</label>
        <input id="lead-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label" htmlFor="lead-org">Ұйым атауы *</label>
          <input id="lead-org" name="org_name" className="input" required minLength={2} maxLength={160} autoComplete="organization" /></div>
        <div><label className="label" htmlFor="lead-contact">Байланыс адамы *</label>
          <input id="lead-contact" name="contact_name" className="input" required minLength={2} maxLength={120} autoComplete="name" /></div>
        <div><label className="label" htmlFor="lead-email">E-mail *</label>
          <input id="lead-email" name="email" type="email" className="input" required maxLength={160} autoComplete="email" /></div>
        <div><label className="label" htmlFor="lead-phone">Телефон (міндетті емес)</label>
          <input id="lead-phone" name="phone" type="tel" className="input" minLength={5} maxLength={40} autoComplete="tel" /></div>
        <div><label className="label" htmlFor="lead-role">Сіздің рөліңіз *</label>
          <select id="lead-role" name="role" className="input" required defaultValue="">
            <option value="" disabled>Таңдаңыз</option>{ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
        <div><label className="label" htmlFor="lead-type">Ұйым түрі *</label>
          <select id="lead-type" name="org_type" className="input" required defaultValue="">
            <option value="" disabled>Таңдаңыз</option>{TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
        <div><label className="label" htmlFor="lead-students">Оқушы саны (шамамен)</label>
          <input id="lead-students" name="students" type="number" inputMode="numeric" min={1} max={100000} step={1} className="input" /></div>
      </div>
      <div className="mt-4"><label className="label" htmlFor="lead-message">Хабар (міндетті емес)</label>
        <textarea id="lead-message" name="message" rows={4} maxLength={1000} className="input" aria-describedby="lead-message-hint" />
        <p id="lead-message-hint" className="hint">Қандай сабақтарда қолданғыңыз келеді, қашан бастағыңыз келеді. 1000 таңбаға дейін.</p></div>
      <div className="mt-4 flex items-start gap-3">
        <input id="lead-consent" name="consent" type="checkbox" required className="mt-1 h-4 w-4 shrink-0" aria-describedby="lead-consent-text" />
        <label htmlFor="lead-consent" id="lead-consent-text" className="text-sm text-ink-muted">
          Деректерімді өңдеуге келісемін. Деректер тек пилот туралы байланысу үшін қолданылады, 365 күннен кейін өшіріледі, үшінші тарапқа берілмейді.
          Тек платформа әкімшісі көреді. *
        </label>
      </div>
    </ActionForm>
  );
}
