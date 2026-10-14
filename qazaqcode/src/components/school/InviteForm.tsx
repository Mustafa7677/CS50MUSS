"use client";
import { useActionState, useState } from "react";
import type { ActionResult } from "@/lib/errors";

type Action = (prev: ActionResult<{ link: string }> | null, f: FormData) => Promise<ActionResult<{ link: string }>>;

const TTL = [[24, "1 күн"], [72, "3 күн"], [168, "7 күн"], [336, "14 күн"], [720, "30 күн"]] as const;

export function InviteForm({ action }: { action: Action }) {
  const [state, formAction, pending] = useActionState<ActionResult<{ link: string }> | null, FormData>(action, null);
  const [copied, setCopied] = useState(false);
  const link = state?.ok ? state.data?.link : undefined;
  async function copy() {
    if (!link) return;
    try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { document.getElementById("invite-link")?.focus(); (document.getElementById("invite-link") as HTMLInputElement | null)?.select(); }
  }
  return (
    <div>
      <form action={formAction} className="grid gap-3 sm:grid-cols-[1fr_10rem_auto] sm:items-end" onSubmit={() => setCopied(false)}>
        <div>
          <label className="label" htmlFor="inv-email">E-mail (міндетті емес)</label>
          <input id="inv-email" name="email" type="email" maxLength={160} className="input" placeholder="mugalim@mektep.kz" autoComplete="off" />
        </div>
        <div>
          <label className="label" htmlFor="inv-ttl">Жарамдылық мерзімі</label>
          <select id="inv-ttl" name="ttl" defaultValue="168" className="input">
            {TTL.map(([h, l]) => <option key={h} value={h}>{l}</option>)}
          </select>
        </div>
        <button type="submit" disabled={pending} className="btn-primary">{pending ? "Күтіңіз..." : "Шақыру сілтемесін жасау"}</button>
      </form>
      <p className="hint">E-mail көрсетілсе, сілтемені тек сол мекенжайдағы адам қабылдай алады.</p>
      {state && !state.ok && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">{state.error}</p>}
      {link && (
        <div role="status" className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950">
          <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">Шақыру сілтемесі дайын</p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input id="invite-link" data-testid="invite-link" readOnly value={link} className="input font-mono text-xs" onFocus={(e) => e.currentTarget.select()} aria-label="Шақыру сілтемесі" />
            <button type="button" onClick={copy} className="btn-secondary shrink-0">{copied ? "Көшірілді" : "Көшіру"}</button>
          </div>
          <p className="mt-2 text-xs text-emerald-900 dark:text-emerald-100">
            Назар аударыңыз: сілтеме тек қазір көрсетіледі. Қауіпсіздік үшін дерекқорда тек хэш сақталады, сондықтан бетті жаңартсаңыз немесе жапсаңыз сілтемені қайта көру мүмкін емес.
            Жоғалтсаңыз, ескі шақырудан бас тартып, жаңасын жасаңыз.
          </p>
        </div>
      )}
    </div>
  );
}
