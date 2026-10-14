import type { Config } from "tailwindcss";

// Түстер CSS айнымалылары арқылы: әр ұйым өз брендін (white-label) дерекқордан алады.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "var(--brand)", ink: "var(--brand-ink)", soft: "var(--brand-soft)" },
        accent: { DEFAULT: "var(--accent)" },
        surface: { DEFAULT: "var(--surface)", 2: "var(--surface-2)" },
        line: "var(--line)",
        ink: { DEFAULT: "var(--ink)", muted: "var(--ink-muted)" },
      },
      fontFamily: { sans: ["Inter", "system-ui", "Segoe UI", "Roboto", "sans-serif"], mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"] },
      borderRadius: { xl: "0.9rem" },
      boxShadow: { card: "0 1px 2px rgb(0 0 0 / .05), 0 8px 24px -12px rgb(15 23 42 / .15)" },
    },
  },
  plugins: [],
};
export default config;
