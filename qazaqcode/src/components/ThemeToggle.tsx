"use client";
import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n/client";

export function ThemeToggle() { const t = useT();
  const [dark, setDark] = useState(false);
  useEffect(() => { setDark(document.documentElement.classList.contains("dark")); }, []);
  return (
    <button type="button" className="btn-ghost px-2" aria-label={dark ? t("Күндізгі режим") : t("Түнгі режим")} title={dark ? t("Күндізгі режим") : t("Түнгі режим")}
      onClick={() => { const n = !dark; setDark(n); document.documentElement.classList.toggle("dark", n); try { localStorage.setItem("qc:theme", n ? "dark" : "light"); } catch {} }}>
      {dark ? "☀" : "☾"}
    </button>
  );
}
export const THEME_INIT = `try{var t=localStorage.getItem("qc:theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`;
