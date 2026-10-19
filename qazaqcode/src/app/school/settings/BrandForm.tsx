"use client";
import { useActionState, useEffect, useState } from "react";
import { toast } from "@/components/Toaster";
import type { ActionResult } from "@/lib/errors";
import {
  AA, DARK_INK, DARK_SURFACE, DARK_SURFACE_2, HEX, LIGHT_SURFACE, LIGHT_SURFACE_2,
  buttonContrast, contrast, fixPrimary, inkFor, linkColors, mix,
} from "@/lib/brand-color";
import { useT } from "@/lib/i18n/client";

type Init = { name: string; logo_url: string; primary_color: string; secondary_color: string; welcome_text: string; contact_email: string; contact_phone: string };
type Action = (prev: ActionResult | null, f: FormData) => Promise<ActionResult>;
const DEFAULTS = { primary_color: "#0e7490", secondary_color: "#f2b705" };

const warnBox = "mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100";

function ColorField({ id, name, label, value, onChange }: { id: string; name: string; label: string; value: string; onChange: (v: string) => void }) { const t = useT();
  const valid = HEX.test(value);
  return (
    <div>
      <label className="label" htmlFor={id}>{label}</label>
      <div className="flex items-center gap-2">
        <input type="color" aria-label={t("{label}: түс таңдау", { label })} value={valid ? value.toLowerCase() : "#000000"} onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-line bg-surface p-1" />
        <input id={id} name={name} value={value} onChange={(e) => onChange(e.target.value)} maxLength={7} pattern="#[0-9a-fA-F]{6}" required
          className="input min-w-0 font-mono" aria-invalid={!valid} placeholder="#0e7490" />
      </div>
      {!valid && <p className="mt-1 text-xs text-red-600 dark:text-red-300">{t("Пішім: #rrggbb")}</p>}
    </div>
  );
}

