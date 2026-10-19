"use client";
import { useActionState, useState } from "react";
import type { ActionResult } from "@/lib/errors";
import { toast } from "../Toaster";
import { useT } from "@/lib/i18n/client";

type Action = (prev: ActionResult<{ link: string }> | null, f: FormData) => Promise<ActionResult<{ link: string }>>;

/** Нәтижесінде бір реттік сілтеме қайтаратын пішін: сілтеме көрсетіледі, көшіру батырмасы бар. */
export function LinkActionForm({ action, children, submitLabel, className = "" }: { action: Action; children: React.ReactNode; submitLabel: string; className?: string }) { const t = useT();
  const [state, formAction, pending] = useActionState(action, null);
  const [copied, setCopied] = useState(false);
  const link = state?.ok ? state.data?.link : undefined;
  return (
    <form action={formAction} className={className}>
      {children}
      {state && !state.ok && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">{t(state.error)}</p>}
      {link && (
        <div className="mt-3 rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm dark:border-emerald-800 dark:bg-emerald-950" data-testid="invite-link-box">
          <p className="font-medium">{state?.ok ? state.message : ""}</p>
          <div className="mt-2 flex gap-2">
            <input readOnly value={link} aria-label={t("Шақыру сілтемесі")} className="input font-mono text-xs" data-testid="invite-link" onFocus={(e) => e.currentTarget.select()} />
            <button type="button" className="btn-secondary shrink-0" onClick={async () => { try { await navigator.clipboard.writeText(link); setCopied(true); toast(t("Сілтеме көшірілді")); setTimeout(() => setCopied(false), 2000); } catch { toast(t("Көшіру мүмкін болмады: сілтемені қолмен белгілеңіз"), "err"); } }}>
              {copied ? t("Көшірілді ✓") : t("Көшіру")}
            </button>
          </div>
        </div>
      )}
      <div className="mt-4"><button type="submit" disabled={pending} className="btn-primary">{pending ? t("Күтіңіз...") : submitLabel}</button></div>
    </form>
  );
}
