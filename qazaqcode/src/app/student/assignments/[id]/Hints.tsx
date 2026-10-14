"use client";
import { useState } from "react";

/** Кеңестер: оқушы өзі қалағанда ғана ашады. */
export function Hints({ hints }: { hints: string[] }) {
  const [shown, setShown] = useState(0);
  if (hints.length === 0) return null;
  return (
    <div>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">Кеңестер</h2>
      <ol className="mt-2 space-y-2">
        {hints.slice(0, shown).map((h, i) => (
          <li key={i} className="rounded-lg bg-brand-soft px-3 py-2 text-sm"><span className="font-semibold">Кеңес {i + 1}:</span> {h}</li>
        ))}
      </ol>
      {shown < hints.length && (
        <button type="button" className="btn-secondary mt-2" onClick={() => setShown((n) => n + 1)}>
          {shown === 0 ? "Кеңесті көрсету" : "Келесі кеңесті көрсету"} ({shown}/{hints.length})
        </button>
      )}
    </div>
  );
}
