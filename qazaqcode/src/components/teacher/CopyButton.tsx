"use client";
import { useState } from "react";

/** Мәтінді алмасу буферіне көшіру (клиент). Қолжетімсіз болса, мәтінді белгілеп қояды. */
export function CopyButton({ text, label = "Көшіру", className = "btn-secondary", testId }: { text: string; label?: string; className?: string; testId?: string }) {
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
      {state === "ok" ? "Көшірілді" : state === "err" ? "Көшіру мүмкін болмады" : label}
      <span className="sr-only" role="status" aria-live="polite">{state === "ok" ? "Алмасу буферіне көшірілді" : ""}</span>
    </button>
  );
}
