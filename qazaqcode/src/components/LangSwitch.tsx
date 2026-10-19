import { setLangAction } from "@/lib/i18n/actions";
import { getLocale, I18N_BETA } from "@/lib/i18n";

/** «Қаз | Рус» тіл ауыстырғышы (server action: cookie + профиль). */
export async function LangSwitch() {
  const cur = await getLocale();
  const btn = (l: "kk" | "ru", label: string) => (
    <button type="submit" name="lang" value={l} lang={l} aria-pressed={cur === l} aria-label={l === "kk" ? "Қазақша" : "Русский"}
      className={`rounded px-2 py-1 text-xs font-semibold ${cur === l ? "bg-brand text-brand-ink" : "text-ink-muted hover:bg-brand-soft"}`}>{label}</button>
  );
  return (
    <form action={setLangAction} className="flex items-center gap-0.5 rounded-lg border border-line p-0.5" data-testid="lang-switch">
      {btn("kk", "Қаз")}{btn("ru", "Рус")}
      {I18N_BETA && <span className="px-1 text-[10px] font-semibold uppercase text-ink-muted" title={cur === "ru" ? "Бета-версия перевода" : "Орыс тілі бета нұсқада"}>{cur === "ru" ? "бета" : "бета"}</span>}
    </form>
  );
}
