"use client";
import { useActionState, useState } from "react";
import type { ActionResult } from "@/lib/errors";
import { useT } from "@/lib/i18n/client";
import type { TFn } from "@/lib/i18n/core";

type Action = (prev: ActionResult<{ link: string }> | null, f: FormData) => Promise<ActionResult<{ link: string }>>;

const TTL = (t: TFn) => [[24, t("1 күн")], [72, t("3 күн")], [168, t("7 күн")], [336, t("14 күн")], [720, t("30 күн")]] as const;

type EmailAction = (prev: ActionResult | null, f: FormData) => Promise<ActionResult>;

export function InviteForm({ action, emailAction, emailEnabled = false }: { action: Action; emailAction?: EmailAction; emailEnabled?: boolean }) { const t = useT();
  const [state, formAction, pending] = useActionState<ActionResult<{ link: string }> | null, FormData>(action, null);
  const [mail, mailAction, mailPending] = useActionState<ActionResult | null, FormData>(emailAction ?? (async () => ({ ok: false, error: "" })), null);
  const [copied, setCopied] = useState(false);
  const [prefill, setPrefill] = useState("");
  const link = state?.ok ? state.data?.link : undefined;
  async function copy() {
    if (!link) return;
    try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { document.getElementById("invite-link")?.focus(); (document.getElementById("invite-link") as HTMLInputElement | null)?.select(); }
  }
  return (
    <div>
      <form action={formAction} className="grid gap-3 sm:grid-cols-[1fr_10rem_auto] sm:items-end" onSubmit={(e) => { setCopied(false); setPrefill(String(new FormData(e.currentTarget).get("email") ?? "")); }}>
        <div>
          <label className="label" htmlFor="inv-email">{t("E-mail (міндетті емес)")}</label>
          <input id="inv-email" name="email" type="email" maxLength={160} className="input" placeholder="mugalim@mektep.kz" autoComplete="off" />
        </div>
        <div>
          <label className="label" htmlFor="inv-ttl">{t("Жарамдылық мерзімі")}</label>
          <select id="inv-ttl" name="ttl" defaultValue="168" className="input">
            {TTL(t).map(([h, l]) => <option key={h} value={h}>{l}</option>)}
          </select>
        </div>
        <button type="submit" disabled={pending} className="btn-primary">{pending ? t("Күтіңіз...") : t("Шақыру сілтемесін жасау")}</button>
      </form>
      <p className="hint">{t("E-mail көрсетілсе, сілтемені тек сол мекенжайдағы адам қабылдай алады.")}</p>
      {state && !state.ok && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">{state.error}</p>}
      {link && (
        <div role="status" className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950">
          <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">{t("Шақыру сілтемесі дайын")}</p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input id="invite-link" data-testid="invite-link" readOnly value={link} className="input font-mono text-xs" onFocus={(e) => e.currentTarget.select()} aria-label={t("Шақыру сілтемесі")} />
            <button type="button" onClick={copy} className="btn-secondary shrink-0">{copied ? t("Көшірілді") : t("Көшіру")}</button>
          </div>
          {emailAction && (
            <form action={mailAction} className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end" key={link}>
              <input type="hidden" name="link" value={link} />
              <div className="flex-1">
                <label className="label" htmlFor="inv-send-email">{t("Хатты жіберу мекенжайы")}</label>
                <input id="inv-send-email" name="email" type="email" required maxLength={160} defaultValue={prefill} className="input" placeholder="mugalim@mektep.kz" autoComplete="off" disabled={!emailEnabled} />
              </div>
              <button type="submit" disabled={mailPending || !emailEnabled} className="btn-secondary shrink-0" data-testid="invite-send-email">{mailPending ? t("Күтіңіз...") : t("E-mail-ге жіберу")}</button>
            </form>
          )}
          {emailAction && !emailEnabled && <p className="mt-2 text-xs text-ink-muted">{t("E-mail жіберу бұл ортада қосылмаған: сілтемені көшіріп, өзіңіз жіберіңіз.")}</p>}
          {mail && mail.ok && <p role="status" data-testid="invite-email-ok" className="mt-2 text-sm font-medium text-emerald-900 dark:text-emerald-100">{mail.message}</p>}
          {mail && !mail.ok && mail.error && <p role="alert" data-testid="invite-email-error" className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">{mail.error}</p>}
          <p className="mt-2 text-xs text-emerald-900 dark:text-emerald-100">
            {t("Назар аударыңыз: сілтеме тек қазір көрсетіледі. Қауіпсіздік үшін дерекқорда тек хэш сақталады, сондықтан бетті жаңартсаңыз немесе жапсаңыз сілтемені қайта көру мүмкін емес. Жоғалтсаңыз, ескі шақырудан бас тартып, жаңасын жасаңыз.")}
          </p>
        </div>
      )}
    </div>
  );
}
