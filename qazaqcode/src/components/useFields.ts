"use client";
import { useState } from "react";

/**
 * Басқарылатын (controlled) өрістер: React 19 server action аяқталған соң форманы тазалайды, ал қате болғанда
 * пайдаланушы енгізгенін жоғалтпауы тиіс. `f("name")` -> {name, value, onChange} (input/select/textarea үшін).
 */
export function useFields<T extends Record<string, string>>(init: T) {
  const [v, setV] = useState<T>(init);
  const f = (k: keyof T & string) => ({
    name: k, value: v[k] ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setV((p) => ({ ...p, [k]: e.target.value })),
  });
  return { v, f, set: setV };
}