export function BrandForm({ init, action, loginUrl }: { init: Init; action: Action; loginUrl: string }) { const t = useT();
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(action, null);
  const [v, setV] = useState(init);
  const [mode, setMode] = useState<"light" | "dark">("light");
  const [logoBroken, setLogoBroken] = useState(false);
  const set = (k: keyof Init) => (val: string) => setV((s) => ({ ...s, [k]: val }));
  useEffect(() => { if (state?.ok && state.message) toast(state.message, "ok"); }, [state]);
  useEffect(() => { setLogoBroken(false); }, [v.logo_url]);

  const pOk = HEX.test(v.primary_color), sOk = HEX.test(v.secondary_color);
  const primary = pOk ? v.primary_color : DEFAULTS.primary_color;
  const accent = sOk ? v.secondary_color : DEFAULTS.secondary_color;
  const ink = inkFor(primary), accentInk = inkFor(accent);
  const btnRatio = buttonContrast(primary);
  const accRatio = contrast(accent, accentInk);
  const links = linkColors(primary);
  const fixedPrimary = fixPrimary(primary);
  const fixedAccent = fixPrimary(accent);
  const logoOk = /^https:\/\/[^\s<>"']+$/i.test(v.logo_url);
  const showLogo = logoOk && !logoBroken;

  // алдын ала көру: таңдалған режимнің токендері (панель қараңғы режимінен тәуелсіз)
  const dark = mode === "dark";
  const P = dark
    ? { bg: DARK_SURFACE, bg2: DARK_SURFACE_2, ink: "#e8edf5", muted: "#9aa8bd", line: "#25324a", link: links.dark, soft: mix(primary, DARK_SURFACE, 0.25) }
    : { bg: LIGHT_SURFACE, bg2: LIGHT_SURFACE_2, ink: DARK_INK, muted: "#5b6676", line: "#e3e8ee", link: links.light, soft: mix(primary, "#ffffff", 0.12) };
  const logo = showLogo
    // eslint-disable-next-line @next/next/no-img-element
    ? <img src={v.logo_url} alt="" className="h-9 w-9 shrink-0 rounded-lg object-contain" onError={() => setLogoBroken(true)} />
    : <span aria-hidden className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-lg font-bold" style={{ background: primary, color: ink }}>{v.name.slice(0, 1)}</span>;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
      <form action={formAction} className="card min-w-0 p-5">
        <div>
          <label className="label" htmlFor="org-name">{t("Мектеп атауы")}</label>
          <input id="org-name" value={v.name} readOnly className="input bg-surface-2" aria-describedby="org-name-hint" />
          <p id="org-name-hint" className="hint">{t("Атау панельде, жоғарғы жолақта және кіру бетінде көрсетіледі. Оны тек платформа әкімшісі өзгертеді.")}</p>
        </div>
        <div className="mt-4">
          <label className="label" htmlFor="logo_url">{t("Логотип сілтемесі (https)")}</label>
          <input id="logo_url" name="logo_url" type="url" value={v.logo_url} onChange={(e) => set("logo_url")(e.target.value)} maxLength={500} className="input" placeholder="https://mektep.kz/logo.png" aria-describedby="logo-hint" />
          <p id="logo-hint" className="hint">{t("Тек https сілтемесі. Квадрат сурет (PNG, SVG) жақсы көрінеді; бос қалдырсаңыз, атаудың бірінші әрпі көрсетіледі.")}</p>
          {v.logo_url && !logoOk && <p className="mt-1 text-xs text-red-600 dark:text-red-300" data-testid="logo-error">{t("Сілтеме https:// деп басталуы тиіс.")}</p>}
          {logoOk && logoBroken && <p className="mt-1 text-xs text-amber-700 dark:text-amber-300" data-testid="logo-broken">{t("Сурет жүктелмеді: сілтемені тексеріңіз.")}</p>}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <ColorField id="primary_color" name="primary_color" label={t("Негізгі түс")} value={v.primary_color} onChange={set("primary_color")} />
          <ColorField id="secondary_color" name="secondary_color" label={t("Қосымша түс")} value={v.secondary_color} onChange={set("secondary_color")} />
        </div>
        {pOk && btnRatio < AA && (
          <div role="alert" data-testid="contrast-warning" className={warnBox}>
            {t("Назар аударыңыз: негізгі түс пен батырма мәтіні арасындағы контраст {toFixed}:1 (WCAG AA үшін кемінде 4.5:1 керек). Мәтін қиын оқылады.", { toFixed: btnRatio.toFixed(1) })}
            <div className="mt-2"><button type="button" className="btn-secondary" data-testid="autofix-primary" onClick={() => set("primary_color")(fixedPrimary)}>{t("Автотүзету:")}{" "}{fixedPrimary}</button></div>
          </div>
        )}
        {pOk && btnRatio >= AA && <p className="hint" data-testid="contrast-ok">{t("Негізгі түстің контрасты: {toFixed}:1 (AA талабына сай).", { toFixed: btnRatio.toFixed(1) })}</p>}
        {sOk && accRatio < AA && (
          <div role="alert" data-testid="contrast-warning-secondary" className={warnBox}>
            {t("Қосымша түс пен оның мәтіні арасындағы контраст {toFixed}:1 (кемінде 4.5:1 керек).", { toFixed: accRatio.toFixed(1) })}
            <div className="mt-2"><button type="button" className="btn-secondary" data-testid="autofix-secondary" onClick={() => set("secondary_color")(fixedAccent)}>{t("Автотүзету:")}{" "}{fixedAccent}</button></div>
          </div>
        )}
        {pOk && (contrast(primary, LIGHT_SURFACE) < AA || contrast(primary, DARK_SURFACE) < AA) && btnRatio >= AA && (
          <p className="hint" data-testid="link-adjusted">{t("Түс мәтін ретінде (сілтеме, тақырып) ақ не қараңғы фонда оқылмайтындықтан, ондай жерлерде автоматты түрде бейімделеді.")}</p>
        )}
        <div className="mt-2">
          <button type="button" className="btn-ghost px-0 text-xs" onClick={() => setV((s) => ({ ...s, ...DEFAULTS }))}>{t("Әдепкі түстерге қайтару")}</button>
        </div>

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
        <p className="hint">{t("Байланыс деректері лицензия ескертуінде мұғалімдер мен оқушыларға көрсетіледі.")}</p>
        {state && !state.ok && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">{state.error}</p>}
        {state?.ok && state.message && <p role="status" className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">{state.message}</p>}
        <div className="mt-5"><button type="submit" disabled={pending} className="btn-primary">{pending ? t("Күтіңіз...") : t("Сақтау")}</button></div>
      </form>

      <aside className="min-w-0 space-y-4" aria-label={t("Алдын ала көру")}>
        <div className="card overflow-hidden" data-testid="brand-preview" data-mode={mode}>
          <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{t("Алдын ала көру")}</p>
            <div role="group" aria-label={t("Көрініс режимі")} className="flex gap-1">
              {(["light", "dark"] as const).map((m) => (
                <button key={m} type="button" aria-pressed={mode === m} onClick={() => setMode(m)} data-testid={`preview-${m}`}
                  className={`rounded-md border px-2 py-1 text-xs font-medium ${mode === m ? "border-brand bg-brand-soft text-ink" : "border-line text-ink-muted"}`}>
                  {m === "light" ? t("Ашық") : t("Қараңғы")}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3 p-3" style={{ background: P.bg2, color: P.ink }}>
            {/* панель: логотип + атау */}
            <div className="rounded-xl border p-3" style={{ background: P.bg, borderColor: P.line }} data-testid="preview-sidebar">
              <div className="flex items-center gap-3">{logo}<span className="min-w-0 break-words font-bold leading-tight">{v.name}</span></div>
              <div className="mt-3 rounded-lg px-3 py-2 text-sm font-medium" style={{ background: P.soft }}>{t("📊 Шолу")}</div>
              <p className="mt-2 text-sm"><a href="#preview" onClick={(e) => e.preventDefault()} style={{ color: P.link }} className="underline">{t("Сілтеме мысалы")}</a></p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold" style={{ background: primary, color: ink }}>{t("Негізгі батырма")}</span>
                <span className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold" style={{ background: accent, color: accentInk }}>{t("Қосымша")}</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full" style={{ background: P.bg2 }}><div className="h-full w-2/3 rounded-full" style={{ background: primary }} /></div>
            </div>
            {/* кіру беті */}
            <div className="rounded-xl border p-4" style={{ background: P.bg, borderColor: P.line }} data-testid="preview-login">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: P.link }}>{v.name}</p>
              <p className="mt-1 text-lg font-bold">{t("Жүйеге кіру")}</p>
              <p className="mt-1 break-words text-sm" style={{ color: P.muted }}>{v.welcome_text || t("Қарсы алу мәтіні осында көрінеді.")}</p>
              <div className="mt-3 rounded-lg border px-3 py-2 text-sm" style={{ borderColor: P.line, color: P.muted }}>E-mail</div>
              <span className="mt-3 inline-flex w-full items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold" style={{ background: primary, color: ink }}>{t("Кіру")}</span>
              {(v.contact_email || v.contact_phone) && <p className="mt-3 break-words text-xs" style={{ color: P.muted }}>{t("Байланыс:")}{" "}{[v.contact_email, v.contact_phone].filter(Boolean).join(" · ")}</p>}
            </div>
          </div>
        </div>
        <div className="card p-4">
          <p className="text-sm font-semibold">{t("Кіру беті сілтемесі")}</p>
          <p className="mt-1 break-all font-mono text-xs" data-testid="login-url">{loginUrl}</p>
          <p className="hint">{t("Осы сілтемені оқушылар мен мұғалімдерге жіберіңіз: кіру бетінде мектептің атауы, түсі мен қарсы алу мәтіні көрінеді.")}</p>
        </div>
      </aside>
    </div>
  );
}
