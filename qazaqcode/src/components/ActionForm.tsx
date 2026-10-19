"use client";
import { useActionState, useEffect, useRef } from "react";
import { toast } from "./Toaster";
import type { ActionResult } from "@/lib/errors";
import { useT } from "@/lib/i18n/client";

type Action = (prev: ActionResult | null, formData: FormData) => Promise<ActionResult>;

/**
 * Серверлік әрекет (server action) пішіні: жүктелу күйі, қате/сәттілік хабары (қазақша), сәтті болса тазалау.
 * `reset` - сәтті болғанда пішінді тазалау; `successToast` - хабарландыру көрсету.
 */
export function ActionForm({
  action, children, submitLabel, className = "", reset = false, successToast = true, submitClassName = "btn-primary", footer,
}: {
  action: Action; children: React.ReactNode; submitLabel?: string; className?: string; reset?: boolean; successToast?: boolean;
  submitClassName?: string; footer?: React.ReactNode;
}) { const t = useT();
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(action, null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) {
      if (reset) ref.current?.reset();
      if (successToast && state.message) toast(t(state.message), "ok");
    }
  }, [state, reset, successToast, t]);
  return (
    <form ref={ref} action={formAction} className={className} noValidate={false}>
      {children}
      {state && !state.ok && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">{t(state.error)}</p>}
      {state?.ok && state.message && <p role="status" className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">{t(state.message)}</p>}
      <div className="mt-4 flex items-center gap-3">
        <button type="submit" disabled={pending} className={submitClassName}>{pending ? t("Күтіңіз...") : submitLabel ?? t("Сақтау")}</button>
        {footer}
      </div>
    </form>
  );
}
