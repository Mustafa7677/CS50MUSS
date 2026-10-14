"use client";
import { useEffect, useId, useRef, useTransition } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Қауіпті әрекет алдында растау диалогы. `action` - server action, `fields` - жасырын өрістер.
 * Диалог әрекет аяқталғанда (не бет ауысқанда) жабылады: жіберу кезінде мезгілсіз жабу форманы үзіп алмайды.
 */
export function ConfirmButton({
  action, fields, label, title, message, confirmLabel = "Иә, орындау", className = "btn-danger", danger = true,
}: {
  action: (formData: FormData) => void | Promise<void>; fields?: Record<string, string>; label: string; title: string; message: string;
  confirmLabel?: string; className?: string; danger?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const tid = useId();
  const [pending, start] = useTransition();
  const path = usePathname();
  const search = useSearchParams().toString();
  // бет (URL) ауысқанда, мысалы әрекет redirect жасаса, диалог жабылады
  useEffect(() => { if (ref.current?.open) ref.current.close(); }, [path, search]);
  return (
    <>
      <button type="button" className={className} onClick={() => ref.current?.showModal()}>{label}</button>
      <dialog ref={ref} className="w-[min(92vw,26rem)] rounded-xl border border-line bg-surface p-0 text-ink shadow-xl backdrop:bg-black/40" aria-labelledby={tid}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (pending) return;
            const fd = new FormData(e.currentTarget);
            start(async () => { await action(fd); ref.current?.close(); });
          }}
          className="p-5"
        >
          {Object.entries(fields ?? {}).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
          <h2 id={tid} className="text-lg font-bold">{title}</h2>
          <p className="mt-2 text-sm text-ink-muted">{message}</p>
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => ref.current?.close()}>Бас тарту</button>
            <button type="submit" disabled={pending} className={danger ? "btn-danger" : "btn-primary"}>{pending ? "Күтіңіз..." : confirmLabel}</button>
          </div>
        </form>
      </dialog>
    </>
  );
}
