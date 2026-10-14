"use client";
import { useEffect, useState } from "react";

type T = { id: number; text: string; kind: "ok" | "err" };
const EVENT = "qc:toast";

/** Кез келген клиент кодынан: toast("Сақталды", "ok") */
export function toast(text: string, kind: "ok" | "err" = "ok") {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(EVENT, { detail: { text, kind } }));
}

export function Toaster() {
  const [items, setItems] = useState<T[]>([]);
  useEffect(() => {
    let n = 0;
    const on = (e: Event) => {
      const d = (e as CustomEvent).detail as { text: string; kind: "ok" | "err" };
      const id = ++n;
      setItems((x) => [...x, { id, ...d }]);
      setTimeout(() => setItems((x) => x.filter((i) => i.id !== id)), 4500);
    };
    window.addEventListener(EVENT, on);
    return () => window.removeEventListener(EVENT, on);
  }, []);
  return (
    <div aria-live="polite" className="pointer-events-none fixed bottom-4 right-4 z-50 flex max-w-sm flex-col gap-2">
      {items.map((i) => (
        <div key={i.id} role="status" className={`pointer-events-auto rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${i.kind === "ok" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}>{i.text}</div>
      ))}
    </div>
  );
}
