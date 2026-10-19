"use client";
import { useActionState, useEffect, useState } from "react";
import { toast } from "@/components/Toaster";
import type { ActionResult } from "@/lib/errors";
import { useT } from "@/lib/i18n/client";

type Init = { name: string; logo_url: string; primary_color: string; secondary_color: string; welcome_text: string; contact_email: string; contact_phone: string };
type Action = (prev: ActionResult | null, f: FormData) => Promise<ActionResult>;

const HEX = /^#[0-9a-fA-F]{6}$/;
// brand.ts-тегі inkFor/brandStyle-мен бірдей формула (brand.ts дерекқор модулін тартады, сондықтан клиентке импортталмайды)
const lin = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
const lum = (hex: string) => { const [r, g, b] = lin(hex); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const inkFor = (hex: string) => (!HEX.test(hex) ? "#ffffff" : lum(hex) > 0.4 ? "#0f172a" : "#ffffff");
const ratio = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

function ColorField({ id, name, label, value, onChange }: { id: string; name: string; label: string; value: string; onChange: (v: string) => void }) { const t = useT();
  const valid = HEX.test(value);
  return (
    <div>
      <label className="label" htmlFor={id}>{label}</label>
      <div className="flex items-center gap-2">
        <input type="color" aria-label={t("{label}: түс таңдау", { label })} value={valid ? value : "#000000"} onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-line bg-surface p-1" />
        <input id={id} name={name} value={value} onChange={(e) => onChange(e.target.value)} maxLength={7} pattern="#[0-9a-fA-F]{6}" required
          className="input font-mono" aria-invalid={!valid} placeholder="#0e7490" />
      </div>
      {!valid && <p className="mt-1 text-xs text-red-600">{t("Пішім: #rrggbb")}</p>}
    </div>
  );
}

export function SettingsForm({ init, action, loginUrl }: { init: Init; action: Action; loginUrl: string }) { const t = useT();
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(action, null);
  const [v, setV] = useState(init);
  const set = (k: keyof Init) => (val: string) => setV((s) => ({ ...s, [k]: val }));
  useEffect(() => { if (state?.ok && state.message) toast(state.message, "ok"); }, [state]);

  const pOk = HEX.test(v.primary_color), sOk = HEX.test(v.secondary_color);
  const primary = pOk ? v.primary_color : init.primary_color;
  const accent = sOk ? v.secondary_color : init.secondary_color;
  const ink = inkFor(primary);
  const cr = ratio(primary, ink);
  const logoOk = /^https:\/\//i.test(v.logo_url);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <form action={formAction} className="card p-5">
        <div>
          <label className="label" htmlFor="org-name">{t("Ұйым атауы")}</label>
          <input id="org-name" value={v.name} readOnly className="input bg-surface-2" aria-describedby="org-name-hint" />
          <p id="org-name-hint" className="hint">{t("Атауды тек платформа әкімшісі өзгертеді.")}</p>
        </div>
        <div className="mt-4">
          <label className="label" htmlFor="logo_url">{t("Логотип сілтемесі (https)")}</label>
          <input id="logo_url" name="logo_url" type="url" value={v.logo_url} onChange={(e) => set("logo_url")(e.target.value)} maxLength={500} className="input" placeholder="https://mektep.kz/logo.png" />
          {v.logo_url && !logoOk && <p className="mt-1 text-xs text-red-600">{t("Сілтеме https:// деп басталуы тиіс.")}</p>}
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <ColorField id="primary_color" name="primary_color" label={t("Негізгі түс")} value={v.primary_color} onChange={set("primary_color")} />
          <ColorField id="secondary_color" name="secondary_color" label={t("Қосымша түс")} value={v.secondary_color} onChange={set("secondary_color")} />
        </div>
        {pOk && cr < 4.5 && (
          <p role="alert" data-testid="contrast-warning" className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
            {t("Назар аударыңыз: негізгі түс пен батырма мәтіні арасындағы контраст {toFixed}:1 (кемінде 4.5:1 керек). Мәтін қиын оқылады, түсті күңгірттеу не ашығырақ етіп көріңіз.", { toFixed: cr.toFixed(1) })}
          </p>
        )}
        {pOk && cr >= 4.5 && <p className="hint" data-testid="contrast-ok">{t("Контраст: {toFixed}:1 (қалыпты).", { toFixed: cr.toFixed(1) })}</p>}
        <div className="mt-4">
          <label className="label" htmlFor="welcome_text">{t("Кіру бетіндегі қарсы алу мәтіні")}</label>
          <textarea id="welcome_text" name="welcome_text" value={v.welcome_text} onChange={(e) => set("welcome_text")(e.target.value)} maxLength={600} rows={3} className="input" />
          <p className="hint">{v.welcome_text.length}/600</p>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="contact_email">{t("Байланыс e-mail")}</label>
            <input id="contact_email" name="contact_email" type="email" value={v.contact_email} onChange={(e) => set("contact_email")(e.target.value)} maxLength={160} className="input" />
          </div>
          <div>
            <label className="label" htmlFor="contact_phone">{t("Байланыс телефоны")}</label>
            <input id="contact_phone" name="contact_phone" type="tel" value={v.contact_phone} onChange={(e) => set("contact_phone")(e.target.value)} maxLength={40} className="input" />
          </div>
        </div>
        {state && !state.ok && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">{t(state.error)}</p>}
        {state?.ok && state.message && <p role="status" className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">{t(state.message)}</p>}
        <div className="mt-5"><button type="submit" disabled={pending} className="btn-primary">{pending ? t("Күтіңіз...") : t("Сақтау")}</button></div>
      </form>

      <aside className="space-y-4" aria-label={t("Алдын ала көру")}>
        <div className="card overflow-hidden" data-testid="brand-preview">
          <p className="border-b border-line px-4 py-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">{t("Алдын ала көру")}</p>
          <div className="p-4">
            <div className="flex items-center gap-3">
              {logoOk
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={v.logo_url} alt="" className="h-9 w-9 rounded-lg object-contain" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                : <span aria-hidden className="grid h-9 w-9 place-items-center rounded-lg text-lg font-bold" style={{ background: primary, color: ink }}>{v.name.slice(0, 1)}</span>}
              <span className="font-bold">{v.name}</span>
            </div>
            <p className="mt-4 text-sm text-ink-muted">{v.welcome_text || t("Қарсы алу мәтіні осында көрінеді.")}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold" style={{ background: primary, color: ink }}>{t("Негізгі батырма")}</span>
              <span className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold" style={{ background: accent, color: inkFor(accent) }}>{t("Қосымша")}</span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-2"><div className="h-full w-2/3 rounded-full" style={{ background: primary }} /></div>
          </div>
        </div>
        <div className="card p-4">
          <p className="text-sm font-semibold">{t("Кіру беті сілтемесі")}</p>
          <p className="mt-1 break-all font-mono text-xs" data-testid="login-url">{loginUrl}</p>
          <p className="hint">{t("Осы сілтемені оқушылар мен мұғалімдерге жіберіңіз: кіру бетінде мектептің түсі мен мәтіні көрінеді.")}</p>
        </div>
      </aside>
    </div>
  );
}
