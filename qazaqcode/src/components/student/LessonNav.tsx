import Link from "next/link";
import { getT } from "@/lib/i18n";

export type NavModule = { id: string; title: string; lessons: { id: string; title: string; done: boolean }[] };

/** Сабақтар тізімі: модульдер бойынша, аяқталғаны белгіленген. */
export async function LessonNav({ courseId, modules, currentId }: { courseId: string; modules: NavModule[]; currentId: string }) { const t = await getT();
  return (
    <nav aria-label={t("Сабақтар тізімі")} className="space-y-4">
      {modules.map((m) => (
        <div key={m.id}>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-muted">{m.title}</p>
          {m.lessons.length === 0 ? <p className="text-sm text-ink-muted">{t("Сабақ жоқ")}</p> : (
            <ul className="space-y-1">
              {m.lessons.map((l) => (
                <li key={l.id}>
                  <Link href={`/student/courses/${courseId}?lesson=${l.id}`} aria-current={l.id === currentId ? "page" : undefined}
                    className={`flex items-start gap-2 rounded-lg px-2 py-1.5 text-sm no-underline hover:bg-brand-soft ${l.id === currentId ? "bg-brand-soft font-semibold text-ink" : "text-ink"}`}>
                    <span aria-hidden className={l.done ? "text-emerald-600" : "text-ink-muted"}>{l.done ? "✓" : "○"}</span>
                    <span className="min-w-0 break-words">{l.title}</span>
                    {l.done && <span className="sr-only">{t("(аяқталған)")}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </nav>
  );
}
