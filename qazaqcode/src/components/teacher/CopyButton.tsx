"use client";
import { useState } from "react";
import { useT } from "@/lib/i18n/client";

/** Мәтінді алмасу буферіне көшіру (клиент). Қолжетімсіз болса, мәтінді белгілеп қояды. */
export function CopyButton({ text, label, className = "btn-secondary", testId }: { text: string; label?: string; className?: string; testId?: string }) { const t = useT();
  const [state, setState] = useState<"idle" | "ok" | "err">("idle");
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setState("ok");
    } catch {
      setState("err");
    }
    setTimeout(() => setState("idle"), 2500);
  }
  return (
    <button type="button" onClick={copy} className={className} data-testid={testId}>
      {state === "ok" ? t("Көшірілді") : state === "err" ? t("Көшіру мүмкін болмады") : label ?? t("Көшіру")}
      <span className="sr-only" role="status" aria-live="polite">{state === "ok" ? t("Алмасу буферіне көшірілді") : ""}</span>
    </button>
  );
}
