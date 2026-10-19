import { fmtDate } from "@/lib/format";
import { getT } from "@/lib/i18n";

export type DayPoint = { day: string; submissions: number; active_students: number };
const short = (d: string) => `${d.slice(8, 10)}.${d.slice(5, 7)}`;

/**
 * Белсенділік диаграммасы: таза CSS бағандар (сыртқы кітапхана жоқ), түстер тек токендер.
 * Көрмейтін оқырмандар үшін <div class="sr-only"> ішінде кесте.
 */
export async function ActivityBars({ data, title: titleProp }: { data: DayPoint[]; title?: string }) { const t = await getT();
  const title = titleProp ?? t("Белсенділік");
  const max = Math.max(1, ...data.map((d) => Math.max(d.submissions, d.active_students)));
  const total = data.reduce((a, d) => a + d.submissions, 0);
  const mid = Math.floor(data.length / 2);
  return (
    <figure className="m-0" data-testid="activity-bars">
      <div role="img" aria-label={t("{title}: соңғы {length} күнде барлығы {total} жіберілген жұмыс. Толық деректер кестеде.", { title, length: data.length, total })}>
        <div className="flex h-44 items-end gap-[2px] border-b border-line sm:gap-1" aria-hidden>
          {data.map((d) => (
            <div key={d.day} className="flex h-full min-w-0 flex-1 items-end justify-center gap-px" title={t("{short}: жұмыс {submissions}, белсенді оқушы {active_students}", { short: short(d.day), submissions: d.submissions, active_students: d.active_students })}>
              <div className="w-1/2 rounded-t-sm bg-brand" style={{ height: `${(d.submissions / max) * 100}%`, minHeight: d.submissions ? 2 : 0 }} />
              <div className="w-1/2 rounded-t-sm bg-ink-muted opacity-60" style={{ height: `${(d.active_students / max) * 100}%`, minHeight: d.active_students ? 2 : 0 }} />
            </div>
          ))}
        </div>
        <div className="mt-1 flex justify-between text-xs text-ink-muted" aria-hidden>
          <span>{data[0] ? short(data[0].day) : ""}</span><span>{data[mid] ? short(data[mid].day) : ""}</span><span>{data.length ? short(data[data.length - 1].day) : ""}</span>
        </div>
      </div>
      <figcaption className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
        <span><span aria-hidden className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-brand align-middle" />{t("Жіберілген жұмыс")}</span>
        <span><span aria-hidden className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-ink-muted align-middle opacity-60" />{t("Белсенді оқушы")}</span>
        <span>{t("Ең биік мән:")}{" "}{max}</span>
      </figcaption>
      <div className="sr-only"><table>
        <caption>{title}{t(": күн сайынғы деректер")}</caption>
        <thead><tr><th scope="col">{t("Күні")}</th><th scope="col">{t("Жіберілген жұмыс")}</th><th scope="col">{t("Белсенді оқушы")}</th></tr></thead>
        <tbody>{data.map((d) => <tr key={d.day}><th scope="row">{fmtDate(d.day, false, t.locale)}</th><td>{d.submissions}</td><td>{d.active_students}</td></tr>)}</tbody>
      </table></div>
    </figure>
  );
}
