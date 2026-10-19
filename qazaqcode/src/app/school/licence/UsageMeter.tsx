
import { getT } from "@/lib/i18n";/** Лимит қолданылуы: 80%-дан сары ескерту, 100%-да қызыл. Түс қана емес, мәтін де айтады. */
export async function UsageMeter({ id, title, used, max }: { id: string; title: string; used: number; max: number }) { const t = await getT();
  const pct = max > 0 ? Math.round((used / max) * 100) : used > 0 ? 100 : 0;
  const level = pct >= 100 ? "full" : pct >= 80 ? "near" : "ok";
  const bar = level === "full" ? "bg-red-600" : level === "near" ? "bg-amber-500" : "bg-brand";
  return (
    <div className="card p-5" data-testid={`usage-${id}`} data-level={level}>
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm"><strong className="text-xl" data-testid={`usage-${id}-used`}>{used}</strong> / <span data-testid={`usage-${id}-max`}>{max}</span></p>
      </div>
      <div role="progressbar" aria-valuenow={Math.min(pct, 100)} aria-valuemin={0} aria-valuemax={100} aria-label={t("{title}: лимиттің {pct}%-ы қолданылған", { title, pct })}
        className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-surface-2">
        <div className={`h-full rounded-full ${bar}`} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
      <p className="mt-2 text-xs text-ink-muted">{pct}{t("% қолданылған · бос орын:")}{" "}{Math.max(0, max - used)}</p>
      {level === "near" && <p role="alert" data-testid={`usage-${id}-warn`} className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">{t("Лимитке жақындады ({pct}%). Жаңа қолданушылар үшін орын азайды: лимитті көтеру үшін платформа әкімшісіне хабарласыңыз.", { pct })}</p>}
      {level === "full" && <p role="alert" data-testid={`usage-${id}-warn`} className="mt-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100">{t("Лимит толды (100%). Жаңа {v} мүмкін емес. Лимитті көтеру үшін платформа әкімшісіне хабарласыңыз.", { v: id === "students" ? t("оқушыларды қосу") : t("мұғалімдерді шақыру") })}</p>}
    </div>
  );
}
